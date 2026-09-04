import pptxgen from "pptxgenjs";
import { KaizenProject, KaizenContent, HeaderData, Step7Data } from "@/types/kaizen";
import { PptxColorPreset, DEFAULT_PRESET } from "./pptxColorPresets";
import { generateChartInsight } from "./chartInsight";

// ─────────────────────────────────────────────────────────────
// STEP-FILLED DETECTION (sesuai prompt Bagian 3)
// ─────────────────────────────────────────────────────────────
function isStep1Terisi(content: KaizenContent): boolean {
  const s1 = content.step1;
  return !!(s1?.standard || s1?.currentSituation || s1?.gap);
}

function isStep2Terisi(content: KaizenContent): boolean {
  const s2 = content.step2;
  return !!(s2?.fourWOneH?.what || s2?.fourWOneH?.when || s2?.fourWOneH?.where || s2?.fourWOneH?.who);
}

function isStep3Terisi(content: KaizenContent): boolean {
  const s3 = content.step3;
  return !!(s3?.projectTheme || s3?.smart?.specific || s3?.smart?.measurable || s3?.smart?.achievable || s3?.smart?.relevant || s3?.smart?.timeBased);
}

function isStep4Terisi(content: KaizenContent): boolean {
  const s4 = content.step4;
  return !!(
    s4?.fishbone?.man || s4?.fishbone?.machine || s4?.fishbone?.method || 
    s4?.fishbone?.material || s4?.fishbone?.environment || s4?.fiveWhys?.why1
  );
}

function isStep56Terisi(content: KaizenContent): boolean {
  const s56 = content.step5_6;
  return !!(s56?.actionPlans && s56.actionPlans.some(ap => ap.plan));
}

function isStep7Terisi(content: KaizenContent): boolean {
  const s7 = content.step7;
  const hasChartData = s7?.chartData && s7.chartData.some(cd => (cd.before !== 0 && cd.before !== undefined) || (cd.after !== 0 && cd.after !== undefined));
  return !!(s7?.testResultSummary || hasChartData);
}

function isStep8Terisi(content: KaizenContent): boolean {
  const s8 = content.step8;
  const hasDocs = s8?.documentsCreated && s8.documentsCreated.some(doc => doc.docName);
  return !!(s8?.beforeCondition || s8?.afterCondition || hasDocs);
}

