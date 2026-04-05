import { createContext, useContext } from "react";
import { getTermList, getCurrentTerm } from "../utils/termUtils.js";

// Mock 用户信息（后续替换为从 session / API 读取）
const MOCK_USER = {
  id: "student-001",
  name: "李同学",
  grade: "高二",
  className: "高二(3)班",
  schoolName: "示例中学",
};

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const user = MOCK_USER;
  const termList = getTermList(user.grade);   // 该学生所有历史学期
  const currentTerm = getCurrentTerm();        // 当前学期（只读，用于录入默认值）

  return (
    <UserContext.Provider value={{ user, termList, currentTerm }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
