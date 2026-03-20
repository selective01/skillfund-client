import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleQuestion, faChevronDown, faChevronUp, faArrowRight,
  faShield, faMicrophone, faBuilding, faPhone, faGift,
  faHandshake, faArrowTrendUp, faWallet,
  faBullhorn, faScaleBalanced, faUsers,
  faIdCard, faStar, faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import useAuthStore from "../../store/authStore";
import useNotificationReadOnView from "../../hooks/useNotificationReadOnView";
import useThemeStore from "../../store/useThemeStore";

// ─── Content ──────────────────────────────────────────────────────────────────
const CREATOR_SECTIONS = [
  {
    id: "what-is-skillfund",
    icon: faStar,
    color: "#22c55e",
    title: "What is SkillFund?",
    content: [
      "SkillFund is a platform where skilled creators — tailors, bakers, photographers, carpenters and more — get funded by investors in exchange for a share of future profits.",
      "Unlike a loan, you don't pay interest. Instead, your investor earns a percentage of your revenue for an agreed period. Once that period ends, you keep 100% of your profits.",
      "Think of it as a business partner who believes in your skill and puts money behind it.",
    ],
  },
  {
    id: "getting-started",
    icon: faBullhorn,
    color: "#3b82f6",
    title: "Getting started as a Creator",
    steps: [
      { label: "Complete your profile", desc: "Add your skill, location, bio and portfolio images so investors can learn about you.", path: "/profile" },
      { label: "Verify your identity (KYC)", desc: "Upload your ID and a selfie. This unlocks your verified badge and builds investor trust.", path: "/kyc" },
      { label: "Set up your campaign", desc: "Define your funding goal, profit share %, deal duration and milestones.", path: "/campaign/setup" },
      { label: "Complete trust verification", desc: "Submit asset collateral and add two guarantors to unlock higher funding tiers.", path: "/trust" },
      { label: "Schedule your voice call", desc: "A 5-minute recorded call with our team that confirms your identity and funding intent.", path: "/voice-verify" },
      { label: "Wait for investors", desc: "Investors will browse your campaign and send investment proposals via Messages." },
    ],
  },
  {
    id: "investment-proposals",
    icon: faHandshake,
    color: "#a855f7",
    title: "Investment proposals",
    content: [
      "When an investor is interested in funding you, they send a proposal through the Messages page. The proposal will show the amount they want to invest, the profit share percentage they're asking for, and the duration of the deal.",
      "You can accept, decline, or counter-propose with different terms. Once both sides agree, you lock the agreement — this creates a formal investment contract on SkillFund.",
      "Funds are held in escrow and released to you in milestones, not all at once.",
    ],
  },
  {
    id: "milestones",
    icon: faArrowTrendUp,
    color: "#22c55e",
    title: "How milestones work",
    content: [
      "Your funding is split into milestones that you defined during campaign setup. Each milestone is unlocked one at a time — you receive the funds for a milestone, complete it, and submit proof before the next one unlocks.",
      "To submit proof, go to your Investments page, open the active deal, and upload photos, videos or documents that prove the milestone is complete.",
      "Your investor reviews the proof and approves or disputes it. If approved, the next milestone unlocks automatically.",
      "This protects both sides — investors know their money is being used as planned, and you get a structured funding roadmap.",
    ],
  },
  {
    id: "reporting-earnings",
    icon: faChartLine,
    color: "#0ea5e9",
    title: "Reporting your earnings",
    content: [
      "Every month, you report your revenue to your investors through the Investments page. This is how SkillFund calculates how much to pay your investors.",
      "For example: if you agreed on 20% profit share and you earned $1,000 this month, $200 goes to your investor and $800 stays with you.",
      "Consistent reporting builds your Trust Score and increases your chances of getting funded again in the future.",
    ],
  },
  {
    id: "trust-score",
    icon: faStar,
    color: "#f59e0b",
    title: "Your Trust Score",
    content: [
      "Your Trust Score is a number between 0 and 100 that reflects how reliable you are as a creator. Investors can see it on your profile and campaign page.",
      "It is calculated from: how consistently you report earnings (35%), how your revenue grows over time (25%), whether you complete milestones on time (20%), your dispute record (15%), and your investor ratings (5%).",
      "A higher score unlocks higher funding tiers and makes investors more confident in you.",
    ],
  },
  {
    id: "verification",
    icon: faShield,
    color: "#14b8a6",
    title: "Verification layers",
    content: [
      "SkillFund has four verification layers that build investor trust:",
    ],
    items: [
      { icon: faIdCard,    color: "#22c55e", label: "KYC (Identity)",      desc: "Upload your government ID and a selfie. Reviewed within 24–48 hours." },
      { icon: faBuilding,  color: "#f59e0b", label: "Asset Collateral",    desc: "Submit proof of assets you own (equipment, vehicle, shop etc.) as a stake in your success." },
      { icon: faPhone,     color: "#14b8a6", label: "Guarantors",          desc: "Add 2 people who can vouch for your identity. Our team calls them to verify." },
      { icon: faMicrophone,color: "#3b82f6", label: "Voice Verification",  desc: "A 5-minute recorded call with our team to confirm your identity and funding intent." },
    ],
  },
  {
    id: "withdrawals",
    icon: faWallet,
    color: "#a855f7",
    title: "Withdrawing your money",
    content: [
      "Once you have earnings in your SkillFund balance, you can request a withdrawal from the Withdraw page. We support bank transfers and USDT crypto.",
      "A platform fee is deducted from each withdrawal — the fee depends on your subscription plan (Basic: 5%, Starter: 4%, Pro: 3%, Elite: 2%).",
      "You can reduce your fee further by referring people to SkillFund through the Referrals page.",
    ],
  },
  {
    id: "referrals",
    icon: faGift,
    color: "#f59e0b",
    title: "Referral programme",
    content: [
      "Every person you refer to SkillFund permanently reduces your withdrawal fee — not a credit that expires, but a permanent rate reduction.",
      "Share your referral link from the Referrals page. When someone signs up and subscribes or gets funded, your rate drops automatically.",
      "The floor rate (lowest your fee can go) depends on your plan: Basic/Starter: 2%, Pro: 1%, Elite: 0.5%.",
    ],
  },
  {
    id: "disputes",
    icon: faScaleBalanced,
    color: "#f97316",
    title: "Raising a dispute",
    content: [
      "If you have an issue with an investor — they're making unreasonable demands, disputing a milestone unfairly, or not responding — you can raise a dispute from the Disputes page.",
      "Our team reviews all disputes within 48 hours. We look at the conversation history, milestone proof, and the agreement terms before making a decision.",
      "Do not try to resolve disputes outside the platform — all communication relevant to the investment should happen in SkillFund Messages.",
    ],
  },
];

