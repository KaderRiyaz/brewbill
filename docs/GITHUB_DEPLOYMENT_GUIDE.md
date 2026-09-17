# Publishing a Project on GitHub: A Complete Guide

**Project type this guide prioritizes:** a static web app / installable PWA with no build step
and no backend — i.e. exactly what BrewBill is (plain HTML, CSS, vanilla JavaScript, IndexedDB
for storage). **Primary stack:** JavaScript/HTML/CSS, deployed as static files.

Static PWAs are the simplest thing to host publicly — no server, no database, no secrets to
manage at runtime — so most of this guide is short and concrete. Sections on Docker, CI/CD, and
cloud backend deployment are included because they're in scope for the request, marked clearly
as **"if you add a backend later"** so you can skip them for a project like BrewBill and come
back to them if BrewBill ever gains a sync server or a hosted API.

---

## 1. Repository Setup

### Create the repository

1. On GitHub, click **+ → New repository** (top right).
2. **Repository name**: lowercase, hyphenated (e.g. `brewbill`). This becomes part of your
   GitHub Pages URL later.
3. **Description**: one sentence — this shows in search and on your profile.
4. **Public** (required for free GitHub Pages hosting and for anyone to use it without an
   invite).
5. Check **Add a README file**.
6. **Add .gitignore**: choose the template matching your stack — for a plain JS project pick
   **Node** (it covers `node_modules/`, `.env`, log files, editor folders, etc., which is safe
   even if you don't use npm, since it just means the ignore rules for those patterns exist).
7. **Choose a license** — see below.
8. Click **Create repository**.

### Choosing a license

A public repo with **no license** legally defaults to "all rights reserved" — nobody may
legally copy, modify, or redistribute it, even though the code is visible. Pick one deliberately:

| License | What it allows | Good for |
|---|---|---|
| **MIT** | Anyone can use, modify, sell, sublicense — only requirement is keeping the copyright notice. Simplest, most permissive. | Small tools, libraries, apps like BrewBill where you want maximum adoption with minimal friction |
| **Apache 2.0** | Same permissiveness as MIT, plus an explicit patent grant and a requirement to state changes made to the code. | Projects where patent protection matters, or larger projects with corporate contributors |
| **GPLv3** | Anyone can use/modify, but any distributed derivative work must also be open-sourced under GPL ("copyleft"). | Projects where you want modifications to stay open forever, and don't mind that this deters some commercial users |

For a shop-facing tool like BrewBill that you want other coffee shops to freely adopt and adapt,
**MIT** is the standard choice. GitHub's repo creation flow lets you pick a license template
directly (or add one anytime later: **Add file → Create new file**, name it `LICENSE`, GitHub
offers to auto-fill a template).

### Add a stack-appropriate `.gitignore`

For BrewBill's stack (no build tools, but docs mention optional Electron/Capacitor wrappers),
a good `.gitignore` is:

```gitignore
# OS/editor noise
.DS_Store
Thumbs.db
.vscode/
.idea/

# If you add any Node-based tooling later (Electron/Capacitor wrappers, a dev server, etc.)
node_modules/
dist/
build/
*.log

# Environment/secrets — never commit these
.env
.env.local
*.pem
*.keystore
*.jks

# Editor-generated backups
*~
*.swp
```

Since BrewBill itself has no `node_modules` or build output, this mostly future-proofs the repo
for the Electron/Capacitor packaging steps in `BUILD_DEPLOY.md`.

---

## 2. Code Preparation

### Structure the project for public use

Keep the layout self-explanatory from the root — someone should understand what the project
does within 10 seconds of opening the repo:

```
brewbill/
├── README.md              # first thing anyone sees
├── LICENSE
├── .gitignore
├── index.html
├── manifest.json
├── service-worker.js
├── css/
├── js/
├── icons/
└── docs/
    ├── BUILD_DEPLOY.md
    ├── DATABASE_SCHEMA.md
    └── USER_MANUAL.md
```

This is already BrewBill's structure — no reorganization needed. General rules if you're
structuring a new project for the first time:

- Config/build files, docs, and source stay clearly separated (`docs/`, `src/` or top-level
  code folders, config at the root).
- No dead code, commented-out experiments, or personal scratch files committed.
- No absolute local paths (`/home/yourname/...`) anywhere in code or config.

### Remove sensitive information before the first push

This matters even for a project with no secrets today, because **git remembers everything** —
deleting a file in a later commit does not remove it from history; anyone can check out an old
commit and read it. Audit *before* your first `git push`, not after.

1. **Search your whole codebase for likely leaks** before committing:
   ```bash
   grep -rniE "api[_-]?key|secret|password|token|AKIA[0-9A-Z]{16}" . --exclude-dir=.git
   ```
2. **Never hardcode credentials** — API keys, database URLs, OAuth secrets, email
   passwords — in source files. Read them from environment variables instead.
3. **Personal data**: remove real customer names, phone numbers, or emails from any seed/demo
   data — BrewBill's demo products (Espresso, Cappuccino, etc.) are intentionally fictional for
   exactly this reason.
4. **If you accidentally commit a secret before catching it**: rotate/revoke that credential
   immediately (assume it's compromised the moment it's pushed, even to a private repo), then
   remove it from history with `git filter-repo` or GitHub's
   [push protection / secret scanning](https://docs.github.com/code-security/secret-scanning)
   tools — a later `git rm` alone is not enough.

### Add environment variable templates (for any project that does have secrets)

BrewBill has no API keys or servers, so this doesn't apply to it directly — but if you extend it
with, say, a cloud sync backend, the pattern is:

- Create `.env.example` (committed) listing every variable name with a placeholder, never a
  real value:
  ```env
  # .env.example
  DATABASE_URL=postgres://user:password@localhost:5432/dbname
  STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
  SESSION_SECRET=replace-with-a-random-64-char-string
  ```
- Add `.env` (the real file, with real values) to `.gitignore` — never commit it.
- Document in the README: "copy `.env.example` to `.env` and fill in your own values."

---

## 3. Documentation Requirements

A public README has to serve two very different readers: someone deciding *whether* to use your
project in the first 15 seconds, and someone trying to *actually run it* five minutes later.
Structure for both.

### README.md skeleton

```markdown
# BrewBill

One-line description of what it does and who it's for.

![screenshot](docs/screenshot.png)   <!-- visuals sell a project fast -->

## Features
- Bullet list, scannable, benefit-focused

## Try it live
A hosted demo link (GitHub Pages) so non-technical users can try it with zero setup.

## Installation
Step-by-step, copy-pasteable commands. Assume nothing.

## Usage
Concrete examples — a code snippet, a screenshot walkthrough, or both.

## Configuration
Every environment variable / setting, what it does, and its default.

## Dependencies
What's required to run this (runtime, browser support, Node version if relevant).

## Troubleshooting
The 3-5 problems people will actually hit, with fixes.

## Contributing
Link to CONTRIBUTING.md.

## License
State it in one line and link to LICENSE.
```

### Applying this to BrewBill specifically

- **Installation**: "no installation needed to try it — open the [live demo](#); to run it
  yourself, clone the repo and serve the folder with `python3 -m http.server 8080` (a real
  HTTP server is required — opening `index.html` directly from disk disables the service worker
  and some storage APIs)."
- **Usage**: link straight to `docs/USER_MANUAL.md`, and pull the three or four most important
  lines up into the README itself so a reader doesn't have to click through to get the gist.
- **Configuration**: BrewBill's only "configuration" is done inside the app itself (Settings
  tab: shop name, currency, tax rate) — say so explicitly, so a reader doesn't go looking for a
  config file that doesn't exist.
- **Dependencies**: "none — no npm install, no build step. Any modern browser (Chrome, Edge,
  Safari, Firefox) released in the last ~3 years." This is a selling point; say it plainly.
