/**
 * Centralized logging utility for the BarberShop backend
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Log levels
 */
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Format log message with timestamp and context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {string} Formatted log message
 */
function formatLogMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 ? JSON.stringify(context) : '';
  return `[${timestamp}] [${level}] ${message} ${contextStr}`.trim();
}

/**
 * Logger class with different log levels
 */
class Logger {
  /**
   * @param {any} message
   * @param {Error|null} error
   * @param {object} context
   */
  static error(message, error = null, context = {}) {
    if (isTest) return; // Don't log in test environment
    
    /** @type {any} */
    const logContext = { ...context };
    if (error) {
      /** @type {Error} */
      const err = /** @type {Error} */ (error);
      logContext.error = {
        message: err.message,
        stack: isDevelopment ? err.stack : undefined,
        name: err.name
      };
    }
    
    console.error(formatLogMessage(LOG_LEVELS.ERROR, message, logContext));
  }

  /**
   * @param {any} message
   * @param {object} context
   */
  static warn(message, context = {}) {
    if (isTest) return;
    console.warn(formatLogMessage(LOG_LEVELS.WARN, message, context));
  }

  /**
   * @param {any} message
   * @param {object} context
   */
  static info(message, context = {}) {
    if (isTest) return;
    console.log(formatLogMessage(LOG_LEVELS.INFO, message, context));
  }

  /**
   * @param {any} message
   * @param {object} context
   */
  static debug(message, context = {}) {
    if (!isDevelopment || isTest) return;
    console.log(formatLogMessage(LOG_LEVELS.DEBUG, message, context));
  }

  /**
   * Log database operations
   * @param {any} operation
   * @param {any} model
   * @param {object} context
   */
  static database(operation, model, context = {}) {
    if (!isDevelopment || isTest) return;
    this.debug(`Database ${operation}`, { model, ...context });
  }

  /**
   * Log API requests
   * @param {any} method
   * @param {any} path
   * @param {object} context
   */
  static request(method, path, context = {}) {
    if (isTest) return;
    this.info(`${method} ${path}`, context);
  }

  /**
   * Log authentication events
   * @param {any} event
   * @param {object} context
   */
  static auth(event, context = {}) {
    this.info(`Auth: ${event}`, context);
  }

  /**
   * Log tenant operations
   * @param {any} operation
   * @param {any} barbershopId
   * @param {object} context
   */
  static tenant(operation, barbershopId, context = {}) {
    this.debug(`Tenant ${operation}`, { barbershopId, ...context });
  }
}

module.exports = Logger;