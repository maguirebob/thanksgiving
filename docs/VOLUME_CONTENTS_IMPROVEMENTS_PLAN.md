# Volume Contents Screen Improvements Plan

## Current Issues Identified

### 1. File vs. Event Mismatch
- **55 total files** in Railway volume
- **26 events (menus)** in database
- **29 orphaned files** not linked to any menu/event
- Need visibility into which files are actually being used

### 2. Preview Button Not Working
- Preview button exists but doesn't function
- Users can't see image contents
- No visual feedback when clicking preview

### 3. Unused Sync Button
- Sync button present but not being used
- Creates confusion in UI
- Should be removed for cleaner interface

## Proposed Solutions

### Phase 1: Database Analysis and File Linking Status

#### 1.1 Create File Status Detection
**Goal**: Identify which volume files are linked to database events

**Implementation**:
- Query database for all `menu_image_filename` values
- Compare against volume file list
- Categorize files as:
  - **Linked**: File exists in volume AND has database record
  - **Orphaned**: File exists in volume but NO database record
  - **Missing**: Database record exists but file missing from volume

**Code Changes**:
```typescript
// In adminRoutes.ts - volume-contents endpoint
const linkedFilenames = await prisma.event.findMany({
  select: { menu_image_filename: true }
}).then(events => events.map(e => e.menu_image_filename).filter(Boolean));

// Add file status to each file object
files.forEach(file => {
  file.isLinked = linkedFilenames.includes(file.name);
  file.status = file.isLinked ? 'linked' : 'orphaned';
});
```

#### 1.2 Add Status Column to Volume Contents Table
**Goal**: Display file linking status in the UI

**UI Changes**:
- Add "Status" column to file listing table
- Show badges: "Linked" (green) or "Orphaned" (red)
- Add tooltip explaining what each status means

**HTML Structure**:
```html
<th>Status</th> <!-- New column header -->
<td>
  <span class="badge bg-success">Linked</span>
  <!-- OR -->
  <span class="badge bg-danger">Orphaned</span>
</td>
```

### Phase 2: Fix Preview Button Functionality

#### 2.1 Debug Preview Button Issue
**Goal**: Identify why preview button isn't working

**Investigation Steps**:
- Check if `previewImage()` function is being called
- Verify image URL construction (`/images/${filename}`)
- Test if images are accessible via direct URL
- Check for CORS or static file serving issues

#### 2.2 Implement Working Preview
**Goal**: Enable users to preview images from volume

**Implementation Options**:
1. **Modal Preview**: Open image in Bootstrap modal
2. **New Tab**: Open image in new browser tab
3. **Inline Preview**: Show image below table row

**Recommended Approach**: Modal preview with fallback to new tab

**Code Changes**:
```javascript
function previewImage(filename) {
  const imageUrl = `/images/${filename}`;
  
  // Test if image loads
  const img = new Image();
  img.onload = function() {
    // Show modal preview
    showImageModal(imageUrl, filename);
  };
  img.onerror = function() {
    // Fallback to new tab
    window.open(imageUrl, '_blank');
  };
  img.src = imageUrl;
}
```

### Phase 3: Remove Unused Sync Button

#### 3.1 Identify Sync Button Location
**Goal**: Find and remove the unused sync button

**Current Buttons in Volume Modal**:
- "Refresh" button (working - keep)
- "Sync Uploaded Images" button (working - keep)
- "Sync Local Images" button (unused - remove)

#### 3.2 Remove Unused Button
**Goal**: Clean up UI by removing unused functionality

**Changes**:
- Remove HTML button element
- Remove associated JavaScript event listener
- Remove any related CSS styling
- Update button layout if needed

### Phase 4: Enhanced File Management

#### 4.1 Add File Actions
**Goal**: Provide actions for managing files in volume

**Proposed Actions**:
- **Link to Event**: Create database record for orphaned file
- **Delete File**: Remove file from volume (with confirmation)
- **Download File**: Download file for backup
- **Preview File**: View file contents (fixed from Phase 2)

#### 4.2 Add Bulk Operations
**Goal**: Handle multiple orphaned files efficiently

**Bulk Actions**:
- **Select All Orphaned**: Checkbox to select all orphaned files
- **Bulk Link**: Create events for multiple files
- **Bulk Delete**: Remove multiple files from volume (with confirmation)
- **Bulk Download**: Download multiple files as ZIP

## Implementation Plan

### Phase 1: Database Analysis (Priority: High)
**Estimated Time**: 2-3 hours
**Tasks**:
1. Update `GET /admin/volume-contents` endpoint to include file status
2. Add status column to volume contents table
3. Test with current 55 files to verify status detection

### Phase 2: Fix Preview Button (Priority: High)
**Estimated Time**: 1-2 hours
**Tasks**:
1. Debug current preview functionality
2. Implement working preview (modal or new tab)
3. Test with various image types and sizes

### Phase 3: Remove Unused Button (Priority: Medium)
**Estimated Time**: 30 minutes
**Tasks**:
1. Identify unused sync button
2. Remove HTML and JavaScript
3. Test that other buttons still work

