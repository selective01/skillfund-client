import { useState, useRef, useCallback, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShield, faCircleCheck, faCircleXmark, faClockRotateLeft,
  faIdCard, faPassport, faCar, faCloudArrowUp, faTrash,
  faArrowRight, faCircleNotch, faLock, faStar, faCheckDouble,
  faCamera, faRotateRight, faUserCheck, faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../utils/api";
import toast from "react-hot-toast";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";

const DOC_TYPES = [
  { key: "national_id",     label: "National ID",      icon: faIdCard,   color: "#22c55e", desc: "Government-issued national identity card" },
  { key: "passport",        label: "Passport",          icon: faPassport, color: "#3b82f6", desc: "International travel passport (any country)" },
  { key: "drivers_license", label: "Driver's License",  icon: faCar,   color: "#a855f7", desc: "Valid driver's license with photo" },
];

const STEPS = [
  { key: "type",   label: "Document", icon: faIdCard },
  { key: "selfie", label: "Selfie",   icon: faCamera },
  { key: "upload", label: "Upload",   icon: faCloudArrowUp },
  { key: "review", label: "Submit",   icon: faCheckDouble },
];

function StatusBanner({ status, rejectionReason }) {
  const map = {
    approved: { icon: faCircleCheck,     color: "#22c55e", bg: "rgba(34,197,94,0.08)",  border: "rgba(34,197,94,0.35)",  title: "Identity Verified ✓",   body: "Your identity has been verified. Your profile now shows a verified badge." },
    pending:  { icon: faClockRotateLeft, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.35)", title: "Under Review",           body: "Your documents are being reviewed. This usually takes 24–48 hours." },
    rejected: { icon: faCircleXmark,     color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.35)",  title: "Verification Rejected",  body: rejectionReason || "Your submission was rejected. Please re-submit with clearer documents." },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <div className="rounded-2xl p-5 flex items-start gap-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
        <FontAwesomeIcon icon={s.icon} style={{ fontSize: "18px", color: s.color }} />
      </div>
      <div>
        <p className="font-black mb-1" style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", color: s.color }}>{s.title}</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#9ca3af", lineHeight: 1.6 }}>{s.body}</p>
      </div>
    </div>
  );
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex items-center" style={{ flex: isLast ? "0 0 auto" : 1 }}>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all" style={{ background: done ? "#22c55e" : active ? "rgba(34,197,94,0.30)" : "#0a1209", border: done || active ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.2)" }}>
                {done
                  ? <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "14px", color: "#000" }} />
                  : <FontAwesomeIcon icon={step.icon} style={{ fontSize: "13px", color: active ? "#22c55e" : "#4b5563" }} />
                }
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "'Syne',sans-serif", color: active ? "#22c55e" : done ? "#4ade80" : "#4b5563", whiteSpace: "nowrap" }}>{step.label}</span>
            </div>
            {!isLast && <div className="flex-1 h-px mx-2 mb-5" style={{ background: done ? "#22c55e" : "rgba(255,255,255,0.2)", transition: "background .4s" }} />}
          </div>
        );
      })}
    </div>
  );
}

