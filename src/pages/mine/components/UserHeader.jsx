import { UserRound } from "lucide-react";

export default function UserHeader({ student, profile }) {
  return (
    <div
      className="overflow-hidden rounded-2xl p-5 text-white"
      style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #A78BFA 100%)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="flex h-[56px] w-[56px] items-center justify-center rounded-2xl flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <UserRound className="h-7 w-7 text-white" />
        </div>
        {/* Info */}
        <div className="min-w-0">
          <p className="text-[11px] text-white/70">孩子学习概览</p>
          <h1 className="mt-0.5 text-[20px] font-bold leading-tight">{student?.name || "已绑定孩子"}</h1>
          <p className="mt-1 text-[12px] text-white/80">
            {profile.grade || "—"} · {profile.school_name || "—"} · {profile.class_name || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
