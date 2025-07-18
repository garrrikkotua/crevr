import * as fs from 'fs';
import * as path from 'path';
import * as diff from 'diff';
import { FileChange, ParsedChange } from './types.js';

export class ChangeTracker {
  private fileSnapshots: Map<string, string[]> = new Map();
  private originalChanges: Map<string, FileChange> = new Map();

  async processChanges(changes: FileChange[]): Promise<ParsedChange[]> {
    const parsedChanges: ParsedChange[] = [];

    console.log(`Processing ${changes.length} changes`);
    for (const change of changes) {
      console.log(`Processing change: ${change.type} ${change.filePath}`);
      // Store original change for revert purposes
      this.originalChanges.set(change.id, change);
      
      const parsed = await this.parseChange(change);
      if (parsed) {
        console.log(`Successfully parsed change: ${parsed.id}`);
        parsedChanges.push(parsed);
      } else {
        console.log(`Failed to parse change: ${change.id}`);
      }
    }

    console.log(`Final parsed changes: ${parsedChanges.length}`);
    return parsedChanges;
  }

  private async parseChange(change: FileChange): Promise<ParsedChange | null> {
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
            const snapshots = this.fileSnapshots.get(filePath)!;
            oldContent = snapshots[snapshots.length - 1];
          } else {
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
            const snapshots = this.fileSnapshots.get(filePath)!;
            oldContent = snapshots[snapshots.length - 1];
          }
          newContent = '';
          canRevert = true;
          break;
      }

      // Generate diff
      const diffResult = diff.createPatch(
        filePath,
        oldContent,
        newContent,
        'Previous',
        'Current'
      );

      return {
        id: change.id,
        timestamp: change.timestamp,
        type: change.type,
        filePath: change.filePath,
        diff: diffResult,
        oldContent,
        newContent,
        canRevert
      };
    } catch (error) {
      console.error(`Error processing change for ${filePath}:`, error);
      return null;
    }
  }

  private async getFileContent(filePath: string): Promise<string | null> {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  private applyEdits(content: string, edits: Array<{ oldString: string; newString: string; replaceAll?: boolean }>): string {
    let result = content;

    for (const edit of edits) {
      if (edit.replaceAll) {
        result = result.split(edit.oldString).join(edit.newString);
      } else {
        result = result.replace(edit.oldString, edit.newString);
      }
    }

    return result;
  }

  private updateSnapshot(filePath: string, content: string): void {
    if (!this.fileSnapshots.has(filePath)) {
      this.fileSnapshots.set(filePath, []);
    }
    this.fileSnapshots.get(filePath)!.push(content);
  }

  private findOriginalChange(id: string): FileChange | null {
    return this.originalChanges.get(id) || null;
  }

  async revertChange(change: ParsedChange): Promise<void> {
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
        // Apply changes in reverse order
        for (const edit of originalChange.changes.reverse()) {
          if (edit.replaceAll) {
            reversedContent = reversedContent.split(edit.newString).join(edit.oldString);
          } else {
            reversedContent = reversedContent.replace(edit.newString, edit.oldString);
          }
        }
        
        await fs.promises.writeFile(filePath, reversedContent);
        break;
        
      case 'write':
        // Restore the old content
        await fs.promises.writeFile(filePath, oldContent || '');
        break;
    }
  }
}