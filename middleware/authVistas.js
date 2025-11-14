// Este middleware comprueba si el usuario está en la SESIÓN

// Redirige al login si el usuario NO está autenticado
export const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    // req.isAuthenticated() es una función mágica de Passport
    // que revisa si hay un usuario válido en la sesión
    return next();
  }
  // Si no está autenticado, lo mandamos al login
  res.redirect('/login');
};

// Redirige al inicio (tareas) si el usuario YA está autenticado
// (Para evitar que un usuario logueado vea la página de login/registro)
export const isLoggedOut = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/tareas');
};