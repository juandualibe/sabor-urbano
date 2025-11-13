// Utilidades para conversión de unidades de medida

// Definición de unidades y sus equivalencias
export const UNIDADES = {
  // Masa
  kg: { tipo: 'masa', nombre: 'Kilogramos', abrev: 'kg' },
  g: { tipo: 'masa', nombre: 'Gramos', abrev: 'g' },
  
  // Volumen
  litros: { tipo: 'volumen', nombre: 'Litros', abrev: 'L' },
  ml: { tipo: 'volumen', nombre: 'Mililitros', abrev: 'ml' },
  
  // Unidades
  unidades: { tipo: 'unidades', nombre: 'Unidades', abrev: 'u' }
};

// Conversiones: de una unidad a su unidad base
const CONVERSIONES = {
  // Masa (base: kg)
  kg: 1,
  g: 0.001,
  
  // Volumen (base: litros)
  litros: 1,
  ml: 0.001,
  
  // Unidades (sin conversión)
  unidades: 1
};

/**
 * Convierte una cantidad de una unidad a otra
 * @param {number} cantidad - Cantidad a convertir
 * @param {string} unidadOrigen - Unidad de origen
 * @param {string} unidadDestino - Unidad de destino
 * @returns {number} - Cantidad convertida, o null si no es posible la conversión
 */
export function convertirUnidad(cantidad, unidadOrigen, unidadDestino) {
  // Si son la misma unidad, no hay conversión
  if (unidadOrigen === unidadDestino) {
    return cantidad;
  }

  // Verificar que ambas unidades existan
  if (!UNIDADES[unidadOrigen] || !UNIDADES[unidadDestino]) {
    return null;
  }

  // Verificar que sean del mismo tipo
  if (UNIDADES[unidadOrigen].tipo !== UNIDADES[unidadDestino].tipo) {
    return null; // No se puede convertir entre tipos diferentes
  }

  // Convertir a unidad base y luego a unidad destino
  const cantidadBase = cantidad * CONVERSIONES[unidadOrigen];
  const cantidadDestino = cantidadBase / CONVERSIONES[unidadDestino];

  return cantidadDestino;
}

/**
 * Obtiene el stock disponible en una unidad específica
 * @param {number} stockBase - Stock en la unidad base del insumo
 * @param {string} unidadBase - Unidad base del insumo
 * @param {string} unidadDeseada - Unidad en la que se quiere el stock
 * @returns {number} - Stock en la unidad deseada
 */
export function obtenerStockEnUnidad(stockBase, unidadBase, unidadDeseada) {
  return convertirUnidad(stockBase, unidadBase, unidadDeseada);
}

/**
 * Calcula cuántas unidades de producto se pueden hacer con el stock disponible
 * @param {number} stockDisponible - Stock disponible del insumo
 * @param {string} unidadStock - Unidad del stock
 * @param {number} cantidadNecesaria - Cantidad necesaria para una unidad de producto
 * @param {string} unidadReceta - Unidad de la receta
 * @returns {number} - Cantidad de productos que se pueden hacer
 */
export function calcularUnidadesDisponibles(stockDisponible, unidadStock, cantidadNecesaria, unidadReceta) {
  // Convertir el stock a la unidad de la receta
  const stockEnUnidadReceta = convertirUnidad(stockDisponible, unidadStock, unidadReceta);
  
  if (stockEnUnidadReceta === null) {
    return 0; // No se puede convertir
  }

  // Calcular cuántas unidades se pueden hacer
  return Math.floor(stockEnUnidadReceta / cantidadNecesaria);
}

/**
 * Obtiene la lista de unidades compatibles para un tipo
 * @param {string} unidadBase - Unidad base
 * @returns {Array} - Array de unidades compatibles
 */
export function obtenerUnidadesCompatibles(unidadBase) {
  if (!UNIDADES[unidadBase]) {
    return [];
  }

  const tipo = UNIDADES[unidadBase].tipo;
  return Object.keys(UNIDADES).filter(u => UNIDADES[u].tipo === tipo);
}
