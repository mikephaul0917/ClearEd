# Loading Components Documentation

This directory contains standardized loading components for the E-Clearance application to ensure consistent user experience and prevent layout shifts.

## Components

### LoadingSpinner
Standardized spinner component for various loading scenarios.

```tsx
import { LoadingSpinner } from '../components/ui';

<LoadingSpinner size="medium" color="primary" />
```

**Props:**
- `size`: 'small' | 'medium' | 'large' (default: 'medium')
- `color`: 'primary' | 'secondary' | 'inherit' (default: 'primary')
- `thickness`: number (default: 4)
- `className`: string

### InlineSpinner
Compact spinner for buttons and small actions.

```tsx
import { InlineSpinner } from '../components/ui';

<InlineSpinner color="#FFFFFF" />
```

**Props:**
- `color`: string (default: '#FFFFFF')

### Skeleton Components

#### ListSkeleton
For list items with avatars, text, and actions.

```tsx
import { ListSkeleton } from '../components/ui';

<ListSkeleton count={3} height={80} showAvatar showText showActions />
```

**Props:**
- `count`: number (default: 3)
- `height`: number (default: 80)
- `showAvatar`: boolean (default: true)
- `showText`: boolean (default: true)
- `showActions`: boolean (default: true)

#### TableSkeleton
For data grids and tables.

```tsx
import { TableSkeleton } from '../components/ui';

<TableSkeleton rows={5} columns={4} height={400} showHeader />
```

**Props:**
- `rows`: number (default: 5)
- `columns`: number (default: 4)
- `height`: number (default: 400)
- `showHeader`: boolean (default: true)

#### CardGridSkeleton
For card-based layouts.

```tsx
import { CardGridSkeleton } from '../components/ui';

<CardGridSkeleton cards={6} height={200} columns={{ xs: 1, sm: 2, md: 3 }} />
```

**Props:**
- `cards`: number (default: 6)
- `height`: number (default: 200)
- `columns`: object | number (default: responsive grid)

#### StatsSkeleton
For dashboard metrics and statistics.

```tsx
import { StatsSkeleton } from '../components/ui';

<StatsSkeleton count={4} height={100} />
```

**Props:**
- `count`: number (default: 4)
- `height`: number (default: 100)

#### PageHeaderSkeleton
For page headers with titles and actions.

```tsx
import { PageHeaderSkeleton } from '../components/ui';

<PageHeaderSkeleton showSubtitle showActions />
```

**Props:**
- `showSubtitle`: boolean (default: true)
- `showActions`: boolean (default: true)

#### FullPageSkeleton
Complete page loading skeleton.

```tsx
import { FullPageSkeleton } from '../components/ui';

<FullPageSkeleton 
  showHeader 
  showStats 
  showContent 
  contentType="cards" 
/>
```

**Props:**
- `showHeader`: boolean (default: true)
- `showStats`: boolean (default: true)
- `showContent`: boolean (default: true)
- `contentType`: 'cards' | 'table' | 'list' (default: 'cards')

## Usage Guidelines

### When to Use Skeletons vs Spinners

**Use Skeletons for:**
- Lists and tables (prevent layout shift)
- Card grids and dashboards
- Page content that takes time to load
- Any content with known structure

**Use Spinners for:**
- Button actions (form submissions, API calls)
- Small component loading states
- Indeterminate loading duration
- When content structure is unknown

### Best Practices

1. **Prevent Layout Shifts**: Always use skeletons for content with predictable structure
2. **Match Real Content**: Skeleton dimensions should match actual content dimensions
3. **Responsive Design**: Skeletons should adapt to different screen sizes
4. **Loading States**: Show skeletons immediately, replace with content when ready
5. **Error Handling**: Have fallback UI for when loading fails

### Implementation Examples

#### Page Loading
```tsx
const [loading, setLoading] = useState(true);

if (loading) {
  return <FullPageSkeleton contentType="table" />;
}

return <ActualPageContent />;
```

#### Button Loading
```tsx
const [submitting, setSubmitting] = useState(false);

<Button
  onClick={handleSubmit}
  disabled={submitting}
  startIcon={submitting ? <LoadingSpinner size="small" color="inherit" /> : null}
>
  {submitting ? 'Submitting...' : 'Submit'}
</Button>
```

#### List Loading
```tsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

if (loading) {
  return <ListSkeleton count={5} />;
}

return items.map(item => <ItemComponent key={item.id} item={item} />);
```

## Migration Guide

### Old Pattern (Avoid)
```tsx
// Bad: Causes layout shift
{loading ? <LinearProgress /> : <DataGrid data={data} />}
```

### New Pattern (Recommended)
```tsx
// Good: Prevents layout shift
{loading ? <TableSkeleton rows={10} columns={6} /> : <DataGrid data={data} />}
```

### Old Pattern (Avoid)
```tsx
// Bad: Inline SVG spinner
{loading && (
  <svg width="13" height="13" viewBox="0 0 24 24" ...>
    {/* Complex SVG code */}
  </svg>
)}
```

### New Pattern (Recommended)
```tsx
// Good: Standardized component
{loading && <InlineSpinner />}
```

## Styling

All components use Material-UI's design system and are fully themeable. They automatically adapt to:
- Light/dark theme
- Responsive breakpoints
- Custom color schemes
- Typography scales

## Performance Considerations

- Skeletons have minimal performance overhead
- Use CSS animations instead of JavaScript where possible
- Avoid re-creating skeleton components on every render
- Memoize skeleton props when appropriate
