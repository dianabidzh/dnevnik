import type { CalEvent } from "../../db/schema";

interface Props {
  events: CalEvent[];
  onAdd: () => void;
  onEdit: (e: CalEvent) => void;
}

export function EventsBlock({ events, onAdd, onEdit }: Props) {
  const sorted = [...events].sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  return (
    <div className="events">
      {sorted.map((e) => (
        <button key={e.id} className="event-card" onClick={() => onEdit(e)}>
          <span className="event-time">{e.time ?? "весь день"}</span>
          <span className="event-body">
            <strong>{e.title}</strong>
            {e.note.trim() && <small>{e.note}</small>}
          </span>
        </button>
      ))}
      <button className="link event-add" onClick={onAdd}>
        + Добавить событие
      </button>
    </div>
  );
}
