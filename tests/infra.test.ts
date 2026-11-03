import { describe, expect, it } from 'vite-plus/test'
import { parseArgs, runCli, type CliContext, type CliSpec } from '../src/index.ts'

function collector() {
  const out: string[] = []
  const err: string[] = []
  const ctx: CliContext = { cwd: process.cwd(), out: (line) => out.push(line), err: (line) => err.push(line) }
  return { ctx, out, err }
}

const spec: CliSpec = {
  name: 'demo',
  version: '1.2.3',
  usage: 'demo <command>',
  commands: {
    ping: { run: (_args, ctx) => (ctx.out('pong'), 0) },
    fail: {
      run: () => {
        throw new Error('boom')
      },
    },
  },
}

describe('cli · 参数', () => {
  it('解析命令、flag 与 key=value', () => {
    const args = parseArgs(['build', '--check', '--config=foo.json', '--cwd', 'dir'])
    expect(args.command).toBe('build')
    expect(args.flags).toEqual({ check: true, config: 'foo.json', cwd: 'dir' })
  })
})

describe('cli · 运行时', () => {
  it('版本与帮助不执行命令', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, ['--version'], ctx)).toBe(0)
    expect(out).toEqual(['1.2.3'])
  })

  it('未知命令与异常都转成退出码 1', () => {
    const unknown = collector()
    expect(runCli(spec, ['nope'], unknown.ctx)).toBe(1)
    expect(unknown.err.join('\n')).toContain('未知命令')
    expect(unknown.out.join('\n')).toContain('demo <command>')

    const failed = collector()
    expect(runCli(spec, ['fail'], failed.ctx)).toBe(1)
    expect(failed.err.join('\n')).toContain('boom')
  })

  it('分发给注册的命令', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, ['ping'], ctx)).toBe(0)
    expect(out).toEqual(['pong'])
  })
})
