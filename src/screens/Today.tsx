import { useEffect, useState } from "react";
import { DayPage } from "../features/day/DayPage";
import { todayISO } from "../utils/dates";

export function Today() {
  const [date, setDate] = useState(todayISO());

  // Если приложение открыто через полночь, при возвращении покажем новый день
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setDate(todayISO());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return <DayPage date={date} />;
}
