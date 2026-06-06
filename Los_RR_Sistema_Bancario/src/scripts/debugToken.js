import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Token de ejemplo (reemplaza con uno real del navegador)
const token = process.argv[2];

if (!token) {
  console.log('USO: node debugToken.js <TOKEN>');
  console.log('\nPasos:');
  console.log('1. Abre el navegador con DevTools (F12)');
  console.log('2. Consola → localStorage.getItem("token")');
  console.log('3. Copia el token (sin comillas)');
  console.log('4. Ejecuta: node src/scripts/debugToken.js <TOKEN>');
  process.exit(1);
}

try {
  const secret = process.env.JWT_SECRET || 'tu_secreto_aqui';
  
  console.log('\n=== DECODIFICANDO TOKEN ===\n');
  
  const decoded = jwt.verify(token, secret, {
    issuer: process.env.JWT_ISSUER || 'SistemaBancario',
    audience: process.env.JWT_AUDIENCE || 'BankingAPI',
  });
  
  console.log('Token válido ✓\n');
  console.log('Contenido del token:');
  console.log(JSON.stringify(decoded, null, 2));
  
  console.log('\n=== ANÁLISIS DE ROLES ===\n');
  
  const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
  
  const role = decoded.role;
  const roles = decoded.roles;
  const roleClaim = decoded[ROLE_CLAIM];
  
  console.log(`decoded.role: ${role}`);
  console.log(`decoded.roles: ${roles}`);
  console.log(`decoded[ROLE_CLAIM]: ${roleClaim}`);
  
  console.log('\n=== NORMALIZACIÓN (simulada) ===\n');
  
  const mapToCanonical = (r) => {
    if (!r) return null;
    const s = String(r).toLowerCase().replace(/[-_\s]/g, '');
    if (s.includes('superadmin') || s.includes('super')) return 'SUPER_ADMIN';
    if (s.includes('admin')) return 'ADMIN';
    if (s.includes('cliente') || s.includes('user') || s.includes('usuario')) return 'USER';
    return String(r).toUpperCase();
  };
  
  const rawRoles = roleClaim || roles || role || "USER";
  const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  const normalizedRoles = Array.from(new Set(rolesArray.map(mapToCanonical).filter(Boolean)));
  
  console.log(`rawRoles: ${JSON.stringify(rawRoles)}`);
  console.log(`rolesArray: ${JSON.stringify(rolesArray)}`);
  console.log(`normalizedRoles: ${JSON.stringify(normalizedRoles)}`);
  
  console.log('\n=== VERIFICACIÓN DE PERMISOS ===\n');
  
  const requiredRoles = ['ADMIN', 'SUPER_ADMIN'];
  const allowed = requiredRoles.map((r) => String(r).toLowerCase());
  const hasRole = normalizedRoles.some((r) => allowed.includes(String(r).toLowerCase()));
  
  console.log(`Roles requeridos: ${requiredRoles.join(', ')}`);
  console.log(`Roles normalizados en minúsculas: ${allowed.join(', ')}`);
  console.log(`Tu rol normalizado: ${normalizedRoles.join(', ')}`);
  console.log(`¿Tienes permiso?: ${hasRole ? '✓ SÍ' : '✗ NO'}`);
  
} catch (err) {
  console.error('\n❌ ERROR al decodificar token:');
  console.error(err.message);
  
  if (err.name === 'TokenExpiredError') {
    console.log('\n⚠️  Token expirado. Inicia sesión de nuevo.');
  } else if (err.name === 'JsonWebTokenError') {
    console.log('\n⚠️  Token inválido o corrupto.');
  }
}
