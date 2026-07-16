"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";

interface CommandInputProps {
  disabled: boolean;
  onSubmit: (command: string) => void;
}

export function CommandInput({ disabled, onSubmit }: CommandInputProps) {
  const [command, setCommand] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextCommand = command.trim();
    if (!nextCommand) return;

    onSubmit(nextCommand);
    setCommand("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-white/10 bg-slate-950/80 p-3"
    >
      <label className="sr-only" htmlFor="command">
        Command
      </label>
      <div className="flex gap-2">
        <input
          id="command"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          disabled={disabled}
          placeholder="inspect diagnostic screen, take calibration lens, answer signal..."
          className="h-12 min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60"
        />
        <button
          type="submit"
          disabled={disabled || !command.trim()}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-300 text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Submit command"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
