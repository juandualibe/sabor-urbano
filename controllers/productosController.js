import Producto from "../models/Producto.js";
import Insumo from "../models/Insumo.js";
import { calcularUnidadesDisponibles, convertirUnidad } from "../utils/unidades.js";

// Función auxiliar para calcular stock disponible
async function calcularStockDisponible(ingredientes) {
  try {
    if (!ingredientes || ingredientes.length === 0) return 0;

    const cantidadesDisponibles = [];

    for (const ing of ingredientes) {
      const insumo = await Insumo.findById(ing.insumo);
      if (!insumo || insumo.stock <= 0) {
        return 0; // Si falta algún insumo, no hay stock
      }

      // Usar la función de conversión de unidades
      const unidadesDisponibles = calcularUnidadesDisponibles(
        insumo.stock, 
        insumo.unidadMedida, 
        ing.cantidad, 
        ing.unidadMedida
      );
      
      if (unidadesDisponibles === 0) {
        return 0;
      }
      
      cantidadesDisponibles.push(unidadesDisponibles);
    }

    return Math.min(...cantidadesDisponibles);
  } catch (error) {
    console.error("Error al calcular stock disponible:", error);
    return 0;
  }
}

class ProductosController {

  // GET /api/productos
  async getAll(req, res) {
    try {
      const productos = await Producto.find().populate('ingredientes.insumo'); // Populate para mostrar datos de insumos
      res.json({
        success: true,
        data: productos,
        total: productos.length
      });
    } catch (error) {
      console.error("Error en getAll productos:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener los productos",
        error: error.message
      });
    }
  }

  // GET /api/productos/:id
  async getById(req, res) {
    try {
      const { id } = req.params;
      const producto = await Producto.findById(id).populate('ingredientes.insumo');
      if (!producto) {
        return res.status(404).json({ success: false, message: "Producto no encontrado" });
      }
      res.json({ success: true, data: producto });
    } catch (error) {
      console.error("Error en getById producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener el producto",
        error: error.message
      });
    }
  }

  // POST /api/productos
  async create(req, res) {
    try {
      console.log("=== DATOS RECIBIDOS ===");
      console.log("Body completo:", JSON.stringify(req.body, null, 2));
      
      const { nombre, ingredientes, margenGanancia, precioVenta } = req.body;

      // Validaciones
      if (!nombre) {
        return res.status(400).json({ success: false, message: "El nombre es obligatorio" });
      }

      if (!ingredientes || ingredientes.length === 0) {
        return res.status(400).json({ success: false, message: "Debe agregar al menos un ingrediente" });
      }

      // Procesar ingredientes y calcular costo
      const ingredientesConDatos = [];
      let costoTotal = 0;

      for (const ing of ingredientes) {
        const insumo = await Insumo.findById(ing.insumoId);
        if (!insumo) {
          return res.status(404).json({ 
            success: false, 
            message: `Insumo no encontrado: ${ing.insumoId}` 
          });
        }

        const cantidad = parseFloat(ing.cantidad);
        if (isNaN(cantidad) || cantidad <= 0) {
          return res.status(400).json({ 
            success: false, 
            message: "Las cantidades deben ser números positivos" 
          });
        }

        // Usar la unidad de medida especificada por el usuario o la del insumo
        const unidadMedida = ing.unidadMedida || insumo.unidadMedida;

        // Convertir la cantidad a la unidad base del insumo para calcular el costo
        const cantidadEnUnidadBase = convertirUnidad(cantidad, unidadMedida, insumo.unidadMedida);
        
        if (cantidadEnUnidadBase === null) {
          return res.status(400).json({ 
            success: false, 
            message: `No se puede convertir de ${unidadMedida} a ${insumo.unidadMedida}` 
          });
        }

        // El precio unitario está en la unidad base del insumo
        const costoIngrediente = cantidadEnUnidadBase * (insumo.precioUnitario || 0);
        costoTotal += costoIngrediente;

        ingredientesConDatos.push({
          insumo: insumo._id,
          nombreInsumo: insumo.nombre,
          cantidad: cantidad,
          unidadMedida: unidadMedida,
          precioUnitario: insumo.precioUnitario || 0
        });
      }

      // Calcular precio sugerido
      const margen = parseFloat(margenGanancia) || 0;
      const precioSugerido = costoTotal + (costoTotal * margen / 100);

      // Validar precio de venta
      let precioVentaFinal = parseFloat(precioVenta);
      if (isNaN(precioVentaFinal) || precioVentaFinal < costoTotal) {
        precioVentaFinal = precioSugerido; // Usar sugerido si no es válido
      }

      // Calcular stock disponible
      const stockDisponible = await calcularStockDisponible(ingredientesConDatos);

      const producto = new Producto({
        nombre,
        ingredientes: ingredientesConDatos,
        costoTotal,
        margenGanancia: margen,
        precioSugerido,
        precioVenta: precioVentaFinal,
        precio: precioVentaFinal, // Compatibilidad
        stock: stockDisponible > 0,
        stockDisponible
      });

      const nuevoProducto = await producto.save();
      res.status(201).json({
        success: true,
        message: "Producto creado exitosamente",
        data: nuevoProducto
      });
    } catch (error) {
      console.error("Error en create producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al crear el producto",
        error: error.message
      });
    }
  }

  // PUT /api/productos/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, ingredientes, margenGanancia, precioVenta } = req.body;

      const productoExistente = await Producto.findById(id);
      if (!productoExistente) {
        return res.status(404).json({ success: false, message: "Producto no encontrado" });
      }

      // Actualizar nombre
      if (nombre !== undefined) productoExistente.nombre = nombre;

      // Actualizar ingredientes si se proporcionan
      if (ingredientes && ingredientes.length > 0) {
        const ingredientesConDatos = [];
        let costoTotal = 0;

        for (const ing of ingredientes) {
          const insumo = await Insumo.findById(ing.insumoId);
          if (!insumo) {
            return res.status(404).json({ 
              success: false, 
              message: `Insumo no encontrado: ${ing.insumoId}` 
            });
          }

          const cantidad = parseFloat(ing.cantidad);
          if (isNaN(cantidad) || cantidad <= 0) {
            return res.status(400).json({ 
              success: false, 
              message: "Las cantidades deben ser números positivos" 
            });
          }

          // Usar la unidad de medida especificada por el usuario o la del insumo
          const unidadMedida = ing.unidadMedida || insumo.unidadMedida;

          // Convertir la cantidad a la unidad base del insumo para calcular el costo
          const cantidadEnUnidadBase = convertirUnidad(cantidad, unidadMedida, insumo.unidadMedida);
          
          if (cantidadEnUnidadBase === null) {
            return res.status(400).json({ 
              success: false, 
              message: `No se puede convertir de ${unidadMedida} a ${insumo.unidadMedida}` 
            });
          }

          // El precio unitario está en la unidad base del insumo
          const costoIngrediente = cantidadEnUnidadBase * (insumo.precioUnitario || 0);
          costoTotal += costoIngrediente;

          ingredientesConDatos.push({
            insumo: insumo._id,
            nombreInsumo: insumo.nombre,
            cantidad: cantidad,
            unidadMedida: unidadMedida,
            precioUnitario: insumo.precioUnitario || 0
          });
        }

        productoExistente.ingredientes = ingredientesConDatos;
        productoExistente.costoTotal = costoTotal;
      }

      // Actualizar margen de ganancia
      if (margenGanancia !== undefined) {
        const margen = parseFloat(margenGanancia);
        if (!isNaN(margen) && margen >= 0) {
          productoExistente.margenGanancia = margen;
        }
      }

      // Recalcular precio sugerido
      productoExistente.precioSugerido = 
        productoExistente.costoTotal + 
        (productoExistente.costoTotal * productoExistente.margenGanancia / 100);

      // Actualizar precio de venta
      if (precioVenta !== undefined) {
        const precioVentaNum = parseFloat(precioVenta);
        if (isNaN(precioVentaNum) || precioVentaNum < productoExistente.costoTotal) {
          return res.status(400).json({ 
            success: false, 
            message: `El precio de venta ($${precioVentaNum}) no puede ser menor al costo ($${productoExistente.costoTotal})` 
          });
        }
        productoExistente.precioVenta = precioVentaNum;
        productoExistente.precio = precioVentaNum; // Compatibilidad
      }

      // Recalcular stock disponible
      if (productoExistente.ingredientes && productoExistente.ingredientes.length > 0) {
        productoExistente.stockDisponible = await calcularStockDisponible(productoExistente.ingredientes);
        productoExistente.stock = productoExistente.stockDisponible > 0;
      }

      const productoActualizado = await productoExistente.save();
      res.json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: productoActualizado
      });
    } catch (error) {
      console.error("Error en update producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar el producto",
        error: error.message
      });
    }
  }

  // DELETE /api/productos/:id
  async delete(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await Producto.findByIdAndDelete(id); // Borra por ObjectId
      if (!eliminado) {
        return res.status(404).json({ success: false, message: "Producto no encontrado" });
      }
      res.json({ success: true, message: "Producto eliminado exitosamente" });
    } catch (error) {
      console.error("Error en delete producto:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar el producto",
        error: error.message
      });
    }
  }

  // GET /api/productos/insumos-disponibles
  async getInsumosDisponibles(req, res) {
    try {
      const { q } = req.query;
      let query = {};

      if (q && q.length > 0) {
        query.nombre = { $regex: q, $options: 'i' };
      }

      const insumos = await Insumo.find(query)
        .select('nombre unidadMedida stock precioUnitario')
        .limit(50)
        .lean();

      res.json(insumos);
    } catch (error) {
      console.error("Error al obtener insumos disponibles:", error);
      res.status(500).json({ 
        success: false, 
        message: "Error al obtener insumos", 
        error: error.message 
      });
    }
  }
}

export default ProductosController;