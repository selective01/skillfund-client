import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import useAdminAuthStore from "./store/useAdminAuthStore";
import useThemeStore from "./store/useThemeStore";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import SocketListeners from "./components/realtime/SocketListeners";

// ── Critical path — loaded eagerly (always needed on first render)
import HomePage from "./pages/HomePage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/shared/NotFound";

// ── All other pages — lazy loaded (split into separate chunks)
const AdminLogin          = lazy(() => import("./pages/admin/AdminLogin"));
const Dashboard           = lazy(() => import("./pages/shared/Dashboard"));
const Profile             = lazy(() => import("./pages/shared/Profile"));
const BrowseCreators      = lazy(() => import("./pages/investor/BrowseCreators"));
const BrowseInvestors     = lazy(() => import("./pages/creator/BrowseInvestors"));
const Connections         = lazy(() => import("./pages/shared/Connections"));
const Messages            = lazy(() => import("./pages/shared/Messages"));
const InvestmentsEarnings = lazy(() => import("./pages/shared/InvestmentsEarnings"));
const CreatorDashboard    = lazy(() => import("./pages/creator/CreatorDashboard"));
const InvestorDashboard   = lazy(() => import("./pages/investor/InvestorDashboard"));
const UserProfile         = lazy(() => import("./pages/shared/UserProfile"));
const Withdraw            = lazy(() => import("./pages/shared/Withdraw"));
const Notifications       = lazy(() => import("./pages/shared/Notifications"));
const Settings            = lazy(() => import("./pages/shared/Settings"));
const KYC                 = lazy(() => import("./pages/shared/Kyc"));
const PaymentVerify       = lazy(() => import("./pages/shared/PaymentVerify"));
const Milestones          = lazy(() => import("./pages/shared/Milestones"));
const BrowseSyndicates    = lazy(() => import("./pages/shared/BrowseSyndicates"));
const SyndicateCampaign   = lazy(() => import("./pages/shared/SyndicateCampaign"));
const Dispute             = lazy(() => import("./pages/shared/Dispute"));
const CampaignPage        = lazy(() => import("./pages/shared/CampaignPage"));
const CampaignSetup       = lazy(() => import("./pages/creator/CampaignSetup"));
const TrustVerification   = lazy(() => import("./pages/creator/TrustVerification"));
const VoiceVerification   = lazy(() => import("./pages/creator/VoiceVerification"));
const ReferralProgramme   = lazy(() => import("./pages/shared/ReferralProgramme"));
const Help                = lazy(() => import("./pages/shared/Help"));

// ── Admin pages — separate chunk, only fetched if admin logs in
const AdminDashboard      = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers              = lazy(() => import("./pages/admin/AdminPages").then(m => ({ default: m.AdminUsers })));
const AdminVerifications      = lazy(() => import("./pages/admin/AdminPages").then(m => ({ default: m.AdminVerifications })));
const AdminWithdrawals        = lazy(() => import("./pages/admin/AdminPages").then(m => ({ default: m.AdminWithdrawals })));
const AdminDisputes           = lazy(() => import("./pages/admin/AdminPages").then(m => ({ default: m.AdminDisputes })));
const AdminTransactions       = lazy(() => import("./pages/admin/AdminPages").then(m => ({ default: m.AdminTransactions })));
const AdminReports            = lazy(() => import("./pages/admin/AdminPages").then(m => ({ default: m.AdminReports })));
const AdminVoiceVerifications = lazy(() => import("./pages/admin/AdminTrustPages").then(m => ({ default: m.AdminVoiceVerifications })));
const AdminAssetCollateral    = lazy(() => import("./pages/admin/AdminTrustPages").then(m => ({ default: m.AdminAssetCollateral })));
const AdminGuarantors         = lazy(() => import("./pages/admin/AdminTrustPages").then(m => ({ default: m.AdminGuarantors })));
const AdminRevenue            = lazy(() => import("./pages/admin/AdminRevenue").then(m => ({ default: m.AdminRevenue })));

// ── Page loading fallback
function PageLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid rgba(34,197,94,0.2)", borderTopColor: "#22c55e", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const PrivateRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { adminUser } = useAdminAuthStore();
  if (!adminUser) return <Navigate to="/admin/login" />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuthStore();
  return !user ? children : <Navigate to="/dashboard" />;
};

// Single shared Layout instance for all public-layout routes.
// Title is derived from the current path so it never needs to remount.
function PublicAppLayout() {
  const location = useLocation();
  const TITLES = {
    "/browse":    "Browse Creators",
    "/investors": "Browse Investors",
    "/syndicates": "Browse Syndicates",
  };
  const title = TITLES[location.pathname] || "SkillFund";
  return (
    <Layout title={title}>
      <Outlet />
    </Layout>
  );
}

