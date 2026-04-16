/**
 * Logger Utility
 * Centralized logging with file and console output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

/**
 * Format log message with timestamp
 */
const formatLog = (level, message, data = '') => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message} ${data ? JSON.stringify(data) : ''}`;
};

/**
 * Write to log file
 */
const writeLog = (level, message, data) => {
  const logFile = path.join(logDir, `${level.toLowerCase()}.log`);
  const logMessage = formatLog(level, message, data) + '\n';
  
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error('Failed to write log:', err);
  });
};

const logger = {
  error: (message, data) => {
    console.error(formatLog(logLevels.ERROR, message, data));
    writeLog(logLevels.ERROR, message, data);
  },
  
  warn: (message, data) => {
    console.warn(formatLog(logLevels.WARN, message, data));
    writeLog(logLevels.WARN, message, data);
  },
  
  info: (message, data) => {
    console.log(formatLog(logLevels.INFO, message, data));
    writeLog(logLevels.INFO, message, data);
  },
  
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatLog(logLevels.DEBUG, message, data));
      writeLog(logLevels.DEBUG, message, data);
    }
  }
};

export default logger;
