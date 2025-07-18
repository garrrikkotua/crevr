import { FileChange, ParsedChange } from './types.js';
export declare class ChangeTracker {
    private fileSnapshots;
    private originalChanges;
    processChanges(changes: FileChange[]): Promise<ParsedChange[]>;
    private parseChange;
    private getFileContent;
    private applyEdits;
    private updateSnapshot;
    private findOriginalChange;
    revertChange(change: ParsedChange): Promise<void>;
}
//# sourceMappingURL=change-tracker.d.ts.map