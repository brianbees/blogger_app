# Image Notes Feature Documentation

## Overview

The Image Notes feature allows users to capture and store images locally with optional captions, view them in a full-screen viewer with zoom/pan capabilities, and manage them alongside voice recordings in the unified feed.

## Features

### 1. Image Upload
- **Access**: Tap the 🖼️ Image button in the bottom navigation bar
- **File Types**: JPG, JPEG, PNG
- **Max Size**: 10MB per image
- **Source**: Native file picker (works on all devices including PWAs)
- **Validation**: Automatic type and size checking with error toasts

### 2. Preview Sheet
- **Design**: Slide-up panel matching RecordPanel styling
- **Layout**: 
  - Rounded corners with shadow
  - White background
  - Comfortable padding
  - Anchored above bottom bar
- **Components**:
  - Image preview (rounded corners, max height ~264px, object-cover)
  - Optional caption field (single-line, 200 char limit)
  - Character counter (x/200)
  - Cancel button (gray)
  - Save Image button (blue, primary)
- **Backdrop**: Semi-transparent overlay, dismissible by clicking outside

### 3. Storage
- **Format**: Images stored as Blob objects in IndexedDB
- **Schema**: 
  ```javascript
  {
    id: "snippet-{timestamp}-{random}",
    type: "image",
    timestamp: 1234567890123,
    createdAt: 1234567890123,
    dayKey: "2026-02-13",
    mediaBlob: Blob,
    caption: "Optional caption text",
    dataVersion: 1,
    syncStatus: "local"
  }
  ```
- **Database**: IndexedDB v3 with `timestamp` and `type` indices
- **No Base64**: Images stored as Blobs for efficiency (base64 only for export)

### 4. Feed Card Rendering
- **Style**: Matches Stage-2 card styling
- **Layout**:
  - Timestamp row with 🖼️ icon
  - Full-width thumbnail (max height 200px, object-cover, rounded corners)
  - Optional caption below image
  - Delete icon (🗑️) top-right
- **Interaction**: 
  - Tap card to open full-screen viewer
  - Hover shows 👁️ overlay icon
  - Delete requires confirmation

### 5. Full-Screen Viewer
- **Design**:
  - Dark backdrop (95% opacity black)
  - Centered image with padding
  - Close button (X) top-right
  - z-index 100 (above all other UI)
- **Controls**:
  - Double-tap to toggle zoom (1x ↔ 2x)
  - Drag to pan when zoomed
  - Close button or backdrop tap to dismiss
  - Zoom indicator shows current scale
- **Helper Text**: Context-aware instructions at bottom
- **Touch Gestures**: Optimized for mobile (Samsung S21 tested)

### 6. Error Handling
- **Toast Notifications**: Non-blocking, 5-second duration, auto-dismiss
- **Error Cases**:
  - Unsupported file type → "Please select a JPG or PNG image"
  - File too large → "Image is too large. Maximum size is 10MB"
  - Storage quota exceeded → "Storage quota exceeded! Please free up space"
  - Save failure → Shows specific error message from storage layer
- **No Side Effects**: Cancelled uploads leave no artifacts

## Component Architecture

### New Components

1. **Toast.jsx** (`src/components/Toast.jsx`)
   - Props: `message`, `type` ('error' | 'info'), `onClose`, `duration`
   - Auto-dismiss after duration
   - Positioned top-center, below header
   - Slide-down animation

2. **ImagePreviewSheet.jsx** (`src/components/ImagePreviewSheet.jsx`)
   - Props: `imageFile`, `onSave`, `onCancel`
   - Manages preview URL lifecycle (createObjectURL/revokeObjectURL)
   - Caption state management
   - Backdrop dismiss support

3. **ImageViewer.jsx** (`src/components/ImageViewer.jsx`)
   - Props: `imageUrl`, `onClose`
   - Zoom state: scale (1x or 2x), position (x, y)
   - Touch/mouse event handling for pan
   - Double-tap detection (300ms threshold)
   - Body scroll lock while open

