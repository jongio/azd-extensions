/**
 * Shared HTTP utilities for registry scripts.
 *
 * Provides a single headRequest() implementation with redirect following,
 * retry logic for transient errors, and a batchHeadRequests() worker pool
 * for concurrent URL checking.
 */

import https from 'https';

const URL_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_RETRIES = 3;
const RETRY_STATUS_CODES = [502, 503, 504];

/**
 * Perform an HTTPS HEAD request with redirect following.
 * Returns the final HTTP status code, or 0 on network error / timeout.
 * Never rejects — callers don't expect rejections.
 *
 * - Follows up to `MAX_REDIRECTS` redirects
 * - Rejects non-HTTPS redirect targets (returns 0)
 * - Retries on transient 502/503/504 errors with exponential backoff
 *
 * @param {string} url - The URL to check
 * @returns {Promise<number>} HTTP status code, or 0 on failure
 */
export function headRequest(url) {
  return headRequestWithRetry(url, MAX_RETRIES);
}

/**
 * @param {string} url
 * @param {number} retriesLeft
 * @returns {Promise<number>}
 */
async function headRequestWithRetry(url, retriesLeft) {
  const status = await headRequestOnce(url, MAX_REDIRECTS);
  if (RETRY_STATUS_CODES.includes(status) && retriesLeft > 0) {
    const delay = 2 ** (MAX_RETRIES - retriesLeft) * 500;
    await new Promise((r) => setTimeout(r, delay));
    return headRequestWithRetry(url, retriesLeft - 1);
  }
  return status;
}

/**
 * Single attempt HEAD request with redirect following.
 * @param {string} url
 * @param {number} redirectsLeft
 * @returns {Promise<number>}
 */
function headRequestOnce(url, redirectsLeft) {
  return new Promise((resolve) => {
    if (redirectsLeft <= 0) return resolve(0);
    if (!url.startsWith('https://')) {
      console.warn(`  ⚠ Refusing non-HTTPS URL: ${url}`);
      return resolve(0);
    }

    const req = https.request(url, { method: 'HEAD', timeout: URL_TIMEOUT_MS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectTarget = new URL(res.headers.location, url).href;
        if (!redirectTarget.startsWith('https://')) {
          console.warn(`  ⚠ Refusing redirect to non-HTTPS URL: ${redirectTarget}`);
          return resolve(0);
        }
        return headRequestOnce(redirectTarget, redirectsLeft - 1).then(resolve);
      }
      resolve(res.statusCode);
    });
    req.on('error', (err) => {
      console.warn(`  ⚠ HEAD request failed for ${url}: ${err.message}`);
      resolve(0);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(0);
    });
    req.end();
  });
}

/**
 * Run HEAD requests concurrently with a worker pool.
 *
 * @param {{ url: string }[]} items - Objects with a `url` property
 * @param {number} [concurrency=8] - Maximum concurrent requests
 * @returns {Promise<Map<string, number>>} Map of URL -> status code
 */
export async function batchHeadRequests(items, concurrency = 8) {
  /** @type {Map<string, number>} */
  const results = new Map();
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      const item = items[current];
      const status = await headRequest(item.url);
      results.set(item.url, status);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
