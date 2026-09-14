import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { workItems } from "../../../db/schema";

const kinds = ["project", "building", "category", "task", "submission", "contractor", "payment", "milestone", "log", "workflow"];
const textFields = ["kind", "code", "title", "description", "status", "priority", "health", "lifecycle", "phase", "company", "owner", "followPerson", "nextAction", "followUpDate", "startDate", "dueDate", "previousDeadline", "changeReason", "currentHolder", "holdingSince", "paymentRound", "skippedReason", "imagePath", "imageTitle", "fileName", "fileUrl", "fileStorageStatus", "fileStorageNote"] as const;
const numberFields = ["projectId", "parentId", "estimatedMonths", "progress", "quantityProgress", "contractValue", "amount", "paidAmount"] as const;
type Insert = typeof workItems.$inferInsert;

function errorMessage(error: unknown) {
  const value = error instanceof Error ? error.message : "Không thể xử lý dữ liệu";
  return value.includes("no such table") ? "Cơ sở dữ liệu chưa sẵn sàng." : value;
}

function valuesFrom(payload: Record<string, unknown>, partial = false) {
  const values: Partial<Insert> = {};
  for (const key of textFields) {
    if (partial && !(key in payload)) continue;
    const raw = String(payload[key] ?? "").trim();
    if (["followUpDate", "startDate", "dueDate", "previousDeadline", "holdingSince", "skippedReason", "imagePath", "imageTitle", "fileName", "fileUrl", "fileStorageNote"].includes(key)) {
      (values as Record<string, unknown>)[key] = raw || null;
    } else {
      (values as Record<string, unknown>)[key] = raw;
    }
  }
  for (const key of numberFields) {
    if (partial && !(key in payload)) continue;
    const raw = Number(payload[key]);
    const nullable = ["projectId", "parentId", "estimatedMonths"].includes(key);
    (values as Record<string, unknown>)[key] = Number.isFinite(raw) && (nullable ? raw > 0 : raw >= 0) ? raw : nullable ? null : 0;
  }
  if (!partial || "skipApproved" in payload) values.skipApproved = payload.skipApproved === true || payload.skipApproved === "true";
  if (!partial || "fileStorageStatus" in payload) values.fileStorageStatus = payload.fileStorageStatus === "SAVED_ONEDRIVE" ? "SAVED_ONEDRIVE" : "MISSING_OR_INCORRECT";
  return values;
}

async function writeLog(source: Partial<Insert>, title: string, description = "") {
  try {
    await getDb().insert(workItems).values({
      kind: "log", title, description, status: "Đã ghi nhận",
      projectId: source.projectId ?? null, parentId: source.parentId ?? null,
    });
  } catch (error) {
    console.error("activity log", error);
  }
}

export async function GET() {
  try {
    const items = await getDb().select().from(workItems).orderBy(desc(workItems.updatedAt), desc(workItems.id));
    return Response.json({ items });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const kind = String(payload.kind ?? "");
    const title = String(payload.title ?? "").trim();
    if (!kinds.includes(kind) || !title) return Response.json({ error: "Loại và tên nội dung là bắt buộc." }, { status: 400 });
    if (kind === "workflow" && payload.status === "Skip" && !String(payload.skippedReason ?? "").trim()) {
      return Response.json({ error: "Bước bị bỏ qua phải có lý do." }, { status: 400 });
    }
    const values = valuesFrom(payload) as Insert;
    values.kind = kind;
    values.title = title;
    const [item] = await getDb().insert(workItems).values(values).returning();
    if (kind !== "log") await writeLog(item, `Tạo ${kind}: ${title}`);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const id = Number(payload.id);
    if (!Number.isFinite(id)) return Response.json({ error: "ID không hợp lệ." }, { status: 400 });
    const [before] = await getDb().select().from(workItems).where(eq(workItems.id, id)).limit(1);
    if (!before) return Response.json({ error: "Không tìm thấy nội dung." }, { status: 404 });
    const values = valuesFrom(payload, true);
    values.updatedAt = new Date().toISOString();
    const nextStatus = String(payload.status ?? before.status);
    const nextReason = String(payload.skippedReason ?? before.skippedReason ?? "").trim();
    if (before.kind === "workflow" && nextStatus === "Skip" && !nextReason) {
      return Response.json({ error: "Bước bị bỏ qua phải có lý do." }, { status: 400 });
    }
    const [item] = await getDb().update(workItems).set(values).where(eq(workItems.id, id)).returning();
    if (before.kind !== "log") {
      await writeLog(item, `Cập nhật ${before.kind}: ${before.title}`, before.currentHolder !== item.currentHolder ? `${before.currentHolder || "Chưa phân"} → ${item.currentHolder || "Chưa phân"}` : "");
    }
    return Response.json({ item });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = (await request.json()) as { id?: number };
    const id = Number(payload.id);
    const [before] = await getDb().select().from(workItems).where(eq(workItems.id, id)).limit(1);
    if (!before) return Response.json({ error: "Không tìm thấy nội dung." }, { status: 404 });
    await getDb().delete(workItems).where(eq(workItems.id, id));
    await writeLog(before, `Xóa ${before.kind}: ${before.title}`);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: errorMessage(error) }, { status: 500 });
  }
}
