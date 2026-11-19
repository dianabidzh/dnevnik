import { useCallback, useEffect, useRef, useState } from "react";

/** Текстовое поле с автосохранением: сохраняет после паузы, при сворачивании приложения и при уходе со страницы. */
export function useAutosaveText(initial: string, save: (value: string) => void, delay = 600) {
  const [value, setValue] = useState(initial);
  const latest = useRef(initial);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);
  const saveRef = useRef(save);
  saveRef.current = save;

  const flush = useCallback(() => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
    if (dirty.current) {
      dirty.current = false;
      saveRef.current(latest.current);
    }
  }, []);

  const onChange = useCallback(
    (v: string) => {
      setValue(v);
      latest.current = v;
      dirty.current = true;
      if (timer.current !== undefined) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, delay);
    },
    [delay, flush]
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  return [value, onChange] as const;
}
