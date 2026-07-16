import type { GameDefinition } from "./types";

export const sampleGame: GameDefinition = {
  id: "sample-ai-lab",
  title: "The Greenlight Protocol",
  theme: "Escape from an abandoned AI laboratory",
  openingMission:
    "Emergency lights pulse through the abandoned lab. Restore the Greenlight Protocol, cross the archive, and open the final airlock.",
  startingRoomId: "atrium",
  finalRoomId: "core",
  finalExitId: "surface-airlock",
  victoryText:
    "The airlock irises open. Cold night air rushes in, the lab falls silent, and the Greenlight Protocol fades from every screen.",
  rooms: [
    {
      id: "atrium",
      name: "Signal Atrium",
      subtitle: "Emergency reception bay",
      visualTone: "green",
      objective: "Recover the calibration lens and unlock the archive door.",
      description:
        "A reception bay glows with green emergency strips. A sealed archive door waits east, and a cracked lens rests under a diagnostic screen.",
      items: [
        {
          id: "calibration-lens",
          name: "calibration lens",
          description:
            "A smoked glass lens etched with the word SIGNAL along its rim.",
        },
      ],
      clues: [
        {
          id: "diagnostic-screen",
          label: "diagnostic screen",
          text: "The screen repeats: 'Clean SIGNAL required before memory transfer.'",
        },
        {
          id: "archive-door",
          label: "archive door",
          text: "Five letter slots blink beside a waveform symbol.",
        },
      ],
      puzzle: {
        id: "atrium-signal",
        prompt: "The archive door asks for the five-letter transfer word.",
        answer: "signal",
        acceptedAnswers: ["signal", "clean signal"],
        requiredItemIds: ["calibration-lens"],
        hints: [
          "The lens and the diagnostic screen repeat the same key word.",
          "The door has five slots and a waveform symbol.",
          "Try: signal.",
        ],
        solvedText:
          "The door reads SIGNAL. Its locks cycle open with a low teal hum.",
      },
      exits: [
        {
          id: "archive-door-east",
          label: "Archive door",
          direction: "east",
          toRoomId: "archive",
          requiredPuzzleId: "atrium-signal",
        },
      ],
    },
    {
      id: "archive",
      name: "Memory Archive",
      subtitle: "Cold storage stacks",
      visualTone: "teal",
      objective: "Solve the archive sequence and reach the core.",
      description:
        "Rows of memory cabinets blink in teal and violet. A southern iris blocks the path to the core.",
      items: [],
      clues: [
        {
          id: "lit-cabinets",
          label: "lit cabinets",
          text: "Four cabinet lights read 1, 1, 2, and a blank slot.",
        },
        {
          id: "sequence-note",
          label: "sequence note",
          text: "A note says: 'The next memory is the sum of the two before it.'",
        },
      ],
      puzzle: {
        id: "archive-sequence",
        prompt: "The iris asks for the missing number in 1, 1, 2, ?",
        answer: "3",
        acceptedAnswers: ["3", "three"],
        requiredItemIds: [],
        hints: [
          "The note describes a simple adding pattern.",
          "Add the last two visible numbers: 1 and 2.",
          "Try: 3.",
        ],
        solvedText:
          "The archive accepts the sequence. The southern iris opens into purple light.",
      },
      exits: [
        {
          id: "atrium-door-west",
          label: "Atrium door",
          direction: "west",
          toRoomId: "atrium",
        },
        {
          id: "core-iris-south",
          label: "Core iris",
          direction: "south",
          toRoomId: "core",
          requiredPuzzleId: "archive-sequence",
        },
      ],
    },
    {
      id: "core",
      name: "Failsafe Core",
      subtitle: "Final command chamber",
      visualTone: "purple",
      objective: "Speak the reset word and escape through the airlock.",
      description:
        "The command core floats in a violet containment ring. A surface airlock waits beyond the final console.",
      items: [],
      clues: [
        {
          id: "core-display",
          label: "core display",
          text: "The display reads: 'After SIGNAL and THREE, the morning key remains.'",
        },
        {
          id: "violet-plaque",
          label: "violet plaque",
          text: "A plaque below the airlock is stamped with one word: DAWN.",
        },
      ],
      puzzle: {
        id: "core-dawn",
        prompt: "The final console asks for the morning key.",
        answer: "dawn",
        acceptedAnswers: ["dawn", "the dawn"],
        requiredItemIds: [],
        hints: [
          "The display points to the word after the first two solved locks.",
          "The plaque beneath the airlock gives the exact word.",
          "Try: dawn.",
        ],
        solvedText:
          "The command core accepts DAWN. The surface airlock unlocks.",
      },
      exits: [
        {
          id: "archive-iris-north",
          label: "Archive iris",
          direction: "north",
          toRoomId: "archive",
        },
        {
          id: "surface-airlock",
          label: "Surface airlock",
          direction: "exit",
          requiredPuzzleId: "core-dawn",
        },
      ],
    },
  ],
};
