# Storyflow: Brainstorm Mode Implementation Task

## Task Overview

Implement the **Brainstorm Mode (F1.5)** feature for the Storyflow novel writing application. This feature adds a creative bridge between the Specification (F1) and Plot Development (F2) sections, allowing authors to capture unstructured ideas that are then analyzed by AI to generate foundational elements.

## Prerequisites

- The Storyflow application is already functional with F1-F11 features implemented
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + Radix UI
- Backend: Node.js + Express
- State Management: Zustand
- Database: IndexedDB via Dexie.js

## Implementation Specification

Read the detailed implementation guide at:
```
prompts/brainstorm_feature.md
```

This file contains:
1. All TypeScript type definitions to add
2. All files that need modification with specific code changes
3. Complete BrainstormSection.tsx component code
4. Backend route additions for the Brainstorm Agent
5. Testing checklist

## Key Files to Modify

| File | Changes Required |
|------|------------------|
| `frontend/src/types/project.ts` | Add BrainstormSession, PlotFoundation, CharacterFoundation, SceneFoundation types |
| `frontend/src/App.tsx` | Add `/brainstorm` route |
| `frontend/src/pages/ProjectWorkspace.tsx` | Import and render BrainstormSection |
| `frontend/src/components/layout/Sidebar.tsx` | Add Brainstorm nav item, update shortcuts |
| `frontend/src/components/layout/Layout.tsx` | Update NAV_SHORTCUTS mapping |
| `frontend/src/stores/projectStore.ts` | Update calculateProjectPhase for brainstorm |
| `frontend/src/lib/db.ts` | Ensure brainstorm field is persisted |
| `backend/src/routes/ai.ts` | Add BrainstormAgent routing and handlers |

## New File to Create

| File | Description |
|------|-------------|
| `frontend/src/components/sections/BrainstormSection.tsx` | Main Brainstorm UI component |

## Acceptance Criteria

1. **Navigation**: Brainstorm appears in sidebar between Specification and Plot with Lightbulb icon
2. **Keyboard Shortcuts**: Cmd+2 navigates to Brainstorm, other shortcuts shifted accordingly
3. **Input Phase**: Large textarea for freeform writing with word count, optional tags, writing prompts
4. **Analysis Phase**: Loading state while AI analyzes brainstorm text
5. **Questions Phase**: 5-7 clarifying questions with progress bar, skip option, context quotes
6. **Foundations Phase**: Three columns showing Plot/Character/Scene foundations with selectable seeds
7. **Confidence Badges**: Each seed shows explicit (green), inferred (yellow), or suggested (blue) confidence
8. **Review Phase**: Completion screen with links to Plot, Characters, Scenes sections
9. **Persistence**: Brainstorm session auto-saves to IndexedDB
10. **Phase Unlocking**: Brainstorm unlocked when specification phase is reached

## Implementation Order

1. Add types to `project.ts`
2. Create `BrainstormSection.tsx` component
3. Add route to `App.tsx`
4. Update `ProjectWorkspace.tsx` to render the section
5. Update `Sidebar.tsx` navigation
6. Update `Layout.tsx` keyboard shortcuts
7. Update `projectStore.ts` phase calculation
8. Add backend agent routing in `ai.ts`
9. Test all phases and interactions

## Testing Instructions

After implementation, verify:
- [ ] Sidebar shows Brainstorm with Lightbulb icon after Specification
- [ ] Cmd+2 keyboard shortcut navigates to Brainstorm
- [ ] Can write freeform text in brainstorm area
- [ ] Word count updates in real-time
- [ ] "Analyze & Generate Questions" button triggers analysis
- [ ] Questions display with progress bar
- [ ] Can answer or skip questions
- [ ] Foundations display in three columns after all questions
- [ ] Can toggle seed selections with checkboxes
- [ ] Confidence badges display correctly (explicit/inferred/suggested)
- [ ] "Finalize" saves session and shows completion screen
- [ ] Can return to brainstorm to add more content
- [ ] Auto-save works (check IndexedDB)
- [ ] Page refresh preserves brainstorm state

## Notes

- Use `crypto.randomUUID()` for generating IDs
- Use `lucide-react` Lightbulb icon for the navigation
- Follow existing component patterns from `SpecificationSection.tsx`
- The AI generation currently returns mock data - this is expected behavior
- Ensure dark mode compatibility using existing Tailwind classes
