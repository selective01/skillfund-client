import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faWallet, faShieldHalved, faTriangleExclamation,
  faArrowTrendUp, faReceipt, faCircleNotch, faArrowRight,
  faUserPlus, faChartLine, faCoins,
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import useAdminAuthStore from "../../store/useAdminAuthStore";

const T = {
  bg: "#ffffff", pageBg: "#f5f6fa", border: "1px solid #eef0f4",
  radius: "16px", shadow: "0 1px 4px rgba(0,0,0,0.04)",
  font: "'Inter', sans-serif", text: "#1a1d23", muted: "#9ea3ae", subtle: "#f5f6fa",
};

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: T.bg, border: T.border, borderRadius: T.radius, boxShadow: T.shadow, cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function fmt(n) { return (n || 0).toLocaleString(); }
function fmtMoney(n) { return `$${fmt(n)}`; }

export default function AdminDashboard() {
  const navigate   = useNavigate();
  const { adminToken } = useAdminAuthStore();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    axios.get(`${BASE}/admin/analytics`, { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(res => setData(res.data.analytics))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminToken]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px", fontFamily: T.font, color: T.muted }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "20px" }} />
      Loading dashboard...
    </div>
  );

  const STAT_CARDS = [
    { label: "Total Users",      value: fmt(data?.users?.total),            sub: `+${fmt(data?.users?.newThisMonth)} this month`, icon: faUsers,          color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff", path: "/admin/users" },
    { label: "Total Revenue",    value: fmtMoney(data?.revenue?.total),     sub: "From successful txns",                          icon: faChartLine,      color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", path: "/admin/transactions" },
    { label: "Total Invested",   value: fmtMoney(data?.investments?.totalInvested), sub: `${fmt(data?.investments?.active)} active deals`, icon: faCoins, color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd", path: "/admin/transactions" },
    { label: "Pending Payouts",  value: fmtMoney(data?.pending?.withdrawalAmount), sub: `${fmt(data?.pending?.withdrawals)} requests pending`, icon: faWallet, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", path: "/admin/withdrawals" },
  ];

  const ALERT_CARDS = [
    { label: "Pending KYC",    value: data?.pending?.verifications, icon: faShieldHalved,        color: "#14b8a6", bg: "#f0fdfa", border: "#99f6e4", path: "/admin/verifications", cta: "Review submissions" },
    { label: "Open Disputes",  value: data?.pending?.disputes,      icon: faTriangleExclamation, color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", path: "/admin/disputes",      cta: "View disputes" },
    { label: "New This Month", value: data?.users?.newThisMonth,    icon: faUserPlus,            color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff", path: "/admin/users",         cta: "View new users" },
    { label: "Total Investments", value: data?.investments?.total,  icon: faArrowTrendUp,        color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", path: "/admin/transactions",  cta: "View transactions" },
  ];

  const planDist = data?.planDistribution || [];
  const totalForPlan = planDist.reduce((s, p) => s + p.count, 0) || 1;
  const PLAN_COLORS = { basic: "#9ea3ae", starter: "#6366f1", pro: "#0ea5e9", elite: "#f59e0b" };

  const ROLE_SPLIT = [
    { label: "Creators",  value: data?.users?.creators,  color: "#16a34a", bg: "#f0fdf4" },
    { label: "Investors", value: data?.users?.investors, color: "#0ea5e9", bg: "#f0f9ff" },
  ];
  const totalRoles = (data?.users?.creators || 0) + (data?.users?.investors || 0) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "admFadeUp .3s ease both" }}>
      <style>{`@keyframes admFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
        {STAT_CARDS.map(s => (
          <Card key={s.label} onClick={() => navigate(s.path)} style={{ padding: "20px", transition: "box-shadow .15s, transform .15s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = "none"; }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FontAwesomeIcon icon={s.icon} style={{ fontSize: "16px", color: s.color }} />
              </div>
              <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "11px", color: T.muted }} />
            </div>
            <p style={{ fontFamily: T.font, fontSize: "24px", fontWeight: 800, color: T.text, margin: "0 0 4px", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: T.muted, margin: "0 0 4px" }}>{s.label}</p>
            <p style={{ fontFamily: T.font, fontSize: "11px", color: s.color, margin: 0 }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── Middle row: alerts + plan dist ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Alert / action cards */}
        <Card style={{ padding: "20px" }}>
          <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: "0 0 16px" }}>Needs Attention</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {ALERT_CARDS.map(a => (
              <div key={a.label} onClick={() => navigate(a.path)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: a.bg, border: `1px solid ${a.border}`, cursor: "pointer", transition: "opacity .15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "#fff", border: `1px solid ${a.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FontAwesomeIcon icon={a.icon} style={{ fontSize: "13px", color: a.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: T.text, margin: "0 0 2px" }}>{a.label}</p>
                  <p style={{ fontFamily: T.font, fontSize: "11px", color: a.color, margin: 0 }}>{a.cta}</p>
                </div>
                <p style={{ fontFamily: T.font, fontSize: "20px", fontWeight: 800, color: a.color, margin: 0 }}>{fmt(a.value)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Plan distribution */}
        <Card style={{ padding: "20px" }}>
          <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: "0 0 16px" }}>User Breakdown</p>

          {/* Role split */}
          <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 8px" }}>By Role</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {ROLE_SPLIT.map(r => (
              <div key={r.label} style={{ flex: 1, background: r.bg, borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ fontFamily: T.font, fontSize: "20px", fontWeight: 800, color: r.color, margin: "0 0 2px" }}>{fmt(r.value)}</p>
                <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{r.label}</p>
                <p style={{ fontFamily: T.font, fontSize: "10px", color: r.color, margin: 0, fontWeight: 600 }}>{Math.round((r.value / totalRoles) * 100)}%</p>
              </div>
            ))}
          </div>

          {/* Plan distribution bars */}
          <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 10px" }}>By Plan</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {["basic", "starter", "pro", "elite"].map(plan => {
              const entry = planDist.find(p => p._id === plan);
              const count = entry?.count || 0;
              const pct   = Math.round((count / totalForPlan) * 100);
              const color = PLAN_COLORS[plan];
              return (
                <div key={plan}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <p style={{ fontFamily: T.font, fontSize: "12px", color: T.text, margin: 0, textTransform: "capitalize", fontWeight: 500 }}>{plan}</p>
                    <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted, margin: 0 }}>{count} · {pct}%</p>
                  </div>
                  <div style={{ height: "6px", borderRadius: "4px", background: "#f1f5f9", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "4px", transition: "width .6s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Quick nav ── */}
      <Card style={{ padding: "20px" }}>
        <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: "0 0 14px" }}>Quick Actions</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
          {[
            { label: "Manage Users",    icon: faUsers,               color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff", path: "/admin/users" },
            { label: "Review KYC",      icon: faShieldHalved,        color: "#14b8a6", bg: "#f0fdfa", border: "#99f6e4", path: "/admin/verifications" },
            { label: "Withdrawals",     icon: faWallet,              color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", path: "/admin/withdrawals" },
            { label: "Transactions",    icon: faReceipt,             color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", path: "/admin/transactions" },
            { label: "Disputes",        icon: faTriangleExclamation, color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", path: "/admin/disputes" },
          ].map(q => (
            <button key={q.label} onClick={() => navigate(q.path)}
              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "12px", background: q.bg, border: `1px solid ${q.border}`, cursor: "pointer", transition: "opacity .15s", width: "100%" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <FontAwesomeIcon icon={q.icon} style={{ fontSize: "14px", color: q.color, flexShrink: 0 }} />
              <span style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: T.text }}>{q.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
