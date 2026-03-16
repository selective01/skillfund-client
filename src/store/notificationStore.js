import { create } from "zustand";
import api from "../utils/api";

const recalcUnread = (list) => list.filter((n) => !n.isRead).length;

const normalise = (n) =>
  n?._id && typeof n._id !== "string"
    ? { ...n, _id: String(n._id), userId: String(n.userId) }
    : n;

const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  fetchNotifications: async (page = 1, limit = 100) => {
    set({ loading: true });
    try {
      const res = await api.get("/notifications", { params: { page, limit } });
      const notifications = (res.data.notifications || []).map(normalise);
      set({ notifications, unreadCount: recalcUnread(notifications), loading: false });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      set({ loading: false });
    }
  },

  addNotificationRealtime: (notification) => {
    const n = normalise(notification);
    if (!n?._id) return;
    const current = get().notifications;
    if (current.some((x) => String(x._id) === String(n._id))) return;
    const updated = [n, ...current];
    set({ notifications: updated, unreadCount: recalcUnread(updated) });
  },

  markNotificationRead: async (id) => {
    if (!id) return;
    const previous = get().notifications;
    const updated = previous.map((n) =>
      String(n._id) === String(id) ? { ...n, isRead: true } : n
    );
    set({ notifications: updated, unreadCount: recalcUnread(updated) });
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      set({ notifications: previous, unreadCount: recalcUnread(previous) });
    }
  },

  markAllNotificationsRead: async () => {
    const previous = get().notifications;
    const updated = previous.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });
    try {
      await api.put("/notifications/read-all");
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      set({ notifications: previous, unreadCount: recalcUnread(previous) });
    }
  },

  markNotificationsReadByPrefix: async (prefix) => {
    if (!prefix || typeof prefix !== "string") return;
    if (prefix.trim() === "/") return;
    const previous = get().notifications;
    const updated = previous.map((n) =>
      !n.isRead && typeof n.link === "string" && n.link.startsWith(prefix)
        ? { ...n, isRead: true }
        : n
    );
    set({ notifications: updated, unreadCount: recalcUnread(updated) });
    try {
      await api.put("/notifications/read-by-prefix", { prefix });
    } catch (error) {
      console.error("Failed to mark notifications as read by prefix:", error);
      set({ notifications: previous, unreadCount: recalcUnread(previous) });
    }
  },

  // Marks all unread new_message notifications from a specific sender as read.
  // Called when the user clicks any message notification from that sender so
  // all their pending message notifications clear in one action.
  markMessageNotificationsRead: async (senderId) => {
    if (!senderId) return;
    const previous = get().notifications;
    const updated = previous.map((n) => {
      if (
        !n.isRead &&
        n.type === "new_message" &&
        String(n.metadata?.data?.senderId) === String(senderId)
      ) {
        return { ...n, isRead: true };
      }
      return n;
    });
    set({ notifications: updated, unreadCount: recalcUnread(updated) });
    try {
      await api.put("/notifications/read-by-sender", { senderId: String(senderId) });
    } catch (error) {
      console.error("Failed to mark message notifications as read:", error);
      set({ notifications: previous, unreadCount: recalcUnread(previous) });
    }
  },

  deleteNotification: async (id) => {
    if (!id) return;
    const previous = get().notifications;
    const updated = previous.filter((n) => String(n._id) !== String(id));
    set({ notifications: updated, unreadCount: recalcUnread(updated) });
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      set({ notifications: previous, unreadCount: recalcUnread(previous) });
    }
  },
}));

export default useNotificationStore;
