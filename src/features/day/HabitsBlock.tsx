import { useState } from "react";
import type { Habit } from "../../db/schema";
import { useAutosaveText } from "../../lib/useAutosaveText";

function HabitNote({ initial, autoFocus, onSave }: { initial: string; autoFocus: boolean; onSave: (t: string) => void }) {
  const [value, setValue] = useAutosaveText(initial, onSave);
  return (
    <input
      className="habit-note"
      value={value}
      maxLength={140}
      autoFocus={autoFocus}
      placeholder="Короткая заметка…"
      aria-label="Заметка к привычке"
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

interface Props {
  date: string;
  habits: Habit[];
  done: Set<string>;
  notes: Record<string, string>;
  onToggle: (id: string) => void;
  onNote: (date: string, habitId: string, text: string) => void;
  onManage: () => void;
}

export function HabitsBlock({ date, habits, done, notes, onToggle, onNote, onManage }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const count = habits.filter((h) => done.has(h.id)).length;

  return (
    <section className="card">
      <div className="block-head">
        <h3>Привычки</h3>
        <button className="link" onClick={onManage}>
          Изменить
        </button>
      </div>
      {habits.length === 0 ? (
        <p className="muted">Пока нет привычек. Нажмите «Изменить», чтобы добавить первую.</p>
      ) : (
        <>
          <ul className="habit-list">
            {habits.map((h) => {
              const isDone = done.has(h.id);
              const note = notes[h.id] ?? "";
              const showNote = openId === h.id || note !== "";
              return (
                <li key={h.id}>
                  <div className="habit-row">
                    <button className={"habit" + (isDone ? " done" : "")} aria-pressed={isDone} onClick={() => onToggle(h.id)}>
                      <span className="check" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 12.5 4 4 8-9" />
                        </svg>
                      </span>
                      <span className="habit-title">{h.title}</span>
                    </button>
                    <button className="icon-btn" aria-label="Заметка к привычке" onClick={() => setOpenId(openId === h.id ? null : h.id)}>
                      ✎
                    </button>
                  </div>
                  {showNote && (
                    <HabitNote
                      key={date + h.id}
                      initial={note}
                      autoFocus={openId === h.id && note === ""}
                      onSave={(t) => onNote(date, h.id, t)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          <p className="muted small habit-count">
            Выполнено: {count} из {habits.length}
          </p>
        </>
      )}
    </section>
  );
}
