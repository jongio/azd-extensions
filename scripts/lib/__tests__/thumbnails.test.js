import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import sharp from 'sharp'
import { extensions } from '../../../src/data/extensions.ts'
import { thumbnailDefinitions } from '../../thumbnail-definitions.mjs'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const manifest = JSON.parse(readFileSync(join(repoRoot, 'thumbnail-manifest.json'), 'utf8'))

describe('extension thumbnails', () => {
  it('records Azure OpenAI non-secret provenance', () => {
    expect(manifest).toMatchObject({
      provider: 'azure-openai',
      model: 'gpt-image-2',
      deployment: 'gpt-image-2',
      apiVersion: '2025-04-01-preview',
      quality: 'high',
    })
  })

  it('records every exact prompt verbatim in the prompt guide', () => {
    const promptGuide = readFileSync(join(repoRoot, 'docs', 'thumbnail-prompts.md'), 'utf8')
    for (const definition of thumbnailDefinitions) {
      expect(promptGuide).toContain(definition.prompt)
      expect(manifest.items[definition.id].promptSha256).toBe(
        createHash('sha256').update(definition.prompt).digest('hex')
      )
    }
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

  for (const [id, asset] of Object.entries(manifest.items)) {
    it(`${id} has valid catalog assets and digest provenance`, async () => {
      const pngPath = join(repoRoot, asset.png)
      const webpPath = join(repoRoot, asset.webp)
      const png = readFileSync(pngPath)
      const webp = readFileSync(webpPath)
      expect(createHash('sha256').update(png).digest('hex')).toBe(asset.sha256)
      expect(createHash('sha256').update(webp).digest('hex')).toBe(asset.webpSha256)
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
