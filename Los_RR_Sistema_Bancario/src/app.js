import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./Routes/authroutes.js";
import accountRoutes from "./Routes/account.routes.js";
import transactionRoutes from "./Routes/transaction.routes.js";
import beneficiaryRoutes from "./Routes/beneficiary.routes.js";
import transactionLimitRoutes from "./Routes/transactionLimit.routes.js";
import reversalRoutes from "./Routes/reversal.routes.js";
import currencyRoutes from "./Routes/currency.routes.js";
import userRoutes from "./Routes/user.routes.js";
import { errorHandler } from "./Middleware/errorHandler.js";

dotenv.config();

const app = express();

const buildCorsOrigins = () => {
  const rawOrigins = [
    process.env.CORS_ORIGINS,
    process.env.ALLOWED_ORIGINS,
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  return rawOrigins.length > 0 ? [...new Set([...rawOrigins, ...defaultOrigins])] : defaultOrigins;
};

const corsOrigins = buildCorsOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`\n=== Incoming Request ===`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log(`Content-Type: ${req.get('Content-Type')}`);
  console.log(`Body:`, req.body);
  console.log(`=====================\n`);
  next();
});

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
  // Mostrar todas las rutas, incluyendo auth si es necesario
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
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/limits", transactionLimitRoutes);
app.use("/api/reversals", reversalRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
});

app.use(errorHandler);

export default app;


