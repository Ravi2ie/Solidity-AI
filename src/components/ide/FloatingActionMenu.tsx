import React, { useState } from 'react';
import { Plus, Copy, Download, Settings, Share2, Zap, X } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const FloatingActionMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeFileId, files, openTabs, updateFileContent } = useIDEStore();

  const activeFile = files.find((f) => f.id === activeFileId);

  const actions = [
    {
      id: 'copy',
      label: 'Copy Code',
      icon: Copy,
      action: () => {
        if (activeFile) {
          navigator.clipboard.writeText(activeFile.content);
          toast({
            title: 'Copied to clipboard',
            description: 'Code has been copied successfully',
          });
        }
      },
    },
    {
      id: 'download',
      label: 'Download File',
      icon: Download,
      action: () => {
        if (activeFile) {
          const element = document.createElement('a');
          element.setAttribute(
            'href',
            `data:text/plain;charset=utf-8,${encodeURIComponent(activeFile.content)}`
          );
          element.setAttribute('download', activeFile.name);
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          toast({
            title: 'Download started',
            description: `${activeFile.name} is being downloaded`,
          });
        }
      },
    },
    {
      id: 'format',
      label: 'Format Code',
      icon: Zap,
      action: () => {
        if (activeFile) {
          // Basic formatting: remove extra spaces, standardize indentation
          const formatted = activeFile.content
            .split('\n')
            .map((line) => {
              const trimmed = line.trim();
              const leadingSpaces = line.match(/^(\s*)/)?.[1] || '';
              const indentLevel = Math.floor(leadingSpaces.length / 2);
              return '  '.repeat(indentLevel) + trimmed;
            })
            .join('\n');

          updateFileContent(activeFile.id, formatted);
          toast({
            title: 'Code formatted',
            description: 'Indentation has been standardized',
          });
        }
      },
    },
    {
      id: 'share',
      label: 'Share Code',
      icon: Share2,
      action: () => {
        if (activeFile) {
          const text = `Check out this Solidity contract:\n\n\`\`\`solidity\n${activeFile.content}\n\`\`\``;
          if (navigator.share) {
            navigator.share({
              title: activeFile.name,
              text: text,
            });
          } else {
            navigator.clipboard.writeText(text);
            toast({
              title: 'Copied to clipboard',
              description: 'Code and metadata copied for sharing',
            });
          }
        }
      },
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating menu items */}
      <div
        className={cn(
          'absolute bottom-20 right-0 flex flex-col gap-3 transition-all duration-300 origin-bottom-right',
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-0 opacity-0 pointer-events-none'
        )}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => {
                action.action();
                setIsOpen(false);
              }}
              className={cn(
                'group relative p-3 rounded-lg bg-primary text-primary-foreground',
                'shadow-lg hover:shadow-xl transition-all duration-200',
                'hover:scale-110 active:scale-95'
              )}
              title={action.label}
            >
              <Icon className="w-5 h-5" />
              <span
                className={cn(
                  'absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5',
                  'bg-popover text-popover-foreground text-sm rounded whitespace-nowrap',
                  'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'
                )}
              >
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-4 rounded-full bg-accent text-accent-foreground',
          'shadow-lg hover:shadow-xl transition-all duration-200',
          'hover:scale-110 active:scale-95',
          'group relative'
        )}
        title="Quick actions"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        )}

        {/* Tooltip for main button when closed */}
        {!isOpen && (
          <span
            className={cn(
              'absolute bottom-full right-1/2 translate-x-1/2 mb-3 px-3 py-1.5',
              'bg-popover text-popover-foreground text-sm rounded whitespace-nowrap',
              'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'
            )}
          >
            Quick Actions
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingActionMenu;
