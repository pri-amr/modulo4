import { AppError } from "./errors";

// FR-008/SC-008: un acceso a un recurso de otra cuenta responde 404 (no 403, para no
// confirmar la existencia del recurso ajeno) y dispara `onCrossAccountAccessDenied` para
// que el llamador audite el intento (FR-038). `shared/` no conoce al módulo security-log:
// cada módulo cablea este callback en su capa `interface/` componiendo con el comando
// RecordSecurityEvent, respetando la inversión de dependencias entre capas.
export type OnCrossAccountAccessDenied = (requestingUserId: string) => Promise<void>;

export function createRequireOwnership(onCrossAccountAccessDenied: OnCrossAccountAccessDenied) {
  return async function requireOwnership<T extends { userId: string }>(
    resource: T | null | undefined,
    requestingUserId: string,
  ): Promise<T> {
    if (!resource) {
      throw new AppError(404, "NOT_FOUND", "Resource not found");
    }

    if (resource.userId !== requestingUserId) {
      await onCrossAccountAccessDenied(requestingUserId);
      throw new AppError(404, "NOT_FOUND", "Resource not found");
    }

    return resource;
  };
}
