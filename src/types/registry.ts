export interface Extension {
  id: string
  namespace?: string
  displayName: string
  description: string
  version: string
  author?: string
  tags?: string[]
  capabilities?: string[]
  repository?: string
  releases?: Release[]
}

export interface Release {
  version: string
  url: string
  checksum?: string
  publishedAt?: string
}

export interface Registry {
  $schema?: string
  extensions: Extension[]
}
