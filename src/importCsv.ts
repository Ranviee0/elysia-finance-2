import { prisma } from "@/prisma";
import { CsvParseError, parseCsv } from "@/csv";

/* Both files must match what the export writes, column for column. Anything
   else is rejected before a single row is read, because a shifted column would
   otherwise import silently wrong data. */
export const CATEGORY_HEADERS = ["id", "name", "color"] as const;
export const TRANSACTION_HEADERS = [
    "id",
    "type",
    "amount",
    "transactionTime",
    "creationTime",
    "categoryId",
    "category",
    "note",
] as const;

const TRANSACTION_TYPES = ["TRANSFER_IN", "TRANSFER_OUT", "INCOME", "EXPENSE"] as const;
type TransactionType = (typeof TRANSACTION_TYPES)[number];

/* The app only ever writes colours through <input type="color">, and the value
   lands in a style attribute on the categories page — so an import is not the
   place to start accepting arbitrary strings. */
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type ImportResult =
    | { ok: true; categories: number; transactions: number }
    | { ok: false; errors: string[] };

/* Every bad row is reported rather than just the first, because fixing a
   spreadsheet one error per attempt is miserable. A row stops at its first
   problem — listing four complaints about one line reads as noise. Either way
   the import aborts. */
const MAX_REPORTED_ERRORS = 50;

type ParsedCategory = { fileId: number; name: string; color: string };

type ParsedTransaction = {
    type: TransactionType;
    amount: number;
    transactionTime: Date;
    creationTime: Date;
    fileCategoryId: number | null;
    note: string | null;
};

const headerMismatch = (file: string, actual: string[], expected: readonly string[]) =>
    `${file}: expected the exported columns ${expected.join(", ")} but found ${actual.length === 0 ? "an empty file" : actual.join(", ")
    }.`;

const isInteger = (value: string) => /^-?\d+$/.test(value);

const readCategories = (csv: string, errors: string[]): ParsedCategory[] => {
    const rows = parseCsv(csv);
    const [header, ...body] = rows;

    if (!header || header.length !== CATEGORY_HEADERS.length ||
        !CATEGORY_HEADERS.every((name, i) => header[i] === name)) {
        errors.push(headerMismatch("categories.csv", header ?? [], CATEGORY_HEADERS));
        return [];
    }

    const categories: ParsedCategory[] = [];
    const seenIds = new Set<number>();
    const seenNames = new Set<string>();

    body.forEach((row, index) => {
        const line = index + 2; // header is line 1
        const where = `categories.csv line ${line}`;

        if (row.length !== CATEGORY_HEADERS.length) {
            errors.push(`${where}: expected ${CATEGORY_HEADERS.length} columns, found ${row.length}.`);
            return;
        }

        const [rawId, name, color] = row as [string, string, string];

        if (!isInteger(rawId)) {
            errors.push(`${where}: id "${rawId}" is not a whole number.`);
            return;
        }

        const fileId = Number(rawId);
        if (seenIds.has(fileId)) {
            errors.push(`${where}: id ${fileId} appears more than once.`);
            return;
        }
        if (name.trim() === "") {
            errors.push(`${where}: name is empty.`);
            return;
        }
        if (seenNames.has(name)) {
            errors.push(`${where}: the name "${name}" appears more than once — category names must be unique.`);
            return;
        }
        if (!COLOR_PATTERN.test(color)) {
            errors.push(`${where}: colour "${color}" is not a 6-digit hex value like #6366f1.`);
            return;
        }

        seenIds.add(fileId);
        seenNames.add(name);
        categories.push({ fileId, name, color });
    });

    return categories;
};

