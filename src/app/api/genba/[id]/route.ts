import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLogger";
import { verifyGenbaPassword } from "@/lib/genbaAuth";

// PATCH /api/genba/[id] — partial update. Any items sent in the body are
// merged (by item id) into the existing items array in the DB, so items not
// mentioned in the body are left untouched (e.g. toggling a single checklist
// item without resending the whole array).
// Body: { leaderName?, lineName?, dailyTarget?, items?: Array<{ id: string, ...partial fields }> }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyGenbaPassword(req);
  if (authError) return authError;

  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.leaderName !== undefined) updateData.leaderName = body.leaderName;
    if (body.lineName !== undefined) updateData.lineName = body.lineName;
    if (body.dailyTarget !== undefined) updateData.dailyTarget = body.dailyTarget;
    // FR-9: dipakai EscalateToProjectModal untuk menyimpan relasi ke proyek
    // Kaizen baru setelah eskalasi berhasil.
    if (body.linkedProjectId !== undefined) updateData.linkedProjectId = body.linkedProjectId;

    if (Array.isArray(body.items)) {
      const existingItems: any[] = (existing[0].items as any[]) || [];
      const patchesById = new Map(body.items.map((patch: any) => [patch.id, patch]));

      // Merge: only items whose id appears in the body are patched, all
      // other existing items pass through unchanged.
      updateData.items = existingItems.map((item) => {
        const patch = patchesById.get(item.id);
        return patch ? { ...item, ...patch } : item;
      });
    }

    await db.update(genbaEntries).set(updateData).where(eq(genbaEntries.id, id));

    await logActivity({
      action: "genba_saved",
      projectId: existing[0].linkedProjectId || null,
      detail: `Genba entry ${id} patched`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    const updated = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.id, id))
      .limit(1);

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("PATCH /api/genba/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/genba/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyGenbaPassword(req);
  if (authError) return authError;

  try {
    await ensureSchema();
    const { id } = await params;

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Entry not found" }, { status: 404 });
    }

    await db.delete(genbaEntries).where(eq(genbaEntries.id, id));

    await logActivity({
      action: "genba_deleted",
      projectId: existing[0].linkedProjectId || null,
      detail: `Genba entry ${id} (${existing[0].date}) deleted`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json({ success: true, message: "Entry deleted" });
  } catch (error: any) {
    console.error("DELETE /api/genba/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
