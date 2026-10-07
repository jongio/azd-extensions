# Extension thumbnail prompts

The `azd-extensions` hub and each active extension own a committed 1024x1024
PNG thumbnail. The hub also keeps an optimized WebP copy for catalog cards.

This follows the `jongio/skills` thumbnail contract:

- Azure OpenAI `gpt-image-2` generates the canonical PNG;
- the exact prompt is committed verbatim;
- non-secret endpoint, model, API version, quality, prompt digest, and image
  digest provenance are recorded;
- repository and website copies are byte-identical;
- every PNG is validated as 1024x1024; and
- the catalog keeps a separately optimized WebP copy.

## Generation settings

| Setting              | Value                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| Provider             | Azure OpenAI                                                                     |
| Deployment and model | `gpt-image-2`                                                                    |
| API version          | `2025-04-01-preview`                                                             |
| Size                 | `1024x1024`                                                                      |
| Quality              | `high`                                                                           |
| Authentication       | Keyless Azure CLI token for `https://cognitiveservices.azure.com`                |
| Response             | Original `data[0].b64_json` PNG bytes retained under `assets/thumbnail-sources/` |
| Display post-process | Sharp 16-color indexed PNG, no dithering; optimized WebP copy                    |

## Generate

With the four repositories checked out as siblings:

```powershell
cd E:\code\azd\extensions\azd-extensions
$env:AZURE_OPENAI_ENDPOINT = "https://<resource>.openai.azure.com"
pnpm thumbnails:generate
```

The generator writes:

- `thumbnail.png` and `thumbnail.json` in each repository;
- `web/public/thumbnail.png` in each extension repository;
- `public/images/thumb-<product>.png` and `.webp` in the hub; and
- `thumbnail-manifest.json` in the hub.

Run `pnpm thumbnails:sync` to rebuild WebP copies and synchronize the already
accepted PNGs without making additional billed image-generation calls.

The original Azure PNG is kept as non-public provenance. Display thumbnails use
a fixed 16-color palette with dithering disabled so model-generated shading
cannot reintroduce gradients into the catalog or extension sites.

## Shared house style

Every prompt includes this exact shared style block:

> Technical schematic thumbnail for a developer tool on a pure white background, exactly 1024x1024. Orthographic 2D vector diagram with precise dark-slate linework, solid color fills, restrained 4 to 8 pixel corner radii, and no drop shadows. Use one dominant left-to-right operational flow with compact spacing and clear system boundaries. Place one small black GitHub Octocat mark in the upper-right with a short direct tether to the output. Use exactly one green completion mark at the final output and no other check marks. No words, no letters, no numerals, no fake text, no logos other than the small Octocat, no photorealism, no 3D render, no browser chrome, no traffic-light dots, no charts, no metric panels, no decorative sparkles, no floating cards, no wandering dashed lines, no gradients, no blur, no clutter.

## Design direction

- **Domain:** developer tools.
- **Direction:** compact technical schematics, not marketing illustrations.
- **Memorable element:** each product is identified by its real operational flow.
- **Intentionality:** app shows service orchestration, rest shows an authentication
  boundary, promote shows a release chain, and the hub shows registry
  aggregation.

## azd-extensions

> Create a square thumbnail for the Azure Developer CLI extension collection. Technical schematic thumbnail for a developer tool on a pure white background, exactly 1024x1024. Orthographic 2D vector diagram with precise dark-slate linework, solid color fills, restrained 4 to 8 pixel corner radii, and no drop shadows. Use one dominant left-to-right operational flow with compact spacing and clear system boundaries. Place one small black GitHub Octocat mark in the upper-right with a short direct tether to the output. Use exactly one green completion mark at the final output and no other check marks. No words, no letters, no numerals, no fake text, no logos other than the small Octocat, no photorealism, no 3D render, no browser chrome, no traffic-light dots, no charts, no metric panels, no decorative sparkles, no floating cards, no wandering dashed lines, no gradients, no blur, no clutter. Show three compact source modules on the left: a cyan play-and-service topology symbol, an amber request-and-shield symbol, and a violet three-stage promotion chain. Three straight connectors converge into one dark registry ledger on the right containing three aligned package entries. Use one final green completion mark beside the registry ledger. Use cyan, amber, violet, emerald, slate, and charcoal as solid spot colors.

