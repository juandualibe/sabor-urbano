import express from "express";
import insumosController from "../controllers/insumosController.js";
import ValidationMiddleware from "../middleware/validation.js";
import { isLoggedIn } from '../middleware/authVistas.js'; 

const router = express.Router();

// --- Middlewares globales para este router ---
router.use(ValidationMiddleware.logRequest);
router.use(isLoggedIn); 

// --- Validaciones específicas para insumos ---
const validarCamposInsumo = ValidationMiddleware.validarCamposRequeridos([
  "nombre",
  "categoria",
  "stock",
  "stockMinimo"
]);

const validarNumericos = [
  ValidationMiddleware.validarNumerico("stock"),
  ValidationMiddleware.validarNumerico("stockMinimo")
];

// --- Rutas (Ahora todas protegidas por Sesión) ---
router.get("/", insumosController.getAll);
router.get("/bajo-stock", insumosController.getBajoStock);
router.get("/alertas", insumosController.getAlertas);
router.get("/buscar", insumosController.buscar);
router.get("/proveedores", insumosController.getProveedores);

router.get(
  "/:id",
  ValidationMiddleware.validarParametroId,
  insumosController.getById
);

router.post(
  "/",
  ValidationMiddleware.sanitizarDatos,
  validarCamposInsumo,
  validarNumericos,
  insumosController.create
);

router.put(
  "/:id",
  ValidationMiddleware.validarParametroId,
  ValidationMiddleware.sanitizarDatos,
  validarCamposInsumo,
  validarNumericos,
  insumosController.update
);

router.patch(
  "/:id/stock",
  ValidationMiddleware.validarParametroId,
  ValidationMiddleware.validarNumerico("stock"),
  insumosController.actualizarStock // <-- CORREGIDO (antes 'service.actualizarStock')
);

router.delete(
  "/:id",
  ValidationMiddleware.validarParametroId,
  insumosController.delete
);

export default router;