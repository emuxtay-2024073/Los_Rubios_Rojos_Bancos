import { DataTypes } from 'sequelize';
import sequelize from '../Config/postgres.js';
import bcrypt from 'bcryptjs';
 
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: 'Id',
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'Username',
    validate: {
      len: [3, 30],
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    lowercase: true,
    field: 'Email',
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'PasswordHash',          // was 'Password' — DB column is PasswordHash
    validate: {
      len: [6, 255],
    },
  },
  role: {
    type: DataTypes.STRING(20),
    defaultValue: 'USER',
    allowNull: false,
    field: 'Role',
    validate: {
      isIn: [['USER', 'ADMIN', 'SUPER_ADMIN']],
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'IsActive',
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'LastLogin',
  },
  isDisabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'IsDisabled',
  },
  disabledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DisabledAt',            // was 'DeactivatedAt'
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'FailedLoginAttempts',
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'IsLocked',
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'EmailConfirmed',        // was 'EmailVerified'
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'VerificationToken',     // was 'EmailVerificationToken'
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'ResetToken',            // was 'PasswordResetToken'
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'ResetTokenExpires',     // was 'PasswordResetExpires'
  },
  accountType: {
    type: DataTypes.STRING(20),
    defaultValue: 'ahorro',
    field: 'AccountType',
    validate: {
      isIn: [['ahorro', 'monetaria', 'corriente']],
    },
  },
  dpi: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'Dpi',
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'PhoneNumber',
  },
  lastPasswordChangeAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'LastPasswordChangeAt',
  },
  disabilityReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'DisabilityReason',
  },
  disableRequestReason: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'DisableRequestReason',
  },
  disableRequestedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'DisableRequestedAt',
  },
  hasDisableRequest: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'HasDisableRequest',
  },
}, {
  timestamps: true,
  freezeTableName: true,
  tableName: 'User',
  underscored: false,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});
 
// Métodos de instancia
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};
 
User.prototype.recordFailedLogin = async function() {
  this.failedLoginAttempts += 1;
 
  if (this.failedLoginAttempts >= 5) {
    this.isLocked = true;
  }
 
  await this.save();
};
 
User.prototype.recordSuccessfulLogin = async function() {
  this.lastLogin = new Date();
  this.failedLoginAttempts = 0;
 
  if (this.isLocked) {
    this.isLocked = false;
  }
 
  await this.save();
};
 
export default User;
 