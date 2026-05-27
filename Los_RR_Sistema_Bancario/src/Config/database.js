import mongoose from "mongoose";
import dotenv from "dotenv";
import { Role } from "../Models/role.model.js";

dotenv.config();

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sistema_bancario";
        await mongoose.connect(uri);

        console.log("¡Base de datos conectada!");

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
        console.error("Error al conectar a la base de datos:", error.message);
        process.exit(1);
    }
};