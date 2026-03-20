import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift, faCopy, faCircleCheck, faCircleNotch, faArrowTrendDown,
  faUsers, faChartLine, faLink,
  faPercent, faClock, faStar,
} from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp, faXTwitter, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";
import useThemeStore from "../../store/useThemeStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtPct = (n) => `${Number(n || 0).toFixed(2)}%`;

function StatCard({ icon, label, value, accent = "#22c55e", sub }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _bg = _L ? "#f4faf5" : "#040806";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const _heroGrad = _L
    ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)"
    : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)";
  const _heroBorder = _L ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.25)";

  return (
    <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${accent}12`, border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: "14px", color: accent }} />
      </div>
      <div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.2rem", color: accent, lineHeight: 1, marginBottom: "3px" }}>{value}</p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: _dim }}>{label}</p>
        {sub && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4a5568", marginTop: "2px" }}>{sub}</p>}
      </div>
    </div>
  );
}

function ReferralRow({ referral }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _bg = _L ? "#f4faf5" : "#040806";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const _heroGrad = _L
    ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)"
    : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)";
  const _heroBorder = _L ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.25)";

  const statusCfg = {
    pending:    { label: "Signed Up",     color: _dim, bg: "rgba(107,114,128,0.1)",  border: "rgba(107,114,128,0.2)"  },
    subscribed: { label: "Subscribed",    color: "#3b82f6", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.25)"  },
    invested:   { label: "Invested",      color: "#a855f7", bg: "rgba(168,85,247,0.1)",   border: "rgba(168,85,247,0.25)"  },
    completed:  { label: "Fully Active",  color: "#22c55e", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.25)"   },
  };
  const s = statusCfg[referral.status] || statusCfg.pending;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1rem", color: "#000", flexShrink: 0 }}>
        {(referral.referredName || "U")[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "13px", color: _text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {referral.referredName || "Anonymous User"}
        </p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4a5568", margin: 0 }}>
          Joined {new Date(referral.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
      <div style={{ display: "flex", flex: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "10px", padding: "3px 8px", borderRadius: "100px", background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
          {s.label}
        </span>
        {referral.reductionEarned > 0 && (
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "12px", color: "#22c55e", margin: 0 }}>
            -{fmtPct(referral.reductionEarned)} rate
          </p>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReferralProgramme() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _bg = _L ? "#f4faf5" : "#040806";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const _heroGrad = _L
    ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)"
    : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)";
  const _heroBorder = _L ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.25)";

  useNotificationReadOnView();
  const { user } = useAuthStore();

  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [generating, setGenerating] = useState(false);

  const isInvestor = user?.role === "investor";

  // ─── Load referral data ───────────────────────────────────────────────────
  useEffect(() => {
    api.get("/referrals/my-stats")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Generate code if none ───────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.get("/referrals/my-code");
      setData((p) => ({ ...p, referralCode: res.data.referralCode, referralLink: res.data.referralLink }));
      toast.success("Referral link generated!");
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Copy link ────────────────────────────────────────────────────────────
  const handleCopy = () => {
    const link = data?.referralLink || `${window.location.origin}/join?ref=${data?.referralCode}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  // ─── Share helpers ────────────────────────────────────────────────────────
  const shareLink  = data?.referralLink || `${window.location.origin}/join?ref=${data?.referralCode || ""}`;
  const shareText  = isInvestor
    ? `Join me on SkillFund — invest in Africa's skilled creators and earn real returns. Use my link to get a reduced commission rate on your first investment:`
    : `Join me on SkillFund — get funded for your skill with no debt, no interest. Use my link to get a reduced fee on your first withdrawal:`;

  const whatsappUrl  = `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + shareLink)}`;
  const twitterUrl   = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareLink)}`;
  const linkedinUrl  = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "22px", color: "#22c55e" }} />
    </div>
  );

  const referrals      = data?.referrals || [];
  const totalReduction = data?.totalReductionEarned || 0;
  const currentRate    = data?.currentRate || null;
  const standardRate   = data?.standardRate || null;
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter((r) => r.status === "subscribed" || r.status === "invested" || r.status === "completed").length;

  return (
    <div style={{ maxWidth: "680px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .rp-btn-green { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:900; font-size:13px; padding:11px 20px; border-radius:13px; cursor:pointer; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; border:none; transition:.15s; box-shadow:0 4px 16px rgba(34,197,94,0.2); white-space:nowrap; }
        .rp-btn-green:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 6px 24px rgba(34,197,94,0.3); }
        .rp-btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; }
        .rp-btn-ghost { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:700; font-size:13px; padding:10px 18px; border-radius:12px; cursor:pointer; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); color:#9ca3af; transition:.15s; white-space:nowrap; text-decoration:none; }
        .rp-btn-ghost:hover { border-color:rgba(34,197,94,0.25); color:white; }
        .rp-share-btn { display:flex; align-items:center; gap:8px; padding:10px 16px; border-radius:12px; cursor:pointer; font-family:'Inter', sans-serif; font-weight:700; font-size:12px; transition:.15s; text-decoration:none; border:1px solid rgba(255,255,255,0.08); background:#0a1209; color:#9ca3af; flex:1; justify-content:center; }
        .rp-share-btn:hover { color:white; }
        .rp-reward-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .rp-reward-row:last-child { border-bottom:none; }
      `}</style>

      {/* ── Hero header ── */}
      <div style={{ background: _heroGrad, border: `1px solid ${_heroBorder}`, borderRadius: "24px", padding: "24px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.12),transparent)", transform: "translate(30%,-30%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FontAwesomeIcon icon={faGift} style={{ fontSize: "13px", color: "#22c55e" }} />
            </div>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".1em" }}>REFERRAL PROGRAMME</span>
          </div>
          <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "clamp(1.3rem,3vw,1.8rem)", color: _text, margin: "0 0 6px", lineHeight: 1.1 }}>
            Invite people.<br />Pay less, forever.
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, margin: "0 0 16px", lineHeight: 1.6, maxWidth: "420px" }}>
            Every successful referral permanently reduces your {isInvestor ? "investment commission rate" : "withdrawal fee rate"}. The more you invite, the less you pay — with no expiry.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 14px", borderRadius: "12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <FontAwesomeIcon icon={faStar} style={{ fontSize: "11px", color: "#22c55e" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: "#22c55e" }}>
              Reductions are permanent — they never expire
            </span>
          </div>
        </div>
      </div>

      {/* ── Current rate card ── */}
      {currentRate !== null && (
        <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "20px", padding: "20px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".08em", marginBottom: "4px" }}>
              YOUR CURRENT {isInvestor ? "COMMISSION" : "WITHDRAWAL"} RATE
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "2.5rem", color: "#22c55e", lineHeight: 1 }}>{fmtPct(currentRate)}</span>
              {standardRate && currentRate < standardRate && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.1rem", color: "#4a5568", textDecoration: "line-through" }}>{fmtPct(standardRate)}</span>
              )}
            </div>
            {totalReduction > 0 && (
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginTop: "4px" }}>
                You've saved {fmtPct(totalReduction)} through referrals
              </p>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#4a5568", marginBottom: "4px" }}>FLOOR RATE</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: _dim }}>
              {isInvestor ? "2.00%" : user?.plan === "elite" ? "0.50%" : user?.plan === "pro" ? "1.00%" : "2.00%"}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4a5568", marginTop: "2px" }}>minimum possible</p>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
        <StatCard icon={faUsers}        label="Total Referrals"  value={totalReferrals}                  accent="#22c55e" />
        <StatCard icon={faChartLine}    label="Active"           value={activeReferrals}                 accent="#3b82f6" sub="subscribed or invested" />
        <StatCard icon={faArrowTrendDown} label="Rate Saved"     value={fmtPct(totalReduction)}          accent="#a855f7" sub="total reduction earned" />
      </div>

      {/* ── Referral link card ── */}
      <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "20px", padding: "22px", marginBottom: "16px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.05rem", color: _text, marginBottom: "4px" }}>Your Referral Link</p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, marginBottom: "16px" }}>Share this link. Anyone who signs up through it is tagged to you — automatically.</p>

        {data?.referralCode ? (
          <>
            {/* Link display */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "12px", background: _input, border: `1px solid ${_cardBorder}`, overflow: "hidden" }}>
                <FontAwesomeIcon icon={faLink} style={{ fontSize: "12px", color: "#22c55e", flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {data?.referralLink || `${window.location.origin}/join?ref=${data.referralCode}`}
                </span>
              </div>
              <button onClick={handleCopy} className="rp-btn-green" style={{ padding: "11px 16px", flexShrink: 0 }}>
                <FontAwesomeIcon icon={copied ? faCircleCheck : faCopy} style={{ fontSize: "13px" }} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Referral code pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568" }}>Your code:</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "14px", color: "#22c55e", padding: "3px 12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", letterSpacing: ".08em" }}>
                {data.referralCode}
              </span>
            </div>

            {/* Share buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rp-share-btn" style={{ borderColor: "rgba(37,211,102,0.2)" }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(37,211,102,0.5)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(37,211,102,0.2)"}
              >
                <FontAwesomeIcon icon={faWhatsapp} style={{ fontSize: "14px", color: "#25d366" }} /> WhatsApp
              </a>
              <a href={twitterUrl} target="_blank" rel="noreferrer" className="rp-share-btn"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              >
                <FontAwesomeIcon icon={faXTwitter} style={{ fontSize: "13px", color: _muted }} /> X
              </a>
              <a href={linkedinUrl} target="_blank" rel="noreferrer" className="rp-share-btn"
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(10,102,194,0.4)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              >
                <FontAwesomeIcon icon={faLinkedin} style={{ fontSize: "13px", color: "#0a66c2" }} /> LinkedIn
              </a>
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "32px 20px", border: "2px dashed rgba(255,255,255,0.08)", borderRadius: "14px" }}>
            <FontAwesomeIcon icon={faLink} style={{ fontSize: "28px", color: "#2d4a31", marginBottom: "12px" }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, marginBottom: "16px" }}>
              You don't have a referral link yet. Generate one to start sharing.
            </p>
            <button onClick={handleGenerate} disabled={generating} className="rp-btn-green" style={{ margin: "0 auto", maxWidth: "220px" }}>
              <FontAwesomeIcon icon={generating ? faCircleNotch : faGift} spin={generating} style={{ fontSize: "12px" }} />
              {generating ? "Generating..." : "Generate My Link"}
            </button>
          </div>
        )}
      </div>

      {/* ── How it works ── */}
      <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "20px", padding: "22px", marginBottom: "16px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.05rem", color: _text, marginBottom: "4px" }}>How Rewards Work</p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, marginBottom: "20px" }}>
          You earn permanent rate reductions — not credits or vouchers. Reductions stack as you refer more people.
        </p>

        {/* Reward table */}
        <div style={{ background: _input, border: `1px solid ${_cardBorder}`, borderRadius: "14px", padding: "14px 16px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "10px", color: "#4a5568", letterSpacing: ".08em" }}>ACTION</span>
            <div style={{ display: "flex", gap: "40px" }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "10px", color: "#4a5568", letterSpacing: ".08em" }}>YOU EARN</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "10px", color: "#4a5568", letterSpacing: ".08em" }}>THEY GET</span>
            </div>
          </div>

          {[
            { action: "Referred user subscribes to any paid plan",       you: "-0.25% rate",  they: "-0.5% first txn", condition: "Within 30 days" },
            { action: isInvestor ? "Referred investor closes first deal" : "Referred creator gets first investment", you: "-0.5% rate", they: "—", condition: "Deal must lock" },
            { action: "Referred user completes KYC verification",        you: "-0.1% rate",   they: "-0.25% first txn", condition: "KYC approved"   },
          ].map((row, i) => (
            <div key={i} className="rp-reward-row">
              <div style={{ flex: 1, minWidth: 0, paddingRight: "12px" }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _muted, margin: "0 0 2px", lineHeight: 1.4 }}>{row.action}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4a5568", margin: 0 }}>{row.condition}</p>
              </div>
              <div style={{ display: "flex", gap: "28px", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "13px", color: "#22c55e", width: "72px", textAlign: "center" }}>{row.you}</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "13px", color: _dim, width: "72px", textAlign: "center" }}>{row.they}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Floor rates */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#4a5568", width: "100%", marginBottom: "4px", letterSpacing: ".06em" }}>FLOOR RATES — REDUCTIONS CANNOT GO BELOW:</p>
          {[
            { label: isInvestor ? "Investment commission" : "Starter withdrawal", rate: isInvestor ? "2%" : "2%", color: "#22c55e" },
            { label: "Pro plan withdrawal",   rate: "1%",    color: "#3b82f6" },
            { label: "Elite plan withdrawal", rate: "0.5%",  color: "#a855f7" },
          ].map((f) => (
            <span key={f.label} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", padding: "5px 12px", borderRadius: "100px", background: `${f.color}10`, border: `1px solid ${f.color}25`, color: f.color }}>
              <FontAwesomeIcon icon={faPercent} style={{ fontSize: "9px" }} /> {f.label}: {f.rate} floor
            </span>
          ))}
        </div>
      </div>

      {/* ── Referral history ── */}
      <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "20px", padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.05rem", color: _text, margin: "0 0 2px" }}>Referral History</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _dim, margin: 0 }}>
              {totalReferrals} {totalReferrals === 1 ? "person" : "people"} referred · {activeReferrals} active
            </p>
          </div>
          {totalReduction > 0 && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "10px", color: "#4a5568", marginBottom: "2px", letterSpacing: ".06em" }}>TOTAL EARNED</p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: "#22c55e", margin: 0 }}>-{fmtPct(totalReduction)}</p>
            </div>
          )}
        </div>

        {referrals.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", border: "2px dashed rgba(255,255,255,0.05)", borderRadius: "14px" }}>
            <FontAwesomeIcon icon={faUsers} style={{ fontSize: "28px", color: "#2d4a31", marginBottom: "10px" }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "13px", color: _dim, marginBottom: "4px" }}>No referrals yet</p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568" }}>Share your link to start earning rate reductions</p>
          </div>
        ) : (
          <div>
            {referrals.map((r, i) => <ReferralRow key={r._id || i} referral={r} />)}
          </div>
        )}
      </div>

      {/* ── Why this beats credits ── */}
      <div style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.1)", borderRadius: "18px", padding: "18px 20px", marginTop: "16px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".08em", marginBottom: "10px" }}>
          WHY RATE REDUCTIONS BEAT CREDITS
        </p>
        {[
          { icon: faClock,         text: "Credits expire. Rate reductions are permanent — they're locked into your account forever."           },
          { icon: faChartLine,     text: "The more volume you do, the more valuable a lower rate becomes. A 1% reduction on $50k is $500."   },
          { icon: faArrowTrendDown, text: "Reductions compound. Each referral adds to your running rate — no cap on how low it can go (until floor)." },
          { icon: faStar,          text: "Serious investors and creators think in terms of rates, not vouchers. This is built for you."        },
        ].map((item) => (
          <div key={item.text} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
            <FontAwesomeIcon icon={item.icon} style={{ fontSize: "11px", color: "#22c55e", marginTop: "3px", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", lineHeight: 1.5, margin: 0 }}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
