<!-- NEXT: 1 -->

# AZD Extensions Redesign Tasks

## In Progress

- None

## TODO

1. Baseline design system inputs from azd-exec /web (tokens, typography, spacing, components) and azd-app /web (palette/typography deltas); capture findings in spec and token plan.
2. Define shared design tokens (light/dark) for azd-extensions aligned to azd-exec (colors, typography, radii, shadows, spacing, motion) and exportable for future reuse.
3. Redesign azd-extensions pages (hero, extension grid, how-to/alpha notice, footer, header with product links) using the common components; ensure extension examples show params-before-command for azd exec.
4. Update content and examples (install steps, alpha notice) and refresh README to document design system and local dev commands.
5. Implement accessibility and visual tests (component unit tests + basic a11y smoke) and ensure lint/type-check/build/test all pass.
6. Define shared layout shells and primitives (header with product switcher + GitHub/theme toggle, hero scaffold, extension/feature grid, footer) as reusable components/styles for all sites; document composition guidance.
7. Prototype local shared package consumption via file/workspace reference (no publish) and demonstrate azd-extensions adoption of shared header/footer/layout; outline rollout steps for azd-exec/web and azd-app/web.

## Done

- None
