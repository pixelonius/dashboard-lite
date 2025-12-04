# Design Guidelines: Info-Product Management Portal

## Design Approach

**Selected Approach**: Design System - Modern Dashboard Pattern
**Primary References**: Linear (clean data presentation), Stripe Dashboard (data hierarchy), Notion (content organization)
**Rationale**: Enterprise dashboard requiring information density, data clarity, and consistent interaction patterns across complex workflows.

---

## Core Design Principles

1. **Data First**: Prioritize information hierarchy and scanability over decorative elements
2. **Functional Clarity**: Every visual element serves a purpose in task completion
3. **Consistent Rhythm**: Predictable patterns reduce cognitive load across departments
4. **Purposeful Density**: Balance information richness with breathing room

---

## Typography System

**Primary Font**: Inter (Google Fonts CDN)
**Secondary Font**: JetBrains Mono (for numerical data, codes, IDs)

**Hierarchy**:
- **Page Titles**: text-2xl font-semibold (Dashboard section headers)
- **Section Headers**: text-lg font-semibold (Card titles, table headers)
- **KPI Values**: text-3xl font-bold tracking-tight (Large metrics in stat cards)
- **KPI Labels**: text-sm font-medium text-gray-600 (Metric descriptions)
- **Body Text**: text-sm (Table cells, form labels)
- **Small Text**: text-xs text-gray-500 (Timestamps, helper text, metadata)
- **Data Tables**: text-sm font-medium (Primary column data), text-xs text-gray-600 (Secondary columns)
- **Numerical Data**: Use JetBrains Mono for all currency, percentages, counts, IDs

---

## Layout & Spacing System

**Tailwind Spacing Primitives**: Use units of **2, 3, 4, 6, 8, 12, 16** consistently
- `p-4, p-6, p-8`: Card/container padding
- `gap-4, gap-6`: Grid/flex gaps
- `mb-6, mb-8`: Section spacing
- `space-y-4`: Vertical stack spacing

**Layout Structure**:
- **Sidebar**: Fixed width w-64, full height with navigation groups
- **Main Content**: flex-1 with max-w-7xl container, px-8 py-6
- **Top Bar**: h-16 sticky top-0, shadow-sm, flex items-center justify-between
- **Dashboard Grid**: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 (KPI cards)
- **Content Cards**: rounded-lg border border-gray-200 bg-white shadow-sm p-6

---

## Component Library

### Navigation Components

**Sidebar**:
- Dark background (not specified per color constraints, but structurally separate from content)
- Navigation items with icon + label
- Active state: subtle highlight treatment
- Grouped sections: "Sales", "Marketing", "CSM", "Settings"
- Icons: Heroicons (outline style for inactive, solid for active)

**Top Header Bar**:
- "Welcome back, [Name]" greeting (text-sm)
- Role badge indicator
- User profile dropdown (right-aligned)
- Notification bell icon
- Height: h-16 with border-b

### Data Display Components

**KPI Cards** (4-column grid on desktop, stack on mobile):
- Structure: Icon circle (top-left) + Large value + Label + Change indicator
- Padding: p-6
- Border: rounded-lg border shadow-sm
- Icon container: w-12 h-12 rounded-full flex items-center justify-center
- Value: text-3xl font-bold tracking-tight
- Label: text-sm font-medium
- Change indicator: text-xs with up/down arrow icon (trend comparison)

**Chart Cards**:
- Title bar with dropdown for time range selection
- ApexCharts container with min-h-80
- Padding: p-6
- Legend positioned below chart
- Tooltip enabled for data point details
- Responsive: full-width on mobile, maintain aspect ratio

**Data Tables**:
- Header row: bg-gray-50 with text-xs font-medium uppercase tracking-wider text-gray-600
- Row hover: subtle background change
- Sticky header on scroll
- Actions column: right-aligned with icon buttons
- Alternating row treatment optional for dense tables
- Pagination controls: bottom-center with page numbers + prev/next
- Filters: top-right with icon buttons (funnel, download CSV, search)
- Cell padding: px-4 py-3
- Status badges: inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium

### Form & Input Components

