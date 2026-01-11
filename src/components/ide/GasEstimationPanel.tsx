import React, { useMemo } from 'react';
import { Zap, X } from 'lucide-react';
import { estimateGas } from '@/utils/solidityAnalyzer';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';

interface GasEstimationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const GasEstimationPanel: React.FC<GasEstimationPanelProps> = ({ isOpen, onClose }) => {
  const { activeFileId, files } = useIDEStore();
  const activeFile = files.find((f) => f.id === activeFileId);
  const code = activeFile?.content || '';

  const gasEstimates = useMemo(() => estimateGas(code), [code]);

  const totalGas = useMemo(() => {
    return Array.from(gasEstimates.values()).reduce((a, b) => a + b, 0);
  }, [gasEstimates]);

  const getGasClass = (gas: number) => {
    if (gas > 100000) return 'text-destructive'; // Red - Very high
    if (gas > 50000) return 'text-warning'; // Orange - High
    if (gas > 30000) return 'text-yellow-500'; // Yellow - Medium
    return 'text-success'; // Green - Low
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-lg z-40 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <h3 className="font-semibold text-sm">Gas Estimation</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {gasEstimates.size === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No functions found to analyze
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Total Estimated Gas</p>
              <p className={cn('text-2xl font-bold', getGasClass(totalGas))}>
                {totalGas.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(totalGas / 1000).toFixed(2)} K gas
              </p>
            </div>

            {/* Function estimates */}
            <div className="space-y-2 mt-4">
              <p className="text-xs font-semibold text-muted-foreground px-1">Functions</p>
              {Array.from(gasEstimates.entries()).map(([funcName, gas]) => (
                <div
                  key={funcName}
                  className="p-2 rounded bg-muted/30 border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono text-foreground truncate">
                      {funcName}()
                    </span>
                    <span className={cn('text-sm font-semibold whitespace-nowrap', getGasClass(gas))}>
                      {gas.toLocaleString()}
                    </span>
                  </div>
                  {/* Gas bar */}
                  <div className="mt-1.5 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-all',
                        gas > 100000
                          ? 'bg-destructive'
                          : gas > 50000
                          ? 'bg-warning'
                          : gas > 30000
                          ? 'bg-yellow-500'
                          : 'bg-success'
                      )}
                      style={{
                        width: `${Math.min((gas / totalGas) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="mt-4 p-2 rounded bg-primary/10 border border-primary/20 text-xs text-primary/80">
              <p className="font-medium mb-1">Gas Estimation Notes:</p>
              <ul className="space-y-0.5 text-primary/70">
                <li>• Estimates are approximate and vary based on actual execution</li>
                <li>• View/pure functions have lower gas costs</li>
                <li>• External calls and loops increase gas consumption</li>
                <li>• Consider optimizing high-gas functions</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GasEstimationPanel;
