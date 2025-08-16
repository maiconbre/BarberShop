/**
 * Centralized error handling utility for the BarberShop backend
 */

const Logger = require('./logger');

/**
 * Sequelize error types and their HTTP status codes
 */
const SEQUELIZE_ERROR_MAPPING = {
  'SequelizeUniqueConstraintError': 409,
  'SequelizeForeignKeyConstraintError': 400,
  'SequelizeValidationError': 400,
  'SequelizeConnectionError': 503,
  'SequelizeTimeoutError': 504,
  'SequelizeDatabaseError': 500
};

/**
 * Extract meaningful error information from Sequelize errors
 * @param {Error} error - The Sequelize error
 * @returns {Object} Parsed error information
 */
function parseSequelizeError(error) {
  const errorType = error.name;
  /** @type {number} */
  const statusCode = SEQUELIZE_ERROR_MAPPING[errorType] || 500;
  
  let message = 'Erro interno do servidor';
  let code = 'INTERNAL_SERVER_ERROR';
  
  switch (errorType) {
    case 'SequelizeUniqueConstraintError':
      /** @type {any} */
      const errorWithDetails = /** @type {any} */ (error);
      const field = errorWithDetails.errors?.[0]?.path || 'campo';
      message = `${field} já está em uso`;
      code = 'UNIQUE_CONSTRAINT_VIOLATION';
      break;
      
    case 'SequelizeForeignKeyConstraintError':
      message = 'Referência inválida entre dados';
      code = 'FOREIGN_KEY_VIOLATION';
      break;
      
    case 'SequelizeValidationError':
      /** @type {any} */
      const validationError = /** @type {any} */ (error);
      const validationErrors = validationError.errors?.map((e) => e.message).join(', ') || 'Dados inválidos';
      message = `Erro de validação: ${validationErrors}`;
      code = 'VALIDATION_ERROR';
      break;
      
    case 'SequelizeConnectionError':
      message = 'Erro de conexão com o banco de dados';
      code = 'DATABASE_CONNECTION_ERROR';
      break;
      
    case 'SequelizeTimeoutError':
      message = 'Timeout na operação do banco de dados';
      code = 'DATABASE_TIMEOUT';
      break;
      
    default:
      if (process.env.NODE_ENV === 'development') {
        message = error.message;
      }
  }
  
  return { statusCode, message, code, originalError: error };
}

/**
 * Handle different types of errors and return appropriate HTTP response
 * @param {Error} error - The error to handle
 * @param {Object} context - Additional context for logging
 * @returns {Object} Error response object
 */
function handleError(error, context = {}) {
  // Log the error with context
  Logger.error('Error occurred', /** @type {Error} */ (error), context);
  
  // Handle Sequelize errors
  if (error.name && error.name.startsWith('Sequelize')) {
    return parseSequelizeError(error);
  }
  
  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return {
      statusCode: 401,
      message: 'Token inválido',
      code: 'INVALID_TOKEN'
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      statusCode: 401,
      message: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    };
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: error.message || 'Dados inválidos',
      code: 'VALIDATION_ERROR'
    };
  }
  
  // Handle custom application errors
  /** @type {any} */
  const customError = /** @type {any} */ (error);
  if (customError.statusCode && customError.code) {
    return {
      statusCode: customError.statusCode,
      message: customError.message,
      code: customError.code
    };
  }
  
  // Default error response
  return {
    statusCode: 500,
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR'
  };
}

/**
 * Express error handling middleware
 * @param {any} error
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorMiddleware(error, req, res, next) {
  const context = {
    method: req.method,
    path: req.path,
    barbershopId: req.tenant?.barbershopId,
    userId: req.user?.id
  };
  
  const { statusCode, message, code } = handleError(error, context);
  
  res.status(statusCode).json({
    success: false,
    message,
    code
  });
}

/**
 * Async wrapper to catch errors in async route handlers
 * @param {any} fn
 * @returns {function}
 */
function asyncHandler(fn) {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom application error
 */
class AppError extends Error {
  /**
   * @param {any} message
   * @param {number} statusCode
   * @param {string} code
   */
  constructor(message, statusCode = 500, code = 'APPLICATION_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

module.exports = {
  handleError,
  errorMiddleware,
  asyncHandler,
  AppError,
  Logger
};