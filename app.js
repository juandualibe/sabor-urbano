import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import methodOverride from 'method-override';
import dotenv from 'dotenv';

import conectarDB from './db.js';

// Routers
import empleadosRouter from './routes/empleados.js';
import tareasRouter from './routes/tareas.js';
import pedidosRouter from './routes/pedidos.js'; // Rutas API para pedidos
import insumosRouter from './routes/insumos.js';
import productosRouter from './routes/productos.js';

// Modelos
import Empleado from './models/Empleado.js';
import Pedido from './models/Pedido.js';
import Insumo from './models/Insumo.js';
import Producto from './models/Producto.js';
import TareaModel from './models/Tarea.js';

// Controladores
import PedidosController from './controllers/pedidosController.js';

dotenv.config();
conectarDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Instancia de modelos/controladores
const pedidosController = new PedidosController(); // Instancia para las rutas de VISTAS de pedidos
const tareaModel = new TareaModel(); // Instancia para las rutas de VISTAS de tareas

// Configuración Pug
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.json()); // Para parsear JSON bodies (API)
app.use(express.urlencoded({ extended: true })); // Para parsear form bodies (vistas tradicionales)
app.use(methodOverride('_method')); // Para simular PUT/DELETE en forms (si se usa)
app.use(express.static(path.join(__dirname, 'public'))); // Servir archivos estáticos si tienes una carpeta 'public'

// RUTAS API (Prefijo /api)
app.use('/api/empleados', empleadosRouter);
app.use('/api/tareas', tareasRouter);
app.use('/api/pedidos', pedidosRouter); // API routes para pedidos
app.use('/api/insumos', insumosRouter);
app.use('/api/productos', productosRouter);

// HELPER de manejo de errores async para rutas de VISTAS
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// RUTAS VISTAS (Sin prefijo /api)
app.get('/', (req, res) => res.redirect('/tareas')); // Redirigir a tareas como página principal

// ---------- EMPLEADOS (Vistas Pug - Manejo Tradicional) ----------
app.get('/empleados', catchAsync(async (req, res) => {
  const empleados = await Empleado.find().lean();
  res.render('empleados/index', { page: 'empleados', empleados });
}));
app.get('/empleados/nuevo', (req, res) => {
  res.render('empleados/nuevo', { page: 'empleados' });
});
app.post('/empleados/nuevo', catchAsync(async (req, res) => {
  await Empleado.create(req.body);
  res.redirect('/empleados');
}));
app.get('/empleados/editar/:id', catchAsync(async (req, res) => {
  const empleado = await Empleado.findById(req.params.id).lean();
  if (!empleado) return res.status(404).render('error', { error: 'Empleado no encontrado', code: 404 });
  // Formatear fecha para input type="date" si existe
  if (empleado.fechaIngreso instanceof Date) {
      empleado.fechaIngresoFormato = empleado.fechaIngreso.toISOString().split('T')[0];
  } else {
      empleado.fechaIngresoFormato = ''; // O un valor por defecto
  }
  res.render('empleados/editar', { page: 'empleados', empleado });
}));
app.post('/empleados/editar/:id', catchAsync(async (req, res) => {
  await Empleado.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/empleados');
}));
// Nota: La eliminación de empleados en la vista usa fetch a /api/empleados/:id DELETE

// ---------- TAREAS (Vistas Pug - Usando TareaModel) ----------
app.get("/tareas", catchAsync(async (req, res) => {
  const tareas = await tareaModel.getAll(); // Incluye populate
  const empleados = await Empleado.find().lean();
  res.render('tareas/index', { page: 'tareas', tareas, empleados });
}));
app.get("/tareas/nueva", catchAsync(async (req, res) => {
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean();
  res.render('tareas/nueva', { page: 'tareas', empleados, pedidos });
}));
app.get("/tareas/editar/:id", catchAsync(async (req, res) => {
  const tareaId = req.params.id;
  const tarea = await tareaModel.getById(tareaId); // Incluye populate
  if (!tarea) return res.status(404).render('error', { error: 'Tarea no encontrada', code: 404 });
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean();
  res.render('tareas/editar', { page: 'tareas', tarea, empleados, pedidos });
}));
// Nota: Crear/Editar/Eliminar Tareas en las vistas usan fetch a /api/tareas

