import type { SecurityEventRepository, SecurityEventType } from "../../domain/securityEvent";

export interface RecordSecurityEventInput {
  userId: string;
  eventType: SecurityEventType;
}

// FR-038: registra internamente eventos de seguridad relevantes (login fallido,
// bloqueo temporal, acceso cruzado denegado). FR-040: sin ruta pública asociada — este
// módulo nunca gana una carpeta interface/.
export async function recordSecurityEvent(
  repository: SecurityEventRepository,
  input: RecordSecurityEventInput,
): Promise<void> {
  await repository.record(input.userId, input.eventType);
}
