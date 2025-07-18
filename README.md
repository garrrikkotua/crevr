# Claude Revert

A TypeScript CLI tool with a web UI for reverting Claude Code changes. This tool analyzes Claude's JSONL history files and provides an intuitive interface to view and revert individual file changes.

## Features

- 📁 **File Change Detection**: Parses Claude's JSONL logs to track file modifications
- 🎨 **Visual UI**: Clean web interface similar to Cursor's change viewer
- 🔄 **Individual Reverts**: Revert specific changes without affecting others
- 📊 **Diff Visualization**: See exactly what changed with syntax highlighting
- 🚀 **Easy Installation**: Install globally via npm
- 🔍 **Search & Navigation**: Quickly find specific changes across your project

## Installation

```bash
npm install -g claude-revert
```

## Usage

### Start the UI

```bash
claude-revert start
```

This will:
1. Start the web server (default port: 3456)
2. Automatically open your browser
3. Display all recent Claude Code changes

### Options

```bash
claude-revert start --port 8080      # Use custom port
claude-revert start --no-open        # Don't auto-open browser
```

### List Changes (CLI)

```bash
claude-revert list
```

View recent changes in the terminal without starting the UI.

## How It Works

1. **Log Analysis**: Reads Claude's JSONL files from `~/.claude/logs/`
2. **Change Tracking**: Extracts file modifications (Write, Edit, MultiEdit operations)
3. **Diff Generation**: Creates visual diffs showing what changed
4. **Revert Capability**: Restores files to their previous state

## UI Features

- **Change List**: Browse all file modifications chronologically
- **Diff Viewer**: See exact changes with added/removed lines highlighted
- **One-Click Revert**: Revert individual changes with confirmation
- **Real-time Updates**: Changes refresh automatically
- **File Filtering**: Focus on specific files or change types

## Troubleshooting

### No Changes Found
If you don't see any changes:
- Ensure Claude Code is installed and you've made some edits
- Check that logs exist in `~/.claude/logs/`
- Verify the log files contain recent activity

### Port Already in Use
If port 3456 is busy:
```bash
claude-revert start --port 8080
```

### Permission Issues
If you encounter permission errors:
```bash
sudo npm install -g claude-revert
```

### Browser Doesn't Open
If the browser doesn't open automatically:
- Manually navigate to `http://localhost:3456`
- Use `--no-open` flag and open manually

## Development

```bash
# Clone and install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.