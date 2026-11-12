/**
 * error.ts — 机器可读错误
 * ---------------------------------------------------------------------------
 * 命令抛 `CliError`，`runCli` 统一转成人类文案或 `--json` 结构；
 * 普通异常没有字段信息，退化成 `code: 'ERROR'`，退出码 1。
 */

export interface CliErrorOptions {
  /** 稳定错误码，例如 `USAGE` / `CONFIG`；上层可追加自己的码。 */
  code: string
  /** 出错位置：字段路径或参数名。 */
  path?: string
  /** 可执行的修复建议。 */
  hint?: string
  /** 附加诊断数据，原样进入 JSON 输出。 */
  details?: unknown
  /** 退出码，默认 2（用法或配置错误）。 */
  exitCode?: number
}

export class CliError extends Error {
  readonly code: string
  readonly path?: string
  readonly hint?: string
  readonly details?: unknown
  readonly exitCode: number

  constructor(message: string, options: CliErrorOptions) {
    super(message)
    this.name = 'CliError'
    this.code = options.code
    this.path = options.path
    this.hint = options.hint
    this.details = options.details
    this.exitCode = options.exitCode ?? 2
  }
}

export interface CliErrorShape {
  code: string
  message: string
  path?: string
  hint?: string
  details?: unknown
}

export function toErrorShape(error: unknown): CliErrorShape {
  if (error instanceof CliError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.path === undefined ? {} : { path: error.path }),
      ...(error.hint === undefined ? {} : { hint: error.hint }),
      ...(error.details === undefined ? {} : { details: error.details }),
    }
  }
  return { code: 'ERROR', message: error instanceof Error ? error.message : String(error) }
}
