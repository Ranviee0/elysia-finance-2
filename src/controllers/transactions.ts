import { Elysia, t } from "elysia";
import { prisma } from "@/prisma";
import { TransactionPlainInputCreate } from "@/generated/prismabox/Transaction";


export const transactionController = new Elysia({ prefix: "/transactions" })
    .get("/", async () => {
        const transactions = await prisma.transaction.findMany();
        return { transactions }
    })
    .post(
        "/",
        async ({ body, status }) => {
            const { type, amount, transactionTime, categoryId, note } = body;
            const transactions = await prisma.transaction.create({ data: { type, amount, transactionTime, categoryId, note } })
            return status(201, transactions)
        },
        {
            body: t.Object(
                {
                    ...TransactionPlainInputCreate.properties,
                    /* Validation that categoryId is an integer*/
                    categoryId: t.Optional(t.Nullable(t.Integer())),
                },
                { additionalProperties: false },
            ),
        }
    )