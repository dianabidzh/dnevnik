import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { strToU8, zipSync, type Zippable } from "fflate";
import { getDB } from "../db/db";
import { eventOnDate } from "../db/queries";
import type {
  Answer,
  Attachment,
  Book,
  BookDay,
  BookQuote,
  CalEvent,
  Day,
  Folder,
  Habit,
  HabitLog,
  Material,
  Measurement,
  Photo,
  Question,
  SettingRow
} from "../db/schema";
import { scaleColor, scaleInk } from "../theme/scale";
import { THEME_STORAGE_KEY } from "../theme/themes";

export const FORMAT_VERSION = 1;

export interface PhotoMeta {
  id: string;
  date: string;
  kind: Photo["kind"];
  width: number;
  height: number;
  createdAt: number;
  file: string;
}

export type BookMeta = Omit<Book, "cover" | "coverThumb"> & { coverFile: string | null };

export type AttachmentMeta = Omit<Attachment, "thumb"> & { file: string };

export interface ExportData {
  app: "dnevnik";
  format: number;
  exportedAt: string;
  theme: string | null;
  settings: SettingRow[];
  days: Day[];
  habits: Habit[];
  habitLogs: HabitLog[];
  questions: Question[];
  answers: Answer[];
  measurements: Measurement[];
  photos: PhotoMeta[];
  events: CalEvent[];
  books: BookMeta[];
  bookDays: BookDay[];
  bookQuotes: BookQuote[];
  folders: Folder[];
  materials: Material[];
  attachments: AttachmentMeta[];
}

export interface BuiltExport {
  file: File;
  days: number;
  photos: number;
  withPhotos: boolean;
}

