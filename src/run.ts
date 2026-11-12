/**
 * run.ts — 命令注册、退出码与错误输出
 * ---------------------------------------------------------------------------
 * 通用设施：只负责版本 / 帮助 / 未知命令 / 错误转换；
 * 具体命令由调用方注册，cli 包不出现任何领域命令。
 */

import { parseArgs, type ParsedArgs } from './args.ts'
import { processContext, type CliContext } from './context.ts'
import { CliError, toErrorShape } from './error.ts'

export interface CommandSpec {
  /** 单条命令的 help；缺省时生成 `<name> <command> [options]` */
  help?: string
  run: (args: ParsedArgs, ctx: CliContext) => number
}

export interface CliSpec {
  /** 用于错误与帮助文案，例如 `my-cli` */
  name: string
  version: string
  usage: string
  commands: Record<string, CommandSpec>
}

/** 未知命令的候选阈值：太小漏提示，太大乱提示。 */
const SUGGEST_DISTANCE = 2

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

function reportError(ctx: CliContext, error: unknown, json: boolean): void {
  const shape = toErrorShape(error)
  if (json) {
    ctx.err(JSON.stringify({ error: shape }))
    return
  }

  ctx.err(`✗ ${shape.message}`)
  if (shape.path) ctx.err(`  位置：${shape.path}`)
  if (shape.hint) ctx.err(`  提示：${shape.hint}`)
}

function exitCodeOf(error: unknown): number {
  return error instanceof CliError ? error.exitCode : 1
}

export function runCli(spec: CliSpec, argv: string[], ctx: CliContext = processContext()): number {
  const args = parseArgs(argv)
  const json = args.flags.json === true

  if (args.flags.version) {
    ctx.out(spec.version)
    return 0
  }
  if (args.flags.help) {
    const command = args.command ? spec.commands[args.command] : undefined
    ctx.out(command ? (command.help ?? `${spec.name} ${args.command} [options]`) : spec.usage)
    return 0
  }
  if (!args.command) {
    ctx.out(spec.usage)
    return 2
  }

  const command = spec.commands[args.command]
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
    return 2
  }

  try {
    return command.run(args, ctx)
  } catch (error) {
    reportError(ctx, error, json)
    return exitCodeOf(error)
  }
}
