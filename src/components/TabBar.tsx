import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const IconToday = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M5 4.5h11a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Z" />
    <path d="M9 9h6M9 12.5h6M9 16h3" />
  </svg>
);
const IconMonth = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M4 10h16M9 3.5v3M15 3.5v3" />
  </svg>
);
const IconHabits = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.5 12.3 2.4 2.4 4.6-5" />
  </svg>
);
const IconBooks = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4H9v16" />
    <path d="M9 20V6.5A1.5 1.5 0 0 1 10.5 5H13v15" />
    <path d="m14.6 19.6-2-13.2a1.4 1.4 0 0 1 1.2-1.6l1.6-.2a1.4 1.4 0 0 1 1.6 1.2l1.9 12.6" />
    <path d="M4 20h16" />
  </svg>
);
const IconMore = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <circle cx="6" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="18" cy="12" r="1.2" />
  </svg>
);

const TABS: { to: string; label: string; icon: ReactNode; end?: boolean }[] = [
  { to: "/", label: "Сегодня", icon: IconToday, end: true },
  { to: "/month", label: "Месяц", icon: IconMonth },
  { to: "/habits", label: "Привычки", icon: IconHabits },
  { to: "/books", label: "Книги", icon: IconBooks },
  { to: "/more", label: "Ещё", icon: IconMore }
];

export function TabBar() {
  return (
    <nav className="tabbar" aria-label="Основное меню">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => "tab" + (isActive ? " active" : "")}>
          {t.icon}
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
