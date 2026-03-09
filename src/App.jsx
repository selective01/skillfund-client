import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/authStore";
import useThemeStore from "./store/useThemeStore";
import Layout from "./components/layout/Layout";

import HomePage from "./pages/HomePage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/shared/Dashboard";
import NotFound from "./pages/shared/NotFound";
import Profile from "./pages/shared/Profile";
import BrowseCreators from "./pages/investor/BrowseCreators";
import BrowseInvestors from "./pages/creator/BrowseInvestors";
import Connections from "./pages/shared/Connections";
import Messages from "./pages/shared/Messages";
import InvestmentsEarnings from "./pages/shared/InvestmentsEarnings";
import UserProfile from "./pages/shared/UserProfile";
import Withdraw from "./pages/shared/Withdraw";
import Notifications from "./pages/shared/Notifications";
import Settings from "./pages/shared/Settings";
import Milestones from "./pages/shared/Milestones";
import BrowseSyndicates from "./pages/shared/BrowseSyndicates";
import SyndicateCampaign from "./pages/shared/SyndicateCampaign";
import { AdminUsers, AdminVerifications, AdminWithdrawals, AdminDisputes, AdminTransactions } from "./pages/admin/AdminPages";

const PrivateRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuthStore();
  return !user ? children : <Navigate to="/dashboard" />;
};

// Shared layout shell — Sidebar + Header mount ONCE, only <Outlet> swaps on navigation
function AppLayout({ title }) {
  return (
    <PrivateRoute>
      <Layout title={title}>
        <Outlet />
      </Layout>
    </PrivateRoute>
  );
}

// Scrolls window to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Syncs theme store → <html data-theme="..."> so CSS vars cascade everywhere
function ThemeProvider() {
  const { theme } = useThemeStore();
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return null;
}

function App() {
  const { theme } = useThemeStore();

  // Apply on first render too (before ThemeProvider mounts inside Router)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  return (
    <Router>
      <ScrollToTop />
      <ThemeProvider />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: "#1f2937", color: "#fff", border: "1px solid #374151" },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
        }}
      />
      <Routes>
        {/* ── Public routes (no sidebar) ── */}
        <Route path="/"         element={<HomePage />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* ── Protected routes — all share ONE Layout instance, Sidebar never remounts ── */}
        <Route element={<AppLayout title="Dashboard" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route element={<AppLayout title="Profile" />}>
          <Route path="/profile"       element={<Profile />} />
          <Route path="/users/:id"     element={<UserProfile />} />
          <Route path="/creators/:id"  element={<UserProfile />} />
          <Route path="/investors/:id" element={<UserProfile />} />
        </Route>

        <Route element={<AppLayout title="Browse Creators" />}>
          <Route path="/browse" element={<BrowseCreators />} />
        </Route>

        <Route element={<AppLayout title="Browse Investors" />}>
          <Route path="/investors" element={<BrowseInvestors />} />
        </Route>

        <Route element={<AppLayout title="Connections" />}>
          <Route path="/connections" element={<Connections />} />
        </Route>

        <Route element={<AppLayout title="Messages" />}>
          <Route path="/messages" element={<Messages />} />
        </Route>

        <Route element={<AppLayout title="Investments" />}>
          <Route path="/investments" element={<InvestmentsEarnings />} />
          <Route path="/portfolio"   element={<InvestmentsEarnings />} />
          <Route path="/earnings"    element={<InvestmentsEarnings />} />
        </Route>

        <Route element={<AppLayout title="Withdraw" />}>
          <Route path="/withdraw" element={<Withdraw />} />
        </Route>

        <Route element={<AppLayout title="Notifications" />}>
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        <Route element={<AppLayout title="Settings" />}>
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route element={<AppLayout title="Milestones" />}>
          <Route path="/investments/:investmentId/milestones" element={<Milestones />} />
        </Route>

        <Route element={<AppLayout title="Syndicates" />}>
          <Route path="/syndicates"    element={<BrowseSyndicates />} />
          <Route path="/syndicates/:id" element={<SyndicateCampaign />} />
        </Route>

        {/* ── Admin routes ── */}
        <Route element={<AppLayout title="Admin" />}>
          <Route path="/admin/users"          element={<AdminUsers />} />
          <Route path="/admin/verifications"  element={<AdminVerifications />} />
          <Route path="/admin/withdrawals"    element={<AdminWithdrawals />} />
          <Route path="/admin/disputes"       element={<AdminDisputes />} />
          <Route path="/admin/transactions"   element={<AdminTransactions />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
