import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MapPin, BadgeCheck, TrendingUp, Wallet, Users, MessageSquare,
  UserPlus, UserCheck, ArrowUpRight, Instagram, Twitter, Linkedin,
  Globe, Star, Clock, CheckCircle, Loader2, ChevronLeft,
  DollarSign, BarChart2, Shield,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import { ScoreCard } from "../../components/layout/ScoreBadge";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";
import useThemeStore from "../../store/useThemeStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_EMOJI = {
  fashion: "👗", carpentry: "🪵", farming: "🌾", photography: "📸",
  baking: "🎂", mechanics: "🔧", technology: "💻", hair: "✂️",
  artisan: "🎨", other: "⚡",
};

const VERIFICATION_BADGES = [
  { key: "emailVerified",  label: "Email Verified",   icon: "✉️" },
  { key: "phoneVerified",  label: "Phone Verified",   icon: "📱" },
  { key: "idVerified",     label: "ID Verified",      icon: "🪪" },
  { key: "isVerified",     label: "Profile Verified", icon: "✅" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
function useT() {
  const _t = useThemeStore((s) => s.theme);
  const L = _t === "light";
  return {
    card:      L ? "#ffffff"              : "#070d08",
    cardAlt:   L ? "#f0fdf4"              : "#0a1209",
    border:    L ? "rgba(34,197,94,0.2)"  : "rgba(255,255,255,0.08)",
    text:      L ? "#0a1a0c"              : "#f1f5f9",
    muted:     L ? "#4b5563"              : "#9ca3af",
    dim:       L ? "#6b7280"              : "#4b5563",
    hover:     L ? "rgba(0,0,0,0.04)"    : "rgba(255,255,255,0.04)",
    shadow:    L ? "0 1px 4px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.3)",
    heroGrad:  L ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)" : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)",
    heroBorder:L ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.25)",
  };
}

