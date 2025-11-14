// routes/empleados.js
import express from "express";
import {
  getAllEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} from "../controllers/empleadosController.js";
import { isLoggedIn } from '../middleware/authVistas.js'; // <-- CAMBIADO

const router = express.Router();

// Aplicar el middleware de SESIÓN (isLoggedIn) a todas las rutas
router.use(isLoggedIn);

// Todas estas rutas ahora están protegidas por la Sesión
router.get("/", getAllEmpleados);
router.get("/:id", getEmpleadoById);
router.post("/", createEmpleado);
router.put("/:id", updateEmpleado);
router.delete("/:id", deleteEmpleado);

export default router;