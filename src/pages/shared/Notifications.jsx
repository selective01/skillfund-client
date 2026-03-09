import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  TrendingUp,
  UserPlus,
  MessageSquare,
  DollarSign,
  AlertCircle,
  Info,
  Star,
  Trash2,
  Loader2,
  Filter,
} from "lucide-react";
import api from "../../utils/api";

// ─── Notification type config ─────────────────────────────────────────────────
const TYPE_CONFIG = {
  connection_request:  { icon: UserPlus,     color: "text-blue-400",    bg: "bg-blue-400/10",    label: "Connection" },
  connection_accepted: { icon: UserPlus,     color: "text-green-400",   bg: "bg-green-400/10",   label: "Connection" },
  new_message:         { icon: MessageSquare,color: "text-primary-400", bg: "bg-primary-400/10", label: "Message" },
  proposal_received:   { icon: TrendingUp,   color: "text-purple-400",  bg: "bg-purple-400/10",  label: "Proposal" },
  proposal_accepted:   { icon: TrendingUp,   color: "text-green-400",   bg: "bg-green-400/10",   label: "Proposal" },
  proposal_rejected:   { icon: TrendingUp,   color: "text-red-400",     bg: "bg-red-400/10",     label: "Proposal" },
  proposal_negotiated: { icon: TrendingUp,   color: "text-yellow-400",  bg: "bg-yellow-400/10",  label: "Proposal" },
  investment_active:   { icon: DollarSign,   color: "text-green-400",   bg: "bg-green-400/10",   label: "Investment" },
  earnings_reported:   { icon: DollarSign,   color: "text-primary-400", bg: "bg-primary-400/10", label: "Earnings" },
  withdrawal_approved: { icon: DollarSign,   color: "text-green-400",   bg: "bg-green-400/10",   label: "Withdrawal" },
  withdrawal_rejected: { icon: DollarSign,   color: "text-red-400",     bg: "bg-red-400/10",     label: "Withdrawal" },
  kyc_approved:        { icon: Star,         color: "text-green-400",   bg: "bg-green-400/10",   label: "Verification" },
  kyc_rejected:        { icon: AlertCircle,  color: "text-red-400",     bg: "bg-red-400/10",     label: "Verification" },
  system:              { icon: Info,         color: "text-dark-300",    bg: "bg-dark-500/30",    label: "System" },
};

const FILTER_TABS = ["all", "unread", "connection", "message", "proposal", "investment", "withdrawal"];

function formatTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  // ─── Fetch ─────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || res.data.data || res.data || []);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ─── Mark one as read ──────────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    try {
      await api.put(`/notifications/${id}/read`);
    } catch {
      // silent fail — optimistic update stays
    }
  };

  // ─── Mark all as read ──────────────────────────────────────────────────
  const markAllRead = async () => {
    setActionLoading((p) => ({ ...p, markAll: true }));
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    } finally {
      setActionLoading((p) => ({ ...p, markAll: false }));
    }
  };

  // ─── Delete one ────────────────────────────────────────────────────────
  const deleteNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    try {
      await api.delete(`/notifications/${id}`);
    } catch {
      toast.error("Failed to delete notification");
      fetchNotifications();
    }
  };

  // ─── Navigate on click ─────────────────────────────────────────────────
  const handleClick = (notif) => {
    if (!notif.isRead) markRead(notif._id);
    if (!notif.link) return;
    navigate(notif.link);
  };

  // ─── Filtering ─────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeTab === "all")    return true;
    if (activeTab === "unread") return !n.isRead;
    const tc = TYPE_CONFIG[n.type];
    return tc?.label?.toLowerCase() === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-primary-500 text-white px-2.5 py-0.5 rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-dark-200 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={actionLoading.markAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 hover:bg-dark-500 text-dark-200 hover:text-white border border-dark-500 text-sm transition-all disabled:opacity-60"
          >
            {actionLoading.markAll ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            Mark all read
          </button>
        )}
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        <Filter size={14} className="text-dark-400 flex-shrink-0 mt-2 ml-1" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-primary-500 text-white"
                : "bg-dark-700 text-dark-300 hover:text-white border border-dark-500"
            }`}
          >
            {tab}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-1 bg-primary-400/30 text-primary-300 px-1.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── List ── */}
      {loading ? (
        <NotificationsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BellOff size={40} className="text-dark-400 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">
            {activeTab === "unread" ? "No unread notifications" : "No notifications"}
          </h3>
          <p className="text-dark-300 text-sm">
            {activeTab === "unread"
              ? "You're all caught up!"
              : "Notifications will appear here when something happens."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => {
            const tc = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
            const Icon = tc.icon;

            return (
              <div
                key={notif._id}
                className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                  notif.isRead
                    ? "bg-dark-700/40 border-dark-600 hover:border-dark-400"
                    : "bg-dark-700 border-primary-500/20 hover:border-primary-500/40"
                }`}
                onClick={() => handleClick(notif)}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.bg}`}>
                  <Icon size={18} className={tc.color} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Type badge */}
                      <span className={`text-xs font-semibold uppercase tracking-wide ${tc.color}`}>
                        {tc.label}
                      </span>
                      <p className={`text-sm mt-0.5 leading-snug ${notif.isRead ? "text-dark-200" : "text-white font-medium"}`}>
                        {notif.message || notif.title || notif.body || "New notification"}
                      </p>
                      {notif.description && (
                        <p className="text-dark-300 text-xs mt-0.5 leading-relaxed">
                          {notif.description}
                        </p>
                      )}
                    </div>

                    {/* Time + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-dark-400 text-xs whitespace-nowrap">
                        {formatTime(notif.createdAt)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead(notif._id); }}
                            className="p-1.5 rounded-lg bg-dark-600 hover:bg-primary-500/20 text-dark-300 hover:text-primary-400 transition-all"
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                          className="p-1.5 rounded-lg bg-dark-600 hover:bg-red-500/20 text-dark-300 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      <span className="text-primary-400 text-xs font-medium">New</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-dark-700 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-dark-600 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-dark-600 rounded w-1/5" />
            <div className="h-3.5 bg-dark-600 rounded w-3/4" />
            <div className="h-3 bg-dark-600 rounded w-1/3" />
          </div>
          <div className="h-3 bg-dark-600 rounded w-10 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}
