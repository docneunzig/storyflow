# Anleitung: Brainstorm Mode Feature mit dem Autonomous Coding Agent implementieren

## Übersicht

Diese Anleitung beschreibt, wie du den autonomen Coding Agent verwendest, um das **Brainstorm Mode (F1.5)** Feature in Storyflow zu implementieren.

---

## Voraussetzungen

1. **Autonomous Coding Agent** ist eingerichtet (`/Users/heuser/projects/AutonomousCoding`)
2. **Storyflow Projekt** existiert (`/Users/heuser/projects/AutonomousCoding/generations/AutonomousCoding`)
3. **Claude CLI** ist authentifiziert (`claude login`)

---

## Schritt 1: Prompt-Dateien ins Projekt kopieren

Kopiere die beiden erstellten Prompt-Dateien in das Storyflow-Projekt:

```bash
# Im Terminal:
cd /Users/heuser/projects/AutonomousCoding/generations/AutonomousCoding

# Erstelle prompts Ordner falls nicht vorhanden
mkdir -p prompts

# Die Dateien sollten bereits dort sein:
# - prompts/brainstorm_feature.md (detaillierte Implementierungsanleitung)
# - prompts/brainstorm_spec_addition.md (Spec-Ergänzung)
# - prompts/coding_prompt_brainstorm.md (Haupt-Prompt für den Agent)
```

---

## Schritt 2: Agent starten

```bash
cd /Users/heuser/projects/AutonomousCoding

# Agent starten
./start.sh

# Oder unter Windows:
start.bat
```

---

## Schritt 3: Projekt auswählen

Wähle im Menü:
- **"Continue existing project"**
- Wähle das **AutonomousCoding** Projekt (das ist Storyflow)

---

## Schritt 4: Prompt eingeben

Wenn der Agent nach einem Prompt fragt, kopiere diesen Text:

```
Implement the Brainstorm Mode (F1.5) feature for Storyflow.

Read the detailed implementation specification at: prompts/brainstorm_feature.md

This feature adds a creative brainstorming section between Specification and Plot Development where authors can:
1. Write unstructured ideas in a freeform text area
2. Have AI analyze their brainstorm and ask clarifying questions
3. Review AI-generated foundations for Plot, Characters, and Scenes
4. Select which elements to develop further in F2-F4

Key implementation tasks:
- Add BrainstormSession types to frontend/src/types/project.ts
- Create frontend/src/components/sections/BrainstormSection.tsx
- Add /brainstorm route to App.tsx
- Update Sidebar.tsx with Lightbulb icon and Cmd+2 shortcut
- Update Layout.tsx keyboard shortcuts
- Add BrainstormAgent to backend/src/routes/ai.ts

Follow the existing patterns from SpecificationSection.tsx. The brainstorm_feature.md file contains all the code you need.
```

---

## Schritt 5: Agent arbeiten lassen

Der Agent wird:
1. Die Prompt-Datei `brainstorm_feature.md` lesen
2. Die bestehende Codebase analysieren
3. Die notwendigen Änderungen implementieren
4. Tests durchführen

**Erwartete Dauer:** 15-30 Minuten je nach Komplexität

---

## Schritt 6: Manuell verifizieren

Nach Abschluss des Agents:

```bash
cd /Users/heuser/projects/AutonomousCoding/generations/AutonomousCoding

# Backend starten
cd backend && npm run dev &

# Frontend starten
cd ../frontend && npm run dev
```

Öffne http://localhost:5173 und teste:
- [ ] Öffne ein Projekt
- [ ] Sidebar zeigt "Brainstorm" mit Lightbulb-Icon
- [ ] Cmd+2 navigiert zu Brainstorm
- [ ] Text eingeben funktioniert
- [ ] "Analyze" Button startet Analyse
- [ ] Fragen werden angezeigt
- [ ] Foundations werden generiert
- [ ] Selections können getoggled werden
- [ ] "Finalize" schließt ab

---

## Troubleshooting

### Agent stoppt vorzeitig
Starte den Agent erneut mit "Continue existing project" - er setzt dort fort, wo er aufgehört hat.

### Kompilierungsfehler
Prüfe die TypeScript-Typen in `project.ts` - alle neuen Interfaces müssen korrekt exportiert werden.

### Navigation funktioniert nicht
Stelle sicher, dass:
- Die Route in `App.tsx` hinzugefügt wurde
- Der Switch-Case in `ProjectWorkspace.tsx` existiert
- Der NavItem in `Sidebar.tsx` hinzugefügt wurde

### Brainstorm wird nicht gespeichert
Prüfe:
- Das `brainstorm` Feld im Project-Interface
- Die `updateProject` Funktion in `db.ts`

---

## Dateien-Referenz

| Datei | Zweck |
|-------|-------|
| `prompts/brainstorm_feature.md` | Vollständige technische Implementierungsanleitung mit Code |
| `prompts/brainstorm_spec_addition.md` | XML-Ergänzung für app_spec.txt |
| `prompts/coding_prompt_brainstorm.md` | Kurzer Task-Prompt für den Agent |

---

## Alternative: Manuelle Implementierung

Falls der Agent Probleme hat, kannst du die Implementierung auch manuell durchführen:

1. Kopiere die TypeScript-Typen aus `brainstorm_feature.md` → `project.ts`
2. Kopiere den BrainstormSection Code → neue Datei erstellen
3. Füge die Route, NavItem, und Shortcuts manuell hinzu
4. Füge den Backend-Agent hinzu

Die Datei `brainstorm_feature.md` enthält den kompletten, einsatzbereiten Code.

---

## Ergebnis

Nach erfolgreicher Implementierung hast du:

✅ Neuen Menüpunkt "Brainstorm" mit 💡 Icon  
✅ Freeform Texteingabe für kreative Ideen  
✅ KI-gestützte Analyse mit gezielten Fragen  
✅ Automatisch generierte Plot/Character/Scene Foundations  
✅ Confidence Badges (explicit/inferred/suggested)  
✅ Nahtlose Integration mit F2-F4  
✅ Auto-Save und Persistenz  
