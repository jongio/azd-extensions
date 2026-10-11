#!/usr/bin/env node
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSchemaValidator, verifySources } from './lib/schema-validation.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const versionIndex = process.argv.indexOf('--version');
const version = versionIndex === -1 ? undefined : process.argv[versionIndex + 1];
if (versionIndex !== -1 && version !== 'v1.2') throw new Error(`Unsupported scoped version: ${version}`);
const directory = resolve(root, 'schemas', ...(version ? [version] : []));
verifySources(resolve(root, 'schemas', 'v1.2'));
const validator = createSchemaValidator(directory);
let failed = 0;
for (const { path, schema } of validator.resources) {
  try {
    await validator.compile(schema);
    console.log(`PASS ${path}`);
  } catch (error) {
    failed++;
    console.error(`FAIL ${path}: ${error.message}`);
  }
}
console.log(`${validator.resources.length - failed} passed; ${failed} failed. Network loading is disabled.`);
process.exitCode = failed ? 1 : 0;
