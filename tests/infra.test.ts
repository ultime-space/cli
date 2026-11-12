import { describe, expect, it } from 'vite-plus/test'
import { CliError, parseArgs, runCli, type CliContext, type CliSpec } from '../src/index.ts'

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
    usage: {
      run: () => {
        throw new CliError('缺少 --config', { code: 'USAGE', path: '--config', hint: '补上 --config <path>' })
      },
    },
    config: {
      run: () => {
        throw new CliError('配置文件无法解析', { code: 'CONFIG', exitCode: 1, details: { file: 'a.json' } })
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

  it('--key=value 的值允许包含等号', () => {
    expect(parseArgs(['run', '--define=KEY=VALUE']).flags).toEqual({ define: 'KEY=VALUE' })
  })

  it('--json 固定按布尔解析，不吞后面的命令名', () => {
    expect(parseArgs(['--json', 'config'])).toEqual({ command: 'config', flags: { json: true }, positional: [] })
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

  it('单命令 help 缺省时按命令名生成', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, ['status', '--help'], ctx)).toBe(0)
    expect(out).toEqual(['demo status [options]'])
  })

  it('无命令返回 2 并输出 usage', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, [], ctx)).toBe(2)
    expect(out).toEqual(['demo <command>'])
  })

  it('未知命令返回 2，并给最近候选', () => {
    const { ctx, err, out } = collector()
    expect(runCli(spec, ['statsu'], ctx)).toBe(2)
    expect(err.join('\n')).toContain('未知命令')
    expect(err.join('\n')).toContain('是否想用 status')
    expect(out.join('\n')).toContain('demo <command>')
  })

  it('未知命令没有候选时列出可用命令', () => {
    const { ctx, err } = collector()
    expect(runCli(spec, ['zzzz'], ctx)).toBe(2)
    expect(err.join('\n')).toContain('可用命令：ping / echo')
  })

  it('普通异常返回 1，不误报成用法错误', () => {
    const failed = collector()
    expect(runCli(spec, ['fail'], failed.ctx)).toBe(1)
    expect(failed.err.join('\n')).toContain('boom')

    const raw = collector()
    expect(runCli(spec, ['raw'], raw.ctx)).toBe(1)
    expect(raw.err.join('\n')).toContain('raw failure')
  })

  it('CliError 带码、位置与提示，默认退出码 2', () => {
    const { ctx, err } = collector()
    expect(runCli(spec, ['usage'], ctx)).toBe(2)
    expect(err).toEqual(['✗ 缺少 --config', '  位置：--config', '  提示：补上 --config <path>'])
  })

  it('CliError 可覆盖退出码', () => {
    const { ctx } = collector()
    expect(runCli(spec, ['config'], ctx)).toBe(1)
  })

  it('--json 输出机器可读错误，失败不写 stdout', () => {
    const { ctx, err, out } = collector()
    expect(runCli(spec, ['--json', 'config'], ctx)).toBe(1)
    expect(out).toEqual([])
    expect(JSON.parse(err.join('\n'))).toEqual({
      error: { code: 'CONFIG', message: '配置文件无法解析', details: { file: 'a.json' } },
    })
  })

  it('--json 下未知命令也只写 stderr', () => {
    const { ctx, err, out } = collector()
    expect(runCli(spec, ['--json', 'statsu'], ctx)).toBe(2)
    expect(out).toEqual([])
    expect(JSON.parse(err.join('\n'))).toEqual({
      error: {
        code: 'USAGE',
        message: '未知命令：statsu',
        path: 'statsu',
        hint: '是否想用 status？',
      },
    })
  })

  it('分发给注册的命令并保留退出码与上下文', () => {
    const { ctx, out } = collector()
    expect(runCli(spec, ['ping'], ctx)).toBe(0)
    expect(runCli(spec, ['status'], ctx)).toBe(2)
    expect(runCli(spec, ['echo', '--text', 'hi'], ctx)).toBe(0)
    expect(out).toEqual(['pong', 'hi@/demo'])
  })
})
