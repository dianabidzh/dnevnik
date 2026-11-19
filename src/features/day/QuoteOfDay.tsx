import { quoteForDate } from "../../lib/quote";

export function QuoteOfDay({ date }: { date: string }) {
  return (
    <figure className="quote">
      <blockquote>{quoteForDate(date)}</blockquote>
    </figure>
  );
}
