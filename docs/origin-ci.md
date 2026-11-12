# Origin CI

GitHub Actions is billing-locked for this account. Continuous integration runs on Cursor Origin through the Depot app. Depot executes GitHub Actions-syntax YAML from `.depot/workflows/` on the `depot-ubuntu-24.04` runner. Those workflows fire once this repository is detached from GitHub.

`.github/workflows` is left as it is. This repository has no Actions workflow files (the GitHub contents API returns 404 for `.github/workflows`). Nothing in that directory was deleted.

## Workflow map

There is no GitHub Actions workflow to translate. The Depot file is the CI definition.

| GitHub Actions workflow | Depot equivalent | When it runs | Commands |
| --- | --- | --- | --- |
| None | `.depot/workflows/ci.yml` job `verify` | `pull_request`, and `push` to `main` | `npm ci`, `npm run lint`, `npm test`, `npm run build` |
| None | `.depot/workflows/ci.yml` job `ai-review` | `pull_request` only | `npm ci`, `node scripts/ai-review.mjs` |

Both jobs check out the repo, install Node.js 22 with the npm cache, and install from `package-lock.json` via `npm ci`.

### `verify`

| Step | Script | What it actually runs |
| --- | --- | --- |
| `npm ci` | lockfile install | npm lockfile version 3, 1046 packages |
| `npm run lint` | `eslint .` | ESLint 9 flat config |
| `npm test` | `vitest run` | Vitest single run. The npm script is already non-watch |
| `npm run build` | `next build` | Next.js 15 production build, telemetry disabled |

`npm test` does not need a code change. `package.json` already sets `"test": "vitest run"`.

### `ai-review`

`scripts/ai-review.mjs` sends the pull-request diff to Grok (`grok-4.5` on `https://api.x.ai/v1/chat/completions`) when `XAI_API_KEY` is set. It posts one comment, updating the previous one on later runs:

```bash
origin pr comment <PR_NUMBER> --body-file <file> --edit-last --create-if-none
```

The job passes these from the Depot GitHub-compatible context:

| Env | Source |
| --- | --- |
| `XAI_API_KEY` | `${{ secrets.XAI_API_KEY }}` |
| `PR_NUMBER` | `${{ github.event.pull_request.number }}` |
| `GITHUB_BASE_REF` | `${{ github.base_ref }}` |

Skip behavior, all exit 0:

- `XAI_API_KEY` missing or blank: log `AI review skipped: XAI_API_KEY is not set` and do not call xAI.
- `PR_NUMBER` set and the `origin` CLI is not on `PATH`: log `AI review skipped: origin CLI is not available` and do not call xAI.
- Diff against the base is empty: log `AI review skipped: empty diff`.
- The `origin pr comment` command fails after a review was written: print the review to the job log and exit 0.

An xAI HTTP error, or an empty model response, exits 1. That is a real review failure, not a missing key or CLI.

The reference script can also comment through the GitHub issues API when `GITHUB_TOKEN` and `GITHUB_REPOSITORY` are set. This copy does not. A Depot runner that injects `GITHUB_TOKEN` must not post to GitHub, and a missing `origin` binary must not fall through to `api.github.com` and fail the job. Comments go to Origin only.

## Build placeholders

`next build` imports the document routes, which import `core/di.ts`. That module constructs the Gemini adapters, and those constructors throw if `GEMINI_API_KEY` is empty. The same import chain loads `db/index.ts`, which throws if `DATABASE_URL` is unset, even when the local JSON adapter would have been selected.

The build step therefore sets non-secret placeholders:

| Variable | Value | Why it is not a Depot secret |
| --- | --- | --- |
| `GEMINI_API_KEY` | `ci-build-placeholder` | Satisfies the non-empty check. The build does not call Gemini |
| `DATABASE_URL` | `postgresql://ci:ci@127.0.0.1:5432/looking_glass` | Satisfies module init. The build does not query Neon |

`NEXT_TELEMETRY_DISABLED=1` is set on the `verify` job. Lint and tests do not need either placeholder.

Do not point this build step at production Neon. A real `DATABASE_URL` would select `PostgresStorageAdapter` during page-data collection.

## GitHub-only pieces that will be dropped

Nothing is checked in under `.github/workflows`, so there is no Actions file to retire when the repository detaches.

These GitHub-only behaviors are intentionally absent and should not be recreated on Depot:

- A `GITHUB_TOKEN` comment posted to `api.github.com` (the streetroyalty review script has this path; this repo's script does not).
- Actions status checks, job summaries, and required-check branch protection tied to GitHub-hosted runners. Actions cannot run under the billing lock, so those checks can never go green.
- GitHub Environments, OIDC `id-token` deploy permissions, `actions/upload-artifact`, `actions/cache` as a separate step, `actions/github-script`, and deployment environments. None of these exist in this repo.
- Repository Actions secrets. Listing them returned HTTP 403 for this token, and no workflow file references a secret name. There is no Actions secret manifest to copy.

`actions/checkout@v4` and `actions/setup-node@v4` stay, because Depot runs that subset of Actions syntax. The reference workflow uses the same two actions.

## Secrets to enter in Depot

| Secret | Required for a green Depot run | Used by |
| --- | --- | --- |
| `XAI_API_KEY` | No. Unset skips the review and exits 0 | `ai-review` only |

Enter `XAI_API_KEY` in the Depot project when review comments should actually be written. Until then the job is a successful no-op.

These application settings are runtime configuration from `.env.example`. They are not Depot CI secrets, and this workflow does not read them:

| Name | Role |
| --- | --- |
| `GEMINI_API_KEY` | Gemini OCR, explanation, and speech at runtime |
| `DATABASE_URL` | Neon Postgres when the Postgres adapter is selected |
| `NEXTAUTH_SECRET` | Auth.js session signing |
| `NEXTAUTH_URL` | Public auth origin |
| `ADMIN_EMAIL` | Single admin login |
| `ADMIN_PASSWORD_HASH` | bcrypt hash for that login |

## Local parity

From a clean checkout, with Node.js 22:

```bash
npm ci
npm run lint
npm test
GEMINI_API_KEY=ci-build-placeholder \
  DATABASE_URL=postgresql://ci:ci@127.0.0.1:5432/looking_glass \
  NEXT_TELEMETRY_DISABLED=1 \
  npm run build
node scripts/ai-review.mjs
```

The last command skips when `XAI_API_KEY` is unset.
