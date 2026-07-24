import mongoose, { Schema } from "mongoose";
import type { SecurityEventRepository, SecurityEventType } from "../domain/securityEvent";

export interface SecurityEventDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  eventType: SecurityEventType;
  createdAt: Date;
}

// FR-039: cada registro se conserva 30 días desde su creación (índice TTL sobre createdAt).
const SECURITY_EVENT_TTL_SECONDS = 30 * 24 * 60 * 60;

const securityEventSchema = new Schema<SecurityEventDocument>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  eventType: {
    type: String,
    required: true,
    enum: ["login_failed", "account_locked", "cross_account_access_denied"],
  },
  createdAt: { type: Date, required: true, default: Date.now, expires: SECURITY_EVENT_TTL_SECONDS },
});

export const SecurityEventModel =
  (mongoose.models.SecurityEvent as mongoose.Model<SecurityEventDocument>) ||
  mongoose.model<SecurityEventDocument>("SecurityEvent", securityEventSchema, "security_events");

// Adaptador de infraestructura: implementa el puerto definido en domain/securityEvent.ts.
export class MongoSecurityEventRepository implements SecurityEventRepository {
  async record(userId: string, eventType: SecurityEventType): Promise<void> {
    await SecurityEventModel.create({ userId, eventType });
  }
}
