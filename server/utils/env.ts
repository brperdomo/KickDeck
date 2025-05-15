/**
 * Environment Helper Functions
 * Utility functions for checking the current environment
 */

/**
 * Checks if the current environment is development
 * @returns {boolean} True if in development, false otherwise
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Checks if the current environment is production
 * @returns {boolean} True if in production, false otherwise
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if the current environment is test
 * @returns {boolean} True if in test, false otherwise
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}