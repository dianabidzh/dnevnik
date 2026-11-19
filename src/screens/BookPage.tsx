import { differenceInCalendarDays, parseISO } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AutoTextarea } from "../components/AutoTextarea";
import { BookCover } from "../components/BookCover";
import { MonthGrid } from "../components/MonthGrid";
import { MonthNav } from "../components/MonthNav";
import { Sheet } from "../components/Sheet";
import { StarInput, Stars } from "../components/StarRating";
import * as q from "../db/queries";
import type { Book, BookQuote } from "../db/schema";
import { BookEditSheet } from "../features/books/BookEditSheet";
import { newId } from "../lib/id";
import { useAutosaveText } from "../lib/useAutosaveText";
import { currentMonthKey, formatDateFull, plural, toISODate, todayISO } from "../utils/dates";
import "./books.css";
import "./month.css";

function SectionHead({ title, editing, onToggle }: { title: string; editing: boolean; onToggle: () => void }) {
  return (
    <div className="block-head">
      <h3>{title}</h3>
      <button className="link" onClick={onToggle} aria-label={editing ? "Закончить редактирование" : "Редактировать"}>
        {editing ? "Готово" : "✎"}
      </button>
    </div>
  );
}

function FinishForm({ book, onSave, onClear }: { book: Book; onSave: (date: string, rating: number | null) => void; onClear: () => void }) {
  const [date, setDate] = useState(book.finishedAt ?? todayISO());
  const [rating, setRating] = useState<number | null>(book.rating);
  return (
    <div className="event-form">
      <label className="form-field">
        <span>Дата окончания</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="form-field">
        <span>Оценка</span>
        <StarInput value={rating} onChange={setRating} />
      </div>
      <div className="form-actions">
        <button className="btn" disabled={!date} onClick={() => onSave(date, rating)}>
          Сохранить
        </button>
        {book.finishedAt && (
          <button className="link" onClick={onClear}>
            Книга ещё не дочитана
          </button>
        )}
      </div>
    </div>
  );
}

function ImpressionEditor({ initial, onSave }: { initial: string; onSave: (t: string) => void }) {
  const [value, setValue] = useAutosaveText(initial, onSave);
  return <AutoTextarea value={value} onValueChange={setValue} rows={5} placeholder="Что осталось после книги…" aria-label="Общее впечатление" />;
}

function QuoteEditor({ quote, onChange, onDelete }: { quote: BookQuote; onChange: (patch: Partial<BookQuote>) => void; onDelete: () => void }) {
  const [text, setText] = useAutosaveText(quote.text, (t) => onChange({ text: t }));
  const [page, setPage] = useState(quote.page);
  return (
    <div className="quote-edit">
      <AutoTextarea value={text} onValueChange={setText} rows={2} aria-label="Текст цитаты" />
      <div className="quote-edit-row">
        <input
          value={page}
          placeholder="Страница"
          inputMode="numeric"
          aria-label="Страница"
          onChange={(e) => setPage(e.target.value)}
          onBlur={() => onChange({ page: page.trim() })}
        />
        <button className="link" onClick={onDelete}>
          Удалить
        </button>
      </div>
    </div>
  );
}

function AddQuote({ onAdd }: { onAdd: (text: string, page: string) => void }) {
  const [text, setText] = useState("");
  const [page, setPage] = useState("");
  return (
    <div className="quote-add">
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Новая цитата…" aria-label="Новая цитата" />
      <div className="quote-edit-row">
        <input value={page} placeholder="Страница" inputMode="numeric" aria-label="Страница" onChange={(e) => setPage(e.target.value)} />
        <button
          className="btn"
          disabled={!text.trim()}
          onClick={() => {
            onAdd(text.trim(), page.trim());
            setText("");
            setPage("");
          }}
        >
          Добавить
        </button>
      </div>
    </div>
  );
}

