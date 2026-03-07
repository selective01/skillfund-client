import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  TrendingUp,
  Wallet,
  Settings,
  LogOut,
  Search,
  Bell,
  Shield,
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const creatorLinks = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/profile", icon: Users, label: "My Profile" },
  { path: "/connections", icon: Users, label: "Connections" },
  { path: "/messages", icon: MessageSquare, label: "Messages" },
  { path: "/investments", icon: TrendingUp, label: "Investments" },
  { path: "/earnings", icon: Wallet, label: "Earnings" },
  { path: "/withdraw", icon: Wallet, label: "Withdraw" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const investorLinks = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/profile", icon: Users, label: "My Profile" },
  { path: "/browse", icon: Search, label: "Browse Creators" },
  { path: "/connections", icon: Users, label: "Connections" },
  { path: "/messages", icon: MessageSquare, label: "Messages" },
  { path: "/portfolio", icon: TrendingUp, label: "Portfolio" },
  { path: "/withdraw", icon: Wallet, label: "Withdraw" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const adminLinks = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/admin/users", icon: Users, label: "Users" },
  { path: "/admin/verifications", icon: Shield, label: "Verifications" },
  { path: "/admin/withdrawals", icon: Wallet, label: "Withdrawals" },
  { path: "/admin/disputes", icon: Shield, label: "Disputes" },
  { path: "/admin/transactions", icon: TrendingUp, label: "Transactions" },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "investor"
      ? investorLinks
      : creatorLinks;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-dark-700 border-r border-dark-500 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-dark-500">
        <h1 className="text-2xl font-bold gradient-text">SkillFund</h1>
        <p className="text-dark-200 text-xs mt-1 capitalize">
          {user?.role} · {user?.plan} plan
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "text-dark-200 hover:bg-dark-600 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-dark-500">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-primary-400 font-bold text-sm overflow-hidden">
                {user?.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                    user?.name?.charAt(0).toUpperCase()
                )}
           </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-dark-200 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-dark-200 hover:bg-dark-600 hover:text-white transition-all w-full"
        >
          <LogOut size={18} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}