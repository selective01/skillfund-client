import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, TrendingUp } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import ParticleField from "../../components/ParticleField";

// ═══════════════════════════════════════════════════════════════════════════════
export default function Register() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      toast.error("Please select a role");
      return;
    }
    const result = await register(form);
    if (result.success) {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative" data-theme="dark"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        backgroundColor: "#040806",
        colorScheme: "dark",
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes formUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .form-card { animation: formUp 0.6s cubic-bezier(.22,1,.36,1) forwards; }
        .auth-input { width:100%; padding:12px 16px; border-radius:12px; font-size:14px; color:white; outline:none; transition:all .2s; background:#172b1a; border:1px solid rgba(34,197,94,0.4); }
        .auth-input:focus { border-color:rgba(34,197,94,0.7); background:#1a3320; box-shadow:0 0 0 3px rgba(34,197,94,0.12); }
        .auth-input::placeholder { color:#7ab587; }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 50px #172b1a inset !important; -webkit-text-fill-color:white !important; }
        .role-card { padding:16px; border-radius:14px; border:1px solid rgba(34,197,94,0.4); background:#172b1a; cursor:pointer; transition:all .2s; text-align:left; width:100%; }
        .role-card:hover { border-color:rgba(34,197,94,0.6); }
        .role-card.selected { background:linear-gradient(135deg,#0f2e10,#091e09); border-color:rgba(34,197,94,0.7); box-shadow:0 0 0 3px rgba(34,197,94,0.07); }
      `}</style>

      <ParticleField />

      <div className="form-card relative w-full max-w-md" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-[#22c55e] flex items-center justify-center shadow-lg shadow-[#22c55e]/30 group-hover:scale-105 transition-transform">
              <TrendingUp size={18} className="text-black" />
            </div>
            <span className="font-black text-2xl text-white" style={{ fontFamily: "'Fraunces', serif" }}>SkillFund</span>
          </Link>
          <p className="text-[#c9d1d9] text-sm">Africa's skill investment marketplace</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8" style={{
          background: "linear-gradient(145deg, #0c1a0d 0%, #080f09 100%)",
          border: "1px solid rgba(34,197,94,0.45)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.05) inset",
          backdropFilter: "blur(20px)",
        }}>

          <div className="mb-7">
            <h2 className="font-black text-white mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.85rem" }}>
              Create Account
            </h2>
            <p className="text-[#c9d1d9] text-sm">Join Africa's skill investment marketplace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role selector */}
            <div>
              <label className="block text-xs font-bold text-[#d1d5db] mb-3 tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>
                I AM A...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "creator",  icon: "🎨", title: "Creator",  sub: "I have a skill and need funding" },
                  { value: "investor", icon: "💰", title: "Investor", sub: "I want to invest in skills" },
                ].map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`role-card ${form.role === r.value ? "selected" : ""}`}
                  >
                    <div className="text-2xl mb-2">{r.icon}</div>
                    <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>{r.title}</p>
                    <p className="text-[#b8c2cc] text-xs mt-1 leading-relaxed">{r.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label className="block text-xs font-bold text-[#d1d5db] mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>
                FULL NAME
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ada Fashion"
                className="auth-input"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#d1d5db] mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="auth-input"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#d1d5db] mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="auth-input"
                  style={{ paddingRight: "3rem" }}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#b8c2cc] hover:text-[#22c55e] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl flex items-center justify-center gap-2 group transition-all whitespace-nowrap"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 900,
                fontSize: "16px",
                letterSpacing: "0.01em",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#000",
                boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
                opacity: loading ? 0.8 : 1,
                padding: "14px 24px",
                minHeight: "52px",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-0.5 transition-transform" style={{ fontSize: "14px" }} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[#c9d1d9] text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-[#22c55e] hover:text-[#4ade80] font-bold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
