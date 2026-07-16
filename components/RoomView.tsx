"use client";

import { DoorOpen, Eye, PackagePlus } from "lucide-react";
import { isExitUnlocked, isPuzzleSolved } from "@/lib/game/engine";
import type { GameState, Room } from "@/lib/game/types";
import { getRoomImage } from "@/lib/images/roomImages";

interface RoomViewProps {
  room: Room;
  state: GameState;
  onQuickAction: (action: string) => void;
}

export function RoomView({ room, state, onQuickAction }: RoomViewProps) {
  const image = getRoomImage(room.imageKey);
  const solved = isPuzzleSolved(room.puzzle, state);
  const availableItems = room.items.filter(
    (item) => !state.inventoryItemIds.includes(item.id),
  );

  return (
    <section className="overflow-hidden rounded-lg border border-white/12 bg-[#151711] shadow-2xl shadow-black/25">
      <div className="relative min-h-[300px]">
        <div
          aria-label={image.alt}
          className="absolute inset-0 bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url('${image.src}')` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,14,10,0.08),rgba(12,14,10,0.88))]" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#d7ff68] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#10130f]">
              {solved ? "Solved" : "Locked"}
            </span>
            <span className="rounded-full border border-white/16 bg-black/24 px-3 py-1 text-xs text-[#f5f1e8] backdrop-blur">
              {room.exits.length} exit{room.exits.length === 1 ? "" : "s"}
            </span>
          </div>
          <h2 className="text-3xl font-semibold text-[#f5f1e8]">{room.name}</h2>
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6">
        <p className="text-base leading-7 text-[#d8d3c6]">{room.description}</p>

        <div className="rounded-lg border border-white/12 bg-[#0e110d] p-4">
          <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[#d7ff68]">
            Puzzle
          </div>
          <p className="mt-3 text-sm leading-6 text-[#f5f1e8]">
            {solved ? room.puzzle.solvedText : room.puzzle.prompt}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <ActionGroup
            title="Clues"
            empty="No visible clues"
            icon={<Eye className="h-4 w-4" />}
            items={room.clues.map((clue) => ({
              id: clue.id,
              label: clue.label,
              action: `inspect ${clue.label}`,
            }))}
            onQuickAction={onQuickAction}
          />
          <ActionGroup
            title="Items"
            empty="No loose items"
            icon={<PackagePlus className="h-4 w-4" />}
            items={availableItems.map((item) => ({
              id: item.id,
              label: item.name,
              action: `take ${item.name}`,
            }))}
            onQuickAction={onQuickAction}
          />
          <ActionGroup
            title="Exits"
            empty="No exits"
            icon={<DoorOpen className="h-4 w-4" />}
            items={room.exits.map((exit) => ({
              id: exit.id,
              label: `${exit.direction}: ${isExitUnlocked(exit, state) ? exit.label : "locked"}`,
              action: `move ${exit.direction}`,
            }))}
            onQuickAction={onQuickAction}
          />
        </div>
      </div>
    </section>
  );
}

function ActionGroup({
  title,
  empty,
  icon,
  items,
  onQuickAction,
}: {
  title: string;
  empty: string;
  icon: React.ReactNode;
  items: { id: string; label: string; action: string }[];
  onQuickAction: (action: string) => void;
}) {
  return (
    <div className="rounded-lg border border-white/12 bg-white/[0.035] p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#f5f1e8]">
        {icon}
        {title}
      </div>
      <div className="grid gap-2">
        {items.length ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onQuickAction(item.action)}
              className="min-h-10 rounded-lg border border-white/10 bg-[#10130f] px-3 py-2 text-left text-sm text-[#d8d3c6] transition hover:border-[#d7ff68]/50 hover:text-[#f5f1e8]"
            >
              {item.label}
            </button>
          ))
        ) : (
          <p className="min-h-10 rounded-lg border border-white/8 px-3 py-2 text-sm text-[#8f8a7d]">
            {empty}
          </p>
        )}
      </div>
    </div>
  );
}
