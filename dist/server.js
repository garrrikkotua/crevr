import express from 'express';
import { WebSocketServer } from 'ws';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ClaudeLogParser } from './parser.js';
import { ChangeTracker } from './change-tracker.js';
export class RevertServer {
    constructor(port = 3456) {
        this.changes = [];
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        this.parser = new ClaudeLogParser();
        this.tracker = new ChangeTracker();
        this.setupRoutes();
        this.setupWebSocket();
    }
    setupRoutes() {
        // Serve static files from public directory
        this.app.use(express.static(path.join(__dirname, '..', 'public')));
        // Serve index.html for root route
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        });
        // API endpoint to get file content
        this.app.get('/api/file-content', async (req, res) => {
            try {
                const filePath = req.query.path;
                if (!filePath) {
                    return res.status(400).json({ error: 'File path is required' });
                }
                // Security check: ensure file is within current working directory
                const absolutePath = path.resolve(filePath);
                const cwd = process.cwd();
                if (!absolutePath.startsWith(cwd)) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                const fs = await import('fs');
                const content = await fs.promises.readFile(absolutePath, 'utf-8');
                res.send(content);
            }
            catch (error) {
                console.error('Error reading file:', error);
                res.status(404).json({ error: 'File not found' });
            }
        });
    }
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('Client connected');
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    switch (data.type) {
                        case 'getChanges':
                            await this.handleGetChanges(ws);
                            break;
                        case 'revert':
                            await this.handleRevert(ws, data.changeId);
                            break;
                    }
                }
                catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: 'Invalid message format'
                    }));
                }
            });
            ws.on('close', () => {
                console.log('Client disconnected');
            });
        });
    }
    async handleGetChanges(ws) {
        try {
            // Get and parse changes from Claude logs
            console.log('Getting file changes...');
            const fileChanges = await this.parser.getFileChanges();
            console.log(`Found ${fileChanges.length} file changes`);
            console.log('Processing changes...');
            this.changes = await this.tracker.processChanges(fileChanges);
            console.log(`Processed ${this.changes.length} changes`);
            // Sort changes by timestamp (newest first)
            this.changes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            console.log('Sending changes to client:', this.changes.length);
            ws.send(JSON.stringify({
                type: 'changes',
                changes: this.changes
            }));
        }
        catch (error) {
            console.error('Error getting changes:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message || 'Failed to load changes'
            }));
        }
    }
    async handleRevert(ws, changeId) {
        try {
            console.log('Handling revert for change:', changeId);
            const change = this.changes.find(c => c.id === changeId);
            if (!change) {
                console.error('Change not found:', changeId);
                throw new Error('Change not found');
            }
            console.log('Found change:', change);
            await this.tracker.revertChange(change);
            console.log('Revert successful');
            ws.send(JSON.stringify({
                type: 'revertSuccess',
                changeId
            }));
        }
        catch (error) {
            console.error('Error reverting change:', error);
            ws.send(JSON.stringify({
                type: 'revertError',
                error: error.message || 'Failed to revert change'
            }));
        }
    }
    async start() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`Claude Revert server running on http://localhost:${this.port}`);
                resolve(true);
            });
        });
    }
    stop() {
        this.server.close();
        this.wss.close();
    }
}
//# sourceMappingURL=server.js.map