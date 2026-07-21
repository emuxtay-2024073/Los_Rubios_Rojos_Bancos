import mongoose from "mongoose";
import PostgresUser from "../Models/user.model.postgres.js";
import sequelize from "../Config/postgres.js";
import bcrypt from "bcryptjs";
import { createAuditLog } from "../services/log.service.js";

const normalizeRole = (r) => String(r || '').toUpperCase().replace(/[-_\s]/g, '');

const isAdminRole = (r) => {
  const n = normalizeRole(r);
  return n === 'ADMIN' || n === 'SUPERADMIN';
};

const isSuperAdminRole = (r) => normalizeRole(r) === 'SUPERADMIN';

/**
 * CONTROLADOR DE GESTIÓN DE USUARIOS MEJORADO
 * 
 * Proporciona funcionalidades completas de gestión de perfiles de usuario,
 * incluyendo cambio de contraseña, actualización de perfil, suspensión de cuentas, etc.
 */

/**
 * Obtener perfil del usuario autenticado
 * 
 * @param {Request} req - Usuario autenticado en req.user
 * @param {Response} res - Respuesta JSON con datos del usuario
 */
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await PostgresUser.findByPk(userId, {
      attributes: { exclude: ['password', 'PasswordHash'] }
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({
      message: "Error al obtener perfil",
      error: error.message,
    });
  }
};

/**
 * Actualizar perfil del usuario
 * 
 * @param {Request} req - Datos actualizables: { username, email }
 * @param {Response} res - Respuesta JSON
 * 
 * Validaciones:
 * - Email único en el sistema
 * - Username entre 3-30 caracteres
 * - No se puede cambiar el role por este endpoint
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    const user = await PostgresUser.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Validar y actualizar username
    if (username) {
      if (username.trim().length < 3 || username.trim().length > 30) {
        return res.status(400).json({
          message: "El nombre de usuario debe tener entre 3 y 30 caracteres",
        });
      }
      user.username = username.trim();
    }

    // Validar y actualizar email
    if (email) {
      const emailLower = email.toLowerCase();
      
      // Verificar unicidad
      const existingUser = await PostgresUser.findOne({
        where: {
          email: emailLower,
          id: { [sequelize.Op.ne]: userId },
        },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Este email ya está registrado por otro usuario",
        });
      }

      // Validar formato básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailLower)) {
        return res.status(400).json({
          message: "Formato de email inválido",
        });
      }

      user.email = emailLower;
    }

    await user.save();

    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({
      message: "Error al actualizar perfil",
      error: error.message,
    });
  }
};

/**
 * Cambiar contraseña del usuario
 * 
 * @param {Request} req - Datos: { currentPassword, newPassword, confirmPassword }
 * @param {Response} res - Respuesta JSON
 * 
 * Validaciones:
 * - Contraseña actual correcta
 * - Nueva contraseña diferente a la anterior
 * - Confirmación de contraseña coincide
 * - Contraseña mínimo 6 caracteres
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message:
          "currentPassword, newPassword y confirmPassword son obligatorios",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    const user = await PostgresUser.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "La contraseña actual es incorrecta",
      });
    }

    // Validar que la nueva sea diferente
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: "La nueva contraseña debe ser diferente a la actual",
      });
    }

    // Actualizar contraseña (se hashea automáticamente en el beforeUpdate hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      message: "Error al cambiar contraseña",
      error: error.message,
    });
  }
};

/**
 * Obtener usuario por ID (ADMIN)
 * 
 * @param {Request} req - ID del usuario en URL
 * @param {Response} res - Respuesta JSON
 */
export const getUserById = async (req, res) => {
  try {
    const allowed = req.user.roles?.some(role => isAdminRole(role)) || isAdminRole(req.user.role);
    if (!allowed) {
      return res.status(403).json({
        message: "Solo administradores pueden ver datos de otros usuarios",
      });
    }

    const { id } = req.params;

    const user = await PostgresUser.findByPk(id, {
      attributes: { exclude: ['password', 'PasswordHash'] }
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      message: "Error al obtener usuario",
      error: error.message,
    });
  }
};

/**
 * Listar todos los usuarios (ADMIN)
 * 
 * @param {Request} req - Filtros: { role, isActive, search, limit, skip }
 * @param {Response} res - Respuesta JSON
 */
