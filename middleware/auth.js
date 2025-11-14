import passport from 'passport';

// Este es el middleware "guardián" o "bouncer".
// Usa la estrategia 'jwt' que definimos en config/passport.js.
// Si el token es válido, deja pasar (llama a next()).
// Si el token es inválido o no existe, devuelve un 401 Unauthorized.
export const protect = passport.authenticate('jwt', { session: false });