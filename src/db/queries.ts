import { getDB } from "./db";
import type {
  Answer,
  Attachment,
  AttachmentBlob,
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
} from "./schema";
import { newId } from "../lib/id";

/* ---------- Дни ---------- */
export function defaultDay(date: string): Day {
  const now = Date.now();
  return {
    date,
    mode: "regular",
    morningMood: null,
    sleepQuality: null,
    eveningMood: null,
    thoughts: "",
    coverPhotoId: null,
    createdAt: now,
    updatedAt: now
  };
}

export async function getDay(date: string): Promise<Day | undefined> {
  return (await getDB()).get("days", date);
}

export async function putDay(day: Day): Promise<void> {
  await (await getDB()).put("days", day);
}

// Все изменения дня идут по очереди, чтобы быстрые правки не затирали друг друга
let chain: Promise<unknown> = Promise.resolve();
export function patchDay(date: string, patch: Partial<Day>): Promise<Day> {
  const run = chain.then(async () => {
    const db = await getDB();
    const cur = (await db.get("days", date)) ?? defaultDay(date);
    const next: Day = { ...cur, ...patch, date, updatedAt: Date.now() };
    await db.put("days", next);
    return next;
  });
  chain = run.catch(() => undefined);
  return run;
}

/* ---------- Привычки ---------- */
export async function listHabits(): Promise<Habit[]> {
  const all = await (await getDB()).getAll("habits");
  return all.filter((h) => !h.archived).sort((a, b) => a.order - b.order);
}
export async function putHabit(h: Habit): Promise<void> {
  await (await getDB()).put("habits", h);
}
export async function getHabitLogs(date: string): Promise<HabitLog[]> {
  return (await getDB()).getAllFromIndex("habitLogs", "by-date", date);
}
export async function setHabitLog(date: string, habitId: string, done: boolean): Promise<void> {
  const db = await getDB();
  const cur = await db.get("habitLogs", [date, habitId]);
  await db.put("habitLogs", { ...cur, date, habitId, done });
}
export async function setHabitNote(date: string, habitId: string, note: string): Promise<void> {
  const db = await getDB();
  const cur = await db.get("habitLogs", [date, habitId]);
  await db.put("habitLogs", { done: false, ...cur, date, habitId, note: note.trim() === "" ? undefined : note });
}

/* ---------- Вопросы ---------- */
export async function listQuestions(): Promise<Question[]> {
  const all = await (await getDB()).getAll("questions");
  return all.filter((q) => !q.archived).sort((a, b) => a.order - b.order);
}
export async function putQuestion(q: Question): Promise<void> {
  await (await getDB()).put("questions", q);
}
export async function getAnswers(date: string): Promise<Answer[]> {
  return (await getDB()).getAllFromIndex("answers", "by-date", date);
}
export async function putAnswer(date: string, questionId: string, text: string): Promise<void> {
  const db = await getDB();
  if (text.trim() === "") await db.delete("answers", [date, questionId]);
  else await db.put("answers", { date, questionId, text });
}

/* ---------- Фото ---------- */
export async function addPhoto(p: Photo): Promise<void> {
  await (await getDB()).put("photos", p);
}
export async function getPhotos(date: string): Promise<Photo[]> {
  const all = await (await getDB()).getAllFromIndex("photos", "by-date", date);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}
export async function deletePhoto(id: string): Promise<void> {
  await (await getDB()).delete("photos", id);
}

/* ---------- Стартовый набор (можно изменить или удалить) ---------- */
let seeding: Promise<void> | null = null;
export function ensureSeeded(): Promise<void> {
  if (!seeding) {
    seeding = (async () => {
      const db = await getDB();
      if (await db.get("settings", "seeded")) return;
      const tx = db.transaction(["habits", "questions", "settings"], "readwrite");
      const now = Date.now();
      ["Вода", "Прогулка", "Чтение"].forEach((title, order) =>
        tx.objectStore("habits").put({ id: newId(), title, icon: "", order, archived: false, createdAt: now })
      );
      ["Что сегодня получилось?", "Что порадовало?"].forEach((text, order) =>
        tx.objectStore("questions").put({ id: newId(), text, order, archived: false, showInLight: false })
      );
      tx.objectStore("settings").put({ key: "seeded", value: true });
      await tx.done;
    })();
  }
  return seeding;
}

