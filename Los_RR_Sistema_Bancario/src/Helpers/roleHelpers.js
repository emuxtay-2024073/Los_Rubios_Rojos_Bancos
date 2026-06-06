/**
 * Funciones helper para validar roles de usuario
 * Normalizan la comparación de roles para aceptar tanto 'ADMIN' como 'SUPER_ADMIN'
 */

/**
 * Verifica si el usuario tiene rol de administrador (ADMIN o SUPER_ADMIN)
 * @param {Object} user - Objeto de usuario con propiedad 'role' normalizado
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  if (!user || !user.role) return false;
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
};

/**
 * Verifica si el usuario tiene rol de SUPER_ADMIN
 * @param {Object} user - Objeto de usuario con propiedad 'role' normalizado
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  if (!user || !user.role) return false;
  return user.role === 'SUPER_ADMIN';
};

/**
 * Verifica si el usuario tiene alguno de los roles especificados
 * Funciona con array de roles o con la propiedad 'role' normalizada
 * @param {Object} user - Objeto de usuario
 * @param {Array|string} allowedRoles - Rol(es) permitido(s)
 * @returns {boolean}
 */
export const hasRole = (user, allowedRoles) => {
  if (!user) return false;
  
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  // Intenta primero con la propiedad 'role' normalizada
  if (user.role) {
    return roles.includes(user.role);
  }
  
  // Fallback: intenta con el array 'roles'
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.some(userRole => 
      roles.includes(String(userRole).toUpperCase())
    );
  }
  
  return false;
};
