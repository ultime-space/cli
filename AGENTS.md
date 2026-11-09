# AGENTS.md — @ultime/cli

> 给在本仓库工作的 AI 与协作者：只放入口与红线，不复述 README。
> 适用版本：0.1.x

## 先读

1. [`README.md`](./README.md) — 通用设施 API 与边界。
2. [`rules/README.md`](./rules/README.md) — 本包开发规范。
3. [`llms.txt`](./llms.txt) — AI 索引；能力表见 [`skills.md`](./skills.md)，操作约束见 [`agent.md`](./agent.md)。
4. [`src/run.ts`](./src/run.ts) — 命令注册与退出码。

## 红线

- **零领域依赖**：不 import 任何领域包；不内置具体命令。
- **不做 IO 策略**：读盘写盘与配置路径由命令自己决定。
- **不引第三方解析库**：`parseArgs` 保持零依赖。
- **API 变化同步**：`runCli` / `ParsedArgs` / `CliContext` 变化时同步 README、`skills.md` 与测试。

## 验证

```bash
pnpm check
pnpm test
pnpm typecheck
```

没跑或没跑通时，必须说明是哪一条、为什么。
