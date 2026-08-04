import { describe, it, expect } from 'vitest';
import {
  isAllowedHost,
  isExtensionPackVersion,
  validatePlatforms,
  validateChecksums,
  validateAllVersions,
  validatePackDependencies,
} from '../validate.js';

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

const PACK_VERSION = {
  version: '0.1.0',
  dependencies: [
    { id: 'jongio.azd.app', version: '>= 0.20.0' },
    { id: 'jongio.azd.rest', version: '>= 0.5.0' },
  ],
};

const BINARY_VERSION = {
  version: '1.0.0',
  artifacts: {
    'windows/amd64': {
      url: 'https://github.com/o/r/releases/download/v1/a.zip',
      checksum: { algorithm: 'sha256', value: 'abc123' },
    },
    'darwin/amd64': {
      url: 'https://github.com/o/r/releases/download/v1/b.zip',
      checksum: { algorithm: 'sha256', value: 'abc123' },
    },
    'darwin/arm64': {
      url: 'https://github.com/o/r/releases/download/v1/c.zip',
      checksum: { algorithm: 'sha256', value: 'abc123' },
    },
    'linux/amd64': {
      url: 'https://github.com/o/r/releases/download/v1/d.zip',
      checksum: { algorithm: 'sha256', value: 'abc123' },
    },
  },
};

const KNOWN_IDS = ['jongio.azd.app', 'jongio.azd.copilot', 'jongio.azd.rest'];

describe('isExtensionPackVersion', () => {
  it('identifies a dependency-only version as a pack', () => {
    expect(isExtensionPackVersion(PACK_VERSION)).toBe(true);
  });

  it('does not treat a version with artifacts as a pack', () => {
    expect(isExtensionPackVersion(BINARY_VERSION)).toBe(false);
  });

  // azd infers pack mode from the absence of artifacts. A version carrying both
  // is a regular extension that also pulls dependencies, so the artifact checks
  // must still run against it.
  it('does not treat a version with both dependencies and artifacts as a pack', () => {
    expect(
      isExtensionPackVersion({ ...BINARY_VERSION, dependencies: PACK_VERSION.dependencies })
    ).toBe(false);
  });

  it('does not treat an empty version as a pack', () => {
    expect(isExtensionPackVersion({ version: '1.0.0' })).toBe(false);
    expect(isExtensionPackVersion({ version: '1.0.0', dependencies: [] })).toBe(false);
  });
});

describe('validatePlatforms', () => {
  it('passes a pack without demanding platform artifacts', () => {
    const results = validatePlatforms('jongio.azd', PACK_VERSION);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('still fails a non-pack that is missing platforms', () => {
    const results = validatePlatforms('jongio.azd.app', { version: '1.0.0', artifacts: {} });
    expect(results.some((r) => !r.passed)).toBe(true);
  });
});

describe('validateChecksums', () => {
  it('passes a pack that has nothing to checksum', () => {
    const results = validateChecksums('jongio.azd', PACK_VERSION);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  // Before pack support this returned an empty array, which every caller read
  // as a pass. A version with neither artifacts nor dependencies installs
  // nothing, so it has to fail rather than vacuously succeed.
  it('fails a version with neither artifacts nor dependencies', () => {
    const results = validateChecksums('jongio.azd.app', { version: '1.0.0' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.passed)).toBe(false);
  });
});

describe('validateAllVersions', () => {
  it('does not report missing platforms for a pack', () => {
    const results = validateAllVersions('jongio.azd', [PACK_VERSION]);
    expect(results.every((r) => r.passed)).toBe(true);
  });
});

describe('validatePackDependencies', () => {
  it('accepts dependencies this registry serves', () => {
    const results = validatePackDependencies('jongio.azd', PACK_VERSION, KNOWN_IDS);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  // The whole failure mode of a pack: azd cannot tell a typo from an extension
  // that simply is not here, so it resolves nothing and reports nothing.
  it('rejects a dependency that is not in the registry', () => {
    const typo = {
      version: '0.1.0',
      dependencies: [{ id: 'jongio.azd.ap', version: '>= 0.20.0' }],
    };
    const results = validatePackDependencies('jongio.azd', typo, KNOWN_IDS);
    expect(results.some((r) => !r.passed)).toBe(true);
  });

  it('rejects a dependency with no version constraint', () => {
    const unpinned = { version: '0.1.0', dependencies: [{ id: 'jongio.azd.app' }] };
    const results = validatePackDependencies('jongio.azd', unpinned, KNOWN_IDS);
    expect(results.some((r) => !r.passed)).toBe(true);
  });

  it('rejects a pack with no dependencies at all', () => {
    const results = validatePackDependencies('jongio.azd', { version: '0.1.0' }, KNOWN_IDS);
    expect(results.every((r) => r.passed)).toBe(false);
  });
});
