import Insumo from "../models/Insumo.js";

class InsumosController {
  // Obtener todos los insumos
  async getAll(req, res) {
    try {
      const insumos = await Insumo.find().lean();
      res.json({ success: true, data: insumos });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error al obtener insumos", error });
    }
  }

  // Obtener por ID
  async getById(req, res) {
    try {
      const insumo = await Insumo.findById(req.params.id).lean();
      if (!insumo)
        return res
          .status(404)
          .json({ success: false, message: "Insumo no encontrado" });
      res.json({ success: true, data: insumo });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error al obtener insumo", error });
    }
  }

  // Crear nuevo insumo
  async create(req, res) {
    try {
      const { nombre, categoria, stock, stockMinimo, unidadMedida, proveedor, precioUnitario } =
        req.body;

      const stockNumero = Number(stock);
      const stockMinimoNumero = Number(stockMinimo);
      const precioNumero = Number(precioUnitario) || 0;

      if (Number.isNaN(stockNumero) || Number.isNaN(stockMinimoNumero)) {
        return res.status(400).json({
          success: false,
          message: "Stock y stock mínimo deben ser numéricos",
        });
      }

      // Validar unidad de medida si se proporciona
      if (unidadMedida) {
        const unidadesValidas = ['kg', 'unidades', 'litros'];
        if (!unidadesValidas.includes(unidadMedida)) {
          return res.status(400).json({
            success: false,
            message: 'Unidad de medida inválida. Debe ser: kg, unidades o litros'
          });
        }
      }

      const estado = determinarEstado(stockNumero, stockMinimoNumero);
      const nuevoInsumo = new Insumo({
        nombre,
        categoria,
        stock: stockNumero,
        stockMinimo: stockMinimoNumero,
        unidadMedida,
        proveedor,
        precioUnitario: precioNumero,
        estado,
        ultimaActualizacion: new Date(),
      });
      const insumoGuardado = await nuevoInsumo.save();
      res.status(201).json({ success: true, data: insumoGuardado });
    } catch (error) {
      console.error("Error en InsumosController.create:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al crear insumo",
          error: error?.message || error,
        });
    }
  }

  // Actualizar campos
  async update(req, res) {
    try {
      const { id } = req.params;
      const datos = req.body;
      const insumo = await Insumo.findById(id);

      if (!insumo) {
        return res
          .status(404)
          .json({ success: false, message: "Insumo no encontrado" });
      }

      if (datos.nombre !== undefined) insumo.nombre = datos.nombre;
      if (datos.categoria !== undefined) insumo.categoria = datos.categoria;
      
      // Validar unidad de medida si se está actualizando
      if (datos.unidadMedida !== undefined) {
        const unidadesValidas = ['kg', 'unidades', 'litros'];
        if (datos.unidadMedida && !unidadesValidas.includes(datos.unidadMedida)) {
          return res.status(400).json({
            success: false,
            message: 'Unidad de medida inválida. Debe ser: kg, unidades o litros'
          });
        }
        insumo.unidadMedida = datos.unidadMedida;
      }
      
      if (datos.proveedor !== undefined) insumo.proveedor = datos.proveedor;

      if (datos.precioUnitario !== undefined) {
        const precioNumero = Number(datos.precioUnitario);
        if (Number.isNaN(precioNumero) || precioNumero < 0) {
          return res.status(400).json({
            success: false,
            message: "El precio unitario debe ser un número positivo",
          });
        }
        insumo.precioUnitario = precioNumero;
      }

      if (datos.stockMinimo !== undefined) {
        const stockMinimoNumero = Number(datos.stockMinimo);
        if (Number.isNaN(stockMinimoNumero)) {
          return res.status(400).json({
            success: false,
            message: "Stock mínimo debe ser numérico",
          });
        }
        insumo.stockMinimo = stockMinimoNumero;
      }

      if (datos.stock !== undefined) {
        const stockNumero = Number(datos.stock);
        if (Number.isNaN(stockNumero)) {
          return res.status(400).json({
            success: false,
            message: "Stock debe ser numérico",
          });
        }
        insumo.stock = stockNumero;
      }

      insumo.estado = determinarEstado(insumo.stock, insumo.stockMinimo);
      insumo.ultimaActualizacion = new Date();

      const insumoActualizado = await insumo.save();

      res.json({ success: true, data: insumoActualizado });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar insumo", error });
    }
  }

  // Eliminar
  async delete(req, res) {
    try {
      const { id } = req.params;
      const eliminado = await Insumo.findByIdAndDelete(id);
      if (!eliminado)
        return res
          .status(404)
          .json({ success: false, message: "Insumo no encontrado" });
      res.json({ success: true, message: "Insumo eliminado correctamente" });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar insumo", error });
    }
  }

  // Obtener insumos con bajo stock
  async getBajoStock(req, res) {
    try {
      const insumos = await Insumo.find({
        $expr: { $lte: ["$stock", "$stockMinimo"] },
      }).lean();
      res.json({ success: true, data: insumos });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error al obtener bajo stock",
        error,
      });
    }
  }

  // Obtener alertas
  async getAlertas(req, res) {
    try {
      const insumos = await Insumo.find({
        $expr: { $lte: ["$stock", "$stockMinimo"] },
      }).lean();
      const alertas = insumos.map((i) => ({
        id: i._id,
        nombre: i.nombre,
        stockActual: i.stock,
        stockMinimo: i.stockMinimo,
        estado: i.estado,
        proveedor: i.proveedor,
      }));
      res.json({ success: true, data: alertas });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error al obtener alertas", error });
    }
  }

  // Actualizar stock
  async actualizarStock(req, res) {
    try {
      const { id } = req.params;
      const { nuevoStock } = req.body;
      const insumo = await Insumo.findById(id);
      if (!insumo)
        return res
          .status(404)
          .json({ success: false, message: "Insumo no encontrado" });

      const stockNumero = Number(nuevoStock);
      if (Number.isNaN(stockNumero)) {
        return res.status(400).json({
          success: false,
          message: "El nuevo stock debe ser numérico",
        });
      }

      insumo.stock = stockNumero;
      insumo.estado = determinarEstado(insumo.stock, insumo.stockMinimo);
      insumo.ultimaActualizacion = new Date();

      await insumo.save();
      res.json({ success: true, data: insumo });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar stock", error });
    }
  }

  // Buscar insumos por nombre
  async buscar(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 1) {
        return res.json([]);
      }

      const insumos = await Insumo.find({
        nombre: { $regex: q, $options: 'i' }
      })
      .limit(10)
      .select('nombre')
      .lean();

      res.json(insumos);
    } catch (error) {
      console.error('Error al buscar insumos:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener lista de proveedores únicos
  async getProveedores(req, res) {
    try {
      const { q } = req.query;

      let proveedores = await Insumo.distinct('proveedor');

      // Filtrar valores null o undefined
      proveedores = proveedores.filter(p => p);

      // Filtrar por query si existe
      if (q && q.length > 0) {
        proveedores = proveedores.filter(p =>
          p.toLowerCase().includes(q.toLowerCase())
        );
      }

      res.json(proveedores.slice(0, 10));
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      res.status(500).json({ error: error.message });
    }
  }

}

const determinarEstado = (stock, stockMinimo) => {
  if (stock === 0) return "sin_stock";
  if (stock <= stockMinimo) return "bajo_stock";
  return "disponible";
};

export default new InsumosController();
