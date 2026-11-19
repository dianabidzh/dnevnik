import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlobImage } from "../components/BlobImage";
import { MonthGrid } from "../components/MonthGrid";
import { MonthNav } from "../components/MonthNav";
import * as q from "../db/queries";
import type { CalEvent, Day } from "../db/schema";
import { EventSheet } from "../features/events/EventSheet";
import { useEvents } from "../features/events/useEvents";
import { useMonth } from "../lib/useMonth";
import { SCALE_COLORS, scaleColor, scaleInk } from "../theme/scale";
import { currentMonthKey, formatDayShort, monthDays, plural, todayISO } from "../utils/dates";
import "./month.css";

type Metric = "overall" | "morning" | "evening" | "sleep";
type View = "map" | "photos";

const METRICS: { id: Metric; label: string }[] = [
  { id: "overall", label: "Состояние" },
  { id: "morning", label: "Утро" },
  { id: "evening", label: "Вечер" },
  { id: "sleep", label: "Сон" }
];

function valueOf(day: Day | undefined, metric: Metric): number | null {
  if (!day) return null;
  if (metric === "morning") return day.morningMood;
  if (metric === "evening") return day.eveningMood;
  if (metric === "sleep") return day.sleepQuality;
  const v = [day.morningMood, day.eveningMood].filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function Month() {
  const [month, setMonth] = useMonth();
  const [view, setView] = useState<View>("map");
  const [metric, setMetric] = useState<Metric>("overall");
  const [days, setDays] = useState<Map<string, Day>>(new Map());
  const [covers, setCovers] = useState<Map<string, Blob>>(new Map());
  const [eventSheet, setEventSheet] = useState<{ event: CalEvent | null } | null>(null);
  const { events, reload } = useEvents();
  const navigate = useNavigate();
  const today = todayISO();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await q.getDaysInRange(month + "-01", month + "-31");
      const withCover = list.filter((d) => d.coverPhotoId);
      const photos = await Promise.all(withCover.map((d) => q.getPhoto(d.coverPhotoId as string)));
      if (cancelled) return;
      setDays(new Map(list.map((d) => [d.date, d])));
      const map = new Map<string, Blob>();
      withCover.forEach((d, i) => {
        const p = photos[i];
        if (p) map.set(d.date, p.thumbBlob);
      });
      setCovers(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const iso of monthDays(month)) {
      const list = events.filter((e) => q.eventOnDate(e, iso));
      if (list.length) map.set(iso, list);
    }
    return map;
  }, [events, month]);

  const stats = useMemo(() => {
    const values: number[] = [];
    days.forEach((d) => {
      const v = valueOf(d, metric);
      if (v !== null) values.push(v);
    });
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    return { count: values.length, avg };
  }, [days, metric]);

  const open = (iso: string) => navigate(iso === today ? "/" : "/day/" + iso);

  return (
    <main className="page">
      <header className="page-head">
        <h1>Месяц</h1>
      </header>

      <MonthNav month={month} onChange={setMonth} />

      <div className="metric-seg" role="group" aria-label="Вид месяца">
        <button aria-pressed={view === "map"} onClick={() => setView("map")}>
          Карта состояния
        </button>
        <button aria-pressed={view === "photos"} onClick={() => setView("photos")}>
          Месяц в фото
        </button>
      </div>

      {view === "map" && (
        <>
          <div className="metric-seg" role="group" aria-label="Что показывать">
            {METRICS.map((m) => (
              <button key={m.id} aria-pressed={metric === m.id} onClick={() => setMetric(m.id)}>
                {m.label}
              </button>
            ))}
          </div>

          <section className="card">
            <MonthGrid
              month={month}
              renderCell={(iso) => {
                const day = days.get(iso);
                const value = valueOf(day, metric);
                const rounded = value === null ? null : Math.round(value);
                const future = iso > today;
                const bg = scaleColor(value);
                const hasEvent = eventsByDay.has(iso);
                const label =
                  formatDayShort(iso) +
                  (rounded !== null ? ", оценка " + rounded + " из 10" : future ? "" : ", нет записи") +
                  (hasEvent ? ", есть событие" : "");
                return (
                  <button
                    className={"hm-cell" + (bg ? " has" : "") + (iso === today ? " today" : "")}
                    style={bg ? { background: bg, color: scaleInk(value!) } : undefined}
                    disabled={future && !hasEvent}
                    aria-label={label}
                    onClick={() => open(iso)}
                  >
                    {parseInt(iso.slice(8), 10)}
                    {day?.coverPhotoId && <i className="photo-dot" aria-hidden="true" />}
                    {hasEvent && <i className="event-dot" aria-hidden="true" />}
                  </button>
                );
              }}
            />

            <div className="legend" aria-hidden="true">
              <span>0</span>
              <div className="legend-bar">
                {SCALE_COLORS.map((c, i) => (
                  <i key={i} style={{ background: c }} />
                ))}
              </div>
              <span>10</span>
            </div>
          </section>

          <p className="muted small month-summary">
            {stats.count === 0
              ? "В этом месяце пока нет записей."
              : "Записей: " +
                stats.count +
                " " +
                plural(stats.count, ["день", "дня", "дней"]) +
                ". Среднее: " +
                stats.avg!.toFixed(1).replace(".", ",") +
                " из 10."}
          </p>
        </>
      )}

      {view === "photos" && (
        <>
          <section className="card">
            <MonthGrid
              month={month}
              renderCell={(iso) => {
                const blob = covers.get(iso);
                const future = iso > today;
                return (
                  <button
                    className={"ph-cell" + (blob ? " has" : "") + (iso === today ? " today" : "")}
                    disabled={future && !eventsByDay.has(iso)}
                    aria-label={formatDayShort(iso) + (blob ? ", есть обложка" : "")}
                    onClick={() => open(iso)}
                  >
                    {blob && <BlobImage blob={blob} alt="" />}
                    <span className="ph-num">{parseInt(iso.slice(8), 10)}</span>
                  </button>
                );
              }}
            />
          </section>
          <p className="muted small month-summary">
            {covers.size === 0
              ? "Обложки дней появятся здесь, когда вы добавите фото и выберете обложку."
              : "Обложек: " + covers.size + ". Нажмите на день, чтобы открыть страницу."}
          </p>
        </>
      )}

      {eventsByDay.size > 0 && (
        <section className="card">
          <h3>События месяца</h3>
          <ul className="event-list">
            {Array.from(eventsByDay.entries()).map(([iso, list]) =>
              list.map((e) => (
                <li key={iso + e.id}>
                  <button onClick={() => open(iso)}>
                    <span className="event-day">{parseInt(iso.slice(8), 10)}</span>
                    <span>
                      {e.title}
                      {e.time ? ", " + e.time : ""}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      <button
        className="btn ghost month-add"
        onClick={() => setEventSheet({ event: null })}
      >
        Добавить событие в календарь
      </button>

      <EventSheet
        open={eventSheet !== null}
        event={eventSheet?.event ?? null}
        defaultDate={month === currentMonthKey() ? today : month + "-01"}
        onClose={() => setEventSheet(null)}
        onChanged={reload}
      />
    </main>
  );
}
