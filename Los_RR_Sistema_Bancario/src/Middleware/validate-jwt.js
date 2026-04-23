import jwt from "jsonwebtoken";

// Claims de .NET (nombres completos de Microsoft)
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";

/**
 * Middleware principal - Valida JWT generado por .NET
 * Header esperado: Authorization: Bearer <TOKEN>
 */
export const validateJWT = (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  console.log('SECRET CARGADO:', JSON.stringify(secret));

  if (!secret) {
    console.error("Error JWT: JWT_SECRET no definido en .env");
    return res.status(500).json({
      success: false,
      message: "Configuración del servidor inválida: falta JWT_SECRET",
    });
  }

  // Extraer token del header
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.header("x-token");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No se proporcionó un token",
      error: "MISSING_TOKEN",
    });
  }

  try {
    const verifyOptions = {
      issuer: process.env.JWT_ISSUER || 'SistemaBancario',
      audience: process.env.JWT_AUDIENCE || 'BankingAPI',
    };

    const decoded = jwt.verify(token, secret, verifyOptions);

    // Extraer roles (puede ser string o array en .NET)
    const rawRoles = decoded[ROLE_CLAIM] || decoded.role || "User";
    const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

    // Extraer userId con múltiples opciones de claims
    const userId = 
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || // .NET claim
      decoded.sub || // Standard JWT sub
      decoded.id || // Custom id claim
      decoded.userId || // Custom userId claim
      decoded.oid; // Azure AD Object ID

    if (!userId) {
      console.error("Error JWT: No se encontró identificador de usuario en el token");
      console.error("Token decodificado:", JSON.stringify(decoded, null, 2));
      return res.status(401).json({
        success: false,
        message: "Token inválido: no contiene identificador de usuario",
        error: "MISSING_USER_ID",
      });
    }

    // Datos del usuario disponibles en req.user
    req.user = {
      id: userId,
      email: decoded[EMAIL_CLAIM] || decoded.email || null,
      roles,
      role: roles[0], 
      jti: decoded.jti || null,
    };

    next();
  } catch (error) {
    console.error("Error validando JWT:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "El token ha expirado",
        error: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
        error: "INVALID_TOKEN",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error al validar el token",
      error: "TOKEN_VALIDATION_ERROR",
    });
  }
};


export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "No autenticado",
        error: "NOT_AUTHENTICATED",
      });
    }

    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Roles requeridos: ${allowedRoles.join(", ")}`,
        error: "FORBIDDEN",
        yourRoles: req.user.roles,
      });
    }

    next();
  };
};


export const optionalJWT = (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  const authHeader = req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || !secret) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });
    const rawRoles = decoded[ROLE_CLAIM] || decoded.role || "User";
    req.user = {
      id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.sub,
      email: decoded[EMAIL_CLAIM] || decoded.email || null,
      roles: Array.isArray(rawRoles) ? rawRoles : [rawRoles],
    };
  } catch {
    req.user = null;
  }

  next();
};
