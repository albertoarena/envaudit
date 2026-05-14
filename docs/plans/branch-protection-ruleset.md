# Plan: Branch Protection Ruleset for `main`

**Status: COMPLETED** (2026-05-14)

## Goal

Protect the `main` branch so that:

- No one can push directly to `main` (except the owner who can bypass)
- External contributors must fork and open PRs
- CI status checks must pass before merging
- Branch cannot be deleted or force-pushed

## Steps

### Step 1: Create CI workflow (`.github/workflows/ci.yml`) — DONE

A GitHub Actions workflow that runs tests on every push to `main` and on every PR targeting `main`.

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  tests:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node: ['18', '20', '22']

    name: Node ${{ matrix.node }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - name: Run tests
        run: node --test tests/
```

**Why this matrix:** The package requires Node.js >=18 (per `package.json` `engines` field). Testing 18, 20, and 22 covers the current LTS and latest stable versions. No `npm install` step is needed since the project has zero dependencies.

**Job names** produced by the matrix: `Node 18`, `Node 20`, `Node 22` — these are the status check context names used in Step 3.

---

### Step 2: Push workflow to `main`, verify it passes — DONE

Commit and push the CI workflow to `main` so that the status check contexts exist in GitHub (required before they can be referenced in a ruleset).

---

### Step 3: Create branch ruleset via GitHub API — DONE

**Ruleset ID:** `16381476`
**URL:** https://github.com/albertoarena/envaudit/rules/16381476

Once CI has run successfully, create the ruleset:

```bash
gh api repos/albertoarena/envaudit/rulesets \
  --method POST \
  --input - <<'EOF'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "bypass_actors": [
    {
      "actor_id": 5,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ],
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "Node 18" },
          { "context": "Node 20" },
          { "context": "Node 22" }
        ]
      }
    }
  ]
}
EOF
```

**What each section does:**

| Field | Purpose |
|-------|---------|
| `name: "main"` | Ruleset name displayed in Settings > Rulesets |
| `enforcement: "active"` | Rules are enforced (not just evaluated) |
| `conditions.ref_name.include` | Applies to `main` branch only |
| `bypass_actors` | `actor_id: 5` + `RepositoryRole` = Repository admin role, set to "Always allow" bypass — this lets the owner push directly to main without a PR |
| `deletion` rule | Prevents deleting the `main` branch |
| `non_fast_forward` rule | Prevents force-pushes to `main` |
| `pull_request` rule | Requires a PR for merging; 1 required approval; dismisses stale reviews. Owner bypasses this rule as admin, so own PRs don't need approval |
| `required_status_checks` rule | All 3 CI matrix jobs must pass; strict policy means the branch must be up to date with `main` before merging |

---

### Step 4: Verify — DONE

- Ruleset is active and visible in Settings > Rulesets
- CI workflow ran successfully on push (all 3 Node versions passed)

---

## Rollback

To delete the ruleset:

```bash
gh api repos/albertoarena/envaudit/rulesets/16381476 --method DELETE
```

To update the ruleset:

```bash
gh api repos/albertoarena/envaudit/rulesets/16381476 \
  --method PUT \
  --input - <<'EOF'
{ ... updated JSON ... }
EOF
```

## Notes

- The `deploy-docs.yml` workflow is **not** included as a required check — it only runs on `website/**` path changes
- No CODEOWNERS file is included (can be added later)
- No `npm install` needed in CI since the project has zero dependencies
