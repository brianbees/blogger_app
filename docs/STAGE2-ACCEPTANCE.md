# Stage 2 Acceptance Tests

## Manual Test Steps

### Test 1: Save Snippet

**Steps:**
1. Open application in browser
2. Click the blue microphone FAB button (center of bottom bar)
3. Allow microphone permission when prompted
4. Speak for 3-5 seconds (watch the timer in slide-up panel)
5. Click the red "Stop Recording" button
6. Wait for "Saving..." inline banner to complete

**Expected Result:**
- Slide-up recording panel appears with red pulsing dot
- Timer counts up correctly (0:00, 0:01, 0:02...)
- Recording appears in DailyFeed under today's date header
- Custom audio player with blue play button is visible
- Duration matches recording time (e.g., "5s" for 5-second recording)
- No error banner appears

---

### Test 2: List Snippets by Date

**Steps:**
1. Open browser DevTools console
2. Run:
```javascript
import { getSnippetsByDate } from './src/utils/storage.js';
const today = new Date().toISOString().split('T')[0]; // e.g., "2026-02-13"
const snippets = await getSnippetsByDate(today);
console.log('Snippets for today:', snippets);
```

**Alternative UI Test:**
1. Record multiple snippets on same day
2. Check that all appear grouped under same date header (📅 YYYY-MM-DD)
3. Verify snippets are ordered newest first

**Expected Result:**
- Array of snippets for specified date returned
- Snippets sorted by createdAt descending
- Each snippet has: id, createdAt, dayKey, duration, audioBlob, dataVersion

---

### Test 3: Playback After Browser Restart

**Steps:**
1. Record at least one snippet
2. Verify snippet appears in feed with custom audio player (blue play button)
3. Click play button and verify audio plays with progress bar animating
4. Click again to pause (button changes to pause icon)
5. Close browser completely (not just tab)
6. Reopen browser and navigate to application URL
7. Check DailyFeed

**Expected Result:**
- All previously recorded snippets are visible with correct duration
- Audio players render correctly with blue circular play button
- Clicking play button plays the audio (button changes to pause icon)
- Progress bar animates from left to right during playback
- Button returns to play icon when audio ends
- No "Failed to load recordings" error

---

### Test 4: Delete Snippet

**Steps:**
1. Record a snippet
2. Open browser DevTools console
3. Note snippet ID from DailyFeed or console
4. Run:
```javascript
import { deleteSnippet } from './src/utils/storage.js';
await deleteSnippet('snippet-id-here');
```
5. Refresh page

**Expected Result:**
- Snippet is removed from database
- UI refreshes and snippet no longer appears
- Other snippets remain intact

---

### Test 5: Clear All Data

**Steps:**
1. Record at least 2 snippets
2. Click "⚙️ Data" button (top right)
3. Click "🗑️ Clear All Data" button
4. Confirm the browser alert dialog
5. Wait for "All data cleared successfully" message

**Expected Result:**
- Confirmation dialog appears
- All snippets removed from database
- DailyFeed shows: "No recordings yet. Start by recording your first snippet!"
- Status message: "All data cleared successfully"

---

### Test 6: Export Backup

**Steps:**
1. Record at least 2 snippets with audio
2. Click "⚙️ Data" button (top right)
3. Click "💾 Export All Data" button
4. Wait for download to complete
5. Open downloaded JSON file in text editor

**Expected Result:**
- File downloads with name pattern: `voice-journal-backup-YYYY-MM-DD.json`
- File contains valid JSON with structure:
  ```json
  {
    "version": 1,
    "exportedAt": "2026-02-13T...",
    "snippetsCount": 2,
    "snippets": [
      {
        "id": "...",
        "createdAt": 1234567890,
        "dayKey": "2026-02-13",
        "duration": 5,
        "audioBlob": "base64-encoded-string...",
        "audioBlobType": "audio/webm",
        "transcript": null,
        "syncStatus": "local",
        "dataVersion": 1
      }
    ]
  }
  ```
- Status shows: "Exported N recordings successfully"

---

### Test 7: Import Backup

**Steps:**
1. Export data (Test 6)
2. Click "🗑️ Clear All Data"
3. Confirm DailyFeed is empty
4. Click "⚙️ Data" button
5. Click "📥 Import from Backup"
6. Select the exported JSON file
7. Wait for import to complete

**Expected Result:**
- File picker opens accepting .json files
- Status shows: "Importing..."
- Status changes to: "Import complete: N imported, 0 skipped"
- DailyFeed repopulates with all snippets
- Audio playback works correctly

**Import with Duplicates:**
1. Import same file again

**Expected Result:**
- Status shows: "Import complete: 0 imported, N skipped"
- No duplicate entries created

---

## Additional Verification Tests

### Test 8: Storage Quota Check

**Steps:**
1. Click "⚙️ Data" button
2. Click "📊 Check Storage" button

**Expected Result:**
- Panel displays storage usage:
  - Used: X.XX MB
  - Available: X.XX MB
  - Total: X.XX MB
- Progress bar shows percentage used
- Color: blue if <90%, red if ≥90%

---

### Test 9: Error Handling - Quota Exceeded

**Steps:**
1. Open DevTools console
2. Simulate quota error:
```javascript
// This requires modifying storage.js temporarily or using DevTools to override
// IndexedDB quota (browser-specific)
```
3. Attempt to record very long audio

**Expected Result:**
- Save operation fails
- Alert appears: "Storage quota exceeded! Please export your data and free up space."
- Error banner displays: "Storage quota exceeded. Cannot save recording."
- Application remains functional

---

### Test 10: Data Persistence - Page Refresh

**Steps:**
1. Record 1 snippet
2. Press F5 or Ctrl+R to refresh page
3. Check DailyFeed

**Expected Result:**
- Snippet persists after refresh
- Audio is playable
- No data loss

---

### Test 11: Large Data Volume

**Steps:**
1. Record 10+ snippets of varying lengths (3-30 seconds each)
2. Verify all appear in feed
3. Export data and check file size
4. Close and reopen browser
5. Verify all load correctly

**Expected Result:**
- All snippets save successfully
- LoadSnippets() completes without errors
- Export generates valid JSON
- Browser restart preserves all data
- Performance remains acceptable

---

## Database Schema Verification

Open DevTools Application tab → IndexedDB → voice-journal

**Expected Schema:**
```
Database: voice-journal
Version: 2

Object Stores:
- snippets
  keyPath: 'id'
  
  Indexes:
  - dayKey (keyPath: 'dayKey', unique: false)
  - createdAt (keyPath: 'createdAt', unique: false)
  - dataVersion (keyPath: 'dataVersion', unique: false)
```

**Record Structure:**
```javascript
{
  id: "snippet-1708034567890-abc123",
  createdAt: 1708034567890,
  dayKey: "2026-02-13",
  duration: 5,
  audioBlob: Blob { size: 12345, type: "audio/webm" },
  transcript: null,
  syncStatus: "local",
  dataVersion: 1
}
```
