import type { Room } from "@/lib/types";

interface RoomTransitionOverlayProps {
  fromRoomName: string;
  toRoomName: string;
  visualTheme: Room["visualTheme"];
}

const themeTextClass: Record<Room["visualTheme"], string> = {
  green: "text-emerald-100",
  teal: "text-teal-100",
  purple: "text-purple-100",
};

export function RoomTransitionOverlay({
  fromRoomName,
  toRoomName,
  visualTheme,
}: RoomTransitionOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-hidden bg-slate-950/80 backdrop-blur-sm">
      <div className="room-transition-door room-transition-door-left" />
      <div className="room-transition-door room-transition-door-right" />
      <div className="room-transition-scan" />
      <div className="relative z-10 w-[min(520px,calc(100vw-2rem))] rounded-lg border border-white/10 bg-slate-950/90 p-5 text-center shadow-2xl shadow-black/50">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          Leaving {fromRoomName}
        </p>
        <h2 className={`mt-3 text-3xl font-semibold ${themeTextClass[visualTheme]}`}>
          Entering {toRoomName}
        </h2>
        <div className="mt-5 h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
          <div className="h-full animate-transition-load bg-emerald-300" />
        </div>
      </div>
    </div>
  );
}
