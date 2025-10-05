# Amazon S3 Migration Analysis

## 📋 Executive Summary

This document analyzes the migration from the current local/volume storage approach to Amazon S3 for storing menus, photos, and other images across dev, test, and prod environments.

## 🔍 Current State Analysis

### Current Image Storage Architecture

#### **Menu Images**
- **Storage Location**: 
  - Dev: `public/images/` (local filesystem)
  - Test/Prod: `/app/public/images` (Railway volume)
- **Upload Process**: Multer middleware → local disk → database stores filename
- **Serving**: Express static middleware serves files directly
- **Database Schema**: `events.menu_image_filename` stores filename reference

#### **Photo Images**
- **Storage Location**:
  - Dev: `public/uploads/photos/` (local filesystem)  
  - Test/Prod: `/app/uploads/photos` (Railway volume)
- **Upload Process**: Multer middleware → local disk → database stores filename
- **Serving**: Custom route handlers stream files from disk
- **Database Schema**: `photos.filename` stores filename reference

#### **Current File Structure**
```
public/
├── images/           # Menu images (34 files)
├── uploads/photos/   # User uploaded photos
└── photos/          # Static photos (1 file)
```

### Current Pain Points

1. **Deployment Complexity**: Railway volumes require manual configuration
2. **Storage Limitations**: Railway volumes have size constraints
3. **Backup Challenges**: No automated backup of uploaded files
4. **Scalability Issues**: File serving tied to application server
5. **Environment Inconsistency**: Different paths for dev vs prod
6. **CDN Absence**: No global content delivery optimization

## 🎯 S3 Migration Benefits

### **Scalability & Performance**
- Unlimited storage capacity
- Global CDN integration (CloudFront)
- Automatic scaling
- Reduced server load (files served directly from S3)

### **Reliability & Backup**
- 99.999999999% (11 9's) durability
- Automatic cross-region replication
- Versioning and lifecycle policies
- Built-in backup and disaster recovery

### **Cost Optimization**
- Pay-per-use pricing model
- Intelligent tiering for cost reduction
- No Railway volume costs
- Reduced bandwidth costs on application server

### **Developer Experience**
- Consistent API across all environments
- Better debugging and monitoring tools
- Simplified deployment process
- Environment parity

## 🏗️ Implementation Plan

### Phase 1: Infrastructure Setup

#### **S3 Bucket Configuration**
```bash
# Environment-specific buckets
thanksgiving-images-dev
thanksgiving-images-test  
thanksgiving-images-prod
```

#### **IAM Policy Requirements**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::thanksgiving-images-*",
        "arn:aws:s3:::thanksgiving-images-*/*"
      ]
    }
  ]
}
```

#### **Environment Variables**
```bash
# Development
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=dev-access-key
AWS_SECRET_ACCESS_KEY=dev-secret-key
S3_BUCKET_NAME=thanksgiving-images-dev
S3_BASE_URL=https://thanksgiving-images-dev.s3.us-east-1.amazonaws.com

# Test
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test-access-key
AWS_SECRET_ACCESS_KEY=test-secret-key
S3_BUCKET_NAME=thanksgiving-images-test
S3_BASE_URL=https://thanksgiving-images-test.s3.us-east-1.amazonaws.com

# Production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=prod-access-key
AWS_SECRET_ACCESS_KEY=prod-secret-key
S3_BUCKET_NAME=thanksgiving-images-prod
S3_BASE_URL=https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com
```

### Phase 2: Code Changes

#### **New Dependencies**
```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.450.0",
    "@aws-sdk/s3-request-presigner": "^3.450.0",
    "multer-s3": "^3.0.1"
  }
}
```

#### **S3 Service Layer**
```typescript
// src/services/s3Service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env['AWS_REGION'] || 'us-east-1',
      credentials: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!
      }
    });
    this.bucketName = process.env['S3_BUCKET_NAME']!;
  }

  async uploadFile(key: string, file: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType
    });
    
    await this.s3Client.send(command);
    return `https://${this.bucketName}.s3.${process.env['AWS_REGION']}.amazonaws.com/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });
    
    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });
    
    await this.s3Client.send(command);
  }
}

export default new S3Service();
```

