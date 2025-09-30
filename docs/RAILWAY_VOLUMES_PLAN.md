# Railway Volumes Plan for Image Storage

## 🎯 Problem Statement
Uploaded menu images are stored in the container's ephemeral file system and are lost on each Railway deployment. This affects test and production environments but not local development.

## 📋 Solution Overview
Use Railway volumes to provide persistent storage for uploaded images across deployments.

## 🏗️ Implementation Plan

### Environment-Specific Considerations

#### Development Environment (Local)
- **File Storage**: Uses local `public/images/` directory
- **Persistence**: Files persist across restarts (local file system)
- **No Railway volumes needed**: Runs on local machine

#### Test Environment (Railway)
- **File Storage**: Uses Railway volume `/app/public/images`
- **Persistence**: Files persist across deployments via volume
- **Railway volumes required**: Must be configured

#### Production Environment (Railway)
- **File Storage**: Uses Railway volume `/app/public/images`
- **Persistence**: Files persist across deployments via volume
- **Railway volumes required**: Must be configured

### Phase 1: Railway Volume Configuration

#### 1.1 Create Volume in Railway Dashboard
```bash
# Via Railway CLI - Test Environment
railway volume create images-storage-thanksgiving-test

# Via Railway CLI - Production Environment  
railway volume create images-storage-thanksgiving-prod
```

#### 1.2 Mount Volume in railway.json

**Test Environment Configuration:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "volumes": [
      {
        "name": "images-storage-thanksgiving-test",
        "mountPath": "/app/public/images"
      }
    ]
  }
}
```

**Production Environment Configuration:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run build && npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "volumes": [
      {
        "name": "images-storage-thanksgiving-prod",
        "mountPath": "/app/public/images"
      }
    ]
  }
}
```

### Phase 2: Code Updates

#### 2.1 Update Upload Middleware
```typescript
// src/middleware/upload.ts
import fs from 'fs';
import path from 'path';

const getUploadPath = (): string => {
  // Development: use local directory
  if (process.env['NODE_ENV'] === 'development') {
    return path.join(process.cwd(), 'public/images');
  }
  
  // Test/Production: use Railway volume
  return '/app/public/images';
};

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: Function) => {
    const uploadDir = getUploadPath();
    
    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: Function) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `menu_${uniqueSuffix}${ext}`);
  }
});
```

#### 2.2 Add Directory Creation Utility
```typescript
// src/utils/fileUtils.ts
import fs from 'fs';
import path from 'path';

export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const getImageUploadPath = (): string => {
  // Development: use local directory
  if (process.env['NODE_ENV'] === 'development') {
    return path.join(process.cwd(), 'public/images');
  }
  
  // Test/Production: use Railway volume
  return '/app/public/images';
};

export const getEnvironmentInfo = (): { env: string; path: string; volume: boolean } => {
  const env = process.env['NODE_ENV'] || 'development';
  const path = getImageUploadPath();
  const volume = env !== 'development';
  
  return { env, path, volume };
};
```

### Phase 3: Migration Strategy

#### 3.1 Existing Images Migration
```typescript
// scripts/migrate-images.ts
import fs from 'fs';
import path from 'path';

const migrateExistingImages = async () => {
  const sourceDir = 'public/images';
  const targetDir = process.env['NODE_ENV'] === 'production' 
    ? '/app/public/images' 
    : 'public/images';
  
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Migrated: ${file}`);
      }
    });
  }
};
```

#### 3.2 Database Cleanup
```sql
-- Remove references to non-existent images
UPDATE events 
SET menu_image_filename = NULL 
WHERE menu_image_filename NOT IN (
  SELECT filename FROM uploaded_files
);
```

### Phase 4: Environment Configuration

#### 4.1 Environment Variables
```bash
# .env.example
IMAGE_UPLOAD_PATH=/app/public/images
VOLUME_MOUNT_PATH=/app/public/images
```

#### 4.2 Railway Environment Setup
```bash
# Set environment variables in Railway
railway variables set IMAGE_UPLOAD_PATH=/app/public/images
railway variables set VOLUME_MOUNT_PATH=/app/public/images
```

### Phase 5: Testing & Validation

#### 5.1 Local Testing
```bash
# Test volume mounting locally
docker run -v $(pwd)/public/images:/app/public/images your-app
```

#### 5.2 Railway Testing
```bash
# Deploy to test environment
git checkout test
git merge dev
git push origin test

# Verify volume persistence
# 1. Upload image via admin
# 2. Restart Railway service
# 3. Verify image still accessible
```

#### 5.3 Production Deployment
```bash
# Deploy to production
git checkout main
git merge test
git push origin main

