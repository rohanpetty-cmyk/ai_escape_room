"use client";

import { Backpack } from "lucide-react";
import { getInventoryItems } from "@/lib/game/engine";
import type { GameDefinition, GameState } from "@/lib/game/types";

interface InventoryPanelProps {
  game: GameDefinition;
  state: GameState;
  onInspect: (itemName: string) => void;
}

export function InventoryPanel({ game, state, onInspect }: InventoryPanelProps) {
  const items = getInventoryItems(game, state);

  return (
    <aside className="rounded-lg border border-white/12 bg-[#151711] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#f5f1e8]">
        <Backpack className="h-4 w-4 text-[#d7ff68]" />
        Inventory
      </div>
      <div className="grid gap-2">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onInspect(item.name)}
              className="rounded-lg border border-white/10 bg-[#0d100d] px-3 py-3 text-left text-sm text-[#d8d3c6] transition hover:border-[#d7ff68]/50"
            >
              <span className="block font-medium text-[#f5f1e8]">{item.name}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#a9a292]">
                {item.description}
              </span>
            </button>
          ))
        ) : (
          <p className="rounded-lg border border-white/8 px-3 py-3 text-sm text-[#8f8a7d]">
            Empty
          </p>
        )}
      </div>
    </aside>
  );
}
