# Home Staff 360 - Design System v4.0
## "Simple, Sync, Harmony, Sleek, Sober, Same"

### Design Philosophy

**Fusion Approach**: Samsung One UI (warmth, reachability, spacious layouts) + Microsoft Fluent UI (subtle depth, clean geometry, cohesive motion)

**The Six Principles**:
1. **Simple** - Reduce cognitive load; one clear action per context
2. **Sync** - Visual rhythm through consistent spacing and alignment
3. **Harmony** - Colors, typography, and spacing work together as one system
4. **Sleek** - Refined corners, subtle shadows, premium feel
5. **Sober** - Restrained palette; no excessive decoration or animation
6. **Same** - Identical patterns across all screens and modes

---

## Design Tokens

### Spacing Scale (8pt Grid)
All spacing uses multiples of 4px for micro, 8px for standard:

| Token | Value | Use Case |
|-------|-------|----------|
| `space-0` | 0px | Reset |
| `space-1` | 4px | Icon-text gap, tight spacing |
| `space-2` | 8px | Inline elements, small gaps |
| `space-3` | 12px | Card internal padding, list gaps |
| `space-4` | 16px | Container padding, form gaps |
| `space-5` | 20px | Section separators |
| `space-6` | 24px | Major section gaps |
| `space-8` | 32px | Page margins |
| `space-10` | 40px | Hero spacing |

**Tailwind Classes**: Use `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `p-3`, `p-4`, etc.

---

### Typography Scale

| Level | Size | Weight | Line Height | Letter Spacing | Class |
|-------|------|--------|-------------|----------------|-------|
| Display | 28px | Bold (700) | 36px | -0.5px | `text-2xl font-bold` |
| H1 | 24px | SemiBold (600) | 32px | -0.3px | `text-xl font-semibold` |
| H2 | 20px | SemiBold (600) | 28px | -0.2px | `text-lg font-semibold` |
| H3 | 18px | Medium (500) | 24px | 0 | `text-base font-medium` |
| Body | 16px | Regular (400) | 24px | 0 | `text-base` |
| Body Small | 14px | Regular (400) | 20px | 0 | `text-sm` |
| Caption | 12px | Medium (500) | 16px | 0.1px | `text-xs font-medium` |
| Overline | 11px | SemiBold (600) | 16px | 0.5px | `text-[11px] font-semibold uppercase tracking-wide` |

**Minimum readable size**: 12px (caption/badges only). Body text minimum: 14px.

---

### Color Palette

#### Light Mode
```
Primary:        #0B57D0 (hsl 214 89% 43%)    - Trust, action
Primary Hover:  #094AB8                       - Pressed state
Primary Light:  #E8F0FE (hsl 214 89% 96%)    - Subtle backgrounds

Background:     #FFFFFF                       - Page background
Surface:        #F7F9FC (hsl 220 25% 98%)    - Cards, panels
Border:         #E3E8EF (hsl 220 13% 90%)    - Dividers
Input Border:   #CDD5DF (hsl 220 13% 85%)    - Form fields

Text Primary:   #1C1C1E                       - Headlines, values
Text Secondary: #5F6368                       - Body copy
Text Tertiary:  #9AA0A6                       - Captions, metadata

Success:        #1E8E3E                       - Positive states
Warning:        #E37400                       - Attention needed
Error:          #C5221F                       - Critical/negative
Info:           #1A73E8                       - Informational
```

#### Dark Mode
```
Primary:        #4285F4 (hsl 214 91% 60%)    - Brighter for contrast
Primary Light:  #1E3A5F                       - Subtle backgrounds

Background:     #121416 (hsl 220 13% 8%)     - Deep surface
Surface:        #1E2124 (hsl 220 13% 11%)    - Cards
Border:         #2D3238 (hsl 220 13% 18%)    - Dividers
Input Border:   #3D444D (hsl 220 13% 25%)    - Form fields

