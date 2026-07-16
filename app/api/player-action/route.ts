import { NextResponse } from "next/server";
import {
  processPlayerActionWithProvider,
  resolveAIProvider,
  type ProviderActionFailure,
} from "@/lib/ai-provider";
import {
  applyEffects,
  canMoveToRoom,
  checkVictoryCondition,
  getCurrentRoom,
  getVisibleObjects,
  isPuzzleAnswerCorrect,
  recordHintUsed,
  runCommand,
  validateEffect,
} from "@/lib/game-engine";
import type { DungeonMasterPromptInput } from "@/lib/prompts";
import { playerActionRequestSchema } from "@/lib/schemas";
import type {
  Clue,
  GameEffect,
  GameState,
  InventoryItem,
  NarrativeEntry,
  PlayerActionResult,
  Room,
  RoomObject,
} from "@/lib/types";

type SanitizedActionResult =
  | {
      ok: true;
      result: PlayerActionResult;
    }
  | {
      ok: false;
      issues: string[];
    };

const MODEL_RESPONSE_ERROR_STATUS = 502;

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const parsed = playerActionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message:
            "Request must include a valid action under 180 characters and the current gameState.",
        },
      },
      { status: 400 },
    );
  }

  const { action, gameState } = parsed.data;
  const provider = resolveAIProvider(parsed.data.provider);

  try {
    getCurrentRoom(gameState);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_GAME_STATE",
          message: "The supplied gameState does not point to a valid room.",
        },
      },
      { status: 400 },
    );
  }

  const context = buildDungeonMasterContext(gameState, action);
  const providerResult = await processPlayerActionWithProvider(provider, context);

  if (!providerResult.ok) {
    if (providerResult.code === "MISSING_API_KEY") {
      return deterministicFallback(gameState, action, providerResult);
    }

    return NextResponse.json(
      {
        error: publicActionError(providerResult),
        gameState,
      },
      { status: MODEL_RESPONSE_ERROR_STATUS },
    );
  }

  const sanitized = sanitizeActionResult(
    gameState,
    action,
    context,
    providerResult.result,
  );

  if (!sanitized.ok) {
    return NextResponse.json(
      {
        error: {
          code: "MODEL_RESPONSE_REJECTED",
          message:
            "The selected AI provider returned an action response that referenced unavailable game IDs or unsafe effects. The current game state was preserved.",
          issues: sanitized.issues.slice(0, 8),
        },
        gameState,
      },
      { status: MODEL_RESPONSE_ERROR_STATUS },
    );
  }

  return NextResponse.json({
    source: providerResult.provider,
    provider: providerResult.provider,
    result: sanitized.result,
    gameState: applyActionResult(gameState, sanitized.result),
  });
}

function deterministicFallback(
  gameState: GameState,
  action: string,
  failure: ProviderActionFailure,
) {
  const result = runCommand(gameState, action);

  return NextResponse.json({
    source: "deterministic-fallback",
    provider: failure.provider,
    result,
    gameState: applyActionResult(gameState, result),
    warning: {
      code: failure.code,
      message: failure.message,
    },
  });
}

function buildDungeonMasterContext(
  gameState: GameState,
  action: string,
): DungeonMasterPromptInput {
  const room = getCurrentRoom(gameState);
  const answerAttempt = isPuzzleAnswerAttempt(action);
  const solved = room.puzzle.solved || gameState.solvedPuzzleIds.includes(room.puzzle.id);

  return {
    action,
    answerAttempt,
    currentRoom: {
      id: room.id,
      name: room.name,
      description: room.description,
      puzzle: {
        id: room.puzzle.id,
        type: room.puzzle.type,
        prompt: room.puzzle.prompt,
        solved,
        ...(answerAttempt
          ? {
              solution: room.puzzle.solution,
              acceptedAnswers: room.puzzle.acceptedAnswers,
            }
          : {}),
      },
    },
    visibleObjects: getVisibleObjects(room).map((object) => ({
      id: object.id,
      name: object.name,
      description: object.description,
      searchable: object.searchable,
      requiredItemId: object.requiredItemId,
      collectibleItem: object.collectibleItemId ? itemFromObject(object) : null,
      discoverableClues: getObjectClues(room, object),
    })),
    currentInventory: gameState.inventory.map((item) => ({ ...item })),
    discoveredClues: getDiscoveredClues(gameState),
    solvedPuzzleIds: [...gameState.solvedPuzzleIds],
    availableExits: room.exits.map((exit) => ({
      id: exit.id,
      label: exit.label,
      direction: exit.direction,
      toRoomId: exit.toRoomId,
      requiredPuzzleId: exit.requiredPuzzleId,
      final: exit.final,
      unlocked:
        !exit.requiredPuzzleId ||
        gameState.solvedPuzzleIds.includes(exit.requiredPuzzleId),
    })),
  };
}

