import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faUserCheck, faUserXmark, faMessage, faClock,
  faCheck, faXmark, faLocationDot, faCircleCheck, faMagnifyingGlass,
  faUserMinus, faArrowUpRightFromSquare, faCircleNotch, faPlugCircleBolt,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

const TABS = [
  { key: "connections", label: "Connections",  faIcon: faUsers,                 color: "#22c55e" },
  { key: "received",    label: "Requests",     faIcon: faClock,                 color: "#f59e0b" },
  { key: "sent",        label: "Sent",         faIcon: faArrowUpRightFromSquare, color: "#3b82f6" },
];

// ── DS tokens ──────────────────────────────────────────────────────────────────
const DS = {
  bg:     "#040806",
  card:   "#070d08",
  input:  "#0a1209",
  border: "#2d5235",
  text:   { primary: "#fff", secondary: "#9ca3af", muted: "#6b7280", dim: "#4a5568", ghost: "#2d4a31" },
  accent: "#22c55e",
};

const CARD_THEMES = [
  { bg: "linear-gradient(135deg,#0f2e10,#091e09)", border: "rgba(34,197,94,0.30)",   accent: "#22c55e"  },
  { bg: "linear-gradient(135deg,#0f2244,#091830)", border: "rgba(59,130,246,0.30)",  accent: "#3b82f6"  },
  { bg: "linear-gradient(135deg,#220f44,#180930)", border: "rgba(168,85,247,0.30)",  accent: "#a855f7"  },
  { bg: "linear-gradient(135deg,#0f3d38,#092820)", border: "rgba(20,184,166,0.30)",  accent: "#14b8a6"  },
  { bg: "linear-gradient(135deg,#3d0f22,#280918)", border: "rgba(244,63,94,0.15)",   accent: "#f43f5e"  },
  { bg: "linear-gradient(135deg,#3d2200,#2a1600)", border: "rgba(245,158,11,0.30)",  accent: "#f59e0b"  },
];

