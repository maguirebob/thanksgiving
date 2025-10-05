# S3 Migration Implementation Plan

## 🎯 GitHub Issue Template

**Title:** `Migrate Image Storage from Railway Volumes to Amazon S3`

**Labels:** `enhancement`, `infrastructure`, `migration`, `priority:high`

**Body:**
```markdown
# 🚀 S3 Migration: Railway Volumes → Amazon S3

## 📋 Overview
Migrate all image storage (menus, photos, recipes) from Railway volumes to Amazon S3 for improved scalability, reliability, and cost optimization.

## 🎯 Goals
- **Cost Reduction**: 50-70% reduction in storage costs
- **Scalability**: Unlimited storage capacity vs Railway volume limits
- **Reliability**: 99.999999999% durability with automatic backups
- **Performance**: Global CDN integration capability
- **Simplicity**: Remove Railway volume complexity

## 📊 Current State
- **Menu Images**: `public/images/` (dev) → `/app/public/images` (prod)
- **Photos**: `public/uploads/photos/` (dev) → `/app/uploads/photos` (prod)
- **Database**: Stores filename references, not full URLs
- **Serving**: Express static middleware + custom route handlers

## 🏗️ Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)
**User Responsibilities:**
- [ ] Create AWS account and set up billing alerts
- [ ] Create S3 buckets: `thanksgiving-images-dev`, `thanksgiving-images-test`, `thanksgiving-images-prod`
- [ ] Set up IAM policies and access keys for each environment
- [ ] Configure AWS CLI and test access

**Assistant Responsibilities:**
- [ ] Update environment variable documentation
- [ ] Create S3 bucket configuration templates
- [ ] Set up IAM policy templates
- [ ] Install AWS SDK dependencies (`@aws-sdk/client-s3`, `multer-s3`)

### Phase 2: Code Development (Week 2)
**Assistant Responsibilities:**
- [ ] Implement S3 service layer (`src/services/s3Service.ts`)
- [ ] Create S3 upload middleware (`src/middleware/s3Upload.ts`)
- [ ] Update photo controller to use S3
- [ ] Update menu upload routes to use S3
- [ ] Create database migration for S3 URL fields
- [ ] Implement signed URL generation for secure access

**User Responsibilities:**
- [ ] Review and approve code changes
- [ ] Test S3 integration in development environment
- [ ] Provide feedback on implementation approach

### Phase 3: Migration Scripts (Week 2-3)
**Assistant Responsibilities:**
- [ ] Create data migration script (`scripts/migrate-to-s3.ts`)
- [ ] Implement file verification and integrity checks
- [ ] Create rollback procedures
- [ ] Add comprehensive logging and error handling

**User Responsibilities:**
- [ ] Review migration scripts
- [ ] Test migration process with sample data
- [ ] Approve migration approach

### Phase 4: Testing & Migration (Week 3)
**Assistant Responsibilities:**
- [ ] Deploy S3 integration to test environment
- [ ] Run migration scripts on test data
- [ ] Update route handlers to serve from S3
- [ ] Implement fallback mechanisms for failed S3 requests
- [ ] Create monitoring and alerting for S3 usage

**User Responsibilities:**
- [ ] Test all image upload/download functionality
- [ ] Verify data integrity after migration
- [ ] Test performance and user experience
- [ ] Approve test environment migration

### Phase 5: Production Deployment (Week 4)
**Assistant Responsibilities:**
- [ ] Deploy to production environment
- [ ] Run production data migration
- [ ] Update Railway configuration (remove volumes)
- [ ] Monitor S3 usage and costs
- [ ] Clean up old local files after verification

**User Responsibilities:**
- [ ] Monitor production deployment
- [ ] Verify all functionality works correctly
- [ ] Test with real user scenarios
- [ ] Approve production migration completion

## 🔧 Technical Requirements

### New Dependencies
```json
{
  "@aws-sdk/client-s3": "^3.450.0",
  "@aws-sdk/s3-request-presigner": "^3.450.0",
  "multer-s3": "^3.0.1"
}
```

### Environment Variables
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=thanksgiving-images-env
S3_BASE_URL=https://thanksgiving-images-env.s3.us-east-1.amazonaws.com
```

### Database Schema Updates
```sql
ALTER TABLE events ADD COLUMN menu_image_s3_url VARCHAR(500);
ALTER TABLE photos ADD COLUMN s3_url VARCHAR(500);
ALTER TABLE recipes ADD COLUMN image_s3_url VARCHAR(500);
```

## 📈 Success Metrics
- **Cost Reduction**: 50-70% reduction in storage costs
- **Performance**: <2s upload time, <500ms access time
- **Reliability**: 99.9% uptime, <0.1% error rate
- **Migration**: 100% data integrity maintained

## ⚠️ Risks & Mitigation
- **Data Loss**: Comprehensive backups and verification
- **Downtime**: Blue-green deployment strategy
- **Cost Overrun**: Billing alerts and usage monitoring
- **Access Issues**: IAM roles with least privilege

