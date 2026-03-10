import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle, Clock, Lock, AlertTriangle, ChevronDown, ChevronUp,
  Upload, X, FileText, Image as ImageIcon, Video, Plus, Trash2, DollarSign,
  ArrowLeft, RefreshCw, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import Layout from "../../components/layout/Layout";
import api from "../../utils/api";
import useAuthStore from "../../store/authStore";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  locked:           { label: "Locked",           color: "text-gray-400",    bg: "bg-white/8",       icon: Lock },
  proof_submitted:  { label: "Proof Submitted",  color: "text-yellow-400",  bg: "bg-yellow-500/20",  icon: Clock },
  approved:         { label: "Approved",          color: "text-primary-400", bg: "bg-primary-500/20", icon: CheckCircle },
  auto_released:    { label: "Auto-Released",     color: "text-blue-400",    bg: "bg-blue-500/20",    icon: RefreshCw },
  disputed:         { label: "Disputed",          color: "text-red-400",     bg: "bg-red-500/20",     icon: AlertTriangle },
  completed:        { label: "Completed",         color: "text-primary-400", bg: "bg-primary-500/20", icon: CheckCircle },
};

// ─── Countdown timer component ──────────────────────────────────────────────
function Countdown({ autoReleaseAt }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const calc = () => {
      const diff = new Date(autoReleaseAt) - new Date();
      if (diff <= 0) { setRemaining("Auto-releasing..."); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m remaining`);
    };
    calc();
    const t = setInterval(calc, 60000);
    return () => clearInterval(t);
  }, [autoReleaseAt]);

  return (
    <span className="text-xs text-yellow-400 flex items-center gap-1">
      <Clock size={12} /> {remaining}
    </span>
  );
}

// ─── Single milestone card ──────────────────────────────────────────────────
function MilestoneCard({ milestone, isCreator, onRefresh }) {
  const [expanded, setExpanded]           = useState(false);
  const [proofNotes, setProofNotes]       = useState("");
  const [files, setFiles]                 = useState([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute]     = useState(false);
  const [loading, setLoading]             = useState(false);

  const cfg = STATUS[milestone.status] || STATUS.locked;
  const Icon = cfg.icon;
  const isDone = ["approved", "auto_released", "completed"].includes(milestone.status);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 5) {
      toast.error("Maximum 5 files per milestone");
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmitProof = async () => {
    if (files.length === 0 && !proofNotes.trim()) {
      toast.error("Please upload at least one file or add proof notes");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("proofFiles", f));
      form.append("proofNotes", proofNotes);
      await api.post(`/milestones/${milestone._id}/proof`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Proof submitted! Investor has 72 hours to review.");
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit proof");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      await api.put(`/milestones/${milestone._id}/approve`);
      toast.success(`Milestone approved — $${milestone.amount} released!`);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve");
    } finally {
      setLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/milestones/${milestone._id}/dispute`, { reason: disputeReason });
      toast.success("Dispute raised. Admin will review within 48 hours.");
      setShowDispute(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to raise dispute");
    } finally {
      setLoading(false);
    }
  };

  const fileIcon = (file) => {
    if (file.type?.startsWith("video/") || file.type === "video") return <Video size={14} className="text-blue-400" />;
    if (file.type === "document" || file.name?.endsWith(".pdf")) return <FileText size={14} className="text-orange-400" />;
    return <ImageIcon size={14} className="text-primary-400" />;
  };

  return (
    <div className={`card border ${isDone ? "border-primary-500/30" : milestone.status === "disputed" ? "border-red-500/30" : milestone.status === "proof_submitted" ? "border-yellow-500/30" : "border-white/10"}`}>
      {/* ── Header row ── */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          {/* Order badge */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isDone ? "bg-primary-500/20 text-primary-400" : "bg-white/8 text-gray-400"}`}>
            {milestone.order}
          </div>
          <div>
            <p className="font-semibold text-dark-100">{milestone.title}</p>
            <p className="text-xs text-gray-400">${milestone.amount.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
            <Icon size={11} /> {cfg.label}
          </span>
          {milestone.status === "proof_submitted" && milestone.autoReleaseAt && (
            <Countdown autoReleaseAt={milestone.autoReleaseAt} />
          )}
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* ── Expanded content ── */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
          <p className="text-sm text-gray-400">{milestone.description}</p>

          {/* Proof files already submitted */}
          {milestone.proofFiles?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Proof Submitted</p>
              <div className="space-y-1">
                {milestone.proofFiles.map((f, i) => (
                  <a
                    key={f.url || i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300"
                  >
                    {fileIcon(f)} <Eye size={13} /> {f.originalName || `File ${i + 1}`}
                  </a>
                ))}
              </div>
              {milestone.proofNotes && (
                <p className="mt-2 text-sm text-gray-400 italic">"{milestone.proofNotes}"</p>
              )}
            </div>
          )}

          {/* Admin note */}
          {milestone.adminNote && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-400 mb-1">Admin Note</p>
              <p className="text-sm text-gray-400">{milestone.adminNote}</p>
            </div>
          )}

          {/* ── Creator actions ── */}
          {isCreator && milestone.status === "locked" && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Submit Proof</p>

              {/* File upload */}
              <label className="flex items-center gap-2 cursor-pointer border border-dashed border-white/10 rounded-lg p-3 hover:border-primary-500/50 transition-colors">
                <Upload size={16} className="text-gray-400" />
                <span className="text-sm text-gray-400">Upload files (photos, receipts, video)</span>
                <input type="file" multiple accept="image/*,video/*,.pdf" className="hidden" onChange={handleFileChange} />
              </label>

              {files.length > 0 && (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/8 rounded px-3 py-1.5">
                      <span className="text-xs text-gray-400 truncate">{f.name}</span>
                      <button onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-400 ml-2">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                className="input-field text-sm resize-none"
                rows={3}
                placeholder="Describe what you did and how the funds were used..."
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
              />

              <button
                onClick={handleSubmitProof}
                disabled={loading}
                className="btn-primary w-full text-sm"
              >
                {loading ? "Submitting..." : "Submit Proof"}
              </button>
            </div>
          )}

          {/* ── Investor actions ── */}
          {!isCreator && milestone.status === "proof_submitted" && (
            <div className="space-y-3">
              {!showDispute ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="btn-primary flex-1 text-sm"
                  >
                    {loading ? "Processing..." : `Approve & Release $${milestone.amount}`}
                  </button>
                  <button
                    onClick={() => setShowDispute(true)}
                    className="flex-1 text-sm border border-red-500/40 text-red-400 rounded-lg px-4 py-2 hover:bg-red-500/10 transition-colors"
                  >
                    Dispute
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-400">Dispute Reason</p>
                  <textarea
                    className="input-field text-sm resize-none border-red-500/30"
                    rows={3}
                    placeholder="Explain why you are disputing this proof submission..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleDispute} disabled={loading} className="flex-1 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-4 py-2 hover:bg-red-500/30 transition-colors">
                      {loading ? "Submitting..." : "Submit Dispute"}
                    </button>
                    <button onClick={() => setShowDispute(false)} className="flex-1 text-sm border border-white/10 text-gray-400 rounded-lg px-4 py-2 hover:bg-white/8 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Approved / done state */}
          {isDone && milestone.approvedAt && (
            <p className="text-xs text-gray-400">
              {milestone.status === "auto_released" ? "Auto-released" : "Approved"} on{" "}
              {new Date(milestone.approvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Create milestones form (creator, first time) ───────────────────────────
function CreateMilestonesForm({ investment, onCreated }) {
  const [rows, setRows] = useState([{ title: "", description: "", amount: "" }]);
  const [loading, setLoading] = useState(false);

  const totalEntered = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
  const remaining = investment.amount - totalEntered;

  const addRow = () => setRows((prev) => [...prev, { title: "", description: "", amount: "" }]);
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  const handleSubmit = async () => {
    if (rows.some((r) => !r.title || !r.description || !r.amount)) {
      toast.error("Please fill in all milestone fields");
      return;
    }
    if (Math.abs(remaining) > 1) {
      toast.error(`Milestone amounts must total exactly $${investment.amount}`);
      return;
    }
    setLoading(true);
    try {
      await api.post("/milestones", {
        investmentId: investment._id,
        milestones: rows.map((r) => ({ ...r, amount: parseFloat(r.amount) })),
      });
      toast.success("Milestones created successfully!");
      onCreated();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create milestones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
        <p className="text-sm text-primary-400 font-medium">
          Break your ${ investment.amount.toLocaleString()} funding into milestones. Each milestone
          unlocks its funds when you submit proof and the investor approves.
        </p>
      </div>

      {/* Budget tracker */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Total budget: <span className="text-dark-100 font-medium">${investment.amount.toLocaleString()}</span></span>
        <span className={remaining < 0 ? "text-red-400" : remaining === 0 ? "text-primary-400" : "text-yellow-400"}>
          {remaining < 0 ? `Over by $${Math.abs(remaining).toFixed(2)}` : remaining === 0 ? "✓ Fully allocated" : `$${remaining.toFixed(2)} remaining`}
        </span>
      </div>

      {/* Budget bar */}
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${totalEntered > investment.amount ? "bg-red-500" : "bg-primary-500"}`}
          style={{ width: `${Math.min((totalEntered / investment.amount) * 100, 100)}%` }}
        />
      </div>

      {/* Milestone rows */}
      {rows.map((row, i) => (
        <div key={i} className="card border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-400">Milestone {i + 1}</p>
            {rows.length > 1 && (
              <button onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-400">
                <Trash2 size={15} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <input
              className="input-field text-sm"
              placeholder="Milestone title (e.g. Buy industrial sewing machine)"
              value={row.title}
              onChange={(e) => updateRow(i, "title", e.target.value)}
            />
            <textarea
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="What will you do / buy with this tranche?"
              value={row.description}
              onChange={(e) => updateRow(i, "description", e.target.value)}
            />
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-3.5 text-gray-400" />
              <input
                type="number"
                className="input-field text-sm"
                style={{ paddingLeft: "2rem" }}
                placeholder="Amount"
                value={row.amount}
                onChange={(e) => updateRow(i, "amount", e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addRow}
        className="w-full border border-dashed border-white/10 rounded-lg py-2.5 text-sm text-gray-400 hover:border-primary-500/50 hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={15} /> Add Milestone
      </button>

      <button
        onClick={handleSubmit}
        disabled={loading || Math.abs(remaining) > 1}
        className="btn-primary w-full"
      >
        {loading ? "Saving..." : "Save Milestones"}
      </button>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export default function Milestones() {
  const { investmentId } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuthStore();

  const [investment, setInvestment] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
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
      // If milestones 404, investment might still be valid
      try {
        const invRes = await api.get(`/investments/${investmentId}`);
        setInvestment(invRes.data.investment);
        setNoMilestones(true);
      } catch {
        toast.error("Investment not found");
        navigate("/investments");
      }
    } finally {
      setLoading(false);
    }
  }, [investmentId, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <Layout title="Milestones">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500" />
        </div>
      </Layout>
    );
  }

  if (!investment) return null;

  const progressPct = summary ? Math.round((summary.completedAmount / summary.totalAmount) * 100) : 0;

  return (
    <Layout title="Milestones">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate("/investments")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-400 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Investments
        </button>

        {/* Investment summary card */}
        <div className="card border border-white/10">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-lg font-bold text-dark-100">
                {isCreator ? investment.investor?.name : investment.creator?.name}
              </h2>
              <p className="text-sm text-gray-400">
                ${investment.amount.toLocaleString()} · {investment.profitSharePercentage}% for {investment.duration} months
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${investment.status === "active" ? "bg-primary-500/20 text-primary-400" : "bg-white/8 text-gray-400"}`}>
              {investment.status}
            </span>
          </div>

          {/* Progress */}
          {summary && summary.totalAmount > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>${summary.completedAmount.toLocaleString()} released</span>
                <span>${summary.totalAmount.toLocaleString()} total</span>
              </div>
              <div className="h-2 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span><span className="text-primary-400 font-medium">{summary.completedCount}</span> completed</span>
                <span><span className="text-yellow-400 font-medium">{summary.pendingCount}</span> pending review</span>
                <span><span className="text-gray-400 font-medium">{summary.lockedCount}</span> locked</span>
              </div>
            </div>
          )}
        </div>

        {/* Milestones section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-dark-100">
            {noMilestones
              ? isCreator
                ? "Set Up Your Milestones"
                : "Awaiting Milestone Setup"
              : `Milestones (${milestones.length})`}
          </h3>

          {/* Creator — no milestones yet */}
          {noMilestones && isCreator && (
            <CreateMilestonesForm investment={investment} onCreated={fetchData} />
          )}

          {/* Investor — waiting */}
          {noMilestones && !isCreator && (
            <div className="card border border-white/10 text-center py-10">
              <Clock size={32} className="text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">Awaiting milestone setup</p>
              <p className="text-sm text-gray-300 mt-1">
                The creator hasn't set up their milestones yet.
              </p>
            </div>
          )}

          {/* Milestone cards */}
          {!noMilestones && milestones.map((m) => (
            <MilestoneCard
              key={m._id}
              milestone={m}
              isCreator={isCreator}
              onRefresh={fetchData}
            />
          ))}
        </div>

        {/* How it works info box */}
        {!noMilestones && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-400 space-y-1">
            <p className="font-semibold text-gray-400 mb-2">How milestones work</p>
            <p>1. Creator completes a milestone task and submits photo/receipt/video proof.</p>
            <p>2. Investor reviews and approves — funds are released instantly.</p>
            <p>3. If the investor doesn't respond within 72 hours, funds auto-release.</p>
            <p>4. If proof is disputed, SkillFund admin mediates within 48 hours.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
