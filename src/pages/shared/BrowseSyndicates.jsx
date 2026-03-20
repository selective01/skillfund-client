import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faSliders, faUsers, faArrowTrendUp, faClock,
  faDollarSign, faPlus, faXmark, faFire, faLayerGroup,
  faChevronDown, faCircleNotch,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import { ScoreBadge } from "../../components/layout/ScoreBadge";

const CATEGORIES = ["all","fashion","carpentry","farming","photography","baking","mechanics","technology","hair","artisan","other"];
const SORT_OPTIONS = [
  { value: "newest",      label: "Newest First" },
  { value: "most_funded", label: "Most Funded" },
  { value: "highest_roi", label: "Highest ROI" },
  { value: "ending_soon", label: "Ending Soon" },
];
const CATEGORY_EMOJI = {
  fashion:"👗", carpentry:"🪚", farming:"🌾", photography:"📷",
  baking:"🍞", mechanics:"🔧", technology:"💻", hair:"✂️", artisan:"🎨", other:"⚡",
};

const CARD_THEMES = [
  { card: "var(--card-green)", border: "rgba(34,197,94,0.30)",  barColor: "#22c55e", statBg: "rgba(34,197,94,0.08)",  glow: "rgba(34,197,94,0.12)"  },
  { card: "var(--card-blue)", border: "rgba(59,130,246,0.35)", barColor: "#3b82f6", statBg: "rgba(59,130,246,0.08)", glow: "rgba(59,130,246,0.12)" },
  { card: "linear-gradient(135deg,#220f44,#180930)", border: "rgba(168,85,247,0.35)", barColor: "#a855f7", statBg: "rgba(168,85,247,0.08)", glow: "rgba(168,85,247,0.12)" },
  { card: "linear-gradient(135deg,#0f3d38,#092820)", border: "rgba(20,184,166,0.30)", barColor: "#14b8a6", statBg: "rgba(20,184,166,0.08)", glow: "rgba(20,184,166,0.12)" },
  { card: "linear-gradient(135deg,#3d0f22,#280918)", border: "rgba(244,63,94,0.35)",  barColor: "#f43f5e", statBg: "rgba(244,63,94,0.08)",  glow: "rgba(244,63,94,0.12)"  },
  { card: "linear-gradient(135deg,#3d2200,#2a1600)", border: "rgba(245,158,11,0.35)", barColor: "#f59e0b", statBg: "rgba(245,158,11,0.08)", glow: "rgba(245,158,11,0.12)" },
];

