# Voice Journal Roadmap

**Last Updated:** February 16, 2026  
**Current Version:** 1.0.7

This document consolidates all planned improvements, feature additions, and future enhancements for the Voice Journal PWA.

---

## 🎯 Immediate Priorities (Sprint 1-3)

### Sprint 1: Critical UX Fixes (Week 1) - **~7 hours**

Issues preventing user success or causing abandonment.

| Priority | Issue | File | Effort | Status |
|----------|-------|------|--------|--------|
| P0 | Transcription progress indicator | SnippetCard.jsx | 1h | 📋 Todo |
| P0 | Stay signed in default to false | CloudSync.jsx | 15m | 📋 Todo |
| P0 | Timer format with units | RecordPanel.jsx, ContinuousRecordPanel.jsx | 30m | 📋 Todo |
| P0 | Microphone permission guidance | RecordPanel.jsx, ContinuousRecordPanel.jsx | 3h | 📋 Todo |
| P0 | Offline indicator | App.jsx, PublishModal.jsx | 2h | 📋 Todo |

**Goal:** Eliminate all critical abandonment issues  
**Reference:** [UX-IMPROVEMENTS-TODO.md](docs/UX-IMPROVEMENTS-TODO.md) Issues #1-3, #8, #11

---

### Sprint 2: High Priority UX Polish (Week 2) - **~5.5 hours**

Issues causing confusion or frustration.

| Priority | Issue | File | Effort | Status |
|----------|-------|------|--------|--------|
| P1 | Empty state for first-time users | DailyFeed.jsx | 1h | 📋 Todo |
| P1 | Recording mode clarity | App.jsx | 1h | 📋 Todo |
| P1 | Image compression indicator | PublishModal.jsx | 30m | 📋 Todo |
| P1 | Publish success state | PublishModal.jsx | 1h | 📋 Todo |
| P1 | Real progress indicators | PublishModal.jsx | 2h | 📋 Todo |

**Goal:** Dramatically improve user confidence and understanding  
**Reference:** [UX-IMPROVEMENTS-TODO.md](docs/UX-IMPROVEMENTS-TODO.md) Issues #4-6, #9-10

---

### Sprint 3: Mobile Optimization (Week 3) - **~3.5 hours**

Mobile-specific interaction improvements.

| Priority | Issue | File | Effort | Status |
|----------|-------|------|--------|--------|
| P1 | Transcript scroll behavior | ContinuousRecordPanel.jsx | 1.5h | 📋 Todo |
| P1 | Image viewer pinch-zoom | ImageViewer.jsx | 2h | 📋 Todo |

**Goal:** Optimize mobile-specific interactions  
**Reference:** [UX-IMPROVEMENTS-TODO.md](docs/UX-IMPROVEMENTS-TODO.md) Issues #7, #12

---

## 🚀 Feature Development

### Phase 1: Core Features (Month 2)

Features with UI already present or partially implemented.

#### 1.1 Search & Filtering
- **Status:** UI not implemented
- **Priority:** High
- **Effort:** 2-3 days
- **Features:**
  - Full-text search in transcripts and captions
  - Filter by type (audio/image)
  - Filter by date range
  - Filter by published status
- **Dependencies:** None
- **Reference:** technical.md, stage-3-dev-notes.md, stage-2-dev-notes.md

#### 1.2 Manual Transcription Control
- **Status:** Auto-transcription only
- **Priority:** Medium
- **Effort:** 4 hours
- **Features:**
  - "Transcribe" button for on-demand transcription
  - Skip auto-transcription option in settings
  - Show transcription status clearly
- **Dependencies:** None
- **Reference:** technical.md

#### 1.3 Settings Panel
- **Status:** Not implemented
- **Priority:** Medium
- **Effort:** 1-2 days
- **Features:**
  - Recording quality selection
  - Audio format preference
  - Auto-delete old recordings (retention policy)
  - Timezone selection
  - Default recording mode
  - Export/import preferences
- **Dependencies:** None
- **Reference:** stage-2-dev-notes.md

---

### Phase 2: Enhanced Publishing (Month 3)

#### 2.1 Draft Management
- **Status:** Draft mode exists, no draft list
- **Priority:** Medium
- **Effort:** 1-2 days
- **Features:**
  - View all drafts in Blogger
  - Edit draft snippets before publishing
  - Schedule publishing for future date/time
  - Bulk publish multiple drafts
- **Dependencies:** None
- **Reference:** technical.md

