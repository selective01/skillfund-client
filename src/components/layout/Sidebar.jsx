import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse, faGaugeHigh, faUser, faMagnifyingGlass, faUsers,
  faPlugCircleBolt, faMessage, faArrowTrendUp, faWallet, faGear,
  faRightFromBracket, faShield, faLayerGroup, faChartLine,
  faScaleBalanced, faMicrophone, faGift, faBullhorn, faShieldHalved,
  faChevronDown, faChevronRight, faCircleQuestion, faHeadset,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/useThemeStore";
import useNotificationStore from "../../store/notificationStore";

// ─── Flat links (always visible) ─────────────────────────────────────────────
const CREATOR_TOP = [
  { path: "/",             icon: faHouse,         label: "Home",        color: "#22c55e" },
  { path: "/dashboard",    icon: faGaugeHigh,     label: "Dashboard",   color: "#3b82f6" },
  { path: "/profile",      icon: faUser,          label: "My Profile",  color: "#a855f7" },
  { path: "/connections",  icon: faPlugCircleBolt,label: "Connections", color: "#f43f5e" },
  { path: "/messages",     icon: faMessage,       label: "Messages",    color: "#22c55e" },
  { path: "/campaign/setup",icon: faBullhorn,     label: "My Campaign", color: "#22c55e" },
  { path: "/referrals",    icon: faGift,          label: "Referrals",   color: "#f59e0b" },
  { path: "/settings",     icon: faGear,          label: "Settings",    color: "#6b7280" },
];

const INVESTOR_TOP = [
  { path: "/",            icon: faHouse,         label: "Home",        color: "#22c55e" },
  { path: "/dashboard",   icon: faGaugeHigh,     label: "Dashboard",   color: "#3b82f6" },
  { path: "/profile",     icon: faUser,          label: "My Profile",  color: "#a855f7" },
  { path: "/connections", icon: faPlugCircleBolt,label: "Connections", color: "#f43f5e" },
  { path: "/messages",    icon: faMessage,       label: "Messages",    color: "#22c55e" },
  { path: "/referrals",   icon: faGift,          label: "Referrals",   color: "#f59e0b" },
  { path: "/settings",    icon: faGear,          label: "Settings",    color: "#6b7280" },
];

