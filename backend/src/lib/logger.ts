import pino from 'pino'

/**
 * Structured logger for the Storyflow backend.
 * Uses pino for high-performance JSON logging.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
})

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

/**
 * Log levels:
 * - fatal: The service/app is going to stop
 * - error: A failure that prevents a function from working
 * - warn: Something unexpected happened, but the app can continue
 * - info: Useful information about normal operations
 * - debug: Detailed information for debugging
 * - trace: Very detailed tracing information
 */
