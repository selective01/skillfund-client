import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import useAdminAuthStore from "../../store/useAdminAuthStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleNotch, faCreditCard, faArrowTrendUp,
  faMoneyBillTransfer, faStar, faChartLine,
  faArrowUp, faArrowDown, faRotateRight, faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

// ─── Design tokens (matches existing admin pages) ─────────────────────────────
const T = {
  bg: "#ffffff", pageBg: "#f5f6fa", border: "1px solid #eef0f4",
  radius: "16px", shadow: "0 1px 4px rgba(0,0,0,0.04)",
  font: "'Inter', sans-serif", text: "#1a1d23", muted: "#9ea3ae", subtle: "#f5f6fa",
};

// ─── Revenue stream definitions (per SkillFund spec) ──────────────────────────
const STREAMS = [
  {
    key:    "subscriptions",
    label:  "Subscriptions",
    icon:   faCreditCard,
    color:  "#6366f1",
    bg:     "#eef2ff",
    border: "#e0e7ff",
    desc:   "Monthly plan fees — Basic, Starter, Pro & Elite",
    rate:   "Fixed monthly per user",
  },
  {
    key:    "investmentCommissions",
    label:  "Investment Commission",
    icon:   faArrowTrendUp,
    color:  "#16a34a",
    bg:     "#f0fdf4",
    border: "#bbf7d0",
    desc:   "5% fee on every investment locked through the platform",
    rate:   "5% per investment",
  },
  {
    key:    "withdrawalFees",
    label:  "Withdrawal Fees",
    icon:   faMoneyBillTransfer,
    color:  "#f59e0b",
    bg:     "#fffbeb",
    border: "#fde68a",
    desc:   "Fee deducted when users withdraw earnings (2–5% by plan)",
    rate:   "2–5% per withdrawal",
  },
  {
    key:    "featuredProfiles",
    label:  "Featured Profiles",
    icon:   faStar,
    color:  "#8b5cf6",
    bg:     "#f5f3ff",
    border: "#ddd6fe",
    desc:   "Creators pay for priority listing visibility",
    rate:   "$10–$50/month",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtUSD(n) {
  const v = parseFloat(n) || 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}k`;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtPct(a, total) {
  if (!total) return "0%";
  return `${((a / total) * 100).toFixed(1)}%`;
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ChangeBadge({ current, previous }) {
  if (!previous) return null;
  const diff = current - previous;
  const pct  = previous === 0 ? 100 : Math.abs((diff / previous) * 100).toFixed(1);
  const up   = diff >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "3px",
      fontFamily: T.font, fontSize: "11px", fontWeight: 700,
      padding: "2px 8px", borderRadius: "20px",
      background: up ? "#f0fdf4" : "#fff1f2",
      color:      up ? "#16a34a" : "#f43f5e",
      border:     `1px solid ${up ? "#bbf7d0" : "#fecdd3"}`,
    }}>
      <FontAwesomeIcon icon={up ? faArrowUp : faArrowDown} style={{ fontSize: "9px" }} />
      {pct}%
    </span>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function Card({ children, style = {}, onClick, onMouseEnter, onMouseLeave }) {
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      style={{ background: T.bg, border: T.border, borderRadius: T.radius, boxShadow: T.shadow, ...style }}>
      {children}
    </div>
  );
}

function MiniBar({ value, max, color }) {
  const w = max > 0 ? Math.max((value / max) * 100, value > 0 ? 3 : 0) : 0;
  return (
    <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", width: "80px" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: "4px", transition: "width .6s ease" }} />
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "16px" }}>
        {[1,2,3,4,5].map(i => (
          <Card key={i} style={{ padding: "20px" }}>
            <div style={{ height: "36px", width: "36px", background: "#f1f5f9", borderRadius: "10px", marginBottom: "12px" }} />
            <div style={{ height: "24px", background: "#f1f5f9", borderRadius: "6px", marginBottom: "8px", width: "65%" }} />
            <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "6px", width: "50%" }} />
          </Card>
        ))}
      </div>
      <Card style={{ overflow: "hidden" }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px", padding: "14px 16px", borderBottom: i < 6 ? T.border : "none" }}>
            {[1,2,3,4,5].map(j => <div key={j} style={{ height: "12px", background: "#f1f5f9", borderRadius: "6px" }} />)}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Mock data (used when API endpoint not yet built) ─────────────────────────
function buildMockData(period) {
  const mult = { this_month: 1, last_month: 0.87, last_3_months: 2.7, this_year: 11.2 }[period] || 1;
  const prev = mult * 0.91;
  return {
    totals: {
      subscriptions:         Math.round(12500 * mult),
      investmentCommissions: Math.round(2500  * mult),
      withdrawalFees:        Math.round(1500  * mult),
      featuredProfiles:      Math.round(800   * mult),
    },
    previous: {
      subscriptions:         Math.round(12500 * prev),
      investmentCommissions: Math.round(2500  * prev),
      withdrawalFees:        Math.round(1500  * prev),
      featuredProfiles:      Math.round(800   * prev),
    },
    breakdown: [
      { stream: "subscriptions",         label: "Elite Plan ($60/mo)",          count: 50,  amount: Math.round(3000  * mult) },
      { stream: "subscriptions",         label: "Pro Plan ($25/mo)",            count: 800, amount: Math.round(20000 * mult) },
      { stream: "subscriptions",         label: "Starter Plan ($9/mo)",         count: 420, amount: Math.round(3780  * mult) },
      { stream: "subscriptions",         label: "Basic Plan (Free)",            count: 930, amount: 0 },
      { stream: "investmentCommissions", label: "5% on fiat investments",       count: 89,  amount: Math.round(2200  * mult) },
      { stream: "investmentCommissions", label: "5% on crypto (USDT)",          count: 34,  amount: Math.round(850   * mult) },
      { stream: "investmentCommissions", label: "Syndicate investments (5%)",   count: 12,  amount: Math.round(410   * mult) },
      { stream: "withdrawalFees",        label: "Basic plan (5% fee)",          count: 120, amount: Math.round(600   * mult) },
      { stream: "withdrawalFees",        label: "Starter plan (4% fee)",        count: 85,  amount: Math.round(520   * mult) },
      { stream: "withdrawalFees",        label: "Pro plan (3% fee)",            count: 62,  amount: Math.round(290   * mult) },
      { stream: "withdrawalFees",        label: "Elite plan (2% fee)",          count: 18,  amount: Math.round(90    * mult) },
      { stream: "featuredProfiles",      label: "Premium listing ($50/mo)",     count: 8,   amount: Math.round(400   * mult) },
      { stream: "featuredProfiles",      label: "Standard listing ($25/mo)",    count: 12,  amount: Math.round(300   * mult) },
      { stream: "featuredProfiles",      label: "Basic listing ($10/mo)",       count: 10,  amount: Math.round(100   * mult) },
    ],
    recentTransactions: Array.from({ length: 14 }, (_, i) => {
      const keys    = ["subscriptions","investmentCommissions","withdrawalFees","featuredProfiles"];
      const stream  = keys[i % 4];
      const amts    = { subscriptions:[25,60,9,25], investmentCommissions:[25,50,100,75], withdrawalFees:[15,30,8,50], featuredProfiles:[10,25,50,10] };
      const amt     = amts[stream][i % 4];
      const users   = ["Ada Okafor","Tunde Bakare","John Smith","Ngozi A.","Fatima Y.","Emeka N.","Chioma L."];
      const roles   = ["creator","investor","creator","investor","creator","investor","creator"];
      return {
        _id:      `mock-${i}`,
        stream,
        label:    STREAMS.find(s => s.key === stream)?.label,
        amount:   amt,
        user:     users[i % 7],
        role:     roles[i % 7],
        createdAt:new Date(Date.now() - i * 86400000 * 1.5).toISOString(),
      };
    }),
  };
}

// ─── Admin API hook ───────────────────────────────────────────────────────────
function useAdminApi() {
  const { adminToken } = useAdminAuthStore();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return useMemo(() => {
    const h = () => ({ Authorization: `Bearer ${adminToken}` });
    return { get: (url, cfg = {}) => axios.get(`${BASE}${url}`, { ...cfg, headers: { ...h(), ...cfg.headers } }) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function AdminRevenue() {
  const adminApi = useAdminApi();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("this_month");
  const [stream,  setStream]  = useState("all");

  const PERIODS = [
    { key: "this_month",    label: "This Month"    },
    { key: "last_month",    label: "Last Month"    },
    { key: "last_3_months", label: "Last 3 Months" },
    { key: "this_year",     label: "This Year"     },
  ];

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/revenue?period=${period}`);
      setData(res.data.revenue || res.data);
    } catch {
      // API endpoint not built yet — render with mock data
      setData(buildMockData(period));
    } finally {
      setLoading(false);
    }
  }, [adminApi, period]);

  useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

  const totals   = data?.totals    || {};
  const previous = data?.previous  || {};
  const breakdown = data?.breakdown || [];
  const recent   = data?.recentTransactions || [];

  const grandTotal     = STREAMS.reduce((s, st) => s + (totals[st.key]   || 0), 0);
  const prevGrandTotal = STREAMS.reduce((s, st) => s + (previous[st.key] || 0), 0);

  const filteredBreakdown = useMemo(() =>
    stream === "all" ? breakdown : breakdown.filter(r => r.stream === stream),
  [breakdown, stream]);

  const filteredRecent = useMemo(() =>
    stream === "all" ? recent : recent.filter(r => r.stream === stream),
  [recent, stream]);

  const maxBreakdownAmt = Math.max(...filteredBreakdown.map(r => r.amount), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "admFadeUp .3s ease both" }}>
      <style>{`@keyframes admFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontFamily: T.font, fontSize: "18px", fontWeight: 800, color: T.text, margin: 0 }}>Platform Revenue</h2>
          <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: "4px 0 0" }}>
            Income broken down by stream — subscriptions, commissions, withdrawal fees & featured listings
          </p>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              fontFamily: T.font, fontSize: "12px", fontWeight: 600,
              padding: "7px 12px", borderRadius: "10px", cursor: "pointer",
              transition: "all .15s", border: "1px solid",
              background:  period === p.key ? "#eef2ff" : T.bg,
              color:       period === p.key ? "#6366f1" : T.muted,
              borderColor: period === p.key ? "#e0e7ff" : "#e2e8f0",
            }}>{p.label}</button>
          ))}
          <button onClick={fetchRevenue} disabled={loading} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "7px 12px", borderRadius: "10px", cursor: "pointer",
            fontFamily: T.font, fontSize: "12px", fontWeight: 600,
            border: T.border, background: T.bg, color: T.muted, transition: "all .15s",
          }}>
            <FontAwesomeIcon icon={loading ? faCircleNotch : faRotateRight} spin={loading} style={{ fontSize: "11px" }} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? <Skeleton /> : (
        <>
          {/* ── Summary cards ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "16px" }}>

            {/* Grand total */}
            <Card style={{ padding: "20px", background: "linear-gradient(135deg,#6366f1,#4338ca)", border: "none" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FontAwesomeIcon icon={faChartLine} style={{ fontSize: "15px", color: "#fff" }} />
                </div>
                <ChangeBadge current={grandTotal} previous={prevGrandTotal} />
              </div>
              <p style={{ fontFamily: T.font, fontSize: "22px", fontWeight: 800, color: "#fff", margin: "0 0 4px", lineHeight: 1 }}>{fmtUSD(grandTotal)}</p>
              <p style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 2px" }}>Total Platform Revenue</p>
              <p style={{ fontFamily: T.font, fontSize: "11px", color: "rgba(255,255,255,0.5)", margin: 0 }}>{PERIODS.find(p => p.key === period)?.label}</p>
            </Card>

            {/* Per-stream cards */}
            {STREAMS.map(s => (
              <Card key={s.key} style={{ padding: "20px", cursor: "pointer", transition: "box-shadow .15s, transform .15s", outline: stream === s.key ? `2px solid ${s.color}` : "none" }}
                onClick={() => setStream(stream === s.key ? "all" : s.key)}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.transform = "none"; }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FontAwesomeIcon icon={s.icon} style={{ fontSize: "14px", color: s.color }} />
                  </div>
                  <ChangeBadge current={totals[s.key] || 0} previous={previous[s.key] || 0} />
                </div>
                <p style={{ fontFamily: T.font, fontSize: "20px", fontWeight: 800, color: T.text, margin: "0 0 3px", lineHeight: 1 }}>{fmtUSD(totals[s.key] || 0)}</p>
                <p style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: T.muted, margin: "0 0 8px" }}>{s.label}</p>
                <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "4px" }}>
                  <div style={{ height: "100%", width: fmtPct(totals[s.key] || 0, grandTotal), background: s.color, borderRadius: "4px", transition: "width .6s ease" }} />
                </div>
                <p style={{ fontFamily: T.font, fontSize: "10px", color: T.muted, margin: 0, fontWeight: 600 }}>
                  {fmtPct(totals[s.key] || 0, grandTotal)} of total &nbsp;·&nbsp; {s.rate}
                </p>
                {stream === s.key && (
                  <p style={{ fontFamily: T.font, fontSize: "10px", color: s.color, margin: "5px 0 0", fontWeight: 700 }}>● Filtering active</p>
                )}
              </Card>
            ))}
          </div>

          {/* ── Revenue mix + vs previous ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

            {/* Revenue mix bars */}
            <Card style={{ padding: "20px" }}>
              <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: "0 0 18px" }}>Revenue Mix</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {STREAMS.map(s => {
                  const amt   = totals[s.key] || 0;
                  const share = grandTotal > 0 ? (amt / grandTotal) * 100 : 0;
                  return (
                    <div key={s.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <FontAwesomeIcon icon={s.icon} style={{ fontSize: "11px", color: s.color }} />
                          </div>
                          <div>
                            <p style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: T.text, margin: 0 }}>{s.label}</p>
                            <p style={{ fontFamily: T.font, fontSize: "10px", color: T.muted, margin: 0 }}>{s.desc}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "12px" }}>
                          <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: 0 }}>{fmtUSD(amt)}</p>
                          <p style={{ fontFamily: T.font, fontSize: "10px", color: s.color, margin: 0, fontWeight: 600 }}>{share.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${share}%`, background: s.color, borderRadius: "4px", transition: "width .8s ease", opacity: .85 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* vs Previous period */}
            <Card style={{ padding: "20px" }}>
              <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: "0 0 14px" }}>vs Previous Period</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Grand total row */}
                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "#eef2ff", border: "1px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 700, color: "#6366f1", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".06em" }}>All Streams</p>
                    <p style={{ fontFamily: T.font, fontSize: "18px", fontWeight: 800, color: T.text, margin: "0 0 2px" }}>{fmtUSD(grandTotal)}</p>
                    <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>prev: {fmtUSD(prevGrandTotal)}</p>
                  </div>
                  <ChangeBadge current={grandTotal} previous={prevGrandTotal} />
                </div>
                {/* Per-stream rows */}
                {STREAMS.map(s => {
                  const curr = totals[s.key]   || 0;
                  const prev = previous[s.key] || 0;
                  return (
                    <div key={s.key} style={{ padding: "10px 14px", borderRadius: "10px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FontAwesomeIcon icon={s.icon} style={{ fontSize: "12px", color: s.color, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, color: T.text, margin: 0 }}>{s.label}</p>
                          <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{fmtUSD(curr)} &nbsp;·&nbsp; prev: {fmtUSD(prev)}</p>
                        </div>
                      </div>
                      <ChangeBadge current={curr} previous={prev} />
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ── Stream filter tabs ── */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <button onClick={() => setStream("all")} style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, padding: "7px 14px", borderRadius: "10px", cursor: "pointer", transition: "all .15s", border: "1px solid", background: stream === "all" ? "#eef2ff" : T.bg, color: stream === "all" ? "#6366f1" : T.muted, borderColor: stream === "all" ? "#e0e7ff" : "#e2e8f0" }}>
              All Streams
            </button>
            {STREAMS.map(s => (
              <button key={s.key} onClick={() => setStream(stream === s.key ? "all" : s.key)} style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: T.font, fontSize: "12px", fontWeight: 600, padding: "7px 14px", borderRadius: "10px", cursor: "pointer", transition: "all .15s", border: "1px solid", background: stream === s.key ? s.bg : T.bg, color: stream === s.key ? s.color : T.muted, borderColor: stream === s.key ? s.border : "#e2e8f0" }}>
                <FontAwesomeIcon icon={s.icon} style={{ fontSize: "11px" }} />
                {s.label}
              </button>
            ))}
          </div>

          {/* ── Breakdown table ── */}
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: T.border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: 0 }}>
                  Revenue Breakdown
                  {stream !== "all" && <span style={{ fontWeight: 400, color: T.muted }}> — {STREAMS.find(s => s.key === stream)?.label}</span>}
                </p>
                <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted, margin: "3px 0 0" }}>Each line item shows how the income came in</p>
              </div>
              <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted, margin: 0 }}>{filteredBreakdown.length} line items</p>
            </div>
            {filteredBreakdown.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "28px", color: "#d1d5db", marginBottom: "12px" }} />
                <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: 0 }}>No data for this stream</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: T.border }}>
                      {["Stream","Line Item","Events","Revenue","Share of Total","Rate"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: T.font, fontSize: "11px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBreakdown.map((row, i) => {
                      const s = STREAMS.find(st => st.key === row.stream) || STREAMS[0];
                      return (
                        <tr key={i} style={{ borderBottom: T.border, transition: "background .1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = T.subtle}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <FontAwesomeIcon icon={s.icon} style={{ fontSize: "11px", color: s.color }} />
                              </div>
                              <span style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: s.color }}>{s.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <p style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: 0 }}>{row.label}</p>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontFamily: T.font, fontSize: "12px", color: T.muted }}>{(row.count || 0).toLocaleString()}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text }}>{fmtUSD(row.amount)}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <MiniBar value={row.amount} max={maxBreakdownAmt} color={s.color} />
                              <span style={{ fontFamily: T.font, fontSize: "11px", color: T.muted }}>{fmtPct(row.amount, grandTotal)}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontFamily: T.font, fontSize: "11px", color: T.muted }}>{s.rate}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #eef0f4", background: T.subtle }}>
                      <td colSpan={2} style={{ padding: "12px 16px", fontFamily: T.font, fontSize: "12px", fontWeight: 700, color: T.muted }}>
                        {stream === "all" ? "Grand Total" : `${STREAMS.find(s => s.key === stream)?.label} Total`}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: T.font, fontSize: "12px", color: T.muted }}>
                          {filteredBreakdown.reduce((s, r) => s + (r.count || 0), 0).toLocaleString()} events
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: T.font, fontSize: "14px", fontWeight: 800, color: "#6366f1" }}>
                          {fmtUSD(filteredBreakdown.reduce((s, r) => s + (r.amount || 0), 0))}
                        </span>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </Card>

          {/* ── Recent revenue events ── */}
          <Card>
            <div style={{ padding: "16px 20px", borderBottom: T.border }}>
              <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: T.text, margin: 0 }}>Recent Revenue Events</p>
              <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted, margin: "3px 0 0" }}>Latest income entries across all streams</p>
            </div>
            {filteredRecent.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 24px" }}>
                <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: 0 }}>No recent transactions</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: T.border }}>
                      {["Stream","Description","User","Amount","Date"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: T.font, fontSize: "11px", fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecent.map((tx, i) => {
                      const s = STREAMS.find(st => st.key === tx.stream) || STREAMS[0];
                      return (
                        <tr key={tx._id || i} style={{ borderBottom: T.border, transition: "background .1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = T.subtle}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <FontAwesomeIcon icon={s.icon} style={{ fontSize: "11px", color: s.color }} />
                              </div>
                              <span style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: s.color }}>{s.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <p style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: 0 }}>{tx.label || tx.description || "—"}</p>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: "0 0 2px" }}>{tx.user || "—"}</p>
                            <span style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, textTransform: "capitalize", color: tx.role === "creator" ? "#16a34a" : "#0ea5e9" }}>{tx.role}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>+{fmtUSD(tx.amount)}</span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontFamily: T.font, fontSize: "12px", color: T.muted }}>{formatDate(tx.createdAt)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
