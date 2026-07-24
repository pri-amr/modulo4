// FR-038: tipos de evento de seguridad relevantes a auditar.
export type SecurityEventType =
  | "login_failed"
  | "account_locked"
  | "cross_account_access_denied";

// Puerto del dominio: la capa de aplicación depende de esta interfaz, nunca de un driver
// de persistencia concreto (Dependency Inversion). La implementación Mongo vive en
// infrastructure/securityEventRepository.ts.
export interface SecurityEventRepository {
  record(userId: string, eventType: SecurityEventType): Promise<void>;
}
