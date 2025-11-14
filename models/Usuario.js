// models/Usuario.js
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
  // Campos del formulario register.pug
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  username: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    select: false // No mostrar en consultas
  },
  // (Opcional) Se podría añadir un rol de app: 'admin' o 'user'
  // appRol: { type: String, default: 'user' }

}, { timestamps: true });

// Hashear password
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Comparar password
usuarioSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    const user = await Usuario.findById(this._id).select('+password');
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    throw error;
  }
};

const Usuario = mongoose.model("Usuario", usuarioSchema);

export default Usuario;