export const getAllUsers = async (req, res) => {
  try {
    const allowed = req.user.roles?.some(role => isAdminRole(role)) || isAdminRole(req.user.role);
    if (!allowed) {
      return res.status(403).json({
        message: "Solo administradores pueden listar usuarios",
      });
    }

    const { role, isActive, search, limit = 20, skip = 0 } = req.query;

    let where = {};

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === "true";

    if (search) {
      where[sequelize.Op.or] = [
        { username: { [sequelize.Op.iLike]: `%${search}%` } },
        { email: { [sequelize.Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await PostgresUser.findAll({
      where,
      attributes: { exclude: ['password', 'PasswordHash'] },
      limit: parseInt(limit),
      offset: parseInt(skip),
      order: [['createdAt', 'DESC']],
    });

    const total = await PostgresUser.count({ where });

    res.json({
      success: true,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      data: users,
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({
      message: "Error al listar usuarios",
      error: error.message,
    });
  }
};

/**
 * Cambiar rol de usuario (ADMIN)
 * 
 * @param {Request} req - ID del usuario y nuevo rol
 * @param {Response} res - Respuesta JSON
 * 
 * Validaciones:
 * - Roles válidos: Cliente, Admin
 */
export const changeUserRole = async (req, res) => {
  try {
    // Solo SUPER_ADMIN puede cambiar roles
    const isSuper = req.user.roles?.some(role => isSuperAdminRole(role)) || isSuperAdminRole(req.user.role);
    if (!isSuper) {
      return res.status(403).json({
        message: "Solo SUPER_ADMIN puede cambiar roles",
      });
    }

    const { id } = req.params;
    const { newRole } = req.body;

    if (!id) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    if (!newRole) {
      return res.status(400).json({ message: "El campo newRole es requerido" });
    }

    // Normalizar newRole a valores canónicos
    const nr = normalizeRole(newRole);
    let canonicalNewRole = null;
    if (nr === 'SUPERADMIN') canonicalNewRole = 'SUPER_ADMIN';
    else if (nr === 'ADMIN') canonicalNewRole = 'ADMIN';
    else if (nr === 'USER' || nr === 'CLIENTE' || nr === 'USUARIO') canonicalNewRole = 'USER';
    else {
      return res.status(400).json({ message: "Rol inválido. Valores permitidos: USER, ADMIN, SUPER_ADMIN" });
    }

    const targetUser = await PostgresUser.findByPk(id);
    if (!targetUser) return res.status(404).json({ message: 'Usuario no encontrado' });

    const targetIsSuper = isSuperAdminRole(targetUser.role);
    const demotingSuper = targetIsSuper && canonicalNewRole !== 'SUPER_ADMIN';
    if (demotingSuper) {
      const superCount = await PostgresUser.count({ where: { role: 'SUPER_ADMIN' } });
      if (superCount <= 1) {
        return res.status(400).json({ message: 'No se puede remover el último SUPER_ADMIN del sistema' });
      }
    }

    targetUser.role = canonicalNewRole;
    await targetUser.save();

    await createAuditLog({
      userId: req.user.id,
      username: req.user.email || null,
      email: req.user.email || null,
      action: 'user.changeRole',
      entityType: 'User',
      entityId: targetUser.id,
      ip: req.ip,
      meta: {
        newRole: canonicalNewRole,
        changedBy: req.user.id,
      },
    });

    const returned = targetUser.toJSON();
    delete returned.password;

    res.json({ success: true, message: 'Rol actualizado exitosamente', data: returned });
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    res.status(500).json({
      message: "Error al cambiar rol",
      error: error.message,
    });
  }
};

/**
 * Desactivar/Suspender una cuenta (ADMIN o usuario mismo)
 * 
 * @param {Request} req - ID del usuario
 * @param {Response} res - Respuesta JSON
 * 
 * Un usuario puede desactivar su propia cuenta,
 * o un admin puede desactivar cualquier cuenta.
 */
export const deactivateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const requesterId = req.user.id;

    // Verificar que se proporcionó la contraseña
    if (!password) {
      return res.status(400).json({
        message: "La contraseña es requerida para desactivar la cuenta",
      });
    }

    // Verificar permisos
    const userIsAdmin = req.user.roles?.some(role => isAdminRole(role)) || isAdminRole(req.user.role);
    const isOwnAccount = id === requesterId;

    if (!userIsAdmin && !isOwnAccount) {
      return res.status(403).json({
        message: "No tienes permiso para desactivar esta cuenta",
      });
    }

    // Obtener el usuario con su contraseña
    const user = await PostgresUser.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Validar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Contraseña incorrecta",
      });
    }

    // Desactivar la cuenta
    user.isActive = false;
    user.disabledAt = new Date();
    await user.save();

    await createAuditLog({
      userId: req.user.id,
      username: req.user.email || null,
      email: req.user.email || null,
      action: 'user.deactivate',
      entityType: 'User',
      entityId: user.id,
      ip: req.ip,
      meta: {
        targetUserId: id,
        performedBy: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "Cuenta desactivada exitosamente",
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error al desactivar cuenta:", error);
    res.status(500).json({
      message: "Error al desactivar cuenta",
      error: error.message,
    });
  }
};

/**
 * Reactivar una cuenta (ADMIN)
 * 
 * @param {Request} req - ID del usuario
 * @param {Response} res - Respuesta JSON
 */
export const reactivateAccount = async (req, res) => {
  try {
    if (!(req.user.roles?.some(role => isAdminRole(role)) || isAdminRole(req.user.role))) {
      return res.status(403).json({
        message: "Solo administradores pueden reactivar cuentas",
      });
    }

    const { id } = req.params;

    const user = await PostgresUser.findByPk(id);

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    user.isActive = true;
    user.disabledAt = null;
    await user.save();

    await createAuditLog({
      userId: req.user.id,
      username: req.user.email || null,
      email: req.user.email || null,
      action: 'user.reactivate',
      entityType: 'User',
      entityId: user.id,
      ip: req.ip,
      meta: {
        targetUserId: id,
        performedBy: req.user.id,
      },
    });

    const userData = user.toJSON();
    delete userData.password;

    res.json({
      success: true,
      message: "Cuenta reactivada exitosamente",
      data: userData,
    });
  } catch (error) {
    console.error("Error al reactivar cuenta:", error);
    res.status(500).json({
      message: "Error al reactivar cuenta",
      error: error.message,
    });
  }
};
