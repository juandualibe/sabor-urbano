// models/Empleado.js
import mongoose from "mongoose";

const empleadoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  telefono: { type: String },
  rol: { type: String },
  area: { type: String },
  fechaIngreso: { type: Date, default: Date.now },
});

const Empleado = mongoose.model("Empleado", empleadoSchema);

export default Empleado;