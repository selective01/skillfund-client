import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import useAdminAuthStore from "../../store/useAdminAuthStore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck, faCircleXmark, faClockRotateLeft,
  faChevronDown, faChevronUp, faCircleNotch,
  faMagnifyingGlass, faEye, faBan,
  faTriangleExclamation, faWallet,
  faReceipt, faCircleHalfStroke,
} from "@fortawesome/free-solid-svg-icons";

// ─── Design tokens ────────────────────────────────────────────────────────────
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

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Shared components ────────────────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background: T.bg, border: T.border, borderRadius: T.radius, boxShadow: T.shadow, ...style }}>
      {children}
    </div>
  );
}

function Badge({ label, color, bg, border }) {
  return (
    <span style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", background: bg, color, border: `1px solid ${border}`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function FilterTabs({ options, active, onChange }) {
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
  return (
    <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
      <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: T.muted, pointerEvents: "none" }} />
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...INPUT, paddingLeft: "34px", width: "100%", boxSizing: "border-box" }} />
    </div>
  );
}

function DetailGrid({ items }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: "8px", marginTop: "12px" }}>
      {items.map(d => (
        <div key={d.label} style={{ background: T.subtle, borderRadius: "10px", padding: "10px 12px", border: T.border }}>
          <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", margin: "0 0 3px" }}>{d.label}</p>
          <p style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: 0, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.value || "—"}</p>
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ onClick, disabled, loading, icon, label, color, bg, border }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "10px 16px", borderRadius: "10px", fontFamily: T.font, fontWeight: 700, fontSize: "13px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1, background: bg, color, border: `1px solid ${border}`, width: "100%", transition: "all .15s" }}>
      <FontAwesomeIcon icon={loading ? faCircleNotch : icon} spin={loading} style={{ fontSize: "13px" }} />
      {label}
    </button>
  );
}

function Skeleton({ rows = 5, cols = 5 }) {
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
  return (
    <Card style={{ textAlign: "center", padding: "56px 24px" }}>
      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "28px", color: "#d1d5db", marginBottom: "12px" }} />
      <p style={{ fontFamily: T.font, fontSize: "13px", color: T.muted, margin: 0 }}>{message}</p>
    </Card>
  );
}

// ─── Admin API helper ─────────────────────────────────────────────────────────
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

// ─── Route exports ────────────────────────────────────────────────────────────
export function AdminUsers()         { return <AdminPage section="users" />; }
export function AdminVerifications() { return <AdminPage section="verifications" />; }
export function AdminWithdrawals()   { return <AdminPage section="withdrawals" />; }
export function AdminDisputes()      { return <AdminPage section="disputes" />; }
export function AdminTransactions()  { return <AdminPage section="transactions" />; }

