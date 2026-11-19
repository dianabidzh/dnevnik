import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { buildExport, deliver, type BuiltExport } from "../export/build";
import { applyImport, parseImport } from "../export/importData";
import { useSettings } from "../settings/SettingsProvider";
import "./more.css";

type State = { kind: "idle" } | { kind: "building" } | { kind: "ready"; built: BuiltExport } | { kind: "error"; message: string };

function sizeText(bytes: number): string {
  return bytes < 1024 * 1024
    ? Math.max(1, Math.round(bytes / 1024)) + " КБ"
    : (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " МБ";
}

export function Export() {
  const { setOption } = useSettings();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [saved, setSaved] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importDone, setImportDone] = useState(false);

  async function build(withPhotos: boolean) {
    setState({ kind: "building" });
    setSaved(false);
    try {
      setState({ kind: "ready", built: await buildExport(withPhotos) });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Не удалось подготовить копию" });
    }
  }

  async function save(built: BuiltExport) {
    const result = await deliver(built.file);
    if (result !== "cancelled") {
      setOption("lastExportAt", Date.now());
      setSaved(true);
    }
  }

  async function onImportPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportBusy(true);
    setImportMsg("");
    try {
      const parsed = await parseImport(file);
      const photoCount = parsed.data.photos.filter((p) => parsed.photoBytes.has(p.id)).length;
      const ok = window.confirm(
        "В копии: дней — " +
          parsed.data.days.length +
          ", фото — " +
          photoCount +
          ". Добавить их к вашим записям? Записи за одинаковые даты будут заменены данными из копии."
      );
      if (ok) {
        await applyImport(parsed);
        setImportDone(true);
        setImportMsg("Готово: данные восстановлены.");
      }
    } catch (err) {
      setImportMsg(err instanceof Error ? err.message : "Не удалось восстановить данные");
    } finally {
      setImportBusy(false);
    }
  }

  const building = state.kind === "building";

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">
          <Link to="/more" style={{ color: "var(--accent)", textDecoration: "none" }}>
            ← Назад
          </Link>
        </p>
        <h1>Копия дневника</h1>
      </header>

      <section className="card save-card">
        <h3>Сохранить копию</h3>
        <p className="small">
          Полная копия — один архив: все записи, фото, а также читаемые версии дневника (текстовая и для печати).
        </p>
        <div className="export-actions">
          <button className="btn" disabled={building} onClick={() => build(true)}>
            {building ? "Готовлю копию…" : "Подготовить полную копию"}
          </button>
          <button className="btn ghost" disabled={building} onClick={() => build(false)}>
            Только данные, без фото (JSON)
          </button>
        </div>

        {state.kind === "ready" && (
          <div className="export-ready">
            <p>
              Готово: {state.built.file.name}, {sizeText(state.built.file.size)}. Дней: {state.built.days}
              {state.built.withPhotos ? ", фото: " + state.built.photos : ""}.
            </p>
            <button className="btn" onClick={() => save(state.built)}>
              Сохранить файл
            </button>
            {saved && <p className="ok small">Спасибо, копия сохранена.</p>}
          </div>
        )}
        {state.kind === "error" && <p className="error small">{state.message}</p>}
        <p className="muted small" style={{ marginTop: 12 }}>
          В меню выберите «Сохранить в Файлы» или iCloud Drive. Не удаляйте приложение, пока не убедитесь, что файл сохранён.
        </p>
      </section>

      <section className="card">
        <h3>Восстановить из копии</h3>
        <p className="small">Выберите архив .zip или файл .json, сохранённые раньше. Они добавятся к текущим записям.</p>
        <label className={"btn ghost import-label" + (importBusy ? " busy" : "")}>
          {importBusy ? "Восстанавливаю…" : "Выбрать файл копии"}
          <input type="file" accept=".zip,.json,application/zip,application/json" className="sr-only" disabled={importBusy} onChange={onImportPick} />
        </label>
        {importMsg && <p className={"small " + (importDone ? "ok" : "error")}>{importMsg}</p>}
        {importDone && (
          <button className="btn" style={{ marginTop: 10 }} onClick={() => window.location.assign("/")}>
            Открыть дневник
          </button>
        )}
      </section>
    </main>
  );
}
