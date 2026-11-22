# 02 · 参数、命令与退出码

> 定位：`runCli` 的稳定协议。
> 适用版本：0.5.x
> 关系：架构见 [`01-architecture`](./01-architecture.md)。

---

## 参数

`parseArgs` 只认三种形态：

- `command`：第一个非 flag token；
- `--flag`：布尔；
- `--key value` / `--key=value`：带值。

保留 flag：`-h/--help`、`-v/--version` 与 `--json`。`--json` 固定按布尔解析，只表达输出形态；其余 flag 原样交给命令解释。

`--` 终止 flag 解析，之后的 token 全部按 positional 处理。`--key ""` 保留空字符串；以 `-` 开头的值用 `--key=value` 或 `--` 传入。

## 声明参数

`CommandSpec.flags` 用 `boolean` / `string` 声明命令参数：

```ts
deploy: {
  flags: { 'dry-run': 'boolean', config: 'string' },
  run: async (args, ctx) => 0,
}
```

- 声明 `boolean` 的 flag 永不消费下一个 token；
- 声明 `string` 的 flag 取下一个 token，缺值报 `USAGE`；
- 未声明的 flag 在传 schema 时按布尔解析，由 `runCli` 拒绝；
- 同一 flag 的类型必须跨命令一致；命令要么全部声明，要么全部省略。

## 默认命令

`CliSpec.defaultCommand` 指定无命令时执行的命令；`--help` / `--version` 仍走全局短路，不执行默认命令。设置默认命令后，未注册的首个 token 作为默认命令的 positional（显式注册的命令优先）；`--` 之后全部按 positional 处理，不再把首个 token 当命令。

## 命令注册

```ts
runCli({
  name: 'my-cli',
  version: '0.1.0',
  usage: 'my-cli <command>',
  commands: {
    build: { help: 'my-cli build [--check]', flags: { check: 'boolean' }, run: (args, ctx) => 0 },
  },
}, argv, ctx)
```

- `run` 可返回 `number` 或 `Promise<number>`；`runCli` 返回 `Promise<number>`。
- `help` 可以是字符串，也可以是 `(args) => string`，用于按 positional 生成二级帮助。
- `mapError` 把领域错误转成 `CliError`；不返回时保持原异常。

`help` 缺省时生成 `<name> <command> [options]`。

## 错误模型

命令抛 `CliError`，字段全部可选（`code` 必填）：

| 字段 | 用途 |
|---|---|
| `code` | 稳定错误码，例如 `USAGE` / `CONFIG`；上层可追加 |
| `path` | 出错位置，字段路径或参数名 |
| `hint` | 可执行的修复建议 |
| `details` | 附加诊断数据，原样进入 JSON |
| `exitCode` | 默认 2；业务失败可覆盖为 1 |

普通异常没有字段信息，统一成 `{ code: 'ERROR', message }`。`exitCodeOf` 把 `CliError` 的 `exitCode` 或普通异常的 1 统一取出来；`EXIT_OK` / `EXIT_FAIL` / `EXIT_USAGE` 是稳定常量。

文本输出：

- 首行 `✗ [CODE] message`；`ERROR` 视为没有 code，首行退回 `✗ message`；
- 有 `path` / `hint` 时依次追加 `位置：` / `提示：`；
- `details` 只进 JSON，文本不展开；
- 颜色只由 `ctx.color` 决定：`processContext()` 按 stderr TTY 与环境变量计算，其余上下文默认无色；文本去色后信息必须完整。

## 退出码

| 情况 | 退出码 |
|---|---|
| 版本 / 帮助 | 0 |
| 命令返回的码 | 原样透传 |
| 命令抛普通异常 | 1，`code: 'ERROR'` |
| `CliError` | `exitCode`，默认 2 |
| 无命令、未知命令、未知参数、布尔参数带值、带值参数缺值 | 2 |

- 未知命令先写 `err`（带最近候选），再输出 usage 到 `out`；`--json` 时不写 stdout。
- 命令自己决定业务错误码；本包不定义领域错误。
