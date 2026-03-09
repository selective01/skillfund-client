import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, TrendingUp, ArrowRight } from "lucide-react";
import useAuthStore from "../../store/authStore";
import ParticleField from "../../components/ParticleField";

// ═══════════════════════════════════════════════════════════════════════════════
export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{
      fontFamily: "'DM Sans', sans-serif",
      backgroundColor: "#040806",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        @keyframes formUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .form-card { animation: formUp 0.6s cubic-bezier(.22,1,.36,1) forwards; }
        .auth-input { width:100%; padding:12px 16px; border-radius:12px; font-size:14px; color:white; outline:none; transition:all .2s; background:#0d1a0f; border:1px solid #1e3a22; }
        .auth-input:focus { border-color: rgba(34,197,94,0.5); background:#0f1e12; box-shadow: 0 0 0 3px rgba(34,197,94,0.07); }
        .auth-input::placeholder { color: #2d4a31; }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 50px #0d1a0f inset !important; -webkit-text-fill-color:white !important; }
      `}</style>

      {/* Particle canvas */}
      <ParticleField />

      {/* Form card */}
      <div className="form-card relative w-full max-w-md" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-[#22c55e] flex items-center justify-center shadow-lg shadow-[#22c55e]/30 group-hover:scale-105 transition-transform">
              <TrendingUp size={18} className="text-black" />
            </div>
            <span className="font-black text-2xl text-white" style={{ fontFamily: "'Fraunces', serif" }}>SkillFund</span>
          </Link>
          <p className="text-[#4a5568] text-sm">Africa's skill investment marketplace</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8" style={{
          background: "linear-gradient(145deg, #0c1a0d 0%, #080f09 100%)",
          border: "1px solid rgba(34,197,94,0.12)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,197,94,0.05) inset",
          backdropFilter: "blur(20px)",
        }}>

          <div className="mb-7">
            <h2 className="font-black text-white mb-1" style={{ fontFamily: "'Fraunces', serif", fontSize: "1.85rem" }}>
              Welcome back
            </h2>
            <p className="text-[#4a5568] text-sm">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-[#4a5568] mb-2 tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#4a5568] tracking-widest" style={{ fontFamily: "'Syne', sans-serif" }}>
                  PASSWORD
                </label>
                <Link to="/forgot-password" className="text-xs text-[#22c55e] hover:text-[#4ade80] transition-colors font-semibold">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="auth-input"
                  style={{ paddingRight: "3rem" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#22c55e] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl font-black text-sm flex items-center justify-center gap-2 group transition-all whitespace-nowrap"
              style={{
                fontFamily: "'Syne', sans-serif",
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#000",
                boxShadow: "0 8px 24px rgba(34,197,94,0.3)",
                opacity: loading ? 0.8 : 1,
                padding: "14px 24px",
                minHeight: "48px",
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[#4a5568] text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#22c55e] hover:text-[#4ade80] font-bold transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
