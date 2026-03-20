import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faCoins, faHandshake, faArrowTrendUp,
  faCircleNotch, faArrowRight, faCalendarCheck,
  faTriangleExclamation, faCircleCheck, faClockRotateLeft,
  faTimeline, faBullhorn, faPlus, faImage, faXmark, faPaperPlane,
  faShieldHalved, faMicrophone, faBuilding, faPhone, faBullseye,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import useThemeStore from "../../store/useThemeStore";

function useC() {
  const theme = useThemeStore((s) => s.theme);
  const L = theme === "light";
  return {
    bg:     L ? "#f4faf5"              : "#0b0f0c",
    card:   L ? "#ffffff"              : "#111812",
    border: L ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.18)",
    green:  "#22c55e",
    dim:    "#16a34a",
    text:   L ? "#0a1a0c"             : "#e2e8f0",
    sub:    L ? "#4b5563"             : "#9ca3af",
    muted:  L ? "#6b7280"             : "#4b5563",
    cardAlt: L ? "#f0fdf4"              : "#0a1209",
    hover:  L ? "rgba(0,0,0,0.04)"   : "rgba(255,255,255,0.04)",
    font:   "'Inter', sans-serif",
    display:"'Inter', sans-serif",
    ui:     "'Inter', sans-serif",
    radius: "16px",
  };
}

function fmt(n, decimals = 2) { return (n || 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({ icon, label, value, sub, color = "#22c55e", onClick }) {
  const C = useC();
  return (
    <div onClick={onClick}
      style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "22px", cursor: onClick ? "pointer" : "default", transition: "border-color .2s" }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = `${color}40`)}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = C.border)}>
      <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: `${color}15`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: "15px", color }} />
      </div>
      <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 5px", fontWeight: 600 }}>{label}</p>
      <p style={{ fontFamily: C.display, fontSize: "26px", color: C.text, margin: "0 0 3px", fontWeight: 700, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: 0 }}>{sub}</p>}
      {onClick && <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "5px" }}><p style={{ fontFamily: C.font, fontSize: "11px", color, margin: 0 }}>View details</p><FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "10px", color }} /></div>}
    </div>
  );
}

