import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faSliders, faLocationDot, faCircleCheck, faXmark,
  faChevronDown, faWallet, faCircleNotch, faUserPlus, faMessage,
  faUsers, faChartBar, faShield, faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { value: "", label: "All Industries" },
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

const INDUSTRY_EMOJI = {
  fashion: "👗", carpentry: "🪵", farming: "🌾", photography: "📸",
  baking: "🎂", mechanics: "🔧", technology: "💻", hair: "✂️",
  artisan: "🎨", other: "⚡",
};

const RISK_COLORS = {
  low:    { bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)",  text: "#22c55e"  },
  medium: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", text: "#f59e0b"  },
  high:   { bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  text: "#ef4444"  },
};

const CARD_COLORS = [
  "linear-gradient(135deg,#0f2244,#091830)",
  "linear-gradient(135deg,#0f2e10,#091e09)",
  "linear-gradient(135deg,#220f44,#180930)",
  "linear-gradient(135deg,#0f3d38,#092820)",
  "linear-gradient(135deg,#3d2200,#2a1600)",
  "linear-gradient(135deg,#3d0f22,#280918)",
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BrowseInvestors() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState({});

  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);

  const fetchInvestors = useCallback(async (resetPage = false) => {
    setLoading(true);
    const currentPage = resetPage ? 1 : pageRef.current;
    if (resetPage) setPage(1);
    try {
      const params = new URLSearchParams();
      params.set("page", currentPage);
      params.set("limit", 12);
      if (search) params.set("search", search);
      if (industry) params.set("industry", industry);
      if (minBudget) params.set("minBudget", minBudget);
      const res = await api.get(`/profiles/browse/investors?${params.toString()}`);
      setInvestors(res.data.investors || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error("Failed to load investors");
      setInvestors([]);
    } finally {
      setLoading(false);
    }
  }, [search, industry, minBudget]);

  useEffect(() => {
    const timer = setTimeout(() => fetchInvestors(true), 400);
    return () => clearTimeout(timer);
  }, [fetchInvestors]);

  useEffect(() => {
    fetchInvestors(false);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async (investorId, e) => {
    e.stopPropagation();
    if (user?.role !== "creator") { toast.error("Only creators can connect with investors"); return; }
    setActionLoading(prev => ({ ...prev, [`connect_${investorId}`]: true }));
    try {
      await api.post("/connections/request", { receiverId: investorId });
      toast.success("Connection request sent!");
      setInvestors(prev => prev.map(inv =>
        (inv.userId?._id || inv.userId) === investorId ? { ...inv, connectionStatus: "pending" } : inv
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setActionLoading(prev => ({ ...prev, [`connect_${investorId}`]: false }));
    }
  };

  const handleMessage = (investorId, e) => {
    e.stopPropagation();
    navigate(`/messages?userId=${investorId}`);
  };

  const clearFilters = () => { setSearch(""); setIndustry(""); setMinBudget(""); };
  const hasActiveFilters = search || industry || minBudget;

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
        .bi-input { background:#070d08; border:1px solid rgba(255,255,255,0.1); color:#ffffff; border-radius:12px; padding:10px 14px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .bi-input:focus { border-color:rgba(34,197,94,0.4); }
        .bi-input::placeholder { color:#5a8a63; }
        .ind-pill { flex-shrink:0; padding:6px 14px; border-radius:999px; font-size:13px; font-weight:700; cursor:pointer; transition:all .15s; border:1px solid rgba(255,255,255,0.1); background:#070d08; color:#9ca3af; font-family:'Syne',sans-serif; white-space:nowrap; }
        .ind-pill:hover { border-color:rgba(59,130,246,0.3); color:#9ca3af; }
        .ind-pill.active { background:linear-gradient(135deg,#3b82f6,#1d4ed8); border-color:transparent; color:#ffffff; }
        .page-btn { width:36px; height:36px; border-radius:10px; font-size:13px; font-weight:700; transition:all .15s; border:1px solid rgba(255,255,255,0.1); background:#070d08; color:#9ca3af; font-family:'Syne',sans-serif; }
        .page-btn:hover:not(:disabled) { border-color:rgba(59,130,246,0.3); color:#ffffff; }
        .page-btn.active { background:linear-gradient(135deg,#3b82f6,#1d4ed8); border-color:transparent; color:#ffffff; }
        .page-btn:disabled { opacity:0.3; cursor:not-allowed; }
        select option { background:#070d08; color:#ffffff; }
      `}</style>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ fontFamily: "'Syne', sans-serif", color: "#3b82f6" }}>DISCOVER</p>
            <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.5rem,2.5vw,2rem)" }}>Browse Investors</h2>
            <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>
              {loading ? "Loading..." : <><span className="text-white font-semibold">{total}</span> investors looking to fund creators</>}
            </p>
          </div>
          {user?.role === "investor" && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b", fontFamily: "'Syne', sans-serif" }}>
              👋 Switch to creator to connect with investors
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
            placeholder="Search by bio or location..."
            className="bi-input"
            style={{ paddingLeft: "38px", paddingRight: search ? "38px" : "14px" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }}>
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: "13px" }} />
            </button>
          )}
        </div>
        <div className="relative" style={{ minWidth: "200px" }}>
          <select value={industry} onChange={e => setIndustry(e.target.value)} style={selectStyle}>
            {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
          <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "11px", pointerEvents: "none" }} />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex-shrink-0"
          style={{
            fontFamily: "'Syne', sans-serif",
            background: showFilters || hasActiveFilters ? "rgba(59,130,246,0.1)" : "#070d08",
            border: `1px solid ${showFilters || hasActiveFilters ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.1)"}`,
            color: showFilters || hasActiveFilters ? "#3b82f6" : "#9ca3af",
          }}
        >
          <FontAwesomeIcon icon={faSliders} style={{ fontSize: "13px" }} /> Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} />}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif", color: "#9ca3af" }}>MIN BUDGET ($)</label>
              <input type="number" value={minBudget} onChange={e => setMinBudget(e.target.value)} placeholder="0" className="bi-input" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif", color: "#9ca3af" }}>INDUSTRY</label>
              <div className="relative">
                <select value={industry} onChange={e => setIndustry(e.target.value)} style={selectStyle}>
                  {INDUSTRIES.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                </select>
                <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "11px", pointerEvents: "none" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Industry Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        <button onClick={() => setIndustry("")} className={`ind-pill ${industry === "" ? "active" : ""}`}>All</button>
        {INDUSTRIES.slice(1).map(ind => (
          <button key={ind.value} onClick={() => setIndustry(ind.value === industry ? "" : ind.value)} className={`ind-pill ${industry === ind.value ? "active" : ""}`}>
            {INDUSTRY_EMOJI[ind.value]} {ind.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <InvestorsGridSkeleton />
      ) : investors.length === 0 ? (
        <EmptyState onClear={clearFilters} hasFilters={!!hasActiveFilters} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {investors.map((investor, idx) => (
              <InvestorCard
                key={investor._id}
                investor={investor}
                currentUser={user}
                onConnect={handleConnect}
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

// ─── Investor Card ────────────────────────────────────────────────────────────
function InvestorCard({ investor, currentUser, onConnect, onMessage, actionLoading, cardColor }) {
  const navigate = useNavigate();
  const id = investor.userId?._id || investor.userId || investor._id;

  const name         = investor.userId?.name     || "Investor";
  const avatar       = investor.avatar           || null;
  const isVerified   = investor.userId?.isVerified || false;
  const plan         = investor.userId?.plan     || "basic";
  const location     = investor.location         || "";
  const bio          = investor.bio              || "";
  const budget       = investor.investmentBudget || 0;
  const roi          = investor.preferredROI     || 0;
  const risk         = investor.riskTolerance    || "";
  const duration     = investor.preferredDuration|| 0;
  const totalInvested= investor.totalInvested    || 0;
  const industries   = investor.industriesOfInterest || [];
  const connectionStatus = investor.connectionStatus || null;

  const connectLoading = actionLoading[`connect_${id}`];
  const isCreator = currentUser?.role === "creator";
  const isOwn     = currentUser?._id === id || currentUser?.id === id;
  const riskStyle = RISK_COLORS[risk] || RISK_COLORS.medium;

  return (
    <div
      className="group rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1"
      style={{ background: cardColor, border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", position: "relative", overflow: "visible" }}
      onClick={() => navigate(`/investors/${id}`)}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.5)"; e.currentTarget.style.borderColor = "rgba(59,130,246,0.25)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      {/* Cover strip */}
      <div className="relative h-24 overflow-hidden rounded-t-2xl flex items-center justify-end pr-8" style={{ background: "rgba(0,0,0,0.2)" }}>
        <div className="text-7xl select-none" style={{ opacity: 0.1 }}>💼</div>
        {/* Plan badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {plan === "elite" && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(245,158,11,0.85)", color: "#000" }}>⭐ Elite</span>}
          {plan === "pro"   && <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(168,85,247,0.85)", color: "#ffffff" }}>Pro</span>}
        </div>
        {/* Risk badge */}
        {risk && (
          <div className="absolute top-3 right-3">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ background: riskStyle.bg, border: `1px solid ${riskStyle.border}`, color: riskStyle.text, fontFamily: "'Syne', sans-serif" }}>
              {risk} risk
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 pt-10">
        {/* Avatar + name stacked */}
        <div className="mb-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-lg overflow-hidden shadow-xl mb-2" style={{ background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "white", border: "3px solid rgba(59,130,246,0.5)", position: "absolute", top: "calc(96px - 28px)", left: "20px" }}>
            {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-white font-black text-base truncate" style={{ fontFamily: "'Syne', sans-serif" }}>{name}</h3>
            {isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "13px", color: "#22c55e", flexShrink: 0 }} />}
          </div>
          <p className="text-sm font-semibold" style={{ color: "#3b82f6" }}>💼 Investor</p>
        </div>

        {location && (
          <div className="flex items-center gap-1 mb-2" style={{ color: "#9ca3af" }}>
            <FontAwesomeIcon icon={faLocationDot} style={{ fontSize: "10px" }} /><span className="text-xs">{location}</span>
          </div>
        )}

        {bio && <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: "#6b7280" }}>{bio}</p>}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { faIcon: faWallet,       color: "#22c55e", label: "Budget",        value: budget        > 0 ? `$${Number(budget).toLocaleString()}`        : "—" },
            { faIcon: faArrowTrendUp, color: "#3b82f6", label: "Target ROI",    value: roi           > 0 ? `${roi}%`                                   : "—" },
            { faIcon: faChartBar,     color: "#a855f7", label: "Total Invested", value: totalInvested > 0 ? `$${Number(totalInvested).toLocaleString()}` : "—" },
            { faIcon: faShield,       color: "#f59e0b", label: "Duration",       value: duration      > 0 ? `${duration}mo`                            : "—" },
          ].map(({ faIcon, color, label, value }) => (
            <div key={label} className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-1 mb-1">
                <FontAwesomeIcon icon={faIcon} style={{ fontSize: "10px", color }} /><span className="text-xs" style={{ color: "#9ca3af" }}>{label}</span>
              </div>
              <p className="font-black text-sm text-white" style={{ fontFamily: "'Fraunces', serif" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Industries */}
        {industries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {industries.slice(0, 3).map(ind => (
              <span key={ind} className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", color: "#3b82f6" }}>
                {INDUSTRY_EMOJI[ind]} {ind}
              </span>
            ))}
            {industries.length > 3 && (
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.3)", color: "#9ca3af" }}>+{industries.length - 3}</span>
            )}
          </div>
        )}

        {/* Actions */}
        {!isOwn && (
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            {isCreator && (
              <>
                <button
                  onClick={e => onConnect(id, e)}
                  disabled={connectLoading || connectionStatus === "pending" || connectionStatus === "accepted"}
                  className="flex-1 flex items-center justify-center gap-1.5 font-black text-sm py-2.5 rounded-xl transition-all whitespace-nowrap"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    background: connectionStatus === "accepted" ? "rgba(34,197,94,0.1)" : connectionStatus === "pending" ? "rgba(245,158,11,0.1)" : "linear-gradient(135deg,#3b82f6,#1d4ed8)",
                    border: connectionStatus === "accepted" ? "1px solid rgba(34,197,94,0.3)" : connectionStatus === "pending" ? "1px solid rgba(245,158,11,0.3)" : "none",
                    color: connectionStatus === "accepted" ? "#22c55e" : connectionStatus === "pending" ? "#f59e0b" : "#ffffff",
                    cursor: connectionStatus ? "default" : "pointer",
                    boxShadow: !connectionStatus ? "0 4px 16px rgba(59,130,246,0.3)" : "none",
                  }}
                >
                  {connectLoading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "13px" }} />
                    : connectionStatus === "accepted" ? <><FontAwesomeIcon icon={faUsers} style={{ fontSize: "12px" }} />&nbsp;Connected</>
                    : connectionStatus === "pending"  ? <><>⏳</>&nbsp;Pending</>
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
            {currentUser?.role === "investor" && (
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
function InvestorsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="h-24" style={{ background: "#0a1209" }} />
          <div className="p-5 space-y-3">
            <div className="w-12 h-12 rounded-xl -mt-9" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3.5 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3 rounded-full w-1/3" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3 rounded-full w-full" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-3 rounded-full w-2/3" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, j) => <div key={j} className="h-14 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }} />)}
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
      <div className="text-5xl mb-4">💼</div>
      <h3 className="font-black text-white mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem" }}>No investors found</h3>
      <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#9ca3af" }}>
        {hasFilters ? "No investors match your current filters. Try adjusting your search." : "No investors are available at the moment. Check back soon!"}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="font-black text-sm px-6 py-3 rounded-xl transition-all hover:scale-105" style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#ffffff" }}>
          Clear Filters
        </button>
      )}
    </div>
  );
}
