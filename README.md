# envaudit

![Traffic](https://raw.githubusercontent.com/albertoarena/envaudit/traffic-data/badge.svg?v=1)

Zero-dependency CLI to audit, compare and sync `.env` files.

Compares `.env` against `.env.example`, detects missing variables, undocumented variables, empty values, and possible secrets leaked into `.env.example`.

**[Documentation](https://albertoarena.github.io/envaudit/)**

## Installation

```bash
# Install globally
npm install -g @albertoarena/envaudit

# Or run directly with npx
npx @albertoarena/envaudit check
```

## Usage

### Check (audit)

```bash
# Auto-detects .env and .env.example in current directory
envaudit check

# Custom paths
envaudit check --env .env.local --example .env.example

# CI mode — exits with code 1 if errors found
envaudit check --ci
```

Output categories:
- **Errors (✗):** Missing variables, possible secrets in `.env.example`, unquoted values with spaces
- **Warnings (⚠):** Undocumented variables, empty values

### Diff

Compare any two env files:

```bash
envaudit diff .env.staging .env.production
```

Shows keys only in each file and keys with different values. Secret-looking values are masked.

### Sync

Add missing keys between `.env` and `.env.example`:

```bash
# Preview changes
envaudit sync --dry-run

# Apply changes
envaudit sync
```

### Doc

Generate markdown documentation of all env variables:

```bash
envaudit doc > ENV.md
```

Outputs a table grouped by prefix (DB_, APP_, AWS_, etc.) with columns: Variable, Required, Default, Group.

## CI Integration

### GitHub Actions

Use the action:

```yaml
- uses: albertoarena/envaudit@v1
  with:
    ignore-empty: true   # secrets injected at runtime
```

Inputs (all optional): `command` (default `check`), `env`, `example`, `ci` (default `true`), `ignore-empty`, `no-color` (default `true`). The tool version is whatever tag you pin (`@v1`, `@v1.1.0`).

Or call the CLI directly:

```yaml
- name: Audit env files
  run: npx @albertoarena/envaudit@1.1.0 check --ci --no-color
```

**Heads up:** `.env` is usually gitignored, so on a fresh checkout only `.env.example` exists and `check` has nothing to compare against. Two realistic setups:

**A. Validate `.env.example` only** (typical for public repos). Catches leaked secrets, unquoted values with spaces, and duplicate keys in the example file itself:

```yaml
- run: cp .env.example .env
- uses: albertoarena/envaudit@v1
  with:
    ignore-empty: true
```

**B. Validate the real env in a deploy pipeline.** Build `.env` from GitHub Secrets, then confirm nothing declared in the example is missing before shipping:

```yaml
- name: Build .env
  run: |
    cp .env.example .env
    echo "DB_PASSWORD=${{ secrets.DB_PASSWORD }}" >> .env
    echo "APP_KEY=${{ secrets.APP_KEY }}" >> .env
- uses: albertoarena/envaudit@v1
```

### GitLab CI

```yaml
audit-env:
  script:
    - cp .env.example .env
    - npx @albertoarena/envaudit check --ci --no-color --ignore-empty
```

## Options

| Flag | Description |
|------|-------------|
| `--env <path>` | Path to .env file (default: `.env`) |
| `--example <path>` | Path to .env.example (default: `.env.example`) |
| `--ci` | Exit with code 1 if errors found |
| `--ignore-empty` | Skip empty value warnings (useful in CI) |
| `--dry-run` | Show sync changes without writing |
| `--no-color` | Disable colored output |
| `--help, -h` | Show help |
| `--version, -v` | Show version |

## Requirements

- Node.js >= 18
- Zero npm dependencies

## License

MIT
