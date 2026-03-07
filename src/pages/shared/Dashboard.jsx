import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import useAuthStore from "../../store/authStore";
import api from "../../utils/api";
import {
  TrendingUp,
  Users,
  Wallet,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === "admin") {
          const res = await api.get("/admin/analytics");
          setStats(res.data.analytics);
        } else {
          const res = await api.get("/investments/my-investments");
          setStats(res.data.summary);
        }
      } catch (error) {
        console.error("Failed to fetch stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const creatorStats = [
    {
      label: "Total Raised",
      value: `$${stats?.totalInvested || 0}`,
      icon: Wallet,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Active Investments",
      value: stats?.activeInvestments || 0,
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Total Returns",
      value: `$${stats?.totalReturns || 0}`,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Completed",
      value: stats?.completedInvestments || 0,
      icon: Users,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  const adminStats = [
    {
      label: "Total Users",
      value: stats?.users?.total || 0,
      icon: Users,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Active Investments",
      value: stats?.investments?.active || 0,
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Total Invested",
      value: `$${stats?.investments?.totalInvested || 0}`,
      icon: TrendingUp,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Pending Withdrawals",
      value: stats?.pending?.withdrawals || 0,
      icon: Wallet,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
    },
  ];

  const displayStats = user?.role === "admin" ? adminStats : creatorStats;

  return (
    <Layout title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600/20 to-primary-500/10 border border-primary-500/20 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          Welcome back, {user?.name}! 👋
        </h2>
        <p className="text-dark-200">
          You are on the{" "}
          <span className="text-primary-400 font-semibold capitalize">
            {user?.plan}
          </span>{" "}
          plan as a{" "}
          <span className="text-primary-400 font-semibold capitalize">
            {user?.role}
          </span>
          .{" "}
          {user?.plan === "basic" && (
            <span className="text-yellow-400">
              Upgrade your plan to unlock more features.
            </span>
          )}
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-dark-500 rounded mb-4 w-1/2"></div>
              <div className="h-8 bg-dark-500 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {displayStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-dark-200 text-sm">{stat.label}</p>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <Icon size={18} className={stat.color} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {user?.role === "creator" && (
              <>
                <QuickAction emoji="📸" label="Upload Portfolio" path="/profile" />
                <QuickAction emoji="💬" label="View Messages" path="/messages" />
                <QuickAction emoji="💰" label="Report Earnings" path="/earnings" />
                <QuickAction emoji="🏦" label="Withdraw Funds" path="/withdraw" />
              </>
            )}
            {user?.role === "investor" && (
              <>
                <QuickAction emoji="🔍" label="Browse Creators" path="/browse" />
                <QuickAction emoji="💬" label="View Messages" path="/messages" />
                <QuickAction emoji="📈" label="View Portfolio" path="/portfolio" />
                <QuickAction emoji="🏦" label="Withdraw Funds" path="/withdraw" />
              </>
            )}
            {user?.role === "admin" && (
              <>
                <QuickAction emoji="👥" label="Manage Users" path="/admin/users" />
                <QuickAction emoji="✅" label="Review Verifications" path="/admin/verifications" />
                <QuickAction emoji="💸" label="Approve Withdrawals" path="/admin/withdrawals" />
                <QuickAction emoji="⚖️" label="Resolve Disputes" path="/admin/disputes" />
              </>
            )}
          </div>
        </div>

        {/* Account Status */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4">Account Status</h3>
          <div className="space-y-3">
            <StatusItem label="Email Verified" value={user?.emailVerified} />
            <StatusItem label="Phone Verified" value={user?.phoneVerified} />
            <StatusItem label="ID Verified" value={user?.idVerified} />
            <StatusItem label="Profile Verified" value={user?.isVerified} />
            <div className="pt-2 border-t border-dark-500">
              <div className="flex items-center justify-between">
                <span className="text-dark-200 text-sm">Current Plan</span>
                <span className="text-primary-400 font-semibold capitalize bg-primary-500/10 px-3 py-1 rounded-full text-sm">
                  {user?.plan}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function QuickAction({ emoji, label, path }) {
  return (
    <Link
      to={path}
      className="flex items-center gap-3 p-3 rounded-xl bg-dark-700 hover:bg-dark-500 transition-all group"
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-dark-100 group-hover:text-white font-medium transition-colors">
        {label}
      </span>
      <span className="ml-auto text-dark-300 group-hover:text-primary-400 transition-colors">
        →
      </span>
    </Link>
  );
}

function StatusItem({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-dark-200 text-sm">{label}</span>
      <span
        className={`text-sm font-medium px-3 py-1 rounded-full ${
          value
            ? "text-green-400 bg-green-400/10"
            : "text-red-400 bg-red-400/10"
        }`}
      >
        {value ? "✓ Verified" : "✗ Pending"}
      </span>
    </div>
  );
}