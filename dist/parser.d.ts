import { FileChange } from './types.js';
export declare class ClaudeLogParser {
    private logDir;
    private currentProjectPath;
    constructor();
    private getCurrentProjectPath;
    getLatestLogFile(): Promise<string | null>;
    parseLogFile(filePath: string): Promise<FileChange[]>;
    private extractFileChange;
    getFileChanges(logFile?: string): Promise<FileChange[]>;
}
//# sourceMappingURL=parser.d.ts.map