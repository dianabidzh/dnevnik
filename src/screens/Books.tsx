import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookCover } from "../components/BookCover";
import { Stars } from "../components/StarRating";
import * as q from "../db/queries";
import type { Book } from "../db/schema";
import { BookEditSheet } from "../features/books/BookEditSheet";
import { formatDateFull } from "../utils/dates";
import "./books.css";

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

function Shelf({ books }: { books: Book[] }) {
  return (
    <div className="shelves">
      {chunk(books, 3).map((row, i) => (
        <div className="shelf" key={i}>
          <div className="shelf-grid">
            {row.map((b) => (
              <Link key={b.id} to={"/books/" + b.id} className="shelf-book" aria-label={b.title}>
                <BookCover book={b} />
              </Link>
            ))}
          </div>
          <div className="plank" />
          <div className="shelf-grid captions">
            {row.map((b) => (
              <div key={b.id} className="shelf-caption">
                {b.finishedAt ? (
                  <>
                    <Stars value={b.rating} />
                    <small>закончена {formatDateFull(b.finishedAt)}</small>
                  </>
                ) : (
                  <small>читаю сейчас</small>
                )}
              </div>
            ))}
            {Array.from({ length: 3 - row.length }).map((_, k) => (
              <div key={"e" + k} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Books() {
  const [books, setBooks] = useState<Book[] | null>(null);
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    q.listBooks().then(setBooks);
  }, []);

  const reading = (books ?? []).filter((b) => !b.finishedAt).sort((a, b) => b.createdAt - a.createdAt);
  const finished = (books ?? [])
    .filter((b) => b.finishedAt)
    .sort((a, b) => (b.finishedAt as string).localeCompare(a.finishedAt as string));

  return (
    <main className="page">
      <header className="page-head">
        <h1>Книги</h1>
      </header>

      <button className="btn" onClick={() => setAdding(true)}>
        Добавить книгу
      </button>

      {books !== null && books.length === 0 && (
        <section className="card" style={{ marginTop: 18 }}>
          <p className="muted">
            Здесь будут ваши книжные полки. Добавьте первую книгу с обложкой, и она встанет на полку.
          </p>
        </section>
      )}

      {reading.length > 0 && (
        <>
          <h2 className="shelf-title">Читаю сейчас</h2>
          <Shelf books={reading} />
        </>
      )}
      {finished.length > 0 && (
        <>
          <h2 className="shelf-title">Прочитано</h2>
          <Shelf books={finished} />
        </>
      )}

      <BookEditSheet
        open={adding}
        book={null}
        onClose={() => setAdding(false)}
        onSaved={(b) => navigate("/books/" + b.id)}
      />
    </main>
  );
}
