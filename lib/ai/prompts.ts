import type { GameDefinition } from "@/lib/game/types";

export function gameGenerationPrompt(theme: string) {
  return `Create a short playable escape room as strict JSON only.

Theme: ${theme}

Rules:
- Return one JSON object and no markdown.
- The object must match this shape: GameDefinition.
- mode must be "generated".
- Create exactly three connected rooms.
- Each room has exactly one logical puzzle.
- Every puzzle must be solvable from clues in that room.
- Use fair, concrete answers, never trivia.
- Include 2-4 progressive hints per puzzle.
- Include at least one inventory item in the first or second room.
- The final room must have the final escape exit.
- The final escape exit must be locked by the third room puzzle.
- The AI is designing content only. Do not include mutable state.
- Use these imageKey values only: laboratory, archive, control, observatory, cellar, library.

TypeScript interfaces:
type GameMode = "demo" | "generated";
interface Hint { text: string }
interface Item { id: string; name: string; description: string; portable: boolean }
interface Clue { id: string; label: string; text: string }
interface Exit {
  id: string;
  label: string;
  direction: string;
  toRoomId?: string | null;
  lockedByPuzzleId?: string | null;
  lockedDescription?: string;
}
interface Puzzle {
  id: string;
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  requiredItemIds?: string[];
  unlocksExitId?: string;
  grantsItemId?: string;
  hints: Hint[];
  solvedText: string;
}
interface Room {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  exits: Exit[];
  clues: Clue[];
  items: Item[];
  puzzle: Puzzle;
}
interface FinalEscapeCondition {
  requiredPuzzleIds: string[];
  escapeRoomId: string;
  escapeExitId: string;
  victoryText: string;
}
interface GameDefinition {
  id: string;
  mode: GameMode;
  theme: string;
  title: string;
  openingMission: string;
  rooms: Room[];
  startRoomId: string;
  finalEscape: FinalEscapeCondition;
}`;
}

export function repairGamePrompt(
  theme: string,
  rawJson: string,
  validationError: string,
) {
  return `Repair this escape-room JSON so it validates and remains playable.

Theme: ${theme}

Validation error:
${validationError}

Original response:
${rawJson}

Return only the repaired JSON object.`;
}

export function actionInterpretationPrompt(input: {
  text: string;
  visibleRoomSummary: string;
  inventoryNames: string[];
  availableExits: string[];
}) {
  return `Map the player's natural-language action to one structured intent.

Return only JSON with this shape:
{
  "type": "look" | "inspect" | "take" | "use" | "combine" | "move" | "answer" | "hint" | "unknown",
  "target": string optional,
  "secondaryTarget": string optional,
  "answer": string optional,
  "direction": string optional,
  "confidence": number from 0 to 1
}

Important:
- Do not decide whether the action succeeds.
- Do not add inventory, solve puzzles, unlock exits, or mark victory.
- If the player gives a code or phrase, use type "answer" and put it in "answer".
- If the player asks to go through a door, use type "move".
- If unsure, use type "unknown".

Player text: ${input.text}
Room context: ${input.visibleRoomSummary}
Inventory names: ${input.inventoryNames.join(", ") || "none"}
Available exits: ${input.availableExits.join(", ") || "none"}`;
}

export function summarizeGameForRepair(game: GameDefinition) {
  return JSON.stringify(game, null, 2);
}
