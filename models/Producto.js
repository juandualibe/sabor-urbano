import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  ingredientes: [{
    insumo: { type: mongoose.Schema.Types.ObjectId, ref: 'Insumo', required: true },
    nombreInsumo: { type: String },
    cantidad: { type: Number, required: true },
    unidadMedida: { type: String },
    precioUnitario: { type: Number, default: 0 }
  }],
  costoTotal: { type: Number, default: 0 }, // Calculado automáticamente
  margenGanancia: { type: Number, default: 0 }, // Porcentaje de ganancia
  precioSugerido: { type: Number, default: 0 }, // Calculado: costo + margen
  precioVenta: { type: Number, required: true }, // Precio final (editable)
  precio: { type: Number }, // Mantener compatibilidad con código anterior
  stock: { type: Boolean, default: true },
  stockDisponible: { type: Number, default: 0 }, // Calculado según insumos
  categoria: { type: String },
  unidadMedida: { type: String },
  ultimaActualizacion: { type: Date, default: Date.now }
});

// Middleware para actualizar fecha automáticamente al guardar
productoSchema.pre('save', function(next) {
  this.ultimaActualizacion = new Date();
  next();
});

const Producto = mongoose.model("Producto", productoSchema);

export default Producto;