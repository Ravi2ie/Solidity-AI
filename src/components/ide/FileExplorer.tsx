import React from 'react';
import {
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Copy,
  Download,
} from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { SOLIDITY_TEMPLATES, type TemplateKey } from '@/constants/solidityTemplates';
import { toast } from 'sonner';
import { FileNode } from '@/types/ide';

interface FileExplorerProps {
  className?: string;
}

interface ExpandedFolders {
  [key: string]: boolean;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ className }) => {
  const {
    fileTree,
    activeFileId,
    openFile,
    createFile,
    deleteFile,
    renameFile,
    deleteFolder,
    exportFolderAsZip,
    exportAllFilesAsZip,
  } = useIDEStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolderInPath, setCreatingFolderInPath] = useState<string>('');
  const [isCreatingFileInFolder, setIsCreatingFileInFolder] = useState<string | null>(null);
  const [newFileInFolderName, setNewFileInFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<ExpandedFolders>({});

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      createFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleCreateFileInFolder = (folderPath: string) => {
    if (newFileInFolderName.trim()) {
      createFile(newFileInFolderName.trim(), '', folderPath);
      setNewFileInFolderName('');
      setIsCreatingFileInFolder(null);
      toast.success(`File created in folder`);
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const folderPath = creatingFolderInPath 
        ? `${creatingFolderInPath}/${newFolderName.trim()}` 
        : newFolderName.trim();
      
      // Create a placeholder file to establish the folder in the tree
      // We'll store it with a .keep extension to mark it as folder marker
      createFile('.keep', '', folderPath);
      
      setNewFolderName('');
      setIsCreatingFolder(false);
      setCreatingFolderInPath('');
      toast.success(`Folder "${newFolderName}" created`);
      
      // Auto-expand the new folder
      setExpandedFolders(prev => ({
        ...prev,
        [`folder-${folderPath}`]: true
      }));
    }
  };

  const handleCreateFromTemplate = (templateKey: TemplateKey) => {
    const template = SOLIDITY_TEMPLATES[templateKey];
    const fileName = `${templateKey}Contract.sol`;
    createFile(fileName, template.code);
    setShowTemplates(false);
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) {
      renameFile(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const startRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName.replace('.sol', ''));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleExportFolder = async (folderId: string, folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await exportFolderAsZip(folderId);
      toast.success(`Exported "${folderName}" as ZIP`);
    } catch (error) {
      toast.error('Failed to export folder');
    }
  };

  const handleExportAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await exportAllFilesAsZip();
      toast.success('Exported all files as ZIP');
    } catch (error) {
      toast.error('No files to export');
    }
  };

  const filterNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.reduce((acc, node) => {
      // Skip .keep files (folder markers)
      if (node.type === 'file' && node.name === '.keep') {
        return acc;
      }

      const matches = searchQuery === '' || node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (node.type === 'folder' && node.children) {
        const filteredChildren = filterNodes(node.children);
        if (matches || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren,
          });
        }
      } else if (node.type === 'file' && matches) {
        acc.push(node);
      }
      return acc;
      return acc;
    }, [] as FileNode[]);
  };

  const renderFileNode = (node: FileNode, depth: number = 0): React.ReactNode => {
    if (node.type === 'file') {
      // Hide .keep files (folder markers)
      if (node.name === '.keep') {
        return null;
      }

      return (
        <div
          key={node.id}
          className={cn(
            'file-item flex items-center gap-2 group px-2 py-1 rounded cursor-pointer hover:bg-muted',
            activeFileId === node.fileId && 'bg-primary/20 text-primary'
          )}
          style={{ marginLeft: `${depth * 16}px` }}
          onClick={() => node.fileId && openFile(node.fileId)}
        >
          <File className="w-4 h-4 text-primary shrink-0" />

          {editingId === node.id ? (
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(node.fileId!);
                if (e.key === 'Escape') {
                  setEditingId(null);
                  setEditingName('');
                }
              }}
              onBlur={() => handleRename(node.fileId!)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="flex-1 bg-input text-sm px-1 rounded border border-primary focus:outline-none font-mono"
            />
          ) : (
            <span className="flex-1 truncate font-mono text-sm">{node.name}</span>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                startRename(node.id, node.name);
              }}
              className="p-1 rounded hover:bg-muted"
              title="Rename"
            >
              <Edit3 className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (node.fileId) deleteFile(node.fileId);
              }}
              className="p-1 rounded hover:bg-destructive/20"
              title="Delete"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
        </div>
      );
    }

    const isExpanded = expandedFolders[node.id];
    const folderPath = node.id.replace('folder-', '');

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-muted group"
          style={{ marginLeft: `${depth * 16}px` }}
        >
          <button
            onClick={() => toggleFolder(node.id)}
            className="p-0.5 rounded hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-500 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
          )}

          <span className="flex-1 truncate font-medium text-sm">{node.name}</span>

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingFileInFolder(folderPath);
              }}
              className="p-1 rounded hover:bg-primary/20"
              title="Create File in Folder"
            >
              <Plus className="w-3 h-3 text-primary" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingFolder(true);
                setCreatingFolderInPath(folderPath);
              }}
              className="p-1 rounded hover:bg-primary/20"
              title="Create Subfolder"
            >
              <Folder className="w-3 h-3 text-yellow-500" />
            </button>
            <button
              onClick={(e) => handleExportFolder(folderPath, node.name, e)}
              className="p-1 rounded hover:bg-primary/20"
              title="Export as ZIP"
            >
              <Download className="w-3 h-3 text-primary" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteFolder(folderPath);
                toast.success(`Deleted folder "${node.name}"`);
              }}
              className="p-1 rounded hover:bg-destructive/20"
              title="Delete Folder"
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </button>
          </div>
        </div>

        {isExpanded && node.children && node.children.length > 0 && (
          <div>
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTree = filterNodes(fileTree);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explorer
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExportAll}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Export All as ZIP"
            >
              <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Create from Template"
            >
              <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="New Folder"
            >
              <Folder className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
            <button
              onClick={() => setIsCreating(true)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="New File"
            >
              <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>

        {/* Template Selection */}
        {showTemplates && (
          <div className="border-t border-border bg-muted/30 p-2 space-y-1">
            {Object.entries(SOLIDITY_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => handleCreateFromTemplate(key as TemplateKey)}
                className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-primary/20 transition-colors"
              >
                <div className="font-semibold text-primary">{template.name}</div>
                <div className="text-muted-foreground text-xs">{template.description}</div>
              </button>
            ))}
          </div>
        )}

        {/* Search Box */}
        <div className="px-2 py-2 border-t border-border">
          <div className="relative flex items-center">
            <Search className="w-3 h-3 text-muted-foreground absolute left-2" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input text-xs px-2 pl-6 py-1.5 rounded border border-border focus:border-primary focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-0.5 rounded hover:bg-muted"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isCreatingFileInFolder && (
          <div className="flex items-center gap-1 mb-2 animate-fade-in" style={{ marginLeft: `${(isCreatingFileInFolder.split('/').length) * 16}px` }}>
            <File className="w-4 h-4 text-primary shrink-0" />
            <input
              type="text"
              value={newFileInFolderName}
              onChange={(e) => setNewFileInFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFileInFolder(isCreatingFileInFolder);
                if (e.key === 'Escape') {
                  setIsCreatingFileInFolder(null);
                  setNewFileInFolderName('');
                }
              }}
              onBlur={() => {
                if (newFileInFolderName.trim()) handleCreateFileInFolder(isCreatingFileInFolder);
                else {
                  setIsCreatingFileInFolder(null);
                  setNewFileInFolderName('');
                }
              }}
              autoFocus
              placeholder="filename.sol"
              className="flex-1 bg-input text-sm px-2 py-1 rounded border border-primary focus:outline-none font-mono"
            />
          </div>
        )}

        {isCreatingFolder && (
          <div className="flex items-center gap-1 mb-2 animate-fade-in" style={{ marginLeft: `${creatingFolderInPath ? (creatingFolderInPath.split('/').length + 1) * 16 : 0}px` }}>
            <Folder className="w-4 h-4 text-yellow-500 shrink-0" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              onBlur={() => {
                if (newFolderName.trim()) handleCreateFolder();
                else {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              autoFocus
              placeholder="foldername"
              className="flex-1 bg-input text-sm px-2 py-1 rounded border border-primary focus:outline-none font-mono"
            />
          </div>
        )}

        {isCreating && (
          <div className="flex items-center gap-1 mb-2 animate-fade-in">
            <File className="w-4 h-4 text-primary shrink-0" />
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              onBlur={() => {
                if (newFileName.trim()) handleCreateFile();
                else {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              autoFocus
              placeholder="filename.sol"
              className="flex-1 bg-input text-sm px-2 py-1 rounded border border-primary focus:outline-none font-mono"
            />
          </div>
        )}

        {filteredTree.length === 0 && searchQuery && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            No files matching "{searchQuery}"
          </div>
        )}

        {filteredTree.length === 0 && !searchQuery && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            No files. Create one or upload from your device.
          </div>
        )}

        {filteredTree.map((node) => renderFileNode(node))}
      </div>
    </div>
  );
};

export default FileExplorer;
