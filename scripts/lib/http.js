/**
 * Shared HTTP utilities for registry scripts.
 *
 * Provides a single headRequest() implementation with redirect following,
 * retry logic for transient errors, and a batchHeadRequests() worker pool
 * for concurrent URL checking.
 */

const URL_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const RETRY_STATUS_CODES = [0, 502, 503, 504];

/**
 * Perform an HTTPS HEAD request using the native fetch API.
 * Returns the final HTTP status code, or 0 on network error / timeout.
 * Never rejects - callers don't expect rejections.
 *
 * - fetch follows redirects automatically (redirect: 'follow')
 * - Rejects non-HTTPS URLs (returns 0)
 * - Retries on network failures and transient 502/503/504 errors with exponential backoff
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
  const status = await headRequestOnce(url);
  if (RETRY_STATUS_CODES.includes(status) && retriesLeft > 0) {
    const delay = 2 ** (MAX_RETRIES - retriesLeft) * 500;
    await new Promise((r) => setTimeout(r, delay));
    return headRequestWithRetry(url, retriesLeft - 1);
  }
  return status;
}

/**
 * Single attempt HEAD request using native fetch.
 * @param {string} url
 * @returns {Promise<number>}
 */
async function headRequestOnce(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      console.warn(`  ⚠ Refusing non-HTTPS URL: ${url}`);
      return 0;
    }

    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(URL_TIMEOUT_MS),
    });
    return response.status;
  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.warn(`  ⚠ HEAD request timed out for ${url}`);
    } else {
      console.warn(`  ⚠ HEAD request failed for ${url}: ${err.message}`);
    }
    return 0;
  }
}

/**
 * Run HEAD requests concurrently with a worker pool.
 *
 * @param {{ url: string }[]} items - Objects with a `url` property
 * @param {number} [concurrency=4] - Maximum concurrent requests
 * @returns {Promise<Map<string, number>>} Map of URL -> status code
 */
export async function batchHeadRequests(items, concurrency = 4) {
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
