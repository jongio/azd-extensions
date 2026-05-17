import { describe, it, expect } from 'vitest';
import { isAllowedHost } from '../validate.js';

describe('isAllowedHost', () => {
  it('allows exact match for github.com', () => {
    expect(isAllowedHost('github.com')).toBe(true);
  });

  it('rejects lookalike domains', () => {
    expect(isAllowedHost('evil-github.com')).toBe(false);
  });

  it('allows proper subdomains of github.com', () => {
    expect(isAllowedHost('sub.github.com')).toBe(true);
  });
});
