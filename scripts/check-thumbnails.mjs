import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(repoRoot, 'thumbnail-manifest.json'), 'utf8'))
if (
  manifest.provider !== 'azure-openai' ||
  manifest.model !== 'gpt-image-2' ||
  manifest.deployment !== 'gpt-image-2'
) {
  throw new Error('thumbnail-manifest.json must record Azure OpenAI gpt-image-2 provenance')
}

for (const [id, asset] of Object.entries(manifest.items)) {
  const pngPath = join(repoRoot, asset.png)
  const webpPath = join(repoRoot, asset.webp)
  const png = readFileSync(pngPath)
  const webp = readFileSync(webpPath)
  const digest = createHash('sha256').update(png).digest('hex')
  const webpDigest = createHash('sha256').update(webp).digest('hex')
  if (digest !== asset.sha256) {
    throw new Error(`${id} PNG digest does not match thumbnail-manifest.json`)
  }
  if (webpDigest !== asset.webpSha256) {
    throw new Error(`${id} WebP digest does not match thumbnail-manifest.json`)
  }
  for (const assetPath of [pngPath, webpPath]) {
    const image = await sharp(assetPath).metadata()
    if (image.width !== 1024 || image.height !== 1024) {
      throw new Error(`${id} image must be 1024x1024: ${assetPath}`)
    }
  }
}

const rootMetadata = JSON.parse(readFileSync(join(repoRoot, 'thumbnail.json'), 'utf8'))
const rootBytes = readFileSync(join(repoRoot, 'thumbnail.png'))
const rootDigest = createHash('sha256').update(rootBytes).digest('hex')
if (
  rootMetadata.id !== 'azd-extensions' ||
  rootMetadata.sha256 !== rootDigest ||
  manifest.items['azd-extensions'].sha256 !== rootDigest
) {
  throw new Error('azd-extensions root thumbnail metadata is out of sync')
}

console.log(`Validated ${Object.keys(manifest.items).length} extension thumbnails.`)
