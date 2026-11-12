# Changelog

## 0.2.0 - 2026-11-12

### Added

- `CliError` / `toErrorShape`：机器可读错误，带 `code` / `path` / `hint` / `details` / `exitCode`。
- `--json` 作为保留布尔 flag：错误以 `{ "error": { … } }` 只写 stderr。
- 未知命令给最近候选；单命令 help 缺省时按命令名生成。

### Changed

- 退出码语义：0 成功 / 1 命令执行失败 / 2 用法或配置错误；无命令与未知命令从 1 改为 2。
- 本包不发布 bin、不做命令发现；各产品包自带入口。

## 0.1.4 - 2026-11-10

- 构建改用 `vp pack`，产物同时生成 `dist/index.js` 与 `dist/index.d.ts`。
- `exports.types` 指向 `dist/index.d.ts`，包体不再包含 `src/`；安装后类型解析不依赖源码。
- 无运行时 API 变化。

## 0.1.3 - 2026-11-10

- 修复 `--key=value` 的值含等号时被截断：`--define=KEY=VALUE` 现在完整保留。
- 包内新增 `llms.txt` / `SKILLS.md` 作为消费侧 AI 入口；`rules/` 留仓，操作约束并入 `AGENTS.md`。

## 0.1.2 - 2026-11-09

- 移除仓库内遗留的 `bin/ultime.js`：它不是本包的公开入口，引用的路径也已不存在。
- `runCli` 捕获非 `Error` 异常时输出字符串，不再显示 `undefined`。
- 文档、规则与测试改为领域中立；新增参数 / 运行时覆盖与包内容边界测试。
- `keywords` 改为通用 CLI 词，避免被当成领域工具。

## 0.1.1 - 2026-11-04

- 仓库自带 `pnpm-lock.yaml` 并声明 `packageManager`，依赖可复现，CI 用 `--frozen-lockfile`。
- 包内补齐格式化与 lint 配置，独立仓的 `pnpm check` 与元仓口径一致。

## 0.1.0 - 2026-11-04

- 首次发布：通用命令行设施——`parseArgs` / `runCli` / `processContext` 与相关类型。
- 零领域依赖，不内置任何具体命令；具体命令归调用方包。