// ---------- INSUMOS (Vistas Pug - Usando API con fetch) ----------
app.get('/insumos', catchAsync(async (req, res) => {
  // Podríamos obtener los datos aquí o dejar que el frontend los pida a la API
  const insumos = await Insumo.find().lean(); // Ejemplo obteniéndolos aquí
  res.render('insumos/index', { page: 'insumos', insumos });
}));
app.get('/insumos/nuevo', (req, res) => {
  res.render('insumos/nuevo', { page: 'insumos' }); // El form usa fetch a POST /api/insumos
});
app.get('/insumos/editar/:id', catchAsync(async (req, res) => {
  const insumo = await Insumo.findById(req.params.id).lean();
  if (!insumo) return res.status(404).render('error', { error: 'Insumo no encontrado', code: 404 });
  res.render('insumos/editar', { page: 'insumos', insumo }); // El form usa fetch a PUT /api/insumos/:id
}));
// Nota: Eliminar Insumos en la vista usa fetch a DELETE /api/insumos/:id

// ---------- PRODUCTOS (Vistas Pug - Usando API con fetch) ----------
app.get('/productos', catchAsync(async (req, res) => {
  const productos = await Producto.find().lean();
  res.render('productos/index', { page: 'productos', productos });
}));
app.get('/productos/nuevo', (req, res) => {
  res.render('productos/nuevo', { page: 'productos' }); // El form usa fetch a POST /api/productos
});
app.get('/productos/editar/:id', catchAsync(async (req, res) => {
  const producto = await Producto.findById(req.params.id).lean();
  if (!producto) return res.status(404).render('error', { error: 'Producto no encontrado', code: 404 });
  res.render('productos/editar', { page: 'productos', producto }); // El form usa fetch a PUT /api/productos/:id
}));
// Nota: Eliminar Productos en la vista usa fetch a DELETE /api/productos/:id

// ---------- PEDIDOS (Vistas Pug - Usando Controlador y fetch) ----------
app.get('/pedidos', catchAsync(pedidosController.renderIndex.bind(pedidosController)));
app.get('/pedidos/nuevo', catchAsync(pedidosController.renderNuevo.bind(pedidosController)));
// **SOLUCIÓN:** Ruta POST para crear pedido desde la vista (usada por el script fetch de nuevo.pug)
app.post('/pedidos/nuevo', catchAsync(pedidosController.create.bind(pedidosController)));
app.get('/pedidos/editar/:id', catchAsync(pedidosController.renderEditar.bind(pedidosController)));
// **SOLUCIÓN:** Ruta POST para actualizar pedido desde la vista (usada por el script fetch de editar.pug)
app.post('/pedidos/editar/:id', catchAsync(pedidosController.update.bind(pedidosController)));
// Nota: Eliminar Pedidos en la vista usa fetch a DELETE /api/pedidos/:id

// ---------- FILTROS (Vista Pug) ----------
app.get('/filtros', catchAsync(async (req, res) => {
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean();
  res.render('filters', { page: 'filtros', empleados, pedidos });
}));
// Ruta para MOSTRAR resultados filtrados (GET)
app.get('/tareas/filtrar', catchAsync(async (req, res) => {
  const tareas = await tareaModel.filtrar(req.query); // Ya popula
  const empleados = await Empleado.find().lean();
  const pedidos = await Pedido.find().sort({ numeroOrden: -1 }).lean(); // Para repintar filtros
  // Renderiza la misma vista de índice, pero con las tareas filtradas y los filtros aplicados
  res.render('tareas/index', { page: 'tareas', tareas, empleados, pedidos, filtros: req.query });
}));

// MANEJO DE ERRORES (Al final de todas las rutas)
app.use((req, res, next) => {
  // Captura rutas no encontradas
  res.status(404).render('error', { error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`, code: 404 });
});

app.use((err, req, res, next) => {
  // Captura errores pasados por next() o lanzados en rutas síncronas/asíncronas (con catchAsync)
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