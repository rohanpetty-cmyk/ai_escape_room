import { z } from "zod";

export const inventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
});

export const clueSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  text: z.string().min(1),
});

export const puzzleSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  answer: z.string().min(1),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  requiredItemIds: z.array(z.string().min(1)),
  hints: z.array(z.string().min(1)).min(1),
  solvedText: z.string().min(1),
});

export const exitSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  direction: z.string().min(1),
  toRoomId: z.enum(["atrium", "archive", "core"]).optional(),
  requiredPuzzleId: z.string().min(1).optional(),
});

export const roomSchema = z.object({
  id: z.enum(["atrium", "archive", "core"]),
  name: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  visualTone: z.enum(["green", "teal", "purple"]),
  objective: z.string().min(1),
  clues: z.array(clueSchema),
  items: z.array(inventoryItemSchema),
  exits: z.array(exitSchema),
  puzzle: puzzleSchema,
});

export const gameDefinitionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  theme: z.string().min(1),
  openingMission: z.string().min(1),
  rooms: z.array(roomSchema).min(1),
  startingRoomId: z.enum(["atrium", "archive", "core"]),
  finalRoomId: z.enum(["atrium", "archive", "core"]),
  finalExitId: z.string().min(1),
  victoryText: z.string().min(1),
});

export const playerActionSchema = z.object({
  command: z.string().trim().min(1).max(180),
});

export const hintRequestSchema = z.object({
  roomId: z.enum(["atrium", "archive", "core"]),
  puzzleId: z.string().min(1),
});

export type GameDefinitionInput = z.infer<typeof gameDefinitionSchema>;
export type PlayerActionInput = z.infer<typeof playerActionSchema>;
export type HintRequestInput = z.infer<typeof hintRequestSchema>;
