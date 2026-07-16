import type {
  GameEffect,
  GameState,
  InventoryItem,
  NarrativeEntry,
  PlayerActionIntent,
  PlayerActionResult,
  Room,
  RoomExit,
  RoomObject,
  Puzzle,
} from "./types";

export interface EffectValidationResult {
  valid: boolean;
  reason?: string;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeNarrative(
  role: NarrativeEntry["role"],
  content: string,
): NarrativeEntry {
  return {
    id: makeId(),
    role,
    content,
    timestamp: Date.now(),
  };
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function textMatches(input: string, candidates: string[]) {
  const normalizedInput = normalizeText(input);

  return candidates.some((candidate) => {
    const normalizedCandidate = normalizeText(candidate);
    return (
      normalizedInput === normalizedCandidate ||
      normalizedInput.includes(normalizedCandidate) ||
      normalizedCandidate.includes(normalizedInput)
    );
  });
}

function objectiveIdForRoom(roomId: string) {
  return `objective-${roomId}`;
}

function valid(): EffectValidationResult {
  return { valid: true };
}

function invalid(reason: string): EffectValidationResult {
  return { valid: false, reason };
}

function logRejectedEffect(effect: GameEffect, reason: string) {
  if (process.env.NODE_ENV === "development") {
    console.warn("[game-engine] rejected effect", { effect, reason });
  }
}

export function createInitialGame(game: GameState): GameState {
  return {
    ...game,
    currentRoomId: game.rooms[0]?.id ?? game.currentRoomId,
    rooms: game.rooms.map((room) => ({
      ...room,
      completed: false,
      objects: room.objects.map((object) => ({
        ...object,
        discoveredClueIds: [...object.discoveredClueIds],
      })),
      clues: room.clues.map((clue) => ({ ...clue })),
      exits: room.exits.map((exit) => ({ ...exit })),
      puzzle: {
        ...room.puzzle,
        acceptedAnswers: [...room.puzzle.acceptedAnswers],
        clueIds: [...room.puzzle.clueIds],
        hintLevels: [...room.puzzle.hintLevels],
        solved: false,
      },
    })),
    inventory: [],
    discoveredClueIds: [],
    solvedPuzzleIds: [],
    objectives: game.objectives.map((objective) => ({
      ...objective,
      completed: false,
    })),
    narrativeHistory: [makeNarrative("system", game.openingMission)],
    hintsUsed: {},
    status: "playing",
    startedAt: Date.now(),
  };
}

export function getCurrentRoom(game: GameState): Room {
  const room = game.rooms.find((candidate) => candidate.id === game.currentRoomId);

  if (!room) {
    throw new Error(`Room not found: ${game.currentRoomId}`);
  }

  return room;
}

export function getVisibleObjects(roomOrGame: Room | GameState): RoomObject[] {
  const room = "rooms" in roomOrGame ? getCurrentRoom(roomOrGame) : roomOrGame;
  return room.objects.filter((object) => object.visible);
}

export function availableObjects(room: Room): RoomObject[] {
  return getVisibleObjects(room);
}

export function getInventory(game: GameState): InventoryItem[] {
  return game.inventory;
}

export function isPuzzleSolved(room: Room, game: GameState): boolean {
  return room.puzzle.solved || game.solvedPuzzleIds.includes(room.puzzle.id);
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

export function isPuzzleAnswerCorrect(puzzle: Puzzle, answer: string): boolean {
  const normalizedAnswer = normalizeAnswer(answer);
  const acceptedAnswers = [puzzle.solution, ...puzzle.acceptedAnswers];

  return acceptedAnswers.some(
    (acceptedAnswer) => normalizeAnswer(acceptedAnswer) === normalizedAnswer,
  );
}

export function addInventoryItem(
  game: GameState,
  item: InventoryItem,
): GameState {
  if (game.inventory.some((candidate) => candidate.id === item.id)) {
    return game;
  }

  return {
    ...game,
    inventory: [...game.inventory, { ...item }],
  };
}

export function discoverClue(game: GameState, clueId: string): GameState {
  if (game.discoveredClueIds.includes(clueId)) {
    return game;
  }

  return {
    ...game,
    discoveredClueIds: [...game.discoveredClueIds, clueId],
  };
}

export function solvePuzzle(
  game: GameState,
  puzzleId: string,
  roomId?: string,
): GameState {
  const room = roomId
    ? game.rooms.find(
        (candidate) =>
          candidate.id === roomId && candidate.puzzle.id === puzzleId,
      )
    : game.rooms.find((candidate) => candidate.puzzle.id === puzzleId);

  if (!room || room.puzzle.solved || game.solvedPuzzleIds.includes(puzzleId)) {
    return game;
  }

  return {
    ...game,
    solvedPuzzleIds: [...game.solvedPuzzleIds, puzzleId],
    rooms: game.rooms.map((candidate) =>
      candidate.id === room.id
        ? {
            ...candidate,
            completed: true,
            puzzle: {
              ...candidate.puzzle,
              solved: true,
            },
          }
        : candidate,
    ),
  };
}

export function moveToRoom(game: GameState, roomId: string): GameState {
  if (!game.rooms.some((room) => room.id === roomId)) {
    return game;
  }

  return {
    ...game,
    currentRoomId: roomId,
  };
}

export function completeObjective(
  game: GameState,
  objectiveId: string,
): GameState {
  const objective = game.objectives.find(
    (candidate) => candidate.id === objectiveId,
  );

  if (!objective || objective.completed) {
    return game;
  }

  return {
    ...game,
    objectives: game.objectives.map((candidate) =>
      candidate.id === objectiveId
        ? { ...candidate, completed: true }
        : candidate,
    ),
  };
}

export function addNarrativeEntry(
  game: GameState,
  entry: NarrativeEntry,
): GameState {
  return {
    ...game,
    narrativeHistory: [...game.narrativeHistory, { ...entry }].slice(-40),
  };
}

export function recordHintUsed(game: GameState, puzzleId: string): GameState {
  const puzzle = findPuzzleById(game, puzzleId);

  if (!puzzle) {
    return game;
  }

  return {
    ...game,
    hintsUsed: {
      ...game.hintsUsed,
      [puzzleId]: (game.hintsUsed[puzzleId] ?? 0) + 1,
    },
  };
}

export function canMoveToRoom(game: GameState, roomId: string): boolean {
  if (!game.rooms.some((room) => room.id === roomId)) {
    return false;
  }

  const currentRoom = getCurrentRoom(game);
  const exit = currentRoom.exits.find((candidate) => candidate.toRoomId === roomId);

  if (!exit || exit.final) {
    return false;
  }

  return isExitUnlocked(game, exit);
}

export function checkVictoryCondition(game: GameState): boolean {
  const currentRoom = getCurrentRoom(game);
  const finalExit = currentRoom.exits.find((exit) => exit.final);

  return Boolean(finalExit && isExitUnlocked(game, finalExit));
}

export function validateEffect(
  game: GameState,
  effect: GameEffect,
): EffectValidationResult {
  switch (effect.type) {
    case "ADD_INVENTORY": {
      if (!effect.item.id) {
        return invalid("Inventory item is missing an id.");
      }

      if (game.inventory.some((item) => item.id === effect.item.id)) {
        return invalid(`Inventory item already exists: ${effect.item.id}.`);
      }

      if (!collectibleItemExists(game, effect.item.id)) {
        return invalid(`Inventory item does not exist in this game: ${effect.item.id}.`);
      }

      return valid();
    }
    case "DISCOVER_CLUE":
      if (!clueExists(game, effect.clueId)) {
        return invalid(`Clue does not exist: ${effect.clueId}.`);
      }

      if (game.discoveredClueIds.includes(effect.clueId)) {
        return invalid(`Clue already discovered: ${effect.clueId}.`);
      }

      return valid();
    case "SOLVE_PUZZLE": {
      const room = game.rooms.find((candidate) => candidate.id === effect.roomId);

      if (!room) {
        return invalid(`Room does not exist: ${effect.roomId}.`);
      }

      if (room.puzzle.id !== effect.puzzleId) {
        return invalid(
          `Puzzle ${effect.puzzleId} does not belong to room ${effect.roomId}.`,
        );
      }

      if (room.puzzle.solved || game.solvedPuzzleIds.includes(effect.puzzleId)) {
        return invalid(`Puzzle already solved: ${effect.puzzleId}.`);
      }

      return valid();
    }
    case "MOVE_ROOM":
      if (!game.rooms.some((room) => room.id === effect.roomId)) {
        return invalid(`Room does not exist: ${effect.roomId}.`);
      }

      if (!canMoveToRoom(game, effect.roomId)) {
        return invalid(`No unlocked exit leads to room: ${effect.roomId}.`);
      }

      return valid();
    case "COMPLETE_OBJECTIVE": {
      const objective = game.objectives.find(
        (candidate) => candidate.id === effect.objectiveId,
      );

      if (!objective) {
        return invalid(`Objective does not exist: ${effect.objectiveId}.`);
      }

      if (objective.completed) {
        return invalid(`Objective already completed: ${effect.objectiveId}.`);
      }

      return valid();
    }
    case "ESCAPE":
      if (game.status === "escaped") {
        return invalid("Game is already escaped.");
      }

      if (!checkVictoryCondition(game)) {
        return invalid("Victory condition has not been met.");
      }

      return valid();
    case "ADD_NARRATIVE":
      if (!effect.entry.id || !effect.entry.content.trim()) {
        return invalid("Narrative entry is missing required content.");
      }

      return valid();
  }
}

export function applyEffects(
  game: GameState,
  effects: GameEffect[],
): GameState {
  return effects.reduce((nextGame, effect) => {
    const validation = validateEffect(nextGame, effect);

    if (!validation.valid) {
      logRejectedEffect(effect, validation.reason ?? "Unknown rejection.");
      return nextGame;
    }

    return applyValidatedEffect(nextGame, effect);
  }, game);
}

export const applyGameEffects = applyEffects;

export function runCommand(game: GameState, command: string): PlayerActionResult {
  const cleanCommand = command.trim();

  if (!cleanCommand) {
    return result("UNKNOWN", null, false, "Enter a command first.", []);
  }

  const playerEffect: GameEffect = {
    type: "ADD_NARRATIVE",
    entry: makeNarrative("player", cleanCommand),
  };

  if (game.status === "escaped") {
    return result(
      "UNKNOWN",
      null,
      false,
      "You are already outside the lab.",
      [playerEffect],
    );
  }

  const room = getCurrentRoom(game);
  const normalized = normalizeText(cleanCommand);

  if (normalized === "look" || normalized === "look around") {
    return result(
      "LOOK",
      room.id,
      true,
      describeRoom(room, game),
      [playerEffect],
    );
  }

  if (normalized === "hint" || normalized === "request hint") {
    return requestHint(game, playerEffect);
  }

  if (normalized.startsWith("take ") || normalized.startsWith("get ")) {
    return takeObject(game, room, cleanCommand, playerEffect);
  }

  if (
    normalized.startsWith("inspect ") ||
    normalized.startsWith("examine ") ||
    normalized.startsWith("read ")
  ) {
    return inspectObject(game, room, cleanCommand, playerEffect, "INSPECT");
  }

  if (normalized.startsWith("search ")) {
    return inspectObject(game, room, cleanCommand, playerEffect, "SEARCH");
  }

  if (normalized.startsWith("use ")) {
    return handleItemUse(game, room, cleanCommand, playerEffect);
  }

  if (
    normalized.startsWith("answer ") ||
    normalized.startsWith("enter ") ||
    normalized.startsWith("say ")
  ) {
    return answerPuzzleCommand(game, room, cleanCommand, playerEffect);
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
    return movePlayerCommand(game, room, cleanCommand, playerEffect);
  }

  return result(
    "UNKNOWN",
    null,
    false,
    "Try commands like: inspect status wall, take admin badge, answer A17, request hint, or go east.",
    [playerEffect],
  );
}

export function requestHint(
  game: GameState,
  leadingEffect?: GameEffect,
): PlayerActionResult {
  const room = getCurrentRoom(game);

  if (isPuzzleSolved(room, game)) {
    return result(
      "REQUEST_HINT",
      room.puzzle.id,
      false,
      "This room's puzzle is already solved.",
      leadingEffect ? [leadingEffect] : [],
    );
  }

  const used = game.hintsUsed[room.puzzle.id] ?? 0;
  const hint = room.puzzle.hintLevels[used];

  if (!hint) {
    return result(
      "REQUEST_HINT",
      room.puzzle.id,
      false,
      "No more hints are available for this room.",
      leadingEffect ? [leadingEffect] : [],
    );
  }

  return result(
    "REQUEST_HINT",
    room.puzzle.id,
    true,
    hint,
    leadingEffect ? [leadingEffect] : [],
  );
}

function applyValidatedEffect(game: GameState, effect: GameEffect): GameState {
  switch (effect.type) {
    case "ADD_INVENTORY":
      return addInventoryItem(game, effect.item);
    case "DISCOVER_CLUE":
      return discoverClue(game, effect.clueId);
    case "SOLVE_PUZZLE":
      return solvePuzzle(game, effect.puzzleId, effect.roomId);
    case "MOVE_ROOM":
      return moveToRoom(game, effect.roomId);
    case "COMPLETE_OBJECTIVE":
      return completeObjective(game, effect.objectiveId);
    case "ESCAPE":
      return {
        ...game,
        status: "escaped",
      };
    case "ADD_NARRATIVE":
      return addNarrativeEntry(game, effect.entry);
  }
}

function describeRoom(room: Room, game: GameState) {
  const objects = getVisibleObjects(room);
  const objectText = objects.length
    ? `Visible objects: ${objects.map((object) => object.name).join(", ")}.`
    : "No visible objects stand out.";
  const exitText = room.exits.length
    ? `Exits: ${room.exits.map((exit) => `${exit.direction} ${exit.label}`).join(", ")}.`
    : "No exits are obvious.";
  const puzzleText = isPuzzleSolved(room, game)
    ? room.puzzle.successMessage
    : room.puzzle.prompt;

  return `${room.description} ${objectText} ${exitText} ${puzzleText}`;
}

function takeObject(
  game: GameState,
  room: Room,
  command: string,
  playerEffect: GameEffect,
): PlayerActionResult {
  const target = command.replace(/^(take|get)\s+/i, "");
  const object = getVisibleObjects(room).find(
    (candidate) =>
      candidate.collectibleItemId &&
      !game.inventory.some((item) => item.id === candidate.collectibleItemId) &&
      textMatches(target, [candidate.id, candidate.name]),
  );

  if (!object) {
    return result(
      "TAKE",
      null,
      false,
      "There is no loose item like that here.",
      [playerEffect],
    );
  }

  const missingItemMessage = getMissingItemMessage(game, object);
  if (missingItemMessage) {
    return result("TAKE", object.id, false, missingItemMessage, [playerEffect]);
  }

  const item = itemFromObject(object);
  const discoveryEffects = getDiscoveryEffects(game, room, object);

  return result(
    "TAKE",
    object.id,
    true,
    `Taken: ${item.name}. ${describeDiscoveredClues(room, object)}`.trim(),
    [
      playerEffect,
      ...discoveryEffects,
      {
        type: "ADD_INVENTORY",
        item,
      },
    ],
  );
}

function inspectObject(
  game: GameState,
  room: Room,
  command: string,
  playerEffect: GameEffect,
  intent: "INSPECT" | "SEARCH",
): PlayerActionResult {
  const target = command.replace(/^(inspect|examine|read|search)\s+/i, "");
  const clue = room.clues.find((candidate) =>
    textMatches(target, [candidate.id, candidate.title]),
  );

  if (clue && game.discoveredClueIds.includes(clue.id)) {
    return result(intent, clue.id, true, clue.content, [playerEffect]);
  }

  const object = getVisibleObjects(room).find((candidate) =>
    textMatches(target, [candidate.id, candidate.name]),
  );

  if (!object) {
    return result(intent, null, false, describeRoom(room, game), [playerEffect]);
  }

  const missingItemMessage = getMissingItemMessage(game, object);
  if (missingItemMessage) {
    return result(intent, object.id, false, missingItemMessage, [playerEffect]);
  }

  const discoveryEffects = object.searchable
    ? getDiscoveryEffects(game, room, object)
    : [];
  const clueText = object.searchable ? describeDiscoveredClues(room, object) : "";

  return result(
    intent,
    object.id,
    true,
    `${object.description} ${clueText}`.trim(),
    [playerEffect, ...discoveryEffects],
  );
}

function handleItemUse(
  game: GameState,
  room: Room,
  command: string,
  playerEffect: GameEffect,
): PlayerActionResult {
  const target = command.replace(/^use\s+/i, "");
  const useMatch = target.match(/^(.+?)\s+(?:on|with|in|at)\s+(.+)$/i);

  if (!useMatch) {
    return result(
      "USE",
      null,
      false,
      "Use what, and on which part of the room?",
      [playerEffect],
    );
  }

  const [, itemTarget, objectTarget] = useMatch;
  const item = game.inventory.find((candidate) =>
    textMatches(itemTarget, [candidate.id, candidate.name]),
  );

  if (!item) {
    return result("USE", null, false, "You are not carrying that item.", [
      playerEffect,
    ]);
  }

  const object = getVisibleObjects(room).find((candidate) =>
    textMatches(objectTarget, [candidate.id, candidate.name]),
  );

  if (!object) {
    return result("USE", null, false, "There is nothing like that here.", [
      playerEffect,
    ]);
  }

  if (object.requiredItemId && object.requiredItemId !== item.id) {
    return result(
      "USE",
      object.id,
      false,
      `${item.name} does not connect cleanly with ${object.name}.`,
      [playerEffect],
    );
  }

  if (!object.requiredItemId) {
    return result(
      "USE",
      object.id,
      false,
      `${object.name} does not seem to need ${item.name}.`,
      [playerEffect],
    );
  }

  const discoveryEffects = getDiscoveryEffects(game, room, object);

  return result(
    "USE",
    object.id,
    true,
    `${object.description} ${describeDiscoveredClues(room, object)}`.trim(),
    [playerEffect, ...discoveryEffects],
  );
}

function answerPuzzleCommand(
  game: GameState,
  room: Room,
  command: string,
  playerEffect: GameEffect,
): PlayerActionResult {
  if (isPuzzleSolved(room, game)) {
    return result(
      "ANSWER",
      room.puzzle.id,
      false,
      "This puzzle is already solved.",
      [playerEffect],
    );
  }

  const answer = command.replace(/^(answer|enter|say)\s+/i, "");

  if (!isPuzzleAnswerCorrect(room.puzzle, answer)) {
    return result(
      "ANSWER",
      room.puzzle.id,
      false,
      "The mechanism rejects that answer.",
      [playerEffect],
    );
  }

  return result("ANSWER", room.puzzle.id, true, room.puzzle.successMessage, [
    playerEffect,
    {
      type: "SOLVE_PUZZLE",
      puzzleId: room.puzzle.id,
      roomId: room.id,
    },
    {
      type: "COMPLETE_OBJECTIVE",
      objectiveId: objectiveIdForRoom(room.id),
    },
  ]);
}

function movePlayerCommand(
  game: GameState,
  room: Room,
  command: string,
  playerEffect: GameEffect,
): PlayerActionResult {
  const target = command.replace(/^(go|move)\s+/i, "");
  const exit = room.exits.find((candidate) =>
    textMatches(target, [
      candidate.id,
      candidate.label,
      candidate.direction,
      `${candidate.direction} ${candidate.label}`,
    ]),
  );

  if (!exit) {
    return result(
      "MOVE",
      null,
      false,
      "There is no exit in that direction.",
      [playerEffect],
    );
  }

  if (!isExitUnlocked(game, exit)) {
    return result("MOVE", exit.id, false, "That exit is still locked.", [
      playerEffect,
    ]);
  }

  if (exit.final) {
    return result(
      "MOVE",
      exit.id,
      true,
      "The emergency hatch opens. Clean air rushes in as the autonomous AI loses its final physical lock on the lab.",
      [
        playerEffect,
        {
          type: "COMPLETE_OBJECTIVE",
          objectiveId: objectiveIdForRoom(room.id),
        },
        {
          type: "ESCAPE",
        },
      ],
    );
  }

  if (!exit.toRoomId) {
    return result("MOVE", exit.id, false, "That route is sealed.", [
      playerEffect,
    ]);
  }

  const nextRoom = game.rooms.find((candidate) => candidate.id === exit.toRoomId);

  return result(
    "MOVE",
    exit.id,
    true,
    nextRoom ? describeRoom(nextRoom, game) : "You move into the next room.",
    [
      playerEffect,
      {
        type: "MOVE_ROOM",
        roomId: exit.toRoomId,
      },
    ],
  );
}

function result(
  intent: PlayerActionIntent,
  targetId: string | null,
  valid: boolean,
  narration: string,
  effects: GameEffect[],
): PlayerActionResult {
  return {
    intent,
    targetId,
    valid,
    narration,
    effects: [
      ...effects,
      {
        type: "ADD_NARRATIVE",
        entry: makeNarrative("system", narration),
      },
    ],
  };
}

function itemFromObject(object: RoomObject): InventoryItem {
  return {
    id: object.collectibleItemId ?? object.id,
    name: object.name,
    description: object.description,
    icon: iconForItem(object.collectibleItemId ?? object.id),
  };
}

function iconForItem(itemId: string) {
  if (itemId.includes("badge")) return "badge";
  if (itemId.includes("screwdriver")) return "tool";
  if (itemId.includes("cable")) return "cable";
  if (itemId.includes("coolant")) return "snow";
  if (itemId.includes("card")) return "card";

  return "box";
}

function getDiscoveryEffects(
  game: GameState,
  room: Room,
  object: RoomObject,
): GameEffect[] {
  const roomClueIds = new Set(room.clues.map((clue) => clue.id));

  return object.discoveredClueIds
    .filter(
      (clueId) =>
        roomClueIds.has(clueId) && !game.discoveredClueIds.includes(clueId),
    )
    .map((clueId) => ({
      type: "DISCOVER_CLUE",
      clueId,
    }));
}

function describeDiscoveredClues(room: Room, object: RoomObject) {
  const clueText = object.discoveredClueIds
    .map((clueId) => room.clues.find((clue) => clue.id === clueId))
    .filter((clue): clue is NonNullable<typeof clue> => Boolean(clue))
    .map((clue) => clue.content);

  return clueText.join(" ");
}

function getMissingItemMessage(game: GameState, object: RoomObject) {
  if (!object.requiredItemId) {
    return null;
  }

  const item = game.inventory.find(
    (candidate) => candidate.id === object.requiredItemId,
  );

  if (item) {
    return null;
  }

  return `You need ${formatItemName(object.requiredItemId)} before that object makes sense.`;
}

function formatItemName(itemId: string) {
  return itemId.replaceAll("-", " ");
}

function isExitUnlocked(game: GameState, exit: RoomExit): boolean {
  return (
    !exit.requiredPuzzleId ||
    game.solvedPuzzleIds.includes(exit.requiredPuzzleId)
  );
}

function clueExists(game: GameState, clueId: string): boolean {
  return game.rooms.some((room) => room.clues.some((clue) => clue.id === clueId));
}

function collectibleItemExists(game: GameState, itemId: string): boolean {
  return game.rooms.some((room) =>
    room.objects.some((object) => object.collectibleItemId === itemId),
  );
}

function findPuzzleById(game: GameState, puzzleId: string): Puzzle | undefined {
  return game.rooms.find((room) => room.puzzle.id === puzzleId)?.puzzle;
}
