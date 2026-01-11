import React, { useMemo } from 'react';
import { tokenizeSolidity } from '@/utils/solidityAnalyzer';
import { cn } from '@/lib/utils';

interface SyntaxHighlighterProps {
  code: string;
  className?: string;
}

const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({ code, className }) => {
  const tokens = useMemo(() => tokenizeSolidity(code), [code]);

  const getColorClass = (type: string) => {
    switch (type) {
      case 'keyword':
        return 'text-keyword'; // Pink/Magenta
      case 'type':
        return 'text-type-keyword'; // Light blue
      case 'function':
        return 'text-function'; // Yellow
      case 'string':
        return 'text-string'; // Green
      case 'comment':
        return 'text-comment'; // Gray
      case 'number':
        return 'text-number'; // Orange
      case 'operator':
        return 'text-operator'; // Light gray
      case 'variable':
        return 'text-foreground';
      default:
        return 'text-foreground';
    }
  };

  return (
    <pre className={cn('font-mono text-sm overflow-hidden', className)}>
      <code>
        {tokens.map((token, idx) => (
          <span key={idx} className={getColorClass(token.type)}>
            {token.value}
          </span>
        ))}
      </code>
    </pre>
  );
};

export default SyntaxHighlighter;
