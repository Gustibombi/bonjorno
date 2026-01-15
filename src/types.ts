import { TFile } from "obsidian";

/**
 * Plugin settings interface
 */
export interface BonjoroSettings {
  /** Path to daily notes directory relative to vault root */
  dailyNotesPath: string;

  /** Number of days to load initially */
  initialLoadCount: number;

  /** Date format for display headers (using moment.js format) */
  dateFormat: string;

  /** Enable auto-save functionality */
  autoSave: boolean;

  /** Delay in milliseconds before auto-saving after edit */
  autoSaveDelay: number;

  /** Number of notes to load when scrolling */
  loadMoreCount: number;
}

/**
 * Represents a single daily note
 */
export interface DailyNote {
  /** The date for this note */
  date: Date;

  /** Formatted date string (YYYY-MM-DD) */
  dateString: string;

  /** The markdown content of the note */
  content: string;

  /** Reference to the TFile object in the vault */
  file: TFile | null;

  /** Whether the note exists as a file */
  exists: boolean;

  /** Whether the note has unsaved changes */
  isDirty: boolean;

  /** Display-formatted date (e.g., "January 15th, 2026") */
  displayDate: string;
}

/**
 * Date information for rendering
 */
export interface DateInfo {
  /** JavaScript Date object */
  date: Date;

  /** Formatted as YYYY-MM-DD */
  fileName: string;

  /** Display format for headers */
  displayName: string;

  /** ISO string representation */
  isoString: string;

  /** Unix timestamp */
  timestamp: number;
}

/**
 * Metadata for a daily note file
 */
export interface NoteMetadata {
  /** File path relative to vault */
  path: string;

  /** File name (e.g., "2026-01-15.md") */
  fileName: string;

  /** Parsed date from filename */
  date: Date;

  /** Formatted date string (YYYY-MM-DD) */
  dateString: string;

  /** File size in bytes */
  size: number;

  /** Last modified timestamp */
  mtime: number;

  /** Creation timestamp */
  ctime: number;
}

/**
 * Result of a file operation
 */
export interface FileOperationResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** Error message if failed */
  error?: string;

  /** The file involved in the operation */
  file?: TFile;
}

/**
 * Cache entry for loaded notes
 */
export interface NoteCacheEntry {
  /** The daily note data */
  note: DailyNote;

  /** Timestamp when cached */
  cachedAt: number;

  /** Whether this entry is currently in the DOM */
  isRendered: boolean;
}

/**
 * Scroll position information
 */
export interface ScrollPosition {
  /** Scroll top position in pixels */
  top: number;

  /** Container height in pixels */
  height: number;

  /** Total scrollable height */
  scrollHeight: number;

  /** Whether scrolled near top */
  nearTop: boolean;

  /** Whether scrolled near bottom */
  nearBottom: boolean;
}

/**
 * Options for loading notes
 */
export interface LoadNotesOptions {
  /** Number of notes to load */
  count: number;

  /** Starting date (load backwards from this date) */
  startDate?: Date;

  /** Whether to append to existing notes or replace */
  append: boolean;
}

/**
 * Editor state for a date section
 */
export interface EditorState {
  /** The date this editor is for */
  dateString: string;

  /** The DOM element containing the editor */
  element: HTMLElement;

  /** Current content */
  content: string;

  /** Whether content has been modified */
  isDirty: boolean;

  /** Timeout ID for auto-save debounce */
  saveTimeoutId?: number;
}

/**
 * View state for serialization
 */
export interface ViewState {
  /** Currently loaded date range */
  loadedDates: string[];

  /** Current scroll position */
  scrollTop: number;

  /** Active/focused date */
  activeDate?: string;
}
