import type { IconName } from '@jongio/azd-web-core/components/Icon.astro'

export interface ExtensionFeature {
  icon: IconName
  title: string
  desc: string
}

export interface ExtensionScenario {
  title: string
  command: string
}

export interface Extension {
  id: string
  name: string
  tagline: string
  /** Verb-first clause for the landing-page hero, e.g. "runs your whole app locally." */
  heroClaim: string
  description: string
  icon: IconName
  website: string
  repository: string
  features: ExtensionFeature[]
  scenarios: ExtensionScenario[]
  tags: string[]
  glowColor: string
}
