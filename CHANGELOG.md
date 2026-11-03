# Changelog

## 0.1.1 - 2026-11-04

- 仓库自带 `pnpm-lock.yaml` 并声明 `packageManager`，依赖可复现，CI 用 `--frozen-lockfile`。
- 包内补齐格式化与 lint 配置，独立仓的 `pnpm check` 与元仓口径一致。

## 0.1.0 - 2026-11-04

- 首次发布：通用命令行设施——`parseArgs` / `runCli` / `processContext` 与相关类型。
- 零领域依赖，不内置任何命令；`ultime` 的 init / build / schema 归 `@ultime/core`。