#### 2.2 Offline Publishing Queue
- **Status:** Not implemented
- **Priority:** High (mobile users)
- **Effort:** 2-3 days
- **Features:**
  - Queue publish attempts while offline
  - Auto-publish when connection restored
  - Retry failed uploads with exponential backoff
  - Show queue status in UI
  - Manual retry for failed items
- **Dependencies:** Offline indicator (Sprint 1)
- **Reference:** stage-3-dev-notes.md

#### 2.3 Custom Blogger Themes
- **Status:** Not implemented
- **Priority:** Low
- **Effort:** 1 week
- **Features:**
  - Voice journal specific CSS templates
  - Audio player embeds in blog posts
  - Gallery layouts for image posts
  - Customizable post templates
- **Dependencies:** None
- **Reference:** stage-3-dev-notes.md

---

### Phase 3: Advanced Recording (Month 4)

#### 3.1 Real-time Streaming Transcription
- **Status:** Not implemented
- **Priority:** High (UX improvement)
- **Effort:** 1 week
- **Features:**
  - Use Google Speech-to-Text StreamingRecognize API
  - Show transcript while recording (live)
  - Speaker diarization (multiple speakers)
  - Higher accuracy with context
- **Cost Impact:** Higher API costs (~$0.009/min vs current $0.006/min)
- **Dependencies:** None
- **Reference:** stage-3-dev-notes.md

#### 3.2 Camera Capture
- **Status:** File picker only
- **Priority:** Medium
- **Effort:** 2-3 days
- **Features:**
  - Direct camera access via getUserMedia
  - Front/back camera switch
  - Photo preview before capture
  - Video recording (future)
- **Dependencies:** Permission handling system (similar to mic)
- **Reference:** technical.md

---

### Phase 4: Sync & Backup (Month 5)

#### 4.1 Multi-Device Sync
- **Status:** Local-first only
- **Priority:** High (user request)
- **Effort:** 2 weeks
- **Features:**
  - Store all snippets in Google Drive
  - Sync IndexedDB across devices
  - Conflict resolution strategy (last-write-wins or manual)
  - Selective sync (choose what to sync)
  - Sync status indicator
- **Dependencies:** Drive integration (exists), conflict UI
- **Reference:** stage-3-dev-notes.md, technical.md

#### 4.2 Batch Operations
- **Status:** Not implemented
- **Priority:** Medium
- **Effort:** 3-4 days
- **Features:**
  - Select multiple snippets (checkbox mode)
  - Bulk delete
  - Bulk publish
  - Bulk download from Drive
  - Bulk transcription
  - Bulk export to JSON
- **Dependencies:** None
- **Reference:** stage-3-dev-notes.md

---

## ✨ UX Enhancements

### Quick Wins (Can be done anytime)

| Feature | Effort | Priority | Reference |
|---------|--------|----------|-----------|
| Toast notifications (replace alert()) | 2h | Medium | stage-2-dev-notes.md |
| Haptic feedback on mobile | 1h | Low | stage-2-dev-notes.md |
| Loading skeletons | 3h | Medium | stage-2-dev-notes.md |
| Custom date grouping (Today/Yesterday) | 2h | Medium | stage-2-dev-notes.md |
| Keyboard shortcuts (Space to record) | 4h | Low | stage-2-dev-notes.md |
| Swipe gestures (swipe to delete) | 1 day | Medium | stage-2-dev-notes.md |

### Advanced UX (Phase 5)

#### 5.1 Dark Mode
- **Status:** Not implemented
- **Priority:** Medium
- **Effort:** 1 week
- **Features:**
  - System preference detection (prefers-color-scheme)
  - Manual toggle in settings
  - Smooth transition animation
  - Update all components and modals
- **Dependencies:** Settings panel
- **Reference:** stage-2-dev-notes.md

#### 5.2 Accessibility Polish
- **Status:** Good (ARIA labels exist)
- **Priority:** Medium
- **Effort:** 3-4 days
- **Features:**
  - Focus trap library for WCAG AAA modal compliance
  - Keyboard navigation improvements
  - Screen reader optimization
  - High contrast mode
  - Reduced motion refinements
- **Dependencies:** None
- **Reference:** stage-2-dev-notes.md

---

## 🧪 Testing & Quality

### Testing Backlog

**Manual Testing Checklist** (from stage-3-dev-notes.md):

**Google Sign-In:**
- [ ] Sign-in button appears in header
- [ ] OAuth consent screen shows correct scopes
- [ ] User profile loads after sign-in
- [ ] Blog list populates correctly
- [ ] Sign-out clears all state

