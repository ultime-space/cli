# 01 · 架构与依赖

> 定位：CLI 设施的职责、依赖方向与目录分工。
> 适用版本：0.1.x
> 关系：规则索引见 [`README`](./README.md)；运行协议见 [`02-runner`](./02-runner.md)。

---

## 职责

| 做 | 不做 |
|---|---|
| 参数解析、help、版本、未知命令与退出码 | 定义任何领域命令 |
| 命令注册与分发 | 读配置、写产物、判断配置合法性 |
| 提供 `cwd` 与 `out/err` 上下文 | 决定日志格式、文件布局或 IO 策略 |

依赖方向：

```text
调用方（core / kit / viewer） → @ultime/cli
```

- 本包**不 import** core / kit / viewer。
- 调用方注册命令；本包只负责通用流程。

## 目录

| 路径 | 职责 |
|---|---|
| `src/args.ts` | `command` / `--flag` / `--key value` 解析 |
| `src/context.ts` | `CliContext` 与进程实现 |
| `src/run.ts` | `runCli`：版本 / 帮助 / 未知命令 / 异常转退出码 |
| `src/index.ts` | 公共出口 |

## 反例

- 在 `run.ts` 里判断 `ultime.config.json` 是否合法 —— 这是 core 的命令。
- 在 `args.ts` 里内置业务 flag（如 `--check`）—— 业务 flag 由命令自己解释。
