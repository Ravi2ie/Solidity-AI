import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { lintSolidity, LintIssue } from '@/utils/solidityAnalyzer';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';

interface LinterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const LinterPanel: React.FC<LinterPanelProps> = ({ isOpen, onClose }) => {
  const { activeFileId, files } = useIDEStore();
  const activeFile = files.find((f) => f.id === activeFileId);
  const code = activeFile?.content || '';

  const issues = useMemo(() => lintSolidity(code), [code]);

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const infoCount = issues.filter((i) => i.severity === 'info').length;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info':
        return <Info className="w-4 h-4 text-primary" />;
      default:
        return null;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-destructive/10 border-l-destructive';
      case 'warning':
        return 'bg-warning/10 border-l-warning';
      case 'info':
        return 'bg-primary/10 border-l-primary';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-48 bg-card border-t border-border shadow-lg z-40">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm">Fast Vulnerability & Error Checking</h3>
          <div className="flex items-center gap-2 text-xs">
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="w-3 h-3" /> {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="w-3 h-3" /> {warningCount}
              </span>
            )}
            {infoCount > 0 && (
              <span className="flex items-center gap-1 text-primary">
                <Info className="w-3 h-3" /> {infoCount}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto h-[calc(100%-2.5rem)]">
        {issues.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No issues found - Code looks good!
          </div>
        ) : (
          <div className="divide-y divide-border">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-3 border-l-4 cursor-pointer hover:bg-muted/50 transition-colors',
                  getSeverityBg(issue.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getSeverityIcon(issue.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {issue.message}
                      </p>
                      {issue.code && (
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                          {issue.code}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Line {issue.line}, Column {issue.column}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinterPanel;