#### **Updated Upload Middleware**
```typescript
// src/middleware/s3Upload.ts
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

const s3Client = new S3Client({
  region: process.env['AWS_REGION'] || 'us-east-1',
  credentials: {
    accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
    secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env['S3_BUCKET_NAME']!,
    key: (req, file, cb) => {
      const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
      cb(null, `uploads/${uniqueName}`);
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        originalName: file.originalname,
        uploadedAt: new Date().toISOString()
      });
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export default upload;
```

#### **Database Schema Updates**
```sql
-- Add S3 URL fields to existing tables
ALTER TABLE events ADD COLUMN menu_image_s3_url VARCHAR(500);
ALTER TABLE photos ADD COLUMN s3_url VARCHAR(500);
ALTER TABLE recipes ADD COLUMN image_s3_url VARCHAR(500);

-- Migration strategy: Keep existing filename fields for backward compatibility
-- Gradually migrate to S3 URLs
```

### Phase 3: Migration Strategy

#### **Data Migration Process**
1. **Backup Current Files**: Export all existing images from Railway volumes
2. **Upload to S3**: Batch upload existing files to appropriate S3 buckets
3. **Update Database**: Add S3 URLs to existing records
4. **Verify Integrity**: Compare file counts and sizes
5. **Switch Serving**: Update routes to serve from S3 URLs
6. **Cleanup**: Remove local files after verification

#### **Migration Script**
```typescript
// scripts/migrate-to-s3.ts
import fs from 'fs';
import path from 'path';
import s3Service from '../src/services/s3Service';
import prisma from '../src/lib/prisma';

async function migrateToS3() {
  console.log('Starting S3 migration...');
  
  // Migrate menu images
  const events = await prisma.event.findMany({
    where: { menu_image_filename: { not: null } }
  });
  
  for (const event of events) {
    const localPath = path.join('public/images', event.menu_image_filename!);
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      const s3Key = `menus/${event.menu_image_filename}`;
      const s3Url = await s3Service.uploadFile(s3Key, fileBuffer, 'image/jpeg');
      
      await prisma.event.update({
        where: { event_id: event.event_id },
        data: { menu_image_s3_url: s3Url }
      });
      
      console.log(`Migrated menu: ${event.menu_image_filename}`);
    }
  }
  
  // Migrate photos
  const photos = await prisma.photo.findMany();
  
  for (const photo of photos) {
    const localPath = path.join('public/uploads/photos', photo.filename);
    if (fs.existsSync(localPath)) {
      const fileBuffer = fs.readFileSync(localPath);
      const s3Key = `photos/${photo.filename}`;
      const s3Url = await s3Service.uploadFile(s3Key, fileBuffer, photo.mime_type || 'image/jpeg');
      
      await prisma.photo.update({
        where: { photo_id: photo.photo_id },
        data: { s3_url: s3Url }
      });
      
      console.log(`Migrated photo: ${photo.filename}`);
    }
  }
  
  console.log('S3 migration completed!');
}

migrateToS3().catch(console.error);
```

### Phase 4: Route Updates

#### **Updated Photo Routes**
```typescript
// src/routes/photosRoutes.ts - Updated
router.get('/api/photos/:filename/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      res.status(400).json({
        success: false,
        message: 'Filename parameter is required'
      });
      return;
    }
    
    // Get photo record from database
    const photo = await prisma.photo.findFirst({
      where: { filename: filename }
    });
    
    if (!photo) {
      res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
      return;
    }
    
    // Generate signed URL for S3 access
    const signedUrl = await s3Service.getSignedUrl(`photos/${filename}`, 3600);
    
    // Redirect to S3 signed URL
    res.redirect(signedUrl);
    
  } catch (error) {
    console.error('Error serving photo preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to serve photo'
    });
  }
});
```

## 💰 Cost Analysis

### **Current Costs (Railway)**
- Railway Volume Storage: ~$0.10/GB/month
- Bandwidth: Included in Railway plan
- **Estimated Monthly**: $5-10 for current usage

