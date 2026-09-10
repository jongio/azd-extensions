#!/usr/bin/env node

/**
 * Aggregates registry.json from extension source repositories into a single registry.
 * Each extension repo (azd-exec, azd-app) maintains its own registry.json with proper
 * versioning and multi-platform artifacts. This script fetches and merges them.
 */

import { readFileSync, writeFileSync } from 'fs';
import { compareSemver } from './lib/semver.js';
import { headRequest, batchHeadRequests } from './lib/http.js';
import { isAllowedArtifactUrl, isExtensionPackVersion } from './lib/validate.js';
import {
  ALLOWED_HASH_ALGORITHMS,
  MIN_REQUIRED_PLATFORMS,
} from './lib/constants.js';
import { EXTENSION_SOURCE_URLS, EXTENSION_SOURCE_PATHS } from './lib/extensions.js';

const REGISTRY_FILE = 'public/registry.json';

/**
 * Fetch registry JSON from a URL.
 * Enforces a 5 MB size limit to prevent DoS from oversized responses.
 */
async function fetchRegistry(url) {
  console.log(`Fetching ${url}...`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }

  const MAX_REGISTRY_SIZE = 5 * 1024 * 1024; // 5 MB
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_REGISTRY_SIZE) {
    throw new Error(`Registry at ${url} exceeds maximum size of ${MAX_REGISTRY_SIZE} bytes`);
  }

  const text = await response.text();
  if (text.length > MAX_REGISTRY_SIZE) {
    throw new Error(`Registry at ${url} exceeds maximum size of ${MAX_REGISTRY_SIZE} bytes`);
  }

  return JSON.parse(text);
}

/**
 * Read a registry JSON file that lives in this repo.
 *
 * Repo-relative and resolved against the repo root rather than the caller's
 * working directory, so this behaves the same from a package script, from CI,
 * and from a shell in any subdirectory.
 */
