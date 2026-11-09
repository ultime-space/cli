import { describe, expect, it } from 'vite-plus/test'
import { parseArgs, runCli, type CliContext, type CliSpec } from '../src/index.ts'

function collector() {
  const out: string[] = []
  const err: string[] = []
  const ctx: CliContext = { cwd: '/demo', out: (line) => out.push(line), err: (line) => err.push(line) }
  return { ctx, out, err }
}

const spec: CliSpec = {
  name: 'demo',
  version: '1.2.3',
  usage: 'demo <command>',
  commands: {
    ping: { run: (_args, ctx) => (ctx.out('pong'), 0) },
    echo: {
      help: 'demo echo [--text]',
      run: (args, ctx) => (ctx.out(`${args.flags.text ?? ''}@${ctx.cwd}`), 0),
    },
    status: { run: () => 2 },
    fail: {
      run: () => {
        throw new Error('boom')
      },
    },
    raw: {
      run: () => {
        throw 'raw failure'
      },
    },
  },
}

describe('cli · 参数', () => {
  it('解析命令、布尔 flag、带值 flag 与 key=value', () => {
    const args = parseArgs(['build', '--check', '--config=foo.json', '--cwd', 'dir'])
    expect(args.command).toBe('build')
    expect(args.flags).toEqual({ check: true, config: 'foo.json', cwd: 'dir' })
  })

  it('保留 -h / -v，收集位置参数', () => {
    const args = parseArgs(['-h', 'run', 'a', '--version', 'b'])
    expect(args.flags).toEqual({ help: true, version: true })
    expect(args.command).toBe('run')
    expect(args.positional).toEqual(['a', 'b'])
  })

  it('末尾缺值的 flag 视为布尔值', () => {
    expect(parseArgs(['run', '--check']).flags).toEqual({ check: true })
    expect(parseArgs(['run', '--check', '--next']).flags).toEqual({ check: true, next: true })
  })

  it('空参数返回空命令', () => {
    expect(parseArgs([])).toEqual({ command: '', flags: {}, positional: [] })
  })
})

describe('cli · 运行时', () => {
  it('版本与全局帮助不执行命令', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, ['--version'], ctx)).toBe(0)
    expect(runCli(spec, ['--help'], ctx)).toBe(0)
    expect(out).toEqual(['1.2.3', 'demo <command>'])
  })

  it('命令帮助优先于全局 usage', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, ['echo', '--help'], ctx)).toBe(0)
    expect(out).toEqual(['demo echo [--text]'])
  })

  it('无命令返回 1 并输出 usage', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, [], ctx)).toBe(1)
    expect(out).toEqual(['demo <command>'])
  })

  it('未知命令与异常都转成退出码 1', () => {
    const unknown = collector()
    expect(runCli(spec, ['nope'], unknown.ctx)).toBe(1)
    expect(unknown.err.join('\n')).toContain('未知命令')
    expect(unknown.out.join('\n')).toContain('demo <command>')

    const failed = collector()
    expect(runCli(spec, ['fail'], failed.ctx)).toBe(1)
    expect(failed.err.join('\n')).toContain('boom')

    const raw = collector()
    expect(runCli(spec, ['raw'], raw.ctx)).toBe(1)
    expect(raw.err.join('\n')).toContain('raw failure')
  })

  it('分发给注册的命令并保留退出码与上下文', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, ['ping'], ctx)).toBe(0)
    expect(runCli(spec, ['status'], ctx)).toBe(2)
    expect(runCli(spec, ['echo', '--text', 'hi'], ctx)).toBe(0)
    expect(out).toEqual(['pong', 'hi@/demo'])
  })
})
