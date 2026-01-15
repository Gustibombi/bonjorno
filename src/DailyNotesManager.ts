import { App, Notice, TFile, TFolder, Vault } from "obsidian";
import { DateService } from "./DateService";
import {
  DEFAULT_NOTE_TEMPLATE,
  ERROR_MESSAGES,
  NOTE_FILE_EXTENSION,
} from "./constants";
import {
  BonjoroSettings,
  DailyNote,
  FileOperationResult,
  LoadNotesOptions,
  NoteMetadata,
} from "./types";

/**
 * DailyNotesManager handles all file operations for daily notes
 */
export class DailyNotesManager {
  private app: App;
  private settings: BonjoroSettings;
  private vault: Vault;
  private cachedFileList: Map<string, TFile>;
  private lastScanTime: number;

  constructor(app: App, settings: BonjoroSettings) {
    this.app = app;
    this.settings = settings;
    this.vault = app.vault;
    this.cachedFileList = new Map();
    this.lastScanTime = 0;
  }

  /**
   * Update settings reference
   */
  updateSettings(settings: BonjoroSettings): void {
    this.settings = settings;
    // Clear cache when settings change (directory might have changed)
    this.cachedFileList.clear();
  }

  /**
   * Get the full path to the daily notes directory
   */
  getDailyNotesPath(): string {
    return this.settings.dailyNotesPath;
  }

  /**
   * Get the full path for a daily note file
   */
  getNotePath(dateString: string): string {
    const filename = `${dateString}${NOTE_FILE_EXTENSION}`;
    return `${this.settings.dailyNotesPath}/${filename}`;
  }

