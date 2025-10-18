# Git Hooks Specification for Thanksgiving Project

## Overview

This document specifies a series of Git hooks designed to enforce our established rules for environment management and database changes. These hooks will automatically validate code quality, enforce commit message standards, and ensure proper deployment workflows.

## Environment Management Rules Enforced

### Branch Structure
- **`dev`** - Development branch (current working branch)
- **`test`** - Testing branch for staging/testing  
- **`main`** - Production branch (Railway deployment)

### Environment Workflow
1. **Development**: Work on `dev` branch
2. **Testing**: Merge `dev` → `test` for staging
3. **Production**: Merge `test` → `main` for Railway deployment

### Version Management
- **Always use the versioning function**: `npm run version:patch|minor|major`
- **Patch**: Bug fixes
- **Minor**: New features
- **Major**: Breaking changes

### Database Change Rules
- **Always create Prisma migrations** for schema changes
- **Never modify database directly** in production
- **Always backup before migrations**
- **Test migrations in dev/test first**

## Git Hooks Specification

### 1. Pre-Commit Hook (`pre-commit`)

**Purpose**: Validate code quality and prevent commits with issues

**Location**: `.git/hooks/pre-commit`

**Checks**:
- TypeScript compilation
- ESLint validation
- Prettier formatting
- Test execution
- Database schema validation
- Security checks

**Implementation**:
```bash
#!/bin/bash
# Pre-commit hook for Thanksgiving project

echo "🔍 Running pre-commit checks..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Not in project root directory"
    exit 1
fi

# 1. TypeScript compilation check
echo "📝 Checking TypeScript compilation..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# 2. ESLint validation
echo "🔍 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint validation failed"
    exit 1
fi

# 3. Prettier formatting check
echo "🎨 Checking code formatting..."
npm run format:check
if [ $? -ne 0 ]; then
    echo "❌ Code formatting issues found"
    echo "Run 'npm run format' to fix formatting"
    exit 1
fi

# 4. Run tests
echo "🧪 Running tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Tests failed"
    exit 1
fi

# 5. Database schema validation
echo "🗄️ Validating database schema..."
npm run prisma:validate
if [ $? -ne 0 ]; then
    echo "❌ Database schema validation failed"
    exit 1
fi

# 6. Security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate
if [ $? -ne 0 ]; then
    echo "❌ Security vulnerabilities found"
    exit 1
fi

# 7. Check for sensitive data
echo "🔐 Checking for sensitive data..."
if grep -r "password\|secret\|key\|token" src/ --exclude-dir=node_modules | grep -v "process.env"; then
    echo "❌ Potential sensitive data found in code"
    exit 1
fi

# 8. Check for TODO/FIXME comments
echo "📝 Checking for TODO/FIXME comments..."
if grep -r "TODO\|FIXME" src/; then
    echo "⚠️ Found TODO/FIXME comments - consider addressing before commit"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 9. Check for console.log statements
echo "🐛 Checking for console.log statements..."
if grep -r "console\.log" src/; then
    echo "⚠️ Found console.log statements - consider removing before commit"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ All pre-commit checks passed!"
exit 0
```

### 2. Commit-Message Hook (`commit-msg`)

**Purpose**: Enforce conventional commit message format

**Location**: `.git/hooks/commit-msg`

**Format**: `type(scope): description`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`

**Implementation**:
```bash
#!/bin/bash
# Commit message hook for Thanksgiving project

commit_regex='^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ Invalid commit message format"
    echo ""
    echo "Format: type(scope): description"
    echo ""
    echo "Types:"
    echo "  feat:     New feature"
    echo "  fix:      Bug fix"
    echo "  docs:     Documentation changes"
    echo "  style:    Code style changes (formatting, etc.)"
    echo "  refactor: Code refactoring"
    echo "  test:     Adding or updating tests"
    echo "  chore:    Maintenance tasks"
    echo "  perf:     Performance improvements"
    echo "  ci:       CI/CD changes"
    echo "  build:    Build system changes"
    echo ""
    echo "Examples:"
    echo "  feat(journal): add image preview functionality"
    echo "  fix(api): resolve S3 signed URL generation"
    echo "  docs(readme): update deployment instructions"
    echo "  chore(deps): update Prisma to latest version"
    echo ""
    exit 1
fi

echo "✅ Commit message format valid"
exit 0
```

### 3. Pre-Push Hook (`pre-push`)

**Purpose**: Run comprehensive checks before pushing to remote

**Location**: `.git/hooks/pre-push`

**Checks**:
- Full test suite
- Bundle size analysis
- Database migration validation
- Environment-specific validations

**Implementation**:
```bash
#!/bin/bash
# Pre-push hook for Thanksgiving project

