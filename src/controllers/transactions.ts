import { Elysia, t } from "elysia";
import { prisma } from "@/prisma";
import { auth } from "@/auth";
import { TransactionPlainInputCreate } from "@/generated/prismabox/Transaction";
import { csvResponse, stampedFilename, toCsv } from "@/csv";
import { TransactionType } from "@/generated/prisma/enums";

/* Extracting creationTime away from TransactionPlainInputCreate*/
const { creationTime: _creationTime, ...transactionInputProperties } = TransactionPlainInputCreate.properties;

export const transactionController = new Elysia({ prefix: "/transactions" })
    .use(auth)
    .get("/",
        async ({ query, user }) => {

            const { from, until } = query;

            const transactions = await prisma.transaction.findMany({
                where: { userId: user.id },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            color: true
                        },
                    },
                },
                orderBy: {
                    transactionTime: "asc",
                },
            });

            let balance = 0;

            const transactionsWithBalance = transactions.map((tx) => {
                if (tx.type === "INCOME" || tx.type === "TRANSFER_IN") {
                    balance += Number(tx.amount);
                } else if (tx.type === "EXPENSE" || tx.type === "TRANSFER_OUT") {
                    balance -= Number(tx.amount);
                }

                return { ...tx, balance };
            })
                .filter(
                    (tx) => !from || tx.transactionTime.getTime() >= from.getTime()
                )
                .filter(
                    (tx) => !until || tx.transactionTime.getTime() < until.getTime()
                );


            return { transactions: transactionsWithBalance };

        },
        {
            query: t.Object({
                from: t.Optional(t.Date()),   // t.Date coerces the string for you
                until: t.Optional(t.Date())
            }),
            requireUser: true
        })
    /* Per-category totals for one calendar month, which is all the pie charts
       on the analytics page need. Transfers are left out on purpose: moving
       money between your own accounts isn't income or expense. */
    .get("/summary",
        async ({ query, user }) => {
            const [year, month] = query.month.split("-").map(Number);

            /* Built from local parts, matching how the rest of the app reads
               the clock — a month runs to the start of the next one. */
            const start = new Date(year!, month! - 1, 1);
            const end = new Date(year!, month!, 1);

            const transactions = await prisma.transaction.findMany({
                where: {
                    userId: user.id,
                    transactionTime: { gte: start, lt: end },
                },
                include: { category: { select: { id: true, name: true, color: true } } },
            });

            const groupByCategory = (type: "INCOME" | "EXPENSE") => {
                const totals = new Map<number | null, { categoryId: number | null; name: string; color: string | null; total: number }>();

                for (const tx of transactions) {
                    if (tx.type !== type) continue;

                    const key = tx.categoryId;
                    const slice = totals.get(key) ?? {
                        categoryId: key,
                        name: tx.category?.name ?? "Uncategorized",
                        /* No colour of its own — the chart paints it gray. */
                        color: tx.category?.color ?? null,
                        total: 0,
                    };

                    slice.total += Number(tx.amount);
                    totals.set(key, slice);
                }

                return [...totals.values()].sort((a, b) => b.total - a.total);
            };

            return {
                income: groupByCategory("INCOME"),
                expense: groupByCategory("EXPENSE"),
            };
        },
        {
            query: t.Object({
                month: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
            }),
            requireUser: true,
        })
    .get("/csv", async ({ user }) => {
        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id },
            include: { category: { select: { name: true } } },
        });

        const csv = toCsv(
            ["id", "type", "amount", "transactionTime", "creationTime", "categoryId", "category", "note"],
            transactions.map((tx) => [
                tx.id,
                tx.type,
                tx.amount,
                tx.transactionTime,
                tx.creationTime,
                tx.categoryId,
                tx.category?.name,
                tx.note,
            ]),
        );

        return csvResponse(stampedFilename("transactions"), csv);
    }, { requireUser: true })
    .post(
        "/",
        async ({ body, status, user }) => {
            const { type, amount, transactionTime, categoryId, note } = body;

            /* Scoped to the account: two people are free to record something
               at the same minute as each other. */
            const transactionsWithExactSameTime = await prisma.transaction.findMany({
                where: {
                    transactionTime: transactionTime,
                    userId: user.id,
                },
            });

            if (transactionsWithExactSameTime.length > 0) {
                return status(400, "Transaction time clash! Please select new time that is at least 1 minutes apart.")
            }

            /* Without this check a transaction could be filed under someone
               else's category, which would leak that category's name back
               through the transactions list. */
            if (categoryId !== undefined && categoryId !== null) {
                const categoryExists = await prisma.category.findFirst({
                    where: { id: categoryId, userId: user.id },
                });

                if (!categoryExists) {
                    return status(400, "Category not found");
                }
            }

            const transactions = await prisma.transaction.create({
                data: { type, amount, transactionTime, categoryId, note, userId: user.id },
                include: { category: true },
            })
            return status(201, transactions)
        },
        {
            body: t.Object(
                {
                    ...transactionInputProperties,
                    amount: t.Numeric(),
                    /* Validation that categoryId is an integer*/
                    categoryId: t.Optional(t.Nullable(t.Numeric())),
                },
                { additionalProperties: false },
            ),
            requireUser: true
        }
    )
    .patch(
        "/category/:id",
        async ({ body, status, params: { id }, user }) => {
            const { categoryId } = body;

            /* null clears the category; undefined leaves it alone. Anything
               else has to be a category on this account. */
            if (categoryId !== undefined && categoryId !== null) {
                const categoryExists = await prisma.category.findFirst({
                    where: { id: categoryId, userId: user.id },
                });

                if (!categoryExists) {
                    return status(400, "Category not found");
                }
            }

            /* updateMany rather than update so userId can join the filter —
               update() only matches on unique fields. */
            const updated = await prisma.transaction.updateMany({
                where: {
                    id: Number(id),
                    userId: user.id,
                },
                data: {
                    categoryId,
                },
            })

            if (updated.count === 0) {
                return status(400, "Transaction not found");
            }

            return prisma.transaction.findUnique({ where: { id: Number(id) } })
        },
        {
            body: t.Object(
                {
                    categoryId: t.Optional(t.Nullable(t.Integer())),
                }
            ),
            requireUser: true
        }
    )
    .delete(
        "/:id",
        async ({ status, params: { id }, user }) => {

            const deleted = await prisma.transaction.deleteMany({
                where: { id: Number(id), userId: user.id },
            });

            if (deleted.count === 0) {
                return status(400, "Transaction not found");
            }

            return { id: Number(id) }
        },
        { requireUser: true }
    )
    .patch(
        "/type/:id",
        async ({ body, status, params: { id }, user }) => {
            const { type } = body;

            const updated = await prisma.transaction.updateMany({
                where: {
                    id: Number(id),
                    userId: user.id,
                },
                data: {
                    type,
                },
            })

            if (updated.count === 0) {
                return status(400, "Transaction not found");
            }

            return prisma.transaction.findUnique({ where: { id: Number(id) } })
        },
        {
            body: t.Object({
                type: t.Enum(TransactionType),
            }),
            requireUser: true
        }
    )
    .patch(
        "/time/:id",
        async ({ body, status, params: { id }, user }) => {
            const { transactionTime } = body;

            const updated = await prisma.transaction.updateMany({
                where: {
                    id: Number(id),
                    userId: user.id,
                },
                data: {
                    transactionTime,
                },
            })

            if (updated.count === 0) {
                return status(400, "Transaction not found");
            }

            return prisma.transaction.findUnique({ where: { id: Number(id) } })
        },
        {
            body: t.Object({
                transactionTime: t.Date(),
            }),
            requireUser: true
        }
    )
    .patch(
        "/amount/:id",
        async ({ body, status, params: { id }, user }) => {
            const { amount } = body;

            const updated = await prisma.transaction.updateMany({
                where: {
                    id: Number(id),
                    userId: user.id,
                },
                data: {
                    amount,
                },
            })

            if (updated.count === 0) {
                return status(400, "Transaction not found");
            }

            return prisma.transaction.findUnique({ where: { id: Number(id) } })
        },
        {
            body: t.Object({
                amount: t.Number(),
            }),
            requireUser: true
        }
    )
    .patch(
        "/note/:id",
        async ({ body, status, params: { id }, user }) => {
            const { note } = body;

            const updated = await prisma.transaction.updateMany({
                where: {
                    id: Number(id),
                    userId: user.id,
                },
                data: {
                    note,
                },
            })

            if (updated.count === 0) {
                return status(400, "Transaction not found");
            }

            return prisma.transaction.findUnique({ where: { id: Number(id) } })
        },
        {
            body: t.Object({
                note: t.String(),
            }),
            requireUser: true
        }
    )