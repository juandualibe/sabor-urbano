import express from 'express';
import ProductosController from '../controllers/productosController.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();
const productosController = new ProductosController();

// Middleware global para logs de todas las requests
router.use(ValidationMiddleware.logRequest);

// Middleware específico para validar body en POST de productos
const validarProductoPOST = (req, res, next) => {
    const { nombre, ingredientes, precioVenta } = req.body;

    if (!nombre) {
        return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }

    if (!ingredientes || !Array.isArray(ingredientes) || ingredientes.length === 0) {
        return res.status(400).json({ success: false, message: 'Debe agregar al menos un ingrediente' });
    }

    if (precioVenta === undefined || precioVenta === null) {
        return res.status(400).json({ success: false, message: 'El precio de venta es obligatorio' });
    }

    next();
};

// Middleware específico para validar body en PUT
const validarProductoPUT = (req, res, next) => {
    const { nombre, ingredientes, margenGanancia, precioVenta } = req.body;

    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'Body vacío: envíe al menos un campo.' });
    }

    if (req.method === 'PUT') {
        const alguno = [nombre, ingredientes, margenGanancia, precioVenta].some(f => f !== undefined);
        if (!alguno) {
            return res.status(400).json({ success: false, message: 'Incluya algún campo para actualizar.' });
        }
    }

    next();
};

// Rutas
router.get('/', productosController.getAll);
router.get('/insumos-disponibles', productosController.getInsumosDisponibles); // Debe ir antes de /:id
router.get('/:id', ValidationMiddleware.validarParametroId, productosController.getById);

router.post(
    '/',
    ValidationMiddleware.sanitizarDatos,
    validarProductoPOST,
    productosController.create
);

router.put(
    '/:id',
    ValidationMiddleware.validarParametroId,
    ValidationMiddleware.sanitizarDatos,
    validarProductoPUT,
    productosController.update
);

router.delete(
    '/:id',
    ValidationMiddleware.validarParametroId,
    productosController.delete
);

export default router;