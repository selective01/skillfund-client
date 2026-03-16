import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faPlus,
  faTrash,
  faFloppyDisk,
  faCircleNotch,
  faUser,
  faImages,
  faShareNodes,
  faLocationDot,
  faArrowTrendUp,
  faWallet,
  faCircleCheck,
  faChevronDown,
  faLock,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faXTwitter, faLinkedin } from "@fortawesome/free-brands-svg-icons";

import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

const SKILL_CATEGORIES = [
  { value: "fashion",     label: "Fashion & Tailoring" },
  { value: "carpentry",   label: "Carpentry & Woodwork" },
  { value: "farming",     label: "Farming & Agriculture" },
  { value: "photography", label: "Photography & Video" },
  { value: "baking",      label: "Baking & Pastry" },
  { value: "mechanics",   label: "Mechanics & Auto" },
  { value: "technology",  label: "Technology & IT" },
  { value: "hair",        label: "Hair & Beauty" },
  { value: "artisan",     label: "Artisan & Crafts" },
  { value: "other",       label: "Other" },
];

const INDUSTRIES = [
  "fashion", "carpentry", "farming", "photography",
  "baking", "mechanics", "technology", "hair", "artisan", "other",
];

const PORTFOLIO_LIMITS = { basic: 2, starter: 5, pro: 20, elite: "∞" };

const TABS = [
  { id: "profile",   label: "Profile",    icon: faUser },
  { id: "portfolio", label: "Portfolio",  icon: faImages },
  { id: "social",    label: "Social",     icon: faShareNodes },
];

