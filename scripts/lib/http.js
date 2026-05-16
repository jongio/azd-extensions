/**
 * Shared HTTP utilities for registry scripts.
 *
 * Provides a single headRequest() implementation used by both
 * validate-registry.js and update-registry.js, eliminating the
 * behavioral divergence between the two former copies.
 */

import https from 'https';

const URL_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

/**
 * Perform an HTTPS HEAD request, following redirects up to `maxRedirects`.
 * Rejects redirects to non-HTTPS URLs to prevent downgrade attacks.
 *
 * Resolves with the final HTTP status code, or 0 on network error / timeout.
 * Never rejects — callers can simply check `status === 200`.
 *
 * @param {string} url - The URL to check.
 * @param {number} [maxRedirects=MAX_REDIRECTS] - Maximum redirect hops.
 * @returns {Promise<number>} HTTP status code, or 0 on failure.
 */
export function headRequest(url, maxRedirects = MAX_REDIRECTS) {
  return new Promise((resolve) => {
    const doRequest = (targetUrl, redirectsLeft) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(targetUrl);
      } catch {
        console.warn(`  ⚠ Malformed URL: ${targetUrl}`);
        resolve(0);
        return;
      }

      if (parsedUrl.protocol !== 'https:') {
        console.warn(`  ⚠ Refusing non-HTTPS URL: ${targetUrl}`);
        resolve(0);
        return;
      }

      const req = https.request(
        targetUrl,
        { method: 'HEAD', timeout: URL_TIMEOUT_MS },
        (res) => {
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode) &&
            res.headers.location
          ) {
            if (redirectsLeft <= 0) {
              console.warn(`  ⚠ Too many redirects for ${url}`);
              resolve(0);
              return;
            }
            const next = new URL(res.headers.location, targetUrl).href;
            if (!next.startsWith('https://')) {
              console.warn(`  ⚠ Refusing redirect to non-HTTPS URL: ${next}`);
              resolve(0);
              return;
            }
            doRequest(next, redirectsLeft - 1);
            return;
          }
          resolve(res.statusCode);
        },
      );

      req.on('timeout', () => {
        req.destroy();
        console.warn(`  ⚠ Timeout after ${URL_TIMEOUT_MS}ms for ${url}`);
        resolve(0);
      });
      req.on('error', (err) => {
        console.warn(`  ⚠ HEAD request failed for ${url}: ${err.message}`);
        resolve(0);
      });
      req.end();
    };

    doRequest(url, maxRedirects);
  });
}
