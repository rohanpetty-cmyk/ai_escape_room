import type { GameState } from "./types";

export const sampleGame: GameState = {
  id: "ai-lab-lockdown",
  title: "Failsafe Lockdown",
  theme:
    "An autonomous AI has locked the team inside a failing research laboratory.",
  openingMission:
    "The research lab is collapsing into emergency mode. An autonomous AI has sealed every exit, and your team is trapped behind failing systems. Recover the override path, stabilize the server lock, and force the emergency door open.",
  currentRoomId: "control-room",
  rooms: [
    {
      id: "control-room",
      name: "Control Room",
      description:
        "A dark command center flickers with green diagnostic light. The main console is locked, a status wall repeats warnings, and a cracked tool drawer hangs open beneath a whiteboard.",
      visualTheme: "green",
      objects: [
        {
          id: "status-wall",
          name: "status wall",
          description:
            "The wall display shows the lockdown mode, power loss, and the AI's current command layer.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["control-mode-clue"],
          collectibleItemId: null,
        },
        {
          id: "whiteboard",
          name: "whiteboard",
          description:
            "Half-erased marker lines point from MANUAL MODE to a supervisor override slot.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["override-code-clue"],
          collectibleItemId: null,
        },
        {
          id: "insulated-screwdriver",
          name: "insulated screwdriver",
          description:
            "An insulated screwdriver rests in the open drawer, rated for live server panels.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["screwdriver-clue"],
          collectibleItemId: "insulated-screwdriver",
        },
        {
          id: "admin-badge",
          name: "admin badge",
          description:
            "A supervisor admin badge hangs from a chair near the locked console.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["badge-clue"],
          collectibleItemId: "admin-badge",
        },
        {
          id: "main-console",
          name: "main console",
          description:
            "The console accepts a three-character supervisor override code.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["console-clue"],
          collectibleItemId: null,
        },
      ],
      clues: [
        {
          id: "control-mode-clue",
          title: "Lockdown Mode",
          content:
            "The status wall reads: 'Current override layer: MANUAL. Supervisor code required.'",
        },
        {
          id: "override-code-clue",
          title: "Whiteboard Code",
          content:
            "The whiteboard says: 'Manual restart drills: A17 opens first gate.'",
        },
        {
          id: "screwdriver-clue",
          title: "Live Panel Tool",
          content:
            "A note on the drawer warns: 'Use insulated driver on server wall only.'",
        },
        {
          id: "badge-clue",
          title: "Supervisor Badge",
          content:
            "The badge belongs to Dr. Vega and still carries high-security access.",
        },
        {
          id: "console-clue",
          title: "Console Prompt",
          content: "The console prompt blinks: 'MANUAL OVERRIDE: _ _ _'.",
        },
      ],
      puzzle: {
        id: "control-override",
        type: "code",
        prompt:
          "The main console asks for the three-character manual override code.",
        solution: "A17",
        acceptedAnswers: ["a17", "manual a17", "code a17"],
        clueIds: ["control-mode-clue", "override-code-clue", "console-clue"],
        hintLevels: [
          "The status wall tells you which override layer is active.",
          "The whiteboard ties MANUAL mode to a short supervisor code.",
          "Try: A17.",
        ],
        solved: false,
        successMessage:
          "The console accepts A17. The eastern bulkhead unlocks and the AI reroutes you toward the server chamber.",
      },
      exits: [
        {
          id: "server-door-east",
          label: "Server Chamber door",
          direction: "east",
          toRoomId: "server-chamber",
          requiredPuzzleId: "control-override",
          final: false,
        },
      ],
      completed: false,
    },
    {
      id: "server-chamber",
      name: "Server Chamber",
      description:
        "Heat rolls out between black server racks. A coolant relay flashes red, a loose service panel sparks on the wall, and an optical cable coil lies beside a dead monitoring station.",
      visualTheme: "teal",
      objects: [
        {
          id: "rack-temperature-log",
          name: "rack temperature log",
          description:
            "The monitoring station lists node loads while the AI overclocks the chamber.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["doubling-pattern-clue"],
          collectibleItemId: null,
        },
        {
          id: "loose-service-panel",
          name: "loose service panel",
          description:
            "The panel is live, but the insulated screwdriver can open it without shorting the rack.",
          visible: true,
          searchable: true,
          requiredItemId: "insulated-screwdriver",
          discoveredClueIds: ["relay-sequence-clue"],
          collectibleItemId: null,
        },
        {
          id: "fiber-loop-cable",
          name: "fiber loop cable",
          description:
            "A short fiber loop cable, useful for bridging a severed optical access circuit.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["fiber-cable-clue"],
          collectibleItemId: "fiber-loop-cable",
        },
        {
          id: "coolant-canister",
          name: "coolant canister",
          description:
            "A portable coolant canister, cold enough to stabilize a thermal lock for a few seconds.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["coolant-clue"],
          collectibleItemId: "coolant-canister",
        },
        {
          id: "coolant-relay",
          name: "coolant relay",
          description:
            "The relay demands the next number in the server node escalation pattern.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["relay-prompt-clue"],
          collectibleItemId: null,
        },
      ],
      clues: [
        {
          id: "doubling-pattern-clue",
          title: "Temperature Log",
          content:
            "The log reads: 'Node load escalation: 2, 4, 8, ? before thermal dump.'",
        },
        {
          id: "relay-sequence-clue",
          title: "Service Panel Sequence",
          content:
            "Inside the panel, a label reads: 'Each emergency node doubles the previous load.'",
        },
        {
          id: "fiber-cable-clue",
          title: "Fiber Cable",
          content:
            "A tag on the cable says: 'Door optics bypass - emergency hatch only.'",
        },
        {
          id: "coolant-clue",
          title: "Coolant Canister",
          content:
            "The canister is marked for one-shot use on overheated exit locks.",
        },
        {
          id: "relay-prompt-clue",
          title: "Relay Prompt",
          content: "The coolant relay flashes: '2 -> 4 -> 8 -> ?'.",
        },
      ],
      puzzle: {
        id: "server-relay",
        type: "sequence",
        prompt: "The coolant relay asks for the next node load: 2, 4, 8, ?",
        solution: "16",
        acceptedAnswers: ["16", "sixteen"],
        clueIds: [
          "doubling-pattern-clue",
          "relay-sequence-clue",
          "relay-prompt-clue",
        ],
        hintLevels: [
          "The monitoring station and service panel both describe the same pattern.",
          "Each number doubles: 2 becomes 4, and 4 becomes 8.",
          "Try: 16.",
        ],
        solved: false,
        successMessage:
          "The relay accepts 16. Fans surge, heat drops, and the emergency exit corridor unlocks.",
      },
      exits: [
        {
          id: "control-door-west",
          label: "Control Room door",
          direction: "west",
          toRoomId: "control-room",
          requiredPuzzleId: null,
          final: false,
        },
        {
          id: "exit-corridor-east",
          label: "Emergency Exit corridor",
          direction: "east",
          toRoomId: "emergency-exit",
          requiredPuzzleId: "server-relay",
          final: false,
        },
      ],
      completed: false,
    },
    {
      id: "emergency-exit",
      name: "Emergency Exit",
      description:
        "The final corridor shakes under failing ventilation. The emergency hatch is sealed by a biometric reader, a severed optical loop, and a thermal lock glowing purple-white.",
      visualTheme: "purple",
      objects: [
        {
          id: "biometric-reader",
          name: "biometric reader",
          description:
            "The reader will only reveal its release word to someone carrying supervisor credentials.",
          visible: true,
          searchable: true,
          requiredItemId: "admin-badge",
          discoveredClueIds: ["biometric-reader-clue"],
          collectibleItemId: null,
        },
        {
          id: "optical-loop-port",
          name: "optical loop port",
          description:
            "The hatch optics are severed, but the fiber loop cable can bridge the circuit.",
          visible: true,
          searchable: true,
          requiredItemId: "fiber-loop-cable",
          discoveredClueIds: ["optical-loop-clue"],
          collectibleItemId: null,
        },
        {
          id: "thermal-lock",
          name: "thermal lock",
          description:
            "The thermal lock is too hot to touch until the coolant canister chills the sensor.",
          visible: true,
          searchable: true,
          requiredItemId: "coolant-canister",
          discoveredClueIds: ["thermal-lock-clue"],
          collectibleItemId: null,
        },
        {
          id: "evacuation-poster",
          name: "evacuation poster",
          description:
            "A safety poster curls beside the hatch, still readable under emergency strobes.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["poster-clue"],
          collectibleItemId: null,
        },
        {
          id: "exit-hatch",
          name: "exit hatch",
          description:
            "The hatch waits for the final life-support release word.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["hatch-prompt-clue"],
          collectibleItemId: null,
        },
      ],
      clues: [
        {
          id: "biometric-reader-clue",
          title: "Biometric Reader",
          content:
            "With the admin badge nearby, the reader displays: 'Life support release requires human priority word.'",
        },
        {
          id: "optical-loop-clue",
          title: "Optical Loop",
          content:
            "The patched optics add: 'AI may lock doors, but cannot deny air.'",
        },
        {
          id: "thermal-lock-clue",
          title: "Thermal Lock",
          content:
            "After coolant hits the sensor, the lock prints: 'Command must restore breath.'",
        },
        {
          id: "poster-clue",
          title: "Evacuation Poster",
          content:
            "The poster headline reads: 'In any lab emergency, breathe first, then move.'",
        },
        {
          id: "hatch-prompt-clue",
          title: "Exit Hatch Prompt",
          content: "The hatch prompt blinks: 'LIFE SUPPORT RELEASE WORD: _______'.",
        },
      ],
      puzzle: {
        id: "exit-release",
        type: "word",
        prompt:
          "The emergency hatch asks for the life-support release word.",
        solution: "breathe",
        acceptedAnswers: ["breathe", "breath", "restore breath"],
        clueIds: [
          "biometric-reader-clue",
          "optical-loop-clue",
          "thermal-lock-clue",
          "poster-clue",
          "hatch-prompt-clue",
        ],
        hintLevels: [
          "The final room's clues all point toward life support and air.",
          "The poster gives the clearest verb for surviving a lab emergency.",
          "Try: breathe.",
        ],
        solved: false,
        successMessage:
          "The hatch accepts BREATHE. Bolts retract and the AI loses physical control of the exit.",
      },
      exits: [
        {
          id: "server-door-west",
          label: "Server Chamber door",
          direction: "west",
          toRoomId: "server-chamber",
          requiredPuzzleId: null,
          final: false,
        },
        {
          id: "outer-hatch",
          label: "Outer hatch",
          direction: "exit",
          toRoomId: null,
          requiredPuzzleId: "exit-release",
          final: true,
        },
      ],
      completed: false,
    },
  ],
  inventory: [],
  discoveredClueIds: [],
  solvedPuzzleIds: [],
  objectives: [
    {
      id: "objective-control-room",
      text: "Find the manual override code and unlock the route to the server chamber.",
      completed: false,
    },
    {
      id: "objective-server-chamber",
      text: "Use the control room tools, stabilize the server relay, and recover anything needed for the exit.",
      completed: false,
    },
    {
      id: "objective-emergency-exit",
      text: "Use the collected access items to discover the release word and escape.",
      completed: false,
    },
  ],
  narrativeHistory: [
    {
      id: "opening-ai-lab-lockdown",
      role: "system",
      content:
        "The research lab is collapsing into emergency mode. An autonomous AI has sealed every exit, and your team is trapped behind failing systems. Recover the override path, stabilize the server lock, and force the emergency door open.",
      timestamp: 0,
    },
  ],
  hintsUsed: {},
  status: "playing",
  startedAt: 0,
  demoMode: false,
};

