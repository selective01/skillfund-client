import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileContract, faXmark, faLock, faCircleCheck,
  faHandshake, faCircleNotch, faCalendarDays,
  faArrowTrendUp, faPercent, faDollarSign,
  faTriangleExclamation, faStamp,
  faShieldHalved, faChevronDown,
  faCreditCard, faBitcoinSign, faCopy, faClock,
  faCheckCircle, faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import api from "../../utils/api";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) {
  const v = parseFloat(n) || 0;
  return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toLocaleString()}`;
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ── Collapsible Clause ────────────────────────────────────────────────────────
function Clause({ number, title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: "1px solid rgba(34,197,94,0.1)", borderRadius: "12px",
      overflow: "hidden", marginBottom: "8px", background: "rgba(10,18,9,0.6)",
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 14px", background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{
          width: "22px", height: "22px", borderRadius: "6px", flexShrink: 0,
          background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "10px", color: "#22c55e",
        }}>{number}</span>
        <span style={{ flex: 1, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "12px", color: "#e5e7eb" }}>
          {title}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          style={{ fontSize: "10px", color: "#5a8a63", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}
        />
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px 48px" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#9ca3af", lineHeight: "1.7", margin: 0 }}>
            {children}
          </p>
        </div>
      )}
    </div>
  );
}

// ── USDT Countdown Timer ──────────────────────────────────────────────────────
function CountdownTimer({ expiresAt }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return (
    <span style={{ fontFamily: "monospace", fontWeight: 800, color: "#f59e0b" }}>
      {remaining || "—"}
    </span>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AgreementModal({ proposal, currentUser, onLocked, onClose }) {
  // steps: "review" → "choose_payment" → "paystack_redirect" | "usdt_waiting" → "locked"
  const [step, setStep]                   = useState("review");
  const [agreed, setAgreed]               = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("paystack");
  const [loading, setLoading]             = useState(false);
  const [paystackUrl, setPaystackUrl]     = useState("");
  const [usdtData, setUsdtData]           = useState(null);
  const [copied, setCopied]               = useState(false);
  const pollRef                           = useRef(null);

  const isInvestor   = currentUser?.role === "investor";
  const startDate    = new Date();
  const endDate      = addMonths(startDate, proposal?.duration || 0);
  const projectedROI = ((proposal?.amount || 0) * (proposal?.profitSharePercentage || 0) / 100) * (proposal?.duration || 0);
  const nairaRate    = Number(import.meta.env.VITE_NAIRA_RATE) || 1500;

  // Clean up USDT polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (!proposal) return null;

  // ── Initiate escrow payment ───────────────────────────────────────────────
  const handleInitiatePayment = async () => {
    setLoading(true);
    try {
      const res = await api.post("/escrow/initiate", {
        proposalId: proposal._id,
        paymentProvider: paymentMethod,
      });
      if (!res.data.success) throw new Error(res.data.message);

      if (paymentMethod === "paystack") {
        setPaystackUrl(res.data.paymentUrl);
        setStep("paystack_redirect");
        setTimeout(() => { window.location.href = res.data.paymentUrl; }, 1800);
      } else {
        setUsdtData(res.data);
        setStep("usdt_waiting");
        startUsdtPolling(res.data.paymentId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  // ── USDT polling every 15s ────────────────────────────────────────────────
  const startUsdtPolling = (paymentId) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get(`/escrow/nowpayments/status/${paymentId}`);
        if (res.data.isConfirmed) {
          clearInterval(pollRef.current);
          setStep("locked");
          if (onLocked) onLocked(null);
        }
      } catch (e) { void e; }
    }, 15000);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(usdtData?.payAddress || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(4,8,6,0.92)", backdropFilter: "blur(8px)", padding: "16px",
    }}>
      <style>{`
        @keyframes agFadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes agStamp  { 0%{transform:scale(2) rotate(-15deg);opacity:0} 60%{transform:scale(.9) rotate(3deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
        .ag-modal { animation: agFadeUp .3s ease; }
        .ag-scroll::-webkit-scrollbar { width:4px; }
        .ag-scroll::-webkit-scrollbar-thumb { background:rgba(34,197,94,0.2); border-radius:4px; }
        .ag-scroll::-webkit-scrollbar-track { background:transparent; }
        .ag-clause-check { width:16px;height:16px;border-radius:4px;border:2px solid rgba(34,197,94,0.4);background:transparent;cursor:pointer;flex-shrink:0;transition:all .15s;appearance:none; }
        .ag-clause-check:checked { background:#22c55e;border-color:#22c55e; }
        .ag-pay-method { width:100%;display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:12px;cursor:pointer;text-align:left;transition:all .15s;border:1px solid rgba(255,255,255,0.07);background:#070d08;margin-bottom:10px; }
        .ag-pay-method:hover { border-color:rgba(34,197,94,0.3); }
        .ag-pay-method.selected { border-color:rgba(34,197,94,0.5);background:rgba(34,197,94,0.06); }
      `}</style>

      <div
        className="ag-modal"
        style={{
          width: "100%", maxWidth: "600px", maxHeight: "92vh",
          background: "#040806",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: "24px", overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,197,94,0.05)",
        }}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: "20px 22px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "linear-gradient(135deg,#0a1f0c,#040806)",
          flexShrink: 0, display: "flex", alignItems: "flex-start", gap: "14px",
        }}>
          <div style={{
            width: "44px", height: "44px", borderRadius: "13px", flexShrink: 0,
            background: "linear-gradient(135deg,rgba(34,197,94,0.15),rgba(22,163,74,0.08))",
            border: "1px solid rgba(34,197,94,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <FontAwesomeIcon icon={faFileContract} style={{ fontSize: "18px", color: "#22c55e" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "10px", color: "#22c55e", letterSpacing: ".1em", textTransform: "uppercase" }}>
                SkillFund Agreement
              </span>
              <span style={{
                fontSize: "9px", fontWeight: 700, padding: "2px 7px", borderRadius: "999px",
                background: step === "locked" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.1)",
                color: step === "locked" ? "#22c55e" : "#f59e0b",
                fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: "uppercase", letterSpacing: ".05em",
              }}>
                {step === "locked" ? "✓ Executed" : "Pending Signature"}
              </span>
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "1.15rem", color: "#fff", margin: 0 }}>
              Investment Agreement
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#6b7280", margin: "2px 0 0" }}>
              Ref: SF-{proposal._id?.slice(-8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "4px", flexShrink: 0 }}
          >
            <FontAwesomeIcon icon={faXmark} style={{ fontSize: "16px" }} />
          </button>
        </div>

        {/* ── Key Terms Banner ────────────────────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
        }}>
          {[
            { icon: faDollarSign,   label: "Investment",    value: fmt(proposal.amount),                 color: "#22c55e" },
            { icon: faPercent,      label: "Profit Share",  value: `${proposal.profitSharePercentage}%`, color: "#3b82f6" },
            { icon: faCalendarDays, label: "Duration",      value: `${proposal.duration} months`,        color: "#a855f7" },
            { icon: faArrowTrendUp, label: "Projected ROI", value: fmt(projectedROI),                    color: "#f59e0b" },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ padding: "14px 12px", textAlign: "center", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <FontAwesomeIcon icon={icon} style={{ fontSize: "13px", color, marginBottom: "5px", display: "block" }} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: "#6b7280", margin: "0 0 2px" }}>{label}</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "13px", color: "#fff", margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="ag-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>

          {/* ════ STEP: REVIEW ════ */}
          {step === "review" && (
            <>
              {/* Parties */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                {[
                  { role: "Investor", name: proposal.investor?.name || "Investor", email: proposal.investor?.email, color: "#3b82f6" },
                  { role: "Creator",  name: proposal.creator?.name  || "Creator",  email: proposal.creator?.email,  color: "#22c55e" },
                ].map(({ role, name, email, color }) => (
                  <div key={role} style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "13px" }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "9px", color, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "6px" }}>
                      {role}
                    </p>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "13px", color: "#fff", margin: "0 0 2px" }}>{name}</p>
                    {email && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#6b7280", margin: 0 }}>{email}</p>}
                  </div>
                ))}
              </div>

              {/* Dates */}
              <div style={{
                background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)",
                borderRadius: "12px", padding: "12px 14px", marginBottom: "18px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "10px", fontWeight: 700, color: "#5a8a63", marginBottom: "3px" }}>START DATE</p>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "13px", color: "#22c55e", margin: 0 }}>{fmtDate(startDate)}</p>
                </div>
                <div style={{ width: "40px", height: "1px", background: "rgba(34,197,94,0.2)" }} />
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "10px", fontWeight: 700, color: "#5a8a63", marginBottom: "3px" }}>END DATE</p>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "13px", color: "#22c55e", margin: 0 }}>{fmtDate(endDate)}</p>
                </div>
              </div>

              {/* Additional Terms */}
              {proposal.terms && (
                <div style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "13px 14px", marginBottom: "18px" }}>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "10px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: "6px" }}>
                    Additional Terms
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#d1d5db", margin: 0, lineHeight: "1.6", fontStyle: "italic" }}>
                    "{proposal.terms}"
                  </p>
                </div>
              )}

              {/* Legal Clauses */}
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "10px", color: "#5a8a63", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "10px" }}>
                Legal Terms & Conditions
              </p>

              <Clause number="1" title="Escrow Protection">
                Your investment funds are held in SkillFund's escrow system and released to the creator only upon verified milestone completion. Funds are never transferred directly to the creator without formal proof and approval.
              </Clause>
              <Clause number="2" title="Milestone-Based Release">
                The creator must submit documented proof (photos, receipts, video) for each milestone. The investor has 72 hours to approve or dispute each submission. No response within 72 hours triggers automatic release to the creator.
              </Clause>
              <Clause number="3" title="Profit Share Obligation">
                The Creator agrees to pay the Investor {proposal.profitSharePercentage}% of verified monthly income for {proposal.duration} months from the Start Date. Payments shall be reported monthly and disbursed within 7 business days of each report submission.
              </Clause>
              <Clause number="4" title="Platform Fee">
                SkillFund charges a 1% platform fee on each milestone release. This fee is automatically deducted before funds are credited to the creator and covers payment processing, escrow management, and dispute resolution.
              </Clause>
              <Clause number="5" title="Reporting & Transparency">
                The Creator is required to submit monthly earnings reports truthfully and on time. The Investor has the right to request evidence of reported income. False reporting constitutes grounds for immediate dispute and potential legal action.
              </Clause>
              <Clause number="6" title="Dispute Resolution">
                Any disputes shall first be submitted to SkillFund's internal dispute resolution process. Both parties agree to participate in good faith mediation before pursuing external legal remedies. Admin decisions are binding within the platform.
              </Clause>
              <Clause number="7" title="Early Termination">
                Either party may request early termination with 30 days written notice. Outstanding profit-share obligations for completed months remain payable. Unreleased escrow funds are subject to admin review before return.
              </Clause>
              <Clause number="8" title="Governing Law">
                This agreement is governed by the laws of the Federal Republic of Nigeria and applicable international commercial law. Both parties consent to SkillFund's arbitration process as the first point of redress.
              </Clause>

              {/* Warning */}
              <div style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: "12px", padding: "12px 14px", marginTop: "16px",
              }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "13px", color: "#f59e0b", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#d97706", margin: 0, lineHeight: "1.6" }}>
                  Once locked, this agreement is binding. Investment terms cannot be modified without mutual consent from both parties submitted through the SkillFund platform.
                </p>
              </div>
            </>
          )}

          {/* ════ STEP: CHOOSE PAYMENT ════ */}
          {step === "choose_payment" && (
            <>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "10px", color: "#5a8a63", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "14px" }}>
                Select Payment Method
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#9ca3af", lineHeight: "1.6", marginBottom: "18px" }}>
                Your <span style={{ color: "#fff", fontWeight: 700 }}>{fmt(proposal.amount)}</span> will be held in SkillFund escrow and released to the creator milestone by milestone — you stay in control at every stage.
              </p>

              {[
                {
                  id: "paystack",
                  icon: faCreditCard,
                  label: "Card / Bank Transfer",
                  sub: `Pay ₦${(proposal.amount * nairaRate).toLocaleString()} via Paystack — instant confirmation`,
                  badge: "Recommended",
                },
                {
                  id: "nowpayments",
                  icon: faBitcoinSign,
                  label: "USDT (Crypto)",
                  sub: `Send ${proposal.amount} USDT on ERC-20 (Ethereum) — stablecoin`,
                  badge: null,
                },
              ].map(({ id, icon, label, sub, badge }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={`ag-pay-method${paymentMethod === id ? " selected" : ""}`}
                >
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "11px", flexShrink: 0,
                    background: paymentMethod === id ? "rgba(34,197,94,0.15)" : "#0a1209",
                    border: `1px solid ${paymentMethod === id ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.07)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <FontAwesomeIcon icon={icon} style={{ fontSize: "16px", color: paymentMethod === id ? "#22c55e" : "#5a8a63" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "2px" }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "13px", color: "#fff" }}>{label}</span>
                      {badge && (
                        <span style={{ fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "999px", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {badge}
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#6b7280", margin: 0 }}>{sub}</p>
                  </div>
                  {paymentMethod === id && (
                    <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "16px", color: "#22c55e", flexShrink: 0 }} />
                  )}
                </button>
              ))}

              {/* Amount summary */}
              <div style={{
                marginTop: "6px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)",
                borderRadius: "12px", padding: "12px 14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#9ca3af" }}>You will pay</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "14px", color: "#fff" }}>
                  {paymentMethod === "paystack"
                    ? `₦${(proposal.amount * nairaRate).toLocaleString()}`
                    : `${proposal.amount} USDT`}
                </span>
              </div>
            </>
          )}

          {/* ════ STEP: PAYSTACK REDIRECT ════ */}
          {step === "paystack_redirect" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", textAlign: "center" }}>
              <div style={{ marginBottom: "20px" }}>
                <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "40px", color: "#22c55e" }} />
              </div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "1.2rem", color: "#fff", margin: "0 0 8px" }}>
                Redirecting to Paystack…
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#6b7280", margin: "0 0 18px", lineHeight: "1.6" }}>
                Complete your payment securely on Paystack. You'll be redirected back once payment is confirmed.
              </p>
              {paystackUrl && (
                <a
                  href={paystackUrl}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "12px", color: "#22c55e", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
                >
                  <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "10px" }} />
                  Click here if not redirected
                </a>
              )}
            </div>
          )}

          {/* ════ STEP: USDT WAITING ════ */}
          {step === "usdt_waiting" && usdtData && (
            <>
              <div style={{
                background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "14px", padding: "16px", textAlign: "center", marginBottom: "16px",
              }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#6b7280", margin: "0 0 4px" }}>Send exactly</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "1.6rem", color: "#fff", margin: "0 0 2px" }}>
                  {usdtData.payAmount} USDT
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#5a8a63", margin: 0 }}>
                  Network: ERC-20 (Ethereum)
                </p>
              </div>

              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "10px", color: "#5a8a63", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "8px" }}>
                Payment Address
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                background: "#070d08", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px", padding: "11px 14px", marginBottom: "14px",
              }}>
                <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#d1d5db", flex: 1, wordBreak: "break-all" }}>
                  {usdtData.payAddress}
                </span>
                <button
                  onClick={copyAddress}
                  style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "#22c55e" : "#5a8a63", flexShrink: 0, padding: "2px" }}
                >
                  <FontAwesomeIcon icon={copied ? faCheckCircle : faCopy} style={{ fontSize: "15px" }} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px", textAlign: "center" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>Expires in</p>
                  <CountdownTimer expiresAt={usdtData.expiresAt} />
                </div>
                <div style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "12px 14px", textAlign: "center" }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "10px", color: "#6b7280", margin: "0 0 4px" }}>Status</p>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "12px", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    <FontAwesomeIcon icon={faClock} style={{ fontSize: "11px" }} />
                    Waiting
                  </span>
                </div>
              </div>

              <div style={{
                display: "flex", gap: "10px", alignItems: "flex-start",
                background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
                borderRadius: "12px", padding: "12px 14px", marginBottom: "14px",
              }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "13px", color: "#f59e0b", flexShrink: 0, marginTop: "1px" }} />
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#d97706", margin: 0, lineHeight: "1.6" }}>
                  Send only USDT on ERC-20 (Ethereum). Sending on the wrong network results in permanent loss of funds. This page updates automatically when payment is detected.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "12px", color: "#22c55e" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "11px", color: "#6b7280" }}>
                  Checking for payment every 15 seconds…
                </span>
              </div>
            </>
          )}

          {/* ════ STEP: LOCKED / SUCCESS ════ */}
          {step === "locked" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 0", textAlign: "center" }}>
              <div style={{ animation: "agStamp .5s cubic-bezier(.36,.07,.19,.97) forwards", marginBottom: "20px" }}>
                <div style={{
                  width: "80px", height: "80px", borderRadius: "50%",
                  background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
                }}>
                  <FontAwesomeIcon icon={faStamp} style={{ fontSize: "34px", color: "#22c55e" }} />
                </div>
              </div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "1.4rem", color: "#fff", margin: "0 0 8px" }}>
                Agreement Locked
              </h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#6b7280", maxWidth: "340px", lineHeight: "1.65", margin: "0 0 24px" }}>
                Your {fmt(proposal.amount)} is now held in SkillFund escrow. The creator will be notified to begin submitting milestone proof.
              </p>

              <div style={{
                width: "100%", maxWidth: "380px", background: "#070d08",
                border: "1px solid rgba(34,197,94,0.15)", borderRadius: "16px",
                overflow: "hidden",
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "13px", color: "#22c55e" }} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "12px", color: "#fff" }}>What Happens Next</span>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {[
                    "Creator submits proof for Milestone 1 (photo, receipt, or video)",
                    "You have 72 hours to approve or dispute the proof",
                    "Approved → funds released to creator's withdrawable balance",
                    "Creator reports monthly earnings → your profit share calculated",
                  ].map((txt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: i < 3 ? "10px" : 0 }}>
                      <span style={{
                        width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "9px", color: "#22c55e",
                      }}>{i + 1}</span>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: "1.5" }}>{txt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {step !== "locked" && step !== "paystack_redirect" && step !== "usdt_waiting" && (
          <div style={{
            padding: "16px 22px 20px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "#040806", flexShrink: 0,
          }}>
            {/* Agree checkbox — review step, investor only */}
            {isInvestor && step === "review" && (
              <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", marginBottom: "14px" }}>
                <input
                  type="checkbox"
                  className="ag-clause-check"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: "2px" }}
                />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: "#9ca3af", lineHeight: "1.6" }}>
                  I have read and agree to all terms above. I understand this agreement is legally binding and my investment of{" "}
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>{fmt(proposal.amount)}</span>{" "}
                  will be held in escrow for{" "}
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>{proposal.duration} months</span>.
                </span>
              </label>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={step === "choose_payment" ? () => setStep("review") : onClose}
                style={{
                  padding: "11px 20px", borderRadius: "12px", cursor: "pointer",
                  background: "#0a1209", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#9ca3af", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "13px",
                }}
              >
                {step === "choose_payment" ? "← Back" : "Close"}
              </button>

              {isInvestor ? (
                step === "review" ? (
                  <button
                    onClick={() => {
                      if (!agreed) { toast.error("Please agree to the terms first"); return; }
                      setStep("choose_payment");
                    }}
                    disabled={!agreed}
                    style={{
                      flex: 1, padding: "11px 20px", borderRadius: "12px",
                      cursor: agreed ? "pointer" : "not-allowed",
                      background: agreed ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#0a1209",
                      border: agreed ? "none" : "1px solid rgba(255,255,255,0.08)",
                      color: agreed ? "#000" : "#4b5563",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "13px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      transition: "all .2s",
                    }}
                  >
                    <FontAwesomeIcon icon={faLock} style={{ fontSize: "12px" }} />
                    Review & Fund Agreement
                  </button>
                ) : (
                  <button
                    onClick={handleInitiatePayment}
                    disabled={loading}
                    style={{
                      flex: 1, padding: "11px 20px", borderRadius: "12px",
                      cursor: loading ? "not-allowed" : "pointer",
                      background: loading ? "#0a1209" : "linear-gradient(135deg,#22c55e,#16a34a)",
                      border: loading ? "1px solid rgba(255,255,255,0.08)" : "none",
                      color: loading ? "#4b5563" : "#000",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "13px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                      transition: "all .2s",
                    }}
                  >
                    <FontAwesomeIcon icon={loading ? faCircleNotch : faLock} spin={loading} style={{ fontSize: "12px" }} />
                    {loading
                      ? "Processing…"
                      : `Pay ${paymentMethod === "paystack" ? `₦${(proposal.amount * nairaRate).toLocaleString()}` : `${proposal.amount} USDT`}`}
                  </button>
                )
              ) : (
                <div style={{
                  flex: 1, padding: "11px 20px", borderRadius: "12px",
                  background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}>
                  <FontAwesomeIcon icon={faHandshake} style={{ fontSize: "12px", color: "#22c55e" }} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "13px", color: "#22c55e" }}>
                    Awaiting investor to lock agreement
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Locked footer ── */}
        {step === "locked" && (
          <div style={{ padding: "16px 22px 20px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                width: "100%", padding: "12px", borderRadius: "12px", cursor: "pointer",
                background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none",
                color: "#000", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 900, fontSize: "13px",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}
            >
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "12px" }} />
              Done — View My Investments
            </button>
          </div>
        )}

      </div>
    </div>
  , document.body);
}
