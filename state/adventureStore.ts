"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import {
  createInitialProgress,
  requestHint,
  runCommand,
} from "@/lib/game-engine";
import { sampleGame } from "@/lib/sample-game";
import type { CommandResult, GameDefinition, GameProgress } from "@/lib/types";

interface AdventureStore {
  game: GameDefinition;
  progress: GameProgress;
  lastResult?: CommandResult;
  resetGame: () => void;
  submitCommand: (command: string) => CommandResult;
  requestCurrentHint: () => CommandResult;
}

const fallbackStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useAdventureStore = create<AdventureStore>()(
  persist(
    (set, get) => ({
      game: sampleGame,
      progress: createInitialProgress(sampleGame),
      lastResult: undefined,
      resetGame: () =>
        set({
          game: sampleGame,
          progress: createInitialProgress(sampleGame),
          lastResult: undefined,
        }),
      submitCommand: (command) => {
        const { game, progress } = get();
        const commandResult = runCommand(game, progress, command);

        set({
          progress: commandResult.progress,
          lastResult: commandResult,
        });

        return commandResult;
      },
      requestCurrentHint: () => {
        const { game, progress } = get();
        const commandResult = requestHint(game, progress);

        set({
          progress: commandResult.progress,
          lastResult: commandResult,
        });

        return commandResult;
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
