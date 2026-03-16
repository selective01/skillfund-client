// components/MatchRecommendations.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWandMagicSparkles, faCircleCheck, faArrowRight,
  faSliders, faXmark, faChevronDown,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../store/authStore";
import api from "../utils/api";

const SKILL_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "fashion",     label: "Fashion & Tailoring" },
  { value: "carpentry",   label: "Carpentry & Woodwork" },
  { value: "farming",     label: "Farming & Agriculture" },
  { value: "photography", label: "Photography & Video" },
  { value: "baking",      label: "Baking & Pastry" },
  { value: "mechanics",   label: "Mechanics & Auto" },
  { value: "technology",  label: "Technology & IT" },
  { value: "hair",        label: "Hair & Beauty" },
  { value: "artisan",     label: "Artisan & Crafts" },
  { value: "other",       label: "Other" },
];

const SCORE_STYLE = (score) => {
  if (score >= 80) return { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",  color: "#22c55e",  label: "Excellent" };
  if (score >= 60) return { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", color: "#f59e0b",  label: "Good" };
  return               { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.3)",  color: "#818cf8",  label: "Fair" };
};

const CATEGORY_EMOJI = {
  fashion: "👗", carpentry: "🪵", farming: "🌾", photography: "📸",
  baking: "🎂", mechanics: "🔧", technology: "💻", hair: "✂️",
  artisan: "🎨", other: "⚡",
};

export default function MatchRecommendations() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [matches,     setMatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [category,    setCategory]    = useState("");
  const [maxBudget,   setMaxBudget]   = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedMsg,    setSavedMsg]    = useState(false);

  const fetchMatches = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {};
      if (category)  params.category  = category;
      if (maxBudget) params.maxBudget = maxBudget;
      const res = await api.get("/match/creators", { params });
      setMatches(res.data.matches ?? []);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [token, category, maxBudget]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const savePreferences = async () => {
    setSavingPrefs(true);
    try {
      await api.put("/match/preferences", {
        preferredCategories: category ? [category] : [],
        maxBudget: maxBudget ? Number(maxBudget) : undefined,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch { /* silent */ }
    finally { setSavingPrefs(false); }
  };

  return (
    <section style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        .mr-field { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:12px; padding:9px 14px; font-size:13px; outline:none; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .mr-field:focus { border-color:rgba(34,197,94,0.35); }
        .mr-field::placeholder { color:#5a8a63; }
        .mr-select { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:12px; padding:9px 32px 9px 12px; font-size:13px; outline:none; appearance:none; font-family:'DM Sans',sans-serif; cursor:pointer; }
        .mr-select option { background:#070d08; }
        .mr-card { background:#070d08; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px; transition:border-color .15s, box-shadow .15s; }
        .mr-card:hover { border-color:rgba(34,197,94,0.25); box-shadow:0 8px 32px rgba(0,0,0,0.4); }
        .mr-pill { font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; font-family:'Syne',sans-serif; }
        .mr-view-btn { display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 0; border-radius:10px; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; font-family:'Syne',sans-serif; font-weight:900; font-size:12px; border:none; cursor:pointer; width:100%; transition:opacity .15s; margin-top:auto; }
        .mr-view-btn:hover { opacity:.85; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: "13px", color: "#000" }} />
          </div>
          <div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "15px", color: "#fff", margin: 0 }}>Recommended for You</p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#9ca3af", margin: 0 }}>Matched by skill, budget &amp; profile quality</p>
          </div>
        </div>
        <button
          onClick={() => setFilterOpen(v => !v)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 14px", borderRadius: "10px", cursor: "pointer",
            fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "12px",
            background: filterOpen ? "rgba(34,197,94,0.1)" : "#070d08",
            color: filterOpen ? "#22c55e" : "#9ca3af",
            border: `1px solid ${filterOpen ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <FontAwesomeIcon icon={faSliders} style={{ fontSize: "11px" }} /> Filter
        </button>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div style={{ marginBottom: "16px", padding: "16px", borderRadius: "16px", background: "#070d08", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, fontFamily: "'Syne',sans-serif", textTransform: "uppercase", letterSpacing: ".05em", color: "#9ca3af", marginBottom: "5px" }}>Category</label>
              <div style={{ position: "relative" }}>
                <select value={category} onChange={e => setCategory(e.target.value)} className="mr-select">
                  {SKILL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "10px", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "10px", fontWeight: 700, fontFamily: "'Syne',sans-serif", textTransform: "uppercase", letterSpacing: ".05em", color: "#9ca3af", marginBottom: "5px" }}>Max Budget (USD)</label>
              <input
                type="number" min="0" placeholder="e.g. 500"
                value={maxBudget} onChange={e => setMaxBudget(e.target.value)}
                className="mr-field" style={{ width: "130px" }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={savePreferences} disabled={savingPrefs}
                style={{ padding: "9px 16px", borderRadius: "10px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "12px", border: "none", cursor: "pointer" }}
              >
                {savedMsg ? "✓ Saved!" : savingPrefs ? "Saving…" : "Save Preferences"}
              </button>
              <button
                onClick={() => { setCategory(""); setMaxBudget(""); }}
                style={{ padding: "9px 12px", borderRadius: "10px", background: "#0a1209", color: "#9ca3af", fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "12px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div style={{ width: "28px", height: "28px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#22c55e", borderRadius: "50%", animation: "mrSpin .7s linear infinite" }} />
          <style>{`@keyframes mrSpin { to { transform:rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Empty */}
      {!loading && matches.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", borderRadius: "16px", background: "#070d08", border: "1px dashed rgba(34,197,94,0.2)" }}>
          <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: "28px", color: "#5a8a63", marginBottom: "10px" }} />
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", color: "#9ca3af", margin: "0 0 4px" }}>No matches found</p>
          <p style={{ fontSize: "12px", color: "#5a8a63", margin: 0 }}>Try adjusting your filters or budget</p>
        </div>
      )}

      {/* Cards */}
      {!loading && matches.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
          {matches.map((creator) => {
            const scoreStyle   = SCORE_STYLE(creator.matchScore);
            const categoryData = SKILL_CATEGORIES.find(c => c.value === creator.skill);
            const emoji        = CATEGORY_EMOJI[creator.skill] ?? "⚡";
            const initials     = (creator.name ?? "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

            return (
              <div key={creator._id} className="mr-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                {/* Top row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", overflow: "hidden", border: "2px solid rgba(34,197,94,0.2)", flexShrink: 0 }}>
                    {creator.avatar
                      ? <img src={creator.avatar} alt={creator.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "16px", color: "#000" }}>{initials}</div>
                    }
                  </div>
                  <span className="mr-pill" style={{ background: scoreStyle.bg, border: `1px solid ${scoreStyle.border}`, color: scoreStyle.color }}>
                    {creator.matchScore}% · {scoreStyle.label}
                  </span>
                </div>

                {/* Name + skill */}
                <div>
                  <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "14px", color: "#fff", margin: "0 0 2px" }}>{creator.name}</p>
                  <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#22c55e", fontWeight: 600, margin: 0 }}>
                    {emoji} {categoryData?.label ?? creator.skill}
                  </p>
                </div>

                {/* Bio */}
                {creator.bio && (
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {creator.bio}
                  </p>
                )}

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {creator.fundingGoal > 0 && (
                    <div style={{ padding: "8px 10px", borderRadius: "10px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                        <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "9px", color: "#22c55e" }} />
                        <span style={{ fontSize: "10px", color: "#9ca3af" }}>Goal</span>
                      </div>
                      <p style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "13px", color: "#fff", margin: 0 }}>
                        ${creator.fundingGoal.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {creator.kycStatus === "approved" && (
                    <div style={{ padding: "8px 10px", borderRadius: "10px", background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", display: "flex", alignItems: "center", gap: "5px" }}>
                      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: "#22c55e" }} />
                      <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "11px", fontWeight: 700, color: "#22c55e" }}>KYC ✓</span>
                    </div>
                  )}
                </div>

                {/* Match breakdown pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {creator.matchBreakdown?.categoryMatch > 0 && (
                    <span className="mr-pill" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>Category ✓</span>
                  )}
                  {creator.matchBreakdown?.budgetFit > 0 && (
                    <span className="mr-pill" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80" }}>Budget ✓</span>
                  )}
                  {creator.matchBreakdown?.profileComplete > 0 && (
                    <span className="mr-pill" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>Profile ✓</span>
                  )}
                  {creator.matchBreakdown?.kycVerified > 0 && (
                    <span className="mr-pill" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>KYC ✓</span>
                  )}
                </div>

                {/* CTA */}
                <button className="mr-view-btn" onClick={() => navigate(`/users/${creator._id}`)}>
                  View Profile <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "10px" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
