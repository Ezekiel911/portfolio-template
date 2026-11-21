// Filter project cards without removing them from the document.
const projectCards = [...document.querySelectorAll(".project-card")];
const projectFilterStatus = document.querySelector("#project-filter-status");
const projectModal = document.querySelector("#project-modal");
const projectModalTitle = document.querySelector("#modal-title");
const projectModalDescription = document.querySelector("#modal-description");
const projectModalCategories = document.querySelector("#modal-categories");
const projectModalTools = document.querySelector("#modal-tools");
const projectModalGallery = document.querySelector("#modal-gallery");
const projectModalScreenshots = document.querySelector("#modal-screenshots");
const projectModalClose = document.querySelector("#modal-close");
const screenshotViewer = document.querySelector("#screenshot-viewer");
const screenshotViewerImage = document.querySelector("#screenshot-viewer-image");
const screenshotViewerTitle = document.querySelector("#screenshot-viewer-title");
const screenshotViewerCaption = document.querySelector("#screenshot-viewer-caption");
const screenshotViewerClose = document.querySelector("#screenshot-viewer-close");
const categoryLabels = { web: "Web", mobile: "Mobile" };
let projectModalTrigger = null;
let screenshotViewerTrigger = null;
function requestPortfolioUiSound() {
  document.dispatchEvent(new CustomEvent("portfolio-ui-sound", { detail: "project" }));
}

function syncModalCursorState() { // Keep the custom cursor above whichever native dialog is topmost.
  const activeDialog = screenshotViewer.open ? screenshotViewer : projectModal.open ? projectModal : null; // Prefer the screenshot viewer when both dialogs are stacked.
  document.documentElement.classList.toggle("modal-open", Boolean(activeDialog)); // Apply dialog cursor rules only while a native dialog is open.
  const cursorElements = document.querySelectorAll(".custom-cursor-dot, .custom-cursor-ring"); // Reuse the existing animated cursor nodes.
  (activeDialog || document.body).append(...cursorElements); // Put them in the top layer or restore them to their original parent.
} // Reuse this synchronization from every dialog open and close path.

function closeModal(dialog) { // Close a dialog and update cursor state before the deferred close event.
  dialog.close(); // Use the native close path so focus restoration remains unchanged.
  syncModalCursorState(); // Restore the native cursor immediately after the open state changes.
  requestPortfolioUiSound();
} // The close event remains the fallback for closes not initiated here.

const createBadge = (label) => {
  const badge = document.createElement("li");
  badge.className = "rounded-full border border-line bg-raised px-3 py-1.5 text-sm font-semibold text-text dark:border-line dark:bg-glass-highlight/5 dark:text-text";
  badge.textContent = label;
  return badge;
};

const renderProjectScreenshots = (card) => {
  const screenshots = [...card.querySelectorAll("[data-project-screenshot]")];
  projectModalScreenshots.replaceChildren(
    ...screenshots.map((screenshot) => {
      const figure = document.createElement("figure");
      figure.className = `min-w-0 rounded-xl bg-raised p-3 dark:bg-page${screenshot.dataset.screenshotLayout === "mobile" ? " flex flex-col items-center" : ""}`;

      const image = screenshot.querySelector("img").cloneNode();
      image.className = screenshot.dataset.screenshotLayout === "mobile"
        ? "mx-auto max-h-[min(65dvh,34rem)] w-auto max-w-full rounded-lg object-contain"
        : "aspect-video w-full rounded-lg object-contain";
      image.loading = "eager";
      image.alt = "";

      const captionText = screenshot.querySelector("figcaption").textContent.trim();
      const imageButton = document.createElement("button");
      imageButton.type = "button";
      imageButton.className = "group block w-full cursor-zoom-in rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
      imageButton.setAttribute("aria-label", `View full-size ${captionText} screenshot`);
      imageButton.dataset.fullImage = screenshot.querySelector("img").src;
      imageButton.dataset.fullImageAlt = screenshot.querySelector("img").alt;
      imageButton.dataset.fullImageCaption = captionText;
      imageButton.append(image);
      figure.append(imageButton);

      const caption = document.createElement("figcaption");
      caption.className = "mt-2 text-center text-sm font-semibold text-text dark:text-copy";
      caption.textContent = captionText;
      figure.append(caption);

      return figure;
    }),
  );
  projectModalGallery.hidden = screenshots.length === 0;
};

