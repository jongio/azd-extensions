# AZD Extensions Redesign

## Summary

- Redesign the azd-extensions marketing/registry site with a shared design language aligned to the /web sites in azd-exec and azd-app.
- Establish reusable tokens, layout patterns, and components so all sites feel related while respecting each product’s content.
- Preserve dynamic registry + extension listing but present it with the new visual system (azure-forward, dark-mode-ready, performant).

## Goals

- Unify branding across azd-exec, azd-app, and azd-extensions: typography, color system, spacing, surfaces, shadows, and motion.
- Ship a reusable design system layer: tokens (colors, typography, radii, shadows), primitives (buttons, badges, cards, terminal/code blocks), and page scaffolds (hero, feature rows, list grids, footer).
- Keep the current azd-extensions functionality: registry-backed extension cards, install commands, examples, and repo links.
- Dark mode parity using the data-theme toggle model used in azd-exec (/web) with semantic tokens.
- Performance: ship lean bundles, image optimization, and Lighthouse-friendly defaults.

## Non-Goals

- Changing registry update mechanics or CI (already working).
- Rewriting extension data model.
- Introducing new backend services.

## Design Language (align with azd-exec /web and azd-app /web)

- **Color system**: Azure blues (50-900) as primary; neutrals for surfaces; success/warning/error/info states; accent gradients allowed but subtle. Use the semantic token layering from azd-exec global.css (bg-primary/secondary/tertiary, text-primary/secondary, border-default/focus, interactive-default/hover/active) with dark overrides.
- **Typography**: Sans = Inter (or project standard) with tight leading; Mono = JetBrains Mono for code/terminal. Heading scale shared across sites (H1 36-40, H2 28-32, H3 22-24, body 16/14).
- **Surfaces & depth**: Cards with soft radii (8-12px), light borders, and subtle shadows; elevated elements on hover. Use consistent spacing grid (4/8/12/16/24/32).
- **Components to standardize**:
  - Header with product switcher slot (links to azd-exec, azd-app, azd-extensions), GitHub button, theme toggle.
  - Hero: left-aligned copy + call-to-action; secondary link to docs; optional code/terminal preview panel.
  - Extension cards: shared card shell, repo link, tags, install command, example commands (with correct azd exec param order), badges for capabilities, optional release chip.
  - Terminal/Code blocks: dark background, copy button, filename/command label; reuse token structure from azd-exec.
  - Feature rows: icon + copy + “learn more”; grid on desktop, stack on mobile.
  - Footer: shared links (Docs, GitHub, Privacy if needed), attribution line.
  - Badges/Chips: secondary style; align with azd-exec badge token.
- **Motion**: Use short ease-out transitions for hover/focus; no excessive parallax. Prefer staggered reveals for lists (extensions grid) but keep performant.
- **Dark mode**: Token-driven. Respect data-theme="dark"; ensure code/terminal remain dark in both modes.
- **Illustrations/imagery**: Prefer lightweight geometric shapes or subtle gradients; avoid heavy hero images.

## Pages / Sections

- **Home** (landing): Hero, key value props (registry + consistency), extension grid, “How it works” (enable alpha, add source, install), CTA to GitHub.
- **Extensions** (single page or anchored section): grid of extensions sourced from registry.json with capability tags and examples.
- **Docs link-outs**: Buttons to azd-exec and azd-app docs; optional “All extensions” link.
- **Status/updates**: Small strip linking to latest release or changelog PRs (optional).

## Content Requirements

- Examples for azd-exec must place params before the command (e.g., `azd exec --shell pwsh ./deploy.ps1`).
- Keep install snippets: `azd extension source add ...` and `azd extension install <id>`.
- Alpha notice: concise, align with existing wording; include enable flag command.

## Accessibility & Quality

- WCAG AA: color contrast on cards, buttons, links, focus-visible outlines.
- Keyboard: tab order, skip-to-content, focus rings consistent with tokens.
- RTL-safe spacing and alignment where reasonable.
- Tests: component-level (hero, card, header, footer), a11y smoke (axe), snapshot for tokens.

## Performance

- Target Lighthouse 90+ (Performance/Access/Best Practices/SEO) on desktop and mobile.
- Image optimization (Astro/Vite asset pipeline), tree-shaken icons (lucide subset), minimal JS for static sections.

## Tech Stack Alignment

- Stay with current stack (Vite/React for azd-extensions) but mirror styling primitives from azd-exec (/web) Tailwind v4 token approach.
- Expose tokens in a shared file so future sharing with azd-app is possible (design-tokens.ts or CSS variables).

## Deliverables

- New design token set and theme (light/dark) mirroring azd-exec web tokens.
- Updated page layouts (hero, extension grid, how-to, footer) using the common components.
- Refreshed copy and examples respecting azd exec param order.
- Tests (unit + basic a11y) and build passing.

## Risks / Open Questions

- Need confirmation of azd-app web palette/typography deltas to harmonize (if differing from azd-exec). Use current azd-exec tokens as baseline.
- Icon set alignment: prefer lucide subset; confirm if azd-app uses a different set.

## Acceptance Criteria

- Visual alignment: hero/header/footer/cards share the same tokenized design system as azd-exec web; dark mode works.
- Extension grid renders from live registry.json with updated examples (param-before-command for azd exec).
- Tests (lint, type-check, unit) and build succeed.
- Docs updated (README) to describe design system and local dev commands.