export default function UserProfile() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const T = {
    bg:        _L ? "#f4faf5"              : "#040806",
    card:      _L ? "#ffffff"              : "#070d08",
    cardAlt:   _L ? "#f0fdf4"              : "#0a1209",
    border:    _L ? "rgba(34,197,94,0.2)"  : "rgba(255,255,255,0.08)",
    borderSub: _L ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)",
    text:      _L ? "#0a1a0c"              : "#f1f5f9",
    muted:     _L ? "#4b5563"              : "#9ca3af",
    dim:       _L ? "#6b7280"              : "#4b5563",
    hover:     _L ? "rgba(0,0,0,0.04)"    : "rgba(255,255,255,0.04)",
    shadow:    _L ? "0 1px 4px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.3)",
  };
  useNotificationReadOnView();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const myId = currentUser?._id || currentUser?.id;
  const isOwnProfile = myId === id;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${id}`);
      const data = res.data;
      if (data.user && data.profile) {
        setProfileData({ ...data.user, profile: data.profile });
      } else if (data.user) {
        setProfileData(data.user);
      } else {
        setProfileData(data);
      }
      setConnectionStatus(data.connectionStatus || null);
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleConnect = async () => {
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

  // Per SkillFund spec: investment starts via chat proposal, not a direct /invest page
  const handleInvest = () => navigate(`/messages?userId=${id}`, { state: { creator: profileData, openProposal: true } });

  if (loading) return
<ProfileSkeleton />
;

  if (!profileData) {
    return (
        <div className="rounded-3xl p-16 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <Shield size={40} className="mx-auto mb-4" style={{ color: "#5a8a63" }} />
          <h3 className="font-black text-white mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.3rem" }}>Profile not found</h3>
          <p className="text-sm mb-6" style={{ color: T.muted }}>This user doesn't exist or their profile is private.</p>
          <button onClick={() => navigate(-1)} className="font-black text-sm px-6 py-3 rounded-xl transition-all hover:scale-105" style={{ fontFamily: "'Syne', sans-serif", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}>
            Go Back
          </button>
        </div>
    );
  }

  const profile    = profileData.profile || {};
  const isCreator  = profileData.role === "creator";
  const isInvestor = profileData.role === "investor";
  const canInvest  = currentUser?.role === "investor" && isCreator && profile.isAcceptingInvestments;
  const canConnect = !isOwnProfile && connectionStatus !== "accepted";

  const tabs = ["overview"];
  if (isCreator && profile.portfolio?.length > 0) tabs.push("portfolio");
  tabs.push("details");

  const progressPercent = profile.fundingGoal > 0
    ? Math.min(100, Math.round(((profile.amountRaised || 0) / profile.fundingGoal) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .p-card { background:#070d08; border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:20px; }
        .p-stat { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.18); border-radius:14px; padding:12px; }
        .p-tab { padding:7px 18px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Syne',sans-serif; transition:all .15s; cursor:pointer; border:1px solid rgba(255,255,255,0.1); background:#070d08; color:#9ca3af; }
        .p-tab:hover { color:#9ca3af; border-color:rgba(34,197,94,0.2); }
        .p-tab.on { background:linear-gradient(135deg,#22c55e,#16a34a); border-color:transparent; color:#000; }
        .p-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.2); }
        .p-row:last-child { border-bottom:none; }
        .p-stat-row { display:flex; align-items:center; justify-content:space-between; padding:9px 0; border-bottom:1px solid #0a1209; }
        .p-stat-row:last-child { border-bottom:none; }
        .p-social { display:flex; align-items:center; gap:8px; padding:8px 14px; border-radius:12px; font-size:13px; font-family:'DM Sans',sans-serif; transition:all .15s; background:#070d08; border:1px solid rgba(255,255,255,0.1); color:#6b7280; text-decoration:none; }
        .p-social:hover { border-color:rgba(34,197,94,0.3); color:white; }
        .p-btn-green { display:flex; align-items:center; justify-content:center; gap:6px; font-family:'Syne',sans-serif; font-weight:800; font-size:13px; padding:10px 20px; border-radius:12px; transition:all .15s; cursor:pointer; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; border:none; white-space:nowrap; width:100%; box-shadow:0 4px 16px rgba(34,197,94,0.25); }
        .p-btn-green:hover:not(:disabled) { transform:scale(1.02); }
        .p-btn-green:disabled { opacity:0.5; cursor:default; transform:none; }
        .p-btn-ghost { display:flex; align-items:center; justify-content:center; gap:6px; font-family:'Syne',sans-serif; font-weight:700; font-size:13px; padding:10px 20px; border-radius:12px; transition:all .15s; cursor:pointer; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:#9ca3af; white-space:nowrap; }
        .p-btn-ghost:hover { border-color:rgba(34,197,94,0.3); color:white; }
        .p-btn-ghost:disabled { opacity:0.5; cursor:default; }
        .p-btn-sm { display:inline-flex; align-items:center; gap:6px; font-family:'Syne',sans-serif; font-weight:700; font-size:13px; padding:9px 16px; border-radius:11px; transition:all .15s; cursor:pointer; white-space:nowrap; }
      `}</style>

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm mb-5 transition-colors"
        style={{ color: T.muted, fontFamily: "'Syne', sans-serif", fontWeight: 700 }}
        onMouseEnter={e => e.currentTarget.style.color = "white"}
        onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}
      >
        <ChevronLeft size={15} /> Back
      </button>

      {/* Cover */}
      <div className="relative mb-4">
        <div className="h-40 rounded-3xl overflow-hidden relative" style={{ background: "linear-gradient(135deg,#0f2e10,#091e09)", border: "1px solid rgba(34,197,94,0.30)" }}>
          {isCreator && profile.portfolio?.[0]?.imageUrl && (
            <img src={profile.portfolio[0].imageUrl} alt="cover" className="w-full h-full object-cover opacity-30" />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%)", filter: "blur(24px)" }} />
          <div className="absolute inset-0 flex items-center justify-end pr-10 text-8xl pointer-events-none select-none" style={{ opacity: 0.07 }}>
            {CATEGORY_EMOJI[profile.skillCategory] || (isInvestor ? "💼" : "⚡")}
          </div>
          <div className="absolute top-4 left-4">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{
              fontFamily: "'Syne', sans-serif",
              background: isCreator ? "rgba(34,197,94,0.30)" : "rgba(59,130,246,0.30)",
              border: `1px solid ${isCreator ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.3)"}`,
              color: isCreator ? "#22c55e" : "#3b82f6",
            }}>
              {isCreator ? "🎨 Creator" : "💼 Investor"}
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-7 left-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center font-black text-3xl shadow-2xl" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "3px solid #040806" }}>
            {profileData.avatar
              ? <img src={profileData.avatar} alt={profileData.name} className="w-full h-full object-cover" />
              : profileData.name?.charAt(0).toUpperCase()
            }
          </div>
        </div>

        {/* Buttons */}
        {!isOwnProfile && (
          <div className="absolute bottom-3 right-4 flex gap-2">
            {canInvest && (
              <button onClick={handleInvest} className="p-btn-sm" style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none", boxShadow: "0 2px 8px rgba(34,197,94,0.2)" }}>
                <ArrowUpRight size={13} /> Invest
              </button>
            )}
            {canConnect && (
              <button
                onClick={handleConnect}
                disabled={connectLoading || connectionStatus === "pending"}
                className="p-btn-sm"
                style={connectionStatus === "pending"
                  ? { background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }
                  : { background: "rgba(0,0,0,0.5)", border: `1px solid ${T.border}`, color: T.muted }}
              >
                {connectLoading ? <Loader2 size={13} className="animate-spin" />
                  : connectionStatus === "pending" ? <><Clock size={13} /> Pending</>
                  : <><UserPlus size={13} /> Connect</>}
              </button>
            )}
            {connectionStatus === "accepted" && (
              <button onClick={() => navigate(`/messages?userId=${id}`)} className="p-btn-sm" style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${T.border}`, color: T.muted }}>
                <MessageSquare size={13} /> Message
              </button>
            )}
          </div>
        )}
        {isOwnProfile && (
          <div className="absolute bottom-3 right-4">
            <button onClick={() => navigate("/profile")} className="p-btn-sm" style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${T.border}`, color: T.muted }}>
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Name + meta */}
      <div className="pl-2 mb-6 mt-10">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.4rem,2.5vw,1.8rem)" }}>{profileData.name}</h1>
          {profileData.isVerified && <BadgeCheck size={20} style={{ color: "#22c55e" }} />}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full capitalize" style={{ fontFamily: "'Syne', sans-serif", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e" }}>
            {profileData.plan} plan
          </span>
        </div>
        {isCreator && profile.skill && (
          <p className="font-semibold mt-1" style={{ color: "#22c55e" }}>{CATEGORY_EMOJI[profile.skillCategory]} {profile.skill}</p>
        )}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {profile.location && <span className="flex items-center gap-1 text-sm" style={{ color: T.muted }}><MapPin size={12} /> {profile.location}</span>}
          {isCreator && <span className="flex items-center gap-1 text-sm" style={{ color: T.muted }}><Users size={12} /> {profile.profileViews || 0} profile views</span>}
          {isCreator && profile.amountRaised > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#22c55e" }}><DollarSign size={12} /> ${Number(profile.amountRaised).toLocaleString()} raised</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {VERIFICATION_BADGES.map(b =>
            profileData[b.key] ? (
              <span key={b.key} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e" }}>
                {b.icon} {b.label}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`p-tab ${activeTab === tab ? "on" : ""}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {profile.bio && (
              <div className="p-card">
                <p className="text-xs font-bold tracking-widest mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "#22c55e" }}>ABOUT</p>
                <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{profile.bio}</p>
              </div>
            )}

            {isCreator && (
              <div className="p-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#22c55e,#16a34a)" }} />
                  <p className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "1rem" }}>Funding Details</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Funding Goal",   value: profile.fundingGoal            ? `$${Number(profile.fundingGoal).toLocaleString()}`            : "—" },
                    { label: "Amount Raised",  value: profile.amountRaised           ? `$${Number(profile.amountRaised).toLocaleString()}`           : "$0" },
                    { label: "Profit Share",   value: profile.profitSharePercentage  ? `${profile.profitSharePercentage}%`                          : "—" },
                    { label: "Duration",       value: profile.profitShareDuration    ? `${profile.profitShareDuration} months`                      : "—" },
                    { label: "Monthly Income", value: profile.projectedMonthlyIncome ? `$${Number(profile.projectedMonthlyIncome).toLocaleString()}` : "—" },
                    { label: "Status", value: profile.isAcceptingInvestments ? "Open" : "Closed", isStatus: true },
                  ].map(d => (
                    <div key={d.label} className="p-stat">
                      <p className="text-xs mb-1" style={{ color: T.muted }}>{d.label}</p>
                      <p className="text-sm font-black" style={{ fontFamily: "'Fraunces', serif", color: d.isStatus ? (profile.isAcceptingInvestments ? "#22c55e" : "#ef4444") : "white" }}>{d.value}</p>
                    </div>
                  ))}
                </div>
                {profile.fundingGoal > 0 && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span style={{ color: T.muted }}>Funding progress</span>
                      <span className="font-black" style={{ color: "#22c55e", fontFamily: "'Fraunces', serif" }}>{progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${progressPercent}%`,
                        background: progressPercent >= 90 ? "linear-gradient(90deg,#f97316,#ef4444)" : "linear-gradient(90deg,#16a34a,#22c55e,#4ade80)",
                      }} />
                    </div>
                  </div>
                )}
                {profile.fundingPurpose && (
                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
                    <p className="text-xs font-bold tracking-widest mb-1.5" style={{ fontFamily: "'Syne', sans-serif", color: T.muted }}>FUNDING PURPOSE</p>
                    <p className="text-sm leading-relaxed" style={{ color: T.muted }}>{profile.fundingPurpose}</p>
                  </div>
                )}
              </div>
            )}

            {isCreator && <ScoreCard creatorId={profileData._id} />}

            {isInvestor && (
              <div className="p-card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#3b82f6,#1d4ed8)" }} />
                  <p className="font-black text-white" style={{ fontFamily: "'Fraunces', serif", fontSize: "1rem" }}>Investment Preferences</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Budget",         value: profile.investmentBudget  ? `$${Number(profile.investmentBudget).toLocaleString()}` : "—" },
                    { label: "Preferred ROI",  value: profile.preferredROI      ? `${profile.preferredROI}%` : "—" },
                    { label: "Risk",           value: profile.riskTolerance     || "—" },
                    { label: "Duration",       value: profile.preferredDuration ? `${profile.preferredDuration} months` : "—" },
                    { label: "Total Invested", value: profile.totalInvested     ? `$${Number(profile.totalInvested).toLocaleString()}` : "—" },
                  ].map(d => (
                    <div key={d.label} className="p-stat">
                      <p className="text-xs mb-1" style={{ color: T.muted }}>{d.label}</p>
                      <p className="text-sm font-black capitalize" style={{ fontFamily: "'Fraunces', serif", color: "white" }}>{d.value}</p>
                    </div>
                  ))}
                </div>
                {profile.industriesOfInterest?.length > 0 && (
                  <div className="pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                    <p className="text-xs font-bold tracking-widest mb-2" style={{ fontFamily: "'Syne', sans-serif", color: T.muted }}>INDUSTRIES OF INTEREST</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.industriesOfInterest.map(ind => (
                        <span key={ind} className="text-xs px-3 py-1 rounded-full capitalize" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.35)", color: "#3b82f6" }}>
                          {CATEGORY_EMOJI[ind]} {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
              <div className="p-card">
                <p className="text-xs font-bold tracking-widest mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "#22c55e" }}>SOCIAL LINKS</p>
                <div className="flex flex-wrap gap-2">
                  {profile.socialLinks.instagram && <a href={profile.socialLinks.instagram} target="_blank" rel="noreferrer" className="p-social"><Instagram size={13} style={{ color: "#f472b6" }} /> Instagram</a>}
                  {profile.socialLinks.twitter   && <a href={profile.socialLinks.twitter}   target="_blank" rel="noreferrer" className="p-social"><Twitter  size={13} style={{ color: "#38bdf8" }} /> Twitter</a>}
                  {profile.socialLinks.linkedin  && <a href={profile.socialLinks.linkedin}  target="_blank" rel="noreferrer" className="p-social"><Linkedin  size={13} style={{ color: "#3b82f6" }} /> LinkedIn</a>}
                  {profile.socialLinks.website   && <a href={profile.socialLinks.website}   target="_blank" rel="noreferrer" className="p-social"><Globe     size={13} style={{ color: "#22c55e" }} /> Website</a>}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-card">
              <p className="text-xs font-bold tracking-widest mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "#22c55e" }}>QUICK STATS</p>
              <div>
                {isCreator && <>
                  <StatRow icon={<Star      size={13} style={{ color: "#f59e0b" }} />} label="Profile Views"    value={profile.profileViews || 0} />
                  <StatRow icon={<DollarSign size={13} style={{ color: "#22c55e" }} />} label="Amount Raised"  value={`$${Number(profile.amountRaised || 0).toLocaleString()}`} />
                  <StatRow icon={<Users     size={13} style={{ color: "#3b82f6" }} />} label="Active Investors" value={profile.activeInvestors || "—"} />
                  <StatRow icon={<TrendingUp size={13} style={{ color: "#a855f7" }} />} label="Profit Share"   value={profile.profitSharePercentage ? `${profile.profitSharePercentage}%` : "—"} />
                </>}
                {isInvestor && <>
                  <StatRow icon={<Wallet    size={13} style={{ color: "#22c55e" }} />} label="Total Invested"  value={`$${Number(profile.totalInvested || 0).toLocaleString()}`} />
                  <StatRow icon={<BarChart2 size={13} style={{ color: "#3b82f6" }} />} label="Preferred ROI"  value={profile.preferredROI ? `${profile.preferredROI}%` : "—"} />
                  <StatRow icon={<Shield   size={13} style={{ color: "#a855f7" }} />}  label="Risk Tolerance" value={<span className="capitalize">{profile.riskTolerance || "—"}</span>} />
                </>}
              </div>
            </div>

            {isCreator && (
              <div className="p-card" style={profile.isAcceptingInvestments ? { borderColor: "rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.03)" } : {}}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: profile.isAcceptingInvestments ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.3)" }}>
                    {profile.isAcceptingInvestments
                      ? <CheckCircle size={17} style={{ color: "#22c55e" }} />
                      : <Clock       size={17} style={{ color: T.muted }} />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                      {profile.isAcceptingInvestments ? "Open to Invest" : "Not Accepting"}
                    </p>
                    <p className="text-xs" style={{ color: T.muted }}>
                      {profile.isAcceptingInvestments ? "Looking for investors" : "Not currently seeking investment"}
                    </p>
                  </div>
                </div>
                {canInvest && <button onClick={handleInvest} className="p-btn-green"><ArrowUpRight size={14} /> Invest Now</button>}
              </div>
            )}

            {!isOwnProfile && connectionStatus !== "accepted" && (
              <div className="p-card">
                <p className="text-sm mb-3" style={{ color: T.dim }}>
                  {connectionStatus === "pending"
                    ? "Your connection request is pending."
                    : `Connect with ${profileData.name?.split(" ")[0]} to start a conversation.`}
                </p>
                <button
                  onClick={connectionStatus === "accepted" ? () => navigate(`/messages?userId=${id}`) : handleConnect}
                  disabled={connectLoading || connectionStatus === "pending"}
                  className="p-btn-green"
                  style={connectionStatus === "pending" ? { background: "rgba(245,158,11,0.30)", color: "#f59e0b", boxShadow: "none" } : {}}
                >
                  {connectLoading ? <Loader2 size={14} className="animate-spin" />
                    : connectionStatus === "pending" ? <><Clock size={13} /> Request Sent</>
                    : <><UserPlus size={13} /> Connect</>}
                </button>
              </div>
            )}

            {!isOwnProfile && connectionStatus === "accepted" && (
              <button onClick={() => navigate(`/messages?userId=${id}`)} className="p-btn-green">
                <MessageSquare size={14} /> Send Message
              </button>
            )}

            {isOwnProfile && (
              <button onClick={() => navigate("/profile")} className="p-btn-ghost" style={{ width: "100%" }}>
                <UserCheck size={14} /> Edit Your Profile
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══ PORTFOLIO ══ */}
      {activeTab === "portfolio" && isCreator && (
        profile.portfolio?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.portfolio.map(item => (
              <div key={item._id} className="group rounded-2xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <div className="relative h-52 overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity duration-300" />
                </div>
                <div className="p-4">
                  <h4 className="text-white font-black text-sm mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{item.title}</h4>
                  {item.description && <p className="text-xs leading-relaxed line-clamp-2" style={{ color: T.dim }}>{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-12 text-center" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <p className="text-sm" style={{ color: T.muted }}>No portfolio items yet.</p>
          </div>
        )
      )}

      {/* ══ DETAILS ══ */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-card">
            <p className="text-xs font-bold tracking-widest mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "#22c55e" }}>ACCOUNT DETAILS</p>
            <DetailRow label="Role"         value={<span className="capitalize">{profileData.role}</span>} />
            <DetailRow label="Plan"         value={<span className="capitalize">{profileData.plan}</span>} />
            <DetailRow label="Member since" value={profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"} />
            {isCreator && profile.skillCategory && <DetailRow label="Category" value={<span className="capitalize">{profile.skillCategory}</span>} />}
          </div>
          <div className="p-card">
            <p className="text-xs font-bold tracking-widest mb-4" style={{ fontFamily: "'Syne', sans-serif", color: "#22c55e" }}>VERIFICATION STATUS</p>
            {VERIFICATION_BADGES.map(b => (
              <div key={b.key} className="p-row">
                <span className="text-sm" style={{ color: T.dim }}>{b.icon} {b.label}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{
                  fontFamily: "'Syne', sans-serif",
                  background: profileData[b.key] ? "rgba(34,197,94,0.1)" : "rgba(0,0,0,0.3)",
                  border: `1px solid ${profileData[b.key] ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.2)"}`,
                  color: profileData[b.key] ? "#22c55e" : "#9ca3af",
                }}>
                  {profileData[b.key] ? "✓ Verified" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatRow({ icon, label, value }) {
  const T = useT();
  return (
    <div className="p-stat-row">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs" style={{ color: T.muted }}>{label}</span>
      </div>
      <span className="text-sm font-black" style={{ fontFamily: "'Fraunces', serif", color: "white" }}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  const T = useT();
  return (
    <div className="p-row">
      <span className="text-sm" style={{ color: T.dim }}>{label}</span>
      <span className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "white" }}>{value}</span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  const T = useT();
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-3xl" style={{ background: T.card, border: `1px solid ${T.border}` }} />
      <div className="flex items-end gap-4 -mt-10 pl-6">
        <div className="w-20 h-20 rounded-2xl" style={{ background: T.cardAlt }} />
        <div className="space-y-2 pb-2">
          <div className="h-5 rounded-full w-40" style={{ background: "rgba(255,255,255,0.2)" }} />
          <div className="h-3 rounded-full w-24" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-5 space-y-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="h-3 rounded-full w-1/4" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="h-3 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>
          <div className="rounded-2xl p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl" style={{ background: "rgba(255,255,255,0.2)" }} />)}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-3" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
