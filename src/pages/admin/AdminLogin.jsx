import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp, faEnvelope, faLock, faArrowRight,
  faCircleNotch, faShieldHalved, faRotateLeft, faEye, faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import useAdminAuthStore from "../../store/useAdminAuthStore";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { requestOtp, verifyOtp, loading } = useAdminAuthStore();

  const [step, setStep] = useState("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");
    const res = await requestOtp(email, password);
    if (res.success) {
      toast.success("OTP sent to your email");
      setStep("otp");
    } else {
      toast.error(res.message);
    }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return toast.error("Enter the 6-digit code");
    const res = await verifyOtp(email, code);
    if (res.success) {
      toast.success("Welcome back");
      navigate("/admin/users");
    } else {
      toast.error(res.message);
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        .adm-input { transition: border-color .15s, box-shadow .15s; }
        .adm-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,.1); }
        .adm-btn { transition: all .15s ease; }
        .adm-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,.35); }
        .adm-otp { transition: border-color .15s, box-shadow .15s; }
        .adm-otp:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
        .adm-fade { animation: admFadeUp .4s ease both; }
        @keyframes admFadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12" style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}>
            <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "16px", color: "#a5f3fc" }} />
          </div>
          <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "20px", color: "#fff" }}>SkillFund</span>
        </div>
        <div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "22px", color: "#c7d2fe" }} />
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "2.2rem", color: "#fff", lineHeight: 1.15 }}>Admin Portal</h1>
          <p style={{ color: "#a5b4fc", fontSize: "15px", marginTop: "12px", lineHeight: 1.6 }}>
            Secure two-factor access for authorised administrators only.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            {["Email & password verification", "One-time passcode via email", "Session-based access control"].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(167,139,250,0.25)", border: "1px solid rgba(167,139,250,0.3)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa" }} />
                </div>
                <span style={{ color: "#c7d2fe", fontSize: "13px" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ color: "#6366f1", fontSize: "12px" }}>© {new Date().getFullYear()} SkillFund · Admin Portal</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: "#f8fafc" }}>
        <div className="w-full max-w-sm adm-fade">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6366f1,#4338ca)" }}>
              <FontAwesomeIcon icon={faArrowTrendUp} style={{ fontSize: "14px", color: "#fff" }} />
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "18px", color: "#0f172a" }}>SkillFund</span>
            <span className="text-xs font-black px-1.5 py-0.5 rounded-md" style={{ fontFamily: "'Syne',sans-serif", background: "#eef2ff", color: "#4338ca", border: "1px solid #c7d2fe" }}>ADMIN</span>
          </div>

          {step === "credentials" ? (
            <>
              <div className="mb-7">
                <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "1.7rem", color: "#0f172a", lineHeight: 1.1 }}>Sign in</h2>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "6px" }}>Enter your admin credentials to continue</p>
              </div>
              <form onSubmit={handleCredentials} className="space-y-4">
                <div>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "12px", color: "#475569", display: "block", marginBottom: "6px" }}>Email address</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
                      <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: "13px" }} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@yourdomain.com"
                      className="adm-input w-full pl-9 pr-4 py-3 rounded-xl"
                      style={{ background: "#fff", border: "1px solid #e2e8f0", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", color: "#0f172a" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "12px", color: "#475569", display: "block", marginBottom: "6px" }}>Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8" }}>
                      <FontAwesomeIcon icon={faLock} style={{ fontSize: "13px" }} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="adm-input w-full pl-9 pr-10 py-3 rounded-xl"
                      style={{ background: "#fff", border: "1px solid #e2e8f0", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", color: "#0f172a" }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#94a3b8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} style={{ fontSize: "13px" }} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="adm-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black mt-2"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", background: "linear-gradient(135deg,#6366f1,#4338ca)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1 }}
                >
                  {loading
                    ? <><FontAwesomeIcon icon={faCircleNotch} spin /> Verifying…</>
                    : <>Continue <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "12px" }} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-7">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#eef2ff", border: "1px solid #c7d2fe" }}>
                  <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "20px", color: "#6366f1" }} />
                </div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "1.7rem", color: "#0f172a", lineHeight: 1.1 }}>Check your email</h2>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "6px", lineHeight: 1.5 }}>
                  We sent a 6-digit code to<br />
                  <strong style={{ color: "#475569" }}>{email}</strong>
                </p>
              </div>
              <form onSubmit={handleVerify}>
                <div className="flex gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      className="adm-otp flex-1 text-center py-3 rounded-xl font-black"
                      style={{ fontFamily: "'Syne',sans-serif", fontSize: "20px", background: "#fff", border: `1px solid ${digit ? "#6366f1" : "#e2e8f0"}`, color: "#0f172a", minWidth: 0 }}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="adm-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", background: "linear-gradient(135deg,#6366f1,#4338ca)", color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1 }}
                >
                  {loading
                    ? <><FontAwesomeIcon icon={faCircleNotch} spin /> Verifying…</>
                    : <>Verify & Sign In <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "12px" }} /></>}
                </button>
              </form>
              <button
                onClick={() => { setStep("credentials"); setOtp(["","","","","",""]); }}
                className="w-full flex items-center justify-center gap-2 mt-3 py-2"
                style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "12px", color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faRotateLeft} style={{ fontSize: "11px" }} /> Use a different account
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
