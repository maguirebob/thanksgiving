# Upload Endpoints for Menu Images

## 🎯 Overview

I've created API endpoints that can be deployed to production to upload menu images from `public/images/` to S3 and update the database with S3 URLs.

## 📁 Files Created

### 1. Controller
- **`src/controllers/uploadController.ts`** - Contains two main functions:
  - `uploadMenuImagesToS3` - Uploads images from `public/images/` to S3
  - `updateDatabaseWithS3Urls` - Updates database with S3 URLs

### 2. Routes
- **`src/routes/uploadRoutes.ts`** - Defines the API endpoints

### 3. Test Script
- **`scripts/test-upload-endpoints.js`** - Test script to call the endpoints

## 🚀 API Endpoints

### 1. Upload Menu Images to S3
```
POST /api/upload/menu-images-to-s3
```

**What it does:**
- Reads all image files from `public/images/`
- Uploads each file to S3 in the `menus/` directory
- Returns detailed results with S3 URLs

**Response:**
```json
{
  "success": true,
  "message": "Upload completed. 25 successful, 0 failed.",
  "summary": {
    "total": 25,
    "successful": 25,
    "failed": 0
  },
  "results": [...],
  "s3Urls": [
    {
      "filename": "1994_Menu.png",
      "s3Url": "https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/1994_Menu.png"
    }
  ]
}
```

### 2. Update Database with S3 URLs
```
POST /api/upload/update-database-s3-urls
```

**What it does:**
- Finds all events with `menu_image_filename` but no `menu_image_s3_url`
- Updates each event with the corresponding S3 URL
- Returns detailed results

**Response:**
```json
{
  "success": true,
  "message": "Database update completed. 25 successful, 0 failed.",
  "summary": {
    "total": 25,
    "successful": 25,
    "failed": 0
  },
  "results": [...],
  "s3Urls": [
    {
      "eventId": 1,
      "eventName": "1994 Thanksgiving",
      "filename": "1994_Menu.png",
      "s3Url": "https://thanksgiving-images-prod.s3.us-east-1.amazonaws.com/menus/1994_Menu.png"
    }
  ]
}
```

## 🔧 How to Use

### 1. Deploy to Production
The endpoints are now part of the main server and will be available when deployed to Railway.

### 2. Call the Endpoints
You can call them using curl, Postman, or the test script:

```bash
# Upload images to S3
curl -X POST https://your-production-url.com/api/upload/menu-images-to-s3

# Update database with S3 URLs
curl -X POST https://your-production-url.com/api/upload/update-database-s3-urls
```

### 3. Test Script
```bash
# Test locally
npm run test:upload-endpoints

# Test production
npm run test:upload-endpoints https://your-production-url.com
```

## 📊 Current Status

- ✅ **25 menu images** ready in `public/images/` (1994-2024, missing 2019 and 2025)
- ✅ **API endpoints created** and integrated into server
- ✅ **Build successful** - no TypeScript errors
- ✅ **Test script ready** for validation
- ⏳ **Ready for deployment** to production

## 🎯 Next Steps

1. **Deploy to production** (Railway)
2. **Call the upload endpoint** to upload images to S3
3. **Call the database update endpoint** to link S3 URLs to events
4. **Verify** that menu images are now served from S3

The endpoints will automatically use the production AWS credentials configured in Railway and upload to the `thanksgiving-images-prod` S3 bucket.
