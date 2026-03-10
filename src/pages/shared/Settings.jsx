import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faLock, faBell, faCreditCard, faShield,
  faChevronRight, faEye, faEyeSlash, faCircleNotch,
  faRightFromBracket, faTrash, faCircleCheck, faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";

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
  return <label className="block text-xs font-bold tracking-widest mb-1.5" style={{ fontFamily: "'Syne',sans-serif", color: "var(--text-dim)" }}>{children}</label>;
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
    <button onClick={onClick} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 hover:scale-[1.02]" style={{ fontFamily: "'Syne',sans-serif", background: `linear-gradient(135deg,${color},${color}cc)`, color: "#000" }}>
      {loading ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "13px" }} /> : null}
      {loading ? loadingLabel : label}
    </button>
  );
}

export default function Settings() {
  const { user, logout, updateUser } = useAuthStore();
  const [activeSection, setActiveSection] = useState("account");

  return (
    <div className="space-y-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
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
            <span className="text-xs font-bold tracking-widest" style={{ fontFamily: "'Syne',sans-serif", color: "#22c55e" }}>SETTINGS</span>
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
                    style={{ fontFamily: "'Syne',sans-serif", background: isActive ? `${s.color}14` : "var(--bg-card)", border: isActive ? `1px solid ${s.color}30` : "1px solid var(--border)", color: isActive ? s.color : "var(--text-dim)", whiteSpace: "nowrap" }}
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
                    background: activeSection === s.key ? "#22c55e" : "rgba(255,255,255,0.1)",
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
                  style={{ fontFamily: "'Syne',sans-serif", background: isActive ? `${s.color}14` : "transparent", border: isActive ? `1px solid ${s.color}25` : "1px solid transparent", color: isActive ? s.color : "var(--text-dim)" }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "var(--bg-input)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; } }}
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
                style={{ fontFamily: "'Syne',sans-serif", color: "var(--text-dim)" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#9ca3af"; e.currentTarget.style.background = "transparent"; }}
              >
                <FontAwesomeIcon icon={faRightFromBracket} style={{ fontSize: "12px" }} /> Log Out
              </button>
            </div>
          </div>
        </div>

        {/* ── Panel ── */}
        <div className="flex-1 min-w-0">
          {activeSection === "account"       && <AccountSection user={user} updateUser={updateUser} />}
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
function AccountSection({ user, updateUser }) {
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState(false);

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
    { label: "Email",    verified: user?.emailVerified },
    { label: "Phone",    verified: user?.phoneVerified },
    { label: "Identity", verified: user?.idVerified,   kycLink: true },
    { label: "Profile",  verified: user?.isVerified    },
  ];

  return (
    <div className="space-y-4">
      <Panel accentColor="#22c55e">
        <SectionTitle label="Account Information" accentColor="#22c55e" />
        <div className="space-y-4">
          {[
            { field: "name",  label: "FULL NAME",      type: "text",  placeholder: "Your name" },
            { field: "email", label: "EMAIL ADDRESS",  type: "email", placeholder: "email@example.com" },
            { field: "phone", label: "PHONE NUMBER",   type: "tel",   placeholder: "+234..." },
          ].map(f => (
            <div key={f.field}>
              <FieldLabel>{f.label}</FieldLabel>
              <Input type={f.type} value={form[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder} />
              {f.field === "email" && (
                <p className="text-xs flex items-center gap-1 mt-1.5">
                  {user?.emailVerified
                    ? <><FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"10px", color:"#22c55e" }} /><span style={{ color:"#22c55e", fontFamily:"'Syne',sans-serif", fontWeight:700 }}>Verified</span></>
                    : <><FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize:"10px", color:"#f59e0b" }} /><span style={{ color:"#f59e0b", fontFamily:"'Syne',sans-serif", fontWeight:700 }}>Not verified</span></>}
                </p>
              )}
              {f.field === "phone" && (
                <p className="text-xs flex items-center gap-1 mt-1.5">
                  {user?.phoneVerified
                    ? <><FontAwesomeIcon icon={faCircleCheck} style={{ fontSize:"10px", color:"#22c55e" }} /><span style={{ color:"#22c55e", fontFamily:"'Syne',sans-serif", fontWeight:700 }}>Verified</span></>
                    : <><FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize:"10px", color:"#f59e0b" }} /><span style={{ color:"#f59e0b", fontFamily:"'Syne',sans-serif", fontWeight:700 }}>Not verified</span></>}
                </p>
              )}
            </div>
          ))}
          <SaveButton onClick={handleSave} loading={saving} />
        </div>
      </Panel>

      <Panel accentColor="#22c55e">
        <SectionTitle label="Verification Status" accentColor="#22c55e" />
        <div className="space-y-2.5">
          {verifications.map(v => (
            <div key={v.label} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
              <span className="text-sm" style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans',sans-serif" }}>{v.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ fontFamily: "'Syne',sans-serif", background: v.verified ? "rgba(34,197,94,0.1)" : "var(--bg-input)", border: v.verified ? "1px solid rgba(34,197,94,0.2)" : "1px solid var(--border)", color: v.verified ? "#22c55e" : "var(--text-dim)" }}>
                  <FontAwesomeIcon icon={v.verified ? faCircleCheck : faCircleExclamation} style={{ fontSize: "10px" }} />
                  {v.verified ? "Verified" : "Pending"}
                </span>
                {v.kycLink && !v.verified && (
                  <Link to="/kyc" className="text-xs font-black px-2.5 py-1 rounded-full transition-all" style={{ fontFamily: "'Syne',sans-serif", background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.25)", color: "#14b8a6" }}>
                    Verify Now →
                  </Link>
                )}
              </div>
            </div>
          ))}
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
            <p className="text-xs font-bold" style={{ fontFamily: "'Syne',sans-serif", color: STRENGTH_COLORS[pwdStrength] }}>{STRENGTH_LABELS[pwdStrength]}</p>
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
    <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div>
        <p className="text-sm font-bold text-white" style={{ fontFamily: "'Syne',sans-serif" }}>{label}</p>
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

// ── Subscription ───────────────────────────────────────────────────────────────
function SubscriptionSection({ user }) {
  const plan     = user?.plan || "basic";
  const planInfo = PLAN_INFO[plan];

  return (
    <div className="space-y-4">
      {/* Current plan hero */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg,${planInfo.color}12,var(--bg))`, border: `1px solid ${planInfo.color}25` }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle,${planInfo.color}14 0%,transparent 70%)`, filter: "blur(16px)" }} />
        <p className="text-xs font-bold tracking-widest mb-1" style={{ fontFamily: "'Syne',sans-serif", color: planInfo.color }}>CURRENT PLAN</p>
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
                  <span className="font-bold" style={{ fontFamily: "'Syne',sans-serif", color: isCurrent ? info.color : "var(--text-muted)" }}>{info.price}</span>
                </div>
                <ul className="space-y-1 mb-3">
                  {info.features.map(f => <li key={f} className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-dim)", fontFamily: "'DM Sans',sans-serif" }}><span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: info.color }} />{f}</li>)}
                </ul>
                {!isCurrent && p !== "basic" && <button className="w-full py-2 rounded-xl font-bold text-xs transition-all hover:scale-[1.01]" style={{ fontFamily: "'Syne',sans-serif", background: `${info.color}18`, border: `1px solid ${info.color}30`, color: info.color }}>Upgrade to {p}</button>}
                {!isCurrent && p === "basic" && plan !== "basic" && <button className="w-full py-2 rounded-xl font-bold text-xs transition-all" style={{ fontFamily: "'Syne',sans-serif", background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-dim)" }}>Downgrade</button>}
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
        <button onClick={() => toast.success("Data export requested. Check your email shortly.")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all" style={{ fontFamily: "'Syne',sans-serif", background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.2)", color: "#14b8a6" }}>
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
          <button onClick={handleDelete} disabled={deleting || confirm !== "DELETE"} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ fontFamily: "'Syne',sans-serif", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            {deleting ? <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "12px" }} /> : <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />}
            {deleting ? "Deleting..." : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
