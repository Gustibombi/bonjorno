# Bonjorno - Daily Notes Plugin Implementation Plan

## Project Overview

**Plugin Name**: Bonjorno  
**Purpose**: Logseq-style daily notes view with chronological scrolling (newest → oldest)  
**Tech Stack**: TypeScript, Obsidian API, pnpm

## Core Features

### 1. Sidebar Integration

- Add ribbon icon to left sidebar
- Custom icon for daily notes journal
- One-click access to daily notes view

### 2. Chronological View

- Display daily notes in reverse chronological order (newest first)
- Continuous scrollable interface
- Each date displays as a section with heading + content
- Editable markdown content inline

### 3. Automatic File Management

- Auto-create today's note if not present on view open
- File naming: `YYYY-MM-DD.md` (e.g., `2026-01-15.md`)
- Store in user-configurable directory
- Scan and load existing notes from directory
- Support manual file creation/deletion

### 4. Performance Optimization

- Virtual scrolling for handling years of data
- Lazy load notes in batches (initial: 30 days)
- Load more as user scrolls up (older notes)
- Efficient file system scanning with caching

### 5. Settings

- Daily notes directory path (default: `daily-notes/`)
- Optional: Date format display customization
- Optional: Number of initial notes to load

## Technical Architecture

### Plugin Structure

```
bonjorno/
├── src/
│   ├── main.ts                 # Main plugin class
│   ├── DailyNotesView.ts       # Custom view implementation
│   ├── DailyNotesManager.ts    # File management logic
│   ├── DateService.ts          # Date utilities
│   ├── SettingsTab.ts          # Settings UI
│   ├── types.ts                # TypeScript interfaces
│   └── constants.ts            # Constants (view types, etc.)
├── styles.css                  # Plugin styles
├── manifest.json               # Plugin metadata
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── esbuild.config.mjs          # Build configuration
└── README.md                   # User documentation
```

### Core Classes

#### 1. BonjoroPlugin (main.ts)

```typescript
- onload(): Initialize plugin, register view, add ribbon icon
- onunload(): Cleanup
- loadSettings(): Load user settings
- saveSettings(): Persist settings
- activateView(): Open/focus daily notes view
```

#### 2. DailyNotesView (extends ItemView)

```typescript
- VIEW_TYPE: "bonjorno-daily-notes"
- onOpen(): Setup view, load initial notes
- onClose(): Cleanup
- renderNotes(): Display all loaded notes
- handleScroll(): Detect scroll to top, load more
- createNoteSection(): Render individual date section
- handleContentChange(): Save edits to files
```

#### 3. DailyNotesManager

```typescript
- scanDirectory(): Find all daily note files
- loadNotes(count, offset): Load batch of notes
- getOrCreateTodayNote(): Ensure today exists
- saveNote(date, content): Write to file
- deleteNote(date): Remove file
- parseDateFromFilename(): Extract date from filename
- isValidDailyNote(): Check filename format
```

#### 4. DateService

```typescript
- getTodayFormatted(): Return YYYY-MM-DD
- parseDate(filename): Convert filename to Date
- formatDateForDisplay(): Human-readable format
- getDatesRange(start, count): Generate date list
```

#### 5. SettingsTab (extends PluginSettingTab)

```typescript
- display(): Render settings UI
- Settings: dailyNotesPath, initialLoadCount
```

## File Format & Storage

### Directory Structure Options

**Option A: Flat Structure** (Recommended for simplicity)

```
vault/
└── daily-notes/
    ├── 2026-01-15.md
    ├── 2026-01-14.md
    ├── 2026-01-13.md
    └── ...
```

**Option B: Hierarchical Structure** (Better for performance with 1000+ notes)

```
vault/
└── daily-notes/
    ├── 2026/
    │   ├── 01/
    │   │   ├── 2026-01-15.md
    │   │   ├── 2026-01-14.md
    │   │   └── ...
    │   └── 02/
    │       └── ...
    └── 2025/
        └── ...
```

**Decision**: Start with Option A, add Option B in Phase 4 for performance

### File Naming Convention

- Format: `YYYY-MM-DD.md`
- Regex: `/^\d{4}-\d{2}-\d{2}\.md$/`
- Example: `2026-01-15.md`

### File Content Structure

```markdown
# [Date Header - Optional, plugin can add/ignore]

User's markdown content here...

- Bullet points
- Tasks
- Whatever they want
```

Note: Plugin won't force any structure inside files. Pure markdown freedom.

