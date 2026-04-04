# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build:css   # Compile and minify Tailwind CSS
npm run watch:css   # Watch and rebuild CSS on changes
```

There are no test or lint commands — this is a static site.

## Architecture

This is a performance-optimized personal resume website at [mahanin.com](https://mahanin.com). It was migrated from Angular to plain HTML, reducing bundle size from ~800KB to ~50KB.

**Key design decisions:**
- All content lives in `index.html` — it is the only page
- Critical CSS is inlined in `<head>` to eliminate render-blocking; `styles/tailwind.css` and `styles.css` are loaded as stylesheets for non-critical styles
- Images are stored as WebP with PNG fallbacks in `assets/`
- No JavaScript framework — vanilla JS only (currently none)

**CSS flow:** Edit `src/input.css` → run `build:css` → `styles/tailwind.css` is regenerated. Custom non-Tailwind styles (media queries, `.resume-box`) live in `styles.css`.

**Tailwind config** (`tailwind.config.js`) scans `index.html` and all `.html` files for class names — no purge issues as long as classes appear in HTML files.
