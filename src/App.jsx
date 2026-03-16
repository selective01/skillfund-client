import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import useAdminAuthStore from "./store/useAdminAuthStore";
import useThemeStore from "./store/useThemeStore";
import Layout from "./components/layout/Layout";
import AdminLayout from "./components/layout/AdminLayout";
import SocketListeners from "./components/realtime/SocketListeners";

import HomePage from "./pages/HomePage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/shared/Dashboard";
import NotFound from "./pages/shared/NotFound";
import Profile from "./pages/shared/Profile";
import BrowseCreators from "./pages/investor/BrowseCreators";
import BrowseInvestors from "./pages/creator/BrowseInvestors";
import Connections from "./pages/shared/Connections";
import Messages from "./pages/shared/Messages";
import InvestmentsEarnings from "./pages/shared/InvestmentsEarnings";
import CreatorDashboard from "./pages/creator/CreatorDashboard";
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import UserProfile from "./pages/shared/UserProfile";
import Withdraw from "./pages/shared/Withdraw";
import Notifications from "./pages/shared/Notifications";
import Settings from "./pages/shared/Settings";
import KYC from "./pages/shared/Kyc";
import PaymentVerify from "./pages/shared/PaymentVerify";
import Milestones from "./pages/shared/Milestones";
import BrowseSyndicates from "./pages/shared/BrowseSyndicates";
import SyndicateCampaign from "./pages/shared/SyndicateCampaign";
import Dispute from "./pages/shared/Dispute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminUsers, AdminVerifications, AdminWithdrawals, AdminDisputes, AdminTransactions, AdminReports } from "./pages/admin/AdminPages";

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
  };

  // Handle dynamic segments like /investments/:id/milestones
  let title = TITLES[location.pathname];
  if (!title && location.pathname.includes("/milestones")) title = "Milestones";
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
  const { theme } = useThemeStore();
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

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
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
