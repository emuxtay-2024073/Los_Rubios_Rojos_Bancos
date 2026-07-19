import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import { Role } from "../Models/role.model.js";
import { seedDatabase } from "../seeds/seedDatabase.js";

dotenv.config();

const normalizeMongoUri = (uri) => {
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
        return uri;
    }

    const parsed = new URL(uri);
    const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
    if (dbName && /[\s./\\"$]/.test(dbName)) {
        const safeDbName = dbName.replace(/[\s./\\"$]+/g, "_");
        console.warn(`Nombre de base MongoDB invalido "${dbName}". Usando "${safeDbName}".`);
        parsed.pathname = `/${safeDbName}`;
    }

    return parsed.toString();
};

export const connectDB = async () => {
    try {
        const defaultUri = "mongodb://127.0.0.1:27017/sistema_bancario";
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || defaultUri;
        if (uri.startsWith("mongodb+srv://")) {
            const dnsServers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1")
                .split(",")
                .map((server) => server.trim())
                .filter(Boolean);
            dns.setServers(dnsServers);
        }

        console.log(`Conectando a MongoDB usando: ${uri.startsWith('mongodb+srv') ? 'mongodb+srv URI (DNS SRV)' : uri}`);
        await mongoose.connect(uri);

        console.log("¡Base de datos conectada!");

        // Limpiar colecciones para evitar conflictos en desarrollo
        console.log("Limpiando colecciones MongoDB para evitar conflictos...");
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
        console.log("Colecciones MongoDB limpiadas.");

        const roles = ["USER", "ADMIN", "SUPER_ADMIN"];
        for (const roleName of roles) {
            await Role.updateOne(
                { name: roleName },
                { name: roleName },
                { upsert: true }
            );
        }
        console.log("Roles inicializados correctamente");
        // Ejecutar seed para crear el SUPER_ADMIN inicial si no existen usuarios
        try {
            await seedDatabase();
        } catch (err) {
            console.error('Error ejecutando seed:', err.message);
        }

    } catch (error) {
        const defaultUri = "mongodb://127.0.0.1:27017/sistema_bancario";
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || defaultUri;

        console.error("Error al conectar a la base de datos:", error.message);
        if (uri.startsWith('mongodb+srv')) {
            console.warn('MongoDB SRV falló. Intentando fallback a conexión local en mongodb://127.0.0.1:27017/sistema_bancario');
            try {
                await mongoose.connect(defaultUri);
                console.log('¡Conectado a MongoDB local con éxito!');
                const roles = ["USER", "ADMIN", "SUPER_ADMIN"];
                for (const roleName of roles) {
                    await Role.updateOne(
                        { name: roleName },
                        { name: roleName },
                        { upsert: true }
                    );
                }
                console.log("Roles inicializados correctamente");
                try {
                    await seedDatabase();
                } catch (err) {
                    console.error('Error ejecutando seed:', err.message);
                }
                return;
            } catch (fallbackError) {
                console.error('Fallback a MongoDB local falló:', fallbackError.message);
            }
        }
        process.exit(1);
    }
};
