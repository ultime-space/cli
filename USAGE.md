# 使用说明

> 定位：`@ultime/cli` 的完整用法：参数声明、默认命令、错误与退出码。
> 适用版本：0.5.x
> 关系：定位与最小示例见 [README](./README.md)；AI 入口见 [`SKILLS.md`](./SKILLS.md)。

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

## 默认命令

命令面有默认动作时（例如检查工具的 `run`），在 `CliSpec` 设置 `defaultCommand`：

```ts
const spec = {
  name: 'my-cli',
  version: '0.1.0',
  usage: 'my-cli [command]',
  defaultCommand: 'run',
  commands: {
    run: { flags: {}, run: (args, ctx) => 0 },
  },
}
```

无命令时执行默认命令；设置默认命令后，未注册的首个 token 也作为它的 positional（显式注册的命令优先），不再报未知命令。有默认命令时 `--` 之后全部作为 positional。`--help` / `--version` 仍走全局短路，不会误执行默认命令。

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
- 文本错误首行显示稳定错误码：`✗ [USAGE] 缺少 --config`；普通异常的 `ERROR` 不显示，避免噪音。`details` 只进 JSON，不在文本里猜结构。
- 颜色由 `CliContext.color` 控制；`processContext()` 按 stderr TTY、`FORCE_COLOR`、`NO_COLOR` / `NODE_DISABLE_COLORS` 与 `TERM` 计算，测试和管道输出默认无色。

AI 入口：[`llms.txt`](./llms.txt)（路由）与 [`SKILLS.md`](./SKILLS.md)（能力表）随包发布。
