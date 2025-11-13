import mongoose from "mongoose";

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
  // Definición correcta de la referencia a 'Pedido'
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
      // Poblar ambos campos referenciados
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
      // Poblar ambos campos referenciados
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
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.prioridad) query.prioridad = filtros.prioridad;
      if (filtros.area) query.area = filtros.area;
      if (filtros.empleadoAsignado) query.empleadoAsignado = filtros.empleadoAsignado;
      // Añadir filtro por pedidoAsociado
      if (filtros.pedidoAsociado) query.pedidoAsociado = filtros.pedidoAsociado;

      if (filtros.fechaDesde || filtros.fechaHasta) {
        query.fechaCreacion = {};
        if (filtros.fechaDesde) query.fechaCreacion.$gte = new Date(filtros.fechaDesde);
        if (filtros.fechaHasta) query.fechaCreacion.$lte = new Date(filtros.fechaHasta);
      }

      // Poblar ambos campos referenciados en los resultados filtrados
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
        // Asegurar que se guarda el pedido asociado (o null si viene vacío)
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
        "empleadoAsignado", "pedidoAsociado", "observaciones", // Incluir pedidoAsociado
      ];

      const actualizacion = {};
      for (const campo of camposPermitidos) {
        if (datos[campo] !== undefined) {
          // Tratar ambos campos de referencia igual (asignar null si vienen vacíos)
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