import dotenv from 'dotenv';
import express from 'express';
import connectDB from './database.js';
import authRoutes from '../routes/auth.routes.js';
import accountRoutes from '../routes/account.routes.js';

dotenv.config();

const app = express();

// Conectar a la base de datos
connectDB();

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: "Sistema Bancario funcionando ✅" });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: "Ruta no encontrada" });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});