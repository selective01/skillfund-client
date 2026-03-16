import { useState, useEffect } from "react";
import { ShieldCheck, TrendingUp, AlertTriangle, Shield, ShieldAlert } from "lucide-react";
import api from "../../utils/api";

// ─── Config ──────────────────────────────────────────────────────────────────
const BAND_CONFIG = {
  "Elite Creator":   { color: "text-primary-400", bg: "bg-primary-500/20", border: "border-primary-500/30", icon: ShieldCheck   },
  "Trusted Creator": { color: "text-blue-400",    bg: "bg-blue-500/20",    border: "border-blue-500/30",    icon: Shield        },
  "Established":     { color: "text-yellow-400",  bg: "bg-yellow-500/20",  border: "border-yellow-500/30",  icon: TrendingUp    },
  "Developing":      { color: "text-orange-400",  bg: "bg-orange-500/20",  border: "border-orange-500/30",  icon: AlertTriangle },
  "High Risk":       { color: "text-red-400",      bg: "bg-red-500/20",     border: "border-red-500/30",     icon: ShieldAlert   },
};

// ─── Compact badge (used on cards, profile headers) ──────────────────────────
export function ScoreBadge({ creatorId, score: scoreProp }) {
  const [score, setScore] = useState(scoreProp || null);

  useEffect(() => {
    if (scoreProp || !creatorId) return;
    api.get(`/scores/${creatorId}`)
      .then((res) => setScore(res.data.score))
      .catch(() => {});
  }, [creatorId, scoreProp]);

  if (!score) return null;

  const cfg  = BAND_CONFIG[score.badge] || BAND_CONFIG["Developing"];
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={11} />
      {score.totalScore} · {score.badge}
    </span>
  );
}

// ─── Full score card (used on creator profile page and /score/:id page) ──────
export function ScoreCard({ creatorId }) {
  const [score, setScore]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creatorId) return;
    api.get(`/scores/${creatorId}`)
      .then((res) => setScore(res.data.score))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [creatorId]);

  if (loading) {
    return (
      <div className="card border border-dark-500 animate-pulse h-40" />
    );
  }

  if (!score) return null;

  const cfg  = BAND_CONFIG[score.badge] || BAND_CONFIG["Developing"];
  const Icon = cfg.icon;

  const bars = [
    { label: "On-time Reporting", value: score.reportingScore, max: 30 },
    { label: "Revenue Growth",    value: score.growthScore,    max: 25 },
    { label: "Milestone Rate",    value: score.milestoneScore, max: 20 },
    { label: "No Disputes",       value: score.disputeScore,   max: 15 },
    { label: "Investor Rating",   value: score.ratingScore,    max: 10 },
  ];

  return (
    <div className="card border border-dark-500 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1">
            SkillFund Score
          </p>
          <div className="flex items-center gap-3">
            <span className={`text-4xl font-bold ${cfg.color}`}>
              {score.totalScore}
            </span>
            <span className="text-dark-400 text-lg">/100</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border}`}>
          <Icon size={18} className={cfg.color} />
          <div>
            <p className={`text-sm font-semibold ${cfg.color}`}>{score.badge}</p>
            <p className="text-xs text-dark-400 capitalize">{score.riskLevel.replace("_", " ")} risk</p>
          </div>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-2.5">
        {bars.map((b) => {
          const pct = Math.round((b.value / b.max) * 100);
          return (
            <div key={b.label}>
              <div className="flex justify-between text-xs text-dark-400 mb-1">
                <span>{b.label}</span>
                <span className="text-dark-200">{b.value} / {b.max}</span>
              </div>
              <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${cfg.color.replace("text-", "bg-")}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <p className="text-xs text-dark-500">
        Last updated {score.lastCalculatedAt
          ? new Date(score.lastCalculatedAt).toLocaleDateString()
          : "—"}
      </p>
    </div>
  );
}