echo "🚀 Running pre-push checks..."

# Get current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "📋 Current branch: $current_branch"

# 1. Run full test suite
echo "🧪 Running full test suite..."
npm run test:all
if [ $? -ne 0 ]; then
    echo "❌ Full test suite failed"
    exit 1
fi

# 2. Build and analyze bundle
echo "📦 Building and analyzing bundle..."
npm run build
npm run analyze:bundle
if [ $? -ne 0 ]; then
    echo "❌ Bundle analysis failed"
    exit 1
fi

# 3. Database migration validation
echo "🗄️ Validating database migrations..."
npm run prisma:migrate:status
if [ $? -ne 0 ]; then
    echo "❌ Database migration validation failed"
    exit 1
fi

# 4. Environment-specific validations
if [ "$current_branch" = "main" ]; then
    echo "🏭 Production branch validation..."
    
    # Check for production-specific issues
    if grep -r "console\.log\|console\.error\|console\.warn" src/; then
        echo "❌ Console statements found in production code"
        exit 1
    fi
    
    # Check for development dependencies in production
    if grep -r "ts-node-dev\|nodemon" package.json; then
        echo "❌ Development dependencies found in production"
        exit 1
    fi
    
    # Validate production environment variables
    if [ ! -f ".env.production" ]; then
        echo "❌ Production environment file missing"
        exit 1
    fi
    
elif [ "$current_branch" = "test" ]; then
    echo "🧪 Test branch validation..."
    
    # Check for test-specific configurations
    if [ ! -f ".env.test" ]; then
        echo "❌ Test environment file missing"
        exit 1
    fi
    
elif [ "$current_branch" = "dev" ]; then
    echo "🔧 Development branch validation..."
    
    # Check for development-specific configurations
    if [ ! -f ".env.development" ]; then
        echo "❌ Development environment file missing"
        exit 1
    fi
fi

# 5. Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Uncommitted changes found"
    echo "Please commit or stash your changes before pushing"
    exit 1
fi

# 6. Check for unpushed commits
if [ "$current_branch" != "main" ] && [ "$current_branch" != "test" ]; then
    echo "⚠️ Pushing to development branch - ensure you've tested locally"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ All pre-push checks passed!"
exit 0
```

### 4. Post-Commit Hook (`post-commit`)

**Purpose**: Log commit information and trigger notifications

**Location**: `.git/hooks/post-commit`

**Actions**:
- Log commit details
- Update development logs
- Trigger notifications

**Implementation**:
```bash
#!/bin/bash
# Post-commit hook for Thanksgiving project

# Get commit information
commit_hash=$(git rev-parse HEAD)
commit_message=$(git log -1 --pretty=format:"%s")
commit_author=$(git log -1 --pretty=format:"%an")
commit_date=$(git log -1 --pretty=format:"%ad")
current_branch=$(git rev-parse --abbrev-ref HEAD)

# Log commit information
echo "📝 Commit logged:"
echo "  Hash: $commit_hash"
echo "  Message: $commit_message"
echo "  Author: $commit_author"
echo "  Date: $commit_date"
echo "  Branch: $current_branch"

# Update development log
if [ -f "DAILY_SESSION_LOG.md" ]; then
    echo "" >> DAILY_SESSION_LOG.md
    echo "## Commit: $commit_message" >> DAILY_SESSION_LOG.md
    echo "- **Hash**: \`$commit_hash\`" >> DAILY_SESSION_LOG.md
    echo "- **Author**: $commit_author" >> DAILY_SESSION_LOG.md
    echo "- **Date**: $commit_date" >> DAILY_SESSION_LOG.md
    echo "- **Branch**: $current_branch" >> DAILY_SESSION_LOG.md
fi

# Trigger notifications (if configured)
if [ -f "scripts/notify-commit.sh" ]; then
    ./scripts/notify-commit.sh "$commit_message" "$current_branch"
fi

echo "✅ Post-commit actions completed"
exit 0
```

### 5. Pre-Rebase Hook (`pre-rebase`)

**Purpose**: Prevent rebasing of main/test branches

**Location**: `.git/hooks/pre-rebase`

**Implementation**:
```bash
#!/bin/bash
# Pre-rebase hook for Thanksgiving project

current_branch=$(git rev-parse --abbrev-ref HEAD)

if [ "$current_branch" = "main" ] || [ "$current_branch" = "test" ]; then
    echo "❌ Rebase not allowed on $current_branch branch"
    echo "Use merge instead to preserve commit history"
    exit 1
fi

