/**
 * Utility to return auto-shrinking text font size class based on text length.
 * Prevents text truncation / line-clamp clipping issues during PDF capture.
 */
export function getAutoFontSizeClass(
  text: string,
  thresholds: { length: number; className: string }[]
): string {
  const len = (text || "").length;
  for (const t of thresholds) {
    if (len <= t.length) return t.className;
  }
  return thresholds[thresholds.length - 1].className;
}
