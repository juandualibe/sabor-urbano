import express from "express";
import PedidosController from "../controllers/pedidosController.js";
import ValidationMiddleware from "../middleware/validation.js";
import mongoose from "mongoose";
import { isLoggedIn } from '../middleware/authVistas.js'; // <-- CAMBIADO

const router = express.Router();
const pedidosController = new PedidosController();

const validarObjectId = (req, res, next) => {
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.error(`[Routes/Pedidos] ID inválido recibido para ${req.method} ${req.originalUrl}: ${req.params.id}`);
        return res.status(400).json({ success: false, message: 'El ID proporcionado no es válido o falta.' });
    }
    next();
};

const validarPedido = (req, res, next) => {
    const { tipo, plataforma, estado, nombreCliente, telefonoCliente, direccionCliente } = req.body;

    if (req.method === "PUT" && Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: "El body PUT no puede estar vacío." });
    }
    if (tipo && !["presencial", "delivery"].includes(tipo)) {
        return res.status(400).json({ success: false, message: "Tipo debe ser: presencial o delivery" });
    }
    if (plataforma && !["rappi", "pedidosya", "propia", "local"].includes(plataforma)) {
        return res.status(400).json({ success: false, message: "Plataforma debe ser: rappi, pedidosya, propia o local" });
    }
    if (estado && !["pendiente", "en_preparacion", "listo", "en_camino", "entregado", "finalizado"].includes(estado)) {
        return res.status(400).json({ success: false, message: "Estado inválido" });
    }
    const tipoFinal = tipo || (req.pedido ? req.pedido.tipo : undefined);
    if (tipoFinal === "delivery") {
         if (req.method === "POST" && (!nombreCliente || !telefonoCliente || !direccionCliente)) {
            console.error("[validarPedido] Faltan datos obligatorios para delivery en POST.");
            return res.status(400).json({ success: false, message: "Delivery requiere nombre, teléfono y dirección del cliente." });
         }
    }
    next();
};

// ===================================
// RUTAS API (/api/pedidos)
// ===================================

// Aplicar el middleware de SESIÓN (isLoggedIn)
router.use(isLoggedIn); // <-- CAMBIADO (antes 'protect')

// Todas estas rutas ahora están protegidas por la Sesión
router.get("/", (req, res, next) => pedidosController.getAll(req, res).catch(next));

router.get("/:id", validarObjectId, (req, res, next) => pedidosController.getById(req, res).catch(next));

router.post(
  "/",
  ValidationMiddleware.validarCamposRequeridos(["items", "tipo", "plataforma"]),
  validarPedido,
  (req, res, next) => pedidosController.create(req, res).catch(next)
);

router.put(
    "/:id",
    validarObjectId,
    validarPedido,
    (req, res, next) => pedidosController.update(req, res).catch(next)
);

router.delete(
    "/:id",
    validarObjectId,
    (req, res, next) => pedidosController.delete(req, res).catch(next)
);

export default router;