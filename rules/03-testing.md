# 03 · 测试与验收

> 定位：改 CLI 设施时跑什么、什么算通过。
> 适用版本：0.5.x
> 关系：协议见 [`02-runner`](./02-runner.md)；发布检查见 [`04-release`](./04-release.md)。

---

## 命令

```bash
pnpm check
pnpm test
```

## 覆盖

`tests/infra.test.ts` 覆盖：

- 参数：命令、布尔 flag、`key=value`、带值 flag；
- schema：声明布尔 / 字符串、未知 flag、`--` 终止符与空字符串；
- 默认命令：无命令执行默认命令、未注册 token 归 positional、显式命令优先、`--` 之后全部 positional、help / version 不误执行；
- 校验：未知参数、布尔显式值、字符串缺值、混合声明与类型冲突；
- 运行时：版本 / 帮助不执行命令；异步命令与异常；`mapError`；未知命令与异常都转退出码；已注册命令能分发；
- 辅助出口：`flagBool` / `flagValue` / `reportError` / `exitCodeOf` 与退出码常量。

新增 API 或改变退出码语义，必须补正例与失败例。

## 原则

- 用内存 `CliContext` 断言输出，不依赖真实终端或子进程。
- 不测试领域命令：本包没有领域命令。
- 不 mock `parseArgs`：它是纯函数，直接测。

## 反例

- 只测 `--help`：证明不了分发与退出码。
- 在测试里构造真实项目配置：那是调用方命令的测试。