function SelfieCapture({ onCapture }) {
  useNotificationReadOnView();
  const videoRef       = useRef();
  const canvasRef      = useRef();
  const streamRef      = useRef();
  const selfieInputRef = useRef();
  const [active,    setActive]    = useState(false);
  const [captured,  setCaptured]  = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [camError,  setCamError]  = useState(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setActive(true);
    } catch (err) {
      const msg = err.name === "NotAllowedError"
        ? "Camera access denied. Please allow camera access in your browser settings."
        : err.name === "NotFoundError"
        ? "No camera found on this device."
        : err.name === "NotReadableError"
        ? "Camera is in use by another application."
        : "Could not access camera. You can upload a photo instead.";
      setCamError(msg);
    }
  };

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doCapture = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setCaptured({ file, url: URL.createObjectURL(blob) });
      stopCamera();
      onCapture(file);
    }, "image/jpeg", 0.92);
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);
    const iv = setInterval(() => {
      count--;
      if (count === 0) { clearInterval(iv); setCountdown(null); doCapture(); }
      else setCountdown(count);
    }, 1000);
  };

  const retake = () => { setCaptured(null); startCamera(); };

  const handleSelfieFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setCaptured({ file: f, url });
    onCapture(f);
  };

  return (
    <div className="text-center">
      {/* Captured state */}
      {captured && (
        <div>
          <div className="relative inline-block mb-4">
            <img src={captured.url} alt="selfie" className="w-48 h-48 object-cover rounded-full mx-auto" style={{ border: "3px solid #22c55e", boxShadow: "0 0 0 6px rgba(34,197,94,0.1)" }} />
            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#22c55e" }}>
              <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "14px", color: "#000" }} />
            </div>
          </div>
          <p className="font-black mb-1" style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", color: "#22c55e" }}>Selfie captured!</p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#9ca3af", marginBottom: "16px" }}>Make sure your face is clearly visible</p>
          <button onClick={retake} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl font-bold" style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "var(--bg-input)", border: "1px solid var(--border)", color: "#9ca3af" }}>
            <FontAwesomeIcon icon={faRotateRight} style={{ fontSize: "12px" }} /> Retake
          </button>
        </div>
      )}
      {/* Always rendered so videoRef is never null on mount */}
      <div style={{ display: active ? "block" : "none" }}>
        <div className="relative inline-block mb-4">
          <video ref={videoRef} autoPlay playsInline muted className="w-64 h-64 object-cover rounded-full" style={{ border: "3px solid rgba(34,197,94,0.5)", transform: "scaleX(-1)" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {countdown && (
            <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
              <span style={{ fontFamily: "'Fraunces',serif", fontSize: "72px", color: "#22c55e", fontWeight: 900 }}>{countdown}</span>
            </div>
          )}
        </div>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#9ca3af", marginBottom: "16px" }}>Position your face in the circle</p>
        <button onClick={startCountdown} disabled={!!countdown} className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl font-black disabled:opacity-60" style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", boxShadow: "0 2px 8px rgba(34,197,94,0.2)" }}>
          <FontAwesomeIcon icon={faCamera} style={{ fontSize: "14px" }} />
          {countdown ? `Taking in ${countdown}…` : "Take Photo"}
        </button>
      </div>

      {/* Shown while camera is starting or on error */}
      {!active && (
        <div>
          <div className="w-32 h-32 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(34,197,94,0.08)", border: "2px dashed rgba(34,197,94,0.3)" }}>
            <FontAwesomeIcon icon={faCamera} style={{ fontSize: "36px", color: "#22c55e" }} />
          </div>
          <p className="font-black mb-2" style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", color: "#fff" }}>Take a selfie</p>
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#9ca3af", maxWidth: "280px", margin: "0 auto 20px", lineHeight: 1.6 }}>
            Position your face in good lighting and look directly at the camera.
          </p>
          {camError ? (
            <div className="mb-4">
              <p className="text-sm mb-3" style={{ color: "#ef4444", fontFamily: "'DM Sans',sans-serif" }}>{camError}</p>
              <div className="flex items-center gap-3 justify-center flex-wrap">
                <button onClick={startCamera} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>
                  <FontAwesomeIcon icon={faCamera} style={{ fontSize: "12px" }} /> Try Again
                </button>
                <button onClick={() => selfieInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "var(--bg-input)", border: "1px solid var(--border)", color: "#9ca3af" }}>
                  <FontAwesomeIcon icon={faCloudArrowUp} style={{ fontSize: "13px" }} /> Upload Photo Instead
                </button>
              </div>
              <input ref={selfieInputRef} type="file" accept="image/*" onChange={handleSelfieFile} style={{ display: "none" }} />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-4">
              <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "18px", color: "#22c55e" }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#9ca3af" }}>Starting camera…</span>
            </div>
          )}
          <div className="mt-5 space-y-2">
            {["Ensure good lighting on your face", "Remove glasses or hats if possible", "Look directly at the camera"].map(tip => (
              <div key={tip} className="flex items-center gap-2 justify-center">
                <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "10px", color: "#22c55e" }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DropZone({ file, onFile, onRemove, label }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type.startsWith("image/") || f.type === "application/pdf")) onFile(f);
    else toast.error("Please upload an image or PDF");
  }, [onFile]);

  if (file) return (
    <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)" }}>
      {file.type?.startsWith("image/")
        ? <img src={URL.createObjectURL(file)} alt="preview" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" style={{ border: "1px solid rgba(34,197,94,0.3)" }} />
        : <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}><FontAwesomeIcon icon={faIdCard} style={{ fontSize: "20px", color: "#22c55e" }} /></div>
      }
      <div className="flex-1 min-w-0">
        <p className="font-bold text-xs mb-0.5" style={{ fontFamily: "'Syne',sans-serif", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</p>
        <p className="font-bold truncate" style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", color: "#fff" }}>{file.name}</p>
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>{(file.size / 1024).toFixed(0)} KB</p>
      </div>
      <button onClick={onRemove} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}>
        <FontAwesomeIcon icon={faTrash} style={{ fontSize: "12px" }} />
      </button>
    </div>
  );

  return (
    <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
      className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer"
      style={{ minHeight: "140px", border: `2px dashed ${dragging ? "#22c55e" : "rgba(255,255,255,0.2)"}`, background: dragging ? "rgba(34,197,94,0.05)" : "var(--bg-card)", transition: "all .2s" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.35)" }}>
        <FontAwesomeIcon icon={faCloudArrowUp} style={{ fontSize: "18px", color: "#22c55e" }} />
      </div>
      <div className="text-center">
        <p className="font-bold" style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", color: "#9ca3af" }}>{label} · <span style={{ color: "#22c55e" }}>Browse</span> or drag</p>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>JPG, PNG or PDF · Max 5MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" onChange={e => e.target.files[0] && onFile(e.target.files[0])} style={{ display: "none" }} />
    </div>
  );
}