**Speech-to-Text:**
- [ ] Audio transcription works for short clips (<60s)
- [ ] Transcription includes punctuation
- [ ] Handles silent audio gracefully
- [ ] Error messages for API failures

**Google Drive:**
- [ ] App folder created on first use
- [ ] Images upload successfully
- [ ] Backup files saved correctly
- [ ] Storage quota displays accurately

**Blogger Publishing:**
- [ ] Publish button appears when signed in
- [ ] Modal opens with correct snippet data
- [ ] Audio snippets include transcript
- [ ] Images appear in blog post
- [ ] Draft mode works correctly
- [ ] Success toast shows blog URL

### Automated Testing (Future)

- [ ] Unit tests for utils and services
- [ ] Integration tests for recording flow
- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance testing (Lighthouse CI)

---

## 📊 Timeline Overview

```
Month 1 (Current):
├─ Week 1: Sprint 1 - Critical UX Fixes →
├─ Week 2: Sprint 2 - High Priority UX Polish
├─ Week 3: Sprint 3 - Mobile Optimization
└─ Week 4: Buffer / Bug fixes

Month 2:
├─ Phase 1.1: Search & Filtering
├─ Phase 1.2: Manual Transcription Control
└─ Phase 1.3: Settings Panel

Month 3:
├─ Phase 2.1: Draft Management
├─ Phase 2.2: Offline Publishing Queue
└─ Phase 2.3: Custom Blogger Themes (if time)

Month 4:
├─ Phase 3.1: Real-time Streaming Transcription
├─ Phase 3.2: Camera Capture
└─ Quick Wins: Toast, Haptic, Loading Skeletons

Month 5:
├─ Phase 4.1: Multi-Device Sync
├─ Phase 4.2: Batch Operations
└─ UX Enhancements: Keyboard Shortcuts, Swipe Gestures

Month 6+:
├─ Phase 5.1: Dark Mode
├─ Phase 5.2: Accessibility Polish
└─ Automated Testing Setup
```

---

## 🎯 Success Metrics

### UX Improvements (Sprint 1-3)
- **Target:** Reduce abandonment rate by 40%
- **Measure:** Track completion of record→publish flow
- **Key Metrics:**
  - Mic permission grant rate: Target 80%+
  - Transcription wait abandonment: Target <10%
  - Successful publish rate: Target 90%+

### Feature Adoption (Phase 1-4)
- **Target:** 60% feature utilization
- **Measure:** Track usage of new features
- **Key Metrics:**
  - Search usage: Target 40% of sessions
  - Multi-device sync adoption: Target 30% of users
  - Offline publish queue usage: Target 50% of mobile users

---

## 📝 Notes

### Development Principles
- **Mobile-first:** Design for Samsung S21 reference device
- **Offline-capable:** Local-first, cloud-enhance pattern
- **Progressive:** Features degrade gracefully
- **Accessible:** WCAG 2.1 AA minimum standard
- **Performant:** <3s load time, <100ms interactions

### Cost Considerations
- Current costs: ~$5.40/month (stage-3-dev-notes.md)
- Real-time transcription would increase to ~$8-10/month
- Multi-device sync minimal impact (storage is cheap)
- Batch operations may increase API usage temporarily

### Browser Compatibility
- Chrome 90+ ✅
- Edge 90+ ✅
- Firefox 88+ ✅ (third-party cookies required)
- Safari 14+ ⚠️ (ITP may block OAuth)

---

## 🔗 Related Documents

- **[UX-IMPROVEMENTS-TODO.md](docs/UX-IMPROVEMENTS-TODO.md)** - Detailed UX issue breakdown (Sprints 1-3)
- **[technical.md](docs/technical.md)** - Technical architecture and planned features
- **[stage-2-dev-notes.md](docs/stage-2-dev-notes.md)** - Stage 2 UX enhancements reference
- **[stage-3-dev-notes.md](docs/stage-3-dev-notes.md)** - Stage 3 cloud integration and Stage 4 vision
- **[PRODUCTION_IMPROVEMENTS.txt](PRODUCTION_IMPROVEMENTS.txt)** - Recent production-grade improvements

---

## 💬 Feedback & Contributions

This roadmap is a living document. Priorities may shift based on:
- User feedback and support requests
- API changes or deprecations
- Browser capability evolution
- Business priorities

**To propose changes:**
1. Open an issue on GitHub
2. Discuss in team meetings
3. Update this roadmap with decisions

**Last Review:** February 16, 2026  
**Next Review:** March 1, 2026
