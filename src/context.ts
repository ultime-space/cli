import { supportsColor } from './style.ts'

/** 命令上下文：把「往哪写、怎么写」抽出来，测试里换成内存收集器即可，不用起子进程。 */
export interface CliContext {
  /** 工作目录：配置与产物路径都相对它解析 */
  cwd: string
  out: (line: string) => void
  err: (line: string) => void
  /** 是否启用颜色；未设置视为关闭，测试与管道输出默认无色 */
  color?: boolean
}

export function processContext(): CliContext {
  return {
    cwd: process.cwd(),
    out: (line) => console.log(line),
    err: (line) => console.error(line),
    color: supportsColor(process.stderr),
  }
}
