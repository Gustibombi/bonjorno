# Bonjorno - Daily Notes for Obsidian

![Bonjorno Banner](https://img.shields.io/badge/Obsidian-Plugin-purple?style=for-the-badge&logo=obsidian)
![Version](https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

A Logseq-style daily notes plugin for Obsidian that displays all your daily notes in a single, continuous scrollable timeline from newest to oldest.

## ✨ Features

- 📅 **Chronological Timeline View** - See all your daily notes in one place, ordered from newest to oldest
- ✍️ **Native Obsidian Editing** - Full Live Preview mode with native markdown editing experience
- 🎨 **Live Preview** - Edit markdown with instant formatting - the line you're editing shows syntax, everything else is formatted
- 🚀 **Performance Optimized** - Lazy loading handles years of daily notes smoothly
- 🔄 **Auto-Creation** - Today's note is automatically created when you open the view
- 📁 **Flexible Storage** - Configure where your daily notes are stored
- 🎨 **Theme Compatible** - Respects your Obsidian theme (light/dark mode)
- 💾 **Auto-Save** - Changes are automatically saved as you type
- 📱 **Mobile Support** - Works on both desktop and mobile
- ⚡ **Full Obsidian Features** - Autocomplete, syntax highlighting, and all editor extensions work

## 📦 Installation

### From Obsidian Community Plugins (Coming Soon)

1. Open Obsidian Settings
2. Navigate to Community Plugins
3. Search for "Bonjorno"
4. Click Install
5. Enable the plugin

### Manual Installation

1. Download the latest release from the [Releases page](https://github.com/yourusername/bonjorno/releases)
2. Extract the files into your vault's `.obsidian/plugins/bonjorno/` directory
3. Reload Obsidian
4. Enable "Bonjorno" in Settings → Community Plugins

### For Developers

```bash
# Clone the repository
git clone https://github.com/yourusername/bonjorno.git

# Navigate to your vault's plugins directory
cd /path/to/your/vault/.obsidian/plugins/

# Move the bonjorno folder there
mv /path/to/bonjorno ./

# Install dependencies
cd bonjorno
pnpm install

# Start development build (auto-rebuilds on changes)
pnpm run dev
```

## 🚀 Usage

### Opening the Daily Notes View

1. **Click the calendar icon** in the left sidebar ribbon
2. **Or use the command palette**: Press `Ctrl/Cmd + P` and type "Open Daily Notes"

### Creating Your First Note

When you open the view for the first time:

- Today's note will be automatically created if it doesn't exist
- Start typing in the text area to add content
- Your changes are automatically saved after you stop typing (default: 500ms delay)

### Navigating Your Notes

- **Scroll down** to see older notes
- Additional notes are automatically loaded as you scroll
- Each date section shows the full formatted date (e.g., "January 15th, 2026")
- Today's note has a special "Today" badge

### File Organization

Daily notes are stored as individual markdown files with the naming format:

```
YYYY-MM-DD.md
```

Example:

```
daily-notes/
├── 2026-01-15.md
├── 2026-01-14.md
├── 2026-01-13.md
└── ...
```

### Manual File Management

You can:

- ✅ Manually create files in the daily notes directory
- ✅ Edit files outside the plugin view
- ✅ Delete files you no longer need
- ✅ Link to daily notes from other notes using standard Obsidian links

The plugin automatically detects changes and updates the view accordingly.

## ⚙️ Settings

Access settings via: **Settings → Bonjorno**

### Daily Notes Directory

- **Default**: `daily-notes`
- **Description**: Path to the folder where daily notes will be stored (relative to vault root)
- The folder will be created automatically if it doesn't exist

### Initial Days to Load

- **Default**: 30 days
- **Range**: 7-90 days
- **Description**: Number of daily notes to load when opening the view

### Load More Count

- **Default**: 20 days
- **Range**: 5-50 days
- **Description**: Number of additional notes to load when scrolling to older entries

### Date Format

- **Default**: `MMMM Do, YYYY` (e.g., "January 15th, 2026")
- **Description**: Format for displaying date headers (uses moment.js format)

### Enable Auto-Save

- **Default**: Enabled
- **Description**: Automatically save changes after you stop typing

### Auto-Save Delay

- **Default**: 500ms
- **Range**: 100-2000ms
- **Description**: Time to wait after you stop typing before auto-saving

## 🎯 Use Cases

### Daily Journaling

Perfect for:

- Morning pages
- Daily reflections
- Gratitude journals
- Habit tracking
- Daily logs

### Project Notes

Great for:

- Daily standup notes
- Work logs
- Progress tracking
- Meeting notes organized by date

### Personal Knowledge Management

Ideal for:

- Fleeting notes (Zettelkasten)
- Daily ideas capture
- Learning logs
- Reading notes

## 🔗 Integration with Obsidian

### Linking to Daily Notes

From any note, you can link to a daily note:

```markdown
See [[2026-01-15]] for more details
```

### Backlinks

Daily notes appear in Obsidian's backlinks panel, making it easy to:

- See which notes reference a specific day
- Build connections between daily notes and other notes
- Navigate your knowledge graph

### Tags

Use tags in your daily notes:

```markdown
# 2026-01-15

Today I learned about #obsidian plugins!

- Built my first plugin #development
- Need to review #todo
```

## 🛠️ Development

### Building

```bash
# Development build (watches for changes)
pnpm run dev

# Production build
pnpm run build
```

### Project Structure

```
bonjorno/
├── src/
│   ├── main.ts              # Main plugin class
│   ├── DailyNotesView.ts    # Custom view implementation
│   ├── DailyNotesManager.ts # File management
│   ├── DateService.ts       # Date utilities
│   ├── SettingsTab.ts       # Settings UI
│   ├── types.ts             # TypeScript interfaces
│   └── constants.ts         # Constants
├── styles.css               # Plugin styles
├── manifest.json            # Plugin metadata
├── package.json             # Dependencies
└── README.md                # This file
```

### Technologies Used

- **TypeScript** - Type-safe development
- **Obsidian API** - Plugin framework
- **Embedded Editors** - Uses Obsidian's internal editor system for native Live Preview
- **CodeMirror 6** - Obsidian's editor engine (accessed via embedRegistry)
- **pnpm** - Fast, efficient package manager
- **esbuild** - Fast bundling

## 🔧 Technical Details

### Native Editor Integration

Bonjorno uses Obsidian's internal `embedRegistry` to create native markdown editors for each date section. This provides:

- **True Live Preview**: The same editing experience as normal Obsidian notes
- **Full Feature Support**: All editor extensions, plugins, and commands work
- **Automatic Formatting**: Markdown is rendered while you type, with syntax visible only on the current line

This approach is based on community patterns from plugins like Obsidian Kanban and uses Obsidian's `WidgetEditorView` system.

### Performance Considerations

- **Lazy Loading**: Only visible editors are created
- **Auto-Save**: Changes are saved 500ms after you stop typing
- **Memory Management**: Editors are properly cleaned up when scrolled out of view
- **File Syncing**: Each editor is connected directly to its markdown file

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Roadmap

- [x] Native Obsidian Live Preview editing
- [x] Full markdown rendering with syntax highlighting
- [ ] Search within daily notes
- [ ] Date picker for quick navigation
- [ ] Custom templates for new notes
- [ ] Calendar view integration
- [ ] Export multiple days
- [ ] Weekly/Monthly summaries
- [ ] Hierarchical folder structure option
- [ ] Editor command palette integration

## 🐛 Known Issues

- None currently reported

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💖 Support

If you find this plugin helpful:

- ⭐ Star the repository
- 🐛 Report issues
- 💡 Suggest features
- 🤝 Contribute code

## 🙏 Acknowledgments

- Inspired by [Logseq](https://logseq.com/)'s daily notes interface
- Built with the [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- Thanks to the Obsidian community for their support and feedback

## 📧 Contact

- GitHub Issues: [Report a bug or request a feature](https://github.com/yourusername/bonjorno/issues)
- Obsidian Forum: [Discussion thread](https://forum.obsidian.md/)

---

**Made with ❤️ for the Obsidian community**
