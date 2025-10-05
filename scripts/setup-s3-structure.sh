#!/bin/bash

# Script to create S3 bucket directory structure in production
# This ensures production has the same S3 structure as test

echo "🚀 Setting up S3 bucket structure for production..."

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS credentials not set. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

# Set default values
BUCKET_NAME=${S3_BUCKET_NAME:-"thanksgiving-images-prod"}
REGION=${AWS_REGION:-"us-east-1"}

echo "📦 Bucket: $BUCKET_NAME"
echo "🌍 Region: $REGION"

# Create directory structure by uploading placeholder files
echo "📁 Creating S3 directory structure..."

# Create photos directory
echo "Creating photos/ directory..."
aws s3 cp /dev/null "s3://$BUCKET_NAME/photos/.gitkeep" --content-type "text/plain" || echo "Failed to create photos/"

# Create menus directory  
echo "Creating menus/ directory..."
aws s3 cp /dev/null "s3://$BUCKET_NAME/menus/.gitkeep" --content-type "text/plain" || echo "Failed to create menus/"

# Create recipes directory
echo "Creating recipes/ directory..."
aws s3 cp /dev/null "s3://$BUCKET_NAME/recipes/.gitkeep" --content-type "text/plain" || echo "Failed to create recipes/"

# Create uploads directory
echo "Creating uploads/ directory..."
aws s3 cp /dev/null "s3://$BUCKET_NAME/uploads/.gitkeep" --content-type "text/plain" || echo "Failed to create uploads/"

# List bucket contents to verify
echo "📂 Current S3 bucket contents:"
aws s3 ls "s3://$BUCKET_NAME/" --recursive || echo "Failed to list bucket contents"

echo "🎉 S3 bucket setup complete!"
echo ""
echo "Next steps:"
echo "1. Test photo upload functionality"
echo "2. Verify photos page loads correctly"
echo "3. Check admin dashboard photo management"
echo "4. Visit: https://$BUCKET_NAME.s3.$REGION.amazonaws.com/"
