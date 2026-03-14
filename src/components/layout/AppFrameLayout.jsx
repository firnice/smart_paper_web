import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, BookOpen, Printer, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "首页" },
  { path: "/bank", icon: BookOpen, label: "错题本" },
  { path: "/print", icon: Printer, label: "打印" },
  { path: "/profile", icon: User, label: "我的" },
];

export default function AppFrameLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col bg-[#F8F9FA]">
      <main className="flex-1 overflow-auto pb-20">
        <div className="p-4">
          <Outlet />
        </div>
      </main>

      <nav className="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
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
          })}
        </div>
      </nav>
    </div>
  );
}
