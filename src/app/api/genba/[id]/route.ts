import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activityLogger";
import { requireGenbaAuth } from "@/lib/genbaAuth";
import type { GenbaItem } from "@/types/genba";

// PATCH — update sebagian field. Field 'items' di-MERGE per-id terhadap
// array yang sudah tersimpan (ambil row existing dulu), tidak pernah
// menimpa seluruh array items.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Entry genba tidak ditemukan" },
        { status: 404 }
      );
    }

    const current = existing[0];
    const updateData: any = { updatedAt: new Date() };

    if (body.leaderName !== undefined) updateData.leaderName = body.leaderName;
    if (body.lineName !== undefined) updateData.lineName = body.lineName;
    if (body.dailyTarget !== undefined) updateData.dailyTarget = body.dailyTarget;
    if (body.linkedProjectId !== undefined) updateData.linkedProjectId = body.linkedProjectId;
    if (body.linkedProjectShareToken !== undefined) updateData.linkedProjectShareToken = body.linkedProjectShareToken;

    if (Array.isArray(body.items)) {
      const currentItems: GenbaItem[] = Array.isArray(current.items)
        ? (current.items as GenbaItem[])
        : [];
      const patchMap = new Map<string, GenbaItem>(
        body.items.map((it: GenbaItem) => [it.id, it])
      );

      const mergedItems = currentItems.map((it) =>
        patchMap.has(it.id) ? { ...it, ...patchMap.get(it.id) } : it
      );

      // Jaga-jaga kalau ada id baru yang belum ada di array existing.
      const existingIds = new Set(currentItems.map((it) => it.id));
      const extraItems = body.items.filter((it: GenbaItem) => !existingIds.has(it.id));

      updateData.items = [...mergedItems, ...extraItems];
    }

    await db.update(genbaEntries).set(updateData).where(eq(genbaEntries.id, id));

    await logActivity({
      action: "genba_saved",
      projectId: updateData.linkedProjectId ?? current.linkedProjectId ?? null,
      detail: `Genba entry ${current.date} diperbarui`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    const updated = await db.select().from(genbaEntries).where(eq(genbaEntries.id, id)).limit(1);
    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("PATCH /api/genba/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE — hapus entry by id. 404 kalau id tidak ditemukan.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireGenbaAuth(req);
    if (authError) return authError;

    await ensureSchema();
    const { id } = await params;

    const existing = await db
      .select()
      .from(genbaEntries)
      .where(eq(genbaEntries.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json(
        { success: false, error: "Entry genba tidak ditemukan" },
        { status: 404 }
      );
    }

    await db.delete(genbaEntries).where(eq(genbaEntries.id, id));

    await logActivity({
      action: "genba_deleted",
      projectId: existing[0].linkedProjectId || null,
      detail: `Genba entry ${existing[0].date} dihapus`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json({ success: true, message: "Entry genba berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE /api/genba/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
