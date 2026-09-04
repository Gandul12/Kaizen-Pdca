import { FollowUpChartPoint } from "@/types/kaizen";

/**
 * Generates an automatic statistical conclusion from Step 7 Before vs After chart data.
 */
export function generateChartInsight(data: FollowUpChartPoint[]): string {
  if (!data || data.length === 0) return "Belum ada data untuk dianalisis.";

  const validPoints = data.filter(
    (d) => typeof d.before === "number" && typeof d.after === "number"
  );
  if (validPoints.length === 0) return "Belum ada data untuk dianalisis.";

  // Calculate average % change (Before -> After)
  // In Kaizen, defect/cycle-time reduction means after < before, so positive % reduction = improvement.
  const pctChanges = validPoints.map((d) => {
    if (d.before === 0) return 0;
    return ((d.before - d.after) / d.before) * 100;
  });
  const avgPct = pctChanges.reduce((a, b) => a + b, 0) / pctChanges.length;

  // Periods meeting or better than standard target (after <= standard)
  const meetingStandard = validPoints.filter((d) => d.after <= d.standard).length;
  const totalPeriods = validPoints.length;

  const direction = avgPct >= 0 ? "penurunan" : "kenaikan";
  const absPct = Math.abs(avgPct).toFixed(0);

  return `Rata-rata terjadi ${direction} ${absPct}% dari kondisi awal (Before) ke kondisi akhir (After). Hasil After sudah mencapai atau lebih baik dari standar target pada ${meetingStandard} dari ${totalPeriods} periode yang dievaluasi.`;
}
