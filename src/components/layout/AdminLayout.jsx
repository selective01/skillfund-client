import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge, faUsers, faShieldHalved, faWallet, faTriangleExclamation, faFlag,
  faReceipt, faBars, faXmark,
  faArrowRightFromBracket, faBell, faMagnifyingGlass,
  faArrowTrendUp, faChevronDown, faCheck, faTrash, faChartLine,
  faPhone, faBuilding, faMicrophone,
} from "@fortawesome/free-solid-svg-icons";
import useAdminAuthStore from "../../store/useAdminAuthStore";

// Must match useAdminAuthStore — VITE_API_URL already ends with /api, no extra /api here
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const NAV_SECTIONS = [
  {
    label: "Overview",
    links: [
      { path: "/admin/dashboard", icon: faGauge, label: "Dashboard", color: "#6366f1" },
    ],
  },
  {
    label: "Main",
    links: [
      { path: "/admin/users",         icon: faUsers,        label: "Users", color: "#6366f1" },
      { path: "/admin/verifications", icon: faShieldHalved, label: "KYC",   color: "#14b8a6" },
    ],
  },
  {
    label: "Finance",
    links: [
      { path: "/admin/withdrawals",  icon: faWallet,     label: "Withdrawals",  color: "#8b5cf6" },
      { path: "/admin/transactions", icon: faReceipt,    label: "Transactions", color: "#f59e0b" },
      { path: "/admin/revenue",      icon: faChartLine,  label: "Revenue",      color: "#16a34a" },
    ],
  },
  {
    label: "Trust",
    links: [
      { path: "/admin/voice",      icon: faMicrophone, label: "Voice Calls",  color: "#6366f1" },
      { path: "/admin/assets",     icon: faBuilding,   label: "Assets",       color: "#f59e0b" },
      { path: "/admin/guarantors", icon: faPhone,      label: "Guarantors",   color: "#16a34a" },
    ],
  },
  {
    label: "Support",
    links: [
      { path: "/admin/disputes", icon: faTriangleExclamation, label: "Disputes", color: "#f43f5e" },
      { path: "/admin/reports",  icon: faFlag,                label: "Reports",  color: "#f97316" },
    ],
  },
];

const ALL_LINKS = NAV_SECTIONS.flatMap(s => s.links);

