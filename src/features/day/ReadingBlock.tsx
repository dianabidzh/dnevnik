import { useEffect, useState } from "react";
import { BlobImage } from "../../components/BlobImage";
import * as q from "../../db/queries";
import type { Book } from "../../db/schema";

export function ReadingBlock({ date }: { date: string }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [marked, setMarked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    Promise.all([q.listBooks(), q.listBookDaysOnDate(date)]).then(([all, days]) => {
      if (cancelled) return;
      const ids = new Set(days.map((d) => d.bookId));
      setMarked(ids);
      setBooks(all.filter((b) => b.finishedAt === null || ids.has(b.id)).sort((a, b) => a.createdAt - b.createdAt));
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  if (books.length === 0) return null;

  function toggle(id: string) {
    const on = !marked.has(id);
    setMarked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    q.setBookDay(id, date, on);
  }

  return (
    <section className="card">
      <h3>Чтение</h3>
      <p className="muted small">Отметьте книги, которые читали в этот день.</p>
      <ul className="habit-list">
        {books.map((b) => {
          const on = marked.has(b.id);
          return (
            <li key={b.id}>
              <button className={"habit" + (on ? " done" : "")} aria-pressed={on} onClick={() => toggle(b.id)}>
                <span className="check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 12.5 4 4 8-9" />
                  </svg>
                </span>
                <span className="habit-title">{b.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