// Mini bar chart
function BarChart({ data, color = "#22c55e" }) {
  const C = useC();
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "80px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "100%", height: `${Math.max(4, Math.round((d.value / max) * 70))}px`, background: d.value > 0 ? `linear-gradient(180deg, ${color}, ${color}88)` : "rgba(255,255,255,0.1)", borderRadius: "4px 4px 0 0", transition: "height .6s ease" }} />
          <p style={{ fontFamily: C.font, fontSize: "9px", color: C.sub, margin: 0 }}>{d.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Verification Status Strip ───────────────────────────────────────────────
function VerificationStrip() {
  const C = useC();
  const navigate = useNavigate();
  const [kycStatus,   setKycStatus]   = useState(null);
  const [voiceStatus, setVoiceStatus] = useState(null);
  const [assetCount,  setAssetCount]  = useState(0);
  const [guarCount,   setGuarCount]   = useState(0);

  useEffect(() => {
    Promise.allSettled([
      api.get("/kyc/status"),
      api.get("/voice/status"),
      api.get("/assets/my"),
      api.get("/guarantors/my"),
    ]).then(([kyc, voice, assets, guar]) => {
      if (kyc.status === "fulfilled")    setKycStatus(kyc.value.data.kycStatus);
      if (voice.status === "fulfilled")  setVoiceStatus(voice.value.data.status);
      if (assets.status === "fulfilled") setAssetCount((assets.value.data.assets || []).filter(a => a.status === "approved").length);
      if (guar.status === "fulfilled")   setGuarCount((guar.value.data.guarantors || []).filter(g => g.status === "verified").length);
    });
  }, []);

  const items = [
    {
      icon: faShieldHalved, label: "KYC",
      done: kycStatus === "approved",
      status: kycStatus === "approved" ? "Verified" : kycStatus === "pending" ? "Under Review" : "Incomplete",
      path: "/kyc",
      color: "#22c55e",
    },
    {
      icon: faMicrophone, label: "Voice Call",
      done: voiceStatus === "approved",
      status: voiceStatus === "approved" ? "Verified" : voiceStatus === "scheduled" ? "Scheduled" : voiceStatus === "completed" ? "Under Review" : "Not Scheduled",
      path: "/voice-verify",
      color: "#6366f1",
    },
    {
      icon: faBuilding, label: "Assets",
      done: assetCount > 0,
      status: assetCount > 0 ? `${assetCount} approved` : "None submitted",
      path: "/trust",
      color: "#f59e0b",
    },
    {
      icon: faPhone, label: "Guarantors",
      done: guarCount >= 2,
      status: guarCount >= 2 ? "Both verified" : `${guarCount}/2 verified`,
      path: "/trust",
      color: "#14b8a6",
    },
  ];

  const allDone = items.every(i => i.done);

  return (
    <div style={{ background: C.card, border: `1px solid ${allDone ? "rgba(34,197,94,0.35)" : C.border}`, borderRadius: C.radius, padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <p style={{ fontFamily: C.ui, fontSize: "12px", fontWeight: 700, color: allDone ? C.green : C.sub, margin: 0, textTransform: "uppercase", letterSpacing: ".07em" }}>
          {allDone ? "✓ Full Trust Verification Complete" : "Trust Verification Status"}
        </p>
        {!allDone && (
          <span style={{ fontFamily: C.font, fontSize: "11px", color: C.sub }}>
            {items.filter(i => i.done).length}/{items.length} complete
          </span>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
        {items.map(item => (
          <div
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
              borderRadius: "12px", cursor: "pointer", transition: "all .15s",
              background: item.done ? `${item.color}10` : C.card,
              border: `1px solid ${item.done ? `${item.color}30` : C.border}`,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = `${item.color}40`}
            onMouseLeave={e => e.currentTarget.style.borderColor = item.done ? `${item.color}30` : C.border}
          >
            <FontAwesomeIcon icon={item.done ? faCircleCheck : faCircleExclamation} style={{ fontSize: "14px", color: item.done ? item.color : C.muted, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: C.ui, fontSize: "11px", fontWeight: 700, color: item.done ? item.color : C.sub, margin: 0 }}>{item.label}</p>
              <p style={{ fontFamily: C.font, fontSize: "10px", color: C.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ navigate }) {
  const C = useC();
  const actions = [
    { icon: faBullseye,    label: "View My Campaign",   sub: "See your public page",    color: "#22c55e", path: "/campaign/setup" },
    { icon: faArrowTrendUp, label: "Set Up Campaign",   sub: "Edit funding & milestones", color: "#3b82f6", path: "/campaign/setup" },
    { icon: faShieldHalved, label: "Trust Verification", sub: "Assets & guarantors",    color: "#f59e0b", path: "/trust"          },
    { icon: faMicrophone,  label: "Voice Verify",        sub: "Schedule your call",      color: "#6366f1", path: "/voice-verify"  },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
      {actions.map(a => (
        <button
          key={a.label}
          onClick={() => navigate(a.path)}
          style={{
            display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px",
            borderRadius: "14px", cursor: "pointer", textAlign: "left", transition: "all .15s",
            background: C.card, border: `1px solid ${C.border}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${a.color}40`; e.currentTarget.style.background = `${a.color}08`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
        >
          <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: `${a.color}15`, border: `1px solid ${a.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FontAwesomeIcon icon={a.icon} style={{ fontSize: "14px", color: a.color }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: C.ui, fontSize: "12px", fontWeight: 700, color: C.text, margin: 0 }}>{a.label}</p>
            <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: 0 }}>{a.sub}</p>
          </div>
          <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "10px", color: C.muted, marginLeft: "auto", flexShrink: 0 }} />
        </button>
      ))}
    </div>
  );
}

export default function CreatorDashboard() {
  const C = useC();
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  const [allEarnings, setAllEarnings] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/investments/my-investments");
        const invs = res.data.investments || [];
        setInvestments(invs);

        // Fetch earnings for all active investments
        const earnPromises = invs.map(inv =>
          api.get(`/investments/${inv._id}/earnings`).then(r => r.data.earnings || []).catch(() => [])
        );
        const results = await Promise.all(earnPromises);
        setAllEarnings(results.flat());
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px", fontFamily: C.font, color: C.sub }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ color: C.green, fontSize: "18px" }} />
      Loading dashboard...
    </div>
  );

  // Build last 6 months chart data from earnings
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: MONTHS[d.getMonth()] };
  });

  const chartData = last6.map(slot => {
    const total = allEarnings
      .filter(e => e.month === slot.month && e.year === slot.year)
      .reduce((s, e) => s + (e.creatorNet || 0), 0);
    return { label: slot.label, value: total };
  });

  const totalNetEarnings = allEarnings.reduce((s, e) => s + (e.creatorNet || 0), 0);
  const totalRaised = investments.reduce((s, i) => s + i.amount, 0);
  const activeInvs = investments.filter(i => i.status === "active");
  const completedInvs = investments.filter(i => i.status === "completed");

  const STATUS_MAP = {
    active:    { color: C.green,   label: "Active",    icon: faCircleCheck },
    completed: { color: "#0ea5e9", label: "Completed", icon: faCircleCheck },
    disputed:  { color: "#f59e0b", label: "Disputed",  icon: faTriangleExclamation },
    cancelled: { color: "#f43f5e", label: "Cancelled", icon: faClockRotateLeft },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fadeUp .3s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Page header */}
      <div>
        <h1 style={{ fontFamily: C.display, fontSize: "24px", color: C.text, margin: "0 0 4px", fontWeight: 700 }}>Creator Dashboard</h1>
        <p style={{ fontFamily: C.font, fontSize: "13px", color: C.sub, margin: 0 }}>Your earnings, deals and performance at a glance</p>
      </div>

      {/* Verification status strip */}
      <VerificationStrip />

      {/* Quick actions */}
      <QuickActions navigate={navigate} />

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
        <StatCard icon={faCoins}       label="Total Raised"      value={`$${fmt(totalRaised)}`}          sub="From all investors" />
        <StatCard icon={faChartLine}   label="Net Earnings"      value={`$${fmt(totalNetEarnings)}`}      sub="After investor share" color="#0ea5e9" />
        <StatCard icon={faHandshake}   label="Active Deals"      value={activeInvs.length}                sub={`${completedInvs.length} completed`} color="#8b5cf6" />
        <StatCard icon={faArrowTrendUp} label="Months Reported"  value={allEarnings.length}               sub="Across all deals" color="#f59e0b" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Monthly net earnings chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "20px" }}>
          <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Net Earnings</p>
          <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: "0 0 20px" }}>Last 6 months after investor share</p>
          <BarChart data={chartData} color={C.green} />
        </div>

        {/* Investor share chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "20px" }}>
          <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Investor Payouts</p>
          <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: "0 0 20px" }}>Last 6 months paid to investors</p>
          <BarChart data={last6.map(slot => ({
            label: slot.label,
            value: allEarnings.filter(e => e.month === slot.month && e.year === slot.year).reduce((s, e) => s + (e.investorShare || 0), 0)
          }))} color="#8b5cf6" />
        </div>
      </div>

      {/* Active deals */}
      {activeInvs.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FontAwesomeIcon icon={faHandshake} style={{ fontSize: "13px", color: C.green }} />
              <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>Active Deals</p>
            </div>
            <span style={{ fontFamily: C.font, fontSize: "12px", color: C.sub }}>{activeInvs.length} deal{activeInvs.length !== 1 ? "s" : ""}</span>
          </div>

          {activeInvs.map((inv, idx) => {
            const pct = Math.min(100, Math.round((inv.monthsReported / (inv.duration || 1)) * 100));
            return (
              <div key={inv._id}
                onClick={() => navigate(`/investments/${inv._id}/milestones`)}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderBottom: idx < activeInvs.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = C.hover}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {/* Avatar */}
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${C.green}15`, border: `1px solid ${C.green}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.ui, fontWeight: 700, fontSize: "14px", color: C.green, flexShrink: 0, overflow: "hidden" }}>
                  {inv.investor?.avatar ? <img src={inv.investor.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : inv.investor?.name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: C.font, fontSize: "13px", fontWeight: 600, color: C.text, margin: "0 0 3px" }}>{inv.investor?.name}</p>
                  <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: "0 0 8px" }}>
                    ${fmt(inv.amount)} · {inv.profitSharePercentage}% share · {inv.duration}mo deal
                  </p>
                  {/* Progress bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, height: "4px", borderRadius: "3px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.dim})`, borderRadius: "3px", transition: "width .8s ease" }} />
                    </div>
                    <p style={{ fontFamily: C.font, fontSize: "10px", color: C.sub, margin: 0, whiteSpace: "nowrap" }}>{inv.monthsReported}/{inv.duration} mo</p>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: C.display, fontSize: "15px", fontWeight: 700, color: C.green, margin: "0 0 2px" }}>${fmt(inv.totalEarningsReported)}</p>
                  <p style={{ fontFamily: C.font, fontSize: "10px", color: C.sub, margin: 0 }}>reported</p>
                </div>
                <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "11px", color: C.sub, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* All investments table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: "13px", color: C.sub }} />
            <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>All Investments</p>
          </div>
          <span style={{ fontFamily: C.font, fontSize: "12px", color: C.sub }}>{investments.length} total</span>
        </div>

        {investments.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <FontAwesomeIcon icon={faHandshake} style={{ fontSize: "28px", color: C.muted, marginBottom: "12px", display: "block" }} />
            <p style={{ fontFamily: C.font, fontSize: "13px", color: C.sub, margin: 0 }}>No investments yet. Accept a proposal to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Investor", "Amount", "Share %", "Progress", "Total Earned", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontFamily: C.font, fontSize: "10px", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".07em", padding: "12px 20px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const ss = STATUS_MAP[inv.status] || STATUS_MAP.active;
                  const pct = Math.min(100, Math.round((inv.monthsReported / (inv.duration || 1)) * 100));
                  return (
                    <tr key={inv._id}
                      onClick={() => navigate(`/investments/${inv._id}/milestones`)}
                      style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.hover}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${C.green}15`, border: `1px solid ${C.green}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.ui, fontSize: "12px", fontWeight: 700, color: C.green, flexShrink: 0, overflow: "hidden" }}>
                            {inv.investor?.avatar ? <img src={inv.investor.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : inv.investor?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontFamily: C.font, fontSize: "13px", fontWeight: 600, color: C.text, margin: 0 }}>{inv.investor?.name}</p>
                            <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: 0 }}>{inv.investor?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ fontFamily: C.display, fontSize: "14px", fontWeight: 700, color: C.green, margin: 0 }}>${fmt(inv.amount)}</p>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontFamily: C.font, fontSize: "12px", color: C.text }}>{inv.profitSharePercentage}%</span>
                      </td>
                      <td style={{ padding: "14px 20px", minWidth: "120px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "4px", borderRadius: "3px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: C.green, borderRadius: "3px" }} />
                          </div>
                          <p style={{ fontFamily: C.font, fontSize: "10px", color: C.sub, margin: 0, whiteSpace: "nowrap" }}>{inv.monthsReported}/{inv.duration}</p>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ fontFamily: C.font, fontSize: "13px", color: C.text, margin: 0 }}>${fmt(inv.totalEarningsReported)}</p>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontFamily: C.font, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: `${ss.color}15`, color: ss.color }}>
                          <FontAwesomeIcon icon={ss.icon} style={{ marginRight: "5px", fontSize: "9px" }} />
                          {ss.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Growth Timeline */}
      <GrowthTimeline />

      {/* Campaign Update Feed */}
      <CampaignUpdateFeed />

    </div>
  );
}

