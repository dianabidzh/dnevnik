import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import * as q from "../../db/queries";
import type { CalEvent } from "../../db/schema";
import { deliver } from "../../export/build";
import { newId } from "../../lib/id";
import { icsFile } from "../../lib/ics";

function EventForm({ event, defaultDate, onDone }: { event: CalEvent | null; defaultDate: string; onDone: () => void }) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [date, setDate] = useState(event?.date ?? defaultDate);
  const [time, setTime] = useState(event?.time ?? "");
  const [note, setNote] = useState(event?.note ?? "");
  const [yearly, setYearly] = useState(event?.repeat === "yearly");
  const [message, setMessage] = useState("");

  const current = (): CalEvent => ({
    id: event?.id ?? newId(),
    date,
    title: title.trim(),
    time: time || null,
    note,
    repeat: yearly ? "yearly" : "none",
    createdAt: event?.createdAt ?? Date.now()
  });

  async function save() {
    if (!title.trim() || !date) return;
    await q.putEvent(current());
    onDone();
  }

  async function remove() {
    if (!event) return;
    if (window.confirm("Удалить событие «" + event.title + "»?")) {
      await q.deleteEvent(event.id);
      onDone();
    }
  }

  async function toCalendar() {
    if (!title.trim() || !date) {
      setMessage("Сначала впишите название и дату.");
      return;
    }
    const r = await deliver(icsFile(current()));
    if (r === "downloaded") setMessage("Файл скачан. Откройте его, и iPhone предложит добавить событие в «Календарь».");
    else if (r === "shared") setMessage("");
  }

  return (
    <div className="event-form">
      <label className="form-field">
        <span>Название</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например, концерт или день рождения" />
      </label>
      <div className="form-row">
        <label className="form-field">
          <span>Дата</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="form-field">
          <span>Время (необязательно)</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <label className="form-field">
        <span>Заметка</span>
        <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <label className="check-line">
        <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
        Повторять каждый год
      </label>

      <div className="form-actions">
        <button className="btn" onClick={save} disabled={!title.trim() || !date}>
          Сохранить
        </button>
        <button className="btn ghost" onClick={toCalendar}>
          В календарь iPhone
        </button>
        {event && (
          <button className="link" onClick={remove}>
            Удалить
          </button>
        )}
      </div>
      {message && <p className="muted small">{message}</p>}
    </div>
  );
}

interface Props {
  open: boolean;
  event: CalEvent | null;
  defaultDate: string;
  onClose: () => void;
  onChanged: () => void;
}

export function EventSheet({ open, event, defaultDate, onClose, onChanged }: Props) {
  return (
    <Sheet open={open} title={event ? "Событие" : "Новое событие"} onClose={onClose}>
      <EventForm
        event={event}
        defaultDate={defaultDate}
        onDone={() => {
          onChanged();
          onClose();
        }}
      />
    </Sheet>
  );
}
