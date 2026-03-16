import { create } from "zustand";
import api from "../utils/api";

// Triggers an immediate notification fetch without going through React's
// render/effect cycle. Called right after login and register so the bell
// badge and sidebar counts are populated before the first authenticated
// render, regardless of navigation timing.
async function prefetchNotifications() {
  try {
    const { default: useNotificationStore } = await import("./notificationStore");
    useNotificationStore.getState().fetchNotifications(1, 100);
  } catch {
    // Non-critical — SocketListeners will retry on socket connect
  }
}

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/register", data);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, token, loading: false });
      prefetchNotifications();
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/auth/login", data);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ user, token, loading: false });
      prefetchNotifications();
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
    window.location.href = "/login";
  },

  updateUser: (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
