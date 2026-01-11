import React from 'react';
import { Code2, X } from 'lucide-react';
import { formatSolidity } from '@/utils/solidityAnalyzer';
import { useIDEStore } from '@/store/ideStore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FormatterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FormatterPanel: React.FC<FormatterPanelProps> = ({ isOpen, onClose }) => {
  const { activeFileId, files, updateFileContent } = useIDEStore();
  const activeFile = files.find((f) => f.id === activeFileId);

  const handleFormat = () => {
    if (!activeFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to format',
        variant: 'destructive',
      });
      return;
    }

    const formatted = formatSolidity(activeFile.content);
    updateFileContent(activeFile.id, formatted);
    toast({
      title: 'Code formatted',
      description: 'Your Solidity code has been formatted successfully',
    });
    onClose();
  };

  const handleFormatAndOptimize = () => {
    if (!activeFile) return;

    let optimized = formatSolidity(activeFile.content);

    // Additional optimizations
    // 1. Remove unnecessary spaces
    optimized = optimized.replace(/\s+$/gm, '');

    // 2. Optimize gas (add unchecked blocks for loops)
    optimized = optimized.replace(
      /for\s*\(\s*uint\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*[^;]+\s*;\s*\w+\+\+\s*\)\s*{/g,
      (match) => {
        if (!match.includes('unchecked')) {
          return match.slice(0, -1) + '{\n    unchecked {';
        }
        return match;
      }
    );

    updateFileContent(activeFile.id, optimized);
    toast({
      title: 'Code optimized',
      description: 'Code formatted and optimized for gas efficiency',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            <h2 className="font-semibold">Format Code</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Choose formatting option:
            </p>

            <button
              onClick={handleFormat}
              className={cn(
                'w-full p-3 rounded-lg border border-border transition-all',
                'hover:bg-muted text-left text-sm font-medium',
                'flex items-center justify-between'
              )}
            >
              <div>
                <p className="text-foreground">Basic Format</p>
                <p className="text-xs text-muted-foreground">Indentation & spacing</p>
              </div>
              <span className="text-primary">→</span>
            </button>

            <button
              onClick={handleFormatAndOptimize}
              className={cn(
                'w-full p-3 rounded-lg border border-primary/50 bg-primary/5 transition-all',
                'hover:bg-primary/10 text-left text-sm font-medium',
                'flex items-center justify-between'
              )}
            >
              <div>
                <p className="text-foreground">Format + Optimize</p>
                <p className="text-xs text-muted-foreground">Includes gas optimization</p>
              </div>
              <span className="text-primary">⚡</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Formatting includes:</p>
            <ul className="space-y-0.5 ml-2">
              <li>• Normalize indentation (2 spaces)</li>
              <li>• Consistent spacing around operators</li>
              <li>• Remove trailing whitespace</li>
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary space-y-1">
            <p className="font-medium">Optimization adds:</p>
            <ul className="space-y-0.5 ml-2">
              <li>• Unchecked blocks for loops</li>
              <li>• Gas-efficient patterns</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormatterPanel;
