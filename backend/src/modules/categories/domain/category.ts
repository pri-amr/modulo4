export interface Category {
  id: string;
  userId: string;
  name: string;
}

// Puerto del dominio. Solo expone lo que esta feature (crear transacción) necesita: leer
// una categoría propia. El alta con sus validaciones (FR-013/FR-014) es responsabilidad
// de la Historia 2 y se agrega sobre este mismo repositorio.
export interface CategoryRepository {
  findByIdForUser(id: string, userId: string): Promise<Category | null>;
}
