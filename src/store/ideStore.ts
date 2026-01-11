import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SolidityFile, FileNode, EditorSettings, AICommentSettings, Tab } from '@/types/ide';
import { exportFilesAsZip, parseFolderPath, combineFolderPath, getParentFolderPath } from '@/utils/zipUtils';

const DEFAULT_SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedData;
    address public owner;
    
    event DataStored(uint256 indexed data, address indexed by);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    function set(uint256 x) public onlyOwner {
        storedData = x;
        emit DataStored(x, msg.sender);
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}`;

const ERC20_TEMPLATE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract MyToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 private _totalSupply;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        _mint(msg.sender, initialSupply * 10 ** decimals);
    }
    
    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }
    
    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        return _allowances[owner][spender];
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");
        _approve(from, msg.sender, currentAllowance - amount);
        _transfer(from, to, amount);
        return true;
    }
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(_balances[from] >= amount, "Insufficient balance");
        
        _balances[from] -= amount;
        _balances[to] += amount;
        emit Transfer(from, to, amount);
    }
    
    function _approve(address owner, address spender, uint256 amount) internal {
        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }
    
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "Mint to zero address");
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
    }
}`;

interface IDEState {
  files: SolidityFile[];
  fileTree: FileNode[];
  openTabs: Tab[];
  activeTabId: string | null;
  activeFileId: string | null;
  editorSettings: EditorSettings;
  aiSettings: AICommentSettings;
  isSidebarOpen: boolean;
  isAIPanelOpen: boolean;
  isSettingsOpen: boolean;
  isGenerating: boolean;