### **S3 Costs (Estimated)**
- **Storage**: $0.023/GB/month (Standard tier)
- **Requests**: $0.0004 per 1,000 GET requests
- **Data Transfer**: $0.09/GB for first 10TB
- **Estimated Monthly**: $2-5 for current usage

### **Cost Savings**
- **50-70% reduction** in storage costs
- **Reduced bandwidth** costs on application server
- **No volume management** overhead

## ⚠️ Risks & Mitigation

### **Migration Risks**
1. **Data Loss**: Mitigate with comprehensive backups and verification
2. **Downtime**: Use blue-green deployment strategy
3. **URL Changes**: Implement URL rewriting for backward compatibility
4. **Cost Overrun**: Set up billing alerts and usage monitoring

### **Operational Risks**
1. **AWS Dependency**: Mitigate with multi-region setup
2. **Access Key Management**: Use IAM roles and least privilege
3. **Rate Limiting**: Implement S3 request throttling
4. **Monitoring**: Set up CloudWatch alarms

## 📊 Implementation Timeline

### **Week 1: Infrastructure Setup**
- [ ] Create S3 buckets for all environments
- [ ] Set up IAM policies and access keys
- [ ] Configure environment variables
- [ ] Install AWS SDK dependencies

### **Week 2: Code Development**
- [ ] Implement S3 service layer
- [ ] Update upload middleware
- [ ] Modify route handlers
- [ ] Create migration scripts

### **Week 3: Testing & Migration**
- [ ] Test in development environment
- [ ] Migrate test environment data
- [ ] Verify functionality and performance
- [ ] Update documentation

### **Week 4: Production Deployment**
- [ ] Migrate production data
- [ ] Deploy updated application
- [ ] Monitor performance and costs
- [ ] Clean up old storage

## 🔧 Configuration Changes

### **Railway Configuration Updates**
```json
{
  "deploy": {
    "startCommand": "bash scripts/railway-deploy.sh",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 120,
    "volumes": []  // Remove volume configuration
  }
}
```

### **Environment Variables**
```bash
# Add to all environments
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=thanksgiving-images-env
S3_BASE_URL=https://thanksgiving-images-env.s3.us-east-1.amazonaws.com
```

## 📈 Success Metrics

### **Performance Metrics**
- **File Upload Speed**: Target <2s for 10MB files
- **File Access Speed**: Target <500ms for image serving
- **Availability**: Target 99.9% uptime
- **Error Rate**: Target <0.1% error rate

### **Cost Metrics**
- **Storage Cost Reduction**: Target 50% reduction
- **Bandwidth Cost Reduction**: Target 70% reduction
- **Operational Cost Reduction**: Target 30% reduction

### **Developer Experience Metrics**
- **Deployment Time**: Target <5 minutes
- **Environment Parity**: 100% consistency
- **Debugging Time**: Target 50% reduction

## 🎯 Recommendations

### **Immediate Actions**
1. **Start with Development**: Implement S3 in dev environment first
2. **Create Migration Plan**: Document all existing files and their locations
3. **Set Up Monitoring**: Implement CloudWatch for S3 usage tracking
4. **Backup Strategy**: Create comprehensive backup before migration

### **Long-term Considerations**
1. **CDN Integration**: Consider CloudFront for global content delivery
2. **Image Optimization**: Implement automatic image resizing and compression
3. **Versioning**: Enable S3 versioning for file history
4. **Lifecycle Policies**: Implement automatic archival for old files

## 📝 Conclusion

The migration to Amazon S3 offers significant benefits in terms of scalability, reliability, and cost optimization. The implementation plan provides a structured approach to minimize risks while maximizing benefits. The estimated timeline of 4 weeks allows for thorough testing and gradual rollout across environments.

**Key Benefits:**
- ✅ Unlimited storage capacity
- ✅ Global CDN integration capability
- ✅ 50-70% cost reduction
- ✅ Improved reliability and backup
- ✅ Simplified deployment process
- ✅ Better developer experience

**Next Steps:**
1. Approve migration plan
2. Set up AWS infrastructure
3. Begin development environment implementation
4. Execute migration timeline
