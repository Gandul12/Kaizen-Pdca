import { z } from "zod";

// SECURITY: sebelumnya PUT/POST /api/kaizen menerima `content` mentah tanpa
// validasi bentuk sama sekali (bisa JSON apa pun) dan tanpa batas ukuran.
// Skema di bawah mengikuti PERSIS struktur di src/types/kaizen.ts (KaizenContent).
//
// Batas panjang string/array sengaja SANGAT longgar (bukan aturan bisnis,
// murni jaga-jaga terhadap payload raksasa) — supaya tidak menolak input sah
// dari wizard yang sudah ada.
const MAX_TEXT = 20_000;
const MAX_ARRAY = 500;

const text = () => z.string().max(MAX_TEXT);
const optionalText = () => z.string().max(MAX_TEXT).optional();

const HeaderDataSchema = z.object({
  title: text(),
  department: text(),
  leader: text(),
  teamMembers: text(),
  startDate: text(),
  dueDate: text(),
  status: z.enum(["Draft", "On Progress", "Under Review", "Completed", "Rejected"]),
});

const Step1ImageSchema = z.object({
  id: text(),
  url: text(),
  caption: text(),
});

const Step1DataSchema = z.object({
  standard: text(),
  currentSituation: text(),
  gap: text(),
  sinceWhen: text(),
  impact: text(),
  images: z.array(Step1ImageSchema).max(MAX_ARRAY),
});

const WhatWhenWhereWhoSchema = z.object({
  what: text(),
  when: text(),
  where: text(),
  who: text(),
});

const SupportingDataRowSchema = z.object({
  id: text(),
  area: text(),
  eventDate: text(),
  category: text(),
  detailModel: text(),
  quantity: text(),
});

const Step2DataSchema = z.object({
  fourWOneH: WhatWhenWhereWhoSchema,
  supportingData: z.array(SupportingDataRowSchema).max(MAX_ARRAY),
});

const SmartPrinciplesSchema = z.object({
  specific: text(),
  measurable: text(),
  achievable: text(),
  relevant: text(),
  timeBased: text(),
});

const Step3DataSchema = z.object({
  smart: SmartPrinciplesSchema,
  improvement: text(),
  targetValue: text(),
  completionDate: text(),
  projectTheme: text(),
});

const Fishbone5MESchema = z.object({
  man: text(),
  machine: text(),
  method: text(),
  material: text(),
  environment: text(),
});

const PotentialCauseRowSchema = z.object({
  id: text(),
  cause: text(),
  checkMethod: text(),
  result: text(),
});

const FiveWhysSchema = z.object({
  why1: text(),
  why2: text(),
  why3: text(),
  why4: text(),
  why5: text(),
  rootCause: text(),
});

const Step4DataSchema = z.object({
  fishbone: Fishbone5MESchema,
  fishboneImage: optionalText(),
  mostPotentialCauses: z.array(PotentialCauseRowSchema).max(MAX_ARRAY),
  fiveWhys: FiveWhysSchema,
});

const ActionPlanRowSchema = z.object({
  id: text(),
  plan: text(),
  area: text(),
  pic: text(),
  targetDate: text(),
  progress: z.number().min(0).max(100),
});

const Step5And6DataSchema = z.object({
  shortTermPlan: text(),
  longTermPlan: text(),
  actionPlans: z.array(ActionPlanRowSchema).max(MAX_ARRAY),
});

const FollowUpChartPointSchema = z.object({
  label: text(),
  standard: z.number(),
  before: z.number(),
  after: z.number(),
});

const Step7DataSchema = z.object({
  checkMethod: text(),
  checkFrequency: text(),
  checkPic: text(),
  testResultSummary: text(),
  chartData: z.array(FollowUpChartPointSchema).max(MAX_ARRAY),
  chartImage: optionalText(),
  chartType: z.enum(["line", "bar"]).optional(),
  followUpDecision: z.enum(["proliferasi", "monitoring", "pdca_ulang", "eskalasi"]),
  followUpNote: text(),
});

const DocumentRowSchema = z.object({
  id: text(),
  docNumber: text(),
  docName: text(),
  status: text(),
});

const AttachmentItemSchema = z.object({
  id: text(),
  fileName: text(),
  fileUrl: text(),
  fileType: optionalText(),
});

const Step8DataSchema = z.object({
  documentsCreated: z.array(DocumentRowSchema).max(MAX_ARRAY),
  beforeCondition: text(),
  afterCondition: text(),
  beforeUrl: optionalText(),
  afterUrl: optionalText(),
  maintenancePic: text(),
  effectiveDate: text(),
  attachments: z.array(AttachmentItemSchema).max(MAX_ARRAY),
});

export const KaizenContentSchema = z.object({
  header: HeaderDataSchema,
  step1: Step1DataSchema,
  step2: Step2DataSchema,
  step3: Step3DataSchema,
  step4: Step4DataSchema,
  step5_6: Step5And6DataSchema,
  step7: Step7DataSchema,
  step8: Step8DataSchema,
});

// Batas ukuran body JSON mentah (byte) untuk POST/PUT /api/kaizen.
// 2MB sangat longgar untuk konten teks — foto disimpan terpisah lewat
// /api/upload dan direferensikan via URL, bukan di-embed base64 di sini.
export const MAX_KAIZEN_BODY_BYTES = 2 * 1024 * 1024;

/**
 * Baca body request sebagai teks dulu (supaya bisa cek ukuran byte SEBELUM
 * parse), lalu JSON.parse manual. Melempar Response siap-pakai kalau gagal.
 */
export async function readJsonBodyWithLimit(
  req: Request,
  maxBytes: number = MAX_KAIZEN_BODY_BYTES
): Promise<{ ok: true; body: any } | { ok: false; status: number; error: string }> {
  const rawBody = await req.text();

  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    return {
      ok: false,
      status: 413,
      error: `Ukuran payload melebihi batas ${Math.round(maxBytes / (1024 * 1024))}MB.`,
    };
  }

  if (!rawBody) {
    return { ok: true, body: {} };
  }

  try {
    return { ok: true, body: JSON.parse(rawBody) };
  } catch {
    return { ok: false, status: 400, error: "Body request bukan JSON yang valid." };
  }
}

/**
 * Validasi `content` (kalau dikirim) terhadap KaizenContentSchema.
 * Return null kalau valid/tidak dikirim, atau pesan error kalau tidak valid.
 */
export function validateKaizenContent(content: unknown): string | null {
  if (content === undefined) return null; // opsional — tidak semua request mengubah content

  const result = KaizenContentSchema.safeParse(content);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue.path.join(".") || "(root)";
    return `Struktur "content" tidak valid pada "${path}": ${firstIssue.message}`;
  }
  return null;
}
