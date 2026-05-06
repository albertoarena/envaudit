# CLAUDE.md — envaudit

## What is this project?

`envaudit` is a zero-dependency Node.js CLI tool that audits `.env` files. It compares `.env` against `.env.example`, detects missing variables, undocumented variables, empty values, and possible secrets leaked into `.env.example`. It can also diff any two env files and sync them.

## Design Principles

- **Zero dependencies.** No npm packages at all. Only Node.js built-in modules (`fs`, `path`, `process`). This is a hard rule — do not add any dependency.
- **KISS.** Simple code, simple architecture. No classes unless truly needed. Prefer plain functions and plain objects.
- **Works out of the box.** No config file needed. Auto-detects `.env` and `.env.example` in the current working directory.
- **Fast.** Parsing env files is trivial. The tool must run in milliseconds.
- **Single-file-friendly.** Keep the codebase as small as possible. Prefer fewer files over many tiny ones.

## Tech Stack

- Node.js (>=18)
- Zero dependencies
- ESM modules (`"type": "module"` in package.json)
- No TypeScript — plain JavaScript to keep it simple and contribution-friendly

## Project Structure

```
envaudit/
├── bin/
│   └── envaudit.js              # CLI entry point (hashbang, arg routing)
├── src/
│   ├── parser.js               # Parse .env files into key-value maps
│   ├── commands/
│   │   ├── check.js            # Main lint command
│   │   ├── diff.js             # Compare two env files
│   │   ├── sync.js             # Sync missing keys between files
│   │   └── doc.js              # Generate markdown documentation
│   ├── rules/
│   │   ├── missing.js          # Keys in .env.example but not in .env
│   │   ├── undocumented.js     # Keys in .env but not in .env.example
│   │   ├── empty-values.js     # Keys with empty values in .env
│   │   └── secrets.js          # Possible real secrets in .env.example
│   └── output.js               # Terminal output formatting (colors via ANSI codes)
├── tests/
│   └── (test files using node:test)
├── package.json
├── README.md
├── LICENSE                     # MIT
└── CLAUDE.md
```

## CLI Commands

### `envaudit check`
Main command. Compares `.env` against `.env.example` in the current directory.

Flags:
- `--env <path>` — path to .env file (default: `.env`)
- `--example <path>` — path to .env.example file (default: `.env.example`)
- `--ci` — exit code 1 if any errors found (for CI pipelines)
- `--ignore-empty` — skip empty value warnings (useful in CI where secrets are injected at runtime)
- `--no-color` — disable colored output

Output categories:
1. **Errors (✗):** Missing variables (in .env.example but not in .env), possible secrets in .env.example
2. **Warnings (⚠):** Undocumented variables (in .env but not in .env.example), empty values
3. **Summary line:** "X issues found (N errors · M warnings)" or "All good ✓"

### `envaudit diff <file1> <file2>`
Compare any two env files side by side. Shows:
- Keys only in file1
- Keys only in file2
- Keys with different values (show both values, but mask values that look like secrets)

### `envaudit sync`
Interactive-ish sync:
- Adds keys missing from `.env` (found in `.env.example`) to `.env` with empty values
- Adds undocumented keys from `.env` to `.env.example` with empty/placeholder values
- Prints what it did

Flags:
- `--dry-run` — show what would change without writing
- `--env <path>` / `--example <path>` — custom paths

### `envaudit doc`
Generate a markdown table documenting all env variables. Groups by prefix (DB_, MAIL_, AWS_, APP_, etc.). Outputs to stdout (pipe to file).

Columns: Variable | Required | Default | Group

## Parser Rules

The `.env` parser must handle:
- `KEY=value` (basic)
- `KEY="value with spaces"` (quoted)
- `KEY='value with spaces'` (single quoted)
- `KEY=` (empty value)
- Lines starting with `#` are comments (skip)
- Empty lines (skip)
- Inline comments: `KEY=value # comment` (strip comment)
- No multiline value support needed for MVP
- Trim whitespace around keys and unquoted values
- Duplicate keys: last one wins (but parser could warn)

## Secret Detection Patterns

Flag values in `.env.example` that look like real secrets (not placeholders):

**Flag as suspicious:**
- Strings longer than 12 chars with mixed case + digits + special chars
- Values starting with: `sk_`, `pk_`, `tok_`, `key_`, `ghp_`, `gho_`, `github_pat_`, `xoxb-`, `xoxp-`, `AKIA` (AWS), `whsec_`
- Values matching base64-like patterns (long alphanumeric strings 20+ chars)

**Do NOT flag:**
- Common placeholders: `your-key-here`, `xxx`, `null`, `empty`, `changeme`, `secret`, `password`, `example`, `test`, `dummy`, `fake`, `placeholder`, `TODO`, `CHANGE_ME`
- Empty values
- Boolean-like values: `true`, `false`, `1`, `0`
- Localhost URLs, `127.0.0.1`, example.com domains
- Values that are clearly not secrets (short strings, common words)

## Terminal Colors (ANSI escape codes, no dependencies)

```javascript
const colors = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};
```

Respect `NO_COLOR` env variable and `--no-color` flag (see https://no-color.org/).

## Testing

Use Node.js built-in test runner (`node:test` and `node:assert`). Test files go in `tests/` directory.

Key test cases:
- Parser handles all formats (quoted, unquoted, empty, comments, inline comments)
- `check` correctly identifies missing, undocumented, empty, secrets
- `diff` correctly shows differences between two files
- `sync` correctly adds missing keys without corrupting existing content
- Secret detection flags real secrets and ignores placeholders
- `--ci` flag returns proper exit codes
- `--no-color` produces clean uncolored output

Run tests with: `node --test tests/`

Create fixture `.env` files in `tests/fixtures/` for test cases.

## Code Style

- Use `const` by default, `let` only when reassignment is needed
- Early returns over nested ifs
- Descriptive function names, minimal comments (code should be self-explanatory)
- No semicolons (standard style)
- Single quotes for strings
- Template literals for string interpolation

## package.json key fields

```json
{
  "name": "@albertoarena/envaudit",
  "version": "0.1.4",
  "description": "Zero-dependency CLI to audit, compare and sync .env files",
  "type": "module",
  "bin": {
    "envaudit": "bin/envaudit.js"
  },
  "keywords": ["env", "dotenv", "lint", "diff", "cli", "audit", "secrets"],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  },
  "files": ["bin/", "src/", "README.md", "LICENSE"],
  "scripts": {
    "test": "node --test tests/"
  }
}
```

## What NOT to do

- Do not add any npm dependency. Not even chalk, commander, or dotenv.
- Do not use TypeScript.
- Do not create a config file system. The tool works with CLI flags only.
- Do not add AI or LLM features.
- Do not over-engineer. This is a simple tool that parses text files and compares them.
- Do not add interactive prompts (no readline for user input). Keep it non-interactive.

## Documentation

- Always align docs (README.md, website/, docs/) to any code or config change before committing and pushing.
- If a change affects install commands, CLI usage, package name, or any user-facing behavior, update all relevant documentation files.

## Pre-commit Checklist

Always run these steps before committing:

1. Run tests: `node --test tests/`
2. Update docs if the change affects user-facing behavior (README.md, website/, docs/, CLAUDE.md)
3. Commit

## Git Commit Conventions

## Format
- type: short subject line (max 50 chars)
- Detailed body paragraph explaining what and why (not how).

## Rules
- No Claude attribution - NEVER include "Generated with Claude Code" or "Co-Authored-By: Claude"
- Keep first line under 50 characters
- Use heredoc for multi-line commit messages