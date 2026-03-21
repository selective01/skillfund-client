import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faWallet, faDownload, faClock, faCircleCheck, faCircleXmark,
  faCircleExclamation, faCircleNotch, faDollarSign,
  faCreditCard, faBuilding, faBitcoinSign, faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";
import useThemeStore from "../../store/useThemeStore";

const PLAN_FEES = { basic: 5, starter: 4, pro: 3, elite: 2 };

const PAYMENT_METHODS = [
  { key: "bank",     label: "Bank Transfer", faIcon: faBuilding,    iconColor: "#3b82f6", desc: "1-3 business days" },
  { key: "paystack", label: "Paystack",      faIcon: faCreditCard,  iconColor: "#22c55e", desc: "Instant" },
  { key: "usdt",     label: "USDT (Crypto)", faIcon: faBitcoinSign, iconColor: "#f59e0b", desc: "10-30 min", investorOnly: true },
];

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.35)",  faIcon: faClock },
  approved:  { label: "Approved",  color: "#60a5fa", bg: "rgba(59,130,246,0.08)",   border: "rgba(59,130,246,0.35)",  faIcon: faCircleCheck },
  completed: { label: "Completed", color: "#22c55e", bg: "rgba(34,197,94,0.08)",    border: "rgba(34,197,94,0.35)",   faIcon: faCircleCheck },
  rejected:  { label: "Rejected",  color: "#f87171", bg: "rgba(239,68,68,0.08)",    border: "rgba(239,68,68,0.35)",   faIcon: faCircleXmark },
};

function FieldLabel({ children }) {
  return <label className="block text-xs font-bold tracking-widest mb-1.5" style={{ fontFamily: "'Syne',sans-serif", color: "var(--text-dim)" }}>{children}</label>;
}
function Input({ ...props }) {
  return (
    <input {...props}
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "12px", padding: "11px 14px", width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", transition: "border-color .2s", ...props.style }}
      onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.4)"; e.target.style.outline = "none"; e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.07)"; }}
      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
    />
  );
}
function Textarea({ ...props }) {
  return (
    <textarea {...props}
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "12px", padding: "11px 14px", width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", transition: "border-color .2s", resize: "none", ...props.style }}
      onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.4)"; e.target.style.outline = "none"; e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.07)"; }}
      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

