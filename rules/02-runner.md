# 02 · 参数、命令与退出码

> 定位：`runCli` 的稳定协议。
> 适用版本：0.1.x
> 关系：架构见 [`01-architecture`](./01-architecture.md)。

---

## 参数

`parseArgs` 只认三种形态：

- `command`：第一个非 flag token；
- `--flag`：布尔；
- `--key value` / `--key=value`：带值。

保留 flag：`-h/--help`、`-v/--version`。其余 flag 原样交给命令解释。

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

## 退出码

| 情况 | 退出码 |
|---|---|
| 版本 / 帮助 | 0 |
| 无命令、未知命令 | 1 |
| 命令返回的码 | 原样透传 |
| 命令抛异常 | 1，错误写入 `ctx.err` |

- 未知命令先写 `err`，再输出 usage 到 `out`。
- 命令自己决定业务错误码；本包不定义领域错误。
