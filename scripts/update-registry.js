#!/usr/bin/env node

/**
 * Update registry.json with latest release information from extension repositories
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REGISTRY_FILE = 'registry.json';

// Extension repository mapping
const EXTENSIONS = [
  { id: 'jongio.azd.exec', repo: 'jongio/azd-exec' },
  { id: 'jongio.azd.app', repo: 'jongio/azd-app' },
];

/**
 * Fetch latest release from GitHub
 */
async function getLatestRelease(repo) {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      console.log(`No releases found for ${repo}`);
      return null;
    }
    throw new Error(`Failed to fetch release for ${repo}: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Download asset and calculate SHA256 checksum
 */
async function calculateChecksum(url) {
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const hash = createHash('sha256').update(buffer).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Update extension in registry
 */
async function updateExtension(registry, extensionId, repo) {
  console.log(`\nChecking ${repo} for latest release...`);

  const release = await getLatestRelease(repo);
  if (!release) {
    console.log(`Skipping ${repo} - no releases found`);
    return false;
  }

  const version = release.tag_name.replace(/^v/, '');
  console.log(`Found version ${version}`);

  // Find extension in registry
  const extensionIndex = registry.extensions.findIndex((ext) => ext.id === extensionId);
  if (extensionIndex === -1) {
    console.error(`Extension ${extensionId} not found in registry`);
    return false;
  }

  const extension = registry.extensions[extensionIndex];

  // Check if version is already up to date
  if (extension.version === version) {
    console.log(`Extension ${extensionId} is already at version ${version}`);
    return false;
  }

  console.log(`Updating ${extensionId} from ${extension.version} to ${version}`);

  // Find the main asset (usually a zip file)
  const asset = release.assets.find(
    (a) => a.name.endsWith('.zip') || a.name.endsWith('.tar.gz')
  );

  // Update extension
  extension.version = version;

  // Initialize releases array if it doesn't exist
  if (!extension.releases) {
    extension.releases = [];
  }

  // Check if this version already exists in releases
  const existingReleaseIndex = extension.releases.findIndex((r) => r.version === version);

  if (existingReleaseIndex === -1 && asset) {
    // Add new release entry
    console.log(`Adding release entry for version ${version}`);

    // Calculate checksum for the asset
    console.log('Calculating checksum...');
    const checksum = await calculateChecksum(asset.browser_download_url);

    extension.releases.unshift({
      version: version,
      url: asset.browser_download_url,
      checksum: checksum,
      publishedAt: release.published_at,
    });

    // Keep only last 5 releases
    if (extension.releases.length > 5) {
      extension.releases = extension.releases.slice(0, 5);
    }
  }

  return true;
}

/**
 * Main function
 */
async function main() {
  if (!GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  try {
    // Read registry
    console.log('Reading registry.json...');
    const registry = JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));

    let hasChanges = false;

    // Update each extension
    for (const { id, repo } of EXTENSIONS) {
      const updated = await updateExtension(registry, id, repo);
      if (updated) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      // Write updated registry
      console.log('\nWriting updated registry.json...');
      writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2) + '\n', 'utf8');
      console.log('Registry updated successfully!');
      process.exit(0);
    } else {
      console.log('\nNo changes needed - registry is up to date');
      process.exit(1); // Exit with 1 to indicate no changes
    }
  } catch (error) {
    console.error('Error updating registry:', error.message);
    process.exit(1);
  }
}

main();
