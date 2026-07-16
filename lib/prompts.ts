import type { GameState } from "./types";

export function buildGameGenerationPrompt(theme: string): string {
  return [
    "Create a short, fair AI escape room as strict JSON.",
    `Theme: ${theme}`,
    "Include three connected rooms, one logical puzzle per room, clues, hints, inventory, and a final escape condition.",
    "Do not include mutable player state.",
  ].join("\n");
}

export function buildPlayerActionPrompt(command: string, game: GameState): string {
  return [
    "Map the player command to a structured action intent.",
    `Game: ${game.title}`,
    `Command: ${command}`,
    "Return only JSON. Do not mutate game state.",
  ].join("\n");
}
