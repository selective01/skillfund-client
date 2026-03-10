import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faCoins, faHandshake, faArrowTrendUp,
  faCircleNotch, faArrowRight, faCalendarCheck,
  faTriangleExclamation, faCircleCheck, faClockRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

const C = {
  bg: "#0b0f0c", card: "#111812", border: "rgba(34,197,94,0.18)",
  green: "#22c55e", dim: "#16a34a", text: "#e2e8f0", sub: "#9ca3af", muted: "#4b5563",
  font: "'DM Sans', sans-serif", display: "'Fraunces', serif", syne: "'Syne', sans-serif",
  radius: "16px",
};

function fmt(n, decimals = 2) { return (n || 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }); }

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({ icon, label, value, sub, color = "#22c55e", onClick }) {
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

export default function CreatorDashboard() {
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
          <p style={{ fontFamily: C.syne, fontSize: "13px", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Net Earnings</p>
          <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: "0 0 20px" }}>Last 6 months after investor share</p>
          <BarChart data={chartData} color={C.green} />
        </div>

        {/* Investor share chart */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "20px" }}>
          <p style={{ fontFamily: C.syne, fontSize: "13px", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Investor Payouts</p>
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
              <p style={{ fontFamily: C.syne, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>Active Deals</p>
            </div>
            <span style={{ fontFamily: C.font, fontSize: "12px", color: C.sub }}>{activeInvs.length} deal{activeInvs.length !== 1 ? "s" : ""}</span>
          </div>

          {activeInvs.map((inv, idx) => {
            const pct = Math.min(100, Math.round((inv.monthsReported / (inv.duration || 1)) * 100));
            return (
              <div key={inv._id}
                onClick={() => navigate(`/investments/${inv._id}/milestones`)}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderBottom: idx < activeInvs.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {/* Avatar */}
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${C.green}15`, border: `1px solid ${C.green}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.syne, fontWeight: 700, fontSize: "14px", color: C.green, flexShrink: 0, overflow: "hidden" }}>
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
            <p style={{ fontFamily: C.syne, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>All Investments</p>
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
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `${C.green}15`, border: `1px solid ${C.green}25`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.syne, fontSize: "12px", fontWeight: 700, color: C.green, flexShrink: 0, overflow: "hidden" }}>
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
    </div>
  );
}
