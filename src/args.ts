/**
 * args.ts — 命令行参数解析（纯函数）与 flag 读取
 * ---------------------------------------------------------------------------
 * 只认三种形态：`command`、`--flag`、`--key value` / `--key=value`；
 * 不引第三方解析库 —— CLI 必须零依赖可跑。
 * 传入 `flags` schema 时，声明为布尔的 flag 永不消费下一个 token；
 * 未声明的 flag 也按布尔处理，交给上层校验拒绝。
 */

import { CliError } from './error.ts'

export interface ParsedArgs {
  command: string
  flags: Record<string, string | true>
  positional: string[]
}

export type FlagType = 'boolean' | 'string'

/** 命令级 flag 声明：布尔不吞值，字符串取下一个 token。 */
export type FlagSpec = Record<string, FlagType>

export interface ParseOptions {
  flags?: FlagSpec
}

/** 通用布尔 flag：只表达输出形态，不承载业务语义。 */
const RESERVED_BOOLEAN = new Set(['help', 'version', 'json'])

function isBooleanFlag(name: string, spec: FlagSpec | undefined): boolean {
  if (RESERVED_BOOLEAN.has(name)) return true
  if (!spec) return false
  return spec[name] !== 'string'
}

export function parseArgs(argv: string[], options: ParseOptions = {}): ParsedArgs {
  const flags: Record<string, string | true> = {}
  const positional: string[] = []
  const spec = options.flags
  let command = ''

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (token === '--') {
      for (const rest of argv.slice(i + 1)) {
        if (!command) command = rest
        else positional.push(rest)
      }
      break
    }
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
      if (isBooleanFlag(body, spec)) {
        flags[body] = true
        continue
      }
      const next = argv[i + 1]
      if (next !== undefined && !next.startsWith('-')) {
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

/** 读带值 flag；被解析成布尔说明缺值，直接报用法错误。 */
export function flagValue(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags[name]
  if (value === true) {
    throw new CliError(`--${name} 需要一个值`, {
      code: 'USAGE',
      path: `--${name}`,
      hint: `补上 --${name} <value>`,
    })
  }
  return value
}

/** 读布尔 flag：只有显式 true 才算开启，字符串值不误判。 */
export function flagBool(args: ParsedArgs, name: string): boolean {
  return args.flags[name] === true
}
