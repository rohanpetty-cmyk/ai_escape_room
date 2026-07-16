export type GameStatus = "not_started" | "playing" | "escaped";

export type PlayerActionIntent =
  | "LOOK"
  | "INSPECT"
  | "TAKE"
  | "ANSWER"
  | "MOVE"
  | "REQUEST_HINT"
  | "UNKNOWN";

export type PuzzleType = "word" | "sequence" | "logic" | "code";

export type VisualTheme = "green" | "teal" | "purple";

export type NarrativeRole = "system" | "player" | "assistant";

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Clue {
  id: string;
  title: string;
  content: string;
}

export interface Objective {
  id: string;
  text: string;
  completed: boolean;
}

export interface NarrativeEntry {
  id: string;
  role: NarrativeRole;
  content: string;
  timestamp: number;
}

export interface RoomObject {
  id: string;
  name: string;
  description: string;
  visible: boolean;
  searchable: boolean;
  requiredItemId: string | null;
  discoveredClueIds: string[];
  collectibleItemId: string | null;
}

export interface Puzzle {
  id: string;
  type: PuzzleType;
  prompt: string;
  solution: string;
  acceptedAnswers: string[];
  clueIds: string[];
  hintLevels: string[];
  solved: boolean;
  successMessage: string;
}

export interface RoomExit {
  id: string;
  label: string;
  direction: string;
  toRoomId: string | null;
  requiredPuzzleId: string | null;
  final: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  visualTheme: VisualTheme;
  objects: RoomObject[];
  puzzle: Puzzle;
  exits: RoomExit[];
  completed: boolean;
  // Clues live on the room and are referenced by objects and puzzles by id.
  clues: Clue[];
}

export interface GameState {
  id: string;
  title: string;
  theme: string;
  openingMission: string;
  currentRoomId: string;
  rooms: Room[];
  inventory: InventoryItem[];
  discoveredClueIds: string[];
  solvedPuzzleIds: string[];
  objectives: Objective[];
  narrativeHistory: NarrativeEntry[];
  hintsUsed: Record<string, number>;
  status: GameStatus;
  startedAt: number;
  demoMode: boolean;
}

export type GameEffect =
  | {
      type: "ADD_INVENTORY";
      item: InventoryItem;
    }
  | {
      type: "DISCOVER_CLUE";
      clueId: string;
    }
  | {
      type: "SOLVE_PUZZLE";
      puzzleId: string;
      roomId: string;
    }
  | {
      type: "MOVE_ROOM";
      roomId: string;
    }
  | {
      type: "COMPLETE_OBJECTIVE";
      objectiveId: string;
    }
  | {
      type: "ESCAPE";
    }
  | {
      type: "ADD_NARRATIVE";
      entry: NarrativeEntry;
    };

export interface PlayerActionResult {
  intent: PlayerActionIntent;
  targetId: string | null;
  valid: boolean;
  narration: string;
  effects: GameEffect[];
}
