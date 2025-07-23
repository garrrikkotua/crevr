# 🔄 Crev

A beautiful web-based UI for reviewing and reverting Claude Code changes. Think of it as "git diff" but for your Claude conversations.

## ✨ Features

- **🔍 Visual Diff Viewer** - See exactly what Claude changed with before/after comparisons
- **🎯 Selective Reversion** - Revert individual changes or entire files
- **📁 File Tree** - Organized view of all modified files
- **🗂️ Two View Modes** - Diff view and inline view for different perspectives
- **💾 Persistent Tracking** - Reverted changes stay hidden (never modifies Claude logs)
- **🔄 Smart Recovery** - Restore deleted files or undo unwanted modifications
- **⚡ Real-time Updates** - See changes as they happen
- **🌐 Web-based** - Works in any browser, no IDE integration needed

## 🚀 Quick Start

### Install globally via npm:

```bash
npm install -g crev
```

### Use in any directory where Claude Code has been used:

```bash
# Navigate to your project directory
cd /your/project

# Start Crev (opens in browser automatically)
crev

# Or specify a custom port
crev --port 8080

# Don't auto-open browser
crev --no-open
```

That's it! Crev will scan your Claude Code session and show you all the changes.

## 🛠️ How It Works

Crev reads your Claude Code session files (stored in `~/.claude/projects/`) and presents all file changes in an intuitive web interface. It never modifies your original Claude logs - reverted changes are tracked separately in `~/.crev/`.

### Key Concepts:

- **Changes are grouped by file** - See all modifications to each file
- **Each change shows exactly what was modified** - Before/after text with diff highlighting  
- **Reverting is permanent** - Reverted changes disappear from the UI and stay hidden
- **File recovery** - Deleted files can be restored by reverting their deletion

## 🔧 CLI Options

```bash
crev [options]

Options:
  -p, --port <port>    Port to run the server on (default: 3456)
  --no-open           Don't automatically open the browser
  -V, --version       Output the version number
  -h, --help          Display help information
```

### Additional Commands

```bash
# List recent changes in terminal (no UI)
crev list
```

## 🎯 Use Cases

- **Review Claude's changes before committing** - See exactly what was modified
- **Selective cleanup** - Keep the good changes, revert the problematic ones
- **File recovery** - Restore accidentally deleted files
- **Change auditing** - Track what Claude has done to your codebase
- **Learning tool** - Understand how Claude approaches code modifications

## 🤝 Comparison with Similar Tools

| Feature | Crev | ccundo | Claude Code Diff |
|---------|------|---------|------------------|
| Web UI | ✅ | ❌ | ❌ |
| Visual diffs | ✅ | ❌ | ✅ |
| Selective revert | ✅ | ✅ | ❌ |
| File recovery | ✅ | ✅ | ❌ |
| Persistent state | ✅ | ✅ | ❌ |
| Real-time updates | ✅ | ❌ | ❌ |

## 🔒 Privacy & Security

- **Local only** - Crev runs entirely on your machine
- **No data collection** - Nothing is sent to external servers
- **Safe operations** - Original Claude logs are never modified
- **File access** - Only reads files in your current working directory

## 🐛 Troubleshooting

### No changes showing?
- Make sure you're in a directory where Claude Code has been used
- Check that `~/.claude/projects/` contains session files
- Try the `crev list` command to see if changes are detected

### Browser doesn't open?
- Use `crev --no-open` and manually visit the URL shown
- Check if another process is using the port (`crev --port 8080`)

### Revert not working?
- Check file permissions in your project directory
- Ensure the file hasn't been manually modified since Claude's change

## 🛣️ Roadmap

- [ ] Undo reverts (re-apply changes)
- [ ] Export diffs to patch files  
- [ ] Integration with git workflows
- [ ] Support for multiple Claude sessions
- [ ] Dark/light theme toggle
- [ ] Keyboard shortcuts

## 🤝 Contributing

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/garrrikkotua/crev/issues).

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [ccundo](https://github.com/RonitSachdev/ccundo) for the revert tracking approach
- Built for the [Claude Code](https://claude.ai/code) community

---

**Made with ❤️ for Claude Code users**