// routes/empleados.js
import express from "express";
import {
  getAllEmpleados,
  getEmpleadoById,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado
} from "../controllers/empleadosController.js";

const router = express.Router();

router.get("/", getAllEmpleados);
router.get("/:id", getEmpleadoById);
router.post("/", createEmpleado);
router.put("/:id", updateEmpleado);
router.delete("/:id", deleteEmpleado);

export default router;