export const demoGame: GameState = {
  id: "demo-ai-lab-lockdown",
  title: "Lockdown Drill",
  theme:
    "A one-room training version of the autonomous AI laboratory lockdown.",
  openingMission:
    "Demo mode: the AI has locked a training bay. Read the room, solve one console prompt, and exit in under two minutes.",
  currentRoomId: "training-bay",
  rooms: [
    {
      id: "training-bay",
      name: "Training Bay",
      description:
        "A compact training bay glows with teal guide lights. A practice console, a safety card, and a small exit hatch sit within arm's reach.",
      visualTheme: "teal",
      objects: [
        {
          id: "safety-card",
          name: "safety card",
          description:
            "A laminated card is clipped to the console for emergency drills.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["demo-card-clue"],
          collectibleItemId: "safety-card",
        },
        {
          id: "practice-console",
          name: "practice console",
          description:
            "The console asks for the simple training release word.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["demo-console-clue"],
          collectibleItemId: null,
        },
        {
          id: "demo-exit-hatch",
          name: "exit hatch",
          description:
            "The hatch is ready to open after the console accepts its training word.",
          visible: true,
          searchable: true,
          requiredItemId: null,
          discoveredClueIds: ["demo-hatch-clue"],
          collectibleItemId: null,
        },
      ],
      puzzle: {
        id: "demo-release",
        type: "word",
        prompt: "The practice console asks for the training release word.",
        solution: "open",
        acceptedAnswers: ["open", "release", "open hatch"],
        clueIds: ["demo-card-clue", "demo-console-clue"],
        hintLevels: [
          "The safety card is meant to be read first.",
          "The console asks for the action you want the hatch to take.",
          "Try: open.",
        ],
        solved: false,
        successMessage:
          "The practice console accepts OPEN. The demo hatch unlocks.",
      },
      exits: [
        {
          id: "demo-final-exit",
          label: "Demo hatch",
          direction: "exit",
          toRoomId: null,
          requiredPuzzleId: "demo-release",
          final: true,
        },
      ],
      completed: false,
      clues: [
        {
          id: "demo-card-clue",
          title: "Safety Card",
          content: "The card says: 'Training hatches respond to OPEN.'",
        },
        {
          id: "demo-console-clue",
          title: "Practice Console",
          content: "The console prompt reads: 'Type release action.'",
        },
        {
          id: "demo-hatch-clue",
          title: "Demo Hatch",
          content: "The hatch indicator is locked until the console is solved.",
        },
      ],
    },
  ],
  inventory: [],
  discoveredClueIds: [],
  solvedPuzzleIds: [],
  objectives: [
    {
      id: "objective-training-bay",
      text: "Find the release word, solve the practice console, and exit.",
      completed: false,
    },
  ],
  narrativeHistory: [
    {
      id: "opening-demo-ai-lab-lockdown",
      role: "system",
      content:
        "Demo mode: the AI has locked a training bay. Read the room, solve one console prompt, and exit in under two minutes.",
      timestamp: 0,
    },
  ],
  hintsUsed: {},
  status: "playing",
  startedAt: 0,
  demoMode: true,
};
