import { currentMonthKey, monthTitle, shiftMonth } from "../utils/dates";

export function MonthNav({ month, onChange }: { month: string; onChange: (m: string) => void }) {
  return (
    <div className="month-nav">
      <button aria-label="Предыдущий месяц" onClick={() => onChange(shiftMonth(month, -1))}>
        ‹
      </button>
      <h2>{monthTitle(month)}</h2>
      <button aria-label="Следующий месяц" disabled={month >= currentMonthKey()} onClick={() => onChange(shiftMonth(month, 1))}>
        ›
      </button>
    </div>
  );
}
