import { ExchangeRate, CurrencyConversion } from "../Models/exchangeRate.model.js";

/**
 * CONTROLADOR DE CONVERSIÓN DE DIVISAS
 * 
 * Gestiona tasas de cambio y conversiones de moneda para transacciones internacionales.
 */

/**
 * Obtener tasa de cambio entre dos divisas
 * 
 * @param {Request} req - Parámetros: { fromCurrency, toCurrency }
 * @param {Response} res - Respuesta JSON
 * 
 * Retorna:
 * - Tasa de cambio vigente
 * - Si es bidireccional (ambas direcciones)
 * - Fecha de validez de la tasa
 */
export const getExchangeRate = async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.query;

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({
        message:
          "fromCurrency y toCurrency son obligatorios como parámetros query",
      });
    }

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // Validar formato (3 caracteres)
    if (from.length !== 3 || to.length !== 3) {
      return res.status(400).json({
        message: "Las monedas deben ser códigos ISO de 3 caracteres (ej: USD, EUR, GTQ)",
      });
    }

    // Si es la misma moneda, retornar tasa de 1
    if (from === to) {
      return res.json({
        success: true,
        fromCurrency: from,
        toCurrency: to,
        rate: 1,
        message: "Tasa de cambio entre la misma moneda es 1:1",
      });
    }

    // Buscar tasa directa
    let exchangeRate = await ExchangeRate.findOne({
      fromCurrency: from,
      toCurrency: to,
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    // Si no existe, buscar inversa y calcular
    if (!exchangeRate) {
      const inverseRate = await ExchangeRate.findOne({
        fromCurrency: to,
        toCurrency: from,
        isActive: true,
        validUntil: { $gte: new Date() },
      });

      if (inverseRate) {
        return res.json({
          success: true,
          fromCurrency: from,
          toCurrency: to,
          rate: (1 / inverseRate.rate).toFixed(6),
          source: inverseRate.source,
          calculatedFrom: `Inversa de ${to}->${from}`,
          validUntil: inverseRate.validUntil,
        });
      }

      return res.status(404).json({
        message: `No hay tasa de cambio disponible para ${from} -> ${to}`,
        suggestion: "Consulta con administrador para agregar esta tasa",
      });
    }

    res.json({
      success: true,
      fromCurrency: exchangeRate.fromCurrency,
      toCurrency: exchangeRate.toCurrency,
      rate: exchangeRate.rate,
      source: exchangeRate.source,
      validUntil: exchangeRate.validUntil,
      lastUpdated: exchangeRate.updatedAt,
    });
  } catch (error) {
    console.error("Error al obtener tasa de cambio:", error);
    res.status(500).json({
      message: "Error al obtener tasa de cambio",
      error: error.message,
    });
  }
};

/**
 * Convertir cantidad entre dos monedas
 * 
 * @param {Request} req - Datos: { amount, fromCurrency, toCurrency }
 * @param {Response} res - Respuesta JSON
 * 
 * Retorna:
 * - Monto convertido
 * - Tasa aplicada
 * - Detalles de conversión
 */
