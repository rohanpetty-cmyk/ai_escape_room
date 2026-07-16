import type {
  CommandKind,
  CommandResult,
  GameDefinition,
  GameProgress,
  InventoryItem,
  NarrativeEntry,
  Room,
} from "./types";

function makeEntry(speaker: NarrativeEntry["speaker"], text: string): NarrativeEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    speaker,
    text,
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function textMatches(input: string, candidates: string[]) {
  const normalizedInput = normalize(input);

  return candidates.some((candidate) => {
    const normalizedCandidate = normalize(candidate);
    return (
      normalizedInput === normalizedCandidate ||
      normalizedInput.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedInput)
    );
  });
}

function withNarrative(
  progress: GameProgress,
  speaker: NarrativeEntry["speaker"],
  text: string,
): GameProgress {
  return {
    ...progress,
    narrative: [...progress.narrative, makeEntry(speaker, text)].slice(-40),
  };
}

export function createInitialProgress(game: GameDefinition): GameProgress {
  return {
    currentRoomId: game.startingRoomId,
    inventoryItemIds: [],
    solvedPuzzleIds: [],
    usedHintsByPuzzleId: {},
    status: "playing",
    narrative: [makeEntry("system", game.openingMission)],
  };
}

export function getCurrentRoom(game: GameDefinition, progress: GameProgress) {
  const room = game.rooms.find((candidate) => candidate.id === progress.currentRoomId);

  if (!room) {
    throw new Error(`Room not found: ${progress.currentRoomId}`);
  }

  return room;
}

export function getInventory(game: GameDefinition, progress: GameProgress) {
  const allItems = game.rooms.flatMap((room) => room.items);

  return progress.inventoryItemIds
    .map((itemId) => allItems.find((item) => item.id === itemId))
    .filter((item): item is InventoryItem => Boolean(item));
}

export function isPuzzleSolved(room: Room, progress: GameProgress) {
  return progress.solvedPuzzleIds.includes(room.puzzle.id);
}

export function availableItems(room: Room, progress: GameProgress) {
  return room.items.filter((item) => !progress.inventoryItemIds.includes(item.id));
}

export function runCommand(
  game: GameDefinition,
  progress: GameProgress,
  command: string,
): CommandResult {
  const room = getCurrentRoom(game, progress);
  const cleanCommand = command.trim();
  const normalized = normalize(cleanCommand);

  if (!cleanCommand) {
    return result(progress, "Enter a command first.", "unknown", false);
  }

  const afterPlayer = withNarrative(progress, "player", cleanCommand);

  if (afterPlayer.status === "escaped") {
    return result(afterPlayer, "You are already outside the lab.", "unknown", false);
  }

  if (normalized === "look" || normalized === "look around") {
    return result(afterPlayer, describeRoom(room, afterPlayer), "look", false);
  }

  if (normalized.startsWith("take ") || normalized.startsWith("get ")) {
    return takeItem(room, afterPlayer, cleanCommand);
  }

  if (
    normalized.startsWith("inspect ") ||
    normalized.startsWith("examine ") ||
    normalized.startsWith("read ")
  ) {
    return inspectTarget(game, room, afterPlayer, cleanCommand);
  }

  if (
    normalized.startsWith("answer ") ||
    normalized.startsWith("enter ") ||
    normalized.startsWith("say ")
  ) {
    return solvePuzzle(game, room, afterPlayer, cleanCommand);
  }

  if (
    normalized.startsWith("go ") ||
    normalized.startsWith("move ") ||
    normalized === "east" ||
    normalized === "west" ||
    normalized === "north" ||
    normalized === "south" ||
    normalized === "exit"
  ) {
    return movePlayer(game, room, afterPlayer, cleanCommand);
  }

  return result(
    afterPlayer,
    "Try commands like: inspect diagnostic screen, take calibration lens, answer signal, or go east.",
    "unknown",
    false,
  );
}

export function requestHint(
  game: GameDefinition,
  progress: GameProgress,
): CommandResult {
  const room = getCurrentRoom(game, progress);

  if (isPuzzleSolved(room, progress)) {
    return result(progress, "This room's puzzle is already solved.", "hint", false);
  }

  const used = progress.usedHintsByPuzzleId[room.puzzle.id] ?? 0;
  const hint = room.puzzle.hints[used];

  if (!hint) {
    return result(progress, "No more hints are available for this room.", "hint", false);
  }

  const nextProgress: GameProgress = {
    ...progress,
    usedHintsByPuzzleId: {
      ...progress.usedHintsByPuzzleId,
      [room.puzzle.id]: used + 1,
    },
  };

  return result(nextProgress, hint, "hint", true);
}

