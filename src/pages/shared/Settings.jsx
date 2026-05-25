import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faLock, faBell, faCreditCard, faShield,
  faChevronRight, faEye, faEyeSlash, faCircleNotch,
  faRightFromBracket, faTrash, faCircleCheck, faCircleExclamation,
  faXmark, faBolt, faCopy,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

const SECTIONS = [
  { key: "account",       label: "Account",       faIcon: faUser,        color: "#22c55e"  },
  { key: "security",      label: "Security",      faIcon: faLock,        color: "#3b82f6"  },
  { key: "notifications", label: "Notifications", faIcon: faBell,        color: "#f59e0b"  },
  { key: "subscription",  label: "Subscription",  faIcon: faCreditCard,  color: "#a855f7"  },
  { key: "privacy",       label: "Privacy & Data",faIcon: faShield,      color: "#14b8a6"  },
];

const PLAN_INFO = {
  basic:   { price: "Free",   color: "var(--text-secondary)", glow: "var(--text-secondary)", features: ["Browse creators (basic)", "5% withdrawal fee", "Standard visibility"] },
  starter: { price: "$9/mo",  color: "#3b82f6", glow: "#3b82f6", features: ["Browse all creators", "4% withdrawal fee", "Higher visibility", "Priority support"] },
  pro:     { price: "$25/mo", color: "#a855f7", glow: "#a855f7", features: ["All Starter features", "3% withdrawal fee", "Top visibility", "Analytics access"] },
  elite:   { price: "$60/mo", color: "#f59e0b", glow: "#f59e0b", features: ["All Pro features", "2% withdrawal fee", "Maximum visibility", "Dedicated support"] },
};

// ── Shared card wrapper ────────────────────────────────────────────────────────
function Panel({ children, accentColor = "#22c55e" }) {
  return (
    <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--bg-card)", border: `1px solid ${accentColor}18` }}>
      {children}
    </div>
  );
}

function SectionTitle({ label, accentColor = "#22c55e" }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 rounded-full" style={{ background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88)` }} />
      <h3 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.05rem" }}>{label}</h3>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-xs font-bold tracking-widest mb-1.5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-dim)" }}>{children}</label>;
}

function Input({ ...props }) {
  return (
    <input
      {...props}
      style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", borderRadius: "12px", padding: "11px 14px", width: "100%", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", transition: "border-color .2s", ...props.style }}
      onFocus={e => { e.target.style.borderColor = "rgba(34,197,94,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.07)"; e.target.style.outline = "none"; }}
      onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
    />
  );
}

function SaveButton({ onClick, loading, label = "Save Changes", loadingLabel = "Saving...", color = "#22c55e" }) {
  return (
    <button onClick={onClick} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 hover:scale-[1.02]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: `linear-gradient(135deg,${color},${color}cc)`, color: "#000" }}>
      {loading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "13px" }} /> : null}
      {loading ? loadingLabel : label}
    </button>
  );
}

export default function Settings() {
  const location = useLocation();
  const initialSection = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const requestedSection = params.get("section");
    return SECTIONS.some((section) => section.key === requestedSection) ? requestedSection : "account";
  }, [location.search]);

  return <SettingsContent key={location.search} initialSection={initialSection} />;
}