export default function Connections() {
  useNotificationReadOnView();
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const [activeTab, setActiveTab] = useState("connections");
  const [search, setSearch]       = useState("");
  const [connections, setConnections] = useState([]);
  const [received, setReceived]       = useState([]);
  const [sent, setSent]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get("/connections");
      const data = res.data;
      if (data.connections !== undefined) {
        setConnections(data.connections || []);
        setReceived(data.received || []);
        setSent(data.sent || []);
      } else {
        const all = data.data || data || [];
        setConnections(all.filter(c => c.status === "accepted"));
        const myId = user?._id || user?.id;
        setReceived(all.filter(c => c.status === "pending" && String(c.receiver?._id) === String(myId)));
        setSent(all.filter(c => c.status === "pending" && String(c.sender?._id) === String(myId)));
      }
    } catch {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const handleAccept = async (connectionId) => {
    setActionLoading(p => ({ ...p, [`accept_${connectionId}`]: true }));
    try {
      await api.post("/connections/accept", { connectionId });
      toast.success("Connection accepted!");
      const accepted = received.find(c => c._id === connectionId);
      if (accepted) {
        setReceived(p => p.filter(c => c._id !== connectionId));
        setConnections(p => [...p, { ...accepted, status: "accepted" }]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept");
    } finally {
      setActionLoading(p => ({ ...p, [`accept_${connectionId}`]: false }));
    }
  };

  const handleReject = async (connectionId, isSent = false) => {
    setActionLoading(p => ({ ...p, [`reject_${connectionId}`]: true }));
    try {
      await api.post("/connections/reject", { connectionId });
      toast.success(isSent ? "Request cancelled" : "Request declined");
      if (isSent) setSent(p => p.filter(c => c._id !== connectionId));
      else setReceived(p => p.filter(c => c._id !== connectionId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to decline");
    } finally {
      setActionLoading(p => ({ ...p, [`reject_${connectionId}`]: false }));
    }
  };

  const handleRemove = async (connectionId) => {
    if (!window.confirm("Remove this connection?")) return;
    setActionLoading(p => ({ ...p, [`remove_${connectionId}`]: true }));
    try {
      await api.post("/connections/reject", { connectionId });
      toast.success("Connection removed");
      setConnections(p => p.filter(c => c._id !== connectionId));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove");
    } finally {
      setActionLoading(p => ({ ...p, [`remove_${connectionId}`]: false }));
    }
  };

  const getOtherUser = conn => {
    const myId = user?._id || user?.id;
    if (conn.sender?._id && conn.sender._id !== myId) return conn.sender;
    if (conn.receiver?._id && conn.receiver._id !== myId) return conn.receiver;
    if (conn.user) return conn.user;
    return { _id: String(conn.sender?._id) === String(myId) ? conn.receiver?._id : conn.sender?._id, name: conn.name || "User", avatar: conn.avatar || null, role: conn.role || null, isVerified: conn.isVerified || false, profile: conn.profile || null };
  };

  const filterBySearch = list => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(c => {
      const o = getOtherUser(c);
      return o.name?.toLowerCase().includes(q) || o.profile?.skill?.toLowerCase().includes(q) || o.profile?.location?.toLowerCase().includes(q);
    });
  };

  const tabData = {
    connections: filterBySearch(connections),
    received:    filterBySearch(received),
    sent:        filterBySearch(sent),
  };
  const pendingCount = received.length;

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .cn-in { animation: fadeUp 0.35s ease forwards; opacity: 0; }
        .cn-search { background: #0a1209; border: 1px solid #1a2e1d; color: #fff; border-radius: 14px; padding: 11px 12px 11px 2.4rem; width: 100%; font-family: 'DM Sans',sans-serif; font-size: 14px; transition: border-color 0.2s; }
        .cn-search::placeholder { color: #2d4a31; }
        .cn-search:focus { outline: none; border-color: rgba(34,197,94,0.4); box-shadow: 0 0 0 3px rgba(34,197,94,0.07); }
      `}</style>

      {/* ── Header ── */}
        <div className="cn-in" style={{ animationDelay: "0s" }}>
          <div className="relative rounded-3xl overflow-hidden p-6" style={{ background: "linear-gradient(135deg,#0f2e10,#071a0b,#040806)", border: "1px solid rgba(34,197,94,0.35)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%)", filter: "blur(20px)" }} />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="relative flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FontAwesomeIcon icon={faPlugCircleBolt} style={{ fontSize: "12px", color: "#22c55e" }} />
                  <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "#22c55e" }}>NETWORK</span>
                </div>
                <h1 className="font-black text-white mb-1" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}>
                  My Connections
                </h1>
                <p style={{ color: "#6b7280", fontFamily: "'DM Sans',sans-serif", fontSize: "14px" }}>
                  {connections.length} connection{connections.length !== 1 ? "s" : ""}
                  {pendingCount > 0 && (
                    <span style={{ color: "#f59e0b", fontWeight: 600, marginLeft: "8px" }}>
                      · {pendingCount} pending request{pendingCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs + Search ── */}
        <div className="cn-in flex flex-col sm:flex-row sm:items-center gap-3" style={{ animationDelay: ".06s" }}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#070d08", border: "1px solid #1a2e1d" }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.key;
              const count = tab.key === "received" ? received.length : tab.key === "sent" ? sent.length : connections.length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    fontFamily: "'Syne',sans-serif",
                    background:  isActive ? `${tab.color}18` : "transparent",
                    border:      isActive ? `1px solid ${tab.color}33` : "1px solid transparent",
                    color:       isActive ? tab.color : "#4a5568",
                  }}
                >
                  <FontAwesomeIcon icon={tab.faIcon} style={{ fontSize: "12px" }} />
                  {tab.label}
                  {count > 0 && (
                    <span className="text-xs font-black px-1.5 py-0.5 rounded-full" style={{
                      fontFamily: "'Fraunces',serif",
                      background: isActive ? `${tab.color}22` : "rgba(255,255,255,0.18)",
                      color:      isActive ? tab.color : "#4a5568",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <FontAwesomeIcon icon={faMagnifyingGlass} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: "#2d4a31", fontSize: "13px", pointerEvents: "none" }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="cn-search" />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#4a5568" }}>
                <FontAwesomeIcon icon={faXmark} style={{ fontSize: "12px" }} />
              </button>
            )}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="cn-in" style={{ animationDelay: ".12s" }}>
          {loading ? (
            <ConnectionsSkeleton />
          ) : (
            <>
              {activeTab === "connections" && (
                tabData.connections.length === 0
                  ? <EmptyState icon={faUsers} title={search ? "No results found" : "No connections yet"} message={search ? "Try a different search term." : user?.role === "investor" ? "Browse creators and send connection requests." : "When investors connect with you, they'll appear here."} action={user?.role === "investor" && !search ? { label: "Browse Creators", path: "/browse" } : null} navigate={navigate} />
                  : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{tabData.connections.map((conn, i) => { const other = getOtherUser(conn); return <ConnectionCard key={conn._id} person={other} connectionId={conn._id} type="connected" theme={CARD_THEMES[i % CARD_THEMES.length]} actionLoading={actionLoading} onRemove={handleRemove} onMessage={() => navigate(`/messages?userId=${other._id}`)} onViewProfile={() => navigate(`/profile/${other._id}`)} currentUserRole={user?.role} />; })}</div>
              )}
              {activeTab === "received" && (
                tabData.received.length === 0
                  ? <EmptyState icon={faClock} iconColor="#f59e0b" title={search ? "No results found" : "No pending requests"} message={search ? "Try a different search term." : "Connection requests will appear here."} />
                  : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{tabData.received.map((conn, i) => { const other = getOtherUser(conn); return <ConnectionCard key={conn._id} person={other} connectionId={conn._id} type="received" theme={CARD_THEMES[i % CARD_THEMES.length]} actionLoading={actionLoading} onAccept={handleAccept} onReject={id => handleReject(id, false)} onViewProfile={() => navigate(`/profile/${other._id}`)} currentUserRole={user?.role} />; })}</div>
              )}
              {activeTab === "sent" && (
                tabData.sent.length === 0
                  ? <EmptyState icon={faArrowUpRightFromSquare} iconColor="#3b82f6" title={search ? "No results found" : "No sent requests"} message={search ? "Try a different search term." : "Requests you've sent will appear here."} action={user?.role === "investor" && !search ? { label: "Browse Creators", path: "/browse" } : null} navigate={navigate} />
                  : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{tabData.sent.map((conn, i) => { const other = getOtherUser(conn); return <ConnectionCard key={conn._id} person={other} connectionId={conn._id} type="sent" theme={CARD_THEMES[i % CARD_THEMES.length]} actionLoading={actionLoading} onReject={id => handleReject(id, true)} onViewProfile={() => navigate(`/profile/${other._id}`)} currentUserRole={user?.role} />; })}</div>
              )}
            </>
          )}
        </div>
    </div>
  );
}

function ConnectionCard({ person, connectionId, type, theme, actionLoading, onAccept, onReject, onRemove, onMessage, onViewProfile, currentUserRole }) {
  const name     = person?.name || "User";
  const avatar   = person?.avatar || null;
  const isVerified = person?.isVerified || false;
  const role     = person?.role || null;
  const skill    = person?.profile?.skill || person?.skill || null;
  const location = person?.profile?.location || person?.location || null;
  const fundingGoal = person?.profile?.fundingGoal || null;
  const profitShare = person?.profile?.profitSharePercentage || null;
  const investmentBudget = person?.profile?.investmentBudget || null;

  const acceptLoading = actionLoading[`accept_${connectionId}`];
  const rejectLoading = actionLoading[`reject_${connectionId}`];
  const removeLoading = actionLoading[`remove_${connectionId}`];

  return (
    <div className="rounded-2xl p-5 space-y-4 transition-all duration-200 hover:-translate-y-0.5" style={{ background: theme.bg, border: `1px solid ${theme.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.35)" }}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onViewProfile}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-base overflow-hidden flex-shrink-0" style={{ background: `${theme.accent}18`, border: `1.5px solid ${theme.accent}33`, color: theme.accent }}>
            {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm" style={{ fontFamily: "'Syne',sans-serif" }}>{name}</span>
              {isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: "#22c55e" }} />}
            </div>
            {role && (
              <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-full" style={{ fontFamily: "'Syne',sans-serif", background: `${theme.accent}15`, color: theme.accent }}>
                {role}
              </span>
            )}
          </div>
        </div>
        {type === "sent" && (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ fontFamily: "'Syne',sans-serif", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)", color: "#f59e0b" }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: "9px" }} /> Pending
          </span>
        )}
        {type === "connected" && (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ fontFamily: "'Syne',sans-serif", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", color: "#22c55e" }}>
            <FontAwesomeIcon icon={faUserCheck} style={{ fontSize: "9px" }} /> Connected
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1.5">
        {skill && <p className="text-xs flex items-center gap-1.5" style={{ color: "#6b7280" }}><span style={{ color: theme.accent }}>⚡</span>{skill}</p>}
        {location && <p className="text-xs flex items-center gap-1.5" style={{ color: "#6b7280" }}><FontAwesomeIcon icon={faLocationDot} style={{ fontSize: "10px", color: "#4a5568" }} />{location}</p>}
        {role === "creator" && fundingGoal && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: "#6b7280" }}>
            <span style={{ color: "#22c55e" }}>💰</span> Goal: ${Number(fundingGoal).toLocaleString()}
            {profitShare && <span style={{ color: theme.accent, marginLeft: "4px" }}>· {profitShare}% share</span>}
          </p>
        )}
        {role === "investor" && investmentBudget && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: "#6b7280" }}><span style={{ color: "#3b82f6" }}>📊</span> Budget: ${Number(investmentBudget).toLocaleString()}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {type === "received" && (
          <>
            <button onClick={() => onAccept(connectionId)} disabled={acceptLoading || rejectLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60 hover:scale-[1.02]" style={{ fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}>
              {acceptLoading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "12px" }} /> : <><FontAwesomeIcon icon={faCheck} style={{ fontSize: "11px" }} /> Accept</>}
            </button>
            <button onClick={() => onReject(connectionId)} disabled={rejectLoading || acceptLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60" style={{ fontFamily: "'Syne',sans-serif", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>
              {rejectLoading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "12px" }} /> : <><FontAwesomeIcon icon={faXmark} style={{ fontSize: "11px" }} /> Decline</>}
            </button>
          </>
        )}
        {type === "sent" && (
          <button onClick={() => onReject(connectionId)} disabled={rejectLoading} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-60" style={{ fontFamily: "'Syne',sans-serif", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#f87171" }}>
            {rejectLoading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "12px" }} /> : <><FontAwesomeIcon icon={faUserXmark} style={{ fontSize: "11px" }} /> Cancel</>}
          </button>
        )}
        {type === "connected" && (
          <>
            <button onClick={onMessage} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]" style={{ fontFamily: "'Syne',sans-serif", background: `${theme.accent}18`, border: `1px solid ${theme.accent}33`, color: theme.accent }}>
              <FontAwesomeIcon icon={faMessage} style={{ fontSize: "11px" }} /> Message
            </button>
            {currentUserRole === "investor" && (
              <button onClick={onViewProfile} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ background: "rgba(255,255,255,0.18)", border: "1px solid #1a2e1d", color: "#6b7280" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${theme.accent}33`; e.currentTarget.style.color = theme.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#2d5235"; e.currentTarget.style.color = "#6b7280"; }}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize: "11px" }} />
              </button>
            )}
            <button onClick={() => onRemove(connectionId)} disabled={removeLoading} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-60" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.30)", color: "#f87171" }}>
              {removeLoading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "11px" }} /> : <FontAwesomeIcon icon={faUserMinus} style={{ fontSize: "11px" }} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ConnectionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 animate-pulse space-y-4" style={{ background: "#070d08", border: "1px solid #1a2e1d" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl" style={{ background: "#2d5235" }} />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 rounded-full w-1/2" style={{ background: "#2d5235" }} />
              <div className="h-3 rounded-full w-1/3" style={{ background: "#2d5235" }} />
            </div>
          </div>
          <div className="h-3 rounded-full w-full" style={{ background: "#2d5235" }} />
          <div className="h-3 rounded-full w-2/3" style={{ background: "#2d5235" }} />
          <div className="flex gap-2">
            <div className="flex-1 h-9 rounded-xl" style={{ background: "#2d5235" }} />
            <div className="w-9 h-9 rounded-xl" style={{ background: "#2d5235" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon, iconColor = "#4a5568", title, message, action, navigate }) {
  return (
    <div className="rounded-2xl p-16 text-center" style={{ background: "#070d08", border: "1px solid #1a2e1d" }}>
      <FontAwesomeIcon icon={icon} style={{ fontSize: "36px", color: iconColor, display: "block", margin: "0 auto 12px" }} />
      <h3 className="font-black text-white mb-2" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.1rem" }}>{title}</h3>
      <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "#6b7280", fontFamily: "'DM Sans',sans-serif" }}>{message}</p>
      {action && (
        <button onClick={() => navigate(action.path)} className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]" style={{ fontFamily: "'Syne',sans-serif", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000" }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
