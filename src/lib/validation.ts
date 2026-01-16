import { z } from "zod";
import { MAX_REPLY_LENGTH, MAX_CONFUSION } from "./constants";

// ============================================================================
// Game Mode
// ============================================================================

export const GAME_MODES = [
  "classic",
  "timer",
  "daily",
  "extreme",
  "custom",
] as const;

export const GameModeSchema = z.enum(GAME_MODES);

// ============================================================================
// Message & Conversation schemas
// ============================================================================

export const MessageSchema = z.object({
  role: z.enum(["them", "player"]),
  text: z.string(),
});

export const ConversationSituationSchema = z.object({
  id: z.string(),
  topic: z.string(),
  tone: z.string(),
  intent: z.string(),
  personName: z.string(),
  personContext: z.string(),
  facts: z.array(z.string()),
  initialTranscript: z.array(MessageSchema),
  difficultyTags: z.array(z.enum(["easy", "medium", "hard"])),
});

export const ConversationSchema = z.object({
  situation: ConversationSituationSchema,
  transcript: z.array(MessageSchema),
  confusion: z.number().min(0).max(MAX_CONFUSION),
});

// ============================================================================
// API Request schemas
// ============================================================================

/**
 * Schema for POST /api/judge
 */
export const JudgeRequestSchema = z.object({
  conversationA: ConversationSchema,
  conversationB: ConversationSchema,
  conversationC: ConversationSchema.optional(),
  playerReply: z.string().min(1).max(MAX_REPLY_LENGTH),
  currentConfusionA: z.number().min(0).max(MAX_CONFUSION),
  currentConfusionB: z.number().min(0).max(MAX_CONFUSION),
  currentConfusionC: z.number().min(0).max(MAX_CONFUSION).optional(),
  roundNumber: z.number().int().positive(),
});

export type JudgeRequest = z.infer<typeof JudgeRequestSchema>;

/**
 * Schema for POST /api/continue
 */
export const ContinueRequestSchema = z.object({
  conversationA: ConversationSchema,
  conversationB: ConversationSchema,
  conversationC: ConversationSchema.optional(),
});

export type ContinueRequest = z.infer<typeof ContinueRequestSchema>;

/**
 * Schema for POST /api/scores
 */
export const SaveScoreRequestSchema = z.object({
  mode: GameModeSchema,
  score: z.number().int().min(0),
  roundsSurvived: z.number().int().min(0),
  scenarioId: z.string().optional(),
});

export type SaveScoreRequest = z.infer<typeof SaveScoreRequestSchema>;

/**
 * Schema for GET /api/round query params
 */
export const RoundQuerySchema = z.object({
  mode: GameModeSchema.optional().default("classic"),
  usedIds: z.string().optional().default(""),
  usedPairIds: z.string().optional().default(""),
  single: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export type RoundQuery = z.infer<typeof RoundQuerySchema>;

// ============================================================================
// Validation helper
// ============================================================================

/**
 * Validates request data against a Zod schema.
 * Returns { success: true, data } on success, or { success: false, error } on failure.
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  // Format error message for user
  const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  return { success: false, error: issues.join("; ") };
}