/* ---------- Выборки за период (для месяца) ---------- */
export async function getDaysInRange(start: string, end: string): Promise<Day[]> {
  return (await getDB()).getAll("days", IDBKeyRange.bound(start, end));
}
export async function getAllHabits(): Promise<Habit[]> {
  const all = await (await getDB()).getAll("habits");
  return all.sort((a, b) => a.order - b.order);
}
export async function getHabitLogsInRange(start: string, end: string): Promise<HabitLog[]> {
  return (await getDB()).getAllFromIndex("habitLogs", "by-date", IDBKeyRange.bound(start, end));
}

/* ---------- Настройки ---------- */
export async function getSetting<T>(key: string): Promise<T | undefined> {
  const row: SettingRow | undefined = await (await getDB()).get("settings", key);
  return row?.value as T | undefined;
}
export async function putSetting(key: string, value: unknown): Promise<void> {
  await (await getDB()).put("settings", { key, value });
}

/* ---------- Вес и объёмы ---------- */
export async function getMeasurement(date: string): Promise<Measurement | undefined> {
  return (await getDB()).get("measurements", date);
}
let mChain: Promise<unknown> = Promise.resolve();
export function patchMeasurement(date: string, patch: Partial<Measurement>): Promise<void> {
  const run = mChain.then(async () => {
    const db = await getDB();
    const cur: Measurement = (await db.get("measurements", date)) ?? { date };
    await db.put("measurements", { ...cur, ...patch, date });
  });
  mChain = run.catch(() => undefined);
  return run;
}

