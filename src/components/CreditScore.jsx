import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved, faChartLine, faTrophy,
  faCircleNotch, faArrowTrendUp, faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";
import api from "../utils/api";

// ── Badge config — mirrors scoreController getBandFromScore ───────────────────
const BADGE_CONFIG = {
  "Elite Creator":   { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.25)",  glow: "rgba(34,197,94,0.3)"  },
  "Trusted Creator": { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.25)", glow: "rgba(96,165,250,0.3)" },
  "Established":     { color: "#a78bfa", bg: "rgba(167,139,250,0.12)",border: "rgba(167,139,250,0.25)",glow: "rgba(167,139,250,0.3)"},
  "Developing":      { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.3)" },
  "High Risk":       { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.25)",  glow: "rgba(239,68,68,0.3)"  },
};

// Matches scoreController component keys + max values
const COMPONENTS = [
  { key: "reportingScore",  label: "Reporting Consistency", max: 30, weight: "30pts" },
  { key: "growthScore",     label: "Revenue Growth",        max: 25, weight: "25pts" },
  { key: "milestoneScore",  label: "Milestone Completion",  max: 20, weight: "20pts" },
  { key: "disputeScore",    label: "Dispute Record",        max: 15, weight: "15pts" },
  { key: "ratingScore",     label: "Payment Rate",          max: 10, weight: "10pts" },
];

const C = {
  bg: "#040806", card: "#070d08", border: "rgba(255,255,255,0.07)",
  text: "#f1f5f9", muted: "#9ca3af",
};

const STYLES = `
  @keyframes scoreIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scorePulse { 0%,100%{box-shadow:0 0 0 0 var(--glow,transparent)} 50%{box-shadow:0 0 20px 4px var(--glow,transparent)} }
  .score-in { animation: scoreIn .4s ease forwards; opacity:0; }
  .score-badge-pulse { animation: scorePulse 3s ease infinite; }
`;

// ── Radial ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, badge }) {
  const gc   = BADGE_CONFIG[badge] || BADGE_CONFIG["Developing"];
  const r    = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={gc.color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s ease", filter: `drop-shadow(0 0 6px ${gc.glow})` }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 32, color: gc.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 10, color: gc.color, marginTop: 2, textAlign: "center", maxWidth: 80, letterSpacing: ".04em" }}>{badge}</span>
      </div>
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ history, color }) {
  if (!history || history.length < 2) return null;
  const pts   = history.slice(-6);
  const max   = Math.max(...pts.map(p => p.score), 1);
  const min   = Math.min(...pts.map(p => p.score));
  const range = max - min || 1;
  const W = 80, H = 28;
  const points = pts.map((p, i) => `${(i / (pts.length - 1)) * W},${H - ((p.score - min) / range) * H}`).join(" ");
  const [lx, ly] = points.split(" ").pop().split(",");
  const up = pts[pts.length - 1].score >= pts[pts.length - 2].score;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width={W} height={H} style={{ overflow: "visible" }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lx} cy={ly} r="2.5" fill={color} />
      </svg>
      <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} style={{ fontSize: 11, color: up ? "#22c55e" : "#ef4444" }} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
