import {
  Check,
  FileText,
  KeyRound,
  LockKeyhole,
  RadioTower,
  Server,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import type { InventoryItem, PuzzleType, Room, VisualTheme } from "@/lib/types";

type ArtifactVariant = "terminal" | "telemetry" | "emergency-lock" | "evidence";

interface ThemeArtifactProps {
  room: Room;
  theme: string;
  discoveredClueIds: string[];
  inventory: InventoryItem[];
  solved: boolean;
}

interface ArtifactCopy {
  eyebrow: string;
  title: string;
  status: string;
}

const copyByVariant: Record<ArtifactVariant, ArtifactCopy> = {
  terminal: {
    eyebrow: "Diagnostic terminal",
    title: "Override Console",
    status: "Command layer active",
  },
  telemetry: {
    eyebrow: "Live telemetry",
    title: "System Load Trace",
    status: "Pattern monitor online",
  },
  "emergency-lock": {
    eyebrow: "Exit hardware",
    title: "Emergency Release Panel",
    status: "Manual checks required",
  },
  evidence: {
    eyebrow: "Room evidence",
    title: "Clue Board",
    status: "Search feed assembled",
  },
};

const toneByTheme: Record<
  VisualTheme,
  {
    border: string;
    glow: string;
    accentText: string;
    chip: string;
    panel: string;
    line: string;
    meter: string;
  }
> = {
  green: {
    border: "border-emerald-300/25",
    glow: "shadow-[0_0_34px_rgba(52,211,153,0.15)]",
    accentText: "text-emerald-200",
    chip: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
    panel: "from-emerald-300/10 via-slate-950 to-slate-950",
    line: "bg-emerald-300/70",
    meter: "from-emerald-300 to-teal-200",
  },
  teal: {
    border: "border-teal-300/25",
    glow: "shadow-[0_0_34px_rgba(45,212,191,0.15)]",
    accentText: "text-teal-200",
    chip: "border-teal-300/25 bg-teal-300/10 text-teal-100",
    panel: "from-teal-300/10 via-slate-950 to-slate-950",
    line: "bg-teal-300/70",
    meter: "from-teal-300 to-cyan-200",
  },
  purple: {
    border: "border-purple-300/25",
    glow: "shadow-[0_0_34px_rgba(216,180,254,0.14)]",
    accentText: "text-purple-200",
    chip: "border-purple-300/25 bg-purple-300/10 text-purple-100",
    panel: "from-purple-300/10 via-slate-950 to-slate-950",
    line: "bg-purple-300/70",
    meter: "from-purple-300 to-fuchsia-200",
  },
};

const puzzleLabelByType: Record<PuzzleType, string> = {
  code: "code gate",
  logic: "logic lock",
  sequence: "sequence lock",
  word: "word lock",
};

export function ThemeArtifact({
  room,
  theme,
  discoveredClueIds,
  inventory,
  solved,
}: ThemeArtifactProps) {
  const variant = getArtifactVariant(room);
  const copy = copyByVariant[variant];
  const tone = toneByTheme[room.visualTheme];
  const discoveredClues = getDiscoveredPuzzleClues(room, discoveredClueIds);
  const visibleObjects = room.objects.filter((object) => object.visible);
  const inventoryIds = new Set(inventory.map((item) => item.id));
  const requiredItems = visibleObjects.filter((object) => object.requiredItemId);
  const themeSignal = getThemeSignal(theme);

  return (
    <section
      className={`theme-artifact relative overflow-hidden rounded-lg border bg-slate-950/90 p-4 ${tone.border} ${tone.glow}`}
      aria-label={`${copy.title} for ${room.name}`}
    >
      <div
        aria-hidden="true"
        className={`theme-artifact-scan absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent`}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] ${tone.accentText}`}
          >
            <RadioTower className="h-4 w-4" />
            {copy.eyebrow}
          </div>
          <h2 className="mt-2 text-xl font-semibold text-white">{copy.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            {room.name} / {themeSignal}
          </p>
        </div>
        <div className={`rounded-md border px-3 py-2 text-xs ${tone.chip}`}>
          {solved ? "resolved" : copy.status}
        </div>
      </div>

      <div
        className={`relative mt-4 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${tone.panel} p-4`}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] opacity-25" />
        {renderArtifactBody({
          variant,
          room,
          discoveredClues,
          visibleObjects,
          requiredItems,
          inventoryIds,
          solved,
          tone,
        })}
      </div>
    </section>
  );
}

function renderArtifactBody({
  variant,
  room,
  discoveredClues,
  visibleObjects,
  requiredItems,
  inventoryIds,
  solved,
  tone,
}: {
  variant: ArtifactVariant;
  room: Room;
  discoveredClues: Room["clues"];
  visibleObjects: Room["objects"];
  requiredItems: Room["objects"];
  inventoryIds: Set<string>;
  solved: boolean;
  tone: (typeof toneByTheme)[VisualTheme];
}) {
  if (variant === "telemetry") {
    return (
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="rounded-lg border border-white/10 bg-black/30 p-4 font-mono">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            <Server className="h-4 w-4" />
            Node trace
          </div>
          <div className="mt-4 flex h-32 items-end gap-2">
            {visibleObjects.slice(0, 7).map((object, index) => {
              const height = getMeterHeight(object.id, index);

              return (
                <div
                  key={object.id}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div
                    className={`theme-artifact-meter w-full max-w-8 rounded-t bg-gradient-to-t ${tone.meter}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="max-w-full truncate text-[10px] uppercase tracking-[0.12em] text-slate-500">
                    {getInitials(object.name)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 rounded border border-white/10 bg-white/[0.035] px-3 py-2 text-sm leading-6 text-slate-200">
            {room.puzzle.prompt}
          </p>
        </div>
        <ClueFeed clues={discoveredClues} tone={tone} />
      </div>
    );
  }

  if (variant === "emergency-lock") {
    return (
      <div className="relative grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="grid place-items-center rounded-lg border border-white/10 bg-black/35 p-5">
          <div
            className={`theme-artifact-lock relative grid h-40 w-40 place-items-center rounded-full border ${tone.border} bg-slate-950/80`}
          >
            <div className="absolute inset-4 rounded-full border border-white/10" />
            <div className={`absolute inset-x-8 top-1/2 h-px ${tone.line}`} />
            <LockKeyhole className={`h-11 w-11 ${tone.accentText}`} />
          </div>
        </div>
        <div className="grid gap-3">
          <p className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm leading-6 text-slate-200">
            {solved ? room.puzzle.successMessage : room.puzzle.prompt}
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {requiredItems.length > 0 ? (
              requiredItems.slice(0, 3).map((object) => {
                const itemId = object.requiredItemId;
                const available = itemId ? inventoryIds.has(itemId) : false;

                return (
                  <div
                    key={object.id}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      available
                        ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                        : "border-white/10 bg-white/[0.035] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {available ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      <span className="truncate">{object.name}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-slate-300">
                Manual release only
              </div>
            )}
          </div>
          <ClueFeed clues={discoveredClues} tone={tone} compact />
        </div>
      </div>
    );
  }

  if (variant === "terminal") {
    return (
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px]">
        <div className="rounded-lg border border-white/10 bg-black/40 p-4 font-mono">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              <Terminal className="h-4 w-4" />
              {puzzleLabelByType[room.puzzle.type]}
            </div>
            <span className={`theme-artifact-blink h-2 w-2 rounded-full ${tone.line}`} />
          </div>
          <div className="mt-4 space-y-2 text-sm leading-6 text-slate-200">
            <TerminalLine label="room" value={room.name} />
            <TerminalLine label="prompt" value={room.puzzle.prompt} />
            {discoveredClues.length > 0 ? (
              discoveredClues.slice(0, 3).map((clue, index) => (
                <TerminalLine
                  key={clue.id}
                  label={`clue-${index + 1}`}
                  value={clue.content}
                />
              ))
            ) : (
              <TerminalLine label="clue-feed" value="awaiting inspection" />
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/10 bg-black/25 p-3">
          {getKeypadLabels(room).map((label) => (
            <div
              key={label}
              className={`grid aspect-square place-items-center rounded-md border text-xs font-semibold ${tone.chip}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="grid gap-2 sm:grid-cols-2">
        {visibleObjects.slice(0, 4).map((object, index) => (
          <div
            key={object.id}
            className="theme-artifact-card rounded-lg border border-white/10 bg-black/25 p-3"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className={`flex items-center gap-2 text-sm font-medium ${tone.accentText}`}>
              <FileText className="h-4 w-4" />
              <span className="truncate">{object.name}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
              {object.description}
            </p>
          </div>
        ))}
      </div>
      <ClueFeed clues={discoveredClues} tone={tone} />
    </div>
  );
}

function ClueFeed({
  clues,
  tone,
  compact = false,
}: {
  clues: Room["clues"];
  tone: (typeof toneByTheme)[VisualTheme];
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-black/25 p-3 ${
        compact ? "" : "min-h-48"
      }`}
    >
      <div className={`flex items-center gap-2 text-xs uppercase tracking-[0.16em] ${tone.accentText}`}>
        <TriangleAlert className="h-4 w-4" />
        Clue feed
      </div>
      <div className="mt-3 grid gap-2">
        {clues.length > 0 ? (
          clues.slice(0, compact ? 2 : 4).map((clue) => (
            <div
              key={clue.id}
              className="theme-artifact-card rounded-md border border-white/10 bg-white/[0.035] px-3 py-2"
            >
              <p className="text-sm font-medium text-white">{clue.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-300">
                {clue.content}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-md border border-dashed border-white/10 px-3 py-5 text-center text-sm text-slate-500">
            Inspect objects to unlock clue data.
          </div>
        )}
      </div>
    </div>
  );
}

function TerminalLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="grid gap-1 sm:grid-cols-[112px_minmax(0,1fr)]">
      <span className="uppercase text-slate-500">{label}</span>
      <span className="min-w-0 break-words text-slate-200">{value}</span>
    </p>
  );
}

function getArtifactVariant(room: Room): ArtifactVariant {
  const text = [
    room.name,
    room.description,
    room.puzzle.prompt,
    room.puzzle.type,
    ...room.objects.map((object) => `${object.name} ${object.description}`),
  ]
    .join(" ")
    .toLowerCase();

  if (/exit|hatch|biometric|thermal|release/.test(text)) {
    return "emergency-lock";
  }

  if (room.puzzle.type === "code" || /console|terminal|override|control/.test(text)) {
    return "terminal";
  }

  if (room.puzzle.type === "sequence" || /server|relay|node|rack|sequence/.test(text)) {
    return "telemetry";
  }

  return "evidence";
}

function getDiscoveredPuzzleClues(room: Room, discoveredClueIds: string[]) {
  const discovered = new Set(discoveredClueIds);
  const puzzleClueIds = new Set(room.puzzle.clueIds);

  // Only discovered clue content is rendered so the visual artifact never leaks answers.
  return room.clues.filter(
    (clue) => puzzleClueIds.has(clue.id) && discovered.has(clue.id),
  );
}

function getThemeSignal(theme: string) {
  const words = theme
    .split(/[^a-z0-9]+/i)
    .filter((word) => word.length > 2)
    .slice(0, 4);

  return words.length > 0 ? words.join(" ").toLowerCase() : "escape scenario";
}

function getKeypadLabels(room: Room) {
  const objectLabels = room.objects
    .filter((object) => object.visible)
    .map((object) => getInitials(object.name))
    .filter((label) => label.length > 0);
  const fallbackLabels = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];

  return [...objectLabels, ...fallbackLabels].slice(0, 9);
}

function getInitials(value: string) {
  return value
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

function getMeterHeight(value: string, index: number) {
  const sum = value
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), index * 17);

  return 28 + (sum % 64);
}
