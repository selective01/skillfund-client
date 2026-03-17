import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight, faArrowTrendUp, faShield, faUsers,
  faCircleCheck, faStar, faChartBar, faLock,
  faTrophy, faChevronDown, faChevronUp, faPlay,
  faXmark, faFire,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../store/authStore";

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ end, prefix = "", suffix = "", duration = 2000, decimals = 0 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = eased * end;
          setCount(decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, decimals]);
  return <span ref={ref}>{prefix}{decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}{suffix}</span>;
}

// ─── Live Activity Feed ───────────────────────────────────────────────────────
const ACTIVITY_SEED = [
  { investor: "Michael O.", amount: 500,  creator: "Ada Fashion",       mins: 2  },
  { investor: "Grace A.",   amount: 200,  creator: "Tunde Photography", mins: 5  },
  { investor: "Daniel C.",  amount: 1000, creator: "Bella Cakes",       mins: 12 },
  { investor: "Fatima Y.",  amount: 350,  creator: "Kofi Woodcraft",    mins: 18 },
  { investor: "Emeka N.",   amount: 750,  creator: "Ngozi Studio",      mins: 25 },
  { investor: "Amina L.",   amount: 150,  creator: "Sola Beats",        mins: 31 },
];

const NAMES    = ["Chioma","Ayo","Seun","Ifeanyi","Blessing","Tola","Uche","Kemi","Bayo","Nkechi"];
const CREATORS = ["Ada Fashion","Bella Cakes","Kofi Woodcraft","Ngozi Studio","Tunde Photography","Sola Beats","Chike Tech","Zara Textiles"];
const AMOUNTS  = [100, 200, 300, 500, 750, 1000];

