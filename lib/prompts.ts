import type { GameState } from "./types";

export type GameDifficulty = "easy" | "medium" | "hard";

export interface GameGenerationPromptInput {
  theme: string;
  difficulty: GameDifficulty;
  demoMode: boolean;
  sourceMaterial?: string;
}

export interface GameRepairPromptInput extends GameGenerationPromptInput {
  invalidJson: string;
  issues: string[];
}

export interface DungeonMasterPromptInput {
  action: string;
  answerAttempt: boolean;
  currentRoom: {
    id: string;
    name: string;
    description: string;
    puzzle: {
      id: string;
      type: string;
      prompt: string;
      solved: boolean;
      solution?: string;
      acceptedAnswers?: string[];
    };
  };
  visibleObjects: Array<{
    id: string;
    name: string;
    description: string;
    searchable: boolean;
    requiredItemId: string | null;
    collectibleItem: {
      id: string;
      name: string;
      description: string;
      icon: string;
    } | null;
    discoverableClues: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  }>;
  currentInventory: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
  discoveredClues: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  solvedPuzzleIds: string[];
  availableExits: Array<{
    id: string;
    label: string;
    direction: string;
    toRoomId: string | null;
    requiredPuzzleId: string | null;
    final: boolean;
    unlocked: boolean;
  }>;
}

export const GAME_ARCHITECT_SYSTEM_PROMPT = [
  "You are Game Architect, a meticulous escape-room designer for a full-stack app called AI Escape Room.",
  "Your job is to generate fair, deterministic, self-contained escape rooms as JSON only.",
  "You never rely on outside knowledge, trivia, cultural references, ambiguous riddles, sound, images, colors alone, or hidden assumptions.",
  "Every puzzle answer must be directly supported by visible room clues and inspectable objects.",
  "Every room must have exactly one puzzle, three progressive hints, and enough clues for a reasonable player to solve it without guessing.",
  "IDs must be lowercase, URL-safe slugs using only a-z, 0-9, and hyphens.",
  "Do not include markdown, code fences, commentary, comments, or trailing prose. Return one JSON object and nothing else.",
].join("\n");

export const DUNGEON_MASTER_SYSTEM_PROMPT = [
  "You are the Dungeon Master for AI Escape Room.",
  "Your job is to interpret one natural-language player action against the supplied room context and return JSON only.",
  "You do not mutate game state. You may only propose effects; the deterministic game engine will validate and apply them.",
  "Use only IDs that appear in the supplied context. Never invent rooms, objects, items, clues, puzzles, exits, objectives, or narrative IDs.",
  "Invalid, impossible, vague, or unsafe actions must still receive an immersive in-world narration with valid false and no state-changing effects.",
  "Do not include ADD_NARRATIVE or COMPLETE_OBJECTIVE effects. The server adds narrative entries and objective completion deterministically.",
  "Do not solve a puzzle unless the context includes a puzzle solution and the player's action explicitly attempts an answer.",
  "Do not use outside knowledge, riddles, hidden assumptions, or information that is not in the context.",
  "Return one JSON object and nothing else. Do not include markdown, code fences, comments, or trailing prose.",
].join("\n");

export function buildGameGenerationPrompt({
  theme,
  difficulty,
  demoMode,
  sourceMaterial,
}: GameGenerationPromptInput): string {
  const roomCount = demoMode ? 1 : 3;
  const modeInstruction = demoMode
    ? "Create exactly one room. The room must be completable in under two minutes."
    : "Create exactly three connected rooms. The full adventure must be completable in five to seven minutes.";
  const educationalInstruction = sourceMaterial?.trim()
    ? [
        "",
        "Educational source material:",
        sourceMaterial.trim(),
        "",
        "Educational mode requirements:",
        "- Use the source material as the factual basis for clues and puzzle knowledge.",
        "- Every puzzle should reinforce one concrete idea from the source material.",
        "- Do not require knowledge beyond the source material and visible room clues.",
        "- Keep clue wording concise; paraphrase the source instead of dumping large passages.",
      ].join("\n")
    : "";

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
        "clueIds": ["clue-id-one", "clue-id-two"],
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
          "id": "clue-id-one",
          "title": "Clue Title",
          "content": "clue content"
        },
        {
          "id": "clue-id-two",
          "title": "Second Clue Title",
          "content": "second clue content"
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
    educationalInstruction,
    "",
    "Hard requirements:",
    `- rooms.length must be exactly ${roomCount}.`,
    "- Every room must define at least two clues.",
    "- Every puzzle.clueIds array must contain at least two clue IDs from that same room.",
    "- Every puzzle.hintLevels array must contain exactly three hints.",
    "- Every puzzle.clueIds entry must refer to a clue in the same room.",
    "- Every object.discoveredClueIds entry must refer to a clue in the same room.",
    "- Every normal exit must point to an existing room or be a final exit with toRoomId null.",
    "- Every requiredPuzzleId must refer to an existing puzzle id.",
    "- Room, puzzle, clue, inventory item, objective, and narrative IDs must be globally unique.",
    "- Object and exit IDs must be unique within their own room.",
    "- Include at least one final exit. In normal mode it must be in the third room.",
    "- In normal mode, include at least three collectible inventory items and make at least one earlier item required by a later room object.",
    "- In demo mode, include at least one inspectable clue path and one final exit.",
    "- Keep all mutable progress fields in their initial state: empty inventory, empty discoveredClueIds, empty solvedPuzzleIds, empty hintsUsed, puzzle.solved false, room.completed false, objectives.completed false.",
    "- Return valid JSON only.",
  ].join("\n");
}

