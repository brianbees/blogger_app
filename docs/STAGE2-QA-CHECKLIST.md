# Stage 2 Polish Pass - QA Checklist

## Test Device: Samsung S21
**Date:** February 13, 2026  
**Browser:** Chrome/Samsung Internet  
**Screen:** 1080×2400, Dynamic AMOLED 2X

---

## Visual Acceptance Criteria

### ✅ Opening Screen (Home)
- [ ] Header displays two-line layout: greeting + title + date
- [ ] Greeting shows time-appropriate text ("Good morning/afternoon/evening, Brian")
- [ ] Date shows current date in long format (e.g., "Thursday, 13 February 2026")
- [ ] Header is sticky at top with subtle shadow
- [ ] Bottom bar shows three actions: Note (left), Record FAB (center), Image (right)
- [ ] Center FAB is visually dominant (64×64px, raised above bar with shadow)
- [ ] FAB has white ring around it for separation
- [ ] Secondary buttons (Note/Image) show icon + label vertically stacked
- [ ] Feed uses consistent card styling with rounded corners and shadows
- [ ] Empty state shows large microphone icon with clear message
- [ ] Vertical rhythm is consistent (16-24px spacing between elements)

### ✅ Recording Screen (Active State)
- [ ] Slide-up recording panel appears above bottom bar (not full screen)
- [ ] Recording panel shows:
  - Red pulsing dot (left)
  - "RECORDING" label in uppercase red text
  - Timer in large bold numbers (MM:SS format)
  - Animated waveform bar in red
  - Large "Stop Recording" button (full width, red)
- [ ] Recording panel has elevated shadow and rounded corners
- [ ] FAB changes to red with stop icon and pulses
- [ ] Feed remains visible below but de-emphasized
- [ ] Bottom bar stays anchored at bottom
- [ ] Recording panel doesn't push content awkwardly

### ✅ Data Tab Modal
- [ ] Modal opens with dark semi-opaque backdrop with blur effect
- [ ] Modal card is centered with rounded-2xl corners
- [ ] Modal has elevated shadow (shadow-2xl)
- [ ] Title "Data Management" is centered and prominent
- [ ] Four action buttons with unified design:
  - Export: Blue background, save icon
  - Import: Green background, download icon
  - Check Storage: Gray background, chart icon
  - Clear All: Red background, trash icon
- [ ] All buttons have left-aligned icon + label
- [ ] Buttons are full-width with consistent padding
- [ ] Close button at bottom with gray background
- [ ] Status messages show appropriate color (green for success, red for error)
- [ ] Storage quota displays with progress bar
- [ ] FAB dims when modal is open
- [ ] Backdrop click closes modal

---

## Interaction Acceptance Criteria

### ✅ Touch Interactions
- [ ] FAB press shows scale-down animation (0.92x)
- [ ] FAB press triggers recording within 200ms
- [ ] All buttons show active:scale feedback
- [ ] Minimum touch target of 48×48px met for all interactive elements
- [ ] Secondary buttons have 56×56px touch targets
- [ ] Delete button on cards has 44×44px touch target
- [ ] Play/pause button has 40×40px touch target

### ✅ Recording Flow
- [ ] Tap FAB → browser asks for mic permission (first time)
- [ ] After permission → recording panel slides up immediately
- [ ] Timer starts at 0:00 and counts up
- [ ] Waveform animates with pulse effect
- [ ] Tap "Stop Recording" button → recording stops
- [ ] "Saving..." banner appears briefly
- [ ] New recording appears at top of today's date group
- [ ] Duration matches actual recording time
- [ ] Recording panel slides down

### ✅ Modal Interactions
- [ ] Tap "⚙️ Data" button → modal opens with fade/zoom animation
- [ ] FAB dims and becomes non-interactive
- [ ] Background interactions are blocked
- [ ] Tap backdrop → modal closes
- [ ] Tap "Close" button → modal closes
- [ ] Focus returns to trigger button after close
- [ ] Export → file downloads with date-stamped name
- [ ] Import → file picker opens, accepts .json files
- [ ] Clear All → confirmation dialog appears
- [ ] Check Storage → quota display shows with progress bar

### ✅ Playback Interactions
- [ ] Tap play button → audio starts playing
- [ ] Play button changes to pause icon
- [ ] Progress bar animates left to right
- [ ] Tap pause button → audio pauses
- [ ] Progress bar stops at current position
- [ ] Audio ends → button returns to play icon, progress resets to 0%

---

## Accessibility Acceptance Criteria

