# envaudit Documentation Website

## Overview

The documentation site lives in `website/` and is deployed to **GitHub Pages** at `https://albertoarena.github.io/envaudit/`.

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | [Astro](https://astro.build) | ^5.1.0 |
| Theme | [Starlight](https://starlight.astro.build) | ^0.32.0 |
| Image processing | [sharp](https://sharp.pixelplumbing.com) | ^0.33.0 |
| Node.js | Required | >= 20 |
| Deployment | GitHub Pages via GitHub Actions | - |

Starlight is Astro's official documentation theme. It provides sidebar navigation, dark mode, search, responsive layout, and MDX support out of the box.

## Directory Structure

```
website/
├── astro.config.mjs          # Astro + Starlight config (sidebar, site URL, social links)
├── package.json               # Website dependencies (separate from main project)
├── package-lock.json          # Lock file (required by CI)
├── .gitignore                 # Ignores node_modules/, dist/, .astro/
├── src/
│   ├── content.config.ts      # Astro content collection schema (standard Starlight boilerplate)
│   ├── styles/
│   │   └── custom.css         # Custom theme (green accent, typography, table styling)
│   └── content/
│       └── docs/
│           ├── index.mdx              # Homepage (splash template with hero + cards)
│           ├── getting-started/
│           │   ├── quickstart.mdx
│           │   ├── installation.mdx
│           │   ├── cli-options.mdx
│           │   └── ci-integration.mdx
│           ├── commands/
│           │   ├── check.mdx
│           │   ├── diff.mdx
│           │   ├── sync.mdx
│           │   └── doc.mdx
│           └── rules/
│               ├── missing.mdx
│               ├── undocumented.mdx
│               ├── empty-values.mdx
│               └── secrets.mdx
```

## Local Development

```bash
cd website
npm install
npm run dev
```

Opens at `http://localhost:4321/envaudit/`. Hot-reloads on file changes.

### Build locally

```bash
npm run build
npm run preview
```

## Deployment

Deployment is automatic via `.github/workflows/deploy-docs.yml`.

**Triggers:**
- Push to `main` that changes files in `website/` or the workflow file itself
- Manual trigger via `workflow_dispatch`

**Pipeline:**
1. Checkout repo
2. Install website dependencies (`npm ci` in `website/`)
3. Build static site (`npm run build` outputs to `website/dist/`)
4. Upload `website/dist/` as GitHub Pages artifact
5. Deploy to GitHub Pages

**GitHub repo settings required:**
- Go to Settings > Pages > Source: select **GitHub Actions**

## Adding a New Page

1. Create a `.mdx` file in the appropriate folder under `website/src/content/docs/`
2. Add frontmatter:
   ```mdx
   ---
   title: Page Title
   description: Brief description for SEO
   ---

   Content goes here...
   ```
3. Add the page to the sidebar in `website/astro.config.mjs`:
   ```js
   { label: 'Page Title', link: '/section/page-slug/' }
   ```
4. Commit and push — the site rebuilds automatically

## Editing the Sidebar

The sidebar is defined in `website/astro.config.mjs` under `starlight({ sidebar: [...] })`. Each section has a `label` and an `items` array of `{ label, link }` pairs. Links are relative to the base path (`/envaudit/`), but written without the base prefix in the config (Astro adds it automatically).

## Customising the Theme

### Accent colours

Edit `website/src/styles/custom.css`. The current theme uses a green accent:
- Light mode: `#2d8a4e`
- Dark mode: `#3dba6a`

### Adding a logo

1. Place SVG files in `website/src/assets/` (e.g. `logo-light.svg`, `logo-dark.svg`)
2. Add to `astro.config.mjs`:
   ```js
   logo: {
     light: './src/assets/logo-light.svg',
     dark: './src/assets/logo-dark.svg',
     replacesTitle: false,
   },
   ```

## Using MDX Components

Starlight provides built-in components you can use in `.mdx` files:

```mdx
import { Card, CardGrid, Tabs, TabItem } from '@astrojs/starlight/components';

<CardGrid>
  <Card title="Title" icon="rocket">
    Card content here.
  </Card>
</CardGrid>

<Tabs>
  <TabItem label="npm">npm install @albertoarena/envaudit</TabItem>
  <TabItem label="npx">npx @albertoarena/envaudit check</TabItem>
</Tabs>
```

Full component reference: https://starlight.astro.build/components/

## Updating Dependencies

```bash
cd website
npm update
npm install @astrojs/starlight@latest astro@latest
```

Test locally before committing the updated `package-lock.json`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CI fails on `npm ci` | Ensure `package-lock.json` is committed and up to date |
| 404 on GitHub Pages | Check Settings > Pages > Source is set to **GitHub Actions** |
| Broken links after adding pages | Ensure the page is added to the sidebar in `astro.config.mjs` |
| Styles not updating | Clear `.astro/` cache: `rm -rf .astro && npm run dev` |
