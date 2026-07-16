import { Target } from "lucide-react";
import type { Objective, Room } from "@/lib/types";

interface ObjectivesPanelProps {
  objectives: Objective[];
  currentRoomId: string;
  room: Room;
  solved: boolean;
}

export function ObjectivesPanel({
  objectives,
  currentRoomId,
  room,
  solved,
}: ObjectivesPanelProps) {
  const currentObjective =
    objectives.find((objective) => objective.id === `objective-${currentRoomId}`) ??
    objectives.find((objective) => !objective.completed);

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/80 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-purple-200">
        <Target className="h-4 w-4" />
        Objective
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        {currentObjective?.text ?? "Find a way forward."}
      </p>
      <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
        <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
          Current lock
        </div>
        <p className="mt-2 text-sm leading-6 text-white">
          {solved ? room.puzzle.successMessage : room.puzzle.prompt}
        </p>
      </div>
    </section>
  );
}
