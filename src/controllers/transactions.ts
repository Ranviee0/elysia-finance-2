import { Elysia, t } from "elysia";
import { prisma } from "@/prisma";
import { TransactionPlainInputCreate } from "@/generated/prismabox/Transaction";

/* Extracting creationTime away from TransactionPlainInputCreate*/
const { creationTime: _creationTime, ...transactionInputProperties } = TransactionPlainInputCreate.properties;

export const transactionController = new Elysia({ prefix: "/transactions" })
    .get("/", async () => {
        const transactions = await prisma.transaction.findMany();

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
                    /* Validation that categoryId is an integer*/
                    categoryId: t.Optional(t.Nullable(t.Integer())),
                },
                { additionalProperties: false },
            ),
        }
    )