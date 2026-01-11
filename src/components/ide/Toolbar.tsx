import React, { useState } from 'react';
import {
  Menu,
  Sparkles,
  Settings,
  Save,
  FolderOpen,
  PanelLeftClose,
  PanelLeft,
  Keyboard,
  Code2,
  AlertCircle,
  Zap,
  Upload,
} from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ThemeToggle from './ThemeToggle';
import LinterPanel from './LinterPanel';
import GasEstimationPanel from './GasEstimationPanel';
import FormatterPanel from './FormatterPanel';
import UploadPanel from './UploadPanel';

interface ToolbarProps {
  className?: string;
}

const Toolbar: React.FC<ToolbarProps> = ({ className }) => {
  const [isLinterOpen, setIsLinterOpen] = useState(false);
  const [isGasOpen, setIsGasOpen] = useState(false);
  const [isFormatterOpen, setIsFormatterOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const {
    isSidebarOpen,
    isAIPanelOpen,
    toggleSidebar,
    toggleAIPanel,
    toggleSettings,
    activeFileId,
    saveFile,
    files,
  } = useIDEStore();

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleSave = () => {
    if (activeFileId) {
      saveFile(activeFileId);
      toast.success('File saved');
    }
  };

  return (
    <div className={cn('flex items-center justify-between px-3 py-2 bg-card border-b border-border', className)}>
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-muted transition-colors"
          title={isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-5 h-5 text-muted-foreground" />
          ) : (
            <PanelLeft className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-primary">Sol</span>
          <span className="text-lg font-bold text-foreground">IDE</span>
          <Sparkles className="w-4 h-4 text-ai ml-1" />
        </div>
      </div>

      {/* Center - File Name */}
      <div className="flex items-center gap-2">
        {activeFile && (
          <span className="text-sm text-muted-foreground font-mono">
            {activeFile.name}
            {activeFile.isModified && <span className="text-warning ml-1">●</span>}
          </span>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleSave}
          disabled={!activeFile?.isModified}
          className={cn(
            'p-2 rounded transition-colors',
            activeFile?.isModified ? 'hover:bg-muted text-foreground' : 'text-muted-foreground opacity-50'
          )}
          title="Save (Ctrl+S)"
        >
          <Save className="w-5 h-5" />
        </button>

        <div className="h-5 w-px bg-border mx-1" />

        <button
          onClick={toggleAIPanel}
          className={cn(
            'p-2 rounded transition-colors flex items-center gap-1.5',
            isAIPanelOpen ? 'bg-ai/20 text-ai' : 'hover:bg-muted text-muted-foreground'
          )}
          title="Sol AI"
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Sol AI</span>
        </button>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground"
          title="Upload .sol File"
        >
          <Upload className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsLinterOpen(!isLinterOpen)}
          className={cn(
            'p-2 rounded transition-colors',
            isLinterOpen ? 'bg-primary/20 text-primary' : 'hover:bg-muted text-muted-foreground'
          )}
          title="Real-time errors"
        >
          <AlertCircle className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsGasOpen(!isGasOpen)}
          className={cn(
            'p-2 rounded transition-colors',
            isGasOpen ? 'bg-warning/20 text-warning' : 'hover:bg-muted text-muted-foreground'
          )}
          title="Gas Estimation"
        >
          <Zap className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsFormatterOpen(true)}
          className="p-2 rounded hover:bg-muted transition-colors text-muted-foreground"
          title="Format Code"
        >
          <Code2 className="w-5 h-5" />
        </button>

        <ThemeToggle />

        <button
          onClick={toggleSettings}
          className="p-2 rounded hover:bg-muted transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Panels */}
      <LinterPanel isOpen={isLinterOpen} onClose={() => setIsLinterOpen(false)} />
      <GasEstimationPanel isOpen={isGasOpen} onClose={() => setIsGasOpen(false)} />
      <FormatterPanel isOpen={isFormatterOpen} onClose={() => setIsFormatterOpen(false)} />
      <UploadPanel isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );

};

export default Toolbar;
