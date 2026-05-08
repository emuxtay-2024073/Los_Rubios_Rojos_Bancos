import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { connectDB } from "./Config/database.js";

import authRoutes from "./Routes/authroutes.js";
import accountRoutes from "./Routes/account.routes.js";
import transactionRoutes from "./Routes/transaction.routes.js";
import beneficiaryRoutes from "./Routes/beneficiary.routes.js";
import transactionLimitRoutes from "./Routes/transactionLimit.routes.js";
import reversalRoutes from "./Routes/reversal.routes.js";
import currencyRoutes from "./Routes/currency.routes.js";
import userRoutes from "./Routes/user.routes.js";

dotenv.config();

console.log("SECRET:", process.env.JWT_SECRET);
console.log("LENGTH:", process.env.JWT_SECRET?.length);
console.log("ISSUER:", process.env.JWT_ISSUER);
console.log("AUDIENCE:", process.env.JWT_AUDIENCE);

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

connectDB();

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sistema Bancario API",
      version: "1.0.0",
      description: "API REST para operaciones bancarias seguras",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de desarrollo",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenido al hacer login en /api/auth/login. Ingresa solo el token sin 'Bearer'",
        },
      },
    },
  },
  apis: ["./src/Routes/*.js"], // Archivos donde están las rutas con documentación
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Crear una copia filtrada del spec para ocultar rutas que no deben verse en Swagger
function filterSwaggerPaths(spec) {
  if (!spec || !spec.paths) return spec;
  const filtered = JSON.parse(JSON.stringify(spec));
  Object.keys(filtered.paths).forEach((p) => {
    // Ocultar solo autenticación y rutas de estado del Swagger de Node
    if (
      p.startsWith('/api/auth') ||
      p.startsWith('/auth') ||
      p.startsWith('/api/health')
    ) {
      delete filtered.paths[p];
    }
  });
  return filtered;
}

const swaggerSpecFiltered = filterSwaggerPaths(swaggerSpec);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecFiltered, {
  swaggerOptions: {
    persistAuthorization: true,
    displayOperationId: false,
  },
  customCss: '.topbar { display: none }',
}));

app.get("/", (req, res) => {
    res.json({ 
        message: "Sistema Bancario - Node.js API",
        note: "Autenticación manejada por .NET AuthService",
        docs: "/api-docs"
    });
});

app.use("/api/auth", authRoutes);
app.use("/accounts", accountRoutes);
app.use("/transactions", transactionRoutes);
app.use("/beneficiaries", beneficiaryRoutes);
app.use("/limits", transactionLimitRoutes);
app.use("/reversals", reversalRoutes);
app.use("/currency", currencyRoutes);
app.use("/users", userRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Error interno del servidor", error: err.message });
});

export default app;


