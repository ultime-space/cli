/**
 * args.ts — 命令行参数解析（纯函数）
 * ---------------------------------------------------------------------------
 * 只认三种形态：`command`、`--flag`、`--key value` / `--key=value`；
 * 不引第三方解析库 —— CLI 必须零依赖可跑。
 */

export interface ParsedArgs {
  command: string
  flags: Record<string, string | true>
  positional: string[]
}

export function parseArgs(argv: string[]): ParsedArgs {
  const flags: Record<string, string | true> = {}
  const positional: string[] = []
  let command = ''

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '-h' || token === '--help') {
      flags.help = true
      continue
    }
    if (token === '-v' || token === '--version') {
      flags.version = true
      continue
    }
    if (token.startsWith('--')) {
      const body = token.slice(2)
      const equal = body.indexOf('=')
      if (equal !== -1) {
        flags[body.slice(0, equal)] = body.slice(equal + 1)
        continue
      }
      const next = argv[i + 1]
      if (next && !next.startsWith('-')) {
        flags[body] = next
        i += 1
      } else {
        flags[body] = true
      }
      continue
    }
    if (!command) command = token
    else positional.push(token)
  }

  return { command, flags, positional }
}
