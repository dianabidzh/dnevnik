import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BlobImage } from "../components/BlobImage";
import { Sheet } from "../components/Sheet";
import * as q from "../db/queries";
import type { Attachment, Folder, Material } from "../db/schema";
import { deliver } from "../export/build";
import { MaterialSheet } from "../features/library/MaterialSheet";
import { formatSize, hostOf, materialLabel, saveName } from "../lib/files";
import "./library.css";

async function openAttachment(a: Attachment) {
  const blob = await q.getAttachmentBlob(a.id);
  if (!blob) return;
  await deliver(new File([blob], saveName(a), { type: a.mime }));
}

function ImageViewer({ att, onClose }: { att: Attachment | null; onClose: () => void }) {
  const [blob, setBlob] = useState<Blob | null>(null);
  useEffect(() => {
    setBlob(null);
    if (att) q.getAttachmentBlob(att.id).then((b) => setBlob(b ?? null));
  }, [att]);
  return (
    <Sheet open={att !== null} title="Фото" onClose={onClose}>
      {blob && att && (
        <div className="viewer">
          <BlobImage blob={blob} alt={att.name} className="viewer-img" />
          <div className="viewer-actions">
            <button className="btn" onClick={() => openAttachment(att)}>
              Сохранить или поделиться
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

export function LibraryMaterial() {
  const { folderId = "", materialId = "" } = useParams();
  const navigate = useNavigate();
  const [material, setMaterial] = useState<Material | null | undefined>(undefined);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState<Attachment | null>(null);

  async function load() {
    const [m, list, folders] = await Promise.all([q.getMaterial(materialId), q.listAttachments(materialId), q.listFolders()]);
    setMaterial(m ?? null);
    setAtts(list);
    setFolder(folders.find((f) => f.id === (m?.folderId ?? folderId)) ?? null);
  }
  useEffect(() => {
    load();
  }, [materialId]);

  if (material === undefined) return <main className="page" />;
  if (material === null) {
    return (
      <main className="page">
        <p>
          Материал не найден. <Link to="/library">К папкам</Link>
        </p>
      </main>
    );
  }

  const images = atts.filter((a) => a.kind === "image");
  const files = atts.filter((a) => a.kind === "file");

  return (
    <main className="page">
      <header className="page-head">
        <p className="kicker">
          <Link to={"/library/" + material.folderId} className="back-link">
            ← {folder ? folder.emoji + " " + folder.name : "К папке"}
          </Link>
        </p>
        <h1>{materialLabel(material)}</h1>
        <button className="link" onClick={() => setEditing(true)} aria-label="Изменить материал">
          ✎ Изменить
        </button>
      </header>

      {material.url && (
        <section className="card">
          <a className="btn" href={material.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            Открыть ссылку
          </a>
          <p className="muted small" style={{ margin: "8px 0 0", wordBreak: "break-all" }}>
            {hostOf(material.url)}
          </p>
        </section>
      )}

      {material.text.trim() && (
        <section className="card">
          <p className="impression">{material.text}</p>
        </section>
      )}

      {images.length > 0 && (
        <section className="card">
          <h3>Фото</h3>
          <ul className="photo-grid">
            {images.map((a) => (
              <li key={a.id}>
                <button className="photo-btn" onClick={() => setViewing(a)} aria-label={"Открыть фото " + a.name}>
                  {a.thumb && <BlobImage blob={a.thumb} alt="" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {files.length > 0 && (
        <section className="card">
          <h3>Файлы</h3>
          <ul className="att-list">
            {files.map((a) => (
              <li key={a.id}>
                <button className="att-row file-open" onClick={() => openAttachment(a)}>
                  <span className="att-thumb" aria-hidden="true">
                    📄
                  </span>
                  <span className="att-name">
                    {a.name}
                    <small>{formatSize(a.size)} · открыть или сохранить</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ImageViewer att={viewing} onClose={() => setViewing(null)} />
      <MaterialSheet
        open={editing}
        material={material}
        folderId={material.folderId}
        onClose={() => setEditing(false)}
        onSaved={load}
        onDeleted={() => navigate("/library/" + material.folderId)}
      />
    </main>
  );
}
