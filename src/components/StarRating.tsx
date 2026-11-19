/** Показ оценки звёздами (1–5) */
export function Stars({ value }: { value: number | null }) {
  const v = value ?? 0;
  return (
    <span className="stars" role="img" aria-label={value ? "Оценка " + value + " из 5" : "Без оценки"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= v ? "star on" : "star"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

/** Выбор оценки: нажмите на звезду, повторное нажатие на ту же звезду сбрасывает оценку */
export function StarInput({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="star-input" role="radiogroup" aria-label="Оценка книги">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          role="radio"
          aria-checked={value === i}
          aria-label={i + " из 5"}
          className={value !== null && i <= value ? "on" : ""}
          onClick={() => onChange(value === i ? null : i)}
        >
          ★
        </button>
      ))}
    </div>
  );
}
