import { Outlet, NavLink } from "react-router-dom";
import { Home, BookOpen, Printer, RefreshCw, BarChart2, Upload, LogOut } from "lucide-react";
import { useUser } from "../../context/UserContext.jsx";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "工作台" },
  { path: "/bank", icon: BookOpen, label: "错题本" },
  { path: "/print", icon: Printer, label: "组卷打印" },
  { path: "/insights", icon: RefreshCw, label: "反复出错" },
  { path: "/profile", icon: BarChart2, label: "学情画像" },
];

export default function AppFrameLayout() {
  const { user } = useUser();

  return (
    <div className="flex h-screen bg-[#F4F5F7]">
      {/* 左侧边栏 */}
      <aside className="flex w-56 flex-col bg-white shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
            AI
          </div>
          <span className="font-semibold text-gray-900">AI错题助手</span>
        </div>

        {/* 用户信息 */}
        <div className="mx-4 mb-4 rounded-xl bg-gray-50 px-3 py-2.5">
          <div className="text-sm font-medium text-gray-800">{user.name}</div>
          <div className="text-xs text-gray-500">{user.grade} · {user.className}</div>
        </div>

        {/* 录入新错题按钮 */}
        <div className="px-4 mb-5">
          <NavLink
            to="/upload"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            录入新错题
          </NavLink>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* 退出登录 */}
        <div className="px-3 pb-5">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
