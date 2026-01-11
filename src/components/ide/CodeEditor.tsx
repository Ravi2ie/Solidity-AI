import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import { tokenizeSolidity, getTokenColor, TokenType } from '@/utils/soliditySyntaxHighlighter';

interface CodeEditorProps {
  className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ className }) => {
  const { activeFileId, files, updateFileContent, editorSettings } = useIDEStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);

  const activeFile = files.find((f) => f.id === activeFileId);
  const content = activeFile?.content || '';
  const lines = content.split('\n');

  // Memoize tokens for performance
  const tokens = useMemo(() => tokenizeSolidity(content), [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFileId) {
      updateFileContent(activeFileId, e.target.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const spaces = ' '.repeat(editorSettings.tabSize);
      const newValue = content.substring(0, start) + spaces + content.substring(end);
      
      if (activeFileId) {
        updateFileContent(activeFileId, newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + editorSettings.tabSize;
        }, 0);
      }
    }
  };

  const handleCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const pos = target.selectionStart;
    const textBeforeCursor = content.substring(0, pos);
    const lines = textBeforeCursor.split('\n');
    setCursorLine(lines.length);
    setCursorCol(lines[lines.length - 1].length + 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    
    // Sync the pre element scroll
    if (preRef.current) {
      preRef.current.scrollLeft = target.scrollLeft;
      preRef.current.scrollTop = target.scrollTop;
    }

    // Sync line numbers scroll
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = target.scrollTop;
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [activeFileId]);

  if (!activeFile) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-editor', className)}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">No file selected</p>
          <p className="text-sm mt-1">Open a file from the explorer to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-editor', className)}>
      <div className="flex-1 flex overflow-hidden editor-wrapper">
        {/* Line Numbers */}
        {editorSettings.lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="flex-shrink-0 bg-editor-gutter text-muted-foreground text-right pr-3 pl-3 py-2 font-mono text-sm select-none overflow-hidden"
          >
            {lines.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'leading-6',
                  cursorLine === i + 1 && 'text-foreground'
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Highlighted code background */}
          <pre
            ref={preRef}
            className={cn(
              'absolute inset-0 w-full h-full resize-none bg-transparent text-foreground',
              'font-mono leading-6 p-2 outline-none whitespace-pre-wrap break-words',
              'pointer-events-none overflow-hidden'
            )}
            style={{ fontSize: `${editorSettings.fontSize}px` }}
          >
            {tokens.map((token, idx) => (
              <span
                key={idx}
                style={{
                  color: getTokenColor(token.type),
                  fontWeight: token.type === TokenType.KEYWORD ? '600' : 'normal',
                }}
              >
                {token.value}
              </span>
            ))}
          </pre>

          {/* Transparent textarea overlay */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleCursorChange}
            onClick={handleCursorChange}
            onScroll={handleScroll}
            spellCheck={false}
            className={cn(
              'relative w-full h-full resize-none bg-transparent text-transparent',
              'font-mono leading-6 p-2 outline-none',
              'caret-primary selection:bg-primary/30',
              'z-10'
            )}
            style={{ fontSize: `${editorSettings.fontSize}px` }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-status border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Solidity</span>
          <span>{activeFile.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {cursorLine}, Col {cursorCol}</span>
          <span>UTF-8</span>
          <span>{editorSettings.tabSize} spaces</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
