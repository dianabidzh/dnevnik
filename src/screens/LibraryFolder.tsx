import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BlobImage } from "../components/BlobImage";
import * as q from "../db/queries";
import type { Attachment, Folder, Material } from "../db/schema";
import { FolderSheet } from "../features/library/FolderSheet";
import { MaterialSheet } from "../features/library/MaterialSheet";
import { hostOf, materialLabel } from "../lib/files";
import "./library.css";

export function LibraryFolder() {
  const { folderId = "" } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<Folder | null | undefined>(undefined);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [atts, setAtts] = useState<Map<string, Attachment[]>>(new Map());
  const [editFolder, setEditFolder] = useState(false);
  const [adding, setAdding] = useState(false);

  async function load() {
    const [folders, list] = await Promise.all([q.listFolders(), q.listMaterials(folderId)]);
    const lists = await Promise.all(list.map((m) => q.listAttachments(m.id)));
    setFolder(folders.find((f) => f.id === folderId) ?? null);
    setMaterials(list);
    setAtts(new Map(list.map((m, i) => [m.id, lists[i]])));
  }
  useEffect(() => {
    load();
  }, [folderId]);

  if (folder === undefined) return <main className="page" />;
  if (folder === null) {
    return (
      <main className="page">
        <p>
          Папка не найдена. <Link to="/library">К папкам</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">
          <Link to="/library" className="back-link">
            ← Все папки
          </Link>
        </p>
        <div className="folder-head">
          <span className="folder-emoji big">{folder.emoji}</span>
          <h1>{folder.name}</h1>
        </div>
        <button className="link" onClick={() => setEditFolder(true)} aria-label="Изменить папку">
          ✎ Изменить папку
        </button>
      </header>

      <button className="btn" onClick={() => setAdding(true)} style={{ marginBottom: 18 }}>
        Добавить материал
      </button>

      {materials.length === 0 && (
        <section className="card">
          <p className="muted">В этой папке пока пусто. Добавьте ссылку, заметку, фото или файл.</p>
        </section>
      )}

      {materials.map((m) => {
        const list = atts.get(m.id) ?? [];
        const images = list.filter((a) => a.thumb);
        const files = list.length - images.length;
        return (
          <Link key={m.id} to={"/library/" + folderId + "/" + m.id} className="card material-card">
            <h3>{materialLabel(m)}</h3>
            {m.url && <span className="material-url">🔗 {hostOf(m.url)}</span>}
            {m.text.trim() && <p className="material-snippet">{m.text}</p>}
            {images.length > 0 && (
              <span className="thumb-row">
                {images.slice(0, 4).map((a) => (
                  <span key={a.id} className="thumb">
                    <BlobImage blob={a.thumb as Blob} alt="" />
                  </span>
                ))}
                {images.length > 4 && <span className="thumb more">+{images.length - 4}</span>}
              </span>
            )}
            {files > 0 && <small className="muted">📎 файлов: {files}</small>}
          </Link>
        );
      })}

      <MaterialSheet
        open={adding}
        material={null}
        folderId={folderId}
        onClose={() => setAdding(false)}
        onSaved={(m) => navigate("/library/" + folderId + "/" + m.id)}
      />
      <FolderSheet
        open={editFolder}
        folder={folder}
        materialCount={materials.length}
        onClose={() => setEditFolder(false)}
        onSaved={load}
        onDeleted={() => navigate("/library")}
      />
    </main>
  );
}
