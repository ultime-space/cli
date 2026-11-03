# @ultime/cli · 操作约束

> 定位：AI 在本仓可以改什么、不能改什么、改完怎么验。
> 适用版本：0.1.x

---

## 可写

| 路径 | 条件 |
|---|---|
| `src/args.ts` / `src/context.ts` / `src/run.ts` | 通用设施；保持零依赖 |
| `src/index.ts` | 公共出口；新增 API 同步 README / `skills.md` |
| `tests/**` | 与 API 改动同批 |
| `rules/` / `llms.txt` / `skills.md` / `agent.md` | 随版本同批更新 |

## 只读

- `node_modules/**`；
- 调用方包（core / kit / viewer）的源码与产物。

## 禁止

- import core / kit / viewer；
- 内置领域命令或业务 flag；
- 在设施层读盘写盘、定义日志格式；
- 为方便测试引入第三方参数解析库；
- 改 API 不同步 README、`skills.md` 与测试。

## 验证

```bash
pnpm check
pnpm test
pnpm typecheck
```

- 改 API：同步 README、`skills.md`、`agent.md` 与版本戳；
- 交付时说明跑了哪些命令；没跑或失败要写清哪一条、为什么。
