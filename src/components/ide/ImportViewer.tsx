import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, ExternalLink } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { parseImports, buildDependencyGraph, findCircularDependencies } from '@/utils/importResolver';
import { cn } from '@/lib/utils';

interface ImportViewerProps {
  className?: string;
}

const ImportViewer: React.FC<ImportViewerProps> = ({ className }) => {
  const { activeFileId, files } = useIDEStore();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  if (!activeFileId) {
    return (
      <div className={cn('p-4 text-muted-foreground text-sm', className)}>
        Select a file to view imports
      </div>
    );
  }

  const activeFile = files.find((f) => f.id === activeFileId);
  if (!activeFile) return null;

  const imports = parseImports(activeFile.content);
  const graph = buildDependencyGraph(files);
  const circularDeps = findCircularDependencies(graph);
  const fileData = graph.get(activeFileId);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const getImportColor = (type: string) => {
    switch (type) {
      case 'relative':
        return 'text-blue-400';
      case 'absolute':
        return 'text-green-400';
      case 'node_modules':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border-l border-border', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Import Dependencies</h3>
        <p className="text-xs text-muted-foreground mt-1">{activeFile.name}</p>
      </div>

      {/* Circular Dependencies Warning */}
      {circularDeps.length > 0 && (
        <div className="mx-4 mt-3 p-2 rounded bg-red-900/20 border border-red-700/30">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold mb-1">
            <AlertCircle className="w-3 h-3" />
            Circular Dependencies Detected
          </div>
          {circularDeps.slice(0, 2).map((cycle, idx) => (
            <div key={idx} className="text-red-300 text-xs font-mono">
              {cycle.join(' → ')}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Imports Section */}
        {imports.length > 0 ? (
          <div className="p-4 space-y-4">
            {/* Relative Imports */}
            {imports.filter((i) => i.type === 'relative').length > 0 && (
              <div>
                <button
                  onClick={() => toggleGroup('relative')}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted transition-colors text-sm font-semibold"
                >
                  {expandedGroups.includes('relative') ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="text-blue-400">Relative Imports</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {imports.filter((i) => i.type === 'relative').length}
                  </span>
                </button>
                {expandedGroups.includes('relative') && (
                  <div className="mt-1 ml-2 space-y-1 border-l border-blue-400/30 pl-3">
                    {imports
                      .filter((i) => i.type === 'relative')
                      .map((imp, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-mono text-blue-300 py-1 hover:bg-muted/50 px-2 rounded cursor-pointer transition-colors"
                        >
                          {imp.path}
                          <span className="text-muted-foreground ml-2">:{imp.line}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Absolute Imports */}
            {imports.filter((i) => i.type === 'absolute').length > 0 && (
              <div>
                <button
                  onClick={() => toggleGroup('absolute')}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted transition-colors text-sm font-semibold"
                >
                  {expandedGroups.includes('absolute') ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="text-green-400">Absolute Imports</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {imports.filter((i) => i.type === 'absolute').length}
                  </span>
                </button>
                {expandedGroups.includes('absolute') && (
                  <div className="mt-1 ml-2 space-y-1 border-l border-green-400/30 pl-3">
                    {imports
                      .filter((i) => i.type === 'absolute')
                      .map((imp, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-mono text-green-300 py-1 hover:bg-muted/50 px-2 rounded cursor-pointer transition-colors"
                        >
                          {imp.path}
                          <span className="text-muted-foreground ml-2">:{imp.line}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Node Modules */}
            {imports.filter((i) => i.type === 'node_modules').length > 0 && (
              <div>
                <button
                  onClick={() => toggleGroup('node_modules')}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted transition-colors text-sm font-semibold"
                >
                  {expandedGroups.includes('node_modules') ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <span className="text-purple-400">External Libraries</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {imports.filter((i) => i.type === 'node_modules').length}
                  </span>
                </button>
                {expandedGroups.includes('node_modules') && (
                  <div className="mt-1 ml-2 space-y-1 border-l border-purple-400/30 pl-3">
                    {imports
                      .filter((i) => i.type === 'node_modules')
                      .map((imp, idx) => (
                        <div
                          key={idx}
                          className="text-xs font-mono text-purple-300 py-1 hover:bg-muted/50 px-2 rounded cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <span>{imp.path}</span>
                          <span className="text-muted-foreground ml-2">:{imp.line}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-muted-foreground text-sm">
            No imports found in this file
          </div>
        )}

        {/* Imported By Section */}
        {fileData && fileData.importedBy.length > 0 && (
          <div className="px-4 py-4 border-t border-border">
            <button
              onClick={() => toggleGroup('importedBy')}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted transition-colors text-sm font-semibold"
            >
              {expandedGroups.includes('importedBy') ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-amber-400">Imported By</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {fileData.importedBy.length}
              </span>
            </button>
            {expandedGroups.includes('importedBy') && (
              <div className="mt-1 ml-2 space-y-1 border-l border-amber-400/30 pl-3">
                {fileData.importedBy.map((fileName, idx) => (
                  <div
                    key={idx}
                    className="text-xs font-mono text-amber-300 py-1 hover:bg-muted/50 px-2 rounded cursor-pointer transition-colors"
                  >
                    {fileName}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportViewer;
