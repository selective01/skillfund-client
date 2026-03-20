import { useState, useEffect, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import useAdminAuthStore from "../../store/useAdminAuthStore";
import useThemeStore from "../../store/useThemeStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck, faCircleXmark, faClockRotateLeft, faCircleNotch,
  faChevronDown, faChevronUp, faMagnifyingGlass, faPhone,
  faShieldHalved, faBuilding, faPlay, faTriangleExclamation,
  faImage, faFileLines,
} from "@fortawesome/free-solid-svg-icons";

// ─── Design tokens (match AdminPages.jsx exactly) ─────────────────────────────
const T = {
  bg: "#ffffff", pageBg: "#f5f6fa", border: "1px solid #eef0f4",
  radius: "16px", shadow: "0 1px 4px rgba(0,0,0,0.04)",
  font: "'Inter', sans-serif", text: "#1a1d23", muted: "#9ea3ae", subtle: "#f5f6fa",
};

const INPUT = {
  background: T.bg, border: "1px solid #e2e8f0", borderRadius: "10px",
  fontFamily: T.font, fontSize: "13px", color: T.text,
  padding: "9px 12px", outline: "none", cursor: "pointer",
};

// ─── Shared helpers (local copies — same as AdminPages) ───────────────────────
function useT() {
  const _t = useThemeStore((s) => s.theme);
  const L = _t === "light";
  return {
    card:      L ? "#ffffff"              : "#070d08",
    cardAlt:   L ? "#f0fdf4"              : "#0a1209",
    border:    L ? "rgba(34,197,94,0.2)"  : "rgba(255,255,255,0.08)",
    text:      L ? "#0a1a0c"              : "#f1f5f9",
    muted:     L ? "#4b5563"              : "#9ca3af",
    dim:       L ? "#6b7280"              : "#4b5563",
    hover:     L ? "rgba(0,0,0,0.04)"    : "rgba(255,255,255,0.04)",
    shadow:    L ? "0 1px 4px rgba(0,0,0,0.06)" : "0 2px 8px rgba(0,0,0,0.3)",
    heroGrad:  L ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)" : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)",
    heroBorder:L ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.25)",
  };
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Card({ children, style = {} }) {
  const T = useT();
  return (
    <div style={{ background: T.bg, border: T.border, borderRadius: T.radius, boxShadow: T.shadow, ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color, bg, border }) {
  const T = useT();
  return (
    <span style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function FilterTabs({ options, active, onChange }) {
  const T = useT();
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          style={{ fontFamily: T.font, fontSize: "12px", fontWeight: 600, padding: "7px 14px", borderRadius: "10px", cursor: "pointer", transition: "all .15s", border: "1px solid", background: active === o.key ? `${o.color}12` : T.bg, color: active === o.key ? o.color : T.muted, borderColor: active === o.key ? `${o.color}30` : "#e2e8f0" }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = "Search..." }) {
  const T = useT();
  return (
    <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
      <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: T.muted, pointerEvents: "none" }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...INPUT, paddingLeft: "34px", width: "100%", boxSizing: "border-box" }} />
    </div>
  );
}

function DetailGrid({ items }) {
  const T = useT();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "8px", marginTop: "12px" }}>
      {items.map(d => (
        <div key={d.label} style={{ background: T.subtle, borderRadius: "10px", padding: "10px 12px", border: T.border }}>
          <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 3px" }}>{d.label}</p>
          <p style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ onClick, disabled, loading, icon, label, color, bg, border }) {
  const T = useT();
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", fontFamily: T.font, fontWeight: 700, fontSize: "13px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, background: bg, color, border: `1px solid ${border}`, width: "100%", transition: "all .15s" }}>
      <FontAwesomeIcon icon={loading ? faCircleNotch : icon} spin={loading} style={{ fontSize: "13px" }} />
      {label}
    </button>
  );
}

