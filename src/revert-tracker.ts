import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class RevertTracker {
  private revertFile: string;

  constructor() {
    this.revertFile = path.join(os.homedir(), '.crevr', 'reverted-changes.json');
  }

  async init(): Promise<void> {
    await fs.promises.mkdir(path.dirname(this.revertFile), { recursive: true });
  }

  async getRevertedChanges(): Promise<Record<string, string[]>> {
    try {
      const data = await fs.promises.readFile(this.revertFile, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  async markAsReverted(changeId: string, sessionKey: string = 'default'): Promise<void> {
    const revertedChanges = await this.getRevertedChanges();
    
    if (!revertedChanges[sessionKey]) {
      revertedChanges[sessionKey] = [];
    }
    
    if (!revertedChanges[sessionKey].includes(changeId)) {
      revertedChanges[sessionKey].push(changeId);
      await fs.promises.writeFile(this.revertFile, JSON.stringify(revertedChanges, null, 2));
    }
  }

  async isReverted(changeId: string, sessionKey: string = 'default'): Promise<boolean> {
    const revertedChanges = await this.getRevertedChanges();
    return revertedChanges[sessionKey]?.includes(changeId) || false;
  }

  async filterRevertedChanges<T extends { id: string }>(changes: T[], sessionKey: string = 'default'): Promise<T[]> {
    const revertedChanges = await this.getRevertedChanges();
    const revertedIds = revertedChanges[sessionKey] || [];
    
    return changes.filter(change => !revertedIds.includes(change.id));
  }

  async unmarkAsReverted(changeId: string, sessionKey: string = 'default'): Promise<void> {
    const revertedChanges = await this.getRevertedChanges();
    
    if (revertedChanges[sessionKey]) {
      const index = revertedChanges[sessionKey].indexOf(changeId);
      if (index > -1) {
        revertedChanges[sessionKey].splice(index, 1);
        await fs.promises.writeFile(this.revertFile, JSON.stringify(revertedChanges, null, 2));
      }
    }
  }
}