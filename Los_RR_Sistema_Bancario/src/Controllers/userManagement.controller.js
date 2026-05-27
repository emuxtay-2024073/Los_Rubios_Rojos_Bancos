import { User } from "../Models/user.model.js";
import bcrypt from "bcryptjs";
import { createAuditLog } from "../Services/log.service.js";

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

    const user = await User.findById(userId).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
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

    const user = await User.findById(userId);

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
      const existingUser = await User.findOne({
        email: emailLower,
        _id: { $ne: userId },
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
      user: {
        id: user._id,
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

    const user = await User.findById(userId).select('+password');

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

    // Actualizar contraseña (se hashea automáticamente en el pre-save hook)
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
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden ver datos de otros usuarios",
      });
    }

    const { id } = req.params;

    const user = await User.findById(id).select("-password -__v");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    res.json({
      success: true,
      user,
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
    // Validar que sea admin
    const isAdmin = req.user.roles.some(role => role.toLowerCase() === 'admin');
    if (!isAdmin) {
      return res.status(403).json({
        message: "Solo administradores pueden listar usuarios",
      });
    }

    const { role, isActive, search, limit = 20, skip = 0 } = req.query;

    let query = {};

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === "true";

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-password -__v")
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
      users,
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
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden cambiar roles",
      });
    }

    const { id } = req.params;
    const { newRole } = req.body;

    const validRoles = ["Cliente", "Admin"];

    if (!newRole || !validRoles.includes(newRole)) {
      return res.status(400).json({
        message: `El rol debe ser uno de: ${validRoles.join(", ")}`,
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { returnDocument: 'after' }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    await createAuditLog({
      userId: req.user.id,
      username: req.user.email || null,
      email: req.user.email || null,
      action: 'user.changeRole',
      entityType: 'User',
      entityId: user._id.toString(),
      ip: req.ip,
      meta: {
        newRole,
        changedBy: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "Rol actualizado exitosamente",
      user,
    });
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
    const isAdmin = req.user.roles.some(role => role.toLowerCase() === 'admin');
    const isOwnAccount = id === requesterId;

    if (!isAdmin && !isOwnAccount) {
      return res.status(403).json({
        message: "No tienes permiso para desactivar esta cuenta",
      });
    }

    // Obtener el usuario con su contraseña
    const user = await User.findById(id).select('+password');

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    // Validar la contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Contraseña incorrecta",
      });
    }

    // Desactivar la cuenta
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive: false, deactivatedAt: new Date() },
      { returnDocument: 'after' }
    ).select("-password");

    await createAuditLog({
      userId: req.user.id,
      username: req.user.email || null,
      email: req.user.email || null,
      action: 'user.deactivate',
      entityType: 'User',
      entityId: updatedUser._id.toString(),
      ip: req.ip,
      meta: {
        targetUserId: id,
        performedBy: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "Cuenta desactivada exitosamente",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        isActive: updatedUser.isActive,
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
    if (!req.user.roles.some(role => role.toLowerCase() === 'admin')) {
      return res.status(403).json({
        message: "Solo administradores pueden reactivar cuentas",
      });
    }

    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true, deactivatedAt: null },
      { returnDocument: 'after' }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Usuario no encontrado",
      });
    }

    await createAuditLog({
      userId: req.user.id,
      username: req.user.email || null,
      email: req.user.email || null,
      action: 'user.reactivate',
      entityType: 'User',
      entityId: user._id.toString(),
      ip: req.ip,
      meta: {
        targetUserId: id,
        performedBy: req.user.id,
      },
    });

    res.json({
      success: true,
      message: "Cuenta reactivada exitosamente",
      user,
    });
  } catch (error) {
    console.error("Error al reactivar cuenta:", error);
    res.status(500).json({
      message: "Error al reactivar cuenta",
      error: error.message,
    });
  }
};
