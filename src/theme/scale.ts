/**
 * Цвета шкалы 0–10: плавный переход от глубокого синего через светлые тона
 * к оранжевому и красному. Дробные значения (например, среднее) смешиваются между соседними цветами.
 */
export const SCALE_COLORS: string[] = [
  "#2B59A6", // 0
  "#4F7BBB", // 1
  "#739CCF", // 2
  "#9BB5D1", // 3
  "#C3C5BD", // 4
  "#EBD3A6", // 5
  "#EDBD84", // 6
  "#EEA661", // 7
  "#EB8946", // 8
  "#E36538", // 9
  "#D93A2B"  // 10
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

export function scaleColor(value: number | null | undefined): string | null {
  if (value == null) return null;
  const v = Math.max(0, Math.min(10, value));
  const lo = Math.floor(v);
  const hi = Math.min(10, lo + 1);
  const t = v - lo;
  if (t === 0) return SCALE_COLORS[lo];
  const a = hexToRgb(SCALE_COLORS[lo]);
  const b = hexToRgb(SCALE_COLORS[hi]);
  return rgbToHex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Цвет текста, читаемый поверх цвета шкалы */
export function scaleInk(value: number): string {
  return luminance(scaleColor(value)!) > 0.3 ? "#2B2420" : "#FFFFFF";
}
