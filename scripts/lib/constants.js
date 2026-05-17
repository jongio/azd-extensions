/**
 * Shared constants for registry scripts.
 *
 * Single source of truth for artifact host restrictions, checksum algorithms,
 * and required platform lists. Imported by update-registry.js and validate-registry.js.
 */

/** Allowed hostname for artifact download URLs (GitHub releases only). */
export const ALLOWED_ARTIFACT_HOST = 'github.com';

/** Acceptable checksum algorithms — reject weak hashes like MD5, SHA1. */
export const ALLOWED_HASH_ALGORITHMS = ['sha256', 'sha384', 'sha512'];

/**
 * Platforms required for the latest version of every extension.
 * Missing any of these means the extension can't be installed on a major OS/arch.
 */
export const REQUIRED_PLATFORMS = [
  'windows/amd64',
  'darwin/amd64',
  'darwin/arm64',
  'linux/amd64',
  'linux/arm64',
];

/**
 * Minimum platforms required for all versions (including older ones).
 * Older versions may not have arm64 builds, but must cover the big three.
 */
export const MIN_REQUIRED_PLATFORMS = [
  'windows/amd64',
  'darwin/amd64',
  'linux/amd64',
];
