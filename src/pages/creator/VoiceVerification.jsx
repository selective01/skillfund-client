import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone, faCircleCheck, faCircleXmark, faClockRotateLeft,
  faCircleNotch, faShieldHalved, faArrowRight, faCalendarDays,
  faMicrophone, faLock, faCheckDouble, faChevronDown,
  faTriangleExclamation, faHeadset, faListCheck, faQuoteLeft,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import toast from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";
import useThemeStore from "../../store/useThemeStore";

// ─── Constants ────────────────────────────────────────────────────────────────
const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "2:00 PM",  "3:00 PM",
  "4:00 PM",  "5:00 PM",  "6:00 PM",
];

const TIMEZONES = [
  { value: "Africa/Lagos",      label: "Lagos / Abuja (WAT, UTC+1)"    },
  { value: "Africa/Accra",      label: "Accra / Nairobi (GMT/EAT)"     },
  { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)"  },
  { value: "Europe/London",     label: "London (GMT/BST)"              },
  { value: "America/New_York",  label: "New York (EST/EDT)"            },
  { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)"       },
];

const QUESTIONS_PREVIEW = [
  "Can you confirm your full name and the name you registered with on SkillFund?",
  "Tell us about your skill — how long have you been doing it and where?",
  "What will you use the funding for? Walk us through your plan.",
  "Do you understand that funds are released in milestones and require proof?",
  "Confirm that you agree to SkillFund's terms and legal obligations.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBanner({ status, scheduledFor, rejectionReason }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const cfg = {
    scheduled: {
      icon: faCalendarDays, color: "#3b82f6",
      bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.3)",
      title: "Call Scheduled",
      body: scheduledFor
        ? `Your verification call is booked for ${new Date(scheduledFor).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.`
        : "Your call has been scheduled. We'll call you at your chosen time.",
    },
    completed: {
      icon: faCircleCheck, color: "#22c55e",
      bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)",
      title: "Call Completed",
      body: "Your voice verification call is done. Our team is reviewing the recording — this usually takes 24 hours.",
    },
    approved: {
      icon: faCircleCheck, color: "#22c55e",
      bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.3)",
      title: "Voice Verified ✓",
      body: "Your identity has been confirmed via voice call. This strengthens your Trust Score and unlocks higher funding tiers.",
    },
    rejected: {
      icon: faCircleXmark, color: "#ef4444",
      bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)",
      title: "Verification Failed",
      body: rejectionReason || "Your call could not be verified. Please reschedule and try again.",
    },
    pending: {
      icon: faClockRotateLeft, color: "#f59e0b",
      bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)",
      title: "Under Review",
      body: "Your call recording is being reviewed. We'll notify you within 24 hours.",
    },
  };

  const s = cfg[status];
  if (!s) return null;

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "18px 20px", borderRadius: "18px", background: s.bg, border: `1px solid ${s.border}` }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: `${s.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <FontAwesomeIcon icon={s.icon} style={{ fontSize: "17px", color: s.color }} />
      </div>
      <div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "14px", color: s.color, margin: "0 0 4px" }}>{s.title}</p>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _muted, lineHeight: 1.6, margin: 0 }}>{s.body}</p>
      </div>
    </div>
  );
}

function DatePicker({ value, onChange }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  // Generate next 14 available days (skip Sundays)
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let d = new Date(today);
  d.setDate(d.getDate() + 1); // Start tomorrow
  while (days.length < 14) {
    if (d.getDay() !== 0) { // Skip Sundays
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
      {days.map((day) => {
        const iso = day.toISOString().split("T")[0];
        const sel = value === iso;
        const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
        const dayNum  = day.getDate();
        return (
          <button
            key={iso}
            onClick={() => onChange(iso)}
            style={{
              padding: "10px 4px", borderRadius: "12px", cursor: "pointer", transition: ".15s",
              background: sel ? "rgba(34,197,94,0.12)" : _input,
              border: `1px solid ${sel ? "rgba(34,197,94,0.4)" : _cardBorder}`,
              display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
            }}
          >
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "9px", color: sel ? "#22c55e" : "#4a5568", letterSpacing: ".04em" }}>{dayName}</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1rem", color: sel ? "#22c55e" : "#9ca3af", lineHeight: 1 }}>{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
export default function VoiceVerification() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const _heroGrad = _L
    ? "linear-gradient(135deg,#e8f5ea,#f0fdf4,#f8faf8)"
    : "linear-gradient(135deg,#0f2e10,#071a0b,#040d06)";
  const _heroBorder = _L ? "rgba(34,197,94,0.2)" : "rgba(34,197,94,0.25)";

  useNotificationReadOnView();
  const navigate   = useNavigate();
  const { user }   = useAuthStore();

  const [voiceStatus,  setVoiceStatus]  = useState(null);
  const [scheduledFor, setScheduledFor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  // Form state
  const [phone,    setPhone]    = useState(user?.phone || "");
  const [date,     setDate]     = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [timezone, setTimezone] = useState("Africa/Lagos");
  const [errors,   setErrors]   = useState({});

  // ─── Load status ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/voice/status")
      .then((res) => {
        setVoiceStatus(res.data.status || null);
        setScheduledFor(res.data.scheduledFor || null);
        setRejectionReason(res.data.rejectionReason || "");
        if (res.data.phone) setPhone(res.data.phone);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ─── Validate ────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!phone.trim())         e.phone    = "Enter your phone number";
    if (phone.trim().length < 7) e.phone  = "Phone number seems too short";
    if (!date)                 e.date     = "Select a date";
    if (!timeSlot)             e.timeSlot = "Select a time slot";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSchedule = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/voice/schedule", {
        phone, date, timeSlot, timezone,
      });
      setVoiceStatus("scheduled");
      setScheduledFor(res.data.scheduledFor);
      toast.success("Call scheduled! We'll call you at the chosen time.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Scheduling failed — please try again");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = () => {
    setVoiceStatus(null);
    setDate("");
    setTimeSlot("");
    setErrors({});
  };

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (user?.role !== "creator") {
    return (
      <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "20px", padding: "64px 20px", textAlign: "center", maxWidth: "520px" }}>
        <FontAwesomeIcon icon={faShieldHalved} style={{ fontSize: "36px", color: "#2d4a31", marginBottom: "16px" }} />
        <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.3rem", color: _text, marginBottom: "8px" }}>Creators only</h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim }}>Voice verification is only required for creator accounts.</p>
      </div>
    );
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}>
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "22px", color: "#22c55e" }} />
    </div>
  );

  const showForm = !voiceStatus || voiceStatus === "rejected" || voiceStatus === "not_scheduled";

  return (
    <div style={{ maxWidth: "600px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .vv-field { background:var(--bg-input); border:1px solid var(--border); color:var(--text-primary); border-radius:12px; padding:10px 14px; font-size:14px; outline:none; width:100%; font-family:'Inter', sans-serif; transition:border-color .2s; }
        .vv-field::placeholder { color:#2d4a31; }
        .vv-field:focus { border-color:rgba(34,197,94,0.4); }
        .vv-field.error { border-color:rgba(239,68,68,0.4); }
        .vv-select { background:var(--bg-input); border:1px solid var(--border); color:var(--text-primary); border-radius:12px; padding:10px 36px 10px 14px; font-size:14px; outline:none; width:100%; font-family:'Inter', sans-serif; appearance:none; cursor:pointer; transition:border-color .2s; }
        .vv-select:focus { border-color:rgba(34,197,94,0.4); }
        .vv-select option { background:var(--bg-card); }
        .vv-label { display:block; font-size:11px; font-weight:700; font-family:'Inter', sans-serif; text-transform:uppercase; letter-spacing:.06em; color:#9ca3af; margin-bottom:6px; }
        .vv-err { font-size:11px; color:#f87171; font-family:'Inter', sans-serif; margin-top:4px; display:flex; align-items:center; gap:4px; }
        .vv-btn-green { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:900; font-size:14px; padding:13px 24px; border-radius:14px; cursor:pointer; background:linear-gradient(135deg,#22c55e,#16a34a); color:#000; border:none; width:100%; transition:.15s; box-shadow:0 4px 20px rgba(34,197,94,0.2); }
        .vv-btn-green:hover:not(:disabled) { transform:scale(1.02); box-shadow:0 6px 28px rgba(34,197,94,0.3); }
        .vv-btn-green:disabled { opacity:.45; cursor:not-allowed; transform:none; box-shadow:none; }
        .vv-btn-ghost { display:flex; align-items:center; justify-content:center; gap:7px; font-family:'Inter', sans-serif; font-weight:700; font-size:13px; padding:11px 20px; border-radius:13px; cursor:pointer; background:var(--sf-bg-input,rgba(0,0,0,0.3)); border:1px solid var(--sf-border,rgba(255,255,255,0.08)); color:var(--sf-text-muted,#9ca3af); width:100%; transition:.15s; }
        .vv-btn-ghost:hover { border-color:rgba(34,197,94,0.25); color:white; }
        .vv-card { background:var(--sf-bg-card,#070d08); border:1px solid var(--sf-border,rgba(255,255,255,0.07)); border-radius:20px; padding:22px; }
        .vv-section-title { font-family:'Inter', sans-serif; font-weight:900; font-size:1.05rem; color:white; margin:0 0 4px; }
        .vv-section-sub { font-family:'Inter', sans-serif; font-size:13px; color:#6b7280; margin:0 0 20px; line-height:1.5; }
        .vv-time-btn { padding:9px 12px; border-radius:10px; cursor:pointer; transition:.15s; font-family:'Inter', sans-serif; font-weight:700; font-size:12px; white-space:nowrap; }
        .vv-question-row { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid var(--sf-border,rgba(255,255,255,0.04)); }
        .vv-question-row:last-child { border-bottom:none; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: _heroGrad, border: `1px solid ${_heroBorder}`, borderRadius: "24px", padding: "24px", marginBottom: "20px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.1),transparent)", transform: "translate(30%,-30%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FontAwesomeIcon icon={faMicrophone} style={{ fontSize: "13px", color: "#22c55e" }} />
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".1em" }}>VOICE VERIFICATION</span>
        </div>

        <h2 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "clamp(1.3rem,3vw,1.8rem)", color: _text, margin: "0 0 6px", lineHeight: 1.1 }}>
          Schedule your verification call
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, margin: "0 0 16px", lineHeight: 1.6 }}>
          A 5-minute recorded call with our team confirms your identity and funding intent. It's the final layer that unlocks full platform trust and higher funding tiers.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {[
            { icon: faLock,        text: "Unlocks full funding access" },
            { icon: faCheckDouble, text: "Boosts Trust Score"          },
            { icon: faHeadset,     text: "5 min call only"             },
          ].map((b) => (
            <span key={b.text} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "11px", padding: "5px 12px", borderRadius: "100px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}>
              <FontAwesomeIcon icon={b.icon} style={{ fontSize: "10px" }} /> {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* ── Status banner (if any) ── */}
      {voiceStatus && voiceStatus !== "not_scheduled" && voiceStatus !== "rejected" && (
        <div style={{ marginBottom: "16px" }}>
          <StatusBanner status={voiceStatus} scheduledFor={scheduledFor} rejectionReason={rejectionReason} />
        </div>
      )}

      {voiceStatus === "rejected" && (
        <div style={{ marginBottom: "16px" }}>
          <StatusBanner status="rejected" rejectionReason={rejectionReason} />
        </div>
      )}

      {/* ── Approved state — nothing more to do ── */}
      {voiceStatus === "approved" && (
        <div className="vv-card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "28px", color: "#22c55e" }} />
          </div>
          <h3 style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "1.3rem", color: _text, marginBottom: "8px" }}>You're voice verified</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _dim, marginBottom: "24px", lineHeight: 1.6 }}>
            Your voice verification badge is active on your profile. Investors can see you've completed all verification layers.
          </p>
          <button onClick={() => navigate("/profile")} className="vv-btn-green" style={{ maxWidth: "240px", margin: "0 auto" }}>
            View My Profile <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "12px" }} />
          </button>
        </div>
      )}

      {/* ── Scheduled / completed / pending — show status + reschedule ── */}
      {(voiceStatus === "scheduled" || voiceStatus === "completed" || voiceStatus === "pending") && (
        <div className="vv-card" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <p className="vv-section-title">What happens next</p>
            <p className="vv-section-sub">Your verification is in progress.</p>
          </div>
          {[
            { n: "01", title: "We call you",         body: "A SkillFund team member will call you at your scheduled time.",                     color: "#22c55e" },
            { n: "02", title: "Call is recorded",    body: "The call is recorded and stored securely on your account for admin review.",         color: "#3b82f6" },
            { n: "03", title: "Admin reviews",       body: "Our team reviews the recording within 24 hours and approves or flags the account.", color: "#a855f7" },
            { n: "04", title: "You're notified",     body: "You'll receive an in-app notification with the outcome.",                            color: "#f59e0b" },
          ].map((step) => (
            <div key={step.n} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: `${step.color}12`, border: `1px solid ${step.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "11px", color: step.color }}>{step.n}</span>
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "13px", color: _muted, margin: "0 0 2px" }}>{step.title}</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _dim, lineHeight: 1.5, margin: 0 }}>{step.body}</p>
              </div>
            </div>
          ))}

          {voiceStatus === "scheduled" && (
            <button onClick={handleReschedule} className="vv-btn-ghost" style={{ marginTop: "4px" }}>
              <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: "12px" }} /> Reschedule Call
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          SCHEDULING FORM
      ══════════════════════════════════════════════════════════════ */}
      {showForm && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Phone number */}
          <div className="vv-card">
            <p className="vv-section-title">Your Phone Number</p>
            <p className="vv-section-sub">This is the number we'll call. Make sure it's reachable at your chosen time.</p>
            <label className="vv-label">Phone Number *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 800 000 0000"
              className={`vv-field ${errors.phone ? "error" : ""}`}
            />
            {errors.phone && (
              <p className="vv-err"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.phone}</p>
            )}
          </div>

          {/* Date picker */}
          <div className="vv-card">
            <p className="vv-section-title">Choose a Date</p>
            <p className="vv-section-sub">Available Monday – Saturday. Select a day that works for you.</p>
            <DatePicker value={date} onChange={setDate} />
            {errors.date && (
              <p className="vv-err" style={{ marginTop: "8px" }}><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.date}</p>
            )}
          </div>

          {/* Time slot */}
          <div className="vv-card">
            <p className="vv-section-title">Choose a Time</p>
            <p className="vv-section-sub">All times are in your selected timezone.</p>

            {/* Timezone selector */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="vv-select">
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
              <FontAwesomeIcon icon={faChevronDown} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#4a5568", fontSize: "11px", pointerEvents: "none" }} />
            </div>

            {/* Time grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              {TIME_SLOTS.map((slot) => {
                const sel = timeSlot === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setTimeSlot(slot)}
                    className="vv-time-btn"
                    style={{
                      background: sel ? "rgba(34,197,94,0.12)" : _input,
                      border: `1px solid ${sel ? "rgba(34,197,94,0.4)" : _cardBorder}`,
                      color: sel ? "#22c55e" : "#9ca3af",
                    }}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {errors.timeSlot && (
              <p className="vv-err" style={{ marginTop: "8px" }}><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: "10px" }} /> {errors.timeSlot}</p>
            )}
          </div>

          {/* Questions preview */}
          <div className="vv-card">
            <button
              onClick={() => setShowQuestions(!showQuestions)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FontAwesomeIcon icon={faListCheck} style={{ fontSize: "13px", color: "#22c55e" }} />
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "13px", color: _text, margin: 0 }}>
                  What you'll be asked
                </p>
              </div>
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: "12px", color: "#4a5568", transform: showQuestions ? "rotate(180deg)" : "none", transition: ".2s" }} />
            </button>

            {showQuestions && (
              <div style={{ marginTop: "16px", borderTop: `1px solid ${_cardBorder}`, paddingTop: "16px" }}>
                {QUESTIONS_PREVIEW.map((q, i) => (
                  <div key={i} className="vv-question-row">
                    <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 900, fontSize: "10px", color: "#22c55e" }}>{i + 1}</span>
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _muted, lineHeight: 1.5, margin: 0 }}>{q}</p>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "14px", padding: "12px 14px", background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.12)", borderRadius: "12px" }}>
                  <FontAwesomeIcon icon={faQuoteLeft} style={{ fontSize: "12px", color: "#22c55e", marginTop: "2px", flexShrink: 0 }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: "#4a5568", lineHeight: 1.6, margin: 0 }}>
                    There are no trick questions. We just want to confirm you are who you say you are and that you understand the SkillFund funding process.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Booking summary */}
          {date && timeSlot && (
            <div style={{ padding: "14px 16px", background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: "12px", color: "#22c55e", margin: "0 0 2px" }}>Your booking</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "13px", color: _muted, margin: 0 }}>
                  {new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {timeSlot}
                </p>
              </div>
              <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: "18px", color: "#22c55e" }} />
            </div>
          )}

          {/* Privacy note */}
          <div style={{ padding: "12px 14px", background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "12px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <FontAwesomeIcon icon={faLock} style={{ fontSize: "12px", color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "12px", color: _dim, lineHeight: 1.6, margin: 0 }}>
              Your call is recorded and stored securely for admin review only. It is never shared with investors, guarantors, or third parties.
            </p>
          </div>

          {/* Submit */}
          <button onClick={handleSchedule} disabled={submitting} className="vv-btn-green">
            <FontAwesomeIcon icon={submitting ? faCircleNotch : faPhone} spin={submitting} style={{ fontSize: "14px" }} />
            {submitting ? "Scheduling..." : "Schedule My Verification Call"}
          </button>
        </div>
      )}
    </div>
  );
}
