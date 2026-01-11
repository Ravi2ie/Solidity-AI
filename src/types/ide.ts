export interface SolidityFile {
  id: string;
  name: string;
  content: string;
  isModified: boolean;
  createdAt: Date;
  updatedAt: Date;
  folderPath?: string; // e.g., "contracts/tokens" for nested folders
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  fileId?: string;
}

export interface EditorSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
}

export interface AICommentSettings {
  outputMode: 'same-file' | 'separate-file';
  commentStyle: 'natspec' | 'inline' | 'both';
  includeParamDocs: boolean;
  includeReturnDocs: boolean;
  includeDevNotes: boolean;
  scanVulnerabilities: boolean;
  language: string;
}

export interface AIGenerationResult {
  success: boolean;
  comments: string;
  error?: string;
}

export interface Tab {
  id: string;
  fileId: string;
  fileName: string;
  isPinned?: boolean;
  group?: string;
}
