/**
 * Shared constants for registry scripts.
 *
 * Centralizes values that were previously duplicated across
 * validate-registry.js and update-registry.js.
 */

/** Platforms that every extension version must support. */
export const REQUIRED_PLATFORMS = [
  'windows/amd64',
  'darwin/amd64',
  'darwin/arm64',
  'linux/amd64',
  'linux/arm64',
];

/** Minimum platforms required for a version to be considered valid. */
export const MIN_REQUIRED_PLATFORMS = [
  'windows/amd64',
  'darwin/amd64',
  'linux/amd64',
];

/** Allowed hostname suffix for artifact download URLs. */
export const ALLOWED_ARTIFACT_HOST = 'github.com';

/** Acceptable checksum algorithms (reject weak hashes like MD5, SHA1). */
export const ALLOWED_HASH_ALGORITHMS = ['sha256', 'sha384', 'sha512'];
