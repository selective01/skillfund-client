import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, TrendingUp, CheckCircle, Star, Flame } from "lucide-react";
import useAuthStore from "../store/authStore";
import api from "../utils/api";
import toast from "react-hot-toast";

// ─── Animated stat counter dots ───────────────────────────────────────────────
const STATS = [
  { value: "$4.2M+", label: "Total Funded" },
  { value: "1,200+", label: "Creators" },
  { value: "17.8%",  label: "Avg ROI" },
  { value: "340+",   label: "Investors" },
];

const TESTIMONIALS = [
  { quote: "Got funded in 3 days. My fashion business grew 3x.", name: "Amara T.", role: "Fashion Designer", emoji: "👗" },
  { quote: "Earned returns within 90 days. Better than any savings account.", name: "David O.", role: "Investor, Accra", emoji: "💼" },
  { quote: "My SkillFund score hit 89. Investors now come to me.", name: "Kwame N.", role: "Carpenter", emoji: "🪚" },
];

// ─── Visual panel — right side ─────────────────────────────────────────────
function VisualPanel({ tab }) {
  const isLogin = tab === "login";
  return (
    <div className="relative flex flex-col justify-between p-10 overflow-hidden" style={{
      background: "linear-gradient(145deg, #0a1f0c 0%, #061509 50%, #040d06 100%)",
    }}>
      {/* Mesh grid bg */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(34,197,94,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.05) 1px,transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Glow orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none" style={{
        background: "radial-gradient(ellipse, rgba(34,197,94,0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />

      {/* Floating particles */}
      {[[12,20],[78,35],[25,65],[88,55],[50,80],[15,88],[70,15],[40,45]].map(([x,y],i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full bg-[#22c55e]" style={{
          left:`${x}%`, top:`${y}%`,
          opacity: 0.2 + (i % 4) * 0.15,
          animation: `authParticle ${2 + (i % 3)}s ease-in-out ${i * 0.4}s infinite`,
        }}/>
      ))}

      {/* Top — logo + headline */}
      <div className="relative z-10">
        <Link to="/" className="flex items-center gap-2.5 mb-10 group w-fit">
          <div className="w-9 h-9 rounded-xl bg-[#22c55e] flex items-center justify-center shadow-lg shadow-[#22c55e]/30 group-hover:scale-105 transition-transform">
            <TrendingUp size={16} className="text-black" />
          </div>
          <span className="font-black text-xl text-white" style={{ fontFamily: "'Fraunces', serif" }}>SkillFund</span>
        </Link>

        <div className="mb-8">
          <p className="text-[#22c55e] text-xs font-bold mb-3 tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>
            {isLogin ? "WELCOME BACK" : "JOIN THE MOVEMENT"}
          </p>
          <h2 className="font-black leading-tight mb-4" style={{
            fontFamily: "'Fraunces', serif",
            fontSize: "clamp(2rem, 3vw, 2.8rem)",
            color: "white",
          }}>
            {isLogin
              ? <>Your portfolio<br /><span className="text-[#22c55e] italic">awaits you</span></>
              : <>Africa's skills<br /><span className="text-[#22c55e] italic">need funding</span></>
            }
          </h2>
          <p className="text-[#6b7280] text-sm leading-relaxed max-w-sm">
            {isLogin
              ? "Sign back in to track your investments, approve milestones, and collect your earnings."
              : "Join 1,200+ creators and 340+ investors already building something real together on SkillFund."
            }
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {STATS.map((s, i) => (
            <div key={i} className="rounded-xl px-4 py-3" style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.03))",
              border: "1px solid rgba(34,197,94,0.15)",
            }}>
              <p className="font-black text-xl text-[#22c55e]" style={{ fontFamily: "'Fraunces', serif" }}>{s.value}</p>
              <p className="text-[#4a5568] text-xs font-semibold" style={{ fontFamily: "'Syne', sans-serif" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Middle — testimonial cards */}
      <div className="relative z-10 space-y-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="rounded-2xl px-4 py-3.5 flex items-start gap-3" style={{
            background: "rgba(10,26,11,0.8)",
            border: "1px solid rgba(34,197,94,0.12)",
            backdropFilter: "blur(8px)",
            transform: i === 1 ? "translateX(16px)" : i === 2 ? "translateX(8px)" : "none",
            opacity: 1 - i * 0.15,
          }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: "rgba(34,197,94,0.1)" }}>
              {t.emoji}
            </div>
            <div className="min-w-0">
              <p className="text-white/70 text-xs leading-relaxed mb-1">"{t.quote}"</p>
              <div className="flex items-center gap-2">
                <p className="text-[#22c55e] text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>{t.name}</p>
                <span className="text-white/20 text-xs">·</span>
                <p className="text-white/30 text-xs">{t.role}</p>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({length:5}).map((_,j) => <Star key={j} size={8} className="text-[#22c55e] fill-[#22c55e]"/>)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom — live activity pulse */}
      <div className="relative z-10 mt-6 flex items-center gap-3 rounded-xl px-4 py-3" style={{
        background: "rgba(10,26,11,0.6)",
        border: "1px solid rgba(34,197,94,0.1)",
      }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0"/>
          <span className="text-[#4a5568] text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>LIVE</span>
        </div>
        <p className="text-white/40 text-xs">
          <span className="text-[#22c55e] font-semibold">Ngozi A.</span> just invested <span className="text-white/70">$500</span> in Ada Fashion
        </p>
        <span className="text-white/20 text-xs ml-auto flex-shrink-0">just now</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN AUTH PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  // Tab: "login" | "register"
  const [tab, setTab] = useState("login");

  // Form state
  const [loginForm,    setLoginForm]    = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "investor" });
  const [showPass,     setShowPass]     = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [errors,       setErrors]       = useState({});

  // ── Validation ──────────────────────────────────────────────────────────────
  function validateLogin() {
    const e = {};
    if (!loginForm.email)    e.email    = "Email is required";
    if (!loginForm.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateRegister() {
    const e = {};
    if (!registerForm.name)    e.name    = "Full name is required";
    if (!registerForm.email)   e.email   = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(registerForm.email)) e.email = "Enter a valid email";
    if (!registerForm.password) e.password = "Password is required";
    else if (registerForm.password.length < 8) e.password = "At least 8 characters";
    if (registerForm.password !== registerForm.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit handlers ──────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/login", loginForm);
      setUser(res.data.user, res.data.token);
      toast.success("Welcome back!");
      navigate(res.data.user.role === "creator" ? "/dashboard/creator" : "/dashboard/investor");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const { confirmPassword: _cp, ...payload } = registerForm;
      const res = await api.post("/auth/register", payload);
      setUser(res.data.user, res.data.token);
      toast.success("Account created! Welcome to SkillFund.");
      navigate(res.data.user.role === "creator" ? "/dashboard/creator" : "/dashboard/investor");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Shared input style helper ────────────────────────────────────────────────
  function inputCls(field) {
    return `w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all placeholder-[#3d5540] ${
      errors[field]
        ? "bg-[#1a0909] border border-red-500/60 focus:border-red-400"
        : "bg-[#0d1a0f] border border-[#1e3a22] focus:border-[#22c55e]/60 focus:bg-[#0f1e12]"
    }`;
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif", background: "#080f09" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,400;1,9..144,700&family=Syne:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        @keyframes authParticle { 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.7;transform:scale(2)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        .auth-slide { animation: slideUp 0.4s ease forwards; }
        .auth-fade  { animation: fadeIn  0.3s ease forwards; }
        .role-btn { transition: all .2s ease; }
        .role-btn.active { background: linear-gradient(135deg,#0f2e10,#091e09); border-color: #22c55e88; }
        .role-btn:not(.active) { background: #0d1a0f; border-color: #1e3a22; }
        .role-btn:not(.active):hover { border-color: #2d5a31; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 50px #0d1a0f inset !important; -webkit-text-fill-color: white !important; }
      `}</style>

      {/* ── Left: Form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-14 xl:px-20 min-h-screen overflow-y-auto" style={{ maxWidth: "560px" }}>

        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden w-fit">
          <div className="w-8 h-8 rounded-lg bg-[#22c55e] flex items-center justify-center">
            <TrendingUp size={14} className="text-black"/>
          </div>
          <span className="font-black text-lg text-white" style={{ fontFamily: "'Fraunces', serif" }}>SkillFund</span>
        </Link>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 rounded-2xl mb-8 w-full" style={{ background: "#0d1a0f", border: "1px solid #1e3a22" }}>
          {[["login","Sign In"],["register","Create Account"]].map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t); setErrors({}); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                fontFamily: "'Syne', sans-serif",
                background: tab === t ? "linear-gradient(135deg,#22c55e,#16a34a)" : "transparent",
                color: tab === t ? "#000" : "#6b7280",
                boxShadow: tab === t ? "0 4px 16px rgba(34,197,94,0.3)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="auth-slide space-y-5">
            <div>
              <h1 className="font-black text-white mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.9rem" }}>
                Welcome back
              </h1>
              <p className="text-[#4a5568] text-sm">Sign in to your SkillFund account</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6b7280] mb-1.5 tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>EMAIL ADDRESS</label>
              <input
                type="email"
                className={inputCls("email")}
                placeholder="you@example.com"
                value={loginForm.email}
                onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#6b7280] tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>PASSWORD</label>
                <Link to="/forgot-password" className="text-xs text-[#22c55e] hover:text-[#4ade80] transition-colors font-semibold">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={inputCls("password")}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: "3rem" }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#22c55e] transition-colors">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 group"
              style={{
                fontFamily: "'Syne', sans-serif",
                background: loading ? "#16a34a" : "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "#000",
                boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                  Signing in...
                </span>
              ) : (
                <>Sign In <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform"/></>
              )}
            </button>

            <p className="text-center text-[#4a5568] text-sm">
              Don't have an account?{" "}
              <button type="button" onClick={() => { setTab("register"); setErrors({}); }} className="text-[#22c55e] font-bold hover:text-[#4ade80] transition-colors">
                Create one free
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="auth-slide space-y-4">
            <div>
              <h1 className="font-black text-white mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.9rem" }}>
                Create your account
              </h1>
              <p className="text-[#4a5568] text-sm">Join Africa's skill investment marketplace</p>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-bold text-[#6b7280] mb-2 tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>I WANT TO</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "investor", icon: "💼", title: "Invest",   sub: "Fund creators & earn ROI" },
                  { value: "creator",  icon: "🎨", title: "Get Funded", sub: "Grow my skill & business" },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRegisterForm(p => ({ ...p, role: r.value }))}
                    className={`role-btn border rounded-xl p-3.5 text-left transition-all ${registerForm.role === r.value ? "active" : ""}`}
                  >
                    <span className="text-xl block mb-1.5">{r.icon}</span>
                    <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{r.title}</p>
                    <p className="text-[#4a5568] text-xs mt-0.5">{r.sub}</p>
                    {registerForm.role === r.value && (
                      <div className="mt-2 flex items-center gap-1">
                        <CheckCircle size={11} className="text-[#22c55e]"/>
                        <span className="text-[#22c55e] text-xs font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>Selected</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className="block text-xs font-bold text-[#6b7280] mb-1.5 tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>FULL NAME</label>
              <input
                type="text"
                className={inputCls("name")}
                placeholder="Ada Okafor"
                value={registerForm.name}
                onChange={e => setRegisterForm(p => ({ ...p, name: e.target.value }))}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#6b7280] mb-1.5 tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>EMAIL ADDRESS</label>
              <input
                type="email"
                className={inputCls("email")}
                placeholder="you@example.com"
                value={registerForm.email}
                onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#6b7280] mb-1.5 tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>PASSWORD</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className={inputCls("password")}
                  placeholder="Min. 8 characters"
                  value={registerForm.password}
                  onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: "3rem" }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#22c55e] transition-colors">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-[#6b7280] mb-1.5 tracking-wide" style={{ fontFamily: "'Syne', sans-serif" }}>CONFIRM PASSWORD</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  className={inputCls("confirmPassword")}
                  placeholder="Repeat password"
                  value={registerForm.confirmPassword}
                  onChange={e => setRegisterForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  style={{ paddingRight: "3rem" }}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#22c55e] transition-colors">
                  {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Password strength indicator */}
            {registerForm.password.length > 0 && (
              <div className="auth-fade">
                <div className="flex gap-1.5 mb-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className="flex-1 h-1 rounded-full transition-all duration-300" style={{
                      background: registerForm.password.length >= n * 2
                        ? n <= 1 ? "#ef4444" : n <= 2 ? "#f59e0b" : n <= 3 ? "#22c55e" : "#4ade80"
                        : "#1e3a22"
                    }}/>
                  ))}
                </div>
                <p className="text-xs text-[#4a5568]">
                  Strength:{" "}
                  <span style={{ color: registerForm.password.length < 4 ? "#ef4444" : registerForm.password.length < 6 ? "#f59e0b" : registerForm.password.length < 8 ? "#22c55e" : "#4ade80" }}>
                    {registerForm.password.length < 4 ? "Weak" : registerForm.password.length < 6 ? "Fair" : registerForm.password.length < 8 ? "Good" : "Strong"}
                  </span>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 group"
              style={{
                fontFamily: "'Syne', sans-serif",
                background: loading ? "#16a34a" : "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "#000",
                boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
                  Creating account...
                </span>
              ) : (
                <>Create Account <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform"/></>
              )}
            </button>

            <p className="text-[#2d4a31] text-xs text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <a href="#" className="text-[#22c55e] hover:text-[#4ade80] transition-colors">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="text-[#22c55e] hover:text-[#4ade80] transition-colors">Privacy Policy</a>.
            </p>

            <p className="text-center text-[#4a5568] text-sm">
              Already have an account?{" "}
              <button type="button" onClick={() => { setTab("login"); setErrors({}); }} className="text-[#22c55e] font-bold hover:text-[#4ade80] transition-colors">
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* Trending badge */}
        <div className="mt-8 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#0a1a0b", border: "1px solid #1e3a22" }}>
          <Flame size={14} className="text-orange-400 flex-shrink-0"/>
          <p className="text-[#4a5568] text-xs">
            <span className="text-white font-semibold">14 investors</span> joined SkillFund this week
          </p>
          <span className="ml-auto text-[#22c55e] text-xs font-bold flex-shrink-0" style={{ fontFamily: "'Syne', sans-serif" }}>🔥 TRENDING</span>
        </div>
      </div>

      {/* ── Right: Visual panel (hidden on mobile) ── */}
      <div className="hidden lg:flex flex-1 flex-col" style={{ minHeight: "100vh" }}>
        <VisualPanel tab={tab} />
      </div>
    </div>
  );
}
