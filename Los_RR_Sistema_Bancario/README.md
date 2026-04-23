# Sistema Bancario - Los Rezagados

## Nota
Este proyecto fue desarrollado con fines didácticos como parte del curso de **Taller de IN6AM de la jornada Matiutina**.  
Implementa una arquitectura basada en microservicios independientes, aplicando buenas prácticas de seguridad, autenticación y control de versiones.

---

## Descripción General

El **Sistema Bancario** es una aplicación backend basada en una arquitectura de microservicios, diseñada para administrar usuarios, autenticación segura, cuentas bancarias, transacciones y operaciones financieras.

El sistema combina tecnologías modernas como **ASP.NET Core (.NET 8)** para el servicio de autenticación y **Node.js** para los servicios de negocio bancario, permitiendo una solución escalable, mantenible y con una clara separación de responsabilidades.

---

## Arquitectura del Sistema

El sistema está dividido en microservicios independientes, cada uno responsable de una funcionalidad específica.

### Microservicios

### Authentication Service (.NET)
- Registro de usuarios
- Inicio de sesión
- Generación y validación de tokens JWT
- Verificación de roles y permisos
- Gestión de perfiles de usuario

### Banking Service (Node.js)
- Gestión de cuentas bancarias
- Operaciones de depósito y retiro
- Transferencias entre cuentas
- Historial de transacciones
- Conversión de divisas (según implementación)

---

## Tecnologías Utilizadas

### Backend
- ASP.NET Core 8 (.NET 8)
- Node.js
- Express
- PostgreSQL
- MongoDB
- Entity Framework Core
- JWT (JSON Web Token)
- BCrypt (encriptación de contraseñas)

### Herramientas de Desarrollo
- Git
- GitHub
- Postman
- Visual Studio
- Visual Studio Code
- Docker

---
## Documentación con Swagger

Ambos servicios incluyen documentación interactiva con Swagger/OpenAPI.

### Acceso a Swagger
- **Authentication Service (.NET):** `http://localhost:5000/swagger` (o el puerto configurado)
- **Banking Service (Node.js):** `http://localhost:3000/api-docs`

Descripción: Documentación completa de las APIs, incluyendo endpoints, parámetros, esquemas de respuesta y posibilidad de probar los endpoints directamente desde el navegador.

---

## Ejecución

### Node.js
1. Instalar dependencias:
   ```bash
   pnpm install
   ```
2. Ejecutar en modo desarrollo:
   ```bash
   pnpm run dev
   ```
3. Abrir Swagger en:
   ```bash
   http://localhost:3000/api-docs
   ```

### .NET
1. Abrir el proyecto `authentication-service/auth-service/AuthService.sln`.
2. Ejecutar la API y abrir Swagger en:
   ```bash
   http://localhost:5000/swagger
   ```

---

## Rutas Principales

### Públicas
| Método | Ruta                          | Descripción                     | Servicio |
| ------ | ----------------------------- | ------------------------------- | -------- |
| POST   | /api/auth/register            | Registro de usuario             | .NET & Node.js |
| POST   | /api/auth/login               | Inicio de sesión y obtención JWT | .NET & Node.js |

### Protegidas (requieren JWT)
| Método | Ruta                          | Descripción                     | Servicio |
| ------ | ----------------------------- | ------------------------------- | -------- |
| GET    | /api/auth/me                  | Obtener perfil del usuario      | .NET |
| GET    | /accounts                     | Listar cuentas (dependiendo del rol) | Node.js |
| POST   | /accounts/create              | Crear cuenta bancaria           | Node.js |
| POST   | /accounts/deposit             | Depositar dinero                | Node.js |
| POST   | /accounts/withdraw            | Retirar dinero                  | Node.js |
| GET    | /transactions                 | Listar transacciones            | Node.js |
| POST   | /transactions/transfer        | Realizar transferencia          | Node.js |

---

## Estructura General del Proyecto

