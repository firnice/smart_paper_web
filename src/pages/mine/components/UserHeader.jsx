import { UserRound } from "lucide-react";

export default function UserHeader({ student, profile }) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-indigo-100">我的学习</p>
          <h1 className="mt-1 text-3xl font-bold">{student?.name || "同学"}</h1>
          <p className="mt-2 text-sm text-indigo-100">
            年级：{profile.grade || "-"} · 学号：{profile.student_no || "-"}
          </p>
          <p className="mt-1 text-sm text-indigo-100">
            学校：{profile.school_name || "-"} · 班级：{profile.class_name || "-"}
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <UserRound className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}
