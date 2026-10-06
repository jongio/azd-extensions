/**
 * Shared validation functions for registry scripts.
 *
 * Pure functions that return arrays of { passed, message } results.
 * No side effects, no console.log, no global state mutation.
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
 * Detect an extension pack version.
 *
 * azd defines a pack by what it lacks, not by a flag. From the SDK's own
 * ExtensionVersion doc comment: "An extension with dependencies and no
 * artifacts is considered an extension pack." There is no discriminator to
 * check, so this predicate has to mirror that shape exactly. If azd ever adds
 * an explicit marker, prefer it over this.
 *
 * A pack ships no binaries, so every artifact check below is meaningless for
 * one. Without this the aggregator drops packs for "missing required
 * platforms" and the validator reports four failures, both of which look like
 * a broken release rather than a category the tooling never learned about.
 *
 * @param {{ artifacts?: Record<string, unknown>, dependencies?: unknown[] }} version
 * @returns {boolean}
 */
export function isExtensionPackVersion(version) {
  const dependencies = version?.dependencies;
  if (!Array.isArray(dependencies) || dependencies.length === 0) {
    return false;
  }
  const artifacts = version?.artifacts;
  return !artifacts || Object.keys(artifacts).length === 0;
}

/**
 * Validate a pack version's dependencies.
 *
 * A pack is nothing but its dependency list, so a typo in an id is the whole
 * failure mode: azd resolves nothing, installs nothing, and reports no error
 * because an unresolvable dependency is indistinguishable from one that is
 * simply not in this registry. Every id must therefore be one this registry
 * actually serves.
 *
 * @param {string} extId
 * @param {{ version: string, dependencies?: { id?: string, version?: string }[] }} version
 * @param {string[]} knownIds ids present in the registry being validated
 * @returns {{ passed: boolean, message: string }[]}
 */
export function validatePackDependencies(extId, version, knownIds) {
  const results = [];

  for (const dependency of version.dependencies || []) {
    if (!dependency.id) {
      results.push({
        passed: false,
        message: `[${extId}@${version.version}] dependency missing id`,
      });
      continue;
    }
    if (!knownIds.includes(dependency.id)) {
      results.push({
        passed: false,
        message:
          `[${extId}@${version.version}] dependency "${dependency.id}" is not in this registry ` +
          `- azd would silently resolve nothing`,
      });
      continue;
    }
    if (!dependency.version) {
      results.push({
        passed: false,
        message: `[${extId}@${version.version}] dependency "${dependency.id}" missing version constraint`,
      });
      continue;
    }
    results.push({
      passed: true,
      message: `[${extId}@${version.version}] dependency OK: ${dependency.id} ${dependency.version}`,
    });
  }

  if (results.length === 0) {
    results.push({
      passed: false,
      message: `[${extId}@${version.version}] extension pack has no dependencies - it would install nothing`,
    });
  }

  return results;
}

/**
 * Remove pack versions whose dependencies are not installable from the
 * aggregated registry yet.
 *
 * This supports staged extension launches without changing an existing pack
 * version in place. For example, pack 0.1.0 can continue serving app and rest
 * while pack 0.2.0 remains withheld until promote has a reachable public
 * release.
 *
 * @param {{ version: string, dependencies?: { id?: string, version?: string }[], artifacts?: Record<string, unknown> }[]} versions
 * @param {{ id?: string, versions?: { version?: string }[] }[]} availableExtensions extensions with installable versions
 * @returns {typeof versions}
 */
export function filterResolvablePackVersions(versions, availableExtensions) {
  const available = new Map(
    availableExtensions
      .filter((extension) => extension.id)
      .map((extension) => [
        extension.id,
        (extension.versions || [])
          .map((version) => version.version)
          .filter(Boolean),
      ]),
  );

  function satisfies(version, constraint) {
    const match = /^(>=|>|<=|<|=)?\s*(\d+(?:\.\d+){0,2})$/.exec(
      constraint.trim(),
    );
    if (!match) {
      return false;
    }
    const comparison = compareSemver(version, match[2]);
    switch (match[1] || '=') {
      case '>=':
        return comparison >= 0;
      case '>':
        return comparison > 0;
      case '<=':
        return comparison <= 0;
      case '<':
        return comparison < 0;
      default:
        return comparison === 0;
    }
  }

  return versions.filter((version) => {
    if (!isExtensionPackVersion(version)) {
      return true;
    }
    return (version.dependencies || []).every((dependency) => {
      if (!dependency.id || !dependency.version) {
        return false;
      }
      const installableVersions = available.get(dependency.id) || [];
      return installableVersions.some((candidate) =>
        satisfies(candidate, dependency.version),
      );
    });
  });
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
  if (isExtensionPackVersion(latestVersion)) {
    return [
      {
        passed: true,
        message: `[${extId}@${latestVersion.version}] Extension pack - no platform artifacts expected`,
      },
    ];
  }

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
  if (isExtensionPackVersion(version)) {
    return [
      {
        passed: true,
        message: `[${extId}@${version.version}] Extension pack - no artifacts to checksum`,
      },
    ];
  }

  const artifacts = version.artifacts || {};
  const results = [];

  if (Object.keys(artifacts).length === 0) {
    return [
      {
        passed: false,
        message:
          `[${extId}@${version.version}] no artifacts and no dependencies ` +
          `- nothing to install and nothing to verify`,
      },
    ];
  }

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
    if (isExtensionPackVersion(ver)) {
      results.push({
        passed: true,
        message: `[${extId}@${ver.version}] Extension pack - dependency-only, no artifacts to check`,
      });
      continue;
    }

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