Text Primary:   #E8EAED                       - High contrast
Text Secondary: #9AA0A6                       - Medium contrast
Text Tertiary:  #6B7280                       - Low contrast

Status colors adjust +10% lightness for visibility
```

---

### Border Radius

| Token | Value | Use Case |
|-------|-------|----------|
| `radius-sm` | 4px | Badges, chips |
| `radius-md` | 6px | Buttons, inputs, small cards |
| `radius-lg` | 8px | Standard cards, modals |
| `radius-xl` | 12px | Feature cards, dialogs |
| `radius-full` | 50% | Icons, avatars, status dots |

**Classes**: `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

---

### Elevation (Shadows)

| Level | Shadow | Use Case |
|-------|--------|----------|
| 0 | none | Flat elements |
| 1 | `shadow-soft` | Cards at rest |
| 2 | `shadow-soft-md` | Hovered cards, dropdowns |
| 3 | `shadow-soft-lg` | Modals, dialogs |
| 4 | `shadow-2xl` | FAB, floating elements |

**Shadow color**: Primary-tinted in light mode, black in dark mode for depth.

---

### Motion

| Type | Duration | Easing | Use Case |
|------|----------|--------|----------|
| Instant | 0ms | - | Toggles, checkboxes |
| Fast | 100ms | ease-out | Button press feedback |
| Normal | 200ms | ease-out | Transitions, reveals |
| Slow | 300ms | ease-in-out | Page transitions, modals |

**Principle**: Motion should be subtle and purposeful. Avoid decorative animations.

---

## Component Standards

### Buttons

**Variants**:
- `default` (Primary): Blue background, white text - Primary actions
- `secondary`: Light background, dark text - Secondary actions
- `outline`: Border only, transparent - Tertiary actions
- `ghost`: No background/border - Icon buttons, subtle actions
- `destructive`: Red background - Delete, danger actions

**Sizes**:
- `sm`: 32px height (min-h-8), 12px horizontal padding
- `default`: 36px height (min-h-9), 16px horizontal padding
- `lg`: 40px height (min-h-10), 24px horizontal padding
- `icon`: 36px x 36px square (h-9 w-9)

**Styling**:
```
Border radius: rounded-md (6px)
Font: 14px Medium
Icon + text gap: 8px (gap-2)
Min touch target: 44px
```

**States**: Built-in `hover-elevate` and `active-elevate-2` classes handle all states.

---

### Input Fields

**Dimensions**:
```
Height: 36px (h-9)
Padding: 8px 12px (px-3 py-2)
Border radius: rounded-md (6px)
Border: 1px solid var(--input)
```

**States**:
- Default: Input border color
- Focus: 2px ring with primary color
- Error: Red border + error text below
- Disabled: 50% opacity, no pointer events

**Field Layout**:
```
Label: text-sm font-medium, mb-1.5
Input: h-9 rounded-md
Helper/Error: text-xs mt-1
Gap between fields: gap-4 (16px)
```

---

### Cards

**Standard Card**:
```
Background: var(--card)
Border: 1px solid var(--card-border)
Border radius: rounded-lg (8px)
Padding: p-4 (16px)
Shadow: shadow-card (subtle)
```

**Card Content Spacing**:
```
Title to content: mb-3 (12px)
Content items gap: gap-3 (12px)
Icon to text: gap-2 (8px)
```

**Interactive Cards**: Add `hover-elevate cursor-pointer` for clickable cards.

---

### Icon Halos

Circular containers for icons with semantic coloring:

```css
.icon-halo-primary    /* Blue - primary actions */
.icon-halo-success    /* Green - positive states */
.icon-halo-warning    /* Orange - attention */
.icon-halo-destructive /* Red - danger */
.icon-halo-info       /* Light blue - information */
.icon-halo-muted      /* Gray - neutral/default */
```

**Sizes**:
- Small: `w-9 h-9` - List avatars
- Default: `w-10 h-10` - Stats, actions
- Large: `w-12 h-12` - Feature highlights

