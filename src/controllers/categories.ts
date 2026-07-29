import { Elysia, t } from "elysia";
import { prisma } from "@/prisma";
import { auth } from "@/auth";
import { CategoryPlainInputCreate } from "@/generated/prismabox/Category";
import { csvResponse, stampedFilename, toCsv } from "@/csv";

export const categoryController = new Elysia({ prefix: "/categories" })
    .use(auth)
    .get("/", async ({ user }) => {
        const categories = await prisma.category.findMany({ where: { userId: user.id } });
        return { categories }
    }, { requireUser: true })
    .get("/csv", async ({ user }) => {
        const categories = await prisma.category.findMany({ where: { userId: user.id } });

        const csv = toCsv(
            ["id", "name", "color"],
            categories.map((category) => [category.id, category.name, category.color]),
        );

        return csvResponse(stampedFilename("categories"), csv);
    }, { requireUser: true })
    .post(
        "/",
        async ({ body, status, user }) => {
            const { name, color } = body;

            /* Names are unique per account, so report a duplicate as the
               user's mistake instead of letting Prisma throw a 500. */
            const duplicate = await prisma.category.findUnique({
                where: { userId_name: { userId: user.id, name } },
            });
            if (duplicate) {
                return status(400, "You already have a category with that name.");
            }

            const category = await prisma.category.create({ data: { name, color, userId: user.id } });
            return status(201, category);
        },
        { body: CategoryPlainInputCreate, requireUser: true },
    )
    .delete(
        "/:id",
        async ({ status, params: { id }, user }) => {
            /* Every lookup filters on userId, so another account's id reads as
               "does not exist" rather than acting on their row. */
            const category = await prisma.category.findFirst({
                where: {
                    id: Number(id),
                    userId: user.id
                }
            })
            if (!category) {
                return status(400, "Category does not exist")
            }
            const transactions = await prisma.transaction.findMany({
                where: { categoryId: Number(id), userId: user.id },
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
        },
        { requireUser: true }
    )
    .patch(
        "/color/:id",
        async ({ body, status, params: { id }, user }) => {
            const { color } = body;

            const category = await prisma.category.findFirst({
                where: {
                    id: Number(id),
                    userId: user.id
                }
            })
            if (!category) {
                return status(400, "Category does not exist")
            }

            const categoryWithNewColor = await prisma.category.update({
                where: {
                    id: Number(id)
                },
                data: {
                    color
                }
            })
            return categoryWithNewColor
        },
        {
            body: t.Object(
                {
                    color: t.String()
                }
            ),
            requireUser: true
        }
    )
