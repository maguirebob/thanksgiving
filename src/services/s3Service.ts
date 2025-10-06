import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';
import { logger } from '../lib/logger';

/**
 * S3 Service for handling file operations
 * Provides methods for uploading, downloading, and managing files in S3
 */
class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env['AWS_REGION'] || 'us-east-1';
    this.bucketName = process.env['S3_BUCKET_NAME'] || 'thanksgiving-images-dev';
    
    // Check if S3 credentials are available
    const accessKeyId = process.env['AWS_ACCESS_KEY_ID'];
    const secretAccessKey = process.env['AWS_SECRET_ACCESS_KEY'];
    
    if (!accessKeyId || !secretAccessKey) {
      logger.warn('S3 credentials not configured. S3Service will operate in fallback mode.');
      // Create a dummy client that will fail gracefully
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: 'dummy',
          secretAccessKey: 'dummy'
        }
      });
    } else {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey
        }
      });
    }

    logger.info(`S3Service initialized for bucket: ${this.bucketName} in region: ${this.region}`);
  }

  /**
   * Upload a file to S3
   * @param key - S3 object key (path)
   * @param file - File buffer or stream
   * @param contentType - MIME type of the file
   * @param metadata - Optional metadata
   * @returns Promise<string> - S3 URL of the uploaded file
   */
  async uploadFile(
    key: string, 
    file: Buffer | Uint8Array | string, 
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata || {}
      });
      
      await this.s3Client.send(command);
      
      const s3Url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      logger.debug(`File uploaded successfully: ${s3Url}`);
      
      return s3Url;
    } catch (error) {
      logger.error('Error uploading file to S3:', error);
      throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a signed URL for accessing a file
   * @param key - S3 object key
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   * @returns Promise<string> - Signed URL
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      logger.debug(`Generated signed URL for: ${key}`);
      
      return signedUrl;
    } catch (error) {
      logger.error('Error generating signed URL:', error);
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key
   * @returns Promise<void>
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });
      
      await this.s3Client.send(command);
      logger.debug(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('Error deleting file from S3:', error);
      throw new Error(`Failed to delete file from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List files in S3 bucket
   * @param prefix - Optional prefix to filter files
   * @returns Promise<Array<{key: string, size: number, lastModified: Date}>>
   */
  async listFiles(prefix?: string): Promise<Array<{key: string, size: number, lastModified: Date}>> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix
      });
      
      const response = await this.s3Client.send(command);
      
      const files = (response.Contents || []).map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date()
      }));
      
      logger.debug(`Listed ${files.length} files from S3`);
      return files;
    } catch (error) {
      logger.error('Error listing files from S3:', error);
      throw new Error(`Failed to list files from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique filename with UUID
   * @param originalName - Original filename
   * @param prefix - Optional prefix for the file
   * @returns string - Unique filename
   */
  generateUniqueFilename(originalName: string, prefix?: string): string {
    const ext = path.extname(originalName);
    const uuid = randomUUID();
    const prefixStr = prefix ? `${prefix}/` : '';
    return `${prefixStr}${uuid}${ext}`;
  }

  /**
   * Get the S3 base URL for this bucket
   * @returns string - Base URL
   */
  getBaseUrl(): string {
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com`;
  }

  /**
   * Check if S3 service is properly configured
   * @returns Promise<boolean>
   */
  async isConfigured(): Promise<boolean> {
    try {
      await this.listFiles();
      return true;
    } catch (error) {
      logger.error('S3 service not properly configured:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new S3Service();