### Updated Components

1. **BottomBar.jsx**
   - Added hidden file input (accept="image/jpeg,image/jpg,image/png")
   - Added `onImageSelect` callback prop
   - File input triggers on Image button click

2. **SnippetCard.jsx**
   - Type detection: renders differently for audio vs image
   - Image branch: thumbnail, caption, delete, click-to-view
   - Audio branch: unchanged (existing playback controls)
   - Added `onImageClick` callback prop

3. **DailyFeed.jsx**
   - Passes `onImageClick` to SnippetCard components

4. **App.jsx**
   - Image state: `selectedImageFile`, `viewerImageUrl`, `toast`
   - Validation: MAX_IMAGE_SIZE (10MB), ALLOWED_IMAGE_TYPES
   - Handlers: `handleImageSelect`, `handleImageSave`, `handleImageCancel`
   - Toast management: `showToast`, `closeToast`

### Updated Utils

1. **storage.js** (v3)
   - Database version upgraded to 3
   - Added `timestamp` and `type` indices
   - `saveSnippet()` validates `mediaBlob` for type="image"
   - `exportAllData()` handles image blobs → base64
   - `importData()` handles base64 → image blobs

## Acceptance Criteria

✅ Image picker opens when Image button tapped  
✅ Selected image appears in preview sheet  
✅ Caption input works (200 char limit with counter)  
✅ Save creates persisted image snippet in IndexedDB  
✅ Card renders correctly with Stage-2 styling  
✅ Tapping card opens full-screen viewer  
✅ Double-tap zoom works  
✅ Pan works when zoomed  
✅ Close/dismiss works correctly  
✅ Delete requires confirmation  
✅ Works smoothly on Samsung S21  
✅ No regressions to voice recording  
✅ Toast notifications appear for errors  
✅ Cancelled uploads have no side effects

## Testing on Android (Samsung S21)

### Setup
1. Start dev server with `npm run dev -- --host`
2. Note the Network URL (e.g., https://192.168.0.72:5173/)
3. On Samsung S21, connect to same WiFi
4. Navigate to the URL in Chrome/Samsung Internet
5. Accept self-signed SSL certificate warning

### Test Cases

**TC1: Upload and Save Image**
1. Tap 🖼️ Image button
2. Select a photo from gallery
3. Add caption "Test image from S21"
4. Tap "Save Image"
5. Verify image appears at top of feed
6. Verify caption displays correctly

**TC2: Full-Screen Viewer**
1. Tap any image card in feed
2. Verify full-screen viewer opens
3. Double-tap to zoom in (should show "2.0×" indicator)
4. Drag to pan around image
5. Double-tap to zoom out
6. Tap X or backdrop to close

**TC3: Error Handling**
1. Try to upload a PDF file → should show error toast
2. Try to upload a very large image (>10MB) → should show size error
3. Cancel image selection → should return to feed with no changes

**TC4: Delete Image**
1. Tap 🗑️ on image card
2. Confirm deletion
3. Verify image removed from feed

**TC5: Mixed Feed**
1. Record a voice note
2. Upload an image
3. Record another voice note
4. Verify all snippets display correctly grouped by date
5. Verify each type works independently (play audio, view image)

## Browser Support

- Chrome 90+ (MediaRecorder API + IndexedDB)
- Safari 14+ (iOS/iPadOS)
- Samsung Internet 14+
- Firefox 88+
- Edge 90+

## Performance Notes

- Images stored as Blobs (efficient, no base64 overhead)
- Object URLs created/destroyed per component lifecycle
- Maximum 10MB per image enforced client-side
- No image compression in this version (future enhancement)

## Future Enhancements (Stage 3)

- Image compression before storage
- Multiple image upload
- Camera capture (in addition to file picker)
- Image editing (crop, rotate, filters)
- Gallery view (grid layout)
- Image search by caption
- Pinch-to-zoom gesture (currently double-tap only)
- Swipe-down to dismiss viewer
