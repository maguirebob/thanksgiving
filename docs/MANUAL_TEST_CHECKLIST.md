# Manual Test Checklist - Photo Upload Functionality

## 🎯 **Objective**
Verify that photo upload functionality works correctly for multiple photos without Bootstrap errors.

## 📋 **Pre-Test Setup**

### **Environment Setup**
- [ ] Clear browser cache and cookies
- [ ] Open DevTools Console (F12)
- [ ] Navigate to `http://localhost:3000/events/26`
- [ ] Verify page loads completely
- [ ] Check console for any initial errors (should be none)

### **Test Files Preparation**
- [ ] Prepare 3+ test photo files (JPG format, < 5MB each)
- [ ] Name them: `test-photo-1.jpg`, `test-photo-2.jpg`, `test-photo-3.jpg`
- [ ] Ensure files are accessible for upload

## 🧪 **Test Cases**

### **Test 1: First Photo Upload**

#### **Steps**
- [ ] Click "Upload Photo" button
- [ ] Verify upload modal opens (no grey screen)
- [ ] Select `test-photo-1.jpg` file
- [ ] Fill in description: "Test Photo 1"
- [ ] Fill in caption: "First Upload Test"
- [ ] Click "Upload Photo" button

#### **Expected Results**
- [ ] Success message "Photo uploaded successfully!" appears
- [ ] Modal closes automatically
- [ ] Photo appears in the photos grid
- [ ] Photo count badge shows "1"
- [ ] No errors in console
- [ ] Photo displays with correct caption and description

#### **Console Check**
- [ ] No "Illegal invocation" errors
- [ ] No "selector-engine" errors
- [ ] No Bootstrap-related errors
- [ ] No JavaScript errors

---

### **Test 2: Second Photo Upload**

#### **Steps**
- [ ] Click "Upload Photo" button again
- [ ] Verify upload modal opens (no grey screen, no Bootstrap errors)
- [ ] Select `test-photo-2.jpg` file
- [ ] Fill in description: "Test Photo 2"
- [ ] Fill in caption: "Second Upload Test"
- [ ] Click "Upload Photo" button

#### **Expected Results**
- [ ] Success message appears
- [ ] Modal closes automatically
- [ ] Both photos appear in the photos grid
- [ ] Photo count badge shows "2"
- [ ] No errors in console
- [ ] Upload button remains functional

#### **Console Check**
- [ ] No "Illegal invocation" errors
- [ ] No "selector-engine" errors
- [ ] No Bootstrap-related errors
- [ ] No JavaScript errors

---

### **Test 3: Third Photo Upload**

#### **Steps**
- [ ] Click "Upload Photo" button again
- [ ] Verify upload modal opens consistently
- [ ] Select `test-photo-3.jpg` file
- [ ] Fill in description: "Test Photo 3"
- [ ] Fill in caption: "Third Upload Test"
- [ ] Click "Upload Photo" button

#### **Expected Results**
- [ ] Success message appears
- [ ] Modal closes automatically
- [ ] All three photos appear in the photos grid
- [ ] Photo count badge shows "3"
- [ ] No errors in console
- [ ] Consistent behavior across multiple uploads

#### **Console Check**
- [ ] No "Illegal invocation" errors
- [ ] No "selector-engine" errors
- [ ] No Bootstrap-related errors
- [ ] No JavaScript errors

---

### **Test 4: Photo Management Functions**

#### **Photo Viewing**
- [ ] Click "View" button on any photo
- [ ] Verify photo viewer modal opens
- [ ] Verify photo displays correctly
- [ ] Close photo viewer
- [ ] Verify modal closes properly

#### **Photo Editing**
- [ ] Click "Edit" button on any photo
- [ ] Verify edit functionality works (if implemented)
- [ ] Close edit modal

#### **Photo Deletion**
- [ ] Click "Delete" button on any photo
- [ ] Confirm deletion if prompted
- [ ] Verify photo is removed from grid
- [ ] Verify photo count updates correctly

---

### **Test 5: Error Handling**

#### **No File Selected**
- [ ] Click "Upload Photo" button
- [ ] Don't select any file
- [ ] Fill in description and caption
- [ ] Click "Upload Photo" button
- [ ] Verify error message appears
- [ ] Verify modal remains open

#### **Invalid File Type**
- [ ] Click "Upload Photo" button
- [ ] Select a non-image file (e.g., .txt file)
- [ ] Click "Upload Photo" button
- [ ] Verify error message appears
- [ ] Verify modal remains open

#### **Oversized File**
- [ ] Click "Upload Photo" button
- [ ] Select a very large image file (> 10MB)
- [ ] Click "Upload Photo" button
- [ ] Verify error message appears
- [ ] Verify modal remains open

---

### **Test 6: Multiple Uploads Stress Test**

#### **Steps**
- [ ] Upload 5+ photos in rapid succession
- [ ] Verify each upload works correctly
- [ ] Verify all photos appear in grid
- [ ] Verify photo count updates correctly
- [ ] Verify no performance degradation

#### **Expected Results**
- [ ] All uploads successful
- [ ] All photos visible in grid
- [ ] Correct photo count
- [ ] No console errors
- [ ] Consistent performance

---

## 🚨 **Troubleshooting Guide**

### **If Upload Button Doesn't Work**
1. Check console for JavaScript errors
2. Verify PhotoComponent is initialized
3. Check if modal opens when button is clicked
4. Verify file input is working

### **If Bootstrap Errors Occur**
1. Check console for "Illegal invocation" errors
2. Verify Bootstrap components are not conflicting
3. Check if custom modal system is interfering
4. Verify PhotoComponent is handling modals correctly

### **If Photos Don't Display**
1. Check network tab for API errors
2. Verify photo API endpoints are working
3. Check if photos are being saved to database
4. Verify photo file serving is working

### **If Modal Issues Occur**
1. Check if modal opens/closes properly
2. Verify no grey screen issues
3. Check if multiple modals are conflicting
4. Verify event handlers are not duplicated

## ✅ **Success Criteria**

### **Functional Requirements**
- [ ] Upload button works consistently for multiple uploads
- [ ] No Bootstrap "Illegal invocation" errors
- [ ] No grey screen issues
- [ ] Photos display correctly in grid
- [ ] Modal opens/closes properly
- [ ] Error handling works gracefully

### **Technical Requirements**
- [ ] Clean console output (no errors)
- [ ] Consistent user experience
- [ ] Proper error handling
- [ ] No performance degradation

### **Test Completion**
- [ ] All test cases completed successfully
- [ ] 3+ photos uploaded successfully
- [ ] No regressions in existing functionality
- [ ] All success criteria met

## 📝 **Test Results**

### **Test Date**: ___________
### **Tester**: ___________
### **Browser**: ___________
### **Environment**: ___________

### **Results Summary**
- [ ] Test 1: First Photo Upload - ✅ Pass / ❌ Fail
- [ ] Test 2: Second Photo Upload - ✅ Pass / ❌ Fail
- [ ] Test 3: Third Photo Upload - ✅ Pass / ❌ Fail
- [ ] Test 4: Photo Management - ✅ Pass / ❌ Fail
- [ ] Test 5: Error Handling - ✅ Pass / ❌ Fail
- [ ] Test 6: Stress Test - ✅ Pass / ❌ Fail

### **Issues Found**
- [ ] Issue 1: ___________
- [ ] Issue 2: ___________
- [ ] Issue 3: ___________

### **Overall Result**
- [ ] ✅ All tests passed - Ready for deployment
- [ ] ❌ Issues found - Requires fixes before deployment

### **Notes**
___________
___________
___________
