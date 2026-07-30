/* Minimal RFC 4180 writer: quote a field only when it could otherwise be
   misread, and escape embedded quotes by doubling them. */
const escapeField = (value: unknown) => {
    if (value === null || value === undefined) return "";

    const text = value instanceof Date ? value.toISOString() : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers: string[], rows: unknown[][]) =>
    [headers, ...rows].map((row) => row.map(escapeField).join(",")).join("\r\n");

/* The reader half of the writer above. Hand-rolled because the quoting rules
   are small and a dependency here would have to be trusted with the whole
   import. Returns rows of raw fields; nothing is coerced or trimmed, since the
   importer wants to see exactly what the file said. */
export class CsvParseError extends Error { }

export const parseCsv = (input: string): string[][] => {
    /* Spreadsheet exports often lead with a BOM, which would otherwise glue
       itself to the first header name and fail the exact-match check. */
    const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    let index = 0;

    while (index < text.length) {
        const char = text[index]!;

        if (inQuotes) {
            if (char === '"') {
                /* A doubled quote inside a quoted field is one literal quote. */
                if (text[index + 1] === '"') {
                    field += '"';
                    index += 2;
                    continue;
                }
                inQuotes = false;
                index++;
                continue;
            }
            field += char;
            index++;
            continue;
        }

        if (char === '"') {
            inQuotes = true;
            index++;
            continue;
        }

        if (char === ",") {
            row.push(field);
            field = "";
            index++;
            continue;
        }

        if (char === "\r" || char === "\n") {
            if (char === "\r" && text[index + 1] === "\n") index++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
            index++;
            continue;
        }

        field += char;
        index++;
    }

    if (inQuotes) {
        throw new CsvParseError("A quoted field is never closed — the file looks truncated.");
    }

    /* A file ending in a newline leaves nothing pending; anything else is a
       final row with no trailing terminator. */
    if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    return rows;
};

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
