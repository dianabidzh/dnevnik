import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDB } from "../../db/db";
import { useSettings } from "../../settings/SettingsProvider";

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Мягкое напоминание сохранить копию: появляется, если копии давно не было */
export function BackupBanner() {
  const { options, setOption } = useSettings();
  const [firstDay, setFirstDay] = useState<number | null>(null);

  useEffect(() => {
    getDB()
      .then((db) => db.getAllKeys("days", undefined, 1))
      .then((keys) => {
        if (keys.length) setFirstDay(new Date(String(keys[0]) + "T12:00:00").getTime());
      });
  }, []);

  const now = Date.now();
  const reference = options.lastExportAt ?? firstDay;
  if (reference === null) return null;
  if (now - reference < 2 * WEEK) return null;
  if (options.backupSnoozeUntil && now < options.backupSnoozeUntil) return null;

  return (
    <section className="card save-card">
      <h3>Давно не сохраняли копию</h3>
      <p className="small">Записи хранятся только на этом телефоне. Сохраните копию, чтобы ничего не потерять.</p>
      <div className="viewer-actions">
        <Link to="/export" className="btn" style={{ textDecoration: "none" }}>
          Сохранить копию
        </Link>
        <button className="link" onClick={() => setOption("backupSnoozeUntil", now + 3 * 24 * 60 * 60 * 1000)}>
          Позже
        </button>
      </div>
    </section>
  );
}
