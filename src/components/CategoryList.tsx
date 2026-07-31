import { Html } from "@elysia/html";
import type { CategoryView } from "./types";
import { refreshCategories } from "./htmx";
import { CategoryColorPicker } from "./CategoryColorPicker";
import { CategoryTypePicker } from "./CategoryTypePicker";

export const CategoryList = ({ categories }: { categories: CategoryView[] }) => (
  <ul class="list md:hidden">
    {categories.map((category) => (
      <li class="list-row items-center">
        <CategoryColorPicker category={category} size="w-10 h-10" />
        <div class="list-col-grow min-w-0">
          <div class="truncate">{category.name}</div>
          <div class="text-xs text-base-content/60 font-mono">
            id: {category.id} · <span data-color-label={String(category.id)}>{category.color}</span>
          </div>
          {/* Its own line rather than beside the delete button: at this width
              the two together push the name into truncating. */}
          <div class="mt-1.5">
            <CategoryTypePicker category={category} size="xs" />
          </div>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-square text-error"
          aria-label="Delete category"
          hx-delete={`/categories/${category.id}`}
          hx-swap="none"
          hx-confirm="Delete this category?"
          hx-indicator="#categories-loading"
          {...{
            "hx-on::after-request": `if (event.detail.successful) { ${refreshCategories}; } else { category_error.textContent = event.detail.xhr.responseText || 'Failed to delete category'; category_error.classList.remove('hidden'); }`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.8"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </li>
    ))}
  </ul>
);
