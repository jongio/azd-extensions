const octocat = `
  <g transform="translate(850 118) scale(3.25)" fill="#111827" opacity="0.92">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23A11.5 11.5 0 0 1 12 6.8c1.02 0 2.05.14 3.01.4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.19.69.8.57A12 12 0 0 0 12 0Z"/>
  </g>
  <path d="M828 214 C856 204 882 190 906 164" fill="none" stroke="#94a3b8" stroke-width="5" stroke-dasharray="10 12" stroke-linecap="round"/>
`

const defs = `
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0f172a" flood-opacity="0.13"/>
    </filter>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto">
      <path d="M0 0L10 6L0 12Z" fill="#64748b"/>
    </marker>
  </defs>
`

function frame(accent, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${defs}
    <rect width="1024" height="1024" fill="#ffffff"/>
    <circle cx="160" cy="150" r="68" fill="${accent}" opacity="0.08"/>
    <circle cx="886" cy="824" r="106" fill="${accent}" opacity="0.07"/>
    <rect x="92" y="106" width="840" height="806" rx="72" fill="#f8fafc" stroke="#dbe4ee" stroke-width="4" filter="url(#shadow)"/>
    <rect x="92" y="106" width="840" height="98" rx="72" fill="#ffffff"/>
    <path d="M92 176H932" stroke="#dbe4ee" stroke-width="4"/>
    <circle cx="150" cy="155" r="12" fill="#fb7185"/>
    <circle cx="188" cy="155" r="12" fill="#fbbf24"/>
    <circle cx="226" cy="155" r="12" fill="#34d399"/>
    <rect x="274" y="139" width="238" height="30" rx="15" fill="${accent}" opacity="0.16"/>
    ${octocat}
    ${content}
  </svg>`
}

const check = (x, y, color = '#10b981') => `
  <circle cx="${x}" cy="${y}" r="34" fill="${color}"/>
  <path d="M${x - 15} ${y}l10 11 22-25" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
`

const arrow = (x1, y1, x2, y2) => `
  <path d="M${x1} ${y1} C${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}" fill="none" stroke="#64748b" stroke-width="8" stroke-linecap="round" marker-end="url(#arrow)"/>
`

const hub = frame(
  '#06b6d4',
  `
  <g transform="translate(150 274)">
    <rect width="238" height="122" rx="28" fill="#ecfeff" stroke="#06b6d4" stroke-width="5"/>
    <circle cx="62" cy="61" r="32" fill="#06b6d4"/>
    <path d="M52 43l30 18-30 18Z" fill="#ffffff"/>
    <rect x="112" y="39" width="82" height="15" rx="7.5" fill="#0f172a" opacity="0.7"/>
    <rect x="112" y="69" width="56" height="12" rx="6" fill="#64748b" opacity="0.55"/>
  </g>
  <g transform="translate(150 452)">
    <rect width="238" height="122" rx="28" fill="#fff7ed" stroke="#f59e0b" stroke-width="5"/>
    <circle cx="62" cy="61" r="32" fill="#f59e0b"/>
    <path d="M43 62h38M62 43v38" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>
    <rect x="112" y="39" width="82" height="15" rx="7.5" fill="#0f172a" opacity="0.7"/>
    <rect x="112" y="69" width="56" height="12" rx="6" fill="#64748b" opacity="0.55"/>
  </g>
  <g transform="translate(150 630)">
    <rect width="238" height="122" rx="28" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="5"/>
    <circle cx="62" cy="61" r="32" fill="#8b5cf6"/>
    <path d="M44 72l18-28 18 28M50 64h24" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="112" y="39" width="82" height="15" rx="7.5" fill="#0f172a" opacity="0.7"/>
    <rect x="112" y="69" width="56" height="12" rx="6" fill="#64748b" opacity="0.55"/>
  </g>
  ${arrow(400, 335, 566, 430)}
  ${arrow(400, 513, 566, 500)}
  ${arrow(400, 691, 566, 570)}
  <g transform="translate(584 340)">
    <rect width="244" height="318" rx="38" fill="#0f172a"/>
    <rect x="28" y="28" width="188" height="48" rx="16" fill="#1e293b"/>
    <circle cx="58" cy="52" r="9" fill="#fb7185"/>
    <circle cx="88" cy="52" r="9" fill="#fbbf24"/>
    <circle cx="118" cy="52" r="9" fill="#34d399"/>
    <rect x="34" y="108" width="176" height="24" rx="12" fill="#06b6d4" opacity="0.8"/>
    <rect x="34" y="154" width="136" height="18" rx="9" fill="#8b5cf6" opacity="0.78"/>
    <rect x="34" y="194" width="154" height="18" rx="9" fill="#f59e0b" opacity="0.78"/>
    <rect x="34" y="234" width="116" height="18" rx="9" fill="#10b981" opacity="0.78"/>
  </g>
  ${check(826, 690)}
`
)

const app = frame(
  '#06b6d4',
  `
  <g transform="translate(140 290)">
    <rect width="214" height="116" rx="26" fill="#eff6ff" stroke="#38bdf8" stroke-width="5"/>
    <circle cx="56" cy="58" r="27" fill="#38bdf8"/>
    <path d="M47 43l25 15-25 15Z" fill="#ffffff"/>
    <rect x="104" y="35" width="76" height="14" rx="7" fill="#0f172a" opacity="0.68"/>
    <rect x="104" y="65" width="52" height="12" rx="6" fill="#64748b" opacity="0.5"/>
  </g>
  <g transform="translate(140 474)">
    <rect width="214" height="116" rx="26" fill="#f0fdf4" stroke="#22c55e" stroke-width="5"/>
    <circle cx="56" cy="58" r="27" fill="#22c55e"/>
    <path d="M42 58h28M56 44v28" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <rect x="104" y="35" width="76" height="14" rx="7" fill="#0f172a" opacity="0.68"/>
    <rect x="104" y="65" width="52" height="12" rx="6" fill="#64748b" opacity="0.5"/>
  </g>
  <g transform="translate(140 658)">
    <rect width="214" height="116" rx="26" fill="#fff7ed" stroke="#f59e0b" stroke-width="5"/>
    <circle cx="56" cy="58" r="27" fill="#f59e0b"/>
    <ellipse cx="56" cy="50" rx="18" ry="9" fill="#ffffff"/>
    <path d="M38 50v22c0 12 36 12 36 0V50" fill="none" stroke="#ffffff" stroke-width="7"/>
    <rect x="104" y="35" width="76" height="14" rx="7" fill="#0f172a" opacity="0.68"/>
    <rect x="104" y="65" width="52" height="12" rx="6" fill="#64748b" opacity="0.5"/>
  </g>
  ${arrow(370, 348, 522, 420)}
  ${arrow(370, 532, 522, 518)}
  ${arrow(370, 716, 522, 616)}
  <g transform="translate(540 310)">
    <rect width="304" height="422" rx="38" fill="#ffffff" stroke="#94a3b8" stroke-width="5"/>
    <rect x="28" y="32" width="248" height="58" rx="18" fill="#0f172a"/>
    <rect x="48" y="52" width="94" height="18" rx="9" fill="#38bdf8"/>
    <circle cx="246" cy="61" r="12" fill="#10b981"/>
    <rect x="34" y="122" width="236" height="72" rx="20" fill="#ecfeff"/>
    <rect x="54" y="144" width="98" height="14" rx="7" fill="#0f172a" opacity="0.68"/>
    ${check(238, 158)}
    <rect x="34" y="216" width="236" height="72" rx="20" fill="#f0fdf4"/>
    <rect x="54" y="238" width="116" height="14" rx="7" fill="#0f172a" opacity="0.68"/>
    ${check(238, 252)}
    <rect x="34" y="310" width="236" height="72" rx="20" fill="#fff7ed"/>
    <rect x="54" y="332" width="82" height="14" rx="7" fill="#0f172a" opacity="0.68"/>
    ${check(238, 346)}
  </g>
`
)

const rest = frame(
  '#f59e0b',
  `
  <g transform="translate(126 368)">
    <rect width="220" height="236" rx="34" fill="#ffffff" stroke="#f59e0b" stroke-width="6"/>
    <circle cx="52" cy="56" r="18" fill="#22c55e"/>
    <rect x="86" y="42" width="92" height="22" rx="11" fill="#0f172a" opacity="0.78"/>
    <rect x="34" y="104" width="152" height="18" rx="9" fill="#f59e0b" opacity="0.8"/>
    <rect x="34" y="144" width="124" height="14" rx="7" fill="#94a3b8"/>
    <rect x="34" y="176" width="98" height="14" rx="7" fill="#cbd5e1"/>
  </g>
  ${arrow(368, 486, 484, 486)}
  <g transform="translate(474 352)">
    <path d="M100 0l94 38v78c0 73-42 120-94 146-52-26-94-73-94-146V38Z" fill="#eff6ff" stroke="#2563eb" stroke-width="7"/>
    <rect x="60" y="94" width="80" height="74" rx="18" fill="#2563eb"/>
    <path d="M80 94V72c0-30 40-30 40 0v22" fill="none" stroke="#2563eb" stroke-width="14" stroke-linecap="round"/>
    <circle cx="100" cy="128" r="9" fill="#ffffff"/>
    <path d="M100 137v15" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
  </g>
  ${arrow(684, 486, 746, 486)}
  <g transform="translate(736 318)">
    <path d="M58 88c18-48 86-58 116-16 43-15 80 18 72 58 38 8 47 60 14 80H56c-51-11-49-91 2-122Z" fill="#ecfeff" stroke="#06b6d4" stroke-width="6"/>
    <rect x="28" y="226" width="236" height="186" rx="30" fill="#0f172a"/>
    <rect x="56" y="258" width="120" height="20" rx="10" fill="#f59e0b"/>
    <rect x="56" y="302" width="166" height="15" rx="7.5" fill="#38bdf8" opacity="0.85"/>
    <rect x="56" y="338" width="126" height="15" rx="7.5" fill="#8b5cf6" opacity="0.85"/>
    <rect x="56" y="374" width="86" height="15" rx="7.5" fill="#10b981" opacity="0.85"/>
  </g>
  ${check(828, 754)}
`
)

const promote = frame(
  '#8b5cf6',
  `
  <g transform="translate(130 392)">
    <circle cx="92" cy="92" r="82" fill="#ecfeff" stroke="#06b6d4" stroke-width="7"/>
    <rect x="50" y="66" width="84" height="20" rx="10" fill="#06b6d4"/>
    <rect x="64" y="105" width="56" height="14" rx="7" fill="#0f172a" opacity="0.55"/>
  </g>
  ${arrow(320, 484, 410, 484)}
  <g transform="translate(390 392)">
    <circle cx="92" cy="92" r="82" fill="#f5f3ff" stroke="#8b5cf6" stroke-width="7"/>
    <rect x="50" y="66" width="84" height="20" rx="10" fill="#8b5cf6"/>
    <rect x="64" y="105" width="56" height="14" rx="7" fill="#0f172a" opacity="0.55"/>
  </g>
  ${arrow(580, 484, 670, 484)}
  <g transform="translate(650 392)">
    <circle cx="92" cy="92" r="82" fill="#f0fdf4" stroke="#10b981" stroke-width="7"/>
    <rect x="50" y="66" width="84" height="20" rx="10" fill="#10b981"/>
    <rect x="64" y="105" width="56" height="14" rx="7" fill="#0f172a" opacity="0.55"/>
  </g>
  <g transform="translate(438 246)">
    <path d="M74 0l74 74-74 74L0 74Z" fill="#fff7ed" stroke="#f59e0b" stroke-width="6"/>
    <path d="M42 76l20 20 44-50" fill="none" stroke="#f59e0b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <path d="M512 396V350" stroke="#64748b" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 12"/>
  <g transform="translate(360 648)">
    <rect width="304" height="112" rx="32" fill="#0f172a"/>
    <rect x="30" y="30" width="126" height="18" rx="9" fill="#8b5cf6"/>
    <rect x="30" y="66" width="184" height="14" rx="7" fill="#38bdf8" opacity="0.78"/>
    <rect x="232" y="32" width="42" height="42" rx="13" fill="#10b981"/>
    <path d="M244 53l8 8 14-18" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  ${check(816, 300)}
`
)

export const thumbnailDefinitions = Object.freeze([
  {
    id: 'azd-extensions',
    repository: 'azd-extensions',
    recipe:
      'Three extension product cards converge into a central registry terminal with a verified status.',
    svg: hub,
  },
  {
    id: 'azd-app',
    repository: 'azd-app',
    recipe:
      'Three heterogeneous services converge into one health-aware local development dashboard.',
    svg: app,
  },
  {
    id: 'azd-rest',
    repository: 'azd-rest',
    recipe:
      'A structured API request passes through authenticated protection into Azure and returns a formatted response.',
    svg: rest,
  },
  {
    id: 'azd-promote',
    repository: 'azd-promote',
    recipe:
      'A verified artifact advances through three guarded environments into a durable successful run.',
    svg: promote,
  },
])
