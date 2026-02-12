#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const registryPath = join(root, 'public', 'registry.json');
const readmePath = join(root, 'README.md');

// Parse registry and extract latest version per extension repo name
const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
const latestVersions = new Map();

for (const ext of registry.extensions) {
  // jongio.azd.app -> azd-app, jongio.azd.exec -> azd-exec
  const parts = ext.id.split('.');
  const repoName = parts.slice(1).join('-');

  // Find highest version using semver-style comparison
  const latest = ext.versions
    .map((v) => v.version)
    .sort((a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    })
    .pop();

  if (latest) {
    latestVersions.set(repoName, latest);
  }
}

// Update README version numbers in the extensions table
let readme = readFileSync(readmePath, 'utf8');
let updated = readme;

for (const [repoName, version] of latestVersions) {
  // Match table rows containing the repo name and update the version at the end
  const pattern = new RegExp(
    `(\\|[^|]*${repoName.replace(/-/g, '[-\\\\.]')}[^|]*\\|[^|]*\\|)\\s*v?[0-9]+\\.[0-9]+\\.[0-9]+\\s*(\\|)`,
    'g',
  );
  updated = updated.replace(pattern, `$1 v${version} $2`);
}

if (updated !== readme) {
  writeFileSync(readmePath, updated, 'utf8');
  console.log('README.md updated with latest versions:');
  for (const [repoName, version] of latestVersions) {
    console.log(`  ${repoName}: v${version}`);
  }
} else {
  console.log('README.md versions are already up to date');
}
