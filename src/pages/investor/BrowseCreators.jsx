import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faSliders, faLocationDot, faArrowTrendUp, faUsers,
  faCircleCheck, faXmark, faChevronDown, faWallet, faArrowUpRightFromSquare,
  faCircleNotch, faUserPlus, faMessage,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";

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
  { value: "newest", label: "Newest First" },
  { value: "mostFunded", label: "Most Funded" },
  { value: "goalAsc", label: "Goal: Low to High" },
  { value: "goalDesc", label: "Goal: High to Low" },
  { value: "profitShare", label: "Best Profit Share" },
];

const CATEGORY_EMOJI = {
  fashion: "👗", carpentry: "🪵", farming: "🌾", photography: "📸",
  baking: "🎂", mechanics: "🔧", technology: "💻", hair: "✂️",
  artisan: "🎨", other: "⚡",
};

const CARD_COLORS = [
  "linear-gradient(135deg,#0f2e10,#091e09)",
  "linear-gradient(135deg,#0f2244,#091830)",
  "linear-gradient(135deg,#220f44,#180930)",
  "linear-gradient(135deg,#0f3d38,#092820)",
  "linear-gradient(135deg,#3d0f22,#280918)",
  "linear-gradient(135deg,#3d2200,#2a1600)",
];

export default function BrowseCreators() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [minGoal, setMinGoal] = useState("");
  const [maxGoal, setMaxGoal] = useState("");
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
  }, [search, category, sortBy, minGoal, maxGoal, verifiedOnly, acceptingOnly]);

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
    navigate(`/invest/${creator._id || creator.userId}`, { state: { creator } });
  };

  const handleMessage = (creatorId, e) => {
    e.stopPropagation();
    navigate(`/messages?userId=${creatorId}`);
  };

  const clearFilters = () => {
    setSearch(""); setCategory(""); setSortBy("newest");
    setMinGoal(""); setMaxGoal(""); setVerifiedOnly(false); setAcceptingOnly(true);
  };

  const hasActiveFilters = search || category || minGoal || maxGoal || verifiedOnly || !acceptingOnly;

  const selectStyle = {
    background: "#070d08", border: "1px solid rgba(255,255,255,0.1)", color: "#ffffff",
    borderRadius: "12px", padding: "10px 36px 10px 14px", fontSize: "14px",
    outline: "none", width: "100%", appearance: "none", WebkitAppearance: "none",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .browse-input { background:#070d08; border:1px solid rgba(255,255,255,0.1); color:#ffffff; border-radius:12px; padding:10px 14px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .browse-input:focus { border-color:rgba(34,197,94,0.4); }
        .browse-input::placeholder { color:#5a8a63; }
        .cat-pill { flex-shrink:0; padding:6px 14px; border-radius:999px; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; border:1px solid rgba(255,255,255,0.1); background:#070d08; color:#9ca3af; font-family:'Syne',sans-serif; white-space:nowrap; }
        .cat-pill:hover { border-color:rgba(34,197,94,0.3); color:#9ca3af; }
        .cat-pill.active { background:linear-gradient(135deg,#22c55e,#16a34a); border-color:transparent; color:#000; }
        .page-btn { width:36px; height:36px; border-radius:10px; font-size:13px; font-weight:700; transition:all .15s; border:1px solid rgba(255,255,255,0.1); background:#070d08; color:#9ca3af; font-family:'Syne',sans-serif; }
        .page-btn:hover:not(:disabled) { border-color:rgba(34,197,94,0.3); color:#ffffff; }
        .page-btn.active { background:linear-gradient(135deg,#22c55e,#16a34a); border-color:transparent; color:#000; }
        .page-btn:disabled { opacity:0.3; cursor:not-allowed; }
        select option { background:#070d08; color:#ffffff; }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "#22c55e" }}>DISCOVER</p>
            <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.5rem,2.5vw,2rem)" }}>Browse Creators</h2>
            <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>
              {loading ? "Loading..." : <><span className="text-white font-semibold">{total}</span> skilled creators looking for investors</>}
            </p>
          </div>
          {user?.role === "creator" && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "'Syne', sans-serif" }}>
              👋 Switch to investor to invest in creators
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
            fontFamily: "'Syne', sans-serif",
            background: showFilters || hasActiveFilters ? "rgba(34,197,94,0.1)" : "#070d08",
            border: `1px solid ${showFilters || hasActiveFilters ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.1)"}`,
            color: showFilters || hasActiveFilters ? "#22c55e" : "#9ca3af",
          }}
        >
          <FontAwesomeIcon icon={faSliders} style={{ fontSize: "13px" }} /> Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Advanced Filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs font-bold" style={{ color: "#ef4444", fontFamily: "'Syne', sans-serif" }}>
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: "11px" }} /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif", color: "#9ca3af" }}>MIN GOAL ($)</label>
              <input type="number" value={minGoal} onChange={e => setMinGoal(e.target.value)} placeholder="0" className="browse-input" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif", color: "#9ca3af" }}>MAX GOAL ($)</label>
              <input type="number" value={maxGoal} onChange={e => setMaxGoal(e.target.value)} placeholder="Any" className="browse-input" />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "#0a1209", border: "1px solid rgba(255,255,255,0.1)" }}>
                <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="w-4 h-4 accent-green-500" />
                <span className="text-sm" style={{ color: "#9ca3af" }}>Verified only</span>
                <FontAwesomeIcon icon={faCircleCheck} className="ml-auto" style={{ fontSize: "12px", color: "#22c55e" }} />
              </label>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer" style={{ background: "#0a1209", border: "1px solid rgba(255,255,255,0.1)" }}>
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
            {CATEGORY_EMOJI[cat.value]} {cat.label.split(" ")[0]}
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
                cardColor={CARD_COLORS[idx % CARD_COLORS.length]}
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
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ creator, currentUser, onConnect, onInvest, onMessage, actionLoading, cardColor }) {
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
  const progressPercent = fundingGoal > 0 ? Math.min(100, Math.round((amountRaised / fundingGoal) * 100)) : 0;
  const connectLoading = actionLoading[`connect_${id}`];
  const isInvestor = currentUser?.role === "investor";
  const isOwn = currentUser?._id === id || currentUser?.id === id;

  return (
    <div
      className="group rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{ background: cardColor, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", position: "relative", overflow: "visible" }}
      onClick={() => navigate(`/creators/${id}`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.5)"; e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; e.currentTarget.style.borderColor = "#0a1209"; }}
    >
      {/* Cover */}
      <div className="relative h-32 overflow-hidden rounded-t-2xl" style={{ background: "rgba(0,0,0,0.2)" }}>
        {portfolio[0]?.imageUrl ? (
          <img src={portfolio[0].imageUrl} alt={portfolio[0].title} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl select-none" style={{ opacity: 0.12 }}>
            {CATEGORY_EMOJI[skillCategory] || "⚡"}
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isAcceptingInvestments && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(34,197,94,0.9)", color: "#000" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" /> Open
            </span>
          )}
          {plan === "elite" && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(245,158,11,0.85)", color: "#000" }}>⭐ Elite</span>}
          {plan === "pro"   && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(168,85,247,0.85)", color: "#ffffff" }}>Pro</span>}
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-xs px-2.5 py-1 rounded-full capitalize" style={{ background: "rgba(0,0,0,0.5)", color: "#9ca3af", backdropFilter: "blur(4px)" }}>
            {CATEGORY_EMOJI[skillCategory]} {skillCategory}
          </span>
        </div>
        {portfolio.length > 1 && <div className="absolute bottom-2 right-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>+{portfolio.length - 1} more</div>}
      </div>

      {/* Body */}
      <div className="p-5 pt-10">
        {/* ── Avatar — absolutely positioned to straddle cover/body line ── */}
        <div className="mb-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden shadow-xl mb-2" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "3px solid rgba(34,197,94,0.5)", position: "absolute", top: "calc(128px - 28px)", left: "20px" }}>
            {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-white font-black text-base truncate" style={{ fontFamily: "'Syne', sans-serif" }}>{name}</h3>
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
              <span className="text-xs font-black" style={{ color: "#22c55e", fontFamily: "'Fraunces', serif" }}>{progressPercent}%</span>
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
            <div key={label} className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-1 mb-1">
                <FontAwesomeIcon icon={faIcon} style={{ fontSize: "10px", color }} /><span className="text-xs" style={{ color: "#9ca3af" }}>{label}</span>
              </div>
              <p className="font-black text-sm text-white" style={{ fontFamily: "'Fraunces', serif" }}>{value}</p>
            </div>
          ))}
        </div>

        {!isOwn && (
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            {isInvestor && isAcceptingInvestments && (
              <button
                onClick={e => onInvest(creator, e)}
                className="flex-1 flex items-center justify-center gap-1.5 font-black text-sm py-2.5 rounded-xl transition-all hover:scale-105 whitespace-nowrap"
                style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: "12px" }} /> Invest
              </button>
            )}
            {isInvestor && (
              <>
                <button
                  onClick={e => onConnect(id, e)}
                  disabled={connectLoading || connectionStatus === "pending" || connectionStatus === "accepted"}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    background: connectionStatus === "accepted" ? "rgba(34,197,94,0.1)" : connectionStatus === "pending" ? "rgba(245,158,11,0.1)" : "rgba(0,0,0,0.3)",
                    border: `1px solid ${connectionStatus === "accepted" ? "rgba(34,197,94,0.3)" : connectionStatus === "pending" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.1)"}`,
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
                  className="flex items-center justify-center px-3 py-2.5 rounded-xl transition-all"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}
                >
                  <FontAwesomeIcon icon={faMessage} style={{ fontSize: "13px" }} />
                </button>
              </>
            )}
            {currentUser?.role === "creator" && (
              <button
                onClick={e => onMessage(id, e)}
                className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold py-2.5 rounded-xl transition-all whitespace-nowrap"
                style={{ fontFamily: "'Syne', sans-serif", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af" }}
              >
                <FontAwesomeIcon icon={faMessage} style={{ fontSize: "13px" }} /> Message
              </button>
            )}
          </div>
        )}
        {isOwn && <div className="text-center py-2 text-xs font-bold" style={{ color: "#5a8a63", fontFamily: "'Syne', sans-serif" }}>Your profile</div>}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CreatorsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="h-32" style={{ background: "#0a1209" }} />
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
  return (
    <div className="rounded-3xl p-16 text-center" style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="text-5xl mb-4">🔍</div>
      <h3 className="font-black text-white mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem" }}>No creators found</h3>
      <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#9ca3af" }}>
        {hasFilters ? "No creators match your current filters. Try adjusting your search." : "No creators are available at the moment. Check back soon!"}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="font-black text-sm px-6 py-3 rounded-xl transition-all hover:scale-105" style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}>
          Clear Filters
        </button>
      )}
    </div>
  );
}
