import mongoose from "mongoose";
import { Role } from "../models/role.model.js"; 

export const connectDB = async () => {
    try {
        // Conectar a MongoDB local
        await mongoose.connect("mongodb://127.0.0.1:27017/sistema_bancario", {});

        console.log("¡Base de datos local conectada!");

        // Crear roles por defecto (sin error si ya existen)
        const roles = ["User", "Admin"];
        for (const roleName of roles) {
            await Role.updateOne(
                { name: roleName },
                { name: roleName },
                { upsert: true }
            );
        }
        console.log("Roles inicializados correctamente");

    } catch (error) {
        console.log("Error al conectar a la base de datos:", error.message);
        process.exit(1); 
    }
};