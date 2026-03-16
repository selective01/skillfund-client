import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faCircleCheck, faClock, faLock,
  faTriangleExclamation, faChevronDown, faChevronUp,
  faUpload, faXmark, faFileLines, faImage, faVideo,
  faPlus, faTrash, faDollarSign, faEye, faRotate,
  faVault, faShieldHalved, faArrowTrendDown,
  faCircleNotch, faHandHoldingDollar, faRightFromBracket,
  faHourglassHalf, faScaleBalanced,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import api from "../../utils/api";
import useAuthStore from "../../store/authStore";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#040806",
  card:    "#070d08",
  input:   "#0a1209",
  border:  "rgba(255,255,255,0.2)",
  accent:  "#22c55e",
  text:    "#f1f5f9",
  muted:   "#9ca3af",
  dim:     "#5a8a63",
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  @keyframes msIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .ms-in  { animation: msIn .3s ease forwards; opacity:0; }
  .ms-inp { background:${C.input}; border:1px solid ${C.border}; color:${C.text}; border-radius:12px; padding:10px 14px; width:100%; font-family:'DM Sans',sans-serif; font-size:13px; outline:none; transition:border-color .2s; resize:none; box-sizing:border-box; }
  .ms-inp::placeholder { color:${C.dim}; }
  .ms-inp:focus { border-color:rgba(34,197,94,0.4); }
