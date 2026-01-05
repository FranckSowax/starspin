/**
 * Production-safe logger utility
 * Only logs in development or for critical errors in production
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * Debug logs - only shown in development
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info logs - only shown in development
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Warning logs - shown in development, silenced in production
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Error logs - always shown (important for debugging production issues)
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * Security logs - always shown for audit purposes
   */
  security: (...args: unknown[]) => {
    console.warn('[SECURITY]', ...args);
  },
};

export default logger;
