/**
 * A cell beginning with = + - @ or a control character is executed as a
 * formula by Excel and Google Sheets. A guest could name themselves
 * `=HYPERLINK(...)` and have it fire when the couple open the export, so the
 * value is prefixed with an apostrophe to force it to text.
 */
function defuse(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const safe = defuse(text);
  // Quote whenever the delimiter, a quote or a newline is present; inner
  // quotes double per RFC 4180.
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(','), ...rows.map((row) => row.map(cell).join(','))];
  // CRLF per RFC 4180, and a BOM so Excel reads it as UTF-8 — without it
  // Indonesian names with diacritics arrive mangled.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function csvResponse(filename: string, body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