const readTransactions = (
    csv: string,
    categoriesByFileId: Map<number, ParsedCategory>,
    /* False when categories.csv was itself rejected. Its rows can't be trusted
       as the list of what exists, so every transaction would be blamed for a
       missing category and bury the one error that actually needs fixing. */
    categoriesUsable: boolean,
    errors: string[],
): ParsedTransaction[] => {
    const rows = parseCsv(csv);
    const [header, ...body] = rows;

    if (!header || header.length !== TRANSACTION_HEADERS.length ||
        !TRANSACTION_HEADERS.every((name, i) => header[i] === name)) {
        errors.push(headerMismatch("transactions.csv", header ?? [], TRANSACTION_HEADERS));
        return [];
    }

    const transactions: ParsedTransaction[] = [];
    const seenIds = new Set<number>();
    /* The create endpoint refuses two transactions at the same instant, so an
       import must not be a way in through the back door. */
    const seenTimes = new Set<number>();

    body.forEach((row, index) => {
        const line = index + 2;
        const where = `transactions.csv line ${line}`;

        if (row.length !== TRANSACTION_HEADERS.length) {
            errors.push(`${where}: expected ${TRANSACTION_HEADERS.length} columns, found ${row.length}.`);
            return;
        }

        const [rawId, rawType, rawAmount, rawTime, rawCreated, rawCategoryId, rawCategoryName, rawNote] =
            row as [string, string, string, string, string, string, string, string];

        if (!isInteger(rawId)) {
            errors.push(`${where}: id "${rawId}" is not a whole number.`);
            return;
        }
        const fileId = Number(rawId);
        if (seenIds.has(fileId)) {
            errors.push(`${where}: id ${fileId} appears more than once.`);
            return;
        }

        if (!TRANSACTION_TYPES.includes(rawType as TransactionType)) {
            errors.push(`${where}: type "${rawType}" must be one of ${TRANSACTION_TYPES.join(", ")}.`);
            return;
        }

        const amount = Number(rawAmount);
        if (rawAmount.trim() === "" || !Number.isFinite(amount) || amount < 0) {
            errors.push(`${where}: amount "${rawAmount}" is not a number of zero or more.`);
            return;
        }

        const transactionTime = new Date(rawTime);
        if (Number.isNaN(transactionTime.getTime())) {
            errors.push(`${where}: transactionTime "${rawTime}" is not a valid timestamp.`);
            return;
        }
        if (seenTimes.has(transactionTime.getTime())) {
            errors.push(`${where}: another row already uses the timestamp ${rawTime} — transaction times must be unique.`);
            return;
        }

        const creationTime = new Date(rawCreated);
        if (Number.isNaN(creationTime.getTime())) {
            errors.push(`${where}: creationTime "${rawCreated}" is not a valid timestamp.`);
            return;
        }

        let fileCategoryId: number | null = null;

        if (rawCategoryId !== "") {
            if (!isInteger(rawCategoryId)) {
                errors.push(`${where}: categoryId "${rawCategoryId}" is not a whole number.`);
                return;
            }

            fileCategoryId = Number(rawCategoryId);
            const category = categoriesByFileId.get(fileCategoryId);

            if (categoriesUsable) {
                /* The failure this whole design exists to catch. */
                if (!category) {
                    errors.push(
                        `${where}: categoryId ${fileCategoryId} has no matching row in categories.csv. Import the categories that these transactions refer to.`,
                    );
                    return;
                }

                /* The name column is redundant with the id, so a disagreement
                   means one of the two was edited by hand and there's no way to
                   tell which one was meant. */
                if (rawCategoryName !== category.name) {
                    errors.push(
                        `${where}: category "${rawCategoryName}" doesn't match categories.csv, where id ${fileCategoryId} is "${category.name}".`,
                    );
                    return;
                }
            }
        } else if (rawCategoryName !== "") {
            errors.push(`${where}: category is "${rawCategoryName}" but categoryId is empty — both must be filled in or both blank.`);
            return;
        }

        seenIds.add(fileId);
        seenTimes.add(transactionTime.getTime());

        transactions.push({
            type: rawType as TransactionType,
            amount,
            transactionTime,
            creationTime,
            fileCategoryId,
            note: rawNote === "" ? null : rawNote,
        });
    });

    return transactions;
};

/* Replaces everything the account owns. Validation runs first and in full, so
   the destructive part only starts once the files are known to be good — and
   even then it shares one database transaction with the inserts, so a failure
   at any point leaves the account exactly as it was. */
export const importCsv = async (
    userId: number,
    categoriesCsv: string,
    transactionsCsv: string,
): Promise<ImportResult> => {
    const errors: string[] = [];
    let categories: ParsedCategory[];
    let transactions: ParsedTransaction[];

    try {
        categories = readCategories(categoriesCsv, errors);
        const categoriesUsable = errors.length === 0;

        const categoriesByFileId = new Map(categories.map((category) => [category.fileId, category]));
        transactions = readTransactions(transactionsCsv, categoriesByFileId, categoriesUsable, errors);
    } catch (error) {
        if (error instanceof CsvParseError) return { ok: false, errors: [error.message] };
        throw error;
    }

    if (errors.length > 0) {
        const shown = errors.slice(0, MAX_REPORTED_ERRORS);
        if (errors.length > shown.length) {
            shown.push(`…and ${errors.length - shown.length} more problems.`);
        }
        return { ok: false, errors: shown };
    }

    await prisma.$transaction(async (tx) => {
        await tx.transaction.deleteMany({ where: { userId } });
        await tx.category.deleteMany({ where: { userId } });

        /* Categories go in first and one at a time, because the file's ids are
           discarded and each row's real id is only known once it's written —
           that mapping is what the transactions are rewired through. */
        const idByFileId = new Map<number, number>();

        for (const category of categories) {
            const created = await tx.category.create({
                /* The CSV format predates categoryType and carries no column
                   for it, so imported rows land unclassified like the rest. */
                data: { name: category.name, color: category.color, categoryType: "", userId },
            });
            idByFileId.set(category.fileId, created.id);
        }

        if (transactions.length > 0) {
            await tx.transaction.createMany({
                data: transactions.map((transaction) => ({
                    type: transaction.type,
                    amount: transaction.amount,
                    transactionTime: transaction.transactionTime,
                    creationTime: transaction.creationTime,
                    categoryId:
                        transaction.fileCategoryId === null
                            ? null
                            : idByFileId.get(transaction.fileCategoryId)!,
                    note: transaction.note,
                    userId,
                })),
            });
        }
    });

    return { ok: true, categories: categories.length, transactions: transactions.length };
};
