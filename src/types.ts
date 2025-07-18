export interface ClaudeLogEntry {
  type: string;
  timestamp: string;
  message?: {
    content: Array<{
      type: string;
      name?: string;
      input?: any;
      text?: string;
    }>;
  };
  tool?: string;
  parameters?: any;
  result?: any;
  error?: any;
}

export interface FileChange {
  id: string;
  timestamp: string;
  type: 'create' | 'edit' | 'delete' | 'write';
  filePath: string;
  oldContent?: string;
  newContent?: string;
  changes?: Array<{
    oldString: string;
    newString: string;
    replaceAll?: boolean;
  }>;
}

export interface ParsedChange {
  id: string;
  timestamp: string;
  type: 'create' | 'edit' | 'delete' | 'write';
  filePath: string;
  diff?: string;
  oldContent?: string;
  newContent?: string;
  canRevert: boolean;
}