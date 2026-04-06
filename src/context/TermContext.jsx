import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { readStudentSession } from "../utils/studentSession.js";
import { listSchoolTerms } from "../services/api.js";

const TermContext = createContext(null);

export function TermProvider({ children }) {
  const [allTerms, setAllTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);

  const session = readStudentSession();
  const profile = session?.student?.student_profile || {};

  // Load all 12 terms once on mount
  useEffect(() => {
    listSchoolTerms()
      .then((res) => setAllTerms(res?.items || []))
      .catch(() => {});
  }, []);

  // Auto-infer from grade + today's date (only on first load, no persistence)
  useEffect(() => {
    if (!allTerms.length || currentTerm) return;
    const grade = profile.grade;
    if (!grade) return;
    const month = new Date().getMonth() + 1;
    const semester = [9, 10, 11, 12, 1].includes(month) ? "上" : "下";
    const inferredName = `${grade}${semester}`;
    const inferred = allTerms.find((t) => t.name === inferredName) || null;
    setCurrentTerm(inferred);
  }, [allTerms, profile.grade]);

  // Pure local switch — no API call, no persistence
  const changeTerm = useCallback((termId) => {
    const term = allTerms.find((t) => t.id === termId) || null;
    setCurrentTerm(term);
  }, [allTerms]);

  return (
    <TermContext.Provider value={{ allTerms, currentTerm, changeTerm, loading: false }}>
      {children}
    </TermContext.Provider>
  );
}

export function useTerm() {
  const ctx = useContext(TermContext);
  if (!ctx) throw new Error("useTerm must be used within a TermProvider");
  return ctx;
}
