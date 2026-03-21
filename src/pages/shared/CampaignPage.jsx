import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MapPin, BadgeCheck, TrendingUp, Users, ArrowUpRight,
  Clock, CheckCircle, ChevronLeft, DollarSign, Star,
  Shield, Play, X, ChevronDown, ChevronUp, Flame, Zap,
  FileText, Image, Video, AlertCircle, Share2, Bookmark,
  BarChart2, Lock, Unlock, MessageSquare, Camera,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/useThemeStore";
import api from "../../utils/api";
import { ScoreCard } from "../../components/layout/ScoreBadge";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";
import { Helmet } from "react-helmet-async";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  fashion: "Fashion", carpentry: "Carpentry", farming: "Farming",
  photography: "Photography", baking: "Baking", mechanics: "Mechanics",
  technology: "Technology", hair: "Hair & Beauty", artisan: "Artisan", other: "Other",
};

const MILESTONE_STATUS_CONFIG = {
  locked:           { label: "Locked",            color: "#4a5568", bg: "rgba(74,85,104,0.12)",  border: "rgba(74,85,104,0.25)",  icon: Lock },
  active:           { label: "In Progress",        color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)",  icon: Flame },
  proof_submitted:  { label: "Proof Submitted",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)",  icon: FileText },
  approved:         { label: "Approved",           color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",   icon: CheckCircle },
  disputed:         { label: "Disputed",           color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",   icon: AlertCircle },
  auto_released:    { label: "Auto-Released",      color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.3)",  icon: Unlock },
  completed:        { label: "Completed",          color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.3)",   icon: CheckCircle },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (n) => `$${Number(n || 0).toLocaleString()}`;
const fmtPct = (raised, goal) =>
  goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent = "#22c55e", sub }) {
  const Icon = icon;
  return (
    <div className="sf-stat-card">
      <div className="sf-stat-icon" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div>
        <p className="sf-stat-value" style={{ color: accent }}>{value}</p>
        <p className="sf-stat-label">{label}</p>
        {sub && <p className="sf-stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

function MilestoneLine({ milestone, index, isLast }) {
  const _t = useThemeStore((s) => s.theme); const isLight = _t === "light";
  const [open, setOpen] = useState(false);
  const cfg = MILESTONE_STATUS_CONFIG[milestone.status] || MILESTONE_STATUS_CONFIG.locked;
  const StatusIcon = cfg.icon;
  const proofFiles = milestone.proofFiles || [];

  return (
    <div className="sf-milestone-row">
      {/* Connector line */}
      <div className="sf-ml-connector">
        <div
          className="sf-ml-dot"
          style={{ background: cfg.color, boxShadow: `0 0 10px ${cfg.color}60` }}
        />
        {!isLast && <div className="sf-ml-line" style={{ background: milestone.status === "approved" || milestone.status === "completed" ? cfg.color + "50" : isLight ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)" }} />}
      </div>

      {/* Content */}
      <div
        className="sf-ml-content"
        onClick={() => setOpen(!open)}
        style={{ borderColor: open ? cfg.border : isLight ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)" }}
      >
        <div className="sf-ml-header">
          <div className="sf-ml-left">
            <span className="sf-ml-index">M{index + 1}</span>
            <div>
              <p className="sf-ml-title">{milestone.title}</p>
              {milestone.description && (
                <p className="sf-ml-desc">{milestone.description}</p>
              )}
            </div>
          </div>
          <div className="sf-ml-right">
            <span className="sf-ml-amount">{fmt$(milestone.amount)}</span>
            <span className="sf-ml-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
              <StatusIcon size={10} /> {cfg.label}
            </span>
            {open ? <ChevronUp size={13} style={{ color: "#4a5568" }} /> : <ChevronDown size={13} style={{ color: "#4a5568" }} />}
          </div>
        </div>

        {open && (
          <div className="sf-ml-body">
            {milestone.proofNotes && (
              <div className="sf-ml-proof-note">
                <FileText size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
                <p>{milestone.proofNotes}</p>
              </div>
            )}
            {proofFiles.length > 0 && (
              <div className="sf-ml-proof-files">
                {proofFiles.map((f, i) => (
                  <a key={i} href={f} target="_blank" rel="noreferrer" className="sf-ml-proof-file">
                    <Image size={11} /> Proof {i + 1}
                  </a>
                ))}
              </div>
            )}
            {milestone.approvedAt && (
              <p className="sf-ml-approved-at">
                <CheckCircle size={11} style={{ color: "#22c55e" }} />
                Approved {new Date(milestone.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UpdateCard({ update }) {
  return (
    <div className="sf-update-card">
      <div className="sf-update-header">
        <div className="sf-update-dot" />
        <p className="sf-update-date">
          {new Date(update.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
      <h4 className="sf-update-title">{update.title}</h4>
      <p className="sf-update-body">{update.content}</p>
      {update.mediaFiles?.length > 0 && (
        <div className="sf-update-media">
          {update.mediaFiles.slice(0, 3).map((f, i) => (
            <div key={i} className="sf-update-thumb">
              <img src={f} alt={`update-${i}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoModal({ videoUrl, onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="sf-modal-overlay" onClick={onClose}>
      <div className="sf-modal-box" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="sf-modal-close"><X size={16} /></button>
        <div className="sf-modal-video">
          <video src={videoUrl} controls autoPlay className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CampaignSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-56 rounded-3xl sf-skeleton" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-5 space-y-3 sf-skeleton" style={{ height: 120 }} />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-2xl sf-skeleton" style={{ height: 160 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CampaignPage() {
  const _theme = useThemeStore((s) => s.theme);
  const isLight = _theme === "light";
  useNotificationReadOnView();
  const { id } = useParams(); // creator's userId
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  // Data state
  const [campaign, setCampaign] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState("story");
  const [showVideo, setShowVideo] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);

  const myId = currentUser?._id || currentUser?.id;
  const isOwn = myId === id;
  const canInvest =
    currentUser?.role === "investor" &&
    campaign?.isAcceptingInvestments &&
    !isOwn;

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, milestonesRes, updatesRes] = await Promise.allSettled([
        api.get(`/users/${id}`),
        api.get(`/milestones/creator/${id}`).catch(() => ({ data: [] })),
        api.get(`/campaigns/${id}/updates`).catch(() => ({ data: [] })),
      ]);

      if (profileRes.status === "fulfilled") {
        const data = profileRes.value.data;
        const user = data.user || data;
        const profile = data.profile || {};
        setCampaign({ ...user, profile });
        setConnectionStatus(data.connectionStatus || null);
      }

      if (milestonesRes.status === "fulfilled") {
        setMilestones(milestonesRes.value.data || []);
      }

      if (updatesRes.status === "fulfilled") {
        setUpdates(updatesRes.value.data || []);
      }

      // Score
      try {
        const scoreRes = await api.get(`/scores/${id}`);
        setScore(scoreRes.data);
      } catch {
        // score is optional — fail silently
      }
    } catch {
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    if (!currentUser) return navigate("/login");
    setConnectLoading(true);
    try {
      await api.post("/connections/request", { recipientId: id });
      toast.success("Connection request sent!");
      setConnectionStatus("pending");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send request");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleInvest = () => {
    if (!currentUser) return navigate("/login");
    navigate(`/messages?userId=${id}`, {
      state: { creator: campaign, openProposal: true },
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2500);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  if (loading) return <CampaignSkeleton />;

  if (!campaign) {
    return (
      <div className="rounded-3xl p-16 text-center" style={{ background: isLight ? "#ffffff" : "#070d08", border: `1px solid ${isLight ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.08)"}` }}>
        <Shield size={36} className="mx-auto mb-4" style={{ color: "#2d4a31" }} />
        <h3 className="font-black mb-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.4rem", color: "var(--sf-text-primary,#f1f5f9)" }}>Campaign not found</h3>
        <p className="text-sm mb-6" style={{ color: "#6b7280" }}>This campaign doesn't exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="sf-btn-green" style={{ display: "inline-flex", width: "auto", padding: "10px 24px" }}>
          <ChevronLeft size={14} /> Go Back
        </button>
      </div>
    );
  }

  const profile = campaign.profile || {};
  const pct = fmtPct(profile.amountRaised, profile.fundingGoal);
  const remaining = Math.max(0, (profile.fundingGoal || 0) - (profile.amountRaised || 0));
  const projectedReturn = profile.projectedMonthlyIncome && profile.profitSharePercentage && profile.profitShareDuration
    ? Math.round((profile.projectedMonthlyIncome * profile.profitSharePercentage / 100) * profile.profitShareDuration)
    : null;

  const approvedMilestones = milestones.filter((m) => m.status === "approved" || m.status === "completed").length;
  const totalMilestones = milestones.length;

  const tabs = ["story", "milestones", "portfolio", "updates"];

  const pageTitle = campaign?.name
    ? `${campaign.name} — ${profile?.skillCategory || "Creator"} | SkillFund`
    : "SkillFund — Creator Campaign";
  const pageDesc = campaign?.name
    ? `Invest in ${campaign.name}, a ${profile?.skillCategory || "creator"} on SkillFund. ${(profile?.bio || "").slice(0, 120)}...`
    : "Discover and invest in African creators on SkillFund.";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={campaign?.avatar || ""} />
        <meta property="og:url" content={`https://skillfund-client.vercel.app/campaign/${id}`} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:image" content={campaign?.avatar || ""} />
        <link rel="canonical" href={`https://skillfund-client.vercel.app/campaign/${id}`} />
      </Helmet>
      <div className="space-y-0">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ── Base cards ── */
        .sf-card { background:var(--sf-bg-card,#070d08); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:22px; }
        .sf-card-green { background:rgba(34,197,94,0.03); border:1px solid rgba(34,197,94,0.18); border-radius:20px; padding:22px; }
        .sf-skeleton { background:linear-gradient(90deg,var(--sf-bg-card,#070d08) 25%,var(--sf-bg-input,#0a1209) 50%,var(--sf-bg-card,#070d08) 75%); background-size:200% 100%; animation:shimmer 1.8s infinite; border:1px solid var(--sf-border,rgba(255,255,255,0.05)); border-radius:20px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Cover ── */
        .sf-cover { height:220px; border-radius:24px; overflow:hidden; position:relative; background:linear-gradient(135deg,#0f2e10,#061209); border:1px solid rgba(34,197,94,0.15); }
        .sf-cover-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px); background-size:36px 36px; }
        .sf-cover-glow { position:absolute; inset:0; background:radial-gradient(ellipse 60% 80% at 80% 50%,rgba(34,197,94,0.08) 0%,transparent 70%); }
        .sf-cover-emoji { position:absolute; right:40px; top:50%; transform:translateY(-50%); font-size:7rem; opacity:0.07; pointer-events:none; user-select:none; }
        .sf-avatar { width:72px; height:72px; border-radius:18px; overflow:hidden; display:flex; align-items:center; justify-content:center; font-family:'Inter', sans-serif; font-size:1.8rem; font-weight:900; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; border:3px solid #040806; position:absolute; bottom:-28px; left:24px; }
        .sf-live-pill { display:inline-flex; align-items:center; gap:6px; font-family:'Inter', sans-serif; font-size:11px; font-weight:700; letter-spacing:.08em; padding:5px 12px; border-radius:100px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); color:#f87171; }
        .sf-verified-pill { display:inline-flex; align-items:center; gap:5px; font-family:'Inter', sans-serif; font-size:11px; font-weight:700; padding:5px 12px; border-radius:100px; background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); color:#22c55e; }

        /* ── Progress bar ── */
        .sf-progress-wrap { margin:0; }
        .sf-progress-track { height:8px; background:var(--sf-bg-input,rgba(255,255,255,0.05)); border-radius:100px; overflow:hidden; border:1px solid var(--sf-border,rgba(255,255,255,0.07)); }
        .sf-progress-fill { height:100%; border-radius:100px; transition:width 1s ease; }

        /* ── Stats grid ── */
        .sf-stat-card { display:flex; align-items:flex-start; gap:10px; }
        .sf-stat-icon { width:32px; height:32px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .sf-stat-value { font-family:'Inter', sans-serif; font-size:1.1rem; font-weight:900; line-height:1.1; }
        .sf-stat-label { font-family:'Inter', sans-serif; font-size:11px; font-weight:700; color:#6b7280; margin-top:1px; }
        .sf-stat-sub { font-family:'Inter', sans-serif; font-size:11px; color:#4a5568; margin-top:1px; }

        /* ── ROI box ── */
        .sf-roi-box { background:linear-gradient(135deg,#071a0b,#040806); border:1px solid rgba(34,197,94,0.2); border-radius:16px; padding:16px; }
        .sf-roi-row { display:flex; justify-content:space-between; align-items:center; padding:7px 0; border-bottom:1px solid var(--sf-border,rgba(255,255,255,0.05)); }
        .sf-roi-row:last-child { border-bottom:none; }
        .sf-roi-label { font-family:'Inter', sans-serif; font-size:12px; color:#6b7280; }
        .sf-roi-val { font-family:'Inter', sans-serif; font-size:13px; font-weight:900; color:var(--sf-text-primary,#f1f5f9); }

        /* ── Tabs ── */
        .sf-tabs { display:flex; gap:6px; padding-bottom:1px; border-bottom:1px solid var(--sf-border,rgba(255,255,255,0.07)); margin-bottom:20px; overflow-x:auto; }
        .sf-tab { padding:8px 18px; border-radius:10px 10px 0 0; font-family:'Inter', sans-serif; font-size:12px; font-weight:700; letter-spacing:.04em; cursor:pointer; transition:all .15s; border:1px solid transparent; white-space:nowrap; color:#4a5568; background:transparent; }
        .sf-tab:hover { color:#9ca3af; }
        .sf-tab.on { background:var(--sf-bg-card,#070d08); border-color:var(--sf-border,rgba(255,255,255,0.07)); border-bottom-color:var(--sf-bg,#040806); color:#22c55e; margin-bottom:-1px; }

        /* ── Milestones ── */
        .sf-milestone-row { display:flex; gap:14px; }
        .sf-ml-connector { display:flex; flex-direction:column; align-items:center; flex-shrink:0; padding-top:14px; }
        .sf-ml-dot { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
        .sf-ml-line { width:1px; flex:1; min-height:20px; margin-top:4px; }
        .sf-ml-content { flex:1; background:var(--sf-bg-card,#070d08); border:1px solid var(--sf-border,rgba(255,255,255,0.07)); border-radius:16px; padding:14px 16px; cursor:pointer; transition:all .15s; margin-bottom:10px; }
        .sf-ml-content:hover { border-color:var(--sf-border-hover,rgba(255,255,255,0.12)); }
        .sf-ml-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .sf-ml-left { display:flex; align-items:flex-start; gap:10px; flex:1; min-width:0; }
        .sf-ml-index { font-family:'Inter', sans-serif; font-size:11px; font-weight:900; color:#2d4a31; background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.12); border-radius:6px; padding:2px 7px; flex-shrink:0; margin-top:1px; }
        .sf-ml-title { font-family:'Inter', sans-serif; font-size:13px; font-weight:700; color:white; line-height:1.3; }
        .sf-ml-desc { font-family:'Inter', sans-serif; font-size:12px; color:#6b7280; margin-top:3px; line-height:1.4; }
        .sf-ml-right { display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0; }
        .sf-ml-amount { font-family:'Inter', sans-serif; font-size:14px; font-weight:900; color:var(--sf-text-primary,#f1f5f9); }
        .sf-ml-badge { display:inline-flex; align-items:center; gap:4px; font-family:'Inter', sans-serif; font-size:10px; font-weight:700; padding:3px 8px; border-radius:100px; white-space:nowrap; }
        .sf-ml-body { margin-top:12px; padding-top:12px; border-top:1px solid var(--sf-border,rgba(255,255,255,0.05)); space-y:8px; }
        .sf-ml-proof-note { display:flex; gap:8px; font-family:'Inter', sans-serif; font-size:12px; color:#9ca3af; line-height:1.5; margin-bottom:8px; }
        .sf-ml-proof-files { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px; }
        .sf-ml-proof-file { display:inline-flex; align-items:center; gap:5px; font-family:'Inter', sans-serif; font-size:11px; font-weight:700; padding:4px 10px; border-radius:8px; background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); color:#22c55e; text-decoration:none; transition:.15s; }
        .sf-ml-proof-file:hover { background:rgba(34,197,94,0.14); }
        .sf-ml-approved-at { display:flex; align-items:center; gap:5px; font-family:'Inter', sans-serif; font-size:11px; color:#4a5568; margin-top:4px; }

        /* ── Updates ── */
        .sf-update-card { background:var(--sf-bg-card,#070d08); border:1px solid var(--sf-border,rgba(255,255,255,0.07)); border-radius:16px; padding:18px; }
        .sf-update-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
        .sf-update-dot { width:6px; height:6px; border-radius:50%; background:#22c55e; }
        .sf-update-date { font-family:'Inter', sans-serif; font-size:11px; font-weight:700; color:#4a5568; letter-spacing:.06em; }
        .sf-update-title { font-family:'Inter', sans-serif; font-size:1rem; font-weight:900; color:white; margin-bottom:6px; }
        .sf-update-body { font-family:'Inter', sans-serif; font-size:13px; color:#9ca3af; line-height:1.6; }
        .sf-update-media { display:flex; gap:6px; margin-top:12px; }
        .sf-update-thumb { width:72px; height:56px; border-radius:10px; overflow:hidden; background:var(--sf-bg-input,#0a1209); border:1px solid var(--sf-border,rgba(255,255,255,0.07)); flex-shrink:0; }

        /* ── Portfolio ── */
        .sf-portfolio-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; }
        .sf-portfolio-item { border-radius:16px; overflow:hidden; background:var(--sf-bg-card,#070d08); border:1px solid var(--sf-border,rgba(255,255,255,0.07)); }
        .sf-portfolio-img { height:120px; overflow:hidden; }

        /* ── Buttons ── */
        .sf-btn-green { display:flex; align-items:center; justify-content:center; gap:6px; font-family:'Inter', sans-serif; font-weight:800; font-size:13px; padding:12px 20px; border-radius:14px; cursor:pointer; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; border:none; width:100%; transition:.15s; box-shadow:0 4px 20px rgba(34,197,94,0.25); }
        .sf-btn-green:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 6px 24px rgba(34,197,94,0.35); }
        .sf-btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
        .sf-btn-ghost { display:flex; align-items:center; justify-content:center; gap:6px; font-family:'Inter', sans-serif; font-weight:700; font-size:13px; padding:10px 16px; border-radius:12px; cursor:pointer; background:var(--sf-bg-input,rgba(0,0,0,0.3)); border:1px solid var(--sf-border,rgba(255,255,255,0.1)); color:var(--sf-text-muted,#9ca3af); transition:.15s; }
        .sf-btn-ghost:hover { border-color:rgba(34,197,94,0.25); color:var(--sf-text-primary,#f1f5f9); }
        .sf-btn-icon { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:10px; cursor:pointer; background:var(--sf-bg-input,rgba(0,0,0,0.3)); border:1px solid var(--sf-border,rgba(255,255,255,0.1)); color:var(--sf-text-muted,#6b7280); transition:.15s; flex-shrink:0; }
        .sf-btn-icon:hover { border-color:rgba(34,197,94,0.25); color:var(--sf-text-primary,#f1f5f9); }
        .sf-btn-icon.active { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.3); color:#22c55e; }

        /* ── Modal ── */
        .sf-modal-overlay { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); padding:16px; }
        .sf-modal-box { position:relative; width:100%; max-width:700px; border-radius:24px; overflow:hidden; background:#070d08; border:1px solid rgba(34,197,94,0.2); box-shadow:0 40px 80px rgba(0,0,0,0.6); }
        .sf-modal-close { position:absolute; top:12px; right:12px; z-index:10; width:32px; height:32px; border-radius:50%; background:rgba(0,0,0,0.6); border:1px solid var(--sf-border,rgba(255,255,255,0.1)); display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; transition:.15s; }
        .sf-modal-close:hover { background:rgba(239,68,68,0.2); border-color:rgba(239,68,68,0.3); }
        .sf-modal-video { aspect-ratio:16/9; background:#040806; }

        /* ── Share toast ── */
        .sf-share-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--sf-bg-card,#070d08); border:1px solid rgba(34,197,94,0.3); color:#22c55e; font-family:'Inter', sans-serif; font-size:12px; font-weight:700; padding:10px 20px; border-radius:100px; z-index:200; box-shadow:0 8px 32px rgba(0,0,0,0.4); white-space:nowrap; pointer-events:none; }

        /* ── Misc ── */
        .sf-section-label { font-family:'Inter', sans-serif; font-size:11px; font-weight:700; letter-spacing:.1em; color:#22c55e; margin-bottom:12px; }
        .sf-divider { height:1px; background:var(--sf-border,rgba(255,255,255,0.06)); margin:4px 0; }
        .sf-empty { text-align:center; padding:40px 16px; font-family:'Inter', sans-serif; font-size:13px; color:#4a5568; }
        .sf-tag { display:inline-flex; align-items:center; gap:4px; font-family:'Inter', sans-serif; font-size:11px; font-weight:700; padding:4px 10px; border-radius:8px; }
      `}</style>

      {/* ── Back ── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
        style={{ color: "#4a5568", fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--sf-text-primary,#f1f5f9)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#4a5568")}
      >
        <ChevronLeft size={14} /> Back to campaigns
      </button>

      {/* ═══════════ COVER ═══════════ */}
      <div className="sf-cover mb-10">
        <div className="sf-cover-grid" />
        <div className="sf-cover-glow" />
        <div className="sf-cover-emoji">
          <Zap size={20} color="#22c55e" />
        </div>

        {/* Cover image if portfolio exists */}
        {profile.portfolio?.[0]?.imageUrl && (
          <img
            src={profile.portfolio[0].imageUrl}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.18 }}
          />
        )}

        {/* Top pills */}
        <div className="absolute top-4 left-5 flex items-center gap-2">
          {profile.isAcceptingInvestments && (
            <span className="sf-live-pill">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          )}
          {campaign.isVerified && (
            <span className="sf-verified-pill">
              <BadgeCheck size={11} /> Verified Creator
            </span>
          )}
        </div>

        {/* Pitch video button */}
        {profile.pitchVideoUrl && (
          <button
            onClick={() => setShowVideo(true)}
            className="absolute bottom-5 right-5 flex items-center gap-2 font-bold text-xs px-4 py-2.5 rounded-xl transition-all hover:scale-105"
            style={{
              fontFamily: "'Inter', sans-serif",
              background: "rgba(0,0,0,0.7)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#22c55e",
              backdropFilter: "blur(8px)",
            }}
          >
            <Play size={12} fill="#22c55e" /> Watch Pitch
          </button>
        )}

        {/* Avatar */}
        <div className="sf-avatar">
          {campaign.avatar
            ? <img src={campaign.avatar} alt={campaign.name} className="w-full h-full object-cover" />
            : campaign.name?.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* ═══════════ MAIN GRID ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">

        {/* ── LEFT / MAIN ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Name + meta */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="font-black"
                  style={{ color: "var(--sf-text-primary,#f1f5f9)", fontFamily: "'Inter', sans-serif", fontSize: "clamp(1.5rem,3vw,2rem)", lineHeight: 1.1 }}
                >
                  {campaign.name}
                </h1>
                {campaign.isVerified && <BadgeCheck size={20} style={{ color: "#22c55e" }} />}
              </div>
              {profile.skill && (
                <p className="font-semibold mt-1 text-sm" style={{ color: "#22c55e" }}>
                  {CATEGORY_EMOJI[profile.skillCategory]} {profile.skill}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {profile.location && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#6b7280" }}>
                    <MapPin size={11} /> {profile.location}
                  </span>
                )}
                {score && (
                  <span className="flex items-center gap-1 text-xs font-bold" style={{ color: "#f59e0b" }}>
                    <Star size={11} fill="#f59e0b" /> {score.totalScore}/100 score
                  </span>
                )}
                {profile.profileViews > 0 && (
                  <span className="text-xs" style={{ color: "#4a5568" }}>
                    {profile.profileViews.toLocaleString()} views
                  </span>
                )}
              </div>

              {/* Verification badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {campaign.emailVerified && <span className="sf-tag" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>✉️ Email</span>}
                {campaign.phoneVerified && <span className="sf-tag" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>📱 Phone</span>}
                {campaign.idVerified    && <span className="sf-tag" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>🪪 ID</span>}
                {campaign.isVerified    && <span className="sf-tag" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>✅ Verified</span>}
              </div>
            </div>

            {/* Action icons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setBookmarked(!bookmarked)}
                className={`sf-btn-icon ${bookmarked ? "active" : ""}`}
                title="Bookmark"
              >
                <Bookmark size={14} fill={bookmarked ? "#22c55e" : "none"} />
              </button>
              <button onClick={handleShare} className="sf-btn-icon" title="Share">
                <Share2 size={14} />
              </button>
            </div>
          </div>

          {/* ── Funding Progress ── */}
          {profile.fundingGoal > 0 && (
            <div className="sf-card-green">
              <div className="flex items-center justify-between mb-4">
                <p className="sf-section-label">FUNDING PROGRESS</p>
                {pct >= 90 && (
                  <span className="flex items-center gap-1.5 text-xs font-bold" style={{ fontFamily: "'Inter', sans-serif", color: "#f97316" }}>
                    <Flame size={12} /> Almost funded!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <p className="sf-stat-value" style={{ color: "#22c55e", fontFamily: "'Inter', sans-serif" }}>{fmt$(profile.amountRaised)}</p>
                  <p className="sf-stat-label">Raised</p>
                </div>
                <div className="text-center">
                  <p className="sf-stat-value" style={{ color: "var(--sf-text-primary,#f1f5f9)", fontFamily: "'Inter', sans-serif" }}>{pct}%</p>
                  <p className="sf-stat-label">Funded</p>
                </div>
                <div className="text-right">
                  <p className="sf-stat-value" style={{ color: "#6b7280", fontFamily: "'Inter', sans-serif" }}>{fmt$(profile.fundingGoal)}</p>
                  <p className="sf-stat-label">Goal</p>
                </div>
              </div>

              <div className="sf-progress-track mb-3">
                <div
                  className="sf-progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 90
                      ? "linear-gradient(90deg,#f97316,#ef4444)"
                      : "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)",
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                <span style={{ color: "#4a5568" }}>{fmt$(remaining)} remaining</span>
                {profile.activeInvestors > 0 && (
                  <span style={{ color: "#4a5568" }}>{profile.activeInvestors} investor{profile.activeInvestors !== 1 ? "s" : ""}</span>
                )}
              </div>
            </div>
          )}

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="sf-card">
              <StatCard icon={TrendingUp} label="Profit Share" value={profile.profitSharePercentage ? `${profile.profitSharePercentage}%` : "—"} accent="#22c55e" />
            </div>
            <div className="sf-card">
              <StatCard icon={Clock} label="Duration" value={profile.profitShareDuration ? `${profile.profitShareDuration}mo` : "—"} accent="#3b82f6" />
            </div>
            <div className="sf-card">
              <StatCard icon={DollarSign} label="Monthly Income" value={profile.projectedMonthlyIncome ? fmt$(profile.projectedMonthlyIncome) : "—"} accent="#a855f7" sub="projected" />
            </div>
            <div className="sf-card">
              <StatCard icon={BarChart2} label="Milestones" value={totalMilestones > 0 ? `${approvedMilestones}/${totalMilestones}` : "—"} accent="#f59e0b" sub="approved" />
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="sf-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`sf-tab ${activeTab === tab ? "on" : ""}`}
              >
                {tab === "story" && "📖 Story"}
                {tab === "milestones" && `🎯 Milestones${totalMilestones > 0 ? ` (${totalMilestones})` : ""}`}
                {tab === "portfolio" && `🖼 Portfolio${profile.portfolio?.length > 0 ? ` (${profile.portfolio.length})` : ""}`}
                {tab === "updates" && `📢 Updates${updates.length > 0 ? ` (${updates.length})` : ""}`}
              </button>
            ))}
          </div>

          {/* ── STORY TAB ── */}
          {activeTab === "story" && (
            <div className="space-y-4">
              {profile.bio ? (
                <div className="sf-card">
                  <p className="sf-section-label">ABOUT</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "#9ca3af", lineHeight: 1.7 }}>
                    {profile.bio}
                  </p>
                </div>
              ) : null}

              {profile.fundingPurpose && (
                <div className="sf-card">
                  <p className="sf-section-label">FUNDING PURPOSE</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "#9ca3af", lineHeight: 1.7 }}>
                    {profile.fundingPurpose}
                  </p>
                </div>
              )}

              {/* Score card */}
              <ScoreCard creatorId={campaign._id} />
            </div>
          )}

          {/* ── MILESTONES TAB ── */}
          {activeTab === "milestones" && (
            <div>
              {milestones.length === 0 ? (
                <div className="sf-empty">
                  <Lock size={28} className="mx-auto mb-3" style={{ color: "#2d4a31" }} />
                  No milestones set yet.
                </div>
              ) : (
                <div>
                  {milestones.map((m, i) => (
                    <MilestoneLine
                      key={m._id || i}
                      milestone={m}
                      index={i}
                      isLast={i === milestones.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PORTFOLIO TAB ── */}
          {activeTab === "portfolio" && (
            <div>
              {!profile.portfolio?.length ? (
                <div className="sf-empty">
                  <Camera size={28} className="mx-auto mb-3" style={{ color: "#2d4a31" }} />
                  No portfolio items yet.
                </div>
              ) : (
                <div className="sf-portfolio-grid">
                  {profile.portfolio.map((item) => (
                    <div key={item._id} className="sf-portfolio-item group">
                      <div className="sf-portfolio-img">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        />
                      </div>
                      <div className="p-3">
                        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: "var(--sf-text-primary,#f1f5f9)" }}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#6b7280", marginTop: "3px" }} className="line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── UPDATES TAB ── */}
          {activeTab === "updates" && (
            <div className="space-y-3">
              {updates.length === 0 ? (
                <div className="sf-empty">
                  <MessageSquare size={28} className="mx-auto mb-3" style={{ color: "#2d4a31" }} />
                  No updates posted yet.
                </div>
              ) : (
                updates.map((u, i) => <UpdateCard key={u._id || i} update={u} />)
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-4">

          {/* ── Invest CTA ── */}
          <div className="sf-card-green">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: profile.isAcceptingInvestments ? "rgba(34,197,94,0.15)" : "rgba(0,0,0,0.3)" }}
              >
                {profile.isAcceptingInvestments
                  ? <CheckCircle size={15} style={{ color: "#22c55e" }} />
                  : <Clock size={15} style={{ color: "#6b7280" }} />}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--sf-text-primary,#f1f5f9)", fontFamily: "'Inter', sans-serif" }}>
                  {profile.isAcceptingInvestments ? "Open to Investment" : "Not Accepting"}
                </p>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  {profile.isAcceptingInvestments ? "This creator is actively seeking investors" : "Campaign is currently closed"}
                </p>
              </div>
            </div>

            {canInvest && (
              <button onClick={handleInvest} className="sf-btn-green mb-3">
                <ArrowUpRight size={14} /> Invest Now
              </button>
            )}

            {!currentUser && (
              <button onClick={() => navigate("/login")} className="sf-btn-green mb-3">
                <ArrowUpRight size={14} /> Sign in to Invest
              </button>
            )}

            {!isOwn && connectionStatus !== "accepted" && (
              <button
                onClick={handleConnect}
                disabled={connectLoading || connectionStatus === "pending"}
                className="sf-btn-ghost"
                style={connectionStatus === "pending" ? { borderColor: "rgba(245,158,11,0.3)", color: "#f59e0b" } : {}}
              >
                {connectLoading
                  ? "Sending..."
                  : connectionStatus === "pending"
                  ? <><Clock size={13} /> Request Pending</>
                  : <><Users size={13} /> Connect First</>}
              </button>
            )}

            {!isOwn && connectionStatus === "accepted" && (
              <button
                onClick={() => navigate(`/messages?userId=${id}`)}
                className="sf-btn-ghost"
              >
                <MessageSquare size={13} /> Send Message
              </button>
            )}

            {isOwn && (
              <button onClick={() => navigate("/profile")} className="sf-btn-ghost">
                Edit Campaign
              </button>
            )}
          </div>

          {/* ── Expected ROI ── */}
          {(profile.profitSharePercentage || projectedReturn) && (
            <div className="sf-card">
              <p className="sf-section-label">EXPECTED RETURNS</p>
              <div className="sf-roi-box">
                {profile.profitSharePercentage && (
                  <div className="sf-roi-row">
                    <span className="sf-roi-label">Profit share</span>
                    <span className="sf-roi-val" style={{ color: "#22c55e" }}>{profile.profitSharePercentage}%</span>
                  </div>
                )}
                {profile.profitShareDuration && (
                  <div className="sf-roi-row">
                    <span className="sf-roi-label">Duration</span>
                    <span className="sf-roi-val">{profile.profitShareDuration} months</span>
                  </div>
                )}
                {profile.projectedMonthlyIncome && profile.profitSharePercentage && (
                  <div className="sf-roi-row">
                    <span className="sf-roi-label">Monthly return</span>
                    <span className="sf-roi-val" style={{ color: "#22c55e" }}>
                      {fmt$(Math.round(profile.projectedMonthlyIncome * profile.profitSharePercentage / 100))}
                    </span>
                  </div>
                )}
                {projectedReturn && (
                  <div className="sf-roi-row">
                    <span className="sf-roi-label">Total projected</span>
                    <span className="sf-roi-val" style={{ color: "#4ade80" }}>{fmt$(projectedReturn)}</span>
                  </div>
                )}
              </div>
              <p className="text-xs mt-3" style={{ fontFamily: "'Inter', sans-serif", color: "#4a5568", lineHeight: 1.5 }}>
                Returns are based on creator's projected income. Actual results may vary.
              </p>
            </div>
          )}

          {/* ── Quick stats ── */}
          <div className="sf-card">
            <p className="sf-section-label">CAMPAIGN STATS</p>
            <div className="space-y-3">
              <StatCard icon={DollarSign}  label="Funding Goal"   value={fmt$(profile.fundingGoal)}   accent="#22c55e" />
              <div className="sf-divider" />
              <StatCard icon={Users}       label="Investors"      value={profile.activeInvestors || 0} accent="#3b82f6" />
              <div className="sf-divider" />
              <StatCard icon={TrendingUp}  label="Amount Raised"  value={fmt$(profile.amountRaised)}  accent="#a855f7" />
              <div className="sf-divider" />
              <StatCard icon={Shield}      label="Trust Score"    value={score ? `${score.totalScore}/100` : "—"} accent="#f59e0b" />
            </div>
          </div>

          {/* ── Payment verified badge ── */}
          {campaign.paymentVerified && (
            <div className="sf-card" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
                  <BadgeCheck size={17} style={{ color: "#22c55e" }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--sf-text-primary,#f1f5f9)", fontFamily: "'Inter', sans-serif" }}>
                    Payment Verified
                  </p>
                  <p className="text-xs" style={{ color: "#4a5568" }}>Identity and payment confirmed</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Video Modal ── */}
      {showVideo && profile.pitchVideoUrl && (
        <VideoModal videoUrl={profile.pitchVideoUrl} onClose={() => setShowVideo(false)} />
      )}

      {/* ── Share Toast ── */}
      {showShareToast && (
        <div className="sf-share-toast">
          ✓ Link copied to clipboard
        </div>
      )}
    </div>
    </>
  );
}