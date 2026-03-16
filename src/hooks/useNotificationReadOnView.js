import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useNotificationStore from "../store/notificationStore";

// Placed inside any page that notifications can link to.
// Reads from location.state what was passed by Notifications.jsx handleClick:
//   - notificationId  → mark just that one notification read
//   - notificationPrefix → mark ALL notifications whose link starts with prefix
// After marking, clears location.state so a refresh doesn't re-trigger.
export default function useNotificationReadOnView() {
  const location = useLocation();
  const navigate = useNavigate();
  const markNotificationRead = useNotificationStore((s) => s.markNotificationRead);
  const markNotificationsReadByPrefix = useNotificationStore((s) => s.markNotificationsReadByPrefix);

  const notificationId = location.state?.notificationId;
  const notificationPrefix = location.state?.notificationPrefix;

  useEffect(() => {
    if (!notificationId && !notificationPrefix) return;

    const run = async () => {
      if (notificationPrefix) {
        await markNotificationsReadByPrefix(notificationPrefix);
      } else if (notificationId) {
        await markNotificationRead(notificationId);
      }

      navigate(location.pathname + location.search, {
        replace: true,
        state: null,
      });
    };

    run();
  }, [
    notificationId,
    notificationPrefix,
    location.pathname,
    location.search,
    navigate,
    markNotificationRead,
    markNotificationsReadByPrefix,
  ]);
}