document.querySelectorAll("[data-project-details]").forEach((detailsButton) => {
  detailsButton.addEventListener("click", () => {
    const card = detailsButton.closest(".project-card");
    const categories = card.dataset.category.split(/\s+/);
    const tools = [...card.querySelectorAll('ul[aria-label] li')].map((tool) => tool.textContent.trim());

    projectModalTitle.textContent = card.querySelector("h3").textContent.trim();
    projectModalDescription.textContent = card.querySelector("h3 + p").textContent.trim();
    projectModalCategories.replaceChildren(...categories.map((category) => createBadge(categoryLabels[category] || category)));
    projectModalTools.replaceChildren(...tools.map(createBadge));
    renderProjectScreenshots(card);
    projectModalTrigger = detailsButton;
    projectModal.showModal();
    syncModalCursorState(); // Restore the native cursor over this top-layer dialog.
    requestPortfolioUiSound();
  });
});

projectModalClose.addEventListener("click", () => closeModal(projectModal));
projectModalScreenshots.addEventListener("click", (event) => {
  const imageButton = event.target.closest("button[data-full-image]");
  if (!imageButton) return;

  screenshotViewerImage.src = imageButton.dataset.fullImage;
  screenshotViewerImage.alt = imageButton.dataset.fullImageAlt;
  screenshotViewerTitle.textContent = imageButton.dataset.fullImageCaption;
  screenshotViewerCaption.textContent = imageButton.dataset.fullImageCaption;
  screenshotViewerTrigger = imageButton;
  screenshotViewer.showModal();
  syncModalCursorState(); // Keep the native cursor while the screenshot dialog is stacked above project details.
  requestPortfolioUiSound();
});
screenshotViewerClose.addEventListener("click", () => closeModal(screenshotViewer));
screenshotViewer.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && screenshotViewer.open) {
    event.preventDefault();
    event.stopPropagation();
    closeModal(screenshotViewer);
  }
});
screenshotViewer.addEventListener("click", (event) => {
  if (event.target === screenshotViewer) closeModal(screenshotViewer);
});
screenshotViewer.addEventListener("close", () => {
  syncModalCursorState(); // Retain the cursor override if project details are still open.
  screenshotViewerTrigger?.focus();
  screenshotViewerTrigger = null;
});
projectModal.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && projectModal.open) {
    event.preventDefault();
    event.stopPropagation();
    closeModal(projectModal);
  }
});
projectModal.addEventListener("click", (event) => {
  if (event.target === projectModal) closeModal(projectModal);
});
projectModal.addEventListener("close", () => {
  syncModalCursorState(); // Remove the override only after every native dialog has closed.
  projectModalTrigger?.focus();
  projectModalTrigger = null;
});

document.addEventListener("click", (event) => { // Route modal-link dismissal through the native close event.
  if (!(event.target instanceof Element)) return; // Ignore non-element click targets.
  const link = event.target.closest("a[href]"); // Detect a link before it navigates.
  const dialog = link?.closest("dialog[open]"); // Find the open dialog that owns that link.
  if (dialog instanceof HTMLDialogElement) closeModal(dialog); // Let its close listener restore cursor state and focus.
}); // Keep link navigation behavior unchanged after closing the dialog.

window.addEventListener("popstate", () => { // Let browser Back dismiss the topmost native dialog.
  if (screenshotViewer.open) closeModal(screenshotViewer); // Close the screenshot viewer before its parent dialog.
  else if (projectModal.open) closeModal(projectModal); // Close project details when it is the only open dialog.
}); // Native close listeners handle cursor and focus cleanup for Back as well.

document.querySelectorAll(".project-filter").forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    const category = filterButton.dataset.filterCategory;
    const filterChanged = filterButton.getAttribute("aria-pressed") !== "true";
    let visibleCount = 0;

    document.querySelectorAll(".project-filter").forEach((button) => {
      button.setAttribute("aria-pressed", String(button === filterButton));
    });
    projectCards.forEach((card) => {
      const categories = card.dataset.category.split(/\s+/);
      card.hidden = category !== "all" && !categories.includes(category);
      if (!card.hidden) visibleCount += 1;
    });

    const label = category === "all" ? "all categories" : `${category} projects`;
    projectFilterStatus.textContent = `${visibleCount} ${label} shown.`;
    if (filterChanged) requestPortfolioUiSound();
  });
});