/* ---------- Фото по номеру и все замеры ---------- */
export async function getPhoto(id: string): Promise<Photo | undefined> {
  return (await getDB()).get("photos", id);
}
export async function getAllMeasurements(): Promise<Measurement[]> {
  const all = await (await getDB()).getAll("measurements");
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

/* ---------- События календаря ---------- */
export async function listEvents(): Promise<CalEvent[]> {
  return (await getDB()).getAll("events");
}
export async function putEvent(e: CalEvent): Promise<void> {
  await (await getDB()).put("events", e);
}
export async function deleteEvent(id: string): Promise<void> {
  await (await getDB()).delete("events", id);
}

/** Подходит ли событие к дате (в том числе ежегодное повторение) */
export function eventOnDate(e: CalEvent, iso: string): boolean {
  if (e.date === iso) return true;
  return e.repeat === "yearly" && iso > e.date && e.date.slice(5) === iso.slice(5);
}

/* ---------- Книги ---------- */
export async function listBooks(): Promise<Book[]> {
  return (await getDB()).getAll("books");
}
export async function getBook(id: string): Promise<Book | undefined> {
  return (await getDB()).get("books", id);
}
export async function putBook(b: Book): Promise<void> {
  await (await getDB()).put("books", b);
}
export async function deleteBook(id: string): Promise<void> {
  const db = await getDB();
  const [days, quotes] = await Promise.all([
    db.getAllKeysFromIndex("bookDays", "by-book", id),
    db.getAllKeysFromIndex("bookQuotes", "by-book", id)
  ]);
  const tx = db.transaction(["books", "bookDays", "bookQuotes"], "readwrite");
  tx.objectStore("books").delete(id);
  days.forEach((k) => tx.objectStore("bookDays").delete(k));
  quotes.forEach((k) => tx.objectStore("bookQuotes").delete(k));
  await tx.done;
}
export async function listBookDays(bookId: string): Promise<BookDay[]> {
  return (await getDB()).getAllFromIndex("bookDays", "by-book", bookId);
}
export async function listBookDaysOnDate(date: string): Promise<BookDay[]> {
  return (await getDB()).getAllFromIndex("bookDays", "by-date", date);
}
export async function setBookDay(bookId: string, date: string, on: boolean): Promise<void> {
  const db = await getDB();
  if (on) await db.put("bookDays", { bookId, date });
  else await db.delete("bookDays", [bookId, date]);
}
export async function listQuotes(bookId: string): Promise<BookQuote[]> {
  const all = await (await getDB()).getAllFromIndex("bookQuotes", "by-book", bookId);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}
export async function putQuote(q: BookQuote): Promise<void> {
  await (await getDB()).put("bookQuotes", q);
}
export async function deleteQuote(id: string): Promise<void> {
  await (await getDB()).delete("bookQuotes", id);
}

/* ---------- Полезное: папки и материалы ---------- */
export async function listFolders(): Promise<Folder[]> {
  const all = await (await getDB()).getAll("folders");
  return all.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
}
export async function putFolder(f: Folder): Promise<void> {
  await (await getDB()).put("folders", f);
}
export async function listAllMaterials(): Promise<Material[]> {
  const all = await (await getDB()).getAll("materials");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function listMaterials(folderId: string): Promise<Material[]> {
  const all = await (await getDB()).getAllFromIndex("materials", "by-folder", folderId);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getMaterial(id: string): Promise<Material | undefined> {
  return (await getDB()).get("materials", id);
}
export async function listAttachments(materialId: string): Promise<Attachment[]> {
  const all = await (await getDB()).getAllFromIndex("attachments", "by-material", materialId);
  return all.sort((a, b) => a.createdAt - b.createdAt);
}
export async function getAttachmentBlob(id: string): Promise<Blob | undefined> {
  return (await (await getDB()).get("attachmentBlobs", id))?.blob;
}

/** Сохраняет материал вместе с добавленными и удалёнными вложениями одной операцией */
export async function saveMaterial(
  m: Material,
  add: { meta: Attachment; blob: Blob }[],
  removeIds: string[]
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(["materials", "attachments", "attachmentBlobs"], "readwrite");
  tx.objectStore("materials").put(m);
  add.forEach((a) => {
    tx.objectStore("attachments").put(a.meta);
    const row: AttachmentBlob = { id: a.meta.id, blob: a.blob };
    tx.objectStore("attachmentBlobs").put(row);
  });
  removeIds.forEach((id) => {
    tx.objectStore("attachments").delete(id);
    tx.objectStore("attachmentBlobs").delete(id);
  });
  await tx.done;
}

export async function deleteMaterial(id: string): Promise<void> {
  const db = await getDB();
  const attIds = await db.getAllKeysFromIndex("attachments", "by-material", id);
  const tx = db.transaction(["materials", "attachments", "attachmentBlobs"], "readwrite");
  tx.objectStore("materials").delete(id);
  attIds.forEach((k) => {
    tx.objectStore("attachments").delete(k);
    tx.objectStore("attachmentBlobs").delete(k);
  });
  await tx.done;
}

export async function deleteFolder(id: string): Promise<void> {
  const db = await getDB();
  const mats = await db.getAllKeysFromIndex("materials", "by-folder", id);
  const attIds: string[] = [];
  for (const m of mats) attIds.push(...(await db.getAllKeysFromIndex("attachments", "by-material", m)));
  const tx = db.transaction(["folders", "materials", "attachments", "attachmentBlobs"], "readwrite");
  tx.objectStore("folders").delete(id);
  mats.forEach((k) => tx.objectStore("materials").delete(k));
  attIds.forEach((k) => {
    tx.objectStore("attachments").delete(k);
    tx.objectStore("attachmentBlobs").delete(k);
  });
  await tx.done;
}
