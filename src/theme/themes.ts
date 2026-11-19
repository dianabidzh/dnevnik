export type ThemeId = "paper" | "cocoa" | "lamp" | "lavender";

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  bg: string;
  card: string;
  accent: string;
}

export const THEMES: ThemeInfo[] = [
  { id: "paper", name: "Бумага", bg: "#F2E8D3", card: "#FBF5E6", accent: "#9A4A5E" },
  { id: "cocoa", name: "Какао", bg: "#E4D3BE", card: "#EEDFCB", accent: "#6B3E26" },
  { id: "lamp", name: "Ночной абажур", bg: "#1F1A17", card: "#2A2420", accent: "#E3A857" },
  { id: "lavender", name: "Лавандовое утро", bg: "#ECE6F0", card: "#F7F3FA", accent: "#7B5BA6" }
];

export const DEFAULT_THEME: ThemeId = "paper";
export const THEME_STORAGE_KEY = "dnevnik-theme";