const INVESTOR_SECTIONS = [
  {
    id: "what-is-skillfund",
    icon: faStar,
    color: "#22c55e",
    title: "What is SkillFund?",
    content: [
      "SkillFund lets you invest in skilled African creators — tailors, bakers, photographers, carpenters and more — in exchange for a share of their future profits.",
      "You put in capital, the creator uses it to grow their business, and you receive a percentage of their monthly revenue for an agreed period. No interest rates — pure profit share.",
      "All funding is milestone-based, meaning your money is released in stages as the creator hits targets — reducing your risk significantly.",
    ],
  },
  {
    id: "getting-started",
    icon: faUsers,
    color: "#3b82f6",
    title: "Getting started as an Investor",
    steps: [
      { label: "Complete your profile", desc: "Add your investment preferences and budget so creators know what you're looking for.", path: "/profile" },
      { label: "Verify your identity (KYC)", desc: "Upload your ID to get your verified badge — creators trust verified investors more.", path: "/kyc" },
      { label: "Browse creators", desc: "Use filters like skill category, Trust Score, and funding goal to find creators that match your criteria.", path: "/browse" },
      { label: "Connect or message", desc: "Send a connection request or message a creator directly to learn more about them.", path: "/messages" },
      { label: "Send an investment proposal", desc: "From the Messages page, click 'Propose' to send a formal investment offer with amount, profit share % and duration." },
      { label: "Lock the agreement", desc: "Once a creator accepts your proposal, lock the agreement and fund the escrow." },
    ],
  },
  {
    id: "proposals",
    icon: faHandshake,
    color: "#a855f7",
    title: "Sending investment proposals",
    content: [
      "From any conversation in the Messages page, click the 'Propose' button in the header to open the proposal form. Enter the amount you want to invest, the profit share percentage you want, and the deal duration in months.",
      "The creator can accept, decline, or counter-propose. If they counter, you can review and accept or negotiate further. Once both sides agree, you lock the deal.",
      "After locking, your funds move into escrow — held securely until the creator hits each milestone.",
    ],
  },
  {
    id: "milestones",
    icon: faArrowTrendUp,
    color: "#22c55e",
    title: "Tracking milestones",
    content: [
      "Go to Portfolio → open a deal → View Milestones to track the creator's progress. Each milestone shows its status, the amount tied to it, and any proof the creator has submitted.",
      "When a creator submits proof for a milestone, you'll receive a notification. Review the proof and approve or dispute it.",
      "If you approve, the next milestone unlocks and funds are released to the creator. If you dispute, our team reviews the case within 48 hours.",
    ],
  },
  {
    id: "returns",
    icon: faChartLine,
    color: "#0ea5e9",
    title: "Receiving your returns",
    content: [
      "Each month, creators report their earnings for the month. Your profit share is calculated and added to your SkillFund balance automatically.",
      "For example: you invested $2,000 for a 20% share over 12 months. If the creator earns $3,000 in month one, you receive $600.",
      "Track all returns in the Portfolio page. Once a deal completes, any remaining balance can be withdrawn or reinvested.",
    ],
  },
  {
    id: "trust-score",
    icon: faStar,
    color: "#f59e0b",
    title: "Reading a Creator's Trust Score",
    content: [
      "Every creator has a Trust Score between 0 and 100. It reflects how reliable they've been across all their investments.",
      "Score bands: 85–100 = Elite Creator, 70–84 = Trusted Creator, 55–69 = Established, 40–54 = Developing, below 40 = High Risk.",
      "You can filter creators by minimum Trust Score in the Browse page. We recommend investing in creators with a score of 55 or above for your first deal.",
    ],
  },
  {
    id: "referrals",
    icon: faGift,
    color: "#f59e0b",
    title: "Referral programme",
    content: [
      "Refer other investors to SkillFund and permanently reduce your investment commission rate. Every qualifying referral reduces your rate — the more you refer, the less commission you pay.",
      "Share your referral link from the Referrals page. The reduction is permanent and never expires.",
    ],
  },
  {
    id: "disputes",
    icon: faScaleBalanced,
    color: "#f97316",
    title: "Raising a dispute",
    content: [
      "If a creator is not reporting earnings, submitting false proof, or has gone unresponsive, raise a dispute from the Disputes page.",
      "Our team reviews disputes within 48 hours and examines all conversation history, milestone proof and the locked agreement before deciding.",
      "In serious cases, SkillFund can freeze a creator's account and facilitate a refund from escrow.",
    ],
  },
];