export const convertCurrency = async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;
    const userId = req.user?.id;

    // Validaciones
    if (amount === undefined || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        message: "amount, fromCurrency y toCurrency son obligatorios",
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: "El monto debe ser un número positivo",
      });
    }

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from.length !== 3 || to.length !== 3) {
      return res.status(400).json({
        message: "Las monedas deben ser códigos ISO de 3 caracteres",
      });
    }

    // Si es la misma moneda
    if (from === to) {
      const conversion = new CurrencyConversion({
        userId,
        fromCurrency: from,
        toCurrency: to,
        amountFrom: amount,
        amountTo: amount,
        rate: 1,
      });

      if (userId) {
        await conversion.save();
      }

      return res.json({
        success: true,
        amount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount: amount,
        rate: 1,
        message: "Conversión entre la misma moneda",
      });
    }

    // Buscar tasa
    let exchangeRate = await ExchangeRate.findOne({
      fromCurrency: from,
      toCurrency: to,
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    let rate = null;
    let directRate = true;

    if (!exchangeRate) {
      const inverseRate = await ExchangeRate.findOne({
        fromCurrency: to,
        toCurrency: from,
        isActive: true,
        validUntil: { $gte: new Date() },
      });

      if (!inverseRate) {
        return res.status(404).json({
          message: `No hay tasa de cambio disponible para ${from} -> ${to}`,
        });
      }

      rate = 1 / inverseRate.rate;
      directRate = false;
      exchangeRate = inverseRate;
    } else {
      rate = exchangeRate.rate;
    }

    const convertedAmount = (amount * rate).toFixed(2);

    // Registrar conversión si hay usuario
    if (userId) {
      const conversion = new CurrencyConversion({
        userId,
        fromCurrency: from,
        toCurrency: to,
        amountFrom: amount,
        amountTo: convertedAmount,
        rate,
      });
      await conversion.save();
    }

    res.json({
      success: true,
      amount,
      fromCurrency: from,
      toCurrency: to,
      convertedAmount,
      rate: Number(rate).toFixed(6),
      source: exchangeRate.source,
      rateCalculation: directRate ? "Directa" : "Inversa",
      validUntil: exchangeRate.validUntil,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error al convertir moneda:", error);
    res.status(500).json({
      message: "Error al convertir moneda",
      error: error.message,
    });
  }
};

/**
 * Agregar/actualizar tasa de cambio (ADMIN)
 * 
 * @param {Request} req - Datos: { fromCurrency, toCurrency, rate }
 * @param {Response} res - Respuesta JSON
 */
export const addExchangeRate = async (req, res) => {
  try {
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden agregar tasas de cambio",
      });
    }

    const { fromCurrency, toCurrency, rate, source } = req.body;

    // Validaciones
    if (!fromCurrency || !toCurrency || rate === undefined) {
      return res.status(400).json({
        message: "fromCurrency, toCurrency y rate son obligatorios",
      });
    }

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from.length !== 3 || to.length !== 3) {
      return res.status(400).json({
        message: "Las monedas deben ser códigos ISO de 3 caracteres",
      });
    }

    if (from === to) {
      return res.status(400).json({
        message: "No puedes crear una tasa de cambio entre la misma moneda",
      });
    }

    if (isNaN(rate) || rate <= 0) {
      return res.status(400).json({
        message: "La tasa debe ser un número positivo",
      });
    }

    // Buscar y actualizar o crear
    let exchangeRate = await ExchangeRate.findOne({
      fromCurrency: from,
      toCurrency: to,
    });

    if (exchangeRate) {
      exchangeRate.rate = rate;
      exchangeRate.source = source || exchangeRate.source;
      exchangeRate.lastUpdatedBy = req.user.id;
      exchangeRate.validUntil = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ); // 24 horas
    } else {
      exchangeRate = new ExchangeRate({
        fromCurrency: from,
        toCurrency: to,
        rate,
        source: source || "MANUAL",
        lastUpdatedBy: req.user.id,
      });
    }

    await exchangeRate.save();

    res.status(201).json({
      success: true,
      message: "Tasa de cambio guardada exitosamente",
      exchangeRate: {
        id: exchangeRate._id,
        fromCurrency: exchangeRate.fromCurrency,
        toCurrency: exchangeRate.toCurrency,
        rate: exchangeRate.rate,
        source: exchangeRate.source,
        validUntil: exchangeRate.validUntil,
      },
    });
  } catch (error) {
    console.error("Error al agregar tasa de cambio:", error);
    res.status(500).json({
      message: "Error al agregar tasa de cambio",
      error: error.message,
    });
  }
};

/**
 * Obtener historial de conversiones del usuario
 * 
 * @param {Request} req - Parámetros de filtro: { currency, limit, skip }
 * @param {Response} res - Respuesta JSON
 */
export const getConversionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, skip = 0, fromCurrency, toCurrency } = req.query;

    let query = { userId };

    if (fromCurrency) query.fromCurrency = fromCurrency.toUpperCase();
    if (toCurrency) query.toCurrency = toCurrency.toUpperCase();

    const conversions = await CurrencyConversion.find(query)
      .sort({ conversionDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await CurrencyConversion.countDocuments(query);

    res.json({
      success: true,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      conversions,
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({
      message: "Error al obtener historial de conversiones",
      error: error.message,
    });
  }
};

/**
 * Listar todas las tasas activas (ADMIN)
 * 
 * @param {Request} req - Filtros opcionales
 * @param {Response} res - Respuesta JSON
 */
export const getAllExchangeRates = async (req, res) => {
  try {
    const { currency, isActive } = req.query;
    let query = {};

    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      query.isActive = true; // Clientes solo ven tasas activas
    } else if (isActive !== undefined) {
      query.isActive = isActive === "true";
    } else {
      query.isActive = true; // Admins por defecto también ven activas
    }

    if (currency) {
      const curr = currency.toUpperCase();
      query.$or = [{ fromCurrency: curr }, { toCurrency: curr }];
    }

    const rates = await ExchangeRate.find(query)
      .sort({ fromCurrency: 1, toCurrency: 1 })
      .populate("lastUpdatedBy", "email username");

    res.json({
      success: true,
      total: rates.length,
      rates,
    });
  } catch (error) {
    console.error("Error al listar tasas:", error);
    res.status(500).json({
      message: "Error al listar tasas de cambio",
      error: error.message,
    });
  }
};

/**
 * Desactivar una tasa de cambio (ADMIN)
 * 
 * @param {Request} req - ID de la tasa
 * @param {Response} res - Respuesta JSON
 */
export const deactivateExchangeRate = async (req, res) => {
  try {
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden desactivar tasas",
      });
    }

    const { rateId } = req.params;

    const rate = await ExchangeRate.findByIdAndUpdate(
      rateId,
      { isActive: false },
      { returnDocument: 'after' }
    );

    if (!rate) {
      return res.status(404).json({
        message: "Tasa no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Tasa desactivada",
      rate,
    });
  } catch (error) {
    console.error("Error al desactivar tasa:", error);
    res.status(500).json({
      message: "Error al desactivar tasa",
      error: error.message,
    });
  }
};
