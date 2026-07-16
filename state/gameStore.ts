"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoGame } from "@/lib/game/demoGame";
import { createInitialState } from "@/lib/game/engine";
import type { GameDefinition, GameState } from "@/lib/game/types";

interface GameStore {
  game?: GameDefinition;
  state?: GameState;
  lastWarning?: string;
  startDemo: () => void;
  setGame: (game: GameDefinition, warning?: string) => void;
  setState: (state: GameState) => void;
  reset: () => void;
}

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      game: undefined,
      state: undefined,
      lastWarning: undefined,
      startDemo: () =>
        set({
          game: demoGame,
          state: createInitialState(demoGame),
          lastWarning: undefined,
        }),
      setGame: (game, warning) =>
        set({
          game,
          state: createInitialState(game),
          lastWarning: warning,
        }),
      setState: (state) => set({ state }),
      reset: () =>
        set({
          game: undefined,
          state: undefined,
          lastWarning: undefined,
        }),
    }),
    {
      name: "ai-escape-room-state",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? fallbackStorage : window.localStorage,
      ),
      partialize: ({ game, state, lastWarning }) => ({
        game,
        state,
        lastWarning,
      }),
    },
  ),
);
