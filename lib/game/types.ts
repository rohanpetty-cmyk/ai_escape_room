export type GameMode = "demo" | "generated";

export type ActionType =
  | "look"
  | "inspect"
  | "take"
  | "use"
  | "combine"
  | "move"
  | "answer"
  | "hint"
  | "unknown";

export type GameStatus = "playing" | "escaped" | "failed";

export interface Hint {
  text: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  portable: boolean;
}

export interface Clue {
  id: string;
  label: string;
  text: string;
}

export interface Exit {
  id: string;
  label: string;
  direction: string;
  toRoomId?: string | null;
  lockedByPuzzleId?: string | null;
  lockedDescription?: string;
}

export interface Puzzle {
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

export interface Room {
  id: string;
  name: string;
  description: string;
  imageKey: string;
  exits: Exit[];
  clues: Clue[];
  items: Item[];
  puzzle: Puzzle;
}

export interface FinalEscapeCondition {
  requiredPuzzleIds: string[];
  escapeRoomId: string;
  escapeExitId: string;
  victoryText: string;
}

export interface GameDefinition {
  id: string;
  mode: GameMode;
  theme: string;
  title: string;
  openingMission: string;
  rooms: Room[];
  startRoomId: string;
  finalEscape: FinalEscapeCondition;
}

export interface GameLogEntry {
  id: string;
  type: "user" | "system" | "success" | "hint" | "error";
  text: string;
  createdAt: number;
}

export interface GameState {
  gameId: string;
  currentRoomId: string;
  visitedRoomIds: string[];
  inventoryItemIds: string[];
  solvedPuzzleIds: string[];
  unlockedExitIds: string[];
  usedHintCountsByPuzzleId: Record<string, number>;
  log: GameLogEntry[];
  status: GameStatus;
  startedAt: number;
  completedAt?: number;
}

export interface PlayerActionIntent {
  type: ActionType;
  target?: string;
  secondaryTarget?: string;
  answer?: string;
  direction?: string;
  confidence: number;
}

export interface EngineResult {
  state: GameState;
  message: string;
  changed: boolean;
  victory?: boolean;
}
