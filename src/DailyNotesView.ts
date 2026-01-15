import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import {
  VIEW_TYPE_DAILY_NOTES,
  CSS_CLASSES,
  SCROLL_LOAD_THRESHOLD,
  VIEW_DISPLAY_TEXT,
} from "./constants";
import { DailyNotesManager } from "./DailyNotesManager";
import { DateService } from "./DateService";
import { DailyNote, BonjoroSettings } from "./types";
import BonjoroPlugin from "./main";
import { EmbeddedEditorManager } from "./EmbeddedEditorManager";

/**
 * Custom view for displaying daily notes in chronological order
 */
export class DailyNotesView extends ItemView {
  private plugin: BonjoroPlugin;
  private manager: DailyNotesManager;
  private settings: BonjoroSettings;
  private notes: DailyNote[];
  private editorManager: EmbeddedEditorManager;
  private notesContentEl: HTMLElement;
  private isLoading: boolean;
  private loadingIndicator: HTMLElement | null;
  private hasMoreToLoad: boolean;
  private scrollHandler: () => void;

  constructor(leaf: WorkspaceLeaf, plugin: BonjoroPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.manager = plugin.notesManager;
    this.settings = plugin.settings;
    this.notes = [];
    this.editorManager = new EmbeddedEditorManager(
      plugin.app,
      plugin.settings.autoSaveDelay,
    );
    this.isLoading = false;
    this.loadingIndicator = null;
    this.hasMoreToLoad = true;

    // Bind scroll handler
    this.scrollHandler = this.handleScroll.bind(this);
  }

  async onClose(): Promise<void> {
    // Remove scroll listener
    this.containerEl.removeEventListener("scroll", this.scrollHandler);

    // Save any pending changes
    await this.editorManager.saveAllEditors();

    // Destroy all editors
    await this.editorManager.destroyAllEditors();

    // Clear notes
    this.notes = [];
  }

  getViewType(): string {
    return VIEW_TYPE_DAILY_NOTES;
  }

  getDisplayText(): string {
    return VIEW_DISPLAY_TEXT;
  }

  getIcon(): string {
    return "calendar-days";
  }

  async onOpen(): Promise<void> {
    // Create main container
    const container = this.containerEl;
    container.empty();
    container.addClass(CSS_CLASSES.container);

    // Create content wrapper
    this.notesContentEl = container.createDiv("bonjorno-content");

    // Add scroll listener
    this.containerEl.addEventListener("scroll", this.scrollHandler);

    // Ensure directory exists
    await this.manager.ensureDirectoryExists();

    // Get or create today's note
    try {
      await this.manager.getOrCreateTodayNote();
    } catch (error) {
      console.error("Error creating today's note:", error);
      new Notice("Failed to create today's note");
    }

    // Load initial notes
    await this.loadInitialNotes();
  }

