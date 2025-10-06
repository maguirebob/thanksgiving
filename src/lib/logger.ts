/**
 * Simple logging utility with configurable levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Set log level based on environment variable or default to INFO in development
    const envLevel = process.env['LOG_LEVEL']?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.level = LogLevel[envLevel as keyof typeof LogLevel];
    } else {
      // Default levels based on environment
      this.level = process.env['NODE_ENV'] === 'development' ? LogLevel.INFO : LogLevel.WARN;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🐛 ${message}`, ...args);
    }
  }

  // Special methods for common patterns
  success(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  server(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`🚀 ${message}`, ...args);
    }
  }

  // Method to check if debug logging is enabled
  isDebugEnabled(): boolean {
    return this.shouldLog(LogLevel.DEBUG);
  }
}

export const logger = new Logger();