export default function KYC() {
  const [step,          setStep]          = useState(0);
  const [docType,       setDocType]       = useState(null);
  const [selfieFile,    setSelfieFile]    = useState(null);
  const [frontFile,     setFrontFile]     = useState(null);
  const [backFile,      setBackFile]      = useState(null);
  const [submitting,    setSubmitting]    = useState(false);
  const [kycStatus,     setKycStatus]     = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    api.get("/kyc/status")
      .then(res => setKycStatus(res.data.kycStatus))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  const handleSubmit = async () => {
    if (!docType || !frontFile || !selfieFile) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("verificationType", docType);
      fd.append("document", frontFile);
      fd.append("selfie",   selfieFile);
      if (backFile) fd.append("documentBack", backFile);
      await api.post("/kyc/submit", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Documents submitted! We'll review within 24–48 hours.");
      setKycStatus("pending");
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDoc = DOC_TYPES.find(d => d.key === docType);
  const showForm    = !kycStatus || kycStatus === "not_submitted" || kycStatus === "rejected";

  if (loadingStatus) return (
    <div className="flex items-center justify-center py-20">
      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "24px", color: "#22c55e" }} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        .kyc-in { animation: kycUp .4s ease both; }
        @keyframes kycUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div className="kyc-in rounded-3xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg,var(--card-green-start,#0f2e10),var(--card-green-mid,#071a0b),var(--bg,#040d06))", border: "1px solid rgba(34,197,94,0.35)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#22c55e,transparent)", transform: "translate(30%,-30%)" }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.30)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <FontAwesomeIcon icon={faShield} style={{ fontSize: "14px", color: "#22c55e" }} />
              </div>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", textTransform: "uppercase", letterSpacing: ".1em" }}>Identity Verification</span>
            </div>
            <h2 className="font-black text-white" style={{ fontFamily: "'Fraunces',serif", fontSize: "clamp(1.4rem,3vw,1.8rem)", lineHeight: 1.1 }}>Verify your identity</h2>
            <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280", marginTop: "6px" }}>Unlock full platform access and earn your verified badge</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {[{ icon: faStar, text: "Higher trust score" }, { icon: faCheckDouble, text: "Verified badge on profile" }, { icon: faLock, text: "Unlock investment limits" }].map(p => (
              <div key={p.text} className="flex items-center gap-2">
                <FontAwesomeIcon icon={p.icon} style={{ fontSize: "11px", color: "#22c55e" }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 600, fontSize: "12px", color: "#9ca3af" }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {kycStatus && kycStatus !== "not_submitted" && (
        <div className="kyc-in"><StatusBanner status={kycStatus} /></div>
      )}

      {showForm && (
        <div className="kyc-in rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <StepIndicator current={step} />

          {/* Step 0 — Document type */}
          {step === 0 && (
            <div>
              <p className="font-black mb-1" style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", color: "#fff" }}>Choose your document</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>Select the type of government-issued ID you'll be submitting.</p>
              <div className="space-y-3 mb-6">
                {DOC_TYPES.map(doc => {
                  const sel = docType === doc.key;
                  return (
                    <button key={doc.key} onClick={() => setDocType(doc.key)} className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left"
                      style={{ background: sel ? `${doc.color}0d` : "#0a1209", border: `1px solid ${sel ? doc.color + "50" : "rgba(255,255,255,0.2)"}`, boxShadow: sel ? `0 0 20px ${doc.color}12` : "none" }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sel ? `${doc.color}18` : "#070d08", border: `1px solid ${sel ? doc.color + "30" : "rgba(255,255,255,0.2)"}` }}>
                        <FontAwesomeIcon icon={doc.icon} style={{ fontSize: "20px", color: sel ? doc.color : "#4b5563" }} />
                      </div>
                      <div className="flex-1">
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "14px", color: sel ? "#fff" : "#9ca3af" }}>{doc.label}</p>
                        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{doc.desc}</p>
                      </div>
                      {sel && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: doc.color }}>
                          <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "11px", color: "#000" }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!docType}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", boxShadow: docType ? "0 2px 8px rgba(34,197,94,0.2)" : "none" }}
              >
                Continue <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} />
              </button>
            </div>
          )}

          {/* Step 1 — Selfie */}
          {step === 1 && (
            <div>
              <p className="font-black mb-1" style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", color: "#fff" }}>Take a selfie</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>We'll use this to match against your document photo.</p>
              <div className="mb-6">
                <SelfieCapture onCapture={setSelfieFile} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "var(--bg-input)", border: "1px solid var(--border)", color: "#6b7280" }}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "12px" }} /> Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!selfieFile}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", boxShadow: selfieFile ? "0 2px 8px rgba(34,197,94,0.2)" : "none" }}
                >
                  Continue <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Upload document */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                {selectedDoc && <FontAwesomeIcon icon={selectedDoc.icon} style={{ fontSize: "15px", color: selectedDoc.color }} />}
                <p className="font-black" style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", color: "#fff" }}>Upload your {selectedDoc?.label}</p>
              </div>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>Make sure the document is clear, all corners visible, and not expired.</p>
              <div className="space-y-4 mb-6">
                <DropZone file={frontFile} onFile={setFrontFile} onRemove={() => setFrontFile(null)} label="Front side *" />
                {docType !== "passport" && (
                  <DropZone file={backFile} onFile={setBackFile} onRemove={() => setBackFile(null)} label="Back side (optional)" />
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "var(--bg-input)", border: "1px solid var(--border)", color: "#6b7280" }}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "12px" }} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!frontFile}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "14px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", boxShadow: frontFile ? "0 2px 8px rgba(34,197,94,0.2)" : "none" }}
                >
                  Review <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "13px" }} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review & Submit */}
          {step === 3 && (
            <div>
              <p className="font-black mb-1" style={{ fontFamily: "'Fraunces',serif", fontSize: "18px", color: "#fff" }}>Review & submit</p>
              <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>Check everything looks good before submitting.</p>

              <div className="rounded-2xl p-5 space-y-4 mb-5" style={{ background: "var(--bg-input)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-4">
                  {selfieFile && (
                    <img src={URL.createObjectURL(selfieFile)} alt="selfie" className="w-14 h-14 rounded-full object-cover flex-shrink-0" style={{ border: "2px solid #22c55e" }} />
                  )}
                  <div className="flex-1">
                    <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em" }}>Selfie</p>
                    <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "13px", color: "#fff" }}>Captured ✓</p>
                  </div>
                  <FontAwesomeIcon icon={faUserCheck} style={{ fontSize: "16px", color: "#22c55e" }} />
                </div>

                <div className="h-px" style={{ background: "rgba(255,255,255,0.2)" }} />

                <div className="flex items-center justify-between">
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "12px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em" }}>Document Type</span>
                  <div className="flex items-center gap-2">
                    {selectedDoc && <FontAwesomeIcon icon={selectedDoc.icon} style={{ fontSize: "13px", color: selectedDoc.color }} />}
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", color: "#fff" }}>{selectedDoc?.label}</span>
                  </div>
                </div>

                <div className="h-px" style={{ background: "rgba(255,255,255,0.2)" }} />

                <div className="space-y-2">
                  {frontFile && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      {frontFile.type?.startsWith("image/") && (
                        <img src={URL.createObjectURL(frontFile)} alt="front" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#9ca3af" }}>FRONT · {frontFile.name}</p>
                      </div>
                      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "13px", color: "#22c55e" }} />
                    </div>
                  )}
                  {backFile && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      {backFile.type?.startsWith("image/") && (
                        <img src={URL.createObjectURL(backFile)} alt="back" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "11px", color: "#9ca3af" }}>BACK · {backFile.name}</p>
                      </div>
                      <FontAwesomeIcon icon={faCircleCheck} style={{ fontSize: "13px", color: "#22c55e" }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl p-4 flex items-start gap-3 mb-6" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.30)" }}>
                <FontAwesomeIcon icon={faLock} style={{ fontSize: "13px", color: "#3b82f6", marginTop: "2px", flexShrink: 0 }} />
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>
                  Your documents are encrypted and stored securely. They are only used for identity verification and are never shared with third parties.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", background: "var(--bg-input)", border: "1px solid var(--border)", color: "#6b7280" }}>
                  <FontAwesomeIcon icon={faArrowLeft} style={{ fontSize: "12px" }} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selfieFile || !frontFile}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black transition-all disabled:opacity-60"
                  style={{ fontFamily: "'Syne',sans-serif", fontSize: "15px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", boxShadow: "0 2px 8px rgba(34,197,94,0.2)" }}
                >
                  {submitting ? (
                    <>
                      <FontAwesomeIcon icon={faCircleNotch} spin style={{ fontSize: "14px" }} /> Submitting…
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faShield} style={{ fontSize: "14px" }} /> Submit for Verification
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* What happens next */}
      <div className="kyc-in rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="font-black mb-4" style={{ fontFamily: "'Syne',sans-serif", fontSize: "11px", color: "#6b7280", textTransform: "uppercase", letterSpacing: ".1em" }}>What happens next</p>
        <div className="space-y-3">
          {[
            { step: "01", title: "We review your documents",  body: "Our team manually reviews every submission within 24–48 hours.",    color: "#22c55e" },
            { step: "02", title: "Identity confirmed",         body: "Once approved, your profile gets a verified badge and higher limits.", color: "#3b82f6" },
            { step: "03", title: "You're notified",            body: "You'll receive an in-app notification with the result.",              color: "#a855f7" },
          ].map(item => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 900, fontSize: "12px", color: item.color }}>{item.step}</span>
              </div>
              <div>
                <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "13px", color: "#9ca3af" }}>{item.title}</p>
                <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "12px", color: "#6b7280", lineHeight: 1.6 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
