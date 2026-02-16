# Documentation Standards

## Objective
Ensure documentation is accurate, minimal, non-misleading, and reflects actual runtime behaviour — not intended behaviour.

## Core Principles

### 1. Document Reality, Not Intent
- Only document behaviour that exists in the current codebase
- Do not document "intended" or "planned" behaviour
- If a feature is incomplete, mark it as such with clear boundaries

### 2. Verifiable Examples
- If describing logs, mark them as: "Example output (may vary)"
- Do not include "expected output" examples that are not verified
- Console logs used for debugging must be marked as temporary

### 3. Technical Precision
- Every architectural explanation must reference:
  - File name(s)
  - Function name(s) or line ranges when relevant
- No narrative justifications like "bundlers may get confused"
- Explanations must be concrete and technical
- Use specific error messages, not paraphrased descriptions

### 4. Currency
- When code changes affect architecture, documentation must be updated in the same commit
- Remove outdated architecture descriptions immediately when refactored
- Version bumps must reflect meaningful architectural changes only (not debugging instrumentation)

## Documentation Review Checklist

When reviewing or updating documentation, systematically check for:

### Content to Remove
- [ ] Speculative explanations
- [ ] Unverified "expected output" examples
- [ ] Outdated architecture descriptions
- [ ] Debug logging examples (unless clearly marked as temporary)
- [ ] References to features that were removed or refactored
- [ ] Vague statements without code references

### Content to Verify
- [ ] Authentication flow matches current implementation
- [ ] Recording architecture reflects actual modes (simple + continuous)
- [ ] UI patterns match implemented code (optimistic UI, callbacks, etc.)
- [ ] File and function references are accurate
- [ ] Code snippets compile and run
- [ ] Configuration examples use current environment variables

## Architectural Documentation Requirements

When documenting architecture, include:

1. **Component Purpose** - What it does (one sentence)
2. **File Location** - Exact path(s)
3. **Key Functions** - Names and signatures
4. **Dependencies** - What it imports/uses
5. **State Flow** - How data moves through the component
6. **Edge Cases** - Known limitations or special handling

Example:
```markdown
### Continuous Recording

**Purpose:** Records audio in 25-second chunks with progressive transcription

**File:** `src/hooks/useContinuousRecorder.js`

**Key Functions:**
- `startRecording()` - Initializes MediaRecorder with timeslice
- `stopRecording()` - Calls onRecordingComplete callback immediately
- `getFullTranscript()` - Stitches chunk transcripts in order

**Callback Flow:**
1. User clicks stop
2. `stopRecording()` calls `onRecordingComplete(recordingData)`
3. `App.jsx:handleContinuousRecordingComplete()` receives data
4. Optimistic UI update: `setSnippets(prev => [snippet, ...prev])`
5. IndexedDB save happens in background

**Known Issues:**
- Blobs released after transcription for memory efficiency
- May return null if all chunks processed
```

## Version Control Integration

### Commit Message Guidelines
When documentation changes accompany code changes:
```
fix: implement optimistic UI for recording history - v1.0.6

Code changes:
- Changed save operations to use optimistic state updates
- Removed await loadSnippets() after saves

Documentation changes:
- Updated architecture.md to reflect optimistic UI pattern
- Removed outdated "reload after save" flow diagram
- Added file references for all save handlers
```

### Documentation Drift Detection
If you notice documentation drift:
1. Create an issue immediately
2. Mark affected sections with `[OUTDATED - see issue #X]`
3. Fix in the same PR that updates the code

## File-Specific Guidelines

### README.md
- High-level overview only
- Links to detailed docs, not duplicated content
- Quick start must work for new developers
- Architecture section must reference actual files

### docs/technical.md
- Deep dive into implementation details
- Must include file paths and function names
- Code snippets must be currently accurate
- Explain WHY decisions were made with concrete reasons

### docs/deployment.md
- Step-by-step instructions only
- Every command must be tested in current environment
- Environment variable examples must match .env.example
- No assumptions about user knowledge

### docs/user-guide.md
- Feature descriptions based on current UI
- Screenshots/examples from actual running app
- Known limitations clearly stated
- No promises of future features

### docs/recent-updates.md
- Chronological log of changes
- Each entry references commit hash
- Focus on user-facing changes
- Mark breaking changes prominently

## Anti-Patterns to Avoid

❌ **Vague References**
```markdown
The recorder handles errors gracefully
```

✅ **Specific References**
```markdown
`useMediaRecorder.js:145` catches QuotaExceededError and displays user-facing message
```

❌ **Unverified Examples**
```markdown
After recording, you'll see:
[App] Recording saved successfully
```

✅ **Qualified Examples**
```markdown
After recording, console may show (example output):
[App] Recording saved successfully
Note: Debug logs may be removed in production builds
```

❌ **Outdated Architecture**
```markdown
Recordings are saved to localStorage as JSON
```

✅ **Current Architecture**
```markdown
Recordings are saved to IndexedDB via `src/utils/storage.js:saveSnippet()`.
Each snippet stores audioBlob as Blob object (not JSON).
```

## Maintenance Schedule

- **Weekly:** Review recent-updates.md for accuracy
- **Per Release:** Update version numbers, changelog
- **Per Major Refactor:** Update all affected architecture docs in same PR
- **Quarterly:** Full documentation audit against codebase

## Enforcement

This document must be referenced in:
- PR review checklists
- Contributor guidelines (CONTRIBUTING.md)
- Onboarding documentation

When reviewing PRs:
1. Check if code changes require doc updates
2. Verify doc changes follow these standards
3. Reject PRs with speculative documentation
4. Require file/function references for architectural claims

---

**Document Version:** 1.0  
**Created:** 2026-02-16  
**Last Updated:** 2026-02-16  
**Status:** Active
