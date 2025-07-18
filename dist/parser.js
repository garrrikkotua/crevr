import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
export class ClaudeLogParser {
    constructor() {
        // Claude logs are stored in ~/.claude/projects/
        this.logDir = path.join(os.homedir(), '.claude', 'projects');
        this.currentProjectPath = this.getCurrentProjectPath();
    }
    getCurrentProjectPath() {
        // Get current working directory and convert to project dir format
        const cwd = process.cwd();
        // Claude stores project paths with hyphens instead of slashes
        return cwd.replace(/\//g, '-');
    }
    async getLatestLogFile() {
        try {
            const projectDirs = await fs.promises.readdir(this.logDir);
            let allFiles = [];
            // Filter to only the current project directory
            const matchingDirs = projectDirs.filter(dir => dir === this.currentProjectPath);
            if (matchingDirs.length === 0) {
                console.log(`No log directory found for current project path: ${this.currentProjectPath}`);
                return null;
            }
            // Search through matching project directories
            for (const projectDir of matchingDirs) {
                const projectPath = path.join(this.logDir, projectDir);
                try {
                    const stat = await fs.promises.stat(projectPath);
                    if (stat.isDirectory()) {
                        const files = await fs.promises.readdir(projectPath);
                        const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
                        for (const file of jsonlFiles) {
                            const filePath = path.join(projectPath, file);
                            const fileStat = await fs.promises.stat(filePath);
                            allFiles.push({
                                file: filePath,
                                mtime: fileStat.mtime
                            });
                        }
                    }
                }
                catch (error) {
                    // Skip directories we can't read
                    continue;
                }
            }
            if (allFiles.length === 0) {
                return null;
            }
            // Sort by modification time to get the latest
            allFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
            return allFiles[0].file;
        }
        catch (error) {
            console.error('Error reading log directory:', error);
            return null;
        }
    }
    async parseLogFile(filePath) {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const lines = content.trim().split('\n');
        const changes = [];
        for (const line of lines) {
            try {
                const entry = JSON.parse(line);
                // Check if this is an assistant message with tool_use content
                if (entry.type === 'assistant' && entry.message?.content) {
                    const change = this.extractFileChange(entry);
                    if (change) {
                        changes.push(change);
                    }
                }
            }
            catch (error) {
                // Skip malformed lines
            }
        }
        return changes;
    }
    extractFileChange(entry) {
        const { timestamp } = entry;
        // Look for tool_use in message content
        if (entry.message?.content) {
            for (const content of entry.message.content) {
                if (content.type === 'tool_use') {
                    const toolName = content.name;
                    const input = content.input;
                    switch (toolName) {
                        case 'Write':
                            return {
                                id: `${timestamp}-write`,
                                timestamp,
                                type: 'write',
                                filePath: input?.file_path,
                                newContent: input?.content
                            };
                        case 'Edit':
                            return {
                                id: `${timestamp}-edit`,
                                timestamp,
                                type: 'edit',
                                filePath: input?.file_path,
                                changes: [{
                                        oldString: input?.old_string,
                                        newString: input?.new_string,
                                        replaceAll: input?.replace_all
                                    }]
                            };
                        case 'MultiEdit':
                            return {
                                id: `${timestamp}-multiedit`,
                                timestamp,
                                type: 'edit',
                                filePath: input?.file_path,
                                changes: input?.edits
                            };
                        default:
                            continue;
                    }
                }
            }
        }
        return null;
    }
    async getFileChanges(logFile) {
        const file = logFile || await this.getLatestLogFile();
        if (!file) {
            throw new Error('No Claude log files found');
        }
        return this.parseLogFile(file);
    }
}
//# sourceMappingURL=parser.js.map