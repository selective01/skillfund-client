import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScaleBalanced, faCircleNotch, faPlus, faCloudArrowUp,
  faTrash, faArrowRight, faCircleCheck, faCircleXmark,
  faHourglassHalf, faEye, faChevronDown, faChevronUp,
  faTriangleExclamation, faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

const REASONS = [
  "Creator not reporting earnings",
  "Incorrect earnings reported",
  "Creator stopped communicating",
  "Terms of agreement violated",
  "Fraudulent activity",
  "Other",
];

const STATUS_CONFIG = {
  open:         { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  icon: faHourglassHalf,      label: "Open" },
  under_review: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)",  icon: faEye,                label: "Under Review" },
  resolved:     { color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.25)",   icon: faCircleCheck,        label: "Resolved" },
  closed:       { color: "#6b7280", bg: "rgba(107,114,128,0.1)", border: "rgba(107,114,128,0.25)", icon: faCircleXmark,        label: "Closed" },
};

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusPill({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black" style={{ fontFamily: "'Syne',sans-serif", background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      <FontAwesomeIcon icon={s.icon} style={{ fontSize: "10px" }} />
      {s.label}
    </span>
  );
}

function DisputeCard({ dispute, currentUserId }) {
  useNotificationReadOnView();
  const [expanded, setExpanded] = useState(false);
  const isFiler   = dispute.filedBy?._id === currentUserId || dispute.filedBy?._id?.toString() === currentUserId;
  const other     = isFiler ? dispute.filedAgainst : dispute.filedBy;
  const s         = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open;

  return (
    <div className="rounded-2xl overflow-hidden transition-all" style={{ background: "#070d08", border: `1px solid ${expanded ? s.border : "rgba(255,255,255,0.2)"}` }}>
      {/* Card header */}
      <button className="w-full flex items-start gap-4 p-5 text-left" onClick={() => setExpanded(p => !p)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
          <FontAwesomeIcon icon={faScaleBalanced} style={{ fontSize: "15px", color: s.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <StatusPill status={dispute.status} />
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#6b7280" }}>{isFiler ? "Filed by you" : "Filed against you"}</span>
          </div>
          <p className="font-black" style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", color: "#fff" }}>{dispute.reason}</p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
            vs {other?.name || "Unknown"} · {fmt(dispute.createdAt)}
          </p>
        </div>
        <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", flexShrink: 0 }} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "rgba(255,255,255,0.18)" }}>
          <div className="pt-4">
            <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "6px" }}>Description</p>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#9ca3af", lineHeight: 1.7 }}>{dispute.description}</p>
          </div>

          {dispute.evidence?.length > 0 && (
            <div>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "8px" }}>Evidence ({dispute.evidence.length})</p>
              <div className="flex flex-wrap gap-2">
                {dispute.evidence.map((ev, i) => (
                  <a key={i} href={ev.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.35)", color: "#3b82f6", fontFamily: "'Syne',sans-serif" }}>
                    <FontAwesomeIcon icon={faEye} style={{ fontSize: "10px" }} /> File {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {dispute.status === "resolved" && dispute.resolution && (
            <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.30)" }}>
              <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: "6px" }}>Resolution</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#9ca3af", lineHeight: 1.7 }}>{dispute.resolution}</p>
              {dispute.refundAmount > 0 && (
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", color: "#22c55e", marginTop: "8px" }}>
                  Refund issued: ${dispute.refundAmount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280" }}>Investment amount: <strong style={{ color: "#9ca3af" }}>${dispute.investmentId?.amount?.toLocaleString() || "—"}</strong></span>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280" }}>Opened {fmt(dispute.createdAt)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function EvidenceDropZone({ files, onAdd, onRemove }) {
  const inputRef = useRef();

  const handleChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const valid = newFiles.filter(f => f.type.startsWith("image/") || f.type === "application/pdf");
    if (files.length + valid.length > 5) { toast.error("Maximum 5 evidence files"); return; }
    valid.forEach(onAdd);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.35)" }}>
            <span style={{ fontFamily: "'DM Sans',sans-serif", color: "#9ca3af", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
            <button onClick={() => onRemove(i)} style={{ color: "#ef4444" }}><FontAwesomeIcon icon={faTrash} style={{ fontSize: "10px" }} /></button>
          </div>
        ))}
      </div>
      {files.length < 5 && (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{ fontFamily: "'Syne',sans-serif", background: "#0a1209", border: "1px solid rgba(255,255,255,0.2)", color: "#9ca3af" }}>
          <FontAwesomeIcon icon={faCloudArrowUp} style={{ fontSize: "13px" }} />
          Add evidence ({files.length}/5)
        </button>
      )}
      <input ref={inputRef} type="file" multiple accept="image/*,application/pdf" onChange={handleChange} style={{ display: "none" }} />
    </div>
  );
}

export default function Dispute() {
  const { user } = useAuthStore();

  const [disputes,     setDisputes]     = useState([]);
  const [investments,  setInvestments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [showForm,     setShowForm]     = useState(false);

  // Form state
  const [investmentId, setInvestmentId] = useState("");
  const [reason,       setReason]       = useState("");
  const [description,  setDescription]  = useState("");
  const [evidence,     setEvidence]     = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dispRes, invRes] = await Promise.all([
          api.get("/disputes"),
          api.get("/investments/my-investments"),
        ]);
        setDisputes(dispRes.data.disputes || []);
        const invs = invRes.data.investments || [];
        setInvestments(invs.filter(i => i.status === "active"));
      } catch {
        toast.error("Failed to load disputes");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!investmentId || !reason || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (description.trim().length < 30) {
      toast.error("Please provide a more detailed description (min 30 characters)");
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("investmentId", investmentId);
      fd.append("reason",       reason);
      fd.append("description",  description);
      evidence.forEach(f => fd.append("evidence", f));

      const res = await api.post("/disputes", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Dispute filed. Our team will review within 48 hours.");
      setDisputes(p => [res.data.dispute, ...p]);
      setShowForm(false);
      setInvestmentId(""); setReason(""); setDescription(""); setEvidence([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to file dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: "12px", fontSize: "14px", color: "#fff", outline: "none", background: "#0a1209", border: "1px solid rgba(255,255,255,0.2)", fontFamily: "'DM Sans',sans-serif", transition: "border-color .2s" };
  const labelStyle = { fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: ".08em", display: "block", marginBottom: "8px" };

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        .dispute-input:focus { border-color: rgba(34,197,94,0.4) !important; }
        .dispute-input::placeholder { color: #4b5563; }
      `}</style>

      {/* Header */}
      <div className="rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#1a0f0f,#0f0a0a,#0a0606)", border: "1px solid rgba(239,68,68,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#ef4444,transparent)", transform: "translate(30%,-30%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.30)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <FontAwesomeIcon icon={faScaleBalanced} style={{ fontSize: "14px", color: "#ef4444" }} />
              </div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#ef4444", textTransform: "uppercase", letterSpacing: ".1em" }}>Dispute Center</span>
            </div>
            <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.4rem,3vw,1.8rem)", lineHeight: 1.1 }}>Investment Disputes</h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>
              File a dispute if there's a problem with an active investment. Our team mediates within 48 hours.
            </p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black flex-shrink-0 transition-all hover:scale-105"
              style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "rgba(239,68,68,0.30)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: "12px" }} /> File Dispute
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: "#070d08", border: "1px solid rgba(239,68,68,0.35)" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-black" style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", color: "#fff" }}>File a Dispute</p>
            <button onClick={() => setShowForm(false)} style={{ color: "#6b7280" }}>
              <FontAwesomeIcon icon={faCircleXmark} style={{ fontSize: "18px" }} />
            </button>
          </div>

          {/* Warning */}
          <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.35)" }}>
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "13px", color: "#f59e0b", marginTop: "2px", flexShrink: 0 }} />
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#9ca3af", lineHeight: 1.6 }}>
              Please try to resolve issues directly with the other party first. Disputes are reviewed by our admin team and may take up to 48 hours.
            </p>
          </div>

          {/* Investment selector */}
          <div>
            <label style={labelStyle}>Investment <span style={{ color: "#ef4444" }}>*</span></label>
            {investments.length === 0 ? (
              <div className="rounded-xl p-4 text-center" style={{ background: "#0a1209", border: "1px solid rgba(255,255,255,0.2)" }}>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280" }}>No active investments to dispute.</p>
              </div>
            ) : (
              <select value={investmentId} onChange={e => setInvestmentId(e.target.value)}
                className="dispute-input" style={{ ...inputStyle, appearance: "none" }}>
                <option value="">Select an investment…</option>
                {investments.map(inv => {
                  const other = user?.role === "investor" ? inv.creator : inv.investor;
                  return (
                    <option key={inv._id} value={inv._id}>
                      ${inv.amount?.toLocaleString()} · {other?.name || "Unknown"} · {inv.status}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {/* Reason */}
          <div>
            <label style={labelStyle}>Reason <span style={{ color: "#ef4444" }}>*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button key={r} type="button" onClick={() => setReason(r)}
                  className="text-left px-4 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ fontFamily: "'Syne',sans-serif", background: reason === r ? "rgba(239,68,68,0.1)" : "#0a1209", border: `1px solid ${reason === r ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.2)"}`, color: reason === r ? "#ef4444" : "#6b7280" }}>
                  {reason === r && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", marginRight: "6px" }} />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description <span style={{ color: "#ef4444" }}>*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. Include dates, amounts, and any relevant context…"
              rows={5}
              className="dispute-input"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "11px", color: description.length < 30 ? "#ef4444" : "#6b7280", marginTop: "4px" }}>
              {description.length} characters · minimum 30 required
            </p>
          </div>

          {/* Evidence */}
          <div>
            <label style={labelStyle}>Evidence <span style={{ color: "#6b7280", fontWeight: 600 }}>(optional · max 5 files)</span></label>
            <EvidenceDropZone files={evidence} onAdd={f => setEvidence(p => [...p, f])} onRemove={i => setEvidence(p => p.filter((_, idx) => idx !== i))} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold"
              style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "#0a1209", border: "1px solid rgba(255,255,255,0.2)", color: "#6b7280" }}>
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "12px" }} /> Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting || !investmentId || !reason || description.length < 30}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", boxShadow: "0 4px 20px rgba(239,68,68,0.25)" }}>
              {submitting
                ? <><FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "14px" }} /> Filing…</>
                : <><FontAwesomeIcon icon={faScaleBalanced} style={{ fontSize: "14px" }} /> Submit Dispute <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} /></>
              }
            </button>
          </div>
        </div>
      )}

      {/* Disputes list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "20px", color: "#22c55e" }} />
        </div>
      ) : disputes.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.2)" }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)" }}>
            <FontAwesomeIcon icon={faScaleBalanced} style={{ fontSize: "22px", color: "#6b7280" }} />
          </div>
          <p className="font-black mb-2" style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", color: "#fff" }}>No disputes yet</p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280" }}>Disputes you file or receive will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: ".1em" }}>
            {disputes.length} Dispute{disputes.length !== 1 ? "s" : ""}
          </p>
          {disputes.map(d => (
            <DisputeCard key={d._id} dispute={d} currentUserId={user?._id || user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
