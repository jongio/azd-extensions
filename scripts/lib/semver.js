/**
 * Shared semver comparison utility for registry scripts.
 *
 * Handles strict major.minor.patch versions. Rejects pre-release suffixes
 * and non-numeric components rather than silently degrading.
 */

/**
 * Parse a semver string into its numeric components.
 * Throws if any component is not a non-negative integer.
 *
 * @param {string} version - Semver string (e.g., "1.2.3")
 * @returns {number[]} Array of [major, minor, patch]
 */
export function parseSemver(version) {
  if (typeof version !== 'string' || version.trim() === '') {
    throw new Error(`Invalid semver: expected non-empty string, got ${JSON.stringify(version)}`);
  }
  if (version !== version.trim()) {
    throw new Error(
      `Invalid semver: version "${version}" has leading or trailing whitespace`
    );
  }
  const parts = version.split('.');
  if (parts.length > 3) {
    throw new Error(
      `Invalid semver: version "${version}" has ${parts.length} segments (max 3)`
    );
  }
  const nums = parts.map((part, i) => {
    if (!/^\d+$/.test(part)) {
      throw new Error(
        `Invalid semver component "${part}" at position ${i} in version "${version}"`
      );
    }
    return Number(part);
  });
  return nums;
}

/**
 * Compare two semver strings (major.minor.patch) for sorting ascending.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 *
 * Throws on invalid version strings (pre-release suffixes, non-numeric parts)
 * rather than silently producing incorrect sort order.
 *
 * @param {string} a - First version string
 * @param {string} b - Second version string
 * @returns {number} Comparison result for Array.sort()
 */
export function compareSemver(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
