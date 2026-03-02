# Security Audit: azd-extensions

**Date**: 2025-07-14
**Scope**: Full adversarial review of azd-extensions codebase
**Methodology**: STRIDE threat model, OWASP Top 10 (2021), CWE-mapped vulnerability analysis
**Auditor**: SecOps Agent (dual-model analysis)

---

## Executive Summary

The azd-extensions codebase is a **static website + extension registry** deployed to GitHub Pages. It fetches registry data from external GitHub repositories, aggregates it, and serves it as a JSON file alongside a showcase website. The attack surface is concentrated in three areas: (1) the CI/CD pipeline that builds and publishes the registry, (2) the registry aggregation scripts that fetch and trust external data, and (3) the GitHub Actions supply chain.

**Overall risk**: MEDIUM. No CRITICAL vulnerabilities found. The most significant risks are supply chain integrity issues in the CI/CD pipeline and missing security headers on the deployed site.

### Finding Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | -- |
| HIGH | 3 | Remediation recommended |
| MEDIUM | 5 | Remediation recommended |
| LOW | 4 | Backlog / informational |

---

## Phase 1: Attack Surface Enumeration

### Entry Points

| # | Entry Point | Type | Trust Level |
|---|-------------|------|-------------|
| 1 | GitHub Pages static site | Web (HTML/JS/CSS) | Public, unauthenticated |
| 2 | `public/registry.json` | REST endpoint (static JSON) | Public, unauthenticated |
| 3 | GitHub Actions `repository_dispatch` | API trigger | Authenticated (PAT) |
| 4 | GitHub Actions `schedule` (cron) | Timer trigger | Automated |
| 5 | GitHub Actions `workflow_dispatch` | Manual trigger | Repo collaborator |
| 6 | External registry sources (raw.githubusercontent.com) | HTTP fetch | Semi-trusted (upstream repos) |
| 7 | PowerShell scripts (local dev) | Local execution | Developer workstation |
| 8 | Extension submission issue template | GitHub Issues | Public, unauthenticated |

### Trust Boundaries

```
[Public Internet] --> [GitHub Pages CDN] --> [Static HTML + registry.json]
                                                    ^
                                                    |  (build-time)
[GitHub Actions Runner] --> [fetch from upstream repos] --> [aggregate] --> [deploy]
                                ^
                                |
[Upstream Extension Repos] -- (4 external registry.json files, semi-trusted)
```

---

## Phase 2: STRIDE Threat Model

### S - Spoofing

| Component | Threat | Mitigation Status |
|-----------|--------|-------------------|
| Registry sources | Attacker compromises upstream repo (e.g., jongio/azd-app) and injects malicious registry entries | **PARTIAL** - Checksums verified but no signature verification |
| CI/CD dispatch | Attacker sends forged `repository_dispatch` to trigger malicious builds | **OK** - Requires PAT with repo scope |
| Static site | Attacker spoofs the GitHub Pages domain | **OK** - GitHub enforces HTTPS for *.github.io |

### T - Tampering

| Component | Threat | Mitigation Status |
|-----------|--------|-------------------|
| Registry JSON | Attacker tampers with registry.json in transit | **OK** - Served over HTTPS |
| Registry JSON | Attacker tampers with upstream registry data before aggregation | **GAP** - No cryptographic signing of registry entries (see Finding SEC-02) |
| CI/CD pipeline | Attacker modifies build artifacts between build and deploy | **OK** - Same job, no artifact handoff between jobs |
| Checksums | Registry contains checksums but azd CLI verification depends on client implementation | **PARTIAL** - SHA-256 checksums present |

### R - Repudiation

| Component | Threat | Mitigation Status |
|-----------|--------|-------------------|
| Registry updates | No audit trail of what changed between registry versions | **PARTIAL** - Git history shows commits by github-actions[bot] |
| Extension submissions | Issue template allows public submissions with no verification | **OK** - Manual review process |

### I - Information Disclosure

| Component | Threat | Mitigation Status |
|-----------|--------|-------------------|
| Static site | Source maps or debug info exposed | **OK** - Production build strips debug |
| Error messages | Scripts log URLs and error details to CI logs | **LOW RISK** - Public repo, no secrets in logs |
| Astro version disclosure | `meta[name=generator]` exposes Astro v5.18.0 | **INFORMATIONAL** (see Finding SEC-10) |

