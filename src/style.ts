export type StyleFormat = 'red' | 'yellow' | 'dim'

const CODES: Record<StyleFormat, string> = {
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  dim: '\u001b[2m',
}
const RESET = '\u001b[0m'

/** 颜色优先级：FORCE_COLOR > NO_COLOR / NODE_DISABLE_COLORS > TERM > TTY。 */
export function supportsColor(
  stream: { isTTY?: boolean } = process.stderr,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const force = env.FORCE_COLOR
  if (force !== undefined) return force !== '0' && force !== 'false'
  if (env.NO_COLOR || env.NODE_DISABLE_COLORS) return false
  if (env.TERM === 'dumb') return false
  return Boolean(stream.isTTY)
}

/**
 * 颜色只由调用方决定；只保留 error / warn / 弱化三个语义色。
 * 自研 ANSI，不引着色库，也不依赖运行时着色实现。
 */
export function style(enabled: boolean | undefined, format: StyleFormat, text: string): string {
  return enabled ? `${CODES[format]}${text}${RESET}` : text
}
