import { z } from "zod";

const hintSchema = z.object({
  text: z.string().min(2),
});

const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(4),
  portable: z.boolean().default(true),
});

const clueSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(4),
});

const exitSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  direction: z.string().min(1),
  toRoomId: z.string().min(1).nullable().optional(),
  lockedByPuzzleId: z.string().min(1).nullable().optional(),
  lockedDescription: z.string().optional(),
});

const puzzleSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(8),
  answer: z.string().min(1),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  requiredItemIds: z.array(z.string().min(1)).optional(),
  unlocksExitId: z.string().min(1).optional(),
  grantsItemId: z.string().min(1).optional(),
  hints: z.array(hintSchema).min(2).max(4),
  solvedText: z.string().min(8),
});

const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(12),
  imageKey: z.string().min(1),
  exits: z.array(exitSchema),
  clues: z.array(clueSchema).min(1).max(5),
  items: z.array(itemSchema).max(4),
  puzzle: puzzleSchema,
});

export const gameDefinitionSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(["demo", "generated"]),
  theme: z.string().min(1),
  title: z.string().min(3),
  openingMission: z.string().min(12),
  rooms: z.array(roomSchema).min(1).max(3),
  startRoomId: z.string().min(1),
  finalEscape: z.object({
    requiredPuzzleIds: z.array(z.string().min(1)).min(1),
    escapeRoomId: z.string().min(1),
    escapeExitId: z.string().min(1),
    victoryText: z.string().min(8),
  }),
});

export const playerActionIntentSchema = z.object({
  type: z.enum([
    "look",
    "inspect",
    "take",
    "use",
    "combine",
    "move",
    "answer",
    "hint",
    "unknown",
  ]),
  target: z.string().optional(),
  secondaryTarget: z.string().optional(),
  answer: z.string().optional(),
  direction: z.string().optional(),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const generateGameRequestSchema = z.object({
  theme: z.string().trim().min(3).max(120),
});

export const interpretActionRequestSchema = z.object({
  text: z.string().trim().min(1).max(240),
  visibleRoomSummary: z.string().max(1600),
  inventoryNames: z.array(z.string()).max(12),
  availableExits: z.array(z.string()).max(8),
});

export type ParsedGameDefinition = z.infer<typeof gameDefinitionSchema>;
export type ParsedPlayerActionIntent = z.infer<
  typeof playerActionIntentSchema
>;