## 📚 Documentation
- [S3 Migration Analysis](../docs/S3_MIGRATION_ANALYSIS.md)
- [AWS S3 Setup Guide](../docs/AWS_S3_SETUP.md) (to be created)
- [Migration Runbook](../docs/S3_MIGRATION_RUNBOOK.md) (to be created)

## 🏷️ Labels
- `enhancement`
- `infrastructure`
- `migration`
- `priority:high`

## 📅 Timeline
- **Start Date**: [Current Date]
- **Target Completion**: 4 weeks
- **Milestones**: Weekly phase completions

---

**Note**: This migration will significantly improve the application's scalability and reduce operational complexity while maintaining all existing functionality.
```

## 📋 Detailed Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

#### User Tasks:
1. **AWS Account Setup**
   - Create AWS account if not exists
   - Set up billing alerts ($10, $50, $100 thresholds)
   - Enable MFA on root account
   - Create IAM user for programmatic access

2. **S3 Bucket Creation**
   ```bash
   # Create buckets for each environment
   aws s3 mb s3://thanksgiving-images-dev
   aws s3 mb s3://thanksgiving-images-test
   aws s3 mb s3://thanksgiving-images-prod
   ```

3. **IAM Policy Setup**
   - Create IAM policy for S3 access
   - Create IAM users for each environment
   - Generate access keys
   - Test access with AWS CLI

4. **Environment Configuration**
   - Add AWS credentials to Railway environment variables
   - Test S3 access from Railway environments

#### Assistant Tasks:
1. **Documentation Updates**
   - Update environment variable documentation
   - Create AWS setup guide
   - Document IAM policy requirements

2. **Code Preparation**
   - Install AWS SDK dependencies
   - Create S3 service templates
   - Set up configuration management

### Phase 2: Code Development (Week 2)

#### Assistant Tasks:
1. **S3 Service Layer**
   ```typescript
   // src/services/s3Service.ts
   - Implement uploadFile() method
   - Implement getSignedUrl() method
   - Implement deleteFile() method
   - Add error handling and logging
   ```

2. **Upload Middleware**
   ```typescript
   // src/middleware/s3Upload.ts
   - Configure multer-s3 storage
   - Set up file filtering
   - Add metadata handling
   ```

3. **Controller Updates**
   ```typescript
   // src/controllers/photoController.ts
   - Update uploadEventPhoto() to use S3
   - Update servePhotoFile() to use signed URLs
   - Add S3 URL to database records
   ```

4. **Route Updates**
   ```typescript
   // src/routes/eventRoutes.ts
   - Update menu upload to use S3
   - Update image serving to use signed URLs
   ```

5. **Database Migration**
   ```sql
   -- Add S3 URL columns
   ALTER TABLE events ADD COLUMN menu_image_s3_url VARCHAR(500);
   ALTER TABLE photos ADD COLUMN s3_url VARCHAR(500);
   ALTER TABLE recipes ADD COLUMN image_s3_url VARCHAR(500);
   ```

#### User Tasks:
1. **Code Review**
   - Review S3 service implementation
   - Test upload functionality
   - Verify error handling

2. **Development Testing**
   - Test image uploads
   - Test image serving
   - Verify database updates

### Phase 3: Migration Scripts (Week 2-3)

#### Assistant Tasks:
1. **Migration Script**
   ```typescript
   // scripts/migrate-to-s3.ts
   - Read existing files from local storage
   - Upload files to S3
   - Update database with S3 URLs
   - Verify file integrity
   - Generate migration report
   ```

2. **Rollback Script**
   ```typescript
   // scripts/rollback-from-s3.ts
   - Download files from S3
   - Restore to local storage
   - Update database to use local paths
   ```

3. **Verification Script**
   ```typescript
   // scripts/verify-s3-migration.ts
   - Compare file counts
   - Verify file sizes
   - Check database consistency
   ```

#### User Tasks:
1. **Script Review**
   - Review migration logic
   - Test with sample data
   - Approve migration approach

2. **Backup Creation**
   - Export current image files
   - Create database backup
   - Document current state

### Phase 4: Testing & Migration (Week 3)

#### Assistant Tasks:
1. **Test Environment Deployment**
   - Deploy S3 integration to test
   - Run migration scripts
   - Update serving routes
   - Implement monitoring

2. **Fallback Mechanisms**
   - Add S3 failure handling
   - Implement retry logic
   - Create error notifications

3. **Performance Monitoring**
   - Set up S3 usage monitoring
   - Create cost alerts
   - Monitor upload/download times

#### User Tasks:
1. **Comprehensive Testing**
   - Test all upload scenarios
   - Test all download scenarios
   - Verify data integrity
   - Test error conditions

2. **Performance Validation**
   - Measure upload times
   - Measure download times
   - Compare with current performance

### Phase 5: Production Deployment (Week 4)

#### Assistant Tasks:
1. **Production Migration**
   - Deploy to production
   - Run production migration
   - Update Railway configuration
   - Remove volume dependencies

2. **Monitoring Setup**
   - Configure production monitoring
   - Set up cost alerts
   - Create performance dashboards

3. **Cleanup**
   - Remove old local files
   - Update documentation
   - Archive old storage

#### User Tasks:
1. **Production Validation**
   - Monitor deployment
   - Test all functionality
   - Verify user experience
   - Check cost metrics

2. **Final Approval**
   - Approve migration completion
   - Sign off on performance
   - Confirm cost savings

## 🔧 Technical Specifications

### AWS S3 Configuration
```yaml
Buckets:
  - thanksgiving-images-dev
  - thanksgiving-images-test
  - thanksgiving-images-prod