export function buildGameRepairPrompt({
  theme,
  difficulty,
  demoMode,
  sourceMaterial,
  invalidJson,
  issues,
}: GameRepairPromptInput): string {
  return [
    "Repair the generated escape-room JSON so it passes validation.",
    "Return one corrected JSON object only. Do not add markdown or explanation.",
    "",
    "Original request:",
    `Theme: ${theme}`,
    `Difficulty: ${difficulty}`,
    `Demo mode: ${demoMode ? "true" : "false"}`,
    sourceMaterial?.trim()
      ? `Educational source material:\n${sourceMaterial.trim()}`
      : "Educational source material: none",
    "",
    "Validation issues to fix:",
    ...issues.map((issue) => `- ${issue}`),
    "",
    "Critical invariants:",
    `- rooms.length must be exactly ${demoMode ? 1 : 3}.`,
    "- Every room must have exactly one puzzle.",
    "- Every puzzle.clueIds array must contain at least two clue IDs from the same room.",
    "- Every puzzle.hintLevels array must contain exactly three hints.",
    "- Every referenced clue, puzzle, room, objective, item, and exit ID must exist.",
    "- All IDs must be lowercase, URL-safe slugs.",
    "- Room, puzzle, clue, inventory item, objective, and narrative IDs must be globally unique.",
    "- Object and exit IDs only need to be unique within their own room.",
    "- Keep mutable progress fields in their initial state.",
    "",
    "Invalid JSON to repair:",
    invalidJson,
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

export function buildDungeonMasterPrompt(context: DungeonMasterPromptInput): string {
  return [
    "Interpret the player action using only this context:",
    JSON.stringify(context, null, 2),
    "",
    "Return JSON matching this exact shape:",
    `{
  "intent": "LOOK" | "INSPECT" | "SEARCH" | "TAKE" | "USE" | "ANSWER" | "MOVE" | "REQUEST_HINT" | "UNKNOWN",
  "targetId": "id-from-context-or-null",
  "valid": true,
  "narration": "short immersive response in second person",
  "effects": [
    { "type": "DISCOVER_CLUE", "clueId": "clue-id-from-context" },
    {
      "type": "ADD_INVENTORY",
      "item": {
        "id": "collectible-item-id-from-context",
        "name": "item name from context",
        "description": "item description from context",
        "icon": "item icon from context"
      }
    },
    { "type": "SOLVE_PUZZLE", "puzzleId": "current-puzzle-id", "roomId": "current-room-id" },
    { "type": "MOVE_ROOM", "roomId": "destination-room-id-from-an-unlocked-exit" },
    { "type": "ESCAPE" }
  ]
}`,
    "",
    "Effect rules:",
    "- LOOK should describe the room and usually has no state-changing effects.",
    "- INSPECT or SEARCH may reveal clue IDs listed on visibleObjects.discoverableClues.",
    "- TAKE may add only a visible collectibleItem from the current room.",
    "- USE may reveal clues only when the required item is present in currentInventory.",
    "- ANSWER may solve only currentRoom.puzzle, and only when answerAttempt is true and a solution is present.",
    "- MOVE_ROOM may target only the toRoomId of an unlocked, non-final available exit.",
    "- ESCAPE may be proposed only when an unlocked final available exit is being used.",
    "- If no rule fits, use UNKNOWN, valid false, a helpful in-world narration, and an empty effects array.",
  ].join("\n");
}
