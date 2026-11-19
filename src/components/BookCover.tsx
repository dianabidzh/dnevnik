import { BlobImage } from "./BlobImage";
import type { Book } from "../db/schema";

const PALETTE = ["#8E5B6E", "#5B7A8E", "#7A8E5B", "#B08457", "#6B5B8E", "#8E6B5B"];

function colorFor(title: string): string {
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

/** Обложка 3:4: картинка или цветная заглушка с названием */
export function BookCover({ book, large = false }: { book: Pick<Book, "title" | "cover" | "coverThumb">; large?: boolean }) {
  const blob = large ? book.cover ?? book.coverThumb : book.coverThumb ?? book.cover;
  return (
    <div className="book-cover">
      {blob ? (
        <BlobImage blob={blob} alt={"Обложка: " + book.title} />
      ) : (
        <div className="book-placeholder" style={{ background: colorFor(book.title) }}>
          <span>{book.title}</span>
        </div>
      )}
    </div>
  );
}
