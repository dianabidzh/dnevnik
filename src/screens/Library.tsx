import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as q from "../db/queries";
import type { Folder, Material } from "../db/schema";
import { FolderSheet } from "../features/library/FolderSheet";
import { materialLabel } from "../lib/files";
import "./library.css";

export function Library() {
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  function load() {
    Promise.all([q.listFolders(), q.listAllMaterials()]).then(([f, m]) => {
      setFolders(f);
      setMaterials(m);
    });
  }
  useEffect(load, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    materials.forEach((m) => map.set(m.folderId, (map.get(m.folderId) ?? 0) + 1));
    return map;
  }, [materials]);

  const folderById = useMemo(() => new Map((folders ?? []).map((f) => [f.id, f])), [folders]);
  const needle = query.trim().toLowerCase();
  const results = needle ? materials.filter((m) => (m.title + " " + m.url + " " + m.text).toLowerCase().includes(needle)) : null;

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">
          <Link to="/more" className="back-link">
            ← Назад
          </Link>
        </p>
        <h1>Полезное</h1>
      </header>

      <input
        className="search"
        type="search"
        value={query}
        placeholder="Поиск по всем материалам"
        aria-label="Поиск по материалам"
        onChange={(e) => setQuery(e.target.value)}
      />

      {results ? (
        <section className="card">
          {results.length === 0 ? (
            <p className="muted">Ничего не найдено.</p>
          ) : (
            <ul className="material-list plain">
              {results.map((m) => {
                const f = folderById.get(m.folderId);
                return (
                  <li key={m.id}>
                    <Link to={"/library/" + m.folderId + "/" + m.id} className="result-row">
                      <span className="result-emoji">{f?.emoji ?? "📁"}</span>
                      <span>
                        <strong>{materialLabel(m)}</strong>
                        <small>{f?.name}</small>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : (
        <>
          <button className="btn" onClick={() => setAdding(true)} style={{ marginBottom: 18 }}>
            Новая папка
          </button>

          {folders !== null && folders.length === 0 && (
            <section className="card">
              <p className="muted">
                Здесь будет ваша кладовая полезных материалов. Создайте папку по теме, выберите ей смайлик и складывайте внутрь ссылки, заметки, фото и файлы.
              </p>
            </section>
          )}

          <div className="folder-grid">
            {(folders ?? []).map((f) => (
              <Link key={f.id} to={"/library/" + f.id} className="folder-card">
                <span className="folder-emoji">{f.emoji}</span>
                <strong>{f.name}</strong>
                <small>{counts.get(f.id) ?? 0} шт.</small>
              </Link>
            ))}
          </div>
        </>
      )}

      <FolderSheet open={adding} folder={null} onClose={() => setAdding(false)} onSaved={load} />
    </main>
  );
}
