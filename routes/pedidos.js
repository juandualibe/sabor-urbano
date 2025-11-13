import express from "express";
import PedidosController from "../controllers/pedidosController.js";
import ValidationMiddleware from "../middleware/validation.js";
import mongoose from "mongoose"; // Necesario para validar ObjectIds

const router = express.Router();
const pedidosController = new PedidosController();

// Middleware para validar ObjectId en rutas específicas
const validarObjectId = (req, res, next) => {
    // Verificar si req.params.id existe antes de validarlo
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.error(`[Routes/Pedidos] ID inválido recibido para ${req.method} ${req.originalUrl}: ${req.params.id}`);
        return res.status(400).json({ success: false, message: 'El ID proporcionado no es válido o falta.' });
    }
    next();
};


// Middleware personalizado de validación (ajustado para claridad)
const validarPedido = (req, res, next) => {
    const { tipo, plataforma, estado, nombreCliente, telefonoCliente, direccionCliente } = req.body;

    // Verificar body vacío en PUT (solo si es PUT)
    if (req.method === "PUT" && Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: "El body PUT no puede estar vacío." });
    }
    // Validar tipo (si existe en el body)
    if (tipo && !["presencial", "delivery"].includes(tipo)) {
        return res.status(400).json({ success: false, message: "Tipo debe ser: presencial o delivery" });
    }
    // Validar plataforma (si existe en el body)
    if (plataforma && !["rappi", "pedidosya", "propia", "local"].includes(plataforma)) {
        return res.status(400).json({ success: false, message: "Plataforma debe ser: rappi, pedidosya, propia o local" });
    }
    // Validar estado (si existe en el body)
    if (estado && !["pendiente", "en_preparacion", "listo", "en_camino", "entregado", "finalizado"].includes(estado)) {
        return res.status(400).json({ success: false, message: "Estado inválido" });
    }
    // Validar datos de delivery obligatorios si el TIPO es delivery (más relevante en POST)
    // En PUT, solo se validan si se intentan modificar explícitamente a delivery sin datos.
    // Usamos el TIPO que viene en el body, o si no viene (en PUT), usamos el tipo actual del pedido (esto requeriría buscarlo primero, es más complejo).
    // Simplificación: Requerir si el TIPO enviado es delivery.
    const tipoFinal = tipo || (req.pedido ? req.pedido.tipo : undefined); // Para un futuro si cargamos el pedido antes en PUT
    if (tipoFinal === "delivery") {
         // Verificamos si los campos necesarios están presentes en el body para delivery
         if (req.method === "POST" && (!nombreCliente || !telefonoCliente || !direccionCliente)) {
            console.error("[validarPedido] Faltan datos obligatorios para delivery en POST.");
            return res.status(400).json({ success: false, message: "Delivery requiere nombre, teléfono y dirección del cliente." });
         }
         // Podríamos añadir validación similar para PUT si es necesario
    }
    next();
};

// ===================================
// RUTAS API (/api/pedidos)
// ===================================

// GET /api/pedidos
router.get("/", (req, res, next) => pedidosController.getAll(req, res).catch(next)); // Añadir catch(next) por seguridad

// GET /api/pedidos/:id
router.get("/:id", validarObjectId, (req, res, next) => pedidosController.getById(req, res).catch(next));

// POST /api/pedidos
router.post(
  "/",
  // ***** ¡¡AQUÍ!! ASEGÚRATE DE QUE NO ESTÉ "total" *****
  ValidationMiddleware.validarCamposRequeridos(["items", "tipo", "plataforma"]),
  // ***************************************************************
  validarPedido, // Valida lógica específica de pedido
  // Llamamos al método create del controller, envolviéndolo en catch(next)
  (req, res, next) => pedidosController.create(req, res).catch(next)
);

// PUT /api/pedidos/:id
router.put(
    "/:id",
    validarObjectId, // Validar ID de URL
    validarPedido,   // Validar campos enviados en el body
    (req, res, next) => pedidosController.update(req, res).catch(next) // Envolver en catch(next)
);

// DELETE /api/pedidos/:id
router.delete(
    "/:id",
    validarObjectId, // Validar ID de URL
    (req, res, next) => pedidosController.delete(req, res).catch(next) // Envolver en catch(next)
);

export default router;