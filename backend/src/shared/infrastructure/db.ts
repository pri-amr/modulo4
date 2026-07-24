import mongoose from "mongoose";

// Cifrado en reposo (FR-034): se asume motor de almacenamiento cifrado o cifrado
// gestionado por el proveedor a nivel de la instancia/volumen de MongoDB (research.md §4);
// esta conexión no agrega cifrado a nivel de campo.
export async function connectToDatabase(mongoUri: string): Promise<typeof mongoose> {
  return mongoose.connect(mongoUri);
}

export async function disconnectFromDatabase(): Promise<void> {
  await mongoose.disconnect();
}
