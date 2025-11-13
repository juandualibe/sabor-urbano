class ValidationMiddleware { // Clase con métodos estáticos para middlewares de validación
    static validarCamposRequeridos(camposRequeridos) { // Middleware: valida campos obligatorios en body
        return (req, res, next) => { // Retorna función middleware
            const camposFaltantes = []; // Array para faltantes
            for (const campo of camposRequeridos) { // Para cada campo requerido
                if (req.body[campo] == null || req.body[campo].toString().trim() === "") { // Si vacío o no existe
                    camposFaltantes.push(campo); // Agrega
                }
            }
            if (camposFaltantes.length > 0) { // Si hay faltantes
                return res.status(400).json({ // 400 con lista
                    success: false,
                    message: `Campos requeridos faltantes: ${camposFaltantes.join(", ")}`,
                    camposFaltantes: camposFaltantes, // Detalle extra
                });
            }
            next(); // Continúa si OK
        };
    }

    static validarEmail(req, res, next) { // Middleware: valida formato de email en body
        const { email } = req.body; // Extrae email
        if (email) { // Si presente
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex básico
            if (!emailRegex.test(email)) { // No válido
                return res.status(400).json({ // 400
                    success: false,
                    message: "Formato de email no válido",
                });
            }
        }
        next(); // OK
    }

    static validarNumerico(campo) { // Middleware: valida campo numérico >=0 en body
        return (req, res, next) => {
            const valor = req.body[campo]; // Valor
            if (valor !== undefined && (isNaN(Number(valor)) || Number(valor) < 0)) { // No numérico o negativo
                return res.status(400).json({ // 400
                    success: false,
                    message: `El campo ${campo} debe ser un número válido mayor o igual a 0`,
                });
            }
            next();
        };
    }

    static validarFecha(campo) { // Middleware: valida formato de fecha en body
        return (req, res, next) => {
            const fecha = req.body[campo]; // Fecha
            if (fecha && isNaN(Date.parse(fecha))) { // No parseable
                return res.status(400).json({ // 400
                    success: false,
                    message: `El campo ${campo} debe ser una fecha válida`,
                });
            }
            next();
        };
    }

    static sanitizarDatos(req, res, next) { // Middleware: limpia strings en body (trim)
        for (const key in req.body) { // Para cada propiedad
            if (typeof req.body[key] === "string") { // Si string
                req.body[key] = req.body[key].trim(); // Elimina espacios
            }
        }
        next();
    }

    static logRequest(req, res, next) { // Middleware: loggea requests (timestamp, método, URL, IP, body si POST/PUT)
        const timestamp = new Date().toISOString(); // Timestamp ISO
        const method = req.method; // Método HTTP
        const url = req.originalUrl; // URL
        const ip = req.ip || req.connection.remoteAddress; // IP
        console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`); // Log básico
        if ((method === "POST" || method === "PUT") && req.body) { // Si body y método que lo usa
            console.log(`[${timestamp}] Body:`, JSON.stringify(req.body, null, 2)); // Log body formateado
        }
        next();
    }

    static validarParametroId(req, res, next) { // Middleware: valida ID en params (numérico >0)
        const { id } = req.params; // ID
        if (isNaN(parseInt(id)) || parseInt(id) <= 0) { // No válido
            return res.status(400).json({ // 400
                success: false,
                message: "El ID debe ser un número válido mayor a 0",
            });
        }
        next();
    }

    static validarFiltros(req, res, next) { // Middleware: valida filtros de query (fechas, límite)
        const { fechaDesde, fechaHasta, limite } = req.query; // Extrae
        if (fechaDesde && isNaN(Date.parse(fechaDesde))) { // Fecha inválida
            return res.status(400).json({ // 400
                success: false,
                message: "fechaDesde debe ser una fecha válida",
            });
        }
        if (fechaHasta && isNaN(Date.parse(fechaHasta))) {
            return res.status(400).json({ // 400
                success: false,
                message: "fechaHasta debe ser una fecha válida",
            });
        }
        if ( // Si fechas y desde > hasta
            fechaDesde &&
            fechaHasta &&
            new Date(fechaDesde) > new Date(fechaHasta)
        ) {
            return res.status(400).json({ // 400
                success: false,
                message: "fechaDesde debe ser menor que fechaHasta",
            });
        }
        if (limite && (isNaN(parseInt(limite)) || parseInt(limite) <= 0)) { // Límite inválido
            return res.status(400).json({ // 400
                success: false,
                message: "limite debe ser un número mayor a 0",
            });
        }
        next();
    }

    static manejarErrores(err, req, res, next) { // Middleware global de errores: captura y responde
        console.error("Error capturado por middleware:", err); // Log
        if (err instanceof SyntaxError && err.status === 400 && "body" in err) { // JSON malformado
            return res.status(400).json({ // 400
                success: false,
                message: "JSON mal formateado en el body de la request",
            });
        }
        res.status(500).json({ // 500 general
            success: false,
            message: "Error interno del servidor",
            error: // Detalle condicional
                process.env.NODE_ENV === "development"
                    ? err.message // En dev, muestra error
                    : "Contacte al administrador", // En prod, genérico
        });
    }

    static establecerHeaders(req, res, next) { // Middleware: setea headers CORS y content-type para API
        if (req.url.startsWith("/api/")) { // Si ruta API
            res.header("Content-Type", "application/json; charset=utf-8"); // JSON UTF-8
        }
        res.header("Access-Control-Allow-Origin", "*"); // CORS origen *
        res.header( // Métodos permitidos
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, DELETE, OPTIONS"
        );
        res.header( // Headers permitidos
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        next();
    }
}

export default ValidationMiddleware; // Exporta clase
