import { describe, it, expect } from 'vitest';
import { parseSemver, compareSemver } from '../semver.js';

describe('parseSemver', () => {
  it('parses a valid semver string into [major, minor, patch]', () => {
    expect(parseSemver('1.2.3')).toEqual([1, 2, 3]);
  });

  it('throws on empty string', () => {
    expect(() => parseSemver('')).toThrow();
  });

  it('throws on version with leading/trailing whitespace', () => {
    expect(() => parseSemver('  1.2.3  ')).toThrow(/whitespace/);
  });

  it('throws on version with 4+ segments', () => {
    expect(() => parseSemver('1.2.3.4')).toThrow(/segments/);
  });
});

describe('compareSemver', () => {
  it('returns negative when a < b', () => {
    expect(compareSemver('1.0.0', '2.0.0')).toBeLessThan(0);
  });

  it('returns 0 when versions are equal', () => {
    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
  });
});
