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