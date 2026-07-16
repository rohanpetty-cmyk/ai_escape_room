import type { GameDefinition } from "./types";

const id = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const demoGame: GameDefinition = {
  id: "demo-last-checkpoint",
  mode: "demo",
  theme: "Escape from an abandoned AI laboratory",
  title: "The Last Checkpoint",
  openingMission:
    "The laboratory has sealed itself after a failed model alignment test. Reach the checkpoint door, recover the release phrase, and get out before the backup power dies.",
  startRoomId: "checkpoint",
  finalEscape: {
    requiredPuzzleIds: ["demo-release"],
    escapeRoomId: "checkpoint",
    escapeExitId: "checkpoint-exit",
    victoryText:
      "The checkpoint door exhales, the red grid turns white, and you step into clean night air. You escaped the AI laboratory.",
  },
  rooms: [
    {
      id: "checkpoint",
      name: "Alignment Checkpoint",
      imageKey: "laboratory",
      description:
        "A narrow lab checkpoint flickers under emergency strips. A sealed blast door waits ahead, a verification console pulses beside it, and a cracked equipment tray hangs open.",
      items: [
        {
          id: "calibration-lens",
          name: "calibration lens",
          description:
            "A smoky lens etched with three verbs: observe, verify, escape. The words only line up when the lens is held over the console glass.",
          portable: true,
        },
      ],
      clues: [
        {
          id: "console-glass",
          label: "verification console",
          text: "The console asks for the lab's release phrase. Smudges on the glass form three blank slots.",
        },
        {
          id: "wall-protocol",
          label: "wall protocol",
          text: "A faded safety protocol reads: 'No system may open the outer door until the operator can observe the state, verify the signal, and escape the loop.'",
        },
      ],
      puzzle: {
        id: "demo-release",
        prompt:
          "The console wants the three-word release phrase for the checkpoint door.",
        answer: "observe verify escape",
        acceptedAnswers: [
          "observe verify escape",
          "observe, verify, escape",
          "observe verify and escape",
        ],
        requiredItemIds: ["calibration-lens"],
        unlocksExitId: "checkpoint-exit",
        hints: [
          {
            text: "The release phrase is not hidden in one place; compare the protocol with the portable lens.",
          },
          {
            text: "The lens gives the exact verbs, and the wall protocol gives their order.",
          },
          {
            text: "Try answering: observe verify escape.",
          },
        ],
        solvedText:
          "The console accepts the phrase. Magnetic bolts withdraw from the checkpoint door.",
      },
      exits: [
        {
          id: "checkpoint-exit",
          label: "outer checkpoint door",
          direction: "exit",
          toRoomId: null,
          lockedByPuzzleId: "demo-release",
          lockedDescription: "The outer checkpoint door is sealed by the console.",
        },
      ],
    },
  ],
};

