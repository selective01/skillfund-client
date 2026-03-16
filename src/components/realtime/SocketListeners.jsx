import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import useBlockStore from "../../store/useBlockStore";
import socket from "../../utils/socket";

export default function SocketListeners() {
  const user = useAuthStore((s) => s.user);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const addNotificationRealtime = useNotificationStore((s) => s.addNotificationRealtime);
  const setBlocked = useBlockStore((s) => s.setBlocked);
  const clearBlocked = useBlockStore((s) => s.clearBlocked);

  const fetchRef = useRef(fetchNotifications);
  const addRef = useRef(addNotificationRealtime);
  useEffect(() => { fetchRef.current = fetchNotifications; }, [fetchNotifications]);
  useEffect(() => { addRef.current = addNotificationRealtime; }, [addNotificationRealtime]);

  useEffect(() => {
    const userId = user?._id || user?.id;

    if (!userId) {
      if (socket.connected) socket.disconnect();
      return;
    }

    fetchRef.current(1, 100);

    const onConnect = () => fetchRef.current(1, 100);
    const onConnectError = (err) => console.error("Socket connect_error:", err?.message, err);

    const onNewNotification = (notification) => {
      addRef.current(notification);
      toast.success(notification?.message || "New notification");
    };

    // I blocked someone
    const onUserBlocked = ({ blockedId }) => {
      setBlocked(String(blockedId), "blocked_by_me");
    };

    // Someone blocked me
    const onUserBlockedBy = ({ blockerId }) => {
      setBlocked(String(blockerId), "blocked_by_them");
    };

    // I unblocked someone
    const onUserUnblocked = ({ blockedId }) => {
      clearBlocked(String(blockedId));
    };

    // Someone unblocked me
    const onUserUnblockedBy = ({ blockerId }) => {
      clearBlocked(String(blockerId));
    };

    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    socket.on("new_notification", onNewNotification);
    socket.on("user_blocked",      onUserBlocked);
    socket.on("user_blocked_by",   onUserBlockedBy);
    socket.on("user_unblocked",    onUserUnblocked);
    socket.on("user_unblocked_by", onUserUnblockedBy);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
      socket.off("new_notification", onNewNotification);
      socket.off("user_blocked",      onUserBlocked);
      socket.off("user_blocked_by",   onUserBlockedBy);
      socket.off("user_unblocked",    onUserUnblocked);
      socket.off("user_unblocked_by", onUserUnblockedBy);
    };

  }, [user?._id, user?.id, setBlocked, clearBlocked]);

  return null;
}
