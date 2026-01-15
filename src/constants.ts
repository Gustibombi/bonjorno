// View type constant
export const VIEW_TYPE_DAILY_NOTES = "bonjorno-daily-notes";

// Icon name for the ribbon
export const RIBBON_ICON = "calendar-days";

// Default settings
export const DEFAULT_SETTINGS = {
  dailyNotesPath: "daily-notes",
  initialLoadCount: 30,
  dateFormat: "MMMM Do, YYYY",
  autoSave: true,
  autoSaveDelay: 500,
  loadMoreCount: 20,
};

// Date format for file names (YYYY-MM-DD)
export const FILE_NAME_DATE_FORMAT = "YYYY-MM-DD";

// Regex pattern to match daily note filenames
export const DAILY_NOTE_FILENAME_REGEX = /^\d{4}-\d{2}-\d{2}\.md$/;

// Scroll threshold for loading more notes (in pixels from top)
export const SCROLL_LOAD_THRESHOLD = 200;

// Maximum number of notes to keep in DOM at once
export const MAX_DOM_NOTES = 100;

// Debounce delay for scroll events (ms)
export const SCROLL_DEBOUNCE_DELAY = 150;

// File extension for daily notes
export const NOTE_FILE_EXTENSION = ".md";

// CSS class names
export const CSS_CLASSES = {
  container: "bonjorno-container",
  dateSection: "bonjorno-date-section",
  dateHeader: "bonjorno-date-header",
  dateContent: "bonjorno-date-content",
  loadingIndicator: "bonjorno-loading",
  emptyState: "bonjorno-empty-state",
  editor: "bonjorno-editor",
  saveIndicator: "bonjorno-save-indicator",
};

// View display text
export const VIEW_DISPLAY_TEXT = "Daily Notes";

// Default template for new daily notes (empty by default)
export const DEFAULT_NOTE_TEMPLATE = "";

// Error messages
export const ERROR_MESSAGES = {
  directoryNotFound:
    "Daily notes directory not found. It will be created on first use.",
  fileReadError: "Failed to read daily note file",
  fileWriteError: "Failed to save daily note",
  invalidFileName: "Invalid daily note filename format",
  permissionDenied: "Permission denied accessing daily notes directory",
};

// Success messages
export const SUCCESS_MESSAGES = {
  noteSaved: "Note saved",
  noteCreated: "Daily note created",
};
