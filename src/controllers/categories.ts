import { Elysia } from "elysia";
import { prisma } from "@/prisma";
import { CategoryPlainInputCreate } from "@/generated/prismabox/Category";

export const categoryController = new Elysia({ prefix: "/categories" })
    .get("/", async () => {
        const categories = await prisma.category.findMany();
        return { categories }
    })
    .post(
        "/",
        async ({ body, status }) => {
            const { name, color } = body;
            const category = await prisma.category.create({ data: { name, color } });
            return status(201, category);
        },
        { body: CategoryPlainInputCreate },
    )
    .delete(
        "/:id",
        async ({ status, params: { id } }) => {
            const category = await prisma.category.findUnique({
                where: {
                    id: Number(id)
                }
            })
            if (!category) {
                return status(400, "Category does not exist")
            }
            const transactions = await prisma.transaction.findMany({
                where: { categoryId: Number(id) },
            });
            if (transactions.length > 0) {
                return status(400, "Please delete all transactions that are referencing this category first.");
            }
            const categoryDeleted = await prisma.category.delete({
                where: {
                    id: Number(id),
                },
            })
            return categoryDeleted
        }
    )