import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import mongoose from 'mongoose';
import Usuario from '../models/Usuario.js'; // <-- Importar SOLO Usuario

// Guarda el ID del Usuario en la sesión
passport.serializeUser((usuario, done) => {
  done(null, usuario.id);
});

// Lee el ID de la sesión y busca al Usuario en la BD
passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await Usuario.findById(id); // Sin populate
    done(null, usuario); // req.user es el Usuario
  } catch (error) {
    done(error, null);
  }
});


// Estrategia LOCAL (Login con username/password)
passport.use(new LocalStrategy(
  {
    usernameField: 'username', 
    passwordField: 'password',
  },
  async (username, password, done) => { 
    try {
      const usuario = await Usuario.findOne({ username: username.toLowerCase() }); 

      if (!usuario) {
        return done(null, false, { message: 'Usuario no registrado.' }); 
      }

      const isMatch = await usuario.comparePassword(password);
      
      if (!isMatch) {
        return done(null, false, { message: 'Contraseña incorrecta.' });
      }

      return done(null, usuario);

    } catch (error) {
      return done(error);
    }
  }
));

// Estrategia JWT (Para la API)
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const usuario = await Usuario.findById(jwt_payload.sub); // Sin populate

    if (usuario) {
      return done(null, usuario); // req.user es el Usuario
    } else {
      return done(null, false);
    }
  } catch (error) {
    return done(error, false);
  }
}));