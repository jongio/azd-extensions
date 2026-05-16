#!/usr/bin/env node

/**
 * Aggregates registry.json from extension source repositories into a single registry.
 * Each extension repo (azd-exec, azd-app) maintains its own registry.json with proper
 * versioning and multi-platform artifacts. This script fetches and merges them.
 */

import { writeFileSync } from 'fs';
import { compareSemver } from './lib/semver.js';
import { headRequest } from './lib/http.js';
import {
  MIN_REQUIRED_PLATFORMS,
  ALLOWED_ARTIFACT_HOST,
  ALLOWED_HASH_ALGORITHMS,
} from './lib/constants.js';

const REGISTRY_FILE = 'public/registry.json';

// Extension source registries to aggregate
const EXTENSION_SOURCES = [
  'https://raw.githubusercontent.com/jongio/azd-app/refs/heads/main/registry.json',
  'https://raw.githubusercontent.com/jongio/azd-copilot/refs/heads/main/registry.json',
  'https://raw.githubusercontent.com/jongio/azd-exec/refs/heads/main/registry.json',
  'https://raw.githubusercontent.com/jongio/azd-rest/refs/heads/main/registry.json',
];

/**
 * Validate that an artifact URL points to an allowed domain.
 * Prevents a compromised upstream registry from redirecting downloads
 * to attacker-controlled infrastructure.
 */
function isAllowedArtifactUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith(ALLOWED_ARTIFACT_HOST);
  } catch {
    return false;
  }
}

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

    // Filter out broken versions (missing required platforms, zero checksums)
    for (const ext of aggregatedRegistry.extensions) {
      if (!ext.versions) continue;
      const before = ext.versions.length;
      ext.versions = ext.versions.filter((ver) => {
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
            console.log(`  ⚠ Dropping ${ext.id}@${ver.version}: artifact URL from disallowed domain — ${artifact.url}`);
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

    // Filter out versions with unreachable artifact URLs (404, deleted releases)
    for (const ext of aggregatedRegistry.extensions) {
      if (!ext.versions) continue;
      const before = ext.versions.length;
      const kept = [];
      for (const ver of ext.versions) {
        const artifacts = ver.artifacts || {};
        // Check one representative URL per version (windows/amd64 or first available)
        const checkPlatform = artifacts['windows/amd64']
          ? 'windows/amd64'
          : Object.keys(artifacts)[0];
        const url = artifacts[checkPlatform]?.url;
        if (url) {
          const status = await headRequest(url);
          if (status !== 200) {
            console.log(
              `  ⚠ Dropping ${ext.id}@${ver.version}: artifact URL returned ${status} — ${url}`
            );
            continue;
          }
        }
        kept.push(ver);
      }
      ext.versions = kept;
      if (ext.versions.length < before) {
        console.log(`  URL-filtered ${ext.id}: ${before} → ${ext.versions.length} versions`);
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