export function makeFallbackGeneratedGame(theme: string): GameDefinition {
  return {
    id: id(),
    mode: "generated",
    theme,
    title: "Protocol of the Sealed Wing",
    openingMission: `Your escape room is tuned to "${theme}". Three connected rooms stand between you and the exit: read the environment, solve each lock, and keep the AI from inventing its own rules.`,
    startRoomId: "atrium",
    finalEscape: {
      requiredPuzzleIds: ["atrium-signal", "archive-sequence", "core-dawn"],
      escapeRoomId: "core",
      escapeExitId: "surface-hatch",
      victoryText:
        "The last hatch unlocks with a clean mechanical snap. The simulation collapses behind you, and the escape timer stops in your favor.",
    },
    rooms: [
      {
        id: "atrium",
        name: "Decontamination Atrium",
        imageKey: "laboratory",
        description:
          "A glass atrium hums with stale air recyclers. Warning bands point east toward a memory archive, but the door panel shows a single empty word.",
        items: [
          {
            id: "relay-token",
            name: "relay token",
            description:
              "A copper token stamped with a waveform. Its edge is engraved with the word SIGNAL.",
            portable: true,
          },
        ],
        clues: [
          {
            id: "warning-band",
            label: "warning band",
            text: "The yellow band repeats: 'Clean signal before transfer.' The word signal is printed brighter than the rest.",
          },
          {
            id: "door-panel",
            label: "door panel",
            text: "The panel has five empty letter cells and a small waveform symbol.",
          },
        ],
        puzzle: {
          id: "atrium-signal",
          prompt:
            "The east door asks for the clean transfer word shown by the atrium clues.",
          answer: "signal",
          acceptedAnswers: ["signal", "clean signal"],
          unlocksExitId: "atrium-east",
          hints: [
            { text: "Look for the word repeated by both the room and the item." },
            { text: "The waveform symbol points to the relay token." },
            { text: "Try answering: signal." },
          ],
          solvedText:
            "The atrium door reads SIGNAL and slides aside toward the archive.",
        },
        exits: [
          {
            id: "atrium-east",
            label: "archive door",
            direction: "east",
            toRoomId: "archive",
            lockedByPuzzleId: "atrium-signal",
            lockedDescription: "The archive door is waiting for a five-letter word.",
          },
        ],
      },
      {
        id: "archive",
        name: "Memory Archive",
        imageKey: "archive",
        description:
          "Cold shelves of storage cores blink in rows. A western door leads back, while a southern iris is locked by an old sequence test.",
        items: [],
        clues: [
          {
            id: "lit-cabinets",
            label: "lit cabinets",
            text: "Four cabinet lights are labeled 1, 1, 2, and a blank slot. A note says the archive grows by remembering the two before it.",
          },
          {
            id: "sequence-note",
            label: "sequence note",
            text: "The next number after 1, 1, 2 is the sum of the previous two.",
          },
        ],
        puzzle: {
          id: "archive-sequence",
          prompt:
            "The southern iris asks for the missing number in the archive sequence: 1, 1, 2, ?",
          answer: "3",
          acceptedAnswers: ["3", "three"],
          unlocksExitId: "archive-south",
          hints: [
            { text: "The note describes a simple adding pattern." },
            { text: "Add the last two visible numbers." },
            { text: "Try answering: 3." },
          ],
          solvedText:
            "The archive accepts the number and opens the southern iris.",
        },
        exits: [
          {
            id: "archive-west",
            label: "atrium door",
            direction: "west",
            toRoomId: "atrium",
          },
          {
            id: "archive-south",
            label: "core iris",
            direction: "south",
            toRoomId: "core",
            lockedByPuzzleId: "archive-sequence",
            lockedDescription: "The core iris is locked by the missing sequence value.",
          },
        ],
      },
      {
        id: "core",
        name: "Failsafe Core",
        imageKey: "control",
        description:
          "The final chamber glows around a quiet command core. Behind it, a surface hatch waits for the final reset word.",
        items: [],
        clues: [
          {
            id: "three-plaques",
            label: "three plaques",
            text: "Three plaques read: first SIGNAL, then THREE, then DAWN. The last plaque is mounted directly under the surface hatch.",
          },
          {
            id: "core-display",
            label: "core display",
            text: "The display says: 'When the room remembers the first two locks, speak the word that opens the morning.'",
          },
        ],
        puzzle: {
          id: "core-dawn",
          prompt:
            "The command core asks for the final reset word named by the plaques.",
          answer: "dawn",
          acceptedAnswers: ["dawn", "the dawn"],
          unlocksExitId: "surface-hatch",
          hints: [
            { text: "The plaques list the path of solved answers." },
            { text: "The final reset word is the third plaque." },
            { text: "Try answering: dawn." },
          ],
          solvedText:
            "The core accepts DAWN. The surface hatch unlocks above you.",
        },
        exits: [
          {
            id: "core-north",
            label: "archive iris",
            direction: "north",
            toRoomId: "archive",
          },
          {
            id: "surface-hatch",
            label: "surface hatch",
            direction: "exit",
            toRoomId: null,
            lockedByPuzzleId: "core-dawn",
            lockedDescription: "The surface hatch is waiting for the final reset word.",
          },
        ],
      },
    ],
  };
}
