import type { GameState } from "./types";

export const sampleGame: GameState = {
  id: "sample-ai-lab",
  title: "The Greenlight Protocol",
  theme: "Escape from an abandoned AI laboratory",
  openingMission:
    "Emergency lights pulse through the abandoned lab. Restore the Greenlight Protocol, cross the archive, and open the final airlock.",
  currentRoomId: "atrium",
  rooms: [
    {
      id: "atrium",
      name: "Signal Atrium",
      visualTheme: "green",
      completed: false,
      description:
        "A reception bay glows with green emergency strips. A sealed archive door waits east, and a cracked lens rests under a diagnostic screen.",
      objects: [
        {
          id: "diagnostic-screen",
          name: "diagnostic screen",
          description:
            "The display loops a corrupted readiness check in green phosphor.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["diagnostic-screen"],
          collectibleItemId: null,
        },
        {
          id: "calibration-lens",
          name: "calibration lens",
          description:
            "A smoked glass lens etched with the word SIGNAL along its rim.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["lens-etching"],
          collectibleItemId: "calibration-lens",
        },
        {
          id: "archive-door",
          name: "archive door",
          description:
            "Five letter slots blink beside a waveform symbol. The lens makes the slots readable.",
          visible: true,
          searchable: true,
          requiredItemId: "calibration-lens",
          discoveredClueIds: ["archive-door"],
          collectibleItemId: null,
        },
      ],
      clues: [
        {
          id: "diagnostic-screen",
          title: "Diagnostic Screen",
          content:
            "The screen repeats: 'Clean SIGNAL required before memory transfer.'",
        },
        {
          id: "lens-etching",
          title: "Lens Etching",
          content: "The lens rim is etched with the word SIGNAL.",
        },
        {
          id: "archive-door",
          title: "Archive Door",
          content: "The archive door has five slots and accepts waveform words.",
        },
      ],
      puzzle: {
        id: "atrium-signal",
        type: "word",
        prompt: "The archive door asks for the five-letter transfer word.",
        solution: "signal",
        acceptedAnswers: ["signal", "clean signal"],
        clueIds: ["diagnostic-screen", "lens-etching"],
        hintLevels: [
          "The lens and the diagnostic screen repeat the same key word.",
          "The door has five slots and a waveform symbol.",
          "Try: signal.",
        ],
        solved: false,
        successMessage:
          "The door reads SIGNAL. Its locks cycle open with a low teal hum.",
      },
      exits: [
        {
          id: "archive-door-east",
          label: "Archive door",
          direction: "east",
          toRoomId: "archive",
          requiredPuzzleId: "atrium-signal",
          final: false,
        },
      ],
    },
    {
      id: "archive",
      name: "Memory Archive",
      visualTheme: "teal",
      completed: false,
      description:
        "Rows of memory cabinets blink in teal and violet. A southern iris blocks the path to the core.",
      objects: [
        {
          id: "lit-cabinets",
          name: "lit cabinets",
          description:
            "Cabinet lights mark the first memories in a simple numerical chain.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["lit-cabinets"],
          collectibleItemId: null,
        },
        {
          id: "sequence-note",
          name: "sequence note",
          description:
            "A maintenance note is taped to a cold storage drawer.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["sequence-note"],
          collectibleItemId: null,
        },
      ],
      clues: [
        {
          id: "lit-cabinets",
          title: "Lit Cabinets",
          content: "Four cabinet lights read 1, 1, 2, and a blank slot.",
        },
        {
          id: "sequence-note",
          title: "Sequence Note",
          content:
            "A note says: 'The next memory is the sum of the two before it.'",
        },
      ],
      puzzle: {
        id: "archive-sequence",
        type: "sequence",
        prompt: "The iris asks for the missing number in 1, 1, 2, ?",
        solution: "3",
        acceptedAnswers: ["3", "three"],
        clueIds: ["lit-cabinets", "sequence-note"],
        hintLevels: [
          "The note describes a simple adding pattern.",
          "Add the last two visible numbers: 1 and 2.",
          "Try: 3.",
        ],
        solved: false,
        successMessage:
          "The archive accepts the sequence. The southern iris opens into purple light.",
      },
      exits: [
        {
          id: "atrium-door-west",
          label: "Atrium door",
          direction: "west",
          toRoomId: "atrium",
          requiredPuzzleId: null,
          final: false,
        },
        {
          id: "core-iris-south",
          label: "Core iris",
          direction: "south",
          toRoomId: "core",
          requiredPuzzleId: "archive-sequence",
          final: false,
        },
      ],
    },
    {
      id: "core",
      name: "Failsafe Core",
      visualTheme: "purple",
      completed: false,
      description:
        "The command core floats in a violet containment ring. A surface airlock waits beyond the final console.",
      objects: [
        {
          id: "core-display",
          name: "core display",
          description:
            "A suspended display reviews the two locks you have restored.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["core-display"],
          collectibleItemId: null,
        },
        {
          id: "violet-plaque",
          name: "violet plaque",
          description:
            "A small metal plaque sits below the airlock status panel.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["violet-plaque"],
          collectibleItemId: null,
        },
      ],
      clues: [
        {
          id: "core-display",
          title: "Core Display",
          content:
            "The display reads: 'After SIGNAL and THREE, the morning key remains.'",
        },
        {
          id: "violet-plaque",
          title: "Violet Plaque",
          content: "A plaque below the airlock is stamped with one word: DAWN.",
        },
      ],
      puzzle: {
        id: "core-dawn",
        type: "word",
        prompt: "The final console asks for the morning key.",
        solution: "dawn",
        acceptedAnswers: ["dawn", "the dawn"],
        clueIds: ["core-display", "violet-plaque"],
        hintLevels: [
          "The display points to the word after the first two solved locks.",
          "The plaque beneath the airlock gives the exact word.",
          "Try: dawn.",
        ],
        solved: false,
        successMessage:
          "The command core accepts DAWN. The surface airlock unlocks.",
      },
      exits: [
        {
          id: "archive-iris-north",
          label: "Archive iris",
          direction: "north",
          toRoomId: "archive",
          requiredPuzzleId: null,
          final: false,
        },
        {
          id: "surface-airlock",
          label: "Surface airlock",
          direction: "exit",
          toRoomId: null,
          requiredPuzzleId: "core-dawn",
          final: true,
        },
      ],
    },
  ],
  inventory: [],
  discoveredClueIds: [],
  solvedPuzzleIds: [],
  objectives: [
    {
      id: "objective-atrium",
      text: "Recover the calibration lens and unlock the archive door.",
      completed: false,
    },
    {
      id: "objective-archive",
      text: "Solve the archive sequence and reach the core.",
      completed: false,
    },
    {
      id: "objective-core",
      text: "Speak the reset word and escape through the airlock.",
      completed: false,
    },
  ],
  narrativeHistory: [
    {
      id: "opening",
      role: "system",
      content:
        "Emergency lights pulse through the abandoned lab. Restore the Greenlight Protocol, cross the archive, and open the final airlock.",
      timestamp: 0,
    },
  ],
  hintsUsed: {},
  status: "playing",
  startedAt: 0,
  demoMode: true,
};
