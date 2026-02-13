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
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REGISTRY_PATH = resolve(__dirname, '..', 'public', 'registry.json');

const REQUIRED_PLATFORMS = [
  'windows/amd64',
  'darwin/amd64',
  'darwin/arm64',
  'linux/amd64',
  'linux/arm64',
];

const OPTIONAL_PLATFORMS = ['windows/arm64'];

const URL_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

// ── Helpers ──────────────────────────────────────────────────────────────────

function compareSemver(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Perform an HTTP(S) HEAD request, following redirects up to `maxRedirects`.
 * Resolves with the final status code or rejects on error / timeout.
 */
function headRequest(url, maxRedirects = MAX_REDIRECTS) {
  return new Promise((resolvePromise, reject) => {
    const doRequest = (targetUrl, redirectsLeft) => {
      const parsedUrl = new URL(targetUrl);
      const lib = parsedUrl.protocol === 'https:' ? https : http;

      const req = lib.request(
        targetUrl,
        { method: 'HEAD', timeout: URL_TIMEOUT_MS },
        (res) => {
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode) &&
            res.headers.location
          ) {
            if (redirectsLeft <= 0) {
              reject(new Error(`Too many redirects for ${url}`));
              return;
            }
            const next = new URL(res.headers.location, targetUrl).href;
            doRequest(next, redirectsLeft - 1);
            return;
          }
          resolvePromise(res.statusCode);
        },
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout after ${URL_TIMEOUT_MS}ms for ${url}`));
      });
      req.on('error', (err) => reject(err));
      req.end();
    };

    doRequest(url, maxRedirects);
  });
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
