/**
 * Script de normalización de datos para la 1° entrega
 * Ejecutar una sola vez (es idempotente, pero genera backups cada vez).
 *
 * Acciones:
 *  - Normaliza categorías de insumos (verduras, lacteos → alimentos; desconocidas → otros)
 *  - Convierte valores numéricos (stock, stockMinimo, total, tiempoEstimado, precios, cantidades)
 *  - Ajusta estado de insumos (sin_stock / bajo_stock / disponible)
 *  - Valida referencias en tareas (empleadoAsignado, pedidoAsociado)
 *  - Completa campos faltantes en tareas (observaciones, fechaInicio, fechaFinalizacion)
 *  - Agrega tareas de control_inventario si no existen
 *  - Añade schemaVersion si no existe
 *
 * Uso:
 *   node scripts/normalizar_datos_v1.js
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

const files = {
  empleados: 'empleados.json',
  tareas: 'tareas.json',
  pedidos: 'pedidos.json',
  insumos: 'insumos.json'
};

function backupName(base) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return base.replace('.json', `.backup.${ts}.json`);
}

async function loadJSON(file) {
  const full = path.join(dataDir, file);
  const raw = await fs.readFile(full, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON inválido en ${file}: ${e.message}`);
  }
}

async function saveJSON(file, data) {
  const full = path.join(dataDir, file);
  await fs.writeFile(full, JSON.stringify(data, null, 2), 'utf8');
}

function normalizarNumero(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function normalizarCategoria(cat) {
  if (!cat) return 'otros';
  const c = cat.toString().toLowerCase().trim();
  if (['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros'].includes(c)) return c;
  if (['verduras', 'vegetales', 'hortalizas', 'lacteos', 'lácteos'].includes(c)) return 'alimentos';
  return 'otros';
}

function estadoInsumo(stock, stockMin) {
  if (stock === 0) return 'sin_stock';
  if (stock <= stockMin) return 'bajo_stock';
  return 'disponible';
}

async function main() {
  console.log('=== Normalización de datos iniciada ===');

  // 1. Cargar todos
  const [empleadosJSON, tareasJSON, pedidosJSON, insumosJSON] = await Promise.all([
    loadJSON(files.empleados),
    loadJSON(files.tareas),
    loadJSON(files.pedidos),
    loadJSON(files.insumos)
  ]);

  const empleados = Array.isArray(empleadosJSON.empleados) ? empleadosJSON.empleados : [];
  const tareas = Array.isArray(tareasJSON.tareas) ? tareasJSON.tareas : [];
  const pedidos = Array.isArray(pedidosJSON.pedidos) ? pedidosJSON.pedidos : [];
  const insumos = Array.isArray(insumosJSON.insumos) ? insumosJSON.insumos : [];

  const empleadoIds = new Set(empleados.map(e => e.id));
  const pedidoIds = new Set(pedidos.map(p => p.id));

  // 2. Normalizar insumos
  let insumosMod = 0;
  const insumosNorm = insumos.map(i => {
    const original = JSON.stringify(i);
    const stock = normalizarNumero(i.stock);
    const stockMinimo = normalizarNumero(i.stockMinimo);
    const categoria = normalizarCategoria(i.categoria);
    const estado = estadoInsumo(stock, stockMinimo);
    const unidadMedida = i.unidadMedida || '';
    const proveedor = i.proveedor || '';
    const ultimaActualizacion = i.ultimaActualizacion || new Date().toISOString();
    const obj = { ...i, stock, stockMinimo, categoria, estado, unidadMedida, proveedor, ultimaActualizacion };
    if (JSON.stringify(obj) !== original) insumosMod++;
    return obj;
  });

  // 3. Normalizar pedidos
  let pedidosMod = 0;
  const pedidosNorm = pedidos.map(p => {
    const original = JSON.stringify(p);
    const total = normalizarNumero(p.total);
    const tiempoEstimado = p.tiempoEstimado !== undefined ? normalizarNumero(p.tiempoEstimado) : null;

    // Normalizar items (producto, cantidad, precio)
    const items = Array.isArray(p.items) ? p.items.map(it => ({
      producto: it.producto,
      cantidad: normalizarNumero(it.cantidad),
      precio: normalizarNumero(it.precio)
    })) : [];

    // Limpiar campos redundantes como itemsText si no quieres persistirlo
    const pedido = {
      ...p,
      total,
      tiempoEstimado: tiempoEstimado ?? 0,
      items
    };
    // Opcional: eliminar itemsText
    if ('itemsText' in pedido) delete pedido.itemsText;

    if (JSON.stringify(pedido) !== original) pedidosMod++;
    return pedido;
  });

  // 4. Normalizar tareas
  let tareasMod = 0;
  const tareasNorm = tareas.map(t => {
    const original = JSON.stringify(t);
    let empleadoAsignado = t.empleadoAsignado;
    if (empleadoAsignado !== null && empleadoAsignado !== undefined && !empleadoIds.has(empleadoAsignado)) {
      empleadoAsignado = null;
    }
    let pedidoAsociado = t.pedidoAsociado;
    if (pedidoAsociado !== null && pedidoAsociado !== undefined && !pedidoIds.has(pedidoAsociado)) {
      pedidoAsociado = null;
    }

    const tarea = {
      ...t,
      empleadoAsignado,
      pedidoAsociado,
      observaciones: t.observaciones !== undefined ? t.observaciones : '',
      fechaInicio: t.fechaInicio !== undefined ? t.fechaInicio : null,
      fechaFinalizacion: t.fechaFinalizacion !== undefined ? t.fechaFinalizacion : null
    };

    if (JSON.stringify(tarea) !== original) tareasMod++;
    return tarea;
  });

  // 5. Asegurar al menos una tarea en control_inventario
  const tieneInventario = tareasNorm.some(t => t.area === 'control_inventario');
  if (!tieneInventario) {
    const nuevoId = tareasNorm.length > 0 ? Math.max(...tareasNorm.map(t => t.id)) + 1 : 1;
    tareasNorm.push({
      id: nuevoId,
      titulo: 'Registrar ingreso de queso',
      descripcion: 'Ingreso de 5 kg de queso mozzarella',
      area: 'control_inventario',
      estado: 'pendiente',
      prioridad: 'media',
      empleadoAsignado: null,
      pedidoAsociado: null,
      observaciones: 'Generada por script de normalización',
      fechaCreacion: new Date().toISOString(),
      fechaInicio: null,
      fechaFinalizacion: null
    });
    tareasMod++;
    console.log('Se agregó tarea de área control_inventario para cumplir consigna.');
  }

  // 6. Backups y guardado
  async function backupAndSave(file, originalData, newDataKey, newArray, schemaKey = null) {
    const full = path.join(dataDir, file);
    const backup = path.join(dataDir, backupName(file));
    await fs.writeFile(backup, JSON.stringify(originalData, null, 2), 'utf8');
    const finalData = { ...originalData, [newDataKey]: newArray };
    if (schemaKey && !('schemaVersion' in originalData)) {
      finalData.schemaVersion = 1;
    } else if (schemaKey && 'schemaVersion' in originalData) {
      finalData.schemaVersion = originalData.schemaVersion;
    }
    await fs.writeFile(full, JSON.stringify(finalData, null, 2), 'utf8');
    console.log(`Archivo ${file} normalizado. Backup: ${path.basename(backup)}`);
  }

  await backupAndSave(files.insumos, insumosJSON, 'insumos', insumosNorm, true);
  await backupAndSave(files.pedidos, pedidosJSON, 'pedidos', pedidosNorm, true);
  await backupAndSave(files.tareas, tareasJSON, 'tareas', tareasNorm, true);
  // Empleados: no tocamos (solo lectura). Si quisieras validar algo, aquí se haría.

  console.log('\n=== Resumen ===');
  console.log(`Insumos modificados: ${insumosMod}`);
  console.log(`Pedidos modificados: ${pedidosMod}`);
  console.log(`Tareas modificadas (incluye nueva si se agregó): ${tareasMod}`);
  console.log('Empleados: solo verificación de IDs, sin cambios en archivo.');
  console.log('\nNormalización completada.');
}

main().catch(err => {
  console.error('Error en normalización:', err);
  process.exit(1);
});