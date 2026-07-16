"use client";

import { Loader2, Send } from "lucide-react";

interface ActionInputProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function ActionInput({
  value,
  disabled,
  onChange,
  onSubmit,
}: ActionInputProps) {
  return (
    <form
      className="rounded-lg border border-white/12 bg-[#151711] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="sr-only" htmlFor="player-action">
        Player action
      </label>
      <div className="flex gap-2">
        <input
          id="player-action"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="inspect console, take lens, answer observe verify escape..."
          className="h-12 min-w-0 flex-1 rounded-lg border border-white/12 bg-[#0d100d] px-4 text-sm text-[#f5f1e8] outline-none transition placeholder:text-[#767164] focus:border-[#d7ff68]/60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Submit action"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#d7ff68] text-[#10130f] transition hover:bg-[#e5ff94] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </form>
  );
}
