import app from "../app.js";
import { connectDB } from "./database.js";
import { seedDatabase } from "../seeds/seedDatabase.js";

const PORT = process.env.PORT || 3000;

(async () => {
    await connectDB();
    
    // Ejecutar seed para generar datos de prueba
    try {
        await seedDatabase();
    } catch (error) {
        console.error("Error durante el seed:", error);
    }

    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
        console.log(`Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
    });
})();