## Implementation Phases

### Phase 1: Project Setup & Basic Infrastructure

**Duration**: 1 day

**Tasks**:

- [ ] Clone Obsidian sample plugin
- [ ] Configure for pnpm
- [ ] Set up TypeScript with proper types
- [ ] Configure esbuild
- [ ] Create basic project structure
- [ ] Set up manifest.json
- [ ] Create constants.ts with view types

**Deliverable**: Buildable plugin skeleton

### Phase 2: File Management System

**Duration**: 2 days

**Tasks**:

- [ ] Implement DailyNotesManager class
- [ ] File scanning logic (Vault API)
- [ ] Date parsing and validation
- [ ] Create/read/update/delete operations
- [ ] Handle directory creation
- [ ] Cache file list for performance
- [ ] Implement DateService utilities

**Deliverable**: Working file management system

### Phase 3: Settings & Configuration

**Duration**: 1 day

**Tasks**:

- [ ] Create SettingsTab class
- [ ] Implement settings UI
- [ ] Add directory path setting with folder picker
- [ ] Add validation for paths
- [ ] Load/save settings
- [ ] Default values

**Deliverable**: Functional settings tab

### Phase 4: Custom View - Basic Version

**Duration**: 3 days

**Tasks**:

- [ ] Create DailyNotesView class extending ItemView
- [ ] Register custom view type
- [ ] Add ribbon icon
- [ ] Implement activateView() to open view
- [ ] Basic view layout (container, scrollable)
- [ ] Load and display first 30 days
- [ ] Render date headers
- [ ] Display file content as read-only

**Deliverable**: View that displays notes (read-only)

### Phase 5: Edit Functionality

**Duration**: 3 days

**Tasks**:

- [ ] Integrate CodeMirror editor for each note
- [ ] Handle content changes
- [ ] Debounced auto-save (500ms after edit)
- [ ] Visual feedback for save status
- [ ] Handle concurrent edits (edge case)
- [ ] Keyboard navigation between dates

**Deliverable**: Fully editable daily notes view

### Phase 6: Auto-Creation Logic

**Duration**: 1 day

**Tasks**:

- [ ] On view open, check if today's date exists
- [ ] If not at top, create empty file
- [ ] Add to view at top position
- [ ] Handle date rollover (opened at 11:59 PM)
- [ ] Focus today's note on creation

**Deliverable**: Automatic today note creation

### Phase 7: Performance Optimization

**Duration**: 3 days

**Tasks**:

- [ ] Implement virtual scrolling
- [ ] Initial load: 30 most recent days
- [ ] Lazy load on scroll up (20 days at a time)
- [ ] Unload off-screen notes (keep DOM small)
- [ ] File system caching strategy
- [ ] Optimize re-renders
- [ ] Test with 1000+ notes

**Deliverable**: Performant view with large datasets

### Phase 8: Polish & Edge Cases

**Duration**: 2 days

**Tasks**:

- [ ] Handle empty directory
- [ ] Handle corrupted files
- [ ] Handle manually created files (auto-detect)
- [ ] Handle file deletion outside plugin
- [ ] Handle directory change in settings
- [ ] Add loading indicators
- [ ] Error handling and user feedback
- [ ] Accessibility improvements
- [ ] Mobile compatibility check

**Deliverable**: Production-ready plugin

### Phase 9: Testing & Documentation

**Duration**: 2 days

**Tasks**:

- [ ] Manual testing scenarios
- [ ] Test with various vault sizes
- [ ] Test mobile (if applicable)
- [ ] Write README.md
- [ ] Write user guide
- [ ] Add inline code comments
- [ ] Create example screenshots
- [ ] Version 1.0.0 release preparation

**Deliverable**: Tested plugin with documentation

## UI/UX Design

### View Layout

```
┌─────────────────────────────────────┐
│  📅 Daily Notes (Bonjorno)      [×] │  ← Title bar
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ January 15th, 2026           │  │  ← Date header (newest)
│  │ ──────────────────────────── │  │
│  │                              │  │
│  │ [Editable markdown content]  │  │  ← Editor area
│  │ - User's notes               │  │
│  │ - Tasks                      │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ January 14th, 2026           │  │  ← Previous date
│  │ ──────────────────────────── │  │
│  │                              │  │
│  │ [Editable markdown content]  │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ January 13th, 2026           │  │
│  │ ──────────────────────────── │  │
│  │ ...                          │  │
│  └──────────────────────────────┘  │
│                                     │
│           [Loading...]              │  ← Load more indicator
│                                     │
└─────────────────────────────────────┘
   ↑ Scroll up to load older notes
```

