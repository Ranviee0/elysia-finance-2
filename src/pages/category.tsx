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
          <script src="/vendor/htmx/htmx.min.js"></script>
        </head>
        <body class="min-h-screen bg-base-200 flex justify-center p-2 sm:p-10">
          <div class="w-full max-w-4xl">
            <div class="card bg-base-100 shadow-md">
              <div class="card-body p-0">
                <div class="flex items-baseline justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
                  <h1 class="card-title text-lg sm:text-xl">Categories</h1>
                  <div class="flex items-center gap-3">
                    <span class="text-sm text-base-content/60">{categories.length} entries</span>
                    <button type="button" class="btn btn-primary btn-sm" onclick="add_category_modal.showModal()">
                      + Add Category
                    </button>
                  </div>
                </div>
                <p id="category_delete_error" class="text-error text-sm px-4 sm:px-6 pb-4 hidden"></p>
                <div class="overflow-x-auto">
                  <table class="table table-zebra">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Color</th>
                        <th></th>
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
                          <td class="text-right">
                            <button
                              type="button"
                              class="btn btn-ghost btn-xs text-error"
                              hx-delete={`/categories/${category.id}`}
                              hx-swap="none"
                              hx-confirm="Delete this category?"
                              {...{
                                "hx-on::after-request":
                                  "if (event.detail.successful) { location.reload(); } else { category_delete_error.textContent = event.detail.xhr.responseText || 'Failed to delete category'; category_delete_error.classList.remove('hidden'); }",
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <dialog id="add_category_modal" class="modal">
            <div class="modal-box">
              <h3 class="font-bold text-lg">Add Category</h3>
              <form
                id="add-category-form"
                class="mt-4 flex flex-col gap-4"
                hx-post="/categories"
                hx-swap="none"
                {...{
                  "hx-on::after-request":
                    "if (event.detail.successful) { add_category_modal.close(); location.reload(); } else { add_category_error.textContent = 'Failed to create category'; add_category_error.classList.remove('hidden'); }",
                }}
              >
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Name</legend>
                  <input type="text" name="name" required class="input w-full" placeholder="e.g. Groceries" />
                </fieldset>
                <fieldset class="fieldset">
                  <legend class="fieldset-legend">Color</legend>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      name="color"
                      required
                      class="w-10 h-10 rounded-md border border-base-content/20 p-0.5 shrink-0"
                      value="#6366f1"
                      oninput="category_color_hex.value = this.value"
                    />
                    <input id="category_color_hex" type="text" class="input w-full font-mono" value="#6366f1" disabled />
                  </div>
                </fieldset>
                <p id="add_category_error" class="text-error text-sm hidden"></p>
                <div class="modal-action">
                  <button type="button" class="btn" onclick="add_category_modal.close()">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            </div>
            <form method="dialog" class="modal-backdrop">
              <button>close</button>
            </form>
          </dialog>
        </body>
      </html>
    );
  });