function sanitizeActionResult(
  gameState: GameState,
  action: string,
  context: DungeonMasterPromptInput,
  result: PlayerActionResult,
): SanitizedActionResult {
  const issues: string[] = [];
  const allowedIds = getAllowedContextIds(context);

  if (result.targetId && !allowedIds.has(result.targetId)) {
    issues.push(`targetId is not in the supplied context: ${result.targetId}.`);
  }

  if (!result.valid && result.effects.length > 0) {
    issues.push("Invalid actions must not include state-changing effects.");
  }

  const canonicalEffects = result.effects.flatMap((effect) => {
    const sanitized = sanitizeEffect(gameState, action, context, effect);

    if (!sanitized.ok) {
      issues.push(sanitized.issue);
      return [];
    }

    return sanitized.effect ? [sanitized.effect] : [];
  });

  if (issues.length > 0) {
    return {
      ok: false,
      issues,
    };
  }

  const validatedEffects = getEngineValidatedEffects(gameState, canonicalEffects);
  const effectsWithObjectives = addObjectiveEffects(gameState, validatedEffects);

  return {
    ok: true,
    result: {
      intent: result.intent,
      targetId: result.targetId,
      valid: result.valid,
      narration: result.narration,
      effects: [
        makeNarrativeEffect("player", action),
        ...effectsWithObjectives,
        makeNarrativeEffect("assistant", result.narration),
      ],
    },
  };
}

function sanitizeEffect(
  gameState: GameState,
  action: string,
  context: DungeonMasterPromptInput,
  effect: GameEffect,
):
  | {
      ok: true;
      effect: GameEffect | null;
    }
  | {
      ok: false;
      issue: string;
    } {
  const room = getCurrentRoom(gameState);

  switch (effect.type) {
    case "ADD_NARRATIVE":
      return rejectedEffect("Claude may not create narrative effects.");
    case "COMPLETE_OBJECTIVE":
      return rejectedEffect("Claude may not complete objectives directly.");
    case "ADD_INVENTORY": {
      const object = getVisibleObjects(room).find(
        (candidate) => candidate.collectibleItemId === effect.item.id,
      );

      if (!object) {
        return rejectedEffect(`Item is not collectible here: ${effect.item.id}.`);
      }

      if (!canAccessObject(gameState, object)) {
        return rejectedEffect(`Item is currently inaccessible: ${effect.item.id}.`);
      }

      return {
        ok: true,
        effect: {
          type: "ADD_INVENTORY",
          item: itemFromObject(object),
        },
      };
    }
    case "DISCOVER_CLUE": {
      const object = getVisibleObjects(room).find((candidate) =>
        candidate.discoveredClueIds.includes(effect.clueId),
      );

      if (!object) {
        return rejectedEffect(`Clue is not discoverable here: ${effect.clueId}.`);
      }

      if (!canAccessObject(gameState, object)) {
        return rejectedEffect(`Clue is currently inaccessible: ${effect.clueId}.`);
      }

      return {
        ok: true,
        effect,
      };
    }
    case "SOLVE_PUZZLE": {
      if (effect.roomId !== room.id || effect.puzzleId !== room.puzzle.id) {
        return rejectedEffect("Puzzle effect does not target the current room puzzle.");
      }

      if (!context.answerAttempt) {
        return rejectedEffect("Puzzle solve was proposed without an answer attempt.");
      }

      if (!answerMatchesCurrentPuzzle(room, action)) {
        return rejectedEffect("Puzzle solve was proposed for an incorrect answer.");
      }

      return {
        ok: true,
        effect,
      };
    }
    case "MOVE_ROOM":
      if (!canMoveToRoom(gameState, effect.roomId)) {
        return rejectedEffect(`Room is not reachable through an unlocked exit: ${effect.roomId}.`);
      }

      return {
        ok: true,
        effect,
      };
    case "ESCAPE":
      if (!checkVictoryCondition(gameState)) {
        return rejectedEffect("Escape was proposed before the final exit unlocked.");
      }

      return {
        ok: true,
        effect,
      };
  }
}

function getEngineValidatedEffects(
  gameState: GameState,
  effects: GameEffect[],
): GameEffect[] {
  let validationGame = gameState;
  const validatedEffects: GameEffect[] = [];

  effects.forEach((effect) => {
    const validation = validateEffect(validationGame, effect);

    if (!validation.valid) {
      return;
    }

    validatedEffects.push(effect);
    validationGame = applyEffects(validationGame, [effect]);
  });

  return validatedEffects;
}

