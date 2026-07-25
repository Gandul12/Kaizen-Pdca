import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/db";
import { logActivity } from "@/lib/activityLogger";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchema();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const exportType = body.exportType || "pdf";

    await logActivity({
      action: exportType === "docx" ? "project_exported_docx" : "project_exported_pdf",
      projectId: id,
      detail: `Exported as ${exportType.toUpperCase()}`,
      ipAddress: req.headers.get("x-forwarded-for") || "",
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
