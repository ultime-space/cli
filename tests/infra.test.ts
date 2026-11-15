import { describe, expect, it } from 'vite-plus/test'
import {
  CliError,
  EXIT_FAIL,
  EXIT_OK,
  EXIT_USAGE,
  exitCodeOf,
  flagBool,
  flagValue,
  parseArgs,
  reportError,
  runCli,
  type CliContext,
  type CliSpec,
  type ParsedArgs,
} from '../src/index.ts'

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

class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly path: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

const strict: CliSpec = {
  name: 'demo',
  version: '1.2.3',
  usage: 'demo <command>',
  commands: {
    deploy: {
      help: 'demo deploy [--dry-run] [--config <path>] [--force]',
      flags: { 'dry-run': 'boolean', config: 'string', force: 'boolean' },
      run: (args, ctx) => {
        ctx.out(`${args.positional.join(',')}|${flagBool(args, 'dry-run')}|${flagValue(args, 'config') ?? '-'}`)
        return EXIT_OK
      },
    },
    status: {
      flags: {},
      run: () => EXIT_OK,
    },
    slow: {
      flags: {},
      run: async () => {
        await Promise.resolve()
        return 7
      },
    },
    boom: {
      flags: {},
      run: async () => {
        await Promise.resolve()
        throw new CliError('部署失败', { code: 'DEPLOY', details: { step: 'upload' } })
      },
    },
    domain: {
      flags: {},
      run: () => {
        throw new DomainError('目标不存在', 'DF3006', 'hero')
      },
    },
  },
  mapError: (error) =>
    error instanceof DomainError ? new CliError(error.message, { code: error.code, path: error.path }) : undefined,
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

describe('cli · 参数 schema', () => {
  const flags = { check: 'boolean', config: 'string' } as const

  it('声明为布尔的 flag 不吞后面的 positional', () => {
    expect(parseArgs(['remove', '--delete', 'hero'], { flags: { delete: 'boolean' } })).toEqual({
      command: 'remove',
      flags: { delete: true },
      positional: ['hero'],
    })
  })

  it('声明为布尔的 flag 不吞后面的命令', () => {
    expect(parseArgs(['--check', 'build'], { flags })).toEqual({
      command: 'build',
      flags: { check: true },
      positional: [],
    })
  })

  it('声明为字符串的 flag 取值，空字符串也是值', () => {
    expect(parseArgs(['run', '--config', 'a.json'], { flags }).flags).toEqual({ config: 'a.json' })
    expect(parseArgs(['run', '--config', ''], { flags }).flags).toEqual({ config: '' })
  })

  it('schema 下未声明的 flag 不吞后面的值', () => {
    expect(parseArgs(['run', '--unknown', 'value'], { flags })).toEqual({
      command: 'run',
      flags: { unknown: true },
      positional: ['value'],
    })
  })

  it('-- 之后全部按 positional 处理', () => {
    expect(parseArgs(['note', 'hero', '--', '--not-a-flag', '-x'], { flags: { clear: 'boolean' } })).toEqual({
      command: 'note',
      flags: {},
      positional: ['hero', '--not-a-flag', '-x'],
    })
    expect(parseArgs(['--', 'build'])).toEqual({ command: 'build', flags: {}, positional: [] })
  })

  it('--key= 与 --key "" 都保留空字符串', () => {
    expect(parseArgs(['run', '--title=']).flags).toEqual({ title: '' })
    expect(parseArgs(['run', '--title', '']).flags).toEqual({ title: '' })
  })
})

describe('cli · 声明与校验', () => {
  it('布尔 flag 写在 positional 前也能正确分发', async () => {
    const { ctx, out } = collector()
    expect(await runCli(strict, ['deploy', '--dry-run', 'target', '--config', 'a.json'], ctx)).toBe(EXIT_OK)
    expect(out).toEqual(['target|true|a.json'])
  })

  it('未知参数报用法错误，退出码 2', async () => {
    const { ctx, err } = collector()
    expect(await runCli(strict, ['deploy', '--titel', 'x'], ctx)).toBe(EXIT_USAGE)
    expect(err.join('\n')).toContain('未知参数：--titel')
    expect(err.join('\n')).toContain('--config')
  })

  it('带值 flag 缺值报用法错误', async () => {
    const { ctx, err } = collector()
    expect(await runCli(strict, ['deploy', '--config'], ctx)).toBe(EXIT_USAGE)
    expect(err.join('\n')).toContain('--config 需要一个值')
  })

  it('布尔 flag 不接受显式值', async () => {
    const { ctx, err } = collector()
    expect(await runCli(strict, ['deploy', '--dry-run=false'], ctx)).toBe(EXIT_USAGE)
    expect(err.join('\n')).toContain('布尔参数不接受值')
  })

  it('空 schema 不接受业务参数，但保留 --json', async () => {
    const denied = collector()
    expect(await runCli(strict, ['status', '--verbose'], denied.ctx)).toBe(EXIT_USAGE)
    expect(denied.err.join('\n')).toContain('未知参数：--verbose')

    const allowed = collector()
    expect(await runCli(strict, ['status', '--json'], allowed.ctx)).toBe(EXIT_OK)
  })

  it('命令可以是异步的', async () => {
    expect(await runCli(strict, ['slow'], collector().ctx)).toBe(7)
  })

  it('异步异常也走统一错误输出', async () => {
    const { ctx, err } = collector()
    expect(await runCli(strict, ['boom'], ctx)).toBe(EXIT_USAGE)
    expect(err.join('\n')).toContain('✗ 部署失败')
  })

  it('mapError 把领域错误转成 CliError', async () => {
    const { ctx, err } = collector()
    expect(await runCli(strict, ['--json', 'domain'], ctx)).toBe(EXIT_USAGE)
    expect(JSON.parse(err.join('\n'))).toEqual({ error: { code: 'DF3006', message: '目标不存在', path: 'hero' } })
  })

  it('help 可以是函数，按 positional 给出二级帮助', async () => {
    const { ctx, out } = collector()
    const nested: CliSpec = {
      name: 'demo',
      version: '1.2.3',
      usage: 'demo <command>',
      commands: {
        new: {
          flags: {},
          help: (args) => (args.positional[0] === 'page' ? 'new page help' : 'new help'),
          run: () => EXIT_OK,
        },
      },
    }
    expect(await runCli(nested, ['new', 'page', '--help'], ctx)).toBe(EXIT_OK)
    expect(out).toEqual(['new page help'])
  })

  it('flags 必须全部声明或全部省略', async () => {
    const mixed: CliSpec = {
      name: 'demo',
      version: '1.2.3',
      usage: 'demo <command>',
      commands: {
        legacy: { run: () => EXIT_OK },
        strict: { flags: {}, run: () => EXIT_OK },
      },
    }
    await expect(runCli(mixed, ['legacy'], collector().ctx)).rejects.toThrow('flags')
  })

  it('同名 flag 类型冲突直接报错', async () => {
    const conflict: CliSpec = {
      name: 'demo',
      version: '1.2.3',
      usage: 'demo <command>',
      commands: {
        first: { flags: { value: 'boolean' }, run: () => EXIT_OK },
        second: { flags: { value: 'string' }, run: () => EXIT_OK },
      },
    }
    await expect(runCli(conflict, ['first'], collector().ctx)).rejects.toThrow('类型不一致')
  })
})

describe('cli · 辅助出口', () => {
  it('flagBool / flagValue 读值，缺值时抛 CliError', () => {
    const args: ParsedArgs = { command: 'run', flags: { check: true, config: 'a.json' }, positional: [] }
    expect(flagBool(args, 'check')).toBe(true)
    expect(flagBool(args, 'missing')).toBe(false)
    expect(flagValue(args, 'config')).toBe('a.json')
    expect(flagValue(args, 'missing')).toBeUndefined()
    expect(() => flagValue({ ...args, flags: { config: true } }, 'config')).toThrow(CliError)
  })

  it('exitCodeOf / reportError / 退出码常量可直接复用', () => {
    const { ctx, err } = collector()
    expect(EXIT_OK).toBe(0)
    expect(EXIT_FAIL).toBe(1)
    expect(EXIT_USAGE).toBe(2)
    expect(exitCodeOf(new Error('boom'))).toBe(EXIT_FAIL)
    expect(exitCodeOf(new CliError('bad', { code: 'USAGE' }))).toBe(EXIT_USAGE)

    reportError(ctx, new CliError('缺少 --config', { code: 'USAGE', path: '--config', hint: '补上' }), false)
    expect(err).toEqual(['✗ 缺少 --config', '  位置：--config', '  提示：补上'])
  })
})

describe('cli · 运行时', () => {
  it('版本与全局帮助不执行命令', async () => {
    const { ctx, out } = collector()
    expect(await runCli(spec, ['--version'], ctx)).toBe(0)
    expect(await runCli(spec, ['--help'], ctx)).toBe(0)
    expect(out).toEqual(['1.2.3', 'demo <command>'])
  })

  it('命令帮助优先于全局 usage', async () => {
    const { ctx, out } = collector()
    expect(await runCli(spec, ['echo', '--help'], ctx)).toBe(0)
    expect(out).toEqual(['demo echo [--text]'])
  })

  it('单命令 help 缺省时按命令名生成', async () => {
    const { ctx, out } = collector()
    expect(await runCli(spec, ['status', '--help'], ctx)).toBe(0)
    expect(out).toEqual(['demo status [options]'])
  })

  it('无命令返回 2 并输出 usage', async () => {
    const { ctx, out } = collector()
    expect(await runCli(spec, [], ctx)).toBe(2)
    expect(out).toEqual(['demo <command>'])
  })

  it('--json 下无命令只写 stderr', async () => {
    const { ctx, err, out } = collector()
    expect(await runCli(spec, ['--json'], ctx)).toBe(2)
    expect(out).toEqual([])
    const payload = JSON.parse(err.join('\n')) as { error: { code: string; message: string; hint?: string } }
    expect(payload.error.code).toBe('USAGE')
    expect(payload.error.message).toBe('缺少命令')
    expect(payload.error.hint).toContain('ping')
  })

  it('未知命令返回 2，并给最近候选', async () => {
    const { ctx, err, out } = collector()
    expect(await runCli(spec, ['statsu'], ctx)).toBe(2)
    expect(err.join('\n')).toContain('未知命令')
    expect(err.join('\n')).toContain('是否想用 status')
    expect(out.join('\n')).toContain('demo <command>')
  })

  it('未知命令没有候选时列出可用命令', async () => {
    const { ctx, err } = collector()
    expect(await runCli(spec, ['zzzz'], ctx)).toBe(2)
    expect(err.join('\n')).toContain('可用命令：ping / echo')
  })

  it('原型链上的名字按未知命令处理', async () => {
    for (const name of ['constructor', '__proto__', 'toString']) {
      const { ctx, err } = collector()
      expect(await runCli(spec, [name], ctx)).toBe(2)
      expect(err.join('\n')).toContain(`未知命令：${name}`)
    }
  })

  it('未知命令的帮助不回显成已注册命令', async () => {
    const { ctx, out } = collector()
    expect(await runCli(spec, ['constructor', '--help'], ctx)).toBe(0)
    expect(out).toEqual(['demo <command>'])
  })

  it('普通异常返回 1，不误报成用法错误', async () => {
    const failed = collector()
    expect(await runCli(spec, ['fail'], failed.ctx)).toBe(1)
    expect(failed.err.join('\n')).toContain('boom')

    const raw = collector()
    expect(await runCli(spec, ['raw'], raw.ctx)).toBe(1)
    expect(raw.err.join('\n')).toContain('raw failure')
  })

  it('CliError 带码、位置与提示，默认退出码 2', async () => {
    const { ctx, err } = collector()
    expect(await runCli(spec, ['usage'], ctx)).toBe(2)
    expect(err).toEqual(['✗ 缺少 --config', '  位置：--config', '  提示：补上 --config <path>'])
  })

  it('CliError 可覆盖退出码', async () => {
    const { ctx } = collector()
    expect(await runCli(spec, ['config'], ctx)).toBe(1)
  })

  it('--json 输出机器可读错误，失败不写 stdout', async () => {
    const { ctx, err, out } = collector()
    expect(await runCli(spec, ['--json', 'config'], ctx)).toBe(1)
    expect(out).toEqual([])
    expect(JSON.parse(err.join('\n'))).toEqual({
      error: { code: 'CONFIG', message: '配置文件无法解析', details: { file: 'a.json' } },
    })
  })

  it('--json 下未知命令也只写 stderr', async () => {
    const { ctx, err, out } = collector()
    expect(await runCli(spec, ['--json', 'statsu'], ctx)).toBe(2)
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

  it('分发给注册的命令并保留退出码与上下文', async () => {
    const { ctx, out } = collector()
    expect(await runCli(spec, ['ping'], ctx)).toBe(0)
    expect(await runCli(spec, ['status'], ctx)).toBe(2)
    expect(await runCli(spec, ['echo', '--text', 'hi'], ctx)).toBe(0)
    expect(out).toEqual(['pong', 'hi@/demo'])
  })
})