function addObjectiveEffects(gameState: GameState, effects: GameEffect[]) {
  const shouldCompleteCurrentObjective = effects.some(
    (effect) => effect.type === "SOLVE_PUZZLE" || effect.type === "ESCAPE",
  );

  if (!shouldCompleteCurrentObjective) {
    return effects;
  }

  const room = getCurrentRoom(gameState);
  const objectiveId = `objective-${room.id}`;
  const objectiveEffect: GameEffect = {
    type: "COMPLETE_OBJECTIVE",
    objectiveId,
  };
  const validationGame = applyEffects(gameState, effects);
  const validation = validateEffect(validationGame, objectiveEffect);

  return validation.valid ? [...effects, objectiveEffect] : effects;
}

function applyActionResult(
  gameState: GameState,
  result: PlayerActionResult,
): GameState {
  const hintedGame =
    result.intent === "REQUEST_HINT" && result.valid && result.targetId
      ? recordHintUsed(gameState, result.targetId)
      : gameState;

  return applyEffects(hintedGame, result.effects);
}

function getAllowedContextIds(context: DungeonMasterPromptInput) {
  const ids = new Set<string>([
    context.currentRoom.id,
    context.currentRoom.puzzle.id,
    ...context.solvedPuzzleIds,
  ]);

  context.visibleObjects.forEach((object) => {
    ids.add(object.id);
    if (object.requiredItemId) ids.add(object.requiredItemId);
    if (object.collectibleItem) ids.add(object.collectibleItem.id);
    object.discoverableClues.forEach((clue) => ids.add(clue.id));
  });

  context.currentInventory.forEach((item) => ids.add(item.id));
  context.discoveredClues.forEach((clue) => ids.add(clue.id));
  context.availableExits.forEach((exit) => {
    ids.add(exit.id);
    if (exit.toRoomId) ids.add(exit.toRoomId);
    if (exit.requiredPuzzleId) ids.add(exit.requiredPuzzleId);
  });

  return ids;
}

function getDiscoveredClues(gameState: GameState): Clue[] {
  const discoveredIds = new Set(gameState.discoveredClueIds);

  return gameState.rooms.flatMap((room) =>
    room.clues
      .filter((clue) => discoveredIds.has(clue.id))
      .map((clue) => ({ ...clue })),
  );
}

function getObjectClues(room: Room, object: RoomObject): Clue[] {
  const clueIds = new Set(object.discoveredClueIds);

  return room.clues
    .filter((clue) => clueIds.has(clue.id))
    .map((clue) => ({ ...clue }));
}

function canAccessObject(gameState: GameState, object: RoomObject) {
  return (
    !object.requiredItemId ||
    gameState.inventory.some((item) => item.id === object.requiredItemId)
  );
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

function answerMatchesCurrentPuzzle(room: Room, action: string) {
  return getAnswerCandidates(action).some((candidate) =>
    isPuzzleAnswerCorrect(room.puzzle, candidate),
  );
}

function getAnswerCandidates(action: string) {
  const candidates = new Set<string>([action.trim()]);
  const quoted = action.match(/["']([^"']+)["']/g) ?? [];

  quoted.forEach((value) => candidates.add(value.replace(/^["']|["']$/g, "")));

  const answerMatch = action.match(
    /^(?:answer|enter|input|submit|type|say|try|key in)\s+(.+?)(?:\s+(?:into|in|on|at|to)\s+.+)?$/i,
  );

  if (answerMatch?.[1]) {
    candidates.add(answerMatch[1]);
  }

  action
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9-]/gi, ""))
    .filter(Boolean)
    .forEach((part) => candidates.add(part));

  return [...candidates];
}

function isPuzzleAnswerAttempt(action: string) {
  return /\b(answer|enter|input|submit|type|say|try|key in|code|password|combination)\b/i.test(
    action,
  );
}

function makeNarrativeEffect(
  role: NarrativeEntry["role"],
  content: string,
): GameEffect {
  return {
    type: "ADD_NARRATIVE",
    entry: {
      id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      role,
      content,
      timestamp: Date.now(),
    },
  };
}

function publicActionError(result: ProviderActionFailure) {
  return {
    code: result.code,
    message: result.message,
    issues: result.issues?.slice(0, 8),
  };
}

function rejectedEffect(issue: string) {
  return {
    ok: false,
    issue,
  } as const;
}