echo "✅ Rebase allowed on $current_branch branch"
exit 0
```

### 6. Post-Merge Hook (`post-merge`)

**Purpose**: Handle post-merge actions and environment updates

**Location**: `.git/hooks/post-merge`

**Actions**:
- Update dependencies
- Run migrations
- Clear caches
- Update environment files

**Implementation**:
```bash
#!/bin/bash
# Post-merge hook for Thanksgiving project

current_branch=$(git rev-parse --abbrev-ref HEAD)

echo "🔄 Running post-merge actions for $current_branch branch..."

# 1. Update dependencies
echo "📦 Updating dependencies..."
npm install

# 2. Run database migrations
echo "🗄️ Running database migrations..."
npm run prisma:migrate:deploy

# 3. Clear caches
echo "🧹 Clearing caches..."
npm run clean:cache

# 4. Update environment files
echo "🔧 Updating environment files..."
if [ "$current_branch" = "main" ]; then
    cp .env.production .env
elif [ "$current_branch" = "test" ]; then
    cp .env.test .env
else
    cp .env.development .env
fi

# 5. Regenerate Prisma client
echo "🔄 Regenerating Prisma client..."
npm run prisma:generate

# 6. Build project
echo "🏗️ Building project..."
npm run build

echo "✅ Post-merge actions completed"
exit 0
```

## Package.json Scripts Required

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "format": "prettier --write \"src/**/*.{ts,js,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,js,json,md}\"",
    "test:all": "jest --coverage",
    "analyze:bundle": "npm run build && npx webpack-bundle-analyzer dist/static/js/*.js",
    "clean:cache": "rm -rf node_modules/.cache dist/.cache",
    "prisma:validate": "prisma validate",
    "prisma:migrate:status": "prisma migrate status",
    "prisma:migrate:deploy": "prisma migrate deploy",
    "prisma:generate": "prisma generate"
  }
}
```

## Installation Instructions

### 1. Create Hook Directory Structure
```bash
mkdir -p .git/hooks
chmod +x .git/hooks/*
```

### 2. Install Hooks
```bash
# Copy each hook file to .git/hooks/
cp docs/hooks/pre-commit .git/hooks/
cp docs/hooks/commit-msg .git/hooks/
cp docs/hooks/pre-push .git/hooks/
cp docs/hooks/post-commit .git/hooks/
cp docs/hooks/pre-rebase .git/hooks/
cp docs/hooks/post-merge .git/hooks/

# Make them executable
chmod +x .git/hooks/*
```

### 3. Install Dependencies
```bash
npm install --save-dev prettier eslint jest webpack-bundle-analyzer
```

### 4. Create Environment Files
```bash
# Create environment files for each branch
cp .env .env.development
cp .env .env.test
cp .env .env.production
```

## Hook Management

### Disabling Hooks Temporarily
```bash
# Skip pre-commit hook
git commit --no-verify -m "message"

# Skip pre-push hook
git push --no-verify
```

### Updating Hooks
```bash
# Update hooks from repository
git pull origin dev
cp docs/hooks/* .git/hooks/
chmod +x .git/hooks/*
```

### Testing Hooks
```bash
# Test pre-commit hook
.git/hooks/pre-commit

# Test commit-msg hook
echo "feat: test commit" | .git/hooks/commit-msg
```

## Benefits

### 1. **Code Quality Enforcement**
- Automatic linting and formatting
- TypeScript compilation validation
- Test execution before commits

### 2. **Consistency**
- Standardized commit messages
- Consistent development workflow
- Team-wide best practices

### 3. **Database Safety**
- Migration validation
- Schema consistency checks
- Production safety measures

### 4. **Environment Management**
- Branch-specific validations
- Environment file management
- Deployment workflow enforcement

### 5. **Automation**
- Automatic dependency updates
- Cache clearing
- Environment switching

## Troubleshooting

### Common Issues

1. **Hook Not Executing**
   - Check file permissions: `chmod +x .git/hooks/hook-name`
   - Verify hook location: `.git/hooks/`
   - Check hook syntax

2. **Performance Issues**
   - Optimize hook execution time
   - Use parallel execution where possible
   - Cache results when appropriate

3. **False Positives**
   - Adjust validation rules
   - Add bypass options
   - Improve error messages

### Debug Mode
```bash
# Enable debug mode for hooks
export GIT_HOOKS_DEBUG=1
git commit -m "test"
```

## Conclusion

These Git hooks provide comprehensive enforcement of your environment and database management rules. They ensure code quality, consistency, and safety across all branches while maintaining the established workflow patterns.

The hooks are designed to be:
- **Fast**: Optimized for quick execution
- **Flexible**: Configurable and bypassable when needed
- **Comprehensive**: Cover all critical aspects of your workflow
- **Maintainable**: Easy to update and modify

Regular review and updates of these hooks will ensure they continue to serve your project's evolving needs.