**Usage**:
```tsx
<div className="icon-halo-primary w-10 h-10">
  <Users className="w-5 h-5 text-primary" />
</div>
```

---

### Badges

**Variants**:
- `default`: Primary background - Status tags
- `secondary`: Muted background - Categories
- `outline`: Border only - Counts, labels
- `destructive`: Red - Alerts, errors

**Size**: Small height with `text-xs font-medium` and tight padding.

---

### Navigation

**Header (Top Bar)**:
```
Height: 56px
Padding: px-4 py-3
Background: transparent (inherits page bg)
Border: optional bottom border
```

**Content Container**:
```
Horizontal padding: px-4 (16px)
Max content width: none (full width on mobile)
```

**Bottom Tab Bar**:
```
Height: 64px + safe area
Items: 4-5 maximum
Touch target: 48px minimum per item
Active: Primary color icon + label
Inactive: Muted foreground
```

---

## Layout Patterns

### Screen Structure
```
[Safe Area - 24px top]
[Header - 56px]
  - Back button + Title + Right actions
  - Subtitle optional
[Scrollable Content]
  - Horizontal padding: 16px
  - Section gaps: 24px
  - Card gaps: 12px
  - Bottom padding: 24px + tab bar height
[Bottom Navigation - 64px + safe area]
```

### Form Layout
```
Field groups: gap-4 (16px)
Related fields inline: grid grid-cols-2 gap-3
Section headers: mt-6 mb-3
Action buttons: mt-6, full width or flex with gap-3
```

### List Layout
```
Card list: flex flex-col gap-3
Grid (2-col): grid grid-cols-2 gap-3
Grid (3-col): grid grid-cols-3 gap-3
Grid (4-col): grid grid-cols-4 gap-2
```

---

## Dark Mode

**Strategy**: All colors defined in CSS variables with `.dark` overrides.

**Key Adjustments**:
- Backgrounds darken, surfaces get lighter border contrast
- Text colors invert (dark on light to light on dark)
- Primary colors brighten for visibility
- Shadows shift from color-tinted to pure black
- Status colors increase saturation/lightness

**Implementation**: Theme toggle stores preference in localStorage, adds/removes `.dark` class on `<html>`.

---

## Accessibility

- **Touch targets**: 44px minimum for all interactive elements
- **Color contrast**: 4.5:1 for body text, 3:1 for large text
- **Focus indicators**: Visible ring on all focusable elements
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Screen readers**: Semantic HTML, ARIA labels where needed

---

## Implementation Checklist

When building or reviewing screens:

1. [ ] Spacing uses 8pt grid (4, 8, 12, 16, 24, 32px)
2. [ ] Typography follows scale (no arbitrary font sizes)
3. [ ] Colors use semantic tokens (--primary, --muted, etc.)
4. [ ] Cards use `rounded-lg`, buttons/inputs use `rounded-md`
5. [ ] Icon containers use `icon-halo-*` classes
6. [ ] Interactive elements have `hover-elevate` behavior
7. [ ] All text is minimum 12px (14px for body)
8. [ ] Touch targets are minimum 44px
9. [ ] Dark mode works correctly
10. [ ] Same pattern used across Home/Staff modes

---

## Enforced Component Patterns (v4.1 Audit)

These patterns are strictly enforced across all HOME and STAFF mode screens:

### Header Component

Always pass both `contextLabel` AND `contextMode` props when using the Header with active context:

```tsx
const { contextLabel, contextMode } = useActiveContext();

<Header
  title={t("screenTitle")}
  subtitle={t("screenSubtitle")}
  onBack={() => navigate("home")}
  contextLabel={contextLabel}
  contextMode={contextMode}
/>
```

### Empty State Pattern

All empty states must follow this exact structure:

```tsx
<Card className="p-4 flex flex-col items-center gap-2" data-testid="empty-state">
  <div className="icon-halo-muted w-10 h-10">
    <Icon className="w-5 h-5 text-muted-foreground" />
  </div>
  <div className="text-center">
    <h3 className="font-semibold text-sm">{t("emptyTitle")}</h3>
    <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>
  </div>
  <Button onClick={handleAdd} data-testid="button-add-first">
    <span className="mr-2">+</span>
    {t("addButtonLabel")}
  </Button>
</Card>
```

