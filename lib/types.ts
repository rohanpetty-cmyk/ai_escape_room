export type RoomId = "atrium" | "archive" | "core";

export type GameStatus = "playing" | "escaped";

export type CommandKind =
  | "look"
  | "inspect"
  | "take"
  | "answer"
  | "move"
  | "hint"
  | "unknown";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
}

export interface Clue {
  id: string;
  label: string;
  text: string;
}

export interface Puzzle {
  id: string;
  prompt: string;
  answer: string;
  acceptedAnswers: string[];
  requiredItemIds: string[];
  hints: string[];
  solvedText: string;
}

export interface Exit {
  id: string;
  label: string;
  direction: string;
  toRoomId?: RoomId;
  requiredPuzzleId?: string;
}

export interface Room {
  id: RoomId;
  name: string;
  subtitle: string;
  description: string;
  visualTone: "green" | "teal" | "purple";
  objective: string;
  clues: Clue[];
  items: InventoryItem[];
  exits: Exit[];
  puzzle: Puzzle;
}

export interface GameDefinition {
  id: string;
  title: string;
  theme: string;
  openingMission: string;
  rooms: Room[];
  startingRoomId: RoomId;
  finalRoomId: RoomId;
  finalExitId: string;
  victoryText: string;
}

export interface NarrativeEntry {
  id: string;
  speaker: "system" | "player";
  text: string;
}

export interface GameProgress {
  currentRoomId: RoomId;
  inventoryItemIds: string[];
  solvedPuzzleIds: string[];
  usedHintsByPuzzleId: Record<string, number>;
  status: GameStatus;
  narrative: NarrativeEntry[];
}

export interface CommandResult {
  progress: GameProgress;
  message: string;
  kind: CommandKind;
  changed: boolean;
}
