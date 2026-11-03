# 04 · 版本与发布

> 定位：CLI 设施的 TS 直发形态、发布顺序与检查。
> 适用版本：0.1.x
> 关系：测试见 [`03-testing`](./03-testing.md)。

---

## 形态

- **TS 直发**：`exports` 指向 `src/index.ts`；无构建链。
- `engines.node >= 22.18`；浏览器侧需要打包器。
- 零第三方运行时依赖。

## 顺序

`@ultime/cli` → `@ultime/studio` → `@ultime/core`。本包是基础设施，最先发。

## 发布前检查

- [ ] `pnpm check` / `pnpm test` / `pnpm typecheck` 全绿
- [ ] `npm pack --dry-run` 只带 `src` / `README.md` / 附属文件
- [ ] `package.json` 版本、tag、`CHANGELOG.md` 一致
- [ ] README 的 API 与退出码表与实际一致
- [ ] AI 文档同步：`rules/` / `llms.txt` / `skills.md` / `agent.md` / `AGENTS.md` 的版本戳已更新

## 兼容

- 0.x 阶段 API 仍可能调整；破坏性变更写进 README「版本与兼容」。
- 不内置命令；命令归属变化不影响本包 API。
