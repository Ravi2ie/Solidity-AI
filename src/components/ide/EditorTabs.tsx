import React from 'react';
import { X, Circle, Pin, PinOff } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';

const EditorTabs: React.FC = () => {
  const { openTabs, activeTabId, files, setActiveTab, closeTab, updateTabProperty } = useIDEStore();

  // Separate pinned and unpinned tabs
  const pinnedTabs = openTabs.filter((tab) => tab.isPinned);
  const unpinnedTabs = openTabs.filter((tab) => !tab.isPinned);

  const renderTabGroup = (tabs: typeof openTabs, showLabel = false) => (
    <>
      {showLabel && pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
        <div className="h-full w-0.5 bg-border mx-1" />
      )}
      {tabs.map((tab) => {
        const file = files.find((f) => f.id === tab.fileId);
        const isActive = tab.id === activeTabId;
        const isModified = file?.isModified;

        return (
          <div
            key={tab.id}
            className={cn('tab-item group', isActive && 'active')}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="font-mono text-sm truncate max-w-[120px]">
              {tab.fileName}
            </span>
            
            {isModified ? (
              <Circle className="w-3 h-3 fill-warning text-warning shrink-0" />
            ) : null}

            <button
              onClick={(e) => {
                e.stopPropagation();
                updateTabProperty(tab.id, 'isPinned', !tab.isPinned);
              }}
              className="p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              title={tab.isPinned ? 'Unpin tab' : 'Pin tab'}
            >
              {tab.isPinned ? (
                <PinOff className="w-3 h-3 text-primary" />
              ) : (
                <Pin className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        );
      })}
    </>
  );

  return (
    <div className="flex items-center bg-card border-b border-border overflow-x-auto group">
      {renderTabGroup(pinnedTabs)}
      {renderTabGroup(unpinnedTabs, true)}
      
      {openTabs.length === 0 && (
        <div className="px-4 py-2 text-muted-foreground text-sm">
          No files open
        </div>
      )}
    </div>
  );
};

export default EditorTabs;
