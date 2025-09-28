# Test Fixtures Setup

## 📁 **Test Files Required**

The automated tests require test image files in the `tests/fixtures/` directory:

### **Required Files**
- `test-photo-1.jpg` - Small test image (1-2MB)
- `test-photo-2.jpg` - Small test image (1-2MB) 
- `test-photo-3.jpg` - Small test image (1-2MB)

### **File Specifications**
- **Format**: JPG
- **Size**: 1-2MB each
- **Dimensions**: 800x600 pixels or similar
- **Content**: Any appropriate test image

### **Creating Test Files**

#### **Option 1: Use Existing Images**
```bash
# Copy existing images to test fixtures
cp public/images/2024_Menu.jpeg tests/fixtures/test-photo-1.jpg
cp public/images/2023_Menu.jpeg tests/fixtures/test-photo-2.jpg
cp public/images/2022_Menu.jpeg tests/fixtures/test-photo-3.jpg
```

#### **Option 2: Create Test Images**
```bash
# Create simple test images using ImageMagick (if available)
convert -size 800x600 xc:red tests/fixtures/test-photo-1.jpg
convert -size 800x600 xc:green tests/fixtures/test-photo-2.jpg
convert -size 800x600 xc:blue tests/fixtures/test-photo-3.jpg
```

#### **Option 3: Download Test Images**
```bash
# Download small test images from the internet
curl -o tests/fixtures/test-photo-1.jpg "https://via.placeholder.com/800x600/FF0000/FFFFFF?text=Test+Photo+1"
curl -o tests/fixtures/test-photo-2.jpg "https://via.placeholder.com/800x600/00FF00/FFFFFF?text=Test+Photo+2"
curl -o tests/fixtures/test-photo-3.jpg "https://via.placeholder.com/800x600/0000FF/FFFFFF?text=Test+Photo+3"
```

### **Verification**
```bash
# Verify test files exist
ls -la tests/fixtures/
# Should show:
# test-photo-1.jpg
# test-photo-2.jpg
# test-photo-3.jpg
```

## 🧪 **Running Tests**

### **Automated Tests**
```bash
# Run Playwright tests
npx playwright test tests/e2e/photo-upload.test.js

# Run with UI mode
npx playwright test tests/e2e/photo-upload.test.js --ui

# Run specific test
npx playwright test tests/e2e/photo-upload.test.js -g "multiple photos"
```

### **Manual Tests**
1. Follow the `docs/MANUAL_TEST_CHECKLIST.md`
2. Use the same test files for manual testing
3. Document results in the checklist

## 📝 **Notes**
- Test files should be small enough to upload quickly
- Files should be valid JPG format
- Ensure files are accessible by the test runner
- Consider using different images to verify they're distinct
