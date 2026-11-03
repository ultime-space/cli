# @ultime/cli

**通用命令行设施**：参数解析、命令注册、上下文与退出码。零领域依赖，不内置任何 `ultime` 命令。

[![license](https://img.shields.io/badge/license-MIT-black)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D22.18-black)](./package.json)

```bash
pnpm add @ultime/cli
```

需要 Node >= 22.18（TS 源直发，靠 Node 原生类型剥离运行）。

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
| `@ultime/cli` | `parseArgs` / `runCli` / `processContext` / `CliContext` / `CommandSpec` / `CliSpec` |

`parseArgs` 只认 `command`、`--flag`、`--key value` / `--key=value`；`-h/--help` 与 `-v/--version` 是保留 flag。

## 边界

- **零领域依赖**：不 import core / kit / viewer，也不知道 token、组件或设计稿。
- **不引第三方解析 / 着色库**：解析用现成的零依赖实现，着色直接用 ANSI；Node 内置的 `util.parseArgs` / `util.styleText` 是后续替换首选，等出现嵌套子命令或补全需求再评估 `commander` 一类工具。
- **不复用于 skills CLI**：skills 通过复制安装（不带 `node_modules`），且支持 Node 20；本包是 Node 22.18 的内部设施，两者只共享契约与夹具，不共享运行时。
- **不内置命令**：`ultime init/build/schema` 属于 `@ultime/core`；kit / viewer 将来各发自己的 bin。
- **不做 IO 策略**：读盘写盘、配置路径由命令自己决定；本包只提供 `cwd` 与 `out/err`。

## 目录

```text
src/
  args.ts      参数解析（纯函数）
  context.ts   命令上下文（cwd / out / err）
  run.ts       命令注册、help、未知命令与退出码
  index.ts     公共出口
tests/         参数与运行时分发
```

## 版本与兼容

- 当前 `0.1.x`；0.x 阶段 API 仍可能调整。
- 破坏性变更写进 [CHANGELOG](./CHANGELOG.md)，并在本节目说明迁移方式。
- 发布顺序：本包是基础设施，先于 studio / core。

## 许可

MIT，见 [LICENSE](./LICENSE)。