export default function AdminLayout({ children, title = "Dashboard" }) {
  const { adminUser, adminToken, logout } = useAdminAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [bellOpen,      setBellOpen]      = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const bellRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await axios.get(
        `${BASE}/admin/notifications?limit=20`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  }, [adminToken]);

  // Poll every 30 seconds — defer first call to avoid synchronous setState in effect body
  useEffect(() => {
    if (!adminToken) return;
    const initial = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 30000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [adminToken, fetchNotifications]);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.put(
        `${BASE}/admin/notifications/read`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(
        `${BASE}/admin/notifications/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleNotificationClick = async (notif) => {
    // Mark this one read locally (backend only supports mark-all)
    if (!notif.isRead) {
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setBellOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const activeLink = ALL_LINKS.find(l => l.path === location.pathname);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 flex-shrink-0" style={{ borderBottom: "1px solid #eef0f4" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
          <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "13px", color: "#fff" }} />
        </div>
        <div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "16px", color: "#0f172a" }}>SkillFund</span>
          <span className="ml-2 text-xs font-black px-1.5 py-0.5 rounded-md" style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe", fontSize: "9px", letterSpacing: ".05em" }}>ADMIN</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <p className="px-3 mb-1.5" style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "10px", color: "#9ea3ae", textTransform: "uppercase", letterSpacing: ".08em" }}>
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.links.map(link => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all"
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      fontSize: "13px",
                      background: isActive ? `${link.color}10` : "transparent",
                      color: isActive ? link.color : "#64748b",
                      border: `1px solid ${isActive ? link.color + "25" : "transparent"}`,
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isActive ? `${link.color}15` : "#f8fafc", border: `1px solid ${isActive ? link.color + "20" : "#e2e8f0"}` }}>
                      <FontAwesomeIcon icon={link.icon} style={{ fontSize: "12px", color: isActive ? link.color : "#94a3b8" }} />
                    </div>
                    {link.label}
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: link.color }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card at bottom */}
      <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid #eef0f4" }}>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid #eef0f4" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", color: "#fff" }}>
            {adminUser?.avatar
              ? <img src={adminUser.avatar} alt="avatar" className="w-full h-full object-cover" />
              : adminUser?.name?.charAt(0).toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold truncate" style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "12px", color: "#1a1d23" }}>{adminUser?.name ?? "Admin"}</p>
            <p className="truncate" style={{ fontFamily: "'Inter',sans-serif", fontSize: "11px", color: "#9ea3ae" }}>{adminUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{ color: "#f43f5e", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} style={{ fontSize: "11px" }} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "#f5f6fa", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .adm-sb-link:hover { background: #f1f5f9 !important; color: #0f172a !important; }
        .adm-overlay { animation: admFade .2s ease; }
        @keyframes admFade { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* ── Desktop Sidebar (permanent) ── */}
      <aside className="hidden lg:flex flex-col w-60 fixed top-0 left-0 bottom-0 z-30" style={{ background: "#ffffff", borderRight: "1px solid #e2e8f0" }}>
        {sidebarContent}
      </aside>

      {/* ── Mobile Sidebar overlay ── */}
      {sidebarOpen && (
        <>
          <div className="adm-overlay fixed inset-0 z-40 lg:hidden" style={{ background: "rgba(15,23,42,0.25)", backdropFilter: "blur(2px)" }} onClick={() => setSidebarOpen(false)} />
          <aside className="fixed top-0 left-0 bottom-0 z-50 w-60 lg:hidden" style={{ background: "#ffffff", borderRight: "1px solid #e2e8f0", boxShadow: "4px 0 24px rgba(0,0,0,0.08)" }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col lg:ml-60 min-h-screen">

        {/* Top navbar */}
        <header className="sticky top-0 z-20 flex items-center h-16 px-6 gap-4" style={{ background: "#ffffff", borderBottom: "1px solid #eef0f4", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>

          {/* Hamburger (mobile) */}
          <button
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            onClick={() => setSidebarOpen(v => !v)}
            style={{ background: "#ffffff", border: "1px solid #eef0f4", color: "#64748b", cursor: "pointer" }}
          >
            <FontAwesomeIcon icon={sidebarOpen ? faXmark : faBars} style={{ fontSize: "13px" }} />
          </button>

          {/* Page title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {activeLink && (
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${activeLink.color}12`, border: `1px solid ${activeLink.color}25` }}>
                  <FontAwesomeIcon icon={activeLink.icon} style={{ fontSize: "11px", color: activeLink.color }} />
                </div>
              )}
              <h1 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "15px", color: "#1a1d23", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</h1>
            </div>
            {/* Breadcrumb */}
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "11px", color: "#9ea3ae", marginTop: "1px" }}>
              Admin Portal <span style={{ margin: "0 4px", color: "#cbd5e1" }}>/</span> {title}
            </p>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#ffffff", border: "1px solid #eef0f4", minWidth: "200px" }}>
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: "12px", color: "#94a3b8", flexShrink: 0 }} />
            <input
              placeholder="Search..."
              style={{ border: "none", outline: "none", background: "transparent", fontFamily: "'Inter',sans-serif", fontSize: "13px", color: "#1a1d23", width: "100%" }}
            />
          </div>

          {/* Bell + notification dropdown */}
          <div ref={bellRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              onClick={() => { setBellOpen(v => !v); if (!bellOpen) fetchNotifications(); }}
              style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff", border: "1px solid #eef0f4", color: "#64748b", cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <FontAwesomeIcon icon={faBell} style={{ fontSize: "14px" }} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: "5px", right: "5px", width: "8px", height: "8px", borderRadius: "50%", background: "#f43f5e", border: "2px solid #fff" }} />
              )}
            </button>

            {bellOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: "340px", background: "#fff", border: "1px solid #eef0f4", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 200, overflow: "hidden" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "13px", color: "#1a1d23", margin: 0 }}>Notifications</p>
                    {unreadCount > 0 && (
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "10px", fontWeight: 700, background: "#f43f5e", color: "#fff", borderRadius: "20px", padding: "2px 7px" }}>{unreadCount}</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ fontFamily: "'Inter',sans-serif", fontSize: "11px", fontWeight: 600, color: "#6366f1", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <FontAwesomeIcon icon={faCheck} style={{ fontSize: "10px" }} /> Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 16px" }}>
                      <FontAwesomeIcon icon={faBell} style={{ fontSize: "24px", color: "#d1d5db", marginBottom: "8px" }} />
                      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "12px", color: "#9ea3ae", margin: 0 }}>No notifications yet</p>
                    </div>
                  ) : notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => handleNotificationClick(n)}
                      style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "12px 16px", borderBottom: "1px solid #f8fafc", cursor: "pointer", background: n.isRead ? "transparent" : "#fafbff", transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f5f6fa"}
                      onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "transparent" : "#fafbff"}
                    >
                      {/* Unread dot */}
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: n.isRead ? "transparent" : "#6366f1", flexShrink: 0, marginTop: "5px" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "12px", fontWeight: 600, color: "#1a1d23", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "11px", color: "#64748b", margin: "0 0 3px", lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "10px", color: "#9ea3ae", margin: 0 }}>
                          {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteNotification(n._id, e)}
                        style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", padding: "2px", flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"}
                        onMouseLeave={e => e.currentTarget.style.color = "#d1d5db"}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: "10px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-3 py-1 rounded-xl transition-all"
              style={{ background: userMenuOpen ? "#f1f5f9" : "transparent", border: "1px solid transparent", cursor: "pointer" }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)", color: "#fff" }}>
                {adminUser?.avatar
                  ? <img src={adminUser.avatar} alt="avatar" className="w-full h-full object-cover" />
                  : adminUser?.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <div className="hidden sm:block text-left">
                <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "12px", color: "#1a1d23", lineHeight: 1.2 }}>{adminUser?.name?.split(" ")[0] ?? "Admin"}</p>
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "10px", color: "#9ea3ae", lineHeight: 1 }}>Administrator</p>
              </div>
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: "10px", color: "#94a3b8", marginLeft: "2px", transition: "transform .15s", transform: userMenuOpen ? "rotate(180deg)" : "none" }} />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl z-20 overflow-hidden" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
                  <div className="p-3" style={{ borderBottom: "1px solid #eef0f4" }}>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "12px", color: "#1a1d23" }}>{adminUser?.name}</p>
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "11px", color: "#9ea3ae" }}>{adminUser?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={handleLogout}
                      className="adm-sb-link w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                      style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "12px", color: "#f43f5e", background: "transparent", border: "none", cursor: "pointer", width: "100%" }}
                    >
                      <FontAwesomeIcon icon={faArrowRightFromBracket} style={{ fontSize: "12px" }} />
                      Log out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
