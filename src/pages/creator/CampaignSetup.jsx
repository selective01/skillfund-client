import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight, faArrowLeft, faCircleNotch, faFloppyDisk,
  faCircleCheck, faChevronDown, faPlus, faTrash, faLock,
  faEye, faRocket, faArrowTrendUp, faImages, faFlag,
  faLightbulb, faShieldHalved, faVideo, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/useThemeStore";
import api from "../../utils/api";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

// ─── Constants ────────────────────────────────────────────────────────────────
const SKILL_CATEGORIES = [
  { value: "fashion",     label: "Fashion & Tailoring",    emoji: "👗" },
  { value: "carpentry",   label: "Carpentry & Woodwork",   emoji: "🪵" },
  { value: "farming",     label: "Farming & Agriculture",  emoji: "🌾" },
  { value: "photography", label: "Photography & Video",    emoji: "📸" },
  { value: "baking",      label: "Baking & Pastry",        emoji: "🎂" },
  { value: "mechanics",   label: "Mechanics & Auto",       emoji: "🔧" },
  { value: "technology",  label: "Technology & IT",        emoji: "💻" },
  { value: "hair",        label: "Hair & Beauty",          emoji: "✂️" },
  { value: "artisan",     label: "Artisan & Crafts",       emoji: "🎨" },
  { value: "other",       label: "Other",                  emoji: "⚡" },
];

const STEPS = [
  { id: "basics",     label: "Basics",      icon: faLightbulb,    desc: "Your skill & story"       },
  { id: "funding",    label: "Funding",     icon: faArrowTrendUp, desc: "Goal & profit share"      },
  { id: "milestones", label: "Milestones",  icon: faFlag,         desc: "Proof checkpoints"        },
  { id: "media",      label: "Media",       icon: faImages,       desc: "Portfolio & pitch video"  },
  { id: "review",     label: "Go Live",     icon: faRocket,       desc: "Preview & publish"        },
];

const PORTFOLIO_LIMITS = { basic: 2, starter: 5, pro: 20, elite: Infinity };

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (n) => `$${Number(n || 0).toLocaleString()}`;