function Skeleton({ rows = 5, cols = 4 }) {
  const T = useT();
  return (
    <Card style={{ overflow: "hidden" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: "12px", padding: "14px 16px", borderBottom: i < rows - 1 ? T.border : "none" }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} style={{ height: "12px", background: "#f1f5f9", borderRadius: "6px", width: j === 0 ? "60%" : "80%" }} />
          ))}
        </div>
      ))}
    </Card>
  );
}

function Empty({ message }) {
  const T = useT();
  return (
    <Card style={{ textAlign: "center", padding: "56px 24px" }}>
      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "28px", color: "#d1d5db", marginBottom: "12px" }} />
      <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: 0 }}>{message}</p>
    </Card>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  pending:   { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Pending",   icon: faClockRotateLeft },
  approved:  { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Approved",  icon: faCircleCheck    },
  verified:  { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Verified",  icon: faCircleCheck    },
  rejected:  { color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", label: "Rejected",  icon: faCircleXmark    },
  scheduled: { color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff", label: "Scheduled", icon: faPhone          },
  completed: { color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd", label: "Completed", icon: faCircleCheck    },
};

const STATUS_TABS = [
  { key: "pending",  label: "Pending",  color: "#f59e0b" },
  { key: "approved", label: "Approved", color: "#16a34a" },
  { key: "rejected", label: "Rejected", color: "#f43f5e" },
];

// ─── Admin API hook ───────────────────────────────────────────────────────────
function useAdminApi() {
  const { adminToken } = useAdminAuthStore();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return useMemo(() => {
    const headers = () => ({ Authorization: `Bearer ${adminToken}` });
    return {
      get:    (url, cfg = {})       => axios.get(`${BASE}${url}`,        { ...cfg, headers: { ...headers(), ...cfg.headers } }),
      post:   (url, data, cfg = {}) => axios.post(`${BASE}${url}`, data, { ...cfg, headers: { ...headers(), ...cfg.headers } }),
      put:    (url, data, cfg = {}) => axios.put(`${BASE}${url}`, data,  { ...cfg, headers: { ...headers(), ...cfg.headers } }),
      delete: (url, cfg = {})       => axios.delete(`${BASE}${url}`,     { ...cfg, headers: { ...headers(), ...cfg.headers } }),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);
}

// ─── File preview helper ──────────────────────────────────────────────────────
function FilePreview({ url }) {
  const T = useT();
  if (!url) return null;
  const isVideo = url.match(/\.(mp4|mov|webm|avi)$/i) || url.includes("video");
  const isPdf   = url.match(/\.pdf$/i);
  if (isVideo) return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0ea5e9", fontFamily: T.font, fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
      <FontAwesomeIcon icon={faPlay} style={{ fontSize: "11px" }} /> Watch Video
    </a>
  );
  if (isPdf) return (
    <a href={url} target="_blank" rel="noreferrer"
      style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "8px", background: "#fff1f2", border: "1px solid #fecdd3", color: "#f43f5e", fontFamily: T.font, fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
      <FontAwesomeIcon icon={faFileLines} style={{ fontSize: "11px" }} /> View PDF
    </a>
  );
  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="proof" style={{ maxWidth: "200px", maxHeight: "140px", borderRadius: "10px", border: T.border, objectFit: "cover", cursor: "pointer", display: "block" }} />
    </a>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE VERIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
function VoiceVerificationsSection() {
  const T = useT();
  const adminApi = useAdminApi();
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState("scheduled");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [actionLoading,  setActionLoading]  = useState({});
  const [rejectReasons,  setRejectReasons]  = useState({});
  const [callNotes,      setCallNotes]      = useState({});

  const VOICE_TABS = [
    { key: "scheduled",  label: "Scheduled",  color: "#6366f1" },
    { key: "completed",  label: "Completed",  color: "#0ea5e9" },
    { key: "pending",    label: "Pending Review", color: "#f59e0b" },
    { key: "approved",   label: "Approved",   color: "#16a34a" },
    { key: "rejected",   label: "Rejected",   color: "#f43f5e" },
  ];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/voice?status=${statusFilter}`);
      setItems(res.data.voiceVerifications || []);
    } catch { toast.error("Failed to load voice verifications"); }
    finally { setLoading(false); }
  }, [adminApi, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id, action) => {
    const reason = rejectReasons[id] || "";
    const notes  = callNotes[id] || "";
    if (action === "rejected" && !reason.trim()) { toast.error("Enter a rejection reason"); return; }
    setActionLoading(p => ({ ...p, [`${action}_${id}`]: true }));
    try {
      await adminApi.put(`/admin/voice/${id}/${action}`, { rejectionReason: reason, callNotes: notes });
      toast.success(`Voice verification ${action}!`);
      setItems(prev => prev.filter(i => i._id !== id));
      setExpandedId(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [`${action}_${id}`]: false })); }
  };

  const handleMarkCompleted = async (id) => {
    setActionLoading(p => ({ ...p, [`completed_${id}`]: true }));
    try {
      await adminApi.put(`/admin/voice/${id}/completed`);
      toast.success("Call marked as completed");
      setItems(prev => prev.filter(i => i._id !== id));
      setExpandedId(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [`completed_${id}`]: false })); }
  };

  const filtered = search
    ? items.filter(i => {
        const s = search.toLowerCase();
        const u = i.user || {};
        return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || i.phone?.includes(s);
      })
    : items;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, or phone..." />
        <FilterTabs options={VOICE_TABS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? (
        <Skeleton rows={4} cols={4} />
      ) : filtered.length === 0 ? (
        <Empty message={`No ${statusFilter} voice verifications`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(item => {
            const u = item.user || {};
            const isExpanded = expandedId === item._id;
            const ss = STATUS[item.status] || STATUS.pending;
            return (
              <Card key={item._id} style={{ overflow: "hidden" }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#eef2ff", border: "1px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faPhone} style={{ fontSize: "14px", color: "#6366f1" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "User"}</p>
                    <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>
                      {item.phone || "—"} · {item.timeSlot || ""} {item.date ? `· ${formatDate(item.date)}` : ""}
                    </p>
                  </div>
                  {item.timezone && (
                    <span style={{ fontFamily: T.font, fontSize: "11px", color: "#64748b", background: T.subtle, border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: "8px", flexShrink: 0 }}>
                      {item.timezone.split("/")[1]?.replace(/_/g, " ") || item.timezone}
                    </span>
                  )}
                  <Badge label={ss.label} color={ss.color} bg={ss.bg} border={ss.border} />
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: T.muted, flexShrink: 0 }} />
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ borderTop: T.border, padding: "16px" }}>
                    <DetailGrid items={[
                      { label: "Full Name",  value: u.name },
                      { label: "Email",      value: u.email },
                      { label: "Phone",      value: item.phone },
                      { label: "Date",       value: formatDate(item.date) },
                      { label: "Time Slot",  value: item.timeSlot },
                      { label: "Timezone",   value: item.timezone },
                      { label: "Submitted",  value: formatDate(item.createdAt) },
                      { label: "Plan",       value: u.plan },
                    ]} />

                    {/* Recording link */}
                    {item.recordingUrl && (
                      <div style={{ marginTop: "14px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>Call Recording</p>
                        <a href={item.recordingUrl} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "10px", background: "#eef2ff", border: "1px solid #e0e7ff", color: "#6366f1", fontFamily: T.font, fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                          <FontAwesomeIcon icon={faPlay} style={{ fontSize: "12px" }} /> Play Recording
                        </a>
                      </div>
                    )}

                    {/* Admin call notes */}
                    {(item.status === "completed" || item.status === "pending") && (
                      <div style={{ marginTop: "14px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Admin Call Notes</p>
                        <textarea
                          value={callNotes[item._id] || item.callNotes || ""}
                          onChange={e => setCallNotes(p => ({ ...p, [item._id]: e.target.value }))}
                          placeholder="Notes from the call — what did the creator confirm?"
                          rows={3}
                          style={{ ...INPUT, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
                        />
                      </div>
                    )}

                    {/* Rejection reason */}
                    {item.status === "rejected" && item.rejectionReason && (
                      <div style={{ marginTop: "12px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "12px", display: "flex", gap: "8px" }}>
                        <FontAwesomeIcon icon={faCircleXmark} style={{ color: "#f43f5e", fontSize: "13px", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontFamily: T.font, fontSize: "12px", color: "#f43f5e", margin: 0 }}>{item.rejectionReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {item.status === "scheduled" && (
                      <div style={{ marginTop: "16px" }}>
                        <ActionBtn
                          onClick={() => handleMarkCompleted(item._id)}
                          disabled={!!actionLoading[`completed_${item._id}`]}
                          loading={actionLoading[`completed_${item._id}`]}
                          icon={faPhone} label="Mark Call as Completed"
                          color="#fff" bg="linear-gradient(135deg,#6366f1,#4338ca)" border="transparent"
                        />
                      </div>
                    )}

                    {(item.status === "completed" || item.status === "pending") && (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <ActionBtn
                          onClick={() => handleAction(item._id, "approved")}
                          disabled={!!actionLoading[`approved_${item._id}`]}
                          loading={actionLoading[`approved_${item._id}`]}
                          icon={faCircleCheck} label="Approve Voice Verification"
                          color="#fff" bg="linear-gradient(135deg,#22c55e,#16a34a)" border="transparent"
                        />
                        <input
                          type="text"
                          value={rejectReasons[item._id] || ""}
                          onChange={e => setRejectReasons(p => ({ ...p, [item._id]: e.target.value }))}
                          placeholder="Rejection reason (required)..."
                          style={{ ...INPUT, width: "100%", boxSizing: "border-box" }}
                        />
                        <ActionBtn
                          onClick={() => handleAction(item._id, "rejected")}
                          disabled={!!actionLoading[`rejected_${item._id}`]}
                          loading={actionLoading[`rejected_${item._id}`]}
                          icon={faCircleXmark} label="Reject"
                          color="#f43f5e" bg="#fff1f2" border="#fecdd3"
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ASSET COLLATERAL
// ═══════════════════════════════════════════════════════════════════════════════
function AssetCollateralSection() {
  const T = useT();
  const adminApi = useAdminApi();
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState("pending");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [actionLoading,  setActionLoading]  = useState({});
  const [rejectReasons,  setRejectReasons]  = useState({});
  const [adminNotes,     setAdminNotes]     = useState({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/assets?status=${statusFilter}`);
      setItems(res.data.assets || []);
    } catch { toast.error("Failed to load asset submissions"); }
    finally { setLoading(false); }
  }, [adminApi, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id, action) => {
    const reason = rejectReasons[id] || "";
    const notes  = adminNotes[id] || "";
    if (action === "rejected" && !reason.trim()) { toast.error("Enter a rejection reason"); return; }
    setActionLoading(p => ({ ...p, [`${action}_${id}`]: true }));
    try {
      await adminApi.put(`/admin/assets/${id}/${action}`, { rejectionReason: reason, adminNotes: notes });
      toast.success(`Asset ${action}!`);
      setItems(prev => prev.filter(i => i._id !== id));
      setExpandedId(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [`${action}_${id}`]: false })); }
  };

  const ASSET_TYPE_EMOJI = {
    equipment: "Equipment", vehicle: "Vehicle", property: "Property", inventory: "Inventory", other: "Other",
  };

  const filtered = search
    ? items.filter(i => {
        const s = search.toLowerCase();
        const u = i.user || {};
        return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || i.assetName?.toLowerCase().includes(s);
      })
    : items;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by user or asset name..." />
        <FilterTabs options={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? (
        <Skeleton rows={4} cols={4} />
      ) : filtered.length === 0 ? (
        <Empty message={`No ${statusFilter} asset submissions`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(item => {
            const u = item.user || {};
            const isExpanded = expandedId === item._id;
            const ss = STATUS[item.status] || STATUS.pending;
            const emoji = ASSET_TYPE_EMOJI[item.assetType] || "Other";
            return (
              <Card key={item._id} style={{ overflow: "hidden" }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.assetName || "Asset"}</p>
                    <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>
                      {u.name || "—"} · ${Number(item.estimatedValue || 0).toLocaleString()} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <span style={{ fontFamily: T.font, fontSize: "11px", color: "#64748b", background: T.subtle, border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: "8px", textTransform: "capitalize", flexShrink: 0 }}>
                    {item.assetType || "other"}
                  </span>
                  <Badge label={ss.label} color={ss.color} bg={ss.bg} border={ss.border} />
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: T.muted, flexShrink: 0 }} />
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ borderTop: T.border, padding: "16px" }}>
                    {item.description && (
                      <div style={{ background: T.subtle, borderRadius: "10px", padding: "14px", border: T.border, marginBottom: "12px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Description</p>
                        <p style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: 0, lineHeight: 1.6 }}>{item.description}</p>
                      </div>
                    )}

                    <DetailGrid items={[
                      { label: "Asset Name",  value: item.assetName },
                      { label: "Asset Type",  value: item.assetType },
                      { label: "Est. Value",  value: `$${Number(item.estimatedValue || 0).toLocaleString()}` },
                      { label: "Owner",       value: u.name },
                      { label: "Owner Email", value: u.email },
                      { label: "Submitted",   value: formatDate(item.createdAt) },
                    ]} />

                    {/* Proof files */}
                    {item.proofFiles?.length > 0 && (
                      <div style={{ marginTop: "14px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "10px" }}>
                          Proof Files ({item.proofFiles.length})
                        </p>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-start" }}>
                          {item.proofFiles.map((url, i) => (
                            <div key={i}>
                              <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, marginBottom: "4px" }}>
                                <FontAwesomeIcon icon={faImage} style={{ marginRight: "4px" }} /> File {i + 1}
                              </p>
                              <FilePreview url={url} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin notes */}
                    {item.status === "pending" && (
                      <div style={{ marginTop: "14px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Admin Notes (optional)</p>
                        <textarea
                          value={adminNotes[item._id] || ""}
                          onChange={e => setAdminNotes(p => ({ ...p, [item._id]: e.target.value }))}
                          placeholder="Internal note about this asset submission..."
                          rows={2}
                          style={{ ...INPUT, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
                        />
                      </div>
                    )}

                    {/* Rejection reason display */}
                    {item.status === "rejected" && item.rejectionReason && (
                      <div style={{ marginTop: "12px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "12px", display: "flex", gap: "8px" }}>
                        <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: "#f43f5e", fontSize: "13px", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontFamily: T.font, fontSize: "12px", color: "#f43f5e", margin: 0 }}>{item.rejectionReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {item.status === "pending" && (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <ActionBtn
                          onClick={() => handleAction(item._id, "approved")}
                          disabled={!!actionLoading[`approved_${item._id}`]}
                          loading={actionLoading[`approved_${item._id}`]}
                          icon={faCircleCheck} label="Approve Asset"
                          color="#fff" bg="linear-gradient(135deg,#22c55e,#16a34a)" border="transparent"
                        />
                        <input
                          type="text"
                          value={rejectReasons[item._id] || ""}
                          onChange={e => setRejectReasons(p => ({ ...p, [item._id]: e.target.value }))}
                          placeholder="Rejection reason (required)..."
                          style={{ ...INPUT, width: "100%", boxSizing: "border-box" }}
                        />
                        <ActionBtn
                          onClick={() => handleAction(item._id, "rejected")}
                          disabled={!!actionLoading[`rejected_${item._id}`]}
                          loading={actionLoading[`rejected_${item._id}`]}
                          icon={faCircleXmark} label="Reject Asset"
                          color="#f43f5e" bg="#fff1f2" border="#fecdd3"
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUARANTORS
// ═══════════════════════════════════════════════════════════════════════════════
function GuarantorsSection() {
  const T = useT();
  const adminApi = useAdminApi();
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [statusFilter,   setStatusFilter]   = useState("pending");
  const [search,         setSearch]         = useState("");
  const [expandedId,     setExpandedId]     = useState(null);
  const [actionLoading,  setActionLoading]  = useState({});
  const [rejectReasons,  setRejectReasons]  = useState({});
  const [callNotes,      setCallNotes]      = useState({});

  const GUARANTOR_TABS = [
    { key: "pending",  label: "Pending",  color: "#f59e0b" },
    { key: "verified", label: "Verified", color: "#16a34a" },
    { key: "rejected", label: "Rejected", color: "#f43f5e" },
  ];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/guarantors?status=${statusFilter}`);
      setItems(res.data.guarantors || []);
    } catch { toast.error("Failed to load guarantors"); }
    finally { setLoading(false); }
  }, [adminApi, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id, action) => {
    const reason = rejectReasons[id] || "";
    const notes  = callNotes[id] || "";
    if (action === "rejected" && !reason.trim()) { toast.error("Enter a rejection reason"); return; }
    setActionLoading(p => ({ ...p, [`${action}_${id}`]: true }));
    try {
      await adminApi.put(`/admin/guarantors/${id}/${action}`, { rejectionReason: reason, callNotes: notes });
      toast.success(`Guarantor ${action}!`);
      setItems(prev => prev.filter(i => i._id !== id));
      setExpandedId(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [`${action}_${id}`]: false })); }
  };

  const filtered = search
    ? items.filter(i => {
        const s = search.toLowerCase();
        const creator = i.creator || {};
        return creator.name?.toLowerCase().includes(s) || creator.email?.toLowerCase().includes(s)
          || i.name?.toLowerCase().includes(s) || i.phone?.includes(s);
      })
    : items;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search creator name, guarantor name, or phone..." />
        <FilterTabs options={GUARANTOR_TABS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? (
        <Skeleton rows={4} cols={4} />
      ) : filtered.length === 0 ? (
        <Empty message={`No ${statusFilter} guarantors`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(item => {
            const creator = item.creator || {};
            const isExpanded = expandedId === item._id;
            const ss = STATUS[item.status] || STATUS.pending;
            return (
              <Card key={item._id} style={{ overflow: "hidden" }}>
                {/* Row header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "14px", color: "#16a34a" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0 }}>
                      {item.name || "Guarantor"} <span style={{ fontWeight: 400, color: T.muted }}>for {creator.name || "creator"}</span>
                    </p>
                    <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>
                      {item.phone} · <span style={{ textTransform: "capitalize" }}>{item.relationship || "—"}</span> · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  {item.businessName && (
                    <span style={{ fontFamily: T.font, fontSize: "11px", color: "#64748b", background: T.subtle, border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: "8px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", whiteSpace: "nowrap" }}>
                      {item.businessName}
                    </span>
                  )}
                  <Badge label={ss.label} color={ss.color} bg={ss.bg} border={ss.border} />
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: T.muted, flexShrink: 0 }} />
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div style={{ borderTop: T.border, padding: "16px" }}>

                    {/* Creator + Guarantor side by side */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      <div style={{ background: T.subtle, borderRadius: "10px", padding: "12px", border: T.border }}>
                        <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Creator (requesting funding)</p>
                        <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: "0 0 2px" }}>{creator.name || "—"}</p>
                        <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{creator.email}</p>
                      </div>
                      <div style={{ background: T.subtle, borderRadius: "10px", padding: "12px", border: T.border }}>
                        <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Guarantor (to call)</p>
                        <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: "0 0 2px" }}>{item.name || "—"}</p>
                        <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: "0 0 4px" }}>{item.phone}</p>
                        {item.businessName && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <FontAwesomeIcon icon={faBuilding} style={{ fontSize: "10px", color: T.muted }} />
                            <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{item.businessName}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <DetailGrid items={[
                      { label: "Relationship",  value: item.relationship },
                      { label: "Phone",         value: item.phone },
                      { label: "Submitted",     value: formatDate(item.createdAt) },
                      { label: "Creator Plan",  value: creator.plan },
                    ]} />

                    {/* Notes from creator */}
                    {item.notes && (
                      <div style={{ marginTop: "12px", background: T.subtle, borderRadius: "10px", padding: "12px", border: T.border }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Notes from Creator</p>
                        <p style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: 0, lineHeight: 1.6 }}>{item.notes}</p>
                      </div>
                    )}

                    {/* Recording */}
                    {item.recordingUrl && (
                      <div style={{ marginTop: "14px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>Call Recording</p>
                        <a href={item.recordingUrl} target="_blank" rel="noreferrer"
                          style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "10px", background: "#eef2ff", border: "1px solid #e0e7ff", color: "#6366f1", fontFamily: T.font, fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                          <FontAwesomeIcon icon={faPlay} style={{ fontSize: "12px" }} /> Play Recording
                        </a>
                      </div>
                    )}

                    {/* Call notes input */}
                    {item.status === "pending" && (
                      <div style={{ marginTop: "14px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Call Notes</p>
                        <textarea
                          value={callNotes[item._id] || item.callNotes || ""}
                          onChange={e => setCallNotes(p => ({ ...p, [item._id]: e.target.value }))}
                          placeholder="Notes from the verification call with the guarantor..."
                          rows={3}
                          style={{ ...INPUT, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
                        />
                      </div>
                    )}

                    {/* Rejection reason */}
                    {item.status === "rejected" && item.rejectionReason && (
                      <div style={{ marginTop: "12px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "12px", display: "flex", gap: "8px" }}>
                        <FontAwesomeIcon icon={faCircleXmark} style={{ color: "#f43f5e", fontSize: "13px", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontFamily: T.font, fontSize: "12px", color: "#f43f5e", margin: 0 }}>{item.rejectionReason}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {item.status === "pending" && (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <ActionBtn
                          onClick={() => handleAction(item._id, "verified")}
                          disabled={!!actionLoading[`verified_${item._id}`]}
                          loading={actionLoading[`verified_${item._id}`]}
                          icon={faCircleCheck} label="Verify Guarantor"
                          color="#fff" bg="linear-gradient(135deg,#22c55e,#16a34a)" border="transparent"
                        />
                        <input
                          type="text"
                          value={rejectReasons[item._id] || ""}
                          onChange={e => setRejectReasons(p => ({ ...p, [item._id]: e.target.value }))}
                          placeholder="Rejection reason (required)..."
                          style={{ ...INPUT, width: "100%", boxSizing: "border-box" }}
                        />
                        <ActionBtn
                          onClick={() => handleAction(item._id, "rejected")}
                          disabled={!!actionLoading[`rejected_${item._id}`]}
                          loading={actionLoading[`rejected_${item._id}`]}
                          icon={faCircleXmark} label="Reject Guarantor"
                          color="#f43f5e" bg="#fff1f2" border="#fecdd3"
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════
export function AdminVoiceVerifications() {
  return (
    <div style={{ animation: "admFadeUp .3s ease both" }}>
      <style>{`@keyframes admFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontFamily: T.font, fontSize: "18px", fontWeight: 800, color: T.text, margin: "0 0 4px" }}>Voice Verifications</h2>
        <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: 0 }}>
          Review scheduled and completed creator verification calls
        </p>
      </div>
      <VoiceVerificationsSection />
    </div>
  );
}

export function AdminAssetCollateral() {
  return (
    <div style={{ animation: "admFadeUp .3s ease both" }}>
      <style>{`@keyframes admFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontFamily: T.font, fontSize: "18px", fontWeight: 800, color: T.text, margin: "0 0 4px" }}>Asset Collateral</h2>
        <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: 0 }}>
          Review and approve creator asset submissions with proof files
        </p>
      </div>
      <AssetCollateralSection />
    </div>
  );
}

export function AdminGuarantors() {
  return (
    <div style={{ animation: "admFadeUp .3s ease both" }}>
      <style>{`@keyframes admFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontFamily: T.font, fontSize: "18px", fontWeight: 800, color: T.text, margin: "0 0 4px" }}>Guarantors</h2>
        <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: 0 }}>
          Call and verify guarantors submitted by creators seeking funding
        </p>
      </div>
      <GuarantorsSection />
    </div>
  );
}
