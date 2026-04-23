import mongoose from "mongoose";

/**
 * Modelo de Beneficiarios/Cuentas Favoritas
 * 
 * Permite a los usuarios guardar cuentas de otros usuarios como favoritas
 * para realizar transferencias rápidas y frecuentes sin necesidad de 
 * recordar el número de cuenta completo o el ID de la cuenta.
 * 
 * @typedef {Object} Beneficiary
 * @property {ObjectId} userId - ID del usuario dueño del beneficiario
 * @property {string} name - Nombre personalizado del beneficiario
 * @property {ObjectId} accountId - ID de la cuenta destino del beneficiario
 * @property {string} accountNumber - Número de cuenta del beneficiario (referencia)
 * @property {string} description - Descripción opcional del beneficiario
 * @property {boolean} isFavorite - Indicador de si es cuenta favorita
 * @property {Date} addedAt - Fecha de creación del beneficiario
 */
const beneficiarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
      // Referencia rápida sin hacer lookup a Account
    },
    description: {
      type: String,
      maxlength: 200,
      default: "",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Índice para búsquedas rápidas: usuario + favoritos
beneficiarySchema.index({ userId: 1, isFavorite: -1 });

// Validar que el usuario no agregue su propia cuenta como beneficiario
beneficiarySchema.pre("save", async function () {
  if (this.isNew) {
    const Account = mongoose.model("Account");
    const account = await Account.findById(this.accountId);
    
    if (account && account.userId === this.userId.toString()) {
      throw new Error(
        "No puedes agregar tu propia cuenta como beneficiario"
      );
    }
  }
});

export const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);
