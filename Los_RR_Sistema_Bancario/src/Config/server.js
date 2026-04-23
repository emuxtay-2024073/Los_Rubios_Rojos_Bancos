import app from "../app.js";
import { connectDB } from "./database.js";

const PORT = 3000;

connectDB();

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Documentación Swagger disponible en: http://localhost:${PORT}/api-docs`);
});
