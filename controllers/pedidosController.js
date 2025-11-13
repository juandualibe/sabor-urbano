// controllers/pedidosController.js
import Pedido from "../models/Pedido.js"; // Modelo Mongoose
import Producto from "../models/Producto.js"; // Para obtener productos disponibles
import ValidationMiddleware from "../middleware/validation.js";
import mongoose from "mongoose"; // Necesario para ObjectId.isValid

class PedidosController {
  constructor() {
    this.pedidoModel = Pedido;
  }

  // --- FUNCIÓN AUXILIAR REFACTORIZADA ---
  async _procesarItems(itemsDesdeFetch) {
    console.log("[_procesarItems] Iniciando procesamiento:", itemsDesdeFetch);
    const idsProductosSeleccionados = Object.keys(itemsDesdeFetch || {});
    let itemsParaGuardar = [];
    let totalCalculadoBackend = 0;

    if (idsProductosSeleccionados.length === 0) {
        console.log("[_procesarItems] No se recibieron items.");
        // Devuelve array vacío y total 0 si no hay items (útil para update)
        return { itemsParaGuardar, totalCalculadoBackend }; 
    }

    const productosEncontrados = await Producto.find({ 
        '_id': { $in: idsProductosSeleccionados } 
    }).lean();
    console.log(`[_procesarItems] Productos encontrados en BD: ${productosEncontrados.length} de ${idsProductosSeleccionados.length} solicitados.`);

    if (productosEncontrados.length !== idsProductosSeleccionados.length) {
      const encontradosIds = productosEncontrados.map(p => p._id.toString());
      const faltantes = idsProductosSeleccionados.filter(id => !encontradosIds.includes(id));
      console.error("[_procesarItems] Error Crítico: Productos NO encontrados:", faltantes);
      // Lanzamos un error que será capturado por el método que llame (_create o _update)
      throw new Error(`Error: No se encontraron los siguientes productos: ${faltantes.join(', ')}.`);
    }

    itemsParaGuardar = productosEncontrados.map(producto => {
      const idStr = producto._id.toString();
      const cantidad = parseInt(itemsDesdeFetch[idStr]?.cantidad) || 1;
      const precioUnitario = producto.precio;

      if (typeof precioUnitario !== 'number' || isNaN(precioUnitario)) {
        const errorMsg = `Precio inválido para el producto "${producto.nombre}" (ID: ${idStr}). Precio: ${producto.precio}`;
        console.error(`[_procesarItems] ${errorMsg}`);
        throw new Error(errorMsg); // Lanzar error
      }

      const subtotal = cantidad * precioUnitario;
      totalCalculadoBackend += subtotal;

      if (!producto.nombre || isNaN(cantidad) || isNaN(subtotal)) {
        const errorMsg = `Datos inválidos para item del producto ID ${idStr}`;
         console.error(`[_procesarItems] ${errorMsg}`, {nombre: producto.nombre, cantidad, precioUnitario, subtotal});
        throw new Error(errorMsg); // Lanzar error
      }
      
      console.log(`[_procesarItems] Item procesado: ${producto.nombre} x${cantidad} ($${precioUnitario.toFixed(2)}) = $${subtotal.toFixed(2)}`);

      return {
        nombre: producto.nombre,
        cantidad: cantidad,
        precioUnitario: precioUnitario,
        subtotal: subtotal,
      };
    });

    console.log(`[_procesarItems] Procesamiento finalizado. Total: ${totalCalculadoBackend.toFixed(2)}`);
    return { itemsParaGuardar, totalCalculadoBackend };
  }
  // --- FIN FUNCIÓN AUXILIAR ---