function SyndicateCard({ syndicate, onClick, index }) {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const fundingPct  = Math.min(Math.round((syndicate.amountRaised / syndicate.fundingGoal) * 100), 100);
  const slotsLeft   = syndicate.maxSlots - (syndicate.investors?.length || 0);
  const creator     = syndicate.creatorId;
  const isHot       = fundingPct >= 75;
  const isAlmostFull = slotsLeft <= 2;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden"
      style={{ background: theme.card, border: `1px solid ${theme.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 12px ${theme.glow}, 0 2px 8px rgba(0,0,0,0.15)`; e.currentTarget.style.borderColor = theme.barColor + "55"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.12)"; e.currentTarget.style.borderColor = theme.border; }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${theme.barColor}, transparent)` }} />

      {isHot && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "rgba(245,158,11,0.30)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontFamily: "'Syne',sans-serif" }}>
          <FontAwesomeIcon icon={faFire} style={{ fontSize: "9px" }} /> HOT
        </div>
      )}

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: theme.statBg, border: `1px solid ${theme.barColor}22` }}>
              {CATEGORY_EMOJI[syndicate.skillCategory] || "⚡"}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm leading-tight truncate" style={{ fontFamily: "'Syne',sans-serif" }}>{syndicate.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>by {creator?.name}</p>
            </div>
          </div>
          <ScoreBadge creatorId={creator?._id} />
        </div>

        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#6b7280" }}>{syndicate.story}</p>

        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${fundingPct}%`, background: `linear-gradient(90deg, ${theme.barColor}99, ${theme.barColor})` }} />
          </div>
          <div className="flex justify-between text-xs" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>
            <span style={{ color: theme.barColor }}>{fundingPct}% funded</span>
            <span style={{ color: "#9ca3af" }}>${syndicate.amountRaised.toLocaleString()} / ${syndicate.fundingGoal.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: faArrowTrendUp, value: `${syndicate.profitSharePercentage}%`, label: "Share",    color: "#22c55e" },
            { icon: faClock,        value: `${syndicate.duration}mo`,             label: "Duration", color: "#3b82f6" },
            { icon: faUsers,        value: `${slotsLeft} left`,                   label: "Slots",    color: isAlmostFull ? "#f43f5e" : "#a855f7" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2.5 text-center" style={{ background: theme.statBg, border: `1px solid ${theme.barColor}15` }}>
              <FontAwesomeIcon icon={s.icon} style={{ fontSize: "11px", color: s.color, display: "block", margin: "0 auto 4px" }} />
              <p className="font-black text-white text-xs" style={{ fontFamily: "'Fraunces',serif" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "#9ca3af", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.18)" }}>
          <p className="text-xs" style={{ color: "#9ca3af" }}>
            Min. <span className="font-bold" style={{ color: "#9ca3af" }}>${syndicate.minInvestment.toLocaleString()}</span>
          </p>
          {isAlmostFull && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#f43f5e", fontFamily: "'Syne',sans-serif" }}>
              {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 space-y-4 animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl" style={{ background: "var(--border)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded-full w-3/4" style={{ background: "var(--border)" }} />
          <div className="h-2 rounded-full w-1/2" style={{ background: "var(--border)" }} />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 rounded-full" style={{ background: "var(--border)" }} />
        <div className="h-2 rounded-full w-4/5" style={{ background: "var(--border)" }} />
      </div>
      <div className="h-1.5 rounded-full" style={{ background: "var(--border)" }} />
      <div className="grid grid-cols-3 gap-2">
        {[0,1,2].map(i => <div key={i} className="h-14 rounded-xl" style={{ background: "var(--border)" }} />)}
      </div>
    </div>
  );
}

export default function BrowseSyndicates() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [syndicates, setSyndicates]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal]             = useState(0);
  const [hasMore, setHasMore]         = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const pageRef     = useRef(1);
  const sentinelRef = useRef(null);

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState("newest");
  const [minGoal,  setMinGoal]  = useState("");
  const [maxGoal,  setMaxGoal]  = useState("");

  const isCreator  = user?.role === "creator";
  const hasFilters = search || category !== "all" || minGoal || maxGoal;

  const fetchSyndicates = useCallback(async ({ reset = false } = {}) => {
    const currentPage = reset ? 1 : pageRef.current;
    if (reset) { setLoading(true); } else { setLoadingMore(true); }
    try {
      const params = new URLSearchParams({ page: currentPage, sort, limit: 12 });
      if (search)             params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (minGoal)            params.set("minGoal", minGoal);
      if (maxGoal)            params.set("maxGoal", maxGoal);
      const res        = await api.get(`/syndicates?${params}`);
      const incoming   = res.data.syndicates || [];
      const totalCount = res.data.total || 0;
      setSyndicates(prev => reset ? incoming : [...prev, ...incoming]);
      setTotal(totalCount);
      setHasMore(incoming.length === 12);
      if (!reset) pageRef.current = currentPage + 1;
    } catch {
      toast.error("Failed to load syndicates");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, category, sort, minGoal, maxGoal]);

  useEffect(() => {
    pageRef.current = 1;
    setHasMore(true);
    fetchSyndicates({ reset: true });
  }, [fetchSyndicates]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
        pageRef.current += 1;
        fetchSyndicates({ reset: false });
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchSyndicates]);

  const clearFilters = () => { setSearch(""); setCategory("all"); setSort("newest"); setMinGoal(""); setMaxGoal(""); };

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .syn-in    { animation: fadeUp 0.45s ease forwards; opacity: 0; }
        .slide-down { animation: slideDown 0.25s ease forwards; }
        .syn-search::placeholder { color: #5a8a63; }
        .syn-search:focus { outline: none; border-color: rgba(34,197,94,0.4) !important; box-shadow: 0 0 0 3px rgba(34,197,94,0.08); }
        .syn-input:focus  { outline: none; border-color: rgba(34,197,94,0.4) !important; }
        .syn-select { -webkit-appearance: none; appearance: none; }
        .cat-pill { transition: all 0.15s ease; }
      `}</style>

      {/* ── Header Banner ── */}
      <div className="syn-in mb-6" style={{ animationDelay: "0s" }}>
        <div className="relative rounded-3xl p-6 overflow-hidden" style={{ background: "linear-gradient(135deg,var(--card-blue,#0f2244) 0%,var(--bg) 100%)", border: "1px solid rgba(59,130,246,0.35)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)", filter: "blur(24px)" }} />
          <div className="absolute inset-0 pointer-events-none rounded-3xl" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faLayerGroup} style={{ color: "#3b82f6", fontSize: "12px" }} />
                <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "#3b82f6" }}>SYNDICATE CAMPAIGNS</span>
              </div>
              <h1 className="font-black text-white mb-1" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}>Pool Capital. Share Returns.</h1>
              <p className="text-sm" style={{ color: "#6b7280" }}>Join other investors to fund skilled creators — lower risk, bigger reach.</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {!loading && (
                <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.35)" }}>
                  <p className="font-black text-white text-lg leading-none mb-0.5" style={{ fontFamily: "'Fraunces',serif" }}>{total}</p>
                  <p className="text-xs font-bold" style={{ fontFamily: "'Syne',sans-serif", color: "#3b82f6" }}>ACTIVE</p>
                </div>
              )}
              {isCreator && (
                <button onClick={() => navigate("/profile", { state: { openCreateSyndicate: true } })} className="flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-xl transition-all hover:scale-105" style={{ fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", boxShadow: "0 2px 8px rgba(59,130,246,0.2)" }}>
                  <FontAwesomeIcon icon={faPlus} style={{ fontSize: "12px" }} /> Create Campaign
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search + Controls ── */}
      <div className="syn-in flex flex-wrap gap-3 mb-4" style={{ animationDelay: ".08s" }}>
        <div className="relative flex-1 min-w-52">
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#5a8a63", fontSize: "12px", pointerEvents: "none" }} />
          <input
            className="syn-search w-full text-sm text-white rounded-xl px-4 py-3 transition-all"
            style={{ paddingLeft: "2.2rem", background: "var(--bg-card)", border: "1px solid var(--border)", fontFamily: "'DM Sans',sans-serif" }}
            placeholder="Search campaigns, skills, creators..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="syn-select syn-input text-sm text-white rounded-xl px-4 py-3 pr-9 cursor-pointer"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "10px", pointerEvents: "none" }} />
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 font-bold text-sm px-4 py-3 rounded-xl transition-all"
          style={{ fontFamily: "'Syne',sans-serif", background: showFilters ? "rgba(34,197,94,0.1)" : "var(--bg-card)", border: showFilters ? "1px solid rgba(34,197,94,0.35)" : "1px solid var(--border)", color: showFilters ? "#22c55e" : "#6b7280" }}
        >
          <FontAwesomeIcon icon={faSliders} style={{ fontSize: "12px" }} />
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />}
        </button>
      </div>

      {/* ── Filter Panel ── */}
      {showFilters && (
        <div className="slide-down rounded-2xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="sm:col-span-2">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ fontFamily: "'Syne',sans-serif", color: "#9ca3af" }}>CATEGORY</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className="cat-pill text-xs px-3 py-1.5 rounded-full font-bold capitalize"
                  style={{ fontFamily: "'Syne',sans-serif", background: category === c ? "rgba(34,197,94,0.30)" : "var(--border)", border: category === c ? "1px solid rgba(34,197,94,0.4)" : "1px solid var(--border)", color: category === c ? "#22c55e" : "#6b7280" }}
                >
                  {c === "all" ? "All" : `${CATEGORY_EMOJI[c]} ${c}`}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "#9ca3af" }}>FUNDING GOAL</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faDollarSign} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "10px", pointerEvents: "none" }} />
                <input type="number" className="syn-input w-full text-sm text-white rounded-xl py-2.5 transition-all" style={{ paddingLeft: "1.4rem", paddingRight: "8px", background: "var(--bg-input)", border: "1px solid var(--border)", fontFamily: "'DM Sans',sans-serif" }} placeholder="Min" value={minGoal} onChange={e => setMinGoal(e.target.value)} />
              </div>
              <div className="relative flex-1">
                <FontAwesomeIcon icon={faDollarSign} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "10px", pointerEvents: "none" }} />
                <input type="number" className="syn-input w-full text-sm text-white rounded-xl py-2.5 transition-all" style={{ paddingLeft: "1.4rem", paddingRight: "8px", background: "var(--bg-input)", border: "1px solid var(--border)", fontFamily: "'DM Sans',sans-serif" }} placeholder="Max" value={maxGoal} onChange={e => setMaxGoal(e.target.value)} />
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs font-bold transition-colors" style={{ fontFamily: "'Syne',sans-serif", color: "#9ca3af" }}
                onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"} onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: "11px" }} /> Clear all filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && (
        <p className="text-xs font-bold tracking-widest mb-4" style={{ fontFamily: "'Syne',sans-serif", color: "#5a8a63" }}>
          {total} CAMPAIGN{total !== 1 ? "S" : ""} FOUND
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : syndicates.length === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.30)" }}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: "24px", color: "#3b82f6" }} />
          </div>
          <p className="font-black text-white text-lg mb-1" style={{ fontFamily: "'Fraunces',serif" }}>No campaigns found</p>
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>{hasFilters ? "Try adjusting your filters" : "Check back soon — new campaigns launch regularly"}</p>
          {isCreator && (
            <button onClick={() => navigate("/profile", { state: { openCreateSyndicate: true } })} className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-105" style={{ fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff" }}>
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: "12px" }} /> Create the First Campaign
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {syndicates.map((s, i) => (
            <div key={s._id} className="syn-in" style={{ animationDelay: `${0.05 * (i % 6)}s` }}>
              <SyndicateCard syndicate={s} index={i} onClick={() => navigate(`/syndicates/${s._id}`)} />
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-6">
          <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "20px", color: "#22c55e" }} />
        </div>
      )}

      {!hasMore && syndicates.length > 0 && (
        <p className="text-center py-6 text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "#5a8a63" }}>
          ✦ ALL {total} CAMPAIGNS LOADED ✦
        </p>
      )}
    </div>
  );
}
