import { FileChange, ParsedChange } from './types.js';
export declare class ChangeTracker {
    private fileSnapshots;
    private originalChanges;
    private revertTracker;
    constructor();
    init(): Promise<void>;
    processChanges(changes: FileChange[]): Promise<ParsedChange[]>;
    private parseChange;
    private getFileContent;
    private updateSnapshot;
    private applyEdits;
    private findOriginalChange;
    revertChange(change: ParsedChange): Promise<void>;
}
//# sourceMappingURL=change-tracker.d.ts.map