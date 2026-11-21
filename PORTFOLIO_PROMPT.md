# Portfolio Customization Prompt

Use this prompt for a developer portfolio built from this repository:

> Customize the existing static portfolio only from verified public information supplied by the repository owner or the user. Never invent or infer a name, surname, age, location, education, employer, certificate, score, metric, testimonial, repository, outcome, or project fact.
>
> Before editing, inspect `index.html`, `js/main.js`, `js/projects.js`, `js/status.js`, `README.md`, `PORTFOLIO_SETUP_PROMPT.md`, `PORTFOLIO_PROMPT.md`, `PRODUCT.md`, and the image assets. Preserve the privacy-safe starter whenever facts are missing: use `Your Name`, a neutral initials monogram, and visible project placeholders. Remove any control with no real destination. Never publish direct email addresses, phone numbers, postal addresses, private accounts, personal photos, biometric data, government IDs, analytics identifiers, tokens, or hidden personal metadata.
>
> Preserve the committed **Terminal** visual direction: near-black, green-tinted surfaces; Martian Mono; one phosphor-green signal; square surfaces and controls; hairline rules; restrained depth; and an intentionally monospaced typographic hierarchy. Do not introduce a generic SaaS dashboard, glowing blob, CRT animation, fake terminal, stock illustration, decorative browser frame, gradient text, logo wall, or invented project screenshot.
>
> The portfolio is an Experience surface. The artifact and real project evidence lead; interface chrome remains quiet. Keep a settled or staged hero rather than a decorative intro. At `1280 x 800`, the headline, supporting sentence, both actions, and focal visual must be visible without scrolling. Limit the headline to seven words and the supporting sentence to twelve words. Every complete section must provide useful content, not decoration.
>
> Keep this information architecture:
>
> 1. **Hero** — identity, role or discipline, one clear project/work action, and a real approved visual or neutral monogram.
> 2. **Selected work** — the strongest approved project first, followed by the remaining projects in a filterable index.
> 3. **About** — a concise first-person summary and one verified career goal.
> 4. **Skills** — technologies and people skills supported by projects, coursework, or direct experience.
> 5. **Journey** — short factual education or experience rows; clearly distinguish earned facts from plans.
> 6. **Contact** — only deliberately approved public destinations and actions.
>
> Do not add an eyebrow, tracked-caps label, pill, decorative status dot, middle-dot meta string, glued arrow, fake metric, testimonial, fake availability panel, card inside a card, or placeholder screenshot presented as real work. Do not replace factual content with marketing claims.
>
> Preserve project filters, project dialogs, full-size screenshots, mobile navigation, theme switching, native keyboard behavior, reduced-motion support, and the no-JavaScript baseline. Keep HTML and body at `overflow-x: clip`, preserve capped containers, and use `minmax(0, 1fr)` for image and project tracks.
>
> Use Tailwind utilities for existing behavior and project-specific values at `:root` and `.dark`. Do not hard-code framework-default custom colors or expose literal Tailwind palette names in the design tokens. Reuse spacing and type scale consistently; provide visible instant `:focus-visible` styling for every interactive element.
>
> Before completion:
>
> - Run the static site through a local server.
> - Inspect `320`, `768`, `1280`, and `1920` px widths and verify the `1280 x 800` hero.
> - Test keyboard navigation, skip link, mobile menu, both themes, filters, dialogs, focus trapping and return, full-size screenshots, and links.
> - Check console output, failed requests, missing assets, reduced motion, no-JavaScript behavior, and the no-JavaScript project baseline.
> - Verify that every visible placeholder, unresolved identity, and missing public destination is intentional and report each one explicitly.
> - Update setup and deployment documentation for every changed customization step.
