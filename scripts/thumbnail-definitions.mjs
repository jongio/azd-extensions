const commonStyle = [
  'Flat vector illustration app thumbnail on a pure white background, 1024x1024, centered.',
  'Clean modern rounded shapes, soft long shadows, subtle dashed guide lines, tiny sparkles, generous white space, crisp professional finish.',
  'Use one large cream-white browser or terminal panel as the hero surface.',
  'Show a clear left-to-right operational transformation with green circular completion badges.',
  'Place a small black GitHub Octocat mark in the upper-right with a dotted tether to the completed result.',
  'Diagram treatment only.',
  'No words, no letters, no numerals, no fake text, no logos other than the small Octocat, no photorealism, no 3D render, no dark background, no gradients, no clutter.',
].join(' ')

export const thumbnailDefinitions = Object.freeze([
  {
    id: 'azd-extensions',
    repository: 'azd-extensions',
    prompt: [
      'Create a square thumbnail for the Azure Developer CLI extension collection.',
      commonStyle,
      'Inside the hero panel, show three distinct extension cards on the left: a cyan play-and-dashboard card, an amber authenticated-API card with a shield, and a violet environment-promotion card with three connected stages.',
      'Three curved connectors converge into one organized dark registry terminal on the right containing three clean colored package rows and one large green completion badge.',
      'Use a restrained cyan, amber, violet, emerald, slate, and charcoal palette.',
    ].join(' '),
  },
  {
    id: 'azd-app',
    repository: 'azd-app',
    prompt: [
      'Create a square thumbnail for the azd app local development orchestrator.',
      commonStyle,
      'Inside the hero panel, show three heterogeneous service cards on the left: a cyan web service with a play symbol, a green function or API service, and an amber database cylinder.',
      'Their connectors flow into one polished local dashboard on the right with three healthy service rows, green checks, a small live-status light, and a compact terminal header.',
      'The image must communicate one command coordinating many services, health, logs, and dependencies.',
      'Use Azure cyan and blue, service green, dependency amber, slate, and charcoal.',
    ].join(' '),
  },
  {
    id: 'azd-rest',
    repository: 'azd-rest',
    prompt: [
      'Create a square thumbnail for the azd rest authenticated API extension.',
      commonStyle,
      'Inside the hero panel, show a structured amber request card on the left flowing through a large blue security shield with a keyhole in the center.',
      'The protected flow continues into a generic cyan cloud on the right and ends in a dark formatted response panel with clean colored data rows and a green success badge.',
      'The image must communicate automatic authentication, safe scope selection, HTTP transport, retries, and readable output without using text.',
      'The cloud must be a plain cloud shape with no Azure triangle, Microsoft mark, platform logo, or letterform inside it.',
      'Use request amber, security blue, Azure cyan, response violet and green, slate, and charcoal.',
    ].join(' '),
  },
  {
    id: 'azd-promote',
    repository: 'azd-promote',
    prompt: [
      'Create a square thumbnail for the azd promote deterministic environment promotion extension.',
      commonStyle,
      'Inside the hero panel, show one sealed artifact package entering a horizontal three-stage pipeline: cyan development, violet staging, and emerald production.',
      'Connect the stages with bold arrows. Above the pipeline, show one amber approval diamond and small lock or verification badges. Below it, show one durable dark run-record panel with a green verified result.',
      'The image must communicate one exact candidate advancing safely through approvals, locks, verification evidence, and resumable durable state.',
      'Use cyan, violet, emerald, amber, slate, and charcoal.',
    ].join(' '),
  },
])
