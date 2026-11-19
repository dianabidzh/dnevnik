import type { CalEvent } from "../db/schema";

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function compactDate(iso: string): string {
  return iso.replace(/-/g, "");
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return dt.toISOString().slice(0, 10);
}

/** Файл .ics для календаря iPhone */
export function buildIcs(e: CalEvent): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dnevnik//RU", "BEGIN:VEVENT", "UID:" + e.id + "@dnevnik", "DTSTAMP:" + stamp];
  if (e.time) {
    const [h, min] = e.time.split(":").map(Number);
    const endH = (h + 1) % 24;
    const pad = (n: number) => String(n).padStart(2, "0");
    lines.push("DTSTART:" + compactDate(e.date) + "T" + pad(h) + pad(min) + "00");
    lines.push("DTEND:" + compactDate(h === 23 ? nextDay(e.date) : e.date) + "T" + pad(endH) + pad(min) + "00");
  } else {
    lines.push("DTSTART;VALUE=DATE:" + compactDate(e.date));
    lines.push("DTEND;VALUE=DATE:" + compactDate(nextDay(e.date)));
  }
  lines.push("SUMMARY:" + escapeText(e.title));
  if (e.note.trim()) lines.push("DESCRIPTION:" + escapeText(e.note));
  if (e.repeat === "yearly") lines.push("RRULE:FREQ=YEARLY");
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function icsFile(e: CalEvent): File {
  return new File([buildIcs(e)], "sobytie.ics", { type: "text/calendar" });
}
