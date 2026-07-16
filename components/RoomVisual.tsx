import type { Room } from "@/lib/types";

interface RoomVisualProps {
  room: Room;
}

const toneClassByRoomTone: Record<Room["visualTheme"], string> = {
  green: "from-emerald-400/30 via-teal-300/10 to-slate-950",
  teal: "from-teal-300/30 via-cyan-300/10 to-slate-950",
  purple: "from-purple-400/30 via-fuchsia-300/10 to-slate-950",
};

const imageByRoomTone: Record<Room["visualTheme"], string> = {
  green: "/rooms/green-lab.svg",
  teal: "/rooms/teal-server.svg",
  purple: "/rooms/purple-exit.svg",
};

export function RoomVisual({ room }: RoomVisualProps) {
  return (
    <section className="relative min-h-[320px] overflow-hidden rounded-lg border border-white/10 bg-slate-950 shadow-2xl shadow-black/30">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: `url(${imageByRoomTone[room.visualTheme]})` }}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-br ${toneClassByRoomTone[room.visualTheme]} mix-blend-screen`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px] opacity-20" />
      <div className="relative flex min-h-[320px] flex-col justify-end p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-emerald-100">
          {room.visualTheme} sector
        </p>
        <h2 className="mt-2 text-4xl font-semibold text-white">{room.name}</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
          {room.description}
        </p>
      </div>
    </section>
  );
}
