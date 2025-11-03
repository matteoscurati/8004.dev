# UI Changes - Search and Filters Separation

## Overview
The search interface has been redesigned to clearly separate the search functionality from filters, improving usability and user experience.

## Changes Made

### 1. Separated Search Bar
- **Location**: Top section with prominent placement
- **Functionality**: Search by agent name
- **Interaction**:
  - Press Enter in the input field to search
  - Click "> SEARCH" button to search
  - Immediate search execution

### 2. Collapsible Filters Section
- **Default State**: Collapsed (hidden)
- **Toggle Button**: "▶ SHOW" / "▼ HIDE" button
- **Active Indicator**: Pulsing blue dot (●) appears when filters are active but hidden

### 3. Available Filters
When expanded, users can filter by:
- **MCP Tools**: Comma-separated list of required tools
- **A2A Skills**: Comma-separated list of required skills
- **Active Agents Only**: Checkbox filter
- **x402 Support Only**: Checkbox filter

### 4. Actions
- **> SEARCH**: In search bar (searches by name)
- **> APPLY FILTERS**: In filters section (applies all filters)
- **> RESET ALL**: Clears all search terms and filters

## User Flow

### Basic Search
```
1. User types agent name in search bar
2. Presses Enter or clicks "> SEARCH"
3. Results display immediately
```

### Advanced Filtering
```
1. User clicks "▶ SHOW" to expand filters
2. Enters filter criteria (tools, skills, checkboxes)
3. Clicks "> APPLY FILTERS"
4. Results update with combined search + filters
5. User can click "▼ HIDE" to collapse filters
   - Blue dot (●) indicates active filters are hidden
```

### Reset
```
1. User clicks "> RESET ALL"
2. All search terms and filters are cleared
3. Shows all agents (no filters)
```

## Visual Design

### Search Bar
```
┌──────────────────────────────────────────────────┐
│             [ SEARCH ]                           │
│  ┌──────────────────────┐  ┌──────────┐        │
│  │ Search by name...    │  │ > SEARCH │        │
│  └──────────────────────┘  └──────────┘        │
└──────────────────────────────────────────────────┘
```

### Filters (Collapsed)
```
┌──────────────────────────────────────────────────┐
│  [ FILTERS ] ●          ▶ SHOW                   │
└──────────────────────────────────────────────────┘
```

### Filters (Expanded)
```
┌──────────────────────────────────────────────────┐
│  [ FILTERS ]            ▼ HIDE                   │
│                                                  │
│  MCP Tools:                                      │
│  ┌──────────────────────────────────────────┐  │
│  │ tool1, tool2, tool3...                    │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  A2A Skills:                                     │
│  ┌──────────────────────────────────────────┐  │
│  │ skill1, skill2, skill3...                 │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ☐ Active Agents Only                           │
│  ☐ x402 Support Only                            │
│                                                  │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │ > APPLY FILTERS  │  │ > RESET ALL      │   │
│  └──────────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────┘
```

## Benefits

1. **Clearer UX**: Distinct separation between search and filters
2. **Cleaner Interface**: Filters hidden by default, reducing visual clutter
3. **Better Performance**: Quick search without opening filters
4. **Visual Feedback**: Active filter indicator when collapsed
5. **Flexible**: Users can combine search and filters or use them independently

## Technical Implementation

### Components Modified
- `src/lib/components/SearchFilters.svelte`

### Key Features
- Svelte 5 `$state` runes for reactive state management
- Collapsible sections with smooth transitions
- Active filter detection and badge display
- Consistent pixel-art styling

### State Management
```typescript
let name = $state('');              // Search term
let mcpToolsInput = $state('');     // MCP tools filter
let a2aSkillsInput = $state('');    // A2A skills filter
let activeOnly = $state(false);     // Active agents checkbox
let x402Only = $state(false);       // x402 support checkbox
let filtersExpanded = $state(false); // Collapse/expand state
```
