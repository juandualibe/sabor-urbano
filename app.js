import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import dotenv from 'dotenv';
import passport from 'passport'; 
import session from 'express-session'; 
import { isLoggedIn, isLoggedOut } from './middleware/authVistas.js'; 

import conectarDB from './db.js';

// 1. Modelos
import Usuario from './models/Usuario.js'; 
import Empleado from './models/Empleado.js';
import Pedido from './models/Pedido.js';
import Insumo from './models/Insumo.js';
import Producto from './models/Producto.js';
import TareaModel from './models/Tarea.js';

// 2. Config de Passport
import './config/passport.js'; 

// Routers
import empleadosRouter from './routes/empleados.js';
import tareasRouter from './routes/tareas.js';
import pedidosRouter from './routes/pedidos.js';
import insumosRouter from './routes/insumos.js';
import productosRouter from './routes/productos.js';
import authRouter from './routes/auth.js'; 

// Controladores
import PedidosController from './controllers/pedidosController.js';

dotenv.config();
conectarDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Instancia de modelos/controladores
const pedidosController = new PedidosController(); 
const tareaModel = new TareaModel(); 

// Configuración Pug
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(methodOverride('_method')); 
app.use(express.static(path.join(__dirname, 'public'))); 

// Configurar Sesión
app.use(session({
  secret: process.env.JWT_SECRET, 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } 
}));

// Inicializar Passport y Sesión de Passport
app.use(passport.initialize());
app.use(passport.session()); 

