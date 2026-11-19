import { useState, type ReactNode } from "react";

interface Item {
  id: string;
  text: string;
}

interface Props {
  items: Item[];
  placeholder: string;
  empty: string;
  onAdd: (text: string) => void;
  onRename: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  extra?: (id: string) => ReactNode;
}

/** Список для добавления, переименования, перемещения и удаления */
export function ManageList({ items, placeholder, empty, onAdd, onRename, onRemove, onMove, extra }: Props) {
  const [draft, setDraft] = useState("");

  function add() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <div className="manage">
      {items.length === 0 && <p className="muted">{empty}</p>}
      <ul className="manage-list">
        {items.map((it, i) => (
          <li key={it.id}>
            <div className="manage-row">
              <input
                defaultValue={it.text}
                aria-label="Название"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== it.text) onRename(it.id, v);
                  else e.target.value = it.text;
                }}
              />
              <button className="icon-btn" disabled={i === 0} aria-label="Выше" onClick={() => onMove(it.id, -1)}>
                ↑
              </button>
              <button
                className="icon-btn"
                disabled={i === items.length - 1}
                aria-label="Ниже"
                onClick={() => onMove(it.id, 1)}
              >
                ↓
              </button>
              <button className="icon-btn" aria-label="Удалить" onClick={() => onRemove(it.id)}>
                ✕
              </button>
            </div>
            {extra?.(it.id)}
          </li>
        ))}
      </ul>
      <div className="manage-add">
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="btn" onClick={add}>
          Добавить
        </button>
      </div>
    </div>
  );
}
