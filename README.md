# cli

**通用命令行设施**：参数解析、命令注册、上下文与退出码。零领域依赖，不内置任何具体命令。

[![license](https://img.shields.io/badge/license-MIT-black)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22.18-black)](./package.json)

```bash
pnpm add @ultime/cli
```

需要 Node >= 22.18；包发的是编译后的 ESM（`dist/`），类型来自 `dist/*.d.ts`。

## 用它做什么

包作者只写自己的命令，参数、help、未知命令与退出码交给本包：

```ts
import { runCli, processContext } from '@ultime/cli'

const spec = {
  name: 'my-cli',
  version: '0.1.0',
  usage: 'my-cli <command>',
  commands: {
    build: {
      help: 'my-cli build [--check]',
      run: (args, ctx) => {
        ctx.out(`check=${Boolean(args.flags.check)}`)
        return 0
      },
    },
  },
}

process.exitCode = runCli(spec, process.argv.slice(2), processContext())
```

## 出口

| 入口 | 提供 |
|---|---|
| `@ultime/cli` | `parseArgs` / `runCli` / `processContext` / `CliError` / `toErrorShape` / `CliContext` / `CliSpec` / `CommandSpec` |

`parseArgs` 只认 `command`、`--flag`、`--key value` / `--key=value`；`-h/--help`、`-v/--version` 与 `--json` 是保留 flag。

## 错误与退出码

命令用 `CliError` 抛机器可读错误；普通异常退化成 `code: 'ERROR'`：

```ts
import { CliError } from '@ultime/cli'

throw new CliError('缺少 --config', {
  code: 'USAGE',
  path: '--config',
  hint: '补上 --config <path>',
})
```

| 情况 | 退出码 |
|---|---|
| 版本 / 帮助 | 0 |
| 命令返回的码 | 原样透传 |
| 命令抛普通异常 | 1，`code: 'ERROR'` |
| `CliError` | `exitCode`，默认 2（用法或配置错误） |
| 无命令、未知命令 | 2 |

- 未知命令给最近候选；没有候选时列出可用命令。
- `--json` 时错误只写 stderr：

```json
{ "error": { "code": "USAGE", "message": "缺少 --config", "path": "--config", "hint": "补上 --config <path>" } }
```

- 人类文案与 JSON 同源，由 `toErrorShape` 统一转换。

AI 入口：[`llms.txt`](./llms.txt)（路由）与 [`SKILLS.md`](./SKILLS.md)（能力表）随包发布。

## 边界

- **零领域依赖**：不 import 任何领域包，也不认识具体业务对象。
- **不引第三方解析 / 着色库**：解析用零依赖实现，着色直接用 ANSI。Node 内置 `util.parseArgs` 表达不了自由 `--key value`，暂不切换。
- **不内置命令、不发 bin**：具体命令由调用方包注册，各自发布自己的 bin；本包不做命令发现与聚合。
- **不做 IO 策略**：读盘写盘、配置路径由命令自己决定；本包只提供 `cwd` 与 `out/err`。

## 目录

```text
src/
  args.ts      参数解析（纯函数）
  context.ts   命令上下文（cwd / out / err）
  error.ts     机器可读错误与统一转换
  run.ts       命令注册、help、未知命令与退出码
  index.ts     公共出口
tests/         参数、运行时分发与包内容边界
```

## 版本与兼容

- 当前 `0.2.x`；0.x 阶段 API 仍可能调整。
- 退出码语义：0 成功 / 1 命令执行失败 / 2 用法或配置错误；这是 0.2 起的新约定，升级时按本节目迁移。
- 破坏性变更写进 [CHANGELOG](./CHANGELOG.md)，并在本节目说明迁移方式。
- 发布顺序：本包是基础设施，先于依赖它的包。

## 许可

MIT，见 [LICENSE](./LICENSE)。