### D - Denial of Service

| Component | Threat | Mitigation Status |
|-----------|--------|-------------------|
| Registry update script | Upstream source returns extremely large JSON, exhausting CI runner memory | **GAP** - No size limit on fetched data (see Finding SEC-05) |
| HEAD request validation | Attacker-controlled URL causes slow response, blocking CI pipeline | **PARTIAL** - 10s timeout exists |
| GitHub Pages | DDoS against static site | **OK** - GitHub CDN handles this |

### E - Elevation of Privilege

| Component | Threat | Mitigation Status |
|-----------|--------|-------------------|
| Publish workflow | `contents: write` permission allows pushing to main | **ACCEPTABLE** - Required for auto-commit pattern |
| Local PowerShell scripts | Scripts run as current user, modify `~/.azd/config.json` | **ACCEPTABLE** - Local dev tooling |

---

## Phase 3: OWASP Top 10 (2021) Coverage

| # | Category | Status | Details |
|---|----------|--------|---------|
| A01 | Broken Access Control | **N/A** | Static site, no auth required, no protected resources |
| A02 | Cryptographic Failures | **PASS** | SHA-256 checksums on artifacts, HTTPS enforced for artifact URLs |
| A03 | Injection | **PASS** | No XSS vectors found (see detailed analysis below) |
| A04 | Insecure Design | **PASS** | Registry aggregation design is sound; validation pipeline exists |
| A05 | Security Misconfiguration | **FINDING** | Missing CSP, X-Frame-Options, and other security headers (SEC-04) |
| A06 | Vulnerable Components | **PASS** | `pnpm audit` reports 0 vulnerabilities; dependency-review action in CI |
| A07 | Identification & Auth Failures | **N/A** | No authentication in static site |
| A08 | Software & Data Integrity Failures | **FINDING** | GitHub Actions not pinned to SHA (SEC-01); no registry signing (SEC-02) |
| A09 | Security Logging & Monitoring | **N/A** | Static site on GitHub Pages - no server-side logging capability |
| A10 | Server-Side Request Forgery | **PASS** | URLs are hardcoded constants, not user-controlled (see analysis below) |

---

## Phase 4: Detailed Findings

### SEC-01: GitHub Actions Not Pinned to Commit SHA [HIGH]

- **CWE**: CWE-829 (Inclusion of Functionality from Untrusted Control Sphere)
- **CVSS**: 8.1 (High)
- **STRIDE**: Tampering, Elevation of Privilege
- **OWASP**: A08 Software and Data Integrity Failures
- **Classification**: [PROPOSE]

**Files affected**:
- `.github/workflows/ci.yml` lines 19, 22, 25
- `.github/workflows/publish.yml` lines 28, 31, 37, 45, 82, 85, 91
- `.github/workflows/codeql.yml` lines 29, 32, 37, 40
- `.github/workflows/dependency-review.yml` lines 12, 15
- `.github/workflows/spellcheck.yml` lines 15, 18

**Description**: All 17 GitHub Actions `uses:` references use mutable version tags (e.g., `actions/checkout@v4`, `pnpm/action-setup@v4`) instead of immutable commit SHAs. A compromised or hijacked action tag could inject malicious code into the CI/CD pipeline.

**Attack scenario**: An attacker who compromises the `pnpm/action-setup` repository (or any third-party action) can push malicious code under the existing `v4` tag. The next CI run would execute the attacker's code with `contents: write`, `pages: write`, and `id-token: write` permissions -- enough to push malicious registry entries and deploy them to GitHub Pages.

**Why this matters for a registry**: The `publish.yml` workflow has `contents: write` and commits directly to `main`. A compromised action could:
1. Modify `public/registry.json` to point artifact URLs at malicious binaries
2. Push the change to `main`
3. Deploy the poisoned registry to GitHub Pages

Users who then install extensions would download and execute attacker-controlled binaries.

**Recommended fix**: Pin all actions to full commit SHAs with version comments:
```yaml
# Before
- uses: actions/checkout@v4
# After
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
```

---

### SEC-02: Registry Data Integrity - No Cryptographic Signing [HIGH]

- **CWE**: CWE-345 (Insufficient Verification of Data Authenticity)
- **CVSS**: 7.5 (High)
- **STRIDE**: Tampering, Spoofing
- **OWASP**: A08 Software and Data Integrity Failures
- **Classification**: [CONSULT]