  /**
   * Load initial batch of notes
   */
  private async loadInitialNotes(): Promise<void> {
    this.isLoading = true;
    this.showLoadingIndicator();

    try {
      const loadedNotes = await this.manager.loadNotes({
        count: this.settings.initialLoadCount,
        startDate: new Date(),
        append: false,
      });

      this.notes = loadedNotes;
      this.hasMoreToLoad =
        loadedNotes.length === this.settings.initialLoadCount;

      await this.renderAllNotes();
    } catch (error) {
      console.error("Error loading initial notes:", error);
      new Notice("Failed to load daily notes");
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  /**
   * Load more notes (when scrolling up)
   */
  private async loadMoreNotes(): Promise<void> {
    if (this.isLoading || !this.hasMoreToLoad) {
      return;
    }

    this.isLoading = true;
    this.showLoadingIndicator();

    try {
      // Get the oldest date currently loaded
      const oldestDate =
        this.notes.length > 0
          ? DateService.subtractDays(this.notes[this.notes.length - 1].date, 1)
          : new Date();

      const loadedNotes = await this.manager.loadNotes({
        count: this.settings.loadMoreCount,
        startDate: oldestDate,
        append: true,
      });

      if (loadedNotes.length === 0) {
        this.hasMoreToLoad = false;
        return;
      }

      // Append to existing notes
      this.notes.push(...loadedNotes);

      // Render only the new notes
      await this.renderAdditionalNotes(loadedNotes);

      // Check if we should continue loading
      this.hasMoreToLoad = loadedNotes.length === this.settings.loadMoreCount;
    } catch (error) {
      console.error("Error loading more notes:", error);
      new Notice("Failed to load older notes");
    } finally {
      this.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  /**
   * Render all notes
   */
  private async renderAllNotes(): Promise<void> {
    this.notesContentEl.empty();
    await this.editorManager.destroyAllEditors();

    if (this.notes.length === 0) {
      this.renderEmptyState();
      return;
    }

    for (const note of this.notes) {
      await this.renderNoteSection(note);
    }
  }

  /**
   * Render additional notes (for lazy loading)
   */
  private async renderAdditionalNotes(notes: DailyNote[]): Promise<void> {
    for (const note of notes) {
      await this.renderNoteSection(note);
    }
  }

  /**
   * Render a single note section
   */
  private async renderNoteSection(note: DailyNote): Promise<void> {
    const section = this.notesContentEl.createDiv(CSS_CLASSES.dateSection);
    section.dataset.date = note.dateString;

    // Date header
    const header = section.createDiv(CSS_CLASSES.dateHeader);
    header.createEl("h2", { text: note.displayDate });

    // Add indicator if it's today
    if (DateService.isToday(note.date)) {
      header.createEl("span", {
        text: "Today",
        cls: "bonjorno-today-badge",
      });
    }

    // Content area
    const contentDiv = section.createDiv(CSS_CLASSES.dateContent);

    // Create embedded editor if file exists
    if (note.file) {
      try {
        console.log(`[Bonjorno] Creating editor for ${note.dateString}`);
        console.log(`[Bonjorno] File path: ${note.file.path}`);
        console.log(`[Bonjorno] Content length: ${note.content.length}`);

        // Strip date line from content if present
        const cleanedContent = this.stripDateLineFromContent(
          note.content,
          note.dateString,
        );

        await this.editorManager.createEditor(
          contentDiv,
          note.file,
          note.dateString,
          cleanedContent,
        );

        console.log(
          `[Bonjorno] Editor created successfully for ${note.dateString}`,
        );
      } catch (error) {
        console.error(
          `[Bonjorno] Failed to create editor for ${note.dateString}:`,
          error,
        );
        console.error(`[Bonjorno] Error details:`, {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : "No stack",
          file: note.file.path,
          dateString: note.dateString,
        });

        // Show detailed error message
        const errorDiv = contentDiv.createDiv("bonjorno-error");
        errorDiv.createEl("p", {
          text: "Failed to load editor.",
        });
        errorDiv.createEl("p", {
          text: error instanceof Error ? error.message : String(error),
          cls: "bonjorno-error-details",
        });
        errorDiv
          .createEl("button", {
            text: "Retry",
          })
          .addEventListener("click", async () => {
            contentDiv.empty();
            await this.renderNoteSection(note);
          });
      }
    } else {
      // No file yet, show placeholder
      console.warn(
        `[Bonjorno] No file for ${note.dateString}, showing placeholder`,
      );
      contentDiv.createEl("p", {
        text: "Creating note...",
        cls: "bonjorno-placeholder",
      });
    }
  }

  /**
   * Strip the date line from content if it matches the filename date
   * Also strip leading empty lines
   */
  private stripDateLineFromContent(
    content: string,
    dateString: string,
  ): string {
    if (!content || !content.trim()) {
      return content;
    }

    // Split into lines
    const lines = content.split("\n");
    let startIndex = 0;

    // Skip any leading empty lines
    while (startIndex < lines.length && lines[startIndex].trim() === "") {
      startIndex++;
    }

    // Check if first non-empty line is just the date (YYYY-MM-DD)
    if (startIndex < lines.length && lines[startIndex].trim() === dateString) {
      startIndex++;
      // Remove any following empty lines
      while (startIndex < lines.length && lines[startIndex].trim() === "") {
        startIndex++;
      }
    }

    // If we've moved the start index, slice from there
    if (startIndex > 0) {
      return lines.slice(startIndex).join("\n");
    }

    return content;
  }

  /**
   * Handle scroll events
   */
  private handleScroll(): void {
    const scrollTop = this.containerEl.scrollTop;

    // Check if near bottom (to load more)
    const scrollHeight = this.containerEl.scrollHeight;
    const clientHeight = this.containerEl.clientHeight;
    const scrollBottom = scrollHeight - scrollTop - clientHeight;

    if (scrollBottom < SCROLL_LOAD_THRESHOLD) {
      this.loadMoreNotes();
    }
  }

  /**
   * Show loading indicator
   */
  private showLoadingIndicator(): void {
    if (this.loadingIndicator) return;

    this.loadingIndicator = this.notesContentEl.createDiv(
      CSS_CLASSES.loadingIndicator,
    );
    this.loadingIndicator.setText("Loading...");
  }

  /**
   * Hide loading indicator
   */
  private hideLoadingIndicator(): void {
    if (this.loadingIndicator) {
      this.loadingIndicator.remove();
      this.loadingIndicator = null;
    }
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): void {
    const emptyDiv = this.notesContentEl.createDiv(CSS_CLASSES.emptyState);
    emptyDiv.createEl("h3", { text: "No daily notes yet" });
    emptyDiv.createEl("p", {
      text: "Your daily notes will appear here. Start writing to create your first note!",
    });
  }

  /**
   * Refresh the view
   */
  async refresh(): Promise<void> {
    await this.editorManager.saveAllEditors();
    await this.loadInitialNotes();
  }

  /**
   * Update settings reference
   */
  updateSettings(settings: BonjoroSettings): void {
    this.settings = settings;
  }
}