- **Troubleshooting**: cover the two things people will actually hit — "data isn't saving" (they
  opened `index.html` via `file://` instead of serving it over HTTP) and "install button doesn't
  appear" (needs HTTPS or `localhost`, and a supported browser).

---

## 4. Deployment Options

### For static sites (BrewBill's case): GitHub Pages

This is the single most relevant deployment path for BrewBill — free, HTTPS by default, and
exactly what a PWA needs (see the earlier build guide's note: installability requires HTTPS or
`localhost`).

1. Push your code to the `main` branch.
2. In the repo: **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. **Branch**: `main`, folder `/ (root)` (since `index.html` is at the repo root) → **Save**.
5. GitHub builds and publishes to `https://<your-username>.github.io/brewbill/` within a minute
   or two — check the same Settings → Pages screen for the live URL and build status.
6. **Every push to `main` redeploys automatically** — no extra CI step needed for a plain static
   site.

**Custom domain:**
1. Add a `CNAME` file at the repo root containing just your domain, e.g. `billing.yourshop.com`.
2. At your domain registrar, add a `CNAME` record pointing `billing.yourshop.com` →
   `<your-username>.github.io`. (For an apex domain like `yourshop.com` with no subdomain, use
   `A` records pointing at GitHub Pages' published IP addresses instead — GitHub's docs list the
   current set.)
