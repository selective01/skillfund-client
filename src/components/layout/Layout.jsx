import Sidebar from "./Sidebar";
import Header from "./Header";
import useThemeStore from "../../store/useThemeStore";

export default function Layout({ children, title = "Dashboard" }) {
  const { theme } = useThemeStore();
  const bg = theme === "light" ? "#f4faf5" : "#040806";

  return (
    <div className="min-h-screen" style={{ background: bg, transition: "background 0.25s ease" }}>
      <Sidebar />
      <div className="ml-64">
        <Header title={title} />
        <main className="pt-16 min-h-screen">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
