import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useThemeStore from "../../store/useThemeStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faSliders, faLocationDot, faArrowTrendUp, faUsers,
  faCircleCheck, faXmark, faChevronDown, faWallet, faArrowUpRightFromSquare,
  faCircleNotch, faUserPlus, faMessage, faBolt, faShirt, faHammer, faLeaf,
  faCamera, faCookieBite, faWrench, faLaptopCode, faCut, faPaintBrush,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import { Helmet } from "react-helmet-async";

const MatchRecommendations = lazy(() =>
  import("../../components/MatchRecommendations").catch(() => ({ default: () => null }))
);

const SKILL_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "fashion", label: "Fashion & Tailoring" },
  { value: "carpentry", label: "Carpentry & Woodwork" },
  { value: "farming", label: "Farming & Agriculture" },
  { value: "photography", label: "Photography & Video" },
  { value: "baking", label: "Baking & Pastry" },
  { value: "mechanics", label: "Mechanics & Auto" },
  { value: "technology", label: "Technology & IT" },
  { value: "hair", label: "Hair & Beauty" },
  { value: "artisan", label: "Artisan & Crafts" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest First"      },
  { value: "mostFunded",  label: "Most Funded"       },
  { value: "goalAsc",     label: "Goal: Low to High" },
  { value: "goalDesc",    label: "Goal: High to Low" },
  { value: "profitShare", label: "Best Profit Share" },
  { value: "score",       label: "Highest Trust Score" },
];

const CATEGORY_EMOJI = {
  fashion: faShirt, carpentry: faHammer, farming: faLeaf,
  photography: faCamera, baking: faCookieBite, mechanics: faWrench,
  technology: faLaptopCode, hair: faCut, artisan: faPaintBrush, other: faBolt,
};

const CARD_COLORS_DARK = [
  "linear-gradient(135deg,#0f2e10,#091e09)",
  "linear-gradient(135deg,#0f2244,#091830)",
  "linear-gradient(135deg,#220f44,#180930)",
  "linear-gradient(135deg,#0f3d38,#092820)",
  "linear-gradient(135deg,#3d0f22,#280918)",
  "linear-gradient(135deg,#3d2200,#2a1600)",
];

const CARD_COLORS_LIGHT = [
  "linear-gradient(135deg,#f0fdf4,#dcfce7)",
  "linear-gradient(135deg,#eff6ff,#dbeafe)",
  "linear-gradient(135deg,#f5f3ff,#ede9fe)",
  "linear-gradient(135deg,#f0fdfa,#ccfbf1)",
  "linear-gradient(135deg,#fff1f2,#ffe4e6)",
  "linear-gradient(135deg,#fffbeb,#fef3c7)",
];

const CARD_LIGHT_TEXT = [
  "#0a2e0c", "#1e3a5f", "#3b1f6e", "#0f3d38", "#5e1a2a", "#5a3a00"
];


const SF_URL = "https://skillfund-client.vercel.app";

