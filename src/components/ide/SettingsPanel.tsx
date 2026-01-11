import React from 'react';
import {
  X,
  Monitor,
  Type,
  Indent,
  WrapText,
  Hash,
  Save,
} from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  className?: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ className }) => {
  const { editorSettings, updateEditorSettings, toggleSettings } = useIDEStore();

  return (
    <div className={cn('fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center', className)}>
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold">Editor Settings</h2>
          <button
            onClick={toggleSettings}
            className="p-1.5 rounded hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Font Size</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="10"
                max="24"
                value={editorSettings.fontSize}
                onChange={(e) => updateEditorSettings({ fontSize: parseInt(e.target.value) })}
                className="w-24 accent-primary"
              />
              <span className="text-sm font-mono w-8">{editorSettings.fontSize}px</span>
            </div>
          </div>

          {/* Tab Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Indent className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Tab Size</span>
            </div>
            <select
              value={editorSettings.tabSize}
              onChange={(e) => updateEditorSettings({ tabSize: parseInt(e.target.value) })}
              className="bg-input text-sm px-2 py-1 rounded border border-border focus:border-primary focus:outline-none"
            >
              <option value="2">2 spaces</option>
              <option value="4">4 spaces</option>
              <option value="8">8 spaces</option>
            </select>
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WrapText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Word Wrap</span>
            </div>
            <button
              onClick={() => updateEditorSettings({ wordWrap: !editorSettings.wordWrap })}
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative',
                editorSettings.wordWrap ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform',
                  editorSettings.wordWrap ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {/* Line Numbers */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Line Numbers</span>
            </div>
            <button
              onClick={() => updateEditorSettings({ lineNumbers: !editorSettings.lineNumbers })}
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative',
                editorSettings.lineNumbers ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform',
                  editorSettings.lineNumbers ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          {/* Auto Save */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Auto Save</span>
            </div>
            <button
              onClick={() => updateEditorSettings({ autoSave: !editorSettings.autoSave })}
              className={cn(
                'w-10 h-5 rounded-full transition-colors relative',
                editorSettings.autoSave ? 'bg-primary' : 'bg-muted'
              )}
            >
              <div
                className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform',
                  editorSettings.autoSave ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border flex justify-end">
          <button
            onClick={toggleSettings}
            className="ide-button-primary"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
