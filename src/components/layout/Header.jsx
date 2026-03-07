import { Bell, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";

export default function Header({ title, onMenuClick }) {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications?unreadOnly=true&limit=1");
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        // silent fail
      }
    };
    fetchNotifications();
  }, []);

  return (
    <header className="h-16 bg-dark-700 border-b border-dark-500 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-dark-200 hover:text-white"
        >
          <Menu size={22} />
        </button>
        <h2 className="text-white font-semibold text-lg">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative text-dark-200 hover:text-white transition-colors"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm overflow-hidden">
            {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
                user?.name?.charAt(0).toUpperCase()
            )}
        </div>
      </div>
    </header>
  );
}