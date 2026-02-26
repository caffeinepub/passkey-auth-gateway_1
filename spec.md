# Avantkey — Draft 29

## Current State

- `DashboardLayout.tsx`: Uses a sticky top header with horizontal nav links. Nav items for Dashboard, Webhooks, Docs, Billing, Cycles (admin), Audit Log (admin), Settings (non-viewer) are rendered as ghost/secondary Buttons in a `<nav>` element inside the header. A separate mobile nav scrolls horizontally below the header. A footer renders at the bottom.
- `Docs.tsx`: Code blocks use `CodeBlock` component with a plain dark `bg-[oklch(0.13_0.02_240)]` container and a simple header bar showing the language label + copy button. No decorative chrome (no macOS traffic lights, no window frame, no title bar).

## Requested Changes (Diff)

### Add
- **Sidebar navigation** in `DashboardLayout.tsx`: A fixed left sidebar (240px wide on desktop) containing the Avantkey logo/wordmark at the top, nav items vertically stacked with icons and labels, a divider separating main nav from admin-only items, and a logout button at the bottom of the sidebar.
- **Collapsible sidebar** for mobile: Use a Sheet/drawer component that slides in from the left, triggered by a hamburger icon in a slim top bar on mobile.
- **MacOS browser window chrome** in `CodeBlock` component in `Docs.tsx`: Add a decorative window top bar with three traffic light circles (red `#FF5F57`, yellow `#FEBC2E`, green `#28C840`) and optionally a faux URL/filename bar. This wraps the existing code area.
- **Colored syntax theme** in code blocks: Apply token-level color highlighting for keywords, strings, comments, functions, and types using inline `<span>` elements with themed colors (VS Code Dark+ / One Dark inspired palette):
  - Keywords (`import`, `from`, `const`, `await`, `async`, `function`, `return`, `if`, `public`, `shared`, `func`): `#C678DD` (purple)
  - Strings (quoted values): `#98C379` (green)
  - Comments (lines starting with `//`): `#5C6370` italic (grey)
  - Functions/method calls (word before `(`): `#61AFEF` (blue)
  - Types/Builtins (`Text`, `Bool`, `Int`, `Nat`, `async`): `#E5C07B` (yellow/gold)
  - Punctuation/operators: `#ABB2BF` (default text)
  - Numbers: `#D19A66` (orange)
  - JSON keys: `#E06C75` (red-ish)
  - JSON values (strings): `#98C379` (green)

### Modify
- `DashboardLayout.tsx`: Replace the sticky top header + horizontal nav with a two-panel flex layout: fixed sidebar on the left, main content area on the right. The top header is removed. The sidebar holds branding, nav items, and logout. Offline banner and cycle warning banner move to the top of the main content area. The footer either moves to the bottom of the main panel or is removed from the sidebar.
- `Docs.tsx` `CodeBlock` component: Replace plain container with macOS window wrapper. Keep copy-on-click behavior. Language label moves to the faux URL/title bar area (center or left of traffic lights row).

### Remove
- Top `<header>` element in `DashboardLayout.tsx` (replaced by sidebar).
- Mobile horizontal scroll nav strip (replaced by hamburger + Sheet drawer).

## Implementation Plan

1. Rewrite `DashboardLayout.tsx`:
   - Layout: `flex h-screen overflow-hidden` root. Sidebar is `w-60 shrink-0 flex flex-col border-r border-border bg-card h-screen sticky top-0`. Main panel is `flex-1 overflow-y-auto flex flex-col`.
   - Sidebar sections: logo + tenant name at top, nav items in a `<nav>` in the middle (flex-1), divider, admin-only items, logout at bottom.
   - Active nav item: `bg-primary/10 text-primary` background highlight with left accent bar `border-l-2 border-primary`.
   - Mobile: hide sidebar with `hidden md:flex`, show a slim top bar with hamburger + logo. Use shadcn `Sheet` for drawer.
   - Offline banner and CycleWarningBanner rendered at top of the main scroll area.
   - Footer stays at bottom of main area.

2. Rewrite `CodeBlock` in `Docs.tsx`:
   - Outer wrapper: `rounded-xl overflow-hidden border border-border shadow-lg`.
   - Traffic light bar: `flex items-center gap-1.5 px-4 py-3 bg-[oklch(0.18_0.02_240)]` with three `w-3 h-3 rounded-full` circles in red/yellow/green. Language label centered or after traffic lights as a faint text.
   - Code area: `bg-[oklch(0.13_0.02_240)] p-4 overflow-x-auto text-sm font-mono leading-relaxed`.
   - Copy button: moves to right side of traffic light bar.
   - Add a `tokenize(code, language)` helper function that applies regex-based token coloring using inline `<span style={{color: ...}}>` elements. Handle: JavaScript/TypeScript, JSON, bash/shell, Motoko, HTTP. For unsupported languages, render as plain text.

## UX Notes
- Sidebar width: 240px fixed, no collapse toggle needed for MVP.
- Active state uses a subtle left border accent + tinted background — avoids heavy fills.
- Admin-only nav items (Cycles, Audit Log) grouped below a "System" label/divider in the sidebar.
- macOS traffic lights are purely decorative — they do not open/close anything.
- Syntax highlighting is regex-based (no external library) to avoid build complexity.
- Mobile sidebar drawer should close when a nav item is selected.
