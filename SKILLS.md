# @ultime/cli · 可调用能力

> 定位：AI 可调用的通用命令设施。领域命令不在这里。
> 适用版本：0.1.x
> 同步基线：0.1.x（手写；API 变化时同批更新）

---

## 入口

```ts
import { parseArgs, runCli, processContext, CliError } from '@ultime/cli'
import type { ParsedArgs, CliContext, CliSpec, CommandSpec, CliErrorOptions, CliErrorShape } from '@ultime/cli'
```

| 能力 | 输入 | 输出 |
|---|---|---|
| `parseArgs(argv)` | 字符串数组 | `{ command, flags, positional }` |
| `runCli(spec, argv, ctx?)` | `CliSpec` + 参数 | 退出码；版本 / 帮助 / 未知命令 / 错误由它处理 |
| `processContext()` | — | `{ cwd, out, err }` |
| `CliError(message, options)` | 文案 + `code` / `path` / `hint` / `details` / `exitCode` | 可被 `runCli` 统一输出的错误 |
| `toErrorShape(error)` | 任意异常 | `{ code, message, path?, hint?, details? }` |

## `CliSpec`

```ts
{
  name: string
  version: string
  usage: string
  commands: Record<string, { help?: string; run(args, ctx): number }>
}
```

## 错误语义

- 未知命令：`err` 写错误与候选，`out` 写 usage，返回 2；
- 无命令：`out` 写 usage，返回 2；
- 普通异常：`err` 写 message，`code: 'ERROR'`，返回 1；
- `CliError`：带 `code` / `path` / `hint`，返回 `exitCode`（默认 2）；
- `--json`：错误以 `{ "error": { … } }` 只写 stderr；
- 版本 / 帮助：返回 0，不执行命令。

## 反例

- 把 `--check` 当成 cli 内置 flag：它属于调用方的命令。
- 在 cli 里读具体项目配置：IO 与配置语义属于调用方命令。
- 在 cli 里发现或聚合其他包的 bin：每个包自带入口，本包不发 bin。
