import * as fs from 'fs';
import * as diff from 'diff';
import { RevertTracker } from './revert-tracker.js';
export class ChangeTracker {
    constructor() {
        this.fileSnapshots = new Map();
        this.originalChanges = new Map();
        this.revertTracker = new RevertTracker();
    }
    async init() {
        await this.revertTracker.init();
    }
    async processChanges(changes) {
        const parsedChanges = [];
        console.log(`Processing ${changes.length} changes`);
        for (const change of changes) {
            console.log(`Processing change: ${change.type} ${change.filePath}`);
            // Store original change for revert purposes
            this.originalChanges.set(change.id, change);
            const parsed = await this.parseChange(change);
            if (parsed) {
                console.log(`Successfully parsed change: ${parsed.id}`);
                parsedChanges.push(parsed);
            }
            else {
                console.log(`Failed to parse change: ${change.id}`);
            }
        }
        console.log(`Final parsed changes: ${parsedChanges.length}`);
        // Filter out reverted changes
        const activeChanges = await this.revertTracker.filterRevertedChanges(parsedChanges);
        console.log(`Active changes after filtering: ${activeChanges.length}`);
        return activeChanges;
    }
    async parseChange(change) {
        const { filePath, type } = change;
        try {
            let oldContent = '';
            let newContent = '';
            let canRevert = false;
            // Get current file content if it exists
            const currentContent = await this.getFileContent(filePath);
            switch (type) {
                case 'write':
                    if (this.fileSnapshots.has(filePath)) {
                        const snapshots = this.fileSnapshots.get(filePath);
                        oldContent = snapshots[snapshots.length - 1];
                    }
                    else {
                        oldContent = '';
                    }
                    newContent = change.newContent || '';
                    canRevert = true;
                    // Update snapshot
                    this.updateSnapshot(filePath, newContent);
                    break;
                case 'edit':
                    if (!change.changes || change.changes.length === 0) {
                        return null;
                    }
                    // For edits, we'll create a simplified diff from the old/new strings
                    // Since we're parsing historical logs, we can't reconstruct the full context
                    const edit = change.changes[0]; // Take the first edit for simplicity
                    oldContent = edit.oldString || '';
                    newContent = edit.newString || '';
                    canRevert = true;
                    break;
                case 'create':
                    oldContent = '';
                    newContent = change.newContent || '';
                    canRevert = true;
                    // Update snapshot
                    this.updateSnapshot(filePath, newContent);
                    break;
                case 'delete':
                    if (this.fileSnapshots.has(filePath)) {
                        const snapshots = this.fileSnapshots.get(filePath);
                        oldContent = snapshots[snapshots.length - 1];
                    }
                    newContent = '';
                    canRevert = true;
                    break;
            }
            // Generate diff
            const diffResult = diff.createPatch(filePath, oldContent, newContent, 'Previous', 'Current');
            const result = {
                id: change.id,
                timestamp: change.timestamp,
                type: change.type,
                filePath: change.filePath,
                diff: diffResult,
                oldContent,
                newContent,
                canRevert
            };
            // Add oldString/newString for edit changes
            if (type === 'edit' && change.changes && change.changes.length > 0) {
                result.oldString = change.changes[0].oldString;
                result.newString = change.changes[0].newString;
            }
            return result;
        }
        catch (error) {
            console.error(`Error processing change for ${filePath}:`, error);
            return null;
        }
    }
    async getFileContent(filePath) {
        try {
            return await fs.promises.readFile(filePath, 'utf-8');
        }
        catch (error) {
            return null;
        }
    }
    updateSnapshot(filePath, content) {
        if (!this.fileSnapshots.has(filePath)) {
            this.fileSnapshots.set(filePath, []);
        }
        this.fileSnapshots.get(filePath).push(content);
    }
    applyEdits(content, edits) {
        let result = content;
        for (const edit of edits) {
            if (edit.replaceAll) {
                result = result.split(edit.oldString).join(edit.newString);
            }
            else {
                result = result.replace(edit.oldString, edit.newString);
            }
        }
        return result;
    }
    findOriginalChange(id) {
        return this.originalChanges.get(id) || null;
    }
    async revertChange(change) {
        if (!change.canRevert) {
            throw new Error('This change cannot be reverted');
        }
        const { filePath, oldContent, type } = change;
        switch (type) {
            case 'create':
                // Delete the created file
                await fs.promises.unlink(filePath);
                break;
            case 'delete':
                // Recreate the deleted file
                await fs.promises.writeFile(filePath, oldContent || '');
                break;
            case 'edit':
                // For edit changes, we need to apply the reverse operation
                // Replace the new string with the old string in the current file
                const currentContent = await this.getFileContent(filePath);
                if (currentContent === null) {
                    throw new Error(`File not found: ${filePath}`);
                }
                // Get the original change details to reverse the edit
                const originalChange = this.findOriginalChange(change.id);
                if (!originalChange || !originalChange.changes || originalChange.changes.length === 0) {
                    throw new Error('Cannot find original change details for reverting');
                }
                let reversedContent = currentContent;
                console.log('Reverting edit change:', {
                    filePath,
                    changeId: change.id,
                    originalChangeCount: originalChange.changes.length,
                    currentContentLength: currentContent.length
                });
                // Apply changes in reverse order
                for (const edit of originalChange.changes.reverse()) {
                    console.log('Applying reverse edit:', {
                        oldString: edit.oldString.substring(0, 50) + (edit.oldString.length > 50 ? '...' : ''),
                        newString: edit.newString.substring(0, 50) + (edit.newString.length > 50 ? '...' : ''),
                        replaceAll: edit.replaceAll,
                        contentContainsNewString: reversedContent.includes(edit.newString)
                    });
                    if (edit.replaceAll) {
                        const beforeLength = reversedContent.length;
                        reversedContent = reversedContent.split(edit.newString).join(edit.oldString);
                        console.log('Replace all result:', { beforeLength, afterLength: reversedContent.length });
                    }
                    else {
                        const beforeLength = reversedContent.length;
                        const newContent = reversedContent.replace(edit.newString, edit.oldString);
                        if (newContent === reversedContent) {
                            console.warn('String replacement failed - newString not found in content');
                            console.warn('Looking for:', JSON.stringify(edit.newString));
                            console.warn('In content:', JSON.stringify(reversedContent.substring(0, 200)));
                        }
                        reversedContent = newContent;
                        console.log('Replace result:', { beforeLength, afterLength: reversedContent.length });
                    }
                }
                console.log('Reversed content length:', reversedContent.length);
                await fs.promises.writeFile(filePath, reversedContent);
                break;
            case 'write':
                // Restore the old content
                await fs.promises.writeFile(filePath, oldContent || '');
                break;
        }
        // Mark the change as reverted
        await this.revertTracker.markAsReverted(change.id);
        console.log(`Change ${change.id} marked as reverted`);
    }
}
//# sourceMappingURL=change-tracker.js.map