function describeRoom(room: Room, progress: GameProgress) {
  const items = availableItems(room, progress);
  const solved = isPuzzleSolved(room, progress);
  const itemText = items.length
    ? `Loose item: ${items.map((item) => item.name).join(", ")}.`
    : "No loose items remain.";
  const clueText = `Clues: ${room.clues.map((clue) => clue.label).join(", ")}.`;
  const puzzleText = solved ? room.puzzle.solvedText : room.puzzle.prompt;

  return `${room.description} ${itemText} ${clueText} ${puzzleText}`;
}

function takeItem(
  room: Room,
  progress: GameProgress,
  command: string,
): CommandResult {
  const target = command.replace(/^(take|get)\s+/i, "");
  const item = availableItems(room, progress).find((candidate) =>
    textMatches(target, [candidate.id, candidate.name]),
  );

  if (!item) {
    return result(progress, "There is no loose item like that here.", "take", false);
  }

  const nextProgress: GameProgress = {
    ...progress,
    inventoryItemIds: [...progress.inventoryItemIds, item.id],
  };

  return result(nextProgress, `Taken: ${item.name}.`, "take", true);
}

function inspectTarget(
  game: GameDefinition,
  room: Room,
  progress: GameProgress,
  command: string,
): CommandResult {
  const target = command.replace(/^(inspect|examine|read)\s+/i, "");
  const clue = room.clues.find((candidate) =>
    textMatches(target, [candidate.id, candidate.label]),
  );

  if (clue) {
    return result(progress, clue.text, "inspect", false);
  }

  const item =
    availableItems(room, progress).find((candidate) =>
      textMatches(target, [candidate.id, candidate.name]),
    ) ??
    getInventory(game, progress).find((candidate) =>
      textMatches(target, [candidate.id, candidate.name]),
    );

  if (item) {
    return result(progress, item.description, "inspect", false);
  }

  return result(progress, describeRoom(room, progress), "inspect", false);
}

function solvePuzzle(
  game: GameDefinition,
  room: Room,
  progress: GameProgress,
  command: string,
): CommandResult {
  if (isPuzzleSolved(room, progress)) {
    return result(progress, "This puzzle is already solved.", "answer", false);
  }

  const missingItems = room.puzzle.requiredItemIds.filter(
    (itemId) => !progress.inventoryItemIds.includes(itemId),
  );

  if (missingItems.length > 0) {
    return result(
      progress,
      "You are missing something important before this answer will work.",
      "answer",
      false,
    );
  }

  const answer = command.replace(/^(answer|enter|say)\s+/i, "");
  const accepted = [room.puzzle.answer, ...room.puzzle.acceptedAnswers];

  if (!accepted.some((candidate) => normalize(candidate) === normalize(answer))) {
    return result(progress, "The mechanism rejects that answer.", "answer", false);
  }

  const nextProgress: GameProgress = {
    ...progress,
    solvedPuzzleIds: [...progress.solvedPuzzleIds, room.puzzle.id],
  };

  const message =
    room.id === game.finalRoomId
      ? `${room.puzzle.solvedText} The final exit is ready.`
      : room.puzzle.solvedText;

  return result(nextProgress, message, "answer", true);
}

function movePlayer(
  game: GameDefinition,
  room: Room,
  progress: GameProgress,
  command: string,
): CommandResult {
  const target = command.replace(/^(go|move)\s+/i, "");
  const exit = room.exits.find((candidate) =>
    textMatches(target, [candidate.id, candidate.label, candidate.direction]),
  );

  if (!exit) {
    return result(progress, "There is no exit in that direction.", "move", false);
  }

  if (
    exit.requiredPuzzleId &&
    !progress.solvedPuzzleIds.includes(exit.requiredPuzzleId)
  ) {
    return result(progress, "That exit is still locked.", "move", false);
  }

  if (room.id === game.finalRoomId && exit.id === game.finalExitId) {
    const escapedProgress: GameProgress = {
      ...progress,
      status: "escaped",
    };

    return result(escapedProgress, game.victoryText, "move", true);
  }

  if (!exit.toRoomId) {
    return result(progress, "That route is sealed.", "move", false);
  }

  const nextProgress: GameProgress = {
    ...progress,
    currentRoomId: exit.toRoomId,
  };
  const nextRoom = getCurrentRoom(game, nextProgress);

  return result(nextProgress, describeRoom(nextRoom, nextProgress), "move", true);
}

function result(
  progress: GameProgress,
  message: string,
  kind: CommandKind,
  changed: boolean,
): CommandResult {
  return {
    progress: withNarrative(progress, "system", message),
    message,
    kind,
    changed,
  };
}