### Phase 4: Enhanced Management (Priority: Low)
**Estimated Time**: 4-6 hours
**Tasks**:
1. Add file action buttons (including delete)
2. Implement bulk operations (including bulk delete)
3. Add confirmation dialogs for destructive actions
4. Implement file deletion API endpoint
5. Add safety checks for linked files

### File Deletion Implementation

#### 4.3 File Deletion API Endpoint
**Goal**: Provide safe file deletion from Railway volume

**API Endpoint**: `DELETE /admin/volume-file/:filename`
**Method**: DELETE
**Parameters**: filename (from URL path)
**Response**: Success/error status with details

**Implementation**:
```typescript
router.delete('/volume-file/:filename', async (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    
    // Safety check: prevent deletion of linked files
    const linkedEvent = await prisma.event.findFirst({
      where: { menu_image_filename: filename }
    });
    
    if (linkedEvent) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete file "${filename}" - it is linked to event "${linkedEvent.event_name}"`
      });
    }
    
    // Delete file from volume
    const filePath = path.join(getVolumePath(), filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      return res.json({
        success: true,
        message: `File "${filename}" deleted successfully`
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `File "${filename}" not found in volume`
      });
    }
    
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

#### 4.4 File Deletion UI Components
**Goal**: Provide intuitive file deletion interface

**UI Elements**:
- **Delete Button**: Red button with trash icon for each file
- **Confirmation Modal**: Bootstrap modal asking for confirmation
- **Status-based Styling**: Disabled delete button for linked files
- **Progress Indicator**: Show deletion progress for bulk operations

**HTML Structure**:
```html
<td>
  <button class="btn btn-sm btn-outline-danger" 
          onclick="deleteFile('${file.name}')"
          ${file.isLinked ? 'disabled title="Cannot delete linked file"' : ''}>
    <i class="fas fa-trash"></i>
  </button>
</td>
```

**JavaScript Implementation**:
```javascript
async function deleteFile(filename) {
  // Show confirmation modal
  const confirmed = confirm(`Are you sure you want to delete "${filename}"?`);
  
  if (!confirmed) return;
  
  try {
    const response = await fetch(`/admin/volume-file/${filename}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showMessage(`✅ ${data.message}`, 'success');
      // Refresh volume contents
      loadVolumeContents();
    } else {
      showMessage(`❌ ${data.message}`, 'error');
    }
    
  } catch (error) {
    console.error('Error deleting file:', error);
    showMessage('❌ Network error occurred', 'error');
  }
}
```

#### 4.5 Safety Measures for File Deletion
**Goal**: Prevent accidental deletion of important files

**Safety Checks**:
1. **Linked File Protection**: Prevent deletion of files linked to events
2. **Confirmation Dialog**: Require user confirmation before deletion
3. **Visual Indicators**: Disabled buttons for protected files
4. **Error Handling**: Clear error messages for failed deletions
5. **Audit Trail**: Log all deletion attempts (optional)

**Protection Rules**:
- ✅ **Allow deletion**: Orphaned files (not linked to any event)
- ❌ **Prevent deletion**: Files linked to events
- ❌ **Prevent deletion**: System files (if any)
- ❌ **Prevent deletion**: Files with special naming patterns

## Technical Considerations

### Database Performance
- File status detection should be efficient
- Consider caching linked filenames if volume is large
- Use database indexes on `menu_image_filename` field

### Error Handling
- Handle cases where files exist but are corrupted
- Provide fallback for preview failures
- Validate file operations before execution

### User Experience
- Show loading states for file operations
- Provide clear feedback for all actions
- Use consistent styling and interactions

## Success Criteria

### Phase 1 Complete When:
- ✅ Volume contents shows file status (Linked/Orphaned)
- ✅ Status detection is accurate for all 55 files
- ✅ UI clearly indicates which files are in use

### Phase 2 Complete When:
- ✅ Preview button opens image successfully
- ✅ Preview works for all image types (JPEG, PNG)
- ✅ Fallback works if preview fails

### Phase 3 Complete When:
- ✅ Unused sync button is removed
- ✅ Remaining buttons work correctly
- ✅ UI is cleaner and less confusing

### Phase 4 Complete When:
- ✅ Users can manage orphaned files
- ✅ File deletion works safely with confirmation
- ✅ Linked files are protected from deletion
- ✅ Bulk operations work efficiently
- ✅ File management is intuitive and safe

## Next Steps

1. **Start with Phase 1**: Implement file status detection
2. **Test thoroughly**: Verify with current 55 files
3. **Move to Phase 2**: Fix preview functionality
4. **Clean up Phase 3**: Remove unused button
5. **Consider Phase 4**: Based on user needs and time available

## Files to Modify

- `src/routes/adminRoutes.ts` - Update volume-contents endpoint
- `views/admin/dashboard.ejs` - Update volume contents modal UI
- `src/middleware/upload.ts` - No changes needed
- `railway.json` - No changes needed

## Testing Strategy

1. **Unit Tests**: Test file status detection logic
2. **Integration Tests**: Test volume contents API endpoint
3. **UI Tests**: Test preview functionality and button removal
4. **Manual Testing**: Verify with real volume contents

---

**Priority**: High - These improvements will significantly enhance the admin experience and provide visibility into file management issues.