  // Actions
  createFile: (name: string, content?: string, folderPath?: string) => void;
  uploadFile: (name: string, content: string, folderPath?: string) => void;
  uploadFilesWithFolders: (files: Array<{ name: string; content: string; folderPath?: string }>) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, newName: string) => void;
  updateFileContent: (id: string, content: string) => void;
  openFile: (id: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabProperty: (tabId: string, property: keyof Tab, value: any) => void;
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  toggleSettings: () => void;
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  updateAISettings: (settings: Partial<AICommentSettings>) => void;
  setIsGenerating: (value: boolean) => void;
  saveFile: (id: string) => void;
  getActiveFile: () => SolidityFile | null;
  createFolder: (name: string, parentPath?: string) => void;
  deleteFolder: (folderPath: string) => void;
  renameFolder: (oldPath: string, newName: string) => void;
  exportFolderAsZip: (folderPath: string) => Promise<void>;
  exportAllFilesAsZip: () => Promise<void>;
  getFolderContents: (folderPath: string) => SolidityFile[];
  getFilesByFolder: () => { [key: string]: SolidityFile[] };
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useIDEStore = create<IDEState>()(
  persist(
    (set, get) => ({
      files: [
        {
          id: 'file-1',
          name: 'SimpleStorage.sol',
          content: DEFAULT_SOLIDITY_CODE,
          isModified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'file-2',
          name: 'MyToken.sol',
          content: ERC20_TEMPLATE,
          isModified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      fileTree: [
        { id: 'file-1', name: 'SimpleStorage.sol', type: 'file', fileId: 'file-1' },
        { id: 'file-2', name: 'MyToken.sol', type: 'file', fileId: 'file-2' },
      ],
      openTabs: [
        { id: 'tab-1', fileId: 'file-1', fileName: 'SimpleStorage.sol' },
      ],
      activeTabId: 'tab-1',
      activeFileId: 'file-1',
      editorSettings: {
        theme: 'dark',
        fontSize: 14,
        tabSize: 4,
        wordWrap: false,
        lineNumbers: true,
        autoSave: true,
      },
      aiSettings: {
        outputMode: 'same-file',
        commentStyle: 'natspec',
        includeParamDocs: true,
        includeReturnDocs: true,
        includeDevNotes: true,
        scanVulnerabilities: false,
        language: 'english',
      },
      isSidebarOpen: true,
      isAIPanelOpen: false,
      isSettingsOpen: false,
      isGenerating: false,

      createFile: (name, content = '', folderPath = '') => {
        const id = generateId();
        // Don't append .sol to .keep files (folder markers)
        const fileName = name.includes('.keep') || name.endsWith('.sol') ? name : `${name}.sol`;
        
        set((state) => {
          const newFile: SolidityFile = {
            id,
            name: fileName,
            content: content || `// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\n\ncontract ${name.replace('.sol', '').split('/').pop()} {\n    \n}`,
            isModified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            folderPath: folderPath || undefined,
          };

          const buildFileTree = (files: SolidityFile[]): FileNode[] => {
            const folderMap = new Map<string, FileNode>();
            const rootNodes: FileNode[] = [];

            files.forEach((file) => {
              const path = file.folderPath || '';
              const pathParts = path ? path.split('/').filter(p => p) : [];

              // Create folder nodes from all files (including .keep)
              let currentPath = '';
              pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!folderMap.has(currentPath)) {
                  const folderNode: FileNode = {
                    id: `folder-${currentPath}`,
                    name: part,
                    type: 'folder',
                    children: [],
                  };
                  folderMap.set(currentPath, folderNode);

                  if (index === 0) {
                    rootNodes.push(folderNode);
                  } else {
                    const parentPath = pathParts.slice(0, index).join('/');
                    const parentNode = folderMap.get(parentPath);
                    if (parentNode && parentNode.children) {
                      parentNode.children.push(folderNode);
                    }
                  }
                }
              });

              // Skip .keep files from being added as file nodes (they're just markers)
              if (file.name.includes('.keep')) {
                return;
              }

              // Add file to appropriate folder
              const fileNode: FileNode = {
                id: file.id,
                name: file.name,
                type: 'file',
                fileId: file.id,
              };

              if (pathParts.length > 0) {
                const folderPath = pathParts.join('/');
                const folderNode = folderMap.get(folderPath);
                if (folderNode && folderNode.children) {
                  folderNode.children.push(fileNode);
                }
              } else {
                rootNodes.push(fileNode);
              }
            });

            return rootNodes;
          };

          return {
            files: [...state.files, newFile],
            fileTree: buildFileTree([...state.files, newFile]),
          };
        });
      },

      uploadFile: (name, content, folderPath = '') => {
        const id = generateId();
        const fileName = name.endsWith('.sol') ? name : `${name}.sol`;
        const tabId = generateId();
        
        set((state) => {
          const newFile: SolidityFile = {
            id,
            name: fileName,
            content,
            isModified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            folderPath: folderPath || undefined,
          };

          const buildFileTree = (files: SolidityFile[]): FileNode[] => {
            const folderMap = new Map<string, FileNode>();
            const rootNodes: FileNode[] = [];

            files.forEach((file) => {
              const path = file.folderPath || '';
              const pathParts = path ? path.split('/').filter(p => p) : [];

              // Create folder nodes from all files (including .keep)
              let currentPath = '';
              pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!folderMap.has(currentPath)) {
                  const folderNode: FileNode = {
                    id: `folder-${currentPath}`,
                    name: part,
                    type: 'folder',
                    children: [],
                  };
                  folderMap.set(currentPath, folderNode);

                  if (index === 0) {
                    rootNodes.push(folderNode);
                  } else {
                    const parentPath = pathParts.slice(0, index).join('/');
                    const parentNode = folderMap.get(parentPath);
                    if (parentNode && parentNode.children) {
                      parentNode.children.push(folderNode);
                    }
                  }
                }
              });

              // Skip .keep files from being added as file nodes (they're just markers)
              if (file.name.includes('.keep')) {
                return;
              }

              // Add file to appropriate folder
              const fileNode: FileNode = {
                id: file.id,
                name: file.name,
                type: 'file',
                fileId: file.id,
              };

              if (pathParts.length > 0) {
                const folderPath = pathParts.join('/');
                const folderNode = folderMap.get(folderPath);
                if (folderNode && folderNode.children) {
                  folderNode.children.push(fileNode);
                }
              } else {
                rootNodes.push(fileNode);
              }
            });

            return rootNodes;
          };

          const newFiles = [...state.files, newFile];
          const newFileTree = buildFileTree(newFiles);
          const newTabs = [
            ...state.openTabs,
            { id: tabId, fileId: id, fileName },
          ];

          return {
            files: newFiles,
            fileTree: newFileTree,
            openTabs: newTabs,
            activeTabId: tabId,
            activeFileId: id,
          };
        });
      },

      uploadFilesWithFolders: (filesToUpload) => {
        const newFileRecords: SolidityFile[] = [];
        const newTabRecords: Tab[] = [];

        filesToUpload.forEach((fileData) => {
          const id = generateId();
          const fileName = fileData.name.endsWith('.sol') ? fileData.name : `${fileData.name}.sol`;
          const tabId = generateId();

          newFileRecords.push({
            id,
            name: fileName,
            content: fileData.content,
            isModified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            folderPath: fileData.folderPath || undefined,
          });

          newTabRecords.push({
            id: tabId,
            fileId: id,
            fileName,
          });
        });

        set((state) => {
          const buildFileTree = (files: SolidityFile[]): FileNode[] => {
            const folderMap = new Map<string, FileNode>();
            const rootNodes: FileNode[] = [];

            files.forEach((file) => {
              const path = file.folderPath || '';
              const pathParts = path ? path.split('/').filter(p => p) : [];

              // Create folder nodes from all files (including .keep)
              let currentPath = '';
              pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!folderMap.has(currentPath)) {
                  const folderNode: FileNode = {
                    id: `folder-${currentPath}`,
                    name: part,
                    type: 'folder',
                    children: [],
                  };
                  folderMap.set(currentPath, folderNode);

                  if (index === 0) {
                    rootNodes.push(folderNode);
                  } else {
                    const parentPath = pathParts.slice(0, index).join('/');
                    const parentNode = folderMap.get(parentPath);
                    if (parentNode && parentNode.children) {
                      parentNode.children.push(folderNode);
                    }
                  }
                }
              });

              // Skip .keep files from being added as file nodes (they're just markers)
              if (file.name.includes('.keep')) {
                return;
              }

              // Add file to appropriate folder
              const fileNode: FileNode = {
                id: file.id,
                name: file.name,
                type: 'file',
                fileId: file.id,
              };

              if (pathParts.length > 0) {
                const folderPath = pathParts.join('/');
                const folderNode = folderMap.get(folderPath);
                if (folderNode && folderNode.children) {
                  folderNode.children.push(fileNode);
                }
              } else {
                rootNodes.push(fileNode);
              }
            });

            return rootNodes;
          };

          const allFiles = [...state.files, ...newFileRecords];
          return {
            files: allFiles,
            fileTree: buildFileTree(allFiles),
            openTabs: state.openTabs.length === 0 ? newTabRecords : [...state.openTabs, ...newTabRecords],
            activeTabId: newTabRecords[0]?.id || state.activeTabId,
            activeFileId: newFileRecords[0]?.id || state.activeFileId,
          };
        });
      },

      deleteFile: (id) => {
        set((state) => {
          const newTabs = state.openTabs.filter((tab) => tab.fileId !== id);
          const newActiveTabId = state.activeTabId && state.openTabs.find(t => t.id === state.activeTabId)?.fileId === id
            ? newTabs[0]?.id || null
            : state.activeTabId;
          
          return {
            files: state.files.filter((f) => f.id !== id),
            fileTree: state.fileTree.filter((f) => f.fileId !== id),
            openTabs: newTabs,
            activeTabId: newActiveTabId,
            activeFileId: newActiveTabId ? newTabs.find(t => t.id === newActiveTabId)?.fileId || null : null,
          };
        });
      },

      renameFile: (id, newName) => {
        const fileName = newName.endsWith('.sol') ? newName : `${newName}.sol`;
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, name: fileName, updatedAt: new Date() } : f
          ),
          fileTree: state.fileTree.map((f) =>
            f.fileId === id ? { ...f, name: fileName } : f
          ),
          openTabs: state.openTabs.map((t) =>
            t.fileId === id ? { ...t, fileName } : t
          ),
        }));
      },

      updateFileContent: (id, content) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, content, isModified: true, updatedAt: new Date() } : f
          ),
        }));
      },

      openFile: (id) => {
        const state = get();
        const file = state.files.find((f) => f.id === id);
        if (!file) return;

        const existingTab = state.openTabs.find((t) => t.fileId === id);
        if (existingTab) {
          set({ activeTabId: existingTab.id, activeFileId: id });
        } else {
          const tabId = generateId();
          set((state) => ({
            openTabs: [...state.openTabs, { id: tabId, fileId: id, fileName: file.name }],
            activeTabId: tabId,
            activeFileId: id,
          }));
        }
      },

      closeTab: (tabId) => {
        set((state) => {
          const tabIndex = state.openTabs.findIndex((t) => t.id === tabId);
          const newTabs = state.openTabs.filter((t) => t.id !== tabId);
          
          let newActiveTabId = state.activeTabId;
          if (state.activeTabId === tabId) {
            newActiveTabId = newTabs[Math.max(0, tabIndex - 1)]?.id || null;
          }
          
          return {
            openTabs: newTabs,
            activeTabId: newActiveTabId,
            activeFileId: newActiveTabId ? newTabs.find(t => t.id === newActiveTabId)?.fileId || null : null,
          };
        });
      },

      setActiveTab: (tabId) => {
        const state = get();
        const tab = state.openTabs.find((t) => t.id === tabId);
        if (tab) {
          set({ activeTabId: tabId, activeFileId: tab.fileId });
        }
      },

      updateTabProperty: (tabId, property, value) => {
        set((state) => ({
          openTabs: state.openTabs.map((tab) =>
            tab.id === tabId ? { ...tab, [property]: value } : tab
          ),
        }));
      },

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),
      toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),

      updateEditorSettings: (settings) =>
        set((state) => ({ editorSettings: { ...state.editorSettings, ...settings } })),

      updateAISettings: (settings) =>
        set((state) => ({ aiSettings: { ...state.aiSettings, ...settings } })),

      setIsGenerating: (value) => set({ isGenerating: value }),

      saveFile: (id) => {
        set((state) => ({
          files: state.files.map((f) =>
            f.id === id ? { ...f, isModified: false } : f
          ),
        }));
      },

      getActiveFile: () => {
        const state = get();
        return state.files.find((f) => f.id === state.activeFileId) || null;
      },

      createFolder: (name, parentPath = '') => {
        // Note: Folders are created implicitly when files are created in them
        // This is a placeholder for future explicit folder creation
        console.log(`Folder '${name}' created at path: ${parentPath || '/'}`);
      },

      deleteFolder: (folderPath) => {
        set((state) => {
          const filesToDelete = state.files.filter((f) => {
            const fPath = f.folderPath || '';
            return fPath === folderPath || fPath.startsWith(`${folderPath}/`);
          });

          const fileIdsToDelete = new Set(filesToDelete.map((f) => f.id));
          const newTabs = state.openTabs.filter((tab) => !fileIdsToDelete.has(tab.fileId));
          const newFiles = state.files.filter((f) => !fileIdsToDelete.has(f.id));

          const newActiveFileId = state.activeFileId && fileIdsToDelete.has(state.activeFileId)
            ? newFiles[0]?.id || null
            : state.activeFileId;

          const buildFileTree = (files: SolidityFile[]): FileNode[] => {
            const folderMap = new Map<string, FileNode>();
            const rootNodes: FileNode[] = [];

            files.forEach((file) => {
              const path = file.folderPath || '';
              const pathParts = path ? path.split('/').filter(p => p) : [];

              let currentPath = '';
              pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!folderMap.has(currentPath)) {
                  const folderNode: FileNode = {
                    id: `folder-${currentPath}`,
                    name: part,
                    type: 'folder',
                    children: [],
                  };
                  folderMap.set(currentPath, folderNode);

                  if (index === 0) {
                    rootNodes.push(folderNode);
                  } else {
                    const parentPath = pathParts.slice(0, index).join('/');
                    const parentNode = folderMap.get(parentPath);
                    if (parentNode && parentNode.children) {
                      parentNode.children.push(folderNode);
                    }
                  }
                }
              });

              const fileNode: FileNode = {
                id: file.id,
                name: file.name,
                type: 'file',
                fileId: file.id,
              };

              if (pathParts.length > 0) {
                const folderPath = pathParts.join('/');
                const folderNode = folderMap.get(folderPath);
                if (folderNode && folderNode.children) {
                  folderNode.children.push(fileNode);
                }
              } else {
                rootNodes.push(fileNode);
              }
            });

            return rootNodes;
          };

          return {
            files: newFiles,
            fileTree: buildFileTree(newFiles),
            openTabs: newTabs,
            activeFileId: newActiveFileId,
            activeTabId: newTabs.find((t) => t.fileId === newActiveFileId)?.id || null,
          };
        });
      },

      renameFolder: (oldPath, newName) => {
        set((state) => {
          const parentPath = getParentFolderPath(oldPath);
          const newPath = parentPath ? `${parentPath}/${newName}` : newName;

          const newFiles = state.files.map((f) => {
            const fPath = f.folderPath || '';
            if (fPath === oldPath) {
              return { ...f, folderPath: newPath };
            } else if (fPath.startsWith(`${oldPath}/`)) {
              const relativePath = fPath.substring(oldPath.length + 1);
              return { ...f, folderPath: `${newPath}/${relativePath}` };
            }
            return f;
          });

          const buildFileTree = (files: SolidityFile[]): FileNode[] => {
            const folderMap = new Map<string, FileNode>();
            const rootNodes: FileNode[] = [];

            files.forEach((file) => {
              const path = file.folderPath || '';
              const pathParts = path ? path.split('/').filter(p => p) : [];

              let currentPath = '';
              pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!folderMap.has(currentPath)) {
                  const folderNode: FileNode = {
                    id: `folder-${currentPath}`,
                    name: part,
                    type: 'folder',
                    children: [],
                  };
                  folderMap.set(currentPath, folderNode);

                  if (index === 0) {
                    rootNodes.push(folderNode);
                  } else {
                    const parentPath = pathParts.slice(0, index).join('/');
                    const parentNode = folderMap.get(parentPath);
                    if (parentNode && parentNode.children) {
                      parentNode.children.push(folderNode);
                    }
                  }
                }
              });

              const fileNode: FileNode = {
                id: file.id,
                name: file.name,
                type: 'file',
                fileId: file.id,
              };

              if (pathParts.length > 0) {
                const folderPath = pathParts.join('/');
                const folderNode = folderMap.get(folderPath);
                if (folderNode && folderNode.children) {
                  folderNode.children.push(fileNode);
                }
              } else {
                rootNodes.push(fileNode);
              }
            });

            return rootNodes;
          };

          return {
            files: newFiles,
            fileTree: buildFileTree(newFiles),
          };
        });
      },

      exportFolderAsZip: async (folderPath) => {
        const state = get();
        const folderFiles = state.files.filter((f) => {
          const fPath = f.folderPath || '';
          return fPath === folderPath || fPath.startsWith(`${folderPath}/`);
        });

        if (folderFiles.length === 0) {
          throw new Error('Folder is empty');
        }

        const folderName = folderPath.split('/').pop() || 'contracts';
        await exportFilesAsZip(folderFiles, `${folderName}.zip`, folderPath);
      },

      exportAllFilesAsZip: async () => {
        const state = get();
        if (state.files.length === 0) {
          throw new Error('No files to export');
        }
        await exportFilesAsZip(state.files, 'solidity-contracts.zip');
      },

      getFolderContents: (folderPath) => {
        const state = get();
        return state.files.filter((f) => f.folderPath === folderPath);
      },

      getFilesByFolder: () => {
        const state = get();
        const grouped: { [key: string]: SolidityFile[] } = {};

        state.files.forEach((file) => {
          const folder = file.folderPath || 'root';
          grouped[folder] = grouped[folder] || [];
          grouped[folder].push(file);
        });

        return grouped;
      },
    }),
    {
      name: 'solidity-ide-storage',
      partialize: (state) => ({
        files: state.files,
        fileTree: state.fileTree,
        editorSettings: state.editorSettings,
        aiSettings: state.aiSettings,
      }),
    }
  )
);
