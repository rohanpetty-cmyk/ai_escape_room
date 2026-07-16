import type { Room } from "@/lib/types";

interface RoomVisualProps {
  room: Room;
}

const toneClassByRoomTone: Record<Room["visualTone"], string> = {
  green: "from-emerald-400/30 via-teal-300/10 to-slate-950",
  teal: "from-teal-300/30 via-cyan-300/10 to-slate-950",
  purple: "from-purple-400/30 via-fuchsia-300/10 to-slate-950",
};

export function RoomVisual({ room }: RoomVisualProps) {
  return (
    <section className="relative min-h-[320px] overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${toneClassByRoomTone[room.visualTone]}`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
      <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/5 shadow-[0_0_90px_rgba(45,212,191,0.18)]" />
      <div className="relative flex min-h-[320px] flex-col justify-end p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-emerald-100">
          {room.subtitle}
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-white">{room.name}</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
          {room.description}
        </p>
      </div>
    </section>
  );
}