function AdminPage({ section }) {
  return (
    <div style={{ animation: "admFadeUp .3s ease both" }}>
      <style>{`@keyframes admFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {section === "users"         && <UsersSection />}
      {section === "verifications" && <VerificationsSection />}
      {section === "withdrawals"   && <WithdrawalsSection />}
      {section === "disputes"      && <DisputesSection />}
      {section === "transactions"  && <TransactionsSection />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════
function UsersSection() {
  const navigate = useNavigate();
  const adminApi = useAdminApi();
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("all");
  const [planFilter, setPlanFilter]   = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search)               p.set("search", search);
      if (roleFilter !== "all") p.set("role", roleFilter);
      if (planFilter !== "all") p.set("plan", planFilter);
      const res = await adminApi.get(`/admin/users?${p}`);
      setUsers(res.data.users || []);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  }, [adminApi, search, roleFilter, planFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleBan = async (userId, isBanned) => {
    setActionLoading(p => ({ ...p, [userId]: true }));
    try {
      await adminApi.put(`/admin/users/${userId}/${isBanned ? "unsuspend" : "suspend"}`);
      toast.success(isBanned ? "User unsuspended" : "User suspended");
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isSuspended: !isBanned } : u));
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [userId]: false })); }
  };

  const counts = {
    total:    users.length,
    creators: users.filter(u => u.role === "creator").length,
    investors:users.filter(u => u.role === "investor").length,
    banned:   users.filter(u => u.isSuspended).length,
  };

  const STATS = [
    { label: "Total",     value: counts.total,     color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff" },
    { label: "Creators",  value: counts.creators,  color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Investors", value: counts.investors, color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
    { label: "Banned",    value: counts.banned,    color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "14px" }}>
        {STATS.map(s => (
          <Card key={s.label} style={{ padding: "18px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: s.bg, border: `1px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
            </div>
            <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, fontWeight: 500, margin: "0 0 3px" }}>{s.label}</p>
            <p style={{ fontFamily: T.font, fontSize: "24px", fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or email..." />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={INPUT}>
          <option value="all">All Roles</option>
          <option value="creator">Creator</option>
          <option value="investor">Investor</option>
        </select>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} style={INPUT}>
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      {loading ? (
        <Skeleton rows={5} cols={6} />
      ) : users.length === 0 ? (
        <Empty message="No users found" />
      ) : (
        <Card style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: T.border, background: T.subtle }}>
                  {["User", "Role", "Plan", "Joined", "Status", "Actions"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", padding: "12px 16px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ borderBottom: T.border, transition: "background .1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.subtle}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#eef2ff", border: "1px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.font, fontWeight: 700, fontSize: "13px", color: "#6366f1", overflow: "hidden", flexShrink: 0 }}>
                          {u.avatar
                            ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0 }}>{u.name}</p>
                          <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge label={u.role} color={u.role === "investor" ? "#0ea5e9" : "#16a34a"} bg={u.role === "investor" ? "#f0f9ff" : "#f0fdf4"} border={u.role === "investor" ? "#bae6fd" : "#bbf7d0"} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: T.font, fontSize: "13px", color: "#475569", textTransform: "capitalize" }}>{u.plan}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontFamily: T.font, fontSize: "12px", color: T.muted }}>{formatDate(u.createdAt)}</span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge label={u.isSuspended ? "Suspended" : "Active"} color={u.isSuspended ? "#f43f5e" : "#16a34a"} bg={u.isSuspended ? "#fff1f2" : "#f0fdf4"} border={u.isSuspended ? "#fecdd3" : "#bbf7d0"} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button onClick={() => navigate(`/users/${u._id}`)} title="View"
                          style={{ width: "30px", height: "30px", borderRadius: "8px", background: T.subtle, border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FontAwesomeIcon icon={faEye} style={{ fontSize: "12px" }} />
                        </button>
                        <button onClick={() => handleBan(u._id, u.isSuspended)} disabled={!!actionLoading[u._id]}
                          title={u.isSuspended ? "Unsuspend" : "Suspend"}
                          style={{ width: "30px", height: "30px", borderRadius: "8px", cursor: actionLoading[u._id] ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: u.isSuspended ? "#f0fdf4" : "#fff1f2", border: `1px solid ${u.isSuspended ? "#bbf7d0" : "#fecdd3"}`, color: u.isSuspended ? "#16a34a" : "#f43f5e", opacity: actionLoading[u._id] ? 0.6 : 1 }}>
                          <FontAwesomeIcon icon={actionLoading[u._id] ? faCircleNotch : u.isSuspended ? faCircleCheck : faBan} spin={!!actionLoading[u._id]} style={{ fontSize: "12px" }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VERIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════
function VerificationsSection() {
  const adminApi = useAdminApi();
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [expandedId, setExpandedId]   = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectReasons, setRejectReasons] = useState({});
  const [search, setSearch]           = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/verifications?status=${statusFilter}`);
      setItems(res.data.verifications || []);
    } catch { toast.error("Failed to load verifications"); }
    finally { setLoading(false); }
  }, [adminApi, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id, action) => {
    const reason = rejectReasons[id] || "";
    if (action === "rejected" && !reason.trim()) { toast.error("Please enter a rejection reason"); return; }
    setActionLoading(p => ({ ...p, [`${action}_${id}`]: true }));
    try {
      await adminApi.put(`/admin/verifications/${id}/${action === "approved" ? "approve" : "reject"}`, { rejectionReason: reason });
      toast.success(`KYC ${action}!`);
      setItems(prev => prev.filter(i => i._id !== id));
      setExpandedId(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [`${action}_${id}`]: false })); }
  };

  const STATUS = {
    pending:  { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Pending",  icon: faClockRotateLeft },
    approved: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Approved", icon: faCircleCheck },
    rejected: { color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", label: "Rejected", icon: faCircleXmark },
  };

  const TABS = [
    { key: "pending",  label: "Pending",  color: "#f59e0b" },
    { key: "approved", label: "Approved", color: "#16a34a" },
    { key: "rejected", label: "Rejected", color: "#f43f5e" },
  ];

  const filtered = search
    ? items.filter(item => {
        const u = item.user || {};
        const s = search.toLowerCase();
        return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
      })
    : items;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search name or email..." />
        <FilterTabs options={TABS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? (
        <Skeleton rows={4} cols={4} />
      ) : filtered.length === 0 ? (
        <Empty message={`No ${statusFilter} verifications`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(item => {
            const u = item.user || {};
            const isExpanded = expandedId === item._id;
            const ss = STATUS[item.status] || STATUS.pending;
            return (
              <Card key={item._id} style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#eef2ff", border: "1px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.font, fontWeight: 700, fontSize: "14px", color: "#6366f1", overflow: "hidden", flexShrink: 0 }}>
                    {u.avatar
                      ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name || "User"}</p>
                    <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{u.email} · {formatDate(item.createdAt)}</p>
                  </div>
                  <span style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 500, color: "#64748b", background: T.subtle, border: "1px solid #e2e8f0", padding: "3px 8px", borderRadius: "8px", textTransform: "capitalize", flexShrink: 0 }}>
                    {(item.verificationType || "id").replace(/_/g, " ")}
                  </span>
                  <Badge label={ss.label} color={ss.color} bg={ss.bg} border={ss.border} />
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: T.muted, flexShrink: 0 }} />
                </div>

                {isExpanded && (
                  <div style={{ borderTop: T.border, padding: "16px" }}>
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "10px" }}>Submitted Documents</p>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {item.selfieUrl && (
                          <div>
                            <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, marginBottom: "4px" }}>SELFIE</p>
                            <a href={item.selfieUrl} target="_blank" rel="noreferrer">
                              <img src={item.selfieUrl} alt="Selfie" style={{ width: "100px", height: "100px", borderRadius: "50%", border: "2px solid #6366f1", objectFit: "cover", cursor: "pointer", display: "block" }} />
                            </a>
                          </div>
                        )}
                        {item.documentUrl && (
                          <div>
                            <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, marginBottom: "4px" }}>FRONT</p>
                            <a href={item.documentUrl} target="_blank" rel="noreferrer">
                              <img src={item.documentUrl} alt="Front" style={{ maxWidth: "220px", maxHeight: "140px", borderRadius: "10px", border: T.border, objectFit: "cover", cursor: "pointer", display: "block" }} />
                            </a>
                          </div>
                        )}
                        {item.documentBackUrl && (
                          <div>
                            <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, marginBottom: "4px" }}>BACK</p>
                            <a href={item.documentBackUrl} target="_blank" rel="noreferrer">
                              <img src={item.documentBackUrl} alt="Back" style={{ maxWidth: "220px", maxHeight: "140px", borderRadius: "10px", border: T.border, objectFit: "cover", cursor: "pointer", display: "block" }} />
                            </a>
                          </div>
                        )}
                        {!item.selfieUrl && !item.documentUrl && !item.documentBackUrl && (
                          <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted }}>No documents uploaded.</p>
                        )}
                      </div>
                    </div>

                    <DetailGrid items={[
                      { label: "Full Name", value: u.name },
                      { label: "Email",     value: u.email },
                      { label: "Role",      value: u.role },
                      { label: "Plan",      value: u.plan },
                      { label: "Submitted", value: formatDate(item.createdAt) },
                      { label: "Doc Type",  value: (item.verificationType || "ID").replace(/_/g, " ") },
                    ]} />

                    {item.status === "rejected" && item.rejectionReason && (
                      <div style={{ marginTop: "12px", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "10px", padding: "12px", display: "flex", gap: "8px" }}>
                        <FontAwesomeIcon icon={faCircleXmark} style={{ color: "#f43f5e", fontSize: "13px", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontFamily: T.font, fontSize: "12px", color: "#f43f5e", margin: 0 }}>{item.rejectionReason}</p>
                      </div>
                    )}

                    {item.status === "pending" && (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <ActionBtn
                          onClick={() => handleAction(item._id, "approved")}
                          disabled={!!actionLoading[`approved_${item._id}`]}
                          loading={actionLoading[`approved_${item._id}`]}
                          icon={faCircleCheck} label="Approve KYC"
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
                          icon={faCircleXmark} label="Reject KYC"
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

// ══════════════════════════════════════════════════════════════════════════════
// WITHDRAWALS
// ══════════════════════════════════════════════════════════════════════════════
function WithdrawalsSection() {
  const adminApi = useAdminApi();
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [expandedId, setExpandedId]   = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectReasons, setRejectReasons] = useState({});
  const [search, setSearch]           = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/withdrawals?status=${statusFilter}`);
      setItems(res.data.withdrawals || []);
    } catch { toast.error("Failed to load withdrawals"); }
    finally { setLoading(false); }
  }, [adminApi, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id, action) => {
    const reason = rejectReasons[id] || "";
    if (action === "rejected" && !reason.trim()) { toast.error("Please enter a rejection reason"); return; }
    setActionLoading(p => ({ ...p, [`${action}_${id}`]: true }));
    try {
      const endpoint = action === "approved" ? "approve" : action === "completed" ? "complete" : "reject";
      await adminApi.put(`/admin/withdrawals/${id}/${endpoint}`, { rejectionReason: reason });
      toast.success(`Withdrawal ${action}!`);
      setItems(prev => prev.filter(i => i._id !== id));
      setExpandedId(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [`${action}_${id}`]: false })); }
  };

  const TABS = [
    { key: "pending",   label: "Pending",   color: "#f59e0b" },
    { key: "approved",  label: "Approved",  color: "#6366f1" },
    { key: "completed", label: "Completed", color: "#16a34a" },
    { key: "rejected",  label: "Rejected",  color: "#f43f5e" },
  ];

  const STATUS = {
    pending:   { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Pending" },
    approved:  { color: "#6366f1", bg: "#eef2ff", border: "#e0e7ff", label: "Approved" },
    completed: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Completed" },
    rejected:  { color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", label: "Rejected" },
  };

  const totalPending = items
    .filter(i => i.status === "pending")
    .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const filtered = search
    ? items.filter(item => {
        const u = item.user || {};
        const s = search.toLowerCase();
        return u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s);
      })
    : items;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {totalPending > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: T.radius, padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <FontAwesomeIcon icon={faWallet} style={{ color: "#f59e0b", fontSize: "16px", flexShrink: 0 }} />
          <p style={{ fontFamily: T.font, fontSize: "13px", color: "#92400e", margin: 0, fontWeight: 600 }}>
            ${totalPending.toLocaleString()} pending across {items.filter(i => i.status === "pending").length} requests
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search user name or email..." />
        <FilterTabs options={TABS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? (
        <Skeleton rows={4} cols={4} />
      ) : filtered.length === 0 ? (
        <Empty message={`No ${statusFilter} withdrawals`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(item => {
            const user = item.user || {};
            const isExpanded = expandedId === item._id;
            const ss = STATUS[item.status] || STATUS.pending;
            return (
              <Card key={item._id} style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faWallet} style={{ fontSize: "14px", color: "#16a34a" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0 }}>{user.name || "User"}</p>
                    <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0, textTransform: "capitalize" }}>{item.method || "bank"} · {formatDate(item.createdAt)}</p>
                  </div>
                  <p style={{ fontFamily: T.font, fontSize: "15px", fontWeight: 800, color: T.text, margin: 0, flexShrink: 0 }}>
                    ${parseFloat(item.amount || 0).toLocaleString()}
                  </p>
                  <Badge label={ss.label} color={ss.color} bg={ss.bg} border={ss.border} />
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: T.muted, flexShrink: 0 }} />
                </div>

                {isExpanded && (
                  <div style={{ borderTop: T.border, padding: "16px" }}>
                    <DetailGrid items={[
                      { label: "Amount",     value: `$${parseFloat(item.amount || 0).toLocaleString()}` },
                      { label: "Net Amount", value: `$${parseFloat(item.netAmount || 0).toLocaleString()}` },
                      { label: "Method",     value: item.method },
                      { label: "Submitted",  value: formatDate(item.createdAt) },
                      { label: "User Role",  value: user.role },
                      { label: "User Email", value: user.email },
                    ]} />

                    {item.accountDetails && (
                      <div style={{ marginTop: "12px", background: T.subtle, borderRadius: "10px", padding: "14px", border: T.border }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "8px" }}>Payment Details</p>
                        {[
                          ["Bank",   item.accountDetails.bankName],
                          ["Acc No", item.accountDetails.accountNumber],
                          ["Name",   item.accountDetails.accountName],
                          ["Wallet", item.accountDetails.walletAddress],
                        ].filter(([, v]) => v).map(([k, v]) => (
                          <p key={k} style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: "0 0 4px" }}>
                            <span style={{ color: T.muted }}>{k}:</span> {v}
                          </p>
                        ))}
                      </div>
                    )}

                    {item.notes && (
                      <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted, fontStyle: "italic", marginTop: "8px" }}>"{item.notes}"</p>
                    )}

                    {item.status === "pending" && (
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <ActionBtn
                          onClick={() => handleAction(item._id, "approved")}
                          disabled={!!actionLoading[`approved_${item._id}`]}
                          loading={actionLoading[`approved_${item._id}`]}
                          icon={faCircleCheck} label="Approve & Process"
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

                    {item.status === "approved" && (
                      <div style={{ marginTop: "16px" }}>
                        <ActionBtn
                          onClick={() => handleAction(item._id, "completed")}
                          disabled={!!actionLoading[`completed_${item._id}`]}
                          loading={actionLoading[`completed_${item._id}`]}
                          icon={faCircleCheck} label="Mark as Completed"
                          color="#fff" bg="linear-gradient(135deg,#6366f1,#4338ca)" border="transparent"
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

// ══════════════════════════════════════════════════════════════════════════════
// DISPUTES
// ══════════════════════════════════════════════════════════════════════════════
function DisputesSection() {
  const adminApi = useAdminApi();
  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [expandedId, setExpandedId]   = useState(null);
  const [resolutions, setResolutions] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [search, setSearch]           = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get(`/admin/disputes?status=${statusFilter}`);
      setItems(res.data.disputes || []);
    } catch { toast.error("Failed to load disputes"); }
    finally { setLoading(false); }
  }, [adminApi, statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleResolve = async (id, status) => {
    const resolution = resolutions[id] || "";
    if (status === "resolved" && !resolution.trim()) { toast.error("Please provide a resolution note"); return; }
    setActionLoading(p => ({ ...p, [`${status}_${id}`]: true }));
    try {
      await adminApi.put(`/admin/disputes/${id}/resolve`, { status, resolution });
      toast.success(`Dispute ${status}!`);
      setItems(prev => prev.filter(i => i._id !== id));
      setExpandedId(null);
    } catch { toast.error("Action failed"); }
    finally { setActionLoading(p => ({ ...p, [`${status}_${id}`]: false })); }
  };

  const TABS = [
    { key: "open",         label: "Open",      color: "#f43f5e" },
    { key: "under_review", label: "Reviewing", color: "#f59e0b" },
    { key: "resolved",     label: "Resolved",  color: "#16a34a" },
    { key: "closed",       label: "Closed",    color: "#9ea3ae" },
  ];

  const STATUS = {
    open:         { color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", label: "Open" },
    under_review: { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Reviewing" },
    resolved:     { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Resolved" },
    closed:       { color: "#9ea3ae", bg: T.subtle,  border: "#e2e8f0", label: "Closed" },
  };

  const filtered = search
    ? items.filter(item => {
        const s = search.toLowerCase();
        return item.filedBy?.name?.toLowerCase().includes(s)
          || item.filedAgainst?.name?.toLowerCase().includes(s)
          || item.reason?.toLowerCase().includes(s)
          || item.title?.toLowerCase().includes(s);
      })
    : items;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by party name or reason..." />
        <FilterTabs options={TABS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading ? (
        <Skeleton rows={4} cols={3} />
      ) : filtered.length === 0 ? (
        <Empty message={`No ${statusFilter.replace("_", " ")} disputes`} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(item => {
            const isExpanded = expandedId === item._id;
            const creator  = item.filedBy      || {};
            const investor = item.filedAgainst || {};
            const ss = STATUS[item.status] || STATUS.open;
            return (
              <Card key={item._id} style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#fff1f2", border: "1px solid #fecdd3", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "14px", color: "#f43f5e" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.reason || item.title || "Investment dispute"}
                    </p>
                    <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>
                      {creator.name || "Creator"} vs {investor.name || "Investor"} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <Badge label={ss.label} color={ss.color} bg={ss.bg} border={ss.border} />
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: T.muted, flexShrink: 0 }} />
                </div>

                {isExpanded && (
                  <div style={{ borderTop: T.border, padding: "16px" }}>
                    {item.description && (
                      <div style={{ background: T.subtle, borderRadius: "10px", padding: "14px", border: T.border, marginBottom: "12px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>Description</p>
                        <p style={{ fontFamily: T.font, fontSize: "13px", color: T.text, margin: 0, lineHeight: 1.6 }}>{item.description}</p>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                      {[["Creator", creator], ["Investor", investor]].map(([role, person]) => (
                        <div key={role} style={{ background: T.subtle, borderRadius: "10px", padding: "12px", border: T.border }}>
                          <p style={{ fontFamily: T.font, fontSize: "10px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: "6px" }}>{role}</p>
                          <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: "0 0 2px" }}>{person.name || "—"}</p>
                          <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{person.email}</p>
                        </div>
                      ))}
                    </div>

                    {(item.status === "open" || item.status === "under_review") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <textarea
                          value={resolutions[item._id] || ""}
                          onChange={e => setResolutions(p => ({ ...p, [item._id]: e.target.value }))}
                          placeholder="Resolution note / admin decision..."
                          rows={3}
                          style={{ ...INPUT, width: "100%", boxSizing: "border-box", resize: "vertical", lineHeight: 1.5 }}
                        />
                        <div style={{ display: "grid", gridTemplateColumns: item.status === "open" ? "1fr 1fr 1fr" : "1fr 1fr", gap: "8px" }}>
                          {item.status === "open" && (
                            <ActionBtn
                              onClick={() => handleResolve(item._id, "under_review")}
                              disabled={!!actionLoading[`under_review_${item._id}`]}
                              loading={actionLoading[`under_review_${item._id}`]}
                              icon={faCircleHalfStroke} label="Mark Reviewing"
                              color="#f59e0b" bg="#fffbeb" border="#fde68a"
                            />
                          )}
                          <ActionBtn
                            onClick={() => handleResolve(item._id, "resolved")}
                            disabled={!!actionLoading[`resolved_${item._id}`]}
                            loading={actionLoading[`resolved_${item._id}`]}
                            icon={faCircleCheck} label="Resolve"
                            color="#fff" bg="linear-gradient(135deg,#22c55e,#16a34a)" border="transparent"
                          />
                          <ActionBtn
                            onClick={() => handleResolve(item._id, "closed")}
                            disabled={!!actionLoading[`closed_${item._id}`]}
                            loading={actionLoading[`closed_${item._id}`]}
                            icon={faCircleXmark} label="Close"
                            color="#64748b" bg={T.subtle} border="#e2e8f0"
                          />
                        </div>
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

// ══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ══════════════════════════════════════════════════════════════════════════════
function TransactionsSection() {
  const adminApi = useAdminApi();
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch]         = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (typeFilter !== "all") p.set("type", typeFilter);
      if (search) p.set("search", search);
      const res = await adminApi.get(`/admin/transactions?${p}`);
      setItems(res.data.transactions || []);
    } catch { toast.error("Failed to load transactions"); }
    finally { setLoading(false); }
  }, [adminApi, typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const totalVolume = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const TYPE = {
    investment: { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", label: "Investment" },
    withdrawal: { color: "#f43f5e", bg: "#fff1f2", border: "#fecdd3", label: "Withdrawal" },
    earning:    { color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd", label: "Earning" },
    fee:        { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", label: "Fee" },
    refund:     { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", label: "Refund" },
  };

  const TYPE_TABS = [
    { key: "all",        label: "All",        color: "#6366f1" },
    { key: "investment", label: "Investment", color: "#16a34a" },
    { key: "withdrawal", label: "Withdrawal", color: "#f43f5e" },
    { key: "earning",    label: "Earning",    color: "#0ea5e9" },
    { key: "fee",        label: "Fee",        color: "#f59e0b" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#eef2ff", border: "1px solid #e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FontAwesomeIcon icon={faReceipt} style={{ fontSize: "18px", color: "#6366f1" }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted, margin: "0 0 4px", fontWeight: 500 }}>Total Volume (filtered)</p>
          <p style={{ fontFamily: T.font, fontSize: "22px", fontWeight: 800, color: T.text, margin: 0, lineHeight: 1 }}>${totalVolume.toLocaleString()}</p>
        </div>
        <p style={{ fontFamily: T.font, fontSize: "12px", color: T.muted, margin: 0 }}>{items.length} transactions</p>
      </Card>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search user name or email..." />
        <FilterTabs options={TYPE_TABS} active={typeFilter} onChange={setTypeFilter} />
      </div>

      {loading ? (
        <Skeleton rows={6} cols={5} />
      ) : items.length === 0 ? (
        <Empty message="No transactions found" />
      ) : (
        <Card style={{ overflow: "hidden", padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: T.border, background: T.subtle }}>
                  {["User", "Type", "Amount", "Reference", "Date"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontFamily: T.font, fontSize: "11px", fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: ".06em", padding: "12px 16px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const user = item.user || {};
                  const tc = TYPE[item.type] || { color: T.muted, bg: T.subtle, border: "#e2e8f0", label: item.type || "Other" };
                  const amt = parseFloat(item.amount) || 0;
                  return (
                    <tr key={item._id} style={{ borderBottom: T.border, transition: "background .1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.subtle}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "12px 16px" }}>
                        <p style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 600, color: T.text, margin: 0 }}>{user.name || "—"}</p>
                        <p style={{ fontFamily: T.font, fontSize: "11px", color: T.muted, margin: 0 }}>{user.email}</p>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Badge label={tc.label} color={tc.color} bg={tc.bg} border={tc.border} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: T.font, fontSize: "13px", fontWeight: 700, color: amt >= 0 ? "#16a34a" : "#f43f5e" }}>
                          ${Math.abs(amt).toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "11px", color: T.muted }}>
                          {item.reference || item._id?.slice(-8) || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: T.font, fontSize: "12px", color: T.muted }}>{formatDate(item.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