  /**
   * Ensure the daily notes directory exists
   */
  async ensureDirectoryExists(): Promise<boolean> {
    const path = this.getDailyNotesPath();

    try {
      const folder = this.vault.getAbstractFileByPath(path);

      if (!folder) {
        // Directory doesn't exist, create it
        await this.vault.createFolder(path);
        return true;
      }

      if (!(folder instanceof TFolder)) {
        // Path exists but is a file, not a folder
        new Notice(`Error: ${path} exists but is not a folder`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error ensuring directory exists:", error);
      new Notice(`Failed to create directory: ${path}`);
      return false;
    }
  }

  /**
   * Scan the directory and cache all daily note files
   */
  async scanDirectory(forceRefresh = false): Promise<string[]> {
    // Use cache if recent (within 5 seconds) and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && now - this.lastScanTime < 5000) {
      return Array.from(this.cachedFileList.keys());
    }

    try {
      const folder = this.vault.getAbstractFileByPath(this.getDailyNotesPath());

      if (!folder || !(folder instanceof TFolder)) {
        // Directory doesn't exist yet
        return [];
      }

      // Clear existing cache
      this.cachedFileList.clear();

      // Scan all files in the directory
      const files = folder.children;

      for (const file of files) {
        if (file instanceof TFile && file.extension === "md") {
          const filename = file.name;

          // Check if it's a valid daily note filename
          if (DateService.isValidDailyNoteFilename(filename)) {
            const dateString = filename.replace(NOTE_FILE_EXTENSION, "");
            this.cachedFileList.set(dateString, file);
          }
        }
      }

      this.lastScanTime = now;

      // Return sorted date strings (newest first)
      const dateStrings = Array.from(this.cachedFileList.keys());
      return DateService.sortDateStringsDesc(dateStrings);
    } catch (error) {
      console.error("Error scanning directory:", error);
      return [];
    }
  }

  /**
   * Load a batch of notes
   */
  async loadNotes(options: LoadNotesOptions): Promise<DailyNote[]> {
    const { count, startDate } = options;
    const start = startDate || new Date();

    // Scan directory to get existing files only
    const existingDates = await this.scanDirectory();

    // Filter to dates <= startDate and sort (newest first)
    const startDateString = DateService.formatDateToFileName(start);
    const filteredDates = existingDates.filter((dateString) => {
      return dateString <= startDateString;
    });

    // Take only 'count' number of dates
    const datesToLoad = filteredDates.slice(0, count);

    // Load each note
    const notes: DailyNote[] = [];

    for (const dateString of datesToLoad) {
      const date = DateService.parseDateString(dateString);
      if (!date) continue;

      let content = "";
      let file: TFile | null = null;

      // Load the file content
      file = this.cachedFileList.get(dateString) || null;
      if (file) {
        try {
          content = await this.vault.read(file);
        } catch (error) {
          console.error(`Error reading file ${dateString}:`, error);
          content = "";
        }
      }

      const note: DailyNote = {
        date: date,
        dateString: dateString,
        content: content,
        file: file,
        exists: true,
        isDirty: false,
        displayDate: DateService.formatDateForDisplay(date),
      };

      notes.push(note);
    }

    return notes;
  }

  /**
   * Get or create today's note
   */
  async getOrCreateTodayNote(): Promise<DailyNote> {
    const today = new Date();
    const dateString = DateService.getTodayFormatted();

    // Check if it exists
    const existingDates = await this.scanDirectory();

    if (existingDates.includes(dateString)) {
      // Load existing note
      const notes = await this.loadNotes({
        count: 1,
        startDate: today,
        append: false,
      });
      return notes[0];
    }

    // Create new note
    const result = await this.createNote(dateString, DEFAULT_NOTE_TEMPLATE);

    if (!result.success) {
      throw new Error(`Failed to create today's note: ${result.error}`);
    }

    // Return the newly created note
    const note: DailyNote = {
      date: today,
      dateString: dateString,
      content: DEFAULT_NOTE_TEMPLATE,
      file: result.file || null,
      exists: true,
      isDirty: false,
      displayDate: DateService.formatDateForDisplay(today),
    };

    return note;
  }

  /**
   * Create a new daily note
   */
  async createNote(
    dateString: string,
    content: string = DEFAULT_NOTE_TEMPLATE,
  ): Promise<FileOperationResult> {
    try {
      // Ensure directory exists
      const dirExists = await this.ensureDirectoryExists();
      if (!dirExists) {
        return {
          success: false,
          error: ERROR_MESSAGES.permissionDenied,
        };
      }

      const path = this.getNotePath(dateString);

      // Check if file already exists
      const existingFile = this.vault.getAbstractFileByPath(path);
      if (existingFile) {
        return {
          success: false,
          error: "File already exists",
        };
      }

      // Create the file
      const file = await this.vault.create(path, content);

      // Update cache
      this.cachedFileList.set(dateString, file);

      return {
        success: true,
        file: file,
      };
    } catch (error) {
      console.error(`Error creating note ${dateString}:`, error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Save content to a daily note
   */
  async saveNote(
    dateString: string,
    content: string,
  ): Promise<FileOperationResult> {
    try {
      let file = this.cachedFileList.get(dateString);

      if (!file) {
        // File doesn't exist yet, create it
        return await this.createNote(dateString, content);
      }

      // Verify the file still exists in the vault
      const existingFile = this.vault.getAbstractFileByPath(file.path);
      if (!existingFile) {
        // File was deleted, recreate it
        this.cachedFileList.delete(dateString);
        return await this.createNote(dateString, content);
      }

      // Modify the file
      await this.vault.modify(file, content);

      return {
        success: true,
        file: file,
      };
    } catch (error) {
      console.error(`Error saving note ${dateString}:`, error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Delete a daily note
   */
  async deleteNote(dateString: string): Promise<FileOperationResult> {
    try {
      const file = this.cachedFileList.get(dateString);

      if (!file) {
        return {
          success: false,
          error: "File not found",
        };
      }

      // Delete the file
      await this.vault.delete(file);

      // Remove from cache
      this.cachedFileList.delete(dateString);

      return {
        success: true,
      };
    } catch (error) {
      console.error(`Error deleting note ${dateString}:`, error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Read a daily note's content
   */
  async readNote(dateString: string): Promise<string | null> {
    try {
      const file = this.cachedFileList.get(dateString);

      if (!file) {
        return null;
      }

      const content = await this.vault.read(file);
      return content;
    } catch (error) {
      console.error(`Error reading note ${dateString}:`, error);
      return null;
    }
  }

  /**
   * Check if a note exists
   */
  async noteExists(dateString: string): Promise<boolean> {
    const existingDates = await this.scanDirectory();
    return existingDates.includes(dateString);
  }

  /**
   * Get metadata for a note
   */
  async getNoteMetadata(dateString: string): Promise<NoteMetadata | null> {
    const file = this.cachedFileList.get(dateString);

    if (!file) {
      return null;
    }

    const date = DateService.parseDateString(dateString);

    if (!date) {
      return null;
    }

    return {
      path: file.path,
      fileName: file.name,
      date: date,
      dateString: dateString,
      size: file.stat.size,
      mtime: file.stat.mtime,
      ctime: file.stat.ctime,
    };
  }

  /**
   * Get all daily notes metadata sorted by date (newest first)
   */
  async getAllNotesMetadata(): Promise<NoteMetadata[]> {
    const dateStrings = await this.scanDirectory();
    const metadata: NoteMetadata[] = [];

    for (const dateString of dateStrings) {
      const meta = await this.getNoteMetadata(dateString);
      if (meta) {
        metadata.push(meta);
      }
    }

    return metadata;
  }

  /**
   * Get the TFile reference for a date
   */
  getFile(dateString: string): TFile | null {
    return this.cachedFileList.get(dateString) || null;
  }

  /**
   * Refresh cache for a specific file (useful after external changes)
   */
  async refreshFile(dateString: string): Promise<void> {
    const path = this.getNotePath(dateString);
    const file = this.vault.getAbstractFileByPath(path);

    if (file && file instanceof TFile) {
      this.cachedFileList.set(dateString, file);
    } else {
      this.cachedFileList.delete(dateString);
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cachedFileList.clear();
    this.lastScanTime = 0;
  }
}
