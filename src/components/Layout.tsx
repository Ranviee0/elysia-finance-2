import { Html } from "@elysia/html";

const links = [
  { href: "/", label: "Transactions" },
  { href: "/analytics", label: "Analytics" },
  { href: "/category", label: "Categories" },
  /* The page carries both import and export now, so the tab can't be "Export"
     without hiding half of what's there. */
  { href: "/export", label: "Data" },
];

const TransactionsIcon = () => (
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
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h10.5"
    />
  </svg>
);

const CategoriesIcon = () => (
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
      d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);

const AnalyticsIcon = () => (
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
      d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
    />
    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
  </svg>
);

const ExportIcon = () => (
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
      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

const AccountIcon = () => (
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
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const SunIcon = () => (
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
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-3.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
    />
  </svg>
);

const MoonIcon = () => (
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
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
    />
  </svg>
);

/* Rendered checked to match the dark default, so the icon is right for the
   common case before theme.js gets to the body; it unticks this only for
   someone who has explicitly chosen light. It shows up logged out as well,
   because the login screen is a full page of theme too. */
const ThemeToggle = () => (
  <label class="swap swap-rotate btn btn-ghost btn-sm btn-circle" aria-label="Toggle dark mode">
    <input type="checkbox" data-theme-toggle checked onchange="toggleTheme(this)" />
    <span class="swap-on">
      <MoonIcon />
    </span>
    <span class="swap-off">
      <SunIcon />
    </span>
  </label>
);

/* Log out is a POST so that a prefetch or a stray <img src> can't end a
   session, which is why these are submit buttons rather than links.
   The form sits outside the menu and the buttons reach it by id: daisyUI
   styles `li > *` as the row, so wrapping each button in its own form would
   hand the padding and the hover highlight to the form while leaving the
   button itself only as wide as its text — a row that lights up edge to edge
   but only responds to clicks that land on the glyphs. */
const AccountMenu = ({ username }: { username: string }) => (
  <details class="dropdown dropdown-end">
    <summary class="btn btn-ghost btn-sm">
      <AccountIcon />
      <span class="max-w-24 truncate">{username}</span>
    </summary>
    <form id="logout-form" method="post" action="/auth/logout" hx-boost="false" class="hidden"></form>
    <ul class="dropdown-content menu bg-base-100 rounded-box z-30 w-52 p-2 shadow-md">
      <li>
        <a href="/account">Change password</a>
      </li>
      {/* Switching accounts is logging out and back in, so it posts to the
          same route — it's here as a separate entry because that's the verb
          people look for. */}
      <li>
        <button type="submit" form="logout-form">
          Switch user
        </button>
      </li>
      <li>
        <button type="submit" form="logout-form" class="text-error">
          Log out
        </button>
      </li>
    </ul>
  </details>
);

export const Layout = ({
  title,
  currentPath,
  user,
  wide,
  children,
}: {
  title: string;
  currentPath: string;
  user?: { username: string } | null;
  /* Opts a page out of the app's usual max-w-4xl reading column — for a
     spreadsheet-style page that needs the extra room on desktop. */
  wide?: boolean;
  children?: any;
}) => (
  /* No data-theme here: theme.js sets it from the stored preference before
     the first paint, and its absence is what lets the OS preference decide. */
  <html lang="en">
    <head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      {/* Dark to match the default; theme.js rewrites it if light is chosen. */}
      <meta name="theme-color" content="#1d232a" />
      <link rel="stylesheet" href="/public/tailwind.css" />
      {/* Deliberately not deferred — it has to run before the page paints. */}
      <script src="/public/theme.js"></script>
      <script src="/vendor/htmx/htmx.min.js"></script>
      <script src="/public/app.js" defer></script>
    </head>
    <body class="min-h-screen bg-base-200 pb-24 sm:pb-10" hx-boost="true">
      <header class="navbar bg-base-100 shadow-sm sticky top-0 z-20">
        <div class="flex-1">
          <a href="/" class="px-2 text-lg font-semibold">
            Finance
          </a>
        </div>
        {user ? (
          <nav role="tablist" class="tabs tabs-box hidden sm:flex">
            {links.map((link) => (
              <a
                role="tab"
                href={link.href}
                class={`tab ${currentPath === link.href ? "tab-active" : ""}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
        <div class="ml-2">
          <ThemeToggle />
        </div>
        {user ? (
          <div class="ml-1">
            <AccountMenu username={user.username} />
          </div>
        ) : null}
      </header>
      <main class="flex justify-center p-2 sm:p-6">
        <div class={`w-full ${wide ? "max-w-6xl" : "max-w-4xl"}`}>{children}</div>
      </main>
      <dialog id="confirm_dialog" class="modal modal-bottom sm:modal-middle">
        <div class="modal-box">
          <h3 class="font-bold text-lg">Are you sure?</h3>
          <p id="confirm_dialog_message" class="py-4"></p>
          <div class="modal-action">
            <button type="button" class="btn" onclick="confirm_dialog.close()">
              Cancel
            </button>
            <button id="confirm_dialog_ok" type="button" class="btn btn-error">
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop" hx-boost="false">
          <button>close</button>
        </form>
      </dialog>
      <nav class={`dock bg-base-100 sm:hidden z-20 ${user ? "" : "hidden"}`}>
        <a href="/" class={currentPath === "/" ? "dock-active" : ""}>
          <TransactionsIcon />
          <span class="dock-label">Transactions</span>
        </a>
        <a href="/analytics" class={currentPath === "/analytics" ? "dock-active" : ""}>
          <AnalyticsIcon />
          <span class="dock-label">Analytics</span>
        </a>
        <a href="/category" class={currentPath === "/category" ? "dock-active" : ""}>
          <CategoriesIcon />
          <span class="dock-label">Categories</span>
        </a>
        {/* Account isn't here: the header dropdown shows at every width, and a
            fifth dock item squeezes the labels to nothing on a phone. */}
        <a href="/export" class={currentPath === "/export" ? "dock-active" : ""}>
          <ExportIcon />
          <span class="dock-label">Data</span>
        </a>
      </nav>
    </body>
  </html>
);
