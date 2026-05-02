import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

interface LogActionParams {
  adminId: string | ObjectId;
  adminName: string;
  action: "create" | "update" | "delete" | "login" | "logout";
  collection: string;
  documentId?: string | ObjectId;
  details: string;
}

export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("audit_logs").insertOne({
      adminId:
        typeof params.adminId === "string"
          ? new ObjectId(params.adminId)
          : params.adminId,
      adminName: params.adminName,
      action: params.action,
      collection: params.collection,
      documentId: params.documentId
        ? typeof params.documentId === "string"
          ? new ObjectId(params.documentId)
          : params.documentId
        : undefined,
      details: params.details,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
