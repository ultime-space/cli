# cli · 开发规则

> 定位：本包开发规范的索引。只写判断、边界与反例；API 事实以 README 为准。
> 适用版本：0.1.x
> owner：维护者（repo owner）· 复核：2026-11-11 · 到期降级为参考
> 关系：入口见 [`AGENTS.md`](../AGENTS.md)；怎么用见 [`README.md`](../README.md)。

---

## 规则清单

| 文件 | 回答什么 |
|---|---|
| [01-architecture](./01-architecture.md) | 设施层定位、依赖方向、目录职责 |
| [02-runner](./02-runner.md) | 参数、命令注册、help 与退出码 |
| [03-testing](./03-testing.md) | 参数与运行时分发的测试 |
| [04-release](./04-release.md) | 发布顺序、AI 文档同步 |

## 一句话

cli 只做**通用命令设施**；具体命令、配置与 IO 都归调用方。
