import mongoose from "mongoose";

const insumoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  categoria: { type: String, required: true },
  stock: { type: Number, default: 0 },
  stockMinimo: { type: Number, default: 5 },
  unidadMedida: { type: String },
  proveedor: { type: String },
  precioUnitario: { type: Number, default: 0 }, // Precio por unidad del insumo
  estado: {
    type: String,
    enum: ["disponible", "bajo_stock", "sin_stock"],
    default: "disponible",
  },
  ultimaActualizacion: { type: Date, default: Date.now },
});

const Insumo = mongoose.model("Insumo", insumoSchema);

export default Insumo;