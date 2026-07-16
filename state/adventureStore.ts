"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import {
  applyGameEffects,
  createInitialGame,
  getCurrentRoom,
  requestHint,
  recordHintUsed,
  runCommand,
} from "@/lib/game-engine";
import { demoGame, sampleGame } from "@/lib/sample-game";
import type { GameState, PlayerActionResult } from "@/lib/types";

interface AdventureStore {
  game: GameState;
  lastResult?: PlayerActionResult;
  startSampleGame: () => void;
  startDemoGame: () => void;
  resetGame: () => void;
  submitCommand: (command: string) => PlayerActionResult;
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
      submitCommand: (command) => {
        const { game } = get();
        const actionResult = runCommand(game, command);
        const hintedGame =
          actionResult.intent === "REQUEST_HINT" &&
          actionResult.valid &&
          actionResult.targetId
            ? recordHintUsed(game, actionResult.targetId)
            : game;

        set({
          game: applyGameEffects(hintedGame, actionResult.effects),
          lastResult: actionResult,
        });

        return actionResult;
      },
      requestCurrentHint: () => {
        const { game } = get();
        const room = getCurrentRoom(game);
        const actionResult = requestHint(game);
        const hintedGame = actionResult.valid
          ? recordHintUsed(game, room.puzzle.id)
          : game;

        set({
          game: applyGameEffects(hintedGame, actionResult.effects),
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
