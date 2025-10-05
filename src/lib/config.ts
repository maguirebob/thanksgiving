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
  // S3 Configuration
  awsRegion: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  s3BucketName: string;
  s3BaseUrl: string;
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
      corsOrigin: process.env['CORS_ORIGIN'] || (process.env['NODE_ENV'] === 'production' ? 'https://thanksgiving-test-test.up.railway.app' : 'http://localhost:3000'),
      maxFileSize: parseInt(process.env['MAX_FILE_SIZE'] || '10485760', 10), // 10MB
      uploadPath: process.env['UPLOAD_PATH'] || './uploads',
      logLevel: process.env['LOG_LEVEL'] || 'info',
      logFile: process.env['LOG_FILE'] || './logs/app.log',
      rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000', 10), // 15 minutes
      rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100', 10),
      // S3 Configuration
      awsRegion: process.env['AWS_REGION'] || 'us-east-1',
      awsAccessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
      awsSecretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
      s3BucketName: process.env['S3_BUCKET_NAME'] || 'thanksgiving-images-dev',
      s3BaseUrl: process.env['S3_BASE_URL'] || `https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com`
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

  // S3 Configuration getters
  getAwsRegion(): string {
    return this.config.awsRegion;
  }

  getAwsAccessKeyId(): string {
    return this.config.awsAccessKeyId;
  }

  getAwsSecretAccessKey(): string {
    return this.config.awsSecretAccessKey;
  }

  getS3BucketName(): string {
    return this.config.s3BucketName;
  }

  getS3BaseUrl(): string {
    return this.config.s3BaseUrl;
  }

  isS3Configured(): boolean {
    return !!(this.config.awsAccessKeyId && this.config.awsSecretAccessKey && this.config.s3BucketName);
  }
}

export const config = new Config();