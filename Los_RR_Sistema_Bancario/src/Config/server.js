import app from "../app.js";
import { connectDB } from "./database.js";
import { connectPostgres } from "./postgres.js";

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        // Conectar a PostgreSQL para usuarios
        await connectPostgres();
        
        // Conectar a MongoDB para otros datos
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error("Error al iniciar el servidor:", error);
        process.exit(1);
    }
})();
