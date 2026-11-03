# @ultime/cli · 可调用能力

> 定位：AI 可调用的通用命令设施。领域命令不在这里。
> 适用版本：0.1.x
> 同步基线：0.1.x（手写；API 变化时同批更新）

---

## 入口

```ts
import { parseArgs, runCli, processContext } from '@ultime/cli'
import type { ParsedArgs, CliContext, CliSpec, CommandSpec } from '@ultime/cli'
```

| 能力 | 输入 | 输出 |
|---|---|---|
| `parseArgs(argv)` | 字符串数组 | `{ command, flags, positional }` |
| `runCli(spec, argv, ctx?)` | `CliSpec` + 参数 | 退出码；版本 / 帮助 / 未知命令 / 异常由它处理 |
| `processContext()` | — | `{ cwd, out, err }` |

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

- 未知命令：`err` 写错误，`out` 写 usage，返回 1；
- 命令抛异常：`err` 写 message，返回 1；
- 版本 / 帮助：返回 0，不执行命令。

## 反例

- 把 `--check` 当成 cli 内置 flag：它属于调用方的命令。
- 在 cli 里读 `ultime.config.json`：IO 与配置属于 core 的命令。
