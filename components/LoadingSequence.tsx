import { Loader2 } from "lucide-react";

export function LoadingSequence() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080b12] px-5 text-slate-100">
      <div className="rounded-lg border border-emerald-300/20 bg-slate-950 p-6 text-center shadow-2xl shadow-emerald-950/25">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-200" />
        <p className="mt-4 text-sm uppercase tracking-[0.22em] text-slate-300">
          Booting escape room
        </p>
      </div>
    </main>
  );
}
