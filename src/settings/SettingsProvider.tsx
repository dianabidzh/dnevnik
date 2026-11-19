import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getSetting, putSetting } from "../db/queries";

export interface Options {
  trackWeight: boolean;
  trackMeasurements: boolean;
  extraPhotos: boolean;
  welcomed: boolean;
  lastExportAt: number | null;
  backupSnoozeUntil: number | null;
}

export const DEFAULT_OPTIONS: Options = {
  trackWeight: false,
  trackMeasurements: false,
  extraPhotos: false,
  welcomed: false,
  lastExportAt: null,
  backupSnoozeUntil: null
};

interface Ctx {
  options: Options;
  ready: boolean;
  setOption: <K extends keyof Options>(key: K, value: Options[K]) => void;
}

const SettingsCtx = createContext<Ctx>({ options: DEFAULT_OPTIONS, ready: false, setOption: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<Options>(DEFAULT_OPTIONS);
  const [ready, setReady] = useState(false);
  const ref = useRef<Options>(DEFAULT_OPTIONS);

  useEffect(() => {
    getSetting<Partial<Options>>("options")
      .then((saved) => {
        const merged = { ...DEFAULT_OPTIONS, ...(saved ?? {}) };
        ref.current = merged;
        setOptions(merged);
      })
      .finally(() => setReady(true));
  }, []);

  const setOption = useCallback(<K extends keyof Options>(key: K, value: Options[K]) => {
    const next = { ...ref.current, [key]: value };
    ref.current = next;
    setOptions(next);
    putSetting("options", next);
  }, []);

  return <SettingsCtx.Provider value={{ options, ready, setOption }}>{children}</SettingsCtx.Provider>;
}

export const useSettings = () => useContext(SettingsCtx);
