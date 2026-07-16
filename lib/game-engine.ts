import type {
  GameEffect,
  GameState,
  InventoryItem,
  NarrativeEntry,
  PlayerActionIntent,
  PlayerActionResult,
  Room,
  RoomObject,
} from "./types";

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

function objectiveIdForRoom(roomId: string) {
  return `objective-${roomId}`;
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

export function getCurrentRoom(game: GameState) {
  const room = game.rooms.find((candidate) => candidate.id === game.currentRoomId);

  if (!room) {
    throw new Error(`Room not found: ${game.currentRoomId}`);
  }

  return room;
}

export function getInventory(game: GameState) {
  return game.inventory;
}

export function isPuzzleSolved(room: Room, game: GameState) {
  return room.puzzle.solved || game.solvedPuzzleIds.includes(room.puzzle.id);
}

export function availableObjects(room: Room) {
  return room.objects.filter((object) => object.visible);
}

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
  const normalized = normalize(cleanCommand);

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
    return inspectObject(game, room, cleanCommand, playerEffect);
  }

  if (
    normalized.startsWith("answer ") ||
    normalized.startsWith("enter ") ||
    normalized.startsWith("say ")
  ) {
    return solvePuzzle(game, room, cleanCommand, playerEffect);
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
    return movePlayer(game, room, cleanCommand, playerEffect);
  }

  return result(
    "UNKNOWN",
    null,
    false,
    "Try commands like: inspect diagnostic screen, take calibration lens, answer signal, or go east.",
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

export function recordHintUsed(game: GameState, puzzleId: string): GameState {
  return {
    ...game,
    hintsUsed: {
      ...game.hintsUsed,
      [puzzleId]: (game.hintsUsed[puzzleId] ?? 0) + 1,
    },
  };
}

export function applyGameEffects(
  game: GameState,
  effects: GameEffect[],
): GameState {
  return effects.reduce(applyGameEffect, game);
}

function applyGameEffect(game: GameState, effect: GameEffect): GameState {
  switch (effect.type) {
    case "ADD_INVENTORY":
      if (game.inventory.some((item) => item.id === effect.item.id)) {
        return game;
      }

      return {
        ...game,
        inventory: [...game.inventory, effect.item],
      };
    case "DISCOVER_CLUE":
      if (game.discoveredClueIds.includes(effect.clueId)) {
        return game;
      }

      return {
        ...game,
        discoveredClueIds: [...game.discoveredClueIds, effect.clueId],
      };
    case "SOLVE_PUZZLE":
      return {
        ...game,
        solvedPuzzleIds: game.solvedPuzzleIds.includes(effect.puzzleId)
          ? game.solvedPuzzleIds
          : [...game.solvedPuzzleIds, effect.puzzleId],
        rooms: game.rooms.map((room) =>
          room.id === effect.roomId
            ? {
                ...room,
                completed: true,
                puzzle: {
                  ...room.puzzle,
                  solved: true,
                },
              }
            : room,
        ),
      };
    case "MOVE_ROOM":
      return {
        ...game,
        currentRoomId: effect.roomId,
      };
    case "COMPLETE_OBJECTIVE":
      return {
        ...game,
        objectives: game.objectives.map((objective) =>
          objective.id === effect.objectiveId
            ? { ...objective, completed: true }
            : objective,
        ),
      };
    case "ESCAPE":
      return {
        ...game,
        status: "escaped",
      };
    case "ADD_NARRATIVE":
      return {
        ...game,
        narrativeHistory: [...game.narrativeHistory, effect.entry].slice(-40),
      };
  }
}

function describeRoom(room: Room, game: GameState) {
  const objects = availableObjects(room);
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
  const object = availableObjects(room).find(
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
): PlayerActionResult {
  const target = command.replace(/^(inspect|examine|read)\s+/i, "");
  const clue = room.clues.find((candidate) =>
    textMatches(target, [candidate.id, candidate.title]),
  );

  if (clue && game.discoveredClueIds.includes(clue.id)) {
    return result("INSPECT", clue.id, true, clue.content, [playerEffect]);
  }

  const object = availableObjects(room).find((candidate) =>
    textMatches(target, [candidate.id, candidate.name]),
  );

  if (!object) {
    return result("INSPECT", null, false, describeRoom(room, game), [playerEffect]);
  }

  const missingItemMessage = getMissingItemMessage(game, object);
  if (missingItemMessage) {
    return result("INSPECT", object.id, false, missingItemMessage, [playerEffect]);
  }

  const discoveryEffects = object.searchable
    ? getDiscoveryEffects(game, room, object)
    : [];
  const inventoryEffect = getInventoryEffect(game, object);
  const clueText = object.searchable ? describeDiscoveredClues(room, object) : "";

  return result(
    "INSPECT",
    object.id,
    true,
    `${object.description} ${clueText}`.trim(),
    [playerEffect, ...discoveryEffects, ...inventoryEffect],
  );
}

function solvePuzzle(
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
  const accepted = [room.puzzle.solution, ...room.puzzle.acceptedAnswers];

  if (!accepted.some((candidate) => normalize(candidate) === normalize(answer))) {
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

function movePlayer(
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

  if (
    exit.requiredPuzzleId &&
    !game.solvedPuzzleIds.includes(exit.requiredPuzzleId)
  ) {
    return result("MOVE", exit.id, false, "That exit is still locked.", [
      playerEffect,
    ]);
  }

  if (exit.final) {
    return result(
      "MOVE",
      exit.id,
      true,
      "The airlock irises open. Cold night air rushes in, the lab falls silent, and the Greenlight Protocol fades from every screen.",
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
    icon: "box",
  };
}

function getInventoryEffect(
  game: GameState,
  object: RoomObject,
): GameEffect[] {
  if (
    !object.collectibleItemId ||
    game.inventory.some((item) => item.id === object.collectibleItemId)
  ) {
    return [];
  }

  return [
    {
      type: "ADD_INVENTORY",
      item: itemFromObject(object),
    },
  ];
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

  return `You need ${object.requiredItemId} before that object makes sense.`;
}
