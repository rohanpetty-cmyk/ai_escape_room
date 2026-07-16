import { Backpack } from "lucide-react";
import type { InventoryItem } from "@/lib/types";

interface InventoryPanelProps {
  items: InventoryItem[];
}

export function InventoryPanel({ items }: InventoryPanelProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
        <Backpack className="h-4 w-4" />
        Inventory
      </div>
      <div className="mt-3 grid gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-emerald-300/15 bg-emerald-300/10 p-3"
            >
              <div className="font-medium text-white">{item.name}</div>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {item.description}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400">
            No items collected.
          </p>
        )}
      </div>
    </section>
  );
}
