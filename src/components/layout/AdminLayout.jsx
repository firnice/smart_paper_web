import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Users, Server, Settings, Activity, LogOut } from "lucide-react";
import { readAdminSession, clearAdminSession } from "../../utils/adminSession.js";

const NAV_ITEMS = [
  { to: "/admin/students", label: "学生管理", Icon: Users },
  { to: "/admin/providers", label: "模型供应商", Icon: Server },
  { to: "/admin/agents", label: "Agent 配置", Icon: Settings },
  { to: "/admin/llm-logs", label: "请求日志", Icon: Activity },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = readAdminSession();

  function handleLogout() {
    clearAdminSession();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed top-0 left-0 flex h-screen w-56 flex-col border-r border-white/10 bg-slate-950 text-white shadow-2xl">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-200">
            Admin
          </div>
          <h1 className="mt-3 text-lg font-black">Smart Paper</h1>
          <p className="mt-1 text-xs text-slate-400">管理后台</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ to, label, Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-indigo-600" : ""}`} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-3 text-xs text-slate-400">
            <span className="font-medium text-white">{session?.role || "admin"}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 transition hover:bg-white/8 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="ml-56 min-h-screen w-full p-8">
        <Outlet />
      </main>
    </div>
  );
}