// ─── Growth Timeline ─────────────────────────────────────────────────────────
function GrowthTimeline() {
  const C = useC();
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/growth-timeline");
      setEntries(res.data.entries || []);
    } catch { /* no timeline yet */ }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return toast.error("Title and content required");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("content", content);
      mediaFiles.forEach(f => form.append("media", f));
      await api.post("/growth-timeline", form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Milestone posted!");
      setShowForm(false); setTitle(""); setContent(""); setMediaFiles([]); load();
    } catch { toast.error("Failed to post milestone"); }
    finally { setSubmitting(false); }
  };

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmtDate = d => { const dt = new Date(d); return `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`; };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FontAwesomeIcon icon={faTimeline} style={{ fontSize: "13px", color: C.green }} />
          <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>Growth Timeline</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: `${C.green}15`, border: `1px solid ${C.green}30`, borderRadius: "10px", padding: "6px 12px", fontFamily: C.ui, fontSize: "12px", fontWeight: 700, color: C.green, cursor: "pointer" }}>
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: "10px" }} /> Post Milestone
        </button>
      </div>

      {showForm && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, background: "rgba(34,197,94,0.03)" }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Milestone title (e.g. Machine delivered!)" maxLength={120}
            style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 12px", fontFamily: C.font, fontSize: "13px", color: C.text, outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Tell your investors what you achieved..." rows={3}
            style={{ width: "100%", background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "9px 12px", fontFamily: C.font, fontSize: "13px", color: C.text, outline: "none", resize: "vertical", marginBottom: "10px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: "9px", padding: "7px 12px", fontFamily: C.font, fontSize: "12px", color: C.sub, cursor: "pointer" }}>
              <FontAwesomeIcon icon={faImage} style={{ fontSize: "11px" }} />
              {mediaFiles.length > 0 ? `${mediaFiles.length} file(s)` : "Attach photos"}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
              onChange={e => setMediaFiles(Array.from(e.target.files))} />
            <div style={{ flex: 1 }} />
            <button onClick={() => { setShowForm(false); setTitle(""); setContent(""); setMediaFiles([]); }}
              style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", padding: "6px 8px" }}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: C.green, border: "none", borderRadius: "9px", padding: "7px 14px", fontFamily: C.ui, fontSize: "12px", fontWeight: 700, color: "#000", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "11px" }} /> : <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "11px" }} />}
              Post
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: "20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: C.sub, fontFamily: C.font, fontSize: "13px" }}>
            <FontAwesomeIcon icon={faCircleNotch} spin style={{ color: C.green, marginRight: "8px" }} />Loading...
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <FontAwesomeIcon icon={faTimeline} style={{ fontSize: "28px", color: C.muted, marginBottom: "12px", display: "block" }} />
            <p style={{ fontFamily: C.font, fontSize: "13px", color: C.sub, margin: 0 }}>No milestone posts yet. Share your first win!</p>
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: "28px" }}>
            <div style={{ position: "absolute", left: "8px", top: "12px", bottom: "12px", width: "2px", background: `linear-gradient(180deg, ${C.green}60, transparent)` }} />
            {entries.map((e, i) => (
              <div key={e._id || i} style={{ position: "relative", marginBottom: i < entries.length - 1 ? "24px" : 0 }}>
                <div style={{ position: "absolute", left: "-24px", top: "4px", width: "10px", height: "10px", borderRadius: "50%", background: C.green, border: `2px solid ${C.dim}` }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "4px" }}>
                  <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>{e.title}</p>
                  <span style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, whiteSpace: "nowrap", marginLeft: "12px" }}>{fmtDate(e.createdAt)}</span>
                </div>
                <p style={{ fontFamily: C.font, fontSize: "12px", color: C.sub, margin: "0 0 8px", lineHeight: 1.6 }}>{e.content}</p>
                {e.mediaFiles?.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {e.mediaFiles.map((url, mi) => (
                      <img key={mi} src={url} alt="milestone" style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${C.border}` }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Campaign Update Feed ─────────────────────────────────────────────────────
function CampaignUpdateFeed() {
  const C = useC();
  const [updates, setUpdates]       = useState([]);
  const [campaignId, setCampaignId] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [title, setTitle]           = useState("");
  const [content, setContent]       = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const camRes = await api.get("/campaigns/my-campaign");
      const cid = camRes.data.campaign?._id;
      setCampaignId(cid);
      if (cid) {
        const updRes = await api.get(`/campaigns/${cid}/updates`);
        setUpdates(updRes.data.updates || []);
      }
    } catch { /* no campaign yet */ }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return toast.error("Title and content required");
    if (!campaignId) return toast.error("No active campaign found");
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("title", title);
      form.append("content", content);
      mediaFiles.forEach(f => form.append("media", f));
      await api.post(`/campaigns/${campaignId}/updates`, form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Update posted!");
      setShowForm(false); setTitle(""); setContent(""); setMediaFiles([]); load();
    } catch { toast.error("Failed to post update"); }
    finally { setSubmitting(false); }
  };

  const fmtDate = d => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (!loading && !campaignId) return null;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FontAwesomeIcon icon={faBullhorn} style={{ fontSize: "13px", color: "#f59e0b" }} />
          <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>Campaign Updates</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.30)", borderRadius: "10px", padding: "6px 12px", fontFamily: C.ui, fontSize: "12px", fontWeight: 700, color: "#f59e0b", cursor: "pointer" }}>
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: "10px" }} /> Post Update
        </button>
      </div>

      {showForm && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, background: "rgba(245,158,11,0.03)" }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Update title" maxLength={120}
            style={{ width: "100%", background: C.card, border: "1px solid rgba(245,158,11,0.28)", borderRadius: "10px", padding: "9px 12px", fontFamily: C.font, fontSize: "13px", color: C.text, outline: "none", marginBottom: "10px", boxSizing: "border-box" }} />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your latest progress with investors..." rows={3}
            style={{ width: "100%", background: C.card, border: "1px solid rgba(245,158,11,0.28)", borderRadius: "10px", padding: "9px 12px", fontFamily: C.font, fontSize: "13px", color: C.text, outline: "none", resize: "vertical", marginBottom: "10px", boxSizing: "border-box" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: C.cardAlt, border: `1px solid ${C.border}`, borderRadius: "9px", padding: "7px 12px", fontFamily: C.font, fontSize: "12px", color: C.sub, cursor: "pointer" }}>
              <FontAwesomeIcon icon={faImage} style={{ fontSize: "11px" }} />
              {mediaFiles.length > 0 ? `${mediaFiles.length} file(s)` : "Attach photos"}
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
              onChange={e => setMediaFiles(Array.from(e.target.files))} />
            <div style={{ flex: 1 }} />
            <button onClick={() => { setShowForm(false); setTitle(""); setContent(""); setMediaFiles([]); }}
              style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", padding: "6px 8px" }}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <button onClick={handleSubmit} disabled={submitting}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f59e0b", border: "none", borderRadius: "9px", padding: "7px 14px", fontFamily: C.ui, fontSize: "12px", fontWeight: 700, color: "#000", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "11px" }} /> : <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: "11px" }} />}
              Post
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px", color: C.sub, fontFamily: C.font, fontSize: "13px" }}>
            <FontAwesomeIcon icon={faCircleNotch} spin style={{ color: "#f59e0b", marginRight: "8px" }} />Loading...
          </div>
        ) : updates.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px" }}>
            <FontAwesomeIcon icon={faBullhorn} style={{ fontSize: "28px", color: C.muted, marginBottom: "12px", display: "block" }} />
            <p style={{ fontFamily: C.font, fontSize: "13px", color: C.sub, margin: 0 }}>No campaign updates yet. Keep investors engaged with regular posts.</p>
          </div>
        ) : updates.map((u, i) => (
          <div key={u._id || i} style={{ borderBottom: i < updates.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: i < updates.length - 1 ? "16px" : 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
              <p style={{ fontFamily: C.ui, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>{u.title}</p>
              <span style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, whiteSpace: "nowrap", marginLeft: "12px" }}>{fmtDate(u.createdAt)}</span>
            </div>
            <p style={{ fontFamily: C.font, fontSize: "12px", color: C.sub, margin: "0 0 8px", lineHeight: 1.6 }}>{u.content}</p>
            {u.mediaFiles?.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {u.mediaFiles.map((url, mi) => (
                  <img key={mi} src={url} alt="update" style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "8px", border: `1px solid ${C.border}` }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
