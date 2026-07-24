import mongoose from "mongoose";

// FR-052/research.md §16: coordina escrituras a más de una colección (transactions +
// money_sources) como una única operación atómica. Requiere que MongoDB esté configurado
// como replica set, aunque sea de un solo nodo (ver backend/README.md).
export async function runInDbTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  let result: T;

  try {
    await session.withTransaction(async () => {
      result = await fn(session);
    });
  } finally {
    await session.endSession();
  }

  return result!;
}
