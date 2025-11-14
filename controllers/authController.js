import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
// (Ya no importamos Empleado aquí)

// --- REGISTRO DE UN NUEVO USUARIO ---
export const register = async (req, res) => {
  // Datos del formulario register.pug
  const { nombre, apellido, email, username, password } = req.body;

  try {
    // 1. Validar que el username o email no existan
    const existingUser = await Usuario.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      let message = 'El email ya está registrado.';
      if (existingUser.username === username.toLowerCase()) {
        message = 'El nombre de usuario ya está en uso.';
      }
      return res.status(400).json({ success: false, message });
    }

    // 2. Crear SÓLO el Usuario
    const nuevoUsuario = new Usuario({
      nombre,
      apellido,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password, // El modelo lo hashea
    });
    await nuevoUsuario.save();

    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente.' 
    });

  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
};

// --- LOGIN Y CREACIÓN DE TOKEN ---
export const login = async (req, res) => {
  // req.user es el 'Usuario'
  const usuario = req.user;

  // 1. Crear el Payload
  const payload = {
    sub: usuario._id, // ID del Usuario
    username: usuario.username,
    nombre: usuario.nombre
    // (Podríamos añadir un rol de app aquí si lo tuviéramos)
  };

  // 2. Firmar el Token
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // 3. Enviar el token al cliente
  res.json({
    success: true,
    token: 'Bearer ' + token,
    user: {
      id: usuario._id,
      username: usuario.username,
      nombre: usuario.nombre
    }
  });
};