**File**: `scripts/update-registry.js` lines 50-58, `public/registry.json`

**Description**: The registry aggregation script fetches registry data from 4 upstream GitHub repositories and trusts it without cryptographic verification. The upstream repos are all owned by the same account (`jongio`), but there is no signature verification (e.g., GPG-signed commits, Sigstore cosign, or a manifest signature).

**Attack scenario**: If an attacker gains write access to any upstream repo (e.g., `jongio/azd-app`), they can modify that repo's `registry.json` to point artifact URLs at malicious binaries with valid-looking checksums. The aggregation script would happily incorporate these entries. The checksum values in the registry are self-reported by the upstream repo -- the build pipeline does not independently compute them.

**Current mitigations** (partial):
- Artifact URLs must start with `https://` (line 115-116)
- Placeholder checksums (all zeros) are rejected (lines 121-127)
- HEAD requests verify URLs return 200 (lines 136-162)

**Gap**: None of these prevent an attacker who controls an upstream repo from providing a valid HTTPS URL to a malicious binary with a real SHA-256 checksum for that malicious binary.

**Recommended approach**: Consider one or more of:
1. Pin upstream registry sources to specific commit SHAs or use signed tags
2. Implement a manual approval gate for registry changes (PR-based flow instead of auto-commit)
3. Add Sigstore/cosign verification for release artifacts

---

### SEC-03: Publish Workflow Auto-Commits to Main Without PR Review [HIGH]

- **CWE**: CWE-862 (Missing Authorization)
- **CVSS**: 7.2 (High)
- **STRIDE**: Tampering, Elevation of Privilege
- **OWASP**: A08 Software and Data Integrity Failures
- **Classification**: [CONSULT]

**File**: `.github/workflows/publish.yml` lines 69-79

**Description**: The publish workflow runs on a schedule (daily cron) and on `repository_dispatch`. It fetches external data, writes it to `public/registry.json`, commits directly to `main`, and pushes -- all without human review.

```yaml
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add public/registry.json README.md
git commit -m "chore: update extension registry"
git push
```

**Attack scenario**: Combined with SEC-01 and SEC-02, this creates a fully automated attack chain:
1. Compromise upstream repo -> poisoned registry data
2. Wait for cron or trigger `repository_dispatch` -> publish workflow runs
3. Poisoned data auto-committed to main and deployed -> malicious registry live

**Current mitigations**: The `validate-registry.js` script runs before commit, but it only checks structural validity (semver order, platform coverage, URL reachability, checksum presence) -- not whether the data is authentically from the expected source.

**Recommended fix**: Consider:
1. Create registry update PRs instead of direct pushes (allows review)
2. Add branch protection rules requiring approvals for changes to `public/registry.json`
3. Add a diff summary to CI logs showing exactly what changed

---

### SEC-04: Missing Security Headers on Static Site [MEDIUM]

- **CWE**: CWE-1021 (Improper Restriction of Rendered UI Layers)
- **CVSS**: 5.3 (Medium)
- **STRIDE**: Information Disclosure, Spoofing
- **OWASP**: A05 Security Misconfiguration
- **Classification**: [INFORM]

**Files affected**: `astro.config.mjs`, no `_headers` file, no security headers configuration

**Description**: The deployed GitHub Pages site has no Content Security Policy (CSP), no X-Frame-Options, no X-Content-Type-Options, no Referrer-Policy, and no Permissions-Policy headers. GitHub Pages does set some baseline headers (HTTPS, HSTS), but application-level headers are absent.

**Impact**:
- **No CSP**: The page uses inline `<script>` blocks (index.astro lines 223-245, ExtensionShowcase.astro lines 190-208). Without CSP, there is no defense-in-depth against XSS if a vulnerability is introduced.
- **No X-Frame-Options**: The site can be embedded in iframes on malicious sites (clickjacking potential, though limited value for a static showcase site).
- **No Referrer-Policy**: External links (X, LinkedIn, GitHub) may receive full referrer information.

**Note**: GitHub Pages has limited header customization. CSP can be set via `<meta>` tags for static sites.

