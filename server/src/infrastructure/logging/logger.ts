/**
 * 结构化日志系统
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL as LogLevel] || LOG_LEVELS.info;

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(level: LogLevel, module: string, message: string, data?: any): string {
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;
  if (data !== undefined) {
    return `${prefix} ${message} ${JSON.stringify(data)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(module: string, message: string, data?: any) {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', module, message, data));
    }
  },

  info(module: string, message: string, data?: any) {
    if (currentLevel <= LOG_LEVELS.info) {
      console.log(formatMessage('info', module, message, data));
    }
  },

  warn(module: string, message: string, data?: any) {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', module, message, data));
    }
  },

  error(module: string, message: string, data?: any) {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error(formatMessage('error', module, message, data));
    }
  },
};