// Middleware para pasar usuario a las vistas PUG
app.use((req, res, next) => {
  res.locals.user = req.user; 
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// HELPER de manejo de errores async para rutas
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// --- RUTAS DE AUTENTICACIÓN ---

// Rutas API (JWT)
app.use('/auth', authRouter); 

// Rutas de VISTAS (Sesión/Cookie)
app.get('/login', isLoggedOut, (req, res) => {
  res.render('auth/login', { page: 'login' });
});

app.get('/register', isLoggedOut, (req, res) => {
  res.render('auth/register', { page: 'register' });
});

// POST de Login (Crea la SESIÓN)
app.post('/login', isLoggedOut, passport.authenticate('local', {
  successRedirect: '/tareas', 
  failureRedirect: '/login',
}));

// Lógica de Registro de 2 pasos para el formulario PUG
const handleRegister = async (req, res, next) => {
  const { nombre, apellido, email, username, password } = req.body;
  
  const userExists = await Usuario.findOne({ username: username.toLowerCase() });
  if (userExists) {
    console.error("Error: Usuario ya existe.");
    return res.redirect('/register');
  }
  const emailExists = await Usuario.findOne({ email: email.toLowerCase() });
  if (emailExists) {
    console.error("Error: Email ya existe.");
    return res.redirect('/register');
  }

  // Crea SÓLO el Usuario
  const nuevoUsuario = new Usuario({
    nombre,
    apellido,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
  });
  await nuevoUsuario.save();
};

// POST de Registro
app.post('/register', isLoggedOut, catchAsync(async (req, res, next) => {
  await handleRegister(req, res, next);
  res.redirect('/login'); 
}));

// Ruta de Logout
app.get('/logout', isLoggedIn, (req, res, next) => {
  req.logout((err) => { 
    if (err) { return next(err); }
    res.redirect('/login');
  });
});


// RUTAS API (Protegidas por Sesión)
app.use('/api/empleados', empleadosRouter);
app.use('/api/tareas', tareasRouter);
app.use('/api/pedidos', pedidosRouter); 
app.use('/api/insumos', insumosRouter);
app.use('/api/productos', productosRouter);


// --- RUTAS DE VISTAS (Protegidas) ---

app.get('/', isLoggedIn, (req, res) => res.redirect('/tareas')); 

// ---------- EMPLEADOS (Protegido) ----------
app.get('/empleados', isLoggedIn, catchAsync(async (req, res) => {
  const empleados = await Empleado.find().lean();
  res.render('empleados/index', { page: 'empleados', empleados });
}));
app.get('/empleados/nuevo', isLoggedIn, (req, res) => {
  res.render('empleados/nuevo', { page: 'empleados' });
});
app.post('/empleados/nuevo', isLoggedIn, catchAsync(async (req, res, next) => {
  const { nombre, apellido, email, telefono, rol, area, fechaIngreso } = req.body;
  const emailExists = await Empleado.findOne({ email: email.toLowerCase() });
  if (emailExists) {
    throw new Error('El email ya está registrado para otro empleado.');
  }
  const nuevoEmpleado = new Empleado({
    nombre,
    apellido,
    email: email.toLowerCase(),
    telefono,
    rol,
    area,
    fechaIngreso: fechaIngreso || Date.now()
  });
  await nuevoEmpleado.save();
  res.redirect('/empleados');
}));
app.get('/empleados/editar/:id', isLoggedIn, catchAsync(async (req, res) => {
  const empleado = await Empleado.findById(req.params.id).lean();
  if (!empleado) return res.status(404).render('error', { error: 'Empleado no encontrado', code: 404 });
  if (empleado.fechaIngreso instanceof Date) {
      empleado.fechaIngresoFormato = empleado.fechaIngreso.toISOString().split('T')[0];
  } else {
      empleado.fechaIngresoFormato = '';
  }
  res.render('empleados/editar', { page: 'empleados', empleado });
}));
app.post('/empleados/editar/:id', isLoggedIn, catchAsync(async (req, res) => {
  const { nombre, apellido, email, telefono, rol, area, fechaIngreso } = req.body;
  await Empleado.findByIdAndUpdate(req.params.id, { nombre, apellido, email, telefono, rol, area, fechaIngreso });
  res.redirect('/empleados');
}));

// ---------- TAREAS (Protegido) ----------
app.get("/tareas", isLoggedIn, catchAsync(async (req, res) => {
  const tareas = await tareaModel.getAll(); 
  const empleados = await Empleado.find().lean();
  res.render('tareas/index', { page: 'tareas', tareas, empleados });
}));
app.get("/tareas/nueva", isLoggedIn, catchAsync(async (req, res) => {
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean();
  res.render('tareas/nueva', { page: 'tareas', empleados, pedidos });
}));
app.get("/tareas/editar/:id", isLoggedIn, catchAsync(async (req, res) => {
  const tareaId = req.params.id;
  const tarea = await tareaModel.getById(tareaId); 
  if (!tarea) return res.status(404).render('error', { error: 'Tarea no encontrada', code: 404 });
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean();
  res.render('tareas/editar', { page: 'tareas', tarea, empleados, pedidos });
}));


// --- INICIO DE RUTAS RESTAURADAS ---

// ---------- INSUMOS (Protegido) ----------
app.get('/insumos', isLoggedIn, catchAsync(async (req, res) => {
  const insumos = await Insumo.find().lean(); 
  res.render('insumos/index', { page: 'insumos', insumos });
}));
app.get('/insumos/nuevo', isLoggedIn, (req, res) => {
  res.render('insumos/nuevo', { page: 'insumos' }); 
});
app.get('/insumos/editar/:id', isLoggedIn, catchAsync(async (req, res) => {
  const insumo = await Insumo.findById(req.params.id).lean();
  if (!insumo) return res.status(404).render('error', { error: 'Insumo no encontrado', code: 404 });
  res.render('insumos/editar', { page: 'insumos', insumo }); 
}));

// ---------- PRODUCTOS (Protegido) ----------
app.get('/productos', isLoggedIn, catchAsync(async (req, res) => {
  const productos = await Producto.find().lean();
  res.render('productos/index', { page: 'productos', productos });
}));
app.get('/productos/nuevo', isLoggedIn, (req, res) => {
  res.render('productos/nuevo', { page: 'productos' }); 
});
app.get('/productos/editar/:id', isLoggedIn, catchAsync(async (req, res) => {
  const producto = await Producto.findById(req.params.id).lean();
  if (!producto) return res.status(404).render('error', { error: 'Producto no encontrado', code: 404 });
  res.render('productos/editar', { page: 'productos', producto }); 
}));

// ---------- PEDIDOS (Protegido) ----------
app.get('/pedidos', isLoggedIn, catchAsync(pedidosController.renderIndex.bind(pedidosController)));
app.get('/pedidos/nuevo', isLoggedIn, catchAsync(pedidosController.renderNuevo.bind(pedidosController)));
app.post('/pedidos/nuevo', isLoggedIn, catchAsync(pedidosController.create.bind(pedidosController)));
app.get('/pedidos/editar/:id', isLoggedIn, catchAsync(pedidosController.renderEditar.bind(pedidosController)));
app.post('/pedidos/editar/:id', isLoggedIn, catchAsync(pedidosController.update.bind(pedidosController)));

// ---------- FILTROS (Protegido) ----------
app.get('/filtros', isLoggedIn, catchAsync(async (req, res) => {
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean();
  res.render('filters', { page: 'filtros', empleados, pedidos });
}));
app.get('/tareas/filtrar', isLoggedIn, catchAsync(async (req, res) => {
  const tareas = await tareaModel.filtrar(req.query); 
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean(); 
  res.render('tareas/index', { page: 'tareas', tareas, empleados, pedidos, filtros: req.query });
}));

// --- FIN DE RUTAS RESTAURADAS ---


// MANEJO DE ERRORES
app.use((req, res, next) => {
  res.status(404).render('error', { error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`, code: 404 });
});

app.use((err, req, res, next) => {
  console.error("🔥🔥🔥 Error capturado:", err.stack);
  res.status(err.status || 500).render('error', {
    error: err.message || 'Error interno del servidor',
    code: err.status || 500
  });
});

// SERVIDOR
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});