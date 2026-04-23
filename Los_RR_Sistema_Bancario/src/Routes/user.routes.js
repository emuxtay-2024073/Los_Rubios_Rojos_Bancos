import express from "express";
import { createUser, getUsers } from "../Controllers/user.controller.js";

const router = express.Router();

// Crear usuario
router.post("/", createUser);

// Obtener todos los usuarios
router.get("/", getUsers);

export default router;
