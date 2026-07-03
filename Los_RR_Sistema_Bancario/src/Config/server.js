import app from "../app.js";
import { connectDB } from "./database.js";
import { connectPostgres } from "./postgres.js";
import { seedPostgres } from "../seeds/seedPostgres.js";

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        // Conectar a MongoDB para otros datos (primero, ya que seedPostgres lo necesita)
        await connectDB();

        // Conectar a PostgreSQL para usuarios
        await connectPostgres();

        // Ejecutar seed de PostgreSQL (después de conectar MongoDB)
        await seedPostgres();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
})();
