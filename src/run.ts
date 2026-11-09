/**
 * run.ts — 命令注册与退出码
 * ---------------------------------------------------------------------------
 * 通用设施：只负责版本 / 帮助 / 未知命令 / 异常转退出码；
 * 具体命令由调用方注册，cli 包不出现任何领域命令。
 */

import { parseArgs, type ParsedArgs } from './args.ts'
import { processContext, type CliContext } from './context.ts'

export interface CommandSpec {
  /** 单条命令的 help；缺省时回落到全局 usage */
  help?: string
  run: (args: ParsedArgs, ctx: CliContext) => number
}

export interface CliSpec {
  /** 用于错误与帮助文案，例如 `ultime` */
  name: string
  version: string
  usage: string
  commands: Record<string, CommandSpec>
}

export function runCli(spec: CliSpec, argv: string[], ctx: CliContext = processContext()): number {
  const args = parseArgs(argv)

  if (args.flags.version) {
    ctx.out(spec.version)
    return 0
  }
  if (args.flags.help) {
    ctx.out(args.command && spec.commands[args.command]?.help ? spec.commands[args.command]!.help! : spec.usage)
    return 0
  }
  if (!args.command) {
    ctx.out(spec.usage)
    return 1
  }

  const command = spec.commands[args.command]
  if (!command) {
    ctx.err(`✗ 未知命令：${args.command}\n`)
    ctx.out(spec.usage)
    return 1
  }

  try {
    return command.run(args, ctx)
  } catch (error) {
    ctx.err(`✗ ${error instanceof Error ? error.message : String(error)}`)
    return 1
  }
}
