# Contributing to hiero-sdk-utils

Thank you for investing time in this project! This document covers everything
you need to get from zero to merged pull request.

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Development workflow](#development-workflow)
- [Commit hygiene](#commit-hygiene)
  - [DCO sign-off](#dco-sign-off)
  - [GPG signing](#gpg-signing)
  - [Conventional commits](#conventional-commits)
- [Testing](#testing)
- [Changesets (versioning)](#changesets-versioning)
- [Submitting a pull request](#submitting-a-pull-request)
- [Release process](#release-process)

---

## Code of conduct

This project follows the
[Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
By participating you agree to abide by its terms.

---

## Getting started

### Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18 LTS |
| pnpm | 9 |
| Git | 2.34 |

### First-time setup

```bash
# 1. Fork and clone the repo
git clone https://github.com/<your-fork>/hiero-sdk-utils.git
cd hiero-sdk-utils

# 2. Install dependencies (pnpm workspaces installs all packages)
pnpm install

# 3. Build all packages once so workspace cross-references resolve
pnpm build

# 4. Run the full test suite
pnpm test
```

---

## Project structure

```
hiero-sdk-utils/
├── packages/
│   ├── core/           # @hiero-sdk-utils/core   — shared types, errors, retry
│   ├── mirror-node/    # @hiero-sdk-utils/mirror-node — typed Mirror Node client
│   ├── scheduled-tx/   # @hiero-sdk-utils/scheduled-tx — scheduled tx helpers
│   └── react/          # @hiero-sdk-utils/react  — React hooks and provider
├── docs/
│   └── examples/       # Runnable quickstart examples
├── .github/
│   └── workflows/      # CI and release pipelines
├── biome.json          # Lint and format config
├── tsconfig.base.json  # Shared TypeScript config
└── pnpm-workspace.yaml
```

Each package is independently versioned and published to npm.

---

## Development workflow

```bash
# Run tests for a single package in watch mode
cd packages/mirror-node
pnpm vitest

# Type-check everything
pnpm typecheck

# Lint and auto-fix
pnpm lint:fix

# Format
pnpm format
```

When adding a new exported symbol, update the package's `src/index.ts` barrel
and add or extend the relevant test file under `src/__tests__/`.

---

## Commit hygiene

### DCO sign-off

This project uses the
[Developer Certificate of Origin (DCO)](https://developercertificate.org/).
Every commit **must** carry a `Signed-off-by` trailer:

```
Signed-off-by: Jane Smith <jane@example.com>
```

The easiest way is to pass `-s` / `--signoff` to `git commit`:

```bash
git commit -s -m "feat(mirror-node): add token balance query"
```

To retroactively sign off all commits on your branch:

```bash
git rebase --signoff origin/main
```

The CI `dco` job will reject any PR that contains unsigned commits.

### GPG signing

We strongly encourage (and for maintainers: require) GPG-signed commits so
that the git history is verifiable.

**Set up GPG signing:**

```bash
# 1. Generate a key (if you don't have one)
gpg --full-generate-key

# 2. Copy the key ID
gpg --list-secret-keys --keyid-format=long

# 3. Tell Git to use it
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true

# 4. Export and upload the public key to GitHub
#    https://github.com/settings/gpg/new
gpg --armor --export <KEY_ID>
```

Once configured, every `git commit` will be signed automatically.

### Conventional commits

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
messages. This feeds the automated changelog generation.

| Type | When to use |
|------|-------------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change with no behaviour change |
| `test` | Adding or fixing tests |
| `chore` | Tooling, CI, dependency bumps |
| `perf` | Performance improvement |
| `build` | Build system changes |

**Scope** is the package name without the org prefix:
`feat(mirror-node)`, `fix(core)`, `docs(react)`.

**Breaking changes** go in the footer or with a `!` after the type:

```
feat(mirror-node)!: rename MirrorNodeClient constructor option

BREAKING CHANGE: `networkConfig.timeout` is now `networkConfig.timeoutMs`
```

---

## Testing

Every change must ship with tests. We use [Vitest](https://vitest.dev/).

```bash
# All packages, single run
pnpm test

# Watch mode for one package
cd packages/core && pnpm vitest

# Coverage report
pnpm test -- --coverage
```

**Guidelines:**

- Unit-test individual functions and classes in isolation.
- Use `vi.fn()` and mock `fetch` rather than hitting real Mirror Nodes.
- Keep test files co-located under `src/__tests__/`.
- Aim for 80 %+ branch coverage on new code.

---

## Changesets (versioning)

We use [Changesets](https://github.com/changesets/changesets) to manage
semantic versioning and the changelog.

**Every PR that changes user-facing behaviour must include a changeset.**

```bash
# Interactive changeset wizard — run from the repo root
pnpm changeset
```

You will be prompted to:
1. Select which package(s) are affected.
2. Choose the bump type (`patch`, `minor`, or `major`).
3. Write a one-line summary for the changelog.

Commit the generated `.changeset/*.md` file alongside your code changes.

---

## Submitting a pull request

1. **Open an issue first** for any non-trivial change so we can align on
   approach before you invest coding time.
2. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
3. Make your changes, following the guidelines above.
4. Run the full suite locally:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```
5. Push and open a PR against `main`. Fill in the PR template.
6. A maintainer will review within a few days. Please be responsive to
   review comments — stale PRs may be closed after 30 days of inactivity.

---

## Release process

Releases are fully automated via the
[`release.yml`](.github/workflows/release.yml) workflow:

1. When changesets are merged to `main`, the workflow opens a **Version PR**
   that bumps package versions and updates `CHANGELOG.md`.
2. Merging the Version PR triggers **publication to npm** with
   [npm provenance](https://docs.npmjs.com/generating-provenance-statements).

Maintainers do not need to manually tag or publish.