// API response shape: { success, score: { totalScore, badge, riskLevel,
//   reportingScore, growthScore, milestoneScore, disputeScore, ratingScore,
//   totalMilestones, completedMilestones, totalReportingMonths, onTimeReports,
//   disputesAgainstCreator, lastCalculatedAt, history: [{month,year,score}] } }
export default function CreditScore({ creatorId, compact = false }) {
  const [scoreDoc, setScoreDoc] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!creatorId) return;
    api.get(`/scores/${creatorId}`)
      .then(res => setScoreDoc(res.data.score))
      .catch(() => setScoreDoc(null))
      .finally(() => setLoading(false));
  }, [creatorId]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: 20, color: "#22c55e" }} />
    </div>
  );
  if (!scoreDoc) return null;

  const badge = scoreDoc.badge || "Developing";
  const score = scoreDoc.totalScore ?? 50;
  const gc    = BADGE_CONFIG[badge] || BADGE_CONFIG["Developing"];

  // ── Compact badge ────────────────────────────────────────────────────────
  if (compact) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="score-badge-pulse" style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "3px 10px", borderRadius: 999,
          background: gc.bg, border: `1px solid ${gc.border}`, "--glow": gc.glow,
        }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: 9, color: gc.color }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 10, color: gc.color }}>{badge}</span>
          <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: gc.color, opacity: 0.8 }}>· {score}</span>
        </div>
      </>
    );
  }

  // ── Full card ────────────────────────────────────────────────────────────
  const riskLabel = (scoreDoc.riskLevel || "medium").replace(/_/g, " ");
  const updatedAt = scoreDoc.lastCalculatedAt
    ? new Date(scoreDoc.lastCalculatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : "today";

  return (
    <div className="score-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{STYLES}</style>

      {/* ── Header card ─── */}
      <div style={{
        background: "linear-gradient(135deg,#0a1f0c,#040806)",
        border: `1px solid ${gc.border}`, borderRadius: 20, padding: 20,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle,${gc.glow},transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <ScoreRing score={score} badge={badge} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: 11, color: gc.color }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 10, color: gc.color, textTransform: "uppercase", letterSpacing: ".08em" }}>SkillFund Credit Score</span>
            </div>
            <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "1.3rem", color: C.text, margin: "0 0 2px" }}>{badge}</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, margin: "0 0 10px" }}>
              Risk: <strong style={{ color: gc.color, textTransform: "capitalize" }}>{riskLabel}</strong>
              {" · "}Updated {updatedAt}
            </p>
            {scoreDoc.history?.length >= 2 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: C.muted }}>6mo trend</span>
                <Sparkline history={scoreDoc.history} color={gc.color} />
              </div>
            )}
          </div>
          {/* Quick stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 100 }}>
            {[
              { label: "Milestones",  value: `${scoreDoc.completedMilestones ?? 0}/${scoreDoc.totalMilestones ?? 0}` },
              { label: "Reports",     value: `${scoreDoc.onTimeReports ?? 0}/${scoreDoc.totalReportingMonths ?? 0}` },
              { label: "Disputes",    value: scoreDoc.disputesAgainstCreator ?? 0, warn: true },
            ].map(({ label, value, warn }) => (
              <div key={label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "7px 10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: 16, color: warn && Number(value) > 0 ? "#ef4444" : C.text, margin: 0 }}>{value}</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: C.muted, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Score breakdown ─── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 12, color: C.muted }} />
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", margin: 0 }}>Score Breakdown</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {COMPONENTS.map(({ key, label, max, weight }) => {
            const val      = scoreDoc[key] ?? 0;
            const pct      = Math.round((val / max) * 100);
            const barColor = pct >= 70 ? "#22c55e" : pct >= 40 ? "#f59e0b" : "#ef4444";
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.text }}>{label}</span>
                    <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 9, color: C.muted, background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 4 }}>{weight}</span>
                  </div>
                  <span style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 12, color: barColor }}>{val}/{max}</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 999, background: barColor, width: `${pct}%`, transition: "width 1s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tips ─── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <FontAwesomeIcon icon={faTrophy} style={{ fontSize: 11, color: "#f59e0b" }} />
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: ".08em", margin: 0 }}>How to improve</p>
        </div>
        {[
          "Report earnings every month without skipping a cycle",
          "Submit milestone proof on time and avoid investor disputes",
          "Grow your monthly income — consistent growth is rewarded",
          "Complete KYC and fully fill out your profile",
        ].map((tip, i) => (
          <p key={i} style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, margin: "0 0 4px", lineHeight: 1.6 }}>
            <span style={{ color: "#22c55e", fontWeight: 700 }}>{i + 1}.</span> {tip}
          </p>
        ))}
      </div>
    </div>
  );
}
