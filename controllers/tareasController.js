// SOLUCIÓN DEFINITIVA (1/3): Importamos la CLASE TareaModel, no el modelo Mongoose directamente.
import TareaModel from "../models/Tarea.js";

// SOLUCIÓN DEFINITIVA (2/3): Creamos una instancia de TareaModel para usar sus métodos.
// Esto centraliza la lógica de la base de datos en el modelo, como la arquitectura pretende.
const tareaModel = new TareaModel();

class TareasController {
  // Obtener todas las tareas (con filtros opcionales)
  async getAll(req, res) {
    try {
      const filtros = { ...req.query };
      // Usamos el método de la instancia de TareaModel
      const tareas = await tareaModel.filtrar(filtros);
      res.json({ success: true, total: tareas.length, data: tareas });
    } catch (error) {
      console.error("❌ Error en TareasController.getAll:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener tareas",
        error: error.message,
      });
    }
  }

  // Obtener una tarea por ID
  async getById(req, res) {
    try {
      const tarea = await tareaModel.getById(req.params.id);
      if (!tarea)
        return res
          .status(404)
          .json({ success: false, message: "Tarea no encontrada" });
      res.json({ success: true, data: tarea });
    } catch (error) {
      console.error("❌ Error en TareasController.getById:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la tarea",
        error: error.message,
      });
    }
  }

  // Obtener tareas por área
  async getByArea(req, res) {
    try {
      const tareas = await tareaModel.filtrar({ area: req.params.area });
      res.json({ success: true, total: tareas.length, data: tareas });
    } catch (error) {
      console.error("❌ Error en TareasController.getByArea:", error);
      res.status(500).json({
        success: false,
        message: "Error al filtrar por área",
        error: error.message,
      });
    }
  }

  // Crear nueva tarea
  async create(req, res) {
    try {
      const guardada = await tareaModel.create(req.body);
      res
        .status(201)
        .json({ success: true, message: "Tarea creada", data: guardada });
    } catch (error) {
      // Este log te mostrará el error de validación de Mongoose en la consola si ocurre.
      console.error("❌ Error detallado al crear tarea:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear tarea",
        error: error.message,
      });
    }
  }

  // Actualizar una tarea existente
  async update(req, res) {
    try {
      const actualizada = await tareaModel.update(req.params.id, req.body);
      if (!actualizada)
        return res
          .status(404)
          .json({ success: false, message: "Tarea no encontrada" });
      res.json({
        success: true,
        message: "Tarea actualizada",
        data: actualizada,
      });
    } catch (error) {
      console.error("❌ Error detallado al actualizar tarea:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar tarea",
        error: error.message,
      });
    }
  }

  // Iniciar tarea (cambia estado a "en_proceso")
  async iniciar(req, res) {
    try {
      const tarea = await tareaModel.iniciar(req.params.id);
      if (!tarea)
        return res
          .status(404)
          .json({ success: false, message: "Tarea no encontrada" });
      res.json({ success: true, message: "Tarea iniciada", data: tarea });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al iniciar tarea",
        error: error.message,
      });
    }
  }

  // Finalizar tarea (cambia estado a "finalizada")
  async finalizar(req, res) {
    try {
      const tarea = await tareaModel.finalizar(req.params.id);
      if (!tarea)
        return res
          .status(404)
          .json({ success: false, message: "Tarea no encontrada" });
      res.json({ success: true, message: "Tarea finalizada", data: tarea });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al finalizar tarea",
        error: error.message,
      });
    }
  }

  // Eliminar tarea
  async delete(req, res) {
    try {
      const eliminada = await tareaModel.delete(req.params.id);
      if (!eliminada)
        return res
          .status(404)
          .json({ success: false, message: "Tarea no encontrada" });
      res.json({ success: true, message: "Tarea eliminada", data: eliminada });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al eliminar tarea",
        error: error.message,
      });
    }
  }
}

// SOLUCIÓN DEFINITIVA (3/3): Exportamos la CLASE, no una instancia.
// Esto permite que `routes/tareas.js` pueda hacer `new TareasController()`.
export default TareasController;