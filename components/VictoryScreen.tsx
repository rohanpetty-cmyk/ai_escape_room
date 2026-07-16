import Link from "next/link";
import { Trophy } from "lucide-react";

interface VictoryScreenProps {
  title: string;
  text: string;
  onReset: () => void;
}

export function VictoryScreen({ title, text, onReset }: VictoryScreenProps) {
  return (
    <section className="fixed inset-0 z-20 grid place-items-center bg-slate-950/85 px-5 backdrop-blur">
      <div className="w-full max-w-xl rounded-lg border border-emerald-300/25 bg-slate-950 p-8 text-center shadow-2xl shadow-emerald-950/30">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-300 text-slate-950">
          <Trophy className="h-7 w-7" />
        </div>
        <p className="mt-5 text-sm uppercase tracking-[0.22em] text-emerald-200">
          Escape complete
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>
        <p className="mt-4 text-base leading-7 text-slate-300">{text}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-300 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
          >
            Play again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-purple-300/25 bg-purple-300/10 px-5 text-sm font-semibold text-purple-100 transition hover:bg-purple-300/15"
          >
            Back to setup
          </Link>
        </div>
      </div>
    </section>
  );
}
