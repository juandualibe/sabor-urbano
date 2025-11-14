import mongoose from "mongoose";
import Pedido from "./Pedido.js"; // <-- 1. Importar el modelo Pedido

const tareaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String, default: "" },
  area: { type: String, required: true },
  estado: {
    type: String,
    enum: ["pendiente", "en_proceso", "finalizada"],
    default: "pendiente",
  },
  prioridad: {
    type: String,
    enum: ["baja", "media", "alta"],
    default: "media",
  },
  empleadoAsignado: { type: mongoose.Schema.Types.ObjectId, ref: 'Empleado', default: null },
  pedidoAsociado: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', default: null },
  observaciones: { type: String, default: "" },
  fechaCreacion: { type: Date, default: Date.now },
  fechaInicio: { type: Date, default: null },
  fechaFinalizacion: { type: Date, default: null },
});

const Tarea = mongoose.model("Tarea", tareaSchema);

export default class TareaModel {
  async getAll() {
    try {
      return await Tarea.find()
                      .populate('empleadoAsignado')
                      .populate('pedidoAsociado')
                      .lean();
    } catch (error) {
      console.error("❌ Error en TareaModel.getAll:", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      return await Tarea.findById(id)
                     .populate('empleadoAsignado')
                     .populate('pedidoAsociado')
                     .lean();
    } catch (error) {
      console.error(`❌ Error en TareaModel.getById(${id}):`, error);
      throw error;
    }
  }

  async filtrar(filtros) {
    try {
      const query = {};
      
      // --- 2. LÓGICA DE FILTROS DE PEDIDO ---
      const pedidoQuery = {};
      if (filtros.tipoPedido) {
        pedidoQuery.tipo = filtros.tipoPedido;
      }
      if (filtros.plataforma) {
        pedidoQuery.plataforma = filtros.plataforma;
      }

      // Si hay filtros de pedido, buscamos los IDs de los pedidos primero
      if (Object.keys(pedidoQuery).length > 0) {
        const pedidosCoincidentes = await Pedido.find(pedidoQuery).select('_id');
        const idsPedidos = pedidosCoincidentes.map(p => p._id);
        
        if (idsPedidos.length === 0) {
          // Si se filtró por pedido pero no se encontró ninguno, ninguna tarea coincidirá
          return []; 
        }
        
        // Añadimos la condición $in al query principal de Tareas
        query.pedidoAsociado = { $in: idsPedidos };
      }
      // --- FIN DE LÓGICA DE FILTROS DE PEDIDO ---

      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.prioridad) query.prioridad = filtros.prioridad;
      if (filtros.area) query.area = filtros.area;
      if (filtros.empleadoAsignado) query.empleadoAsignado = filtros.empleadoAsignado;
      
      // Añadir filtro por pedidoAsociado (si el usuario seleccionó uno específico)
      // Esto sobreescribirá el filtro de $in si ambos se usan, lo cual es correcto.
      if (filtros.pedidoAsociado) query.pedidoAsociado = filtros.pedidoAsociado;

      if (filtros.fechaDesde || filtros.fechaHasta) {
        query.fechaCreacion = {};
        if (filtros.fechaDesde) query.fechaCreacion.$gte = new Date(filtros.fechaDesde);
        if (filtros.fechaHasta) query.fechaCreacion.$lte = new Date(filtros.fechaHasta);
      }

      // 3. Ejecutar la búsqueda final
      return await Tarea.find(query)
                      .populate('empleadoAsignado')
                      .populate('pedidoAsociado')
                      .lean();
    } catch(error) {
      console.error("❌ Error en TareaModel.filtrar:", error);
      throw error;
    }
  }

  async create(datos) {
    try {
      const tarea = new Tarea({
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        area: datos.area,
        estado: datos.estado || "pendiente",
        prioridad: datos.prioridad || "media",
        empleadoAsignado: datos.empleadoAsignado || null,
        pedidoAsociado: datos.pedidoAsociado || null,
        observaciones: datos.observaciones || "",
      });
      const savedTarea = await tarea.save();
      return savedTarea;
    } catch(error) {
      console.error("❌ Error en TareaModel.create:", error);
      throw error;
    }
  }

  async update(id, datos) {
    try {
      const camposPermitidos = [
        "titulo", "descripcion", "area", "estado", "prioridad",
        "empleadoAsignado", "pedidoAsociado", "observaciones", 
      ];

      const actualizacion = {};
      for (const campo of camposPermitidos) {
        if (datos[campo] !== undefined) {
          if (campo === 'empleadoAsignado' || campo === 'pedidoAsociado') {
            actualizacion[campo] = datos[campo] || null;
          } else {
            actualizacion[campo] = datos[campo];
          }
        }
      }
      const updatedTarea = await Tarea.findByIdAndUpdate(id, actualizacion, { new: true, lean: true });
      return updatedTarea;
    } catch(error) {
       console.error(`❌ Error en TareaModel.update(${id}):`, error);
       throw error;
    }
  }

  async iniciar(id) {
    try {
      return await Tarea.findByIdAndUpdate(id, { estado: "en_proceso", fechaInicio: new Date() }, { new: true, lean: true });
    } catch(error) {
      console.error(`❌ Error en TareaModel.iniciar(${id}):`, error);
      throw error;
    }
  }

  async finalizar(id) {
    try {
      return await Tarea.findByIdAndUpdate(id, { estado: "finalizada", fechaFinalizacion: new Date() }, { new: true, lean: true });
    } catch (error) {
      console.error(`❌ Error en TareaModel.finalizar(${id}):`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const deleted = await Tarea.findByIdAndDelete(id).lean();
      return deleted;
    } catch(error) {
      console.error(`❌ Error en TareaModel.delete(${id}):`, error);
      throw error;
    }
  }
}