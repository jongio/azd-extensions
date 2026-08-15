/**
 * Canonical extension list: single source of truth for all JS registry scripts.
 *
 * PowerShell scripts (install-all.ps1, watch-all.ps1, uninstall-all.ps1) maintain
 * their own lists with PS-specific fields (local paths, colors). Keep them in sync
 * manually. Each PS1 file has a comment pointing back here.
 *
 * UI showcase data lives in src/data/extensions.ts (taglines, features, icons).
 *
 * The jongio.azd pack is in this list but deliberately not in the PowerShell
 * scripts or the UI showcase. Those scripts run `mage build` and `azd x build`
 * against a sibling source repo, and the pack has neither source nor a binary.
 * The showcase presents products; the pack is an install convenience for the
 * three products already there, not a fourth one.
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
  {
    // The extension pack. Unlike the three above it has no source repo of its
    // own, because it has no code: it is a dependency list and nothing else.
    // It lives here, in the registry repo, so it is versioned alongside the
    // registry that serves it rather than bolted onto a library release.
    id: 'jongio.azd',
    repo: 'azd-extensions',
    sourcePath: 'pack/registry.json',
  },
];

/** Convenience: just the remote registry URLs, for scripts that only need to fetch. */
export const EXTENSION_SOURCE_URLS = EXTENSIONS.filter((e) => e.sourceUrl).map(
  (e) => e.sourceUrl
);

/** Repo-relative paths for sources that live in this repo rather than upstream. */
export const EXTENSION_SOURCE_PATHS = EXTENSIONS.filter((e) => e.sourcePath).map(
  (e) => e.sourcePath
);
