/**
 * run.ts — 命令注册、退出码与错误输出
 * ---------------------------------------------------------------------------
 * 通用设施：只负责版本 / 帮助 / 未知命令 / 参数校验 / 错误转换；
 * 具体命令由调用方注册，cli 包不出现任何领域命令。
 */

import { parseArgs, type FlagSpec, type ParsedArgs } from './args.ts'
import { processContext, type CliContext } from './context.ts'
import { CliError, EXIT_OK, EXIT_USAGE, exitCodeOf, toErrorShape } from './error.ts'
import { style } from './style.ts'

export interface CommandSpec {
  /** 单条命令的 help；可以是函数，按 positional 生成二级帮助 */
  help?: string | ((args: ParsedArgs) => string)
  /** 命令级 flag 声明；声明后未知参数会被拒绝 */
  flags?: FlagSpec
  run: (args: ParsedArgs, ctx: CliContext) => number | Promise<number>
}

export interface CliSpec {
  /** 用于错误与帮助文案，例如 `my-cli` */
  name: string
  version: string
  usage: string
  /** 无命令时执行的默认命令；只影响分发，不改变 help / version。 */
  defaultCommand?: string
  commands: Record<string, CommandSpec>
  /** 把领域错误转成 CliError；返回 undefined 表示保持原样 */
  mapError?: (error: unknown) => CliError | undefined
}

/** 未知命令的候选阈值：太小漏提示，太大乱提示。 */
const SUGGEST_DISTANCE = 2

/** 全局保留 flag：不属于任何命令，也不需要命令声明。 */
const RESERVED_FLAGS = new Set(['help', 'version', 'json'])

function distance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)

  for (let row = 1; row <= left.length; row += 1) {
    const current = [row]
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1
      current[col] = Math.min(previous[col]! + 1, current[col - 1]! + 1, previous[col - 1]! + cost)
    }
    previous = current
  }

  return previous[right.length]!
}

function nearest(input: string, candidates: string[]): string | undefined {
  let best: { name: string; distance: number } | undefined

  for (const name of candidates) {
    const value = distance(input, name)
    if (value > SUGGEST_DISTANCE) continue
    if (!best || value < best.distance) best = { name, distance: value }
  }

  return best?.name
}

/** 只看自有命令，避免 constructor / __proto__ 等原型键被当成已注册命令。 */
function commandOf(commands: Record<string, CommandSpec>, name: string): CommandSpec | undefined {
  return Object.hasOwn(commands, name) ? commands[name] : undefined
}

/** 汇总所有命令的 flag 声明；全部省略时保持旧的自由解析。 */
function collectFlags(commands: Record<string, CommandSpec>): FlagSpec | undefined {
  const specs = Object.values(commands).map((command) => command.flags)
  const declared = specs.filter((spec): spec is FlagSpec => spec !== undefined)
  if (declared.length === 0) return undefined
  if (declared.length !== specs.length) {
    throw new Error('runCli: commands 的 flags 必须全部声明或全部省略')
  }

  const merged: FlagSpec = {}
  for (const spec of declared) {
    for (const [name, type] of Object.entries(spec)) {
      const existing = merged[name]
      if (existing && existing !== type) {
        throw new Error(`runCli: flag --${name} 在不同命令中的类型不一致（${existing} / ${type}）`)
      }
      merged[name] = type
    }
  }
  return merged
}

function validateFlags(args: ParsedArgs, command: CommandSpec): void {
  const spec = command.flags
  if (!spec) return

  for (const [name, value] of Object.entries(args.flags)) {
    if (RESERVED_FLAGS.has(name)) continue
    const type = spec[name]
    if (!type) {
      const available = Object.keys(spec)
        .map((key) => `--${key}`)
        .join(' / ')
      throw new CliError(`未知参数：--${name}`, {
        code: 'USAGE',
        path: `--${name}`,
        hint: `该命令可用参数：${available || '无'}`,
      })
    }
    if (type === 'boolean' && typeof value === 'string') {
      throw new CliError(`布尔参数不接受值：--${name}=${value}`, {
        code: 'USAGE',
        path: `--${name}`,
        hint: `只写 --${name}`,
      })
    }
    if (type === 'string' && value === true) {
      throw new CliError(`--${name} 需要一个值`, {
        code: 'USAGE',
        path: `--${name}`,
        hint: `补上 --${name} <value>`,
      })
    }
  }
}

export function reportError(ctx: CliContext, error: unknown, json: boolean): void {
  const shape = toErrorShape(error)
  if (json) {
    ctx.err(JSON.stringify({ error: shape }))
    return
  }

  const label = shape.code && shape.code !== 'ERROR' ? ` ${style(ctx.color, 'dim', `[${shape.code}]`)}` : ''
  ctx.err(`${style(ctx.color, 'red', '✗')}${label} ${shape.message}`)
  if (shape.path) ctx.err(`  ${style(ctx.color, 'dim', '位置：')}${shape.path}`)
  if (shape.hint) ctx.err(`  ${style(ctx.color, 'dim', '提示：')}${shape.hint}`)
}

export async function runCli(spec: CliSpec, argv: string[], ctx: CliContext = processContext()): Promise<number> {
  const args = parseArgs(argv, { flags: collectFlags(spec.commands), defaultCommand: spec.defaultCommand })
  const json = args.flags.json === true

  if (args.flags.version) {
    ctx.out(spec.version)
    return EXIT_OK
  }
  if (args.flags.help) {
    const command = args.command ? commandOf(spec.commands, args.command) : undefined
    if (!command) {
      ctx.out(spec.usage)
      return EXIT_OK
    }
    const help = command.help
    ctx.out(typeof help === 'function' ? help(args) : (help ?? `${spec.name} ${args.command} [options]`))
    return EXIT_OK
  }
  if (args.command && spec.defaultCommand && !commandOf(spec.commands, args.command)) {
    args.positional.unshift(args.command)
    args.command = spec.defaultCommand
  }
  if (!args.command && spec.defaultCommand) {
    args.command = spec.defaultCommand
  }
  if (!args.command) {
    if (json) {
      reportError(
        ctx,
        new CliError('缺少命令', {
          code: 'USAGE',
          hint: `可用命令：${Object.keys(spec.commands).join(' / ')}`,
        }),
        true,
      )
    } else {
      ctx.out(spec.usage)
    }
    return EXIT_USAGE
  }

  const command = commandOf(spec.commands, args.command)
  if (!command) {
    const suggestion = nearest(args.command, Object.keys(spec.commands))
    reportError(
      ctx,
      new CliError(`未知命令：${args.command}`, {
        code: 'USAGE',
        path: args.command,
        hint: suggestion ? `是否想用 ${suggestion}？` : `可用命令：${Object.keys(spec.commands).join(' / ')}`,
      }),
      json,
    )
    if (!json) ctx.out(spec.usage)
    return EXIT_USAGE
  }

  try {
    validateFlags(args, command)
    return await command.run(args, ctx)
  } catch (error) {
    const mapped = spec.mapError?.(error) ?? error
    reportError(ctx, mapped, json)
    return exitCodeOf(mapped)
  }
}
