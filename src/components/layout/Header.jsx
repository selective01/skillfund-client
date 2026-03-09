import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/useThemeStore";
import api from "../../utils/api";

export default function Header({ title, onMenuClick }) {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [unreadCount, setUnreadCount] = useState(0);

  const isLight = theme === "light";
  const t = {
    bg:        isLight ? "#ffffff" : "#040806",
    border:    isLight ? "#cce8d0" : "#1a2e1d",
    title:     isLight ? "#0a1a0c" : "#ffffff",
    icon:      isLight ? "#6b7280" : "#4a5568",
    iconHover: isLight ? "#0a1a0c" : "#ffffff",
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications?unreadOnly=true&limit=1");
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        // Silent fail
      }
    };
    fetchNotifications();
  }, []);

  return (
    <header
      className="h-16 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-40"
      style={{
        background:   t.bg,
        borderBottom: `1px solid ${t.border}`,
        transition:   "background 0.25s ease, border-color 0.2s ease",
      }}
    >
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden" style={{ color: t.icon }}>☰</button>
        )}
        <h2
          className="font-semibold text-lg"
          style={{ color: t.title, fontFamily: "'Syne', sans-serif", transition: "color 0.2s ease" }}
        >
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/notifications"
          className="relative transition-colors"
          style={{ color: t.icon }}
          onMouseEnter={e => { e.currentTarget.style.color = t.iconHover; }}
          onMouseLeave={e => { e.currentTarget.style.color = t.icon; }}
        >
          <FontAwesomeIcon icon={faBell} style={{ fontSize: "18px" }} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs text-black flex items-center justify-center font-bold"
              style={{ background: "#22c55e", fontSize: "10px" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden"
          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            : user?.name?.charAt(0).toUpperCase()
          }
        </div>
      </div>
    </header>
  );
}
