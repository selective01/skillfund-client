import { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved, faCircleCheck, faCircleXmark, faClockRotateLeft,
  faCloudArrowUp, faTrash, faArrowRight, faArrowLeft, faCircleNotch,
  faPlus, faPhone, faUser, faBuilding, faTriangleExclamation,
  faImage, faVideo, faReceipt, faChevronDown, faLock, faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";
import useThemeStore from "../../store/useThemeStore";

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSET_TYPES = [
  { value: "equipment",    label: "Equipment / Tools",     faIcon: null, desc: "Machines, tools, professional equipment you own" },
  { value: "vehicle",      label: "Vehicle",               faIcon: null, desc: "Car, motorbike, delivery vehicle" },
  { value: "property",     label: "Shop / Workspace",      faIcon: null, desc: "Physical shop, studio, or workspace you occupy" },
  { value: "inventory",    label: "Inventory / Stock",     faIcon: null, desc: "Raw materials, finished goods, or stock on hand" },
  { value: "other",        label: "Other Asset",           faIcon: null, desc: "Any other asset with verifiable value" },
];

const RELATIONSHIP_TYPES = [
  { value: "family",    label: "Family Member"   },
  { value: "employer",  label: "Employer"         },
  { value: "colleague", label: "Colleague"         },
  { value: "community", label: "Community Leader" },
  { value: "other",     label: "Other"            },
];

const TABS = [
  { id: "assets",     label: "Asset Collateral", icon: faBuilding,    desc: "Prove assets you own"        },
  { id: "guarantors", label: "Guarantors",        icon: faUser,        desc: "Add people who vouch for you" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const map = {
    approved: { label: "Approved",    color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   icon: faCircleCheck    },
    pending:  { label: "Under Review",color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)",  icon: faClockRotateLeft },
    rejected: { label: "Rejected",    color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.3)",   icon: faCircleXmark    },
    verified: { label: "Verified",    color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)",   icon: faCircleCheck    },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", padding: "4px 10px", borderRadius: "100px", background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      <FontAwesomeIcon icon={s.icon} style={{ fontSize: "10px" }} /> {s.label}
    </span>
  );
}

function DropZone({ files, onFiles, onRemove, accept = "image/*,video/*,application/pdf", multiple = true, label, hint }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _dim = _L ? "#6b7280" : "#4b5563";

  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) onFiles(multiple ? dropped : [dropped[0]]);
  }, [onFiles, multiple]);

  const handleChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length) onFiles(multiple ? selected : [selected[0]]);
    e.target.value = "";
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("video/")) return faVideo;
    if (file.type === "application/pdf") return faReceipt;
    return faImage;
  };

  return (
    <div>
      {/* Existing files */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
              {f.type?.startsWith("image/") && f instanceof File ? (
                <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
              ) : (
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: _input, border: `1px solid ${_cardBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FontAwesomeIcon icon={getFileIcon(f)} style={{ fontSize: "16px", color: "#22c55e" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: _text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name || `File ${i + 1}`}</p>
                {f.size && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: _dim }}>{(f.size / 1024).toFixed(0)} KB</p>}
              </div>
              <button onClick={() => onRemove(i)} style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FontAwesomeIcon icon={faTrash} style={{ fontSize: "10px" }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop target */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragging ? "#22c55e" : _cardBorder}`,
          borderRadius: "14px", padding: "28px 20px", textAlign: "center",
          cursor: "pointer", transition: ".2s",
          background: dragging ? "rgba(34,197,94,0.04)" : "transparent",
        }}
        onMouseEnter={(e) => { if (!dragging) e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)"; }}
        onMouseLeave={(e) => { if (!dragging) e.currentTarget.style.borderColor = _cardBorder; }}
      >
        <FontAwesomeIcon icon={faCloudArrowUp} style={{ fontSize: "22px", color: "#2d4a31", marginBottom: "8px" }} />
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: _dim }}>
          {label} · <span style={{ color: "#22c55e" }}>Browse</span> or drag
        </p>
        {hint && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4a5568", marginTop: "3px" }}>{hint}</p>}
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleChange} style={{ display: "none" }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET COLLATERAL TAB
// ═══════════════════════════════════════════════════════════════════════════════
function AssetCollateralTab() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _input = _L ? "#edf7ef" : "#0a1209";

  const [assets,     setAssets]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(null); // index of submitting asset
  const [showForm,   setShowForm]   = useState(false);

  const emptyAsset = () => ({
    assetType: "equipment", assetName: "", estimatedValue: "",
    description: "", files: [], _submitting: false,
  });

  const [form, setForm] = useState(emptyAsset());
  const [errors, setErrors] = useState({});

  // ─── Load existing assets ────────────────────────────────────────────────
  useEffect(() => {
    api.get("/assets/my")
      .then((res) => setAssets(res.data.assets || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setF = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.assetName.trim())         e.assetName       = "Enter the asset name";
    if (!form.estimatedValue || form.estimatedValue <= 0) e.estimatedValue = "Enter an estimated value";
    if (!form.description.trim())       e.description     = "Describe the asset briefly";
    if (form.files.length === 0)        e.files           = "Upload at least one photo or document";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting("new");
    try {
      const fd = new FormData();
      fd.append("assetType",      form.assetType);
      fd.append("assetName",      form.assetName);
      fd.append("estimatedValue", form.estimatedValue);
      fd.append("description",    form.description);
      form.files.forEach((f) => fd.append("proofFiles", f));
      const res = await api.post("/assets", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAssets((p) => [res.data.asset, ...p]);
      setForm(emptyAsset());
      setShowForm(false);
      setErrors({});
      toast.success("Asset submitted for review!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/assets/${id}`);
      setAssets((p) => p.filter((a) => a._id !== id));
      toast.success("Asset removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "22px", color: "#22c55e" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* How it works */}
      <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "16px", padding: "16px 18px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".08em", marginBottom: "8px" }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: "6px" }} /> WHY ASSET COLLATERAL MATTERS
        </p>
        {[
          "Assets prove you have something real at stake — which builds investor trust",
          "Higher-value verified assets unlock access to higher funding tiers",
          "Assets are not taken from you — they're proof of your stake in success",
          "All submissions are reviewed by SkillFund admin within 48 hours",
        ].map((t) => (
          <p key={t} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginBottom: "3px" }}>· {t}</p>
        ))}
      </div>

      {/* Existing assets */}
      {assets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: _muted, letterSpacing: ".08em" }}>YOUR SUBMITTED ASSETS</p>
          {assets.map((asset) => {
            const typeInfo = ASSET_TYPES.find((t) => t.value === asset.assetType) || ASSET_TYPES[0];
            return (
              <div key={asset._id} style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "16px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                      {typeInfo.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "14px", color: _text, margin: "0 0 2px" }}>{asset.assetName}</p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _dim, margin: 0 }}>{typeInfo.label} · Est. ${Number(asset.estimatedValue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    <StatusPill status={asset.status} />
                    {asset.status === "pending" && (
                      <button onClick={() => handleDelete(asset._id)} style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: "10px" }} />
                      </button>
                    )}
                  </div>
                </div>
                {asset.description && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginTop: "10px", lineHeight: 1.5 }}>{asset.description}</p>
                )}
                {asset.rejectionReason && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#f87171", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "11px" }} /> {asset.rejectionReason}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add asset form */}
      {showForm ? (
        <div style={{ background: _card, border: "1px solid rgba(34,197,94,0.2)", borderRadius: "20px", padding: "22px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.05rem", color: _text, marginBottom: "4px" }}>Add Asset</p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, marginBottom: "20px" }}>Provide details and proof of the asset you're submitting.</p>

          {/* Asset type selector */}
          <div style={{ marginBottom: "14px" }}>
            <label className="ac-label">Asset Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "8px" }}>
              {ASSET_TYPES.map((t) => {
                const sel = form.assetType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setF("assetType", t.value)}
                    style={{
                      padding: "10px 12px", borderRadius: "12px", cursor: "pointer", textAlign: "left", transition: ".15s",
                      background: sel ? "rgba(34,197,94,0.08)" : _input,
                      border: `1px solid ${sel ? "rgba(34,197,94,0.3)" : _cardBorder}`,
                    }}
                  >
                    <p style={{ fontSize: "1.1rem", marginBottom: "4px" }}>{t.emoji}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: sel ? "#22c55e" : "#9ca3af" }}>{t.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name + Value */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label className="ac-label">Asset Name</label>
              <input
                type="text"
                value={form.assetName}
                onChange={(e) => setF("assetName", e.target.value)}
                placeholder="e.g. Industrial Sewing Machine"
                className={`ac-field ${errors.assetName ? "error" : ""}`}
              />
              {errors.assetName && <p className="ac-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.assetName}</p>}
            </div>
            <div>
              <label className="ac-label">Estimated Value ($)</label>
              <input
                type="number" min="0"
                value={form.estimatedValue}
                onChange={(e) => setF("estimatedValue", e.target.value)}
                placeholder="500"
                className={`ac-field ${errors.estimatedValue ? "error" : ""}`}
              />
              {errors.estimatedValue && <p className="ac-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.estimatedValue}</p>}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "14px" }}>
            <label className="ac-label">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setF("description", e.target.value)}
              placeholder="Briefly describe the asset — brand, model, condition, how you use it in your business..."
              rows={3}
              className={`ac-field ${errors.description ? "error" : ""}`}
              style={{ resize: "vertical" }}
            />
            {errors.description && <p className="ac-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.description}</p>}
          </div>

          {/* Proof files */}
          <div style={{ marginBottom: "16px" }}>
            <label className="ac-label">Proof Files *</label>
            <DropZone
              files={form.files}
              onFiles={(newFiles) => setF("files", [...form.files, ...newFiles])}
              onRemove={(i) => setF("files", form.files.filter((_, idx) => idx !== i))}
              label="Photos, videos, or receipts"
              hint="At least 1 photo required · Images, video, or PDF · Max 10MB each"
            />
            {errors.files && <p className="ac-err" style={{ marginTop: "6px" }}><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.files}</p>}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { setShowForm(false); setErrors({}); setForm(emptyAsset()); }} className="ac-btn-ghost">
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "11px" }} /> Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting === "new"} className="ac-btn-green" style={{ flex: 1 }}>
              <FontAwesomeIcon icon={submitting === "new" ? faCircleNotch : faCheckDouble} spin={submitting === "new"} style={{ fontSize: "12px" }} />
              {submitting === "new" ? "Submitting..." : "Submit Asset"}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="ac-btn-ghost" style={{ width: "100%" }}>
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: "12px" }} /> Add Asset
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUARANTORS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function GuarantorsTab() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const _muted = _L ? "#4b5563" : "#9ca3af";

  const [guarantors, setGuarantors] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [errors,     setErrors]     = useState({});

  const emptyGuarantor = () => ({
    name: "", phone: "", relationship: "family",
    businessName: "", notes: "",
  });
  const [form, setForm] = useState(emptyGuarantor());

  useEffect(() => {
    api.get("/guarantors/my")
      .then((res) => setGuarantors(res.data.guarantors || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setF = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Enter the guarantor's full name";
    if (!form.phone.trim()) e.phone = "Enter a valid phone number";
    if (form.phone.trim().length < 7) e.phone = "Phone number seems too short";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/guarantors", {
        name:         form.name,
        phone:        form.phone,
        relationship: form.relationship,
        businessName: form.businessName,
        notes:        form.notes,
      });
      setGuarantors((p) => [res.data.guarantor, ...p]);
      setForm(emptyGuarantor());
      setShowForm(false);
      setErrors({});
      toast.success("Guarantor added! We'll verify them via phone call.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/guarantors/${id}`);
      setGuarantors((p) => p.filter((g) => g._id !== id));
      toast.success("Guarantor removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "22px", color: "#22c55e" }} />
    </div>
  );

  const canAddMore = guarantors.length < 2;
  const verifiedCount = guarantors.filter((g) => g.status === "verified").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Status banner */}
      {guarantors.length > 0 && (
        <div style={{
          padding: "14px 16px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: verifiedCount >= 2 ? "rgba(34,197,94,0.06)" : "rgba(245,158,11,0.06)",
          border: `1px solid ${verifiedCount >= 2 ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
        }}>
          <div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "13px", color: verifiedCount >= 2 ? "#22c55e" : "#f59e0b", margin: "0 0 2px" }}>
              {verifiedCount >= 2 ? "✓ Guarantor requirement met" : `${verifiedCount}/2 guarantors verified`}
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _dim, margin: 0 }}>
              {verifiedCount >= 2 ? "Both guarantors have been verified by our team" : "2 verified guarantors required for full trust status"}
            </p>
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.4rem", color: verifiedCount >= 2 ? "#22c55e" : "#f59e0b" }}>
            {verifiedCount}/2
          </span>
        </div>
      )}

      {/* How it works */}
      <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "16px", padding: "16px 18px" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".08em", marginBottom: "8px" }}>
          <FontAwesomeIcon icon={faPhone} style={{ marginRight: "6px" }} /> HOW GUARANTOR VERIFICATION WORKS
        </p>
        {[
          "Add 2 people who can vouch for your identity and business",
          "Our team will call each guarantor to confirm they know you and your work",
          "All calls are recorded and stored on your account",
          "Guarantors can be family, employers, colleagues, or community leaders",
          "Guarantors do not guarantee payment — they confirm your identity",
        ].map((t) => (
          <p key={t} style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginBottom: "3px" }}>· {t}</p>
        ))}
      </div>

      {/* Existing guarantors */}
      {guarantors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: _muted, letterSpacing: ".08em" }}>YOUR GUARANTORS</p>
          {guarantors.map((g, i) => (
            <div key={g._id} style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "16px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1rem", color: "#000", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "14px", color: _text, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _dim, margin: 0 }}>
                      {g.phone} · <span style={{ textTransform: "capitalize" }}>{g.relationship}</span>
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <StatusPill status={g.status || "pending"} />
                  {g.status !== "verified" && (
                    <button onClick={() => handleDelete(g._id)} style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FontAwesomeIcon icon={faTrash} style={{ fontSize: "10px" }} />
                    </button>
                  )}
                </div>
              </div>

              {g.businessName && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginTop: "8px" }}>
                  <FontAwesomeIcon icon={faBuilding} style={{ fontSize: "10px", marginRight: "5px" }} /> {g.businessName}
                </p>
              )}
              {g.notes && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginTop: "4px", lineHeight: 1.5 }}>{g.notes}</p>
              )}
              {g.status === "pending" && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#f59e0b", marginTop: "10px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <FontAwesomeIcon icon={faPhone} style={{ fontSize: "10px" }} /> Awaiting verification call
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add guarantor form */}
      {canAddMore && showForm && (
        <div style={{ background: _card, border: "1px solid rgba(34,197,94,0.2)", borderRadius: "20px", padding: "22px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.05rem", color: _text, marginBottom: "4px" }}>
            Add Guarantor {guarantors.length + 1} of 2
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, marginBottom: "20px" }}>
            This person will receive a phone call from SkillFund to confirm your identity.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label className="ac-label">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setF("name", e.target.value)}
                placeholder="e.g. Emeka Okonkwo"
                className={`ac-field ${errors.name ? "error" : ""}`}
              />
              {errors.name && <p className="ac-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.name}</p>}
            </div>
            <div>
              <label className="ac-label">Phone Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setF("phone", e.target.value)}
                placeholder="+234 800 000 0000"
                className={`ac-field ${errors.phone ? "error" : ""}`}
              />
              {errors.phone && <p className="ac-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.phone}</p>}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label className="ac-label">Relationship</label>
              <div style={{ position: "relative" }}>
                <select value={form.relationship} onChange={(e) => setF("relationship", e.target.value)} className="ac-select">
                  {RELATIONSHIP_TYPES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#4a5568", fontSize: "11px", pointerEvents: "none" }} />
              </div>
            </div>
            <div>
              <label className="ac-label">Business / Organisation <span style={{ color: "#4a5568", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setF("businessName", e.target.value)}
                placeholder="Where they work"
                className="ac-field"
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label className="ac-label">Notes for our team <span style={{ color: "#4a5568", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => setF("notes", e.target.value)}
              placeholder="Any context that will help us reach them, best time to call, language preference, etc."
              rows={3}
              className="ac-field"
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <FontAwesomeIcon icon={faLock} style={{ fontSize: "12px", color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _dim, lineHeight: 1.6, margin: 0 }}>
              Their phone number is used only for identity verification. We will never share it with investors or third parties.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { setShowForm(false); setErrors({}); setForm(emptyGuarantor()); }} className="ac-btn-ghost">
              <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "11px" }} /> Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="ac-btn-green" style={{ flex: 1 }}>
              <FontAwesomeIcon icon={submitting ? faCircleNotch : faPhone} spin={submitting} style={{ fontSize: "12px" }} />
              {submitting ? "Submitting..." : "Add Guarantor"}
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {canAddMore && !showForm && (
        <button onClick={() => setShowForm(true)} className="ac-btn-ghost" style={{ width: "100%" }}>
          <FontAwesomeIcon icon={faPlus} style={{ fontSize: "12px" }} />
          Add Guarantor {guarantors.length + 1} of 2
        </button>
      )}

      {!canAddMore && guarantors.length >= 2 && (
        <div style={{ padding: "14px", textAlign: "center", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "12px" }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: "#22c55e" }}>
            <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: "6px" }} />
            Both guarantors submitted
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", marginTop: "4px" }}>
            Our team will call them within 48 hours
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function TrustVerification() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const _heroBorder = _L ? "rgba(34,197,94,0.25)" : "rgba(34,197,94,0.12)";
  const _heroGrad = _L ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)" : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)";

  useNotificationReadOnView();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("assets");

  if (user?.role !== "creator") {
    return (
      <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "20px", padding: "64px 20px", textAlign: "center" }}>
        <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "36px", color: "#2d4a31", marginBottom: "16px" }} />
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.3rem", color: _text, marginBottom: "8px" }}>Creators only</h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim }}>This page is for creator accounts only.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "680px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .ac-field { background:var(--sf-bg-input,#0a1209); border:1px solid var(--sf-border,rgba(255,255,255,0.08)); color:var(--sf-text-primary,#f1f5f9); border-radius:12px; padding:10px 14px; font-size:14px; outline:none; width:100%; font-family:'Inter', sans-serif; transition:border-color .2s; }
        .ac-field::placeholder { color:#2d4a31; }
        .ac-field:focus { border-color:rgba(34,197,94,0.4); }
        .ac-field.error { border-color:rgba(239,68,68,0.4); }
        .ac-select { background:var(--sf-bg-input,#0a1209); border:1px solid var(--sf-border,rgba(255,255,255,0.08)); color:var(--sf-text-primary,#f1f5f9); border-radius:12px; padding:10px 36px 10px 14px; font-size:14px; outline:none; width:100%; font-family:'Inter', sans-serif; appearance:none; cursor:pointer; transition:border-color .2s; }
        .ac-select:focus { border-color:rgba(34,197,94,0.4); }
        .ac-select option { background:#070d08; }
        .ac-label { display:block; font-size:11px; font-weight:700; font-family:'Inter', sans-serif; text-transform:uppercase; letter-spacing:.06em; color:#9ca3af; margin-bottom:6px; }
        .ac-err { font-size:11px; color:#f87171; font-family:'Inter', sans-serif; margin-top:4px; display:flex; align-items:center; gap:4px; }
        .ac-btn-green { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:900; font-size:13px; padding:11px 20px; border-radius:13px; cursor:pointer; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; border:none; transition:.15s; box-shadow:0 4px 16px rgba(34,197,94,0.2); white-space:nowrap; }
        .ac-btn-green:hover:not(:disabled) { transform:scale(1.02); }
        .ac-btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; }
        .ac-btn-ghost { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:700; font-size:13px; padding:10px 18px; border-radius:13px; cursor:pointer; background:var(--sf-bg-input,rgba(0,0,0,0.3)); border:1px solid var(--sf-border,rgba(255,255,255,0.08)); color:var(--sf-text-muted,#9ca3af); transition:.15s; white-space:nowrap; }
        .ac-btn-ghost:hover { border-color:rgba(34,197,94,0.25); color:white; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: _heroGrad, border: `1px solid ${_heroBorder}`, borderRadius: "24px", padding: "24px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "160px", height: "160px", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.1),transparent)", transform: "translate(30%,-30%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "14px", color: "#22c55e" }} />
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".1em" }}>TRUST VERIFICATION</span>
        </div>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "clamp(1.3rem,3vw,1.7rem)", color: _text, margin: "0 0 6px", lineHeight: 1.1 }}>
          Prove your stake
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, margin: "0 0 16px", lineHeight: 1.6 }}>
          Asset collateral and guarantors show investors you have real skin in the game — unlocking higher funding tiers and stronger investor confidence.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { icon: faArrowRight, text: "Unlocks higher funding tiers" },
            { icon: faCheckDouble, text: "Boosts Trust Score"           },
            { icon: faLock,        text: "Builds investor confidence"   },
          ].map((b) => (
            <span key={b.text} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", padding: "5px 12px", borderRadius: "100px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
              <FontAwesomeIcon icon={b.icon} style={{ fontSize: "10px" }} /> {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                padding: "12px 16px", borderRadius: "16px", cursor: "pointer", transition: ".15s",
                background: active ? "rgba(34,197,94,0.08)" : _card,
                border: `1px solid ${active ? "rgba(34,197,94,0.3)" : _cardBorder}`,
              }}
            >
              <FontAwesomeIcon icon={tab.icon} style={{ fontSize: "15px", color: active ? "#22c55e" : "#4a5568" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: active ? "#22c55e" : "#6b7280" }}>{tab.label}</span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px", color: "#4a5568" }}>{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "20px", padding: "22px" }}>
        {activeTab === "assets"     && <AssetCollateralTab />}
        {activeTab === "guarantors" && <GuarantorsTab />}
      </div>
    </div>
  );
}