export default function BrowseCreators() {
  const _theme = useThemeStore((s) => s.theme);
  const isLight = _theme === "light";
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minGoal, setMinGoal] = useState("");
  const [maxGoal, setMaxGoal] = useState("");
  const [minScore, setMinScore] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [acceptingOnly, setAcceptingOnly] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState({});

  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);

  const fetchCreators = useCallback(async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : pageRef.current;
    if (resetPage) setPage(1);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage);
      params.set("limit", 12);
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (sortBy) params.set("sortBy", sortBy);
      if (minGoal) params.set("minFunding", minGoal);
      if (maxGoal) params.set("maxFunding", maxGoal);
      if (minScore) params.set("minScore", minScore);
      if (verifiedOnly) params.set("verified", "true");
      if (acceptingOnly) params.set("accepting", "true");
      const res = await api.get(`/profiles/browse/creators?${params.toString()}`);
      setCreators(res.data.profiles || res.data.creators || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load creators");
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, sortBy, minGoal, maxGoal, minScore, verifiedOnly, acceptingOnly]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCreators(true), 400);
    return () => clearTimeout(timer);
  }, [fetchCreators]);

  useEffect(() => {
    fetchCreators(false);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async (creatorId, e) => {
    e.stopPropagation();
    if (user?.role !== "investor") { toast.error("Only investors can connect with creators"); return; }
    setActionLoading(prev => ({ ...prev, [`connect_${creatorId}`]: true }));
    try {
      await api.post("/connections/request", { receiverId: creatorId });
      toast.success("Connection request sent!");
      setCreators(prev => prev.map(c =>
        c._id === creatorId || c.userId === creatorId ? { ...c, connectionStatus: "pending" } : c
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setActionLoading(prev => ({ ...prev, [`connect_${creatorId}`]: false }));
    }
  };

  const handleInvest = (creator, e) => {
    e.stopPropagation();
    if (user?.role !== "investor") { toast.error("Only investors can invest"); return; }
    const id = creator._id || creator.userId;
    navigate(`/campaign/${id}`);
  };

  const handleMessage = (creatorId, e) => {
    e.stopPropagation();
    navigate(`/messages?userId=${creatorId}`);
  };

  const clearFilters = () => {
    setSearch(""); setCategory(""); setSortBy("newest");
    setMinGoal(""); setMaxGoal(""); setMinScore(""); setVerifiedOnly(false); setAcceptingOnly(true);
  };

  const hasActiveFilters = search || category || minGoal || maxGoal || minScore || verifiedOnly || !acceptingOnly;

  const selectStyle = {
    background: isLight ? "#f0fdf4" : "#070d08", border: `1px solid ${isLight ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.2)"}`, color: isLight ? "#0a1a0c" : "#ffffff",
    borderRadius: "12px", padding: "10px 36px 10px 14px", fontSize: "14px",
    outline: "none", width: "100%", appearance: "none", WebkitAppearance: "none",
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <>
      <Helmet>
        <title>Browse Creators — SkillFund</title>
        <meta name="description" content="Discover skilled African creators looking for investment. Filter by industry, funding goal, and credit score. Invest with milestone-protected escrow." />
        <meta property="og:title" content="Browse Creators — SkillFund" />
        <meta property="og:description" content="Discover skilled African creators looking for investment. Filter by industry, funding goal, and credit score." />
        <meta property="og:url" content={`${SF_URL}/browse`} />
        <link rel="canonical" href={`${SF_URL}/browse`} />
      </Helmet>
      <div className="space-y-6">
      <style>{`
        .browse-input { background:var(--sf-bg-card,#070d08); border:1px solid var(--sf-border,rgba(255,255,255,0.1)); color:var(--sf-text-primary,#ffffff); border-radius:12px; padding:10px 14px; font-size:14px; outline:none; width:100%; font-family:'Inter', sans-serif; transition:border-color .2s; }
        .browse-input:focus { border-color:rgba(34,197,94,0.4); }
        .browse-input::placeholder { color:#5a8a63; }
        .cat-pill { flex-shrink:0; padding:6px 14px; border-radius:999px; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; border:1px solid var(--sf-border,rgba(255,255,255,0.1)); background:var(--sf-bg-card,#070d08); color:var(--sf-text-muted,#9ca3af); font-family:'Inter', sans-serif; white-space:nowrap; }
        .cat-pill:hover { border-color:rgba(34,197,94,0.3); color:#9ca3af; }
        .cat-pill.active { background:linear-gradient(135deg,#22c55e,#16a34a); border-color:transparent; color:#000; }
        .page-btn { width:36px; height:36px; border-radius:10px; font-size:13px; font-weight:700; transition:all .15s; border:1px solid var(--sf-border,rgba(255,255,255,0.1)); background:var(--sf-bg-card,#070d08); color:var(--sf-text-muted,#9ca3af); font-family:'Inter', sans-serif; }
        .page-btn:hover:not(:disabled) { border-color:rgba(34,197,94,0.3); color:#ffffff; }
        .page-btn.active { background:linear-gradient(135deg,#22c55e,#16a34a); border-color:transparent; color:#000; }
        .page-btn:disabled { opacity:0.3; cursor:not-allowed; }
        select option { background:#070d08; color:#ffffff; }
      `}</style>

      {/* ── AI Match Recommendations (investors only) ── */}
      {user?.role === "investor" && (
        <div className="mb-2">
          <Suspense fallback={null}>
            <MatchRecommendations />
          </Suspense>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ fontFamily: "'Inter', sans-serif", color: "#22c55e" }}>DISCOVER</p>
            <h2 className="font-black" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(1.5rem,2.5vw,2rem)", color: "var(--sf-text-primary,#f1f5f9)" }}>Browse Creators</h2>
            <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>
              {loading ? "Loading..." : <><span className="font-semibold" style={{ color: "var(--sf-text-primary,#f1f5f9)" }}>{total}</span> skilled creators looking for investors</>}
            </p>
          </div>
          {user?.role === "creator" && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "'Inter', sans-serif" }}>
              Switch to investor to invest in creators
            </div>
          )}
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#5a8a63", fontSize: "13px", pointerEvents: "none" }} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, skill, or location..."
            className="browse-input"
            style={{ paddingLeft: "38px", paddingRight: search ? "38px" : "14px" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: "13px" }} />
            </button>
          )}
        </div>
        <div className="relative" style={{ minWidth: "180px" }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
            {SKILL_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "11px", pointerEvents: "none" }} />
        </div>
        <div className="relative" style={{ minWidth: "180px" }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "11px", pointerEvents: "none" }} />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0"
          style={{
            fontFamily: "'Inter', sans-serif",
            background: showFilters || hasActiveFilters ? "rgba(34,197,94,0.1)" : isLight ? "#ffffff" : "#070d08",
            border: `1px solid ${showFilters || hasActiveFilters ? "rgba(34,197,94,0.35)" : isLight ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.2)"}`,
            color: showFilters || hasActiveFilters ? "#22c55e" : isLight ? "#4b5563" : "#9ca3af",
          }}
        >
          <FontAwesomeIcon icon={faSliders} style={{ fontSize: "13px" }} /> Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: isLight ? "#ffffff" : "#070d08", border: `1px solid ${isLight ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)"}` }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-sm" style={{ fontFamily: "'Inter', sans-serif", color: "var(--sf-text-primary,#f1f5f9)" }}>Advanced Filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-bold" style={{ color: "#ef4444", fontFamily: "'Inter', sans-serif" }}>
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: "11px" }} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 tracking-widest" style={{ fontFamily: "'Inter', sans-serif", color: "#9ca3af" }}>MIN GOAL ($)</label>
              <input type="number" value={minGoal} onChange={e => setMinGoal(e.target.value)} placeholder="0" className="browse-input" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 tracking-widest" style={{ fontFamily: "'Inter', sans-serif", color: "#9ca3af" }}>MAX GOAL ($)</label>
              <input type="number" value={maxGoal} onChange={e => setMaxGoal(e.target.value)} placeholder="Any" className="browse-input" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 tracking-widest" style={{ fontFamily: "'Inter', sans-serif", color: "#9ca3af" }}>MIN TRUST SCORE</label>
              <select value={minScore} onChange={e => setMinScore(e.target.value)} style={selectStyle}>
                <option value="">Any Score</option>
                <option value="40">40+ (Developing)</option>
                <option value="55">55+ (Established)</option>
                <option value="70">70+ (Trusted — Low Risk)</option>
                <option value="85">85+ (Elite Only)</option>
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: isLight ? "#f0fdf4" : "#0a1209", border: `1px solid ${isLight ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)"}` }}>
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="w-4 h-4 accent-green-500" />
                <span className="text-sm" style={{ color: "#9ca3af" }}>Verified only</span>
                <FontAwesomeIcon icon={faCircleCheck} className="ml-auto" style={{ fontSize: "12px", color: "#22c55e" }} />
              </label>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: isLight ? "#f0fdf4" : "#0a1209", border: `1px solid ${isLight ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.1)"}` }}>
                <input type="checkbox" checked={acceptingOnly} onChange={e => setAcceptingOnly(e.target.checked)} className="w-4 h-4 accent-green-500" />
                <span className="text-sm" style={{ color: "#9ca3af" }}>Accepting investments</span>
                <FontAwesomeIcon icon={faArrowTrendUp} className="ml-auto" style={{ fontSize: "12px", color: "#22c55e" }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button onClick={() => setCategory("")} className={`cat-pill ${category === "" ? "active" : ""}`}>All</button>
        {SKILL_CATEGORIES.slice(1).map(cat => (
          <button key={cat.value} onClick={() => setCategory(cat.value === category ? "" : cat.value)} className={`cat-pill ${category === cat.value ? "active" : ""}`}>
            <FontAwesomeIcon icon={CATEGORY_EMOJI[cat.value] || faBolt} style={{ fontSize:"11px", marginRight:"4px" }} />{cat.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <CreatorsGridSkeleton />
      ) : creators.length === 0 ? (
        <EmptyState onClear={clearFilters} hasFilters={!!hasActiveFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {creators.map((creator, idx) => (
              <CreatorCard
                key={creator._id || creator.userId}
                creator={creator}
                currentUser={user}
                onConnect={handleConnect}
                onInvest={handleInvest}
                onMessage={handleMessage}
                actionLoading={actionLoading}
                cardColor={isLight ? CARD_COLORS_LIGHT[idx % CARD_COLORS_LIGHT.length] : CARD_COLORS_DARK[idx % CARD_COLORS_DARK.length]}
                colorIdx={idx % CARD_COLORS_LIGHT.length}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn" style={{ width: "auto", padding: "0 14px" }}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`page-btn ${p === page ? "active" : ""}`}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn" style={{ width: "auto", padding: "0 14px" }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ creator, currentUser, onConnect, onInvest, onMessage, actionLoading, cardColor, colorIdx = 0 }) {
  const _t = useThemeStore((s) => s.theme); const isLight = _t === "light";
  const cardText   = isLight ? CARD_LIGHT_TEXT[colorIdx] : "#ffffff";
  const cardMuted  = isLight ? CARD_LIGHT_TEXT[colorIdx] : "rgba(255,255,255,0.5)";
  const cardDim    = isLight ? CARD_LIGHT_TEXT[colorIdx] : "rgba(255,255,255,0.4)";
  const cardBorder = isLight ? `${CARD_LIGHT_TEXT[colorIdx]}25` : "rgba(255,255,255,0.06)";
  const cardStatBg = isLight ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.25)";
  const cardStatBorder = isLight ? `${CARD_LIGHT_TEXT[colorIdx]}15` : "rgba(255,255,255,0.05)";
  const navigate = useNavigate();
  const id = creator.userId?._id || creator.userId || creator._id;
  const name = creator.name || creator.user?.name || "Creator";
  const avatar = creator.avatar || creator.user?.avatar || null;
  const isVerified = creator.isVerified || creator.user?.isVerified || false;
  const plan = creator.plan || creator.user?.plan || "basic";
  const location = creator.location || "";
  const skill = creator.skill || "Skilled Creator";
  const skillCategory = creator.skillCategory || "other";
  const bio = creator.bio || "";
  const fundingGoal = creator.fundingGoal || 0;
  const amountRaised = creator.amountRaised || 0;
  const profitSharePercentage = creator.profitSharePercentage || 0;
  const profitShareDuration = creator.profitShareDuration || 0;
  const isAcceptingInvestments = creator.isAcceptingInvestments ?? true;
  const portfolio = creator.portfolio || [];
  const connectionStatus = creator.connectionStatus || null;
  const trustScore  = creator.trustScore || creator.score?.totalScore || null;
  const progressPercent = fundingGoal > 0 ? Math.min(100, Math.round((amountRaised / fundingGoal) * 100)) : 0;
  const connectLoading = actionLoading[`connect_${id}`];
  const isInvestor = currentUser?.role === "investor";
  const isOwn = currentUser?._id === id || currentUser?.id === id;

  return (
    <div
      className="group rounded-2xl cursor-pointer"
      style={{ background: cardColor, border: `1px solid ${cardBorder}`, boxShadow: isLight ? "0 1px 4px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.3)", position: "relative", overflow: "visible" }}
      onClick={() => navigate(`/creators/${id}`)}
      
    >
      {/* Cover */}
      <div className="relative h-32 overflow-hidden rounded-t-2xl" style={{ background: "rgba(0,0,0,0.2)" }}>
        {portfolio[0]?.imageUrl ? (
          <img src={portfolio[0].imageUrl} alt={portfolio[0].title} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl select-none" style={{ opacity: 0.12 }}>
            <FontAwesomeIcon icon={faBolt} style={{ fontSize:"13px" }} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isAcceptingInvestments && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Inter', sans-serif", background: "rgba(34,197,94,0.9)", color: "#000" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> Open
            </span>
          )}
          {plan === "elite" && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Inter', sans-serif", background: "rgba(245,158,11,0.85)", color: "#000" }}>Elite</span>}
          {plan === "pro"   && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Inter', sans-serif", background: "rgba(168,85,247,0.85)", color: "#ffffff" }}>Pro</span>}
        </div>
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
          <span className="text-xs px-2.5 py-1 rounded-full capitalize" style={{ background: "rgba(0,0,0,0.5)", color: "#9ca3af", backdropFilter: "blur(4px)" }}>
            <FontAwesomeIcon icon={CATEGORY_EMOJI[skillCategory] || faBolt} style={{ fontSize:"11px", marginRight:"4px" }} />{skillCategory}
          </span>
          {trustScore !== null && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)", color: trustScore >= 70 ? "#22c55e" : trustScore >= 40 ? "#f59e0b" : "#ef4444", backdropFilter: "blur(4px)" }}>
              Trust: {trustScore}
            </span>
          )}
        </div>
        {portfolio.length > 1 && <div className="absolute bottom-2 right-3 text-xs" style={{ color: cardMuted }}>+{portfolio.length - 1} more</div>}
      </div>

      {/* Body */}
      <div className="p-5 pt-10">
        {/* Avatar */}
        <div className="mb-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden shadow-xl mb-2" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "3px solid rgba(34,197,94,0.5)", position: "absolute", top: "calc(128px - 28px)", left: "20px" }}>
            {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-black text-base truncate" style={{ fontFamily: "'Inter', sans-serif", color: cardText }}>{name}</h3>
            {isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "13px", color: "#22c55e", flexShrink: 0 }} />}
          </div>
          <p className="text-sm font-semibold truncate" style={{ color: "#22c55e" }}>{skill}</p>
        </div>

        {location && (
          <div className="flex items-center gap-1 mb-2" style={{ color: "#9ca3af" }}>
            <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: "10px" }} /><span className="text-xs">{location}</span>
          </div>
        )}

        {bio && <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: "#6b7280" }}>{bio}</p>}

        {fundingGoal > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs" style={{ color: "#9ca3af" }}>${amountRaised.toLocaleString()} raised</span>
              <span className="text-xs font-black" style={{ color: "#22c55e", fontFamily: "'Inter', sans-serif" }}>{progressPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.3)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${progressPercent}%`,
                background: progressPercent >= 90 ? "linear-gradient(90deg,#f97316,#ef4444)" : "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)",
              }} />
            </div>
            <span className="text-xs mt-1 block" style={{ color: "#5a8a63" }}>Goal: ${fundingGoal.toLocaleString()}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { faIcon: faArrowTrendUp, color: "#22c55e", label: "Profit Share", value: profitSharePercentage > 0 ? `${profitSharePercentage}%` : "—" },
            { faIcon: faWallet,       color: "#3b82f6", label: "Duration",     value: profitShareDuration > 0 ? `${profitShareDuration}mo` : "—" },
          ].map(({ faIcon, color, label, value }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: cardStatBg, border: `1px solid ${cardStatBorder}` }}>
              <div className="flex items-center gap-1 mb-1">
                <FontAwesomeIcon icon={faIcon} style={{ fontSize: "10px", color }} /><span className="text-xs" style={{ color: cardDim }}>{label}</span>
              </div>
              <p className="font-black text-sm" style={{ fontFamily: "'Inter', sans-serif", color: cardText }}>{value}</p>
            </div>
          ))}
        </div>

        {!isOwn && (
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            {isInvestor && isAcceptingInvestments && (
              <button
                onClick={e => onInvest(creator, e)}
                className="flex-1 flex items-center justify-center gap-1.5 font-black text-sm rounded-xl transition-all hover:scale-105 whitespace-nowrap"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  background: "linear-gradient(135deg,#22c55e,#16a34a)",
                  color: "#000",
                  boxShadow: "0 4px 16px rgba(34,197,94,0.3)",
                  padding: "0 16px",
                  height: "42px",
                }}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: "12px" }} /> View Campaign
              </button>
            )}
            {isInvestor && (
              <>
                <button
                  onClick={e => onConnect(id, e)}
                  disabled={connectLoading || connectionStatus === "pending" || connectionStatus === "accepted"}
                  className="flex items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    padding: "0 14px",
                    height: "42px",
                    background: connectionStatus === "accepted" ? "rgba(34,197,94,0.1)" : connectionStatus === "pending" ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.3)",
                    border: `1px solid ${connectionStatus === "accepted" ? "rgba(34,197,94,0.3)" : connectionStatus === "pending" ? "rgba(245,158,11,0.3)" : "rgba(34,197,94,0.2)"}`,
                    color: connectionStatus === "accepted" ? "#22c55e" : connectionStatus === "pending" ? "#f59e0b" : "#9ca3af",
                    cursor: connectionStatus ? "default" : "pointer",
                  }}
                >
                  {connectLoading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "13px" }} />
                    : connectionStatus === "accepted" ? <><FontAwesomeIcon icon={faUsers} style={{ fontSize: "12px" }} />&nbsp;Connected</>
                    : connectionStatus === "pending" ? "Pending"
                    : <><FontAwesomeIcon icon={faUserPlus} style={{ fontSize: "12px" }} />&nbsp;Connect</>}
                </button>
                <button
                  onClick={e => onMessage(id, e)}
                  className="flex items-center justify-center rounded-xl transition-all"
                  style={{ padding: "0 14px", height: "42px", background: isLight ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.3)", border: `1px solid ${isLight ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.2)"}`, color: isLight ? "#4b5563" : "#9ca3af" }}
                >
                  <FontAwesomeIcon icon={faMessage} style={{ fontSize: "13px" }} />
                </button>
              </>
            )}
            {currentUser?.role === "creator" && (
              <button
                onClick={e => onMessage(id, e)}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold rounded-xl transition-all whitespace-nowrap"
                style={{ fontFamily: "'Inter', sans-serif", padding: "0 16px", height: "42px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}
              >
                <FontAwesomeIcon icon={faMessage} style={{ fontSize: "13px" }} /> Message
              </button>
            )}
          </div>
        )}
        {isOwn && <div className="text-center py-2 text-xs font-bold" style={{ color: "#5a8a63", fontFamily: "'Inter', sans-serif" }}>Your profile</div>}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CreatorsGridSkeleton() {
  const _t = useThemeStore((s) => s.theme); const isLight = _t === "light";
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: isLight ? "#ffffff" : "#070d08", border: `1px solid ${isLight ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)"}` }}>
          <div className="h-32" style={{ background: isLight ? "#f0fdf4" : "#0a1209" }} />
          <div className="p-5 space-y-3">
            <div className="w-12 h-12 rounded-xl -mt-9" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3.5 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3 rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }} />
              <div className="h-14 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }} />
            </div>
            <div className="h-10 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onClear, hasFilters }) {
  const _t = useThemeStore((s) => s.theme); const isLight = _t === "light";
  return (
    <div className="rounded-3xl p-16 text-center" style={{ background: isLight ? "#ffffff" : "#070d08", border: `1px solid ${isLight ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.1)"}` }}>
      <div className="text-5xl mb-4"><FontAwesomeIcon icon={faMagnifyingGlass} style={{ fontSize: "36px", color: "#9ca3af" }} /></div>
      <h3 className="font-black mb-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.3rem", color: "var(--sf-text-primary,#f1f5f9)" }}>No creators found</h3>
      <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#9ca3af" }}>
        {hasFilters ? "No creators match your current filters. Try adjusting your search." : "No creators are available at the moment. Check back soon!"}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="font-black text-sm px-6 py-3 rounded-xl transition-all hover:scale-105" style={{ fontFamily: "'Inter', sans-serif", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}>
          Clear Filters
        </button>
      )}
    </div>
  );
}