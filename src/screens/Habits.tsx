import { useEffect, useState } from "react";
import { MonthGrid } from "../components/MonthGrid";
import { MonthNav } from "../components/MonthNav";
import * as q from "../db/queries";
import type { Habit } from "../db/schema";
import { useMonth } from "../lib/useMonth";
import { formatDayShort, monthDays, plural, todayISO } from "../utils/dates";
import "./month.css";

function HabitSpread({ habit, month, done, notes }: { habit: Habit; month: string; done: Set<string>; notes: { date: string; note: string }[] }) {
  const today = todayISO();
  const elapsed = monthDays(month).filter((d) => d <= today);
  const count = elapsed.filter((d) => done.has(d)).length;
  const percent = elapsed.length ? Math.round((count / elapsed.length) * 100) : 0;

  let best = 0;
  let run = 0;
  for (const d of elapsed) {
    run = done.has(d) ? run + 1 : 0;
    if (run > best) best = run;
  }

  return (
    <section className="card spread">
      <div className="block-head">
        <h3>{habit.title}</h3>
        {habit.archived && <span className="muted small">убрана</span>}
      </div>
      <p className="muted small spread-line">
        Выполнено: {count} из {elapsed.length} {plural(elapsed.length, ["дня", "дней", "дней"])}
        {best > 1 && " · лучшая серия: " + best + " " + plural(best, ["день", "дня", "дней"])}
      </p>
      <div className="bar" role="img" aria-label={"Выполнено " + percent + " процентов"}>
        <i style={{ width: percent + "%" }} />
      </div>
      <MonthGrid
        month={month}
        className="small-grid"
        renderCell={(iso) => {
          const status = done.has(iso) ? "done" : iso > today ? "future" : iso === today ? "today" : "miss";
          return (
            <span className={"hdot " + status} aria-label={done.has(iso) ? "выполнено" : undefined}>
              {parseInt(iso.slice(8), 10)}
            </span>
          );
        }}
      />
      {notes.length > 0 && (
        <ul className="note-list">
          {notes.map((n) => (
            <li key={n.date}>
              <b>{formatDayShort(n.date)}</b> {n.note}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Habits() {
  const [month, setMonth] = useMonth();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [doneMap, setDoneMap] = useState<Map<string, Set<string>>>(new Map());
  const [notesMap, setNotesMap] = useState<Map<string, { date: string; note: string }[]>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setHabits(null);
    (async () => {
      await q.ensureSeeded();
      const [all, logs] = await Promise.all([q.getAllHabits(), q.getHabitLogsInRange(month + "-01", month + "-31")]);
      if (cancelled) return;
      const map = new Map<string, Set<string>>();
      for (const l of logs) {
        if (!l.done) continue;
        if (!map.has(l.habitId)) map.set(l.habitId, new Set());
        map.get(l.habitId)!.add(l.date);
      }
      setDoneMap(map);
      const notes = new Map<string, { date: string; note: string }[]>();
      for (const l of logs) {
        if (!l.note) continue;
        if (!notes.has(l.habitId)) notes.set(l.habitId, []);
        notes.get(l.habitId)!.push({ date: l.date, note: l.note });
      }
      notes.forEach((list) => list.sort((a, b) => a.date.localeCompare(b.date)));
      setNotesMap(notes);
      setHabits(all);
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  // Убранные привычки показываем только если в этом месяце по ним были отметки
  const visible = (habits ?? []).filter((h) => !h.archived || (doneMap.get(h.id)?.size ?? 0) > 0);

  return (
    <main className="page">
      <header className="page-head">
        <h1>Привычки</h1>
      </header>

      <MonthNav month={month} onChange={setMonth} />

      {habits !== null && visible.length === 0 && (
        <section className="card">
          <p className="muted">
            Пока нечего показывать. Добавить привычки можно на странице дня, во вкладке «Сегодня», кнопкой «Изменить» у блока «Привычки».
          </p>
        </section>
      )}

      {visible.map((h) => (
        <HabitSpread key={h.id + month} habit={h} month={month} done={doneMap.get(h.id) ?? new Set()} notes={notesMap.get(h.id) ?? []} />
      ))}
    </main>
  );
}
