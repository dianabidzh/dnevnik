import { useState, type ChangeEvent } from "react";
import { BookCover } from "../../components/BookCover";
import { Sheet } from "../../components/Sheet";
import * as q from "../../db/queries";
import type { Book } from "../../db/schema";
import { newId } from "../../lib/id";
import { processCover } from "../../lib/image";
import { todayISO } from "../../utils/dates";

function BookForm({ book, onSaved, onDeleted }: { book: Book | null; onSaved: (b: Book) => void; onDeleted: () => void }) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [started, setStarted] = useState(book ? book.startedAt ?? "" : todayISO());
  const [cover, setCover] = useState<Blob | null>(book?.cover ?? null);
  const [thumb, setThumb] = useState<Blob | null>(book?.coverThumb ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const r = await processCover(file);
      setCover(r.cover);
      setThumb(r.coverThumb);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить обложку");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!title.trim()) return;
    const next: Book = {
      id: book?.id ?? newId(),
      title: title.trim(),
      author: author.trim(),
      cover,
      coverThumb: thumb,
      startedAt: started || null,
      finishedAt: book?.finishedAt ?? null,
      rating: book?.rating ?? null,
      impression: book?.impression ?? "",
      createdAt: book?.createdAt ?? Date.now()
    };
    await q.putBook(next);
    onSaved(next);
  }

  async function remove() {
    if (!book) return;
    if (window.confirm("Удалить книгу «" + book.title + "» вместе с цитатами и днями чтения? Это нельзя отменить.")) {
      await q.deleteBook(book.id);
      onDeleted();
    }
  }

  return (
    <div className="event-form">
      <div className="cover-pick">
        <div className="cover-pick-img">
          <BookCover book={{ title: title || "Новая книга", cover, coverThumb: thumb }} />
        </div>
        <label className={"btn ghost" + (busy ? " busy" : "")} style={{ cursor: "pointer" }}>
          {busy ? "Загружаю…" : cover ? "Другая обложка" : "Добавить обложку"}
          <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={busy} />
        </label>
        <p className="muted small">Фото обрежется по центру до пропорции 3:4.</p>
        {error && <p className="error small">{error}</p>}
      </div>

      <label className="form-field">
        <span>Название</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="form-field">
        <span>Автор</span>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} />
      </label>
      <label className="form-field">
        <span>Начала читать</span>
        <input type="date" value={started} onChange={(e) => setStarted(e.target.value)} />
      </label>

      <div className="form-actions">
        <button className="btn" onClick={save} disabled={!title.trim() || busy}>
          Сохранить
        </button>
        {book && (
          <button className="link" onClick={remove}>
            Удалить книгу
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  book: Book | null;
  onClose: () => void;
  onSaved: (b: Book) => void;
  onDeleted?: () => void;
}

export function BookEditSheet({ open, book, onClose, onSaved, onDeleted }: Props) {
  return (
    <Sheet open={open} title={book ? "Книга" : "Новая книга"} onClose={onClose}>
      <BookForm
        book={book}
        onSaved={(b) => {
          onSaved(b);
          onClose();
        }}
        onDeleted={() => {
          onDeleted?.();
          onClose();
        }}
      />
    </Sheet>
  );
}
