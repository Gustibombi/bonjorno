import { Plugin, WorkspaceLeaf } from "obsidian";
import { DailyNotesView } from "./DailyNotesView";
import { DailyNotesManager } from "./DailyNotesManager";
import { SettingsTab } from "./SettingsTab";
import {
  VIEW_TYPE_DAILY_NOTES,
  DEFAULT_SETTINGS,
  RIBBON_ICON,
} from "./constants";
import { BonjoroSettings } from "./types";

/**
 * Main plugin class for Bonjorno
 */
export default class BonjoroPlugin extends Plugin {
  settings: BonjoroSettings;
  notesManager: DailyNotesManager;

  async onload() {
    console.log("Loading Bonjorno plugin");

    // Check if embedRegistry is available
    const embedRegistry = (this.app as any).embedRegistry;
    if (!embedRegistry || !embedRegistry.embedByExtension) {
      console.error(
        "[Bonjorno] embedRegistry not available! Plugin may not work correctly.",
      );
      console.error("[Bonjorno] embedRegistry check failed");
    } else {
      console.log("[Bonjorno] embedRegistry is available");
      console.log(
        "[Bonjorno] Available extensions:",
        Object.keys(embedRegistry.embedByExtension),
      );
    }

    // Load settings
    await this.loadSettings();

    // Initialize the notes manager
    this.notesManager = new DailyNotesManager(this.app, this.settings);

    // Register the custom view
    this.registerView(
      VIEW_TYPE_DAILY_NOTES,
      (leaf) => new DailyNotesView(leaf, this),
    );

    // Add ribbon icon
    this.addRibbonIcon(RIBBON_ICON, "Open Daily Notes", () => {
      this.activateView();
    });

    // Add command to open the view
    this.addCommand({
      id: "open-daily-notes",
      name: "Open Daily Notes",
      callback: () => {
        this.activateView();
      },
    });

    // Add command to refresh the view
    this.addCommand({
      id: "refresh-daily-notes",
      name: "Refresh Daily Notes",
      callback: async () => {
        const leaves = this.app.workspace.getLeavesOfType(
          VIEW_TYPE_DAILY_NOTES,
        );
        if (leaves.length > 0) {
          const view = leaves[0].view as DailyNotesView;
          await view.refresh();
        }
      },
    });

    // Add settings tab
    this.addSettingTab(new SettingsTab(this.app, this));

    // Register file events to handle external changes
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        // Refresh cache when files are created in daily notes directory
        const path = this.settings.dailyNotesPath;
        if (file.path.startsWith(path)) {
          this.notesManager.scanDirectory(true);
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        // Refresh cache when files are deleted from daily notes directory
        const path = this.settings.dailyNotesPath;
        if (file.path.startsWith(path)) {
          this.notesManager.scanDirectory(true);
        }
      }),
    );

    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        // Refresh cache on rename
        const path = this.settings.dailyNotesPath;
        if (file.path.startsWith(path) || oldPath.startsWith(path)) {
          this.notesManager.scanDirectory(true);
        }
      }),
    );

    // If this is the first time loading, maybe activate the view
    // (Optional: can be removed if you don't want auto-open on first load)
    if (this.app.workspace.layoutReady) {
      this.initLeaf();
    } else {
      this.app.workspace.onLayoutReady(() => {
        this.initLeaf();
      });
    }
  }

  onunload() {
    console.log("Unloading Bonjorno plugin");

    // Detach all leaves with our view type
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_DAILY_NOTES);
  }

  /**
   * Initialize leaf (optional - only if you want the view to open on startup)
   */
  initLeaf(): void {
    // Check if view is already open
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES).length > 0) {
      return;
    }

    // Don't auto-open by default, let user open manually
    // If you want to auto-open on first load, uncomment:
    // this.activateView();
  }

  /**
   * Activate the daily notes view
   */
  async activateView() {
    const { workspace } = this.app;

    // Check if view is already open
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);

    if (leaves.length > 0) {
      // View already exists, reveal it
      leaf = leaves[0];
    } else {
      // Create new leaf in main workspace area
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({
        type: VIEW_TYPE_DAILY_NOTES,
        active: true,
      });
    }

    // Reveal the leaf
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  /**
   * Load plugin settings
   */
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /**
   * Save plugin settings
   */
  async saveSettings() {
    await this.saveData(this.settings);

    // Update the notes manager with new settings
    if (this.notesManager) {
      this.notesManager.updateSettings(this.settings);
    }

    // Update all open views with new settings
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_NOTES);
    for (const leaf of leaves) {
      const view = leaf.view as DailyNotesView;
      view.updateSettings(this.settings);
    }
  }
}
