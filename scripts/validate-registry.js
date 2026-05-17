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
 * Flags:
 *  --offline  Skip all URL reachability checks (useful for CI without network)
 *
 * Uses only Node.js built-in modules — no npm dependencies.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { batchHeadRequests } from './lib/http.js';
import {
  validateSemverOrder,
  validatePlatforms,
  validateChecksums,
  validateAllVersions,
} from './lib/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REGISTRY_PATH = resolve(__dirname, '..', 'public', 'registry.json');
const offlineMode = process.argv.includes('--offline');

// ── Result helpers ───────────────────────────────────────────────────────────

/**
 * Print a batch of { passed, message } results and append them to the
 * accumulator array. No global state — the caller owns the array.
 *
 * @param {{ passed: boolean, message: string }[]} batch
 * @param {{ passed: boolean, message: string }[]} accumulator
 */
function collectResults(batch, accumulator) {
  for (const r of batch) {
    console.log(r.passed ? `  \u2705 PASS: ${r.message}` : `  \u274c FAIL: ${r.message}`);
    accumulator.push(r);
  }
}

// ── URL collection ───────────────────────────────────────────────────────────

/**
 * Collect all URLs that need reachability checks for an extension.
 * Returns de-duplicated entries: each unique URL appears once, tagged with
 * extension/version/platform metadata for reporting.
 *
 * @param {string} extId
 * @param {{ version: string, artifacts?: Record<string, { url?: string }> }[]} versions
 * @returns {{ url: string, label: string }[]}
 */
function collectUrlChecks(extId, versions) {
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {{ url: string, label: string }[]} */
  const checks = [];

  for (const ver of versions) {
    const artifacts = ver.artifacts || {};
    for (const [platform, artifact] of Object.entries(artifacts)) {
      const url = artifact.url;
      if (!url) continue;
      if (!url.startsWith('https://')) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      checks.push({ url, label: `[${extId}@${ver.version}] ${platform}` });
    }
  }

  return checks;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nValidating registry: ${REGISTRY_PATH}\n`);

  if (offlineMode) {
    console.log('(offline mode - skipping URL reachability checks)\n');
  }

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
    `\u2139\uFE0F  Note: windows/arm64 is optional - not all extensions provide it yet.\n`,
  );

  /** @type {{ passed: boolean, message: string }[]} */
  const allResults = [];

  /** @type {{ url: string, label: string }[]} */
  let allUrlChecks = [];

  for (const ext of extensions) {
    const extId = ext.id || '(unknown)';
    console.log(`-- ${extId} --`);

    const versions = ext.versions || [];
    if (versions.length === 0) {
      collectResults(
        [{ passed: false, message: `[${extId}] No versions defined` }],
        allResults,
      );
      console.log();
      continue;
    }

    const latestVersion = versions[versions.length - 1];

    // 1. Semver order
    collectResults(validateSemverOrder(extId, versions), allResults);

    // 2. All versions basic validity
    collectResults(validateAllVersions(extId, versions), allResults);

    // 3. Required platforms (latest)
    collectResults(validatePlatforms(extId, latestVersion), allResults);

    // 4. Checksums (latest)
    collectResults(validateChecksums(extId, latestVersion), allResults);

    // 5. Collect URLs for batch reachability check (de-duplicated)
    if (!offlineMode) {
      const checks = collectUrlChecks(extId, versions);
      allUrlChecks = allUrlChecks.concat(checks);
    }

    console.log();
  }

  // 6. Batch URL reachability (concurrent, de-duplicated across all extensions)
  if (!offlineMode && allUrlChecks.length > 0) {
    console.log(
      `-- URL reachability (${allUrlChecks.length} unique URLs) --`,
    );

    const statusMap = await batchHeadRequests(allUrlChecks);

    /** @type {{ passed: boolean, message: string }[]} */
    const urlResults = [];
    for (const check of allUrlChecks) {
      const status = statusMap.get(check.url) || 0;
      if (status === 200) {
        urlResults.push({
          passed: true,
          message: `${check.label}: URL reachable`,
        });
      } else {
        urlResults.push({
          passed: false,
          message: `${check.label}: URL returned ${status} - ${check.url}`,
        });
      }
    }

    collectResults(urlResults, allResults);
    console.log();
  }

  // Summary
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;

  console.log('\u2550'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('\u2550'.repeat(50));

  process.exit(failed > 0 ? 1 : 0);
}

main();
