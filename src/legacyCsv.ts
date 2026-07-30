import { parseCsv, toCsv } from "@/csv";
import { CATEGORY_HEADERS, TRANSACTION_HEADERS } from "@/importCsv";

/* Translator for the old spreadsheet this app replaced. It deliberately stops
   at producing the same two files the export writes, so the real importer —
   and all of its validation — is still the only thing that reaches the
   database. Nothing here touches Prisma. */

const LEGACY_HEADERS = [
    "Transaction Type",
    "Date",
    "Time",
    "Category",
    "Notes",
    "Amount",
    "Balance",
] as const;

/* The sheet leaves the category cell carrying two different meanings: usually
   it is a category, but "Transfer" is the old way of saying money moved
   between accounts — which this app models as the row's type instead. Those
   rows therefore end up with no category at all. */
const TRANSFER_CATEGORY = "Transfer";

/* Colours are only ever chosen by hand in the app, so an import has to invent
   them. Cycling a fixed palette in first-seen order keeps two runs of the same
   file identical and keeps neighbouring categories visually apart. */
const PALETTE = [
    "#6366f1", "#ec4899", "#f97316", "#22c55e", "#0ea5e9",
    "#a855f7", "#ef4444", "#14b8a6", "#eab308", "#8b5cf6",
    "#f43f5e", "#10b981", "#3b82f6", "#d946ef", "#f59e0b",
];

const MAX_REPORTED_ERRORS = 50;

export type LegacyConversion =
    | {
        ok: true;
        categoriesCsv: string;
        transactionsCsv: string;
        /* Everything the conversion had to decide for itself, so the page can
           say what it did rather than leaving the user to notice later. */
        categories: number;
        transactions: number;
        byType: Record<string, number>;
        nudged: number;
    }
    | { ok: false; errors: string[] };

type Row = {
    type: string;
    amount: number;
    time: Date;
    categoryName: string | null;
    note: string;
};

/* Spreadsheet exports pad every row out to the widest one, so the file is full
   of trailing empty columns and, at the end, entirely empty rows. Both are
   noise rather than data. */
const trimTrailingBlanks = (row: string[]) => {
    let end = row.length;
    while (end > 0 && row[end - 1]!.trim() === "") end--;
    return row.slice(0, end).map((field) => field.trim());
};

export const convertLegacyCsv = (csv: string): LegacyConversion => {
    const rows = parseCsv(csv);
    const [header, ...body] = rows;

    const headerFields = trimTrailingBlanks(header ?? []);
    if (headerFields.length !== LEGACY_HEADERS.length ||
        !LEGACY_HEADERS.every((name, i) => headerFields[i] === name)) {
        return {
            ok: false,
            errors: [
                `Expected the legacy columns ${LEGACY_HEADERS.join(", ")} but found ${headerFields.join(", ") || "an empty file"
                }.`,
            ],
        };
    }

    const errors: string[] = [];
    const parsed: Row[] = [];

    body.forEach((raw, index) => {
        const line = index + 2; // header is line 1
        const row = trimTrailingBlanks(raw);
        if (row.length === 0) return; // padding

        const where = `Line ${line}`;
        const [kind, date, time, category, note, amount] = row as string[];

        if (row.length < 6) {
            errors.push(`${where}: only ${row.length} filled columns — expected at least Transaction Type through Amount.`);
            return;
        }

        if (kind !== "Income" && kind !== "Expense") {
            errors.push(`${where}: transaction type "${kind}" is neither Income nor Expense.`);
            return;
        }

        const isTransfer = category === TRANSFER_CATEGORY;
        const type = isTransfer
            ? (kind === "Income" ? "TRANSFER_IN" : "TRANSFER_OUT")
            : (kind === "Income" ? "INCOME" : "EXPENSE");

        /* M/D/YYYY and H:MM, both unpadded, and both meaning local wall-clock
           time — parsed by hand because Date's own parsing of those is not
           portable. */
        const dateMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date ?? "");
        const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");

        if (!dateMatch) {
            errors.push(`${where}: date "${date}" is not in M/D/YYYY form.`);
            return;
        }
        if (!timeMatch) {
            errors.push(`${where}: time "${time}" is not in H:MM form.`);
            return;
        }

        const [, month, day, year] = dateMatch.map(Number) as [number, number, number, number];
        const [, hour, minute] = timeMatch.map(Number) as [number, number, number];
        const at = new Date(year, month - 1, day, hour, minute);

        if (at.getMonth() !== month - 1 || at.getDate() !== day || at.getHours() !== hour) {
            errors.push(`${where}: ${date} ${time} is not a real date and time.`);
            return;
        }

        const value = Number(amount);
        if (!Number.isFinite(value) || value < 0) {
            errors.push(`${where}: amount "${amount}" is not a number of zero or more.`);
            return;
        }

        parsed.push({
            type,
            amount: value,
            time: at,
            categoryName: isTransfer || category === "" ? null : category!,
            note: note ?? "",
        });
    });

    if (errors.length > 0) {
        const shown = errors.slice(0, MAX_REPORTED_ERRORS);
        if (errors.length > shown.length) {
            shown.push(`…and ${errors.length - shown.length} more problems.`);
        }
        return { ok: false, errors: shown };
    }

    /* The sheet only recorded minutes, so the same minute can hold several
       rows, while the app treats a timestamp as the thing that identifies a
       transaction and refuses collisions. Later arrivals within a minute are
       pushed forward a second each, which keeps the file's order intact and
       stays inside the minute the user actually wrote down. */
    parsed.sort((a, b) => a.time.getTime() - b.time.getTime());

    let nudged = 0;
    const taken = new Set<number>();

    for (const row of parsed) {
        let stamp = row.time.getTime();
        while (taken.has(stamp)) {
            stamp += 1000;
            nudged++;
        }
        taken.add(stamp);
        row.time = new Date(stamp);
    }

    /* First-seen order, so the ids read in the same sequence as the sheet. */
    const categoryIds = new Map<string, number>();
    for (const row of parsed) {
        if (row.categoryName !== null && !categoryIds.has(row.categoryName)) {
            categoryIds.set(row.categoryName, categoryIds.size + 1);
        }
    }

    const categoriesCsv = toCsv(
        [...CATEGORY_HEADERS],
        [...categoryIds].map(([name, id]) => [id, name, PALETTE[(id - 1) % PALETTE.length]]),
    );

    /* The old sheet never recorded when a row was entered, only when the money
       moved, so the two timestamps are the same. */
    const transactionsCsv = toCsv(
        [...TRANSACTION_HEADERS],
        parsed.map((row, index) => [
            index + 1,
            row.type,
            row.amount,
            row.time,
            row.time,
            row.categoryName === null ? "" : categoryIds.get(row.categoryName)!,
            row.categoryName ?? "",
            row.note,
        ]),
    );

    const byType = parsed.reduce<Record<string, number>>((totals, row) => {
        totals[row.type] = (totals[row.type] ?? 0) + 1;
        return totals;
    }, {});

    return {
        ok: true,
        categoriesCsv,
        transactionsCsv,
        categories: categoryIds.size,
        transactions: parsed.length,
        byType,
        nudged,
    };
};
