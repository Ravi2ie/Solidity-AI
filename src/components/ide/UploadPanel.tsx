import React, { useRef, useState } from 'react';
import { X, Upload, FileCode, AlertCircle, FolderOpen } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getFileSystemEntries, processFileSystemEntries } from '@/utils/zipUtils';

interface UploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { uploadFile, uploadFilesWithFolders } = useIDEStore();

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file extension
    if (!file.name.endsWith('.sol')) {
      toast.error('Invalid file type. Please upload a .sol file.');
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      if (content) {
        uploadFile(file.name, content);
        toast.success(`File "${file.name}" uploaded successfully!`);
        onClose();
      } else {
        toast.error('Failed to read file content.');
      }
    };

    reader.onerror = () => {
      toast.error('Error reading file.');
    };

    reader.readAsText(file);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    try {
      const filesToUpload: Array<{ name: string; content: string; folderPath?: string }> = [];
      let solFileCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Only process .sol files
        if (!file.name.endsWith('.sol')) {
          continue;
        }

        solFileCount++;

        // Get the full path if available (for folder uploads)
        const filePath = (file as File & { webkitRelativePath?: string; fullPath?: string }).webkitRelativePath || (file as File & { webkitRelativePath?: string; fullPath?: string }).fullPath || file.name;
        const pathParts = filePath.split('/');
        const fileName = pathParts[pathParts.length - 1];

        // Build folder path (everything except the filename)
        let folderPath = '';
        if (pathParts.length > 1) {
          folderPath = pathParts.slice(0, -1).join('/');
        }

        // Read file content
        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });

        filesToUpload.push({
          name: fileName,
          content,
          folderPath: folderPath || undefined,
        });
      }

      if (solFileCount === 0) {
        toast.error('No .sol files found in the selected folder.');
        setIsLoading(false);
        return;
      }

      uploadFilesWithFolders(filesToUpload);
      toast.success(`Uploaded ${solFileCount} Solidity file${solFileCount > 1 ? 's' : ''} with folder structure!`);
      onClose();
    } catch (error) {
      console.error('Error uploading folder:', error);
      toast.error('Error uploading folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    setIsLoading(true);
    try {
      const entries = getFileSystemEntries(e.dataTransfer);
      
      if (entries.length === 0) {
        // Fallback to file upload
        handleFileUpload(e.dataTransfer.files);
        setIsLoading(false);
        return;
      }

      const uploadedFiles = await processFileSystemEntries(entries);
      const solFiles = uploadedFiles.filter((f) => f.file.name.endsWith('.sol'));

      if (solFiles.length === 0) {
        toast.error('No .sol files found in the dropped items.');
        setIsLoading(false);
        return;
      }

      const filesToUpload: Array<{ name: string; content: string; folderPath?: string }> = [];

      for (const { path, file } of solFiles) {
        const pathParts = path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        let folderPath = '';
        if (pathParts.length > 1) {
          folderPath = pathParts.slice(0, -1).join('/');
        }

        const content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });

        filesToUpload.push({
          name: fileName,
          content,
          folderPath: folderPath || undefined,
        });
      }

      uploadFilesWithFolders(filesToUpload);
      toast.success(`Uploaded ${solFiles.length} file${solFiles.length > 1 ? 's' : ''} with folder structure!`);
      onClose();
    } catch (error) {
      console.error('Error processing drop:', error);
      toast.error('Error uploading files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFolderButtonClick = () => {
    folderInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Upload Solidity Files</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Close"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            onClick={isLoading ? undefined : handleFileButtonClick}
          >
            <FileCode className={cn(
              'w-16 h-16 mx-auto mb-4',
              isDragging ? 'text-primary' : 'text-muted-foreground'
            )} />
            
            <p className="text-lg font-medium mb-2">
              {isLoading ? 'Uploading...' : isDragging ? 'Drop files or folder here' : 'Drag & drop .sol files or folder'}
            </p>
            
            <p className="text-sm text-muted-foreground mb-4">
              Supports single files and folders with subfolders
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleFileButtonClick}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileCode className="w-4 h-4" />
              Select File
            </button>
            <button
              onClick={handleFolderButtonClick}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              Select Folder
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              Only Solidity (.sol) files are supported. Folders and subfolders are preserved. Files will be opened automatically after upload.
            </p>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".sol"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory="true"
            mozdirectory="true"
            nwdirectory="true"
            onChange={handleFolderUpload}
            className="hidden"
            suppressHydrationWarning
          />
        </div>
      </div>
    </div>
  );
};

export default UploadPanel;

