import { z } from 'zod'

/**
 * Zod schemas for project validation.
 * Provides runtime type safety for project operations.
 */

// Project phase enum
export const ProjectPhaseSchema = z.enum([
  'specification',
  'plotting',
  'characters',
  'scenes',
  'writing',
  'revision',
  'complete',
])

// Metadata schema
export const ProjectMetadataSchema = z.object({
  workingTitle: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  authorName: z.string().min(1, 'Author name is required').max(100, 'Author name too long'),
  createdAt: z.string().datetime().optional(),
  lastModified: z.string().datetime().optional(),
  currentPhase: ProjectPhaseSchema.optional(),
})

// Target audience enum
export const TargetAudienceSchema = z.enum(['Children', 'Middle Grade', 'YA', 'New Adult', 'Adult'])

// POV enum
export const POVSchema = z.enum([
  'First Person',
  'Third Limited',
  'Third Omniscient',
  'Second Person',
  'Multiple POV',
])

// Tense enum
export const TenseSchema = z.enum(['Past', 'Present'])

// Novel language enum
export const NovelLanguageSchema = z.enum(['en', 'de', 'fr', 'es', 'it'])

// Writing style schema
export const WritingStyleSchema = z.object({
  reference: z.string().max(500).optional().default(''),
  custom: z.string().max(1000).optional().default(''),
})

// Chapter length range schema
export const ChapterLengthRangeSchema = z.object({
  min: z.number().int().min(0).max(50000),
  max: z.number().int().min(0).max(100000),
})

// Novel specification schema
export const NovelSpecificationSchema = z.object({
  genre: z.array(z.string()).optional().default([]),
  subgenre: z.array(z.string()).optional().default([]),
  targetAudience: TargetAudienceSchema.optional(),
  childrensAgeCategory: z.enum(['4-6', '7-10', '11-14', '15-18']).optional(),
  novelLanguage: NovelLanguageSchema.optional().default('en'),
  writingStyle: WritingStyleSchema.optional(),
  tone: z.string().max(200).optional().default(''),
  pov: POVSchema.optional(),
  tense: TenseSchema.optional(),
  targetWordCount: z.number().int().min(0).max(1000000).optional().default(80000),
  targetChapterCount: z.number().int().min(1).max(200).optional().default(20),
  chapterLengthRange: ChapterLengthRangeSchema.optional(),
  settingType: z.array(z.string()).optional().default([]),
  timePeriod: z.string().max(200).optional().default(''),
  themes: z.array(z.string()).optional().default([]),
  pacing: z.number().min(1).max(10).optional().default(5),
  complexity: z.number().min(1).max(10).optional().default(5),
})

// Character role enum
export const CharacterRoleSchema = z.enum(['protagonist', 'antagonist', 'supporting', 'minor'])

// Character status enum
export const CharacterStatusSchema = z.enum(['alive', 'deceased', 'unknown'])

// Character schema (simplified for validation)
export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: CharacterRoleSchema.optional(),
  status: CharacterStatusSchema.optional(),
}).passthrough() // Allow additional character properties

// Chapter status enum
export const ChapterStatusSchema = z.enum(['outline', 'draft', 'revision', 'final', 'locked'])

// Chapter schema (simplified for validation)
export const ChapterSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int().min(1),
  title: z.string().max(200),
  content: z.string().optional().default(''),
  status: ChapterStatusSchema.optional(),
}).passthrough()

// Scene schema (simplified for validation)
export const SceneSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200),
}).passthrough()

// Project create/update schema
export const ProjectInputSchema = z.object({
  metadata: ProjectMetadataSchema.optional(),
  specification: NovelSpecificationSchema.nullable().optional(),
  characters: z.array(CharacterSchema).optional(),
  chapters: z.array(ChapterSchema).optional(),
  scenes: z.array(SceneSchema).optional(),
}).passthrough() // Allow additional project properties

export type ProjectInput = z.infer<typeof ProjectInputSchema>

/**
 * Validate project input data
 */
export function validateProjectInput(data: unknown) {
  return ProjectInputSchema.safeParse(data)
}
