import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { SquarePen, User, Plus } from "lucide-react";

const NAV_ITEMS = [
  { path: "/workspace", icon: SquarePen, label: "工作台" },
  { path: "/mine", icon: User, label: "我的" },
];

export default function AppFrameLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-[#F8F9FA]">
      <main className="flex-1 overflow-auto pb-20">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      <nav className="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-around px-2 py-2">
          {/* 工作台 tab */}
          {(() => {
            const item = NAV_ITEMS[0];
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
              >
                <Icon className={`h-6 w-6 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                <span className={`text-xs ${isActive ? "font-medium text-indigo-600" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })()}

          {/* 中央 FAB 录入按钮 */}
          <button
            type="button"
            className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-300/40 transition active:scale-95"
            onClick={() => navigate("/workspace", { state: { openComposer: true } })}
          >
            <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
          </button>

          {/* 我的 tab */}
          {(() => {
            const item = NAV_ITEMS[1];
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
              >
                <Icon className={`h-6 w-6 ${isActive ? "text-indigo-600" : "text-gray-400"}`} />
                <span className={`text-xs ${isActive ? "font-medium text-indigo-600" : "text-gray-500"}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })()}
        </div>
      </nav>
    </div>
  );
}
