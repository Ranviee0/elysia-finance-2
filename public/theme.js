/* Light/dark for the whole app. Loaded as a blocking script in <head> so the
   theme is on <html> before the first paint — deferring it would show a flash
   of the wrong theme on every navigation.

   Dark is the default and the OS preference is deliberately ignored: only an
   explicit choice stored here can turn the app light. */
(function () {
  var KEY = "theme";
  var DEFAULT = "dark";
  /* The base-100 of each daisyUI theme, so the browser chrome on mobile
     matches the header instead of standing out against the page. */
  var BAR_COLOR = { light: "#ffffff", dark: "#1d232a" };

  var resolve = function () {
    try {
      var value = localStorage.getItem(KEY);
      return value === "light" || value === "dark" ? value : DEFAULT;
    } catch (e) {
      /* Private mode and blocked storage both throw on access; the default
         is better than failing to theme at all. */
      return DEFAULT;
    }
  };

  var apply = function (theme) {
    document.documentElement.setAttribute("data-theme", theme);

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", BAR_COLOR[theme]);

    /* The toggle lives in the body, which does not exist yet on the first
       run and gets replaced on every boosted navigation — so its state is
       synced here and again on load rather than set once. */
    document.querySelectorAll("[data-theme-toggle]").forEach(function (input) {
      input.checked = theme === "dark";
    });
  };

  window.setTheme = function (theme) {
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {
      /* Unstorable preference still applies for this page. */
    }
    apply(theme);
  };

  window.toggleTheme = function (input) {
    window.setTheme(input.checked ? "dark" : "light");
  };

  apply(resolve());

  document.addEventListener("DOMContentLoaded", function () {
    apply(resolve());
  });
  /* htmx swaps the body on boosted navigation, so the new toggle arrives
     unchecked no matter what the theme is. */
  document.addEventListener("htmx:load", function () {
    apply(resolve());
  });
})();
