// controllers/empleadosController.js
import Empleado from "../models/Empleado.js";

// Controladores para API y vistas

// Obtener todos los empleados
export const getAllEmpleados = async (req, res) => {
  try {
    const empleados = await Empleado.find().sort({ fechaIngreso: -1 });
    res.json({ success: true, data: empleados });
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    res.status(500).json({ success: false, message: "Error al obtener empleados" });
  }
};

// Obtener empleado por ID
export const getEmpleadoById = async (req, res) => {
  try {
    const empleado = await Empleado.findById(req.params.id);
    if (!empleado)
      return res.status(404).json({ success: false, message: "Empleado no encontrado" });

    res.json({ success: true, data: empleado });
  } catch (error) {
    console.error("Error al obtener empleado:", error);
    res.status(500).json({ success: false, message: "Error al obtener empleado" });
  }
};

// Crear empleado
export const createEmpleado = async (req, res) => {
  try {
    const nuevoEmpleado = await Empleado.create(req.body);
    res.status(201).json({ success: true, data: nuevoEmpleado });
  } catch (error) {
    console.error("Error al crear empleado:", error);
    res.status(500).json({ success: false, message: "Error al crear empleado" });
  }
};

// Actualizar empleado
export const updateEmpleado = async (req, res) => {
  try {
    const empleado = await Empleado.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!empleado)
      return res.status(404).json({ success: false, message: "Empleado no encontrado" });

    res.json({ success: true, data: empleado });
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    res.status(500).json({ success: false, message: "Error al actualizar empleado" });
  }
};

// Eliminar empleado
export const deleteEmpleado = async (req, res) => {
  try {
    const empleado = await Empleado.findByIdAndDelete(req.params.id);
    if (!empleado)
      return res.status(404).json({ success: false, message: "Empleado no encontrado" });

    res.json({ success: true, message: "Empleado eliminado" });
  } catch (error) {
    console.error("Error al eliminar empleado:", error);
    res.status(500).json({ success: false, message: "Error al eliminar empleado" });
  }
};