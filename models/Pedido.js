// models/Pedido.js
import mongoose from "mongoose";

// Esquema del pedido
const pedidoSchema = new mongoose.Schema({
  numeroOrden: {
    type: Number,
    unique: true,
    required: true,
  },
  cliente: {
    nombre: { type: String, trim: true },
    telefono: { type: String, trim: true },
    direccion: { type: String, trim: true },
  },
  items: [
    {
      nombre: { type: String, required: true },
      cantidad: { type: Number, required: true },
      precioUnitario: { type: Number, required: true },
      subtotal: { type: Number, required: true },
    },
  ],
  total: {
    type: Number,
    required: true,
  },
  tipo: {
    type: String,
    enum: ["presencial", "delivery"],
    required: true,
  },
  plataforma: {
    type: String,
    enum: ["rappi", "pedidosya", "propia", "local"],
    required: true,
  },
  estado: {
    type: String,
    enum: [
      "pendiente",
      "en_preparacion",
      "listo",
      "en_camino",
      "entregado",
      "finalizado",
    ],
    default: "pendiente",
  },
  tiempoEstimado: {
    type: Number, // en minutos
  },
  observaciones: {
    type: String,
    trim: true,
  },
  fechaCreacion: {
    type: Date,
    default: Date.now,
  },
});

// Middleware: antes de guardar, asigna un número de orden incremental
pedidoSchema.pre("save", async function (next) {
  if (this.isNew) {
    const ultimo = await Pedido.findOne().sort({ numeroOrden: -1 });
    this.numeroOrden = ultimo ? ultimo.numeroOrden + 1 : 1;
  }
  next();
});

const Pedido = mongoose.model("Pedido", pedidoSchema);
export default Pedido;