  // Renderiza listado de pedidos (vista principal)
  async renderIndex(req, res) {
    try {
      const pedidos = await this.pedidoModel.find().sort({ numeroOrden: -1 }).lean(); 
      pedidos.forEach(p => {
        p.nombreCliente = p.cliente?.nombre || 'N/A'; 
      });
      res.render("pedidos/index", { page: "pedidos", pedidos });
    } catch (error) {
      console.error("Error al renderizar pedidos:", error);
      res.status(500).render("error", { error: "Error al cargar pedidos", code: 500 });
    }
  }

  //Renderiza formulario para nuevo pedido
  async renderNuevo(req, res) {
    try {
      const productos = await Producto.find({ stock: true }).lean(); 
      res.render("pedidos/nuevo", { page: "pedidos", productos });
    } catch (error) {
      console.error("Error al cargar formulario nuevo pedido:", error);
      res.status(500).render("error", { error: "Error al cargar formulario de pedido", code: 500 });
    }
  }

  // Crea pedido nuevo (Usa _procesarItems)
  async create(req, res) {
    console.log("[PedidosController CREATE Refactored] Inicio - Datos recibidos:", JSON.stringify(req.body, null, 2)); 
    
    try {
      const { 
        tipo, plataforma, items: itemsDesdeFetch, 
        nombreCliente, telefonoCliente, direccionCliente 
      } = req.body;

      // Validación inicial (igual que antes)
      if (!tipo || !plataforma) {
         console.error("[PedidosController CREATE Refactored] Validación Fallida: Falta tipo o plataforma.");
         return res.status(400).json({ success: false, message: 'Tipo y Plataforma son requeridos.' });
      }
      if (tipo === "delivery" && (!nombreCliente || !telefonoCliente || !direccionCliente)) {
        console.error("[PedidosController CREATE Refactored] Validación Fallida: Faltan datos de delivery.");
        return res.status(400).json({ success: false, message: 'Nombre, teléfono y dirección son requeridos para delivery.' });
      }
      if (typeof itemsDesdeFetch !== 'object' || itemsDesdeFetch === null || Object.keys(itemsDesdeFetch).length === 0) {
        console.error("[PedidosController CREATE Refactored] Validación Fallida: No se seleccionaron items o formato incorrecto.");
        return res.status(400).json({ success: false, message: 'Debe seleccionar al menos un producto.' });
      }

      // Llamada a la función refactorizada
      const { itemsParaGuardar, totalCalculadoBackend } = await this._procesarItems(itemsDesdeFetch);

      const ultimo = await this.pedidoModel.findOne().sort({ numeroOrden: -1 }).lean(); 
      const numeroOrden = ultimo ? ultimo.numeroOrden + 1 : 1;
      console.log(`[PedidosController CREATE Refactored] Asignando numeroOrden: ${numeroOrden}`);

      const datosPedido = {
         numeroOrden, 
         tipo,
         plataforma, 
         cliente: tipo === "delivery" ? { nombre: nombreCliente, telefono: telefonoCliente, direccion: direccionCliente } : undefined, 
         items: itemsParaGuardar, 
         total: totalCalculadoBackend, 
         estado: "pendiente", 
      };

      console.log("[PedidosController CREATE Refactored] Objeto final listo para .save():", JSON.stringify(datosPedido, null, 2)); 

      const nuevoPedido = new this.pedidoModel(datosPedido);
      const pedidoGuardado = await nuevoPedido.save(); 

      console.log("[PedidosController CREATE Refactored] ÉXITO - Pedido guardado:", pedidoGuardado._id);
      res.status(201).json({ success: true, data: pedidoGuardado });

    } catch (error) {
      // Captura errores de _procesarItems y de .save()
      console.error("❌ [PedidosController CREATE Refactored] Ha ocurrido un error:", error.name, error.message); 

      if (error.name === 'ValidationError') {
            console.error("❌ Detalle Validación Mongoose:", error.errors);
            const mensajesError = Object.values(error.errors).map(err => `${err.path}: ${err.message}`).join('; ');
            return res.status(400).json({ success: false, message: `Error de Validación: ${mensajesError}` });
      } else if (error instanceof Error && (error.message.startsWith('Precio inválido') || error.message.startsWith('Error: No se encontraron'))) {
           // Errores lanzados por _procesarItems
           return res.status(400).json({ success: false, message: error.message });
      }
      
      console.error("❌ Stack del Error:", error.stack); 
      res.status(500).json({ 
          success: false, 
          message: error.message || "Error interno del servidor al crear el pedido.", 
      });
    }
  }

