import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  sessionSecret: string;
  corsOrigin: string;
  maxFileSize: number;
  uploadPath: string;
  logLevel: string;
  logFile: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

class Config {
  private config: AppConfig;

  constructor() {
    this.config = {
      port: parseInt(process.env['PORT'] || '3000', 10),
      nodeEnv: process.env['NODE_ENV'] || 'development',
      databaseUrl: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/thanksgiving_dev',
      jwtSecret: process.env['JWT_SECRET'] || 'thanksgiving-jwt-secret-key-change-in-production',
      jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
      sessionSecret: process.env['SESSION_SECRET'] || 'thanksgiving-session-secret-change-in-production',
      corsOrigin: process.env['CORS_ORIGIN'] || 'http://localhost:3000',
      maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
      uploadPath: process.env['UPLOAD_PATH'] || './uploads',
      logLevel: process.env['LOG_LEVEL'] || 'info',
      logFile: process.env['LOG_FILE'] || './logs/app.log',
      rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
      rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10)
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getPort(): number {
    return this.config.port;
  }

  getDatabaseUrl(): string {
    return this.config.databaseUrl;
  }

  getJwtSecret(): string {
    return this.config.jwtSecret;
  }

  getJwtExpiresIn(): string {
    return this.config.jwtExpiresIn;
  }

  getSessionSecret(): string {
    return this.config.sessionSecret;
  }

  getCorsOrigin(): string {
    return this.config.corsOrigin;
  }

  getMaxFileSize(): number {
    return this.config.maxFileSize;
  }

  getUploadPath(): string {
    return this.config.uploadPath;
  }

  getLogLevel(): string {
    return this.config.logLevel;
  }

  getLogFile(): string {
    return this.config.logFile;
  }

  getRateLimitConfig() {
    return {
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests
    };
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

export const config = new Config();