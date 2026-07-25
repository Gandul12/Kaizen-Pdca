import { NextRequest, NextResponse } from "next/server";
import { ensureSchema } from "@/db";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { validateFileSignature } from "@/lib/fileSignature";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
];

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex).toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    // ── 1. Check that BLOB_READ_WRITE_TOKEN is configured ──
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error(
        "BLOB_READ_WRITE_TOKEN is not set. " +
        "Please add the Vercel Blob store to your project and set the token in environment variables."
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Upload tidak tersedia: BLOB_READ_WRITE_TOKEN belum dikonfigurasi di server. " +
            "Hubungi administrator untuk mengaktifkan Vercel Blob Storage.",
        },
        { status: 503 }
      );
    }

    // ── 2. Parse multipart form ──
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // ── 3. Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Ukuran file melebihi batas 5 MB." },
        { status: 400 }
      );
    }

    // ── 4. Validate extension ──
    const originalName = file.name || "upload";
    const ext = getExtension(originalName) || ".png";

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Tipe file "${ext}" tidak diizinkan. Format yang didukung: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // ── 5. Validate file content (magic-number / signature check) ──
    const arrayBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    const sigCheck = validateFileSignature(ext, fileBytes);
    if (!sigCheck.valid) {
      return NextResponse.json(
        { success: false, error: sigCheck.reason },
        { status: 400 }
      );
    }

    // ── 6. Generate unique blob pathname ──
    const uniqueId = crypto.randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const blobPathname = `kaizen-uploads/${timestamp}-${uniqueId}${ext}`;

    // ── 7. Upload to Vercel Blob ──
    // Re-create a Blob from the already-read bytes so @vercel/blob can consume it.
    const uploadBlob = new Blob([fileBytes], { type: file.type || "application/octet-stream" });
    const blob = await put(blobPathname, uploadBlob, {
      access: "public",
      addRandomSuffix: false,
    });

    // ── 8. Return response (same shape the frontend expects) ──
    return NextResponse.json({
      success: true,
      fileUrl: blob.url,
      fileName: originalName,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
