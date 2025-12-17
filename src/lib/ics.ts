export function downloadICS(opts: {
  title: string;
  description?: string;
  location?: string;
  startISO: string; // e.g. "2026-01-15T18:00:00"
  endISO?: string;
}) {
  const dt = (iso: string) =>
    iso.replace(/[-:]/g, "").split(".")[0] + "Z";

  const uid = `${Date.now()}@afroconnect`;
  const now = dt(new Date().toISOString());

  const start = dt(new Date(opts.startISO).toISOString());
  const end = opts.endISO ? dt(new Date(opts.endISO).toISOString()) : start;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AfroConnect//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeICS(opts.title)}`,
    `DESCRIPTION:${escapeICS(opts.description ?? "")}`,
    `LOCATION:${escapeICS(opts.location ?? "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFileName(opts.title)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function escapeICS(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function sanitizeFileName(name: string) {
  return name.replace(/[^\w\d\- ]+/g, "").trim().replace(/\s+/g, "-");
}
