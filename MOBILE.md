# Mobile UI Redesign

The current mobile experience is cramped—users can only see one message at a time because the conversation panel headers consume too much vertical space. This document outlines two approaches to fix this, each implemented on a separate feature branch.

## Problem Analysis

Current vertical space usage per ConversationPanel:
- **Header row**: `[A] PersonName` — ~28px
- **ConfusionMeter**: ASCII face + bar + meaning — ~45px  
- **Context row**: situational context — ~30px
- **Total**: ~100px per panel

With two stacked panels on mobile, ~200px is lost to headers before any messages appear. Combined with the GameHeader (~60px) and ReplyInput (~150px), users have minimal space for actual conversation content.

---

## Option A: Compact Inline Headers

**Branch**: `feat/mobile-compact-headers`

### Concept

Keep the stacked two-panel layout but collapse each panel's header into a single compact line on mobile. The full header remains on desktop.

### Visual Design

**Desktop (unchanged)**:
```
┌─────────────────────────────────────┐
│ [A] Sarah                           │
│ :)  ████████░░  Clear               │
├─────────────────────────────────────┤
│ > Your coworker who always asks...  │
├─────────────────────────────────────┤
│ Messages...                         │
└─────────────────────────────────────┘
```

**Mobile (compact)**:
```
┌─────────────────────────────────────┐
│ [A] Sarah   :) ████░░  Clear    ⓘ  │
├─────────────────────────────────────┤
│ Messages...                         │
└─────────────────────────────────────┘
```

### Implementation Details

1. **ConversationPanel.tsx changes**:
   - Add responsive classes to show/hide elements based on screen size
   - Create a new `CompactHeader` sub-component for mobile
   - Use `md:` breakpoint to switch between compact and full layouts

2. **ConfusionMeter.tsx changes**:
   - Add `compact` prop for inline rendering
   - Compact mode: face + shorter bar + meaning all on one line
   - Reduce font sizes and spacing

3. **Context handling**:
   - Hide context by default on mobile
   - Add info icon (ⓘ) that shows context in a tooltip/popover on tap
   - Use `@headlessui/react` Popover or simple state toggle

### Component Changes

```tsx
// ConversationPanel.tsx - mobile header
<div className="md:hidden px-3 py-2 border-b border-gray-700 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-500">[{label}]</span>
    <span className="text-sm text-white">{situation.personName}</span>
  </div>
  <ConfusionMeter confusion={confusion} delta={delta} showDelta={showDelta} compact />
  <button onClick={toggleContext} className="text-gray-500 hover:text-white">
    ⓘ
  </button>
</div>

// Desktop header (hidden on mobile)
<div className="hidden md:block ...">
  {/* existing header code */}
</div>
```

### Pros
- Minimal code changes
- Familiar layout preserved
- Both conversations always visible
- Easy to compare responses side-by-side (mentally)

### Cons
- Still limited message space (just more than before)
- Context requires extra tap to view
- May feel cramped on very small screens

### Space Savings
- Header: ~100px → ~40px per panel
- Total savings: ~120px (enough for 3-4 more messages)

---

## Option B: Tab/Swipe View

**Branch**: `feat/mobile-tab-view`

### Concept

Replace the stacked panel layout with a tabbed interface on mobile. Users see one conversation at a time and can tap tabs or swipe to switch. Desktop layout remains unchanged.

### Visual Design