Sistema-Bancario  
│  
├── authentication-service  
│   ├── Controllers   – manejo de endpoints de autenticación  
│   ├── Models        – entidades y modelos de usuario  
│   ├── Services      – lógica de autenticación y JWT  
│   ├── Middleware    – validaciones y seguridad  
│   └── Program.cs / appsettings.json  
├── src/  
│   ├── Controllers   – controladores de cuentas y transacciones  
│   ├── Models        – modelos de datos bancarios  
│   ├── Routes        – definición de rutas API  
│   ├── Services      – lógica de negocio bancario  
│   ├── Middleware    – validación JWT y roles  
│   └── Config        – configuración de base de datos y servidor  
└── docker-compose.yml – configuración de contenedores

---

### Authentication Service — .NET 8 (`localhost:5109`)

#### 1. Registrar Usuario
```
POST http://localhost:5109/api/auth/register
```
```json
{
  "username": "rezagados",
  "email": "lrezagados@kinal.edu.gt",
  "password": "Admin123!",
  "firstName": "Reza",
  "lastName": "Gados"
}
```

#### 2. Login (obtener Token JWT)
```
POST http://localhost:5109/api/auth/login
```
```json
{
  "email": "lrezagados@kinal.edu.gt",
  "password": "Admin123!"
}
```
> Copia el token devuelto — lo necesitarás en todas las rutas siguientes.

#### 3. Ver perfil y roles
```
GET http://localhost:5109/api/auth/me
```
> Requiere token en el header: `Authorization: Bearer <token>`

---

### Banking Services — Node.js (`localhost:3000`)

> Todas las rutas requieren el token del login en el header: `Authorization: Bearer <token>`

#### 4. Crear Cuenta de Ahorro
```
POST http://localhost:3000/accounts/create
```
```json
{
  "type": "ahorro"
}
```

#### 5. Crear Cuenta Monetaria
```
POST http://localhost:3000/accounts/create
```
```json
{
  "type": "monetaria"
}
```

#### 6. Ver Cuentas
```
GET http://localhost:3000/accounts
```

#### 7. Depositar Dinero
```
POST http://localhost:3000/accounts/deposit
```
```json
{
  "accountId": "69a3c924bc757346fa89ff01",
  "amount": 5000
}
```
> Reemplaza `accountId` con el ID de tu cuenta.

#### 8. Retirar Dinero
```
POST http://localhost:3000/accounts/withdraw
```
```json
{
  "accountId": "69a3c924bc757346fa89ff01",
  "amount": 5000
}
```
> Reemplaza `accountId` con el ID de tu cuenta.

#### 9. Transferir Dinero
```
POST http://localhost:3000/transactions/transfer
```
```json
{
  "fromAccountId": "69a3c924bc757346fa89ff01",
  "toAccountId": "69a3c863bc757346fa89fefd",
  "amount": 500
}
```
> Reemplaza ambos IDs con los de las cuentas origen y destino.

#### 10. Historial de Transacciones
```
GET http://localhost:3000/transactions
```

---

##  Estructura del Repositorio

```plaintext
Los-Rezagados-Sistema-Bancario
│
├── authentication-service/   # Microservicio en .NET 8 (Auth & Users)
│   ├── auth-service/
│      ├── src/
│              ├── AuthService.Api/
│              ├── AuthService.Application/
│              ├── AuthService.Persistence/ # Mapeo de DB (PostgreSQL)
│              └── AuthService.Domain/
│   ├── pg/
│       └── docker-compose.yml
│   

├── ├── node_modules          # Microservicios en Node.js
│   └── src/
│       ├── Config/
│       ├── Controllers/
│       ├── Middleware/
│       ├── Models/
│       ├── Routes/
│       ├── services/
│       ├── app.js/
│       └── server.js/
│

```

---

## Estado del Proyecto

| Módulo | Estado |
|---|---|
| Arquitectura | 100% Implementada |
| Seguridad (JWT & RBAC) | Funcional |
| Base de Datos (Docker) | Migraciones ejecutadas y contenedor listo |
| Base de Datos (MongoDB) | Migraciones ejecutadas  |
| Limpieza de Código | 100% libre de archivos temporales y binarios |

---

## Autores

**Equipo:** Los Rezagados
**Curso:** Taller de IN6AM — Jornada Matutina
