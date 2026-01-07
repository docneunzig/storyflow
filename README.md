# Storyflow

**AI-Powered Novel Writing Assistant**

Storyflow is an intelligent writing companion that guides authors from initial concept to polished, print-ready manuscript. Combining a Figma-inspired UI with a multi-agent AI system, it assists with plot development, character creation, scene building, and iterative quality refinement.

## Core Value Proposition

Transform novel-writing from a solitary struggle to collaborative creation where AI handles consistency, critique, and refinement while the author retains full creative control.

## Features

### F1: Novel Specification Studio
Define all parameters that shape your novel before writing begins - genre, style, POV, target audience, themes, and more.

### F2: Assisted Plot Development
Transform a story seed into a fully structured plot using frameworks like Three-Act Structure, Hero's Journey, or Save the Cat.

### F3: Assisted Character Development
Create deep, consistent, and compelling characters with personality, voice, relationships, and arcs.

### F4: Assisted Scene Building
Design detailed scene blueprints with timeline view, chapter grouping, and character matrices.

### F5: AI Writing Process
Generate the actual manuscript with inline editing, alternatives, and style controls.

### F6/F7: Critique and Improvement Loop
Iteratively refine your manuscript using 12 quality dimensions, targeting bestseller-level quality (9.8/10).

### F8: Formatting and Export
Export print-ready DOCX, Markdown, or JSON with professional formatting presets.

### F9: Worldbuilding Wiki
Maintain internal consistency with organized worldbuilding details across 8 categories.

### F10: Writing Statistics Dashboard
Track progress with visualizations including word counts, quality trends, and activity heat maps.

### F11: Market Analysis
Position your novel competitively with comparable titles and genre positioning analysis.

## Technology Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Radix UI (component library)
- React Flow (canvas rendering)
- Zustand (state management)

### Backend
- Node.js + Express
- IndexedDB via Dexie.js (local-first, browser-based)
- docx.js (document export)

### AI Integration
- Claude Agent SDK
- Claude Max subscription (CLI-based authentication)

## Prerequisites

- Node.js 18+
- Claude CLI installed and authenticated (`claude login`)
- Modern browser (Chrome, Firefox, Safari, Edge)

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd storyflow
   ```

2. **Run the setup script**
   ```bash
   ./init.sh
   ```

3. **Start the development servers**

   In one terminal:
   ```bash
   cd backend && npm run dev
   ```

   In another terminal:
   ```bash
   cd frontend && npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Project Structure

```
storyflow/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── stores/       # Zustand state stores
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and helpers
│   │   ├── types/        # TypeScript types
│   │   └── styles/       # Global styles
│   └── package.json
├── backend/              # Node.js + Express backend
│   ├── src/
│   │   ├── routes/       # API route handlers
│   │   ├── agents/       # AI agent implementations
│   │   ├── services/     # Business logic
│   │   └── types/        # TypeScript types
│   └── package.json
├── init.sh               # Setup script
└── README.md
```

## Design System

### Colors (Dark Mode - Default)
- Background: #0F0F0F
- Surface: #1A1A1A
- Accent: #3B82F6 (blue)
- Success: #22C55E (green)
- Warning: #F59E0B (amber)
- Error: #EF4444 (red)

### Relationship Colors
- Family: Blue
- Romantic: Red
- Conflict: Orange
- Alliance: Green
- Mentor: Purple

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + 1-7 | Navigate to sections |
| Cmd/Ctrl + Enter | Generate/Continue |
| Cmd/Ctrl + S | Save project |
| Cmd/Ctrl + E | Export |
| Cmd/Ctrl + / | Command palette |
| F11 | Focus mode |
| Escape | Close panel/Cancel |

## Data Privacy

- All project data stored locally in IndexedDB
- No server-side storage of your content
- No telemetry or usage data collected
- Export/import as JSON for backup
- AI processing via Claude Max subscription (subject to Anthropic privacy policy)

## License

MIT

---

Built with Claude Agent SDK