**Mobile (tabbed)**:
```
┌─────────────────────────────────────┐
│ ┌─────────┐ ┌─────────┐             │
│ │ A Sarah │ │ B Mike  │  (tabs)     │
│ └─────────┘ └─────────┘             │
├─────────────────────────────────────┤
│ :)  ████████░░  Clear               │
├─────────────────────────────────────┤
│ > Your coworker who always asks...  │
├─────────────────────────────────────┤
│                                     │
│ Messages take full height           │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Implementation Details

1. **New MobileConversationTabs.tsx component**:
   - Tab bar showing both conversation labels + names
   - Visual indicator for confusion level on each tab (color dot or small face)
   - Active tab styling
   - Optional: swipe gesture support via `framer-motion` drag

2. **game/page.tsx changes**:
   - Detect mobile viewport with `useMediaQuery` hook or Tailwind's responsive approach
   - Render `MobileConversationTabs` on mobile, existing grid on desktop
   - Manage `activeTab` state for mobile view

3. **Tab indicator design**:
   - Show confusion delta on inactive tab (so user knows if other convo needs attention)
   - Color-code tabs based on confusion level (green/yellow/red border)

### Component Structure

```tsx
// MobileConversationTabs.tsx
interface Props {
  conversations: { label: string; conversation: Conversation }[];
  activeTab: number;
  onTabChange: (index: number) => void;
  deltas?: { A?: number; B?: number; C?: number };
  showDelta?: boolean;
}

export default function MobileConversationTabs({ ... }) {
  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-700">
        {conversations.map((conv, i) => (
          <button
            key={conv.label}
            onClick={() => onTabChange(i)}
            className={`flex-1 px-3 py-2 text-sm ${
              activeTab === i ? 'bg-gray-900 text-white border-b-2 border-white' : 'text-gray-500'
            }`}
          >
            <span className="text-xs text-gray-600">[{conv.label}]</span>
            <span className="ml-1">{conv.conversation.situation.personName}</span>
            {/* Confusion indicator dot */}
            <span className={`ml-2 w-2 h-2 rounded-full ${getConfusionColor(conv.conversation.confusion)}`} />
          </button>
        ))}
      </div>
      
      {/* Active conversation panel */}
      <div className="flex-1 overflow-hidden">
        <ConversationPanel
          conversation={conversations[activeTab].conversation}
          label={conversations[activeTab].label}
          // ... other props
        />
      </div>
    </div>
  );
}
```

### Swipe Support (Optional Enhancement)

```tsx
// Using framer-motion for swipe gestures
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(_, info) => {
    if (info.offset.x > 100) onTabChange(Math.max(0, activeTab - 1));
    if (info.offset.x < -100) onTabChange(Math.min(conversations.length - 1, activeTab + 1));
  }}
>
  {/* conversation content */}
</motion.div>
```

### Pros
- Maximum message visibility (full screen height for messages)
- Clean, familiar mobile pattern (tabs/swipe)
- Room for full confusion meter and context
- Better UX on small phones

### Cons
- Can't see both conversations simultaneously
- Requires mental context-switching
- More complex implementation
- Need visual cues to show "other conversation needs attention"

### Space Savings
- Doubles available message space compared to stacked layout
- Full viewport height for active conversation

---

## Comparison Summary

| Aspect | Option A (Compact) | Option B (Tabs) |
|--------|-------------------|-----------------|
| Layout change | Minimal | Significant |
| Code complexity | Low | Medium |
| Message visibility | Moderate gain | Maximum gain |
| Both convos visible | Yes | No |
| Context switching | None | Tab/swipe |
| Implementation time | ~2 hours | ~4 hours |

---

## Recommendation

**Start with Option A** for quick wins, then evaluate if Option B is needed:

1. Option A is less disruptive and can ship faster
2. If users still complain about space, Option B provides the ultimate solution
3. Both can coexist—Option A as default, Option B as a toggle in settings

---

## Testing Checklist

- [ ] iPhone SE (smallest common screen)
- [ ] iPhone 14 Pro (standard)
- [ ] Android mid-range device
- [ ] Landscape orientation
- [ ] With timer mode active
- [ ] Extreme mode (3 conversations)
- [ ] "Ending conversation" prompt visible
- [ ] Confusion delta animations work

---

## Branch Strategy

```
main
 ├── feat/mobile-compact-headers  (Option A)
 └── feat/mobile-tab-view         (Option B)
```

Implement and test both, then decide which to merge based on user feedback or A/B testing.