3. Back in **Settings → Pages**, enter the custom domain and check **Enforce HTTPS** once the
   certificate provisions (can take up to 24 hours).

**A relative-path gotcha for Pages:** GitHub Pages serves project sites from a subpath
(`/brewbill/`, not `/`), so double-check `manifest.json`'s `start_url`/`scope` and any
absolute-looking asset paths still resolve. BrewBill's paths are already relative
(`./index.html`, `css/styles.css`, etc.), so no changes are needed — this is exactly why
relative paths are worth defaulting to.

### For applications with a backend: CI/CD, Docker, and PaaS platforms

*(Not needed for BrewBill as it stands — relevant if you add a sync server, a shared/team
backend, or want automated testing before every deploy.)*

**GitHub Actions (CI/CD basics)** — add `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm test
```
This runs on every push/PR; add a second job that deploys automatically once tests pass.

**Docker** — a minimal `Dockerfile` for a Node backend:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```
Even BrewBill's static files could be containerized for uniform deployment with:
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
```

**Vercel / Netlify** — for either a static site or a Node app: connect the GitHub repo in their
dashboard, they auto-detect the framework (or "none" for plain static), and every push to `main`
triggers a new deploy with a preview URL for every pull request. No YAML needed for the basic
case — this is usually faster to set up than GitHub Pages for anything beyond a pure static
site, since it also handles serverless functions if you add an API route later.

**Heroku / Render** — better fits for a long-running backend process (a Node/Python/Ruby server
that needs a persistent process rather than static files or serverless functions). Connect the
repo, set your **Environment Variables** in their dashboard (never in a committed file — see
Section 2), define a start command (Render) or `Procfile` (Heroku, e.g. `web: node server.js`),
and both redeploy automatically on push.

### For APIs / backend services: cloud providers

*(Also not needed for BrewBill — relevant only if BrewBill grows a hosted API for multi-till
sync.)*

- **AWS**: Lambda + API Gateway for a lightweight serverless API; Elastic Beanstalk or ECS/Fargate
  for a containerized long-running service.
- **Azure**: Azure App Service (closest equivalent to Heroku-style simplicity) or Azure Functions
  for serverless.
- **GCP**: Cloud Run is the most common starting point — deploy a container, pay only while it's
  handling requests, scales to zero.
- All three: never store credentials in code — use the provider's secret manager (AWS Secrets
  Manager, Azure Key Vault, GCP Secret Manager) and inject them as environment variables at
  deploy time.

---

## 5. Access Control & Collaboration

- **Settings → Collaborators and teams**: add individual collaborators by GitHub username, or
  create a Team (if under an organization) with a role — **Read**, **Triage**, **Write**,
  **Maintain**, or **Admin**. Give the minimum role someone needs; most contributors only need
  **Write**.
- **Enable Issues**: on by default for new repos (**Settings → General → Features → Issues**).
  Add issue templates (**Settings → General → Features → Set up templates**) for "Bug report"
  and "Feature request" so reports arrive with the information you actually need.
- **Enable Discussions**: good for a user-facing project like BrewBill where people will ask
  "how do I…" questions that aren't bugs — **Settings → General → Features → Discussions**.
- **Branch protection** (**Settings → Branches → Add branch protection rule**, pattern `main`):
  - Require a pull request before merging (no direct pushes to `main`).
  - Require status checks to pass (your CI workflow, if you have one) before merging.
  - Require at least one approving review for anyone other than repo admins.
  - Optionally require signed commits and a linear history.
- **CONTRIBUTING.md** at the repo root — even a short one helps:
  ```markdown
  ## Contributing
  1. Fork the repo and create a branch: `git checkout -b feature/short-description`
  2. Test your change locally (serve the folder, click through the app).
  3. Open a pull request describing what changed and why.
  4. Keep PRs focused — one feature or fix per PR is easier to review.
  ```
- **CODE_OF_CONDUCT.md** — GitHub offers a standard template (Contributor Covenant) at repo
  creation or under **Insights → Community Standards**; worth adding once you expect outside
  contributors.

---

## 6. Distribution Methods

### Publish to a package manager

