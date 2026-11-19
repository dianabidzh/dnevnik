import { THEMES } from "../theme/themes";
import { useTheme } from "../theme/ThemeProvider";

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-grid">
      {THEMES.map((t) => (
        <button key={t.id} className="theme-opt" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>
          <span className="theme-swatch">
            <i style={{ background: t.bg }} />
            <i style={{ background: t.card }} />
            <i style={{ background: t.accent }} />
          </span>
          <span style={{ color: "var(--ink)" }}>{t.name}</span>
        </button>
      ))}
    </div>
  );
}
