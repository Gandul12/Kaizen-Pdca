import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchema } from "@/db";
import { genbaScheduleItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyGenbaPassword } from "@/lib/genbaAuth";

// PATCH /api/genba/schedule/[id] — update sebagian field item checklist.
// Body: { point?, standard?, endMinutes?, sectionOrder?, itemOrder?, isActive?, sectionId?, sectionTitle? }
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
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Item checklist tidak ditemukan" }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (body.point !== undefined) updateData.point = body.point;
    if (body.standard !== undefined) updateData.standard = body.standard;
    if (body.endMinutes !== undefined) updateData.endMinutes = body.endMinutes;
    if (body.sectionOrder !== undefined) updateData.sectionOrder = body.sectionOrder;
    if (body.itemOrder !== undefined) updateData.itemOrder = body.itemOrder;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.sectionId !== undefined) updateData.sectionId = body.sectionId;
    if (body.sectionTitle !== undefined) updateData.sectionTitle = body.sectionTitle;

    await db.update(genbaScheduleItems).set(updateData).where(eq(genbaScheduleItems.id, id));

    const updated = await db
      .select()
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.id, id))
      .limit(1);

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error: any) {
    console.error("PATCH /api/genba/schedule/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/genba/schedule/[id] — SOFT delete (set isActive: false), BUKAN
// hard delete. Entry genba lama yang sudah menyimpan salinan item ini
// (di kolom items jsonb) tidak terpengaruh sama sekali; item hanya berhenti
// muncul sebagai template untuk entry BARU ke depannya.
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
      .from(genbaScheduleItems)
      .where(eq(genbaScheduleItems.id, id))
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ success: false, error: "Item checklist tidak ditemukan" }, { status: 404 });
    }

    await db
      .update(genbaScheduleItems)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(genbaScheduleItems.id, id));

    return NextResponse.json({ success: true, message: "Item checklist dinonaktifkan (soft delete)" });
  } catch (error: any) {
    console.error("DELETE /api/genba/schedule/[id] error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
