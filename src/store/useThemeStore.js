import { create } from "zustand";

const useThemeStore = create((set, get) => ({
  theme: "dark",

  setTheme: (theme, userId) => {
    set({ theme });
    const key = userId ? `skillfund-theme-${userId}` : "skillfund-theme-guest";
    localStorage.setItem(key, theme);
  },

  toggleTheme: (userId) => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    const key = userId ? `skillfund-theme-${userId}` : "skillfund-theme-guest";
    localStorage.setItem(key, next);
  },

  loadTheme: (userId) => {
    const key = userId ? `skillfund-theme-${userId}` : "skillfund-theme-guest";
    const saved = localStorage.getItem(key);
    if (saved) set({ theme: saved });
    else set({ theme: "dark" });
  },
}));

export default useThemeStore;