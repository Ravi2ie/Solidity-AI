import React, { useState } from 'react';
import {
  Sparkles,
  Settings,
  Loader2,
  Copy,
  Check,
  FileText,
  FilePlus,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateSolidityComments, detectVulnerabilities } from '@/services/geminiService';

interface AIPanelProps {
  className?: string;
}

const AIPanel: React.FC<AIPanelProps> = ({ className }) => {
  const {
    activeFileId,
    files,
    aiSettings,
    updateAISettings,
    updateFileContent,
    createFile,
    isGenerating,
    setIsGenerating,
    toggleAIPanel,
  } = useIDEStore();

  const [generatedComments, setGeneratedComments] = useState<string>('');
  const [vulnerabilityReport, setVulnerabilityReport] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'vulnerabilities'>('comments');

  const activeFile = files.find((f) => f.id === activeFileId);

  const generateComments = async () => {
    if (!activeFile) {
      toast.error('No file selected');
      return;
    }

    setIsGenerating(true);
    setGeneratedComments('');
    setVulnerabilityReport('');

    try {
      // Generate comments
      const comments = await generateSolidityComments(activeFile.content, {
        commentStyle: aiSettings.commentStyle,
        includeParamDocs: aiSettings.includeParamDocs,
        includeReturnDocs: aiSettings.includeReturnDocs,
        includeDevNotes: aiSettings.includeDevNotes,
      });
      
      setGeneratedComments(comments);
      setActiveTab('comments');

      // Scan vulnerabilities if checkbox is enabled
      if (aiSettings.scanVulnerabilities) {
        try {
          const report = await detectVulnerabilities(activeFile.content);
          setVulnerabilityReport(report);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error scanning vulnerabilities:', error);
          
          // Only show warning for non-503 errors
          if (!errorMsg.includes('overloaded') && !errorMsg.includes('503')) {
            toast.error('Vulnerability scan failed, but comments were generated successfully');
          } else {
            toast.warning('Vulnerability scan temporarily unavailable - model is overloaded. Try again in a moment.');
          }
        }
      }

      toast.success('Analysis complete!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate comments';
      
      if (errorMessage.includes('quota')) {
        toast.error(
          'API quota exceeded. Please upgrade your plan or try again later.',
          {
            description: 'Check your API usage and quota',
            duration: 8000,
          }
        );
      } else {
        toast.error(errorMessage);
      }
      
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const applyComments = () => {
    if (!generatedComments || !activeFile) return;

    if (aiSettings.outputMode === 'same-file') {
      updateFileContent(activeFile.id, generatedComments);
      toast.success('Comments applied to current file');
    } else {
      // Create a new file with _commented suffix
      const baseName = activeFile.name.replace('.sol', '');
      const commentedFileName = `${baseName}_commented.sol`;
      createFile(commentedFileName, generatedComments);
      toast.success(`Created ${commentedFileName} with documentation`);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedComments);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className={cn('flex flex-col h-full bg-card border-l border-border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-ai" />
          <span className="font-semibold">Sol AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={toggleAIPanel}
            className="p-1.5 rounded hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b border-border bg-muted/30 animate-fade-in">
          <h4 className="text-sm font-medium mb-3">Generation Settings</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Output Mode</label>
              <select
                value={aiSettings.outputMode}
                onChange={(e) => updateAISettings({ outputMode: e.target.value as 'same-file' | 'separate-file' })}
                className="w-full bg-input text-sm px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none"
              >
                <option value="same-file">Same File</option>
                <option value="separate-file">Separate File</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Comment Style</label>
              <select
                value={aiSettings.commentStyle}
                onChange={(e) => updateAISettings({ commentStyle: e.target.value as 'natspec' | 'inline' | 'both' })}
                className="w-full bg-input text-sm px-2 py-1.5 rounded border border-border focus:border-primary focus:outline-none"
              >
                <option value="natspec">NatSpec</option>
                <option value="inline">Inline</option>
                <option value="both">Both</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.includeParamDocs}
                  onChange={(e) => updateAISettings({ includeParamDocs: e.target.checked })}
                  className="rounded border-border"
                />
                <span>Include @param docs</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.includeReturnDocs}
                  onChange={(e) => updateAISettings({ includeReturnDocs: e.target.checked })}
                  className="rounded border-border"
                />
                <span>Include @return docs</span>
              </label>
              
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.includeDevNotes}
                  onChange={(e) => updateAISettings({ includeDevNotes: e.target.checked })}
                  className="rounded border-border"
                />
                <span>Include @dev notes</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiSettings.scanVulnerabilities}
                  onChange={(e) => updateAISettings({ scanVulnerabilities: e.target.checked })}
                  className="rounded border-border"
                />
                <span>Scan for vulnerabilities</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {!activeFile ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Select a file to generate comments</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">Current File</p>
              <p className="font-mono text-sm text-primary">{activeFile.name}</p>
            </div>

            <div>
              <button
                onClick={generateComments}
                disabled={isGenerating}
                className="ide-button-ai w-full flex items-center justify-center gap-2 py-2.5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Comments {aiSettings.scanVulnerabilities && '& Scan'}
                  </>
                )}
              </button>
            </div>

            {(generatedComments || vulnerabilityReport) && (
              <div className="animate-fade-in">
                {/* Tab Buttons */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setActiveTab('comments')}
                    disabled={!generatedComments}
                    className={`flex-1 py-1.5 text-sm rounded transition-colors ${
                      activeTab === 'comments' && generatedComments
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground disabled:opacity-50'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Comments
                  </button>
                  <button
                    onClick={() => setActiveTab('vulnerabilities')}
                    disabled={!vulnerabilityReport}
                    className={`flex-1 py-1.5 text-sm rounded transition-colors ${
                      activeTab === 'vulnerabilities' && vulnerabilityReport
                        ? 'bg-red-900/50 text-red-100'
                        : 'bg-muted text-muted-foreground disabled:opacity-50'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Security
                  </button>
                </div>

                {/* Content Area */}
                {activeTab === 'comments' && generatedComments && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Generated Comments</span>
                      <button
                        onClick={copyToClipboard}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="Copy"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    <div className="bg-editor rounded-lg border border-border p-3 max-h-[300px] overflow-auto">
                      <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">
                        {generatedComments}
                      </pre>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={applyComments}
                        disabled={!generatedComments || !activeFile}
                        className="ide-button-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {aiSettings.outputMode === 'same-file' ? (
                          <>
                            <FileText className="w-4 h-4" />
                            Apply to File
                          </>
                        ) : (
                          <>
                            <FilePlus className="w-4 h-4" />
                            Create Doc File
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedComments);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          toast.success('Comments copied to clipboard');
                        }}
                        disabled={!generatedComments}
                        className="ide-button-ai flex items-center justify-center gap-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Copy to clipboard"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'vulnerabilities' && vulnerabilityReport && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-400">Vulnerability Report</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(vulnerabilityReport);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          toast.success('Copied to clipboard');
                        }}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="Copy"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>

                    <div className="bg-red-950/20 rounded-lg border border-red-700/30 p-3 max-h-[300px] overflow-auto vulnerability-report">
                      <div className="text-xs text-red-100 space-y-2">
                        {vulnerabilityReport.split('\n').map((line, idx) => {
                          // Render bold text
                          const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                          // Render code comments
                          const commentLine = boldLine.replace(/(\/\/.*)/g, '<code class="bg-red-900/30 px-1 rounded">$1</code>');
                          
                          if (line.trim().startsWith('SECURITY AUDIT REPORT')) {
                            return (
                              <div key={idx} className="font-semibold text-red-200 mb-2">
                                {line}
                              </div>
                            );
                          }
                          if (line.trim().match(/^[\d]+\./)) {
                            return (
                              <div key={idx} className="font-semibold text-red-100 mt-2 mb-1">
                                <span dangerouslySetInnerHTML={{ __html: commentLine }} />
                              </div>
                            );
                          }
                          if (line.trim().startsWith('Location:') || line.trim().startsWith('Issue:') || line.trim().startsWith('Fix:')) {
                            return (
                              <div key={idx} className="ml-4 text-red-200">
                                <span dangerouslySetInnerHTML={{ __html: commentLine }} />
                              </div>
                            );
                          }
                          if (line.trim().match(/^={5,}$/) || line.trim().match(/^-{5,}$/)) {
                            return (
                              <div key={idx} className="border-b border-red-700/50 my-2"></div>
                            );
                          }
                          if (line.trim() === '') {
                            return <div key={idx}></div>;
                          }
                          return (
                            <div key={idx} className="text-red-100">
                              <span dangerouslySetInnerHTML={{ __html: commentLine }} />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;
