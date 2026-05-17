#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { compareSemver } from './lib/semver.js';

const root = join(import.meta.dirname, '..');

const registryPath = join(root, 'public', 'registry.json');
const readmePath = join(root, 'README.md');

// Parse registry and extract latest version per extension repo name
let registry;
try {
  registry = JSON.parse(readFileSync(registryPath, 'utf8'));
} catch (err) {
  console.error(`Failed to read or parse ${registryPath}: ${err.message}`);
  process.exitCode = 1;
}

if (registry) {
  if (!registry.extensions || !Array.isArray(registry.extensions)) {
    console.error(`Invalid registry: "extensions" must be an array in ${registryPath}`);
    process.exitCode = 1;
  } else {
    const latestVersions = new Map();

    for (const ext of registry.extensions) {
      // jongio.azd.app -> azd-app, jongio.azd.exec -> azd-exec
      const parts = ext.id.split('.');
      const repoName = parts.slice(1).join('-');

      // Find highest version using shared semver comparison
      const latest = ext.versions
        .map((v) => v.version)
        .sort(compareSemver)
        .pop();

      if (latest) {
        latestVersions.set(repoName, latest);
      }
    }

    // Update README version numbers in the extensions table
    let readme;
    try {
      readme = readFileSync(readmePath, 'utf8');
    } catch (err) {
      console.error(`Failed to read ${readmePath}: ${err.message}`);
      process.exitCode = 1;
    }

    if (readme !== undefined) {
      let updated = readme;

      for (const [repoName, version] of latestVersions) {
        // Escape regex special characters in repoName to prevent injection,
        // then allow dash to also match dots (azd-app matches azd.app in table)
        const escapedName = repoName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[-.]');
        // Match table rows containing the repo name and update the version at the end.
        // Uses non-greedy quantifiers to prevent catastrophic backtracking (ReDoS).
        // Negative lookahead prevents substring matches (e.g. azd-app won't match azd-app-v2).
        const pattern = new RegExp(
          `(\\|[^|]*?${escapedName}(?![\\w.-])[^|]*?\\|[^|]*?\\|)\\s*v?[0-9]+\\.[0-9]+\\.[0-9]+\\s*(\\|)`,
          'g',
        );
        updated = updated.replace(pattern, `$1 v${version} $2`);
      }

      if (updated !== readme) {
        try {
          writeFileSync(readmePath, updated, 'utf8');
        } catch (err) {
          console.error(`Failed to write ${readmePath}: ${err.message}`);
          process.exitCode = 1;
        }
        console.log('README.md updated with latest versions:');
        for (const [repoName, version] of latestVersions) {
          console.log(`  ${repoName}: v${version}`);
        }
      } else {
        console.log('README.md versions are already up to date');
      }
    }
  }
}
