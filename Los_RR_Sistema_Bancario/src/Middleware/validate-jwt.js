import jwt from "jsonwebtoken";
 
// Claims de .NET (nombres completos de Microsoft) — mantenidos por compatibilidad
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const EMAIL_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress";
const NAMEID_CLAIM = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
 
/**
 * Normaliza un rol a su forma canónica.
 * Acepta cualquier variante: "Admin", "ADMIN", "admin", "Cliente", "User", etc.
 */
const mapToCanonical = (r) => {
    if (!r) return null;
    const s = String(r).toLowerCase().replace(/[-_\s]/g, '');
    if (s.includes('superadmin') || s.includes('super')) return 'SUPER_ADMIN';
    if (s.includes('admin')) return 'ADMIN';
    if (s.includes('cliente') || s.includes('user') || s.includes('usuario')) return 'USER';
    // Fallback: devolver en mayúsculas
    return String(r).toUpperCase();
};
 
/**
 * Middleware principal — Valida JWT generado por el backend Node.
 * Header esperado: Authorization: Bearer <TOKEN>
 */
export const validateJWT = (req, res, next) => {
    const secret = process.env.JWT_SECRET;
 
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
 
        // ── Extraer roles ──────────────────────────────────────────────
        // Soporta: claim .NET largo, "role" (string), "roles" (array)
        const rawRoles = decoded[ROLE_CLAIM] || decoded.roles || decoded.role || "USER";
        const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
        const normalizedRoles = Array.from(new Set(roles.map(mapToCanonical).filter(Boolean)));
 
        // ── Extraer userId ─────────────────────────────────────────────
        // Orden de prioridad: sub → claim .NET largo → id → userId → oid
        const userId =
            decoded.sub ||
            decoded[NAMEID_CLAIM] ||
            decoded.id ||
            decoded.userId ||
            decoded.oid;
 
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
            email: decoded.email || decoded[EMAIL_CLAIM] || null,
            roles: normalizedRoles,
            // "role" singular: el más privilegiado del array
            role: normalizedRoles.includes('SUPER_ADMIN')
                ? 'SUPER_ADMIN'
                : normalizedRoles.includes('ADMIN')
                    ? 'ADMIN'
                    : (normalizedRoles[0] || 'USER'),
            jti: decoded.jti || null,
            accountType: decoded.accountType || 'ahorro',
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
        console.log(`\n[requireRole] Verificando acceso a ruta: ${req.path}`);
        console.log(`[requireRole] Usuario ID: ${req.user?.id}`);
        console.log(`[requireRole] req.user:`, JSON.stringify(req.user, null, 2));
        
        if (!req.user) {
            console.error(`[requireRole] No autenticado`);
            return res.status(401).json({
                success: false,
                message: "No autenticado",
                error: "NOT_AUTHENTICATED",
            });
        }
 
        // Fallback: si no existe roles array, crear uno desde role singular
        let userRoles = req.user.roles;
        if (!Array.isArray(userRoles) && req.user.role) {
            userRoles = [req.user.role];
        }
        
        console.log(`[requireRole] req.user.roles:`, req.user.roles);
        console.log(`[requireRole] userRoles (después fallback):`, userRoles);
        console.log(`[requireRole] Array.isArray(userRoles):`, Array.isArray(userRoles));
        
        if (!userRoles || !Array.isArray(userRoles)) {
            console.error(`[requireRole] Roles inválidos para usuario: ${req.user.id}. Got:`, userRoles);
            return res.status(403).json({
                success: false,
                message: "Roles no definidos correctamente",
                error: "INVALID_ROLES",
            });
        }
 
        const allowed = allowedRoles.map((r) => String(r).toLowerCase());
        const hasRole = userRoles.some((r) => allowed.includes(String(r).toLowerCase()));
        
        console.log(`[requireRole] Roles permitidos:`, allowedRoles);
        console.log(`[requireRole] Roles permitidos (lowercase):`, allowed);
        console.log(`[requireRole] Roles del usuario:`, userRoles);
        console.log(`[requireRole] ¿Tiene permiso?:`, hasRole);
 
        if (!hasRole) {
            console.error(
                `[requireRole] Acceso denegado. Usuario: ${req.user.id}, ` +
                `Roles: ${userRoles.join(', ')}, Requeridos: ${allowedRoles.join(', ')}`
            );
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`,
                error: "FORBIDDEN",
                yourRoles: userRoles,
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
            issuer: process.env.JWT_ISSUER || 'SistemaBancario',
            audience: process.env.JWT_AUDIENCE || 'BankingAPI',
        });
        const rawRoles = decoded[ROLE_CLAIM] || decoded.roles || decoded.role || "USER";
        const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
        const normalizedRoles = Array.from(new Set(roles.map(mapToCanonical).filter(Boolean)));
        req.user = {
            id: decoded.sub || decoded[NAMEID_CLAIM] || decoded.id || decoded.userId,
            email: decoded.email || decoded[EMAIL_CLAIM] || null,
            roles: normalizedRoles,
            role: normalizedRoles.includes('SUPER_ADMIN')
                ? 'SUPER_ADMIN'
                : normalizedRoles.includes('ADMIN')
                    ? 'ADMIN'
                    : (normalizedRoles[0] || 'USER'),
        };
    } catch {
        req.user = null;
    }
 
    next();
};
 