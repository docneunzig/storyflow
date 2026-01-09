# Brainstorm Mode (F1.5) - Feature Addition

Insert this feature after `</f1_novel_specification_studio>` and before `<f2_assisted_plot_development>`:

```xml
    <f1_5_brainstorm_mode>
      <purpose>Capture unstructured creative vision and transform it into structured starting points for Plot, Characters, and Scenes</purpose>
      
      <concept>
        Brainstorm Mode serves as a creative bridge between the technical novel specification (F1) and the structured development phases (F2-F4). Authors can freely write all their ideas, inspirations, and fragments without worrying about structure. The AI then analyzes this raw material, asks clarifying questions, and generates foundational elements for subsequent development.
      </concept>
      
      <workflow>
        Phase 1 - Freeform Input:
        - Large, distraction-free text area (full-screen option)
        - No structure required—stream of consciousness encouraged
        - Optional tagging for sections (character, setting, plot, theme, scene, question, inspiration)
        - Auto-save every 30 seconds
        - Writing prompts available (collapsible sidebar)
        
        Phase 2 - AI Analysis:
        - Brainstorm Agent analyzes the raw text
        - Identifies: core premise, potential characters, conflicts, settings, themes, key scenes
        - Detects gaps and underdeveloped areas
        
        Phase 3 - Guided Questions:
        - AI asks 5-7 targeted clarifying questions
        - Questions reference author's own words/ideas
        - Questions open creative possibilities, never feel like interrogation
        - Author can skip questions ("I don't know yet")
        - Questions adapt based on previous answers
        
        Phase 4 - Foundation Generation:
        - Plot Foundation: premise, central conflict, suggested structure, key plot points
        - Character Foundation: identified characters, relationship hints, missing archetypes
        - Scene Foundation: envisioned scenes, suggested scenes, key moments, setting notes
        - Each element marked with confidence level (explicit, inferred, suggested)
        - Source quotes from brainstorm attached to generated elements
        
        Phase 5 - Review & Selection:
        - Side-by-side view: original brainstorm ↔ generated structure
        - Click any generated element to see source quote highlighted
        - Checkboxes to accept/reject individual elements
        - Inline editing for any generated content
        - "Send to F2/F3/F4" buttons for finalized foundations
      </workflow>
      
      <brainstorm_session_properties>
        - id, projectId
        - rawText (the unstructured brainstorm)
        - taggedSections (optional categorization)
        - questionsAsked (AI-generated questions)
        - answersGiven (user's responses)
        - plotFoundation, characterFoundation, sceneFoundation
        - createdAt, updatedAt, finalized, version
      </brainstorm_session_properties>
      
      <foundation_types>
        PlotFoundation:
        - premise (one-paragraph story summary)
        - centralConflict (core dramatic question)
        - suggestedStructure (framework recommendation with reasoning)
        - keyPlotPoints (array of PlotSeed objects)
        - potentialSubplots
        - openQuestions (decisions author needs to make)
        
        CharacterFoundation:
        - identifiedCharacters (array of CharacterSeed objects)
        - relationshipHints (detected relationships)
        - missingArchetypes (suggested roles not yet filled)
        - openQuestions
        
        SceneFoundation:
        - envisionedScenes (scenes author described)
        - suggestedScenes (AI-suggested based on plot needs)
        - keyMoments (emotional/dramatic peaks)
        - settingNotes
        - openQuestions
        
        Seed objects include:
        - id, title, description
        - confidence: 'explicit' | 'inferred' | 'suggested'
        - sourceQuote (link back to brainstorm text)
        - selected (user acceptance toggle)
      </foundation_types>
      
      <question_categories>
        - Premise Clarification: "You mentioned [X]. Is this the central conflict?"
        - Character Motivation: "What does [character] want most?"
        - Relationship Dynamics: "Are [A] and [B] allies, enemies, or complicated?"
        - Stakes Identification: "What happens if the protagonist fails?"
        - Tone/Mood: "Should the whole book feel this way?"
        - Ending Direction: "Hopeful, tragic, or ambiguous?"
        - Underdeveloped Areas: "Less about setting—want to explore that?"
      </question_categories>
      
      <writing_prompts>
        - "What's the core story you want to tell?"
        - "Who are the main people in this story?"
        - "What scenes do you already see clearly?"
        - "What feeling do you want readers to have?"
        - "What inspired this idea?"
        - "What questions do you have about your own story?"
      </writing_prompts>
      
      <brainstorm_tags>
        - 🎭 Character idea
        - 📍 Setting/World
        - ⚡ Plot point
        - 💭 Theme/Message
        - 🎬 Scene vision
        - ❓ Open question
        - ✨ Inspiration
      </brainstorm_tags>
      
      <integration_with_f2_f4>
        When author sends foundations to development phases:
        
        To Plot Development (F2):
        - PlotSeeds become initial PlotBeat drafts
        - Suggested framework pre-selected
        - Source quotes attached as reference notes
        - Open questions displayed as decision prompts
        
        To Character Development (F3):
        - CharacterSeeds become Character profile drafts
        - Relationships pre-populated in relationship map
        - Missing archetypes suggested as "Add Character" prompts
        - Voice hints extracted for speech pattern suggestions
        
        To Scene Building (F4):
        - SceneSeeds become Scene blueprint drafts
        - Timeline pre-populated with known sequence
        - Setting notes feed into Location wiki entries
        - Key moments flagged as high-priority scenes
      </integration_with_f2_f4>
      
      <iteration_support>
        Authors can return to Brainstorm Mode at any time to:
        - Add new ideas to the original brainstorm
        - Re-run analysis with additional context
        - Regenerate foundations with modified parameters
        - Each brainstorm session is versioned
      </iteration_support>
    </f1_5_brainstorm_mode>
```

## Navigation Updates

Update keyboard shortcuts:
- Cmd+1: Specification
- Cmd+2: Brainstorm (NEW)
- Cmd+3: Plot (was 2)
- Cmd+4: Characters (was 3)
- Cmd+5: Scenes (was 4)
- Cmd+6: Write (was 5)
- Cmd+7: Review (was 6)

Update sidebar navigation to include Brainstorm after Specification with Lightbulb icon.

## Phase Unlock Updates

Brainstorm should be unlocked when specification phase is reached:
- specification: ['specification', 'brainstorm', 'wiki', 'stats']
- plotting: ['specification', 'brainstorm', 'plot', 'wiki', 'stats']
- (continue adding 'brainstorm' to all phases)

## AI Agent Addition

Add BrainstormAgent to the agent architecture:
```xml
<brainstorm_agent>
  Purpose: Analyze raw creative ideas and generate structured story foundations
  Capabilities: 
    - analyze-brainstorm (extract elements from freeform text)
    - generate-questions (create targeted clarifying questions)
    - generate-foundations (produce Plot, Character, Scene foundations)
  
  System Prompt Core:
  "You are a creative development partner who excels at finding story potential in raw, unstructured ideas.
   
   ANALYZE to identify: core premise, characters, conflicts, settings, themes, scenes, gaps
   ASK QUESTIONS that: are specific, reference author's words, open possibilities, never interrogate
   GENERATE FOUNDATIONS that: stay true to author's vision, distinguish 'author said' from 'AI suggested'
   
   CRITICAL: Never impose your own story ideas. Extract and amplify what's already there.
   Mark every element with confidence level (explicit/inferred/suggested)."
</brainstorm_agent>
```
