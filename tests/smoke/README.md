# Smoke Tests - Human Readable Guide

## 🤔 **What Are Smoke Tests?**

Think of smoke tests like checking if your car starts before going on a long trip. They're quick, essential tests that verify the most important parts of our Thanksgiving website are working correctly. If smoke tests fail, it means something fundamental is broken and needs immediate attention.

## 🎯 **What We're Testing**

### **Core Website Functions**
- **Can users log in?** - The website requires login, so we test that the login page works
- **Does the homepage load?** - Users should be redirected to login when they visit the site
- **Are admin features protected?** - Only logged-in admins should access admin functions

### **Admin Dashboard**
- **Can admins access the dashboard?** - After logging in, admins should see the admin panel
- **Does the volume viewer work?** - Admins need to see what files are stored
- **Can admins add new menus?** - The "Add Menu" button should open the form
- **Are file uploads working?** - Admins should be able to upload images

### **Database & APIs**
- **Is the database connected?** - The website needs to read/write data
- **Do API endpoints work?** - The website communicates with itself via APIs
- **Is data being saved correctly?** - When admins create menus, they should be stored

### **Error Handling**
- **What happens with broken links?** - Users shouldn't see scary error messages
- **Are security measures working?** - Unauthorized users can't access admin features
- **Does the site handle problems gracefully?** - Errors should be user-friendly

## 🚀 **How to Run Smoke Tests**

### **For Local Development**
```bash
# Start your local server first
npm run dev

# Then run smoke tests (in a new terminal)
ts-node scripts/run-smoke-tests.ts
```

### **For Test Environment**
```bash
# Test the Railway test environment
TEST_BASE_URL=https://thanksgiving-test-test.up.railway.app ts-node scripts/run-smoke-tests.ts
```

### **For Production Environment**
```bash
# Test the Railway production environment
TEST_BASE_URL=https://thanksgiving-prod-production.up.railway.app ts-node scripts/run-smoke-tests.ts
```

### **Visual Tests (E2E)**
```bash
# Run tests that actually open a browser and click around
npx playwright test tests/e2e/smoke.spec.ts

# Run with visible browser (see what's happening)
npx playwright test tests/e2e/smoke.spec.ts --headed
```

## 📊 **Understanding Test Results**

### **✅ All Tests Pass**
```
✅ Database Connection - PASS (245ms)
✅ Admin Dashboard Access - PASS (156ms)
✅ File Upload Endpoint Exists - PASS (89ms)
...
🎉 All smoke tests passed! Environment is ready.
```
**What this means**: Everything is working correctly! The website is ready for users.

### **❌ Some Tests Fail**
```
✅ Database Connection - PASS (245ms)
❌ Admin Dashboard Access - FAIL (156ms)
   Error: Admin dashboard does not require authentication
✅ File Upload Endpoint Exists - PASS (89ms)
...
💥 Some smoke tests failed. Please check the issues above.
```
**What this means**: Something important is broken. Don't deploy until these are fixed.

### **⚠️ Slow Tests**
```
✅ Database Connection - PASS (2450ms)  # This is slow!
✅ Admin Dashboard Access - PASS (156ms)
```
**What this means**: The website works but is slow. Consider investigating performance.

## 🔧 **Common Issues and What They Mean**

### **"Database Connection Failed"**
- **What it means**: The website can't talk to the database
- **Likely cause**: Database server is down or connection string is wrong
- **What to do**: Check Railway database status, verify connection settings

### **"Admin Dashboard Does Not Require Authentication"**
- **What it means**: Anyone can access admin features without logging in
- **Likely cause**: Authentication middleware is broken or missing
- **What to do**: Check that admin routes have proper authentication

### **"Volume Contents API Failed"**
- **What it means**: Admins can't see what files are stored
- **Likely cause**: File system permissions or Railway volume issues
- **What to do**: Check Railway volume mounting and file permissions

### **"Response Time Too Slow"**
- **What it means**: The website takes too long to respond
- **Likely cause**: Server overload, slow database queries, or network issues
- **What to do**: Check server performance, optimize database queries

## 🎯 **When to Run Smoke Tests**

### **Before Deploying**
Always run smoke tests before pushing changes to production. This catches major issues before users see them.

### **After Deploying**
Run smoke tests after deployment to make sure everything is working in the live environment.

### **When Something Seems Wrong**
If users report issues, run smoke tests to see if it's a widespread problem or isolated issue.

### **Regular Maintenance**
Run smoke tests weekly to catch issues early, even when nothing seems wrong.

## 🏠 **Environment-Specific Notes**

### **Local Development**
- **URL**: http://localhost:3000
- **Database**: Local PostgreSQL or Railway database
- **Files**: Stored in local `public/images` folder
- **Notes**: Make sure your local server is running before testing

### **Test Environment**
- **URL**: https://thanksgiving-test-test.up.railway.app
- **Database**: Railway test database
- **Files**: Stored in Railway test volume
- **Notes**: This is where we test changes before production

### **Production Environment**
- **URL**: https://thanksgiving-prod-production.up.railway.app
- **Database**: Railway production database
- **Files**: Stored in Railway production volume
- **Notes**: This is the live website that family members use

## 🚨 **Emergency Procedures**

### **If All Tests Fail**
1. **Check Railway status** - Is the service running?
2. **Check database** - Is the database accessible?
3. **Check recent changes** - What was deployed recently?
4. **Rollback if needed** - Revert to last working version

### **If Some Tests Fail**
1. **Identify the pattern** - Are all failures related to one feature?
2. **Check logs** - Look at Railway logs for error details
3. **Test locally** - Can you reproduce the issue locally?
4. **Fix and redeploy** - Address the specific issues

### **If Tests Are Slow**
1. **Check server resources** - Is Railway running out of memory/CPU?
2. **Check database performance** - Are queries taking too long?
3. **Check network** - Are there connectivity issues?
4. **Consider scaling** - Does the service need more resources?

## 📚 **Getting Help**

### **Test Documentation**
- **Technical Details**: See `docs/SMOKE_TEST_COVERAGE.md`
- **Test Code**: Check `tests/e2e/smoke.spec.ts` and `scripts/run-smoke-tests.ts`

### **Railway Resources**
- **Railway Dashboard**: Check service status and logs
- **Railway Documentation**: https://docs.railway.app/

### **Common Commands**
```bash
# Check Railway service status
railway status

# View Railway logs
railway logs

# Check database connection
railway run npx prisma db push
```

## 🎉 **Success Criteria**

### **All Environments Ready When**:
- ✅ All smoke tests pass
- ✅ Response times are under 5 seconds
- ✅ No security vulnerabilities
- ✅ All admin functions work
- ✅ File uploads work
- ✅ Database operations work

### **Ready for Family Use When**:
- ✅ Production smoke tests pass
- ✅ Custom domain works (maguirethanksgiving.com)
- ✅ All menu images display correctly
- ✅ Admin can manage content
- ✅ Users can log in and view content

---

**Remember**: Smoke tests are your safety net. They catch big problems before they become user problems. Run them regularly, and your Thanksgiving website will stay healthy and happy! 🦃
