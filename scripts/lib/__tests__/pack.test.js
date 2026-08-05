import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const manifestPath = join(repoRoot, 'pack', 'extension.yaml');
const registryPath = join(repoRoot, 'pack', 'registry.json');

const manifest = parseYaml(readFileSync(manifestPath, 'utf8'));
const packEntry = JSON.parse(readFileSync(registryPath, 'utf8')).extensions[0];
const packVersion = packEntry.versions[packEntry.versions.length - 1];

// azd infers pack mode structurally: a manifest with dependencies and no
// executable metadata is a pack. There is no explicit discriminator, so any of
// these keys silently demotes the pack into a regular extension that has no
// code to run and no way to report the mistake.
const executableKeys = ['capabilities', 'namespace', 'language', 'entryPoint'];

describe('extension pack manifest', () => {
  it('declares dependencies', () => {
    expect(Array.isArray(manifest.dependencies)).toBe(true);
    expect(manifest.dependencies.length).toBeGreaterThan(0);
  });

  it.each(executableKeys)('omits %s so azd still treats it as a pack', (key) => {
    expect(manifest[key]).toBeUndefined();
  });

  it('declares no artifacts', () => {
    expect(manifest.artifacts).toBeUndefined();
  });

  // jongio.azd.copilot is being retired. Its registry entry stays so existing
  // installs keep resolving, which means nothing else stops the pack from
  // quietly handing it to every new user.
  it('does not install the retired copilot extension', () => {
    const ids = manifest.dependencies.map((dep) => dep.id);
    expect(ids).not.toContain('jongio.azd.copilot');
  });
});

describe('extension pack registry entry', () => {
  it.each(executableKeys)('omits %s', (key) => {
    expect(packVersion[key]).toBeUndefined();
    expect(packEntry[key]).toBeUndefined();
  });

  it('carries no artifacts', () => {
    expect(packVersion.artifacts).toBeUndefined();
  });

  it('stays in sync with the manifest', () => {
    expect(packEntry.id).toBe(manifest.id);
    expect(packVersion.version).toBe(String(manifest.version));
    expect(packVersion.dependencies).toEqual(manifest.dependencies);
  });
});
