import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
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
  ShieldAlert,
  ShieldCheck,
  Rocket,
  Target,
  Layers,
} from "lucide-react";
import useNotificationStore from "../../store/notificationStore";

const TYPE_CONFIG = {
  connection_request: {
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    label: "connection",
  },
  connection_accepted: {
    icon: UserPlus,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "connection",
  },
  new_message: {
    icon: MessageSquare,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    label: "message",
  },
  proposal_sent: {
    icon: TrendingUp,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    label: "proposal",
  },
  proposal_accepted: {
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "proposal",
  },
  proposal_rejected: {
    icon: TrendingUp,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "proposal",
  },
  proposal_negotiated: {
    icon: TrendingUp,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    label: "proposal",
  },
  investment_locked: {
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "investment",
  },
  earnings_reported: {
    icon: DollarSign,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    label: "earnings",
  },
  withdrawal_approved: {
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "withdrawal",
  },
  withdrawal_rejected: {
    icon: DollarSign,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "withdrawal",
  },
  verification_approved: {
    icon: Star,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "verification",
  },
  verification_rejected: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "verification",
  },
  plan_upgraded: {
    icon: Rocket,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    label: "subscription",
  },
  dispute_opened: {
    icon: ShieldAlert,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    label: "dispute",
  },
  dispute_resolved: {
    icon: ShieldCheck,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "dispute",
  },
  crypto_payment_confirmed: {
    icon: DollarSign,
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    label: "payment",
  },
  growth_milestone: {
    icon: Target,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    label: "growth",
  },
  milestone_created: {
    icon: Layers,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    label: "milestone",
  },
  milestone_proof_submitted: {
    icon: Layers,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    label: "milestone",
  },
  milestone_approved: {
    icon: Layers,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "milestone",
  },
  milestone_disputed: {
    icon: Layers,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "milestone",
  },
  milestone_auto_released: {
    icon: Layers,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    label: "milestone",
  },
  milestone_dispute_approved: {
    icon: Layers,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "milestone",
  },
  milestone_dispute_rejected: {
    icon: Layers,
    color: "text-red-400",
    bg: "bg-red-400/10",
    label: "milestone",
  },
  syndicate_investor_joined: {
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    label: "syndicate",
  },
  syndicate_progress: {
    icon: TrendingUp,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    label: "syndicate",
  },
  syndicate_fully_funded: {
    icon: DollarSign,
    color: "text-green-400",
    bg: "bg-green-400/10",
    label: "syndicate",
  },
  syndicate_share_transferred: {
    icon: CheckCheck,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    label: "syndicate",
  },
  system: {
    icon: Info,
    color: "text-gray-400",
    bg: "bg-white/10",
    label: "system",
  },
};

const FILTER_TABS = [
  "all",
  "unread",
  "connection",
  "message",
  "proposal",
  "investment",
  "earnings",
  "withdrawal",
  "verification",
  "subscription",
  "milestone",
  "syndicate",
  "dispute",
  "payment",
  "growth",
  "system",
];

function formatTime(dateStr) {
  if (!dateStr) return "";

  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");

  const {
    notifications,
    loading,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "all") return true;
      if (activeTab === "unread") return !n.isRead;

      const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
      return tc.label === activeTab;
    });
  }, [notifications, activeTab]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  // Prefixes where clicking one notification should clear ALL notifications
  // for that section — e.g. opening Messages clears every unread message notif.
  const PREFIX_CLEAR_PATHS = [
    "/messages",
    "/connections",
    "/investments",
    "/syndicates",
    "/disputes",
    "/earnings",
    "/portfolio",
    "/withdraw",
    "/kyc",
  ];

  const handleClick = (notif) => {
    if (!notif.link) {
      if (!notif.isRead) {
        markNotificationRead(notif._id);
      }
      return;
    }

    // Check if this link matches a section that should bulk-clear on visit
    const matchedPrefix = PREFIX_CLEAR_PATHS.find((prefix) =>
      notif.link.startsWith(prefix)
    );

    if (matchedPrefix) {
      // Pass the prefix — useNotificationReadOnView will clear all notifications
      // whose link starts with this prefix when the destination page mounts
      navigate(notif.link, {
        state: { notificationPrefix: matchedPrefix },
      });
    } else {
      // Single notification — mark only this one read
      navigate(notif.link, {
        state: { notificationId: notif._id },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm bg-primary-500 text-white px-2.5 py-0.5 rounded-full font-semibold">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/20 text-sm transition-all disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-none">
        <Filter size={14} className="text-gray-400 flex-shrink-0 mt-2 ml-1" />
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
              activeTab === tab
                ? "bg-primary-500 text-white"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/20"
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

      {loading ? (
        <NotificationsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BellOff size={40} className="text-gray-400 mx-auto mb-3" />
          <h3 className="text-white font-bold mb-1">
            {activeTab === "unread"
              ? "No unread notifications"
              : "No notifications"}
          </h3>
          <p className="text-gray-400 text-sm">
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
                    ? "bg-white/5 border-white/15 hover:border-white/25"
                    : "bg-white/5 border-primary-500/25 hover:border-primary-500/40"
                }`}
                onClick={() => handleClick(notif)}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tc.bg}`}
                >
                  <Icon size={18} className={tc.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${tc.color}`}
                      >
                        {tc.label}
                      </span>

                      <p
                        className={`text-sm mt-0.5 leading-snug ${
                          notif.isRead
                            ? "text-gray-400"
                            : "text-white font-medium"
                        }`}
                      >
                        {notif.message || notif.title || "New notification"}
                      </p>

                      {notif.title && notif.title !== notif.message && (
                        <p className="text-xs text-gray-500 mt-1">
                          {notif.title}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className="text-gray-400 text-xs whitespace-nowrap">
                        {formatTime(notif.createdAt)}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationRead(notif._id);
                            }}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-primary-500/20 text-gray-400 hover:text-primary-400 transition-all"
                            title="Mark as read"
                          >
                            <Check size={12} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif._id);
                          }}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      <span className="text-primary-400 text-xs font-medium">
                        New
                      </span>
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

function NotificationsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 p-4 rounded-xl bg-white/5 animate-pulse"
        >
          <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-white/10 rounded w-1/5" />
            <div className="h-3.5 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/3" />
          </div>
          <div className="h-3 bg-white/10 rounded w-10 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}