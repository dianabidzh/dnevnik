import { endOfMonth, endOfYear, parseISO, startOfYear } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, type ChartPoint } from "../components/LineChart";
import { MonthNav } from "../components/MonthNav";
import * as q from "../db/queries";
import type { Measurement } from "../db/schema";
import { useSettings } from "../settings/SettingsProvider";
import { currentMonthKey, formatDateFull, formatDayShort, toISODate } from "../utils/dates";
import "./books.css";

type Period = "month" | "year" | "all";
type Field = "weight" | "waist" | "hips" | "chest";

const FIELDS: { key: Field; label: string; unit: string; group: "weight" | "measurements" }[] = [
  { key: "weight", label: "Вес", unit: "кг", group: "weight" },
  { key: "waist", label: "Талия", unit: "см", group: "measurements" },
  { key: "hips", label: "Бёдра", unit: "см", group: "measurements" },
  { key: "chest", label: "Грудь", unit: "см", group: "measurements" }
];

function fmt(v: number): string {
  return (Number.isInteger(v) ? String(v) : v.toFixed(1)).replace(".", ",");
}

function changeText(delta: number, unit: string): string {
  if (Math.abs(delta) < 0.05) return "без изменений";
  return (delta > 0 ? "+" : "−") + fmt(Math.abs(Math.round(delta * 10) / 10)) + " " + unit;
}

function MetricCard({
  label,
  unit,
  records,
  from,
  to,
  startLabel,
  endLabel
}: {
  label: string;
  unit: string;
  records: { date: string; v: number }[];
  from: number;
  to: number;
  startLabel: string;
  endLabel: string;
}) {
  if (records.length === 0) {
    return (
      <section className="card">
        <h3>{label}</h3>
        <p className="muted">Нет записей за этот период.</p>
      </section>
    );
  }
  const values = records.map((r) => r.v);
  const firstV = records[0].v;
  const lastV = records[records.length - 1].v;
  const points: ChartPoint[] = records.map((r) => ({ t: parseISO(r.date).getTime(), v: r.v }));
  return (
    <section className="card">
      <h3>{label}</h3>
      <LineChart points={points} from={from} to={to} startLabel={startLabel} endLabel={endLabel} />
      {records.length < 2 && <p className="muted small">Чтобы увидеть изменение, нужны хотя бы две записи.</p>}
      <dl className="stat-grid">
        <div>
          <dt>Сначала</dt>
          <dd>
            {fmt(firstV)} {unit}
          </dd>
        </div>
        <div>
          <dt>Сейчас</dt>
          <dd>
            {fmt(lastV)} {unit}
          </dd>
        </div>
        <div>
          <dt>Изменение</dt>
          <dd>{records.length < 2 ? "—" : changeText(lastV - firstV, unit)}</dd>
        </div>
        <div>
          <dt>Мин. / макс.</dt>
          <dd>
            {fmt(Math.min(...values))} / {fmt(Math.max(...values))}
          </dd>
        </div>
      </dl>
      <p className="muted small" style={{ margin: "8px 0 0" }}>
        Записей: {records.length}
      </p>
    </section>
  );
}

export function BodyReport() {
  const { options } = useSettings();
  const [period, setPeriod] = useState<Period>("month");
  const [month, setMonth] = useState(currentMonthKey());
  const [year, setYear] = useState(new Date().getFullYear());
  const [all, setAll] = useState<Measurement[]>([]);

  useEffect(() => {
    q.getAllMeasurements().then(setAll);
  }, []);

  const range = useMemo(() => {
    if (period === "month") {
      const start = parseISO(month + "-01");
      const end = endOfMonth(start);
      return { start: toISODate(start), end: toISODate(end), from: start.getTime(), to: end.getTime(), a: formatDayShort(toISODate(start)), b: formatDayShort(toISODate(end)) };
    }
    if (period === "year") {
      const start = startOfYear(new Date(year, 0, 1));
      const end = endOfYear(start);
      return { start: toISODate(start), end: toISODate(end), from: start.getTime(), to: end.getTime(), a: "январь", b: "декабрь" };
    }
    const dates = all.map((m) => m.date);
    const s = dates[0] ?? toISODate(new Date());
    const e = dates[dates.length - 1] ?? s;
    return { start: s, end: e, from: parseISO(s).getTime(), to: parseISO(e).getTime(), a: formatDateFull(s), b: formatDateFull(e) };
  }, [period, month, year, all]);

  const enabled = FIELDS.filter((f) => (f.group === "weight" ? options.trackWeight : options.trackMeasurements));

  if (enabled.length === 0) {
    return (
      <main className="page">
        <header className="page-head">
          <h1>Вес и объёмы</h1>
        </header>
        <section className="card">
          <p className="muted">
            Отчёт появится, когда вы включите вес или объёмы. Это можно сделать на вкладке «Ещё».
          </p>
          <Link to="/more" className="btn" style={{ textDecoration: "none" }}>
            Открыть «Ещё»
          </Link>
        </section>
      </main>
    );
  }

  const inRange = all.filter((m) => m.date >= range.start && m.date <= range.end);

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">
          <Link to="/more" className="back-link">
            ← Назад
          </Link>
        </p>
        <h1>Вес и объёмы</h1>
      </header>

      <div className="metric-seg" role="group" aria-label="Период">
        <button aria-pressed={period === "month"} onClick={() => setPeriod("month")}>
          Месяц
        </button>
        <button aria-pressed={period === "year"} onClick={() => setPeriod("year")}>
          Год
        </button>
        <button aria-pressed={period === "all"} onClick={() => setPeriod("all")}>
          Всё время
        </button>
      </div>

      {period === "month" && <MonthNav month={month} onChange={setMonth} />}
      {period === "year" && (
        <div className="month-nav">
          <button aria-label="Предыдущий год" onClick={() => setYear((y) => y - 1)}>
            ‹
          </button>
          <h2>{year}</h2>
          <button aria-label="Следующий год" disabled={year >= new Date().getFullYear()} onClick={() => setYear((y) => y + 1)}>
            ›
          </button>
        </div>
      )}

      {enabled.map((f) => (
        <MetricCard
          key={f.key}
          label={f.label}
          unit={f.unit}
          records={inRange.filter((m) => m[f.key] !== undefined).map((m) => ({ date: m.date, v: m[f.key] as number }))}
          from={range.from}
          to={range.to}
          startLabel={range.a}
          endLabel={range.b}
        />
      ))}
    </main>
  );
}
