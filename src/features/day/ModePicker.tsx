import type { DayMode } from "../../db/schema";

export function ModePicker({ onPick }: { onPick: (m: DayMode) => void }) {
  return (
    <section className="mode-picker">
      <h2>Какой это день?</h2>
      <p className="muted">Режим можно поменять в любой момент.</p>
      <button className="mode-card" onClick={() => onPick("light")}>
        <h3>Облегчённый</h3>
        <p>Только главное: утро, сон, привычки и вечер. Остальное можно раскрыть.</p>
      </button>
      <button className="mode-card" onClick={() => onPick("regular")}>
        <h3>Обычный</h3>
        <p>Вся страница: вопросы, мысли и всё, что вы включили.</p>
      </button>
    </section>
  );
}
