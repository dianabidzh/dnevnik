import { Link } from "react-router-dom";
import type { Measurement } from "../../db/schema";
import { useAutosaveText } from "../../lib/useAutosaveText";

type Field = "weight" | "waist" | "hips" | "chest";

function parseNum(text: string): number | undefined {
  const n = parseFloat(text.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function NumField({ label, unit, initial, onSave }: { label: string; unit: string; initial: string; onSave: (t: string) => void }) {
  const [value, setValue] = useAutosaveText(initial, onSave);
  return (
    <label className="num">
      <span>{label}</span>
      <span className="num-input">
        <input inputMode="decimal" value={value} placeholder="—" onChange={(e) => setValue(e.target.value)} />
        <em>{unit}</em>
      </span>
    </label>
  );
}

interface Props {
  date: string;
  measurement: Measurement | null;
  showWeight: boolean;
  showMeasurements: boolean;
  onSave: (date: string, patch: Partial<Measurement>) => void;
}

export function BodyBlock({ date, measurement, showWeight, showMeasurements, onSave }: Props) {
  const field = (key: Field, label: string, unit: string) => {
    const v = measurement?.[key];
    return (
      <NumField
        key={date + key}
        label={label}
        unit={unit}
        initial={v != null ? String(v).replace(".", ",") : ""}
        onSave={(t) => onSave(date, { [key]: parseNum(t) } as Partial<Measurement>)}
      />
    );
  };

  return (
    <section className="card">
      <h3>{showWeight && !showMeasurements ? "Вес" : showMeasurements && !showWeight ? "Объёмы" : "Вес и объёмы"}</h3>
      <div className="num-grid">
        {showWeight && field("weight", "Вес", "кг")}
        {showMeasurements && field("waist", "Талия", "см")}
        {showMeasurements && field("hips", "Бёдра", "см")}
        {showMeasurements && field("chest", "Грудь", "см")}
      </div>
      <p style={{ margin: "14px 0 0" }}>
        <Link to="/body" className="link small">
          Отчёт об изменениях
        </Link>
      </p>
    </section>
  );
}
