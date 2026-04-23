import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

if (mongoose.models.Role) {
  delete mongoose.models.Role;
}


export const Role = mongoose.models.Role || mongoose.model("Role", roleSchema);
