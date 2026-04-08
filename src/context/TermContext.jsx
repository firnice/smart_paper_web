import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { readStudentSession } from "../utils/studentSession.js";
import { listSchoolTerms } from "../services/api.js";

const TermContext = createContext(null);

function inferTermFromTerms(terms) {
  const grade = readStudentSession()?.student?.student_profile?.grade;
  if (!grade || !terms.length) return null;
  const month = new Date().getMonth() + 1;
  const semester = [9, 10, 11, 12, 1].includes(month) ? "上" : "下";
  return terms.find((t) => t.name === `${grade}${semester}`) || null;
}

export function TermProvider({ children }) {
  const [allTerms, setAllTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);

  // Load all 12 terms once on mount
  useEffect(() => {
    listSchoolTerms()
      .then((res) => {
        const terms = res?.items || [];
        setAllTerms(terms);
        // Infer on first load if session is already available
        setCurrentTerm((prev) => prev || inferTermFromTerms(terms));
      })
      .catch(() => {});
  }, []);

  // Called after login to trigger re-inference with the freshly saved session
  const inferTerm = useCallback(() => {
    setCurrentTerm((prev) => prev || inferTermFromTerms(allTerms));
  }, [allTerms]);

  // Pure local switch — no API call, no persistence
  const changeTerm = useCallback((termId) => {
    const term = allTerms.find((t) => t.id === termId) || null;
    setCurrentTerm(term);
  }, [allTerms]);

  return (
    <TermContext.Provider value={{ allTerms, currentTerm, changeTerm, inferTerm, loading: false }}>
      {children}
    </TermContext.Provider>
  );
}

export function useTerm() {
  const ctx = useContext(TermContext);
  if (!ctx) throw new Error("useTerm must be used within a TermProvider");
  return ctx;
}
