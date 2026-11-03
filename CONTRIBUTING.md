# Contributing

> 给贡献者与 AI 的最短协作规则。命令见 [README](./README.md)。

## 工作流

1. 从 `main` 切 `feat/<主题>` / `fix/<主题>`。
2. 完成后 `git rebase main` 再合并；主分支不保留中间提交。
3. 一次提交一件事，提交信息用 `type(scope): subject`。

## 改动规则

- CLI 只做参数 / 路径 / IO / 退出码；配置合法性与产物内容归 `@ultime/core/tools`。
- 不 import core 内部源码，只用包名 + exports。
- 不自维护字段清单；`schema` 从 core 的 studio / tools 投影。
- 新增命令或退出码：同步 README、`skills.md`、测试与版本戳。

## 验证

```bash
pnpm check
pnpm test
pnpm typecheck
npm pack --dry-run
```

## 版本

- 0.x 阶段命令面与退出码仍可能调整；破坏性变更写进 README「版本与兼容」。
- 发布顺序：studio → core → cli。
