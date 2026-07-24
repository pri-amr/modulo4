import mongoose, { Schema } from "mongoose";
import type { Category, CategoryRepository } from "../domain/category";

export interface CategoryDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
}

const categorySchema = new Schema<CategoryDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  name: { type: String, required: true, maxlength: 60 },
  createdAt: { type: Date, required: true, default: Date.now },
});

// FR-014: nombre único (case-sensitive exacto) por cuenta.
categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const CategoryModel =
  (mongoose.models.Category as mongoose.Model<CategoryDocument>) ||
  mongoose.model<CategoryDocument>("Category", categorySchema, "categories");

function toDomain(doc: CategoryDocument): Category {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
  };
}

export class MongoCategoryRepository implements CategoryRepository {
  async findByIdForUser(id: string, userId: string): Promise<Category | null> {
    if (!mongoose.isValidObjectId(id)) return null;
    const doc = await CategoryModel.findOne({ _id: id, userId });
    return doc ? toDomain(doc) : null;
  }
}
