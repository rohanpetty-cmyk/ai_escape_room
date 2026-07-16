import type {
  EngineResult,
  Exit,
  GameDefinition,
  GameLogEntry,
  GameState,
  Item,
  PlayerActionIntent,
  Puzzle,
  Room,
} from "./types";

const logId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function normalizeText(value: string | undefined) {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function includesMeaningfulTarget(target: string | undefined, values: string[]) {
  const normalizedTarget = normalizeText(target);
  if (!normalizedTarget) return false;

  return values.some((value) => {
    const normalizedValue = normalizeText(value);
    return (
      normalizedTarget === normalizedValue ||
      normalizedTarget.includes(normalizedValue) ||
      normalizedValue.includes(normalizedTarget)
    );
  });
}

export function getCurrentRoom(game: GameDefinition, state: GameState) {
  return (
    game.rooms.find((room) => room.id === state.currentRoomId) ??
    game.rooms.find((room) => room.id === game.startRoomId) ??
    game.rooms[0]
  );
}

export function getAllItems(game: GameDefinition) {
  return game.rooms.flatMap((room) => room.items);
}

export function getInventoryItems(game: GameDefinition, state: GameState) {
  const items = getAllItems(game);
  return state.inventoryItemIds
    .map((itemId) => items.find((item) => item.id === itemId))
    .filter(Boolean) as Item[];
}

export function isPuzzleSolved(puzzle: Puzzle, state: GameState) {
  return state.solvedPuzzleIds.includes(puzzle.id);
}

export function isExitUnlocked(exit: Exit, state: GameState) {
  return (
    !exit.lockedByPuzzleId ||
    state.solvedPuzzleIds.includes(exit.lockedByPuzzleId) ||
    state.unlockedExitIds.includes(exit.id)
  );
}

export function createInitialState(game: GameDefinition): GameState {
  return {
    gameId: game.id,
    currentRoomId: game.startRoomId,
    visitedRoomIds: [game.startRoomId],
    inventoryItemIds: [],
    solvedPuzzleIds: [],
    unlockedExitIds: [],
    usedHintCountsByPuzzleId: {},
    status: "playing",
    startedAt: Date.now(),
    log: [
      {
        id: logId(),
        type: "system",
        text: game.openingMission,
        createdAt: Date.now(),
      },
    ],
  };
}

function addLog(
  state: GameState,
  text: string,
  type: GameLogEntry["type"] = "system",
) {
  return {
    ...state,
    log: [
      ...state.log,
      {
        id: logId(),
        type,
        text,
        createdAt: Date.now(),
      },
    ].slice(-60),
  };
}

function finish(
  state: GameState,
  message: string,
  changed: boolean,
  type: GameLogEntry["type"] = "system",
  victory = false,
): EngineResult {
  return {
    state: addLog(state, message, type),
    message,
    changed,
    victory,
  };
}

function visibleItems(room: Room, state: GameState) {
  return room.items.filter((item) => !state.inventoryItemIds.includes(item.id));
}

export function describeRoom(room: Room, state: GameState) {
  const unsolved = !isPuzzleSolved(room.puzzle, state);
  const items = visibleItems(room, state);
  const exits = room.exits.map((exit) =>
    isExitUnlocked(exit, state)
      ? `${exit.direction}: ${exit.label}`
      : `${exit.direction}: ${exit.lockedDescription ?? "locked"}`,
  );

  return [
    room.description,
    items.length
      ? `You can see ${items.map((item) => item.name).join(", ")}.`
      : "There are no loose items left here.",
    room.clues.length
      ? `Notable clues: ${room.clues.map((clue) => clue.label).join(", ")}.`
      : "",
    unsolved ? `Puzzle: ${room.puzzle.prompt}` : room.puzzle.solvedText,
    exits.length ? `Exits: ${exits.join("; ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function findCurrentItem(room: Room, state: GameState, target?: string) {
  return visibleItems(room, state).find((item) =>
    includesMeaningfulTarget(target, [item.id, item.name]),
  );
}

function findInventoryItem(
  game: GameDefinition,
  state: GameState,
  target?: string,
) {
  return getInventoryItems(game, state).find((item) =>
    includesMeaningfulTarget(target, [item.id, item.name]),
  );
}

function findClue(room: Room, target?: string) {
  return room.clues.find((clue) =>
    includesMeaningfulTarget(target, [clue.id, clue.label]),
  );
}

function findExit(room: Room, target?: string) {
  return room.exits.find((exit) =>
    includesMeaningfulTarget(target, [
      exit.id,
      exit.label,
      exit.direction,
      `${exit.direction} ${exit.label}`,
    ]),
  );
}

function answerMatches(puzzle: Puzzle, answer?: string) {
  const normalizedAnswer = normalizeText(answer);
  return [puzzle.answer, ...puzzle.acceptedAnswers].some(
    (accepted) => normalizeText(accepted) === normalizedAnswer,
  );
}

function solvePuzzle(
  game: GameDefinition,
  state: GameState,
  room: Room,
): GameState {
  const solvedPuzzleIds = state.solvedPuzzleIds.includes(room.puzzle.id)
    ? state.solvedPuzzleIds
    : [...state.solvedPuzzleIds, room.puzzle.id];

  const unlockedExitIds =
    room.puzzle.unlocksExitId &&
    !state.unlockedExitIds.includes(room.puzzle.unlocksExitId)
      ? [...state.unlockedExitIds, room.puzzle.unlocksExitId]
      : state.unlockedExitIds;

  const grantedItem =
    room.puzzle.grantsItemId &&
    getAllItems(game).find((item) => item.id === room.puzzle.grantsItemId);

  const inventoryItemIds =
    grantedItem && !state.inventoryItemIds.includes(grantedItem.id)
      ? [...state.inventoryItemIds, grantedItem.id]
      : state.inventoryItemIds;

  return {
    ...state,
    solvedPuzzleIds,
    unlockedExitIds,
    inventoryItemIds,
  };
}

function hasRequiredItems(
  game: GameDefinition,
  state: GameState,
  puzzle: Puzzle,
) {
  const missing = (puzzle.requiredItemIds ?? []).filter(
    (itemId) => !state.inventoryItemIds.includes(itemId),
  );

  return {
    ok: missing.length === 0,
    missingNames: missing.map(
      (itemId) =>
        getAllItems(game).find((item) => item.id === itemId)?.name ?? itemId,
    ),
  };
}

function allFinalPuzzlesSolved(game: GameDefinition, state: GameState) {
  return game.finalEscape.requiredPuzzleIds.every((puzzleId) =>
    state.solvedPuzzleIds.includes(puzzleId),
  );
}

export function executeAction(
  game: GameDefinition,
  currentState: GameState,
  intent: PlayerActionIntent,
  rawAction?: string,
): EngineResult {
  if (currentState.status !== "playing") {
    return {
      state: currentState,
      message: "The escape is already complete.",
      changed: false,
      victory: currentState.status === "escaped",
    };
  }

  let state = rawAction ? addLog(currentState, rawAction, "user") : currentState;
  const room = getCurrentRoom(game, state);

  if (intent.type === "look") {
    return finish(state, describeRoom(room, state), false);
  }

  if (intent.type === "hint") {
    if (isPuzzleSolved(room.puzzle, state)) {
      return finish(state, "This room's puzzle is already solved.", false);
    }

    const used = state.usedHintCountsByPuzzleId[room.puzzle.id] ?? 0;
    const nextHint = room.puzzle.hints[used];

    if (!nextHint) {
      return finish(state, "No more hints are available for this puzzle.", false);
    }

    state = {
      ...state,
      usedHintCountsByPuzzleId: {
        ...state.usedHintCountsByPuzzleId,
        [room.puzzle.id]: used + 1,
      },
    };

    return finish(state, nextHint.text, true, "hint");
  }

  if (intent.type === "inspect") {
    const target = intent.target ?? intent.secondaryTarget;
    const item =
      findCurrentItem(room, state, target) ??
      findInventoryItem(game, state, target);
    if (item) return finish(state, item.description, false);

    const clue = findClue(room, target);
    if (clue) return finish(state, clue.text, false);

    const exit = findExit(room, target);
    if (exit) {
      const message = isExitUnlocked(exit, state)
        ? `${exit.label} is open.`
        : exit.lockedDescription ?? `${exit.label} is locked.`;
      return finish(state, message, false);
    }

    if (includesMeaningfulTarget(target, ["puzzle", "console", room.puzzle.id])) {
      return finish(state, room.puzzle.prompt, false);
    }

    return finish(state, describeRoom(room, state), false);
  }

  if (intent.type === "take") {
    const item = findCurrentItem(room, state, intent.target);

    if (!item) {
      return finish(state, "You do not see anything like that to take.", false);
    }

    if (!item.portable) {
      return finish(state, `${item.name} is fixed in place.`, false);
    }

    state = {
      ...state,
      inventoryItemIds: [...state.inventoryItemIds, item.id],
    };

    return finish(state, `Taken: ${item.name}.`, true, "success");
  }

  if (intent.type === "use") {
    const item =
      findInventoryItem(game, state, intent.target) ??
      findInventoryItem(game, state, intent.secondaryTarget);

    if (!item) {
      return finish(state, "You are not carrying that item.", false);
    }

    if (
      !isPuzzleSolved(room.puzzle, state) &&
      (room.puzzle.requiredItemIds ?? []).includes(item.id)
    ) {
      return finish(
        state,
        `${item.name} fits the setup. The lock is waiting for the right answer.`,
        false,
      );
    }

    return finish(state, `${item.name} does not seem useful here yet.`, false);
  }

  if (intent.type === "combine") {
    return finish(
      state,
      "Those parts do not form a useful mechanism right now.",
      false,
    );
  }

  if (intent.type === "answer") {
    if (isPuzzleSolved(room.puzzle, state)) {
      return finish(state, "This room's puzzle is already solved.", false);
    }

    const required = hasRequiredItems(game, state, room.puzzle);
    if (!required.ok) {
      return finish(
        state,
        `You still need ${required.missingNames.join(", ")} before that answer will work.`,
        false,
      );
    }

    if (!answerMatches(room.puzzle, intent.answer ?? intent.target)) {
      return finish(state, "The mechanism rejects that answer.", false, "error");
    }

    state = solvePuzzle(game, state, room);
    return finish(state, room.puzzle.solvedText, true, "success");
  }

  if (intent.type === "move") {
    const exit = findExit(room, intent.direction ?? intent.target);

    if (!exit) {
      return finish(state, "There is no exit in that direction.", false);
    }

    if (!isExitUnlocked(exit, state)) {
      return finish(
        state,
        exit.lockedDescription ?? "That exit is still locked.",
        false,
      );
    }

    const isFinalExit =
      room.id === game.finalEscape.escapeRoomId &&
      exit.id === game.finalEscape.escapeExitId;

    if (isFinalExit) {
      if (!allFinalPuzzlesSolved(game, state)) {
        return finish(state, "The final lock is still missing a solved room.", false);
      }

      state = {
        ...state,
        status: "escaped",
        completedAt: Date.now(),
      };

      return finish(
        state,
        game.finalEscape.victoryText,
        true,
        "success",
        true,
      );
    }

    const nextRoom = game.rooms.find((candidate) => candidate.id === exit.toRoomId);
    if (!nextRoom) {
      return finish(state, "The path ends at a sealed bulkhead.", false);
    }

    state = {
      ...state,
      currentRoomId: nextRoom.id,
      visitedRoomIds: state.visitedRoomIds.includes(nextRoom.id)
        ? state.visitedRoomIds
        : [...state.visitedRoomIds, nextRoom.id],
    };

    return finish(state, describeRoom(nextRoom, state), true);
  }

  return finish(
    state,
    "Try a clear action like inspect the console, take the lens, answer dawn, or move east.",
    false,
  );
}

export function parsePlayerActionText(text: string): PlayerActionIntent {
  const trimmed = text.trim();
  const normalized = normalizeText(trimmed);

  if (!normalized) {
    return { type: "unknown", confidence: 0 };
  }

  if (/^(look|look around|room|describe|where am i)\b/.test(normalized)) {
    return { type: "look", confidence: 0.9 };
  }

  if (/^(hint|help|clue)\b/.test(normalized)) {
    return { type: "hint", confidence: 0.9 };
  }

  const answerMatch = normalized.match(
    /^(answer|enter|say|submit|code|password)\s+(.+)$/,
  );
  if (answerMatch) {
    return { type: "answer", answer: answerMatch[2], confidence: 0.86 };
  }

  const takeMatch = normalized.match(/^(take|get|grab|pick up)\s+(.+)$/);
  if (takeMatch) {
    return { type: "take", target: takeMatch[2], confidence: 0.84 };
  }

  const inspectMatch = normalized.match(
    /^(inspect|examine|read|check|study|scan)\s+(.+)$/,
  );
  if (inspectMatch) {
    return { type: "inspect", target: inspectMatch[2], confidence: 0.84 };
  }

  const useMatch = normalized.match(
    /^(use|place|insert|apply|put)\s+(.+?)(?:\s+(?:on|with|in|into|to)\s+(.+))?$/,
  );
  if (useMatch) {
    return {
      type: "use",
      target: useMatch[1],
      secondaryTarget: useMatch[2],
      confidence: 0.78,
    };
  }

  const moveMatch = normalized.match(
    /^(move|go|walk|enter|open|leave|escape|exit)\s*(.*)$/,
  );
  if (moveMatch) {
    return {
      type: "move",
      direction: moveMatch[2] || "exit",
      target: moveMatch[2] || "exit",
      confidence: 0.8,
    };
  }

  if (["north", "south", "east", "west", "up", "down", "exit"].includes(normalized)) {
    return { type: "move", direction: normalized, confidence: 0.82 };
  }

  return { type: "unknown", target: trimmed, confidence: 0.25 };
}
