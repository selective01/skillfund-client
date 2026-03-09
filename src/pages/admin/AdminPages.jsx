import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users,
  ShieldCheck,
  ArrowDownToLine,
  AlertTriangle,
  Receipt,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  BadgeCheck,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  X,
} from "lucide-react";
import Layout from "../../components/layout/Layout";
import api from "../../utils/api";

// ─── Route → component map ────────────────────────────────────────────────────
export function AdminUsers()         { return <AdminPage section="users" />; }
export function AdminVerifications() { return <AdminPage section="verifications" />; }
export function AdminWithdrawals()   { return <AdminPage section="withdrawals" />; }
export function AdminDisputes()      { return <AdminPage section="disputes" />; }
export function AdminTransactions()  { return <AdminPage section="transactions" />; }

// ─── Shared helpers ───────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status, map }) {
  const cfg = map[status] || { label: status, color: "text-dark-300", bg: "bg-dark-600" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ─── Admin Page shell ─────────────────────────────────────────────────────────
function AdminPage({ section }) {
  const TITLES = {
    users:         "User Management",
    verifications: "KYC Verifications",
    withdrawals:   "Withdrawal Approvals",
    disputes:      "Disputes",
    transactions:  "Transactions",
  };
  const ICONS = {
    users:         Users,
    verifications: ShieldCheck,
    withdrawals:   ArrowDownToLine,
    disputes:      AlertTriangle,
    transactions:  Receipt,
  };
  const Icon = ICONS[section];

  return (
    <Layout title={TITLES[section]}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
          <Icon size={20} className="text-primary-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{TITLES[section]}</h2>
          <p className="text-dark-300 text-sm">Admin control panel</p>
        </div>
      </div>

      {section === "users"         && <UsersSection />}
      {section === "verifications" && <VerificationsSection />}
      {section === "withdrawals"   && <WithdrawalsSection />}
      {section === "disputes"      && <DisputesSection />}
      {section === "transactions"  && <TransactionsSection />}
    </Layout>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// USERS SECTION
// ══════════════════════════════════════════════════════════════════════════════
function UsersSection() {
  const navigate = useNavigate();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)     params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (planFilter !== "all") params.set("plan", planFilter);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users || res.data.data || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, planFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleBan = async (userId, isBanned) => {
    setActionLoading((p) => ({ ...p, [userId]: true }));
    try {
      const endpoint = isBanned
        ? `/admin/users/${userId}/unsuspend`
        : `/admin/users/${userId}/suspend`;
      await api.put(endpoint);
      toast.success(isBanned ? "User unsuspended" : "User suspended");
      setUsers((prev) =>
        prev.map((u) => u._id === userId ? { ...u, isSuspended: !isBanned } : u)
      );
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading((p) => ({ ...p, [userId]: false }));
    }
  };

  const totals = {
    all: users.length,
    creator: users.filter((u) => u.role === "creator").length,
    investor: users.filter((u) => u.role === "investor").length,
    banned: users.filter((u) => u.isSuspended).length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Users", value: totals.all, color: "text-primary-400", bg: "bg-primary-400/10" },
          { label: "Creators", value: totals.creator, color: "text-green-400", bg: "bg-green-400/10" },
          { label: "Investors", value: totals.investor, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Banned", value: totals.banned, color: "text-red-400", bg: "bg-red-400/10" },
        ].map((s) => (
          <div key={s.label} className="card py-3">
            <p className="text-dark-300 text-xs mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            style={{ paddingLeft: "2rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.875rem" }}
            className="input-field w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field text-sm py-2"
        >
          <option value="all">All Roles</option>
          <option value="creator">Creator</option>
          <option value="investor">Investor</option>
        </select>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="input-field text-sm py-2"
        >
          <option value="all">All Plans</option>
          <option value="basic">Basic</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500 bg-dark-700/50">
                {["User", "Role", "Plan", "Joined", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-dark-300 text-xs font-semibold uppercase tracking-wide px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-dark-600 animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-dark-600 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-dark-300 py-10 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-dark-600 hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-xs overflow-hidden flex-shrink-0">
                          {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium flex items-center gap-1">
                            {u.name}
                            {u.isVerified && <BadgeCheck size={12} className="text-green-400" />}
                          </p>
                          <p className="text-dark-400 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                        u.role === "investor" ? "bg-blue-500/10 text-blue-400" : "bg-primary-500/10 text-primary-400"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-dark-200 text-sm capitalize">{u.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-dark-300 text-xs">{formatDate(u.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        u.isSuspended
                          ? "bg-red-500/10 text-red-400"
                          : "bg-green-500/10 text-green-400"
                      }`}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/users/${u._id}`)}
                          className="p-1.5 rounded-lg bg-dark-600 hover:bg-dark-500 text-dark-300 hover:text-white transition-all"
                          title="View profile"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleBan(u._id, u.isSuspended)}
                          disabled={actionLoading[u._id]}
                          className={`p-1.5 rounded-lg transition-all disabled:opacity-60 ${
                            u.isSuspended
                              ? "bg-green-500/10 hover:bg-green-500/20 text-green-400"
                              : "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                          }`}
                          title={u.isSuspended ? "Unsuspend" : "Suspend"}
                        >
                          {actionLoading[u._id]
                            ? <Loader2 size={13} className="animate-spin" />
                            : u.isSuspended ? <CheckCircle size={13} /> : <Ban size={13} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VERIFICATIONS SECTION
// ══════════════════════════════════════════════════════════════════════════════
const VERIFICATION_STATUS_MAP = {
  pending:  { label: "Pending",  color: "text-yellow-400", bg: "bg-yellow-400/10" },
  approved: { label: "Approved", color: "text-green-400",  bg: "bg-green-400/10" },
  rejected: { label: "Rejected", color: "text-red-400",    bg: "bg-red-400/10" },
};

function VerificationsSection() {
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectReason, setRejectReason]   = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/verifications?status=${statusFilter}`);
      setItems(res.data.verifications || res.data.data || []);
    } catch {
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id, action, reason = "") => {
    setActionLoading((p) => ({ ...p, [`${action}_${id}`]: true }));
    try {
      const endpoint = action === "approved"
        ? `/admin/verifications/${id}/approve`
        : `/admin/verifications/${id}/reject`;
      await api.put(endpoint, { rejectionReason: reason });
      toast.success(`KYC ${action}!`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setExpandedId(null);
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading((p) => ({ ...p, [`${action}_${id}`]: false }));
    }
  };

  return (
    <div>
      {/* Status tabs */}
      <div className="flex gap-2 mb-5">
        {["pending", "approved", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              statusFilter === s ? "bg-primary-500 text-white" : "bg-dark-700 text-dark-300 hover:text-white border border-dark-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyAdmin message={`No ${statusFilter} verifications`} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const user = item.user || item;
            const isExpanded = expandedId === item._id;
            return (
              <div key={item._id} className="card border border-dark-500">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0 overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{user.name || "User"}</p>
                    <p className="text-dark-300 text-xs">{user.email} · {formatDate(item.createdAt)}</p>
                  </div>
                  <StatusBadge status={item.status} map={VERIFICATION_STATUS_MAP} />
                  <button className="text-dark-300 ml-2">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dark-600 space-y-4">
                    {/* ID document */}
                    {item.documentUrl && (
                      <div>
                        <p className="text-dark-300 text-xs font-semibold uppercase tracking-wide mb-2">Submitted Document</p>
                        <img
                          src={item.documentUrl}
                          alt="ID document"
                          className="max-w-sm rounded-xl border border-dark-500 object-cover"
                        />
                      </div>
                    )}

                    {/* User details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {[
                        { label: "Full Name", value: user.name },
                        { label: "Email", value: user.email },
                        { label: "Role", value: user.role },
                        { label: "Plan", value: user.plan },
                        { label: "Submitted", value: formatDate(item.createdAt) },
                        { label: "Type", value: item.verificationType || "ID" },
                      ].map((d) => (
                        <div key={d.label} className="bg-dark-700 rounded-xl p-3">
                          <p className="text-dark-400 text-xs mb-0.5">{d.label}</p>
                          <p className="text-white font-medium capitalize">{d.value || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    {item.status === "pending" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item._id, "approved")}
                            disabled={actionLoading[`approved_${item._id}`]}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
                          >
                            {actionLoading[`approved_${item._id}`] ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Approve KYC
                          </button>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason (required to reject)..."
                            className="input-field w-full text-sm mb-2"
                          />
                          <button
                            onClick={() => {
                              if (!rejectReason.trim()) { toast.error("Please enter a rejection reason"); return; }
                              handleAction(item._id, "rejected", rejectReason);
                            }}
                            disabled={actionLoading[`rejected_${item._id}`]}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-all disabled:opacity-60"
                          >
                            {actionLoading[`rejected_${item._id}`] ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Reject KYC
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// WITHDRAWALS SECTION
// ══════════════════════════════════════════════════════════════════════════════
const WITHDRAWAL_STATUS_MAP = {
  pending:   { label: "Pending",   color: "text-yellow-400", bg: "bg-yellow-400/10" },
  approved:  { label: "Approved",  color: "text-blue-400",   bg: "bg-blue-400/10" },
  completed: { label: "Completed", color: "text-green-400",  bg: "bg-green-400/10" },
  rejected:  { label: "Rejected",  color: "text-red-400",    bg: "bg-red-400/10" },
};

function WithdrawalsSection() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [expandedId, setExpandedId]     = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [rejectReason, setRejectReason]   = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/withdrawals?status=${statusFilter}`);
      setItems(res.data.withdrawals || res.data.data || []);
    } catch {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAction = async (id, action, reason = "") => {
    setActionLoading((p) => ({ ...p, [`${action}_${id}`]: true }));
    try {
      const endpoint = action === "approved"
        ? `/admin/withdrawals/${id}/approve`
        : `/admin/withdrawals/${id}/reject`;
      await api.put(endpoint, { rejectionReason: reason });
      toast.success(`Withdrawal ${action}!`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setExpandedId(null);
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading((p) => ({ ...p, [`${action}_${id}`]: false }));
    }
  };

  const totalPending = items
    .filter((i) => i.status === "pending")
    .reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  return (
    <div>
      {totalPending > 0 && (
        <div className="card border border-yellow-500/20 bg-yellow-500/5 mb-5 flex items-center gap-3">
          <DollarSign size={18} className="text-yellow-400" />
          <p className="text-yellow-400 text-sm font-medium">
            ${totalPending.toLocaleString()} pending across {items.filter((i) => i.status === "pending").length} requests
          </p>
        </div>
      )}

      {/* Status tabs */}
      <div className="flex gap-2 mb-5">
        {["pending", "approved", "completed", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              statusFilter === s ? "bg-primary-500 text-white" : "bg-dark-700 text-dark-300 hover:text-white border border-dark-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <ListSkeleton /> : items.length === 0 ? <EmptyAdmin message={`No ${statusFilter} withdrawals`} /> : (
        <div className="space-y-3">
          {items.map((item) => {
            const user = item.user || {};
            const isExpanded = expandedId === item._id;
            return (
              <div key={item._id} className="card border border-dark-500">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-dark-600 flex items-center justify-center text-dark-200 font-bold text-sm flex-shrink-0">
                    ${parseFloat(item.amount || 0).toFixed(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{user.name || "User"}</p>
                    <p className="text-dark-300 text-xs capitalize">{item.method || "bank"} · {formatDate(item.createdAt)}</p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-white font-bold">${parseFloat(item.amount || 0).toLocaleString()}</p>
                    <p className="text-dark-400 text-xs capitalize">{item.method}</p>
                  </div>
                  <StatusBadge status={item.status} map={WITHDRAWAL_STATUS_MAP} />
                  <button className="text-dark-300 ml-1">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dark-600 space-y-4">
                    {/* Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {[
                        { label: "Amount", value: `$${parseFloat(item.amount || 0).toLocaleString()}` },
                        { label: "Method", value: item.method },
                        { label: "Submitted", value: formatDate(item.createdAt) },
                        { label: "User Role", value: user.role },
                        { label: "User Plan", value: user.plan },
                        { label: "User Email", value: user.email },
                      ].map((d) => (
                        <div key={d.label} className="bg-dark-700 rounded-xl p-3">
                          <p className="text-dark-400 text-xs mb-0.5">{d.label}</p>
                          <p className="text-white font-medium capitalize">{d.value || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {/* Account details */}
                    {item.accountDetails && (
                      <div className="bg-dark-700 rounded-xl p-4">
                        <p className="text-dark-300 text-xs font-semibold uppercase tracking-wide mb-2">Payment Details</p>
                        {item.accountDetails.bankName && <p className="text-white text-sm">Bank: {item.accountDetails.bankName}</p>}
                        {item.accountDetails.accountNumber && <p className="text-dark-200 text-sm">Acc No: {item.accountDetails.accountNumber}</p>}
                        {item.accountDetails.accountName && <p className="text-dark-200 text-sm">Name: {item.accountDetails.accountName}</p>}
                        {item.accountDetails.walletAddress && <p className="text-dark-200 text-sm font-mono break-all">Wallet: {item.accountDetails.walletAddress}</p>}
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-dark-300 text-sm italic">Note: "{item.notes}"</p>
                    )}

                    {/* Actions */}
                    {item.status === "pending" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(item._id, "approved")}
                            disabled={actionLoading[`approved_${item._id}`]}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
                          >
                            {actionLoading[`approved_${item._id}`] ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Approve & Process
                          </button>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason..."
                            className="input-field w-full text-sm mb-2"
                          />
                          <button
                            onClick={() => {
                              if (!rejectReason.trim()) { toast.error("Please enter a rejection reason"); return; }
                              handleAction(item._id, "rejected", rejectReason);
                            }}
                            disabled={actionLoading[`rejected_${item._id}`]}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm font-semibold transition-all disabled:opacity-60"
                          >
                            {actionLoading[`rejected_${item._id}`] ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                    {item.status === "approved" && (
                      <button
                        onClick={() => handleAction(item._id, "completed")}
                        disabled={actionLoading[`completed_${item._id}`]}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
                      >
                        {actionLoading[`completed_${item._id}`] ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Mark as Completed
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// DISPUTES SECTION
// ══════════════════════════════════════════════════════════════════════════════
const DISPUTE_STATUS_MAP = {
  open:     { label: "Open",     color: "text-red-400",    bg: "bg-red-400/10" },
  under_review:{ label: "Reviewing",color: "text-yellow-400", bg: "bg-yellow-400/10" },
  resolved: { label: "Resolved", color: "text-green-400",  bg: "bg-green-400/10" },
  closed:   { label: "Closed",   color: "text-dark-300",   bg: "bg-dark-600" },
};

function DisputesSection() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [expandedId, setExpandedId]     = useState(null);
  const [resolution, setResolution]     = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/disputes?status=${statusFilter}`);
      setItems(res.data.disputes || res.data.data || []);
    } catch {
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleResolve = async (id, status) => {
    if (status === "resolved" && !resolution.trim()) {
      toast.error("Please provide a resolution note"); return;
    }
    setActionLoading((p) => ({ ...p, [id]: true }));
    try {
      await api.put(`/admin/disputes/${id}/resolve`, { status, resolution });
      toast.success(`Dispute ${status}!`);
      setItems((prev) => prev.filter((i) => i._id !== id));
      setExpandedId(null);
      setResolution("");
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading((p) => ({ ...p, [id]: false }));
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-5">
        {["open", "under_review", "resolved", "closed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              statusFilter === s ? "bg-primary-500 text-white" : "bg-dark-700 text-dark-300 hover:text-white border border-dark-500"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? <ListSkeleton /> : items.length === 0 ? <EmptyAdmin message={`No ${statusFilter} disputes`} /> : (
        <div className="space-y-3">
          {items.map((item) => {
            const isExpanded = expandedId === item._id;
            const creator  = item.filedBy    || {};
            const investor = item.filedAgainst || {};
            return (
              <div key={item._id} className="card border border-dark-500">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item._id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">
                      {item.reason || item.title || "Investment dispute"}
                    </p>
                    <p className="text-dark-300 text-xs">
                      {creator.name || "Creator"} vs {investor.name || "Investor"} · {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={item.status} map={DISPUTE_STATUS_MAP} />
                  <button className="text-dark-300 ml-2">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-dark-600 space-y-4">
                    {item.description && (
                      <div className="bg-dark-700 rounded-xl p-4">
                        <p className="text-dark-300 text-xs font-semibold uppercase tracking-wide mb-1">Description</p>
                        <p className="text-dark-200 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark-700 rounded-xl p-3">
                        <p className="text-dark-400 text-xs mb-1">Creator</p>
                        <p className="text-white font-medium text-sm">{creator.name || "—"}</p>
                        <p className="text-dark-400 text-xs">{creator.email}</p>
                      </div>
                      <div className="bg-dark-700 rounded-xl p-3">
                        <p className="text-dark-400 text-xs mb-1">Investor</p>
                        <p className="text-white font-medium text-sm">{investor.name || "—"}</p>
                        <p className="text-dark-400 text-xs">{investor.email}</p>
                      </div>
                    </div>

                    {(item.status === "open" || item.status === "under_review") && (
                      <div className="space-y-3">
                        <textarea
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="Resolution note / admin decision..."
                          rows={3}
                          className="input-field w-full resize-none text-sm"
                        />
                        <div className="flex gap-2">
                          {item.status === "open" && (
                            <button
                              onClick={() => handleResolve(item._id, "under_review")}
                              disabled={actionLoading[item._id]}
                              className="flex-1 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-semibold transition-all disabled:opacity-60"
                            >
                              Mark Reviewing
                            </button>
                          )}
                          <button
                            onClick={() => handleResolve(item._id, "resolved")}
                            disabled={actionLoading[item._id]}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-colors disabled:opacity-60"
                          >
                            {actionLoading[item._id] ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Resolve
                          </button>
                          <button
                            onClick={() => handleResolve(item._id, "closed")}
                            disabled={actionLoading[item._id]}
                            className="flex-1 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-500 text-dark-200 hover:text-white border border-dark-500 text-sm font-semibold transition-all disabled:opacity-60"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS SECTION
// ══════════════════════════════════════════════════════════════════════════════
function TransactionsSection() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch]         = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search) params.set("search", search);
      const res = await api.get(`/admin/transactions?${params}`);
      setItems(res.data.transactions || res.data.data || []);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  const totalVolume = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  const TYPE_MAP = {
    investment:  { color: "text-green-400",  bg: "bg-green-400/10",  label: "Investment" },
    withdrawal:  { color: "text-red-400",    bg: "bg-red-400/10",    label: "Withdrawal" },
    earning:     { color: "text-blue-400",   bg: "bg-blue-400/10",   label: "Earning" },
    fee:         { color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Fee" },
    refund:      { color: "text-purple-400", bg: "bg-purple-400/10", label: "Refund" },
  };

  return (
    <div>
      {/* Summary */}
      <div className="card mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center">
          <Activity size={18} className="text-primary-400" />
        </div>
        <div>
          <p className="text-dark-300 text-sm">Total Volume (filtered)</p>
          <p className="text-white font-bold text-xl">${totalVolume.toLocaleString()}</p>
        </div>
        <div className="ml-auto">
          <p className="text-dark-300 text-sm">{items.length} transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user..."
            style={{ paddingLeft: "2rem", paddingTop: "0.5rem", paddingBottom: "0.5rem", fontSize: "0.875rem" }}
            className="input-field w-full"
          />
        </div>
        <div className="flex gap-1.5">
          {["all", "investment", "withdrawal", "earning", "fee"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-all ${
                typeFilter === t ? "bg-primary-500 text-white" : "bg-dark-700 text-dark-300 hover:text-white border border-dark-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500 bg-dark-700/50">
                {["User", "Type", "Amount", "Reference", "Date"].map((h) => (
                  <th key={h} className="text-left text-dark-300 text-xs font-semibold uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-dark-600 animate-pulse">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-dark-600 rounded w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-dark-300 py-10 text-sm">No transactions found</td>
                </tr>
              ) : (
                items.map((item) => {
                  const user = item.user || {};
                  const tc = TYPE_MAP[item.type] || { color: "text-dark-300", bg: "bg-dark-600", label: item.type };
                  return (
                    <tr key={item._id} className="border-b border-dark-600 hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{user.name || "—"}</p>
                        <p className="text-dark-400 text-xs">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tc.bg} ${tc.color}`}>
                          {tc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-sm ${parseFloat(item.amount) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          ${Math.abs(parseFloat(item.amount) || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-300 text-xs font-mono">{item.reference || item._id?.slice(-8) || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-dark-300 text-xs">{formatDate(item.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Shared skeletons / empty states ─────────────────────────────────────────
function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-dark-600 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-dark-600 rounded w-1/3" />
            <div className="h-3 bg-dark-600 rounded w-1/4" />
          </div>
          <div className="h-6 w-16 bg-dark-600 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyAdmin({ message }) {
  return (
    <div className="card text-center py-12">
      <CheckCircle size={36} className="text-dark-400 mx-auto mb-3" />
      <p className="text-dark-300 text-sm">{message}</p>
    </div>
  );
}
