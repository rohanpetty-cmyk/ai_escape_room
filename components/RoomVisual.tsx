import type { Room } from "@/lib/types";
import type { ActionFeedbackTone } from "@/components/ActionFeedback";

interface RoomVisualProps {
  room: Room;
  feedbackTone?: ActionFeedbackTone | null;
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

const feedbackClass: Record<ActionFeedbackTone, string> = {
  success: "border-emerald-300/60 shadow-[0_0_38px_rgba(52,211,153,0.25)]",
  failure: "border-rose-300/60 shadow-[0_0_38px_rgba(251,113,133,0.22)]",
  neutral: "border-teal-300/50 shadow-[0_0_34px_rgba(45,212,191,0.2)]",
};

export function RoomVisual({ room, feedbackTone }: RoomVisualProps) {
  return (
    <section
      className={`room-visual relative min-h-[320px] overflow-hidden rounded-lg border bg-slate-950 shadow-2xl shadow-black/30 transition ${
        feedbackTone ? feedbackClass[feedbackTone] : "border-white/10"
      }`}
    >
      <div
        aria-hidden="true"
        className="room-visual-image absolute inset-0 bg-cover bg-center opacity-80"
        style={{ backgroundImage: `url(${imageByRoomTone[room.visualTheme]})` }}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-br ${toneClassByRoomTone[room.visualTheme]} mix-blend-screen`}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:44px_44px] opacity-20" />
      <div className="room-visual-scanline absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      <div className="room-visual-sweep absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-emerald-200/10 to-transparent" />
      <div className="room-visual-noise absolute inset-0 opacity-35" />
      <div className="room-visual-particle room-visual-particle-a" />
      <div className="room-visual-particle room-visual-particle-b" />
      <div className="room-visual-particle room-visual-particle-c" />
      {feedbackTone === "success" ? (
        <div className="room-visual-success absolute inset-0" />
      ) : null}
      {feedbackTone === "failure" ? (
        <div className="room-visual-failure absolute inset-0" />
      ) : null}
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
