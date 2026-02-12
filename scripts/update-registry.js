#!/usr/bin/env node

/**
 * Aggregates registry.json from extension source repositories into a single registry.
 * Each extension repo (azd-exec, azd-app) maintains its own registry.json with proper
 * versioning and multi-platform artifacts. This script fetches and merges them.
 */

import { writeFileSync } from 'fs';

const REGISTRY_FILE = 'public/registry.json';

/**
 * Compare two semver strings (major.minor.patch) for sorting ascending.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// Extension source registries to aggregate
const EXTENSION_SOURCES = [
  'https://raw.githubusercontent.com/jongio/azd-app/refs/heads/main/registry.json',
  'https://raw.githubusercontent.com/jongio/azd-copilot/refs/heads/main/registry.json',
  'https://raw.githubusercontent.com/jongio/azd-exec/refs/heads/main/registry.json',
];

/**
 * Fetch registry JSON from a URL
 */
async function fetchRegistry(url) {
  console.log(`Fetching ${url}...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Main function - aggregates all source registries into one
 */
async function main() {
  try {
    const aggregatedRegistry = {
      extensions: [],
    };

    // Fetch and merge each source registry
    for (const sourceUrl of EXTENSION_SOURCES) {
      const sourceRegistry = await fetchRegistry(sourceUrl);

      if (sourceRegistry.extensions && Array.isArray(sourceRegistry.extensions)) {
        for (const extension of sourceRegistry.extensions) {
          // Check if extension already exists (by id)
          const existingIndex = aggregatedRegistry.extensions.findIndex(
            (e) => e.id === extension.id
          );

          if (existingIndex === -1) {
            // Add new extension
            aggregatedRegistry.extensions.push(extension);
            console.log(`Added extension: ${extension.id}`);
          } else {
            // Replace with newer version if applicable
            console.log(`Extension ${extension.id} already exists, keeping existing`);
          }
        }
      }
    }

    // Sort each extension's versions ascending so the last element is the latest
    for (const ext of aggregatedRegistry.extensions) {
      if (ext.versions && Array.isArray(ext.versions)) {
        ext.versions.sort((a, b) => compareSemver(a.version, b.version));
      }
    }

    // Write aggregated registry
    console.log(`\nWriting ${REGISTRY_FILE}...`);
    writeFileSync(REGISTRY_FILE, JSON.stringify(aggregatedRegistry, null, 2) + '\n', 'utf8');
    console.log(
      `Registry updated successfully with ${aggregatedRegistry.extensions.length} extensions!`
    );

    // Log summary
    console.log('\nExtensions in registry:');
    for (const ext of aggregatedRegistry.extensions) {
      const latestVersion = ext.versions?.[ext.versions.length - 1]?.version || 'unknown';
      console.log(`  - ${ext.id} (latest: ${latestVersion})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error updating registry:', error.message);
    process.exit(1);
  }
}

main();
