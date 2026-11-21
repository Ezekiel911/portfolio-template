# Portfolio Template Setup Prompt

Use this prompt to customize the template for a real person:

> Start with a privacy-safe portfolio template that uses static HTML, CSS utility classes, vanilla JavaScript, and native browser dialogs. First inspect `index.html`, `js/main.js`, `js/projects.js`, `README.md`, and `PRODUCT.md`. Do not replace or infer personal information until the user explicitly supplies it.
>
> Collect only approved public fields: first name or chosen name, optional neutral monogram, location level, education, skills, career goal, up to three verified projects, approved project screenshots, and intentionally selected public links. Never publish a surname without explicit approval. Never invent employers, certificates, metrics, testimonials, live integrations, repositories, or employment.
>
> Replace placeholder copy in-place. Do not publish phone numbers, postal addresses, private email, personal social profiles, government IDs, personal photos, or metadata embedded in screenshots. If the user provides a portrait, keep it outside the public repository until they approve it for publication.
>
> Preserve the existing polished visual system and behavior: responsive navigation, project filtering, project dialogs, screenshot viewer, theme switching, reduced-motion support, keyboard focus, contrast, and static hosting. Make each link resolve to a real destination or remove it. Do not add a backend or form that claims to send or store data.
>
> Before finishing, serve the site locally, verify desktop and mobile layouts, test keyboard interaction and both themes, inspect network and console errors, scan source and assets for private fields and secrets, and update README instructions. Then summarize exactly which placeholder fields remain unresolved.
