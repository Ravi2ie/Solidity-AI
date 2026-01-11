import React, { useEffect, useState, useRef } from 'react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import Toolbar from './Toolbar';
import FileExplorer from './FileExplorer';
import EditorTabs from './EditorTabs';
import CodeEditor from './CodeEditor';
import AIPanel from './AIPanel';
import SettingsPanel from './SettingsPanel';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import FloatingActionMenu from './FloatingActionMenu';
import { toast } from 'sonner';

const IDELayout: React.FC = () => {
  const {
    isSidebarOpen,
    isAIPanelOpen,
    isSettingsOpen,
    activeFileId,
    saveFile,
    files,
  } = useIDEStore();

  const [sidebarWidth, setSidebarWidth] = useState(256); // 64 * 4 (w-64)
  const [aiPanelWidth, setAIPanelWidth] = useState(320); // 80 * 4 (w-80)
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingAIPanel, setIsDraggingAIPanel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle sidebar resize
  useEffect(() => {
    if (!isDraggingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      
      // Min width 200px, max width 50% of container
      const minWidth = 200;
      const maxWidth = rect.width * 0.5;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar]);

  // Handle AI panel resize
  useEffect(() => {
    if (!isDraggingAIPanel) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      
      // Min width 250px, max width 50% of container
      const minWidth = 250;
      const maxWidth = rect.width * 0.5;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setAIPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingAIPanel(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingAIPanel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (activeFileId) {
          saveFile(activeFileId);
          toast.success('File saved');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFileId, saveFile]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Main Content */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className="bg-sidebar border-r border-border overflow-hidden transition-colors"
          style={{
            width: isSidebarOpen ? `${sidebarWidth}px` : '0px',
            minWidth: isSidebarOpen ? '200px' : '0px',
          }}
        >
          <FileExplorer className="h-full" />
        </div>

        {/* Sidebar Resize Handle */}
        {isSidebarOpen && (
          <div
            onMouseDown={() => setIsDraggingSidebar(true)}
            className={cn(
              'w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors',
              isDraggingSidebar && 'bg-primary'
            )}
          />
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <EditorTabs />
          <BreadcrumbNavigation />
          <div className="flex-1 flex overflow-hidden editor-wrapper">
            <CodeEditor className="flex-1" />
          </div>
        </div>

        {/* AI Panel Resize Handle */}
        {isAIPanelOpen && (
          <div
            onMouseDown={() => setIsDraggingAIPanel(true)}
            className={cn(
              'w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors',
              isDraggingAIPanel && 'bg-primary'
            )}
          />
        )}

        {/* AI Panel */}
        <div
          className="overflow-hidden transition-colors bg-card border-l border-border"
          style={{
            width: isAIPanelOpen ? `${aiPanelWidth}px` : '0px',
            minWidth: isAIPanelOpen ? '250px' : '0px',
          }}
        >
          <AIPanel className="h-full" />
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && <SettingsPanel />}

      {/* Floating Action Menu */}
      <FloatingActionMenu />
    </div>
  );
};

export default IDELayout;
