# StoryFlow Testing Guide

## App Overview
StoryFlow is a novel writing application with full German/English internationalization.

## How to Access
- URL: http://localhost:5173 (dev server)
- Create or select a project to see all sections

## Main Navigation (Left Sidebar)
The sidebar contains these sections in order:

### PLAN Group
1. **Specification** - Novel settings (genre, audience, style, word count targets)
2. **Brainstorm** - Free-form idea generation with AI analysis
3. **Plot** - Story beats and plot structure

### BUILD Group
4. **Characters** - Character cards, relationships, voice DNA analysis
5. **Scenes** - Scene blueprints with timeline views
6. **Wiki** - World-building encyclopedia

### WRITE Group
7. **Draft** - Chapter writing with AI assistance
8. **Review** - AI critique and continuity checking

### PUBLISH Group
9. **Stats** - Writing statistics and progress tracking
10. **Export** - Export to PDF, EPUB, DOCX, Markdown
11. **Market** - Market analysis and comparable titles

## Language Toggle
- Located at bottom of sidebar
- Two buttons: "EN" and "DE"
- Switches ALL UI text between English and German
- Setting persists in localStorage

## Testing Checklist

### Language Toggle Test
1. Click "DE" button in sidebar
2. Verify sidebar navigation changes to German:
   - "PLAN" → "PLANEN"
   - "Specification" → "Spezifikation"
   - "Characters" → "Charaktere"
   - etc.
3. Navigate to each section and verify:
   - Page titles are in German
   - Buttons are in German
   - Form labels are in German
   - Empty states are in German
4. Click "EN" to switch back
5. Verify all text returns to English

### Section-Specific Tests

#### Specification Section
- Title: "Roman-Spezifikation" (DE) / "Novel Specification" (EN)
- Templates should show translated names
- All form fields should have translated labels

#### Characters Section
- Title: "Charaktere" (DE) / "Characters" (EN)
- View mode buttons: "Charakterkarten", "Beziehungsliste", etc.
- Filter dropdowns: "Alle Rollen", "Alle Status"

#### Scenes Section
- Title: "Szenen" (DE) / "Scenes" (EN)
- View tabs should be translated
- Scene card labels should be translated

#### Export Section
- Title: "Exportieren" (DE) / "Export" (EN)
- Format names should be translated
- Button texts should be translated

## Known Issues
- Some TypeScript errors exist but are unrelated to i18n
- Dev server may need restart after major changes
