import type { ReactNode } from "react";
import { mondayOffset, monthDays } from "../utils/dates";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface Props {
  month: string;
  renderCell: (iso: string) => ReactNode;
  className?: string;
}

/** Календарная сетка месяца, неделя с понедельника */
export function MonthGrid({ month, renderCell, className = "" }: Props) {
  const offset = mondayOffset(month);
  return (
    <div className={"mgrid " + className}>
      {WEEKDAYS.map((w) => (
        <span key={w} className="mgrid-wd">
          {w}
        </span>
      ))}
      {Array.from({ length: offset }).map((_, i) => (
        <span key={"blank" + i} />
      ))}
      {monthDays(month).map((iso) => (
        <div key={iso} className="mgrid-cell">
          {renderCell(iso)}
        </div>
      ))}
    </div>
  );
}
