import { ScaleInput } from "../../components/ScaleInput";
import { scaleColor, scaleInk } from "../../theme/scale";

interface Props {
  title: string;
  hint: string;
  value: number | null;
  lowLabel: string;
  highLabel: string;
  onChange: (v: number | null) => void;
}

export function ScoreBlock({ title, hint, value, lowLabel, highLabel, onChange }: Props) {
  return (
    <section className="card">
      <div className="block-head">
        <h3>{title}</h3>
        {value !== null && (
          <span className="score-chip" style={{ background: scaleColor(value)!, color: scaleInk(value) }}>
            {value}
          </span>
        )}
      </div>
      <p className="muted small">{hint}</p>
      <ScaleInput value={value} onChange={onChange} label={title} lowLabel={lowLabel} highLabel={highLabel} />
    </section>
  );
}
