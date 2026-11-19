import { openDB, type IDBPDatabase } from "idb";
import type { DnevnikDB } from "./schema";

export const DB_NAME = "dnevnik";
export const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<DnevnikDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<DnevnikDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Миграции: каждый новый шаг добавляется как отдельный if (oldVersion < N)
        if (oldVersion < 1) {
          db.createObjectStore("days", { keyPath: "date" });
          db.createObjectStore("habits", { keyPath: "id" });
          const logs = db.createObjectStore("habitLogs", { keyPath: ["date", "habitId"] });
          logs.createIndex("by-date", "date");
          logs.createIndex("by-habit", "habitId");
          db.createObjectStore("questions", { keyPath: "id" });
          const answers = db.createObjectStore("answers", { keyPath: ["date", "questionId"] });
          answers.createIndex("by-date", "date");
          const photos = db.createObjectStore("photos", { keyPath: "id" });
          photos.createIndex("by-date", "date");
          db.createObjectStore("measurements", { keyPath: "date" });
          db.createObjectStore("settings", { keyPath: "key" });
        }
        if (oldVersion < 2) {
          const events = db.createObjectStore("events", { keyPath: "id" });
          events.createIndex("by-date", "date");
          db.createObjectStore("books", { keyPath: "id" });
          const bookDays = db.createObjectStore("bookDays", { keyPath: ["bookId", "date"] });
          bookDays.createIndex("by-book", "bookId");
          bookDays.createIndex("by-date", "date");
          const quotes = db.createObjectStore("bookQuotes", { keyPath: "id" });
          quotes.createIndex("by-book", "bookId");
        }
        if (oldVersion < 3) {
          db.createObjectStore("folders", { keyPath: "id" });
          const materials = db.createObjectStore("materials", { keyPath: "id" });
          materials.createIndex("by-folder", "folderId");
          const attachments = db.createObjectStore("attachments", { keyPath: "id" });
          attachments.createIndex("by-material", "materialId");
          db.createObjectStore("attachmentBlobs", { keyPath: "id" });
        }
      }
    });
  }
  return dbPromise as Promise<IDBPDatabase<DnevnikDB>>;
}

/** Просим iOS не очищать данные автоматически. Лучше всего работает у приложения на экране «Домой». */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* ignore */
  }
  return false;
}

export async function isStoragePersistent(): Promise<boolean> {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}
