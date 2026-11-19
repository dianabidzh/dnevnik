import { useEffect, useState } from "react";
import { BlobImage } from "../../components/BlobImage";
import { Sheet } from "../../components/Sheet";
import * as q from "../../db/queries";
import type { Attachment, Material } from "../../db/schema";
import { formatSize, normalizeUrl, prepareAttachment, type PendingAttachment } from "../../lib/files";
import { newId } from "../../lib/id";

function AttachmentRow({ meta, onRemove }: { meta: Attachment; onRemove: () => void }) {
  return (
    <li className="att-row">
      <span className="att-thumb">{meta.thumb ? <BlobImage blob={meta.thumb} alt="" /> : <span aria-hidden="true">📄</span>}</span>
      <span className="att-name">
        {meta.name}
        <small>{formatSize(meta.size)}</small>
      </span>
      <button className="icon-btn" aria-label="Убрать вложение" onClick={onRemove}>
        ✕
      </button>
    </li>
  );
}

function MaterialForm({ material, folderId, onSaved, onDeleted }: { material: Material | null; folderId: string; onSaved: (m: Material) => void; onDeleted: () => void }) {
  const [id] = useState(() => material?.id ?? newId());
  const [title, setTitle] = useState(material?.title ?? "");
  const [url, setUrl] = useState(material?.url ?? "");
  const [text, setText] = useState(material?.text ?? "");
  const [existing, setExisting] = useState<Attachment[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (material) q.listAttachments(material.id).then(setExisting);
  }, [material]);

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    setError("");
    const errors: string[] = [];
    for (const f of files) {
      try {
        const p = await prepareAttachment(id, f);
        setPending((prev) => [...prev, p]);
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Не удалось добавить файл.");
      }
    }
    if (errors.length) setError(errors.join(" "));
    setBusy(false);
  }

  const visibleExisting = existing.filter((a) => !removed.has(a.id));
  const hasContent = title.trim() || url.trim() || text.trim() || visibleExisting.length > 0 || pending.length > 0;

  async function save() {
    if (!hasContent) return;
    const now = Date.now();
    const next: Material = {
      id,
      folderId: material?.folderId ?? folderId,
      title: title.trim(),
      url: normalizeUrl(url),
      text,
      createdAt: material?.createdAt ?? now,
      updatedAt: now
    };
    await q.saveMaterial(next, pending, Array.from(removed));
    onSaved(next);
  }

  async function remove() {
    if (!material) return;
    if (window.confirm("Удалить этот материал вместе с файлами? Это нельзя отменить.")) {
      await q.deleteMaterial(material.id);
      onDeleted();
    }
  }

  return (
    <div className="event-form">
      <label className="form-field">
        <span>Название</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="form-field">
        <span>Ссылка</span>
        <input value={url} inputMode="url" autoCapitalize="off" autoCorrect="off" placeholder="https://" onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="form-field">
        <span>Текст</span>
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      </label>

      <div className="form-field">
        <span>Фото и файлы</span>
        <ul className="att-list">
          {visibleExisting.map((a) => (
            <AttachmentRow key={a.id} meta={a} onRemove={() => setRemoved((prev) => new Set(prev).add(a.id))} />
          ))}
          {pending.map((p) => (
            <AttachmentRow key={p.meta.id} meta={p.meta} onRemove={() => setPending((prev) => prev.filter((x) => x.meta.id !== p.meta.id))} />
          ))}
        </ul>
        <div className="att-buttons">
          <label className={"btn ghost" + (busy ? " busy" : "")} style={{ cursor: "pointer" }}>
            Добавить фото
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                addFiles(files);
              }}
            />
          </label>
          <label className={"btn ghost" + (busy ? " busy" : "")} style={{ cursor: "pointer" }}>
            Добавить файл
            <input
              type="file"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = "";
                addFiles(files);
              }}
            />
          </label>
        </div>
        {busy && <p className="muted small">Обрабатываю…</p>}
        {error && <p className="error small">{error}</p>}
        <p className="muted small">Файлы хранятся только на этом телефоне. Один файл не больше 50 МБ.</p>
      </div>

      <div className="form-actions">
        <button className="btn" onClick={save} disabled={!hasContent || busy}>
          Сохранить
        </button>
        {material && (
          <button className="link" onClick={remove}>
            Удалить материал
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  material: Material | null;
  folderId: string;
  onClose: () => void;
  onSaved: (m: Material) => void;
  onDeleted?: () => void;
}

export function MaterialSheet({ open, material, folderId, onClose, onSaved, onDeleted }: Props) {
  return (
    <Sheet open={open} title={material ? "Материал" : "Новый материал"} onClose={onClose}>
      <MaterialForm
        material={material}
        folderId={folderId}
        onSaved={(m) => {
          onSaved(m);
          onClose();
        }}
        onDeleted={() => {
          onDeleted?.();
          onClose();
        }}
      />
    </Sheet>
  );
}
