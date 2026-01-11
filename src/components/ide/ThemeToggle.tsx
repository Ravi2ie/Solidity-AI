import React, { useEffect, useState, useCallback } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ThemeMode = 'dark' | 'light' | 'system';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [mounted, setMounted] = useState(false);
  const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light'>('dark');

  const getEffectiveTheme = useCallback((mode: ThemeMode): 'dark' | 'light' => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }, []);

  const applyEffectiveTheme = useCallback((effective: 'dark' | 'light') => {
    const root = document.documentElement;
    if (effective === 'light') {
      root.classList.add('light-theme');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('light-theme');
      root.style.colorScheme = 'dark';
    }
    setEffectiveTheme(effective);
  }, []);

  const applyTheme = useCallback((newTheme: ThemeMode) => {
    const effective = getEffectiveTheme(newTheme);
    applyEffectiveTheme(effective);
    localStorage.setItem('ide-theme', newTheme);
  }, [getEffectiveTheme, applyEffectiveTheme]);

  useEffect(() => {
    setMounted(true);
    // Check localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('ide-theme') as ThemeMode | null;
    const initialTheme = (savedTheme || 'dark') as ThemeMode;
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [applyTheme]);

  useEffect(() => {
    if (theme === 'system') {
      // Listen for system theme changes only when in system mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newEffective = e.matches ? 'dark' : 'light';
        applyEffectiveTheme(newEffective);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyEffectiveTheme]);

  const handleThemeChange = useCallback((newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  if (!mounted) return null;

  const getIcon = () => {
    if (theme === 'system') return <Monitor className="w-4 h-4" />;
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    return <Sun className="w-4 h-4" />;
  };

  const getLabel = () => {
    if (theme === 'system') return 'System';
    if (theme === 'dark') return 'Dark';
    return 'Light';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            'hover:bg-muted text-muted-foreground hover:text-foreground',
            'group relative'
          )}
          title="Theme selector"
        >
          {getIcon()}
          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {getLabel()} Theme
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() => handleThemeChange('light')}
          className={cn(theme === 'light' && 'bg-accent text-accent-foreground')}
        >
          <Sun className="w-4 h-4 mr-2" />
          <span>Light</span>
          {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('dark')}
          className={cn(theme === 'dark' && 'bg-accent text-accent-foreground')}
        >
          <Moon className="w-4 h-4 mr-2" />
          <span>Dark</span>
          {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange('system')}
          className={cn(theme === 'system' && 'bg-accent text-accent-foreground')}
        >
          <Monitor className="w-4 h-4 mr-2" />
          <span>System</span>
          {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
