import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins, faHandshake, faArrowTrendUp, faCircleNotch,
  faArrowRight, faCalendarCheck,
  faCircleCheck, faTriangleExclamation, faClockRotateLeft,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

const C = {
  bg: "#0b0f0c", card: "#111812", border: "rgba(34,197,94,0.30)",
  green: "#22c55e", dim: "#16a34a", text: "#e2e8f0", sub: "#9ca3af", muted: "#4b5563",
  font: "'DM Sans', sans-serif", display: "'Fraunces', serif", syne: "'Syne', sans-serif",
  radius: "16px",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n, d = 2) { return (n || 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function StatCard({ icon, label, value, sub, color = "#22c55e" }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "22px" }}>
      <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: `${color}15`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: "15px", color }} />
      </div>
      <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, textTransform: "uppercase", letterSpacing: ".07em", margin: "0 0 5px", fontWeight: 600 }}>{label}</p>
      <p style={{ fontFamily: C.display, fontSize: "26px", color: C.text, margin: "0 0 3px", fontWeight: 700, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function BarChart({ data, color = "#22c55e" }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "80px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "100%", height: `${Math.max(4, Math.round((d.value / max) * 70))}px`, background: d.value > 0 ? `linear-gradient(180deg, ${color}, ${color}88)` : "rgba(255,255,255,0.2)", borderRadius: "4px 4px 0 0", transition: "height .6s ease" }} />
          <p style={{ fontFamily: C.font, fontSize: "9px", color: C.sub, margin: 0 }}>{d.label}</p>
        </div>
      ))}
    </div>
  );
}

// ROI pill: positive = green, zero = muted
function RoiPill({ invested, returned }) {
  const roi = invested > 0 ? ((returned - invested) / invested) * 100 : 0;
  const positive = roi > 0;
  const color = positive ? C.green : roi < 0 ? "#f43f5e" : C.sub;
  return (
    <span style={{ fontFamily: C.font, fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "20px", background: `${color}15`, color }}>
      {roi > 0 ? "+" : ""}{fmt(roi, 1)}%
    </span>
  );
}

const STATUS_MAP = {
  active:    { color: "#22c55e", label: "Active",    icon: faCircleCheck },
  completed: { color: "#0ea5e9", label: "Completed", icon: faCircleCheck },
  disputed:  { color: "#f59e0b", label: "Disputed",  icon: faTriangleExclamation },
  cancelled: { color: "#f43f5e", label: "Cancelled", icon: faClockRotateLeft },
};