function SettingsContent({ initialSection = "account" }) {
  useNotificationReadOnView();
  const { user: storeUser, logout, updateUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState(initialSection);
  const [kycStatus, setKycStatus] = useState(null);
  const [freshUser, setFreshUser] = useState(null);

  // Merge store user with fresh data — freshUser wins when available
  const user = freshUser ?? storeUser;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get("/auth/me"),
      api.get("/kyc/status"),
    ]).then(([meRes, kycRes]) => {
      if (cancelled) return;
      setFreshUser(meRes.data.user);
      setKycStatus(kycRes.data.kycStatus);
      // Update store in the background after render
      setTimeout(() => updateUser(meRes.data.user), 0);
    }).catch(() => {
      if (cancelled) return;
      api.get("/auth/me").then(res => {
        if (cancelled) return;
        setFreshUser(res.data.user);
        setTimeout(() => updateUser(res.data.user), 0);
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .sg-in { animation: fadeUp 0.35s ease forwards; opacity:0; }
      `}</style>

      {/* Page header */}
      <div className="sg-in mb-6 rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,var(--card-green-start,#0f2e10),var(--card-green-mid,#071a0b),var(--bg))", border: "1px solid rgba(34,197,94,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle,rgba(34,197,94,0.1) 0%,transparent 70%)", filter: "blur(20px)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(34,197,94,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,0.03) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <FontAwesomeIcon icon={faShield} style={{ fontSize: "11px", color: "#22c55e" }} />
            <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#22c55e" }}>SETTINGS</span>
          </div>
          <h1 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}>Account Settings</h1>
          <p style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif", fontSize: "14px", marginTop: "4px" }}>Manage your preferences and security</p>
        </div>
      </div>

      <div className="sg-in flex flex-col lg:flex-row gap-6" style={{ animationDelay: ".06s" }}>
        {/* ── Section nav ── */}
        <div className="lg:w-52 flex-shrink-0">
          {/* Mobile: horizontal scrollable pills */}
          <div className="relative lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {SECTIONS.map(s => {
                const isActive = activeSection === s.key;
                return (
                  <button key={s.key} onClick={() => setActiveSection(s.key)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all"
                    style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: isActive ? `${s.color}14` : "var(--bg-card)", border: isActive ? `1px solid ${s.color}30` : "1px solid var(--border)", color: isActive ? s.color : "var(--text-dim)", whiteSpace: "nowrap" }}
                  >
                    <FontAwesomeIcon icon={s.faIcon} style={{ fontSize: "11px" }} />
                    {s.label}
                  </button>
                );
              })}
            </div>
            {/* Right fade — hints there's more to scroll */}
            <div className="absolute right-0 top-0 bottom-2 w-10 pointer-events-none" style={{ background: "linear-gradient(to right, transparent, var(--bg))" }} />
            {/* Scroll indicator dots */}
            <div className="flex items-center justify-center gap-1 mt-1">
              {SECTIONS.map((s, i) => (
                <div
                  key={i}
                  style={{
                    width: activeSection === s.key ? "16px" : "4px",
                    height: "3px",
                    borderRadius: "999px",
                    background: activeSection === s.key ? "#22c55e" : "#1a2e1d",
                    transition: "all .2s ease",
                  }}
                />
              ))}
            </div>
          </div>
          {/* Desktop: vertical list */}
          <div className="hidden lg:block rounded-2xl p-2 space-y-0.5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {SECTIONS.map(s => {
              const isActive = activeSection === s.key;
              return (
                <button key={s.key} onClick={() => setActiveSection(s.key)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: isActive ? `${s.color}14` : "transparent", border: isActive ? `1px solid ${s.color}25` : "1px solid transparent", color: isActive ? s.color : "var(--text-dim)" }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "var(--bg-input)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#4a5568"; e.currentTarget.style.background = "transparent"; } }}
                >
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={s.faIcon} style={{ fontSize: "12px", color: isActive ? s.color : "var(--text-dim)" }} />
                    {s.label}
                  </div>
                  {!isActive && <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: "10px", color: "var(--text-ghost)" }} />}
                </button>
              );
            })}
            <div className="pt-2 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-dim)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#4a5568"; e.currentTarget.style.background = "transparent"; }}
              >
                <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: "12px" }} /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* ── Panel ── */}
        <div className="flex-1 min-w-0">
          {activeSection === "account"       && <AccountSection user={user} updateUser={updateUser} kycStatus={kycStatus} />}
          {activeSection === "security"      && <SecuritySection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "subscription"  && <SubscriptionSection user={user} />}
          {activeSection === "privacy"       && <PrivacySection logout={logout} />}
        </div>
      </div>
    </div>
  );
}

// ── Account ────────────────────────────────────────────────────────────────────
// ── Inline OTP verification widget ────────────────────────────────────────────
function OtpWidget({ type, updateUser }) {
  const { user } = useAuthStore();
  const isVerified = type === "email" ? user?.emailVerified : user?.phoneVerified;
  const [stage,   setStage]   = useState("idle"); // idle | sent | done
  const [otp,     setOtp]     = useState("");
  const [busy,    setBusy]    = useState(false);

  const sendOtp = async () => {
    setBusy(true);
    try {
      const res = await api.post(`/auth/${type}/send-otp`);
      toast.success(res.data.message);
      if (res.data.devOtp) toast(`[DEV] OTP: ${res.data.devOtp}`, { icon: "🔑", duration: 20000 });
      setStage("sent");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send OTP");
    } finally { setBusy(false); }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) return toast.error("Enter the OTP first");
    setBusy(true);
    try {
      const res = await api.post(`/auth/${type}/verify-otp`, { otp });
      updateUser(res.data.user);
      toast.success(res.data.message);
      setStage("done");
    } catch (e) {
      toast.error(e.response?.data?.message || "Invalid OTP");
    } finally { setBusy(false); }
  };

  if (isVerified) return (
    <div className="flex items-center gap-1 mt-1.5">
      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"10px", color:"#22c55e" }} />
      <span style={{ color:"#22c55e", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"12px" }}>Verified</span>
    </div>
  );

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize:"10px", color:"#f59e0b" }} />
        <span style={{ color:"#f59e0b", fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, fontSize:"12px" }}>Not verified</span>
        {stage === "idle" && (
          <button onClick={sendOtp} disabled={busy} style={{ marginLeft:"auto", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", color:"#22c55e", borderRadius:"8px", padding:"3px 10px", fontSize:"11px", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:busy?"not-allowed":"pointer" }}>
            {busy ? "Sending..." : "Send OTP"}
          </button>
        )}
        {stage === "sent" && (
          <button onClick={sendOtp} disabled={busy} style={{ marginLeft:"auto", background:"transparent", border:"none", color:"#9ca3af", fontSize:"11px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Resend
          </button>
        )}
      </div>
      {stage === "sent" && (
        <div className="flex gap-2">
          <input
            type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            style={{ flex:1, background:"var(--bg-input)", border:"1px solid var(--border)", borderRadius:"10px", padding:"8px 12px", color:"var(--text-primary)", fontSize:"13px", fontFamily:"'DM Sans',sans-serif", outline:"none", letterSpacing:"0.15em" }}
          />
          <button onClick={verifyOtp} disabled={busy} style={{ background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.3)", color:"#22c55e", borderRadius:"10px", padding:"8px 14px", fontSize:"12px", fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:busy?"not-allowed":"pointer" }}>
            {busy ? "..." : "Verify"}
          </button>
        </div>
      )}
    </div>
  );
}

function AccountSection({ user, updateUser, kycStatus: kycStatusProp }) {
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState(false);

  const kycStatus = kycStatusProp ?? user?.kycStatus ?? "not_submitted";

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put("/users/me", form);
      updateUser(res.data.user || res.data);
      toast.success("Account updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const verifications = [
    { label: "Email",    status: user?.emailVerified ? "verified" : "unverified" },
    { label: "Phone",    status: user?.phoneVerified ? "verified" : "unverified" },
    { label: "Identity", status: kycStatus === "approved" ? "verified" : kycStatus === "pending" ? "pending" : kycStatus === "rejected" ? "rejected" : "unverified", kycLink: true },
    { label: "Profile",  status: user?.isVerified ? "verified" : "unverified" },
  ];

  const STATUS_CONFIG = {
    verified:   { label: "Verified",     color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.2)",   icon: faCircleCheck       },
    pending:    { label: "Under Review", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  icon: faCircleExclamation },
    rejected:   { label: "Rejected",     color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   icon: faCircleExclamation },
    unverified: { label: "Not Verified", color: "var(--text-dim)", bg: "var(--bg-input)", border: "var(--border)",        icon: faCircleExclamation },
  };

  return (
    <div className="space-y-4">
      <Panel accentColor="#22c55e">
        <SectionTitle label="Account Information" accentColor="#22c55e" />
        <div className="space-y-4">
          {[
            { field: "name",  label: "FULL NAME",    type: "text",  placeholder: "Your name" },
            { field: "email", label: "EMAIL ADDRESS",type: "email", placeholder: "email@example.com" },
            { field: "phone", label: "PHONE NUMBER", type: "tel",   placeholder: "+234..." },
          ].map(f => (
            <div key={f.field}>
              <FieldLabel>{f.label}</FieldLabel>
              <Input type={f.type} value={form[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder} />
              {f.field === "email" && <OtpWidget type="email" updateUser={updateUser} />}
              {f.field === "phone" && <OtpWidget type="phone" updateUser={updateUser} />}
            </div>
          ))}
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </Panel>

      <Panel accentColor="#22c55e">
        <SectionTitle label="Verification Status" accentColor="#22c55e" />
        <div className="space-y-2.5">
          {verifications.map(v => {
            const cfg = STATUS_CONFIG[v.status];
            return (
            <div key={v.label} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
              <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans',sans-serif" }}>{v.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                  <FontAwesomeIcon icon={cfg.icon} style={{ fontSize: "10px" }} />
                  {cfg.label}
                </span>
                {v.kycLink && v.status !== "verified" && (
                  <Link to="/kyc" className="text-xs font-black px-2.5 py-1 rounded-full transition-all" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: "#14b8a6" }}>
                    {v.status === "rejected" ? "Resubmit →" : v.status === "pending" ? "View Status →" : "Verify Now →"}
                  </Link>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ── Security ───────────────────────────────────────────────────────────────────
function SecuritySection() {
  const [form, setForm]   = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow]   = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const strength = pwd => {
    if (!pwd) return 0;
    let s = 0;
    if (pwd.length >= 8)           s++;
    if (/[A-Z]/.test(pwd))         s++;
    if (/[0-9]/.test(pwd))         s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };

  const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];
  const STRENGTH_COLORS = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"];
  const pwdStrength = strength(form.newPassword);

  const handleChange = async () => {
    if (!form.currentPassword || !form.newPassword) { toast.error("Fill in all fields"); return; }
    if (form.newPassword !== form.confirmPassword)  { toast.error("Passwords don't match"); return; }
    if (pwdStrength < 2) { toast.error("Password is too weak"); return; }
    setSaving(true);
    try {
      await api.put("/auth/change-password", { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success("Password changed!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const PwdInput = ({ field, label, showKey }) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <Input type={show[showKey] ? "text" : "password"} value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} style={{ paddingRight: "2.5rem" }} />
        <button type="button" onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }}>
          <FontAwesomeIcon icon={show[showKey] ? faEyeSlash : faEye} style={{ fontSize: "13px" }} />
        </button>
      </div>
    </div>
  );

  return (
    <Panel accentColor="#3b82f6">
      <SectionTitle label="Change Password" accentColor="#3b82f6" />
      <div className="space-y-4">
        <PwdInput field="currentPassword" label="CURRENT PASSWORD" showKey="current" />
        <PwdInput field="newPassword"     label="NEW PASSWORD"     showKey="new" />
        {form.newPassword && (
          <div>
            <div className="flex gap-1 mb-1">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-1.5 flex-1 rounded-full transition-all" style={{ background: i <= pwdStrength ? STRENGTH_COLORS[pwdStrength] : "var(--border)" }} />
              ))}
            </div>
            <p className="text-xs font-bold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: STRENGTH_COLORS[pwdStrength] }}>{STRENGTH_LABELS[pwdStrength]}</p>
          </div>
        )}
        <PwdInput field="confirmPassword" label="CONFIRM PASSWORD" showKey="confirm" />
        {form.confirmPassword && form.newPassword !== form.confirmPassword && (
          <p className="text-xs flex items-center gap-1" style={{ color: "#f87171" }}>
            <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: "11px" }} /> Passwords don't match
          </p>
        )}
        <SaveButton onClick={handleChange} loading={saving} label="Update Password" loadingLabel="Updating..." color="#3b82f6" />
      </div>
    </Panel>
  );
}

// ── Notifications ──────────────────────────────────────────────────────────────
function NotificationsSection() {
  const [prefs, setPrefs] = useState({ email_connections: true, email_messages: true, email_proposals: true, email_investments: true, email_withdrawals: true, push_connections: true, push_messages: true, push_proposals: true });
  const [saving, setSaving] = useState(false);

  const toggle = key => setPrefs(p => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    try { await api.put("/users/notification-preferences", prefs); toast.success("Preferences saved!"); }
    catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const ToggleRow = ({ prefKey, label, desc }) => (
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid #0f1a10" }}>
      <div>
        <p className="text-sm font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)", fontFamily: "'DM Sans',sans-serif" }}>{desc}</p>}
      </div>
      <button onClick={() => toggle(prefKey)} className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0" style={{ background: prefs[prefKey] ? "#22c55e" : "var(--border)" }}>
        <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all" style={{ left: prefs[prefKey] ? "24px" : "4px" }} />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <Panel accentColor="#f59e0b">
        <SectionTitle label="Email Notifications" accentColor="#f59e0b" />
        <ToggleRow prefKey="email_connections" label="Connection requests" />
        <ToggleRow prefKey="email_messages"    label="New messages" />
        <ToggleRow prefKey="email_proposals"   label="Investment proposals" />
        <ToggleRow prefKey="email_investments" label="Investment updates" />
        <ToggleRow prefKey="email_withdrawals" label="Withdrawal status" />
      </Panel>
      <Panel accentColor="#f59e0b">
        <SectionTitle label="Push Notifications" accentColor="#f59e0b" />
        <ToggleRow prefKey="push_connections" label="Connection requests" />
        <ToggleRow prefKey="push_messages"    label="New messages" desc="Shown in notification bell" />
        <ToggleRow prefKey="push_proposals"   label="Investment proposals" />
      </Panel>
      <SaveButton onClick={handleSave} loading={saving} label="Save Preferences" color="#f59e0b" />
    </div>
  );
}

// ── Upgrade Modal ──────────────────────────────────────────────────────────────
function UpgradeModal({ plan, planInfo, user, onClose }) {
  const [step, setStep]         = useState("pick");   // pick | crypto-pending
  const [loading, setLoading]   = useState(null);     // "paystack" | "stripe" | "crypto"
  const [cryptoData, setCryptoData] = useState(null);
  const [copied, setCopied]     = useState(false);

  const METHODS = [
    {
      key: "paystack",
      label: "Paystack",
      desc: "Pay in NGN via card, bank transfer or USSD",
      color: "#00C3F7",
      flag: "🇳🇬",
      roles: ["creator", "investor"],
    },
    {
      key: "stripe",
      label: "Stripe",
      desc: "Pay in USD via credit or debit card",
      color: "#6772e5",
      flag: "💳",
      roles: ["creator", "investor"],
    },
    {
      key: "crypto",
      label: "USDT (Crypto)",
      desc: "Pay with USDT — ERC20 network",
      color: "#26a17b",
      flag: "₮",
      roles: ["investor"],
    },
  ].filter(m => m.roles.includes(user?.role));

  const handlePaystack = async () => {
    setLoading("paystack");
    try {
      const res = await api.post("/payments/paystack/initialize", { plan });
      const { authorization_url } = res.data.data;
      window.location.href = authorization_url;
    } catch (err) {
      toast.error(err.response?.data?.message || "Paystack failed");
    } finally {
      setLoading(null);
    }
  };

  const handleStripe = async () => {
    setLoading("stripe");
    try {
      const res = await api.post("/payments/stripe/create-session", { plan });
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || "Stripe failed");
    } finally {
      setLoading(null);
    }
  };

  const handleCrypto = async () => {
    setLoading("crypto");
    try {
      const res = await api.post("/crypto/subscription", { plan });
      setCryptoData(res.data.payment);
      setStep("crypto-pending");
    } catch (err) {
      toast.error(err.response?.data?.message || "Crypto payment failed");
    } finally {
      setLoading(null);
    }
  };

  const handleMethod = (key) => {
    if (key === "paystack") handlePaystack();
    else if (key === "stripe") handleStripe();
    else if (key === "crypto") handleCrypto();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(cryptoData.payAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-3xl p-6"
        style={{ background: "var(--bg-card)", border: `1px solid ${planInfo.color}30`, boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${planInfo.color}15` }}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all" style={{ background: "var(--bg-input)", color: "var(--text-dim)" }}>
          <FontAwesomeIcon icon={faXmark} style={{ fontSize: "13px" }} />
        </button>

        {step === "pick" && (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={faBolt} style={{ fontSize: "11px", color: planInfo.color }} />
                <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: planInfo.color }}>UPGRADE PLAN</span>
              </div>
              <h2 className="font-black capitalize" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.6rem", color: "var(--text-primary)" }}>
                Go {plan}
              </h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                {planInfo.price}/month · Choose how you want to pay
              </p>
            </div>

            {/* Plan features summary */}
            <div className="rounded-2xl p-4 mb-5" style={{ background: `${planInfo.color}08`, border: `1px solid ${planInfo.color}20` }}>
              <div className="space-y-1.5">
                {planInfo.features.map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans',sans-serif" }}>
                    <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "10px", color: planInfo.color, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Payment methods */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold tracking-widest mb-3" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-dim)" }}>SELECT PAYMENT METHOD</p>
              {METHODS.map(m => (
                <button
                  key={m.key}
                  onClick={() => handleMethod(m.key)}
                  disabled={!!loading}
                  className="w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all disabled:opacity-50"
                  style={{ background: "var(--bg-input)", border: `1px solid var(--border)`, textAlign: "left" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + "50"; e.currentTarget.style.background = m.color + "08"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-input)"; }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background: m.color + "15", border: `1px solid ${m.color}30` }}>
                    {m.key === "crypto"
                      ? <span style={{ color: m.color, fontSize: "18px", fontWeight: 900 }}>₮</span>
                      : <span style={{ fontSize: "18px" }}>{m.flag}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-primary)" }}>{m.label}</p>
                    <p className="text-xs" style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-dim)" }}>{m.desc}</p>
                  </div>
                  {loading === m.key
                    ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ color: m.color, fontSize: "14px" }} />
                    : <FontAwesomeIcon icon={faChevronRight} style={{ color: "var(--text-ghost)", fontSize: "11px" }} />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === "crypto-pending" && cryptoData && (
          <>
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: "11px", color: "#26a17b" }}>₮</span>
                <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#26a17b" }}>SEND USDT</span>
              </div>
              <h2 className="font-black" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.4rem", color: "var(--text-primary)" }}>Complete Payment</h2>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                Send exactly <strong style={{ color: "#26a17b" }}>{cryptoData.payAmount} {cryptoData.payCurrency?.toUpperCase()}</strong> to the address below
              </p>
            </div>

            {/* Amount */}
            <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: "rgba(38,161,123,0.08)", border: "1px solid rgba(38,161,123,0.2)" }}>
              <p className="text-xs font-bold tracking-widest mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#26a17b" }}>AMOUNT TO SEND</p>
              <p className="font-black" style={{ fontFamily: "'Fraunces',serif", fontSize: "1.8rem", color: "#26a17b" }}>
                {cryptoData.payAmount}
              </p>
              <p className="text-xs" style={{ color: "var(--text-dim)", fontFamily: "'DM Sans',sans-serif" }}>{cryptoData.payCurrency?.toUpperCase()} (≈ ${cryptoData.priceAmount} USD)</p>
            </div>

            {/* Wallet address */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-bold tracking-widest mb-2" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text-dim)" }}>WALLET ADDRESS</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 text-xs break-all" style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-secondary)" }}>{cryptoData.payAddress}</p>
                <button
                  onClick={copyAddress}
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: copied ? "rgba(38,161,123,0.15)" : "var(--bg-card)", border: "1px solid var(--border)", color: copied ? "#26a17b" : "var(--text-dim)" }}
                >
                  <FontAwesomeIcon icon={faCopy} style={{ fontSize: "11px" }} />
                </button>
              </div>
            </div>

            <p className="text-xs text-center mb-4" style={{ fontFamily: "'DM Sans',sans-serif", color: "var(--text-dim)", lineHeight: 1.6 }}>
              Your plan will activate automatically once the transaction is confirmed on-chain. This usually takes 1–5 minutes.
            </p>

            <button onClick={onClose} className="w-full py-2.5 rounded-xl font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              Done — I've sent the payment
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Subscription ───────────────────────────────────────────────────────────────
function SubscriptionSection({ user }) {
  const { updateUser } = useAuthStore();
  const [freshPlan, setFreshPlan] = useState(null);
  const plan     = freshPlan ?? user?.plan ?? "basic";
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.basic;
  const [upgradeTarget, setUpgradeTarget] = useState(null);

  // Always fetch fresh plan on mount — store may be stale after payment redirect
  useEffect(() => {
    api.get("/auth/me")
      .then(res => {
        setFreshPlan(res.data.user.plan);
        setTimeout(() => updateUser(res.data.user), 0);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {upgradeTarget && (
        <UpgradeModal
          plan={upgradeTarget.plan}
          planInfo={upgradeTarget.planInfo}
          user={user}
          onClose={() => setUpgradeTarget(null)}
          onSuccess={(newPlan) => {
            updateUser({ ...user, plan: newPlan });
            setUpgradeTarget(null);
            toast.success(`Upgraded to ${newPlan}!`);
          }}
        />
      )}
      {/* Current plan hero */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg,${planInfo.color}12,var(--bg))`, border: `1px solid ${planInfo.color}25` }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle,${planInfo.color}14 0%,transparent 70%)`, filter: "blur(16px)" }} />
        <p className="text-xs font-bold tracking-widest mb-1" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: planInfo.color }}>CURRENT PLAN</p>
        <div className="flex items-end justify-between">
          <h2 className="font-black capitalize" style={{ fontFamily: "'Fraunces',serif", fontSize: "2.2rem", color: planInfo.color, lineHeight: 1 }}>{plan}</h2>
          <span className="font-black text-2xl" style={{ fontFamily: "'Fraunces',serif", color: planInfo.color }}>{planInfo.price}</span>
        </div>
        <div className="mt-4 space-y-1.5">
          {planInfo.features.map(f => (
            <div key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans',sans-serif" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: planInfo.color, flexShrink: 0 }} />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* All plans */}
      <Panel accentColor="#a855f7">
        <SectionTitle label="Available Plans" accentColor="#a855f7" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(PLAN_INFO).map(([p, info]) => {
            const isCurrent = p === plan;
            return (
              <div key={p} className="rounded-2xl p-4 transition-all" style={{ background: isCurrent ? `${info.color}10` : "var(--bg-input)", border: isCurrent ? `1px solid ${info.color}30` : "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black capitalize text-sm" style={{ fontFamily: "'Fraunces',serif", color: isCurrent ? info.color : "var(--text-primary)" }}>{p} {isCurrent && "✓"}</span>
                  <span className="font-bold" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: isCurrent ? info.color : "var(--text-muted)" }}>{info.price}</span>
                </div>
                <ul className="space-y-1 mb-3">
                  {info.features.map(f => <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-dim)", fontFamily: "'DM Sans',sans-serif" }}><span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: info.color }} />{f}</li>)}
                </ul>
                {!isCurrent && p !== "basic" && <button onClick={() => setUpgradeTarget({ plan: p, planInfo: info })} className="w-full py-2 rounded-xl font-bold text-xs transition-all hover:scale-[1.01]" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: `${info.color}18`, border: `1px solid ${info.color}30`, color: info.color }}>Upgrade to {p}</button>}
                {!isCurrent && p === "basic" && plan !== "basic" && <button className="w-full py-2 rounded-xl font-bold text-xs transition-all" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>Downgrade</button>}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ── Privacy ────────────────────────────────────────────────────────────────────
function PrivacySection({ logout }) {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm]   = useState("");

  const handleDelete = async () => {
    if (confirm !== "DELETE") { toast.error('Type "DELETE" to confirm'); return; }
    setDeleting(true);
    try {
      await api.delete("/users/me");
      toast.success("Account deleted. Goodbye!");
      logout();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel accentColor="#14b8a6">
        <SectionTitle label="Privacy Settings" accentColor="#14b8a6" />
        <div className="space-y-3 text-sm" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.7 }}>
          <p>Your profile is visible to other users based on your subscription plan tier.</p>
          <p>Your contact information (email, phone) is never shared with other users.</p>
          <p>Investment data is only visible to parties involved in a deal.</p>
        </div>
      </Panel>

      <Panel accentColor="#14b8a6">
        <SectionTitle label="Export Your Data" accentColor="#14b8a6" />
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>Download a copy of all your data stored on SkillFund.</p>
        <button onClick={() => toast.success("Data export requested. Check your email shortly.")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
          <FontAwesomeIcon icon={faShield} style={{ fontSize: "12px" }} /> Request Data Export
        </button>
      </Panel>

      {/* Danger zone */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
        <div className="flex items-center gap-2 mb-3">
          <FontAwesomeIcon icon={faTrash} style={{ fontSize: "13px", color: "#f87171" }} />
          <h3 className="font-black" style={{ fontFamily: "'Fraunces',serif", fontSize: "1rem", color: "#f87171" }}>Delete Account</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <div className="space-y-3">
          <FieldLabel>TYPE "DELETE" TO CONFIRM</FieldLabel>
          <Input type="text" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder='DELETE' />
          <button onClick={handleDelete} disabled={deleting || confirm !== "DELETE"} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            {deleting ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "12px" }} /> : <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />}
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
