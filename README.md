# Skill Tree

A responsive React app for exploring a skill tree from infancy through age ten. The first track is the male foundation track, but the data model is intentionally broad because early skills overlap heavily across boys and girls.

## What is in this version

- 54 initial skill nodes
- 6 age stages from birth to age 10
- 9 domains: body, care, language, reasoning, social, practical life, safety, creativity, and character
- Prerequisite and unlock links for each node
- Search, stage filters, domain filters, and a selected-skill detail panel
- Mobile, tablet, and desktop layouts
- GitHub Pages deployment workflow

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## GitHub Pages

The workflow at `.github/workflows/deploy.yml` builds the app and publishes `dist` to GitHub Pages on every push to `main`.

In the GitHub repository settings, set Pages to use **GitHub Actions** as the source.

## Editing the tree

The hierarchy lives in `src/data/skillTree.ts`. Add or update nodes there, then use each node's `prerequisites` array to connect it to earlier skills.
