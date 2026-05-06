const noColor = process.env.NO_COLOR !== undefined || process.argv.includes('--no-color')

const identity = (s) => s

const colors = noColor
  ? { red: identity, yellow: identity, green: identity, dim: identity, bold: identity }
  : {
      red: (s) => `\x1b[31m${s}\x1b[0m`,
      yellow: (s) => `\x1b[33m${s}\x1b[0m`,
      green: (s) => `\x1b[32m${s}\x1b[0m`,
      dim: (s) => `\x1b[2m${s}\x1b[0m`,
      bold: (s) => `\x1b[1m${s}\x1b[0m`,
    }

const symbols = {
  error: colors.red('✗'),
  warning: colors.yellow('⚠'),
  success: colors.green('✓'),
}

function printSummary(errors, warnings) {
  const total = errors + warnings
  if (total === 0) {
    console.log(`\n${symbols.success} ${colors.green('All good ✓')}`)
    return
  }
  const parts = []
  if (errors > 0) parts.push(`${errors} error${errors !== 1 ? 's' : ''}`)
  if (warnings > 0) parts.push(`${warnings} warning${warnings !== 1 ? 's' : ''}`)
  console.log(`\n${colors.bold(`${total} issue${total !== 1 ? 's' : ''} found`)} (${parts.join(' · ')})`)
}

export { colors, symbols, printSummary }
