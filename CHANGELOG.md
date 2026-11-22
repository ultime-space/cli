# Changelog

## 0.5.0 - 2026-11-22

### Added

- `CliContext.color`：可选颜色开关；`processContext()` 按 stderr TTY、`FORCE_COLOR`、`NO_COLOR` / `NODE_DISABLE_COLORS` 与 `TERM` 计算。未设置时视为关闭，测试与管道输出无色。
- 颜色渲染：错误标红、错误码弱化；自研 ANSI，不新增依赖。

### Changed

- 文本错误首行显示稳定 code：`✗ [USAGE] 缺少 --config`；普通异常的 `ERROR` 不显示。`--json` 结构不变。
- `details` 明确只进 JSON，文本不展开。

## 0.4.0 - 2026-11-15

### Added

- `CliSpec.defaultCommand`：无命令时执行默认命令；设置后未注册的首个 token 作为默认命令的 positional，显式命令优先；有默认命令时 `--` 之后全部按 positional 处理，不改变 help / version。

## 0.3.1 - 2026-11-15

### Fixed

- `--json` 且无命令时只向 stderr 输出 `{ error }`，不再向 stdout 写 usage，与“`--json` 错误只写 stderr”的契约一致。

## 0.3.0 - 2026-11-15

### Added

- `parseArgs(argv, { flags })` 与 `FlagSpec`：命令级声明 `boolean` / `string`，布尔 flag 不再吞后面的 token；`--` 之后全部按 positional 处理。
- `CommandSpec.flags`：声明后 `runCli` 拒绝未知参数、布尔显式值与带值 flag 缺值，统一报 `USAGE`。
- `runCli` 支持异步命令与 `mapError`；`help` 支持函数，用于二级命令帮助。
- 导出 `flagValue` / `flagBool` / `reportError` / `exitCodeOf` 与 `EXIT_OK` / `EXIT_FAIL` / `EXIT_USAGE`。

### Changed

- **Breaking**：`runCli` 返回 `Promise<number>`；入口改为 `process.exitCode = await runCli(...)`。
- 传入 `flags` schema 时，未声明的 flag 按布尔解析，交给命令校验拒绝；未传 schema 保持旧的自由解析。
- 空字符串 `--key ""` 保留为值，不再退化成 `true`。

### Fixed

- `--` 不再被当成空名 flag；`--key ''` 与 `--key=` 行为一致。

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
