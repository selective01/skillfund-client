import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faCircleNotch,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";

function getMode(pathname, searchParams) {
  if (pathname.includes("success")) return "stripe-success";
  if (pathname.includes("cancelled")) return "cancelled";

  const type = searchParams.get("type");
  if (type === "escrow") return "escrow";
  if (type === "nowpayments" || type === "usdt") return "usdt";

  return "paystack";
}

export default function PaymentVerify() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();

  const modeRef = useRef(getMode(pathname, params));
  const paramsRef = useRef(params);
  const updateRef = useRef(updateUser);
  const didRun = useRef(false);

  const [plan, setPlan] = useState("");
  const [escrowDone, setEscrowDone] = useState(false);

  const [status, setStatus] = useState(() => {
    const mode = getMode(pathname, params);
    const sp = new URLSearchParams(window.location.search);

    if (mode === "cancelled") return "cancelled";

    if (mode === "stripe-success") {
      return sp.get("session_id") ? "loading" : "error";
    }

    if (mode === "paystack" || mode === "escrow") {
      const ref = sp.get("reference") || sp.get("trxref");
      return ref ? "loading" : "error";
    }

    if (mode === "usdt") {
      const paymentId = sp.get("paymentId") || sp.get("payment_id");
      return paymentId ? "loading" : "error";
    }

    return "error";
  });

  const [error, setError] = useState(() => {
    const mode = getMode(pathname, params);
    const sp = new URLSearchParams(window.location.search);

    if (mode === "stripe-success" && !sp.get("session_id")) {
      return "No Stripe session ID found.";
    }

    if (
      (mode === "paystack" || mode === "escrow") &&
      !sp.get("reference") &&
      !sp.get("trxref")
    ) {
      return "No payment reference found.";
    }

    if (mode === "usdt" && !sp.get("paymentId") && !sp.get("payment_id")) {
      return "No payment ID found.";
    }

    return "";
  });

  useEffect(() => {
    if (didRun.current) return;
    if (status !== "loading") return;

    didRun.current = true;

    const mode = modeRef.current;
    const p = paramsRef.current;

    if (mode === "stripe-success") {
      const sessionId = p.get("session_id");

      api
        .get(`/payments/stripe/verify/${sessionId}`)
        .then((res) => {
          setPlan(res.data.plan || "");
          if (res.data.user) updateRef.current(res.data.user);
          setStatus("success");
        })
        .catch(() => {
          api
            .get("/auth/me")
            .then((res) => {
              setPlan(res.data.user?.plan || "");
              updateRef.current(res.data.user);
              setStatus("success");
            })
            .catch(() => {
              setError("Stripe verification failed. Please contact support.");
              setStatus("error");
            });
        });

      return;
    }

    if (mode === "paystack" || mode === "escrow") {
      const reference = p.get("reference") || p.get("trxref");

      if (mode === "escrow") {
        api
          .post("/escrow/verify/paystack", { reference })
          .then(() => {
            setEscrowDone(true);
            setStatus("success");
          })
          .catch((err) => {
            setError(
              err.response?.data?.message || "Escrow verification failed."
            );
            setStatus("error");
          });

        return;
      }

      api
        .get(`/payments/paystack/verify/${reference}`)
        .then((res) => {
          setPlan(res.data.plan || "");
          return api.get("/auth/me");
        })
        .then((res) => {
          updateRef.current(res.data.user);
          setStatus("success");
        })
        .catch((err) => {
          setError(
            err.response?.data?.message ||
              "Payment verification failed. Please contact support."
          );
          setStatus("error");
        });

      return;
    }

    if (mode === "usdt") {
      const paymentId = p.get("paymentId") || p.get("payment_id");

      api
        .get(`/escrow/nowpayments/status/${paymentId}`)
        .then((res) => {
          if (res.data?.isConfirmed) {
            setEscrowDone(true);
            setStatus("success");
          } else {
            setError("Payment is still pending confirmation.");
            setStatus("error");
          }
        })
        .catch((err) => {
          setError(
            err.response?.data?.message || "USDT payment verification failed."
          );
          setStatus("error");
        });

      return;
    }
  }, [status]);

  const PLAN_COLORS = {
    starter: "#3b82f6",
    pro: "#a855f7",
    elite: "#f59e0b",
  };

  const accent = PLAN_COLORS[plan] || "#22c55e";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#040806" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,900&family=Plus+Jakarta+Sans:wght@600;700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .pv-in   { animation: fadeUp .5s ease forwards; opacity: 0; }
        .pv-in-2 { animation: fadeUp .5s .12s ease forwards; opacity: 0; }
        .pv-in-3 { animation: fadeUp .5s .24s ease forwards; opacity: 0; }
      `}</style>

      <div className="w-full max-w-sm text-center">
        {status === "loading" && (
          <div className="pv-in">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.30)",
              }}
            >
              <FontAwesomeIcon
                icon={faCircleNotch}
                spin
                style={{ fontSize: "32px", color: "#22c55e" }}
              />
            </div>

            <h2
              className="font-black text-white mb-2"
              style={{ fontFamily: "'Fraunces',serif", fontSize: "1.6rem" }}
            >
              Verifying Payment
            </h2>

            <p
              style={{
                fontFamily: "'DM Sans',sans-serif",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              Hang tight, confirming your transaction…
            </p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="pv-in">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
                    filter: "blur(12px)",
                  }}
                />
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
                  style={{
                    background: `${accent}12`,
                    border: `1px solid ${accent}30`,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    style={{ fontSize: "40px", color: accent }}
                  />
                </div>
              </div>
            </div>

            <div className="pv-in-2">
              <p
                className="text-xs font-bold tracking-widest mb-1"
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  color: accent,
                }}
              >
                PAYMENT SUCCESSFUL
              </p>

              <h2
                className="font-black text-white mb-2"
                style={{ fontFamily: "'Fraunces',serif", fontSize: "1.8rem" }}
              >
                {escrowDone
                  ? "Investment Locked!"
                  : plan
                  ? `Welcome to ${plan.charAt(0).toUpperCase() + plan.slice(1)}!`
                  : "You're all set!"}
              </h2>

              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  color: "#9ca3af",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {escrowDone
                  ? "Your funds are now held in escrow. The creator will be notified to submit milestone proof."
                  : "Your plan has been upgraded. All features are now active on your account."}
              </p>
            </div>

            <div className="pv-in-3 mt-8 space-y-3">
              <button
                onClick={() =>
                  navigate(escrowDone ? "/milestones" : "/dashboard")
                }
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  color: "#000",
                }}
              >
                {escrowDone ? "View Milestones" : "Go to Dashboard"}
                <FontAwesomeIcon
                  icon={faArrowRight}
                  style={{ fontSize: "12px" }}
                />
              </button>

              {!escrowDone && (
                <button
                  onClick={() => navigate("/settings")}
                  className="w-full py-3 rounded-2xl font-bold text-sm"
                  style={{
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#9ca3af",
                  }}
                >
                  View Subscription
                </button>
              )}
            </div>
          </>
        )}

        {status === "cancelled" && (
          <>
            <div className="pv-in">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.35)",
                }}
              >
                <FontAwesomeIcon
                  icon={faCircleXmark}
                  style={{ fontSize: "40px", color: "#f59e0b" }}
                />
              </div>
            </div>

            <div className="pv-in-2">
              <p
                className="text-xs font-bold tracking-widest mb-1"
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  color: "#f59e0b",
                }}
              >
                PAYMENT CANCELLED
              </p>

              <h2
                className="font-black text-white mb-2"
                style={{ fontFamily: "'Fraunces',serif", fontSize: "1.8rem" }}
              >
                No worries
              </h2>

              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  color: "#9ca3af",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                Your payment was cancelled. You haven&apos;t been charged and your
                plan is unchanged.
              </p>
            </div>

            <div className="pv-in-3 mt-8">
              <button
                onClick={() => navigate("/settings")}
                className="w-full py-3 rounded-2xl font-bold text-sm"
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.35)",
                  color: "#f59e0b",
                }}
              >
                Back to Settings
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="pv-in">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.35)",
                }}
              >
                <FontAwesomeIcon
                  icon={faCircleXmark}
                  style={{ fontSize: "40px", color: "#ef4444" }}
                />
              </div>
            </div>

            <div className="pv-in-2">
              <p
                className="text-xs font-bold tracking-widest mb-1"
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  color: "#ef4444",
                }}
              >
                VERIFICATION FAILED
              </p>

              <h2
                className="font-black text-white mb-2"
                style={{ fontFamily: "'Fraunces',serif", fontSize: "1.8rem" }}
              >
                Something went wrong
              </h2>

              <p
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  color: "#9ca3af",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              >
                {error || "Verification failed. Please contact support."}
              </p>
            </div>

            <div className="pv-in-3 mt-8 space-y-3">
              <button
                onClick={() => navigate("/settings")}
                className="w-full py-3 rounded-2xl font-bold text-sm"
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.35)",
                  color: "#ef4444",
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-3 rounded-2xl font-bold text-sm"
                style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif",
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#6b7280",
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}