function ActivityFeed() {
  const [items, setItems] = useState(ACTIVITY_SEED);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      const name    = NAMES[idx % NAMES.length];
      const initial = String.fromCharCode(65 + (idx * 7 % 26));
      const amount  = AMOUNTS[idx % AMOUNTS.length];
      const creator = CREATORS[idx % CREATORS.length];
      const item    = { investor: `${name} ${initial}.`, amount, creator, mins: 0, id: Date.now() };
      setItems(prev => [item, ...prev.slice(0, 5)]);
      idx++;
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-64 hidden xl:flex flex-col gap-2" style={{ zIndex: 3 }}>
      <div className="flex items-center gap-2 mb-1 px-1">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[#4a5568] text-xs" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: ".1em" }}>LIVE ACTIVITY</span>
      </div>
      {items.slice(0, 5).map((item, i) => (
        <div
          key={item.id || i}
          className="bg-[#070d08]/90 border border-[#2d5235] rounded-xl px-3 py-2.5 backdrop-blur-sm transition-all duration-500"
          style={{ opacity: 1 - i * 0.15, transform: `scale(${1 - i * 0.02})`, transformOrigin: "left center" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#16a34a] to-[#065f30] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
              {item.investor[0]}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold leading-tight truncate">
                <span className="text-[#22c55e]">{item.investor}</span> invested{" "}
                <span className="text-[#4ade80]">${item.amount}</span>
              </p>
              <p className="text-[#4a5568] text-xs truncate">in {item.creator}</p>
            </div>
          </div>
          <p className="text-[#2d4a31] text-xs mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
            {item.mins === 0 ? "just now" : `${item.mins} min ago`}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ name, skill, goal, raised, roi, investors, score, trending, daysLeft, videoId, emoji }) {
  const [showVideo, setShowVideo] = useState(false);
  const pct = Math.round((raised / goal) * 100);
  const remaining = goal - raised;

  return (
    <div className="group bg-[#070d08] border border-[#2d5235] rounded-2xl overflow-hidden hover:border-[#22c55e]/40 transition-all card-hover relative">

      {/* Trending badge */}
      {trending && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-[#7c2d12]/90 border border-orange-500/40 rounded-full px-2.5 py-1 text-xs backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
          <FontAwesomeIcon icon={faFire} style={{ fontSize: "11px", color: "#fb923c" }} />
          <span className="text-orange-300">TRENDING</span>
        </div>
      )}

      {/* Score badge */}
      <div className="absolute top-3 right-3 z-10 bg-[#040806]/80 border border-[#22c55e]/50 rounded-lg px-2 py-1 text-xs backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700 }}>
        <span className="text-[#22c55e]">⭐ {score}</span>
      </div>

      {/* Video / cover area */}
      <div className="relative h-36 bg-gradient-to-br from-[#0a1a0b] to-[#040806] flex items-center justify-center overflow-hidden">
        <div className="text-6xl opacity-20 select-none">{emoji}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 70%)" }} />
          {videoId && (
            <button
              onClick={() => setShowVideo(true)}
              className="relative z-10 w-12 h-12 rounded-full bg-[#22c55e]/20 border-2 border-[#22c55e]/60 flex items-center justify-center hover:bg-[#22c55e]/30 transition-all hover:scale-110 backdrop-blur-sm"
            >
              <FontAwesomeIcon icon={faPlay} style={{ fontSize: "16px", color: "#22c55e", marginLeft: "2px" }} />
            </button>
          )}
        </div>
        {videoId && (
          <div className="absolute bottom-2 left-3 text-xs text-[#4a5568]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
            🎥 Watch pitch
          </div>
        )}
        {/* FOMO urgency bar */}
        {daysLeft && daysLeft <= 5 && (
          <div className="absolute bottom-0 left-0 right-0 bg-[#7c2d12]/80 border-t border-orange-500/30 px-3 py-1.5 backdrop-blur-sm">
            <p className="text-orange-300 text-xs font-semibold text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              🔥 Only ${remaining.toLocaleString()} left · {daysLeft} days remaining
            </p>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{name}</h3>
            <p className="text-[#4a5568] text-xs mt-0.5">{skill}</p>
          </div>
          <div className="text-right">
            <p className="text-[#22c55e] font-black text-sm" style={{ fontFamily: "'Fraunces', serif" }}>{roi}% ROI</p>
            <p className="text-[#4a5568] text-xs">expected</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
            <span className="text-[#6b7280]">Raised <span className="text-white">${raised.toLocaleString()}</span></span>
            <span className="text-[#22c55e]">{pct}%</span>
          </div>
          <div className="h-2 bg-[#0a1a0b] border border-[#2d5235] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background: pct >= 90
                  ? "linear-gradient(90deg,#f97316,#ef4444)"
                  : pct >= 70
                  ? "linear-gradient(90deg,#16a34a,#4ade80)"
                  : "linear-gradient(90deg,#16a34a,#22c55e)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-[#2d4a31]">Goal: ${goal.toLocaleString()}</span>
            <span className="text-[#2d4a31]">{investors} investors</span>
          </div>
        </div>

        <button
          onClick={() => {}}
          className="w-full py-2 rounded-xl text-xs font-bold border border-[#2d5235] text-[#9ca3af] hover:border-[#22c55e]/40 hover:text-white transition-all"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          View Profile →
        </button>
      </div>

      {/* Video modal */}
      {showVideo && videoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowVideo(false)}>
          <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden border border-[#2d5235] shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowVideo(false)} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 border border-[#2d5235] flex items-center justify-center hover:border-[#22c55e]/40 transition-all">
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: "13px", color: "#fff" }} />
            </button>
            <div className="aspect-video bg-[#040806] flex items-center justify-center">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                title={`${name} pitch video`}
              />
            </div>
            <div className="bg-[#070d08] border-t border-[#2d5235] px-4 py-3">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{name} — Pitch Video</p>
              <p className="text-[#4a5568] text-xs mt-0.5">{skill}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Accordion Item ───────────────────────────────────────────────────────────
function AccordionItem({ faIcon, iconColor = "#22c55e", title, description, isOpen, onToggle, stat }) {
  return (
    <div onClick={onToggle} className={`rounded-2xl border cursor-pointer transition-all duration-300 ${isOpen ? "card-green shadow-lg shadow-[#22c55e]/5" : "bg-[#080e09] border-[#2d5235] hover:border-[#22c55e]/50"}`}>
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isOpen ? "shadow-lg" : "bg-[#0f1a12] border border-[#2d5a35]"}`} style={isOpen ? { background: iconColor, boxShadow: `0 8px 24px ${iconColor}55` } : {}}>
            <FontAwesomeIcon icon={faIcon} style={{ fontSize: "17px", color: isOpen ? "#000" : iconColor }} />
          </div>
          <span className={`font-bold text-sm transition-colors ${isOpen ? "text-white" : "text-[#9ca3af]"}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</span>
        </div>
        <div className="flex items-center gap-3">
          {isOpen && stat && <span className="text-xs text-[#22c55e] bg-[#22c55e]/10 rounded-full px-2.5 py-1 hidden sm:block font-bold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{stat}</span>}
          <FontAwesomeIcon icon={isOpen ? faChevronUp : faChevronDown} style={{ fontSize: "13px", color: isOpen ? "#22c55e" : "#4a5568" }} className="flex-shrink-0" />
        </div>
      </div>
      {isOpen && (
        <div className="px-6 pb-6 pl-[5rem]">
          <p className="text-[#9ca3af] text-sm leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────
function TestimonialCard({ quote, name, role, emoji, color = "card-green" }) {
  return (
    <div className={`rounded-2xl p-6 break-inside-avoid mb-4 border card-hover ${color}`}>
      <div className="text-3xl text-[#1a2e1d] font-serif mb-3 leading-none">"</div>
      <p className="text-[#9ca3af] text-sm leading-relaxed mb-5">{quote}</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0f1a12] border border-[#2d5a35] flex items-center justify-center text-base">{emoji}</div>
        <div>
          <p className="text-white text-sm font-semibold">{name}</p>
          <p className="text-[#4a5568] text-xs">{role}</p>
        </div>
        <div className="ml-auto flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => <FontAwesomeIcon key={i} icon={faStar} style={{ fontSize: "10px", color: "#f59e0b" }} />)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [openAccordion, setOpenAccordion] = useState(0);

  const features = [
    { faIcon: faArrowTrendUp, iconColor: "#22c55e", title: "Profit-Share Agreements",  stat: "Avg 17.8% ROI",           description: "Invest in a creator's skill and earn a percentage of their actual monthly income — not interest, not dividends. Real earnings from real work." },
    { faIcon: faLock,         iconColor: "#3b82f6", title: "Milestone-Based Escrow",   stat: "72h vote window",          description: "Capital is held securely and released in stages only when the creator proves progress. You vote to approve or dispute each milestone before funds move." },
    { faIcon: faTrophy,       iconColor: "#f59e0b", title: "SkillFund Credit Score",   stat: "0–100 score",              description: "Every creator has a dynamic trust score built from reporting history, milestone completion rate, revenue growth, and dispute record." },
    { faIcon: faUsers,        iconColor: "#a855f7", title: "Investor Syndicates",      stat: "Up to 10 investors",       description: "Pool capital with other investors in a Syndicate. Votes are weighted by your share — more capital, more say in milestone decisions." },
    { faIcon: faShield,       iconColor: "#14b8a6", title: "Multi-Currency Payouts",   stat: "Paystack · Stripe · USDT", description: "Withdraw earnings via Nigerian bank (Paystack), international card (Stripe), or crypto USDT — on your schedule." },
  ];

  const partners = ["Paystack", "Stripe", "NOWPayments", "Cloudinary", "MongoDB", "Railway"];

  const creators = [
    { name:"Ada Okafor",       skill:"Fashion Designer, Lagos",    goal:2000,  raised:1450, roi:18, investors:14, score:94, trending:true,  daysLeft:3, videoId:"dQw4w9WgXcQ", emoji:"👗" },
    { name:"Tunde Bakare",     skill:"Photographer, Abuja",        goal:1500,  raised:900,  roi:15, investors:9,  score:82, trending:false, daysLeft:12, videoId:"dQw4w9WgXcQ", emoji:"📷" },
    { name:"Bella Okonkwo",    skill:"Baker & Pastry Chef, PH",    goal:3000,  raised:2850, roi:20, investors:21, score:89, trending:true,  daysLeft:2, videoId:null,           emoji:"🍰" },
    { name:"Kofi Mensah",      skill:"Carpenter & Woodworker, GH", goal:2500,  raised:800,  roi:14, investors:6,  score:71, trending:false, daysLeft:20, videoId:"dQw4w9WgXcQ", emoji:"🪚" },
    { name:"Ngozi Adeyemi",    skill:"Videographer, Lagos",        goal:4000,  raised:3200, roi:22, investors:18, score:91, trending:true,  daysLeft:5, videoId:"dQw4w9WgXcQ", emoji:"🎬" },
    { name:"Chike Eze",        skill:"Software Dev, Enugu",        goal:5000,  raised:1500, roi:25, investors:12, score:77, trending:false, daysLeft:30, videoId:null,           emoji:"💻" },
  ];

  const ORBIT_STYLES = [
    { animation: "orbit1 8s linear infinite" },
    { animation: "orbit2 10s linear infinite" },
    { animation: "orbit3 12s linear infinite" },
    { animation: "orbit1 9s linear infinite reverse" },
    { animation: "orbit2 11s linear infinite reverse" },
    { animation: "orbit3 7s linear infinite" },
  ];

  return (
    <div className="min-h-screen bg-[#040806] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

        @keyframes fadeInUp      { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
        @keyframes floatSlow     { 0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-14px) rotate(1deg)} }
        @keyframes floatMed      { 0%,100%{transform:translateY(0) rotate(1deg)}50%{transform:translateY(-20px) rotate(-1deg)} }
        @keyframes ticker        { 0%{transform:translateX(0)}100%{transform:translateX(-50%)} }
        @keyframes blobPulse     { 0%,100%{transform:scale(1) rotate(0deg);opacity:.6} 33%{transform:scale(1.04) rotate(1.5deg);opacity:.7} 66%{transform:scale(.97) rotate(-1deg);opacity:.55} }
        @keyframes particlePulse { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.8;transform:scale(1.8)} }
        @keyframes orbit1        { from{transform:rotate(0deg) translateX(110px) rotate(0deg)}to{transform:rotate(360deg) translateX(110px) rotate(-360deg)} }
        @keyframes orbit2        { from{transform:rotate(120deg) translateX(110px) rotate(-120deg)}to{transform:rotate(480deg) translateX(110px) rotate(-480deg)} }
        @keyframes orbit3        { from{transform:rotate(240deg) translateX(110px) rotate(-240deg)}to{transform:rotate(600deg) translateX(110px) rotate(-600deg)} }
        @keyframes slideInLeft   { from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)} }
        @keyframes scrollLeft    { from{transform:translateX(0)}to{transform:translateX(-50%)} }
        @keyframes scrollRight   { from{transform:translateX(-50%)}to{transform:translateX(0)} }

        .fade-in-up{animation:fadeInUp 0.7s ease forwards}
        .d1{animation-delay:.1s;opacity:0}.d2{animation-delay:.25s;opacity:0}
        .d3{animation-delay:.4s;opacity:0}.d4{animation-delay:.55s;opacity:0}
        .d5{animation-delay:.7s;opacity:0}
        .float-slow{animation:floatSlow 5s ease-in-out infinite}
        .float-med{animation:floatMed 4s ease-in-out infinite}
        .grid-bg{background-image:linear-gradient(rgba(34,197,94,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.04) 1px,transparent 1px);background-size:48px 48px}
        .hero-glow{background:radial-gradient(ellipse 70% 60% at 65% 45%,rgba(34,197,94,0.09) 0%,transparent 70%)}
        .section-glow-l{background:radial-gradient(ellipse 50% 60% at 20% 50%,rgba(34,197,94,0.06) 0%,transparent 70%)}
        .section-glow-r{background:radial-gradient(ellipse 50% 60% at 80% 50%,rgba(34,197,94,0.06) 0%,transparent 70%)}
        .glow-text{text-shadow:0 0 100px rgba(34,197,94,0.2)}
        .ticker-wrap{overflow:hidden;white-space:nowrap;mask-image:linear-gradient(90deg,transparent,black 10%,black 90%,transparent)}
        .ticker-inner{display:inline-flex;animation:ticker 25s linear infinite}
        .gradient-bar{background:linear-gradient(90deg,#16a34a,#22c55e,#4ade80)}
        .number-gradient{background:linear-gradient(135deg,#4ade80,#22c55e,#16a34a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .card-hover{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
        .card-hover:hover{transform:translateY(-4px);box-shadow:0 24px 48px rgba(0,0,0,0.5)}
        .card-blue   { background: linear-gradient(135deg, #0f2244 0%, #091830 100%); border-color: #2a5aa0; }
        .card-purple { background: linear-gradient(135deg, #220f44 0%, #180930 100%); border-color: #7a3aaa; }
        .card-amber  { background: linear-gradient(135deg, #3d2200 0%, #2a1600 100%); border-color: #b86e00; }
        .card-teal   { background: linear-gradient(135deg, #0f3d38 0%, #092820 100%); border-color: #2aada3; }
        .card-rose   { background: linear-gradient(135deg, #3d0f22 0%, #280918 100%); border-color: #aa2a55; }
        .card-green  { background: linear-gradient(135deg, #0f2e10 0%, #091e09 100%); border-color: rgba(34,197,94,0.45); }
        .card-blue:hover   { border-color: #3b82f6cc; box-shadow: 0 24px 48px rgba(59,130,246,0.2); }
        .card-purple:hover { border-color: #a855f7cc; box-shadow: 0 24px 48px rgba(168,85,247,0.2); }
        .card-amber:hover  { border-color: #f59e0bcc; box-shadow: 0 24px 48px rgba(245,158,11,0.2); }
        .card-teal:hover   { border-color: #14b8a6cc; box-shadow: 0 24px 48px rgba(20,184,166,0.2); }
        .card-rose:hover   { border-color: #f43f5ecc; box-shadow: 0 24px 48px rgba(244,63,94,0.2); }
        .card-green:hover  { border-color: #22c55ecc; box-shadow: 0 24px 48px rgba(34,197,94,0.2); }
        .masonry{columns:2;column-gap:1rem}
        @media(min-width:768px){.masonry{columns:3}}
        .slide-in{animation:slideInLeft .4s ease forwards}
      `}</style>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#040806]/95 backdrop-blur-xl overflow-hidden" style={{ borderBottom: "1px solid rgba(34,197,94,0.22)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="relative w-8 h-8 rounded-lg bg-[#22c55e] flex items-center justify-center">
              <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "13px", color: "#000" }} />
              <div className="absolute inset-0 rounded-lg bg-[#22c55e] animate-ping opacity-20" />
            </div>
            <span className="font-black text-lg tracking-tight" style={{ fontFamily: "'Fraunces', serif" }}>SkillFund</span>
          </div>

          {/* Center nav links */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
            {[
              ["#creators",    "Explore Creators"],
              ["#how-it-works","How It Works"],
              ["#features",    "For Investors"],
              ["#features",    "For Creators"],
              ["#pricing",     "Pricing"],
            ].map(([href, label]) => (
              <a key={label} href={href} className="text-[#6b7280] hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-white/5">
                {label}
              </a>
            ))}
          </div>

          {/* Right: auth buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {user ? (
              <button onClick={() => navigate("/dashboard")} className="group flex items-center gap-2 text-sm font-bold bg-[#22c55e] text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-[#16a34a] transition-all shadow-lg shadow-[#22c55e]/20" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Dashboard <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-[#6b7280] hover:text-white transition-colors px-3 sm:px-4 py-2 sm:py-2.5 rounded-full hover:bg-white/5 whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Login
                </Link>
                <Link to="/register" className="text-xs sm:text-sm font-bold bg-[#22c55e] text-black px-3 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-[#16a34a] transition-all shadow-lg shadow-[#22c55e]/20 whitespace-nowrap" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Start Investing
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          HERO — Full-width centered + 3D blob + Live Activity Feed
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden text-center">

        {/* Deep radial bg */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 100% 80% at 50% 50%, #071a0b 0%, #040806 60%, #020402 100%)" }} />

        {/* 3D mesh sphere */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none" style={{ zIndex: 0 }}>
          <div className="relative w-[680px] h-[680px]" style={{ animation: "blobPulse 8s ease-in-out infinite", opacity: 0.6 }}>
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(ellipse at center, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.06) 45%, transparent 70%)", filter: "blur(2px)" }} />
            <svg viewBox="0 0 680 680" className="absolute inset-0 w-full h-full" style={{ filter: "drop-shadow(0 0 80px rgba(34,197,94,0.3))" }}>
              <defs>
                <radialGradient id="blobGrad" cx="50%" cy="40%" r="55%">
                  <stop offset="0%"   stopColor="#4ade80" stopOpacity="0.9" />
                  <stop offset="35%"  stopColor="#22c55e" stopOpacity="0.7" />
                  <stop offset="70%"  stopColor="#16a34a" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#052e16" stopOpacity="0.1" />
                </radialGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              {Array.from({length:18}).map((_,i)=>{
                const a=(i/18)*Math.PI*2,r=260,cx=340,cy=310;
                return <line key={i} x1={cx+r*Math.cos(a)} y1={cy+r*Math.sin(a)*0.55} x2={cx+r*Math.cos(a+Math.PI/9)} y2={cy+r*Math.sin(a+Math.PI/9)*0.55} stroke="#22c55e" strokeWidth="0.6" strokeOpacity="0.35"/>;
              })}
              {Array.from({length:10}).map((_,i)=>{
                const s=0.3+(i/10)*0.7;
                return <ellipse key={i} cx={340} cy={310} rx={260*s} ry={143*s} fill="none" stroke="#22c55e" strokeWidth="0.6" strokeOpacity={0.12+s*0.18}/>;
              })}
              {Array.from({length:12}).map((_,i)=>(
                <ellipse key={i} cx={340} cy={310} rx={Math.abs(260*Math.cos((i/12)*Math.PI))} ry={143} fill="none" stroke="#22c55e" strokeWidth="0.5" strokeOpacity="0.2" transform={`rotate(${(i/12)*180} 340 310)`}/>
              ))}
              <circle cx="340" cy="300" r="90" fill="url(#blobGrad)" filter="url(#glow)" opacity="0.85"/>
              <circle cx="340" cy="300" r="50" fill="#4ade80" opacity="0.15"/>
              <circle cx="325" cy="280" r="18" fill="#ffffff" opacity="0.06"/>
            </svg>
            {[[120,180],[540,150],[80,400],[600,370],[200,560],[480,540],[340,90],[150,300],[530,260],[300,580],[420,100],[60,250]].map(([x,y],i)=>(
              <div key={i} className="absolute w-1 h-1 rounded-full bg-[#22c55e]"
                style={{left:`${(x/680)*100}%`,top:`${(y/680)*100}%`,opacity:0.3+(i%4)*0.15,animation:`particlePulse ${2+(i%3)}s ease-in-out ${i*0.3}s infinite`}}/>
            ))}
          </div>
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 110% 90% at 50% 50%, transparent 40%, #040806 85%)", zIndex: 1 }} />

        {/* Live Activity Feed — left side */}
        <ActivityFeed />

        {/* Hero content */}
        <div className="relative pt-6 px-6 max-w-5xl mx-auto" style={{ zIndex: 2 }}>
          <div className="inline-flex items-center gap-2 bg-[#0a1a0b]/80 border border-[#2d5a35] rounded-full px-4 py-1.5 text-xs mb-8 fade-in-up d1 backdrop-blur-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, color: "#4ade80" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            AFRICA'S SKILL INVESTMENT PLATFORM
          </div>

          <h1 className="font-black mb-6 fade-in-up d2" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(3.2rem,7.5vw,7rem)", lineHeight: 1.0, letterSpacing: "-0.02em" }}>
            INVEST IN THE SKILLS<br />
            <span style={{ WebkitTextStroke: "2px #22c55e", color: "transparent" }}>OF AFRICA</span>
          </h1>

          <p className="text-[#9ca3af] mb-10 fade-in-up d3 mx-auto" style={{ fontSize: "clamp(0.85rem,1.5vw,1.05rem)", maxWidth: "580px", letterSpacing: "0.04em", lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
            JOIN A COMMUNITY OF INVESTORS FUNDING BOLD SKILLS, BIG DREAMS,<br className="hidden md:block" /> AND THE NEXT GENERATION OF AFRICAN CREATORS.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-14 fade-in-up d4">
            <button onClick={() => navigate("/register")} className="font-bold px-8 py-3.5 rounded-full transition-all text-sm hover:shadow-2xl hover:shadow-[#22c55e]/30 hover:scale-105" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#22c55e", color: "#000" }}>
              Start Investing
            </button>
            <button onClick={() => navigate("/register")} className="font-bold px-8 py-3.5 rounded-full transition-all text-sm border hover:scale-105" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.35)", color: "#fff", backdropFilter: "blur(8px)" }}>
              Explore Campaigns
            </button>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 fade-in-up d5">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2.5">
                {["K","A","T","O","M","N"].map((l,i)=>(
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#16a34a] to-[#065f30] border-2 border-[#040806] flex items-center justify-center text-white text-xs font-bold">{l}</div>
                ))}
              </div>
              <span className="text-[#6b7280] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>1,200+ creators funded</span>
            </div>
            <div className="w-px h-5 bg-[#1a2e1d] hidden sm:block" />
            <div className="flex items-center gap-1.5">
              {Array.from({length:5}).map((_,i)=><FontAwesomeIcon key={i} icon={faStar} style={{ fontSize: "11px", color: "#f59e0b" }} />)}
              <span className="text-[#6b7280] text-sm ml-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>4.9 platform rating</span>
            </div>
            <div className="w-px h-5 bg-[#1a2e1d] hidden sm:block" />
            <span className="text-[#6b7280] text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>Paystack · Stripe · USDT</span>
          </div>
        </div>

      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <section id="stats" className="py-20 bg-[#030604]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:"Total Funded",    display:"$4.2M+" },
              { label:"Active Creators", end:1200, suffix:"+" },
              { label:"Investors",       end:340,  suffix:"+" },
              { label:"Avg Monthly ROI", end:17.8, suffix:"%", decimals:1 },
            ].map((s,i)=>(
              <div key={i} className="text-center py-6 px-3 rounded-2xl" style={{ background:"linear-gradient(135deg,#0a1a0b,#061009)", border:"1px solid rgba(34,197,94,0.12)" }}>
                <p className="number-gradient font-black mb-2" style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.6rem,4vw,3rem)", lineHeight:1 }}>
                  {s.display || <Counter end={s.end} suffix={s.suffix} decimals={s.decimals||0}/>}
                </p>
                <p className="text-[#6b7280] font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(10px,1.5vw,13px)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 py-4 ticker-wrap">
          <div className="ticker-inner">
            {[...partners,...partners,...partners,...partners].map((p,i)=>(
              <span key={i} className="inline-flex items-center gap-3 mx-8 text-[#4a5568] text-sm font-semibold flex-shrink-0" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]/50"/>
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURED CREATORS — Progress Bars + Video Pitch + FOMO
      ══════════════════════════════════════════════════════════════ */}
      <section id="creators" className="py-28  relative">
        <div className="absolute inset-0 section-glow-r pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <p className="text-[#22c55e] text-xs mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>LIVE CAMPAIGNS</p>
              <h2 className="font-black" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2rem,3.5vw,3rem)" }}>
                Creators seeking<br /><span className="text-[#22c55e] italic">funding right now</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0a1a0b] border border-[#2d5a35] rounded-full px-4 py-2 text-xs" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
                <span className="text-[#6b7280]">{creators.length} active campaigns</span>
              </div>
              <button onClick={() => navigate("/browse")} className="text-sm font-bold text-[#22c55e] hover:text-[#4ade80] transition-colors flex items-center gap-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                View all <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} />
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {creators.map((c,i)=>(
              <CreatorCard key={i} {...c}/>
            ))}
          </div>

          {/* Bottom urgency strip */}
          <div className="mt-8 bg-[#070d08] border border-[#2d5a35] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={faFire} style={{ fontSize: "18px", color: "#fb923c" }} />
              <div>
                <p className="text-white font-bold text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>3 campaigns closing this week</p>
                <p className="text-[#6b7280] text-xs">Don't miss out — investments lock when goals are hit</p>
              </div>
            </div>
            <button onClick={() => navigate("/register")} className="flex-shrink-0 bg-[#22c55e] text-black font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-[#16a34a] transition-all" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Invest Now →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" className="py-28  bg-[#030604] relative">
        <div className="absolute inset-0 section-glow-l pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[#22c55e] text-xs mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>HOW IT WORKS</p>
            <h2 className="font-black mb-4" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2.2rem,4vw,3.5rem)" }}>
              A deal built on<br /><span className="text-[#22c55e] italic">shared success</span>
            </h2>
            <p className="text-[#6b7280] max-w-xl mx-auto">Four steps from profile to profit. No banks, no middlemen, no debt.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n:"01", icon:"🎯", title:"Creator Applies",         body:"Build a verified profile, set your skill, funding goal, profit-share %, and projected income. Takes 5 minutes.",      color:"card-blue"   },
              { n:"02", icon:"💰", title:"Investor Funds",           body:"Browse by skill, credit score, or join a Syndicate. Send a proposal and lock your capital in escrow.",               color:"card-purple" },
              { n:"03", icon:"📈", title:"Creator Earns & Reports",  body:"Monthly income reports auto-calculate your investor's share. Everyone sees the numbers in real time.",              color:"card-teal"   },
              { n:"04", icon:"🔓", title:"Milestones Release Funds", body:"Capital unlocks in stages as the creator proves progress. Investors vote within 72 hours to approve or dispute.",   color:"card-green"  },
            ].map((step,i)=>(
              <div key={i} className={`group border rounded-2xl p-6 transition-all card-hover ${step.color}`}>
                <div className="flex items-center justify-between mb-5">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-[#1a2e1d] font-black text-4xl" style={{ fontFamily:"'Fraunces',serif" }}>{step.n}</span>
                </div>
                <h3 className="text-white font-bold mb-3 text-base" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{step.title}</h3>
                <p className="text-[#6b7280] text-sm leading-relaxed">{step.body}</p>
                <div className="mt-5 h-0.5 bg-[#0f1a12] rounded-full overflow-hidden">
                  <div className="h-full gradient-bar rounded-full w-0 group-hover:w-full transition-all duration-700"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ACCORDION + MOCKUP ══════════ */}
      <section id="features" className="py-28  relative">
        <div className="absolute inset-0 section-glow-r pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <p className="text-[#22c55e] text-xs mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>FEATURES</p>
            <h2 className="font-black mb-3" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2rem,3.5vw,3rem)" }}>
              Everything you need.<br /><span className="text-[#4a5568]">Nothing you don't.</span>
            </h2>
            <p className="text-[#6b7280] text-sm mb-8 max-w-md">Built specifically for the African skilled economy. Every feature maps to a real pain point.</p>
            <div className="space-y-4">
              {features.map((f,i)=>(
                <AccordionItem key={i} faIcon={f.faIcon} iconColor={f.iconColor} title={f.title} description={f.description} stat={f.stat} isOpen={openAccordion===i} onToggle={()=>setOpenAccordion(openAccordion===i?-1:i)}/>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="bg-[#070d08] border border-[#2d5235] rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-56 h-56 bg-[#22c55e]/6 rounded-full blur-3xl pointer-events-none"/>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[#4a5568] text-xs mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>PORTFOLIO VALUE</p>
                <p className="font-black text-4xl" style={{ fontFamily:"'Fraunces',serif" }}>
                  $<Counter end={24850} duration={2500}/>
                  <span className="text-[#22c55e] text-base ml-2 align-middle">+18%</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[#22c55e] font-black text-xl" style={{ fontFamily:"'Fraunces',serif" }}>+$3,420</p>
                <p className="text-[#4a5568] text-xs" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>TOTAL EARNED</p>
              </div>
            </div>
            <div className="flex items-end gap-1 h-20 mb-6 px-1">
              {[35,55,42,70,58,85,65,92,75,88,70,100].map((h,i)=>(
                <div key={i} className="flex-1 rounded-t-lg" style={{ height:`${h}%`, background:i===11?"linear-gradient(to top,#16a34a,#4ade80)":i>=9?"rgba(34,197,94,0.25)":"#0f1a12", border:"1px solid #2d5235" }}/>
              ))}
            </div>
            <div className="space-y-3 mb-5">
              {[
                {name:"Amara – Fashion",  share:15,monthly:180,pct:90},
                {name:"Kofi – Carpentry", share:12,monthly:95, pct:65},
                {name:"Ngozi – Photo",    share:20,monthly:240,pct:80},
              ].map(inv=>(
                <div key={inv.name} className="flex items-center gap-3 bg-[#0a1a0b] border border-[#2d5235] rounded-xl p-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/40 flex items-center justify-center text-[#22c55e] text-xs font-black">{inv.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white text-xs font-semibold truncate">{inv.name}</span>
                      <span className="text-[#22c55e] text-xs font-bold ml-2">+${inv.monthly}/mo</span>
                    </div>
                    <div className="h-1 bg-[#1a2e1d] rounded-full">
                      <div className="h-full gradient-bar rounded-full" style={{ width:`${inv.pct}%` }}/>
                    </div>
                  </div>
                  <span className="text-[#4a5568] text-xs flex-shrink-0">{inv.share}%</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-[#0a1a0b] border border-[#22c55e]/40 rounded-xl p-3">
              <FontAwesomeIcon icon={faChartBar} style={{ fontSize: "13px", color: "#a855f7" }} />
              <p className="text-[#9ca3af] text-xs">Avg monthly ROI across 3 investments: <span className="text-[#22c55e] font-bold">17.8%</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOR CREATORS / INVESTORS ══════════ */}
      <section className="py-28  bg-[#030604]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-6">
          {[
            { emoji:"🎨", tag:"FOR CREATORS", title:"Stop borrowing.", accent:"Start partnering.", body:"Traditional loans saddle you with debt. SkillFund connects you with investors who believe in your skill — sharing your upside with no interest, no deadline pressure.", items:["Set your own terms — share %, duration","Capital released in milestone-based stages","Build your SkillFund credit score over time","Dashboard tracks all earnings and investors"], btnLabel:"Apply as Creator", btnStyle:"bg-[#22c55e] text-black hover:bg-[#16a34a]", color:"card-teal" },
            { emoji:"💼", tag:"FOR INVESTORS", title:"Back real people.", accent:"Earn real returns.", body:"While stocks fluctuate and savings stagnate, SkillFund gives you direct exposure to Africa's growing skilled economy — one verified creator at a time.", items:["Browse by skill, category, and credit score","Vote on milestones before funds are released","Join Syndicates to pool capital with others","Withdraw via Paystack, Stripe, or USDT"], btnLabel:"Start Investing", btnStyle:"border border-[#22c55e]/50 hover:border-[#22c55e]/60 text-white hover:bg-[#0a1a0b]", color:"card-blue" },
          ].map(card=>(
            <div key={card.tag} className={`border rounded-3xl p-8 transition-all card-hover ${card.color}`}>
              <div className="w-12 h-12 rounded-2xl bg-[#22c55e]/15 border border-[#22c55e]/40 flex items-center justify-center mb-5 text-2xl">{card.emoji}</div>
              <p className="text-[#22c55e] text-xs mb-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>{card.tag}</p>
              <h3 className="font-black text-2xl mb-3" style={{ fontFamily:"'Fraunces',serif" }}>{card.title}<br/><span className="text-[#22c55e]">{card.accent}</span></h3>
              <p className="text-[#6b7280] text-sm leading-relaxed mb-6">{card.body}</p>
              <div className="space-y-3 mb-7">
                {card.items.map(item=>(
                  <div key={item} className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "13px", color: "#22c55e", flexShrink: 0 }} />
                    <p className="text-[#9ca3af] text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <button onClick={()=>navigate("/register")} className={`group flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all ${card.btnStyle}`} style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {card.btnLabel} <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} className="group-hover:translate-x-0.5 transition-transform"/>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════ CREATOR SUCCESS STORIES ══════════ */}
      <section className="py-28 bg-[#030604] relative">
        <div className="absolute inset-0 section-glow-l pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#22c55e] text-xs mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>SUCCESS STORIES</p>
            <h2 className="font-black mb-3" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2rem,3.5vw,3rem)" }}>
              What happens after<br /><span className="text-[#22c55e] italic">funding</span>
            </h2>
            <p className="text-[#6b7280] max-w-xl mx-auto text-sm">Real creators. Real growth. Real returns for investors.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {[
              { emoji:"👗", name:"Ada Okafor",   skill:"Fashion Designer, Lagos",     tagline:"From home tailor to studio owner", funded:"$2,000", roi:"18%", months:8,  revenue:"$3,500/month", highlight:false, color:"card-rose",
                before:["Working alone from home","1 basic sewing machine","Lost clients to larger shops","No online presence"],
                after:["Fashion studio in Lagos","3 full-time employees","Corporate uniform contracts","Brand website + Instagram shop"],
              },
              { emoji:"📷", name:"Daniel Bakare", skill:"Photographer, Abuja",         tagline:"Turned a borrowed camera into a studio", funded:"$1,500", roi:"15%", months:6,  revenue:"$2,800/month", highlight:true,  color:"card-blue",
                before:["Freelancing with borrowed gear","Turning down paid shoots","No studio space","Missing high-value clients"],
                after:["Own Canon EOS R5 + lighting rig","Professional studio rental","Online booking system live","2 trained assistants"],
              },
              { emoji:"🍰", name:"Bella Okonkwo", skill:"Baker & Pastry Chef, PH",    tagline:"Went from kitchen baker to delivery brand", funded:"$3,000", roi:"20%", months:10, revenue:"$4,200/month", highlight:false, color:"card-amber",
                before:["Baking from home kitchen","Capped at 10 orders/week","No delivery capability","Word-of-mouth only"],
                after:["Commercial kitchen space","Delivery motorbike + app","40+ weekly orders","Featured in local food blog"],
              },
            ].map((story, i) => (
              <div key={i} className={`border rounded-3xl overflow-hidden transition-all card-hover flex flex-col ${story.color} ${story.highlight ? "scale-105 shadow-2xl" : ""}`}>
                {/* Top colored header */}
                <div className="p-7 pb-5" style={{ borderBottom:"1px solid rgba(255,255,255,0.18)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">{story.emoji}</div>
                    <div>
                      <p className="text-white font-black text-lg leading-tight" style={{ fontFamily:"'Fraunces',serif" }}>{story.name}</p>
                      <p className="text-white/50 text-xs mt-0.5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{story.skill}</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed mb-5">{story.tagline}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-[#22c55e] font-black" style={{ fontFamily:"'Fraunces',serif", fontSize:"2.5rem", lineHeight:1 }}>{story.roi}</span>
                    <span className="text-white/40 text-sm mb-1.5 ml-1">/ avg ROI</span>
                  </div>
                  <div className="flex gap-4 text-xs mt-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>
                    <span className="text-white/40">Funded <span className="text-white/70">{story.funded}</span></span>
                    <span className="text-white/40">·</span>
                    <span className="text-white/40">{story.months} months ago</span>
                  </div>
                </div>

                {/* Before list */}
                <div className="px-7 pt-6 pb-3">
                  <p className="text-white/40 text-xs font-bold mb-3 flex items-center gap-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    <span className="w-2 h-2 rounded-full bg-white/20 inline-block"/>BEFORE SKILLFUND
                  </p>
                  <div className="space-y-2.5">
                    {story.before.map((b,j) => (
                      <div key={j} className="flex items-start gap-3">
                        <span className="text-white/20 mt-0.5 flex-shrink-0">✕</span>
                        <span className="text-white/50 text-sm">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* After list */}
                <div className="px-7 pt-4 pb-6 flex-1">
                  <p className="text-[#22c55e] text-xs font-bold mb-3 flex items-center gap-2" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block"/>AFTER FUNDING
                  </p>
                  <div className="space-y-2.5">
                    {story.after.map((a,j) => (
                      <div key={j} className="flex items-start gap-3">
                        <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "13px", color: "#22c55e", marginTop: "2px", flexShrink: 0 }} />
                        <span className="text-white/80 text-sm">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue + CTA */}
                <div className="px-7 pb-7">
                  <div className="rounded-2xl p-4 mb-4 text-center" style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.2)" }}>
                    <p className="text-white/50 text-xs mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>NOW EARNING</p>
                    <p className="text-[#22c55e] font-black text-2xl" style={{ fontFamily:"'Fraunces',serif" }}>{story.revenue}</p>
                  </div>
                  <button onClick={()=>navigate("/register")} className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${story.highlight ? "bg-[#22c55e] text-black hover:bg-[#16a34a]" : "bg-white/10 text-white hover:bg-white/15"}`} style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    Invest in creators like {story.name.split(" ")[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CREATOR PROGRESS FEED ══════════ */}
      <section className="py-28  relative">
        <div className="absolute inset-0 section-glow-r pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#22c55e] text-xs mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>LIVE PROGRESS FEED</p>
              <h2 className="font-black mb-4" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2rem,3.5vw,3rem)" }}>
                Watch your investment<br /><span className="text-[#22c55e] italic">grow in real time</span>
              </h2>
              <p className="text-[#6b7280] text-sm leading-relaxed mb-8 max-w-md">Every creator posts milestone updates as they use their funding. You see exactly what your money is doing — no surprises, full transparency.</p>
              <div className="space-y-4">
                {[
                  { icon:"🎯", title:"Milestone reports", body:"Creators post evidence of completed milestones before funds are released." },
                  { icon:"🗳️", title:"Investor votes",     body:"You approve or dispute each milestone within a 72-hour window." },
                  { icon:"📊", title:"Monthly earnings",   body:"Income reports auto-calculate and credit your share every month." },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0a1a0b] border border-[#2d5a35] flex items-center justify-center text-lg flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-white font-bold text-sm mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{item.title}</p>
                      <p className="text-[#6b7280] text-sm">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress feed cards */}
            <div className="space-y-4">
              {[
                { name:"Ada Fashion", emoji:"👗", funded:2000, raised:1450, color:"card-rose", milestones:[
                  { label:"Bought 2 industrial sewing machines", done:true },
                  { label:"Completed 50 school uniforms order", done:true },
                  { label:"Hired first assistant",               done:true },
                  { label:"Opening retail shop next month",      done:false },
                ]},
                { name:"Tunde Photography", emoji:"📷", funded:1500, raised:900, color:"card-blue", milestones:[
                  { label:"Purchased Canon EOS R5 camera",       done:true },
                  { label:"Completed 12 client shoots",          done:true },
                  { label:"Studio space rental deposit paid",     done:false },
                  { label:"Launch studio officially",             done:false },
                ]},
              ].map((creator, i) => (
                <div key={i} className={`border rounded-2xl p-5 transition-all card-hover ${creator.color}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/40 flex items-center justify-center text-lg">{creator.emoji}</div>
                      <div>
                        <p className="text-white font-bold text-sm" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{creator.name}</p>
                        <p className="text-[#4a5568] text-xs">{Math.round((creator.raised/creator.funded)*100)}% funded of ${creator.funded.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-xs text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/40 rounded-full px-2.5 py-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>
                      ACTIVE
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-[#0a1a0b] rounded-full mb-4 overflow-hidden">
                    <div className="h-full gradient-bar rounded-full" style={{ width:`${Math.round((creator.raised/creator.funded)*100)}%` }}/>
                  </div>

                  {/* Milestones checklist */}
                  <div className="space-y-2">
                    {creator.milestones.map((m, j) => (
                      <div key={j} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${m.done ? "bg-[#22c55e] border-[#22c55e]" : "border-[#2d5a35] bg-transparent"}`}>
                          {m.done && <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "10px", color: "#000" }} />}
                        </div>
                        <p className={`text-xs ${m.done ? "text-[#9ca3af] line-through" : "text-[#6b7280]"}`}>{m.label}</p>
                        {!m.done && j === creator.milestones.findIndex(x => !x.done) && (
                          <span className="ml-auto text-xs text-orange-400 bg-orange-500/10 border border-orange-500/40 rounded-full px-2 py-0.5 flex-shrink-0" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>NEXT</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS — Auto-scroll rows ══════════ */}
      <section id="stories" className="py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-14">
          <div className="grid lg:grid-cols-2 gap-12 items-end">
            <div>
              <p className="text-[#22c55e] text-xs mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>REAL STORIES</p>
              <h2 className="font-black" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2rem,3.5vw,3rem)" }}>Loved and trusted<br/>by our community</h2>
            </div>
            <p className="text-[#6b7280] text-sm leading-relaxed lg:text-right">Real experiences from creators and investors already building something together on SkillFund.</p>
          </div>
        </div>

        {/* Row 1 — scrolls LEFT */}
        <div className="mb-5 overflow-hidden" style={{ maskImage:"linear-gradient(90deg,transparent,black 8%,black 92%,transparent)" }}>
          <div style={{ display:"flex", gap:"20px", animation:"scrollLeft 30s linear infinite", width:"max-content" }}>
            {[
              { quote:"I got funded in 3 days. My investor understood what I was building and trusted the process. My fashion business grew 3x in 8 months.", name:"Amara Toure", role:"Fashion Designer, Lagos", emoji:"👗", color:"card-green" },
              { quote:"The milestone system meant I wasn't handing over money blindly. I could see exactly what the creator achieved before approving each release.", name:"David Osei", role:"Investor, Accra", emoji:"💼", color:"card-blue" },
              { quote:"My SkillFund score went from 50 to 89 in six months just by reporting on time. Investors started approaching me instead.", name:"Kwame N.", role:"Carpenter, Kumasi", emoji:"🪚", color:"card-purple" },
              { quote:"I joined a Syndicate with 4 other investors and we backed a photography studio together. The weighted voting system is genius.", name:"Fatima A.", role:"Investor, Kano", emoji:"📸", color:"card-amber" },
              { quote:"Zero debt, zero interest. I used SkillFund to expand my bakery and paid my investor back from actual sales. This is how it should work.", name:"Grace O.", role:"Baker, Port Harcourt", emoji:"🍞", color:"card-teal" },
              { quote:"Clean, transparent, and the USDT withdrawal was seamless. Will definitely fund more creators next quarter.", name:"Emeka C.", role:"Investor, Enugu", emoji:"🌍", color:"card-rose" },
              // duplicates for seamless loop
              { quote:"I got funded in 3 days. My investor understood what I was building and trusted the process. My fashion business grew 3x in 8 months.", name:"Amara Toure", role:"Fashion Designer, Lagos", emoji:"👗", color:"card-green" },
              { quote:"The milestone system meant I wasn't handing over money blindly. I could see exactly what the creator achieved before approving each release.", name:"David Osei", role:"Investor, Accra", emoji:"💼", color:"card-blue" },
              { quote:"My SkillFund score went from 50 to 89 in six months just by reporting on time. Investors started approaching me instead.", name:"Kwame N.", role:"Carpenter, Kumasi", emoji:"🪚", color:"card-purple" },
            ].map((t,i) => (
              <div key={i} className={`border rounded-2xl p-6 flex-shrink-0 card-hover ${t.color}`} style={{ width:"320px" }}>
                <div className="text-3xl text-white/10 font-serif mb-3 leading-none">"</div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-base flex-shrink-0">{t.emoji}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 flex-shrink-0">
                    {Array.from({length:5}).map((_,j)=><FontAwesomeIcon key={j} icon={faStar} style={{ fontSize: "9px", color: "#f59e0b" }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls RIGHT */}
        <div className="overflow-hidden" style={{ maskImage:"linear-gradient(90deg,transparent,black 8%,black 92%,transparent)" }}>
          <div style={{ display:"flex", gap:"20px", animation:"scrollRight 35s linear infinite", width:"max-content" }}>
            {[
              { quote:"Clean, transparent, and the USDT withdrawal was seamless. Will definitely fund more creators next quarter.", name:"Emeka C.", role:"Investor, Enugu", emoji:"🌍", color:"card-rose" },
              { quote:"Zero debt, zero interest. I used SkillFund to expand my bakery and paid my investor back from actual sales. This is how it should work.", name:"Grace O.", role:"Baker, Port Harcourt", emoji:"🍞", color:"card-teal" },
              { quote:"I joined a Syndicate with 4 other investors and we backed a photography studio together. The weighted voting system is genius.", name:"Fatima A.", role:"Investor, Kano", emoji:"📸", color:"card-amber" },
              { quote:"SkillFund helped me open my first photography studio. The milestone system kept me accountable and my investor happy.", name:"Daniel B.", role:"Photographer, Abuja", emoji:"📷", color:"card-blue" },
              { quote:"I invested in three creators and earned my first returns within 90 days. No bank would give me that on savings.", name:"Ngozi A.", role:"Investor, Lagos", emoji:"💰", color:"card-green" },
              { quote:"The credit score feature is a game changer. Investors can actually see your track record before committing.", name:"Sola M.", role:"Videographer, Lagos", emoji:"🎬", color:"card-purple" },
              // duplicates for seamless loop
              { quote:"Clean, transparent, and the USDT withdrawal was seamless. Will definitely fund more creators next quarter.", name:"Emeka C.", role:"Investor, Enugu", emoji:"🌍", color:"card-rose" },
              { quote:"Zero debt, zero interest. I used SkillFund to expand my bakery and paid my investor back from actual sales. This is how it should work.", name:"Grace O.", role:"Baker, Port Harcourt", emoji:"🍞", color:"card-teal" },
              { quote:"I joined a Syndicate with 4 other investors and we backed a photography studio together. The weighted voting system is genius.", name:"Fatima A.", role:"Investor, Kano", emoji:"📸", color:"card-amber" },
            ].map((t,i) => (
              <div key={i} className={`border rounded-2xl p-6 flex-shrink-0 card-hover ${t.color}`} style={{ width:"320px" }}>
                <div className="text-3xl text-white/10 font-serif mb-3 leading-none">"</div>
                <p className="text-white/70 text-sm leading-relaxed mb-5">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-base flex-shrink-0">{t.emoji}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/40 text-xs">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 flex-shrink-0">
                    {Array.from({length:5}).map((_,j)=><FontAwesomeIcon key={j} icon={faStar} style={{ fontSize: "9px", color: "#f59e0b" }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" className="py-28  bg-[#030604]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#22c55e] text-xs mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, letterSpacing:".12em" }}>PRICING</p>
            <h2 className="font-black mb-3" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2rem,3.5vw,3rem)" }}>Simple, honest pricing</h2>
            <p className="text-[#6b7280]">Start free. Upgrade when you're ready to scale.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name:"Basic",   price:"Free", fee:"5%", highlight:false, color:"card-blue",   features:["Browse public creators","1 active investment","Standard support","Basic dashboard"] },
              { name:"Starter", price:"$9",   fee:"4%", highlight:false, color:"card-teal",   features:["More creator visibility","5 active investments","Priority support","Analytics"] },
              { name:"Pro",     price:"$25",  fee:"3%", highlight:true,  color:"card-green",  features:["Full creator access","Unlimited investments","Syndicate access","Advanced analytics"] },
              { name:"Elite",   price:"$60",  fee:"2%", highlight:false, color:"card-purple", features:["All Pro features","Lowest 2% fees","Dedicated manager","Early features"] },
            ].map(plan=>(
              <div key={plan.name} className={`border rounded-2xl p-6 card-hover ${plan.color} ${plan.highlight ? "shadow-2xl shadow-[#22c55e]/10 scale-105" : ""}`}>
                {plan.highlight&&<div className="text-xs text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/40 rounded-full px-2.5 py-0.5 inline-block mb-3" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700 }}>POPULAR</div>}
                <p className="text-white font-bold mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`font-black text-4xl ${plan.highlight?"number-gradient":"text-white"}`} style={{ fontFamily:"'Fraunces',serif" }}>{plan.price}</span>
                  {plan.price!=="Free"&&<span className="text-[#4a5568] text-sm mb-1.5">/mo</span>}
                </div>
                <p className="text-[#22c55e] text-xs mb-5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600 }}>{plan.fee} withdrawal fee</p>
                <div className="space-y-2.5 mb-6">
                  {plan.features.map(f=>(
                    <div key={f} className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: "#22c55e", flexShrink: 0 }} />
                      <span className="text-[#9ca3af] text-xs">{f}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>navigate("/register")} className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${plan.highlight?"bg-[#22c55e] text-black hover:bg-[#16a34a] shadow-lg shadow-[#22c55e]/20":"border border-[#2d5235] text-white hover:border-[#22c55e]/60 hover:bg-[#0a1a0b]"}`} style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  Get started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA — Orbiting avatars ══════════ */}
      <section className="py-40  relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 60% at 35% 45%,rgba(34,197,94,0.09) 0%,transparent 70%)" }} />
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none"/>
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <div className="relative w-56 h-56 mx-auto mb-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-2xl bg-[#22c55e] flex items-center justify-center shadow-2xl shadow-[#22c55e]/40">
                <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "30px", color: "#000" }} />
              </div>
            </div>
            <div className="absolute inset-0 rounded-full border border-[#22c55e]/25"/>
            <div className="absolute inset-6 rounded-full border border-[#22c55e]/20"/>
            {["👗","💼","🪚","📷","🍞","🔧"].map((emoji,i)=>(
              <div key={i} className="absolute w-10 h-10 rounded-full bg-[#0a1a0b] border border-[#2d5a35] flex items-center justify-center text-base shadow-xl"
                style={{ top:"50%",left:"50%",marginTop:"-20px",marginLeft:"-20px",...ORBIT_STYLES[i] }}>
                {emoji}
              </div>
            ))}
          </div>
          <h2 className="font-black mb-5 glow-text" style={{ fontFamily:"'Fraunces',serif", fontSize:"clamp(2.5rem,5vw,4.5rem)", lineHeight:1.05 }}>
            Ready to bet on<br/><em className="text-[#22c55e] not-italic">African skill?</em>
          </h2>
          <p className="text-[#6b7280] text-lg mb-10 max-w-lg mx-auto">Join 1,200+ creators and investors already building something real together.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={()=>navigate("/register")} className="group flex items-center gap-2.5 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold px-8 py-4 rounded-xl transition-all text-base hover:shadow-2xl hover:shadow-[#22c55e]/25" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Create your account <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "15px" }} className="group-hover:translate-x-1 transition-transform"/>
            </button>
            <Link to="/login" className="text-[#22c55e] font-bold text-base hover:text-[#4ade80] transition-colors underline underline-offset-4" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Already have an account? Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER — 4 stacked sections ══════════ */}
      <footer className="bg-[#030604]">

        {/* Section 1: Brand + tagline */}
        <div className="py-14" style={{ background:"linear-gradient(135deg,#071a0b,#040806)" }}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e] flex items-center justify-center">
                  <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "16px", color: "#000" }} />
                </div>
                <span className="font-black text-2xl" style={{ fontFamily:"'Fraunces',serif" }}>SkillFund</span>
              </div>
              <p className="text-[#9ca3af] text-sm leading-relaxed">Africa's first skill investment marketplace. Connecting talented creators with investors who believe in their potential. No debt. No middlemen. Just shared success.</p>
            </div>
            <div className="flex items-center gap-3">
              {[
                { label:"Twitter/X", icon:"𝕏", bg:"#0d1a2e", accent:"#3b82f6" },
                { label:"LinkedIn",  icon:"in", bg:"#0d1a2e", accent:"#3b82f6" },
                { label:"Instagram", icon:"ig", bg:"#2e0d1a", accent:"#f43f5e" },
                { label:"YouTube",   icon:"▶",  bg:"#2e0d0d", accent:"#ef4444" },
              ].map(s => (
                <a key={s.label} href="#" className="w-10 h-10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all text-xs font-black hover:scale-110" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", background:s.bg }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: 4-column links */}
        <div className="py-14" style={{ background:"var(--bg)" }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                { heading:"Platform",     accent:"#22c55e", links:[{ label:"Browse Creators", href:"#creators" },{ label:"How It Works", href:"#how-it-works" },{ label:"Syndicates", href:"#" },{ label:"Pricing", href:"#pricing" },{ label:"SkillFund Score", href:"#" }] },
                { heading:"For Creators", accent:"#14b8a6", links:[{ label:"Apply for Funding", href:"/register" },{ label:"Creator Dashboard", href:"/dashboard" },{ label:"Milestones", href:"#" },{ label:"Success Stories", href:"#" },{ label:"Creator FAQ", href:"#" }] },
                { heading:"For Investors",accent:"#3b82f6", links:[{ label:"Start Investing", href:"/register" },{ label:"Investor Dashboard", href:"/dashboard" },{ label:"Syndicates", href:"#" },{ label:"Withdraw Earnings", href:"#" },{ label:"Investor FAQ", href:"#" }] },
                { heading:"Company",      accent:"#a855f7", links:[{ label:"About Us", href:"#" },{ label:"Blog", href:"#" },{ label:"Careers", href:"#" },{ label:"Contact Us", href:"#" },{ label:"Privacy & Terms", href:"#" }] },
              ].map(col => (
                <div key={col.heading}>
                  <p className="font-black text-sm mb-5" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", color:col.accent }}>{col.heading}</p>
                  <div className="space-y-3">
                    {col.links.map(l => (
                      <a key={l.label} href={l.href} className="block text-[#6b7280] text-sm hover:text-white transition-colors">{l.label}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Newsletter */}
        <div className="py-14" style={{ background:"linear-gradient(135deg,#071a0b,#040806)" }}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <p className="text-white font-black text-xl mb-2" style={{ fontFamily:"'Fraunces',serif" }}>Stay in the loop</p>
              <p className="text-[#6b7280] text-sm">Get updates on new creators, investment opportunities, and platform features.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto md:min-w-96">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-[#0a1a0b] rounded-xl px-4 py-3 text-sm text-white placeholder-[#2d4a31] outline-none focus:ring-1 focus:ring-[#22c55e]/40 transition-all"
                style={{ fontFamily:"'DM Sans',sans-serif" }}
              />
              <button className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold text-sm px-6 py-3 rounded-xl transition-all flex-shrink-0" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Bottom bar */}
        <div className="py-6" style={{ background:"#020502" }}>
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[#374151] text-xs">© 2025 SkillFund Technologies Ltd. All rights reserved. Built in Africa 🌍</p>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"/>
              <span className="text-[#2d4a31] text-xs font-bold" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>All systems operational</span>
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
}
