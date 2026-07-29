import { Html } from "@elysia/html";
import type { CategoryView } from "./types";
import { refreshCategories } from "./htmx";

export const CategoryTable = ({ categories }: { categories: CategoryView[] }) => (
  <div class="hidden md:block overflow-x-auto">
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
                hx-indicator="#categories-loading"
                {...{
                  "hx-on::after-request": `if (event.detail.successful) { ${refreshCategories}; } else { category_delete_error.textContent = event.detail.xhr.responseText || 'Failed to delete category'; category_delete_error.classList.remove('hidden'); }`,
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
);