export function BookPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const today = todayISO();

  const [book, setBook] = useState<Book | null | undefined>(undefined);
  const [days, setDays] = useState<Set<string>>(new Set());
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [calMonth, setCalMonth] = useState(currentMonthKey());
  const [editBook, setEditBook] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [editDays, setEditDays] = useState(false);
  const [editQuotes, setEditQuotes] = useState(false);
  const [editImpression, setEditImpression] = useState(false);

  const bookRef = useRef<Book | null>(null);
  const quotesRef = useRef<BookQuote[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([q.getBook(id), q.listBookDays(id), q.listQuotes(id)]).then(([b, d, qs]) => {
      if (cancelled) return;
      bookRef.current = b ?? null;
      quotesRef.current = qs;
      setBook(b ?? null);
      setDays(new Set(d.map((x) => x.date)));
      setQuotes(qs);
      const last = d.map((x) => x.date).sort().pop();
      if (last) setCalMonth(last.slice(0, 7));
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const saveBook = useCallback((patch: Partial<Book>) => {
    const cur = bookRef.current;
    if (!cur) return;
    const next = { ...cur, ...patch };
    bookRef.current = next;
    setBook(next);
    q.putBook(next);
  }, []);

  const saveQuote = useCallback((quoteId: string, patch: Partial<BookQuote>) => {
    const cur = quotesRef.current.find((x) => x.id === quoteId);
    if (!cur) return;
    const next = { ...cur, ...patch };
    quotesRef.current = quotesRef.current.map((x) => (x.id === quoteId ? next : x));
    setQuotes(quotesRef.current);
    q.putQuote(next);
  }, []);

  function toggleDay(iso: string) {
    const on = !days.has(iso);
    setDays((prev) => {
      const next = new Set(prev);
      if (on) next.add(iso);
      else next.delete(iso);
      return next;
    });
    q.setBookDay(id, iso, on);
  }

  function addQuote(text: string, page: string) {
    const item: BookQuote = { id: newId(), bookId: id, text, page, createdAt: Date.now() };
    quotesRef.current = [...quotesRef.current, item];
    setQuotes(quotesRef.current);
    q.putQuote(item);
  }

  function removeQuote(quoteId: string) {
    if (!window.confirm("Удалить эту цитату?")) return;
    quotesRef.current = quotesRef.current.filter((x) => x.id !== quoteId);
    setQuotes(quotesRef.current);
    q.deleteQuote(quoteId);
  }

  if (book === undefined) return <main className="page" />;
  if (book === null) {
    return (
      <main className="page">
        <p>
          Книга не найдена. <Link to="/books">К полкам</Link>
        </p>
      </main>
    );
  }

  const sortedDays = Array.from(days).sort();
  const first = sortedDays[0];
  const last = sortedDays[sortedDays.length - 1];
  const startDate = book.startedAt ?? first ?? toISODate(new Date(book.createdAt));
  const span = book.finishedAt ? differenceInCalendarDays(parseISO(book.finishedAt), parseISO(startDate)) + 1 : 0;
  const sinceStart = !book.finishedAt && startDate <= today ? differenceInCalendarDays(parseISO(today), parseISO(startDate)) + 1 : 0;
  const percent = span > 0 ? Math.min(100, Math.round((days.size / span) * 100)) : 0;
  const dayWord = (n: number) => n + " " + plural(n, ["день", "дня", "дней"]);
  const dayClass = (iso: string) => "hdot " + (days.has(iso) ? "done" : iso > today ? "future" : "miss");

  return (
    <main className="page">
      <p className="kicker">
        <Link to="/books" className="back-link">
          ← К полкам
        </Link>
      </p>

      <section className="book-hero">
        <div className="book-hero-cover">
          <BookCover book={book} large />
        </div>
        <div className="book-hero-info">
          <h1>{book.title}</h1>
          {book.author && <p className="muted">{book.author}</p>}
          <button className="link" onClick={() => setEditBook(true)} aria-label="Изменить название и обложку">
            ✎ Изменить
          </button>
        </div>
      </section>

      <section className="card">
        <div className="block-head">
          <h3>Оценка</h3>
          <button className="link" onClick={() => setFinishOpen(true)} aria-label="Изменить оценку и дату окончания">
            ✎
          </button>
        </div>
        {book.finishedAt ? (
          <>
            <Stars value={book.rating} />
            <p className="muted small" style={{ margin: "6px 0 0" }}>
              Закончена {formatDateFull(book.finishedAt)}
            </p>
          </>
        ) : (
          <>
            <p className="muted">Книга ещё не закончена.</p>
            <button className="btn ghost" onClick={() => setFinishOpen(true)}>
              Отметить прочитанной
            </button>
          </>
        )}
      </section>

      <section className="card">
        <SectionHead title="Дни чтения" editing={editDays} onToggle={() => setEditDays((v) => !v)} />
        <p className="book-count">
          {days.size === 0 ? "Пока нет отметок" : "Читалась " + days.size + " " + plural(days.size, ["день", "дня", "дней"])}
        </p>
        <dl className="stat-grid" style={{ marginBottom: 14 }}>
          <div>
            <dt>Начата</dt>
            <dd>{formatDateFull(startDate)}</dd>
          </div>
          {book.finishedAt ? (
            <div>
              <dt>Закончена</dt>
              <dd>{formatDateFull(book.finishedAt)}</dd>
            </div>
          ) : (
            sinceStart > 0 && (
              <div>
                <dt>С начала прошло</dt>
                <dd>{dayWord(sinceStart)}</dd>
              </div>
            )
          )}
          {span > 0 && (
            <div>
              <dt>От начала до конца</dt>
              <dd>{dayWord(span)}</dd>
            </div>
          )}
          <div>
            <dt>Фактически читалась</dt>
            <dd>
              {dayWord(days.size)}
              {span > 0 && days.size > 0 && " (" + percent + "%)"}
            </dd>
          </div>
        </dl>
        <button className={"btn" + (days.has(today) ? " ghost" : "")} onClick={() => toggleDay(today)}>
          {days.has(today) ? "Сегодня отмечено (убрать)" : "Отметить сегодня"}
        </button>
        <div style={{ marginTop: 14 }}>
          <MonthNav month={calMonth} onChange={setCalMonth} />
          <MonthGrid
            month={calMonth}
            className="small-grid"
            renderCell={(iso) =>
              editDays ? (
                <button className={dayClass(iso)} disabled={iso > today} aria-pressed={days.has(iso)} onClick={() => toggleDay(iso)}>
                  {parseInt(iso.slice(8), 10)}
                </button>
              ) : (
                <span className={dayClass(iso)}>{parseInt(iso.slice(8), 10)}</span>
              )
            }
          />
          {editDays && <p className="muted small">Нажимайте на дни, чтобы отметить или убрать чтение.</p>}
        </div>
      </section>

      <section className="card">
        <SectionHead title="Цитаты" editing={editQuotes} onToggle={() => setEditQuotes((v) => !v)} />
        {quotes.length === 0 && <p className="muted">Пока нет цитат.</p>}
        {quotes.map((qt) =>
          editQuotes ? (
            <QuoteEditor key={qt.id} quote={qt} onChange={(patch) => saveQuote(qt.id, patch)} onDelete={() => removeQuote(qt.id)} />
          ) : (
            <blockquote key={qt.id} className="book-quote">
              <p>{qt.text}</p>
              {qt.page && <cite>стр. {qt.page}</cite>}
            </blockquote>
          )
        )}
        <AddQuote onAdd={addQuote} />
      </section>

      <section className="card">
        <SectionHead title="Общее впечатление" editing={editImpression} onToggle={() => setEditImpression((v) => !v)} />
        {editImpression ? (
          <ImpressionEditor initial={book.impression} onSave={(t) => saveBook({ impression: t })} />
        ) : book.impression.trim() ? (
          <p className="impression">{book.impression}</p>
        ) : (
          <p className="muted">Пока пусто. Нажмите карандаш, чтобы записать впечатление.</p>
        )}
      </section>

      <BookEditSheet
        open={editBook}
        book={book}
        onClose={() => setEditBook(false)}
        onSaved={(b) => {
          bookRef.current = b;
          setBook(b);
        }}
        onDeleted={() => navigate("/books")}
      />

      <Sheet open={finishOpen} title="Оценка и дата окончания" onClose={() => setFinishOpen(false)}>
        <FinishForm
          book={book}
          onSave={(date, rating) => {
            saveBook({ finishedAt: date, rating });
            setFinishOpen(false);
          }}
          onClear={() => {
            saveBook({ finishedAt: null, rating: null });
            setFinishOpen(false);
          }}
        />
      </Sheet>
    </main>
  );
}
