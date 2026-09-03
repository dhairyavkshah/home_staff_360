# Home Staff 360 - Design System v5.2
## Microsoft Fluent 2 Design Philosophy

### Design Philosophy

**Fluent 2 Core Principles**:
1. **Clarity** - Clear visual hierarchy with purposeful use of space
2. **Consistency** - Unified patterns across all screens and modes
3. **Efficiency** - Streamlined interactions that respect user time
4. **Adaptability** - Seamless light/dark mode with accessible contrast
5. **Subtlety** - Refined micro-interactions without distraction
6. **Depth** - Layered surfaces with subtle elevation

---

## Design Tokens

### Spacing Scale (4px Base Unit)
Fluent 2 uses a 4px base unit with predictable scale:

| Token | Value | Use Case |
|-------|-------|----------|
| `size-1` | 4px | Minimal spacing, icon gaps |
| `size-2` | 8px | Tight padding, inline gaps |
| `size-3` | 12px | Component margins |
| `size-4` | 16px | Card padding, form gaps |
| `size-5` | 20px | Section padding |
| `size-6` | 24px | Major section gaps |
| `size-8` | 32px | Large gaps, page margins |

**Tailwind Classes**: `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px), `p-3`, `p-4`, etc.

---

### Typography Scale (Fluent 2 Type Ramp)

| Level | Size | Weight | Line Height | Class |
|-------|------|--------|-------------|-------|
| Display | 28px | Bold (700) | 36px | `text-2xl font-bold` |
| Title Large | 20px | SemiBold (600) | 28px | `text-xl font-semibold` |
| Title Medium | 16px | SemiBold (600) | 24px | `text-base font-semibold` |
| Body Large | 16px | Regular (400) | 24px | `text-base` |
| Body | 14px | Regular (400) | 20px | `text-sm` |
| Caption | 12px | Medium (500) | 16px | `text-xs font-medium` |
| Caption Small | 11px | Medium (500) | 14px | `text-[11px] font-medium` |

**Font Family**: Segoe UI Variable, -apple-system, system-ui, sans-serif

---

### Color Palette (Fluent 2 Tokens)

#### Light Mode
```
Brand Primary:     #0078D4 (hsl 206 100% 42%)  - Primary actions
Brand Hover:       #106EBE                      - Hover state
Brand Pressed:     #005A9E                      - Pressed state

Background 1:      #FFFFFF                      - Page background
Background 2:      #FAFAFA                      - Subtle surface
Background 3:      #F5F5F5                      - Cards, panels

Foreground 1:      #242424                      - Primary text
Foreground 2:      #616161                      - Secondary text
Foreground 3:      #8A8A8A                      - Tertiary text

Stroke 1:          #E0E0E0                      - Borders, dividers
Stroke 2:          #D1D1D1                      - Stronger borders

Success:           #107C10                      - Positive states
Warning:           #FFB900                      - Attention needed
Error:             #D13438                      - Critical/negative
Info:              #0078D4                      - Informational
```

#### Dark Mode
```
Brand Primary:     #2899F5 (hsl 206 90% 56%)   - Brighter for contrast
Brand Hover:       #3AA0F3
Brand Pressed:     #0078D4

Background 1:      #1B1B1B                      - Page background
Background 2:      #202020                      - Subtle surface
Background 3:      #292929                      - Cards, panels

Foreground 1:      #FFFFFF                      - Primary text
Foreground 2:      #D6D6D6                      - Secondary text
Foreground 3:      #ADADAD                      - Tertiary text

