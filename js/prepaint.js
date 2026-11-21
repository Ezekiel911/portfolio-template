// Apply the saved appearance and intro eligibility before page styles paint.
try {
  const savedTheme = localStorage.getItem("theme");
  document.documentElement.classList.toggle("dark", savedTheme !== "light");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", savedTheme === "light" ? "#F4F7FA" : "#0B1220");
} catch (error) {
  document.documentElement.classList.add("dark");
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", "#0B1220");
  console.warn("Theme preference is unavailable; using dark mode.", error);
}

function setPortfolioIntroPrepaintState() {
  const root = document.documentElement;
  root.classList.add("js");
  const navigationEntry = performance.getEntriesByType("navigation")[0];
  const isReload = navigationEntry?.type === "reload";
  const reloadHasFragment = isReload && Boolean(location.hash);

  if (reloadHasFragment) {
    history.scrollRestoration = "manual";
    history.replaceState(history.state, "", `${location.pathname}${location.search}`);
    root.classList.add("intro-reload-top");
    window.scrollTo(0, 0);
    document.addEventListener("DOMContentLoaded", () => window.scrollTo(0, 0), { once: true });
  }

  const shouldSkip =
    (!isReload && Boolean(location.hash)) ||
    navigationEntry?.type === "back_forward" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (shouldSkip) {
    root.classList.add("intro-done");
    return;
  }

  try {
    if (!isReload && sessionStorage.getItem("portfolio-intro-seen") === "true") {
      root.classList.add("intro-done");
      return;
    }
    sessionStorage.setItem("portfolio-intro-seen", "true");
  } catch (error) {
    root.classList.add("intro-done");
    console.warn("Portfolio intro skipped because session storage is unavailable.", error);
    return;
  }

  root.classList.add("intro-pending");
}

setPortfolioIntroPrepaintState();