function validate(step, form) {
  const errs = {};
  if (step === "basics") {
    if (!form.skill.trim())        errs.skill        = "Enter your skill or trade";
    if (!form.skillCategory)       errs.skillCategory = "Choose a category";
    if (!form.bio.trim())          errs.bio          = "Write a short bio";
    if (form.bio.trim().length < 40) errs.bio        = "Bio should be at least 40 characters";
    if (!form.fundingPurpose.trim()) errs.fundingPurpose = "Explain what you'll use the funding for";
    if (form.fundingPurpose.trim().length < 60) errs.fundingPurpose = "Please write at least 60 characters";
  }
  if (step === "funding") {
    if (!form.fundingGoal || form.fundingGoal <= 0)             errs.fundingGoal            = "Enter a funding goal greater than $0";
    if (!form.projectedMonthlyIncome || form.projectedMonthlyIncome <= 0) errs.projectedMonthlyIncome = "Enter your projected monthly income";
    if (!form.profitSharePercentage || form.profitSharePercentage < 1 || form.profitSharePercentage > 50) errs.profitSharePercentage = "Profit share must be between 1% and 50%";
    if (!form.profitShareDuration || form.profitShareDuration < 1)  errs.profitShareDuration    = "Enter a duration of at least 1 month";
  }
  if (step === "milestones") {
    if (form.milestones.length === 0) errs.milestones = "Add at least one milestone";
    form.milestones.forEach((m, i) => {
      if (!m.title.trim())  errs[`m_title_${i}`]  = "Milestone title required";
      if (!m.amount || m.amount <= 0) errs[`m_amount_${i}`] = "Amount required";
    });
    const total = form.milestones.reduce((s, m) => s + Number(m.amount || 0), 0);
    if (form.fundingGoal > 0 && Math.abs(total - Number(form.fundingGoal)) > 1) {
      errs.milestones_total = `Milestone amounts ($${total.toLocaleString()}) must equal your funding goal (${fmt$(form.fundingGoal)})`;
    }
  }
  return errs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function CampaignSetup() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _dim = _L ? "#6b7280" : "#4a5568";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";

  useNotificationReadOnView();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  const portfolioInputRef = useRef(null);
  const videoInputRef     = useRef(null);

  const [stepIdx,   setStepIdx]   = useState(0);
  const [saving,    setSaving]    = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [errors,    setErrors]    = useState({});
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const [videoUploading,     setVideoUploading]     = useState(false);
  const [profile,   setProfile]   = useState(null);

  const currentStep = STEPS[stepIdx];
  const portfolioLimit = PORTFOLIO_LIMITS[user?.plan] || 2;

  // ─── Form ─────────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    skill: "", skillCategory: "other", bio: "",
    location: "", fundingPurpose: "",
    fundingGoal: "", projectedMonthlyIncome: "",
    profitSharePercentage: "", profitShareDuration: "",
    isAcceptingInvestments: true,
    milestones: [],
    pitchVideoUrl: "",
  });

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // ─── Load existing profile ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/profiles/me");
        const p   = res.data.profile || {};
        setProfile(p);
        setForm((prev) => ({
          ...prev,
          skill:                   p.skill                   || "",
          skillCategory:           p.skillCategory           || "other",
          bio:                     p.bio                     || "",
          location:                p.location                || "",
          fundingPurpose:          p.fundingPurpose          || "",
          fundingGoal:             p.fundingGoal             || "",
          projectedMonthlyIncome:  p.projectedMonthlyIncome  || "",
          profitSharePercentage:   p.profitSharePercentage   || "",
          profitShareDuration:     p.profitShareDuration     || "",
          isAcceptingInvestments:  p.isAcceptingInvestments  ?? true,
          pitchVideoUrl:           p.pitchVideoUrl            || "",
        }));
      } catch {
        // No profile yet — starting fresh
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === "creator") load();
    else { setLoading(false); }
  }, [user]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const goNext = () => {
    const errs = validate(currentStep.id, form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setErrors({});
    setStepIdx((i) => Math.max(i - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Save (all steps) ────────────────────────────────────────────────────
  const handleSave = async (publish = false) => {
    setSaving(true);
    try {
      const payload = {
        skill:                  form.skill,
        skillCategory:          form.skillCategory,
        bio:                    form.bio,
        location:               form.location,
        fundingPurpose:         form.fundingPurpose,
        fundingGoal:            parseFloat(form.fundingGoal)            || 0,
        projectedMonthlyIncome: parseFloat(form.projectedMonthlyIncome) || 0,
        profitSharePercentage:  parseFloat(form.profitSharePercentage)  || 0,
        profitShareDuration:    parseInt(form.profitShareDuration)      || 0,
        isAcceptingInvestments: publish ? true : form.isAcceptingInvestments,
        pitchVideoUrl:          form.pitchVideoUrl,
      };
      await api.put("/profiles/me", payload);

      // Save milestones if any
      if (form.milestones.length > 0) {
        await api.post("/milestones/setup", { milestones: form.milestones }).catch(() => {});
      }

      toast.success(publish ? "Campaign is live! 🚀" : "Draft saved!");
      if (publish) navigate(`/campaign/${user?._id || user?.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  };

  // ─── Milestone helpers ────────────────────────────────────────────────────
  const addMilestone = () => {
    setForm((p) => ({
      ...p,
      milestones: [...p.milestones, { title: "", description: "", amount: "" }],
    }));
  };

  const updateMilestone = (i, key, val) => {
    setForm((p) => {
      const ms = [...p.milestones];
      ms[i] = { ...ms[i], [key]: val };
      return { ...p, milestones: ms };
    });
  };

  const removeMilestone = (i) => {
    setForm((p) => ({ ...p, milestones: p.milestones.filter((_, idx) => idx !== i) }));
  };

  const autoSplitMilestones = () => {
    const goal = parseFloat(form.fundingGoal);
    if (!goal || goal <= 0) { toast.error("Set your funding goal first"); return; }
    const thirds = [
      { title: "Initial Setup", description: "Equipment, tools, or initial materials to begin", amount: Math.round(goal * 0.2) },
      { title: "Operations & Growth", description: "Expand operations and serve first customers", amount: Math.round(goal * 0.4) },
      { title: "Scale & Marketing", description: "Marketing push and reach full production capacity", amount: Math.round(goal * 0.4) },
    ];
    setForm((p) => ({ ...p, milestones: thirds }));
    toast.success("Auto-split applied — adjust as needed");
  };

  // ─── Portfolio upload ─────────────────────────────────────────────────────
  const handlePortfolioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const currentCount = profile?.portfolio?.length || 0;
    if (typeof portfolioLimit === "number" && currentCount >= portfolioLimit) {
      toast.error(`Your ${user?.plan} plan allows max ${portfolioLimit} portfolio items`);
      return;
    }
    setPortfolioUploading(true);
    try {
      const data = new FormData();
      data.append("image", file);
      data.append("title", file.name.replace(/\.[^.]+$/, ""));
      data.append("description", "");
      const res2 = await api.post("/profiles/portfolio", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p) => ({ ...p, portfolio: res2.data.portfolio }));
      toast.success("Portfolio item added!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setPortfolioUploading(false);
      e.target.value = "";
    }
  };

  const handlePortfolioDelete = async (itemId) => {
    try {
      const res3 = await api.delete(`/profiles/portfolio/${itemId}`);
      setProfile((p) => ({ ...p, portfolio: res3.data.portfolio }));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  // ─── Video upload ─────────────────────────────────────────────────────────
  const handleVideoUpload = async (e) => {
    const file2 = e.target.files?.[0];
    if (!file2) return;
    setVideoUploading(true);
    try {
      const data2 = new FormData();
      data2.append("video", file2);
      const res4 = await api.post("/profiles/pitch-video", data2, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set("pitchVideoUrl", res4.data2.pitchVideoUrl);
      toast.success("Pitch video uploaded!");
    } catch {
      toast.error("Video upload failed");
    } finally {
      setVideoUploading(false);
      e.target.value = "";
    }
  };

  // ─── Derived ─────────────────────────────────────────────────────────────
  if (!user || user.role !== "creator") {
    return (
      <div className="rounded-3xl p-16 text-center" style={{ background: _card, border: `1px solid ${_cardBorder}` }}>
        <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "36px", color: "#2d4a31", marginBottom: "16px" }} />
        <h3 className="font-black text-white mb-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.4rem" }}>Creators only</h3>
        <p className="text-sm" style={{ color: _dim }}>This page is for creator accounts only.</p>
      </div>
    );
  }

  if (loading) return <SetupSkeleton />;

  const milestoneTotal = form.milestones.reduce((s, m) => s + Number(m.amount || 0), 0);
  const milestoneGap   = Number(form.fundingGoal || 0) - milestoneTotal;
  
  const projReturn     = form.projectedMonthlyIncome && form.profitSharePercentage && form.profitShareDuration
    ? Math.round(Number(form.projectedMonthlyIncome) * Number(form.profitSharePercentage) / 100 * Number(form.profitShareDuration))
    : null;

  return (
    <div className="space-y-6 pb-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .cs-field { background:var(--bg-input); border:1px solid var(--border); color:var(--text-primary); border-radius:12px; padding:10px 14px; font-size:14px; outline:none; width:100%; font-family:'Inter', sans-serif; transition:border-color .2s,background .2s; }
        .cs-field::placeholder { color:#2d4a31; }
        .cs-field:focus { border-color:rgba(34,197,94,0.4); background:var(--bg-input); }
        .cs-field.error { border-color:rgba(239,68,68,0.5); }
        .cs-select { background:var(--bg-input); border:1px solid var(--border); color:var(--text-primary); border-radius:12px; padding:10px 36px 10px 14px; font-size:14px; outline:none; width:100%; font-family:'Inter', sans-serif; appearance:none; cursor:pointer; transition:border-color .2s; }
        .cs-select:focus { border-color:rgba(34,197,94,0.4); }
        .cs-select option { background:var(--bg-card); }
        .cs-label { display:block; font-size:11px; font-weight:700; font-family:'Inter', sans-serif; text-transform:uppercase; letter-spacing:.06em; color:#9ca3af; margin-bottom:6px; }
        .cs-err { font-size:11px; color:#f87171; font-family:'Inter', sans-serif; margin-top:4px; display:flex; align-items:center; gap:4px; }
        .cs-card { background:var(--sf-bg-card,#070d08); border:1px solid var(--sf-border,rgba(255,255,255,0.07)); border-radius:20px; padding:22px; }
        .cs-section-title { font-family:'Inter', sans-serif; font-size:1.1rem; font-weight:900; color:white; margin:0 0 4px; }
        .cs-section-sub { font-family:'Inter', sans-serif; font-size:13px; color:#6b7280; margin:0 0 20px; }
        .cs-toggle { position:relative; width:44px; height:24px; border-radius:12px; border:none; cursor:pointer; transition:background .2s; flex-shrink:0; }
        .cs-toggle-thumb { position:absolute; top:3px; width:18px; height:18px; border-radius:9px; background:#fff; transition:left .2s; }
        .cs-btn-green { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:900; font-size:13px; padding:11px 22px; border-radius:13px; cursor:pointer; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; border:none; transition:.15s; box-shadow:0 4px 16px rgba(34,197,94,0.2); white-space:nowrap; }
        .cs-btn-green:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 6px 24px rgba(34,197,94,0.3); }
        .cs-btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; }
        .cs-btn-ghost { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:700; font-size:13px; padding:11px 22px; border-radius:13px; cursor:pointer; background:var(--sf-bg-input,rgba(0,0,0,0.3)); border:1px solid var(--sf-border,rgba(255,255,255,0.1)); color:var(--sf-text-muted,#9ca3af); transition:.15s; white-space:nowrap; }
        .cs-btn-ghost:hover { border-color:rgba(34,197,94,0.25); color:white; }
        .cs-ms-card { background:var(--sf-bg-input,#0a1209); border:1px solid var(--sf-border,rgba(255,255,255,0.07)); border-radius:14px; padding:14px 16px; }
        .cs-ms-card.has-error { border-color:rgba(239,68,68,0.3); }
        .cs-preview-row { display:flex; justify-content:space-between; align-items:center; padding:9px 0; border-bottom:1px solid var(--sf-border,rgba(255,255,255,0.05)); }
        .cs-preview-row:last-child { border-bottom:none; }
        .cs-preview-label { font-family:'Inter', sans-serif; font-size:12px; color:#6b7280; }
        .cs-preview-val { font-family:'Inter', sans-serif; font-size:13px; font-weight:900; color:white; }
        .cs-checklist-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--sf-border,rgba(255,255,255,0.04)); }
        .cs-checklist-item:last-child { border-bottom:none; }
        .cs-char-count { font-family:'Inter', sans-serif; font-size:11px; color:#4a5568; text-align:right; margin-top:3px; }
      `}</style>

      {/* ── Page header ── */}
      <div>
        <h1 className="font-black text-white" style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(1.4rem,3vw,2rem)", marginBottom: "4px" }}>
          Campaign Setup
        </h1>
        <p style={{ color: _dim, fontFamily: "'Inter', sans-serif", fontSize: "14px" }}>
          Build your public campaign page so investors can find and fund you.
        </p>
      </div>

      {/* ── Step progress bar ── */}
      <div className="cs-card" style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", gap: "4px", alignItems: "center", overflowX: "auto" }}>
          {STEPS.map((step, i) => {
            const done    = i < stepIdx;
            const active  = i === stepIdx;
            return (
              <div key={step.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? "1" : "0", minWidth: 0 }}>
                <button
                  onClick={() => { if (done) { setStepIdx(i); setErrors({}); } }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                    cursor: done ? "pointer" : "default",
                    flexShrink: 0, padding: "6px 8px", borderRadius: "12px", border: "none",
                    background: active ? "rgba(34,197,94,0.08)" : "transparent",
                    transition: ".15s",
                  }}
                >
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? "linear-gradient(135deg,#22c55e,#16a34a)" : active ? "rgba(34,197,94,0.15)" : _input,
                    border: active ? "1.5px solid rgba(34,197,94,0.5)" : done ? "none" : `1px solid ${_cardBorder}`,
                    transition: ".2s",
                  }}>
                    <FontAwesomeIcon
                      icon={done ? faCircleCheck : step.icon}
                      style={{ fontSize: "13px", color: done ? "#000" : active ? "#22c55e" : "#4a5568" }}
                    />
                  </div>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "10px",
                    color: done ? "#22c55e" : active ? "#22c55e" : "#4a5568",
                    whiteSpace: "nowrap",
                  }}>
                    {step.label}
                  </span>
                </button>

                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: "2px", borderRadius: "1px", margin: "0 2px", marginBottom: "18px", background: done ? "rgba(34,197,94,0.4)" : _cardBorder, transition: ".3s" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          STEP 1 — BASICS
      ══════════════════════════════════════════════════════════════ */}
      {currentStep.id === "basics" && (
        <div className="space-y-5">
          <div className="cs-card">
            <p className="cs-section-title">Your Skill & Story</p>
            <p className="cs-section-sub">This is what investors read first — make it count.</p>

            {/* Skill + Category */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
              <div>
                <label className="cs-label">Your Skill / Trade</label>
                <input
                  type="text"
                  value={form.skill}
                  onChange={(e) => set("skill", e.target.value)}
                  placeholder="e.g. Fashion Designer, Baker..."
                  className={`cs-field ${errors.skill ? "error" : ""}`}
                />
                {errors.skill && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.skill}</p>}
              </div>
              <div>
                <label className="cs-label">Category</label>
                <div style={{ position: "relative" }}>
                  <select value={form.skillCategory} onChange={(e) => set("skillCategory", e.target.value)} className="cs-select">
                    {SKILL_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#4a5568", fontSize: "11px", pointerEvents: "none" }} />
                </div>
                {errors.skillCategory && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.skillCategory}</p>}
              </div>
            </div>

            {/* Location */}
            <div style={{ marginBottom: "14px" }}>
              <label className="cs-label">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="e.g. Lagos, Nigeria"
                className="cs-field"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="cs-label">About You <span style={{ color: "#4a5568", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(shown to investors)</span></label>
              <textarea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                placeholder="Tell investors who you are, what you do, and why your skill is worth backing. Be genuine and specific — the best bios describe a real journey."
                rows={5}
                className={`cs-field ${errors.bio ? "error" : ""}`}
                style={{ resize: "vertical" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3px" }}>
                {errors.bio
                  ? <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.bio}</p>
                  : <span />
                }
                <span className="cs-char-count">{form.bio.length} chars</span>
              </div>
            </div>
          </div>

          {/* Funding Purpose */}
          <div className="cs-card">
            <p className="cs-section-title">Funding Purpose</p>
            <p className="cs-section-sub">Be specific about what the money will be used for. Vague answers reduce investor confidence.</p>
            <textarea
              value={form.fundingPurpose}
              onChange={(e) => set("fundingPurpose", e.target.value)}
              placeholder="e.g. I will use the funding to purchase an industrial sewing machine ($600), rent a small workshop space for 6 months ($700), and run a social media campaign to reach my first 50 customers ($700)."
              rows={5}
              className={`cs-field ${errors.fundingPurpose ? "error" : ""}`}
              style={{ resize: "vertical" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "3px" }}>
              {errors.fundingPurpose
                ? <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.fundingPurpose}</p>
                : <span />
              }
              <span className="cs-char-count">{form.fundingPurpose.length} chars</span>
            </div>
          </div>

          {/* Tip card */}
          <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "16px", padding: "16px 18px" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: "#22c55e", marginBottom: "8px" }}>
              <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: "6px" }} /> Tips for a strong story
            </p>
            {["Name a specific number of years you've been doing this skill", "Mention real customers or orders you've already completed", "Explain what's holding you back without this investment", "Be honest — investors back people, not pitches"].map((tip) => (
              <p key={tip} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginBottom: "4px" }}>
                · {tip}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 2 — FUNDING
      ══════════════════════════════════════════════════════════════ */}
      {currentStep.id === "funding" && (
        <div className="space-y-5">
          <div className="cs-card">
            <p className="cs-section-title">Funding Goal & Returns</p>
            <p className="cs-section-sub">Set what you need and what you're offering investors in return.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label className="cs-label">Funding Goal ($)</label>
                <input
                  type="number" min="0"
                  value={form.fundingGoal}
                  onChange={(e) => set("fundingGoal", e.target.value)}
                  placeholder="2000"
                  className={`cs-field ${errors.fundingGoal ? "error" : ""}`}
                />
                {errors.fundingGoal && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.fundingGoal}</p>}
              </div>
              <div>
                <label className="cs-label">Projected Monthly Income ($)</label>
                <input
                  type="number" min="0"
                  value={form.projectedMonthlyIncome}
                  onChange={(e) => set("projectedMonthlyIncome", e.target.value)}
                  placeholder="800"
                  className={`cs-field ${errors.projectedMonthlyIncome ? "error" : ""}`}
                />
                {errors.projectedMonthlyIncome && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.projectedMonthlyIncome}</p>}
              </div>
              <div>
                <label className="cs-label">Profit Share Offered (%)</label>
                <input
                  type="number" min="1" max="50"
                  value={form.profitSharePercentage}
                  onChange={(e) => set("profitSharePercentage", e.target.value)}
                  placeholder="20"
                  className={`cs-field ${errors.profitSharePercentage ? "error" : ""}`}
                />
                {errors.profitSharePercentage && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.profitSharePercentage}</p>}
              </div>
              <div>
                <label className="cs-label">Duration (months)</label>
                <input
                  type="number" min="1"
                  value={form.profitShareDuration}
                  onChange={(e) => set("profitShareDuration", e.target.value)}
                  placeholder="12"
                  className={`cs-field ${errors.profitShareDuration ? "error" : ""}`}
                />
                {errors.profitShareDuration && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.profitShareDuration}</p>}
              </div>
            </div>

            {/* Accepting toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", padding: "14px 16px", background: _input, border: `1px solid ${_cardBorder}`, borderRadius: "13px" }}>
              <div>
                <p style={{ color: _text, fontWeight: 700, fontSize: "14px", margin: "0 0 2px", fontFamily: "'Inter', sans-serif" }}>
                  Open to Investment
                </p>
                <p style={{ color: _dim, fontSize: "12px", margin: 0, fontFamily: "'Inter', sans-serif" }}>
                  Allow investors to send you proposals immediately on launch
                </p>
              </div>
              <button
                onClick={() => set("isAcceptingInvestments", !form.isAcceptingInvestments)}
                className="cs-toggle"
                style={{ background: form.isAcceptingInvestments ? "#22c55e" : "rgba(255,255,255,0.15)" }}
              >
                <div className="cs-toggle-thumb" style={{ left: form.isAcceptingInvestments ? "23px" : "3px" }} />
              </button>
            </div>
          </div>

          {/* Live ROI preview */}
          {form.fundingGoal && form.profitSharePercentage && form.projectedMonthlyIncome && form.profitShareDuration && (
            <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.18)", borderRadius: "18px", padding: "18px 22px" }}>
              <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".08em", marginBottom: "12px" }}>
                INVESTOR SEES THIS ON YOUR CAMPAIGN PAGE
              </p>
              <div className="cs-preview-row">
                <span className="cs-preview-label">Funding goal</span>
                <span className="cs-preview-val">{fmt$(form.fundingGoal)}</span>
              </div>
              <div className="cs-preview-row">
                <span className="cs-preview-label">Profit share</span>
                <span className="cs-preview-val" style={{ color: "#22c55e" }}>{form.profitSharePercentage}%</span>
              </div>
              <div className="cs-preview-row">
                <span className="cs-preview-label">Duration</span>
                <span className="cs-preview-val">{form.profitShareDuration} months</span>
              </div>
              <div className="cs-preview-row">
                <span className="cs-preview-label">Monthly return (per $1 invested)</span>
                <span className="cs-preview-val" style={{ color: "#22c55e" }}>
                  {fmt$(Math.round(Number(form.projectedMonthlyIncome) * Number(form.profitSharePercentage) / 100))} / mo
                </span>
              </div>
              {projReturn && (
                <div className="cs-preview-row">
                  <span className="cs-preview-label">Total projected return</span>
                  <span className="cs-preview-val" style={{ color: "#4ade80", fontFamily: "'Inter', sans-serif", fontSize: "1.1rem" }}>
                    {fmt$(projReturn)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 3 — MILESTONES
      ══════════════════════════════════════════════════════════════ */}
      {currentStep.id === "milestones" && (
        <div className="space-y-5">
          <div className="cs-card">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "6px" }}>
              <div>
                <p className="cs-section-title">Funding Milestones</p>
                <p className="cs-section-sub">Break your funding goal into stages. Each milestone must be completed with proof before the next tranche is released.</p>
              </div>
              {form.fundingGoal > 0 && form.milestones.length === 0 && (
                <button onClick={autoSplitMilestones} className="cs-btn-ghost" style={{ flexShrink: 0, fontSize: "12px", padding: "8px 14px" }}>
                  Auto-split
                </button>
              )}
            </div>

            {/* Goal vs milestone total indicator */}
            {form.fundingGoal > 0 && form.milestones.length > 0 && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: "11px", marginBottom: "16px",
                background: Math.abs(milestoneGap) < 1 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
                border: `1px solid ${Math.abs(milestoneGap) < 1 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.25)"}`,
              }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: Math.abs(milestoneGap) < 1 ? "#22c55e" : "#f87171" }}>
                  {Math.abs(milestoneGap) < 1
                    ? "✓ Milestones match funding goal"
                    : milestoneGap > 0
                    ? `${fmt$(milestoneGap)} still unallocated`
                    : `${fmt$(Math.abs(milestoneGap))} over goal`}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "14px", color: _text }}>
                  {fmt$(milestoneTotal)} / {fmt$(form.fundingGoal)}
                </span>
              </div>
            )}

            {errors.milestones && (
              <p className="cs-err" style={{ marginBottom: "12px" }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "11px" }} /> {errors.milestones}
              </p>
            )}
            {errors.milestones_total && (
              <p className="cs-err" style={{ marginBottom: "12px" }}>
                <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "11px" }} /> {errors.milestones_total}
              </p>
            )}

            {/* Milestone cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" }}>
              {form.milestones.map((m, i) => {
                const hasTitleErr  = errors[`m_title_${i}`];
                const hasAmountErr = errors[`m_amount_${i}`];
                return (
                  <div key={i} className={`cs-ms-card ${hasTitleErr || hasAmountErr ? "has-error" : ""}`}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "13px", color: "#22c55e" }}>
                        Milestone {i + 1}
                      </span>
                      <button
                        onClick={() => removeMilestone(i)}
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", color: "#f87171" }}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: "11px" }} />
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <label className="cs-label">Title</label>
                        <input
                          type="text"
                          value={m.title}
                          onChange={(e) => updateMilestone(i, "title", e.target.value)}
                          placeholder="e.g. Buy industrial sewing machine"
                          className={`cs-field ${hasTitleErr ? "error" : ""}`}
                        />
                        {hasTitleErr && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {hasTitleErr}</p>}
                      </div>
                      <div>
                        <label className="cs-label">Amount ($)</label>
                        <input
                          type="number" min="0"
                          value={m.amount}
                          onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                          placeholder="600"
                          className={`cs-field ${hasAmountErr ? "error" : ""}`}
                        />
                        {hasAmountErr && <p className="cs-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {hasAmountErr}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="cs-label">Description <span style={{ color: "#4a5568", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                      <input
                        type="text"
                        value={m.description}
                        onChange={(e) => updateMilestone(i, "description", e.target.value)}
                        placeholder="What will you use this tranche for?"
                        className="cs-field"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={addMilestone} className="cs-btn-ghost" style={{ width: "100%" }}>
              <FontAwesomeIcon icon={faPlus} style={{ fontSize: "12px" }} /> Add Milestone
            </button>
          </div>

          {/* How milestones work */}
          <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "16px", padding: "16px 18px" }}>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", marginBottom: "10px", letterSpacing: ".06em" }}>
              HOW MILESTONES WORK
            </p>
            {[
              "Each milestone is locked until the previous one is approved",
              "You submit proof (photos, receipts, videos) to unlock each milestone",
              "Investors have 72 hours to approve or dispute your proof",
              "No proof = no payment — this protects both you and your investors",
            ].map((tip) => (
              <p key={tip} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginBottom: "4px" }}>
                · {tip}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 4 — MEDIA
      ══════════════════════════════════════════════════════════════ */}
      {currentStep.id === "media" && (
        <div className="space-y-5">
          {/* Portfolio */}
          <div className="cs-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <div>
                <p className="cs-section-title">Portfolio</p>
                <p className="cs-section-sub">
                  Show investors your real work. {profile?.portfolio?.length || 0}/{typeof portfolioLimit === "number" ? portfolioLimit : "∞"} items used · {user?.plan} plan
                </p>
              </div>
              <button
                onClick={() => portfolioInputRef.current?.click()}
                disabled={portfolioUploading || (typeof portfolioLimit === "number" && (profile?.portfolio?.length || 0) >= portfolioLimit)}
                className="cs-btn-green"
                style={{ padding: "9px 16px", fontSize: "12px" }}
              >
                <FontAwesomeIcon icon={portfolioUploading ? faCircleNotch : faPlus} spin={portfolioUploading} style={{ fontSize: "11px" }} />
                {portfolioUploading ? "Uploading..." : "Add Photo"}
              </button>
              <input ref={portfolioInputRef} type="file" accept="image/*" onChange={handlePortfolioUpload} style={{ display: "none" }} />
            </div>

            {!profile?.portfolio?.length ? (
              <div
                onClick={() => portfolioInputRef.current?.click()}
                style={{ border: `2px dashed ${_cardBorder}`, borderRadius: "14px", padding: "48px 20px", textAlign: "center", cursor: "pointer", transition: ".15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = _cardBorder)}
              >
                <FontAwesomeIcon icon={faImages} style={{ fontSize: "32px", color: "#2d4a31", marginBottom: "12px" }} />
                <p style={{ color: _dim, fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>Click to upload your first portfolio item</p>
                <p style={{ color: "#4a5568", fontSize: "11px", fontFamily: "'Inter', sans-serif", marginTop: "4px" }}>JPG, PNG up to 10MB</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "10px" }}>
                {profile.portfolio.map((item) => (
                  <div key={item._id} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "1", background: _input, border: `1px solid ${_cardBorder}` }} className="group">
                    <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div
                      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: ".2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = 0)}
                    >
                      <button
                        onClick={() => handlePortfolioDelete(item._id)}
                        style={{ background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "8px", padding: "6px 12px", color: _text, fontSize: "11px", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", gap: "5px" }}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: "10px" }} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {user?.plan !== "elite" && (
              <div style={{ marginTop: "14px", padding: "10px 14px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ color: _dim, fontSize: "12px", fontFamily: "'Inter', sans-serif" }}>
                  <FontAwesomeIcon icon={faLock} style={{ color: "#22c55e", marginRight: "6px", fontSize: "11px" }} />
                  Upgrade to <strong style={{ color: "#22c55e" }}>Pro</strong> or <strong style={{ color: "#22c55e" }}>Elite</strong> for more portfolio slots
                </span>
                <a href="/settings?tab=subscription" style={{ color: "#22c55e", fontSize: "12px", fontWeight: 700, fontFamily: "'Inter', sans-serif", textDecoration: "none" }}>
                  Upgrade →
                </a>
              </div>
            )}
          </div>

          {/* Pitch video */}
          <div className="cs-card">
            <p className="cs-section-title">Pitch Video <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#4a5568", marginLeft: "8px" }}>Optional</span></p>
            <p className="cs-section-sub">A short 30–90 second video showing your skill dramatically increases investor trust.</p>

            {form.pitchVideoUrl ? (
              <div>
                <video src={form.pitchVideoUrl} controls style={{ width: "100%", borderRadius: "14px", background: _input, marginBottom: "12px", maxHeight: "240px" }} />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => videoInputRef.current?.click()} className="cs-btn-ghost" style={{ flex: 1, fontSize: "12px" }}>
                    <FontAwesomeIcon icon={faVideo} style={{ fontSize: "11px" }} /> Replace Video
                  </button>
                  <button onClick={() => set("pitchVideoUrl", "")} className="cs-btn-ghost" style={{ fontSize: "12px" }}>
                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: "11px" }} />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => videoInputRef.current?.click()}
                style={{ border: `2px dashed ${_cardBorder}`, borderRadius: "14px", padding: "48px 20px", textAlign: "center", cursor: "pointer", transition: ".15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = _cardBorder)}
              >
                {videoUploading ? (
                  <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "28px", color: "#22c55e", marginBottom: "10px" }} />
                ) : (
                  <FontAwesomeIcon icon={faVideo} style={{ fontSize: "28px", color: "#2d4a31", marginBottom: "10px" }} />
                )}
                <p style={{ color: _dim, fontSize: "13px", fontFamily: "'Inter', sans-serif" }}>
                  {videoUploading ? "Uploading video..." : "Click to upload your pitch video"}
                </p>
                <p style={{ color: "#4a5568", fontSize: "11px", fontFamily: "'Inter', sans-serif", marginTop: "4px" }}>MP4 recommended · Max 100MB</p>
              </div>
            )}
            <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: "none" }} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          STEP 5 — REVIEW & GO LIVE
      ══════════════════════════════════════════════════════════════ */}
      {currentStep.id === "review" && (
        <div className="space-y-5">

          {/* Campaign preview summary */}
          <div className="cs-card">
            <p className="cs-section-title">Campaign Summary</p>
            <p className="cs-section-sub">This is what investors will see on your public campaign page.</p>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", padding: "14px", background: _input, borderRadius: "14px", border: `1px solid ${_cardBorder}` }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.1rem", color: _text, margin: "0 0 2px" }}>{user?.name}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: "#22c55e", margin: 0 }}>
                  {form.skill || "—"} · {form.location || "—"}
                </p>
              </div>
            </div>

            <div style={{ background: _input, borderRadius: "14px", padding: "14px 16px", marginBottom: "14px" }}>
              <div className="cs-preview-row"><span className="cs-preview-label">Funding Goal</span><span className="cs-preview-val">{fmt$(form.fundingGoal)}</span></div>
              <div className="cs-preview-row"><span className="cs-preview-label">Profit Share</span><span className="cs-preview-val" style={{ color: "#22c55e" }}>{form.profitSharePercentage}%</span></div>
              <div className="cs-preview-row"><span className="cs-preview-label">Duration</span><span className="cs-preview-val">{form.profitShareDuration} months</span></div>
              <div className="cs-preview-row"><span className="cs-preview-label">Monthly Return</span><span className="cs-preview-val" style={{ color: "#22c55e" }}>{fmt$(Math.round(Number(form.projectedMonthlyIncome) * Number(form.profitSharePercentage) / 100))} / mo</span></div>
              {projReturn && <div className="cs-preview-row"><span className="cs-preview-label">Total Projected Return</span><span className="cs-preview-val" style={{ color: "#4ade80" }}>{fmt$(projReturn)}</span></div>}
              <div className="cs-preview-row"><span className="cs-preview-label">Milestones</span><span className="cs-preview-val">{form.milestones.length} checkpoints</span></div>
              <div className="cs-preview-row"><span className="cs-preview-label">Portfolio Items</span><span className="cs-preview-val">{profile?.portfolio?.length || 0}</span></div>
              <div className="cs-preview-row"><span className="cs-preview-label">Pitch Video</span><span className="cs-preview-val">{form.pitchVideoUrl ? "✓ Uploaded" : "—"}</span></div>
            </div>

            {/* Checklist */}
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: _muted, letterSpacing: ".06em", marginBottom: "10px" }}>CAMPAIGN CHECKLIST</p>
            {[
              { label: "Skill and category set",       done: !!form.skill },
              { label: "Bio written (40+ chars)",       done: form.bio.length >= 40 },
              { label: "Funding purpose explained",     done: form.fundingPurpose.length >= 60 },
              { label: "Funding goal entered",          done: Number(form.fundingGoal) > 0 },
              { label: "Profit share configured",       done: Number(form.profitSharePercentage) > 0 },
              { label: "At least one milestone added",  done: form.milestones.length > 0 },
              { label: "Milestone totals match goal",   done: form.milestones.length > 0 && Math.abs(milestoneGap) < 1 },
              { label: "Portfolio item uploaded",       done: (profile?.portfolio?.length || 0) > 0 },
              { label: "Pitch video added",             done: !!form.pitchVideoUrl },
            ].map((item) => (
              <div key={item.label} className="cs-checklist-item">
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: item.done ? "rgba(34,197,94,0.15)" : _input, border: `1px solid ${item.done ? "rgba(34,197,94,0.3)" : _cardBorder}` }}>
                  {item.done && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "10px", color: "#22c55e" }} />}
                </div>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: item.done ? "#9ca3af" : "#6b7280", textDecoration: item.done ? "none" : "none" }}>
                  {item.label}
                </span>
                {!item.done && (
                  <span style={{ marginLeft: "auto", fontFamily: "'Inter', sans-serif", fontSize: "10px", fontWeight: 700, color: "#f59e0b" }}>
                    Optional
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Launch actions */}
          <div className="cs-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => handleSave(true)} disabled={saving} className="cs-btn-green" style={{ fontSize: "14px", padding: "14px" }}>
              <FontAwesomeIcon icon={saving ? faCircleNotch : faRocket} spin={saving} />
              {saving ? "Publishing..." : "Go Live — Publish Campaign"}
            </button>
            <button onClick={() => handleSave(false)} disabled={saving} className="cs-btn-ghost">
              <FontAwesomeIcon icon={faFloppyDisk} style={{ fontSize: "12px" }} />
              Save as Draft
            </button>
            <button onClick={() => navigate(`/campaign/${user?._id || user?.id}`)} className="cs-btn-ghost">
              <FontAwesomeIcon icon={faEye} style={{ fontSize: "12px" }} />
              Preview Campaign Page
            </button>
          </div>
        </div>
      )}

      {/* ── Step navigation ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px" }}>
        <button onClick={goBack} disabled={stepIdx === 0} className="cs-btn-ghost" style={{ opacity: stepIdx === 0 ? 0.3 : 1, pointerEvents: stepIdx === 0 ? "none" : "auto" }}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "12px" }} /> Back
        </button>

        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: 700, color: "#4a5568" }}>
          {stepIdx + 1} of {STEPS.length}
        </span>

        {stepIdx < STEPS.length - 1 ? (
          <button onClick={goNext} className="cs-btn-green">
            Next <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "12px" }} />
          </button>
        ) : (
          <div style={{ width: "90px" }} />
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SetupSkeleton() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  return (
    <div className="space-y-5 animate-pulse">
      <div style={{ height: "60px", background: _card, borderRadius: "16px", border: `1px solid ${_cardBorder}` }} />
      <div style={{ height: "90px", background: _card, borderRadius: "20px", border: `1px solid ${_cardBorder}` }} />
      <div style={{ height: "360px", background: _card, borderRadius: "20px", border: `1px solid ${_cardBorder}` }} />
    </div>
  );
}
