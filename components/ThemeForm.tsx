"use client";

import { FlaskConical, Loader2, Play, Sparkles } from "lucide-react";

interface ThemeFormProps {
  theme: string;
  isGenerating: boolean;
  error?: string;
  onThemeChange: (theme: string) => void;
  onGenerate: () => void;
  onDemo: () => void;
}

export function ThemeForm({
  theme,
  isGenerating,
  error,
  onThemeChange,
  onGenerate,
  onDemo,
}: ThemeFormProps) {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <div className="flex min-h-[560px] flex-col justify-between rounded-lg border border-white/12 bg-[#151711] p-6 shadow-2xl shadow-black/30 sm:p-8">
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d7ff68]/25 bg-[#d7ff68]/10 px-3 py-1 text-sm text-[#d7ff68]">
              <FlaskConical className="h-4 w-4" />
              Build-a-thon console
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-[#f5f1e8] sm:text-6xl">
              AI Escape Room
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#c8c4b7] sm:text-lg">
              Generate a three-room escape, or launch the quick demo path for a
              reliable under-three-minute run.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <label className="block text-sm font-medium text-[#f5f1e8]" htmlFor="theme">
              Theme
            </label>
            <textarea
              id="theme"
              value={theme}
              onChange={(event) => onThemeChange(event.target.value)}
              placeholder="Escape from an abandoned AI laboratory"
              className="min-h-28 w-full resize-none rounded-lg border border-white/12 bg-[#0d100d] px-4 py-3 text-base text-[#f5f1e8] outline-none transition focus:border-[#d7ff68]/60"
              maxLength={120}
            />
            {error ? <p className="text-sm text-[#ff9b8a]">{error}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onGenerate}
                disabled={isGenerating}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#d7ff68] px-5 text-sm font-semibold text-[#11140d] transition hover:bg-[#e5ff94] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate escape
              </button>
              <button
                type="button"
                onClick={onDemo}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/14 bg-white/6 px-5 text-sm font-semibold text-[#f5f1e8] transition hover:bg-white/10"
              >
                <Play className="h-4 w-4" />
                Demo mode
              </button>
            </div>
          </div>
        </div>

        <div className="relative min-h-[560px] overflow-hidden rounded-lg border border-white/12 bg-[#10130f]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{ backgroundImage: "url('/images/laboratory.svg')" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,16,13,0.1),rgba(13,16,13,0.92))]" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="grid grid-cols-3 gap-3 text-sm text-[#f5f1e8]">
              {["Room 1", "Room 2", "Escape"].map((label) => (
                <div
                  key={label}
                  className="rounded-lg border border-white/12 bg-black/24 p-3 backdrop-blur"
                >
                  <div className="text-xs uppercase tracking-[0.18em] text-[#d7ff68]">
                    {label}
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/20">
                    <div className="h-full w-2/3 rounded-full bg-[#d7ff68]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