### Styling Approach

- Use Obsidian's CSS variables for theming
- Minimal custom styles
- Respect user's theme
- Clear visual separation between dates
- Subtle date headers
- Focus on content

## Performance Considerations

### Initial Load Strategy

1. Scan directory for all files
2. Cache file list with dates
3. Load most recent 30 days
4. Render only visible content

### Scroll Handling

1. Detect scroll position
2. When near top (within 200px), load 20 more days
3. When near bottom (optional), remove old notes from DOM
4. Maintain smooth scrolling

### File System Optimization

1. Cache TAbstractFile references
2. Use Obsidian's Vault API efficiently
3. Batch file operations
4. Debounce save operations

### Memory Management

1. Limit DOM nodes (max 100 date sections)
2. Unload off-screen editors
3. Clear unused references

## Edge Cases & Error Handling

### File System Issues

- **Directory doesn't exist**: Create on first use
- **Permission denied**: Show error, suggest different path
- **Corrupted file**: Skip, log warning
- **Invalid filename**: Ignore during scan

### User Actions

- **Manual file deletion**: Handle gracefully, remove from view
- **Manual file creation**: Detect and insert in correct position
- **Directory change**: Rescan, reload view
- **Multiple vaults**: Settings per vault

### Date/Time Issues

- **Timezone changes**: Use local time consistently
- **Date rollover**: Check on every view open
- **Leap years**: Handle correctly (native Date object)

### Concurrent Edits

- **File modified externally**: Detect via Vault events, prompt user
- **Multiple views open**: Use single source of truth (file)

## Settings Schema

```typescript
interface BonjoroSettings {
  dailyNotesPath: string; // Default: "daily-notes"
  initialLoadCount: number; // Default: 30
  dateFormat: string; // Default: "MMMM Do, YYYY"
  autoSave: boolean; // Default: true
  autoSaveDelay: number; // Default: 500 (ms)
}
```

## API Usage

### Key Obsidian APIs

1. **Vault API**: File operations
   - `vault.adapter.exists()`
   - `vault.create()`
   - `vault.modify()`
   - `vault.read()`
   - `vault.getAbstractFileByPath()`

2. **Workspace API**: View management
   - `workspace.registerViewType()`
   - `workspace.getLeaf()`
   - `workspace.revealLeaf()`

3. **Events**: File watching
   - `vault.on('create', callback)`
   - `vault.on('delete', callback)`
   - `vault.on('modify', callback)`

4. **Editor**: Markdown editing
   - Use MarkdownView or custom CodeMirror integration

## Success Criteria

- [ ] Sidebar icon opens daily notes view
- [ ] Today's note auto-created if missing
- [ ] Notes displayed newest to oldest
- [ ] All notes editable with auto-save
- [ ] Handles 1000+ notes smoothly
- [ ] Directory configurable in settings
- [ ] Manual files detected and integrated
- [ ] No data loss under normal operation
- [ ] Works on desktop (mobile optional)

## Future Enhancements (Post v1.0)

1. **Search within daily notes**
2. **Date picker for quick navigation**
3. **Templates for new daily notes**
4. **Backlinks to daily notes**
5. **Calendar view integration**
6. **Export multiple days**
7. **Tags and filters**
8. **Weekly/Monthly summaries**
9. **Hierarchical folder structure option**
10. **Sync with Obsidian's native daily notes**

## Resources & References

- [Obsidian Plugin API Docs](https://docs.obsidian.md)
- [Sample Plugin Repo](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian API Types](https://github.com/obsidianmd/obsidian-api)
- [Community Plugins Repo](https://github.com/obsidianmd/obsidian-releases)

## Timeline Estimate

**Total Duration**: 18 days (~3.5 weeks)

- Week 1: Phases 1-4 (Setup + Basic View)
- Week 2: Phases 5-6 (Editing + Auto-creation)
- Week 3: Phases 7-8 (Performance + Polish)
- Week 4: Phase 9 (Testing + Docs) + Buffer

## Notes

- Focus on simplicity and reliability
- User's markdown files are sacred - never corrupt
- Performance is critical - users may have years of notes
- Follow Obsidian's design patterns and conventions
- Consider mobile from the start, even if not Phase 1 priority
- Use TypeScript strictly for better maintainability
