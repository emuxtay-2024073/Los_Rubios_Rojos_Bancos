import app from "../app.js";
import { connectDB } from "./database.js";

const PORT = process.env.PORT || 3000;

(async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
        console.log(`Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
    });
})();
