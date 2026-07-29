import { Elysia, t } from "elysia";
import { prisma } from "@/prisma";
import { TransactionPlainInputCreate } from "@/generated/prismabox/Transaction";

/* Extracting creationTime away from TransactionPlainInputCreate*/
const { creationTime: _creationTime, ...transactionInputProperties } = TransactionPlainInputCreate.properties;

export const transactionController = new Elysia({ prefix: "/transactions" })
    .get("/", async () => {
        const transactions = await prisma.transaction.findMany({
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        color: true
                    },
                },
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
        });

        return { transactions: transactionsWithBalance };
    })
    .get("/until/:id", async ({ params: { id }, status }) => {
        const transactions = await prisma.transaction.findMany({
            where: {
                id: {
                    lte: Number(id), // id < n
                },
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
        });

        return { transactions: transactionsWithBalance };
    })
    .get("/since/:id", async ({ params: { id }, status }) => {
        const transactions = await prisma.transaction.findMany();

        let balance = 0;

        const transactionsWithBalance = transactions
            .map((tx) => {
                if (tx.type === "INCOME" || tx.type === "TRANSFER_IN") {
                    balance += Number(tx.amount);
                } else if (tx.type === "EXPENSE" || tx.type === "TRANSFER_OUT") {
                    balance -= Number(tx.amount);
                }

                return { ...tx, balance };
            })
            .filter((tx) => tx.id >= Number(id));

        return { transactions: transactionsWithBalance };
    })
    .post(
        "/",
        async ({ body, status }) => {
            const { type, amount, transactionTime, categoryId, note } = body;
            const transactions = await prisma.transaction.create({
                data: { type, amount, transactionTime, categoryId, note },
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
        }
    )
    .patch(
        "/:id",
        async ({ body, status, params: { id } }) => {
            const { categoryId } = body;

            let category: { connect: { id: number } } | { disconnect: true } | undefined;

            if (categoryId === null) {
                category = { disconnect: true };
            } else if (categoryId !== undefined) {

                /* Check if a category exist*/
                const categoryExists = await prisma.category.findUnique({
                    where: { id: categoryId },
                });


                /* Return 400 if doesn't exist */
                if (!categoryExists) {
                    return status(400, "Category not found");
                }

                /* Update category variable*/
                category = { connect: { id: categoryId } };
            }

            const transaction = await prisma.transaction.update({
                where: {
                    id: Number(id),
                },
                data: {
                    category
                },
            })

            return transaction
        },
        {
            body: t.Object(
                {
                    categoryId: t.Optional(t.Nullable(t.Integer())),
                }
            )
        }
    )
    .delete(
        "/:id",
        async ({ status, params: { id } }) => {

            const transactionExists = await prisma.transaction.findUnique({
                where: { id: Number(id) },
            });

            if (!transactionExists) {
                return status(400, "Transaction not found");
            }


            const transaction = await prisma.transaction.delete({
                where: {
                    id: Number(id),
                },
            })
            return transaction
        }
    )