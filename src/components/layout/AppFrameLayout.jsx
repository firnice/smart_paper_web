import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Camera, User } from "lucide-react";

export default function AppFrameLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const workspaceActive = location.pathname.startsWith("/workspace");
  const mineActive = location.pathname.startsWith("/mine");

  return (
    <div className="flex h-screen flex-col bg-[#F4F5F7]">
      <main className="flex-1 overflow-auto pb-[72px]">
        <div className="mx-auto max-w-[430px] px-4 pt-4 pb-2">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="safe-area-inset-bottom fixed right-0 bottom-0 left-0 z-50 bg-white" style={{ boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 -4px 12px rgba(0,0,0,0.04)" }}>
        <div className="mx-auto flex max-w-[430px] items-end justify-around px-4 pb-2 pt-1">
          {/* 工作台 */}
          <NavLink
            to="/workspace"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <LayoutDashboard className={`h-6 w-6 ${workspaceActive ? "text-indigo-600" : "text-gray-400"}`} />
            <span className={`text-[11px] font-medium ${workspaceActive ? "text-indigo-600" : "text-gray-400"}`}>
              工作台
            </span>
          </NavLink>

          {/* 中央 Camera FAB */}
          <div className="flex flex-1 flex-col items-center justify-end pb-1">
            <button
              type="button"
              className="flex h-[56px] w-[56px] -translate-y-4 items-center justify-center rounded-full transition active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)", boxShadow: "0 4px 16px rgba(99,102,241,0.45), 0 2px 6px rgba(0,0,0,0.12)" }}
              onClick={() => navigate("/workspace", { state: { openComposer: true } })}
            >
              <Camera className="h-6 w-6 text-white" strokeWidth={2} />
            </button>
            <span className="mt-[-10px] text-[11px] font-medium text-indigo-500">拍照</span>
          </div>

          {/* 我的 */}
          <NavLink
            to="/mine"
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
          >
            <User className={`h-6 w-6 ${mineActive ? "text-indigo-600" : "text-gray-400"}`} />
            <span className={`text-[11px] font-medium ${mineActive ? "text-indigo-600" : "text-gray-400"}`}>
              我的
            </span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
