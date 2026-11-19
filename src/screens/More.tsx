import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ThemePicker } from "../components/ThemePicker";
import { isStoragePersistent, requestPersistentStorage } from "../db/db";
import { useSettings, type Options } from "../settings/SettingsProvider";
import { isStandalone } from "../utils/pwa";
import "./more.css";

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function lastExportText(ts: number | null): string {
  if (!ts) return "Копия ещё не сохранялась.";
  return "Последняя копия: " + new Date(ts).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) + ".";
}

export function More() {
  const { options, setOption } = useSettings();
  const [persistent, setPersistent] = useState<boolean | null>(null);

  useEffect(() => {
    isStoragePersistent().then(setPersistent);
  }, []);

  async function protect() {
    setPersistent(await requestPersistentStorage());
  }

  const toggle = (key: keyof Options) => (v: boolean) => setOption(key, v as never);

  return (
    <main className="page">
      <header className="page-head">
        <h1>Ещё</h1>
      </header>

      <section className="card save-card">
        <h3>Сохранить копию дневника</h3>
        <p className="small">Все записи и фото лежат только на этом телефоне. Сохраните копию, чтобы ничего не потерять.</p>
        <p className="muted small">{lastExportText(options.lastExportAt)}</p>
        <Link to="/export" className="btn">
          Сохранить и восстановить
        </Link>
      </section>

      <section className="card">
        <h3>Полезное</h3>
        <p className="small">Папки по темам: ссылки, заметки, фото и файлы, которые хочется сохранить.</p>
        <Link to="/library" className="btn" style={{ textDecoration: "none" }}>
          Открыть кладовую
        </Link>
      </section>

      <section className="card">
        <h3>Оформление</h3>
        <ThemePicker />
      </section>

      <section className="card">
        <h3>Дополнительно на странице дня</h3>
        <Toggle label="Вес" hint="Поле для записи веса" checked={options.trackWeight} onChange={toggle("trackWeight")} />
        <Toggle
          label="Объёмы"
          hint="Талия, бёдра, грудь"
          checked={options.trackMeasurements}
          onChange={toggle("trackMeasurements")}
        />
        <Toggle
          label="Дополнительные фото"
          hint="Отдельный личный блок фотографий"
          checked={options.extraPhotos}
          onChange={toggle("extraPhotos")}
        />
        {(options.trackWeight || options.trackMeasurements) && (
          <Link to="/body" className="btn ghost" style={{ textDecoration: "none", marginTop: 8 }}>
            Отчёт: вес и объёмы
          </Link>
        )}
      </section>

      <section className="card">
        <h3>Сохранность записей</h3>
        {!isStandalone() && (
          <p className="small">
            Чтобы iPhone не стирал данные, добавьте приложение на экран «Домой»: нажмите «Поделиться» в Safari, затем «На экран “Домой”».
          </p>
        )}
        {persistent === false && (
          <button className="btn" onClick={protect}>
            Защитить данные
          </button>
        )}
        {persistent === true && <p className="small">Защита данных включена.</p>}
        {persistent === null && <p className="muted small">Проверяю…</p>}
      </section>

      <p className="muted small about">Ежедневник 1.0. Всё хранится только на вашем устройстве.</p>
    </main>
  );
}
