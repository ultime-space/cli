# 02 · 参数、命令与退出码

> 定位：`runCli` 的稳定协议。
> 适用版本：0.2.x
> 关系：架构见 [`01-architecture`](./01-architecture.md)。

---

## 参数

`parseArgs` 只认三种形态：

- `command`：第一个非 flag token；
- `--flag`：布尔；
- `--key value` / `--key=value`：带值。

保留 flag：`-h/--help`、`-v/--version` 与 `--json`。`--json` 固定按布尔解析，只表达输出形态；其余 flag 原样交给命令解释。

## 命令注册

```ts
runCli({
  name: 'my-cli',
  version: '0.1.0',
  usage: 'my-cli <command>',
  commands: {
    build: { help: 'my-cli build [--check]', run: (args, ctx) => 0 },
  },
}, argv, ctx)
```

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

普通异常没有字段信息，统一成 `{ code: 'ERROR', message }`。

## 退出码

| 情况 | 退出码 |
|---|---|
| 版本 / 帮助 | 0 |
| 命令返回的码 | 原样透传 |
| 命令抛普通异常 | 1，`code: 'ERROR'` |
| `CliError` | `exitCode`，默认 2 |
| 无命令、未知命令 | 2 |

- 未知命令先写 `err`（带最近候选），再输出 usage 到 `out`；`--json` 时不写 stdout。
- 命令自己决定业务错误码；本包不定义领域错误。
