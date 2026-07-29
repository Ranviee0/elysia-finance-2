/* Minimal RFC 4180 writer: quote a field only when it could otherwise be
   misread, and escape embedded quotes by doubling them. */
const escapeField = (value: unknown) => {
    if (value === null || value === undefined) return "";

    const text = value instanceof Date ? value.toISOString() : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers: string[], rows: unknown[][]) =>
    [headers, ...rows].map((row) => row.map(escapeField).join(",")).join("\r\n");

export const csvResponse = (filename: string, csv: string) =>
    new Response(csv, {
        headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="${filename}"`,
        },
    });

/* Suffix exports with the day they were taken so repeated downloads don't
   collide in the browser's download folder. */
export const stampedFilename = (prefix: string) =>
    `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
