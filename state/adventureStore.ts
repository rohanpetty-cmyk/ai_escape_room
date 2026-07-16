"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import {
  applyEffects,
  createInitialGame,
  getCurrentRoom,
  requestHint,
  recordHintUsed,
} from "@/lib/game-engine";
import { playerActionResponseSchema } from "@/lib/schemas";
import { demoGame, sampleGame } from "@/lib/sample-game";
import type { GameState, PlayerActionResult } from "@/lib/types";

interface AdventureStore {
  game: GameState;
  lastResult?: PlayerActionResult;
  startSampleGame: () => void;
  startDemoGame: () => void;
  resetGame: () => void;
  submitCommand: (command: string) => Promise<PlayerActionResult>;
  requestCurrentHint: () => PlayerActionResult;
}

const fallbackStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAdventureStore = create<AdventureStore>()(
  persist(
    (set, get) => ({
      game: createInitialGame(sampleGame),
      lastResult: undefined,
      startSampleGame: () =>
        set({
          game: createInitialGame(sampleGame),
          lastResult: undefined,
        }),
      startDemoGame: () =>
        set({
          game: createInitialGame(demoGame),
          lastResult: undefined,
        }),
      resetGame: () =>
        set((state) => ({
          game: createInitialGame(state.game.demoMode ? demoGame : sampleGame),
          lastResult: undefined,
        })),
      submitCommand: async (command) => {
        const { game } = get();
        const response = await fetch("/api/player-action", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            action: command,
            gameState: game,
          }),
        });

        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(getActionErrorMessage(payload));
        }

        const parsed = playerActionResponseSchema.safeParse(payload);

        if (!parsed.success) {
          throw new Error(
            "The Dungeon Master returned an unexpected response. Your game state was preserved.",
          );
        }

        set({
          game: parsed.data.gameState,
          lastResult: parsed.data.result,
        });

        return parsed.data.result;
      },
      requestCurrentHint: () => {
        const { game } = get();
        const room = getCurrentRoom(game);
        const actionResult = requestHint(game);
        const hintedGame = actionResult.valid
          ? recordHintUsed(game, room.puzzle.id)
          : game;

        set({
          game: applyEffects(hintedGame, actionResult.effects),
          lastResult: actionResult,
        });

        return actionResult;
      },
    }),
    {
      name: "ai-escape-room-lab-adventure",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? fallbackStorage : window.localStorage,
      ),
    },
  ),
);

function getActionErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("error" in payload)) {
    return "The Dungeon Master could not process that action. Your game state was preserved.";
  }

  const error = payload.error;

  if (!error || typeof error !== "object" || !("message" in error)) {
    return "The Dungeon Master could not process that action. Your game state was preserved.";
  }

  const message = error.message;

  return typeof message === "string"
    ? message
    : "The Dungeon Master could not process that action. Your game state was preserved.";
}
