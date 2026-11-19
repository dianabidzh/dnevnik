import { useState } from "react";
import { Sheet } from "../../components/Sheet";
import * as q from "../../db/queries";
import type { Folder } from "../../db/schema";
import { newId } from "../../lib/id";
import { lastGrapheme } from "../../lib/files";
import { FOLDER_EMOJIS } from "./emojis";

function FolderForm({ folder, materialCount, onSaved, onDeleted }: { folder: Folder | null; materialCount: number; onSaved: (f: Folder) => void; onDeleted: () => void }) {
  const [name, setName] = useState(folder?.name ?? "");
  const [emoji, setEmoji] = useState(folder?.emoji ?? "📁");

  async function save() {
    if (!name.trim()) return;
    const next: Folder = {
      id: folder?.id ?? newId(),
      name: name.trim(),
      emoji: emoji || "📁",
      order: folder?.order ?? Date.now(),
      createdAt: folder?.createdAt ?? Date.now()
    };
    await q.putFolder(next);
    onSaved(next);
  }

  async function remove() {
    if (!folder) return;
    const extra = materialCount > 0 ? " вместе со всеми материалами (" + materialCount + ") и файлами" : "";
    if (window.confirm("Удалить папку «" + folder.name + "»" + extra + "? Это нельзя отменить.")) {
      await q.deleteFolder(folder.id);
      onDeleted();
    }
  }

  return (
    <div className="event-form">
      <div className="emoji-pick">
        <input
          className="emoji-input"
          value={emoji}
          aria-label="Смайлик папки"
          onChange={(e) => setEmoji(lastGrapheme(e.target.value))}
        />
        <p className="muted small">Впишите любой смайлик с клавиатуры или выберите ниже.</p>
        <div className="emoji-grid">
          {FOLDER_EMOJIS.map((em) => (
            <button key={em} className={em === emoji ? "on" : ""} onClick={() => setEmoji(em)} aria-label={"Смайлик " + em}>
              {em}
            </button>
          ))}
        </div>
      </div>
      <label className="form-field">
        <span>Название папки</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Вокал, Красота, Учёба" />
      </label>
      <div className="form-actions">
        <button className="btn" onClick={save} disabled={!name.trim()}>
          Сохранить
        </button>
        {folder && (
          <button className="link" onClick={remove}>
            Удалить папку
          </button>
        )}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  folder: Folder | null;
  materialCount?: number;
  onClose: () => void;
  onSaved: (f: Folder) => void;
  onDeleted?: () => void;
}

export function FolderSheet({ open, folder, materialCount = 0, onClose, onSaved, onDeleted }: Props) {
  return (
    <Sheet open={open} title={folder ? "Папка" : "Новая папка"} onClose={onClose}>
      <FolderForm
        folder={folder}
        materialCount={materialCount}
        onSaved={(f) => {
          onSaved(f);
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