### ✅ Screen Reader Support
- [ ] FAB announces "Start voice recording" when idle
- [ ] FAB announces "Recording in progress. Tap to stop" when recording
- [ ] Recording panel has aria-live="polite" for status updates
- [ ] Timer has descriptive aria-label (e.g., "Recording time: 0 minutes 5 seconds")
- [ ] Modal has role="dialog" and aria-modal="true"
- [ ] Modal title has id for aria-labelledby
- [ ] Status messages have aria-live="polite"
- [ ] Storage error has aria-live="assertive"
- [ ] Empty state has role="status" and aria-live="polite"
- [ ] Each snippet card has aria-label describing the recording
- [ ] Play/pause button announces current state
- [ ] Progress bar has role="progressbar" with aria-valuenow

### ✅ Keyboard Navigation
- [ ] Tab key cycles through all interactive elements
- [ ] Focus visible outline appears on keyboard focus
- [ ] Enter/Space activates buttons
- [ ] Escape key closes modal
- [ ] Focus trap works inside modal (tab cycles within modal only)
- [ ] Focus returns to trigger after modal close

### ✅ Color Contrast (WCAG AA)
- [ ] Header greeting text (gray-500 on white) meets 4.5:1
- [ ] Header title (gray-900 on white) meets 4.5:1
- [ ] Date text (gray-600 on white) meets 4.5:1
- [ ] Secondary button labels (gray-600) meet 4.5:1
- [ ] Blue FAB text (white on blue-600) meets 4.5:1
- [ ] Red recording label (red-600) meets 4.5:1
- [ ] Modal buttons have sufficient contrast
- [ ] Error messages (red-800 on red-50) meet 4.5:1

---

## Device-Specific Testing

### ✅ Samsung S21 (Current Device)
- [ ] No overlap with status bar or camera notch
- [ ] Bottom navigation bar doesn't obscure content
- [ ] Safe area insets are respected (pt-safe, pb-safe)
- [ ] Viewport height uses 100dvh (dynamic viewport height)
- [ ] Scrolling is smooth without overscroll bounce
- [ ] Tap highlight color is transparent
- [ ] Font rendering is smooth (antialiased)

### ⏳ Additional Devices (Recommended)
- [ ] Google Pixel 7 (recent Android, 1080×2400)
- [ ] iPhone 14 Pro (iOS, notched, 1179×2556)
- [ ] iPhone SE 3 (small viewport, 750×1334)

---

## Performance and Stability

### ✅ Cache and Asset Loading
- [ ] Hard refresh (Ctrl+Shift+R) loads latest code
- [ ] No stale service worker assets
- [ ] Tailwind CSS loads correctly (@import syntax)
- [ ] All emojis render correctly
- [ ] Images/icons load without flicker
- [ ] Vite HMR (Hot Module Replacement) works during dev

### ✅ Error Handling
- [ ] Mic permission denied → shows clear error message
- [ ] Recording fails → error banner appears
- [ ] Storage full → quota exceeded alert appears
- [ ] Import invalid JSON → shows "Import failed" message
- [ ] Delete fails → error message displayed

### ✅ Edge Cases
- [ ] Record 0 seconds → doesn't save (minimum duration check)
- [ ] Record 5 minutes → saves correctly without timeout
- [ ] 100+ recordings → feed scrolls smoothly
- [ ] Import duplicate snippets → skipped count reported
- [ ] Browser restart → all data persists

---

## Animation and Motion

### ✅ Reduced Motion Support
- [ ] prefers-reduced-motion: animations shortened to 0.01ms
- [ ] Pulsing effects respect reduced motion
- [ ] Transitions still provide feedback but minimal

### ✅ Animation Smoothness
- [ ] FAB scale animation is smooth (200ms)
- [ ] Modal fade/zoom is smooth (200ms)
- [ ] Recording panel slide-up is visible but quick
- [ ] Progress bar animation is smooth (100ms updates)
- [ ] Button press feedback is immediate (<100ms)

---

## Final Checklist Before Sign-Off

- [ ] All visual criteria met on Samsung S21
- [ ] All interaction flows work end-to-end
- [ ] Accessibility tested with screen reader (TalkBack/VoiceOver)
- [ ] WCAG AA color contrast verified
- [ ] No console errors or warnings
- [ ] Responsive on different viewport sizes
- [ ] Safe area insets respected on notched devices
- [ ] Documentation updated (README, acceptance tests)
- [ ] Dev notes provided for tradeoffs/edge cases
- [ ] Git commit created with descriptive message

---

## Sign-Off

**QA Tester:** _________________  
**Date:** _________________  
**Status:** ⏳ In Progress | ✅ Passed | ❌ Failed  
**Notes:**