// Single shared Layout instance for ALL protected routes.
// Header and Sidebar mount ONCE and never remount on navigation —
// this is what allows the notification count to persist correctly
// after the fetch resolves, without depending on mount timing.
function ProtectedAppLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  if (!user) return <Navigate to="/login" />;

  const TITLES = {
    "/dashboard":   "Dashboard",
    "/profile":     "Profile",
    "/connections": "Connections",
    "/messages":    "Messages",
    "/investments": "Investments",
    "/portfolio":   "My Portfolio",
    "/earnings":    "Creator Dashboard",
    "/withdraw":    "Withdraw",
    "/notifications": "Notifications",
    "/settings":    "Settings",
    "/kyc":         "Verify Identity",
    "/disputes":    "Disputes",
    "/campaign/setup": "Campaign Setup",
    "/trust":       "Trust Verification",
    "/voice-verify": "Voice Verification",
    "/referrals":   "Referral Programme",
    "/help":        "Help Centre",
  };

  // Handle dynamic segments like /investments/:id/milestones
  let title = TITLES[location.pathname];
  if (!title && location.pathname.includes("/milestones")) title = "Milestones";
  if (!title && location.pathname.startsWith("/campaign/")) title = "Campaign";
  if (!title) title = "SkillFund";

  const isMessages = location.pathname === "/messages";

  return (
    <Layout title={title} noPadding={isMessages}>
      <Outlet />
    </Layout>
  );
}

function AdminAppLayout() {
  const location = useLocation();
  const TITLES = {
    "/admin":               "Dashboard",
    "/admin/dashboard":     "Dashboard",
    "/admin/users":         "User Management",
    "/admin/verifications": "KYC Verifications",
    "/admin/withdrawals":   "Withdrawal Approvals",
    "/admin/disputes":      "Disputes",
    "/admin/transactions":  "Transactions",
    "/admin/reports":       "User Reports",
    "/admin/revenue":       "Platform Revenue",
    "/admin/voice":         "Voice Verifications",
    "/admin/assets":        "Asset Collateral",
    "/admin/guarantors":    "Guarantors",
  };
  const title = TITLES[location.pathname] || "Admin Portal";
  return (
    <AdminRoute>
      <AdminLayout title={title}>
        <Outlet />
      </AdminLayout>
    </AdminRoute>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function ThemeProvider() {
  const { theme, loadTheme } = useThemeStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadTheme(user?.id);
  }, [user?.id]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <ThemeProvider />
      <SocketListeners />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#fff", border: "1px solid #374151" },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ── Fully public routes (no sidebar) ── */}
        <Route path="/"            element={<HomePage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register"    element={<PublicRoute><Register /></PublicRoute>} />

        {/* ── Public browse + profile pages — single shared Layout instance ── */}
        <Route element={<PublicAppLayout />}>
          <Route path="/browse"        element={<BrowseCreators />} />
          <Route path="/investors"     element={<BrowseInvestors />} />
          <Route path="/syndicates"    element={<BrowseSyndicates />} />
          <Route path="/syndicates/:id" element={<SyndicateCampaign />} />
          <Route path="/users/:id"     element={<UserProfile />} />
          <Route path="/creators/:id"  element={<UserProfile />} />
          <Route path="/investors/:id" element={<UserProfile />} />
          <Route path="/campaign/:id"  element={<CampaignPage />} />
        </Route>

        {/* ── ALL protected routes share ONE Layout instance ── */}
        {/* Header and Sidebar mount once — notification counts never reset */}
        <Route element={<ProtectedAppLayout />}>
          <Route path="/dashboard"    element={<Dashboard />} />
          <Route path="/profile"      element={<Profile />} />
          <Route path="/connections"  element={<Connections />} />
          <Route path="/messages"     element={<Messages />} />
          <Route path="/investments"  element={<InvestmentsEarnings />} />
          <Route path="/portfolio"    element={<InvestorDashboard />} />
          <Route path="/earnings"     element={<CreatorDashboard />} />
          <Route path="/withdraw"     element={<Withdraw />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings"     element={<Settings />} />
          <Route path="/kyc"          element={<KYC />} />
          <Route path="/disputes"     element={<Dispute />} />
          <Route path="/investments/:investmentId/milestones" element={<Milestones />} />
          <Route path="/campaign/setup"  element={<CampaignSetup />} />
          <Route path="/campaign/:id"    element={<CampaignPage />} />
          <Route path="/trust"           element={<TrustVerification />} />
          <Route path="/voice-verify"    element={<VoiceVerification />} />
          <Route path="/referrals"       element={<ReferralProgramme />} />
          <Route path="/help"            element={<Help />} />
        </Route>

        {/* ── Payment return pages — full screen, no sidebar ── */}
        <Route path="/payment/verify"    element={<PrivateRoute><PaymentVerify /></PrivateRoute>} />
        <Route path="/payment/success"   element={<PrivateRoute><PaymentVerify /></PrivateRoute>} />
        <Route path="/payment/cancelled" element={<PrivateRoute><PaymentVerify /></PrivateRoute>} />

        {/* ── Admin routes ── */}
        <Route path="/admin" element={<AdminAppLayout />}>
          <Route index              element={<AdminDashboard />} />
          <Route path="dashboard"   element={<AdminDashboard />} />
          <Route path="users"       element={<AdminUsers />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="disputes"    element={<AdminDisputes />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="reports"      element={<AdminReports />} />
          <Route path="revenue"      element={<AdminRevenue />} />
          <Route path="voice"        element={<AdminVoiceVerifications />} />
          <Route path="assets"       element={<AdminAssetCollateral />} />
          <Route path="guarantors"   element={<AdminGuarantors />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