# Monitor for any issues
railway logs --follow
```

## 📋 Task Assignment

### 🤖 AI Assistant Tasks
- **Code Updates**: Modify upload middleware, create utilities, update configurations
- **Script Creation**: Build migration scripts and upload utilities
- **Documentation**: Provide detailed instructions and troubleshooting guides
- **Monitoring**: Help troubleshoot deployment and migration issues
- **Verification**: Assist with testing and validation

### 👤 User Tasks
- **Railway Configuration**: Create volumes, update railway.json, deploy configurations
- **Deployment**: Execute git commands for test/production deployments
- **Image Migration**: Upload existing menu images to Railway volumes
- **Testing**: Verify functionality works in all environments
- **Final Validation**: Confirm all images are accessible and persistent

---

## 🔧 Implementation Steps

### Step 1: Railway Volume Setup (Test & Production Only)
**👤 USER TASKS:**
1. **Create volumes in Railway dashboard**:
   - Test environment: `images-storage-thanksgiving-test`
   - Production environment: `images-storage-thanksgiving-prod`
2. **Update railway.json** with environment-specific volume configuration
3. **Deploy configuration changes** to test first, then production

**🤖 AI ASSISTANT TASKS:**
- Provide specific Railway CLI commands
- Create environment-specific railway.json configurations
- Guide through Railway dashboard setup

### Step 2: Code Updates (All Environments)
**🤖 AI ASSISTANT TASKS:**
1. **Update upload middleware** for environment detection
2. **Add directory creation utilities**
3. **Update static file serving** (no changes needed)
4. **Test locally** with development environment

**👤 USER TASKS:**
- Review and approve code changes
- Test locally to ensure functionality works

### Step 3: Environment-Specific Deployment

#### Development Environment
**🤖 AI ASSISTANT TASKS:**
- No special setup needed - uses local file system

**👤 USER TASKS:**
```bash
# No special setup needed - uses local file system
npm run dev
# Images stored in: ./public/images/
```

#### Test Environment
**👤 USER TASKS:**
```bash
# Deploy with volume configuration
git checkout test
git merge dev
git push origin test

# Verify volume mounting in Railway dashboard
# Test image upload and persistence
```

**🤖 AI ASSISTANT TASKS:**
- Monitor deployment logs
- Help troubleshoot any volume mounting issues
- Verify code changes work in test environment

#### Production Environment
**👤 USER TASKS:**
```bash
# Deploy with volume configuration
git checkout main
git merge test
git push origin main

# Monitor for any issues
railway logs --follow
```

**🤖 AI ASSISTANT TASKS:**
- Monitor deployment logs
- Help troubleshoot any production issues
- Verify functionality works in production

### Step 4: Migration (Test & Production Only)
**👤 USER TASKS:**
1. **Load existing menu images** into Railway volumes
2. **Run image migration script** in Railway environments
3. **Clean up database references** to non-existent images
4. **Verify all images are accessible** via web interface

**🤖 AI ASSISTANT TASKS:**
1. **Create image upload script** for existing menus
2. **Provide Railway CLI commands** for volume access
3. **Help troubleshoot** any migration issues
4. **Verify database cleanup** queries

#### 4.1 Load Existing Menu Images
```bash
# Copy existing menu images to Railway volumes
# This ensures test/prod have the same historical menus as dev

# For Test Environment
railway connect --environment test
# Upload all images from public/images/ to the volume

# For Production Environment  
railway connect --environment production
# Upload all images from public/images/ to the volume
```

#### 4.2 Image Upload Script
```typescript
// scripts/upload-existing-images.ts
import fs from 'fs';
import path from 'path';

const uploadExistingImages = async () => {
  const imagesDir = 'public/images';
  const files = fs.readdirSync(imagesDir);
  
  console.log(`Found ${files.length} existing menu images`);
  
  files.forEach(file => {
    if (file.match(/\.(jpg|jpeg|png)$/i)) {
      console.log(`✓ ${file} - Ready for volume upload`);
    }
  });
  
  console.log('All existing menu images identified for volume migration');
};
```

## 📊 Success Criteria

- ✅ Images uploaded via admin persist across deployments
- ✅ Existing historical menu images are accessible in all environments
- ✅ Test and production environments have same menu images as development
- ✅ No breaking changes to current functionality
- ✅ All environments work identically for image display

## 🚨 Rollback Plan

If issues occur:
1. Revert railway.json changes
2. Redeploy without volume configuration
3. Investigate and fix issues
4. Re-implement with corrections

## 📚 Documentation Updates

- Update README.md with volume configuration
- Document Railway volume management
- Add troubleshooting guide for image issues

## 🔍 Troubleshooting

### Common Issues

#### Images Not Persisting
- Check volume mount path in railway.json
- Verify directory creation in upload middleware
- Check Railway volume status in dashboard

#### Permission Errors
- Ensure volume has correct permissions
- Check file creation in upload middleware
- Verify static file serving configuration

#### Migration Issues
- Run migration script manually
- Check file paths and permissions
- Verify database references are correct

## 📈 Future Enhancements

### Cloud Storage Integration
Consider migrating to cloud storage (AWS S3, Cloudinary) for:
- Better scalability
- CDN integration
- Backup and redundancy
- Cross-region availability

### Image Optimization
- Automatic image compression
- Multiple size variants
- WebP format support
- Lazy loading implementation