## azd-app

> Create a square thumbnail for the azd app local development orchestrator. Technical schematic thumbnail for a developer tool on a pure white background, exactly 1024x1024. Orthographic 2D vector diagram with precise dark-slate linework, solid color fills, restrained 4 to 8 pixel corner radii, and no drop shadows. Use one dominant left-to-right operational flow with compact spacing and clear system boundaries. Place one small black GitHub Octocat mark in the upper-right with a short direct tether to the output. Use exactly one green completion mark at the final output and no other check marks. No words, no letters, no numerals, no fake text, no logos other than the small Octocat, no photorealism, no 3D render, no browser chrome, no traffic-light dots, no charts, no metric panels, no decorative sparkles, no floating cards, no wandering dashed lines, no gradients, no blur, no clutter. Show three service nodes on the left: a cyan network service node with port connectors, a green API or function process, and an amber database cylinder. The cyan service must be a simple server or network node, not a browser, web page, window, or screen, and there must be no circular traffic-light dots anywhere. Straight dependency lines feed into one compact orchestrator console on the right with three aligned service rows, port indicators, and one terminal log strip. Use one final green completion mark on the orchestrator output. The image must communicate one command coordinating service startup, dependencies, health, and logs without showing charts or decorative metrics. Use cyan, blue, service green, dependency amber, slate, and charcoal as solid spot colors.

## azd-rest

> Create a square thumbnail for the azd rest authenticated API extension. Technical schematic thumbnail for a developer tool on a pure white background, exactly 1024x1024. Orthographic 2D vector diagram with precise dark-slate linework, solid color fills, restrained 4 to 8 pixel corner radii, and no drop shadows. Use one dominant left-to-right operational flow with compact spacing and clear system boundaries. Place one small black GitHub Octocat mark in the upper-right with a short direct tether to the output. Use exactly one green completion mark at the final output and no other check marks. No words, no letters, no numerals, no fake text, no logos other than the small Octocat, no photorealism, no 3D render, no browser chrome, no traffic-light dots, no charts, no metric panels, no decorative sparkles, no floating cards, no wandering dashed lines, no gradients, no blur, no clutter. Show one amber HTTP request document on the left with abstract method, header, and body lines. A straight connector crosses one blue authentication boundary with a keyhole, continues through one plain cyan endpoint cloud, and ends at one dark structured response document on the right. Show small functional symbols for token, retry, and scope below the main flow, connected with one straight baseline. Use one final green completion mark beside the response document. The image must communicate authentication, scope selection, HTTP transport, retry, and structured output without showing a dashboard. The cloud must be a plain cloud shape with no Azure triangle, Microsoft mark, platform logo, or letterform inside it. Use request amber, security blue, cyan, response violet and green, slate, and charcoal as solid spot colors.

## azd-promote

> Create a square thumbnail for the azd promote deterministic environment promotion extension. Technical schematic thumbnail for a developer tool on a pure white background, exactly 1024x1024. Orthographic 2D vector diagram with precise dark-slate linework, solid color fills, restrained 4 to 8 pixel corner radii, and no drop shadows. Use one dominant left-to-right operational flow with compact spacing and clear system boundaries. Place one small black GitHub Octocat mark in the upper-right with a short direct tether to the output. Use exactly one green completion mark at the final output and no other check marks. No words, no letters, no numerals, no fake text, no logos other than the small Octocat, no photorealism, no 3D render, no browser chrome, no traffic-light dots, no charts, no metric panels, no decorative sparkles, no floating cards, no wandering dashed lines, no gradients, no blur, no clutter. Show one sealed artifact package entering a horizontal three-stage pipeline made of rectangular environment boundaries: cyan development, violet staging, and emerald production. Connect the stages with straight arrows. Place one amber approval gate between staging and production, one small lock on each environment boundary, and one compact verification ledger beneath the pipeline. Use one final green completion mark after production. The image must communicate one exact candidate advancing through approvals, locks, verification evidence, and resumable durable state without showing fake metrics. Use cyan, violet, emerald, amber, slate, and charcoal as solid spot colors.