**Recommended fix**: Add a CSP meta tag to the Layout component head:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'" />
```

---

### SEC-05: No Response Size Limit on External Registry Fetch [MEDIUM]

- **CWE**: CWE-400 (Uncontrolled Resource Consumption)
- **CVSS**: 5.3 (Medium)
- **STRIDE**: Denial of Service
- **OWASP**: A05 Security Misconfiguration
- **Classification**: [INFORM]

**File**: `scripts/update-registry.js` lines 50-59

```javascript
async function fetchRegistry(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  return await response.json();
}
```

**Description**: The `fetch()` call reads the entire response body into memory and parses it as JSON with no size limit. If an upstream registry source is compromised to return an extremely large JSON payload (e.g., several GB), it would exhaust the CI runner's memory.

**Impact**: Denial of service against the CI pipeline. An attacker who controls an upstream repo could prevent registry updates by serving a resource-bomb.

**Mitigating factor**: The sources are hardcoded URLs to specific GitHub repos (line 40-45), so the attacker already needs write access to one of those repos.

**Recommended fix**: Add a content-length check before reading the body:
```javascript
const contentLength = parseInt(response.headers.get('content-length') || '0');
if (contentLength > 5 * 1024 * 1024) { // 5MB limit
  throw new Error(`Registry too large: ${contentLength} bytes from ${url}`);
}
```

---

### SEC-06: validate-registry.js Follows Redirects to HTTP [MEDIUM]

- **CWE**: CWE-319 (Cleartext Transmission of Sensitive Information)
- **CVSS**: 4.8 (Medium)
- **STRIDE**: Information Disclosure, Tampering
- **OWASP**: A02 Cryptographic Failures
- **Classification**: [AUTO-FIX]

**File**: `scripts/validate-registry.js` lines 46-48

```javascript
const parsedUrl = new URL(targetUrl);
const lib = parsedUrl.protocol === 'https:' ? https : http;
```

**Description**: The `headRequest` function in `validate-registry.js` supports both HTTP and HTTPS protocols and will follow redirects. If an HTTPS URL redirects to an HTTP URL, the validation would follow the redirect over cleartext. While `update-registry.js` correctly enforces HTTPS-only artifact URLs (line 115), the validation script's redirect-following behavior could validate a redirect chain that downgrades to HTTP.

**Impact**: An attacker who can MITM the CI runner's network traffic could intercept HEAD requests that are redirected to HTTP and return fake 200 responses, causing the validator to pass artifacts that are actually unreachable.

**Recommended fix**: Reject HTTP redirects in the `headRequest` function:
```javascript
const next = new URL(res.headers.location, targetUrl).href;
if (!next.startsWith('https://')) {
  reject(new Error(`Redirect to non-HTTPS URL: ${next}`));
  return;
}
```

---

### SEC-07: Permissive Permissions in Publish Workflow [MEDIUM]

- **CWE**: CWE-250 (Execution with Unnecessary Privileges)
- **CVSS**: 4.3 (Medium)
- **STRIDE**: Elevation of Privilege
- **OWASP**: A05 Security Misconfiguration
- **Classification**: [INFORM]

**File**: `.github/workflows/publish.yml` lines 11-14

```yaml
permissions:
  contents: write
  pages: write
  id-token: write
  packages: read
