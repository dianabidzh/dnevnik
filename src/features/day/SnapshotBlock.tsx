import { useState, type ChangeEvent } from "react";
import { BlobImage } from "../../components/BlobImage";
import { Sheet } from "../../components/Sheet";
import type { Photo } from "../../db/schema";

interface Props {
  photos: Photo[];
  coverId: string | null;
  onAdd: (files: File[]) => Promise<void>;
  onSetCover: (id: string) => void;
  onRemove: (id: string) => void;
}

export function SnapshotBlock({ photos, coverId, onAdd, onSetCover, onRemove }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [viewId, setViewId] = useState<string | null>(null);
  const viewing = photos.find((p) => p.id === viewId) ?? null;

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    try {
      await onAdd(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить фото");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h3>Снимок дня</h3>
      <p className="muted small">Одно или несколько фото. Одно из них можно сделать обложкой дня.</p>

      {photos.length > 0 && (
        <ul className="photo-grid">
          {photos.map((p) => (
            <li key={p.id}>
              <button className="photo-btn" onClick={() => setViewId(p.id)} aria-label="Открыть фото">
                <BlobImage blob={p.thumbBlob} alt="Фото дня" />
                {p.id === coverId && <span className="cover-badge">Обложка</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className={"btn ghost add-photo" + (busy ? " busy" : "")}>
        {busy ? "Сохраняю…" : photos.length ? "Добавить ещё" : "Добавить фото"}
        <input type="file" accept="image/*" multiple className="sr-only" onChange={onPick} disabled={busy} />
      </label>
      {error && <p className="error small">{error}</p>}

      <Sheet open={viewing !== null} title="Фото дня" onClose={() => setViewId(null)}>
        {viewing && (
          <div className="viewer">
            <BlobImage blob={viewing.blob} alt="Фото дня" className="viewer-img" />
            <div className="viewer-actions">
              {viewing.id === coverId ? (
                <p className="muted small">Это обложка дня</p>
              ) : (
                <button className="btn" onClick={() => onSetCover(viewing.id)}>
                  Сделать обложкой
                </button>
              )}
              <button
                className="link"
                onClick={() => {
                  if (window.confirm("Удалить это фото? Вернуть его будет нельзя, если нет сохранённой копии.")) {
                    onRemove(viewing.id);
                    setViewId(null);
                  }
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </section>
  );
}