async function gather(): Promise<{ data: ExportData; photos: Photo[]; books: Book[] }> {
  const db = await getDB();
  const [days, habits, habitLogs, questions, answers, measurements, photos, settings, events, books, bookDays, bookQuotes, folders, materials, attachments] = await Promise.all([
    db.getAll("days"),
    db.getAll("habits"),
    db.getAll("habitLogs"),
    db.getAll("questions"),
    db.getAll("answers"),
    db.getAll("measurements"),
    db.getAll("photos"),
    db.getAll("settings"),
    db.getAll("events"),
    db.getAll("books"),
    db.getAll("bookDays"),
    db.getAll("bookQuotes"),
    db.getAll("folders"),
    db.getAll("materials"),
    db.getAll("attachments")
  ]);
  let theme: string | null = null;
  try {
    theme = localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const data: ExportData = {
    app: "dnevnik",
    format: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    theme,
    settings,
    days: days.sort((a, b) => a.date.localeCompare(b.date)),
    habits: habits.sort((a, b) => a.order - b.order),
    habitLogs,
    questions: questions.sort((a, b) => a.order - b.order),
    answers,
    measurements,
    photos: photos.map((p) => ({
      id: p.id,
      date: p.date,
      kind: p.kind,
      width: p.width,
      height: p.height,
      createdAt: p.createdAt,
      file: "photos/" + p.id + ".jpg"
    })),
    events,
    books: books.map(({ cover, coverThumb, ...rest }) => ({ ...rest, coverFile: cover ? "books/" + rest.id + ".jpg" : null })),
    bookDays,
    bookQuotes,
    folders: folders.sort((a, b) => a.order - b.order),
    materials,
    attachments: attachments.map(({ thumb, ...rest }) => ({ ...rest, file: "library/" + rest.id }))
  };
  return { data, photos, books };
}

/* ---------- Человекочитаемые версии ---------- */
function dateTitle(iso: string): string {
  return format(parseISO(iso), "d MMMM yyyy, EEEE", { locale: ru });
}

function score(v: number | null): string {
  return v === null ? "—" : v + " из 10";
}

function groupBy<T>(items: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return m;
}

function numLine(label: string, v: number | undefined, unit: string): string | null {
  return v === undefined ? null : label + ": " + String(v).replace(".", ",") + " " + unit;
}

function dayDetails(data: ExportData) {
  const habitName = new Map(data.habits.map((h) => [h.id, h.title]));
  const questionText = new Map(data.questions.map((q) => [q.id, q.text]));
  const doneByDate = groupBy(
    data.habitLogs.filter((l) => l.done),
    (l) => l.date
  );
  const answersByDate = groupBy(
    data.answers.filter((a) => a.text.trim() !== ""),
    (a) => a.date
  );
  const measByDate = new Map(data.measurements.map((m) => [m.date, m]));
  const photosByDate = groupBy(data.photos, (p) => p.date);
  const notesByDate = groupBy(
    data.habitLogs.filter((l) => l.note),
    (l) => l.date
  );
  return { habitName, questionText, doneByDate, answersByDate, measByDate, photosByDate, notesByDate };
}

export function buildTxt(data: ExportData): string {
  const d = dayDetails(data);
  const out: string[] = ["МОЙ ЕЖЕДНЕВНИК", "Сохранено: " + dateTitle(data.exportedAt.slice(0, 10)), ""];
  for (const day of data.days) {
    out.push("==============================", dateTitle(day.date), "==============================");
    out.push("Утро: " + score(day.morningMood));
    out.push("Сон: " + score(day.sleepQuality));
    out.push("Вечер: " + score(day.eveningMood));

    const done = (d.doneByDate.get(day.date) ?? []).map((l) => d.habitName.get(l.habitId) ?? "привычка");
    out.push("", "Привычки: " + (done.length ? done.join(", ") : "ничего не отмечено"));
    for (const l of d.notesByDate.get(day.date) ?? []) {
      out.push("  Заметка к привычке «" + (d.habitName.get(l.habitId) ?? "привычка") + "»: " + l.note);
    }

    const m = d.measByDate.get(day.date);
    const body = m
      ? [numLine("Вес", m.weight, "кг"), numLine("Талия", m.waist, "см"), numLine("Бёдра", m.hips, "см"), numLine("Грудь", m.chest, "см")].filter(
          (x): x is string => x !== null
        )
      : [];
    if (body.length) out.push(body.join("; "));

    const answers = d.answersByDate.get(day.date) ?? [];
    for (const a of answers) {
      out.push("", d.questionText.get(a.questionId) ?? "Вопрос", a.text);
    }
    if (day.thoughts.trim()) out.push("", "Мысли и инсайты:", day.thoughts.trim());

    const photoCount = (d.photosByDate.get(day.date) ?? []).length;
    if (photoCount) out.push("", "Фото: " + photoCount + " (в папке photos)");
    out.push("", "");
  }
  if (data.days.length === 0) out.push("Записей пока нет.");
  out.push(...txtExtras(data));
  return out.join("\n");
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function chip(label: string, v: number | null): string {
  if (v === null) return '<span class="chip empty">' + esc(label) + ": —</span>";
  return (
    '<span class="chip" style="background:' + scaleColor(v) + ";color:" + scaleInk(v) + '">' + esc(label) + ": " + v + "</span>"
  );
}

export function buildHtml(data: ExportData): string {
  const d = dayDetails(data);
  const parts: string[] = [];
  for (const day of data.days) {
    const done = (d.doneByDate.get(day.date) ?? []).map((l) => d.habitName.get(l.habitId) ?? "привычка");
    const m = d.measByDate.get(day.date);
    const body = m
      ? [numLine("Вес", m.weight, "кг"), numLine("Талия", m.waist, "см"), numLine("Бёдра", m.hips, "см"), numLine("Грудь", m.chest, "см")].filter(
          (x): x is string => x !== null
        )
      : [];
    const photos = (d.photosByDate.get(day.date) ?? []).filter((p) => p.kind === "snapshot");
    parts.push('<section class="day">');
    parts.push("<h2>" + esc(dateTitle(day.date)) + "</h2>");
    parts.push('<p class="chips">' + chip("Утро", day.morningMood) + chip("Сон", day.sleepQuality) + chip("Вечер", day.eveningMood) + "</p>");
    parts.push("<p><b>Привычки:</b> " + (done.length ? esc(done.join(", ")) : "ничего не отмечено") + "</p>");
    for (const l of d.notesByDate.get(day.date) ?? []) {
      parts.push('<p class="note">Заметка к привычке «' + esc(d.habitName.get(l.habitId) ?? "привычка") + "»: " + esc(l.note ?? "") + "</p>");
    }
    if (body.length) parts.push("<p>" + esc(body.join("; ")) + "</p>");
    for (const a of d.answersByDate.get(day.date) ?? []) {
      parts.push('<p class="q">' + esc(d.questionText.get(a.questionId) ?? "Вопрос") + '</p><p class="txt">' + esc(a.text) + "</p>");
    }
    if (day.thoughts.trim()) parts.push('<p class="q">Мысли и инсайты</p><p class="txt">' + esc(day.thoughts.trim()) + "</p>");
    if (photos.length) {
      parts.push('<div class="photos">' + photos.map((p) => '<img src="' + esc(p.file) + '" alt="Фото дня">').join("") + "</div>");
    }
    parts.push("</section>");
  }
  if (data.days.length === 0) parts.push("<p>Записей пока нет.</p>");
  parts.push(htmlExtras(data));

  return (
    '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Мой ежедневник</title><style>" +
    "body{margin:0;background:#F2E8D3;color:#3A322C;font:17px/1.6 Georgia,'PT Serif',serif}" +
    "main{max-width:720px;margin:0 auto;padding:32px 20px}" +
    "h1{font-weight:400;font-size:2.2rem}h2{font-weight:400;font-size:1.5rem;margin:0 0 8px}" +
    ".day{background:#FBF5E6;border:1px solid #DCCFB4;border-radius:14px;padding:18px 20px;margin:0 0 18px;page-break-inside:avoid}" +
    ".chip{display:inline-block;padding:2px 12px;margin:0 6px 6px 0;border-radius:999px;font-size:.9rem}.chip.empty{background:#E8DEC8;color:#7A6C5F}" +
    ".q{margin:14px 0 2px;color:#7A6C5F;font-style:italic}.txt{margin:0;white-space:pre-wrap}" +
    ".photos{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.photos img{width:160px;height:160px;object-fit:cover;border-radius:8px}" +
    ".note{color:#7A6C5F;font-size:.9rem}" +
    "</style></head><body><main><h1>Мой ежедневник</h1><p class=\"note\">Сохранено: " +
    esc(dateTitle(data.exportedAt.slice(0, 10))) +
    ". Чтобы фото отображались, держите этот файл рядом с папкой photos.</p>" +
    parts.join("") +
    "</main></body></html>"
  );
}

/* ---------- Сборка файла ---------- */
export async function buildExport(withPhotos: boolean): Promise<BuiltExport> {
  const { data, photos, books } = await gather();
  const stamp = format(new Date(), "yyyy-MM-dd");

  if (!withPhotos) {
    const file = new File([JSON.stringify(data, null, 2)], "dnevnik-data-" + stamp + ".json", { type: "application/json" });
    return { file, days: data.days.length, photos: 0, withPhotos: false };
  }

  const files: Zippable = {
    "data.json": strToU8(JSON.stringify(data, null, 2)),
    "dnevnik.txt": strToU8(buildTxt(data)),
    "dnevnik.html": strToU8(buildHtml(data))
  };
  for (const p of photos) {
    files["photos/" + p.id + ".jpg"] = [new Uint8Array(await p.blob.arrayBuffer()), { level: 0 }];
  }
  for (const b of books) {
    if (b.cover) files["books/" + b.id + ".jpg"] = [new Uint8Array(await b.cover.arrayBuffer()), { level: 0 }];
  }
  const dbForFiles = await getDB();
  for (const a of data.attachments) {
    const row = await dbForFiles.get("attachmentBlobs", a.id);
    if (row) files["library/" + a.id] = [new Uint8Array(await row.blob.arrayBuffer()), { level: 0 }];
  }
  const zipped = zipSync(files);
  const file = new File([zipped as unknown as BlobPart], "dnevnik-" + stamp + ".zip", { type: "application/zip" });
  return { file, days: data.days.length, photos: photos.length, withPhotos: true };
}

/** Отдаёт файл пользователю: через меню «Поделиться» на iPhone или обычным скачиванием */
export async function deliver(file: File): Promise<"shared" | "downloaded" | "cancelled"> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.share === "function" && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Ежедневник" });
      return "shared";
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "downloaded";
}

/* ---------- События и книги в читаемых версиях ---------- */
function bookDetails(data: ExportData) {
  const daysByBook = groupBy(data.bookDays, (x) => x.bookId);
  const quotesByBook = groupBy(data.bookQuotes, (x) => x.bookId);
  return { daysByBook, quotesByBook };
}

function eventLine(e: CalEvent): string {
  return (
    dateTitle(e.date) +
    (e.time ? ", " + e.time : "") +
    ": " +
    e.title +
    (e.repeat === "yearly" ? " (каждый год)" : "") +
    (e.note.trim() ? ". " + e.note.trim() : "")
  );
}

function txtExtras(data: ExportData): string[] {
  const out: string[] = [];
  const bar = "==============================";
  if (data.events.length) {
    out.push(bar, "СОБЫТИЯ", bar);
    for (const e of [...data.events].sort((a, b) => a.date.localeCompare(b.date))) out.push(eventLine(e));
    out.push("", "");
  }
  if (data.books.length) {
    const d = bookDetails(data);
    out.push(bar, "КНИГИ", bar);
    for (const b of data.books) {
      out.push(b.title + (b.author ? " — " + b.author : ""));
      out.push(
        b.finishedAt
          ? "Закончена: " + dateTitle(b.finishedAt) + (b.rating ? ". Оценка: " + b.rating + " из 5" : "")
          : "Читаю сейчас"
      );
      out.push("Дней чтения: " + (d.daysByBook.get(b.id) ?? []).length);
      for (const qt of d.quotesByBook.get(b.id) ?? []) out.push("  Цитата: " + qt.text + (qt.page ? " (стр. " + qt.page + ")" : ""));
      if (b.impression.trim()) out.push("Впечатление: " + b.impression.trim());
      out.push("");
    }
  }
  if (data.folders.length) {
    const d = libraryDetails(data);
    out.push(bar, "ПОЛЕЗНОЕ", bar);
    for (const f of data.folders) {
      out.push(f.emoji + " " + f.name);
      for (const m of d.matsByFolder.get(f.id) ?? []) {
        out.push("  • " + (m.title.trim() || "без названия") + (m.url ? " — " + m.url : ""));
        if (m.text.trim()) out.push("    " + m.text.trim().replace(/\n/g, "\n    "));
        const att = d.attsByMat.get(m.id) ?? [];
        if (att.length) out.push("    Вложения: " + att.map((a) => a.name).join(", ") + " (файлы в папке library архива)");
      }
      out.push("");
    }
  }
  return out;
}

function htmlExtras(data: ExportData): string {
  const parts: string[] = [];
  if (data.events.length) {
    parts.push('<section class="day"><h2>События</h2>');
    for (const e of [...data.events].sort((a, b) => a.date.localeCompare(b.date))) parts.push("<p>" + esc(eventLine(e)) + "</p>");
    parts.push("</section>");
  }
  if (data.books.length) {
    const d = bookDetails(data);
    parts.push('<section class="day"><h2>Книги</h2>');
    for (const b of data.books) {
      parts.push("<p><b>" + esc(b.title) + "</b>" + (b.author ? " — " + esc(b.author) : "") + "<br>");
      parts.push(
        b.finishedAt
          ? "Закончена: " + esc(dateTitle(b.finishedAt)) + (b.rating ? ". Оценка: " + b.rating + " из 5" : "")
          : "Читаю сейчас"
      );
      parts.push("<br>Дней чтения: " + (d.daysByBook.get(b.id) ?? []).length + "</p>");
      for (const qt of d.quotesByBook.get(b.id) ?? []) {
        parts.push('<p class="txt"><i>' + esc(qt.text) + "</i>" + (qt.page ? " (стр. " + esc(qt.page) + ")" : "") + "</p>");
      }
      if (b.impression.trim()) parts.push('<p class="q">Впечатление</p><p class="txt">' + esc(b.impression.trim()) + "</p>");
    }
    parts.push("</section>");
  }
  if (data.folders.length) {
    const d = libraryDetails(data);
    parts.push('<section class="day"><h2>Полезное</h2>');
    for (const f of data.folders) {
      parts.push("<h3>" + esc(f.emoji + " " + f.name) + "</h3>");
      for (const m of d.matsByFolder.get(f.id) ?? []) {
        const title = esc(m.title.trim() || "без названия");
        parts.push("<p><b>" + (m.url ? '<a href="' + esc(m.url) + '">' + title + "</a>" : title) + "</b></p>");
        if (m.text.trim()) parts.push('<p class="txt">' + esc(m.text.trim()) + "</p>");
        const att = d.attsByMat.get(m.id) ?? [];
        if (att.length) parts.push('<p class="note">Вложения: ' + esc(att.map((a) => a.name).join(", ")) + " (в папке library архива)</p>");
      }
    }
    parts.push("</section>");
  }
  return parts.join("");
}

function libraryDetails(data: ExportData) {
  return {
    matsByFolder: groupBy(data.materials, (m) => m.folderId),
    attsByMat: groupBy(data.attachments, (a) => a.materialId)
  };
}