```

**Description**: The publish workflow requests `id-token: write` and `contents: write` at the workflow level. These permissions are granted to ALL steps in the job, including all third-party actions. If any action (e.g., `pnpm/action-setup`, `actions/cache`) is compromised, it inherits these powerful permissions.

**Impact**: A compromised action could:
- Use `contents: write` to push arbitrary commits to `main`
- Use `id-token: write` to request OIDC tokens and impersonate the repo
- Use `pages: write` to deploy arbitrary content to GitHub Pages

**Recommended fix**: Move permissions to the job level and minimize scope per step where possible. The `id-token: write` is only needed for the Pages deployment step.

---

### SEC-08: SECURITY.md Contains Placeholder Contact Email [MEDIUM]

- **CWE**: CWE-1059 (Insufficient Technical Documentation)
- **CVSS**: 4.0 (Medium)
- **STRIDE**: Information Disclosure (attackers know there's no real reporting channel)
- **OWASP**: A05 Security Misconfiguration
- **Classification**: [AUTO-FIX]

**File**: `SECURITY.md` line 14

```markdown
2. Email security details to: [your-email@example.com]
```

**Description**: The security policy contains a placeholder email address that will never be monitored. Security researchers who discover vulnerabilities have no way to responsibly disclose them.

**Impact**: Vulnerabilities go unreported or are disclosed publicly instead of privately.

**Recommended fix**: Replace with a real contact address or enable GitHub's private vulnerability reporting feature (Settings > Code security > Private vulnerability reporting).

---

### SEC-09: Caret Version Ranges in package.json Dependencies [LOW]

- **CWE**: CWE-1104 (Use of Unmaintained Third-Party Components)
- **CVSS**: 3.7 (Low)
- **STRIDE**: Tampering
- **OWASP**: A06 Vulnerable and Outdated Components
- **Classification**: [INFORM]

**File**: `package.json` lines 14-26

**Description**: All dependencies use caret (`^`) version ranges, which allow minor and patch updates. While `pnpm-lock.yaml` pins exact versions, a fresh `pnpm install` (without `--frozen-lockfile`) could pull in newer versions with vulnerabilities.

**Current mitigations**:
- `--frozen-lockfile` is used in CI (ci.yml line 32, publish.yml line 53)
- `pnpm-lock.yaml` is committed
- Dependency review action runs on PRs

**Residual risk**: Low. The mitigations are adequate.

---

### SEC-10: Astro Version Disclosure in Meta Generator Tag [LOW]

- **CWE**: CWE-200 (Exposure of Sensitive Information)
- **CVSS**: 2.1 (Low)
- **STRIDE**: Information Disclosure
- **OWASP**: A05 Security Misconfiguration
- **Classification**: [INFORM]

**File**: `dist/index.html` line 1

```html
<meta name="generator" content="Astro v5.18.0">
```

**Description**: The deployed HTML reveals the exact Astro framework version. This helps attackers identify applicable CVEs.

**Impact**: Minimal. Astro is a static site generator -- the version is only relevant at build time, not runtime.

---

### SEC-11: Inline Scripts Without Nonce/Hash (CSP Incompatibility) [LOW]

- **CWE**: CWE-79 (Cross-site Scripting)
- **CVSS**: 2.3 (Low)
- **STRIDE**: Tampering
- **OWASP**: A03 Injection
- **Classification**: [INFORM]

**Files**:
- `src/pages/index.astro` lines 223-245 (theme toggle script)
- `src/components/ExtensionShowcase.astro` lines 190-208 (copy button script)

**Description**: Both Astro components contain inline `<script>` blocks. If CSP is ever added (see SEC-04), these scripts would require either `'unsafe-inline'` (weakens CSP) or nonce/hash-based CSP directives.

**Current XSS analysis**: The inline scripts do NOT process any user-controlled input. The `dataset.command` value (line 198) comes from the `data-command` attribute set at build time from static extension data (developer-controlled, not user-controlled). The `innerHTML` assignments (lines 201, 203, 205) use hardcoded SVG strings, not dynamic data. **No XSS vector exists.**

---

### SEC-12: `set:html` Usage in Astro Template [LOW]

- **CWE**: CWE-79 (Cross-site Scripting)
- **CVSS**: 2.0 (Low)
- **STRIDE**: Tampering
- **OWASP**: A03 Injection
- **Classification**: [INFORM]

**File**: `src/pages/index.astro` line 136

```astro
<script type="application/ld+json" set:html={JSON.stringify({...})} />
```

**Description**: The `set:html` directive bypasses Astro's default HTML escaping. In this case, it's used to inject a JSON-LD structured data block. The data is a static object literal defined in the component frontmatter -- it contains no user-controlled input.

**XSS analysis**: The `JSON.stringify()` output is placed inside a `<script type="application/ld+json">` tag, which browsers do not execute as JavaScript. **No XSS vector exists.**

---

## Phase 5: Supply Chain Analysis

### npm Dependencies

```
pnpm audit: 0 vulnerabilities
```

| Check | Status |
|-------|--------|
| Lock file committed | PASS (`pnpm-lock.yaml` present) |
| `--frozen-lockfile` in CI | PASS (both ci.yml and publish.yml) |
| Dependency review on PRs | PASS (`dependency-review.yml` with `fail-on-severity: moderate`) |
| CodeQL scanning | PASS (weekly + on push/PR) |
| No wildcard versions | PASS (all use caret `^`) |
| Private registry scoped | PASS (`@jongio:registry=https://npm.pkg.github.com` in `.npmrc`) |