Stroke 1:          #3D3D3D                      - Borders
Stroke 2:          #4D4D4D                      - Stronger borders
```

---

### Border Radius (Fluent 2 Corners)

| Token | Value | Use Case |
|-------|-------|----------|
| `radius-none` | 0px | Sharp edges |
| `radius-sm` | 2px | Subtle rounding |
| `radius-md` | 4px | Buttons, inputs, controls |
| `radius-lg` | 8px | Cards, panels |
| `radius-xl` | 12px | Large surfaces, dialogs |
| `radius-full` | 9999px | Pills, avatars |

**Classes**: `rounded-sm` (2px), `rounded` (4px), `rounded-lg` (8px), `rounded-xl` (12px)

---

### Elevation (Fluent 2 Shadows)

| Level | Shadow | Use Case |
|-------|--------|----------|
| Level 1 | `shadow-sm` | Subtle lift |
| Level 2 | `shadow` | Cards at rest |
| Level 3 | `shadow-md` | Hovered elements |
| Level 4 | `shadow-lg` | Dropdowns, menus |
| Level 5 | `shadow-xl` | Dialogs, modals |

**Shadow Style**: Neutral black shadows with low opacity for clean look

---

### Motion (Fluent 2 Timing)

| Type | Duration | Easing | Use Case |
|------|----------|--------|----------|
| Ultra Fast | 50ms | ease-out | Checkboxes, toggles |
| Fast | 100ms | ease-out | Button feedback |
| Normal | 200ms | ease-in-out | Transitions |
| Slow | 300ms | ease-in-out | Page transitions |
| Slower | 400ms | ease-in-out | Complex reveals |

**Easing**: `cubic-bezier(0.33, 0, 0.67, 1)` for deceleration

---

## Component Standards

### Buttons (Fluent 2)

**Variants**:
- `default` (Filled): Brand background, white text - Primary actions
- `secondary` (Subtle): Light fill, dark text - Secondary actions
- `outline`: Border only - Tertiary actions
- `ghost` (Transparent): No background - Icon buttons, minimal
- `destructive`: Red fill - Danger actions

**Sizes**:
- `sm`: 28px height, 8px horizontal padding
- `default`: 32px height, 12px horizontal padding
- `lg`: 40px height, 20px horizontal padding
- `icon`: 32px x 32px square

**Styling**:
```
Border radius: 4px (rounded)
Font: 14px SemiBold
Icon + text gap: 8px
Min touch target: 44px
Focus ring: 2px brand color
```

---

### Input Fields (Fluent 2)

**Dimensions**:
```
Height: 32px
Padding: 0 12px
Border radius: 4px
Border: 1px solid stroke color
```

**States**:
- Rest: Neutral stroke
- Hover: Darker stroke
- Focus: 2px brand color bottom border
- Error: Red stroke + error text
- Disabled: 40% opacity

**Field Layout**:
```
Label: 14px SemiBold, mb-1
Input: 32px height, rounded
Helper/Error: 12px, mt-1
Gap between fields: 16px
```

---

### Cards (Fluent 2)

**Standard Card**:
```
Background: Surface layer
Border: 1px solid stroke
Border radius: 8px (rounded-lg)
Padding: 16px
Shadow: Level 2 (subtle)
```

**Interactive Cards**:
```
Hover: Shadow Level 3
Active: Shadow Level 2, slight scale
Transition: 200ms ease
```

---

### Icon Containers (Fluent 2)

Subtle background circles with semantic colors:

```css
.icon-container-primary    /* Brand blue fill */
.icon-container-success    /* Green fill */
.icon-container-warning    /* Amber fill */
.icon-container-error      /* Red fill */
.icon-container-neutral    /* Gray fill */
```

**Sizes**:
- Small: `w-8 h-8` with `w-4 h-4` icon
- Default: `w-10 h-10` with `w-5 h-5` icon
- Large: `w-12 h-12` with `w-6 h-6` icon

**Style**: Solid fill at 10% opacity, no border, no shadow

---

### Navigation (Fluent 2 Command Bar)

**Header**:
```
Height: 48px
Background: Background 1
Border: 1px bottom stroke
Layout: Back button | Title | Actions
Title: 16px SemiBold
```

**Content Container**:
```
Horizontal padding: 16px
Max width: none (full mobile)
```

---

## Layout Patterns

### Screen Structure
```
[Header - 48px]
  - Back icon + Title + Right actions
[Content Area]
  - Padding: 16px horizontal
  - Section gaps: 24px
  - Card gaps: 12px
[Safe Area Bottom]
```

### Form Layout
```
Field groups: gap-4 (16px)
Inline fields: grid grid-cols-2 gap-3
Section headers: mt-6 mb-2
Action buttons: mt-6, flex gap-3
```

---

## Dark Mode

**Strategy**: CSS variables with `.dark` class overrides

**Key Adjustments**:
- Backgrounds shift from light grays to dark grays
- Text inverts from dark to light
- Brand color brightens for visibility
- Shadows use pure black at higher opacity
- Borders brighten slightly for visibility

---

## Accessibility

- **Touch targets**: 44px minimum
- **Color contrast**: 4.5:1 for text, 3:1 for UI components
- **Focus indicators**: 2px brand color ring
- **Reduced motion**: Respect `prefers-reduced-motion`

---

## Quick Reference

**Common Patterns**:
```tsx
// Card with icon
<Card className="p-4">
  <div className="flex items-start gap-3">
    <div className="icon-halo-primary w-10 h-10">
      <Icon className="w-5 h-5 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-sm">Title</h3>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
  </div>
</Card>

// Form field
<div className="flex flex-col gap-1">
  <Label className="text-sm font-medium">Field Name</Label>
  <Input placeholder="Enter value" />
</div>

// Action buttons
<div className="flex gap-3 mt-6">
  <Button variant="outline" className="flex-1">Cancel</Button>
  <Button className="flex-1">Save</Button>
</div>
```

---

*Design System v5.2 - Microsoft Fluent 2*
