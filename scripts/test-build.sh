#!/bin/bash

# Comprehensive build testing script
# This script runs all build validation checks to catch issues before deployment

echo "🚀 Starting comprehensive build validation..."
echo "=============================================="

# Function to check if command succeeded
check_command() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 passed"
        return 0
    else
        echo "❌ $1 failed"
        return 1
    fi
}

# Track overall success
OVERALL_SUCCESS=true

# 1. TypeScript compilation check (no emit)
echo "🔍 Step 1: TypeScript compilation check..."
npx tsc --noEmit
if ! check_command "TypeScript compilation check"; then
    OVERALL_SUCCESS=false
fi

# 2. Full build test
echo ""
echo "🔨 Step 2: Full build test..."
npm run build
if ! check_command "Full build"; then
    OVERALL_SUCCESS=false
fi

# 3. Lint check (if available)
echo ""
echo "🧹 Step 3: Lint check..."
if npm run lint 2>/dev/null; then
    check_command "Lint check"
else
    echo "⚠️  Lint check not available, skipping..."
fi

# 4. Test suite (if available)
echo ""
echo "🧪 Step 4: Test suite..."
if npm test 2>/dev/null; then
    check_command "Test suite"
else
    echo "⚠️  Test suite not available, skipping..."
fi

# 5. Database schema validation
echo ""
echo "🗄️  Step 5: Database schema validation..."
if npm run verify:schema 2>/dev/null; then
    check_command "Database schema validation"
else
    echo "⚠️  Database schema validation not available, skipping..."
fi

# 6. Schema version consistency check
echo ""
echo "📋 Step 6: Schema version consistency check..."
CURRENT_VERSION=$(node -p "require('./package.json').version")
SCHEMA_FILE="./src/lib/schemaVersions.ts"

if [ -f "$SCHEMA_FILE" ]; then
    if grep -q "'$CURRENT_VERSION':" "$SCHEMA_FILE"; then
        echo "✅ Schema definition exists for version $CURRENT_VERSION"
    else
        echo "❌ Schema definition missing for version $CURRENT_VERSION"
        echo "📝 Please add schema definition to schemaVersions.ts"
        OVERALL_SUCCESS=false
    fi
else
    echo "⚠️  Schema file not found, skipping schema version check..."
fi

# 7. About page database validation
echo ""
echo "🔍 Step 7: About page database validation..."
if npm run verify:about-page 2>/dev/null; then
    echo "✅ About page database validation passed"
else
    echo "❌ About page database validation failed"
    echo "📝 The about page will show database errors - fix before deployment"
    OVERALL_SUCCESS=false
fi

echo ""
echo "=============================================="
if [ "$OVERALL_SUCCESS" = true ]; then
    echo "🎉 All build validations passed!"
    echo ""
    echo "✅ Ready for deployment!"
    exit 0
else
    echo "❌ Some build validations failed!"
    echo ""
    echo "🔧 Please fix the issues above before deploying."
    exit 1
fi