function readLocalRegistry(relativePath) {
  const fullPath = new URL(`../${relativePath}`, import.meta.url);
  console.log(`Reading ${relativePath}...`);
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

/**
 * Main function - aggregates all source registries into one
 */
async function main() {
  try {
    const aggregatedRegistry = {
      extensions: [],
    };

    // Fetch all remote source registries concurrently (#53), then append the
    // sources that live in this repo. A local source has no release to fetch
    // because it has no binaries: the extension pack is a dependency list, so
    // its registry entry is authored here rather than published from a repo.
    const remoteSources = EXTENSION_SOURCE_URLS;
    const localSources = EXTENSION_SOURCE_PATHS;
    const sourceLabels = [...remoteSources, ...localSources];

    const fetchResults = [
      ...(await Promise.allSettled(remoteSources.map((url) => fetchRegistry(url)))),
      ...localSources.map((path) => {
        try {
          return { status: 'fulfilled', value: readLocalRegistry(path) };
        } catch (error) {
          return { status: 'rejected', reason: error };
        }
      }),
    ];

    for (let i = 0; i < fetchResults.length; i++) {
      const result = fetchResults[i];
      if (result.status === 'rejected') {
        console.error(`Failed to load ${sourceLabels[i]}: ${result.reason?.message ?? result.reason}`);
        continue;
      }

      const sourceRegistry = result.value;
      if (!sourceRegistry.extensions || !Array.isArray(sourceRegistry.extensions)) {
        continue;
      }

      for (const extension of sourceRegistry.extensions) {
        const existingIndex = aggregatedRegistry.extensions.findIndex(
          (e) => e.id === extension.id
        );

        if (existingIndex === -1) {
          aggregatedRegistry.extensions.push(extension);
          console.log(`Added extension: ${extension.id}`);
        } else {
          // Merge versions from duplicate sources (#60)
          const existing = aggregatedRegistry.extensions[existingIndex];
          const existingVersions = new Set(
            (existing.versions || []).map((v) => v.version)
          );
          const incoming = (extension.versions || []).filter(
            (v) => !existingVersions.has(v.version)
          );
          if (incoming.length > 0) {
            existing.versions = [...(existing.versions || []), ...incoming];
            console.log(
              `Merged ${extension.id}: added ${incoming.length} new version(s) from ${sourceLabels[i]}`
            );
          } else {
            console.log(`Extension ${extension.id} already exists, no new versions to merge`);
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

    // Filter out broken versions (missing required platforms, zero checksums)
    for (const ext of aggregatedRegistry.extensions) {
      if (!ext.versions) continue;
      const before = ext.versions.length;
      ext.versions = ext.versions.filter((ver) => {
        // Extension packs carry dependencies instead of artifacts. Every check
        // below inspects artifacts, so without this a pack is dropped for
        // "missing required platforms" and disappears from the published
        // registry with nothing but a log line to say so.
        if (isExtensionPackVersion(ver)) {
          return true;
        }
        const artifacts = ver.artifacts || {};
        const platforms = Object.keys(artifacts);
        // Must have all required platforms
        if (!MIN_REQUIRED_PLATFORMS.every((p) => platforms.includes(p))) {
          console.log(`  ⚠ Dropping ${ext.id}@${ver.version}: missing required platforms`);
          return false;
        }
        // All artifact URLs must be valid HTTPS URLs from allowed domains
        for (const [, artifact] of Object.entries(artifacts)) {
          if (!artifact.url || !artifact.url.startsWith('https://')) {
            console.log(`  ⚠ Dropping ${ext.id}@${ver.version}: non-HTTPS or missing artifact URL`);
            return false;
          }
          if (!isAllowedArtifactUrl(artifact.url)) {
            console.log(`  ⚠ Dropping ${ext.id}@${ver.version}: artifact URL from disallowed domain (${artifact.url})`);
            return false;
          }
        }
        // Must not have zero/placeholder checksums or weak hash algorithms
        for (const [, artifact] of Object.entries(artifacts)) {
          const value = artifact.checksum?.value || '';
          if (/^0+$/.test(value)) {
            console.log(`  ⚠ Dropping ${ext.id}@${ver.version}: placeholder checksum`);
            return false;
          }
          const algorithm = (artifact.checksum?.algorithm || '').toLowerCase();
          if (algorithm && !ALLOWED_HASH_ALGORITHMS.includes(algorithm)) {
            console.log(`  ⚠ Dropping ${ext.id}@${ver.version}: weak checksum algorithm "${algorithm}"`);
            return false;
          }
        }
        return true;
      });
      if (ext.versions.length < before) {
        console.log(`  Filtered ${ext.id}: ${before} → ${ext.versions.length} versions`);
      }
    }

    // Filter out versions with unreachable artifact URLs using batch requests (#63)
    for (const ext of aggregatedRegistry.extensions) {
      if (!ext.versions) continue;
      const before = ext.versions.length;

      // Build a list of { version, url } to check: one representative URL per version
      const checks = ext.versions.map((ver) => {
        const artifacts = ver.artifacts || {};
        const checkPlatform = artifacts['windows/amd64']
          ? 'windows/amd64'
          : Object.keys(artifacts)[0];
        return { version: ver, url: artifacts[checkPlatform]?.url };
      }).filter((c) => c.url);

      const statusMap = await batchHeadRequests(checks);

      ext.versions = ext.versions.filter((ver) => {
        const artifacts = ver.artifacts || {};
        const checkPlatform = artifacts['windows/amd64']
          ? 'windows/amd64'
          : Object.keys(artifacts)[0];
        const url = artifacts[checkPlatform]?.url;
        if (!url) return true; // no URL to check, so keep
        const status = statusMap.get(url);
        if (status !== 200) {
          console.log(
            `  ⚠ Dropping ${ext.id}@${ver.version}: artifact URL returned ${status} - ${url}`
          );
          return false;
        }
        return true;
      });

      if (ext.versions.length < before) {
        console.log(`  URL-filtered ${ext.id}: ${before} -> ${ext.versions.length} versions`);
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

    process.exitCode = 0;
  } catch (error) {
    console.error('Error updating registry:', error.message);
    process.exitCode = 1;
  }
}

main();
