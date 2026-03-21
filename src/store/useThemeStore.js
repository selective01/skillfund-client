import { create } from "zustand";
import { persist } from "zustand/middleware";

// Returns a localStorage key scoped to the current user so that
// toggling theme for one account never affects another account on
// the same device/browser.
function getScopedKey() {
  try {
    const raw = localStorage.getItem("user");
    const userId = raw ? JSON.parse(raw)?._id : null;
    return userId ? `skillfund-theme-${userId}` : "skillfund-theme-guest";
  } catch {
    return "skillfund-theme-guest";
  }
}

const useThemeStore = create(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
    }),
    {
      name: getScopedKey(),
    }
  )
);

export default useThemeStore;
