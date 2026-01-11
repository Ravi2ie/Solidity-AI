import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import { getSyntaxColor, calculateLineDensity, isEmptyLine, smoothScroll } from '@/utils/minimapUtils';

const CodeMinimap: React.FC = () => {
  const { activeFileId, files } = useIDEStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [scrollPosition, setScrollPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [cursorLine, setCursorLine] = useState(0);

  const activeFile = files.find((f) => f.id === activeFileId);
  const content = activeFile?.content || '';
  const lines = content.split('\n');

  // Get editor container and calculate dimensions
  const getEditorDimensions = useCallback(() => {
    const editorContainer = document.querySelector('.editor-wrapper') as HTMLElement;
    if (!editorContainer) return { scrollHeight: 0, clientHeight: 0, scrollTop: 0 };
    return {
      scrollHeight: editorContainer.scrollHeight,
      clientHeight: editorContainer.clientHeight,
      scrollTop: editorContainer.scrollTop,
    };
  }, []);

  // Track cursor position from editor
  const updateCursorPosition = useCallback(() => {
    const textarea = document.querySelector('.editor-wrapper textarea') as HTMLTextAreaElement;
    if (textarea) {
      const textBefore = textarea.value.substring(0, textarea.selectionStart);
      const lineNum = textBefore.split('\n').length - 1;
      setCursorLine(lineNum);
    }
  }, []);

  // Draw minimap with actual code representation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const charWidth = 1.8;
    const charHeight = 2.6;
    const lineHeight = 3.2;

    // Get current theme
    const isDarkTheme = !document.documentElement.classList.contains('light-theme');
    const bgColor = isDarkTheme ? '#0f172a' : '#f8f9fa';
    const textColor = isDarkTheme ? '#cbd5e1' : '#334155';
    
    // Clear canvas with background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Set up font for rendering code
    ctx.font = 'bold 1px monospace';

    // Draw minimap lines with actual code visualization
    lines.forEach((line, lineIndex) => {
      const y = lineIndex * lineHeight;
      if (y > height) return;

      if (isEmptyLine(line)) {
        return;
      }

      // Get color and text representation
      const color = getSyntaxColor(line, isDarkTheme);
      const trimmedLine = line.trim();
      
      // Limit line length for rendering
      const displayLine = trimmedLine.length > 100 ? trimmedLine.substring(0, 100) : trimmedLine;
      
      // Draw background for code line
      ctx.fillStyle = isDarkTheme ? 'rgba(226,232,240,0.05)' : 'rgba(51,65,85,0.03)';
      ctx.fillRect(0, y, width, lineHeight);

      // Draw colored accent bar based on syntax
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(0, y, 1.5, lineHeight);
      ctx.globalAlpha = 1;

      // Draw text representation - use approximation characters
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      
      // Render characters as small blocks/text
      for (let i = 0; i < Math.min(displayLine.length, Math.floor(width / charWidth)); i++) {
        const x = 3 + i * charWidth;
        const char = displayLine[i];
        
        // Use visual indicators instead of actual font rendering
        if (char === '{' || char === '}' || char === '[' || char === ']' || char === '(' || char === ')') {
          // Brackets - draw as small rectangles
          ctx.fillRect(x, y + 0.3, charWidth - 0.2, charHeight - 0.3);
        } else if (char === ';' || char === ',' || char === ':') {
          // Punctuation - draw as dots
          ctx.fillRect(x + 0.4, y + charHeight - 0.4, 0.3, 0.3);
        } else if (char === ' ') {
          // Space - skip
          continue;
        } else {
          // Regular characters - draw as small dash
          ctx.fillRect(x, y + 0.7, charWidth - 0.1, 0.6);
        }
      }
      ctx.globalAlpha = 1;
    });

    // Draw cursor line indicator with glow effect
    if (cursorLine > 0 && cursorLine < lines.length) {
      const cursorY = cursorLine * lineHeight;
      
      // Glow effect
      ctx.shadowColor = isDarkTheme ? 'rgba(239,68,68,0.5)' : 'rgba(220,38,38,0.5)';
      ctx.shadowBlur = 6;
      
      ctx.strokeStyle = isDarkTheme ? '#ef4444' : '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, cursorY);
      ctx.lineTo(width, cursorY);
      ctx.stroke();
      
      ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 1;
    }

    // Draw viewport indicator (VSCode-style with semi-transparent overlay)
    const dims = getEditorDimensions();
    const visibleRatio = dims.clientHeight / dims.scrollHeight;
    const indicatorHeight = Math.max(20, visibleRatio * height);
    const indicatorY = (dims.scrollTop / dims.scrollHeight) * height;

    // Semi-transparent fill
    ctx.fillStyle = isDarkTheme ? '#3b82f6' : '#2563eb';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, indicatorY, width, indicatorHeight);
    
    // Border outline
    ctx.strokeStyle = isDarkTheme ? '#60a5fa' : '#1d4ed8';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.strokeRect(0.5, indicatorY + 0.5, width - 1, indicatorHeight - 1);
    
    ctx.globalAlpha = 1;
  }, [lines, scrollPosition, cursorLine, getEditorDimensions]);

  // Handle scroll synchronization
  const handleEditorScroll = useCallback(() => {
    const editorContainer = document.querySelector('.editor-wrapper') as HTMLElement;
    if (editorContainer) {
      const { scrollHeight, clientHeight, scrollTop } = editorContainer;
      const percentage = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
      setScrollPosition(percentage);
    }
  }, []);

  // Handle minimap click - smooth scroll
  const handleMinimapClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const editorContainer = document.querySelector('.editor-wrapper') as HTMLElement;

    if (editorContainer) {
      const dims = getEditorDimensions();
      const percentage = y / rect.height;
      const newScrollTop = percentage * (dims.scrollHeight - dims.clientHeight);

      // Smooth scroll using easing
      smoothScroll(editorContainer, newScrollTop, 250);
    }
  }, [getEditorDimensions]);

  // Handle minimap drag - VSCode style
  const handleMinimapMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  const handleMinimapDrag = useCallback((clientY: number) => {
    if (!isDraggingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    const editorContainer = document.querySelector('.editor-wrapper') as HTMLElement;

    if (editorContainer) {
      const dims = getEditorDimensions();
      const percentage = Math.max(0, Math.min(1, y / rect.height));
      const newScrollTop = percentage * (dims.scrollHeight - dims.clientHeight);

      editorContainer.scrollTop = newScrollTop;
    }
  }, [getEditorDimensions]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingRef.current) {
      handleMinimapDrag(e.clientY);
    }

    // Update hover position for visual feedback
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      if (y >= 0 && y <= rect.height) {
        setHoverPosition(y);
      }
    }
  }, [handleMinimapDrag]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
    setHoverPosition(null);
  }, []);

  // Setup event listeners
  useEffect(() => {
    const editorContainer = document.querySelector('.editor-wrapper');
    if (editorContainer) {
      editorContainer.addEventListener('scroll', handleEditorScroll);
      return () => editorContainer.removeEventListener('scroll', handleEditorScroll);
    }
  }, [handleEditorScroll]);

  useEffect(() => {
    const textarea = document.querySelector('.editor-wrapper textarea');
    if (textarea) {
      textarea.addEventListener('click', updateCursorPosition);
      textarea.addEventListener('keyup', updateCursorPosition);
      return () => {
        textarea.removeEventListener('click', updateCursorPosition);
        textarea.removeEventListener('keyup', updateCursorPosition);
      };
    }
  }, [updateCursorPosition]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!activeFile) return null;

  const isDarkTheme = !document.documentElement.classList.contains('light-theme');

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col h-full border-l transition-colors',
        isDarkTheme ? 'border-border bg-card' : 'border-gray-200 bg-gray-50'
      )}
    >
      {/* Header */}
      <div className={cn('text-xs font-medium px-2 py-1.5', isDarkTheme ? 'text-muted-foreground' : 'text-gray-500')}>
        Minimap
      </div>

      {/* Canvas with enhanced styling */}
      <div className={cn(
        'flex-1 relative overflow-hidden group transition-colors',
        isDarkTheme ? 'hover:bg-slate-900' : 'hover:bg-gray-100'
      )}>
        <canvas
          ref={canvasRef}
          width={120}
          height={800}
          onMouseDown={handleMinimapMouseDown}
          onClick={handleMinimapClick}
          className={cn(
            'w-full h-full cursor-pointer transition-opacity duration-200',
            isDragging ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'
          )}
          title="Click to navigate or drag to scroll • Hover to preview"
          style={{ 
            imageRendering: 'crisp-edges',
            display: 'block'
          }}
        />

        {/* Hover indicator line with glow */}
        {hoverPosition !== null && !isDragging && (
          <>
            <div
              className={cn(
                'absolute inset-x-0 h-0.5 pointer-events-none transition-colors',
                isDarkTheme ? 'bg-cyan-400' : 'bg-blue-500'
              )}
              style={{ top: `${hoverPosition}px`, boxShadow: isDarkTheme ? '0 0 6px rgba(34,211,238,0.6)' : '0 0 6px rgba(59,130,246,0.6)' }}
            />
            <div
              className={cn(
                'absolute inset-x-0 h-px pointer-events-none',
                isDarkTheme ? 'bg-cyan-400/30' : 'bg-blue-500/30'
              )}
              style={{ top: `${hoverPosition + 2}px` }}
            />
          </>
        )}

        {/* Drag tooltip */}
        {isDragging && (
          <div className={cn(
            'absolute top-3 right-3 px-2.5 py-1.5 rounded text-xs font-medium whitespace-nowrap shadow-lg',
            isDarkTheme 
              ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30' 
              : 'bg-gray-800 text-cyan-300 border border-cyan-400/30'
          )}>
            ⟨⟩ Scrolling
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className={cn(
        'text-xs px-3 py-2 border-t space-y-1',
        isDarkTheme 
          ? 'border-slate-800 bg-slate-900/50 text-slate-400' 
          : 'border-gray-200 bg-gray-100 text-gray-600'
      )}>
        <div className="flex items-center justify-between font-mono text-xs">
          <span>{lines.length} lines</span>
          <span className={cn(
            'font-semibold',
            isDarkTheme ? 'text-cyan-400' : 'text-blue-600'
          )}>
            {Math.round((1 - scrollPosition) * 100)}%
          </span>
        </div>
        <div className={cn(
          'h-1 rounded-full overflow-hidden',
          isDarkTheme ? 'bg-slate-800' : 'bg-gray-300'
        )}>
          <div
            className={cn(
              'h-full transition-all duration-200',
              isDarkTheme ? 'bg-cyan-500' : 'bg-blue-500'
            )}
            style={{ width: `${Math.max(5, (1 - scrollPosition) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeMinimap;
