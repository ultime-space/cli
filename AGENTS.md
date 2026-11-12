# AGENTS.md — @ultime/cli

> 给在本仓库工作的 AI 与协作者：入口、可写 / 只读、红线与验收。
> 适用版本：0.2.x

## 先读

1. [`README.md`](./README.md) — 通用设施 API 与边界。
2. [`rules/README.md`](./rules/README.md) — 本包开发规范。
3. [`llms.txt`](./llms.txt) — AI 索引；能力表见 [`SKILLS.md`](./SKILLS.md)。
4. [`src/run.ts`](./src/run.ts) — 命令注册与退出码。

## 可写 / 只读

| 路径 | 条件 |
|---|---|
| `src/args.ts` / `src/context.ts` / `src/run.ts` | 通用设施；保持零依赖 |
| `src/index.ts` | 公共出口；新增 API 同步 README / `SKILLS.md` |
| `tests/**` | 与 API 改动同批 |
| `rules/` / `llms.txt` / `SKILLS.md` | 随版本同批更新 |

只读：`node_modules/**`；调用方包的源码与产物。

## 红线

- **零领域依赖**：不 import 任何领域包；不内置具体命令。
- **不发 bin、不做命令发现**：每个产品包自带入口；本包不聚合、不扫描其他包的 bin。
- **不做 IO 策略**：读盘写盘与配置路径由命令自己决定。
- **不引第三方解析库**：`parseArgs` 保持零依赖。
- **API 变化同步**：`runCli` / `ParsedArgs` / `CliContext` 变化时同步 README、`SKILLS.md` 与测试。

## 验证

```bash
pnpm check
pnpm test
```

没跑或没跑通时，必须说明是哪一条、为什么。