`;

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  locked:          { label:"Locked",          color:"#6b7280", bg:"rgba(107,114,128,0.1)", border:"rgba(107,114,128,0.2)", icon:faLock          },
  proof_submitted: { label:"Proof Submitted", color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  border:"rgba(245,158,11,0.35)",  icon:faHourglassHalf },
  approved:        { label:"Approved",        color:"#22c55e", bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.35)",   icon:faCircleCheck   },
  auto_released:   { label:"Auto-Released",   color:"#3b82f6", bg:"rgba(59,130,246,0.1)",  border:"rgba(59,130,246,0.35)",  icon:faRotate        },
  disputed:        { label:"Disputed",        color:"#ef4444", bg:"rgba(239,68,68,0.1)",   border:"rgba(239,68,68,0.35)",   icon:faScaleBalanced },
  completed:       { label:"Completed",       color:"#22c55e", bg:"rgba(34,197,94,0.1)",   border:"rgba(34,197,94,0.35)",   icon:faCircleCheck   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => `$${(parseFloat(n) || 0).toLocaleString()}`;
const fmtD = (d) => new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

// ── Countdown ─────────────────────────────────────────────────────────────────
function Countdown({ autoReleaseAt }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = new Date(autoReleaseAt) - new Date();
      if (diff <= 0) { setRemaining("Auto-releasing…"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [autoReleaseAt]);
  return (
    <span style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"10px", color:"#f59e0b" }}>
      <FontAwesomeIcon icon={faClock} style={{ fontSize:"9px" }} /> {remaining} to auto-release
    </span>
  );
}

// ── EscrowPanel (investor only) ───────────────────────────────────────────────
function EscrowPanel({ investment, milestones, summary, onRefresh }) {
  const [showRefund, setShowRefund]     = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  const totalAmount    = summary?.totalAmount    || investment.amount || 0;
  const releasedAmount = summary?.completedAmount || 0;
  const heldAmount     = totalAmount - releasedAmount;
  const releasedPct    = totalAmount > 0 ? Math.round((releasedAmount / totalAmount) * 100) : 0;

  const counts = {
    completed: milestones.filter(m => ["approved","auto_released","completed"].includes(m.status)).length,
    pending:   milestones.filter(m => m.status === "proof_submitted").length,
    disputed:  milestones.filter(m => m.status === "disputed").length,
    locked:    milestones.filter(m => m.status === "locked").length,
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) { toast.error("Please provide a reason for the refund request"); return; }
    setRefundLoading(true);
    try {
      await api.post(`/investments/${investment._id}/refund-request`, { reason: refundReason });
      toast.success("Refund request submitted — admin will review within 48 hours.");
      setShowRefund(false);
      setRefundReason("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit refund request");
    } finally { setRefundLoading(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>

      {/* ── Vault card ── */}
      <div style={{ background:"linear-gradient(135deg,#0a1f0c,#040806)", border:"1px solid rgba(34,197,94,0.35)", borderRadius:"20px", padding:"20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-30px", right:"-30px", width:"120px", height:"120px", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,0.07),transparent 70%)", pointerEvents:"none" }} />

        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"18px" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"12px", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.35)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <FontAwesomeIcon icon={faVault} style={{ fontSize:"17px", color:C.accent }} />
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"14px", color:C.text, margin:0 }}>Escrow Vault</p>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.dim, margin:0 }}>SkillFund-protected fund holding</p>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:"24px", color:C.accent, margin:0 }}>{fmt(heldAmount)}</p>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:C.dim, margin:0 }}>currently held</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:"14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.muted }}>{fmt(releasedAmount)} released</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.muted }}>{fmt(totalAmount)} total</span>
          </div>
          <div style={{ height:"8px", background:"rgba(255,255,255,0.18)", borderRadius:"999px", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:"999px", background:"linear-gradient(90deg,#22c55e,#4ade80)", width:`${releasedPct}%`, transition:"width .6s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"4px" }}>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"10px", color:C.accent }}>{releasedPct}% released</span>
            <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"10px", color:C.muted }}>{100-releasedPct}% held</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
          {[
            { label:"Released", value:counts.completed, color:C.accent   },
            { label:"Pending",  value:counts.pending,   color:"#f59e0b"  },
            { label:"Disputed", value:counts.disputed,  color:"#ef4444"  },
            { label:"Locked",   value:counts.locked,    color:C.muted    },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:"rgba(0,0,0,0.3)", borderRadius:"10px", padding:"8px", textAlign:"center", border:"1px solid rgba(255,255,255,0.18)" }}>
              <p style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:"20px", color, margin:0 }}>{value}</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"10px", color:C.muted, margin:0 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fund release timeline ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"16px" }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"11px", color:C.muted, textTransform:"uppercase", letterSpacing:".08em", margin:"0 0 12px" }}>
          Fund Release Timeline
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {milestones.map((m, idx) => {
            const isDone    = ["approved","auto_released","completed"].includes(m.status);
            const isPending = m.status === "proof_submitted";
            const sc = STATUS[m.status] || STATUS.locked;
            const pct = totalAmount > 0 ? Math.round((m.amount / totalAmount) * 100) : 0;
            return (
              <div key={m._id} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:"26px", height:"26px", borderRadius:"8px", flexShrink:0, background:sc.bg, border:`1px solid ${sc.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <FontAwesomeIcon icon={sc.icon} style={{ fontSize:"10px", color:sc.color }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"11px", color: isDone ? C.text : C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      M{idx+1}: {m.title}
                    </span>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"11px", color:sc.color, flexShrink:0, marginLeft:"8px" }}>{fmt(m.amount)}</span>
                  </div>
                  <div style={{ height:"4px", background:"rgba(255,255,255,0.18)", borderRadius:"999px", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:"999px", width: isDone ? `${pct}%` : isPending ? `${Math.round(pct*0.5)}%` : "0%", background: isDone ? "linear-gradient(90deg,#22c55e,#4ade80)" : "#f59e0b", transition:"width .5s ease" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Investor protections ── */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"14px 16px" }}>
        <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"11px", color:C.muted, textTransform:"uppercase", letterSpacing:".08em", margin:"0 0 10px" }}>
          Your Protections
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {[
            { icon:faShieldHalved,   color:"#22c55e", label:"rgba(34,197,94,0.1)",   text:"Funds only release after milestone proof is approved by you" },
            { icon:faHourglassHalf,  color:"#f59e0b", label:"rgba(245,158,11,0.1)",  text:"72-hour review window before any auto-release occurs" },
            { icon:faScaleBalanced,  color:"#3b82f6", label:"rgba(59,130,246,0.1)",  text:"Dispute any milestone — SkillFund admin mediates within 48h" },
            { icon:faArrowTrendDown, color:"#a855f7", label:"rgba(168,85,247,0.1)",  text:"Refund request available if creator breaches the agreement" },
          ].map(({ icon, color, label, text }) => (
            <div key={text} style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
              <div style={{ width:"22px", height:"22px", borderRadius:"6px", background:label, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px" }}>
                <FontAwesomeIcon icon={icon} style={{ fontSize:"10px", color }} />
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted, margin:0, lineHeight:1.65 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Refund / early exit ── */}
      {investment.status === "active" && (
        <div style={{ background:C.card, border:"1px solid rgba(239,68,68,0.30)", borderRadius:"16px", padding:"14px 16px" }}>
          {!showRefund ? (
            <button
              onClick={() => setShowRefund(true)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", background:"none", border:"none", cursor:"pointer", padding:0 }}
            >
              <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize:"13px", color:"#ef4444" }} />
              <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px", color:"#ef4444" }}>Request Refund / Early Exit</span>
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize:"10px", color:"#ef4444", marginLeft:"auto" }} />
            </button>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize:"13px", color:"#f59e0b" }} />
                <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"13px", color:C.text, margin:0 }}>Refund / Early Exit Request</p>
              </div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted, margin:0, lineHeight:1.65 }}>
                Submitting a refund request will notify the SkillFund admin team. Only funds from unstarted milestones are eligible for refund. Admin will review within 48 hours.
              </p>
              <textarea
                className="ms-inp"
                rows={3}
                placeholder="Explain why you're requesting a refund (e.g. creator has not responded, funds misused, agreement breached)..."
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
              />
              <div style={{ display:"flex", gap:"8px" }}>
                <button
                  onClick={handleRefundRequest}
                  disabled={refundLoading}
                  style={{ flex:1, padding:"10px 0", borderRadius:"11px", cursor:"pointer", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", opacity:refundLoading?0.7:1 }}
                >
                  <FontAwesomeIcon icon={refundLoading ? faCircleNotch : faHandHoldingDollar} spin={refundLoading} style={{ fontSize:"11px" }} />
                  {refundLoading ? "Submitting…" : "Submit Refund Request"}
                </button>
                <button
                  onClick={() => { setShowRefund(false); setRefundReason(""); }}
                  style={{ padding:"10px 16px", borderRadius:"11px", cursor:"pointer", background:C.input, border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"12px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MilestoneCard ─────────────────────────────────────────────────────────────
function MilestoneCard({ milestone, isCreator, onRefresh }) {
  const [expanded, setExpanded]           = useState(false);
  const [proofNotes, setProofNotes]       = useState("");
  const [files, setFiles]                 = useState([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute]     = useState(false);
  const [loading, setLoading]             = useState(false);

  const sc     = STATUS[milestone.status] || STATUS.locked;
  const isDone = ["approved","auto_released","completed"].includes(milestone.status);

  const handleFileChange = (e) => {
    const sel = Array.from(e.target.files);
    if (files.length + sel.length > 5) { toast.error("Maximum 5 files per milestone"); return; }
    setFiles(prev => [...prev, ...sel]);
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx) => idx !== i));

  const fileIcon = (file) => {
    if (file.type?.startsWith("video/") || file.type === "video") return <FontAwesomeIcon icon={faVideo}     style={{ fontSize:"11px", color:"#3b82f6" }} />;
    if (file.type === "document" || file.name?.endsWith(".pdf"))   return <FontAwesomeIcon icon={faFileLines} style={{ fontSize:"11px", color:"#f97316" }} />;
    return <FontAwesomeIcon icon={faImage} style={{ fontSize:"11px", color:C.accent }} />;
  };

  const handleSubmitProof = async () => {
    if (files.length === 0 && !proofNotes.trim()) { toast.error("Please upload at least one file or add proof notes"); return; }
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach(f => form.append("proofFiles", f));
      form.append("proofNotes", proofNotes);
      await api.post(`/milestones/${milestone._id}/proof`, form, { headers:{ "Content-Type":"multipart/form-data" } });
      toast.success("Proof submitted! Investor has 72 hours to review.");
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to submit proof"); }
    finally { setLoading(false); }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.put(`/milestones/${milestone._id}/approve`);
      toast.success(`Milestone approved — ${fmt(milestone.amount)} released!`);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to approve"); }
    finally { setLoading(false); }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) { toast.error("Please provide a reason for the dispute"); return; }
    setLoading(true);
    try {
      await api.put(`/milestones/${milestone._id}/dispute`, { reason: disputeReason });
      toast.success("Dispute raised. Admin will review within 48 hours.");
      setShowDispute(false);
      onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to raise dispute"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ background:C.card, border:`1px solid ${isDone ? "rgba(34,197,94,0.35)" : milestone.status === "disputed" ? "rgba(239,68,68,0.35)" : milestone.status === "proof_submitted" ? "rgba(245,158,11,0.35)" : C.border}`, borderRadius:"16px", overflow:"hidden" }}>
      {/* Header */}
      <div
        style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", cursor:"pointer" }}
        onClick={() => setExpanded(v => !v)}
      >
        <div style={{ width:"30px", height:"30px", borderRadius:"9px", flexShrink:0, background:sc.bg, border:`1px solid ${sc.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:"12px", color:sc.color }}>
          {milestone.order}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px", color:C.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{milestone.title}</p>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.dim, margin:0 }}>{fmt(milestone.amount)}</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"10px", padding:"3px 9px", borderRadius:"999px", background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, display:"flex", alignItems:"center", gap:"4px" }}>
            <FontAwesomeIcon icon={sc.icon} style={{ fontSize:"9px" }} /> {sc.label}
          </span>
          {milestone.status === "proof_submitted" && milestone.autoReleaseAt && (
            <Countdown autoReleaseAt={milestone.autoReleaseAt} />
          )}
          <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} style={{ fontSize:"11px", color:C.muted }} />
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.border}`, padding:"16px", display:"flex", flexDirection:"column", gap:"14px" }}>
          {milestone.description && (
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:C.muted, margin:0, lineHeight:1.65 }}>{milestone.description}</p>
          )}

          {/* Submitted proof */}
          {milestone.proofFiles?.length > 0 && (
            <div>
              <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"10px", color:C.muted, textTransform:"uppercase", letterSpacing:".07em", marginBottom:"8px" }}>Proof Submitted</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                {milestone.proofFiles.map((f, i) => (
                  <a key={f.url || i} href={f.url} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"12px", color:C.accent, textDecoration:"none", padding:"6px 10px", background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.12)", borderRadius:"8px" }}>
                    {fileIcon(f)} <FontAwesomeIcon icon={faEye} style={{ fontSize:"10px" }} /> {f.originalName || `File ${i+1}`}
                  </a>
                ))}
              </div>
              {milestone.proofNotes && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted, fontStyle:"italic", marginTop:"8px" }}>"{milestone.proofNotes}"</p>}
            </div>
          )}

          {/* Admin note */}
          {milestone.adminNote && (
            <div style={{ background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.18)", borderRadius:"10px", padding:"10px 12px" }}>
              <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"10px", color:"#3b82f6", marginBottom:"4px" }}>Admin Note</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted, margin:0 }}>{milestone.adminNote}</p>
            </div>
          )}

          {/* Creator: submit proof */}
          {isCreator && milestone.status === "locked" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"10px", color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:0 }}>Submit Proof</p>
              <label style={{ display:"flex", alignItems:"center", gap:"8px", cursor:"pointer", border:"1px dashed rgba(255,255,255,0.2)", borderRadius:"12px", padding:"12px" }}>
                <FontAwesomeIcon icon={faUpload} style={{ fontSize:"14px", color:C.muted }} />
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:C.muted }}>Upload files (photos, receipts, video)</span>
                <input type="file" multiple accept="image/*,video/*,.pdf" style={{ display:"none" }} onChange={handleFileChange} />
              </label>
              {files.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                  {files.map((f,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:C.input, borderRadius:"8px", padding:"6px 10px" }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                      <button onClick={() => removeFile(i)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, marginLeft:"8px", flexShrink:0 }}>
                        <FontAwesomeIcon icon={faXmark} style={{ fontSize:"12px" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea className="ms-inp" rows={3} placeholder="Describe what you did and how the funds were used..." value={proofNotes} onChange={e => setProofNotes(e.target.value)} />
              <button onClick={handleSubmitProof} disabled={loading}
                style={{ width:"100%", padding:"11px 0", borderRadius:"12px", cursor:"pointer", background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", color:"#000", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", opacity:loading?0.7:1 }}>
                <FontAwesomeIcon icon={loading ? faCircleNotch : faUpload} spin={loading} style={{ fontSize:"12px" }} />
                {loading ? "Submitting…" : "Submit Proof"}
              </button>
            </div>
          )}

          {/* Investor: approve or dispute */}
          {!isCreator && milestone.status === "proof_submitted" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {!showDispute ? (
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={handleApprove} disabled={loading}
                    style={{ flex:1, padding:"11px 0", borderRadius:"12px", cursor:"pointer", background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none", color:"#000", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", opacity:loading?0.7:1 }}>
                    <FontAwesomeIcon icon={loading ? faCircleNotch : faCircleCheck} spin={loading} style={{ fontSize:"11px" }} />
                    {loading ? "Processing…" : `Approve & Release ${fmt(milestone.amount)}`}
                  </button>
                  <button onClick={() => setShowDispute(true)}
                    style={{ flex:1, padding:"11px 0", borderRadius:"12px", cursor:"pointer", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"12px" }}>
                    Dispute
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"12px", color:"#ef4444", margin:0 }}>Dispute Reason</p>
                  <textarea className="ms-inp" rows={3} placeholder="Explain why you are disputing this proof submission..." value={disputeReason} onChange={e => setDisputeReason(e.target.value)} style={{ borderColor:"rgba(239,68,68,0.3)" }} />
                  <div style={{ display:"flex", gap:"8px" }}>
                    <button onClick={handleDispute} disabled={loading}
                      style={{ flex:1, padding:"10px 0", borderRadius:"11px", cursor:"pointer", background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#ef4444", fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                      <FontAwesomeIcon icon={loading ? faCircleNotch : faScaleBalanced} spin={loading} style={{ fontSize:"11px" }} />
                      {loading ? "Submitting…" : "Submit Dispute"}
                    </button>
                    <button onClick={() => setShowDispute(false)}
                      style={{ padding:"10px 16px", borderRadius:"11px", cursor:"pointer", background:C.input, border:`1px solid ${C.border}`, color:C.muted, fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"12px" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Done timestamp */}
          {isDone && milestone.approvedAt && (
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.dim, margin:0 }}>
              {milestone.status === "auto_released" ? "Auto-released" : "Approved"} on {fmtD(milestone.approvedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── CreateMilestonesForm ──────────────────────────────────────────────────────
function CreateMilestonesForm({ investment, onCreated }) {
  const [rows, setRows]       = useState([{ title:"", description:"", amount:"" }]);
  const [loading, setLoading] = useState(false);

  const totalEntered = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const remaining    = investment.amount - totalEntered;

  const addRow    = () => setRows(prev => [...prev, { title:"", description:"", amount:"" }]);
  const removeRow = (i) => setRows(prev => prev.filter((_,idx) => idx !== i));
  const updateRow = (i, field, val) => setRows(prev => prev.map((r,idx) => idx === i ? { ...r, [field]:val } : r));

  const handleSubmit = async () => {
    if (rows.some(r => !r.title || !r.description || !r.amount)) { toast.error("Please fill in all milestone fields"); return; }
    if (Math.abs(remaining) > 1) { toast.error(`Milestone amounts must total exactly ${fmt(investment.amount)}`); return; }
    setLoading(true);
    try {
      await api.post("/milestones", {
        investmentId: investment._id,
        milestones: rows.map(r => ({ ...r, amount: parseFloat(r.amount) })),
      });
      toast.success("Milestones created successfully!");
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create milestones"); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
      <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.30)", borderRadius:"14px", padding:"14px 16px" }}>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"13px", color:C.accent, margin:0, lineHeight:1.65 }}>
          Break your <strong>{fmt(investment.amount)}</strong> funding into milestones. Each milestone unlocks its funds when you submit proof and the investor approves.
        </p>
      </div>

      {/* Budget bar */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted }}>Total: <strong style={{ color:C.text }}>{fmt(investment.amount)}</strong></span>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"12px", color: remaining < 0 ? "#ef4444" : remaining === 0 ? C.accent : "#f59e0b" }}>
            {remaining < 0 ? `Over by ${fmt(Math.abs(remaining))}` : remaining === 0 ? "✓ Fully allocated" : `${fmt(remaining)} remaining`}
          </span>
        </div>
        <div style={{ height:"7px", background:"rgba(255,255,255,0.18)", borderRadius:"999px", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:"999px", transition:"width .4s ease", width:`${Math.min((totalEntered/investment.amount)*100,100)}%`, background: totalEntered > investment.amount ? "#ef4444" : "linear-gradient(90deg,#22c55e,#4ade80)" }} />
        </div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"14px", padding:"14px", display:"flex", flexDirection:"column", gap:"10px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"12px", color:C.muted, margin:0 }}>Milestone {i+1}</p>
            {rows.length > 1 && (
              <button onClick={() => removeRow(i)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted }}>
                <FontAwesomeIcon icon={faTrash} style={{ fontSize:"12px" }} />
              </button>
            )}
          </div>
          <input className="ms-inp" placeholder="Milestone title (e.g. Buy industrial sewing machine)" value={row.title} onChange={e => updateRow(i,"title",e.target.value)} />
          <textarea className="ms-inp" rows={2} placeholder="What will you do / buy with this tranche?" value={row.description} onChange={e => updateRow(i,"description",e.target.value)} />
          <div style={{ position:"relative" }}>
            <FontAwesomeIcon icon={faDollarSign} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color:C.dim, pointerEvents:"none" }} />
            <input type="number" className="ms-inp" style={{ paddingLeft:"28px" }} placeholder="Amount" value={row.amount} onChange={e => updateRow(i,"amount",e.target.value)} />
          </div>
        </div>
      ))}

      <button onClick={addRow}
        style={{ width:"100%", border:"1px dashed rgba(255,255,255,0.2)", borderRadius:"12px", padding:"10px 0", background:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px", color:C.muted, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
        <FontAwesomeIcon icon={faPlus} style={{ fontSize:"11px" }} /> Add Milestone
      </button>

      <button onClick={handleSubmit} disabled={loading || Math.abs(remaining) > 1}
        style={{ width:"100%", padding:"12px 0", borderRadius:"12px", cursor: loading || Math.abs(remaining)>1 ? "not-allowed" : "pointer", background: Math.abs(remaining)>1 ? C.input : "linear-gradient(135deg,#22c55e,#16a34a)", border: Math.abs(remaining)>1 ? `1px solid ${C.border}` : "none", color: Math.abs(remaining)>1 ? C.muted : "#000", fontFamily:"'Syne',sans-serif", fontWeight:900, fontSize:"13px", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", opacity:loading?0.7:1 }}>
        <FontAwesomeIcon icon={loading ? faCircleNotch : faCircleCheck} spin={loading} style={{ fontSize:"12px" }} />
        {loading ? "Saving…" : "Save Milestones"}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Milestones() {
  const { investmentId } = useParams();
  const navigate         = useNavigate();
  const { user }         = useAuthStore();

  const [investment, setInvestment]     = useState(null);
  const [milestones, setMilestones]     = useState([]);
  const [summary, setSummary]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [noMilestones, setNoMilestones] = useState(false);

  const isCreator = user?.role === "creator";

  const fetchData = useCallback(async () => {
    try {
      const [invRes, milRes] = await Promise.all([
        api.get(`/investments/${investmentId}`),
        api.get(`/milestones/${investmentId}`),
      ]);
      setInvestment(invRes.data.investment);
      setMilestones(milRes.data.milestones || []);
      setSummary(milRes.data.summary);
      setNoMilestones((milRes.data.milestones || []).length === 0);
    } catch {
      try {
        const invRes = await api.get(`/investments/${investmentId}`);
        setInvestment(invRes.data.investment);
        setNoMilestones(true);
      } catch {
        toast.error("Investment not found");
        navigate("/investments");
      }
    } finally { setLoading(false); }
  }, [investmentId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"200px" }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize:"28px", color:C.accent }} />
    </div>
  );

  if (!investment) return null;

  const progressPct = summary && summary.totalAmount > 0
    ? Math.round((summary.completedAmount / summary.totalAmount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <style>{STYLES}</style>

      {/* Back */}
      <button onClick={() => navigate("/investments")}
        style={{ display:"flex", alignItems:"center", gap:"6px", background:"none", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"13px", color:C.muted, padding:0 }}>
        <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize:"12px" }} /> Back to Investments
      </button>

      {/* Investment summary */}
      <div style={{ background:"linear-gradient(135deg,#0a1f0c,#040806)", border:"1px solid rgba(34,197,94,0.35)", borderRadius:"20px", padding:"20px", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-20px", right:"-20px", width:"100px", height:"100px", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,197,94,0.06),transparent 70%)", pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:"10px", marginBottom: summary && summary.totalAmount > 0 ? "14px" : 0 }}>
          <div>
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"10px", color:C.dim, textTransform:"uppercase", letterSpacing:".08em", marginBottom:"4px" }}>
              {isCreator ? "Investor" : "Creator"}
            </p>
            <h2 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:"1.2rem", color:C.text, margin:"0 0 3px" }}>
              {isCreator ? investment.investor?.name : investment.creator?.name}
            </h2>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted, margin:0 }}>
              {fmt(investment.amount)} · {investment.profitSharePercentage}% share · {investment.duration} months
            </p>
          </div>
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"11px", padding:"4px 12px", borderRadius:"999px", background: investment.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.18)", color: investment.status === "active" ? C.accent : C.muted, border: investment.status === "active" ? "1px solid rgba(34,197,94,0.35)" : `1px solid ${C.border}` }}>
            {investment.status}
          </span>
        </div>

        {summary && summary.totalAmount > 0 && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.muted }}>{fmt(summary.completedAmount)} released</span>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.muted }}>{fmt(summary.totalAmount)} total</span>
            </div>
            <div style={{ height:"7px", background:"rgba(255,255,255,0.18)", borderRadius:"999px", overflow:"hidden", marginBottom:"8px" }}>
              <div style={{ height:"100%", background:"linear-gradient(90deg,#22c55e,#4ade80)", borderRadius:"999px", width:`${progressPct}%`, transition:"width .6s ease" }} />
            </div>
            <div style={{ display:"flex", gap:"16px" }}>
              {[
                { label:"completed",     value:summary.completedCount, color:C.accent   },
                { label:"pending review",value:summary.pendingCount,   color:"#f59e0b"  },
                { label:"locked",        value:summary.lockedCount,    color:C.muted    },
              ].map(({ label, value, color }) => (
                <span key={label} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"11px", color:C.muted }}>
                  <span style={{ color, fontWeight:700 }}>{value}</span> {label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Escrow Panel — investor only, after milestones are set up */}
      {!isCreator && milestones.length > 0 && (
        <EscrowPanel
          investment={investment}
          milestones={milestones}
          summary={summary}
          onRefresh={fetchData}
        />
      )}

      {/* Milestones list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        <h3 style={{ fontFamily:"'Fraunces',serif", fontWeight:900, fontSize:"1.05rem", color:C.text, margin:0 }}>
          {noMilestones
            ? isCreator ? "Set Up Your Milestones" : "Awaiting Milestone Setup"
            : `Milestones (${milestones.length})`}
        </h3>

        {noMilestones && isCreator  && <CreateMilestonesForm investment={investment} onCreated={fetchData} />}
        {noMilestones && !isCreator && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"40px 20px", textAlign:"center" }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize:"28px", color:C.muted, marginBottom:"12px", display:"block" }} />
            <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:"14px", color:C.muted, margin:"0 0 4px" }}>Awaiting milestone setup</p>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.dim, margin:0 }}>The creator hasn't set up their milestones yet.</p>
          </div>
        )}

        {!noMilestones && milestones.map(m => (
          <MilestoneCard key={m._id} milestone={m} isCreator={isCreator} onRefresh={fetchData} />
        ))}
      </div>

      {/* How it works */}
      {!noMilestones && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`, borderRadius:"16px", padding:"16px" }}>
          <p style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:"12px", color:C.muted, margin:"0 0 10px" }}>How milestones work</p>
          {[
            "Creator completes a milestone task and submits photo / receipt / video proof.",
            "Investor reviews and approves — funds are released instantly.",
            "If the investor doesn't respond within 72 hours, funds auto-release.",
            "If proof is disputed, SkillFund admin mediates within 48 hours.",
          ].map((step, i) => (
            <p key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"12px", color:C.muted, margin:"0 0 5px" }}>
              <span style={{ color:C.accent, fontWeight:700 }}>{i+1}.</span> {step}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
