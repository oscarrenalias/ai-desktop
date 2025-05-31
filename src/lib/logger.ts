import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

/**
 * Logger is a simple wrapper for Tauri's plugin-log, providing a familiar logger interface.
 *
 * Usage:
 * ```typescript
 * import { Logger } from '$lib/logger';
 * const logger = Logger.getLogger('my-module');
 * await logger.info('This is an info message');
 * await logger.error('Something went wrong!');
 * ```
 *
 * Each log message is prefixed with the logger's name.
 */
export class Logger {
  /** The name of the logger (used as a prefix in log messages) */
  private name: string;

  /**
   * Private constructor. Use Logger.getLogger(name) to get an instance.
   * @param name The logger name (usually the module or class name)
   */
  private constructor(name: string) {
    this.name = name;
  }

  /**
   * Get a logger instance for the given name.
   * @param name The logger name (usually the module or class name)
   * @returns {Logger} The logger instance
   */
  static getLogger(name: string) {
    return new Logger(name);
  }

  /**
   * Format a message with the logger name as prefix.
   * @param message The message to log
   * @returns {string} The formatted message
   */
  private format(message: string) {
    return `[${this.name}] ${message}`;
  }

  /**
   * Log a trace-level message.
   * @param message The message to log
   */
  async trace(message: string) {
    const formatted = this.format(message);
    console.log(`[TRACE] ${formatted}`);
    await trace(formatted);
  }

  /**
   * Log a debug-level message.
   * @param message The message to log
   */
  async debug(message: string) {
    const formatted = this.format(message);
    console.debug(`[DEBUG] ${formatted}`);
    await debug(formatted);
  }

  /**
   * Log an info-level message.
   * @param message The message to log
   */
  async info(message: string) {
    const formatted = this.format(message);
    console.info(`[INFO] ${formatted}`);
    await info(formatted);
  }

  /**
   * Log a warning-level message.
   * @param message The message to log
   */
  async warn(message: string) {
    const formatted = this.format(message);
    console.warn(`[WARN] ${formatted}`);
    await warn(formatted);
  }

  /**
   * Log an error-level message.
   * @param message The message to log
   */
  async error(message: string) {
    const formatted = this.format(message);
    console.error(`[ERROR] ${formatted}`);
    await error(formatted);
  }
}

// Usage example:
// const logger = Logger.getLogger('my-module');
// await logger.info('This is an info message');
