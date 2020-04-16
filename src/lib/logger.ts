import chalk from 'chalk';
import { Writable } from 'stream';
import * as util from 'util';

type StyleFn = (str: string) => string;
const { stdout, stderr } = process;

// There is not a good way to define log args so we must use any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = any[];

/**
 * Type for logger function
 */
export type LoggerFunction = (fmt: string, ...args: Args) => void;

/**
 * Function to generate logging function with specified styles
 */
const logger = (stream: Writable, styles?: StyleFn[]): LoggerFunction => (fmt: string, ...args: Args): void => {
  let str = util.format(fmt, ...args);
  if (styles && styles.length) {
    str = styles.reduce((a, style) => style(a), str);
  }
  stream.write(str + '\n');
};

/**
 * Allow setting verbository level
 */
export let isVerbose = false;
export function setVerbose(enabled = true): void {
  isVerbose = enabled;
}

/**
 * Provide these options for logging
 */
const _debug = logger(stderr, [chalk.gray]);
export const debug = (fmt: string, ...args: Args): LoggerFunction | boolean | void => isVerbose && _debug(fmt, ...args);

export const error = logger(stderr, [chalk.red]);
export const warning = logger(stderr, [chalk.yellow]);
export const success = logger(stderr, [chalk.green]);
export const highlight = logger(stderr, [chalk.bold]);
export const print = logger(stderr);
export const data = logger(stdout);

/**
 * Create a logger output that features a constant prefix string.
 *
 * @param prefixString the prefix string to be appended before any log entry.
 * @param fn   the logger function to be used (typically one of the other functions in this module)
 *
 * @returns a new LoggerFunction.
 */
export function prefix(prefixString: string, fn: LoggerFunction): LoggerFunction {
  return (fmt: string, ...args: Args): void => fn(`%s ${fmt}`, prefixString, ...args);
}
