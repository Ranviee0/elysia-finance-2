import { Elysia } from "elysia";
import { html, Html } from "@elysia/html";
import { Layout } from "@/components/Layout";
import { CategoryTable } from "@/components/CategoryTable";
import { CategoryList } from "@/components/CategoryList";
import { refreshCategories } from "@/components/htmx";
import type { CategoryView } from "@/components/types";
import { apiBase } from "@/config";
import { auth } from "@/auth";
import { forwardCookie } from "@/internalFetch";

const fetchCategories = async (request: Request) => {
  const res = await fetch(`${apiBase}/categories`, { headers: forwardCookie(request) });
  const { categories } = (await res.json()) as { categories: CategoryView[] };
  return categories;
};

const CategoriesContent = ({ categories }: { categories: CategoryView[] }) => (
  <div id="categories-content" class="card bg-base-100 shadow-md">
    <div class="card-body p-0">
      <div class="flex items-center justify-between gap-2 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <h1 class="card-title text-lg sm:text-xl">Categories</h1>
        <div class="flex items-center gap-3">
          <span id="categories-loading" class="htmx-indicator loading loading-spinner loading-sm"></span>
          <span class="text-sm text-base-content/60">{categories.length} entries</span>
          <button type="button" class="btn btn-primary sm:btn-sm" onclick="add_category_modal.showModal()">
            + Add<span class="hidden sm:inline"> Category</span>
          </button>
        </div>
      </div>
      <p id="category_error" class="text-error text-sm px-4 sm:px-6 pb-4 hidden"></p>
      <CategoryTable categories={categories} />
      <CategoryList categories={categories} />
    </div>
  </div>
);

export const categoryPage = new Elysia()
  .use(html())
  .use(auth)
  .get("/fragments/categories", async ({ request }) => {
    const categories = await fetchCategories(request);
    return <CategoriesContent categories={categories} />;
  }, { requirePage: true })
  .get("/category", async ({ request, user }) => {
    const categories = await fetchCategories(request);

    return (
      <Layout title="Categories" currentPath="/category" user={user}>
        <CategoriesContent categories={categories} />

        <dialog id="add_category_modal" class="modal modal-bottom sm:modal-middle">
          <div class="modal-box">
            <h3 class="font-bold text-lg">Add Category</h3>
            <form
              id="add-category-form"
              class="mt-4 flex flex-col gap-4"
              hx-post="/categories"
              hx-swap="none"
              hx-indicator="#categories-loading"
              {...{
                "hx-on::after-request": `if (event.detail.successful) { add_category_modal.close(); this.reset(); add_category_error.classList.add('hidden'); ${refreshCategories}; } else { add_category_error.textContent = 'Failed to create category'; add_category_error.classList.remove('hidden'); }`,
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
          <form method="dialog" class="modal-backdrop" hx-boost="false">
            <button>close</button>
          </form>
        </dialog>
      </Layout>
    );
  }, { requirePage: true });
