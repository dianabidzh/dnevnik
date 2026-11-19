import type { Attachment, Material } from "../db/schema";
import { newId } from "./id";
import { processPhoto } from "./image";

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " КБ";
  return (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " МБ";
}

export function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return t;
  return "https://" + t;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function graphemes(s: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg("ru", { granularity: "grapheme" }).segment(s), (x) => x.segment);
  return Array.from(s);
}

/** Последний символ строки с учётом составных смайликов: удобно, когда вписывают новый смайлик после старого */
export function lastGrapheme(s: string): string {
  const g = graphemes(s.trim());
  return g.length ? g[g.length - 1] : "";
}

export function materialLabel(m: Pick<Material, "title" | "url" | "text">): string {
  return m.title.trim() || (m.url ? hostOf(m.url) : "") || m.text.trim().slice(0, 40) || "Без названия";
}

/** Имя файла для сохранения: фото всегда уходят как .jpg */
export function saveName(a: Attachment): string {
  return a.kind === "image" ? a.name.replace(/\.[^.]+$/, "") + ".jpg" : a.name;
}

export interface PendingAttachment {
  meta: Attachment;
  blob: Blob;
}

/** Готовит файл к сохранению: фото уменьшаются, остальные файлы сохраняются как есть */
export async function prepareAttachment(materialId: string, file: File): Promise<PendingAttachment> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Файл «" + file.name + "» больше 50 МБ.");
  const base = { id: newId(), materialId, name: file.name || "файл", createdAt: Date.now() };
  if (file.type.startsWith("image/") && file.type !== "image/svg+xml" && file.type !== "image/gif") {
    try {
      const p = await processPhoto(file);
      return { meta: { ...base, kind: "image", mime: "image/jpeg", size: p.blob.size, thumb: p.thumbBlob }, blob: p.blob };
    } catch {
      /* сохраним как обычный файл */
    }
  }
  return {
    meta: { ...base, kind: "file", mime: file.type || "application/octet-stream", size: file.size, thumb: null },
    blob: file
  };
}
