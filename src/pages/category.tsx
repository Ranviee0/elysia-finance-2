import { Elysia } from "elysia";
import { html, Html } from "@elysia/html";

export const categoryPage = new Elysia()
  .use(html())
  .get("/category", async () => {
    const res = await fetch("http://localhost:3067/categories");
    const { categories } = (await res.json()) as {
      categories: {
        id: number;
        name: string;
        color: string;
      }[];
    };

    return (
      <html lang="en" data-theme="light">
        <head>
          <title>Categories</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="stylesheet" href="/public/tailwind.css" />
        </head>
        <body class="min-h-screen bg-base-200 flex justify-center p-2 sm:p-10">
          <div class="w-full max-w-4xl">
            <div class="card bg-base-100 shadow-md">
              <div class="card-body p-0">
                <div class="flex items-baseline justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                  <h1 class="card-title text-lg sm:text-xl">Categories</h1>
                  <span class="text-sm text-base-content/60">{categories.length} entries</span>
                </div>
                <div class="overflow-x-auto">
                  <table class="table table-zebra">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Color</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr class="row-hover">
                          <td class="text-base-content/40">{category.id}</td>
                          <td>{category.name}</td>
                          <td>
                            <span class="inline-flex items-center gap-2">
                              <span
                                class="inline-block w-4 h-4 rounded-full border border-base-content/20"
                                style={`background-color: ${category.color}`}
                              />
                              <span class="text-base-content/60 text-sm">{category.color}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  });