export default function Withdraw() {
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
  const { user }   = useAuthStore();
  const plan       = user?.plan || "basic";
  const feePercent = PLAN_FEES[plan] ?? 5;
  const isInvestor = user?.role === "investor";

  const [balance, setBalance]       = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount]   = useState("");
  const [method, setMethod]   = useState("bank");
  const [accountDetails, setAccountDetails] = useState({ bankName: "", accountNumber: "", accountName: "", walletAddress: "" });
  const [notes, setNotes]     = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, histRes] = await Promise.all([
        api.get("/withdrawals/balance").catch(() => ({ data: null })),
        api.get("/withdrawals"),
      ]);
      setBalance(balRes.data?.balance ?? balRes.data?.availableBalance ?? null);
      setWithdrawals(histRes.data.withdrawals || histRes.data.data || histRes.data || []);
    } catch {
      toast.error("Failed to load withdrawal data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const parsedAmount      = parseFloat(amount) || 0;
  const feeAmount         = (parsedAmount * feePercent) / 100;
  const netAmount         = Math.max(0, parsedAmount - feeAmount);
  const hasEnoughBalance  = balance === null || parsedAmount <= balance;
  const minWithdrawal     = 10;

  const handleSubmit = async () => {
    if (!amount || parsedAmount < minWithdrawal) { toast.error(`Minimum withdrawal is $${minWithdrawal}`); return; }
    if (!hasEnoughBalance) { toast.error("Amount exceeds available balance"); return; }
    if (method === "bank" && (!accountDetails.bankName || !accountDetails.accountNumber || !accountDetails.accountName)) { toast.error("Fill in all bank details"); return; }
    if (method === "usdt" && !accountDetails.walletAddress) { toast.error("Enter your USDT wallet address"); return; }
    setSubmitting(true);
    try {
      await api.post("/withdrawals/request", { amount: parsedAmount, method, accountDetails, notes });
      toast.success("Withdrawal requested! We'll process it within 24 hours.");
      setAmount(""); setNotes(""); setAccountDetails({ bankName: "", accountNumber: "", accountName: "", walletAddress: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  const totalWithdrawn = withdrawals.filter(w => w.status === "completed").reduce((s, w) => s + (parseFloat(w.amount) || 0), 0);
  const pendingAmount  = withdrawals.filter(w => w.status === "pending" || w.status === "approved").reduce((s, w) => s + (parseFloat(w.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .wd-in { animation: fadeUp 0.35s ease forwards; opacity: 0; }
      `}</style>

      {/* ── Header ── */}
        <div className="wd-in relative rounded-3xl p-6 overflow-hidden" style={{ background: "linear-gradient(135deg,var(--card-green-start,#0f2e10),var(--card-green-mid,#071a0b),var(--bg))", border: "1px solid rgba(34,197,94,0.35)", boxShadow: T.shadow }}>
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%)", filter: "blur(20px)" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <FontAwesomeIcon icon={faWallet} style={{ fontSize: "11px", color: "#22c55e" }} />
              <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "#22c55e" }}>WITHDRAW</span>
            </div>
            <h1 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}>Withdraw Funds</h1>
            <p style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", marginTop: "4px" }}>Request a withdrawal from your available balance</p>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="wd-in grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ animationDelay: ".06s" }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="h-3 rounded-full w-1/2 mb-4" style={{ background: "var(--border)" }} />
                <div className="h-8 rounded-full w-1/3" style={{ background: "var(--border)" }} />
              </div>
            ))
          ) : [
            { label: "Available Balance", value: balance !== null ? `$${Number(balance).toLocaleString()}` : "—", sub: `${plan} plan · ${feePercent}% fee`, icon: faWallet,      iconColor: "#22c55e", bg: "var(--card-green)", border: "rgba(34,197,94,0.30)" },
            { label: "Pending",           value: `$${pendingAmount.toLocaleString()}`,                                 sub: "Being processed",                    icon: faClock,       iconColor: "#f59e0b", bg: "var(--card-amber)", border: "rgba(245,158,11,0.30)" },
            { label: "Total Withdrawn",   value: `$${totalWithdrawn.toLocaleString()}`,                                sub: "All time",                           icon: faCircleCheck, iconColor: "#22c55e", bg: "var(--card-blue)", border: "rgba(34,197,94,0.30)" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}`, boxShadow: T.shadow }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "var(--text-dim)" }}>{s.label.toUpperCase()}</p>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.iconColor}18` }}>
                  <FontAwesomeIcon icon={s.icon} style={{ fontSize: "13px", color: s.iconColor }} />
                </div>
              </div>
              <p className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.5rem", lineHeight: 1 }}>{s.value}</p>
              <p className="text-xs mt-1.5 capitalize" style={{ color: "var(--text-dim)", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="wd-in grid grid-cols-1 lg:grid-cols-5 gap-6" style={{ animationDelay: ".12s" }}>
          {/* ── Request form ── */}
          <div className="lg:col-span-3 rounded-2xl p-6 space-y-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#22c55e,#16a34a)" }} />
              <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.05rem" }}>New Withdrawal Request</h2>
            </div>

            {/* Amount */}
            <div>
              <FieldLabel>AMOUNT (USD) *</FieldLabel>
              <div className="relative">
                <FontAwesomeIcon icon={faDollarSign} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)", fontSize: "13px", pointerEvents: "none" }} />
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min={minWithdrawal} style={{ paddingLeft: "2.2rem" }} />
              </div>
              {balance !== null && (
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "'Syne',sans-serif", fontWeight: 600 }}>Min: ${minWithdrawal}</p>
                  <button onClick={() => setAmount(String(balance))} className="text-xs font-bold transition-colors" style={{ fontFamily: "'Syne',sans-serif", color: "#22c55e" }}>Use max (${Number(balance).toLocaleString()})</button>
                </div>
              )}
              {!hasEnoughBalance && parsedAmount > 0 && (
                <p className="text-xs flex items-center gap-1 mt-1.5" style={{ color: "#f87171" }}>
                  <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: "11px" }} /> Exceeds available balance
                </p>
              )}
            </div>

            {/* Fee breakdown */}
            {parsedAmount > 0 && (
              <div className="rounded-xl p-4 space-y-2 text-sm" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                {[
                  { label: "Withdrawal amount", value: `$${parsedAmount.toLocaleString()}`, color: "var(--text-secondary)" },
                  { label: `Platform fee (${feePercent}%)`, value: `-$${feeAmount.toFixed(2)}`, color: "#f87171" },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span style={{ color: "var(--text-dim)", fontFamily: "'DM Sans',sans-serif" }}>{r.label}</span>
                    <span style={{ color: r.color, fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{r.value}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="font-bold text-white" style={{ fontFamily: "'Syne',sans-serif" }}>You receive</span>
                  <span className="font-black" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.1rem", color: "#22c55e" }}>${netAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Upgrade hint */}
            {plan !== "elite" && (
              <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.28)" }}>
                <FontAwesomeIcon icon={faCircleInfo} style={{ fontSize: "13px", color: "#22c55e", flexShrink: 0, marginTop: "1px" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
                  Upgrade to <span style={{ color: "#22c55e", fontWeight: 700 }}>Elite</span> to reduce your fee to 2%.{" "}
                  {parsedAmount > 0 && <span>Save <span style={{ color: "#22c55e", fontWeight: 700 }}>${((parsedAmount * (feePercent - 2)) / 100).toFixed(2)}</span> on this withdrawal.</span>}
                </p>
              </div>
            )}

            {/* Payment method */}
            <div>
              <FieldLabel>PAYMENT METHOD *</FieldLabel>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PAYMENT_METHODS.filter(m => !m.investorOnly || isInvestor).map(m => {
                  const isSelected = method === m.key;
                  return (
                    <button key={m.key} onClick={() => setMethod(m.key)} className="flex flex-col items-center gap-1.5 p-3.5 rounded-xl transition-all text-center" style={{ background: isSelected ? `${m.iconColor}12` : "var(--bg-input)", border: isSelected ? `1px solid ${m.iconColor}35` : "1px solid var(--border)" }}>
                      <FontAwesomeIcon icon={m.faIcon} style={{ fontSize: "18px", color: isSelected ? m.iconColor : "var(--text-dim)" }} />
                      <span className="text-xs font-bold" style={{ fontFamily: "'Syne',sans-serif", color: isSelected ? m.iconColor : "var(--text-secondary)" }}>{m.label}</span>
                      <span className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "'DM Sans',sans-serif" }}>{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bank details */}
            {method === "bank" && (
              <div className="space-y-3">
                <FieldLabel>BANK DETAILS *</FieldLabel>
                {[
                  { key: "bankName",      placeholder: "Bank name (e.g. GTBank)" },
                  { key: "accountNumber", placeholder: "Account number" },
                  { key: "accountName",   placeholder: "Account name" },
                ].map(f => (
                  <Input key={f.key} type="text" value={accountDetails[f.key]} onChange={e => setAccountDetails(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                ))}
              </div>
            )}
            {method === "paystack" && (
              <div className="rounded-xl p-3.5 flex items-center gap-2.5" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.30)" }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "14px", color: "#22c55e" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans',sans-serif" }}>
                  Funds sent to <span className="text-white font-bold">{user?.email}</span>
                </p>
              </div>
            )}
            {method === "usdt" && (
              <div>
                <FieldLabel>USDT WALLET ADDRESS (TRC-20) *</FieldLabel>
                <Input type="text" value={accountDetails.walletAddress} onChange={e => setAccountDetails(p => ({ ...p, walletAddress: e.target.value }))} placeholder="T..." style={{ fontFamily: "monospace" }} />
                <p className="text-xs flex items-center gap-1.5 mt-1.5" style={{ color: "var(--text-dim)" }}>
                  <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: "10px" }} /> Only TRC-20 network supported
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <FieldLabel>NOTES (OPTIONAL)</FieldLabel>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for the admin..." rows={2} />
            </div>

            <button onClick={handleSubmit} disabled={submitting || !amount || parsedAmount < minWithdrawal || !hasEnoughBalance} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none" style={{ fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", boxShadow: "0 2px 8px rgba(34,197,94,0.2)" }}>
              {submitting
                ? <><FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "13px" }} /> Submitting...</>
                : <><FontAwesomeIcon icon={faDownload} style={{ fontSize: "13px" }} /> Request Withdrawal</>}
            </button>
          </div>

          {/* ── Info sidebar ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Plan fees */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#22c55e,#16a34a)" }} />
                <h3 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "0.95rem" }}>Fees by Plan</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(PLAN_FEES).map(([p, fee]) => {
                  const isCurrent = p === plan;
                  const PLAN_COLORS = { basic: "var(--text-secondary)", starter: "#3b82f6", pro: "#a855f7", elite: "#f59e0b" };
                  const c = PLAN_COLORS[p];
                  return (
                    <div key={p} className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all" style={{ background: isCurrent ? `${c}10` : "var(--bg-input)", border: isCurrent ? `1px solid ${c}25` : "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2">
                        {isCurrent && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: c }} />}
                        <span className="text-sm capitalize font-bold" style={{ fontFamily: "'Syne',sans-serif", color: isCurrent ? c : "var(--text-dim)" }}>{p}</span>
                        {isCurrent && <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ fontFamily: "'Syne',sans-serif", background: `${c}18`, color: c }}>Current</span>}
                      </div>
                      <span className="font-black" style={{ fontFamily: "'Fraunces',serif", color: isCurrent ? c : "var(--text-dim)" }}>{fee}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Processing times */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#3b82f6,#2563eb)" }} />
                <h3 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "0.95rem" }}>Processing Times</h3>
              </div>
              <div className="space-y-3">
                {PAYMENT_METHODS.filter(m => !m.investorOnly || isInvestor).map(m => (
                  <div key={m.key} className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
                      <FontAwesomeIcon icon={m.faIcon} style={{ fontSize: "12px", color: m.iconColor }} /> {m.label}
                    </span>
                    <span className="text-sm font-bold" style={{ fontFamily: "'Syne',sans-serif", color: "var(--text-secondary)" }}>{m.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── History ── */}
        <div className="wd-in rounded-2xl p-6" style={{ animationDelay: ".18s", background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom,#a855f7,#7c3aed)" }} />
            <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.05rem" }}>Withdrawal History</h2>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl animate-pulse" style={{ background: "var(--bg-input)" }}>
                  <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: "var(--border)" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 rounded-full w-1/3" style={{ background: "var(--border)" }} />
                    <div className="h-3 rounded-full w-1/4" style={{ background: "var(--border)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faDownload} style={{ fontSize: "32px", color: "var(--text-dim)", display: "block", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-dim)", fontFamily: "'DM Sans',sans-serif", fontSize: "14px" }}>No withdrawals yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map(w => {
                const sc  = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
                const fee = ((parseFloat(w.amount) || 0) * feePercent) / 100;
                const net = (parseFloat(w.amount) || 0) - fee;
                const METHOD_ICONS = { bank: faBuilding, paystack: faCreditCard, usdt: faBitcoinSign };
                const METHOD_COLORS = { bank: "#3b82f6", paystack: "#22c55e", usdt: "#f59e0b" };
                return (
                  <div key={w._id} className="flex items-center gap-4 p-4 rounded-xl transition-all" style={{ background: "var(--bg-input)", border: `1px solid ${sc.border}` }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sc.bg }}>
                      <FontAwesomeIcon icon={sc.faIcon} style={{ fontSize: "14px", color: sc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white" style={{ fontFamily: "'Fraunces',serif" }}>${parseFloat(w.amount).toLocaleString()}</span>
                        <span style={{ color: "var(--text-dim)", fontSize: "12px" }}>→ net ${net.toFixed(2)}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ fontFamily: "'Syne',sans-serif", background: sc.bg, color: sc.color }}>{sc.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {METHOD_ICONS[w.method] && <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-dim)" }}>
                          <FontAwesomeIcon icon={METHOD_ICONS[w.method]} style={{ fontSize: "10px", color: METHOD_COLORS[w.method] }} />
                          {w.method}
                        </span>}
                        {w.createdAt && <span className="text-xs" style={{ color: "var(--text-dim)" }}>{new Date(w.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                      </div>
                    </div>
                    {w.status === "rejected" && w.rejectionReason && (
                      <p className="text-xs text-right max-w-[140px] flex-shrink-0" style={{ color: "#f87171" }}>{w.rejectionReason}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  );
}
