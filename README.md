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
import { flagBool, flagValue, processContext, runCli } from '@ultime/cli'

const spec = {
  name: 'my-cli',
  version: '0.1.0',
  usage: 'my-cli <command>',
  commands: {
    build: {
      help: 'my-cli build [--check] [--config <path>]',
      flags: { check: 'boolean', config: 'string' },
      run: (args, ctx) => {
        ctx.out(`check=${flagBool(args, 'check')} config=${flagValue(args, 'config') ?? '-'}`)
        return 0
      },
    },
  },
}

process.exitCode = await runCli(spec, process.argv.slice(2), processContext())
```

命令可以返回 `number`，也可以返回 `Promise<number>`；`runCli` 会等待结果。

## 出口

| 入口 | 提供 |
|---|---|
| `@ultime/cli` | `parseArgs` / `flagBool` / `flagValue` / `runCli` / `reportError` / `processContext` / `CliError` / `toErrorShape` / `exitCodeOf` / `EXIT_OK` / `EXIT_FAIL` / `EXIT_USAGE` / `CliContext` / `CliSpec` / `CommandSpec` / `FlagType` / `FlagSpec` / `ParseOptions` / `ParsedArgs` / `CliErrorOptions` / `CliErrorShape` |

`parseArgs` 只认 `command`、`--flag`、`--key value` / `--key=value`；`-h/--help`、`-v/--version` 与 `--json` 是保留 flag。`--` 之后全部按 positional 处理，`--key ""` 保留空字符串。

## 声明参数

给命令加 `flags` 后，参数语义由声明决定，未知参数会在执行前被拒绝：

```ts
commands: {
  deploy: {
    flags: { 'dry-run': 'boolean', config: 'string' },
    run: (args, ctx) => 0,
  },
}
```

- `boolean`：永不消费下一个 token，只接受 `--dry-run`；
- `string`：消费下一个 token，支持 `--config path` / `--config=path` / `--config ''`；
- 未声明：传了 schema 时按布尔解析，再由 `runCli` 以 `USAGE` 拒绝；不传 schema 时保持旧的自由解析；
- 同一 flag 在所有命令中的类型必须一致；命令要么全部声明 `flags`，要么全部省略。

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
| 未知命令、未知参数、布尔参数带值、带值参数缺值 | 2 |

`runCli` 是异步的：版本 / 帮助 / 无命令等分支也会返回 `Promise<number>`。

- 未知命令给最近候选；没有候选时列出可用命令。
- `--json` 时错误只写 stderr：

```json
{ "error": { "code": "USAGE", "message": "缺少 --config", "path": "--config", "hint": "补上 --config <path>" } }
```

- 人类文案与 JSON 同源，由 `toErrorShape` 统一转换。

AI 入口：[`llms.txt`](./llms.txt)（路由）与 [`SKILLS.md`](./SKILLS.md)（能力表）随包发布。

## 边界

- **零领域依赖**：不 import 任何领域包，也不认识具体业务对象。
- **不引第三方解析 / 着色库**：解析用零依赖实现，着色直接用 ANSI。Node 内置 `util.parseArgs` 表达不了自由 `--key value` 与命令级 flag schema，暂不切换。
- **不内置命令、不发 bin**：具体命令由调用方包注册，各自发布自己的 bin；本包不做命令发现与聚合。
- **不做 IO 策略**：读盘写盘、配置路径由命令自己决定；本包只提供 `cwd` 与 `out/err`。

## 目录

```text
src/
  args.ts      参数解析（纯函数）、flag schema 与读取
  context.ts   命令上下文（cwd / out / err）
  error.ts     机器可读错误、退出码与统一转换
  run.ts       命令注册、flags 校验、help、未知命令与退出码
  index.ts     公共出口
tests/         参数、运行时、声明校验与包内容边界
```

## 版本与兼容

- 当前 `0.3.x`；0.x 阶段 API 仍可能调整。
- 退出码语义：0 成功 / 1 命令执行失败 / 2 用法或配置错误；这是 0.2 起的新约定，升级时按本节目迁移。
- 0.3 的破坏性变更：`runCli` 改为异步；声明 `flags` 后未知参数与缺值会被拒绝。迁移方式：入口改成 `process.exitCode = await runCli(...)`，并给命令补 `flags`；不补 `flags` 的命令仍按旧规则解析。
- 破坏性变更写进 [CHANGELOG](./CHANGELOG.md)，并在本节目说明迁移方式。
- 发布顺序：本包是基础设施，先于依赖它的包。

## 许可

MIT，见 [LICENSE](./LICENSE)。
