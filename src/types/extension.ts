export interface ExtensionFeature {
  icon: string
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
  description: string
  icon: string
  website: string
  repository: string
  features: ExtensionFeature[]
  scenarios: ExtensionScenario[]
  tags: string[]
  glowColor: string
}