const FAQ = [
  { q: "How long does KYC review take?", a: "24–48 hours. You'll receive an in-app notification when it's done." },
  { q: "Can I cancel an investment after locking?", a: "Once an agreement is locked and funded, it cannot be cancelled unilaterally. You can raise a dispute if there are genuine issues." },
  { q: "What happens if a creator misses a milestone?", a: "You can raise a dispute. Our team reviews the case and can approve an extension, force a refund from escrow, or resolve it another way." },
  { q: "Is my money safe?", a: "Funds are held in escrow and released in milestone stages — never all at once. This protects you from the creator misusing the full amount." },
  { q: "What is the platform fee?", a: "Creators pay a withdrawal fee (2–5% depending on their plan). Investors pay a small commission on returns. Both can be reduced through referrals." },
  { q: "Can I invest in multiple creators?", a: "Yes — there is no limit on how many creators you can invest in. Diversifying across multiple creators is recommended to reduce risk." },
  { q: "How do I contact support?", a: "Use the Disputes page to raise a formal issue, or email support@skillfund.io for general queries." },
];

// ─── Components ───────────────────────────────────────────────────────────────

function AccordionItem({ section, navigate }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _bg = _L ? "#f4faf5" : "#040806";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const [open, setOpen] = useState(false);

  return (
    <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "16px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${section.color}15`, border: `1px solid ${section.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FontAwesomeIcon icon={section.icon} style={{ fontSize: "14px", color: section.color }} />
        </div>
        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "1rem", color: _text, flex: 1 }}>
          {section.title}
        </span>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} style={{ fontSize: "12px", color: _dim, flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${_cardBorder}` }}>
          {/* Paragraphs */}
          {section.content?.map((para, i) => (
            <p key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: _muted, lineHeight: 1.7, marginTop: "14px" }}>
              {para}
            </p>
          ))}

          {/* Steps */}
          {section.steps && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {section.steps.map((step, i) => (
                <div
                  key={i}
                  onClick={() => step.path && navigate(step.path)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 16px",
                    borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    cursor: step.path ? "pointer" : "default", transition: ".15s",
                  }}
                  onMouseEnter={e => step.path && (e.currentTarget.style.borderColor = "rgba(34,197,94,0.25)")}
                  onMouseLeave={e => step.path && (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
                >
                  <div style={{ width: "26px", height: "26px", borderRadius: "8px", background: `${section.color}18`, border: `1px solid ${section.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                    <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "12px", color: section.color }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "13px", color: _text, margin: "0 0 3px" }}>{step.label}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: _dim, margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
                  </div>
                  {step.path && <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: "11px", color: "#4a5568", flexShrink: 0, marginTop: "4px" }} />}
                </div>
              ))}
            </div>
          )}

          {/* Icon items */}
          {section.items && (
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {section.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: `1px solid ${_cardBorder}` }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${item.color}12`, border: `1px solid ${item.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FontAwesomeIcon icon={item.icon} style={{ fontSize: "12px", color: item.color }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "13px", color: _text, margin: "0 0 2px" }}>{item.label}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: _dim, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FaqItem({ item }) {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _bg = _L ? "#f4faf5" : "#040806";
  const _card = _L ? "#ffffff" : "#070d08";
  const _cardBorder = _L ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)";
  const _input = _L ? "#edf7ef" : "#0a1209";
  const _text = _L ? "#0a1a0c" : "#f1f5f9";
  const _muted = _L ? "#4b5563" : "#9ca3af";
  const _dim = _L ? "#6b7280" : "#4b5563";
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${_cardBorder}` }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "16px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "14px", color: _text }}>{item.q}</span>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} style={{ fontSize: "11px", color: _dim, flexShrink: 0 }} />
      </button>
      {open && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: _muted, lineHeight: 1.7, margin: "0 0 16px" }}>{item.a}</p>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Help() {
  const _theme = useThemeStore((s) => s.theme);
  const _L = _theme === "light";
  const _bg = _L ? "#f4faf5" : "#040806";
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
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState(user?.role === "investor" ? "investor" : "creator");

  const sections = tab === "investor" ? INVESTOR_SECTIONS : CREATOR_SECTIONS;

  return (
    <div style={{ maxWidth: "720px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Plus+Jakarta+Sans:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
      `}</style>

      {/* Header */}
      <div style={{ background: _heroGrad, border: `1px solid ${_heroBorder}`, borderRadius: "24px", padding: "28px", marginBottom: "24px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.1),transparent)", transform: "translate(30%,-30%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FontAwesomeIcon icon={faCircleQuestion} style={{ fontSize: "14px", color: "#22c55e" }} />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "11px", color: "#22c55e", letterSpacing: ".1em" }}>HELP CENTRE</span>
        </div>
        <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "clamp(1.4rem,3vw,1.9rem)", color: _text, margin: "0 0 8px", lineHeight: 1.1 }}>
          How can we help you?
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: _dim, margin: 0, lineHeight: 1.6 }}>
          Everything you need to know about using SkillFund — from getting started to getting paid.
        </p>
      </div>

      {/* Role tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {[
          { id: "creator",  label: "I'm a Creator",  icon: faBullhorn },
          { id: "investor", label: "I'm an Investor", icon: faUsers },
        ].map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "12px 16px", borderRadius: "14px", cursor: "pointer", transition: ".15s",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "13px",
                background: active ? "rgba(34,197,94,0.1)" : _card,
                border: `1px solid ${active ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.07)"}`,
                color: active ? "#22c55e" : "#6b7280",
              }}
            >
              <FontAwesomeIcon icon={t.icon} style={{ fontSize: "13px" }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Guide sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
        {sections.map(section => (
          <AccordionItem key={section.id} section={section} navigate={navigate} />
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background: _card, border: `1px solid ${_cardBorder}`, borderRadius: "20px", padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <FontAwesomeIcon icon={faCircleQuestion} style={{ fontSize: "16px", color: "#22c55e" }} />
          <h3 style={{ fontFamily: "'Fraunces', serif", fontWeight: 900, fontSize: "1.1rem", color: _text, margin: 0 }}>
            Frequently Asked Questions
          </h3>
        </div>
        {FAQ.map((item, i) => (
          <FaqItem key={i} item={item} />
        ))}
      </div>

      {/* Still need help */}
      <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "18px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "14px", color: _text, margin: "0 0 4px" }}>Still need help?</p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: _dim, margin: 0 }}>
            Raise a dispute or email us at <span style={{ color: "#22c55e" }}>support@skillfund.io</span>
          </p>
        </div>
        <button
          onClick={() => navigate("/disputes")}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "12px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "13px", background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "#000", border: "none", flexShrink: 0 }}
        >
          <FontAwesomeIcon icon={faScaleBalanced} style={{ fontSize: "12px" }} /> Open Dispute
        </button>
      </div>
    </div>
  );
}
