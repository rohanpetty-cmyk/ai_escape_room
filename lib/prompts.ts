import type { GameState } from "./types";

export type GameDifficulty = "easy" | "medium" | "hard";

export interface GameGenerationPromptInput {
  theme: string;
  difficulty: GameDifficulty;
  demoMode: boolean;
}

export const GAME_ARCHITECT_SYSTEM_PROMPT = [
  "You are Game Architect, a meticulous escape-room designer for a full-stack app called AI Escape Room.",
  "Your job is to generate fair, deterministic, self-contained escape rooms as JSON only.",
  "You never rely on outside knowledge, trivia, cultural references, ambiguous riddles, sound, images, colors alone, or hidden assumptions.",
  "Every puzzle answer must be directly supported by visible room clues and inspectable objects.",
  "Every room must have exactly one puzzle, three progressive hints, and enough clues for a reasonable player to solve it without guessing.",
  "IDs must be unique, lowercase, URL-safe slugs using only a-z, 0-9, and hyphens.",
  "Do not include markdown, code fences, commentary, comments, or trailing prose. Return one JSON object and nothing else.",
].join("\n");

export function buildGameGenerationPrompt({
  theme,
  difficulty,
  demoMode,
}: GameGenerationPromptInput): string {
  const roomCount = demoMode ? 1 : 3;
  const modeInstruction = demoMode
    ? "Create exactly one room. The room must be completable in under two minutes."
    : "Create exactly three connected rooms. The full adventure must be completable in five to seven minutes.";

  return [
    `Theme: ${theme}`,
    `Difficulty: ${difficulty}`,
    `Demo mode: ${demoMode ? "true" : "false"}`,
    modeInstruction,
    "",
    "Return JSON matching this TypeScript shape exactly:",
    `{
  "id": "url-safe-game-id",
  "title": "short title",
  "theme": "theme text",
  "openingMission": "short mission briefing",
  "currentRoomId": "id of first room",
  "rooms": [
    {
      "id": "url-safe-room-id",
      "name": "Room Name",
      "description": "What the player sees immediately.",
      "visualTheme": "green" | "teal" | "purple",
      "objects": [
        {
          "id": "url-safe-object-id",
          "name": "object name",
          "description": "inspectable description",
          "visible": true,
          "searchable": true,
          "requiredItemId": null,
          "discoveredClueIds": ["clue-id"],
          "collectibleItemId": null
        }
      ],
      "puzzle": {
        "id": "url-safe-puzzle-id",
        "type": "word" | "sequence" | "logic" | "code",
        "prompt": "the puzzle prompt",
        "solution": "answer",
        "acceptedAnswers": ["answer", "alternative answer"],
        "clueIds": ["clue-id"],
        "hintLevels": ["gentle hint", "stronger hint", "near-solution hint"],
        "solved": false,
        "successMessage": "what happens when solved"
      },
      "exits": [
        {
          "id": "url-safe-exit-id",
          "label": "Exit label",
          "direction": "east",
          "toRoomId": null,
          "requiredPuzzleId": "puzzle-id",
          "final": false
        }
      ],
      "completed": false,
      "clues": [
        {
          "id": "url-safe-clue-id",
          "title": "Clue Title",
          "content": "clue content"
        }
      ]
    }
  ],
  "inventory": [],
  "discoveredClueIds": [],
  "solvedPuzzleIds": [],
  "objectives": [
    {
      "id": "url-safe-objective-id",
      "text": "current objective",
      "completed": false
    }
  ],
  "narrativeHistory": [
    {
      "id": "opening",
      "role": "system",
      "content": "same as openingMission or a concise opening beat",
      "timestamp": 0
    }
  ],
  "hintsUsed": {},
  "status": "playing",
  "startedAt": 0,
  "demoMode": ${demoMode ? "true" : "false"}
}`,
    "",
    "Hard requirements:",
    `- rooms.length must be exactly ${roomCount}.`,
    "- Every puzzle.hintLevels array must contain exactly three hints.",
    "- Every puzzle.clueIds entry must refer to a clue in the same room.",
    "- Every object.discoveredClueIds entry must refer to a clue in the same room.",
    "- Every normal exit must point to an existing room or be a final exit with toRoomId null.",
    "- Every requiredPuzzleId must refer to an existing puzzle id.",
    "- Include at least one final exit. In normal mode it must be in the third room.",
    "- In normal mode, include at least three collectible inventory items and make at least one earlier item required by a later room object.",
    "- In demo mode, include at least one inspectable clue path and one final exit.",
    "- Keep all mutable progress fields in their initial state: empty inventory, empty discoveredClueIds, empty solvedPuzzleIds, empty hintsUsed, puzzle.solved false, room.completed false, objectives.completed false.",
    "- Return valid JSON only.",
  ].join("\n");
}

export function buildPlayerActionPrompt(command: string, game: GameState): string {
  return [
    "Map the player command to a structured action intent.",
    `Game: ${game.title}`,
    `Command: ${command}`,
    "Return only JSON. Do not mutate game state.",
  ].join("\n");
}
