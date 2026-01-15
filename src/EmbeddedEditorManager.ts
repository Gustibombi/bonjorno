import { App, TFile, Component } from "obsidian";

/**
 * Type definitions for Obsidian's internal editor APIs
 * These are not officially documented but widely used in the community
 */
interface WidgetEditorView {
  editable: boolean;
  showEditor(): void;
  editor: any; // CodeMirror editor instance
  unload(): void;
  file: TFile | null;
}

interface EmbedContext {
  app: App;
  containerEl: HTMLElement;
}

interface EditorInstance {
  view: WidgetEditorView;
  container: HTMLElement;
  file: TFile;
  dateString: string;
  saveTimeout?: NodeJS.Timeout;
  isDirty: boolean;
}

/**
 * EmbeddedEditorManager
 *
 * Manages embedded Obsidian markdown editors with full Live Preview support.
 * Uses Obsidian's internal embedRegistry to create native editor instances.
 *
 * Based on community patterns from:
 * - Fevol's embeddable editor gist
 * - mgmeyers' Obsidian Kanban implementation
 */
export class EmbeddedEditorManager extends Component {
  private app: App;
  private editors: Map<string, EditorInstance>;
  private autoSaveDelay: number;

  constructor(app: App, autoSaveDelay: number = 500) {
    super();
    this.app = app;
    this.editors = new Map();
    this.autoSaveDelay = autoSaveDelay;
  }

  /**
   * Create an embedded editor for a daily note
   */
  async createEditor(
    containerEl: HTMLElement,
    file: TFile,
    dateString: string,
    initialContent: string,
  ): Promise<void> {
    try {
      // Check if editor already exists
      if (this.editors.has(dateString)) {
        console.warn(`Editor for ${dateString} already exists`);
        return;
      }

      // Create a wrapper for the editor
      const editorWrapper = containerEl.createDiv("bonjorno-embedded-editor");

      // Create the embedded editor using Obsidian's registry
      const widgetEditorView = this.createWidgetEditor(
        editorWrapper,
        file,
        initialContent,
      );

      if (!widgetEditorView) {
        throw new Error("Failed to create widget editor");
      }

      // Store the editor instance
      const editorInstance: EditorInstance = {
        view: widgetEditorView,
        container: editorWrapper,
        file: file,
        dateString: dateString,
        isDirty: false,
      };

      this.editors.set(dateString, editorInstance);

      // Set up change listener for auto-save
      this.setupAutoSave(editorInstance);

      // Set up editor commands
      this.setupEditorCommands(widgetEditorView);
    } catch (error) {
      console.error(`Error creating editor for ${dateString}:`, error);
      throw error;
    }
  }

  /**
   * Create a widget editor view using Obsidian's internal API
   */
  private createWidgetEditor(
    containerEl: HTMLElement,
    file: TFile,
    initialContent: string,
  ): WidgetEditorView | null {
    try {
      // Access Obsidian's embed registry (undocumented API)
      const embedRegistry = (this.app as any).embedRegistry;

      if (!embedRegistry || !embedRegistry.embedByExtension) {
        console.error("embedRegistry not available");
        return null;
      }

      // Create embed context
      const embedContext: EmbedContext = {
        app: this.app,
        containerEl: containerEl,
      };

      // Create the widget editor
      console.log("[Bonjorno] Calling embedByExtension.md...");
      const widgetEditorView = embedRegistry.embedByExtension.md(
        embedContext,
        file,
        "", // subpath
      ) as WidgetEditorView;

      if (!widgetEditorView) {
        console.error("[Bonjorno] embedByExtension.md returned null/undefined");
        return null;
      }

      console.log("[Bonjorno] Widget view created, enabling edit mode");

      // Enable editing mode
      widgetEditorView.editable = true;

      console.log("[Bonjorno] Calling showEditor()");
      widgetEditorView.showEditor();

      console.log("[Bonjorno] Editor shown, setting content");

      // Get editor instance and set initial content
      const editor = widgetEditorView.editor;
      if (editor && initialContent) {
        // Use setValue to set content
        if (typeof editor.setValue === "function") {
          editor.setValue(initialContent);
        } else if (editor.cm && typeof editor.cm.dispatch === "function") {
          // CodeMirror 6 approach
          const view = editor.cm;
          view.dispatch({
            changes: {
              from: 0,
              to: view.state.doc.length,
              insert: initialContent,
            },
          });
        }
      }

      return widgetEditorView;
    } catch (error) {
      console.error("[Bonjorno] Error in createWidgetEditor:", error);
      console.error(
        "[Bonjorno] Error stack:",
        error instanceof Error ? error.stack : "No stack trace",
      );
      return null;
    }
  }

