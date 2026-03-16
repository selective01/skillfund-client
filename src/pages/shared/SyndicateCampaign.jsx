import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faDollarSign, faArrowTrendUp, faClock,
  faCircleCheck, faArrowLeft, faTriangleExclamation,
  faChevronDown, faChevronUp, faShareNodes, faLayerGroup,
  faCircleNotch, faFire, faShield,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import { ScoreBadge } from "../../components/layout/Scorebadge";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

const CATEGORY_EMOJI = {
  fashion:"👗", carpentry:"🪚", farming:"🌾", photography:"📷",
  baking:"🍞", mechanics:"🔧", technology:"💻", hair:"✂️", artisan:"🎨", other:"⚡",
};

// Stat box used in hero
function StatBox({ icon, iconColor, label, value, bg, border }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: bg, border: `1px solid ${border}` }}>
      <FontAwesomeIcon icon={icon} style={{ fontSize: "15px", color: iconColor, display: "block", margin: "0 auto 6px" }} />
      <p className="font-black text-white text-base" style={{ fontFamily: "'Fraunces',serif", lineHeight: 1 }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "#9ca3af", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>{label}</p>
    </div>
  );
}

// Investor row
function InvestorRow({ inv, index, fundingGoal }) {
  const name = inv.investorId?.name || "Investor";
  const pct  = ((inv.amount / fundingGoal) * 100).toFixed(1);
  const COLORS = ["#22c55e","#3b82f6","#a855f7","#14b8a6","#f43f5e","#f59e0b"];
  const color  = COLORS[index % COLORS.length];
  return (
    <div className="flex items-center justify-between rounded-xl px-4 py-3 transition-all" style={{ background: "#0a1209", border: "1px solid rgba(255,255,255,0.2)" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}33`}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black" style={{ background: `${color}18`, border: `1px solid ${color}33`, color }}>
          {name[0].toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Syne',sans-serif" }}>{name}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-black text-white" style={{ fontFamily: "'Fraunces',serif" }}>${inv.amount.toLocaleString()}</p>
        <p className="text-xs" style={{ color: "#9ca3af", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>{inv.sharePercentage || pct}% share</p>
      </div>
    </div>
  );
}

export default function SyndicateCampaign() {
  useNotificationReadOnView();
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [amount, setAmount]     = useState("");
  const [joining, setJoining]   = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showInvestors, setShowInvestors] = useState(false);

  const isInvestor = user?.role === "investor";
  const isCreator  = user?.role === "creator";

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(`/syndicates/${id}`);
      setData(res.data);
    } catch {
      toast.error("Campaign not found");
      navigate("/syndicates");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleJoin = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Please enter a valid amount"); return; }
    setJoining(true);
    try {
      await api.post("/syndicates/join", { syndicateId: id, amount: amt });
      toast.success("Successfully joined the syndicate!");
      setShowJoin(false);
      setAmount("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join syndicate");
    } finally {
      setJoining(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Campaign link copied!");
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "28px", color: "#3b82f6" }} />
        </div>
    );
  }

  if (!data) return null;

  const { syndicate, stats } = data;
  const fundingPct  = stats?.fundingPct || 0;
  const remaining   = syndicate.fundingGoal - syndicate.amountRaised;
  const isOpen      = syndicate.status === "open";
  const alreadyIn   = syndicate.investors?.some(
    inv => inv.investorId?._id === user?._id || inv.investorId === user?._id
  );
  const projROI  = stats?.projectedMonthlyROI;
  const creator  = syndicate.creatorId;
  const isHot    = fundingPct >= 75;
  const slotsLeft = syndicate.maxSlots - (syndicate.investors?.length || 0);

  // Computed share preview
  const amtNum     = parseFloat(amount) || 0;
  const mySharePct = amtNum > 0 ? ((amtNum / syndicate.fundingGoal) * 100).toFixed(1) : null;
  const myMonthly  = amtNum > 0 && projROI
    ? ((amtNum / syndicate.fundingGoal) * projROI * syndicate.profitSharePercentage / 100 * 100).toFixed(0)
    : null;

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .sc-in { animation: fadeUp 0.4s ease forwards; opacity:0; }
        .amt-input { background: #0a1209; border: 1px solid rgba(255,255,255,0.1); color: #fff; width: 100%; border-radius: 12px; padding: 12px 12px 12px 2.2rem; font-family: 'DM Sans',sans-serif; font-size: 14px; transition: border-color 0.2s; }
        .amt-input::placeholder { color: #5a8a63; }
        .amt-input:focus { outline: none; border-color: rgba(59,130,246,0.45); box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Nav row ── */}
        <div className="sc-in flex items-center justify-between" style={{ animationDelay: "0s" }}>
          <button onClick={() => navigate("/syndicates")} className="flex items-center gap-2 text-sm font-bold transition-colors" style={{ fontFamily: "'Syne',sans-serif", color: "#9ca3af" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
            <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "12px" }} /> Back to Syndicates
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 text-sm font-bold transition-colors" style={{ fontFamily: "'Syne',sans-serif", color: "#9ca3af" }}
            onMouseEnter={e => e.currentTarget.style.color = "#3b82f6"} onMouseLeave={e => e.currentTarget.style.color = "#9ca3af"}>
            <FontAwesomeIcon icon={faShareNodes} style={{ fontSize: "13px" }} /> Share
          </button>
        </div>

        {/* ── Hero card ── */}
        <div className="sc-in relative rounded-3xl overflow-hidden" style={{ animationDelay: ".06s", background: "linear-gradient(135deg,#0f2244 0%,#091830 60%,#040806 100%)", border: "1px solid rgba(59,130,246,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          {/* Top glow strip */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg,transparent,#3b82f6,transparent)" }} />
          {/* BG glow */}
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)", filter: "blur(24px)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />

          <div className="relative p-6 space-y-5">
            {/* Title row */}
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)" }}>
                  {CATEGORY_EMOJI[syndicate.skillCategory] || "⚡"}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: "11px", color: "#3b82f6" }} />
                    <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "#3b82f6" }}>SYNDICATE</span>
                    {isHot && (
                      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.30)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontFamily: "'Syne',sans-serif" }}>
                        <FontAwesomeIcon icon={faFire} style={{ fontSize: "9px" }} /> HOT
                      </span>
                    )}
                  </div>
                  <h1 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.3rem,2.5vw,1.8rem)" }}>{syndicate.title}</h1>
                  <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                    by <span className="text-white font-semibold">{creator?.name}</span> · <span className="capitalize">{syndicate.skillCategory}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{
                  fontFamily: "'Syne',sans-serif",
                  background: isOpen ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.18)",
                  border: isOpen ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.2)",
                  color: isOpen ? "#22c55e" : "#6b7280",
                }}>
                  {isOpen ? "● Accepting Investors" : syndicate.status}
                </span>
                <ScoreBadge creatorId={creator?._id} />
              </div>
            </div>

            {/* Funding progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="font-black text-white text-2xl" style={{ fontFamily: "'Fraunces',serif" }}>${syndicate.amountRaised.toLocaleString()}</span>
                <span className="text-sm" style={{ color: "#9ca3af" }}>of ${syndicate.fundingGoal.toLocaleString()} goal</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.18)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(fundingPct, 100)}%`, background: "linear-gradient(90deg,#2563eb,#3b82f6,#60a5fa)" }} />
              </div>
              <div className="flex justify-between text-xs" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>
                <span style={{ color: "#3b82f6" }}>{fundingPct}% funded</span>
                <span style={{ color: "#9ca3af" }}>${remaining.toLocaleString()} remaining · {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} left</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox icon={faUsers}        iconColor="#3b82f6" label="Investors"    value={`${syndicate.investors?.length || 0}/${syndicate.maxSlots}`}  bg="rgba(59,130,246,0.08)"  border="rgba(59,130,246,0.30)" />
              <StatBox icon={faArrowTrendUp} iconColor="#22c55e" label="Profit Share" value={`${syndicate.profitSharePercentage}%`}                          bg="rgba(34,197,94,0.08)"   border="rgba(34,197,94,0.30)"  />
              <StatBox icon={faClock}        iconColor="#a855f7" label="Duration"     value={`${syndicate.duration}mo`}                                       bg="rgba(168,85,247,0.08)"  border="rgba(168,85,247,0.30)" />
              <StatBox icon={faDollarSign}   iconColor="#f59e0b" label="Monthly ROI"  value={projROI ? `$${projROI.toFixed(0)}/slot` : "—"}                  bg="rgba(245,158,11,0.08)"  border="rgba(245,158,11,0.30)" />
            </div>

            {/* ── Invest CTA ── */}
            {isInvestor && isOpen && !alreadyIn && (
              <div>
                {!showJoin ? (
                  <button
                    onClick={() => setShowJoin(true)}
                    className="w-full font-bold text-sm py-3.5 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", boxShadow: "0 4px 20px rgba(59,130,246,0.35)" }}
                  >
                    Invest in This Campaign
                  </button>
                ) : (
                  <div className="rounded-2xl p-5 space-y-4" style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.35)" }}>
                    <div>
                      <p className="font-bold text-white text-sm mb-0.5" style={{ fontFamily: "'Syne',sans-serif" }}>Enter your investment amount</p>
                      <p className="text-xs" style={{ color: "#9ca3af" }}>
                        Minimum: <span style={{ color: "#9ca3af" }}>${syndicate.minInvestment.toLocaleString()}</span> · Available: <span style={{ color: "#9ca3af" }}>${remaining.toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="relative">
                      <FontAwesomeIcon icon={faDollarSign} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "12px", pointerEvents: "none" }} />
                      <input
                        type="number"
                        className="amt-input"
                        placeholder={`Min $${syndicate.minInvestment}`}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        min={syndicate.minInvestment}
                        max={remaining}
                      />
                    </div>
                    {amtNum > 0 && (
                      <div className="rounded-xl p-3.5 space-y-2" style={{ background: "#0a1209", border: "1px solid rgba(59,130,246,0.30)" }}>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "#9ca3af", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>YOUR SHARE</span>
                          <span className="font-black text-white" style={{ fontFamily: "'Fraunces',serif" }}>{mySharePct}%</span>
                        </div>
                        {myMonthly && (
                          <div className="flex justify-between text-xs">
                            <span style={{ color: "#9ca3af", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>EST. MONTHLY RETURN</span>
                            <span className="font-black" style={{ fontFamily: "'Fraunces',serif", color: "#22c55e" }}>${myMonthly}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={handleJoin}
                        disabled={joining}
                        className="flex-1 font-bold text-sm py-3 rounded-xl transition-all hover:scale-[1.01] disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff" }}
                      >
                        {joining ? <><FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "13px" }} /> Processing...</> : "Confirm Investment"}
                      </button>
                      <button
                        onClick={() => { setShowJoin(false); setAmount(""); }}
                        className="flex-1 font-bold text-sm py-3 rounded-xl transition-all"
                        style={{ fontFamily: "'Syne',sans-serif", background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.2)", color: "#6b7280" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#fff"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; e.currentTarget.style.color = "#6b7280"; }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {alreadyIn && (
              <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)" }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "15px", color: "#22c55e", flexShrink: 0 }} />
                <p className="text-sm font-bold" style={{ color: "#22c55e", fontFamily: "'Syne',sans-serif" }}>You are invested in this syndicate</p>
              </div>
            )}

            {isCreator && (
              <div className="flex items-center gap-3 rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "14px", color: "#9ca3af", flexShrink: 0 }} />
                <p className="text-sm" style={{ color: "#9ca3af", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>This is your syndicate campaign</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Story ── */}
        <div className="sc-in rounded-2xl p-6" style={{ animationDelay: ".12s", background: "#070d08", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#3b82f6,#2563eb)" }} />
            <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.05rem" }}>The Story</h2>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#9ca3af", fontFamily: "'DM Sans',sans-serif" }}>{syndicate.story}</p>
        </div>

        {/* ── Business Plan ── */}
        <div className="sc-in rounded-2xl p-6" style={{ animationDelay: ".16s", background: "#070d08", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#22c55e,#16a34a)" }} />
            <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.05rem" }}>Business Plan</h2>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#9ca3af", fontFamily: "'DM Sans',sans-serif" }}>{syndicate.businessPlan}</p>
        </div>

        {/* ── Investors list ── */}
        <div className="sc-in rounded-2xl overflow-hidden" style={{ animationDelay: ".2s", background: "#070d08", border: "1px solid rgba(255,255,255,0.2)" }}>
          <button
            className="flex items-center justify-between w-full p-6 transition-colors"
            onClick={() => setShowInvestors(v => !v)}
            onMouseEnter={e => e.currentTarget.style.background = "#0a1209"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#a855f7,#7c3aed)" }} />
              <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.05rem" }}>
                Investors <span style={{ color: "#9ca3af" }}>({syndicate.investors?.length || 0})</span>
              </h2>
            </div>
            <FontAwesomeIcon icon={showInvestors ? faChevronUp : faChevronDown} style={{ fontSize: "13px", color: "#9ca3af" }} />
          </button>

          {showInvestors && (
            <div className="px-6 pb-6 space-y-2">
              {!syndicate.investors?.length ? (
                <p className="text-sm py-4 text-center" style={{ color: "#9ca3af" }}>No investors yet — be the first!</p>
              ) : (
                syndicate.investors.map((inv, i) => (
                  <InvestorRow key={inv.investorId?._id || i} inv={inv} index={i} fundingGoal={syndicate.fundingGoal} />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── How it works ── */}
        <div className="sc-in rounded-2xl p-6" style={{ animationDelay: ".24s", background: "linear-gradient(135deg,#0f2e10,#091e09)", border: "1px solid rgba(34,197,94,0.30)" }}>
          <div className="flex items-center gap-2 mb-4">
            <FontAwesomeIcon icon={faShield} style={{ fontSize: "13px", color: "#22c55e" }} />
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: "'Syne',sans-serif" }}>How syndicate investing works</h3>
          </div>
          <div className="space-y-2.5">
            {[
              { n:"01", text:"Multiple investors pool capital to fund one creator together." },
              { n:"02", text:"Each investor earns a share of monthly profit proportional to their investment." },
              { n:"03", text:"Milestones require majority approval (51%+ of capital) before funds release." },
              { n:"04", text:"If you need to exit, request a share transfer — admin processes within 48 hours." },
            ].map(item => (
              <div key={item.n} className="flex items-start gap-3">
                <span className="text-xs font-black flex-shrink-0 mt-0.5" style={{ fontFamily: "'Fraunces',serif", color: "#22c55e" }}>{item.n}</span>
                <p className="text-sm" style={{ color: "#6b7280", fontFamily: "'DM Sans',sans-serif" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