  //Renderiza formulario de edición
  async renderEditar(req, res) {
    try {
      const pedido = await this.pedidoModel.findById(req.params.id).lean();
      if (!pedido) {
        return res.status(404).render("error", { error: "Pedido no encontrado", code: 404 });
      }
      
      const productos = await Producto.find({ stock: true }).lean(); 
      const datosCliente = pedido.cliente || {};

      // Mapear items para Pug (igual que antes)
      const itemsPedidoMap = pedido.items.reduce((map, item) => {
          const productoOriginal = productos.find(p => p.nombre === item.nombre);
          if (productoOriginal) {
              map[productoOriginal._id.toString()] = { cantidad: item.cantidad };
          } else {
              console.warn(`[renderEditar] Producto "${item.nombre}" del pedido ${pedido.numeroOrden} no encontrado en productos activos.`);
          }
          return map;
      }, {});

      res.render("pedidos/editar", { 
          page: "pedidos", 
          pedido: { ...pedido, nombreCliente: datosCliente.nombre, telefonoCliente: datosCliente.telefono, direccionCliente: datosCliente.direccion, itemsMap: itemsPedidoMap }, 
          productos 
      });
    } catch (error) {
      console.error("Error al cargar formulario de edición:", error);
      res.status(500).render("error", { error: "Error al cargar pedido para editar", code: 500 });
    }
  }

  // Actualiza pedido (Usa _procesarItems)
  async update(req, res) {
      console.log("[PedidosController UPDATE Refactored] Inicio - Datos recibidos:", JSON.stringify(req.body, null, 2)); 
      try {
          const { id } = req.params; 
           if (!mongoose.Types.ObjectId.isValid(id)) {
                console.error(`[PedidosController UPDATE Refactored] Error: ID inválido: ${id}`);
                return res.status(400).json({ success: false, message: "El ID del pedido no es válido." });
          }

          const { 
              tipo, plataforma, items: itemsDesdeFetch, 
              nombreCliente, telefonoCliente, direccionCliente, 
              estado, tiempoEstimado, observaciones 
          } = req.body;

          const pedido = await this.pedidoModel.findById(id);
          if (!pedido) {
               console.error(`[PedidosController UPDATE Refactored] Error: Pedido ${id} no encontrado.`);
              return res.status(404).json({ success: false, message: "Pedido no encontrado para actualizar" });
          }

          // Llamada a la función refactorizada para procesar items
          // Maneja el caso de itemsDesdeFetch vacío o nulo internamente
          const { itemsParaGuardar: itemsParaActualizar, totalCalculadoBackend } = await this._procesarItems(itemsDesdeFetch);

          // Actualizar campos del pedido existente (solo si se recibieron)
          if(tipo !== undefined) pedido.tipo = tipo;
          if(plataforma !== undefined) pedido.plataforma = plataforma;
          if(estado !== undefined) pedido.estado = estado;
          pedido.tiempoEstimado = tiempoEstimado !== undefined && !isNaN(parseInt(tiempoEstimado)) 
              ? parseInt(tiempoEstimado) 
              : pedido.tiempoEstimado; 
          pedido.observaciones = observaciones !== undefined ? observaciones : pedido.observaciones;
          
          // Actualizamos items y total con los datos procesados
          // Si _procesarItems devolvió array vacío, se asigna array vacío
          pedido.items = itemsParaActualizar; 
          pedido.total = totalCalculadoBackend; 

          // Actualizar cliente anidado
          if (pedido.tipo === "delivery") {
               if (!pedido.cliente) pedido.cliente = {}; 
               if(nombreCliente !== undefined) pedido.cliente.nombre = nombreCliente;
               if(telefonoCliente !== undefined) pedido.cliente.telefono = telefonoCliente; 
               if(direccionCliente !== undefined) pedido.cliente.direccion = direccionCliente; 
          } else {
               pedido.cliente = undefined; 
          }

          console.log("[PedidosController UPDATE Refactored] Datos listos para actualizar:", JSON.stringify(pedido.toObject(), null, 2)); 

          const pedidoActualizado = await pedido.save();

          console.log("[PedidosController UPDATE Refactored] ÉXITO - Pedido actualizado:", pedidoActualizado._id);
          res.json({ success: true, data: pedidoActualizado });

      } catch (error) {
           console.error("❌ [PedidosController UPDATE Refactored] Ha ocurrido un error:", error.name, error.message); 

           if (error.name === 'ValidationError') {
              console.error("❌ Detalle Validación Mongoose al Actualizar:", error.errors);
              const mensajesError = Object.values(error.errors).map(err => `${err.path}: ${err.message}`).join('; ');
               return res.status(400).json({ success: false, message: `Error de Validación al actualizar: ${mensajesError}` });
          } else if (error instanceof Error && (error.message.startsWith('Precio inválido') || error.message.startsWith('Error: No se encontraron'))) {
               // Errores de _procesarItems
               return res.status(400).json({ success: false, message: error.message });
          }
           
           console.error("❌ Stack del Error al Actualizar:", error.stack); 
           res.status(500).json({ 
               success: false, 
               message: error.message || "Error interno del servidor al actualizar el pedido.", 
          });
      }
  }

