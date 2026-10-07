import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { thumbnailDefinitions } from './thumbnail-definitions.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const extensionsRoot = dirname(repoRoot)
const syncSiblings = process.argv.includes('--sync-siblings')

function write(path, bytes) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, bytes)
}

function metadata(definition, sha256) {
  return {
    schemaVersion: 1,
    id: definition.id,
    width: 1024,
    height: 1024,
    sha256,
    provider: 'deterministic-svg',
    model: 'azd-extension-thumbnail-v1',
    renderer: 'sharp@0.35.4',
    generator: 'jongio/azd-extensions:scripts/generate-thumbnails.mjs',
    recipe: `https://github.com/jongio/azd-extensions/blob/main/docs/thumbnail-recipes.md#${definition.id}`,
  }
}

const manifest = {
  schemaVersion: 1,
  width: 1024,
  height: 1024,
  provider: 'deterministic-svg',
  model: 'azd-extension-thumbnail-v1',
  renderer: 'sharp@0.35.4',
  generator: 'scripts/generate-thumbnails.mjs',
  items: {},
}

for (const definition of thumbnailDefinitions) {
  const png = await sharp(Buffer.from(definition.svg))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()
  const webp = await sharp(png).webp({ quality: 90, effort: 6 }).toBuffer()
  const sha256 = createHash('sha256').update(png).digest('hex')
  const pngPath = join(repoRoot, 'public', 'images', `thumb-${definition.id}.png`)
  const webpPath = join(repoRoot, 'public', 'images', `thumb-${definition.id}.webp`)

  write(pngPath, png)
  write(webpPath, webp)

  manifest.items[definition.id] = {
    repository: definition.repository,
    recipe: definition.recipe,
    sha256,
    png: `public/images/thumb-${definition.id}.png`,
    webp: `public/images/thumb-${definition.id}.webp`,
  }

  const targetRoot = join(extensionsRoot, definition.repository)
  if (definition.repository === 'azd-extensions') {
    write(join(repoRoot, 'thumbnail.png'), png)
    write(
      join(repoRoot, 'thumbnail.json'),
      `${JSON.stringify(metadata(definition, sha256), null, 2)}\n`
    )
  } else if (syncSiblings) {
    if (!existsSync(targetRoot)) {
      throw new Error(`Sibling repository is missing: ${targetRoot}`)
    }
    write(join(targetRoot, 'thumbnail.png'), png)
    write(join(targetRoot, 'web', 'public', 'thumbnail.png'), png)
    write(
      join(targetRoot, 'thumbnail.json'),
      `${JSON.stringify(metadata(definition, sha256), null, 2)}\n`
    )
  }
}

write(join(repoRoot, 'thumbnail-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

console.log(
  `Generated ${thumbnailDefinitions.length} extension thumbnails${syncSiblings ? ' and synchronized sibling repositories' : ''}.`
)
