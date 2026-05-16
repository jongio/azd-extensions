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
 * Uses only Node.js built-in APIs — no npm dependencies.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { compareSemver } from './lib/semver.js';

const REGISTRY_PATH = resolve(import.meta.dirname, '..', 'public', 'registry.json');

const REQUIRED_PLATFORMS = [
  'windows/amd64',
  'darwin/amd64',
  'darwin/arm64',
  'linux/amd64',
  'linux/arm64',
];

// Allowed hostname for artifact download URLs
const ALLOWED_ARTIFACT_HOST = 'github.com';

// Acceptable checksum algorithms (reject weak hashes like MD5, SHA1)
const ALLOWED_HASH_ALGORITHMS = ['sha256', 'sha384', 'sha512'];

const URL_TIMEOUT_MS = 10_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * HEAD request using native fetch. Returns HTTP status code.
 * Validates that the initial URL is HTTPS and that the final URL
 * after redirects is still HTTPS to prevent downgrade attacks.
 * Rejects on error / timeout.
 */
async function headRequest(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error(`Refusing non-HTTPS URL: ${url}`);
  }
  const response = await fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    signal: AbortSignal.timeout(URL_TIMEOUT_MS),
  });
  if (response.url && !response.url.startsWith('https://')) {
    throw new Error(`Redirect to non-HTTPS URL: ${response.url}`);
  }
  return response.status;
}

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

function validateSemverOrder(extId, versions) {
  const versionStrings = versions.map((v) => v.version);
  for (let i = 1; i < versionStrings.length; i++) {
    if (compareSemver(versionStrings[i - 1], versionStrings[i]) >= 0) {
      fail(
        `[${extId}] Versions not in ascending semver order: ` +
          `${versionStrings[i - 1]} should come before ${versionStrings[i]}`,
      );
      return;
    }
  }
  pass(`[${extId}] Versions are in ascending semver order`);
}

function validatePlatforms(extId, latestVersion) {
  const artifacts = latestVersion.artifacts || {};
  const platforms = Object.keys(artifacts);

  for (const platform of REQUIRED_PLATFORMS) {
    if (platforms.includes(platform)) {
      pass(`[${extId}@${latestVersion.version}] Has required platform: ${platform}`);
    } else {
      fail(`[${extId}@${latestVersion.version}] Missing required platform: ${platform}`);
    }
  }
}

function validateChecksums(extId, latestVersion) {
  const artifacts = latestVersion.artifacts || {};
  for (const [platform, artifact] of Object.entries(artifacts)) {
    const checksum = artifact.checksum;
    if (!checksum) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: missing checksum`);
    } else if (!checksum.algorithm) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: checksum missing algorithm`);
    } else if (!ALLOWED_HASH_ALGORITHMS.includes(checksum.algorithm.toLowerCase())) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: weak checksum algorithm "${checksum.algorithm}" (allowed: ${ALLOWED_HASH_ALGORITHMS.join(', ')})`);
    } else if (!checksum.value) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: checksum missing value`);
    } else if (/^0+$/.test(checksum.value)) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: placeholder checksum (all zeros)`);
    } else {
      pass(`[${extId}@${latestVersion.version}] ${platform}: checksum OK (${checksum.algorithm})`);
    }
  }
}

function validateAllVersions(extId, versions) {
  for (const ver of versions) {
    const artifacts = ver.artifacts || {};
    const platforms = Object.keys(artifacts);
    // Every version must have at least windows/amd64, darwin/amd64, linux/amd64
    const minPlatforms = ['windows/amd64', 'darwin/amd64', 'linux/amd64'];
    for (const p of minPlatforms) {
      if (!platforms.includes(p)) {
        fail(`[${extId}@${ver.version}] Missing platform ${p} — will break installs on that OS`);
      }
    }
    for (const [platform, artifact] of Object.entries(artifacts)) {
      if (!artifact.url || !artifact.url.startsWith('https://')) {
        fail(
          `[${extId}@${ver.version}] ${platform}: non-HTTPS or missing URL — ${artifact.url || '(none)'}`
        );
      } else {
        try {
          const parsed = new URL(artifact.url);
          if (!parsed.hostname.endsWith(ALLOWED_ARTIFACT_HOST)) {
            fail(
              `[${extId}@${ver.version}] ${platform}: URL from disallowed domain — ${artifact.url}`
            );
          }
        } catch {
          fail(`[${extId}@${ver.version}] ${platform}: malformed URL — ${artifact.url}`);
        }
      }
      const value = artifact.checksum?.value || '';
      if (/^0+$/.test(value)) {
        fail(`[${extId}@${ver.version}] ${platform}: placeholder checksum (all zeros)`);
      }
    }
  }
  pass(`[${extId}] All ${versions.length} version(s) have valid platforms, URLs, and checksums`);
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
    try {
      const status = await headRequest(url);
      if (status === 200) {
        pass(`[${extId}@${ver.version}] ${checkPlatform}: URL reachable`);
      } else {
        fail(
          `[${extId}@${ver.version}] ${checkPlatform}: URL returned ${status} — ${url}`,
        );
      }
    } catch (err) {
      fail(
        `[${extId}@${ver.version}] ${checkPlatform}: URL error — ${err.message}`,
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

    try {
      const status = await headRequest(url);
      if (status === 200) {
        pass(`[${extId}@${latestVersion.version}] ${platform}: URL returned 200`);
      } else {
        fail(`[${extId}@${latestVersion.version}] ${platform}: URL returned ${status} — ${url}`);
      }
    } catch (err) {
      fail(`[${extId}@${latestVersion.version}] ${platform}: URL error — ${err.message}`);
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
    process.exitCode = 1;
    return;
  }

  const extensions = registry.extensions || [];
  if (extensions.length === 0) {
    console.error('Registry contains no extensions.');
    process.exitCode = 1;
    return;
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

  process.exitCode = results.failed > 0 ? 1 : 0;
}

main();
