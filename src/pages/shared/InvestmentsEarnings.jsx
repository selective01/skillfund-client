import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp, faWallet, faUsers, faHeartPulse, faDollarSign,
  faCalendarDays, faCircleCheck, faClock, faCircleExclamation,
  faChevronDown, faChevronUp, faArrowUpRightFromSquare,
  faCircleNotch, faChartBar, faPlus, faFileLines, faFilter,
  faCircleXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import useAuthStore from "../../store/authStore";
import useThemeStore from "../../store/useThemeStore";
import api from "../../utils/api";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:    { label:"Active",    color:"#22c55e", bg:"rgba(34,197,94,0.08)",    border:"rgba(34,197,94,0.35)",    faIcon:faHeartPulse   },
  pending:   { label:"Pending",   color:"#f59e0b", bg:"rgba(245,158,11,0.08)",   border:"rgba(245,158,11,0.35)",   faIcon:faClock        },
  completed: { label:"Completed", color:"#60a5fa", bg:"rgba(59,130,246,0.08)",   border:"rgba(59,130,246,0.35)",   faIcon:faCircleCheck  },
  disputed:  { label:"Disputed",  color:"#f87171", bg:"rgba(239,68,68,0.08)",    border:"rgba(239,68,68,0.35)",    faIcon:faCircleExclamation },
  cancelled: { label:"Cancelled", color:"var(--text-muted)", bg:"rgba(255,255,255,0.18)",  border:"rgba(255,255,255,0.2)", faIcon:faCircleXmark  },
};
const PIE_COLORS = ["#22c55e","#3b82f6","#a855f7","#f59e0b","#ef4444","#06b6d4"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const CHART_STYLE = { contentStyle:{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"12px" }, labelStyle:{ color:"var(--text-primary)", fontFamily:"'Syne',sans-serif", fontSize:"12px" } };

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = val => { const n = parseFloat(val)||0; return n>=1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`; };
const nowMY = () => { const d = new Date(); return { month: d.getMonth()+1, year: d.getFullYear() }; };

// ── Shared UI ──────────────────────────────────────────────────────────────────
const DS_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .ie-in { animation: fadeUp 0.35s ease forwards; opacity:0; }
  .ie-inp { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:12px; padding:10px 14px; width:100%; font-family:'DM Sans',sans-serif; font-size:14px; transition:border-color .2s; }
  .ie-inp::placeholder { color:#5a8a63; }
  .ie-inp:focus { outline:none; border-color:rgba(34,197,94,0.4); box-shadow:0 0 0 3px rgba(34,197,94,0.07); }
  .ie-ta { background:#0a1209; border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:12px; padding:10px 14px; width:100%; font-family:'DM Sans',sans-serif; font-size:14px; resize:none; transition:border-color .2s; }
  .ie-ta:focus { outline:none; border-color:rgba(34,197,94,0.4); box-shadow:0 0 0 3px rgba(34,197,94,0.07); }
`;

const CARD_THEMES = [
  { bg:"var(--card-green)", border:"rgba(34,197,94,0.30)",  accent:"#22c55e" },
  { bg:"var(--card-blue)",  border:"rgba(59,130,246,0.30)", accent:"#3b82f6" },
  { bg:"var(--card-purple)",border:"rgba(168,85,247,0.30)", accent:"#a855f7" },
  { bg:"var(--card-amber)", border:"rgba(245,158,11,0.30)", accent:"#f59e0b" },
];

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

function PageHeader({ title, subtitle, accentLabel, accentIcon }) {
  const T = useT();
  return (
    <div className="ie-in relative rounded-3xl p-6 mb-6 overflow-hidden" style={{ background:"linear-gradient(135deg,var(--card-green-start,#0f2e10),var(--card-green-mid,#071a0b),var(--bg,#040806))", border:"1px solid rgba(34,197,94,0.35)", boxShadow: T.shadow }}>
      <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none" style={{ background:"radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%)", filter:"blur(20px)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          {accentIcon && <FontAwesomeIcon icon={accentIcon} style={{ fontSize:"11px", color:"#22c55e" }} />}
          <span className="text-xs font-bold tracking-widest" style={{ fontFamily:"'Syne',sans-serif", color:"#22c55e" }}>{accentLabel}</span>
        </div>
        <h1 className="font-black text-white" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(1.4rem,2.5vw,1.9rem)" }}>{title}</h1>
        <p style={{ color:"var(--text-muted)", fontFamily:"'DM Sans',sans-serif", fontSize:"14px", marginTop:"4px" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function Section({ title, accentColor="#22c55e", children, action }) {
  return (
    <div className="rounded-2xl p-6" style={{ background:"var(--bg-card)", border:`1px solid ${accentColor}18` }}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background:`linear-gradient(to bottom,${accentColor},${accentColor}88)` }} />
          <h3 className="font-black text-white" style={{ fontFamily:"'Fraunces',serif", fontSize:"1.05rem" }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function StatCard({ label, value, faIcon, iconColor, theme }) {
  const T = useT();
  return (
    <div className="rounded-2xl p-5" style={{ background:theme.bg, border:`1px solid ${theme.border}`, boxShadow: T.shadow }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold tracking-widest" style={{ fontFamily:"'Syne',sans-serif", color:"var(--text-muted)" }}>{label.toUpperCase()}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:`${iconColor}18` }}>
          <FontAwesomeIcon icon={faIcon} style={{ fontSize:"14px", color:iconColor }} />
        </div>
      </div>
      <p className="font-black text-white" style={{ fontFamily:"'Fraunces',serif", fontSize:"1.8rem", lineHeight:1 }}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontFamily:"'Syne',sans-serif", background:sc.bg, color:sc.color, border:`1px solid ${sc.border}` }}>
      <FontAwesomeIcon icon={sc.faIcon} style={{ fontSize:"10px" }} />{sc.label}
    </span>
  );
}

function ViewToggle({ view, setView, isCreator }) {
  const tabs = [
    { key: isCreator ? "investments" : "investments", label: isCreator ? "Investments" : "Portfolio", faIcon: faArrowTrendUp },
    { key: "earnings", label: "Earnings", faIcon: faChartBar },
  ];
  return (
    <div className="flex gap-1 p-1 rounded-2xl" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
      {tabs.map(t => {
        const isActive = view === t.key;
        return (
          <button key={t.key} onClick={() => setView(t.key)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all" style={{ fontFamily:"'Syne',sans-serif", background:isActive?"rgba(34,197,94,0.12)":"transparent", border:isActive?"1px solid rgba(34,197,94,0.25)":"1px solid transparent", color:isActive?"#22c55e":"#9ca3af" }}>
            <FontAwesomeIcon icon={t.faIcon} style={{ fontSize:"12px" }} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({length:4}).map((_,i) => (
        <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
          <div className="h-3 rounded-full w-1/2 mb-5" style={{ background:"rgba(255,255,255,0.2)" }} />
          <div className="h-8 rounded-full w-1/3" style={{ background:"rgba(255,255,255,0.2)" }} />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({length:3}).map((_,i) => (
        <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background:"var(--bg-input)", border:"1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl" style={{ background:"rgba(255,255,255,0.2)" }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 rounded-full w-1/3" style={{ background:"rgba(255,255,255,0.2)" }} />
              <div className="h-3 rounded-full w-1/4" style={{ background:"rgba(255,255,255,0.2)" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyBox({ faIcon, iconColor="#9ca3af", title, message, btnLabel, onBtnClick }) {
  return (
    <div className="text-center py-14">
      <FontAwesomeIcon icon={faIcon} style={{ fontSize:"34px", color:iconColor, display:"block", margin:"0 auto 12px" }} />
      <h4 className="font-black text-white mb-1.5" style={{ fontFamily:"'Fraunces',serif", fontSize:"1.05rem" }}>{title}</h4>
      <p className="text-sm mb-5 max-w-xs mx-auto" style={{ color:"var(--text-muted)", fontFamily:"'DM Sans',sans-serif" }}>{message}</p>
      {btnLabel && <button onClick={onBtnClick} className="px-6 py-2.5 rounded-xl font-bold text-sm" style={{ fontFamily:"'Syne',sans-serif", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000" }}>{btnLabel}</button>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function InvestmentsEarnings() {
  useNotificationReadOnView();
  const { user } = useAuthStore();
  return user?.role === "investor" ? <InvestorView /> : <CreatorView />;
}

// ══════════════════════════════════════════════════════════════════════════════
// INVESTOR VIEW
// ══════════════════════════════════════════════════════════════════════════════
function InvestorView() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expandedId, setExpandedId]   = useState(null);
  const [activeTab, setActiveTab]     = useState("all");
  const [view, setView]               = useState(pathname === "/earnings" ? "earnings" : "investments");

  useEffect(() => { setView(pathname === "/earnings" ? "earnings" : "investments"); }, [pathname]);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/investments/my-investments");
      const raw = res.data.investments || res.data.data || [];
      const withE = await Promise.all(raw.map(async inv => {
        try { const er = await api.get(`/investments/${inv._id}/earnings`); return { ...inv, earnings: er.data.earnings||[] }; }
        catch { return { ...inv, earnings:[] }; }
      }));
      setInvestments(withE);
    } catch { toast.error("Failed to load investments"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  const monthlyReturnData = MONTHS.map((month,i) => ({
    month,
    amount: investments.reduce((sum,inv) => { const e=(inv.earnings||[]).find(e=>e.month===i+1); return sum+(parseFloat(e?.investorShare)||0); },0),
  }));
  const pieData = investments.filter(i=>i.status==="active").map(i=>({ name:i.creator?.name||i.creatorName||"Creator", value:parseFloat(i.amount)||0 }));
  const filtered = activeTab==="all" ? investments : investments.filter(i=>i.status===activeTab);
  const allEarnings = investments.flatMap(inv=>(inv.earnings||[]).map(e=>({ ...e, investmentId:inv._id, creatorName:inv.creator?.name||inv.creatorName||"Creator", creatorAvatar:inv.creator?.avatar||null, profitSharePercentage:inv.profitSharePercentage }))).sort((a,b)=>b.year!==a.year?b.year-a.year:b.month-a.month);
  const totalInvested = investments.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
  const totalReturns  = investments.reduce((s,i)=>s+(parseFloat(i.totalReturnsReceived)||0),0);
  const activeCount   = investments.filter(i=>i.status==="active").length;
  const monthlyProfit = investments.filter(i=>i.status==="active").reduce((s,i)=>s+(parseFloat(i.amount)*(parseFloat(i.profitSharePercentage||0)))/100,0);
  const totalEarned   = allEarnings.reduce((s,e)=>s+(parseFloat(e.investorShare)||0),0);
  const paidE    = allEarnings.filter(e=>e.isPaid);
  const pendingE = allEarnings.filter(e=>!e.isPaid);

  const statCards = view==="earnings"
    ? [
        { label:"Total Earned",   value:fmt(totalEarned),                                                faIcon:faDollarSign,  iconColor:"#22c55e", theme:CARD_THEMES[0] },
        { label:"Paid Out",       value:fmt(paidE.reduce((s,e)=>s+(parseFloat(e.investorShare)||0),0)),  faIcon:faCircleCheck, iconColor:"#60a5fa", theme:CARD_THEMES[1] },
        { label:"Pending",        value:fmt(pendingE.reduce((s,e)=>s+(parseFloat(e.investorShare)||0),0)),faIcon:faClock,      iconColor:"#f59e0b", theme:CARD_THEMES[3] },
        { label:"Monthly Profit", value:fmt(monthlyProfit),                                              faIcon:faArrowTrendUp,iconColor:"#22c55e", theme:CARD_THEMES[0] },
      ]
    : [
        { label:"Total Invested",  value:fmt(totalInvested),  faIcon:faWallet,      iconColor:"#22c55e", theme:CARD_THEMES[0] },
        { label:"Active Creators", value:activeCount,         faIcon:faUsers,       iconColor:"#60a5fa", theme:CARD_THEMES[1] },
        { label:"Monthly Profit",  value:fmt(monthlyProfit),  faIcon:faArrowTrendUp,iconColor:"#22c55e", theme:CARD_THEMES[0] },
        { label:"Total Earned",    value:fmt(totalReturns),   faIcon:faDollarSign,  iconColor:"#a855f7", theme:CARD_THEMES[2] },
      ];

  return (
    <div className="space-y-6">
      <style>{DS_STYLES}</style>
      <PageHeader
        title={view==="earnings"?"My Earnings":"Investment Portfolio"}
        subtitle={view==="earnings"?"Returns from your active investments":"Track your investments and returns"}
        accentLabel={view==="earnings"?"EARNINGS":"PORTFOLIO"}
        accentIcon={view==="earnings"?faChartBar:faArrowTrendUp}
      />

      {/* View toggle + action */}
      <div className="ie-in flex items-center justify-between flex-wrap gap-3 mb-6" style={{ animationDelay:".04s" }}>
        <ViewToggle view={view} setView={setView} isCreator={false} />
        {view==="investments" && (
          <button onClick={()=>navigate("/browse")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]" style={{ fontFamily:"'Syne',sans-serif", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000" }}>
            <FontAwesomeIcon icon={faPlus} style={{ fontSize:"12px" }} /> New Investment
          </button>
        )}
      </div>

      {/* Stats */}
      {loading ? <StatsSkeleton /> : (
        <div className="ie-in grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style={{ animationDelay:".08s" }}>
          {statCards.map(s=><StatCard key={s.label} {...s} />)}
        </div>
      )}

      {/* ── EARNINGS VIEW ── */}
      {view==="earnings" && (
        <div className="ie-in space-y-4" style={{ animationDelay:".12s" }}>
          {!loading && investments.length>0 && (
            <Section title="Monthly Returns" accentColor="#22c55e">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyReturnData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                  <XAxis dataKey="month" tick={{ fill:"#9ca3af", fontSize:11 }} />
                  <YAxis tick={{ fill:"#9ca3af", fontSize:11 }} tickFormatter={v=>`$${v}`} />
                  <Tooltip {...CHART_STYLE} formatter={v=>[`$${v}`,"Returns"]} />
                  <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} dot={{ fill:"#22c55e",r:3 }} activeDot={{ r:5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Section>
          )}
          <Section title="All Earnings" accentColor="#22c55e"
            action={<span className="text-xs font-bold" style={{ fontFamily:"'Syne',sans-serif", color:"var(--text-muted)" }}>{allEarnings.length} records</span>}
          >
            {loading ? <ListSkeleton /> : allEarnings.length===0
              ? <EmptyBox faIcon={faDollarSign} title="No earnings yet" message="Earnings appear once your creators report monthly income." />
              : <EarningsList earnings={allEarnings} type="investor" />
            }
          </Section>
        </div>
      )}

      {/* ── PORTFOLIO VIEW ── */}
      {view==="investments" && (
        <div className="ie-in space-y-4" style={{ animationDelay:".12s" }}>
          {!loading && investments.length>0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Section title="Monthly Returns" accentColor="#22c55e">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={monthlyReturnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                    <XAxis dataKey="month" tick={{ fill:"#9ca3af", fontSize:11 }} />
                    <YAxis tick={{ fill:"#9ca3af", fontSize:11 }} tickFormatter={v=>`$${v}`} />
                    <Tooltip {...CHART_STYLE} formatter={v=>[`$${v}`,"Returns"]} />
                    <Line type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} dot={{ fill:"#22c55e",r:3 }} activeDot={{ r:5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Section>
              <Section title="Portfolio Breakdown" accentColor="#a855f7">
                {pieData.length>0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                        {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
                      </Pie><Tooltip {...CHART_STYLE} formatter={v=>[`$${v}`,"Invested"]} /></PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {pieData.slice(0,4).map((d,i)=>(
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:PIE_COLORS[i%PIE_COLORS.length] }} /><span className="truncate max-w-[100px]" style={{ color:"var(--text-muted)" }}>{d.name}</span></div>
                          <span className="font-black text-white" style={{ fontFamily:"'Fraunces',serif" }}>${d.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div className="h-40 flex items-center justify-center text-sm" style={{ color:"var(--text-muted)" }}>No active investments</div>}
              </Section>
            </div>
          )}
          <Section title="My Investments" accentColor="#22c55e"
            action={
              <div className="flex gap-1 p-1 rounded-xl" style={{ background:"var(--bg-input)", border:"1px solid var(--border)" }}>
                {["all","active","pending","completed"].map(tab=>(
                  <button key={tab} onClick={()=>setActiveTab(tab)} className="px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all" style={{ fontFamily:"'Syne',sans-serif", background:activeTab===tab?"rgba(34,197,94,0.12)":"transparent", border:activeTab===tab?"1px solid rgba(34,197,94,0.35)":"1px solid transparent", color:activeTab===tab?"#22c55e":"#9ca3af" }}>
                    {tab}
                  </button>
                ))}
              </div>
            }
          >
            {loading ? <ListSkeleton /> : filtered.length===0
              ? <EmptyBox faIcon={faArrowTrendUp} title="No investments yet" message="Browse creators and start building your portfolio." btnLabel="Browse Creators" onBtnClick={()=>navigate("/browse")} />
              : <div className="space-y-3">{filtered.map(inv=><InvestorRow key={inv._id} inv={inv} expanded={expandedId===inv._id} onToggle={()=>setExpandedId(expandedId===inv._id?null:inv._id)} navigate={navigate} />)}</div>
            }
          </Section>
        </div>
      )}
    </div>
  );
}

// ── Investor row ───────────────────────────────────────────────────────────────
function InvestorRow({ inv, expanded, onToggle, navigate }) {
  const sc = STATUS_CONFIG[inv.status]||STATUS_CONFIG.pending;
  const amount=parseFloat(inv.amount)||0, profitShare=parseFloat(inv.profitSharePercentage)||0, duration=parseInt(inv.duration)||0;
  const totalReturns=parseFloat(inv.totalReturnsReceived)||0, projectedTotal=(amount*profitShare/100)*duration;
  const progressPct = projectedTotal>0 ? Math.min(100,Math.round((totalReturns/projectedTotal)*100)) : 0;
  const creator=inv.creator||{}, name=creator.name||inv.creatorName||"Creator", avatar=creator.avatar||null;

  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{ background:"var(--bg-input)", border:`1px solid ${sc.border}` }}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0" style={{ background:`${sc.color}15`, border:`1px solid ${sc.color}25`, color:sc.color }}>
          {avatar?<img src={avatar} alt={name} className="w-full h-full object-cover" />:name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-sm truncate" style={{ fontFamily:"'Syne',sans-serif" }}>{name}</span>
            {creator.isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"11px", color:"#22c55e", flexShrink:0 }} />}
          </div>
          <span className="text-xs capitalize" style={{ color:"var(--text-muted)", fontFamily:"'DM Sans',sans-serif" }}>{creator.profile?.skill||creator.skill||inv.skillCategory||"—"}</span>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-black text-white text-sm" style={{ fontFamily:"'Fraunces',serif" }}>${amount.toLocaleString()}</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>{profitShare}% · {duration}mo</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="font-bold text-sm" style={{ color:"#22c55e" }}>${((amount*profitShare)/100).toFixed(0)}/mo</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>est. return</p>
        </div>
        <StatusBadge status={inv.status} />
        <button className="ml-1 flex-shrink-0" style={{ color:"var(--text-muted)" }}>
          <FontAwesomeIcon icon={expanded?faChevronUp:faChevronDown} style={{ fontSize:"13px" }} />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop:"1px solid var(--border)" }}>
          <div className="pt-3">
            <div className="flex justify-between mb-1.5 text-xs">
              <span style={{ color:"var(--text-muted)" }}>Returns received</span>
              <span className="font-bold text-white">${totalReturns.toLocaleString()} / ${projectedTotal.toLocaleString()} ({progressPct}%)</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.2)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width:`${progressPct}%`, background:"linear-gradient(90deg,#16a34a,#22c55e,#4ade80)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[{label:"Invested",value:`$${amount.toLocaleString()}`},{label:"Profit Share",value:`${profitShare}%`},{label:"Duration",value:`${duration}mo`},{label:"Projected ROI",value:`$${projectedTotal.toLocaleString()}`}].map(d=>(
              <div key={d.label} className="rounded-xl p-3 text-center" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color:"var(--text-muted)", fontFamily:"'Syne',sans-serif", fontWeight:600 }}>{d.label}</p>
                <p className="font-black text-white text-sm" style={{ fontFamily:"'Fraunces',serif" }}>{d.value}</p>
              </div>
            ))}
          </div>
          {inv.earnings?.length>0 && (
            <div>
              <p className="text-xs font-bold tracking-widest mb-2" style={{ fontFamily:"'Syne',sans-serif", color:"var(--text-muted)" }}>EARNINGS HISTORY</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {inv.earnings.map((e,i)=>(
                  <div key={i} className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                    <span style={{ color:"var(--text-muted)" }}>{MONTHS[(e.month||1)-1]} {e.year}</span>
                    <span style={{ color:"var(--text-muted)" }}>Earned: ${parseFloat(e.creatorIncome||0).toLocaleString()}</span>
                    <span style={{ color:"#22c55e", fontWeight:700 }}>+${parseFloat(e.investorShare||0).toLocaleString()}</span>
                    <span style={{ color:e.isPaid?"#22c55e":"#f59e0b", fontWeight:700 }}>{e.isPaid?"✓ Paid":"Pending"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap pt-1">
            <button onClick={()=>navigate(`/investments/${inv._id}/milestones`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.35)", color:"#22c55e" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"12px" }} /> Milestones
            </button>
            <button onClick={()=>navigate(`/messages?userId=${creator._id||inv.creatorId}`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(255,255,255,0.18)", border:"1px solid var(--border)", color:"var(--text-muted)" }}
              onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#374151";}} onMouseLeave={e=>{e.currentTarget.style.color="#6b7280";e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";}}>
              Message Creator
            </button>
            <button onClick={()=>navigate(`/creators/${creator._id||inv.creatorId}`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(255,255,255,0.18)", border:"1px solid var(--border)", color:"var(--text-muted)" }}
              onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#374151";}} onMouseLeave={e=>{e.currentTarget.style.color="#6b7280";e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";}}>
              <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize:"12px" }} /> View Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Earnings list (shared) ─────────────────────────────────────────────────────
function EarningsList({ earnings, type }) {
  return (
    <div className="space-y-2">
      {earnings.map((e,i) => {
        const name   = type==="investor" ? e.creatorName   : e.investorName;
        const avatar = type==="investor" ? e.creatorAvatar : e.investorAvatar;
        const net    = type==="creator" ? (parseFloat(e.creatorIncome)||0)-(parseFloat(e.investorShare)||0)-(parseFloat(e.platformFee)||0) : null;
        return (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-all" style={{ background:"var(--bg-input)", border:"1px solid var(--border)" }}
            onMouseEnter={ev=>ev.currentTarget.style.borderColor="rgba(34,197,94,0.35)"} onMouseLeave={ev=>ev.currentTarget.style.borderColor="rgba(255,255,255,0.2)"}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0" style={{ background:type==="investor"?"rgba(34,197,94,0.12)":"rgba(59,130,246,0.12)", border:`1px solid ${type==="investor"?"rgba(34,197,94,0.35)":"rgba(59,130,246,0.35)"}`, color:type==="investor"?"#22c55e":"#3b82f6" }}>
              {avatar?<img src={avatar} alt={name} className="w-full h-full object-cover" />:name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate" style={{ fontFamily:"'Syne',sans-serif" }}>{name}</p>
              <p className="text-xs" style={{ color:"var(--text-muted)", fontFamily:"'DM Sans',sans-serif" }}>{MONTHS[(e.month||1)-1]} {e.year}</p>
            </div>
            {type==="creator" && <div className="text-right hidden md:block"><p className="text-xs" style={{ color:"var(--text-muted)" }}>Gross</p><p className="text-sm font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>${parseFloat(e.creatorIncome||0).toLocaleString()}</p></div>}
            {type==="creator" && <div className="text-right hidden sm:block"><p className="text-xs" style={{ color:"var(--text-muted)" }}>Investor share</p><p className="text-sm font-bold" style={{ color:"#f87171" }}>-${parseFloat(e.investorShare||0).toLocaleString()}</p></div>}
            {type==="investor" && <div className="text-right hidden sm:block"><p className="text-xs" style={{ color:"var(--text-muted)" }}>Earned</p><p className="text-sm font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>${parseFloat(e.creatorIncome||0).toLocaleString()}</p></div>}
            <div className="text-right">
              <p className="text-xs" style={{ color:"var(--text-muted)" }}>{type==="investor"?"Your share":"Your net"}</p>
              <p className="text-sm font-black" style={{ fontFamily:"'Fraunces',serif", color:"#22c55e" }}>
                {type==="investor" ? `+$${parseFloat(e.investorShare||0).toLocaleString()}` : `$${Math.max(0,net).toFixed(0)}`}
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ fontFamily:"'Syne',sans-serif", background:e.isPaid?"rgba(34,197,94,0.08)":"rgba(245,158,11,0.08)", border:e.isPaid?"1px solid rgba(34,197,94,0.35)":"1px solid rgba(245,158,11,0.35)", color:e.isPaid?"#22c55e":"#f59e0b" }}>
              <FontAwesomeIcon icon={e.isPaid?faCircleCheck:faClock} style={{ fontSize:"10px" }} />
              {e.isPaid?"Paid":"Pending"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CREATOR VIEW
// ══════════════════════════════════════════════════════════════════════════════
function CreatorView() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expandedId, setExpandedId]   = useState(null);
  const [reportingId, setReportingId] = useState(null);
  const [view, setView]               = useState(pathname==="/earnings"?"earnings":"investments");
  const [earningsFilter, setEarningsFilter] = useState("all");

  useEffect(()=>{ setView(pathname==="/earnings"?"earnings":"investments"); },[pathname]);

  const fetchInvestments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/investments/my-investments");
      const raw = res.data.investments||res.data.data||[];
      const withE = await Promise.all(raw.map(async inv => {
        try { const er=await api.get(`/investments/${inv._id}/earnings`); return {...inv,earnings:er.data.earnings||[]}; }
        catch { return {...inv,earnings:[]}; }
      }));
      setInvestments(withE);
    } catch { toast.error("Failed to load investments"); }
    finally { setLoading(false); }
  },[]);

  useEffect(()=>{ fetchInvestments(); },[fetchInvestments]);

  const totalRaised  = investments.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
  const activeCount  = investments.filter(i=>i.status==="active").length;
  const allEarnings  = investments.flatMap(inv=>(inv.earnings||[]).map(e=>({ ...e, investmentId:inv._id, investorName:inv.investor?.name||inv.investorName||"Investor", investorAvatar:inv.investor?.avatar||null, investorId:inv.investor?._id||inv.investorId, profitSharePercentage:inv.profitSharePercentage }))).sort((a,b)=>b.year!==a.year?b.year-a.year:b.month-a.month);
  const filteredE    = earningsFilter==="all"?allEarnings:earningsFilter==="paid"?allEarnings.filter(e=>e.isPaid):allEarnings.filter(e=>!e.isPaid);
  const totalIncome  = allEarnings.reduce((s,e)=>s+(parseFloat(e.creatorIncome)||0),0);
  const totalPaidOut = allEarnings.filter(e=>e.isPaid).reduce((s,e)=>s+(parseFloat(e.investorShare)||0),0);
  const totalPending = allEarnings.filter(e=>!e.isPaid).reduce((s,e)=>s+(parseFloat(e.investorShare)||0),0);
  const {month,year} = nowMY();
  const thisMonthIncome = allEarnings.filter(e=>e.month===month&&e.year===year).reduce((s,e)=>s+(parseFloat(e.creatorIncome)||0),0);
  const unreported   = investments.filter(inv=>inv.status==="active"&&!(inv.earnings||[]).some(e=>e.month===month&&e.year===year));
  const earningsChartData = MONTHS.map((m,i)=>({ month:m, income:investments.reduce((sum,inv)=>{const e=(inv.earnings||[]).find(e=>e.month===i+1);return sum+(parseFloat(e?.creatorIncome)||0);},0), paidOut:investments.reduce((sum,inv)=>{const e=(inv.earnings||[]).find(e=>e.month===i+1);return sum+(parseFloat(e?.investorShare)||0);},0) }));

  const statCards = view==="earnings"
    ? [
        { label:"Total Income",      value:fmt(totalIncome),     faIcon:faDollarSign,  iconColor:"#22c55e", theme:CARD_THEMES[0] },
        { label:"This Month",        value:fmt(thisMonthIncome), faIcon:faCalendarDays,iconColor:"#22c55e", theme:CARD_THEMES[0] },
        { label:"Paid to Investors", value:fmt(totalPaidOut),    faIcon:faCircleCheck, iconColor:"#60a5fa", theme:CARD_THEMES[1] },
        { label:"Pending Payouts",   value:fmt(totalPending),    faIcon:faClock,       iconColor:"#f59e0b", theme:CARD_THEMES[3] },
      ]
    : [
        { label:"Total Raised",     value:fmt(totalRaised),     faIcon:faWallet,      iconColor:"#22c55e", theme:CARD_THEMES[0] },
        { label:"Active Investors", value:activeCount,          faIcon:faUsers,       iconColor:"#60a5fa", theme:CARD_THEMES[1] },
        { label:"This Month",       value:fmt(thisMonthIncome), faIcon:faArrowTrendUp,iconColor:"#22c55e", theme:CARD_THEMES[0] },
        { label:"Paid Out",         value:fmt(totalPaidOut),    faIcon:faDollarSign,  iconColor:"#a855f7", theme:CARD_THEMES[2] },
      ];

  return (
    <div className="space-y-6">
      <style>{DS_STYLES}</style>
      <PageHeader
        title={view==="earnings"?"My Earnings":"My Investments"}
        subtitle={view==="earnings"?"Monthly income reports and investor payouts":"Track funding and report monthly earnings"}
        accentLabel={view==="earnings"?"EARNINGS":"INVESTMENTS"}
        accentIcon={view==="earnings"?faChartBar:faArrowTrendUp}
      />

      <div className="ie-in flex items-center justify-between flex-wrap gap-3 mb-6" style={{ animationDelay:".04s" }}>
        <ViewToggle view={view} setView={setView} isCreator={true} />
      </div>

      {loading ? <StatsSkeleton /> : (
        <div className="ie-in grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style={{ animationDelay:".08s" }}>
          {statCards.map(s=><StatCard key={s.label} {...s} />)}
        </div>
      )}

      {/* ── EARNINGS VIEW ── */}
      {view==="earnings" && (
        <div className="ie-in space-y-4" style={{ animationDelay:".12s" }}>
          {!loading && unreported.length>0 && (
            <div className="rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap" style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.35)" }}>
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize:"16px", color:"#f59e0b", flexShrink:0 }} />
                <div>
                  <p className="font-bold text-sm" style={{ color:"#f59e0b", fontFamily:"'Syne',sans-serif" }}>
                    {unreported.length} investment{unreported.length>1?"s":""} need a report for {MONTHS[month-1]} {year}
                  </p>
                  <p className="text-xs" style={{ color:"rgba(245,158,11,0.7)", fontFamily:"'DM Sans',sans-serif" }}>Keep your investors informed.</p>
                </div>
              </div>
              <button onClick={()=>setView("investments")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.35)", color:"#f59e0b" }}>
                Go to Investments <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ fontSize:"11px" }} />
              </button>
            </div>
          )}
          {!loading && investments.length>0 && (
            <Section title="Monthly Earnings Overview" accentColor="#22c55e">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                  <XAxis dataKey="month" tick={{ fill:"#9ca3af", fontSize:11 }} />
                  <YAxis tick={{ fill:"#9ca3af", fontSize:11 }} tickFormatter={v=>`$${v}`} />
                  <Tooltip {...CHART_STYLE} />
                  <Bar dataKey="income" name="Your Income" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="paidOut" name="Investor Share" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 justify-end">
                <div className="flex items-center gap-1.5 text-xs" style={{ color:"var(--text-muted)" }}><span className="w-3 h-3 rounded" style={{ background:"#22c55e" }} /> Your Income</div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color:"var(--text-muted)" }}><span className="w-3 h-3 rounded" style={{ background:"#3b82f6" }} /> Investor Share</div>
              </div>
            </Section>
          )}
          <Section title="Earnings History" accentColor="#22c55e"
            action={
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} style={{ fontSize:"11px", color:"var(--text-muted)" }} />
                <div className="flex gap-1 p-1 rounded-xl" style={{ background:"var(--bg-input)", border:"1px solid var(--border)" }}>
                  {["all","paid","pending"].map(f=>(
                    <button key={f} onClick={()=>setEarningsFilter(f)} className="px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all" style={{ fontFamily:"'Syne',sans-serif", background:earningsFilter===f?"rgba(34,197,94,0.12)":"transparent", border:earningsFilter===f?"1px solid rgba(34,197,94,0.35)":"1px solid transparent", color:earningsFilter===f?"#22c55e":"#9ca3af" }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {loading ? <ListSkeleton /> : filteredE.length===0
              ? <EmptyBox faIcon={faFileLines} title="No earnings yet" message={allEarnings.length===0?"Report your first month's income below.":"No earnings match this filter."} btnLabel={allEarnings.length===0?"Go to Investments":null} onBtnClick={()=>setView("investments")} />
              : <EarningsList earnings={filteredE} type="creator" />
            }
          </Section>
        </div>
      )}

      {/* ── INVESTMENTS VIEW ── */}
      {view==="investments" && (
        <div className="ie-in" style={{ animationDelay:".12s" }}>
          <Section title="Active Investments" accentColor="#22c55e">
            {loading ? <ListSkeleton /> : investments.length===0
              ? <EmptyBox faIcon={faArrowTrendUp} title="No investments yet" message="Complete your profile and portfolio to attract investors." btnLabel="Update Profile" onBtnClick={()=>navigate("/profile")} />
              : <div className="space-y-3">{investments.map(inv=><CreatorRow key={inv._id} inv={inv} expanded={expandedId===inv._id} onToggle={()=>setExpandedId(expandedId===inv._id?null:inv._id)} reporting={reportingId===inv._id} onReport={()=>setReportingId(reportingId===inv._id?null:inv._id)} onReported={()=>{setReportingId(null);fetchInvestments();}} navigate={navigate} />)}</div>
            }
          </Section>
        </div>
      )}
    </div>
  );
}

// ── Creator row ────────────────────────────────────────────────────────────────
function CreatorRow({ inv, expanded, onToggle, reporting, onReport, onReported, navigate }) {
  const sc = STATUS_CONFIG[inv.status]||STATUS_CONFIG.pending;
  const amount=parseFloat(inv.amount)||0, profitShare=parseFloat(inv.profitSharePercentage)||0, duration=parseInt(inv.duration)||0;
  const monthlyPayout=(amount*profitShare)/100;
  const investor=inv.investor||{}, name=investor.name||inv.investorName||"Investor", avatar=investor.avatar||null;
  const {month,year}=nowMY();
  const alreadyReported=(inv.earnings||[]).some(e=>e.month===month&&e.year===year);

  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{ background:"var(--bg-input)", border:`1px solid ${sc.border}` }}>
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={onToggle}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm overflow-hidden flex-shrink-0" style={{ background:"rgba(59,130,246,0.12)", border:"1px solid rgba(59,130,246,0.35)", color:"#3b82f6" }}>
          {avatar?<img src={avatar} alt={name} className="w-full h-full object-cover" />:name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-sm truncate" style={{ fontFamily:"'Syne',sans-serif" }}>{name}</span>
            {investor.isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"11px", color:"#22c55e", flexShrink:0 }} />}
          </div>
          <span className="text-xs" style={{ color:"var(--text-muted)" }}>Investor</span>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-black text-white text-sm" style={{ fontFamily:"'Fraunces',serif" }}>${amount.toLocaleString()}</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>funded</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="font-bold text-sm" style={{ color:"#f87171" }}>-${monthlyPayout.toFixed(0)}/mo</p>
          <p className="text-xs" style={{ color:"var(--text-muted)" }}>payout</p>
        </div>
        <StatusBadge status={inv.status} />
        {inv.status==="active" && !alreadyReported && (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.35)", color:"#f59e0b" }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize:"9px" }} /> Report due
          </span>
        )}
        <button className="ml-1 flex-shrink-0" style={{ color:"var(--text-muted)" }}>
          <FontAwesomeIcon icon={expanded?faChevronUp:faChevronDown} style={{ fontSize:"13px" }} />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop:"1px solid var(--border)" }}>
          <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[{label:"Amount Received",value:`$${amount.toLocaleString()}`},{label:"Profit Share",value:`${profitShare}%`},{label:"Duration",value:`${duration}mo`},{label:"Monthly Payout",value:`$${monthlyPayout.toFixed(0)}`}].map(d=>(
              <div key={d.label} className="rounded-xl p-3 text-center" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                <p className="text-xs mb-1" style={{ color:"var(--text-muted)", fontFamily:"'Syne',sans-serif", fontWeight:600 }}>{d.label}</p>
                <p className="font-black text-white text-sm" style={{ fontFamily:"'Fraunces',serif" }}>{d.value}</p>
              </div>
            ))}
          </div>

          {inv.status==="active" && (
            alreadyReported
              ? <div className="flex items-center gap-2.5 rounded-xl p-3.5" style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.35)" }}>
                  <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"14px", color:"#22c55e" }} />
                  <span className="text-sm font-bold" style={{ color:"#22c55e", fontFamily:"'Syne',sans-serif" }}>Reported for {MONTHS[month-1]} {year}</span>
                </div>
              : <button onClick={e=>{e.stopPropagation();onReport();}} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.35)", color:"#22c55e" }}>
                  <FontAwesomeIcon icon={faFileLines} style={{ fontSize:"13px" }} /> Report {MONTHS[month-1]} {year} Earnings
                </button>
          )}

          {reporting && !alreadyReported && (
            <ReportForm inv={inv} onReported={onReported} onClose={onReport} />
          )}

          {inv.earnings?.length>0 && (
            <div>
              <p className="text-xs font-bold tracking-widest mb-2" style={{ fontFamily:"'Syne',sans-serif", color:"var(--text-muted)" }}>EARNINGS HISTORY</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {[...inv.earnings].reverse().map((e,i)=>{
                  const net=(parseFloat(e.creatorIncome)||0)-(parseFloat(e.investorShare)||0)-(parseFloat(e.platformFee)||0);
                  return (
                    <div key={i} className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
                      <span style={{ color:"var(--text-muted)" }}>{MONTHS[(e.month||1)-1]} {e.year}</span>
                      <span style={{ color:"var(--text-muted)" }}>Income: ${parseFloat(e.creatorIncome||0).toLocaleString()}</span>
                      <span style={{ color:"#f87171", fontWeight:700 }}>-${parseFloat(e.investorShare||0).toLocaleString()}</span>
                      <span style={{ color:"#22c55e", fontWeight:700 }}>Net: ${Math.max(0,net).toFixed(0)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Investor profile */}
          <div className="rounded-xl p-4" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ fontFamily:"'Syne',sans-serif", color:"var(--text-muted)" }}>INVESTOR PROFILE</p>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base overflow-hidden flex-shrink-0" style={{ background:"rgba(59,130,246,0.12)", border:"1.5px solid rgba(59,130,246,0.35)", color:"#3b82f6" }}>
                {avatar?<img src={avatar} alt={name} className="w-full h-full object-cover" />:name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-white text-sm" style={{ fontFamily:"'Syne',sans-serif" }}>{name}</span>
                  {investor.isVerified && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"11px", color:"#22c55e" }} />}
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(59,130,246,0.1)", color:"#3b82f6" }}>Investor</span>
                </div>
                {investor.email && <p className="text-xs" style={{ color:"var(--text-muted)" }}>{investor.email}</p>}
                {investor.profile?.location && <p className="text-xs" style={{ color:"var(--text-muted)" }}>📍 {investor.profile.location}</p>}
                {investor.profile?.investmentBudget && <p className="text-xs" style={{ color:"var(--text-muted)" }}>💼 Budget: ${Number(investor.profile.investmentBudget).toLocaleString()}</p>}
                {investor.profile?.industriesOfInterest?.length>0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {investor.profile.industriesOfInterest.slice(0,4).map(ind=>(
                      <span key={ind} className="text-xs capitalize px-2 py-0.5 rounded-full" style={{ background:"rgba(255,255,255,0.18)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>{ind}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>navigate(`/investments/${inv._id}/milestones`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(255,255,255,0.18)", border:"1px solid var(--border)", color:"var(--text-muted)" }}
              onMouseEnter={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="#374151";}} onMouseLeave={e=>{e.currentTarget.style.color="#6b7280";e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";}}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"12px" }} /> Milestones
            </button>
            <button onClick={()=>navigate(`/messages?userId=${investor._id||inv.investorId}`)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:scale-[1.01]" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.35)", color:"#22c55e" }}>
              Message Investor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Report form ────────────────────────────────────────────────────────────────
function ReportForm({ inv, onReported, onClose }) {
  const {month,year}=nowMY();
  const [income,setIncome]=useState(""), [notes,setNotes]=useState(""), [submitting,setSubmitting]=useState(false);
  const profitShare=parseFloat(inv.profitSharePercentage)||0;
  const investorShare=income?((parseFloat(income)*profitShare)/100).toFixed(2):null;
  const platformFee=income?(parseFloat(income)*0.01).toFixed(2):null;
  const yourNet=income&&investorShare&&platformFee?(parseFloat(income)-parseFloat(investorShare)-parseFloat(platformFee)).toFixed(2):null;

  const handleSubmit = async () => {
    if (!income||parseFloat(income)<=0) { toast.error("Enter your income for this month"); return; }
    setSubmitting(true);
    try {
      await api.post("/investments/earnings/report", { investmentId:inv._id, month, year, creatorIncome:parseFloat(income), notes });
      toast.success("Earnings reported!");
      onReported();
    } catch (error) { toast.error(error.response?.data?.message||"Failed to report"); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background:"var(--bg-card)", border:"1px solid rgba(34,197,94,0.35)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize:"13px", color:"#22c55e" }} />
          <p className="font-black text-white text-sm" style={{ fontFamily:"'Fraunces',serif" }}>Report — {MONTHS[month-1]} {year}</p>
        </div>
        <button onClick={onClose} style={{ color:"var(--text-muted)" }}><FontAwesomeIcon icon={faChevronUp} style={{ fontSize:"13px" }} /></button>
      </div>
      <div>
        <label className="block text-xs font-bold tracking-widest mb-1.5" style={{ fontFamily:"'Syne',sans-serif", color:"var(--text-muted)" }}>TOTAL INCOME THIS MONTH ($) *</label>
        <input type="number" value={income} onChange={e=>setIncome(e.target.value)} placeholder="e.g. 800" className="ie-inp" />
      </div>
      {income&&parseFloat(income)>0 && (
        <div className="rounded-xl p-3.5 space-y-2" style={{ background:"var(--bg-input)", border:"1px solid var(--border)" }}>
          {[{label:"Your total income",value:`$${parseFloat(income).toLocaleString()}`,color:"var(--text-muted)"},{label:`Investor share (${profitShare}%)`,value:`-$${investorShare}`,color:"#f87171"},{label:"Platform fee (1%)",value:`-$${platformFee}`,color:"#f87171"}].map(r=>(
            <div key={r.label} className="flex justify-between text-sm">
              <span style={{ color:"var(--text-muted)", fontFamily:"'DM Sans',sans-serif" }}>{r.label}</span>
              <span style={{ color:r.color, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>{r.value}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2" style={{ borderTop:"1px solid var(--border)" }}>
            <span className="font-bold text-white" style={{ fontFamily:"'Syne',sans-serif" }}>Your net earnings</span>
            <span className="font-black" style={{ fontFamily:"'Fraunces',serif", color:"#22c55e", fontSize:"1.05rem" }}>${yourNet}</span>
          </div>
        </div>
      )}
      <div>
        <label className="block text-xs font-bold tracking-widest mb-1.5" style={{ fontFamily:"'Syne',sans-serif", color:"var(--text-muted)" }}>NOTES (OPTIONAL)</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Updates for your investor..." rows={2} className="ie-ta" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={submitting||!income} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.01] disabled:opacity-60" style={{ fontFamily:"'Syne',sans-serif", background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#000" }}>
          {submitting?<FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize:"12px" }} />:<FontAwesomeIcon icon={faFileLines} style={{ fontSize:"12px" }} />}
          {submitting?"Submitting...":"Submit Report"}
        </button>
        <button onClick={onClose} className="px-4 py-3 rounded-xl font-bold text-sm" style={{ fontFamily:"'Syne',sans-serif", background:"rgba(255,255,255,0.18)", border:"1px solid var(--border)", color:"var(--text-muted)" }}>Cancel</button>
      </div>
    </div>
  );
}