export default function InvestorDashboard() {
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

        const earnResults = await Promise.all(
          invs.map(inv =>
            api.get(`/investments/${inv._id}/earnings`)
              .then(r => (r.data.earnings || []).map(e => ({ ...e, _invId: inv._id })))
              .catch(() => [])
          )
        );
        setAllEarnings(earnResults.flat());
      } catch {
        toast.error("Failed to load portfolio");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", gap: "10px", fontFamily: C.font, color: C.sub }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ color: C.green, fontSize: "18px" }} />
      Loading portfolio...
    </div>
  );

  // Chart: last 6 months of investor share received
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: MONTHS[d.getMonth()] };
  });

  const returnsChart = last6.map(slot => ({
    label: slot.label,
    value: allEarnings
      .filter(e => e.month === slot.month && e.year === slot.year)
      .reduce((s, e) => s + (e.investorShare || 0), 0),
  }));

  const incomeChart = last6.map(slot => ({
    label: slot.label,
    value: allEarnings
      .filter(e => e.month === slot.month && e.year === slot.year)
      .reduce((s, e) => s + (e.creatorIncome || 0), 0),
  }));

  const totalInvested  = investments.reduce((s, i) => s + i.amount, 0);
  const totalReturns   = investments.reduce((s, i) => s + i.totalPaidToInvestor, 0);
  const activeCount    = investments.filter(i => i.status === "active").length;
  const completedCount = investments.filter(i => i.status === "completed").length;
  const overallROI     = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;

  const activeInvs = investments.filter(i => i.status === "active");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fadeUp .3s ease both" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: C.display, fontSize: "24px", color: C.text, margin: "0 0 4px", fontWeight: 700 }}>Investor Portfolio</h1>
        <p style={{ fontFamily: C.font, fontSize: "13px", color: C.sub, margin: 0 }}>Track your capital, returns and active creator deals</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
        <StatCard icon={faCoins}        label="Capital Deployed"  value={`$${fmt(totalInvested)}`}  sub={`Across ${investments.length} deal${investments.length !== 1 ? "s" : ""}`} />
        <StatCard icon={faWallet}       label="Total Returns"     value={`$${fmt(totalReturns)}`}   sub="Investor share received" color="#0ea5e9" />
        <StatCard icon={faArrowTrendUp} label="Overall ROI"       value={`${fmt(overallROI, 1)}%`}  sub="Returns vs capital" color={overallROI >= 0 ? C.green : "#f43f5e"} />
        <StatCard icon={faHandshake}    label="Active Deals"      value={activeCount}               sub={`${completedCount} completed`} color="#8b5cf6" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "20px" }}>
          <p style={{ fontFamily: C.syne, fontSize: "13px", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Monthly Returns</p>
          <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: "0 0 20px" }}>Investor share received last 6 months</p>
          <BarChart data={returnsChart} color="#0ea5e9" />
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "20px" }}>
          <p style={{ fontFamily: C.syne, fontSize: "13px", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Creator Revenue</p>
          <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: "0 0 20px" }}>Total income reported by your creators</p>
          <BarChart data={incomeChart} color={C.green} />
        </div>
      </div>

      {/* Active deals spotlight */}
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
            const progressPct = Math.min(100, Math.round((inv.monthsReported / (inv.duration || 1)) * 100));
            const invEarnings = allEarnings.filter(e => e._invId === inv._id);
            const myReturns   = invEarnings.reduce((s, e) => s + (e.investorShare || 0), 0);
            return (
              <div key={inv._id}
                onClick={() => navigate(`/investments/${inv._id}/milestones`)}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", borderBottom: idx < activeInvs.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                {/* Creator avatar */}
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#8b5cf615", border: "1px solid #8b5cf625", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.syne, fontWeight: 700, fontSize: "15px", color: "#8b5cf6", flexShrink: 0, overflow: "hidden" }}>
                  {inv.creator?.avatar ? <img src={inv.creator.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : inv.creator?.name?.charAt(0).toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                    <p style={{ fontFamily: C.font, fontSize: "13px", fontWeight: 600, color: C.text, margin: 0 }}>{inv.creator?.name}</p>
                    <RoiPill invested={inv.amount} returned={myReturns} />
                  </div>
                  <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: "0 0 8px" }}>
                    ${fmt(inv.amount)} invested · {inv.profitSharePercentage}% share · ends {fmtDate(inv.endDate)}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ flex: 1, height: "4px", borderRadius: "3px", background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${progressPct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.dim})`, borderRadius: "3px", transition: "width .8s ease" }} />
                    </div>
                    <p style={{ fontFamily: C.font, fontSize: "10px", color: C.sub, margin: 0, whiteSpace: "nowrap" }}>{inv.monthsReported}/{inv.duration} mo</p>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontFamily: C.display, fontSize: "15px", fontWeight: 700, color: "#0ea5e9", margin: "0 0 2px" }}>${fmt(myReturns)}</p>
                  <p style={{ fontFamily: C.font, fontSize: "10px", color: C.sub, margin: 0 }}>returned so far</p>
                </div>
                <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "11px", color: C.sub, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Full portfolio table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FontAwesomeIcon icon={faCalendarCheck} style={{ fontSize: "13px", color: C.sub }} />
            <p style={{ fontFamily: C.syne, fontSize: "13px", fontWeight: 700, color: C.text, margin: 0 }}>Full Portfolio</p>
          </div>
          <span style={{ fontFamily: C.font, fontSize: "12px", color: C.sub }}>{investments.length} total</span>
        </div>

        {investments.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <FontAwesomeIcon icon={faCoins} style={{ fontSize: "28px", color: C.muted, marginBottom: "12px", display: "block" }} />
            <p style={{ fontFamily: C.font, fontSize: "13px", color: C.sub, margin: 0 }}>No investments yet. Find creators to invest in.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Creator", "Invested", "Share", "Progress", "Returned", "ROI", "Status"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontFamily: C.font, fontSize: "10px", fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: ".07em", padding: "12px 20px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {investments.map(inv => {
                  const ss = STATUS_MAP[inv.status] || STATUS_MAP.active;
                  const progressPct = Math.min(100, Math.round((inv.monthsReported / (inv.duration || 1)) * 100));
                  const myReturns = allEarnings.filter(e => e._invId === inv._id).reduce((s, e) => s + (e.investorShare || 0), 0);
                  return (
                    <tr key={inv._id}
                      onClick={() => navigate(`/investments/${inv._id}/milestones`)}
                      style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      {/* Creator */}
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#8b5cf615", border: "1px solid #8b5cf625", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.syne, fontSize: "12px", fontWeight: 700, color: "#8b5cf6", flexShrink: 0, overflow: "hidden" }}>
                            {inv.creator?.avatar ? <img src={inv.creator.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : inv.creator?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontFamily: C.font, fontSize: "13px", fontWeight: 600, color: C.text, margin: 0 }}>{inv.creator?.name}</p>
                            <p style={{ fontFamily: C.font, fontSize: "11px", color: C.sub, margin: 0 }}>{inv.creator?.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Amount */}
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ fontFamily: C.display, fontSize: "14px", fontWeight: 700, color: C.green, margin: 0 }}>${fmt(inv.amount)}</p>
                      </td>
                      {/* Share */}
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontFamily: C.font, fontSize: "12px", color: C.text }}>{inv.profitSharePercentage}%</span>
                      </td>
                      {/* Progress */}
                      <td style={{ padding: "14px 20px", minWidth: "120px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "4px", borderRadius: "3px", background: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${progressPct}%`, background: C.green, borderRadius: "3px" }} />
                          </div>
                          <p style={{ fontFamily: C.font, fontSize: "10px", color: C.sub, margin: 0, whiteSpace: "nowrap" }}>{inv.monthsReported}/{inv.duration}</p>
                        </div>
                      </td>
                      {/* Returned */}
                      <td style={{ padding: "14px 20px" }}>
                        <p style={{ fontFamily: C.font, fontSize: "13px", color: "#0ea5e9", margin: 0, fontWeight: 600 }}>${fmt(myReturns)}</p>
                      </td>
                      {/* ROI */}
                      <td style={{ padding: "14px 20px" }}>
                        <RoiPill invested={inv.amount} returned={myReturns} />
                      </td>
                      {/* Status */}
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontFamily: C.font, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: `${ss.color}15`, color: ss.color, whiteSpace: "nowrap" }}>
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
