export {
  flagBool,
  flagValue,
  parseArgs,
  type FlagSpec,
  type FlagType,
  type ParseOptions,
  type ParsedArgs,
} from './args.ts'
export { processContext, type CliContext } from './context.ts'
export {
  CliError,
  EXIT_FAIL,
  EXIT_OK,
  EXIT_USAGE,
  exitCodeOf,
  toErrorShape,
  type CliErrorOptions,
  type CliErrorShape,
} from './error.ts'
export { reportError, runCli, type CliSpec, type CommandSpec } from './run.ts'
export { style, supportsColor, type StyleFormat } from './style.ts'
