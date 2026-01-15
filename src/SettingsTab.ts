import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import BonjoroPlugin from "./main";
import { DEFAULT_SETTINGS } from "./constants";

/**
 * Settings tab for configuring Bonjorno plugin
 */
export class SettingsTab extends PluginSettingTab {
  plugin: BonjoroPlugin;

  constructor(app: App, plugin: BonjoroPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // Header
    containerEl.createEl("h2", { text: "Bonjorno Settings" });

    containerEl.createEl("p", {
      text: "Configure your daily notes experience.",
      cls: "setting-item-description",
    });

    // Daily Notes Directory
    new Setting(containerEl)
      .setName("Daily notes directory")
      .setDesc(
        "Path to the folder where daily notes will be stored (relative to vault root). The folder will be created if it doesn't exist.",
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.dailyNotesPath)
          .setValue(this.plugin.settings.dailyNotesPath)
          .onChange(async (value) => {
            // Sanitize the path
            let sanitized = value.trim();

            // Remove leading/trailing slashes
            sanitized = sanitized.replace(/^\/+|\/+$/g, "");

            // Replace multiple slashes with single slash
            sanitized = sanitized.replace(/\/+/g, "/");

            // Update settings
            this.plugin.settings.dailyNotesPath =
              sanitized || DEFAULT_SETTINGS.dailyNotesPath;
            await this.plugin.saveSettings();

            // Notify user of directory change
            new Notice(
              "Daily notes directory updated. Please reopen the view.",
            );
          }),
      );

    // Initial Load Count
    new Setting(containerEl)
      .setName("Initial days to load")
      .setDesc(
        "Number of daily notes to load when opening the view. Higher numbers may increase load time.",
      )
      .addSlider((slider) =>
        slider
          .setLimits(7, 90, 1)
          .setValue(this.plugin.settings.initialLoadCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.initialLoadCount = value;
            await this.plugin.saveSettings();
          }),
      )
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Reset to default")
          .onClick(async () => {
            this.plugin.settings.initialLoadCount =
              DEFAULT_SETTINGS.initialLoadCount;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    // Load More Count
    new Setting(containerEl)
      .setName("Load more count")
      .setDesc(
        "Number of additional daily notes to load when scrolling to older entries.",
      )
      .addSlider((slider) =>
        slider
          .setLimits(5, 50, 1)
          .setValue(this.plugin.settings.loadMoreCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.loadMoreCount = value;
            await this.plugin.saveSettings();
          }),
      )
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Reset to default")
          .onClick(async () => {
            this.plugin.settings.loadMoreCount = DEFAULT_SETTINGS.loadMoreCount;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    // Date Format (for display)
    containerEl.createEl("h3", { text: "Display Options" });

    new Setting(containerEl)
      .setName("Date format")
      .setDesc(
        "Format for displaying date headers. Uses moment.js format (e.g., 'MMMM Do, YYYY' → 'January 15th, 2026').",
      )
      .addText((text) =>
        text
          .setPlaceholder(DEFAULT_SETTINGS.dateFormat)
          .setValue(this.plugin.settings.dateFormat)
          .onChange(async (value) => {
            this.plugin.settings.dateFormat =
              value || DEFAULT_SETTINGS.dateFormat;
            await this.plugin.saveSettings();
          }),
      )
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Reset to default")
          .onClick(async () => {
            this.plugin.settings.dateFormat = DEFAULT_SETTINGS.dateFormat;
            await this.plugin.saveSettings();
            this.display();
          }),
      );

    // Auto-save settings
    containerEl.createEl("h3", { text: "Auto-save Options" });

    new Setting(containerEl)
      .setName("Enable auto-save")
      .setDesc(
        "Automatically save changes after you stop typing. Disable this to save manually.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoSave)
          .onChange(async (value) => {
            this.plugin.settings.autoSave = value;
            await this.plugin.saveSettings();

            // Refresh the display to show/hide auto-save delay setting
            this.display();
          }),
      );

    // Auto-save delay (only show if auto-save is enabled)
    if (this.plugin.settings.autoSave) {
      new Setting(containerEl)
        .setName("Auto-save delay")
        .setDesc(
          "Time in milliseconds to wait after you stop typing before auto-saving.",
        )
        .addSlider((slider) =>
          slider
            .setLimits(100, 2000, 100)
            .setValue(this.plugin.settings.autoSaveDelay)
            .setDynamicTooltip()
            .onChange(async (value) => {
              this.plugin.settings.autoSaveDelay = value;
              await this.plugin.saveSettings();
            }),
        )
        .addExtraButton((button) =>
          button
            .setIcon("reset")
            .setTooltip("Reset to default")
            .onClick(async () => {
              this.plugin.settings.autoSaveDelay =
                DEFAULT_SETTINGS.autoSaveDelay;
              await this.plugin.saveSettings();
              this.display();
            }),
        );
    }

    // Information section
    containerEl.createEl("h3", { text: "About" });

    const infoDiv = containerEl.createDiv("bonjorno-info");
    infoDiv.createEl("p", {
      text: "Bonjorno creates a Logseq-style daily notes view where you can see and edit all your daily notes in chronological order (newest to oldest).",
    });

    infoDiv.createEl("p", {
      text: `Daily note files are stored as individual markdown files with the naming format YYYY-MM-DD.md (e.g., ${new Date().getFullYear()}-01-15.md).`,
    });

    infoDiv.createEl("p", {
      text: "You can manually create, edit, or delete files in the daily notes directory and they will be automatically detected.",
    });

    // Tips section
    containerEl.createEl("h3", { text: "Tips" });

    const tipsDiv = containerEl.createDiv("bonjorno-tips");
    tipsDiv.createEl("li", {
      text: "Click the calendar icon in the left sidebar to open the daily notes view.",
    });

    tipsDiv.createEl("li", {
      text: "Scroll up in the view to load older notes automatically.",
    });

    tipsDiv.createEl("li", {
      text: "Today's note is automatically created when you open the view if it doesn't exist.",
    });

    tipsDiv.createEl("li", {
      text: "Each daily note is saved as a separate file, making it easy to link to specific days.",
    });

    // Reset all settings button
    containerEl.createEl("h3", { text: "Reset" });

    new Setting(containerEl)
      .setName("Reset all settings")
      .setDesc("Reset all settings to their default values.")
      .addButton((button) =>
        button
          .setButtonText("Reset")
          .setWarning()
          .onClick(async () => {
            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
            await this.plugin.saveSettings();
            new Notice("All settings reset to defaults");
            this.display();
          }),
      );
  }
}
