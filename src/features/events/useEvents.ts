import { useCallback, useEffect, useState } from "react";
import * as q from "../../db/queries";
import type { CalEvent } from "../../db/schema";

export function useEvents() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const reload = useCallback(() => {
    q.listEvents().then(setEvents);
  }, []);
  useEffect(reload, [reload]);
  return { events, reload };
}