export function countFilledSteps(content: KaizenContent): number {
  let count = 0;
  if (isStep1Terisi(content)) count++;
  if (isStep2Terisi(content)) count++;
  if (isStep3Terisi(content)) count++;
  if (isStep4Terisi(content)) count++;
  if (isStep56Terisi(content)) count++;
  if (isStep7Terisi(content)) count++;
  if (isStep8Terisi(content)) count++;
  // Note: We count 7 steps total (Step 5&6 combined as one)
  return count;
}

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────
function formatTanggalIndonesia(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getClosingSlideTone(followUpDecision?: string): "positive" | "neutral" | "caution" {
  if (!followUpDecision) return "neutral";
  if (followUpDecision === "proliferasi") return "positive";
  if (followUpDecision === "monitoring") return "neutral";
  if (followUpDecision === "pdca_ulang" || followUpDecision === "eskalasi") return "caution";
  return "neutral";
}

// ─────────────────────────────────────────────────────────────
// SLIDE HEADER: nav bar persisten + judul section oversized
// (Upgrade visual — pola diadopsi dari referensi pitch deck)
// Mengembalikan koordinat Y tempat konten slide harus mulai diletakkan.
// ─────────────────────────────────────────────────────────────
function addSlideHeader(
  slide: any,
  preset: PptxColorPreset,
  projectTitleShort: string,
  stepIndicator: string,
  sectionTitle: string
): number {
  // Nav bar tipis persisten (kiri: judul proyek, kanan: indikator step)
  slide.addText(projectTitleShort.toUpperCase(), {
    x: 0.5, y: 0.22, w: 6.0, h: 0.3,
    fontSize: 9, color: preset.accent, bold: true, align: "left", charSpacing: 1,
  });
  slide.addText(stepIndicator.toUpperCase(), {
    x: 6.0, y: 0.22, w: 3.5, h: 0.3,
    fontSize: 9, color: preset.accent, bold: true, align: "right", charSpacing: 1,
  });
  slide.addShape("line", {
    x: 0.5, y: 0.55, w: 9.0, h: 0,
    line: { color: preset.accent, width: 0.75, transparency: 60 },
  });

  // Judul section oversized, rata kiri (bukan center) — kesan tipografi besar
  slide.addText(sectionTitle, {
    x: 0.5, y: 0.72, w: "90%", h: 1.0,
    fontSize: 30, color: preset.textLight, bold: true, align: "left", valign: "top",
    fontFace: "Arial",
  });

  // Y tempat konten slide dimulai setelah header
  return 1.85;
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT FUNCTION
// ─────────────────────────────────────────────────────────────
export async function generateKaizenPptx(
  project: KaizenProject,
  preset: PptxColorPreset = DEFAULT_PRESET
): Promise<void> {
  const pres = new pptxgen();
  const { content, title } = project;
  const h = content.header || { title, department: "", leader: "", startDate: "", status: "" };

  // Slide dimensions (16:9)
  pres.layout = "LAYOUT_16x9";

  // ─────────────────────────────────────────────────────────────
  // SLIDE 1: COVER (WAJIB)
  // ─────────────────────────────────────────────────────────────
  const slide1 = pres.addSlide();
  slide1.background = { color: preset.bgPrimary };
  
  // Label kecil di atas
  slide1.addText("PROYEK KAIZEN MELALUI PENDEKATAN PDCA", {
    x: 0.5, y: 0.5, w: "90%", h: 0.5,
    fontSize: 14, color: preset.accent, bold: true, align: "center",
  });

  // Judul besar
  slide1.addText(h.title || "Judul Proyek", {
    x: 0.5, y: 1.2, w: "90%", h: 1.5,
    fontSize: 32, color: preset.textLight, bold: true, align: "center",
  });

  // 3 info sejajar
  const infoY = 3.0;
  slide1.addText(`Departemen: ${h.department || "-"}`, {
    x: 0.5, y: infoY, w: "30%", h: 0.4,
    fontSize: 12, color: preset.textLight, align: "left",
  });
  slide1.addText(`Ketua Tim: ${h.leader || "-"}`, {
    x: 3.5, y: infoY, w: "30%", h: 0.4,
    fontSize: 12, color: preset.textLight, align: "center",
  });
  slide1.addText(`Mulai: ${formatTanggalIndonesia(h.startDate)}`, {
    x: 6.5, y: infoY, w: "30%", h: 0.4,
    fontSize: 12, color: preset.textLight, align: "right",
  });

  // Badge status di pojok kanan atas
  slide1.addText(h.status || "Draft", {
    x: 9.0, y: 0.5, w: 1.0, h: 0.4,
    fontSize: 10, color: preset.bgPrimary, bold: true, align: "center",
    fill: { color: preset.accent },
  });

  // Baris meta info gaya "kontak" di bawah cover (kesan fine-print elegan)
  slide1.addShape("line", {
    x: 1.5, y: 4.6, w: 7.0, h: 0,
    line: { color: preset.accent, width: 0.5, transparency: 55 },
  });
  slide1.addText(
    `DOKUMENTASI KAIZEN PDCA  ·  DIBUAT: ${formatTanggalIndonesia(h.startDate).toUpperCase()}  ·  STATUS: ${(h.status || "DRAFT").toUpperCase()}`,
    {
      x: 0.5, y: 4.8, w: "90%", h: 0.4,
      fontSize: 9, color: preset.textLight, align: "center", transparency: 30, charSpacing: 1,
    }
  );

  // ─────────────────────────────────────────────────────────────
  // SLIDE 2: FRAMEWORK OVERVIEW — GAYA "TABLE OF CONTENTS" ANGKA BESAR
  // ─────────────────────────────────────────────────────────────
  const slide2 = pres.addSlide();
  slide2.background = { color: preset.bgPrimary };

  const contentStartY2 = addSlideHeader(
    slide2, preset, h.title || "Kaizen PDCA", "Daftar Isi",
    "Framework\n8 Langkah PDCA"
  );

  const steps = [
    { num: 1, label: "Problem Situation", terisi: isStep1Terisi(content) },
    { num: 2, label: "Break Down Problem", terisi: isStep2Terisi(content) },
    { num: 3, label: "Target Setting", terisi: isStep3Terisi(content) },
    { num: 4, label: "Cause Analysis", terisi: isStep4Terisi(content) },
    { num: 5, label: "Countermeasure", terisi: isStep56Terisi(content) },
    { num: 6, label: "Follow Up", terisi: isStep7Terisi(content) },
    { num: 7, label: "Standardization", terisi: isStep8Terisi(content) },
  ];

  // Grid 2 kolom x 4 baris, gaya "Table of Contents" — angka besar di kiri tiap item
  const tocColWidth = 4.5;
  const tocRowHeight = 1.05;
  const tocStartX = 0.5;
  const tocStartY = contentStartY2 + 0.15;
  const tocGapX = 0.4;

  steps.forEach((step, idx) => {
    const col = Math.floor(idx / 4);
    const row = idx % 4;
    const x = tocStartX + col * (tocColWidth + tocGapX);
    const y = tocStartY + row * tocRowHeight;

    const numColor = step.terisi ? preset.accent : "6B7280";
    const labelColor = step.terisi ? preset.textLight : "6B7280";
    const labelAlpha = step.terisi ? 0 : 40;

    // Angka besar (01, 02, dst)
    slide2.addText(String(step.num).padStart(2, "0"), {
      x, y, w: 1.1, h: tocRowHeight - 0.15,
      fontSize: 40, color: numColor, bold: true, align: "left", valign: "middle",
      transparency: step.terisi ? 0 : 45,
    });

    // Label step di sampingnya
    slide2.addText(step.label, {
      x: x + 1.15, y, w: tocColWidth - 1.15, h: tocRowHeight - 0.15,
      fontSize: 14, color: labelColor, bold: true, align: "left", valign: "middle",
      transparency: labelAlpha,
    });

    // Garis tipis pemisah bawah tiap item
    slide2.addShape("line", {
      x, y: y + tocRowHeight - 0.12, w: tocColWidth, h: 0,
      line: { color: preset.accent, width: 0.5, transparency: 70 },
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SLIDE 3: STEP 1 - PROBLEM SITUATION (jika terisi)
  // ─────────────────────────────────────────────────────────────
  if (isStep1Terisi(content)) {
    const slide3 = pres.addSlide();
    slide3.background = { color: preset.bgPrimary };

    const cY = addSlideHeader(slide3, preset, h.title || "Kaizen PDCA", "Step 1 dari 8", "Problem\nSituation");

    const s1 = content.step1;
    const boxes = [
      { label: "Standar", text: s1?.standard || "" },
      { label: "Situasi Terkini", text: s1?.currentSituation || "" },
      { label: "Gap", text: s1?.gap || "" },
    ].filter(b => b.text);

    boxes.forEach((box, idx) => {
      const y = cY + idx * 1.15;
      slide3.addShape("roundRect", {
        x: 0.5, y, w: "90%", h: 1.0,
        fill: { color: preset.bgSecondary },
        line: { color: preset.accent, width: 1 },
      });
      slide3.addText(`${box.label}:`, {
        x: 0.7, y: y + 0.1, w: "85%", h: 0.3,
        fontSize: 12, color: preset.accent, bold: true, align: "left",
      });
      slide3.addText(box.text, {
        x: 0.7, y: y + 0.4, w: "85%", h: 0.55,
        fontSize: 11, color: preset.textLight, align: "left",
      });
    });

    if (s1?.sinceWhen) {
      slide3.addText(`Terjadi Sejak: ${s1.sinceWhen}`, {
        x: 0.5, y: cY + boxes.length * 1.15 + 0.1, w: "90%", h: 0.4,
        fontSize: 11, color: preset.textLight, italic: true,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE: STEP 2 - BREAKDOWN (jika terisi)
  // ─────────────────────────────────────────────────────────────
  if (isStep2Terisi(content)) {
    const slide = pres.addSlide();
    slide.background = { color: preset.bgPrimary };

    const cY = addSlideHeader(slide, preset, h.title || "Kaizen PDCA", "Step 2 dari 8", "Break Down\nthe Problem");

    const s2 = content.step2;
    const fourW = [
      { label: "WHAT", text: s2?.fourWOneH?.what || "" },
      { label: "WHEN", text: s2?.fourWOneH?.when || "" },
      { label: "WHERE", text: s2?.fourWOneH?.where || "" },
      { label: "WHO", text: s2?.fourWOneH?.who || "" },
    ].filter(b => b.text);

    fourW.forEach((box, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 0.5 + col * 4.7;
      const y = cY + row * 1.7;

      slide.addShape("roundRect", {
        x, y, w: 4.5, h: 1.5,
        fill: { color: preset.bgSecondary },
        line: { color: preset.accent, width: 1 },
      });
      slide.addText(`${box.label}:`, {
        x: x + 0.2, y: y + 0.1, w: 4.1, h: 0.3,
        fontSize: 12, color: preset.accent, bold: true, align: "left",
      });
      slide.addText(box.text, {
        x: x + 0.2, y: y + 0.4, w: 4.1, h: 1.0,
        fontSize: 11, color: preset.textLight, align: "left",
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE: STEP 3 - TARGET SETTING (jika terisi)
  // ─────────────────────────────────────────────────────────────
  if (isStep3Terisi(content)) {
    const slide = pres.addSlide();
    slide.background = { color: preset.bgPrimary };

    const cY = addSlideHeader(slide, preset, h.title || "Kaizen PDCA", "Step 3 dari 8", "Target Setting\n(SMART)");

    const s3 = content.step3;
    const smartFields = [
      { label: "Specific", text: s3?.smart?.specific || "" },
      { label: "Measurable", text: s3?.smart?.measurable || "" },
      { label: "Achievable", text: s3?.smart?.achievable || "" },
      { label: "Relevant", text: s3?.smart?.relevant || "" },
      { label: "Time-based", text: s3?.smart?.timeBased || "" },
    ].filter(f => f.text);

    smartFields.forEach((field, idx) => {
      const y = cY + idx * 0.55;
      slide.addText(`${field.label}:`, {
        x: 0.5, y, w: 1.5, h: 0.4,
        fontSize: 12, color: preset.accent, bold: true, align: "left",
      });
      slide.addText(field.text, {
        x: 2.1, y, w: "70%", h: 0.4,
        fontSize: 11, color: preset.textLight, align: "left",
      });
    });

    if (s3?.projectTheme) {
      const themeY = cY + smartFields.length * 0.55 + 0.2;
      slide.addShape("roundRect", {
        x: 0.5, y: themeY, w: "90%", h: 1.0,
        fill: { color: preset.accent, alpha: 20 },
        line: { color: preset.accent, width: 2 },
      });
      slide.addText("Tema Proyek:", {
        x: 0.7, y: themeY + 0.1, w: "85%", h: 0.3,
        fontSize: 12, color: preset.accent, bold: true,
      });
      slide.addText(s3.projectTheme, {
        x: 0.7, y: themeY + 0.4, w: "85%", h: 0.5,
        fontSize: 13, color: preset.textLight, bold: true, align: "center",
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE: STEP 4 - CAUSE ANALYSIS (jika terisi)
  // ─────────────────────────────────────────────────────────────
  if (isStep4Terisi(content)) {
    const slide = pres.addSlide();
    slide.background = { color: preset.bgPrimary };

    const cY = addSlideHeader(slide, preset, h.title || "Kaizen PDCA", "Step 4 dari 8", "Cause\nAnalysis");

    const s4 = content.step4;

    // Fishbone branches (hanya yang terisi)
    const fishboneFields = [
      { label: "MAN", text: s4?.fishbone?.man || "" },
      { label: "MACHINE", text: s4?.fishbone?.machine || "" },
      { label: "METHOD", text: s4?.fishbone?.method || "" },
      { label: "MATERIAL", text: s4?.fishbone?.material || "" },
      { label: "ENVIRONMENT", text: s4?.fishbone?.environment || "" },
    ].filter(f => f.text);

    fishboneFields.forEach((field, idx) => {
      const y = cY + idx * 0.5;
      slide.addText(`${field.label}:`, {
        x: 0.5, y, w: 1.8, h: 0.4,
        fontSize: 11, color: preset.accent, bold: true, align: "left",
      });
      slide.addText(field.text, {
        x: 2.4, y, w: "70%", h: 0.4,
        fontSize: 10, color: preset.textLight, align: "left",
      });
    });

    // 5 Why chain (hanya sampai why terakhir yang terisi)
    const fiveWhys = [
      s4?.fiveWhys?.why1,
      s4?.fiveWhys?.why2,
      s4?.fiveWhys?.why3,
      s4?.fiveWhys?.why4,
      s4?.fiveWhys?.why5,
    ].filter(w => w);

    if (fiveWhys.length > 0) {
      const whyStartY = cY + fishboneFields.length * 0.5 + 0.25;
      slide.addText("5 WHY ANALYSIS:", {
        x: 0.5, y: whyStartY, w: "90%", h: 0.3,
        fontSize: 12, color: preset.accent, bold: true,
      });

      fiveWhys.forEach((why, idx) => {
        const y = whyStartY + 0.35 + idx * 0.4;
        slide.addText(`WHY ${idx + 1}: ${why}`, {
          x: 0.7, y, w: "85%", h: 0.35,
          fontSize: 10, color: preset.textLight,
        });
      });

      if (s4?.fiveWhys?.rootCause) {
        const rootY = whyStartY + 0.35 + fiveWhys.length * 0.4 + 0.15;
        slide.addShape("roundRect", {
          x: 0.5, y: rootY, w: "90%", h: 0.65,
          fill: { color: preset.accent, alpha: 20 },
          line: { color: preset.accent, width: 2 },
        });
        slide.addText("ROOT CAUSE:", {
          x: 0.7, y: rootY + 0.05, w: "85%", h: 0.2,
          fontSize: 10, color: preset.accent, bold: true,
        });
        slide.addText(s4.fiveWhys.rootCause, {
          x: 0.7, y: rootY + 0.28, w: "85%", h: 0.3,
          fontSize: 10, color: preset.textLight, bold: true,
        });
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // SLIDE: STEP 5&6 - COUNTERMEASURE (jika terisi)
  // ─────────────────────────────────────────────────────────────
  if (isStep56Terisi(content)) {
    const slide = pres.addSlide();
    slide.background = { color: preset.bgPrimary };

    const cY = addSlideHeader(slide, preset, h.title || "Kaizen PDCA", "Step 5 & 6 dari 8", "Countermeasure &\nImplementation");

    const s56 = content.step5_6;
    const actionPlans = s56?.actionPlans?.filter(ap => ap.plan) || [];

    actionPlans.forEach((plan, idx) => {
      const y = cY + idx * 1.15;
      slide.addShape("roundRect", {
        x: 0.5, y, w: "90%", h: 1.0,
        fill: { color: preset.bgSecondary },
        line: { color: preset.accent, width: 1 },
      });
      
      slide.addText(`${idx + 1}. ${plan.plan}`, {
        x: 0.7, y: y + 0.1, w: "85%", h: 0.3,
        fontSize: 12, color: preset.textLight, bold: true,
      });
      
      slide.addText(`PIC: ${plan.pic || "-"} | Target: ${formatTanggalIndonesia(plan.targetDate)}`, {
        x: 0.7, y: y + 0.4, w: "85%", h: 0.25,
        fontSize: 10, color: preset.textLight,
      });
      
      // Progress bar
      const progress = plan.progress || 0;
      slide.addShape("rect", {
        x: 0.7, y: y + 0.68, w: "85%", h: 0.15,
        fill: { color: "444444" },
      });
      slide.addShape("rect", {
        x: 0.7, y: y + 0.68, w: `${(progress / 100) * 8.5}%`, h: 0.15,
        fill: { color: progress === 100 ? "22c55e" : preset.accent },
      });
      slide.addText(`${progress}%`, {
        x: 9.0, y: y + 0.63, w: 0.5, h: 0.25,
        fontSize: 10, color: preset.textLight, align: "right",
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE: STEP 7 - FOLLOW UP CHART (jika terisi) - NATIVE CHART!
  // ─────────────────────────────────────────────────────────────
  if (isStep7Terisi(content)) {
    const slide = pres.addSlide();
    slide.background = { color: preset.bgPrimary };

    const cY = addSlideHeader(slide, preset, h.title || "Kaizen PDCA", "Step 7 dari 8", "Follow Up &\nEvaluasi");

    const s7 = content.step7;
    
    // NATIVE POWERPOINT CHART (bukan gambar!)
    if (s7?.chartData && s7.chartData.length > 0) {
      const chartLabels = s7.chartData.map(cd => cd.label || "-");
      const standardData = s7.chartData.map(cd => cd.standard || 0);
      const beforeData = s7.chartData.map(cd => cd.before || 0);
      const afterData = s7.chartData.map(cd => cd.after || 0);

      const chartData = [
        { name: "Standar Target", labels: chartLabels, values: standardData },
        { name: "Sebelum (Before)", labels: chartLabels, values: beforeData },
        { name: "Sesudah (After)", labels: chartLabels, values: afterData },
      ];

      slide.addChart(pres.ChartType.line, chartData, {
        x: 0.5, y: cY, w: "90%", h: 3.3,
        showTitle: true,
        title: "Perbandingan Before vs After",
        titleColor: preset.textLight,
        showValue: true,
        chartColors: [preset.accent, "FFA500", "22c55e"],
        showLegend: true,
        legendColor: preset.textLight,
        catAxisLabelColor: preset.textLight,
        valAxisLabelColor: preset.textLight,
        lineSize: 2,
        lineDash: "dash",
      });
    }

    // Insight dari chartInsight.ts
    if (s7?.chartData && s7.chartData.length > 0) {
      const insight = generateChartInsight(s7.chartData);
      const insightY = cY + 3.45;
      slide.addShape("roundRect", {
        x: 0.5, y: insightY, w: "90%", h: 0.75,
        fill: { color: preset.accent, alpha: 15 },
        line: { color: preset.accent, width: 1 },
      });
      slide.addText("INSIGHT:", {
        x: 0.7, y: insightY + 0.08, w: "85%", h: 0.22,
        fontSize: 11, color: preset.accent, bold: true,
      });
      slide.addText(insight, {
        x: 0.7, y: insightY + 0.32, w: "85%", h: 0.4,
        fontSize: 10, color: preset.textLight,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE: STEP 8 - STANDARDIZATION (jika terisi)
  // ─────────────────────────────────────────────────────────────
  if (isStep8Terisi(content)) {
    const slide = pres.addSlide();
    slide.background = { color: preset.bgPrimary };

    const cY = addSlideHeader(slide, preset, h.title || "Kaizen PDCA", "Step 8 dari 8", "Standardization");

    const s8 = content.step8;
    
    if (s8?.beforeCondition || s8?.afterCondition) {
      slide.addText("BEFORE:", {
        x: 0.5, y: cY, w: "43%", h: 0.3,
        fontSize: 12, color: preset.accent, bold: true, align: "left",
      });
      slide.addText(s8.beforeCondition || "-", {
        x: 0.5, y: cY + 0.3, w: "43%", h: 0.7,
        fontSize: 11, color: preset.textLight, align: "left",
      });

      slide.addText("AFTER:", {
        x: 5.2, y: cY, w: "43%", h: 0.3,
        fontSize: 12, color: preset.accent, bold: true, align: "left",
      });
      slide.addText(s8.afterCondition || "-", {
        x: 5.2, y: cY + 0.3, w: "43%", h: 0.7,
        fontSize: 11, color: preset.textLight, align: "left",
      });
    }

    const docs = s8?.documentsCreated?.filter(d => d.docName) || [];
    if (docs.length > 0) {
      const docY = s8?.beforeCondition || s8?.afterCondition ? cY + 1.15 : cY;
      slide.addText("DOKUMEN / SOP:", {
        x: 0.5, y: docY, w: "90%", h: 0.3,
        fontSize: 12, color: preset.accent, bold: true,
      });
      docs.forEach((doc, idx) => {
        const y = docY + 0.4 + idx * 0.5;
        slide.addText(`${idx + 1}. ${doc.docName} (${doc.status || "-"})`, {
          x: 0.7, y, w: "85%", h: 0.4,
          fontSize: 10, color: preset.textLight,
        });
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SLIDE TERAKHIR: CLOSING (WAJIB)
  // ─────────────────────────────────────────────────────────────
  const closingSlide = pres.addSlide();
  const tone = getClosingSlideTone(content.step7?.followUpDecision);
  
  closingSlide.background = { color: preset.bgPrimary };
  
  let closingHeadline = "Proyek Masih Berjalan — Dokumentasi Berlanjut";
  let closingColor = preset.textLight;
  
  if (tone === "positive") {
    closingHeadline = "STANDAR BARU, EFISIENSI BARU";
    closingColor = preset.accent;
  } else if (tone === "caution") {
    closingHeadline = "BUTUH SIKLUS PERBAIKAN LANJUTAN";
    closingColor = preset.accent;
  } else if (tone === "neutral") {
    closingHeadline = "DIPANTAU SECARA BERKALA";
  }

  closingSlide.addText(closingHeadline, {
    x: 0.5, y: 2.5, w: "90%", h: 1.0,
    fontSize: 28, color: closingColor, bold: true, align: "center",
  });

  // Insight angka besar jika ada
  if (content.step7?.chartData && content.step7.chartData.length > 0) {
    const insight = generateChartInsight(content.step7.chartData);
    const match = insight.match(/(\d+)%/);
    if (match) {
      closingSlide.addText(`${match[1]}%`, {
        x: 0.5, y: 3.8, w: "90%", h: 1.0,
        fontSize: 48, color: preset.accent, bold: true, align: "center",
      });
      closingSlide.addText("Perbaikan", {
        x: 0.5, y: 4.8, w: "90%", h: 0.4,
        fontSize: 14, color: preset.textLight, align: "center",
      });
    }
  }

  // Generate file - triggers download in browser
  const fileName = `Kaizen-${slugify(title)}-${new Date().toISOString().split("T")[0]}.pptx`;
  await pres.writeFile({ fileName });
}
