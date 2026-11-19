import { isValid, parseISO } from "date-fns";
import { Navigate, useParams } from "react-router-dom";
import { DayPage } from "../features/day/DayPage";
import { todayISO } from "../utils/dates";

export function Day() {
  const { date = "" } = useParams();
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && isValid(parseISO(date));
  if (!valid || date === todayISO()) return <Navigate to="/" replace />;
  return <DayPage date={date} />;
}
