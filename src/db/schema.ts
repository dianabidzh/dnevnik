import type { DBSchema } from "idb";

export type DayMode = "light" | "regular";
export type Score = number | null; // 0–10 или не заполнено

export interface Day {
  date: string; // "2026-11-18"
  mode: DayMode;
  morningMood: Score;
  sleepQuality: Score;
  eveningMood: Score;
  thoughts: string;
  coverPhotoId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  order: number;
  archived: boolean;
  createdAt: number;
}

export interface HabitLog {
  date: string;
  habitId: string;
  done: boolean;
  note?: string; // короткая заметка к привычке за этот день
}

export interface CalEvent {
  id: string;
  date: string; // первая дата события, "2026-11-18"
  title: string;
  time: string | null; // "14:30" или без времени
  note: string;
  repeat: "none" | "yearly";
  createdAt: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: Blob | null; // обложка 3:4
  coverThumb: Blob | null;
  startedAt?: string | null; // дата начала чтения
  finishedAt: string | null; // дата окончания, если книга дочитана
  rating: number | null; // 1–5
  impression: string;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  emoji: string;
  order: number;
  createdAt: number;
}

export interface Material {
  id: string;
  folderId: string;
  title: string;
  url: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export interface Attachment {
  id: string;
  materialId: string;
  kind: "image" | "file";
  name: string;
  mime: string;
  size: number;
  thumb: Blob | null;
  createdAt: number;
}

export interface AttachmentBlob {
  id: string;
  blob: Blob;
}

export interface BookDay {
  bookId: string;
  date: string;
}

export interface BookQuote {
  id: string;
  bookId: string;
  text: string;
  page: string;
  createdAt: number;
}

export interface Question {
  id: string;
  text: string;
  order: number;
  archived: boolean;
  showInLight: boolean;
}

export interface Answer {
  date: string;
  questionId: string;
  text: string;
}

export interface Photo {
  id: string;
  date: string;
  kind: "snapshot" | "body";
  blob: Blob;
  thumbBlob: Blob;
  width: number;
  height: number;
  createdAt: number;
}

export interface Measurement {
  date: string;
  weight?: number;
  waist?: number;
  hips?: number;
  chest?: number;
  other?: string;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

export interface DnevnikDB extends DBSchema {
  days: { key: string; value: Day };
  habits: { key: string; value: Habit };
  habitLogs: {
    key: [string, string];
    value: HabitLog;
    indexes: { "by-date": string; "by-habit": string };
  };
  questions: { key: string; value: Question };
  answers: {
    key: [string, string];
    value: Answer;
    indexes: { "by-date": string };
  };
  photos: {
    key: string;
    value: Photo;
    indexes: { "by-date": string };
  };
  measurements: { key: string; value: Measurement };
  settings: { key: string; value: SettingRow };
  events: { key: string; value: CalEvent; indexes: { "by-date": string } };
  books: { key: string; value: Book };
  bookDays: {
    key: [string, string];
    value: BookDay;
    indexes: { "by-book": string; "by-date": string };
  };
  bookQuotes: { key: string; value: BookQuote; indexes: { "by-book": string } };
  folders: { key: string; value: Folder };
  materials: { key: string; value: Material; indexes: { "by-folder": string } };
  attachments: { key: string; value: Attachment; indexes: { "by-material": string } };
  attachmentBlobs: { key: string; value: AttachmentBlob };
}
