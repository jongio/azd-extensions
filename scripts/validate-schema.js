#!/usr/bin/env node

/**
 * Validates that all JSON Schema files in schemas/ are well-formed
 * draft-07 schemas that can compile without errors.
 *
 * This catches syntax errors, invalid $ref pointers, and structural
 * issues before the schema is served to downstream consumers via
 * GitHub raw URLs.
 *
 * Uses ajv (already a devDependency) for schema compilation.
 *
 * Flags:
 *  --offline  Use placeholder schemas for external $ref URIs (skip network)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join, relative } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCHEMAS_DIR = resolve(__dirname, '..', 'schemas');
const offlineMode = process.argv.includes('--offline');

/**
 * Load an external schema by URI. In offline mode, returns a permissive
 * placeholder so compilation can proceed without network access.
 * @param {string} uri
 * @returns {Promise<object>}
 */
async function loadSchema(uri) {
  if (offlineMode) {
    // Return a permissive schema so compilation succeeds without network
    return { type: 'object', additionalProperties: true };
  }

  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${uri}: ${res.status}`);
  }
  return res.json();
}

/**
 * Recursively find all .json files under a directory.
 * @param {string} dir
 * @returns {string[]}
 */
function findJsonFiles(dir) {
  /** @type {string[]} */
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...findJsonFiles(full));
    } else if (entry.endsWith('.json')) {
      results.push(full);
    }
  }
  return results;
}

async function main() {
  console.log(`\nValidating schemas in: ${SCHEMAS_DIR}\n`);

  const files = findJsonFiles(SCHEMAS_DIR);
  if (files.length === 0) {
    console.error('No .json files found in schemas/ directory.');
    process.exitCode = 1;
    return;
  }

  const ajv = new Ajv({ allErrors: true, strict: false, loadSchema });
  addFormats(ajv);

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const rel = relative(resolve(__dirname, '..'), file);
    let schema;
    try {
      schema = JSON.parse(readFileSync(file, 'utf-8'));
    } catch (err) {
      console.log(`  \u274c FAIL: ${rel} - invalid JSON: ${err.message}`);
      failed++;
      continue;
    }

    // Only validate files that declare themselves as JSON Schema
    if (!schema.$schema) {
      console.log(`  \u2139\uFE0F  SKIP: ${rel} - no $schema property`);
      continue;
    }

    try {
      await ajv.compileAsync(schema);
      console.log(`  \u2705 PASS: ${rel}`);
      passed++;
    } catch (err) {
      console.log(`  \u274c FAIL: ${rel} - ${err.message}`);
      failed++;
    }
  }

  console.log();
  console.log('\u2550'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('\u2550'.repeat(50));

  process.exitCode = failed > 0 ? 1 : 0;
}

main();