export default function Profile() {
  useNotificationReadOnView();
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const portfolioInputRef = useRef(null);

  const isCreator = user?.role === "creator";
  const portfolioLimit = PORTFOLIO_LIMITS[user?.plan] || 2;

  // ─── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    bio: "", location: "",
    // creator
    skill: "", skillCategory: "other",
    fundingGoal: "", fundingPurpose: "",
    projectedMonthlyIncome: "", profitSharePercentage: "",
    profitShareDuration: "", isAcceptingInvestments: true,
    // investor
    investmentBudget: "", preferredROI: "",
    riskTolerance: "medium", preferredDuration: "",
    industriesOfInterest: [],
    // social
    socialLinks: { instagram: "", twitter: "", linkedin: "", website: "" },
  });

  // ─── Load profile ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/profiles/me");
        const p = res.data.profile;
        setProfile(p);
        setForm({
          bio: p.bio || "",
          location: p.location || "",
          skill: p.skill || "",
          skillCategory: p.skillCategory || "other",
          fundingGoal: p.fundingGoal || "",
          fundingPurpose: p.fundingPurpose || "",
          projectedMonthlyIncome: p.projectedMonthlyIncome || "",
          profitSharePercentage: p.profitSharePercentage || "",
          profitShareDuration: p.profitShareDuration || "",
          isAcceptingInvestments: p.isAcceptingInvestments ?? true,
          investmentBudget: p.investmentBudget || "",
          preferredROI: p.preferredROI || "",
          riskTolerance: p.riskTolerance || "medium",
          preferredDuration: p.preferredDuration || "",
          industriesOfInterest: p.industriesOfInterest || [],
          socialLinks: {
            instagram: p.socialLinks?.instagram || "",
            twitter: p.socialLinks?.twitter || "",
            linkedin: p.socialLinks?.linkedin || "",
            website: p.socialLinks?.website || "",
          },
        });
      } catch {
        // Profile may not exist yet — that's fine
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Save profile ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        bio: form.bio,
        location: form.location,
        socialLinks: form.socialLinks,
        ...(isCreator ? {
          skill: form.skill,
          skillCategory: form.skillCategory,
          fundingGoal: parseFloat(form.fundingGoal) || 0,
          fundingPurpose: form.fundingPurpose,
          projectedMonthlyIncome: parseFloat(form.projectedMonthlyIncome) || 0,
          profitSharePercentage: parseFloat(form.profitSharePercentage) || 0,
          profitShareDuration: parseInt(form.profitShareDuration) || 0,
          isAcceptingInvestments: form.isAcceptingInvestments,
        } : {
          investmentBudget: parseFloat(form.investmentBudget) || 0,
          preferredROI: parseFloat(form.preferredROI) || 0,
          riskTolerance: form.riskTolerance,
          preferredDuration: parseInt(form.preferredDuration) || 0,
          industriesOfInterest: form.industriesOfInterest,
        }),
      };
      await api.put("/profiles/me", payload);
      toast.success("Profile saved!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // ─── Avatar upload ────────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const data = new FormData();
      data.append("avatar", file);
      const res = await api.put("/profiles/avatar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newAvatar = res.data.avatar;
      setProfile((p) => ({ ...p, avatar: newAvatar }));
      updateUser({ avatar: newAvatar });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  // ─── Portfolio upload ─────────────────────────────────────────────────────
  const handlePortfolioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const currentCount = profile?.portfolio?.length || 0;
    if (typeof portfolioLimit === "number" && currentCount >= portfolioLimit) {
      toast.error(`Your ${user?.plan} plan allows max ${portfolioLimit} portfolio items. Upgrade to add more.`);
      return;
    }
    setPortfolioUploading(true);
    try {
      const data = new FormData();
      data.append("image", file);
      data.append("title", file.name.replace(/\.[^.]+$/, ""));
      data.append("description", "");
      const res = await api.post("/profiles/portfolio", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p) => ({ ...p, portfolio: res.data.portfolio }));
      toast.success("Portfolio item added!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    } finally {
      setPortfolioUploading(false);
    }
  };

  // ─── Portfolio delete ─────────────────────────────────────────────────────
  const handlePortfolioDelete = async (itemId) => {
    try {
      const res = await api.delete(`/profiles/portfolio/${itemId}`);
      setProfile((p) => ({ ...p, portfolio: res.data.portfolio }));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  // ─── Industry toggle ──────────────────────────────────────────────────────
  const toggleIndustry = (ind) => {
    setForm((p) => ({
      ...p,
      industriesOfInterest: p.industriesOfInterest.includes(ind)
        ? p.industriesOfInterest.filter((i) => i !== ind)
        : [...p.industriesOfInterest, ind],
    }));
  };

  const avatar = profile?.avatar || user?.avatar;
  const avatarInitial = (user?.name || "U").charAt(0).toUpperCase();

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="space-y-6">
      <style>{`
        .sf-field { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:12px; padding:10px 14px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .sf-field::placeholder { color:#5a8a63; }
        .sf-field:focus { border-color:rgba(34,197,94,0.35); }
        .sf-select { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:12px; padding:10px 36px 10px 14px; font-size:14px; outline:none; width:100%; font-family:'DM Sans',sans-serif; appearance:none; cursor:pointer; transition:border-color .2s; }
        .sf-select:focus { border-color:rgba(34,197,94,0.35); }
        .sf-select option { background:#070d08; }
        .sf-label { display:block; font-size:11px; font-weight:700; font-family:'Syne',sans-serif; text-transform:uppercase; letter-spacing:.05em; color:#9ca3af; margin-bottom:5px; }
        .sf-ind-pill { padding:5px 12px; border-radius:999px; font-size:12px; font-weight:700; cursor:pointer; transition:all .15s; border:1px solid rgba(255,255,255,0.1); background:#0a1209; color:#9ca3af; font-family:'Syne',sans-serif; white-space:nowrap; }
        .sf-ind-pill.active { background:rgba(34,197,94,0.12); border-color:rgba(34,197,94,0.35); color:#22c55e; }
        .sf-ind-pill:hover:not(.active) { border-color:rgba(34,197,94,0.2); color:#9ca3af; }
        .sf-tab { padding:8px 18px; border-radius:10px; font-size:13px; font-weight:700; font-family:'Syne',sans-serif; cursor:pointer; transition:all .15s; border:none; display:flex; align-items:center; gap:7px; }
        .sf-tab.active { background:rgba(34,197,94,0.12); color:#22c55e; border:1px solid rgba(34,197,94,0.25); }
        .sf-tab:not(.active) { background:transparent; color:#9ca3af; border:1px solid transparent; }
        .sf-tab:not(.active):hover { color:#9ca3af; background:rgba(255,255,255,0.03); }
        .sf-toggle { position:relative; width:44px; height:24px; border-radius:12px; border:none; cursor:pointer; transition:background .2s; flex-shrink:0; }
        .sf-toggle-thumb { position:absolute; top:3px; width:18px; height:18px; border-radius:9px; background:#fff; transition:left .2s; }
      `}</style>

      {/* ── Header card ── */}
      <div style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px", padding: "20px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
        {/* Avatar */}
        <div className="relative" style={{ flexShrink: 0 }}>
          <div
            onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "28px", color: "#000", overflow: "hidden", border: "3px solid rgba(34,197,94,0.3)", cursor: "pointer", position: "relative" }}
          >
            {avatar ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : avatarInitial}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity .2s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <FontAwesomeIcon icon={avatarUploading ? faCircleNotch : faCamera} spin={avatarUploading} style={{ color: "#fff", fontSize: "18px" }} />
            </div>
          </div>
          {/* Camera button overlay */}
          <button
            onClick={() => !avatarUploading && avatarInputRef.current?.click()}
            style={{ position: "absolute", bottom: "-4px", right: "-4px", width: "26px", height: "26px", borderRadius: "8px", background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "2px solid #040806", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <FontAwesomeIcon icon={avatarUploading ? faCircleNotch : faCamera} spin={avatarUploading} style={{ color: "#000", fontSize: "10px" }} />
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: "160px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <h2 className="text-white font-black" style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", margin: 0 }}>
              {user?.name}
            </h2>
            {user?.isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ color: "#22c55e", fontSize: "15px" }} />}
          </div>
          <p style={{ color: "#9ca3af", fontSize: "13px", margin: "0 0 8px", fontFamily: "'DM Sans', sans-serif" }}>
            {user?.email}
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e", fontFamily: "'Syne', sans-serif", textTransform: "capitalize" }}>
              {user?.role}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: "#0a1209", border: "1px solid rgba(255,255,255,0.2)", color: "#9ca3af", fontFamily: "'Syne', sans-serif", textTransform: "capitalize" }}>
              {user?.plan} Plan
            </span>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none", borderRadius: "12px", padding: "10px 20px", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", flexShrink: 0, width: "100%", maxWidth: "200px", opacity: saving ? 0.7 : 1 }}
        >
          <FontAwesomeIcon icon={saving ? faCircleNotch : faFloppyDisk} spin={saving} style={{ fontSize: "13px" }} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "6px" }}>
        {TABS.map((tab) => {
          // Hide portfolio tab for investors
          if (tab.id === "portfolio" && !isCreator) return null;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`sf-tab ${activeTab === tab.id ? "active" : ""}`}
            >
              <FontAwesomeIcon icon={tab.icon} style={{ fontSize: "12px" }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px", padding: "24px" }}>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Basic info */}
            <Section title="Basic Information">
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <label className="sf-label">Bio</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Tell investors about yourself and your work..."
                    rows={4}
                    className="sf-field"
                    style={{ resize: "vertical" }}
                  />
                </div>
                <div>
                  <label className="sf-label">
                    <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: "5px" }} />
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    placeholder="e.g. Lagos, Nigeria"
                    className="sf-field"
                  />
                </div>
              </div>
            </Section>

            {/* Creator fields */}
            {isCreator && (
              <>
                <Section title="Skill & Expertise">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label className="sf-label">Skill / Trade</label>
                      <input
                        type="text"
                        value={form.skill}
                        onChange={(e) => setForm((p) => ({ ...p, skill: e.target.value }))}
                        placeholder="e.g. Tailoring, Photography..."
                        className="sf-field"
                      />
                    </div>
                    <div>
                      <label className="sf-label">Category</label>
                      <div className="relative">
                        <select value={form.skillCategory} onChange={(e) => setForm((p) => ({ ...p, skillCategory: e.target.value }))} className="sf-select">
                          {SKILL_CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "11px", pointerEvents: "none" }} />
                      </div>
                    </div>
                  </div>
                </Section>

                <Section title={<><FontAwesomeIcon icon={faArrowTrendUp} style={{ color: "#22c55e", marginRight: "6px" }} />Investment Terms</>}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label className="sf-label">Funding Goal ($)</label>
                      <input type="number" value={form.fundingGoal} onChange={(e) => setForm((p) => ({ ...p, fundingGoal: e.target.value }))} placeholder="5000" className="sf-field" />
                    </div>
                    <div>
                      <label className="sf-label">Projected Monthly Income ($)</label>
                      <input type="number" value={form.projectedMonthlyIncome} onChange={(e) => setForm((p) => ({ ...p, projectedMonthlyIncome: e.target.value }))} placeholder="1500" className="sf-field" />
                    </div>
                    <div>
                      <label className="sf-label">Profit Share Offered (%)</label>
                      <input type="number" value={form.profitSharePercentage} onChange={(e) => setForm((p) => ({ ...p, profitSharePercentage: e.target.value }))} placeholder="20" min="1" max="50" className="sf-field" />
                    </div>
                    <div>
                      <label className="sf-label">Profit Share Duration (months)</label>
                      <input type="number" value={form.profitShareDuration} onChange={(e) => setForm((p) => ({ ...p, profitShareDuration: e.target.value }))} placeholder="12" className="sf-field" />
                    </div>
                    <div style={{ gridColumn: "1/-1" }}>
                      <label className="sf-label">Funding Purpose</label>
                      <textarea value={form.fundingPurpose} onChange={(e) => setForm((p) => ({ ...p, fundingPurpose: e.target.value }))} placeholder="What will you use the investment for?" rows={3} className="sf-field" style={{ resize: "vertical" }} />
                    </div>
                  </div>

                  {/* Accepting investments toggle */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", padding: "14px", background: "#0a1209", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px" }}>
                    <div>
                      <p style={{ color: "#fff", fontWeight: 700, fontSize: "14px", margin: "0 0 2px", fontFamily: "'Syne', sans-serif" }}>Accepting Investments</p>
                      <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>Allow investors to send you proposals</p>
                    </div>
                    <button
                      onClick={() => setForm((p) => ({ ...p, isAcceptingInvestments: !p.isAcceptingInvestments }))}
                      className="sf-toggle"
                      style={{ background: form.isAcceptingInvestments ? "#22c55e" : "rgba(255,255,255,0.2)" }}
                    >
                      <div className="sf-toggle-thumb" style={{ left: form.isAcceptingInvestments ? "23px" : "3px" }} />
                    </button>
                  </div>
                </Section>
              </>
            )}

            {/* Investor fields */}
            {!isCreator && (
              <Section title={<><FontAwesomeIcon icon={faWallet} style={{ color: "#22c55e", marginRight: "6px" }} />Investment Preferences</>}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label className="sf-label">Investment Budget ($)</label>
                    <input type="number" value={form.investmentBudget} onChange={(e) => setForm((p) => ({ ...p, investmentBudget: e.target.value }))} placeholder="10000" className="sf-field" />
                  </div>
                  <div>
                    <label className="sf-label">Preferred ROI (%)</label>
                    <input type="number" value={form.preferredROI} onChange={(e) => setForm((p) => ({ ...p, preferredROI: e.target.value }))} placeholder="15" className="sf-field" />
                  </div>
                  <div>
                    <label className="sf-label">Risk Tolerance</label>
                    <div className="relative">
                      <select value={form.riskTolerance} onChange={(e) => setForm((p) => ({ ...p, riskTolerance: e.target.value }))} className="sf-select">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                      <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "11px", pointerEvents: "none" }} />
                    </div>
                  </div>
                  <div>
                    <label className="sf-label">Preferred Duration (months)</label>
                    <input type="number" value={form.preferredDuration} onChange={(e) => setForm((p) => ({ ...p, preferredDuration: e.target.value }))} placeholder="12" className="sf-field" />
                  </div>
                </div>

                <div style={{ marginTop: "14px" }}>
                  <label className="sf-label" style={{ marginBottom: "8px" }}>Industries of Interest</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => toggleIndustry(ind)}
                        className={`sf-ind-pill ${form.industriesOfInterest.includes(ind) ? "active" : ""}`}
                      >
                        {ind.charAt(0).toUpperCase() + ind.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>
            )}
          </div>
        )}

        {/* Portfolio Tab (creators only) */}
        {activeTab === "portfolio" && isCreator && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h3 style={{ color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "16px", margin: "0 0 4px" }}>Portfolio</h3>
                <p style={{ color: "#9ca3af", fontSize: "13px", margin: 0 }}>
                  {profile?.portfolio?.length || 0} / {portfolioLimit} items · {user?.plan} plan
                </p>
              </div>
              <button
                onClick={() => portfolioInputRef.current?.click()}
                disabled={portfolioUploading || (typeof portfolioLimit === "number" && (profile?.portfolio?.length || 0) >= portfolioLimit)}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "11px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "13px", cursor: "pointer", opacity: portfolioUploading ? 0.7 : 1 }}
              >
                <FontAwesomeIcon icon={portfolioUploading ? faCircleNotch : faPlus} spin={portfolioUploading} style={{ fontSize: "12px" }} />
                {portfolioUploading ? "Uploading..." : "Add Item"}
              </button>
              <input ref={portfolioInputRef} type="file" accept="image/*" onChange={handlePortfolioUpload} style={{ display: "none" }} />
            </div>

            {!profile?.portfolio?.length ? (
              <div style={{ textAlign: "center", padding: "60px 20px", border: "2px dashed rgba(255,255,255,0.2)", borderRadius: "16px" }}>
                <FontAwesomeIcon icon={faImages} style={{ color: "#5a8a63", fontSize: "36px", marginBottom: "12px" }} />
                <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "16px" }}>No portfolio items yet</p>
                <button
                  onClick={() => portfolioInputRef.current?.click()}
                  style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e", borderRadius: "10px", padding: "8px 20px", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  Upload first item
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px" }}>
                {profile.portfolio.map((item) => (
                  <div key={item._id} style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)", background: "#0a1209", aspectRatio: "1" }} className="group">
                    <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.8) 0%,transparent 50%)", opacity: 0, transition: "opacity .2s", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "12px" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0}
                    >
                      <p style={{ color: "#fff", fontSize: "12px", fontWeight: 700, margin: "0 0 6px", fontFamily: "'Syne', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
                      <button
                        onClick={() => handlePortfolioDelete(item._id)}
                        style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(239,68,68,0.85)", border: "none", borderRadius: "7px", padding: "5px 10px", color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer", width: "fit-content", fontFamily: "'Syne', sans-serif" }}
                      >
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: "10px" }} /> Remove
                      </button>
                    </div>
                  </div>
                ))}

                {/* Locked slots */}
                {typeof portfolioLimit === "number" &&
                  Array.from({ length: Math.max(0, portfolioLimit - (profile.portfolio.length || 0)) }).map((_, i) => (
                    <div key={`slot-${i}`} style={{ borderRadius: "14px", border: "2px dashed rgba(255,255,255,0.2)", aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <FontAwesomeIcon icon={faPlus} style={{ color: "#5a8a63", fontSize: "18px" }} />
                      <span style={{ color: "#5a8a63", fontSize: "11px", fontFamily: "'Syne', sans-serif" }}>Empty slot</span>
                    </div>
                  ))
                }
              </div>
            )}

            {/* Plan upgrade prompt */}
            {user?.plan !== "elite" && (
              <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.30)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FontAwesomeIcon icon={faLock} style={{ color: "#22c55e", fontSize: "13px" }} />
                  <span style={{ color: "#9ca3af", fontSize: "13px", fontFamily: "'DM Sans', sans-serif" }}>
                    Upgrade to <strong style={{ color: "#22c55e" }}>Pro</strong> or <strong style={{ color: "#22c55e" }}>Elite</strong> for more portfolio items
                  </span>
                </div>
                <a href="/settings?tab=subscription" style={{ color: "#22c55e", fontSize: "12px", fontWeight: 700, fontFamily: "'Syne', sans-serif", textDecoration: "none" }}>
                  Upgrade →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Social Tab */}
        {activeTab === "social" && (
          <div>
            <h3 style={{ color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: "16px", margin: "0 0 20px" }}>Social Links</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { key: "instagram", label: "Instagram",   icon: faInstagram, placeholder: "https://instagram.com/yourhandle", color: "#e1306c" },
                { key: "twitter",   label: "X (Twitter)", icon: faXTwitter,  placeholder: "https://x.com/yourhandle",         color: "#9ca3af" },
                { key: "linkedin",  label: "LinkedIn",    icon: faLinkedin,  placeholder: "https://linkedin.com/in/yourname", color: "#0a66c2" },
                { key: "website",   label: "Website",     icon: faGlobe,     placeholder: "https://yourwebsite.com",          color: "#22c55e" },
              ].map(({ key, label, icon, placeholder, color }) => (
                <div key={key}>
                  <label className="sf-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FontAwesomeIcon icon={icon} style={{ color, fontSize: "13px" }} />
                    {label}
                  </label>
                  <input
                    type="url"
                    value={form.socialLinks[key]}
                    onChange={(e) => setForm((p) => ({ ...p, socialLinks: { ...p.socialLinks, [key]: e.target.value } }))}
                    placeholder={placeholder}
                    className="sf-field"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: "20px" }}>
      <h4 style={{ color: "#9ca3af", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 14px", display: "flex", alignItems: "center" }}>
        {title}
      </h4>
      {children}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px", padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "#0a1209", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: "20px", background: "#0a1209", borderRadius: "6px", width: "160px", marginBottom: "8px" }} />
          <div style={{ height: "13px", background: "#0a1209", borderRadius: "6px", width: "220px", marginBottom: "10px" }} />
          <div style={{ height: "22px", background: "#0a1209", borderRadius: "999px", width: "80px" }} />
        </div>
      </div>
      <div style={{ background: "#070d08", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px", padding: "24px", height: "320px" }} />
    </div>
  );
}
