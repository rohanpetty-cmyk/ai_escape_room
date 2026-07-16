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
import { sampleGame } from "@/lib/sample-game";
import type { GameState, PlayerActionResult } from "@/lib/types";

interface AdventureStore {
  game: GameState;
  lastResult?: PlayerActionResult;
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
      resetGame: () =>
        set({
          game: createInitialGame(sampleGame),
          lastResult: undefined,
        }),
      submitCommand: (command) => {
        const { game } = get();
        const actionResult = runCommand(game, command);

        set({
          game: applyGameEffects(game, actionResult.effects),
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
      name: "ai-escape-room-adventure",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? fallbackStorage : window.localStorage,
      ),
    },
  ),
);
