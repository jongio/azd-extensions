import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { extensions } from '../../../src/data/extensions.ts'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const manifest = JSON.parse(readFileSync(join(repoRoot, 'thumbnail-manifest.json'), 'utf8'))

describe('extension thumbnails', () => {
  it('records deterministic non-secret provenance', () => {
    expect(manifest).toMatchObject({
      provider: 'deterministic-svg',
      model: 'azd-extension-thumbnail-v1',
      renderer: 'sharp@0.35.4',
    })
  })

  it('registers one catalog thumbnail for every extension', () => {
    expect(
      extensions.map(({ id, thumbnail, optimizedThumbnail }) => ({
        id,
        thumbnail,
        optimizedThumbnail,
      }))
    ).toEqual([
      {
        id: 'jongio.azd.app',
        thumbnail: 'images/thumb-azd-app.png',
        optimizedThumbnail: 'images/thumb-azd-app.webp',
      },
      {
        id: 'jongio.azd.rest',
        thumbnail: 'images/thumb-azd-rest.png',
        optimizedThumbnail: 'images/thumb-azd-rest.webp',
      },
      {
        id: 'jongio.azd.promote',
        thumbnail: 'images/thumb-azd-promote.png',
        optimizedThumbnail: 'images/thumb-azd-promote.webp',
      },
    ])
  })

  for (const [id, item] of Object.entries(manifest.items)) {
    it(`${id} has valid catalog assets and digest provenance`, async () => {
      const pngPath = join(repoRoot, item.png)
      const webpPath = join(repoRoot, item.webp)
      const png = readFileSync(pngPath)
      expect(createHash('sha256').update(png).digest('hex')).toBe(item.sha256)
      expect(await sharp(pngPath).metadata()).toMatchObject({
        format: 'png',
        width: 1024,
        height: 1024,
      })
      expect(await sharp(webpPath).metadata()).toMatchObject({
        format: 'webp',
        width: 1024,
        height: 1024,
      })
    })
  }
})
