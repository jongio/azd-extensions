import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { thumbnailDefinitions } from './thumbnail-definitions.mjs'

const API_VERSION = '2025-04-01-preview'
const MODEL = 'gpt-image-2'
const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionsRoot = dirname(repoRoot)
const syncSiblings = process.argv.includes('--sync-siblings')
const syncExisting = process.argv.includes('--sync-existing')
const idIndex = process.argv.indexOf('--id')
const requestedId = idIndex >= 0 ? process.argv[idIndex + 1] : undefined
if (idIndex >= 0 && !requestedId) {
  throw new Error('--id requires a thumbnail id')
}
const selectedDefinitions = requestedId
  ? thumbnailDefinitions.filter(({ id }) => id === requestedId)
  : thumbnailDefinitions
if (selectedDefinitions.length === 0) {
  throw new Error(`Unknown thumbnail id: ${requestedId}`)
}

function validateEndpoint(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('AZURE_OPENAI_ENDPOINT must be a valid HTTPS URL')
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.openai\.azure\.com$/i.test(url.hostname)
  ) {
    throw new Error(
      'AZURE_OPENAI_ENDPOINT must be an exact https://<resource>.openai.azure.com origin'
    )
  }
  return url.origin
}

function accessToken() {
  if (process.env.AZURE_OPENAI_ACCESS_TOKEN) {
    return process.env.AZURE_OPENAI_ACCESS_TOKEN
  }
  const args = [
    'account',
    'get-access-token',
    '--resource',
    'https://cognitiveservices.azure.com',
    '--query',
    'accessToken',
    '-o',
    'tsv',
  ]
  if (process.platform === 'win32') {
    return execFileSync(
      process.env.ComSpec ?? 'cmd.exe',
      ['/d', '/s', '/c', `az ${args.join(' ')}`],
      { encoding: 'utf8', windowsHide: true }
    ).trim()
  }
  return execFileSync('az', args, {
    encoding: 'utf8',
    windowsHide: true,
  }).trim()
}

async function generate(prompt, endpoint, token) {
  const url = `${endpoint}/openai/deployments/${MODEL}/images/generations?api-version=${API_VERSION}`
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'manual',
    signal: AbortSignal.timeout(240_000),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
    }),
  })
  if (response.status >= 300 && response.status < 400) {
    throw new Error(`Azure OpenAI redirect refused with HTTP ${response.status}`)
  }
  if (!response.ok) {
    const body = (await response.text()).slice(0, 1000)
    throw new Error(`Azure OpenAI image generation failed with HTTP ${response.status}: ${body}`)
  }
  const body = await response.json()
  const encoded = body?.data?.[0]?.b64_json
  if (typeof encoded !== 'string' || encoded.length === 0) {
    throw new Error('Azure OpenAI response did not contain data[0].b64_json')
  }
  const raw = Buffer.from(encoded, 'base64')
  if (raw.length === 0 || raw.length > MAX_IMAGE_BYTES) {
    throw new Error(`Azure OpenAI image exceeded the ${MAX_IMAGE_BYTES} byte limit`)
  }
  const info = await sharp(raw).metadata()
  if (info.format !== 'png' || info.width !== 1024 || info.height !== 1024) {
    throw new Error('Azure OpenAI must return a 1024x1024 PNG')
  }
  return raw
}

function write(path, bytes) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, bytes)
}

function promptUrl(definition) {
  return `https://github.com/jongio/azd-extensions/blob/main/docs/thumbnail-prompts.md#${definition.id}`
}

function metadata(definition, endpoint, promptSha256, sha256, webpSha256) {
  return {
    schemaVersion: 1,
    id: definition.id,
    width: 1024,
    height: 1024,
    sha256,
    provider: 'azure-openai',
    model: MODEL,
    deployment: MODEL,
    endpoint,
    apiVersion: API_VERSION,
    quality: 'high',
    promptSha256,
    webpSha256,
    generator: 'jongio/azd-extensions:scripts/generate-thumbnails.mjs',
    prompt: promptUrl(definition),
  }
}

const manifestPath = join(repoRoot, 'thumbnail-manifest.json')
const existingManifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : undefined
if (syncExisting && !existingManifest) {
  throw new Error('--sync-existing requires thumbnail-manifest.json')
}
const endpoint = validateEndpoint(
  syncExisting ? existingManifest.endpoint : process.env.AZURE_OPENAI_ENDPOINT
)
const token = syncExisting ? undefined : accessToken()
const manifest =
  (requestedId || syncExisting) && existingManifest
    ? existingManifest
    : {
        schemaVersion: 1,
        width: 1024,
        height: 1024,
        provider: 'azure-openai',
        model: MODEL,
        deployment: MODEL,
        endpoint,
        apiVersion: API_VERSION,
        quality: 'high',
        generator: 'scripts/generate-thumbnails.mjs',
        items: {},
      }
Object.assign(manifest, {
  schemaVersion: 1,
  width: 1024,
  height: 1024,
  provider: 'azure-openai',
  model: MODEL,
  deployment: MODEL,
  endpoint,
  apiVersion: API_VERSION,
  quality: 'high',
  generator: 'scripts/generate-thumbnails.mjs',
})

for (const definition of selectedDefinitions) {
  const pngPath = join(repoRoot, 'public', 'images', `thumb-${definition.id}.png`)
  const webpPath = join(repoRoot, 'public', 'images', `thumb-${definition.id}.webp`)
  console.log(
    syncExisting
      ? `Synchronizing existing ${definition.id} thumbnail...`
      : `Generating ${definition.id} with ${MODEL}...`
  )
  const png = syncExisting
    ? readFileSync(pngPath)
    : await generate(definition.prompt, endpoint, token)
  const webp = await sharp(png).webp({ quality: 90, effort: 6 }).toBuffer()
  const sha256 = createHash('sha256').update(png).digest('hex')
  const webpSha256 = createHash('sha256').update(webp).digest('hex')
  const promptSha256 = createHash('sha256').update(definition.prompt).digest('hex')

  write(pngPath, png)
  write(webpPath, webp)

  manifest.items[definition.id] = {
    repository: definition.repository,
    prompt: promptUrl(definition),
    promptSha256,
    sha256,
    webpSha256,
    png: `public/images/thumb-${definition.id}.png`,
    webp: `public/images/thumb-${definition.id}.webp`,
  }

  const targetRoot = join(extensionsRoot, definition.repository)
  if (definition.repository === 'azd-extensions') {
    write(join(repoRoot, 'thumbnail.png'), png)
    write(
      join(repoRoot, 'thumbnail.json'),
      `${JSON.stringify(
        metadata(definition, endpoint, promptSha256, sha256, webpSha256),
        null,
        2
      )}\n`
    )
  } else if (syncSiblings) {
    if (!existsSync(targetRoot)) {
      throw new Error(`Sibling repository is missing: ${targetRoot}`)
    }
    write(join(targetRoot, 'thumbnail.png'), png)
    write(join(targetRoot, 'web', 'public', 'thumbnail.png'), png)
    write(join(targetRoot, 'web', 'public', 'thumbnail.webp'), webp)
    write(
      join(targetRoot, 'thumbnail.json'),
      `${JSON.stringify(
        metadata(definition, endpoint, promptSha256, sha256, webpSha256),
        null,
        2
      )}\n`
    )
  }
}

write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log(
  `Generated ${selectedDefinitions.length} Azure OpenAI thumbnail${
    selectedDefinitions.length === 1 ? '' : 's'
  }${syncSiblings ? ' and synchronized sibling repositories' : ''}.`
)
