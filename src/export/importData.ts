import { strFromU8, unzipSync } from "fflate";
import { getDB } from "../db/db";
import type { Attachment, Book, Photo } from "../db/schema";
import { makeThumb } from "../lib/image";
import { THEME_STORAGE_KEY, THEMES } from "../theme/themes";
import { FORMAT_VERSION, type ExportData } from "./build";

export interface ParsedImport {
  data: ExportData;
  photoBytes: Map<string, Uint8Array>;
  bookBytes: Map<string, Uint8Array>;
  libBytes: Map<string, Uint8Array>;
}

/** Читает и проверяет файл копии (архив .zip или файл .json), но ничего не записывает */
export async function parseImport(file: File): Promise<ParsedImport> {
  const photoBytes = new Map<string, Uint8Array>();
  const bookBytes = new Map<string, Uint8Array>();
  const libBytes = new Map<string, Uint8Array>();
  let json: string;

  if (file.name.toLowerCase().endsWith(".json")) {
    json = await file.text();
  } else {
    let files: Record<string, Uint8Array>;
    try {
      files = unzipSync(new Uint8Array(await file.arrayBuffer()));
    } catch {
      throw new Error("Не удалось открыть файл. Выберите архив .zip или файл .json, сохранённые в этом приложении.");
    }
    const raw = files["data.json"];
    if (!raw) throw new Error("В архиве нет файла data.json. Это не копия ежедневника.");
    json = strFromU8(raw);
    for (const [path, bytes] of Object.entries(files)) {
      if (path.startsWith("photos/")) {
        const id = path.slice("photos/".length).replace(/\.jpg$/i, "");
        if (id) photoBytes.set(id, bytes);
      } else if (path.startsWith("books/")) {
        const id = path.slice("books/".length).replace(/\.jpg$/i, "");
        if (id) bookBytes.set(id, bytes);
      } else if (path.startsWith("library/")) {
        const id = path.slice("library/".length);
        if (id) libBytes.set(id, bytes);
      }
    }
  }

  let data: ExportData;
  try {
    data = JSON.parse(json) as ExportData;
  } catch {
    throw new Error("Файл повреждён и не читается.");
  }
  if (data.app !== "dnevnik") throw new Error("Это не копия ежедневника.");
  if (typeof data.format !== "number" || data.format > FORMAT_VERSION) {
    throw new Error("Копия сделана в более новой версии приложения. Обновите приложение и попробуйте снова.");
  }
  data.days ??= [];
  data.habits ??= [];
  data.habitLogs ??= [];
  data.questions ??= [];
  data.answers ??= [];
  data.measurements ??= [];
  data.photos ??= [];
  data.settings ??= [];
  data.events ??= [];
  data.books ??= [];
  data.bookDays ??= [];
  data.bookQuotes ??= [];
  data.folders ??= [];
  data.materials ??= [];
  data.attachments ??= [];
  return { data, photoBytes, bookBytes, libBytes };
}

/** Добавляет данные из копии к текущим. Записи с одинаковыми ключами заменяются. */
export async function applyImport(parsed: ParsedImport): Promise<void> {
  const { data, photoBytes, bookBytes, libBytes } = parsed;

  const photos: Photo[] = [];
  for (const m of data.photos) {
    const bytes = photoBytes.get(m.id);
    if (!bytes) continue;
    const blob = new Blob([bytes as unknown as BlobPart], { type: "image/jpeg" });
    photos.push({
      id: m.id,
      date: m.date,
      kind: m.kind,
      blob,
      thumbBlob: await makeThumb(blob),
      width: m.width,
      height: m.height,
      createdAt: m.createdAt
    });
  }

  const books: Book[] = [];
  for (const m of data.books) {
    const { coverFile, ...rest } = m;
    const bytes = bookBytes.get(m.id);
    const cover = bytes ? new Blob([bytes as unknown as BlobPart], { type: "image/jpeg" }) : null;
    books.push({ ...rest, cover, coverThumb: cover ? await makeThumb(cover) : null });
    void coverFile;
  }

  const attachments: { meta: Attachment; blob: Blob }[] = [];
  for (const a of data.attachments) {
    const { file, ...rest } = a;
    void file;
    const bytes = libBytes.get(a.id);
    if (!bytes) continue;
    const blob = new Blob([bytes as unknown as BlobPart], { type: a.mime });
    attachments.push({ meta: { ...rest, thumb: a.kind === "image" ? await makeThumb(blob) : null }, blob });
  }

  const db = await getDB();
  const tx = db.transaction(
    ["days", "habits", "habitLogs", "questions", "answers", "photos", "measurements", "settings", "events", "books", "bookDays", "bookQuotes", "folders", "materials", "attachments", "attachmentBlobs"],
    "readwrite"
  );
  data.days.forEach((x) => tx.objectStore("days").put(x));
  data.habits.forEach((x) => tx.objectStore("habits").put(x));
  data.habitLogs.forEach((x) => tx.objectStore("habitLogs").put(x));
  data.questions.forEach((x) => tx.objectStore("questions").put(x));
  data.answers.forEach((x) => tx.objectStore("answers").put(x));
  data.measurements.forEach((x) => tx.objectStore("measurements").put(x));
  photos.forEach((x) => tx.objectStore("photos").put(x));
  data.events.forEach((x) => tx.objectStore("events").put(x));
  books.forEach((x) => tx.objectStore("books").put(x));
  data.bookDays.forEach((x) => tx.objectStore("bookDays").put(x));
  data.bookQuotes.forEach((x) => tx.objectStore("bookQuotes").put(x));
  data.folders.forEach((x) => tx.objectStore("folders").put(x));
  data.materials.forEach((x) => tx.objectStore("materials").put(x));
  attachments.forEach((x) => {
    tx.objectStore("attachments").put(x.meta);
    tx.objectStore("attachmentBlobs").put({ id: x.meta.id, blob: x.blob });
  });
  data.settings.filter((s) => s.key !== "seeded").forEach((s) => tx.objectStore("settings").put(s));
  // стартовые привычки и вопросы больше не нужны: в копии уже есть ваши
  tx.objectStore("settings").put({ key: "seeded", value: true });
  await tx.done;

  if (data.theme && THEMES.some((t) => t.id === data.theme)) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, data.theme);
    } catch {
      /* ignore */
    }
  }
}
