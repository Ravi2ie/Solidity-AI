import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useIDEStore } from '@/store/ideStore';
import { cn } from '@/lib/utils';

const BreadcrumbNavigation: React.FC = () => {
  const { activeFileId, files } = useIDEStore();

  const activeFile = files.find((f) => f.id === activeFileId);
  
  // Build breadcrumb from file folder path and filename
  const breadcrumbs: Array<{ label: string; href: string; isLast: boolean }> = [
    { label: 'Solidity IDE', href: '#', isLast: false },
  ];

  if (activeFile) {
    // Add folder path if it exists
    if (activeFile.folderPath) {
      const folderParts = activeFile.folderPath.split('/').filter(Boolean);
      folderParts.forEach((part, index) => {
        breadcrumbs.push({
          label: part,
          href: '#',
          isLast: index === folderParts.length - 1 && true,
        });
      });
    }

    // Add the file name as the last breadcrumb
    breadcrumbs.push({
      label: activeFile.name,
      href: '#',
      isLast: true,
    });
  } else {
    breadcrumbs[0].isLast = true;
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 bg-card border-b border-border text-sm overflow-x-auto">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-1 min-w-fit">
          <button
            className={cn(
              'px-2 py-1 rounded transition-colors',
              index === 0 ? 'text-primary font-medium' : '',
              crumb.isLast ? 'text-foreground' : ''
            )}
          >
            {crumb.label}
          </button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
};

export default BreadcrumbNavigation;
