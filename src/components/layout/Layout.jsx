import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import useThemeStore from "../../store/useThemeStore";

export default function Layout({ children, title = "Dashboard", noPadding = false }) {
  const { theme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const bg = theme === "light" ? "#f4faf5" : "#040806";

  return (
    <div className="min-h-screen" style={{ background: bg, transition: "background 0.25s ease" }}>

      {/* Mobile overlay — tap outside to close */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:ml-64">
        <Header
          title={title}
          onMenuClick={() => setSidebarOpen((v) => !v)}
          sidebarOpen={sidebarOpen}
        />
        {/* pt-16 clears the fixed header. No extra top padding so content
            starts flush against the header line on every page. */}
        <main className="pt-16">
          {noPadding ? children : (
            <div className="px-4 lg:px-6 py-4">
              {children}
            </div>
          )}
        </main>
      </div>

    </div>
  );
}
