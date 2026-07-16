import { z } from "zod";
import type {
  Clue,
  GameEffect,
  GameState,
  InventoryItem,
  NarrativeEntry,
  Objective,
  PlayerActionResult,
  Puzzle,
  Room,
  RoomExit,
  RoomObject,
} from "./types";

export const gameStatusSchema = z.enum(["not_started", "playing", "escaped"]);

export const playerActionIntentSchema = z.enum([
  "LOOK",
  "INSPECT",
  "TAKE",
  "ANSWER",
  "MOVE",
  "REQUEST_HINT",
  "UNKNOWN",
]);

export const puzzleTypeSchema = z.enum(["word", "sequence", "logic", "code"]);

export const visualThemeSchema = z.enum(["green", "teal", "purple"]);

export const narrativeRoleSchema = z.enum(["system", "player", "assistant"]);

export const inventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
}) satisfies z.ZodType<InventoryItem>;

export const clueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
}) satisfies z.ZodType<Clue>;

export const objectiveSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  completed: z.boolean(),
}) satisfies z.ZodType<Objective>;

export const narrativeEntrySchema = z.object({
  id: z.string().min(1),
  role: narrativeRoleSchema,
  content: z.string().min(1),
  timestamp: z.number().int().nonnegative(),
}) satisfies z.ZodType<NarrativeEntry>;

export const roomObjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  visible: z.boolean(),
  searchable: z.boolean(),
  requiredItemId: z.string().min(1).nullable(),
  discoveredClueIds: z.array(z.string().min(1)),
  collectibleItemId: z.string().min(1).nullable(),
}) satisfies z.ZodType<RoomObject>;

export const puzzleSchema = z.object({
  id: z.string().min(1),
  type: puzzleTypeSchema,
  prompt: z.string().min(1),
  solution: z.string().min(1),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  clueIds: z.array(z.string().min(1)),
  hintLevels: z.array(z.string().min(1)).min(1),
  solved: z.boolean(),
  successMessage: z.string().min(1),
}) satisfies z.ZodType<Puzzle>;

export const roomExitSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  direction: z.string().min(1),
  toRoomId: z.string().min(1).nullable(),
  requiredPuzzleId: z.string().min(1).nullable(),
  final: z.boolean(),
}) satisfies z.ZodType<RoomExit>;

export const roomSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  visualTheme: visualThemeSchema,
  objects: z.array(roomObjectSchema),
  puzzle: puzzleSchema,
  exits: z.array(roomExitSchema),
  completed: z.boolean(),
  clues: z.array(clueSchema),
}) satisfies z.ZodType<Room>;

export const gameStateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  theme: z.string().min(1),
  openingMission: z.string().min(1),
  currentRoomId: z.string().min(1),
  rooms: z.array(roomSchema).min(1),
  inventory: z.array(inventoryItemSchema),
  discoveredClueIds: z.array(z.string().min(1)),
  solvedPuzzleIds: z.array(z.string().min(1)),
  objectives: z.array(objectiveSchema),
  narrativeHistory: z.array(narrativeEntrySchema),
  hintsUsed: z.record(z.string().min(1), z.number().int().nonnegative()),
  status: gameStatusSchema,
  startedAt: z.number().int().nonnegative(),
  demoMode: z.boolean(),
}) satisfies z.ZodType<GameState>;

export const addInventoryEffectSchema = z.object({
  type: z.literal("ADD_INVENTORY"),
  item: inventoryItemSchema,
});

export const discoverClueEffectSchema = z.object({
  type: z.literal("DISCOVER_CLUE"),
  clueId: z.string().min(1),
});

export const solvePuzzleEffectSchema = z.object({
  type: z.literal("SOLVE_PUZZLE"),
  puzzleId: z.string().min(1),
  roomId: z.string().min(1),
});

export const moveRoomEffectSchema = z.object({
  type: z.literal("MOVE_ROOM"),
  roomId: z.string().min(1),
});

export const completeObjectiveEffectSchema = z.object({
  type: z.literal("COMPLETE_OBJECTIVE"),
  objectiveId: z.string().min(1),
});

export const escapeEffectSchema = z.object({
  type: z.literal("ESCAPE"),
});

export const addNarrativeEffectSchema = z.object({
  type: z.literal("ADD_NARRATIVE"),
  entry: narrativeEntrySchema,
});

export const gameEffectSchema = z.discriminatedUnion("type", [
  addInventoryEffectSchema,
  discoverClueEffectSchema,
  solvePuzzleEffectSchema,
  moveRoomEffectSchema,
  completeObjectiveEffectSchema,
  escapeEffectSchema,
  addNarrativeEffectSchema,
]) satisfies z.ZodType<GameEffect>;

export const playerActionResultSchema = z.object({
  intent: playerActionIntentSchema,
  targetId: z.string().min(1).nullable(),
  valid: z.boolean(),
  narration: z.string().min(1),
  effects: z.array(gameEffectSchema),
}) satisfies z.ZodType<PlayerActionResult>;

export const playerActionSchema = z.object({
  command: z.string().trim().min(1).max(180),
});

export const hintRequestSchema = z.object({
  roomId: z.string().min(1),
  puzzleId: z.string().min(1),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;
export type ClueInput = z.infer<typeof clueSchema>;
export type ObjectiveInput = z.infer<typeof objectiveSchema>;
export type NarrativeEntryInput = z.infer<typeof narrativeEntrySchema>;
export type RoomObjectInput = z.infer<typeof roomObjectSchema>;
export type PuzzleInput = z.infer<typeof puzzleSchema>;
export type RoomExitInput = z.infer<typeof roomExitSchema>;
export type RoomInput = z.infer<typeof roomSchema>;
export type GameStateInput = z.infer<typeof gameStateSchema>;
export type GameEffectInput = z.infer<typeof gameEffectSchema>;
export type PlayerActionResultInput = z.infer<typeof playerActionResultSchema>;
export type PlayerActionInput = z.infer<typeof playerActionSchema>;
export type HintRequestInput = z.infer<typeof hintRequestSchema>;
