import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { SCALE_COLORS } from "../theme/scale";

interface Props {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
  lowLabel: string;
  highLabel: string;
}

/** Цветная лента 0–10: можно коснуться или провести пальцем */
export function ScaleInput({ value, onChange, label, lowLabel, highLabel }: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const pressed = useRef(false);
  const shown = preview ?? value;

  function indexAt(e: PointerEvent<HTMLDivElement>): number {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - rect.left) / rect.width) * 11);
    return Math.max(0, Math.min(10, i));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const cur = value ?? -1;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(10, cur + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(0, cur - 1));
    }
  }

  return (
    <div className="scale">
      <div
        className="ribbon"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value ?? undefined}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          pressed.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setPreview(indexAt(e));
        }}
        onPointerMove={(e) => {
          if (pressed.current) setPreview(indexAt(e));
        }}
        onPointerUp={(e) => {
          if (!pressed.current) return;
          pressed.current = false;
          const i = indexAt(e);
          setPreview(null);
          onChange(i);
        }}
        onPointerCancel={() => {
          pressed.current = false;
          setPreview(null);
        }}
      >
        {SCALE_COLORS.map((c, i) => {
          const filled = shown !== null && i <= shown;
          const current = shown === i;
          return (
            <span
              key={i}
              className={"cell" + (filled ? " filled" : "") + (current ? " current" : "")}
              style={{ background: c }}
            />
          );
        })}
      </div>
      <div className="scale-ends">
        <span>0 · {lowLabel}</span>
        <span>{highLabel} · 10</span>
      </div>
      {value !== null && (
        <button className="link small" onClick={() => onChange(null)}>
          Сбросить
        </button>
      )}
    </div>
  );
}
