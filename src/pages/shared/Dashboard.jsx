import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/useThemeStore";
import api from "../../utils/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp, faUsers, faWallet, faHeartPulse,
  faArrowRight, faCircleCheck, faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";

function useT() {
  const _t = useThemeStore((s) => s.theme);
  const L = _t === "light";
  return {
    card:       L ? "#ffffff"              : "#070d08",
    cardAlt:    L ? "#f0fdf4"              : "#0a1209",
    cardBorder: L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
    input:      L ? "#edf7ef"              : "#0a1209",
    border:     L ? "rgba(34,197,94,0.2)"  : "rgba(255,255,255,0.08)",
    text:       L ? "#0a1a0c"              : "#f1f5f9",
    muted:      L ? "#4b5563"              : "#9ca3af",
    dim:        L ? "#6b7280"              : "#4b5563",
    heroGrad:   L ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)" : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)",
    heroBorder: L ? "rgba(34,197,94,0.2)"  : "rgba(34,197,94,0.25)",
    shadow:     L ? "0 1px 4px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.3)",
  };
}

function StatCard({ label, value, icon, colorClass, loading }) {
  const T = useT();
  const colorMap = {
    green:  { text: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.30)",  card: "var(--card-green)" },
    blue:   { text: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.30)", card: "var(--card-blue)" },
    purple: { text: "#a855f7", bg: "rgba(168,85,247,0.1)",  border: "rgba(168,85,247,0.30)", card: "var(--card-purple)" },
    amber:  { text: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.30)", card: "var(--card-amber)" },
  };
  const c = colorMap[colorClass] || colorMap.green;
  if (loading) {
    return (
      <div className="rounded-2xl p-4 animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="h-3 rounded-full w-1/2 mb-5" style={{ background: "var(--border)" }} />
        <div className="h-8 rounded-full w-1/3" style={{ background: "var(--border)" }} />
      </div>
    );
  }
  return (
    <div className="group rounded-2xl p-4 transition-all duration-200 cursor-default" style={{ background: c.card, border: `1px solid ${c.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-dim)" }}>{label.toUpperCase()}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: c.bg }}>
          <FontAwesomeIcon icon={icon} style={{ color: c.text, fontSize: "13px" }} />
        </div>
      </div>
      <p className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.6rem", lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function QuickAction({ emoji, label, description, path }) {
  return (
    <Link
      to={path}
      className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,197,94,0.35)"; e.currentTarget.style.background = "var(--bg-input)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-card)"; }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.28)" }}>{emoji}</div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{label}</p>
        {description && <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-dim)" }}>{description}</p>}
      </div>
      <FontAwesomeIcon icon={faArrowRight} className="flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: "var(--text-ghost)", fontSize: "13px" }} />
    </Link>
  );
}

function StatusItem({ label, value, last }) {
  const T = useT();
  return (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.2)" }}>
      <span className="text-sm" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <div className="flex items-center gap-1.5">
        {value
          ? <><FontAwesomeIcon icon={faCircleCheck} style={{ color: "#22c55e", fontSize: "13px" }} /><span className="text-xs font-bold" style={{ color: "#22c55e", fontFamily: "'Syne', sans-serif" }}>Verified</span></>
          : <><FontAwesomeIcon icon={faCircleXmark} style={{ color: "#ef4444", fontSize: "13px" }} /><span className="text-xs font-bold" style={{ color: "#ef4444", fontFamily: "'Syne', sans-serif" }}>Pending</span></>
        }
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === "admin") {
          const res = await api.get("/admin/analytics");
          setStats(res.data.analytics);
        } else {
          const res = await api.get("/investments/my-investments");
          const invs = res.data.investments || [];
          // Compute summary directly from investments array
          setStats({
            totalInvested:        invs.reduce((s, i) => s + (i.amount || 0), 0),
            activeInvestments:    invs.filter(i => i.status === "active").length,
            totalReturns:         invs.reduce((s, i) => s + (i.totalPaidToInvestor || 0), 0),
            completedInvestments: invs.filter(i => i.status === "completed").length,
          });
        }
      } catch {
        console.error("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const creatorStats = [
    { label: "Total Raised",       value: `$${stats?.totalInvested || 0}`,        icon: faWallet,       colorClass: "green"  },
    { label: "Active Investments", value: stats?.activeInvestments || 0,           icon: faHeartPulse,   colorClass: "blue"   },
    { label: "Total Returns",      value: `$${stats?.totalReturns || 0}`,          icon: faArrowTrendUp, colorClass: "purple" },
    { label: "Completed",          value: stats?.completedInvestments || 0,        icon: faUsers,        colorClass: "amber"  },
  ];

  const adminStats = [
    { label: "Total Users",         value: stats?.users?.total || 0,                     icon: faUsers,        colorClass: "green"  },
    { label: "Active Investments",  value: stats?.investments?.active || 0,              icon: faHeartPulse,   colorClass: "blue"   },
    { label: "Total Invested",      value: `$${stats?.investments?.totalInvested || 0}`, icon: faArrowTrendUp, colorClass: "purple" },
    { label: "Pending Withdrawals", value: stats?.pending?.withdrawals || 0,             icon: faWallet,       colorClass: "amber"  },
  ];

  const displayStats = user?.role === "admin" ? adminStats : creatorStats;

  const quickActions = {
    creator: [
      { emoji: "📸", label: "Upload Portfolio",  path: "/profile",   description: "Add work samples to attract investors" },
      { emoji: "💬", label: "View Messages",      path: "/messages",  description: "Respond to investor inquiries" },
      { emoji: "💰", label: "Report Earnings",    path: "/earnings",  description: "Submit your monthly income report" },
      { emoji: "🏦", label: "Withdraw Funds",     path: "/withdraw",  description: "Cash out your earnings" },
    ],
    investor: [
      { emoji: "🔍", label: "Browse Creators",    path: "/browse",    description: "Discover new investment opportunities" },
      { emoji: "💬", label: "View Messages",       path: "/messages",  description: "Chat with your funded creators" },
      { emoji: "📈", label: "View Portfolio",      path: "/portfolio", description: "Track your active investments" },
      { emoji: "🏦", label: "Withdraw Funds",      path: "/withdraw",  description: "Cash out your earnings" },
    ],
    admin: [
      { emoji: "👥", label: "Manage Users",           path: "/admin/users",         description: "View and moderate all accounts" },
      { emoji: "✅", label: "Review Verifications",    path: "/admin/verifications", description: "Approve pending ID submissions" },
      { emoji: "💸", label: "Approve Withdrawals",     path: "/admin/withdrawals",   description: "Process pending payout requests" },
      { emoji: "⚖️", label: "Resolve Disputes",        path: "/admin/disputes",      description: "Mediate investor-creator conflicts" },
    ],
  };

  const actions = quickActions[user?.role] || [];

  const verifications = [
    { label: "Email Verified",   value: user?.emailVerified },
    { label: "Phone Verified",   value: user?.phoneVerified },
    { label: "ID Verified",      value: user?.idVerified    },
    { label: "Profile Verified", value: user?.isVerified    },
  ];
  const verifiedCount = verifications.filter(v => v.value).length;
  const verifiedPct   = Math.round((verifiedCount / verifications.length) * 100);

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes dashSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .dash-in { animation: dashSlideUp 0.5s ease forwards; }
        .d1{animation-delay:.05s;opacity:0} .d2{animation-delay:.1s;opacity:0}
        .d3{animation-delay:.15s;opacity:0} .d4{animation-delay:.2s;opacity:0}
        .d5{animation-delay:.25s;opacity:0} .d6{animation-delay:.3s;opacity:0}
      `}</style>

      {/* Welcome Banner */}
      <div className="dash-in d1 rounded-3xl p-6 mb-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, var(--card-green-start,#0f2e10) 0%, var(--card-green-mid,#071a0b) 60%, var(--bg,#040d06) 100%)", border: "1px solid rgba(34,197,94,0.35)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
        <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)", filter: "blur(20px)" }} />
        <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-xs font-bold tracking-widest text-[#22c55e]" style={{ fontFamily: "'Syne', sans-serif" }}>{user?.role?.toUpperCase()} DASHBOARD</span>
            </div>
            <h2 className="font-black text-white mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}>Welcome back, {user?.name} 👋</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              You're on the <span className="font-bold capitalize" style={{ color: "#22c55e" }}>{user?.plan}</span> plan
              {user?.plan === "basic" && <> · <span style={{ color: "#f59e0b" }}>Upgrade to unlock more features</span></>}
            </p>
          </div>
          {user?.plan === "basic" && (
            <Link to="/settings" className="flex-shrink-0 flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-105" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(34,197,94,0.30)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}>
              Upgrade Plan <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} />
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {displayStats.map((stat, i) => (
          <div key={i} className={`dash-in d${i + 2}`}>
            <StatCard {...stat} loading={loading} />
          </div>
        ))}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dash-in d5 rounded-3xl p-6" style={{ background: "linear-gradient(145deg,var(--bg-card),var(--bg))", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #22c55e, #16a34a)" }} />
            <h3 className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem" }}>Quick Actions</h3>
          </div>
          <div className="space-y-3">
            {actions.map((action, i) => <QuickAction key={i} {...action} />)}
          </div>
        </div>

        <div className="dash-in d6 rounded-3xl p-6" style={{ background: "linear-gradient(145deg,var(--bg-card),var(--bg))", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #22c55e, #16a34a)" }} />
            <h3 className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.1rem" }}>Account Status</h3>
          </div>
          <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne', sans-serif", color: "var(--text-dim)" }}>VERIFICATION PROGRESS</span>
              <span className="text-xs font-black" style={{ fontFamily: "'Fraunces', serif", color: "#22c55e" }}>{verifiedCount}/{verifications.length}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${verifiedPct}%`, background: "linear-gradient(90deg, #16a34a, #22c55e, #4ade80)" }} />
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--text-ghost)" }}>
              {verifiedPct === 100 ? "✓ Fully verified" : `${100 - verifiedPct}% remaining to full trust score`}
            </p>
          </div>
          <div className="px-1">
            {verifications.map((v, i) => <StatusItem key={i} label={v.label} value={v.value} last={i === verifications.length - 1} />)}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Current Plan</span>
            <span className="text-xs font-black capitalize px-3 py-1.5 rounded-full" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e" }}>
              {user?.plan}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
