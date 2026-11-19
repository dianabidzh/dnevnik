import { useCallback, useState } from "react";
import { currentMonthKey } from "../utils/dates";

// Помним выбранный месяц, пока приложение открыто: так не теряется место при переходе между вкладками
let remembered: string | null = null;

export function useMonth(): [string, (month: string) => void] {
  const [month, setMonthState] = useState(() => remembered ?? currentMonthKey());
  const setMonth = useCallback((m: string) => {
    remembered = m;
    setMonthState(m);
  }, []);
  return [month, setMonth];
}
