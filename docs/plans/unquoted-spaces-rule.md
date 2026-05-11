# Plan: Detect unquoted values with spaces

## Problem

When a `.env` value contains spaces and is not quoted, most dotenv parsers (PHP, Ruby, some Node.js) fail at runtime with a parse error. This is a common issue when deployment tools generate `.env` values via `sed` or templating without wrapping them in quotes.

Example:
```
# Fails at runtime
APP_NAME=My Application

# Works correctly
APP_NAME="My Application"
```

envaudit should catch this before deployment.

## Current behavior

The parser (`src/parser.js`) silently strips inline comments at ` #` boundaries and trims values. For `APP_NAME=My Application`, it would parse the value as `My Application` without flagging anything. The issue is invisible to all existing rules because they operate on the parsed `Map<key, value>`, not on raw lines.

## Design

### Why a raw-line rule, not a parsed-Map rule

The existing rules (`missing`, `undocumented`, `empty-values`, `secrets`) all operate on `Map<string, string>` — the parsed key-value pairs. But this rule needs access to the **raw line text** to determine whether quotes are present. By the time the parser returns, that information is lost.

Two options:
1. **New rule that operates on raw file content** (preferred)
2. Change the parser to return quoting metadata

Option 1 is simpler and avoids touching the parser, which all other commands depend on.

### New rule file: `src/rules/unquoted-spaces.js`

```
function findUnquotedSpaces(content)
```

- Input: raw file content as a string (not a parsed Map)
- Output: array of `{ key, value, line }` objects (line is 1-based line number)
- Logic:
  1. Split content by `\n`
  2. For each line:
     - Skip empty lines, comment lines (`#`)
     - Strip `export ` prefix if present
     - Find first `=` to split key/value
     - Skip if no `=` found
     - Trim the raw value (everything after first `=`)
     - Skip if value is empty
     - Skip if value starts+ends with `"` or `'` (already quoted)
     - Strip inline comment (` #`) before checking for spaces
     - If remaining value contains a space, flag it

### Changes to `src/commands/check.js`

- Import `findUnquotedSpaces` from the new rule
- Read raw file content for the `.env` file (using `readFileSync` directly)
- Call `findUnquotedSpaces(content)` and report results as **errors**
- Each error prints:
  ```
  Unquoted value with spaces
    ✗ APP_NAME (line 1)
      Value contains spaces — wrap in quotes: APP_NAME="My Application"
  ```
- Increment `errorCount` for each finding
- This is an error (not a warning) because it causes runtime parser failures

### Changes to `src/parser.js`

- Export a new `parseEnvLines(content)` function that returns raw content, or simply have check.js read the file content itself and pass it to both the parser and the new rule
- Preferred: check.js reads the file with `readFileSync`, passes content to `parseEnvContent()` (already exported) and to `findUnquotedSpaces()` — no parser changes needed

### Changes to `bin/envaudit.js`

None. The `check` command already receives options and the rule runs internally.

### CLI behavior

- The rule is **always enabled** during `check` — no opt-out flag needed
- `--ci` mode: unquoted spaces count as errors, so they cause exit code 1
- No new CLI flags required

## Files to change

| File | Change |
|------|--------|
| `src/rules/unquoted-spaces.js` | New file — the detection rule |
| `src/commands/check.js` | Import new rule, read raw content, report errors |
| `tests/check.test.js` | Add test cases for unquoted spaces detection |
| `tests/rules/unquoted-spaces.test.js` | Unit tests for the rule function |
| `tests/fixtures/` | Add fixture `.env` files with unquoted space values |
| `CLAUDE.md` | Add rule to project structure and CLI docs |
| `README.md` | Document the new check |
| `docs/` / `website/` | Update if they document check rules |

## Test cases

### Should flag (errors)
- `APP_NAME=My Application` — unquoted value with space
- `TITLE=Hello World Foo` — multiple spaces
- `KEY=value with spaces # and comment` — space in value part (before inline comment)

### Should NOT flag
- `APP_NAME="My Application"` — double-quoted
- `APP_NAME='My Application'` — single-quoted
- `APP_NAME=MyApplication` — no spaces
- `APP_NAME=` — empty value
- `# This is a comment with spaces` — comment line
- ` ` / empty lines — skip
- `export APP_NAME="My App"` — export prefix, but value is quoted

## Edge cases

- `KEY=value # comment with spaces`: the value is `value` (no space), should NOT flag
- `KEY=two words # comment`: the value is `two words` (has space), SHOULD flag
- Lines with only whitespace: skip
- `KEY="unmatched quote`: not clearly quoted — out of scope, don't flag (matches current parser behavior)

## Execution order

1. Create `src/rules/unquoted-spaces.js` with `findUnquotedSpaces(content)`
2. Create `tests/rules/unquoted-spaces.test.js` with unit tests
3. Add fixture files in `tests/fixtures/`
4. Update `src/commands/check.js` to use the new rule
5. Update integration tests in `tests/check.test.js`
6. Run `node --test tests/` to verify
7. Update documentation (CLAUDE.md, README.md, website/docs if applicable)
