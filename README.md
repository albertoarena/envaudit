# envaudit

Zero-dependency CLI to audit, compare and sync `.env` files.

Compares `.env` against `.env.example`, detects missing variables, undocumented variables, empty values, and possible secrets leaked into `.env.example`.

**[Documentation](https://albertoarena.github.io/envaudit/)**

## Installation

```bash
# Install globally
npm install -g envaudit

# Or run directly with npx
npx envaudit check
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
- **Errors (✗):** Missing variables, possible secrets in `.env.example`
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

Add to your CI pipeline to catch env mismatches early:

```yaml
# GitHub Actions
- name: Check env files
  run: npx envaudit check --ci --no-color
```

```yaml
# GitLab CI
check-env:
  script:
    - npx envaudit check --ci --no-color
```

## Options

| Flag | Description |
|------|-------------|
| `--env <path>` | Path to .env file (default: `.env`) |
| `--example <path>` | Path to .env.example (default: `.env.example`) |
| `--ci` | Exit with code 1 if errors found |
| `--dry-run` | Show sync changes without writing |
| `--no-color` | Disable colored output |
| `--help, -h` | Show help |
| `--version, -v` | Show version |

## Requirements

- Node.js >= 18
- Zero npm dependencies

## License

MIT