**Date Range Picker**:
- Preset buttons (Today, 7D, MTD, QTD, YTD, Custom) in button group
- Active preset: visually distinct
- Custom date inputs: side-by-side with calendar icon
- Apply button to trigger filter

**Filters Panel**:
- Collapsible section above tables
- Inline filter chips showing active filters with X to remove
- Search input: w-64 with magnifying glass icon
- Dropdown filters: styled select with chevron

**Buttons**:
- Primary action: px-4 py-2 text-sm font-medium rounded-md
- Secondary action: similar with alternative visual treatment
- Icon buttons: w-8 h-8 rounded-md (table actions, dropdowns)
- CSV Export: icon + "Export CSV" label, positioned top-right of tables

### Status & Feedback Components

**Status Badges**:
- Pills: rounded-full px-2.5 py-0.5 text-xs font-medium
- Context-specific treatments for: Active/Inactive, Paid/Due/Overdue, Published/Revision/Scheduled
- Icon prefix optional for critical states (warning icon for overdue)

**Role Banner** (for demo mode):
- Fixed top banner above header, h-10
- Text: "Viewing as [ROLE] - Switch Role" with dropdown
- Dismissible or persistent

**Empty States**:
- Centered icon + message + optional action button
- Min height to prevent layout shift
- Icon: w-16 h-16 from Heroicons

---

## Dashboard-Specific Patterns

### Sales Dashboard
- 4 KPI cards: Total Cash Collected, AOV, Orders Won, Outstanding Plans
- Time series chart: Cash by Source (stacked area or multi-line)
- Orders table with status filter tabs (All, Won, Lost, Pending)
- Overdue installments table (highlighted rows for critical amounts)

### Marketing Dashboard
- Tabs: "Content" and "Ads"
- Content tab: Production metrics cards + content items table + contractor spend chart
- Ads tab: ROAS cards by bucket + spend trend chart + campaign performance table
- Chart: Group/stack by campaign bucket

### CSM Dashboard
- Red zone alert card (count + urgent indicator)
- Payment plans table with next due date column prominent
- Onboarding compliance gauge or progress bar
- High-risk clients table with risk factors column

### Email Dashboard
- Sequence performance cards (starts, completion rate)
- Opt-in to first-email timing chart (scatter or histogram)
- Nurture status table showing lead progression
- Email event timeline visualization

---

## Data Visualization

**Chart Library**: ApexCharts
**Chart Types**:
- Line charts: Revenue trends, timing analysis
- Stacked area: Multi-source revenue comparison
- Bar charts: Campaign spend, contractor payments
- Donut charts: Revenue breakdown by product type

**Chart Styling**:
- Grid lines: subtle, minimal
- Axes labels: text-xs
- Tooltips: formatted currency, dates, percentages
- Data labels: Only for significant points to avoid clutter
- Height: min-h-80 for primary charts, min-h-64 for secondary

---

## Responsive Behavior

**Breakpoints**:
- Mobile (<768px): Stack KPIs to single column, hide sidebar behind hamburger, simplify tables (fewer columns)
- Tablet (768-1024px): 2-column KPI grid, sidebar persistent
- Desktop (>1024px): Full 4-column layout, expanded sidebar

**Table Responsiveness**:
- Mobile: Card-based layout with key fields only
- Tablet: Horizontal scroll for full table
- Desktop: Full table with all columns visible

---

## Accessibility

- Semantic HTML throughout (nav, main, section, article)
- ARIA labels for icon-only buttons
- Keyboard navigation support for all interactive elements
- Focus indicators on all interactive components
- Sufficient contrast ratios for all text
- Form labels properly associated with inputs
- Table headers properly marked with th scope

---

## Icons

**Library**: Heroicons (via CDN)
**Usage**:
- Sidebar navigation: 20x20 outline icons
- KPI cards: 24x24 solid icons
- Table actions: 16x16 outline icons
- Status indicators: 12x12 solid icons
- Empty states: 64x64 outline icons

---

## Performance Considerations

- Lazy load chart data on tab/section activation
- Virtual scrolling for tables with 100+ rows
- Debounce search inputs
- Pagination limits: 25, 50, 100 rows per page options