Not essential for BrewBill (it's used by opening a URL or installing the PWA, not by `npm
install`), but if you later extract, say, the billing/finance logic as a reusable library:

- **npm**: add a `package.json` with `name`, `version`, `main`, then `npm login` and
  `npm publish` from the package folder. Use a scoped name (`@yourname/brewbill-core`) if the
  plain name is taken.
- **PyPI**: build with `python -m build`, then `twine upload dist/*` (requires a PyPI account
  and API token, stored via `twine`'s config, never committed).
- **RubyGems**: `gem build yourgem.gemspec` then `gem push yourgem-1.0.0.gem`.

### GitHub Releases with versioned artifacts

Use this for BrewBill's packaged builds (the Electron `.exe`, the Android `.apk`) described in
`BUILD_DEPLOY.md`:

1. Tag a commit: `git tag v1.0.0 && git push origin v1.0.0`.
2. On GitHub: **Releases → Draft a new release**, choose the tag, write release notes
   (what changed, summarized from your commit history).
3. Drag the built `.exe`/`.apk`/`.zip` files into the **Attach binaries** area — GitHub hosts
   them and gives each a stable download URL.
4. Check **Set as the latest release**. Anyone can now find and download a specific version
   from `github.com/<you>/brewbill/releases`.

### One-click deploy buttons

Drop these badges into your README so someone with zero git experience can get their own copy
running:

```markdown
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/<you>/brewbill)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/<you>/brewbill)
```
For BrewBill specifically, this is genuinely useful: another coffee shop could click one button
and have their *own* independent, privately-hosted copy — with their own data, isolated from
yours — in under a minute, no terminal required.

### Making it discoverable by non-technical people, not just developers

- **Repo "About" panel** (gear icon next to About, top right of the repo page): add the one-line
  description, the live demo URL, and relevant **topics/tags** (`pwa`, `pos`, `coffee-shop`,
  `offline-first`, `javascript`) — topics are how people find your repo via GitHub search and
  browsing, not just direct links.
  - A short GIF or screenshot at the top of the README does more for a non-technical visitor
    than any amount of text — record one showing an order being rung up and a receipt printed.
- **The live demo link is the single highest-leverage thing you can add** — a non-technical
  person will never `git clone` anything, but they will click a link and try installing it to
  their home screen in ten seconds. Put it above the fold in the README, not buried in Setup.

---

## 7. Maintenance & Updates

### Keeping dependencies updated

BrewBill has zero runtime dependencies today, so this section mostly applies to the
Electron/Capacitor wrapper projects from `BUILD_DEPLOY.md`, or to anything you add later.

- **Enable Dependabot**: **Settings → Code security and analysis → Dependabot version updates →
  Enable**. Add a `.github/dependabot.yml`:
  ```yaml
  version: 2
  updates:
    - package-ecosystem: "npm"
      directory: "/"
      schedule:
        interval: "weekly"
  ```
  Dependabot opens automatic pull requests when a dependency has a new version — review and
  merge like any other PR.

### Responding to security vulnerabilities

- **Dependabot alerts** (**Settings → Code security and analysis → Dependabot alerts →
  Enable**): GitHub scans your dependency tree against known CVE databases and opens an alert
  (and usually an auto-generated fix PR) when something you depend on has a disclosed
  vulnerability. Treat a **Critical/High** severity alert as something to merge within days, not
  months.
- **Secret scanning + push protection** (same settings page): flags accidentally committed
  credentials, and can block a push containing one before it ever reaches the repo.
- **A SECURITY.md** at the repo root tells researchers how to privately report a vulnerability
  to you instead of opening a public issue:
  ```markdown
  ## Reporting a vulnerability
  Please email security@yourdomain.com instead of opening a public issue.
  We'll acknowledge within 48 hours.
  ```

### Semantic versioning

Tag releases as `MAJOR.MINOR.PATCH` (e.g. `v1.4.2`):

| Bump | When |
|---|---|
| **PATCH** (`1.4.2` → `1.4.3`) | Bug fixes only, no behavior change a user would notice as "new" |
| **MINOR** (`1.4.3` → `1.5.0`) | New features, backward compatible (e.g. BrewBill adding a new report range) |
| **MAJOR** (`1.5.0` → `2.0.0`) | Breaking changes — e.g. a changed database schema that isn't backward compatible with old backups, or a config format change |

Keep a `CHANGELOG.md` (or use GitHub's auto-generated release notes from PR titles/labels) so
anyone updating can see exactly what changed at a glance before they upgrade.

---

## Security best practices checklist (public repos, quick reference)

- [ ] No secrets in code, ever — `.env` gitignored, `.env.example` committed instead
- [ ] Dependabot alerts + security updates enabled
- [ ] Secret scanning + push protection enabled
- [ ] Branch protection on `main` (PR required, checks required)
- [ ] `LICENSE` file present and deliberately chosen
- [ ] `SECURITY.md` with a private reporting contact
- [ ] Dependencies kept current — don't let Dependabot PRs pile up unreviewed
- [ ] No personal/customer data in demo/seed data or committed screenshots
