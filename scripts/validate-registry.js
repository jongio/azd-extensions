#!/usr/bin/env node

/**
 * Validates the aggregated registry at public/registry.json.
 *
 * Checks performed for each extension:
 *  1. Versions are in ascending semver order
 *  2. Latest version has artifacts for all required platforms
 *  3. Artifact URLs return HTTP 200 (follows redirects)
 *  4. Each artifact has a checksum with algorithm and value
 *
 * Uses only Node.js built-in modules — no npm dependencies.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { headRequest } from './lib/http.js';
import {
  validateSemverOrder as validateSemverOrderPure,
  validatePlatforms as validatePlatformsPure,
  validateChecksums as validateChecksumsPure,
  validateAllVersions as validateAllVersionsPure,
} from './lib/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REGISTRY_PATH = resolve(__dirname, '..', 'public', 'registry.json');

// ── Validation logic ─────────────────────────────────────────────────────────

const results = { passed: 0, failed: 0 };

function pass(msg) {
  results.passed++;
  console.log(`  ✅ PASS: ${msg}`);
}

function fail(msg) {
  results.failed++;
  console.error(`  ❌ FAIL: ${msg}`);
}

// ── Validation wrappers ──────────────────────────────────────────────────────
// Wrap pure validation functions from lib/validate.js to integrate with
// the pass/fail result tracking used by this script.

function applyResults(pureResults) {
  for (const r of pureResults) {
    if (r.passed) {
      pass(r.message);
    } else {
      fail(r.message);
    }
  }
}

function validateSemverOrder(extId, versions) {
  applyResults(validateSemverOrderPure(extId, versions));
}

function validatePlatforms(extId, latestVersion) {
  applyResults(validatePlatformsPure(extId, latestVersion));
}

function validateChecksums(extId, latestVersion) {
  applyResults(validateChecksumsPure(extId, latestVersion));
}

function validateAllVersions(extId, versions) {
  applyResults(validateAllVersionsPure(extId, versions));
}

async function validateAllUrls(extId, versions) {
  for (const ver of versions) {
    const artifacts = ver.artifacts || {};
    // Check one representative URL per version
    const checkPlatform = artifacts['windows/amd64']
      ? 'windows/amd64'
      : Object.keys(artifacts)[0];
    const url = artifacts[checkPlatform]?.url;
    if (!url) continue;
    const status = await headRequest(url);
    if (status === 200) {
      pass(`[${extId}@${ver.version}] ${checkPlatform}: URL reachable`);
    } else {
      fail(
        `[${extId}@${ver.version}] ${checkPlatform}: URL returned ${status} - ${url}`,
      );
    }
  }
}

async function validateUrls(extId, latestVersion) {
  const artifacts = latestVersion.artifacts || {};
  for (const [platform, artifact] of Object.entries(artifacts)) {
    const url = artifact.url;
    if (!url) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: missing URL`);
      continue;
    }

    // Skip non-HTTP URLs (e.g. local file paths from CI builds)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: URL is not HTTP(S): ${url}`);
      continue;
    }

    const status = await headRequest(url);
    if (status === 200) {
      pass(`[${extId}@${latestVersion.version}] ${platform}: URL returned 200`);
    } else {
      fail(`[${extId}@${latestVersion.version}] ${platform}: URL returned ${status} - ${url}`);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nValidating registry: ${REGISTRY_PATH}\n`);

  let registry;
  try {
    const raw = readFileSync(REGISTRY_PATH, 'utf-8');
    registry = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read/parse registry: ${err.message}`);
    process.exit(1);
  }

  const extensions = registry.extensions || [];
  if (extensions.length === 0) {
    console.error('Registry contains no extensions.');
    process.exit(1);
  }

  console.log(`Found ${extensions.length} extension(s).\n`);
  console.log(
    `ℹ️  Note: windows/arm64 is optional — not all extensions provide it yet.\n`,
  );

  for (const ext of extensions) {
    const extId = ext.id || '(unknown)';
    console.log(`── ${extId} ──`);

    const versions = ext.versions || [];
    if (versions.length === 0) {
      fail(`[${extId}] No versions defined`);
      console.log();
      continue;
    }

    const latestVersion = versions[versions.length - 1];

    // 1. Semver order
    validateSemverOrder(extId, versions);

    // 2. All versions basic validity
    validateAllVersions(extId, versions);

    // 3. Required platforms (latest)
    validatePlatforms(extId, latestVersion);

    // 4. Checksums (latest)
    validateChecksums(extId, latestVersion);

    // 5. URL reachability (all versions, one platform each)
    await validateAllUrls(extId, versions);

    // 6. URL reachability (latest, all platforms)
    await validateUrls(extId, latestVersion);

    console.log();
  }

  // Summary
  console.log('═'.repeat(50));
  console.log(
    `Results: ${results.passed} passed, ${results.failed} failed`,
  );
  console.log('═'.repeat(50));

  process.exit(results.failed > 0 ? 1 : 0);
}

main();