  /**
   * Set up auto-save for an editor
   */
  private setupAutoSave(editorInstance: EditorInstance): void {
    const editor = editorInstance.view.editor;

    if (!editor) return;

    // Listen for changes
    const onChange = () => {
      editorInstance.isDirty = true;

      // Clear existing timeout
      if (editorInstance.saveTimeout) {
        clearTimeout(editorInstance.saveTimeout);
      }

      // Schedule auto-save
      editorInstance.saveTimeout = setTimeout(() => {
        this.saveEditor(editorInstance.dateString);
      }, this.autoSaveDelay);
    };

    // Try different methods to listen for changes
    if (typeof editor.on === "function") {
      // MarkdownView editor
      editor.on("change", onChange);
    } else if (editor.cm && editor.cm.contentDOM) {
      // CodeMirror 6 - listen to DOM input events
      const cm = editor.cm;
      cm.contentDOM.addEventListener("input", onChange);
      cm.contentDOM.addEventListener("paste", onChange);
    }
  }

  /**
   * Set up editor commands to work properly
   */
  private setupEditorCommands(widgetEditorView: WidgetEditorView): void {
    // Ensure the editor can receive focus and commands
    const editor = widgetEditorView.editor;

    if (editor && editor.cm) {
      const cm = editor.cm;
      // Make sure the editor is properly initialized
      cm.focus();
    }
  }

  /**
   * Save an editor's content to its file
   */
  async saveEditor(dateString: string): Promise<boolean> {
    const editorInstance = this.editors.get(dateString);

    if (!editorInstance || !editorInstance.isDirty) {
      return false;
    }

    try {
      const content = this.getEditorContent(editorInstance);

      if (content !== null) {
        await this.app.vault.modify(editorInstance.file, content);
        editorInstance.isDirty = false;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error saving editor ${dateString}:`, error);
      return false;
    }
  }

  /**
   * Get content from an editor
   */
  private getEditorContent(editorInstance: EditorInstance): string | null {
    const editor = editorInstance.view.editor;

    if (!editor) return null;

    // Try different methods to get content
    if (typeof editor.getValue === "function") {
      return editor.getValue();
    } else if (editor.cm) {
      // CodeMirror 6
      return editor.cm.state.doc.toString();
    }

    return null;
  }

  /**
   * Update editor content (without triggering auto-save)
   */
  updateEditorContent(dateString: string, content: string): void {
    const editorInstance = this.editors.get(dateString);

    if (!editorInstance) return;

    const editor = editorInstance.view.editor;

    if (!editor) return;

    // Temporarily disable auto-save
    const wasDirty = editorInstance.isDirty;
    editorInstance.isDirty = false;

    try {
      if (typeof editor.setValue === "function") {
        editor.setValue(content);
      } else if (editor.cm) {
        const view = editor.cm;
        view.dispatch({
          changes: {
            from: 0,
            to: view.state.doc.length,
            insert: content,
          },
        });
      }
    } finally {
      editorInstance.isDirty = wasDirty;
    }
  }

  /**
   * Get an editor instance
   */
  getEditor(dateString: string): WidgetEditorView | null {
    const instance = this.editors.get(dateString);
    return instance ? instance.view : null;
  }

  /**
   * Check if an editor exists
   */
  hasEditor(dateString: string): boolean {
    return this.editors.has(dateString);
  }

  /**
   * Destroy a specific editor
   */
  async destroyEditor(dateString: string): Promise<void> {
    const editorInstance = this.editors.get(dateString);

    if (!editorInstance) return;

    try {
      // Save any pending changes
      if (editorInstance.isDirty) {
        await this.saveEditor(dateString);
      }

      // Clear save timeout
      if (editorInstance.saveTimeout) {
        clearTimeout(editorInstance.saveTimeout);
      }

      // Unload the widget editor
      if (
        editorInstance.view &&
        typeof editorInstance.view.unload === "function"
      ) {
        editorInstance.view.unload();
      }

      // Clean up container
      if (editorInstance.container) {
        editorInstance.container.empty();
      }

      // Remove from map
      this.editors.delete(dateString);
    } catch (error) {
      console.error(`Error destroying editor ${dateString}:`, error);
    }
  }

  /**
   * Save all dirty editors
   */
  async saveAllEditors(): Promise<void> {
    const savePromises: Promise<boolean>[] = [];

    for (const [dateString, instance] of this.editors.entries()) {
      if (instance.isDirty) {
        savePromises.push(this.saveEditor(dateString));
      }
    }

    await Promise.all(savePromises);
  }

  /**
   * Destroy all editors
   */
  async destroyAllEditors(): Promise<void> {
    // Save all editors first
    await this.saveAllEditors();

    // Destroy each editor
    const dateStrings = Array.from(this.editors.keys());

    for (const dateString of dateStrings) {
      await this.destroyEditor(dateString);
    }

    this.editors.clear();
  }

  /**
   * Get count of active editors
   */
  getEditorCount(): number {
    return this.editors.size;
  }

  /**
   * Get all editor date strings
   */
  getEditorDates(): string[] {
    return Array.from(this.editors.keys());
  }

  /**
   * Component lifecycle - cleanup on unload
   */
  onunload(): void {
    this.destroyAllEditors();
  }
}
