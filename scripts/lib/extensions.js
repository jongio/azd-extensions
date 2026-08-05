/**
 * Canonical extension list — single source of truth for all JS registry scripts.
 *
 * PowerShell scripts (install-all.ps1, watch-all.ps1, uninstall-all.ps1) maintain
 * their own lists with PS-specific fields (local paths, colors). Keep them in sync
 * manually — each PS1 file has a comment pointing back here.
 *
 * UI showcase data lives in src/data/extensions.ts (taglines, features, icons).
 */

export const EXTENSIONS = [
  {
    id: 'jongio.azd.app',
    repo: 'azd-app',
    sourceUrl:
      'https://raw.githubusercontent.com/jongio/azd-app/refs/heads/main/registry.json',
  },
  {
    id: 'jongio.azd.rest',
    repo: 'azd-rest',
    sourceUrl:
      'https://raw.githubusercontent.com/jongio/azd-rest/refs/heads/main/registry.json',
  },
];

/** Convenience: just the registry URLs, for scripts that only need to fetch. */
export const EXTENSION_SOURCE_URLS = EXTENSIONS.map((e) => e.sourceUrl);
