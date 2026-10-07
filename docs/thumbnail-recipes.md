# Extension thumbnail recipes

The `azd-extensions` hub and each active extension own a committed 1024x1024
PNG thumbnail. The hub also keeps an optimized WebP copy for catalog cards.

This follows the `jongio/skills` thumbnail contract:

- one canonical PNG per installable product;
- exact non-secret provenance and SHA-256 metadata;
- byte-identical repository and website copies;
- 1024x1024 dimension validation; and
- a catalog image optimized separately from the canonical PNG.

Unlike the skills catalog's model-generated artwork, these extension thumbnails
use deterministic SVG recipes rendered by Sharp. The diagrams are product
branding, so repeatable shapes and colors are more valuable than stochastic
illustration variation. No Azure credential, model deployment, or billed API
call is required.

Provenance metadata records provider `deterministic-svg`, model
`azd-extension-thumbnail-v1`, renderer `sharp@0.35.4`, the exact recipe link,
and the canonical PNG SHA-256 digest.

## Generate

With the four repositories checked out as siblings:

```powershell
cd E:\code\azd\extensions\azd-extensions
pnpm thumbnails:generate
```

The generator writes:

- `thumbnail.png` and `thumbnail.json` in each repository;
- `web/public/thumbnail.png` in each extension repository;
- `public/images/thumb-<product>.png` and `.webp` in the hub; and
- `thumbnail-manifest.json` in the hub.

## House style

- Pure white 1024x1024 canvas.
- One rounded browser or terminal hero surface.
- Flat vector diagrams with soft shadows and generous white space.
- A left-to-right transformation or operational flow.
- Green circular checks for successful state.
- A small GitHub Octocat mark with a dotted tether.
- No small explanatory text; the concept must read at card size.

## azd-extensions

Three extension product cards converge into a central registry terminal with a
verified status. Palette: cyan, amber, violet, and success green.

## azd-app

Three heterogeneous services converge into one health-aware local development
dashboard. Palette: Azure cyan and blue, service green, and dependency amber.

## azd-rest

A structured API request passes through authenticated protection into Azure and
returns a formatted response. Palette: request amber, authentication blue,
Azure cyan, and response green.

## azd-promote

A verified artifact advances through three guarded environments into a durable
successful run. Palette: development cyan, staging violet, production green,
and verification amber.
