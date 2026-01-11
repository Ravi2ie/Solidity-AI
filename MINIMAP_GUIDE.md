# Enhanced Minimap Navigation

The minimap has been completely redesigned to work like VSCode with advanced navigation features.

## Features

### 1. **VSCode-Style Viewport Indicator**
- Shows a highlighted box representing your current view in the editor
- The box resizes based on how much of the file is visible
- Smooth visual feedback as you scroll

### 2. **Multiple Navigation Methods**

#### Click Navigation
- Click anywhere on the minimap to jump to that location
- Includes smooth easing animation for better UX
- Click in the middle of the minimap to center that view in the editor

#### Drag Navigation
- Click and drag on the minimap to scroll smoothly
- Provides the most intuitive navigation for large files
- Real-time scrolling as you drag
- "Scrolling..." tooltip appears while dragging

#### Hover Preview
- A thin line appears under your cursor showing where you'll jump
- Helps you see the exact location before clicking
- Works in both click and drag modes

### 3. **Syntax-Aware Coloring**
The minimap uses color coding to help you navigate by code structure:

- **Orange** - Imports and pragmas
- **Green** - Contract/function/modifier declarations  
- **Red** - Security-critical code (require, revert, assert)
- **Purple** - Complex declarations (events, enums, structs)
- **Blue** - Type declarations (uint, address, bool, etc.)
- **Yellow** - Visibility modifiers (public, private, internal)
- **Gray** - Comments and default code

### 4. **Cursor Position Indicator**
- A red line shows your current cursor position
- Updates in real-time as you type
- Helps you track where you are in the file

### 5. **Smart Density Visualization**
- Line opacity varies based on code density
- Longer lines appear darker/more opaque
- Helps visually identify dense code blocks

### 6. **Theme Support**
- Automatically adapts to dark/light themes
- Colors and backgrounds change with your theme selection
- Smooth transitions between themes

### 7. **Real-time Statistics**
Shows at the bottom:
- Total number of lines
- Percentage of file remaining below current view

## How to Use

### Navigation
1. **Quick Jump**: Click on any part of the minimap to jump there
2. **Smooth Scroll**: Click and drag to navigate smoothly through the file
3. **Hover Preview**: Hover over the minimap to see where you'll jump

### Interpreting the Colors
- Look for **red lines** to find security-critical code
- Look for **orange sections** to find imports
- Look for **green sections** to find function definitions
- Look for **purple sections** to find complex declarations

### Optimal Usage
- Use for large contracts (> 100 lines)
- Use to navigate between functions quickly
- Use drag for smooth scrolling in long files
- Use colors to understand code structure at a glance

## Technical Implementation

### File: `src/components/ide/CodeMinimap.tsx`
- Canvas-based rendering for performance
- Real-time synchronization with editor scroll
- Smooth easing animations
- Cursor tracking

### File: `src/utils/minimapUtils.ts`
Utility functions:
- `getSyntaxColor()` - Returns color based on code content
- `calculateLineDensity()` - Calculates opacity based on line length
- `isEmptyLine()` - Checks if line is empty
- `smoothScroll()` - Easing function for smooth navigation

## Performance

- **Canvas Rendering**: Uses HTML Canvas for high-performance rendering
- **Lazy Updates**: Only redraws when code or scroll position changes
- **Debounced Events**: Optimized event handling
- **Pixelated Rendering**: Improves visual clarity for small blocks

## Keyboard Integration

While the minimap itself doesn't have keyboard shortcuts, it works with:
- **Ctrl+G** (or Cmd+G): Go to line in editor (if implemented)
- Scroll wheel: Standard editor scrolling
- Arrow keys: Standard editor navigation

## Customization Tips

To adjust minimap appearance:

1. **Change Width**: Modify `width={80}` in canvas element
2. **Change Height**: Modify `height={600}` in canvas element
3. **Adjust Colors**: Edit `getSyntaxColor()` in `minimapUtils.ts`
4. **Change Opacity**: Modify `globalAlpha` values in draw function

## Advanced Features

### Smooth Scroll Animation
Uses easing function for natural movement:
```
easeInOutQuad(t) = t < 0.5 ? 2*t*t : -1+(4-2*t)*t
```
Duration: 250ms (adjustable)

### Cursor Tracking
Automatically updates when:
- User clicks in editor
- User types (updates cursor position)
- User navigates with arrow keys

### Dynamic Viewport
- Recalculates on scroll
- Shows proportional view of file
- Minimum height of 15px

## Best Practices

1. Use the minimap for files > 50 lines
2. Use drag navigation for smooth scrolling in large files
3. Use click navigation for quick jumps
4. Reference colors to understand code structure
5. Watch for red indicators (security issues)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Minimap not updating | Check if `.editor-wrapper` class exists |
| Colors look wrong | Verify theme is applied correctly |
| Scrolling feels slow | Try increasing canvas height |
| Can't see cursor line | Check if cursor is in visible range |

## Future Enhancements

- [ ] Minimap search highlighting
- [ ] Jump to error/warning on minimap
- [ ] Code folding indicators
- [ ] Breakpoint indicators
- [ ] Git diff highlighting
- [ ] Custom color schemes
- [ ] Minimap zoom levels