### List Item Pattern

Standard list items use consistent spacing and icon halos:

```tsx
<div className="flex flex-col gap-1.5" data-testid="list-items">
  {items.map((item) => (
    <div
      key={item.id}
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg border bg-card hover-elevate cursor-pointer"
      onClick={() => handleItemClick(item.id)}
      data-testid={`card-item-${item.id}`}
    >
      <div className="icon-halo-primary w-9 h-9 shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold text-sm">{item.value}</p>
        <p className="text-xs text-muted-foreground">{item.label}</p>
      </div>
    </div>
  ))}
</div>
```

### Delete Confirmation Modal

Always use `ConfirmModal` component, never `AlertDialog` directly:

```tsx
<ConfirmModal
  open={!!deleteTarget}
  onOpenChange={() => setDeleteTarget(null)}
  title={t("confirmDelete")}
  description={t("cannotBeUndone")}
  confirmText={t("delete")}
  cancelText={t("cancel")}
  variant="destructive"
  onConfirm={handleDelete}
/>
```

### Dashboard Module Grid

Module cards on dashboards use consistent 2-column layout:

```tsx
<div className="grid grid-cols-2 gap-2" data-testid="module-grid">
  {modules.map((module) => (
    <Card
      key={module.route}
      className="p-3 flex items-center gap-3 hover-elevate cursor-pointer"
      onClick={() => navigate(module.route)}
    >
      <div className={`icon-halo-${module.color} w-9 h-9`}>
        <module.icon className={`w-4.5 h-4.5 text-${module.color}`} />
      </div>
      <div>
        <h3 className="font-medium text-sm">{module.title}</h3>
        <p className="text-xs text-muted-foreground">{module.description}</p>
      </div>
    </Card>
  ))}
</div>
```

### Overview/Stats Cards

Stats displayed in dashboard overview sections:

```tsx
<div className="grid grid-cols-2 gap-2">
  <Card className="p-2.5 text-center">
    <p className="text-lg font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </Card>
</div>
```

### Spacing Standards

| Context | Gap Class | Description |
|---------|-----------|-------------|
| List items | `gap-1.5` | Between cards in vertical lists |
| Module grid | `gap-2` | Between dashboard module cards |
| Sections | `gap-3` | Between major content sections |
| Form fields | `gap-4` | Between form input groups |

### Icon Halo Sizes

| Context | Size Class | Icon Size |
|---------|------------|-----------|
| List avatars | `w-9 h-9` | `w-4 h-4` or `w-4.5 h-4.5` |
| Empty states | `w-10 h-10` | `w-5 h-5` |
| Feature highlights | `w-12 h-12` | `w-6 h-6` |

---

## Quick Reference

**Common Patterns**:
```tsx
// Card with icon and content
<Card className="p-4">
  <div className="flex items-start gap-3">
    <div className="icon-halo-primary w-10 h-10">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold truncate">Title</h3>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
  </div>
</Card>

// Form field
<div className="flex flex-col gap-1.5">
  <Label>Field Name</Label>
  <Input placeholder="Enter value" />
</div>

// Action buttons
<div className="flex gap-3 mt-6">
  <Button variant="outline" className="flex-1">Cancel</Button>
  <Button className="flex-1">Save</Button>
</div>

// Stat card
<Card className="p-3">
  <div className="flex items-center gap-2">
    <div className="icon-halo-success w-9 h-9">
      <CheckIcon className="w-4 h-4 text-success" />
    </div>
    <div>
      <p className="text-lg font-semibold">42</p>
      <p className="text-xs text-muted-foreground">Active</p>
    </div>
  </div>
</Card>
```

---

*Design System v4.0 - Samsung One UI + Microsoft Fluent UI*
*Crafted by The Team 360*