  // Elimina pedido (sin cambios, ya respondía JSON)
  async delete(req, res) {
    try {
      const { id } = req.params; 
      console.log(`[PedidosController DELETE] Intentando eliminar pedido ID: ${id}`);

       if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error(`[PedidosController DELETE] Error: ID inválido: ${id}`);
            return res.status(400).json({ success: false, message: "El ID del pedido no es válido." });
       }
       
      const eliminado = await this.pedidoModel.findByIdAndDelete(id);

      if(!eliminado){
          console.error(`[PedidosController DELETE] Error: Pedido ${id} no encontrado.`);
          return res.status(404).json({ success: false, message: "Pedido no encontrado para eliminar" });
      }

      console.log(`[PedidosController DELETE] Pedido ${id} eliminado exitosamente.`);
       res.json({ success: true, message: "Pedido eliminado correctamente", data: eliminado });

    } catch (error) {
      console.error("❌ [PedidosController DELETE] Error:", error.message, error); 
       res.status(500).json({ 
           success: false, 
           message: "Error interno del servidor al eliminar el pedido.", 
           error: error.message 
       });
    }
  }

  // --- MÉTODOS ADICIONALES PARA API REST (sin cambios) ---
  async getAll(req, res) {
    try {
      const pedidos = await this.pedidoModel.find().sort({ numeroOrden: -1 }).lean();
      res.json({ success: true, total: pedidos.length, data: pedidos });
    } catch (error) {
      console.error("Error API getAll Pedidos:", error);
      res.status(500).json({ success: false, message: "Error al obtener pedidos" });
    }
  }

  async getById(req, res) {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ success: false, message: "El ID del pedido no es válido." });
      }
      const pedido = await this.pedidoModel.findById(req.params.id).lean();
      if (!pedido) {
        return res.status(404).json({ success: false, message: "Pedido no encontrado" });
      }
      res.json({ success: true, data: pedido });
    } catch (error) {
      console.error("Error API getById Pedido:", error);
      res.status(500).json({ success: false, message: "Error al obtener el pedido" });
    }
  }
}

export default PedidosController;