// ─── Collapsible groups ───────────────────────────────────────────────────────
const CREATOR_GROUPS = [
  {
    id: "discover",
    label: "Discover",
    icon: faMagnifyingGlass,
    color: "#14b8a6",
    links: [
      { path: "/browse",     icon: faMagnifyingGlass, label: "Browse Creators",  color: "#14b8a6" },
      { path: "/investors",  icon: faUsers,           label: "Browse Investors", color: "#f59e0b" },
      { path: "/syndicates", icon: faLayerGroup,      label: "Syndicates",       color: "#3b82f6" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: faWallet,
    color: "#a855f7",
    links: [
      { path: "/investments", icon: faArrowTrendUp, label: "Investments", color: "#22c55e" },
      { path: "/earnings",    icon: faChartLine,    label: "My Earnings", color: "#0ea5e9" },
      { path: "/withdraw",    icon: faWallet,       label: "Withdraw",    color: "#a855f7" },
    ],
  },
  {
    id: "verification",
    label: "Verification",
    icon: faShield,
    color: "#14b8a6",
    links: [
      { path: "/kyc",          icon: faShield,       label: "Verify Identity",    color: "#14b8a6" },
      { path: "/trust",        icon: faShieldHalved, label: "Trust Verification", color: "#14b8a6" },
      { path: "/voice-verify", icon: faMicrophone,   label: "Voice Verify",       color: "#3b82f6" },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: faHeadset,
    color: "#f97316",
    links: [
      { path: "/disputes", icon: faScaleBalanced,  label: "Disputes", color: "#f97316" },
      { path: "/help",     icon: faCircleQuestion, label: "Help",     color: "#3b82f6" },
    ],
  },
];

const INVESTOR_GROUPS = [
  {
    id: "discover",
    label: "Discover",
    icon: faMagnifyingGlass,
    color: "#14b8a6",
    links: [
      { path: "/browse",     icon: faMagnifyingGlass, label: "Browse Creators",  color: "#14b8a6" },
      { path: "/investors",  icon: faUsers,           label: "Browse Investors", color: "#f59e0b" },
      { path: "/syndicates", icon: faLayerGroup,      label: "Syndicates",       color: "#3b82f6" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: faWallet,
    color: "#a855f7",
    links: [
      { path: "/portfolio", icon: faArrowTrendUp, label: "Portfolio", color: "#22c55e" },
      { path: "/withdraw",  icon: faWallet,       label: "Withdraw",  color: "#a855f7" },
    ],
  },
  {
    id: "verification",
    label: "Verification",
    icon: faShield,
    color: "#14b8a6",
    links: [
      { path: "/kyc", icon: faShield, label: "Verify Identity", color: "#14b8a6" },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: faHeadset,
    color: "#f97316",
    links: [
      { path: "/disputes", icon: faScaleBalanced,  label: "Disputes", color: "#f97316" },
      { path: "/help",     icon: faCircleQuestion, label: "Help",     color: "#3b82f6" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function countUnreadByPath(notifications = [], path) {
  if (path === "/") return 0;
  return notifications.filter(
    (n) => !n.isRead && typeof n.link === "string" && n.link.startsWith(path)
  ).length;
}

// ─── Single nav link ──────────────────────────────────────────────────────────
function NavLink({ link, t, notifications, markNotificationsReadByPrefix, onClose, indented = false }) {
  const location = useLocation();
  const isActive = location.pathname === link.path ||
    (link.path !== "/" && location.pathname.startsWith(link.path));
  const unreadCount = countUnreadByPath(notifications, link.path);

  return (
    <Link
      to={link.path}
      onClick={async () => {
        if (unreadCount > 0) await markNotificationsReadByPrefix(link.path);
        onClose();
      }}
      className="flex items-center gap-3 rounded-xl transition-all duration-150"
      style={{
        padding: indented ? "8px 12px 8px 36px" : "10px 12px",
        background: isActive ? `${link.color}18` : "transparent",
        border: isActive ? `1px solid ${link.color}35` : "1px solid transparent",
        color: isActive ? link.color : t.linkInactive,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 600,
        fontSize: "13px",
        textDecoration: "none",
        display: "flex",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = t.linkHoverTxt;
          e.currentTarget.style.background = t.linkHoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = t.linkInactive;
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      <div
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: isActive ? `${link.color}20` : "transparent" }}
      >
        <FontAwesomeIcon
          icon={link.icon}
          style={{ fontSize: "12px", color: isActive ? link.color : t.linkInactive }}
        />
      </div>
      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {link.label}
      </span>
      {unreadCount > 0 && (
        <span
          className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: t.badgeBg, color: t.badgeText }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      {isActive && unreadCount === 0 && (
        <div
          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: link.color }}
        />
      )}
    </Link>
  );
}

// ─── Collapsible group ────────────────────────────────────────────────────────
function NavGroup({ group, t, notifications, markNotificationsReadByPrefix, onClose }) {
  const location = useLocation();
  const hasActive = group.links.some(
    l => location.pathname === l.path ||
      (l.path !== "/" && location.pathname.startsWith(l.path))
  );
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
          padding: "10px 12px",
          borderRadius: "12px",
          background: hasActive ? `${group.color}10` : "transparent",
          border: "1px solid transparent",
          color: hasActive ? group.color : t.linkInactive,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: "12px",
          cursor: "pointer",
          textAlign: "left",
          transition: "all .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = t.linkHoverBg;
          e.currentTarget.style.color = t.linkHoverTxt;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = hasActive ? `${group.color}10` : "transparent";
          e.currentTarget.style.color = hasActive ? group.color : t.linkInactive;
        }}
      >
        <div
          style={{
            width: "24px", height: "24px", borderRadius: "8px", flexShrink: 0,
            background: hasActive ? `${group.color}20` : "rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <FontAwesomeIcon
            icon={group.icon}
            style={{ fontSize: "11px", color: hasActive ? group.color : t.linkInactive }}
          />
        </div>
        <span style={{ flex: 1, letterSpacing: ".03em", textTransform: "uppercase", fontSize: "11px" }}>
          {group.label}
        </span>
        <FontAwesomeIcon
          icon={open ? faChevronDown : faChevronRight}
          style={{ fontSize: "10px", color: t.linkInactive, transition: "transform .2s" }}
        />
      </button>

      {open && (
        <div style={{ marginTop: "2px", display: "flex", flexDirection: "column", gap: "2px" }}>
          {group.links.map(link => (
            <NavLink
              key={link.path}
              link={link}
              t={t}
              notifications={notifications}
              markNotificationsReadByPrefix={markNotificationsReadByPrefix}
              onClose={onClose}
              indented
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const theme   = useThemeStore((s) => s.theme);
  const notifications                 = useNotificationStore((s) => s.notifications);
  const markNotificationsReadByPrefix = useNotificationStore((s) => s.markNotificationsReadByPrefix);

  const isLight = theme === "light";

  const t = {
    bg:            isLight ? "#ffffff"               : "#040806",
    border:        isLight ? "#cce8d0"               : "rgba(255,255,255,0.1)",
    cardBg:        isLight ? "#f4faf5"               : "#0a1209",
    textMeta:      isLight ? "#4b5563"               : "#9ca3af",
    textName:      isLight ? "#0a1a0c"               : "#f1f5f9",
    textEmail:     isLight ? "#6b7280"               : "#9ca3af",
    linkInactive:  isLight ? "#6b7280"               : "#9ca3af",
    linkHoverBg:   isLight ? "rgba(22,163,74,0.06)"  : "rgba(255,255,255,0.06)",
    linkHoverTxt:  isLight ? "#0a1a0c"               : "#f1f5f9",
    logoutHoverBg: isLight ? "rgba(239,68,68,0.05)"  : "rgba(239,68,68,0.08)",
    badgeBg:       isLight ? "#dcfce7"               : "rgba(34,197,94,0.16)",
    badgeText:     isLight ? "#166534"               : "#86efac",
    divider:       isLight ? "rgba(0,0,0,0.06)"      : "rgba(255,255,255,0.05)",
  };

  const isInvestor = user?.role === "investor";
  const topLinks   = isInvestor ? INVESTOR_TOP    : CREATOR_TOP;
  const groups     = isInvestor ? INVESTOR_GROUPS : CREATOR_GROUPS;

  const sharedProps = { t, notifications, markNotificationsReadByPrefix, onClose };

  // Split top links: first 5 above groups, rest below


  return (
    <div
      className="sf-sidebar fixed left-0 top-0 h-full w-64 flex flex-col z-50"
      style={{
        background: t.bg,
        borderRight: `1px solid ${t.border}`,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        .sb-scroll::-webkit-scrollbar { display: none; }
        .sb-scroll { scrollbar-width: none; }
        @media (min-width: 1024px) {
          .sf-sidebar { transform: translateX(0) !important; }
        }
      `}</style>

      {/* Logo */}
      <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}
          >
            <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "12px", color: "#000" }} />
          </div>
          <h1
            className="text-xl font-black"
            style={{
              fontFamily: "'Fraunces', serif",
              background: "linear-gradient(135deg,#22c55e,#4ade80)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SkillFund
          </h1>
        </div>
        <p
          className="text-xs capitalize"
          style={{
            color: t.textMeta,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            paddingLeft: "2px",
          }}
        >
          {user?.role} · {user?.plan} plan
        </p>
      </div>

      {/* Nav */}
      <nav className="sb-scroll flex-1 p-3 overflow-y-auto">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>

          {/* Top flat links above Discover (Home, Dashboard, Profile) */}
          {topLinks.slice(0, 3).map(link => (
            <NavLink key={link.path + link.label} link={link} {...sharedProps} />
          ))}

          {/* ── Discover ── */}
          <div style={{ height: "1px", background: t.divider, margin: "6px 0" }} />
          <NavGroup group={groups.find(g => g.id === "discover")} {...sharedProps} />

          {/* Connections + Messages (flat links, now below Discover) */}
          <div style={{ height: "1px", background: t.divider, margin: "6px 0" }} />
          {topLinks.slice(3, 5).map(link => (
            <NavLink key={link.path + link.label} link={link} {...sharedProps} />
          ))}

          {/* ── Finance ── */}
          <div style={{ height: "1px", background: t.divider, margin: "6px 0" }} />
          <NavGroup group={groups.find(g => g.id === "finance")} {...sharedProps} />

          {/* ── Verification ── */}
          <div style={{ height: "1px", background: t.divider, margin: "6px 0" }} />
          <NavGroup group={groups.find(g => g.id === "verification")} {...sharedProps} />

          {/* Bottom flat links (Campaign, Referrals, Settings) */}
          <div style={{ height: "1px", background: t.divider, margin: "6px 0" }} />
          {topLinks.slice(5).map(link => (
            <NavLink key={link.path + link.label} link={link} {...sharedProps} />
          ))}

          {/* ── Support (last) ── */}
          <div style={{ height: "1px", background: t.divider, margin: "6px 0" }} />
          <NavGroup group={groups.find(g => g.id === "support")} {...sharedProps} />

        </div>
      </nav>

      {/* User card + Logout */}
      <div className="p-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <div
          className="flex items-center gap-3 mb-2 p-3 rounded-xl"
          style={{ background: t.cardBg, border: `1px solid ${t.border}` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-bold truncate"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: t.textName }}
            >
              {user?.name}
            </p>
            <p className="text-xs truncate" style={{ color: t.textEmail }}>
              {user?.email}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full"
          style={{
            color: t.linkInactive,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: "13px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = t.logoutHoverBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = t.linkInactive;
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: "12px" }} />
          </div>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