IAM Policy:
  - s3:GetObject
  - s3:PutObject
  - s3:DeleteObject
  - s3:ListBucket

CORS Configuration:
  - Allow origins: [dev, test, prod domains]
  - Allow methods: GET, PUT, POST, DELETE
  - Allow headers: Content-Type, Authorization
```

### Database Schema Changes
```sql
-- Events table
ALTER TABLE events ADD COLUMN menu_image_s3_url VARCHAR(500);

-- Photos table
ALTER TABLE photos ADD COLUMN s3_url VARCHAR(500);

-- Recipes table
ALTER TABLE recipes ADD COLUMN image_s3_url VARCHAR(500);

-- Indexes for performance
CREATE INDEX idx_events_menu_s3_url ON events(menu_image_s3_url);
CREATE INDEX idx_photos_s3_url ON photos(s3_url);
CREATE INDEX idx_recipes_image_s3_url ON recipes(image_s3_url);
```

### Environment Variables
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Configuration
S3_BUCKET_NAME=thanksgiving-images-env
S3_BASE_URL=https://thanksgiving-images-env.s3.us-east-1.amazonaws.com

# Migration Configuration
MIGRATION_BATCH_SIZE=100
MIGRATION_RETRY_ATTEMPTS=3
MIGRATION_TIMEOUT=30000
```

## 📊 Success Criteria

### Performance Metrics
- **Upload Time**: <2 seconds for 10MB files
- **Download Time**: <500ms for image serving
- **Error Rate**: <0.1% for S3 operations
- **Availability**: 99.9% uptime

### Cost Metrics
- **Storage Cost**: 50-70% reduction
- **Bandwidth Cost**: 70% reduction
- **Operational Cost**: 30% reduction

### Quality Metrics
- **Data Integrity**: 100% file verification
- **Migration Success**: 100% data preservation
- **User Experience**: No degradation in functionality

## ⚠️ Risk Management

### High-Risk Items
1. **Data Loss During Migration**
   - Mitigation: Comprehensive backups, verification scripts
   - Rollback: Automated rollback procedures

2. **S3 Access Issues**
   - Mitigation: IAM roles with least privilege, access testing
   - Rollback: Fallback to local storage

3. **Cost Overrun**
   - Mitigation: Billing alerts, usage monitoring
   - Rollback: Cost threshold triggers

### Medium-Risk Items
1. **Performance Degradation**
   - Mitigation: Performance testing, CDN integration
   - Rollback: Performance monitoring alerts

2. **Migration Complexity**
   - Mitigation: Phased approach, comprehensive testing
   - Rollback: Step-by-step rollback procedures

## 📅 Timeline & Milestones

### Week 1: Infrastructure
- **Day 1-2**: AWS account setup, S3 bucket creation
- **Day 3-4**: IAM policy setup, access key generation
- **Day 5**: Environment variable configuration, testing

### Week 2: Development
- **Day 1-2**: S3 service layer implementation
- **Day 3-4**: Upload middleware and controller updates
- **Day 5**: Database migration, route updates

### Week 3: Migration & Testing
- **Day 1-2**: Migration script development
- **Day 3-4**: Test environment migration
- **Day 5**: Testing and validation

### Week 4: Production
- **Day 1-2**: Production migration
- **Day 3-4**: Monitoring and cleanup
- **Day 5**: Final validation and sign-off

## 📚 Documentation Deliverables

1. **AWS S3 Setup Guide** (`docs/AWS_S3_SETUP.md`)
2. **Migration Runbook** (`docs/S3_MIGRATION_RUNBOOK.md`)
3. **S3 Service Documentation** (`docs/S3_SERVICE_API.md`)
4. **Troubleshooting Guide** (`docs/S3_TROUBLESHOOTING.md`)
5. **Cost Optimization Guide** (`docs/S3_COST_OPTIMIZATION.md`)

---

**Next Steps:**
1. Create GitHub issue using the template above
2. Begin Phase 1: Infrastructure Setup
3. Set up weekly progress reviews
4. Establish communication protocols for each phase
