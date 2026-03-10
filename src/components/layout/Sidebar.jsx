import { Link, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse, faGaugeHigh, faUser, faMagnifyingGlass, faUsers,
  faPlugCircleBolt, faMessage, faArrowTrendUp,
  faWallet, faGear, faRightFromBracket, faShield,
  faLayerGroup, faChartLine, faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/useThemeStore";

const creatorLinks = [
  { path: "/",            icon: faHouse,           label: "Home",             color: "#22c55e"  },
  { path: "/dashboard",   icon: faGaugeHigh,       label: "Dashboard",        color: "#3b82f6"  },
  { path: "/profile",     icon: faUser,            label: "My Profile",       color: "#a855f7"  },
  { path: "/browse",      icon: faMagnifyingGlass, label: "Browse Creators",  color: "#14b8a6"  },
  { path: "/investors",   icon: faUsers,           label: "Browse Investors", color: "#f59e0b"  },
  { path: "/syndicates",  icon: faLayerGroup,      label: "Syndicates",       color: "#3b82f6"  },
  { path: "/connections", icon: faPlugCircleBolt,  label: "Connections",      color: "#f43f5e"  },
  { path: "/messages",    icon: faMessage,         label: "Messages",         color: "#22c55e"  },
  { path: "/investments", icon: faArrowTrendUp,    label: "Investments",      color: "#22c55e"  },
  { path: "/earnings",    icon: faChartLine,       label: "My Earnings",      color: "#0ea5e9"  },
  { path: "/withdraw",    icon: faWallet,          label: "Withdraw",         color: "#a855f7"  },
  { path: "/disputes",    icon: faScaleBalanced,   label: "Disputes",         color: "#f97316"  },
  { path: "/settings",    icon: faGear,            label: "Settings",         color: "#6b7280"  },
  { path: "/kyc",         icon: faShield,          label: "Verify Identity",  color: "#14b8a6"  },
];

const investorLinks = [
  { path: "/",            icon: faHouse,           label: "Home",             color: "#22c55e"  },
  { path: "/dashboard",   icon: faGaugeHigh,       label: "Dashboard",        color: "#3b82f6"  },
  { path: "/profile",     icon: faUser,            label: "My Profile",       color: "#a855f7"  },
  { path: "/browse",      icon: faMagnifyingGlass, label: "Browse Creators",  color: "#14b8a6"  },
  { path: "/investors",   icon: faUsers,           label: "Browse Investors", color: "#f59e0b"  },
  { path: "/syndicates",  icon: faLayerGroup,      label: "Syndicates",       color: "#3b82f6"  },
  { path: "/connections", icon: faPlugCircleBolt,  label: "Connections",      color: "#f43f5e"  },
  { path: "/messages",    icon: faMessage,         label: "Messages",         color: "#22c55e"  },
  { path: "/portfolio",   icon: faArrowTrendUp,    label: "Portfolio",        color: "#22c55e"  },
  { path: "/withdraw",    icon: faWallet,          label: "Withdraw",         color: "#a855f7"  },
  { path: "/disputes",    icon: faScaleBalanced,   label: "Disputes",         color: "#f97316"  },
  { path: "/settings",    icon: faGear,            label: "Settings",         color: "#6b7280"  },
  { path: "/kyc",         icon: faShield,          label: "Verify Identity",  color: "#14b8a6"  },
];

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  const isLight = theme === "light";
  const t = {
    bg:            isLight ? "#ffffff"              : "#040806",
    border:        isLight ? "#cce8d0"              : "rgba(255,255,255,0.1)",
    cardBg:        isLight ? "#f4faf5"              : "#0a1209",
    textMeta:      isLight ? "#4b5563"              : "#9ca3af",
    textName:      isLight ? "#0a1a0c"              : "#f1f5f9",
    textEmail:     isLight ? "#6b7280"              : "#9ca3af",
    linkInactive:  isLight ? "#6b7280"              : "#9ca3af",
    linkHoverBg:   isLight ? "rgba(22,163,74,0.06)" : "rgba(255,255,255,0.06)",
    linkHoverTxt:  isLight ? "#0a1a0c"              : "#f1f5f9",
    logoutHoverBg: isLight ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.08)",
  };

  const links = user?.role === "investor" ? investorLinks : creatorLinks;

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
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Syne:wght@600;700&display=swap');
        .sb-scroll::-webkit-scrollbar { display: none; }
        .sb-scroll { scrollbar-width: none; }
        @media (min-width: 1024px) {
          .sf-sidebar { transform: translateX(0) !important; }
        }
      `}</style>

      {/* Logo */}
      <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)" }}>
            <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "12px", color: "#000" }} />
          </div>
          <h1 className="text-xl font-black" style={{
            fontFamily: "'Fraunces', serif",
            background: "linear-gradient(135deg,#22c55e,#4ade80)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            SkillFund
          </h1>
        </div>
        <p className="text-xs capitalize" style={{
          color: t.textMeta, fontFamily: "'Syne',sans-serif", fontWeight: 700, paddingLeft: "2px",
        }}>
          {user?.role} · {user?.plan} plan
        </p>
      </div>

      {/* Navigation */}
      <nav className="sb-scroll flex-1 p-3 overflow-y-auto">
        <div className="space-y-0.5">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path + link.label}
                to={link.path}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                style={{
                  background:  isActive ? `${link.color}18` : "transparent",
                  border:      isActive ? `1px solid ${link.color}35` : "1px solid transparent",
                  color:       isActive ? link.color : t.linkInactive,
                  fontFamily:  "'Syne', sans-serif",
                  fontWeight:  600,
                  fontSize:    "13px",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color      = t.linkHoverTxt;
                    e.currentTarget.style.background = t.linkHoverBg;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color      = t.linkInactive;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? `${link.color}20` : "transparent" }}>
                  <FontAwesomeIcon
                    icon={link.icon}
                    style={{ fontSize: "12px", color: isActive ? link.color : t.linkInactive }}
                  />
                </div>
                <span>{link.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: link.color }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User card + logout */}
      <div className="p-3" style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="flex items-center gap-3 mb-2 p-3 rounded-xl"
          style={{ background: t.cardBg, border: `1px solid ${t.border}` }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}>
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ fontFamily: "'Syne',sans-serif", color: t.textName }}>
              {user?.name}
            </p>
            <p className="text-xs truncate" style={{ color: t.textEmail }}>{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full"
          style={{ color: t.linkInactive, fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: "13px" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = t.logoutHoverBg; }}
          onMouseLeave={e => { e.currentTarget.style.color = t.linkInactive; e.currentTarget.style.background = "transparent"; }}
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
