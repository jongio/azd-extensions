/**
 * Shared validation functions for registry scripts.
 *
 * Pure functions that return arrays of { passed, message } results.
 * No side effects — no console.log, no global state mutation.
 */

import { compareSemver } from './semver.js';
import {
  ALLOWED_ARTIFACT_HOST,
  ALLOWED_HASH_ALGORITHMS,
  REQUIRED_PLATFORMS,
  MIN_REQUIRED_PLATFORMS,
} from './constants.js';

/**
 * Check if a hostname matches the allowed artifact host.
 * Exact match or proper subdomain boundary (e.g., "api.github.com" matches,
 * "evil-github.com" does not).
 *
 * @param {string} hostname
 * @returns {boolean}
 */
export function isAllowedHost(hostname) {
  return (
    hostname === ALLOWED_ARTIFACT_HOST ||
    hostname.endsWith('.' + ALLOWED_ARTIFACT_HOST)
  );
}

/**
 * Check if a URL is an allowed artifact URL.
 * Must be HTTPS and from an allowed host.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isAllowedArtifactUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && isAllowedHost(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Validate that versions are in strictly ascending semver order.
 *
 * @param {string} extId
 * @param {{ version: string }[]} versions
 * @returns {{ passed: boolean, message: string }[]}
 */
export function validateSemverOrder(extId, versions) {
  const versionStrings = versions.map((v) => v.version);
  for (let i = 1; i < versionStrings.length; i++) {
    if (compareSemver(versionStrings[i - 1], versionStrings[i]) >= 0) {
      return [
        {
          passed: false,
          message:
            `[${extId}] Versions not in ascending semver order: ` +
            `${versionStrings[i - 1]} should come before ${versionStrings[i]}`,
        },
      ];
    }
  }
  return [{ passed: true, message: `[${extId}] Versions are in ascending semver order` }];
}

/**
 * Validate that the latest version has all required platforms.
 *
 * @param {string} extId
 * @param {{ version: string, artifacts?: Record<string, unknown> }} latestVersion
 * @returns {{ passed: boolean, message: string }[]}
 */
export function validatePlatforms(extId, latestVersion) {
  const artifacts = latestVersion.artifacts || {};
  const platforms = Object.keys(artifacts);
  const results = [];

  for (const platform of REQUIRED_PLATFORMS) {
    if (platforms.includes(platform)) {
      results.push({
        passed: true,
        message: `[${extId}@${latestVersion.version}] Has required platform: ${platform}`,
      });
    } else {
      results.push({
        passed: false,
        message: `[${extId}@${latestVersion.version}] Missing required platform: ${platform}`,
      });
    }
  }
  return results;
}

/**
 * Validate checksums for a version's artifacts.
 *
 * @param {string} extId
 * @param {{ version: string, artifacts?: Record<string, { checksum?: { algorithm?: string, value?: string } }> }} version
 * @returns {{ passed: boolean, message: string }[]}
 */
export function validateChecksums(extId, version) {
  const artifacts = version.artifacts || {};
  const results = [];

  for (const [platform, artifact] of Object.entries(artifacts)) {
    const checksum = artifact.checksum;
    if (!checksum) {
      results.push({
        passed: false,
        message: `[${extId}@${version.version}] ${platform}: missing checksum`,
      });
    } else if (!checksum.algorithm) {
      results.push({
        passed: false,
        message: `[${extId}@${version.version}] ${platform}: checksum missing algorithm`,
      });
    } else if (!ALLOWED_HASH_ALGORITHMS.includes(checksum.algorithm.toLowerCase())) {
      results.push({
        passed: false,
        message: `[${extId}@${version.version}] ${platform}: weak checksum algorithm "${checksum.algorithm}" (allowed: ${ALLOWED_HASH_ALGORITHMS.join(', ')})`,
      });
    } else if (!checksum.value) {
      results.push({
        passed: false,
        message: `[${extId}@${version.version}] ${platform}: checksum missing value`,
      });
    } else if (/^0+$/.test(checksum.value)) {
      results.push({
        passed: false,
        message: `[${extId}@${version.version}] ${platform}: placeholder checksum (all zeros)`,
      });
    } else {
      results.push({
        passed: true,
        message: `[${extId}@${version.version}] ${platform}: checksum OK (${checksum.algorithm})`,
      });
    }
  }
  return results;
}

/**
 * Validate all versions of an extension for minimum platform coverage,
 * valid artifact URLs, and non-placeholder checksums.
 *
 * @param {string} extId
 * @param {{ version: string, artifacts?: Record<string, { url?: string, checksum?: { value?: string } }> }[]} versions
 * @returns {{ passed: boolean, message: string }[]}
 */
export function validateAllVersions(extId, versions) {
  const results = [];

  for (const ver of versions) {
    const artifacts = ver.artifacts || {};
    const platforms = Object.keys(artifacts);

    for (const p of MIN_REQUIRED_PLATFORMS) {
      if (!platforms.includes(p)) {
        results.push({
          passed: false,
          message: `[${extId}@${ver.version}] Missing platform ${p} - will break installs on that OS`,
        });
      }
    }

    for (const [platform, artifact] of Object.entries(artifacts)) {
      if (!artifact.url || !artifact.url.startsWith('https://')) {
        results.push({
          passed: false,
          message: `[${extId}@${ver.version}] ${platform}: non-HTTPS or missing URL - ${artifact.url || '(none)'}`,
        });
      } else if (!isAllowedArtifactUrl(artifact.url)) {
        results.push({
          passed: false,
          message: `[${extId}@${ver.version}] ${platform}: URL from disallowed domain - ${artifact.url}`,
        });
      }

      const value = artifact.checksum?.value || '';
      if (/^0+$/.test(value)) {
        results.push({
          passed: false,
          message: `[${extId}@${ver.version}] ${platform}: placeholder checksum (all zeros)`,
        });
      }
    }
  }

  results.push({
    passed: true,
    message: `[${extId}] All ${versions.length} version(s) checked for platforms, URLs, and checksums`,
  });
  return results;
}