### GitHub Actions Supply Chain

| Action | Pinned to SHA? | Risk |
|--------|----------------|------|
| `actions/checkout@v4` | NO | HIGH |
| `actions/setup-node@v4` | NO | HIGH |
| `pnpm/action-setup@v4` | NO | HIGH |
| `actions/cache@v4` | NO | MEDIUM |
| `actions/configure-pages@v4` | NO | MEDIUM |
| `actions/upload-pages-artifact@v3` | NO | MEDIUM |
| `actions/deploy-pages@v4` | NO | MEDIUM |
| `github/codeql-action/init@v3` | NO | MEDIUM |
| `github/codeql-action/autobuild@v3` | NO | MEDIUM |
| `github/codeql-action/analyze@v3` | NO | MEDIUM |
| `actions/dependency-review-action@v4` | NO | MEDIUM |
| `streetsidesoftware/cspell-action@v6` | NO | LOW |

**Verdict**: 0 of 17 actions are SHA-pinned. This is the single largest supply chain risk in the project.

---

## Phase 6: SSRF Analysis

**File**: `scripts/update-registry.js`

The `EXTENSION_SOURCES` array (lines 40-45) contains 4 hardcoded URLs. These URLs are hardcoded constants (not derived from user input, environment variables, or registry data). The script does NOT follow URLs from within the fetched data to make additional requests.

The `headRequest` function (lines 18-37) only operates on artifact URLs from within the registry data, but these are validated to start with `https://` and are only used for HEAD requests (no response body is read).

**SSRF Verdict**: No SSRF vulnerability.

---

## Phase 7: Path Traversal Analysis

All file paths in all scripts are derived from `__dirname`, `import.meta.url`, or hardcoded constants. No user-controlled input reaches any filesystem operation.

**Path Traversal Verdict**: No vulnerability.

---

## Phase 8: Secrets Exposure Analysis

| Check | Result |
|-------|--------|
| Hardcoded passwords/keys | NONE FOUND |
| API keys in source | NONE FOUND |
| `.env` files committed | NONE |
| Secrets in git history | NOT FOUND |
| CI secrets usage | `GITHUB_TOKEN` only, properly referenced |

**Secrets Verdict**: Clean.

---

## Remediation Roadmap

### Immediate (< 1 week)

1. **SEC-08** [AUTO-FIX]: Replace placeholder email in SECURITY.md
2. **SEC-06** [AUTO-FIX]: Add HTTPS enforcement to redirect following in validate-registry.js

### Short-term (< 30 days)

3. **SEC-01** [PROPOSE]: Pin all GitHub Actions to commit SHAs
4. **SEC-04** [INFORM]: Add CSP meta tag to Layout component
5. **SEC-07** [INFORM]: Tighten workflow permissions to job level

### Medium-term (< 90 days)

6. **SEC-02** [CONSULT]: Evaluate registry signing approach
7. **SEC-03** [CONSULT]: Consider PR-based flow for registry updates
8. **SEC-05** [INFORM]: Add response size limit to fetch

---

## Positive Security Observations

The codebase demonstrates several security-conscious practices:

1. **HTTPS enforcement**: `update-registry.js` rejects non-HTTPS artifact URLs (line 115)
2. **Checksum validation**: Placeholder/zero checksums are rejected (lines 121-127)
3. **URL reachability**: HEAD requests verify artifact URLs are live (lines 136-162)
4. **Redirect limits**: Both scripts cap redirects at 5 to prevent infinite loops
5. **Timeouts**: All HTTP requests have 10-second timeouts
6. **Frozen lockfile**: CI uses `--frozen-lockfile` preventing dependency confusion
7. **Dependency review**: PR-time dependency scanning with `fail-on-severity: moderate`
8. **CodeQL**: Weekly and on-push SAST scanning
9. **Minimal dependencies**: Only 2 runtime dependencies (Astro + shared core)
10. **No `eval()` / `child_process`**: Scripts avoid dangerous Node.js APIs
11. **Input sanitization**: `update-readme-versions.js` escapes regex special chars (line 41)
12. **Static output**: Astro generates static HTML at build time; no server-side rendering attack surface
13. **`rel="noopener noreferrer"`**: All external links use proper `rel` attributes
