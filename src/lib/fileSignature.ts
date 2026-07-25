/**
 * Validate that the first bytes of a file (magic number / file signature)
 * match the claimed extension.
 *
 * No external library — just manual byte-header checks.
 *
 * Supported with strong signatures:
 *   PNG, JPEG/JPG, GIF, WebP, PDF
 *
 * Supported with best-effort signatures:
 *   SVG   – looks for "<?xml" or "<svg" in the first 256 bytes (plain-text)
 *   DOCX/XLSX – these are ZIP archives; checks the PK (0x504B) ZIP header
 *   DOC/XLS  – these are OLE2 compound files; checks the 0xD0CF11E0 header
 *
 * Returns `{ valid: true }` or `{ valid: false; reason: string }`.
 */

interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// Each rule: [humanLabel, list of matching extensions, checker fn]
type SignatureRule = [string, string[], (h: Uint8Array, full: Uint8Array) => boolean];

function startsWith(header: Uint8Array, bytes: number[]): boolean {
  if (header.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (header[i] !== bytes[i]) return false;
  }
  return true;
}

const RULES: SignatureRule[] = [
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  ["PNG", [".png"], (h) => startsWith(h, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],

  // JPEG: FF D8 FF
  ["JPEG", [".jpg", ".jpeg"], (h) => startsWith(h, [0xff, 0xd8, 0xff])],

  // GIF: "GIF87a" or "GIF89a"
  ["GIF", [".gif"], (h) => startsWith(h, [0x47, 0x49, 0x46, 0x38]) /* GIF8 */],

  // WebP: RIFF....WEBP
  ["WebP", [".webp"], (h) =>
    startsWith(h, [0x52, 0x49, 0x46, 0x46]) /* RIFF */ &&
    h.length >= 12 &&
    h[8] === 0x57 && h[9] === 0x45 && h[10] === 0x42 && h[11] === 0x50 /* WEBP */
  ],

  // PDF: %PDF
  ["PDF", [".pdf"], (h) => startsWith(h, [0x25, 0x50, 0x44, 0x46])],

  // SVG: plain-text XML containing <svg.  Check first 512 bytes.
  ["SVG", [".svg"], (_h, full) => {
    // Decode the first 512 bytes as UTF-8 and look for svg indicators.
    const snippet = new TextDecoder("utf-8", { fatal: false })
      .decode(full.slice(0, 512))
      .toLowerCase();
    return snippet.includes("<svg") || (snippet.includes("<?xml") && snippet.includes("svg"));
  }],

  // DOCX / XLSX / PPTX — ZIP archive (PK header 0x504B0304)
  ["ZIP/Office-XML (docx/xlsx)", [".docx", ".xlsx"], (h) =>
    startsWith(h, [0x50, 0x4b, 0x03, 0x04])
  ],

  // DOC / XLS — OLE2 Compound Binary (D0 CF 11 E0 A1 B1 1A E1)
  ["OLE2/Office-Legacy (doc/xls)", [".doc", ".xls"], (h) =>
    startsWith(h, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
  ],
];

/**
 * Validate the file content against the claimed extension.
 *
 * @param ext     – lowercased extension including dot, e.g. ".png"
 * @param buffer  – the full file content as Uint8Array (we only read the
 *                  first 512 bytes, so passing the full buffer is fine)
 */
export function validateFileSignature(ext: string, buffer: Uint8Array): ValidationResult {
  // Find the rule(s) whose extension list includes `ext`.
  const matchingRule = RULES.find(([, exts]) => exts.includes(ext));

  if (!matchingRule) {
    // No signature rule for this extension — skip validation (allow).
    // This should not happen because the upload endpoint already
    // filters to the known whitelist, but just in case.
    return { valid: true };
  }

  const [label, , checker] = matchingRule;
  const header = buffer.slice(0, 16); // first 16 bytes is plenty for most checks

  if (!checker(header, buffer)) {
    return {
      valid: false,
      reason:
        `Isi file tidak sesuai dengan format ${label}. ` +
        `File berekstensi "${ext}" tetapi header/signature-nya tidak cocok. ` +
        `Pastikan file yang diunggah benar-benar bertipe ${label}.`,
    };
  }

  return { valid: true };
}
