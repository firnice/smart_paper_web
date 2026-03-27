import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createErrorReason,
  createParentStudentLink,
  createStudyRecord,
  createSubject,
  createUser,
  createWrongQuestion,
  createWrongQuestionCategory,
  getStatisticsOverview,
  listAgents,
  listErrorReasons,
  listParentStudents,
  listSubjects,
  listUsers,
  listWrongQuestionCategories,
  listWrongQuestions,
  testAgent,
  updateAgent,
} from "../../services/api.js";

const INITIAL_USER_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "student",
  status: "active",
  grade: "",
  class_name: "",
  school_name: "",
};

const INITIAL_WRONG_FORM = {
  student_id: "",
  title: "",
  content: "",
  subject_id: "",
  grade: "",
  question_type: "",
  difficulty: "medium",
  category_id: "",
  status: "new",
  error_reason_ids: [],
};

const INITIAL_STUDY_FORM = {
  wrong_question_id: "",
  result: "incorrect",
  mastery_level: 2,
  time_spent_seconds: 120,
};

export default function WorkspacePage() {
  const [users, setUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [stats, setStats] = useState(null);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [parentStudents, setParentStudents] = useState([]);

  const [userForm, setUserForm] = useState(INITIAL_USER_FORM);
  const [subjectForm, setSubjectForm] = useState({ code: "", name: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [reasonForm, setReasonForm] = useState({ name: "", description: "", category_id: "" });
  const [linkForm, setLinkForm] = useState({ parent_id: "", student_id: "", relation_type: "parent" });
  const [wrongForm, setWrongForm] = useState(INITIAL_WRONG_FORM);
  const [studyForm, setStudyForm] = useState(INITIAL_STUDY_FORM);

  // Agent 管理状态
  const [agents, setAgents] = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agentTestResults, setAgentTestResults] = useState({});
  const [agentTesting, setAgentTesting] = useState({});
  const [batchTesting, setBatchTesting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const studentUsers = useMemo(() => users.filter((item) => item.role === "student"), [users]);
  const parentUsers = useMemo(() => users.filter((item) => item.role === "parent"), [users]);

  const setSuccess = (message) => {
    setError("");
    setNotice(message);
  };

  const setFailure = (message) => {
    setNotice("");
    setError(message);
  };

  const refreshAgents = useCallback(async () => {
    try {
      const data = await listAgents();
      setAgents(data || []);
    } catch {
      // 静默失败，不阻塞其他功能
    }
  }, []);

  const onTestAgent = async (nodeName) => {
    setAgentTesting((prev) => ({ ...prev, [nodeName]: true }));
    setAgentTestResults((prev) => ({ ...prev, [nodeName]: null }));
    try {
      const result = await testAgent(nodeName);
      setAgentTestResults((prev) => ({ ...prev, [nodeName]: result }));
    } catch (err) {
      setAgentTestResults((prev) => ({
        ...prev,
        [nodeName]: { success: false, error: err?.message || "测试失败", elapsed_seconds: 0 },
      }));
    } finally {
      setAgentTesting((prev) => ({ ...prev, [nodeName]: false }));
    }
  };

  const onBatchTestAgents = async () => {
    setBatchTesting(true);
    const enabledAgents = agents.filter((a) => a.is_enabled);
    for (const agent of enabledAgents) {
      setAgentTesting((prev) => ({ ...prev, [agent.node_name]: true }));
      try {
        const result = await testAgent(agent.node_name);
        setAgentTestResults((prev) => ({ ...prev, [agent.node_name]: result }));
      } catch (err) {
        setAgentTestResults((prev) => ({
          ...prev,
          [agent.node_name]: { success: false, error: err?.message || "测试失败", elapsed_seconds: 0 },
        }));
      } finally {
        setAgentTesting((prev) => ({ ...prev, [agent.node_name]: false }));
      }
    }
    setBatchTesting(false);
  };

  const onSaveAgent = async (nodeName, updates) => {
    setLoading(true);
    try {
      await updateAgent(nodeName, updates);
      await refreshAgents();
      setEditingAgent(null);
      setSuccess("Agent 配置已保存");
    } catch (err) {
      setFailure(err?.message || "Agent 配置保存失败");
    } finally {
      setLoading(false);
    }
  };

  const refreshUsersAndMeta = async () => {
    const [usersData, subjectsData, categoriesData, reasonsData] = await Promise.all([
      listUsers({ limit: 100 }),
      listSubjects({ active_only: true, limit: 100 }),
      listWrongQuestionCategories({ limit: 100 }),
      listErrorReasons({ limit: 100 }),
    ]);

    setUsers(usersData.items ?? []);
    setSubjects(subjectsData.items ?? []);
    setCategories(categoriesData.items ?? []);
    setReasons(reasonsData.items ?? []);

    const firstStudent = (usersData.items ?? []).find((item) => item.role === "student");
    if (!selectedStudentId && firstStudent) {
      setSelectedStudentId(String(firstStudent.id));
      setWrongForm((prev) => ({
        ...prev,
        student_id: String(firstStudent.id),
        grade: firstStudent.student_profile?.grade ?? prev.grade,
      }));
      setLinkForm((prev) => ({ ...prev, student_id: String(firstStudent.id) }));
    }
    const firstParent = (usersData.items ?? []).find((item) => item.role === "parent");
    if (!selectedParentId && firstParent) {
      setSelectedParentId(String(firstParent.id));
      setLinkForm((prev) => ({ ...prev, parent_id: String(firstParent.id) }));
    }
  };

  const refreshWrongQuestions = async (studentId) => {
    const query = studentId ? { student_id: studentId, limit: 100 } : { limit: 100 };
    const data = await listWrongQuestions(query);
    const items = data.items ?? [];
    setWrongQuestions(items);
    const firstWrongQuestionId = items[0]?.id ? String(items[0].id) : "";
    setStudyForm((prev) => {
      const currentId = String(prev.wrong_question_id || "");
      const stillExists = items.some((item) => String(item.id) === currentId);
      return {
        ...prev,
        wrong_question_id: stillExists ? currentId : firstWrongQuestionId,
      };
    });
  };

  const refreshStats = async (studentId) => {
    if (!studentId) {
      setStats(null);
      return;
    }
    const data = await getStatisticsOverview(studentId);
    setStats(data);
  };

  const refreshParentStudents = async (parentId) => {
    if (!parentId) {
      setParentStudents([]);
      return;
    }
    const data = await listParentStudents(parentId);
    setParentStudents(data ?? []);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshUsersAndMeta(), refreshAgents()])
      .then(() => setSuccess("基础数据已加载"))
      .catch((err) => setFailure(err?.message || "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      refreshWrongQuestions(selectedStudentId || undefined),
      refreshStats(selectedStudentId || undefined),
    ]).catch((err) => setFailure(err?.message || "错题/统计加载失败"));
  }, [selectedStudentId]);

  useEffect(() => {
    refreshParentStudents(selectedParentId || undefined).catch((err) =>
      setFailure(err?.message || "家长学生关系加载失败"),
    );
  }, [selectedParentId]);

  const onCreateUser = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: userForm.name,
        email: userForm.email || undefined,
        phone: userForm.phone || undefined,
        role: userForm.role,
        status: userForm.status,
      };
      if (userForm.role === "student") {
        payload.student_profile = {
          grade: userForm.grade,
          class_name: userForm.class_name || undefined,
          school_name: userForm.school_name || undefined,
        };
      }
      await createUser(payload);
      await refreshUsersAndMeta();
      setUserForm(INITIAL_USER_FORM);
      setSuccess("用户创建成功");
    } catch (err) {
      setFailure(err?.message || "用户创建失败");
    } finally {
      setLoading(false);
    }
  };

  const onCreateSubject = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createSubject({ code: subjectForm.code, name: subjectForm.name, is_active: true });
      await refreshUsersAndMeta();
      setSubjectForm({ code: "", name: "" });
      setSuccess("学科新增成功");
    } catch (err) {
      setFailure(err?.message || "学科新增失败");
    } finally {
      setLoading(false);
    }
  };

  const onCreateCategory = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createWrongQuestionCategory(categoryForm);
      await refreshUsersAndMeta();
      setCategoryForm({ name: "", description: "" });
      setSuccess("错题分类新增成功");
    } catch (err) {
      setFailure(err?.message || "错题分类新增失败");
    } finally {
      setLoading(false);
    }
  };

  const onCreateReason = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createErrorReason({
        name: reasonForm.name,
        description: reasonForm.description || undefined,
        category_id: reasonForm.category_id ? Number(reasonForm.category_id) : undefined,
      });
      await refreshUsersAndMeta();
      setReasonForm({ name: "", description: "", category_id: "" });
      setSuccess("错误原因新增成功");
    } catch (err) {
      setFailure(err?.message || "错误原因新增失败");
    } finally {
      setLoading(false);
    }
  };

  const onCreateLink = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createParentStudentLink({
        parent_id: Number(linkForm.parent_id),
        student_id: Number(linkForm.student_id),
        relation_type: linkForm.relation_type,
      });
      await refreshParentStudents(linkForm.parent_id);
      setSuccess("家长-学生关系绑定成功");
    } catch (err) {
      setFailure(err?.message || "关系绑定失败");
    } finally {
      setLoading(false);
    }
  };

  const onCreateWrongQuestion = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createWrongQuestion({
        student_id: Number(wrongForm.student_id),
        title: wrongForm.title || undefined,
        content: wrongForm.content,
        subject_id: wrongForm.subject_id ? Number(wrongForm.subject_id) : undefined,
        grade: wrongForm.grade || undefined,
        question_type: wrongForm.question_type || undefined,
        difficulty: wrongForm.difficulty,
        category_id: wrongForm.category_id ? Number(wrongForm.category_id) : undefined,
        error_reason_ids: wrongForm.error_reason_ids.map(Number),
        status: wrongForm.status,
      });
      await Promise.all([
        refreshWrongQuestions(wrongForm.student_id),
        refreshStats(wrongForm.student_id),
      ]);
      setWrongForm((prev) => ({
        ...INITIAL_WRONG_FORM,
        student_id: prev.student_id,
        grade: prev.grade,
      }));
      setSuccess("错题新增成功");
    } catch (err) {
      setFailure(err?.message || "错题新增失败");
    } finally {
      setLoading(false);
    }
  };

  const onCreateStudyRecord = async (event) => {
    event.preventDefault();
    if (!studyForm.wrong_question_id) return;
    setLoading(true);
    try {
      await createStudyRecord(Number(studyForm.wrong_question_id), {
        result: studyForm.result,
        mastery_level: Number(studyForm.mastery_level),
        time_spent_seconds: Number(studyForm.time_spent_seconds),
      });
      await Promise.all([
        refreshWrongQuestions(selectedStudentId || undefined),
        refreshStats(selectedStudentId || undefined),
      ]);
      setSuccess("练习记录已添加");
    } catch (err) {
      setFailure(err?.message || "练习记录添加失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page workspace-page">
      <header className="hero">
        <div className="hero-tag">管理工作台</div>
        <h1>用户与学生错题本管理</h1>
        <p>在这里维护家长/学生、学科/分类/错误原因、错题数据和学习统计。</p>
        <div className="hero-actions">
          <Link className="btn-primary" to="/upload">去识别试卷</Link>
          <Link className="btn-ghost" to="/">回首页</Link>
        </div>
      </header>

      {notice && <div className="workspace-alert ok">{notice}</div>}
      {error && <div className="workspace-alert error">{error}</div>}
      {loading && <div className="workspace-alert">处理中...</div>}

      <section className="workspace-grid">
        <article className="workspace-card" style={{ gridColumn: "1 / -1" }}>
          <h2>系统概览</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 8 }}>
            {[
              { label: "用户总数", value: users.length, color: "#6366f1" },
              { label: "学生数", value: users.filter((u) => u.role === "student").length, color: "#0ea5e9" },
              { label: "家长数", value: users.filter((u) => u.role === "parent").length, color: "#8b5cf6" },
              { label: "错题总数", value: wrongQuestions.length, color: "#f59e0b" },
              { label: "学科数", value: subjects.length, color: "#10b981" },
              {
                label: "Agent 状态",
                value: `${agents.filter((a) => a.is_enabled).length}/${agents.length} 启用`,
                color: agents.every((a) => a.is_enabled) ? "#10b981" : "#f59e0b",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "12px 16px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
          {stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 12 }}>
              {[
                { label: "新错题", value: stats.new_count || 0, color: "#ef4444" },
                { label: "复习中", value: stats.reviewing_count || 0, color: "#f59e0b" },
                { label: "已掌握", value: stats.mastered_count || 0, color: "#10b981" },
                { label: "练习记录", value: stats.study_records_count || 0, color: "#6366f1" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "12px 16px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="workspace-grid">
        <article className="workspace-card">
          <h2>1. 用户维护</h2>
          <form className="workspace-form" onSubmit={onCreateUser}>
            <label>
              姓名
              <input
                required
                value={userForm.name}
                onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </label>
            <label>
              角色
              <select
                value={userForm.role}
                onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                <option value="student">student</option>
                <option value="parent">parent</option>
                <option value="teacher">teacher</option>
              </select>
            </label>
            <label>
              状态
              <select
                value={userForm.status}
                onChange={(e) => setUserForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label>
              邮箱
              <input
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
            <label>
              手机
              <input
                value={userForm.phone}
                onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </label>
            {userForm.role === "student" && (
              <>
                <label>
                  年级
                  <input
                    required
                    value={userForm.grade}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, grade: e.target.value }))}
                  />
                </label>
                <label>
                  班级
                  <input
                    value={userForm.class_name}
                    onChange={(e) =>
                      setUserForm((prev) => ({ ...prev, class_name: e.target.value }))
                    }
                  />
                </label>
                <label>
                  学校
                  <input
                    value={userForm.school_name}
                    onChange={(e) =>
                      setUserForm((prev) => ({ ...prev, school_name: e.target.value }))
                    }
                  />
                </label>
              </>
            )}
            <button className="btn-primary" type="submit">新增用户</button>
          </form>
          <div className="workspace-list">
            <strong>用户列表（{users.length}）</strong>
            {users.map((item) => (
              <div key={item.id} className="workspace-list-item">
                <span>#{item.id} {item.name}</span>
                <span>{item.role}</span>
                <span>{item.student_profile?.grade || "-"}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="workspace-card">
          <h2>2. 家长-学生关系</h2>
          <form className="workspace-form" onSubmit={onCreateLink}>
            <label>
              家长
              <select
                required
                value={linkForm.parent_id}
                onChange={(e) => {
                  setLinkForm((prev) => ({ ...prev, parent_id: e.target.value }));
                  setSelectedParentId(e.target.value);
                }}
              >
                <option value="">请选择</option>
                {parentUsers.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              学生
              <select
                required
                value={linkForm.student_id}
                onChange={(e) => setLinkForm((prev) => ({ ...prev, student_id: e.target.value }))}
              >
                <option value="">请选择</option>
                {studentUsers.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              关系
              <input
                value={linkForm.relation_type}
                onChange={(e) =>
                  setLinkForm((prev) => ({ ...prev, relation_type: e.target.value }))
                }
              />
            </label>
            <button className="btn-primary" type="submit">绑定关系</button>
          </form>
          <div className="workspace-list">
            <strong>家长名下学生</strong>
            {parentStudents.length === 0 ? (
              <p>暂无绑定关系</p>
            ) : (
              parentStudents.map((item) => (
                <div key={item.link_id} className="workspace-list-item">
                  <span>{item.student.name}</span>
                  <span>{item.student.student_profile?.grade || "-"}</span>
                  <span>{item.relation_type}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="workspace-card">
          <h2>3. 字典维护（学科/分类/错误原因）</h2>
          <form className="workspace-inline-form" onSubmit={onCreateSubject}>
            <input
              required
              placeholder="学科 code (math)"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm((prev) => ({ ...prev, code: e.target.value }))}
            />
            <input
              required
              placeholder="学科名称"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <button className="btn-ghost" type="submit">新增学科</button>
          </form>
          <form className="workspace-inline-form" onSubmit={onCreateCategory}>
            <input
              required
              placeholder="分类名称"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              placeholder="分类描述"
              value={categoryForm.description}
              onChange={(e) =>
                setCategoryForm((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <button className="btn-ghost" type="submit">新增分类</button>
          </form>
          <form className="workspace-inline-form" onSubmit={onCreateReason}>
            <input
              required
              placeholder="错误原因"
              value={reasonForm.name}
              onChange={(e) => setReasonForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <select
              value={reasonForm.category_id}
              onChange={(e) =>
                setReasonForm((prev) => ({ ...prev, category_id: e.target.value }))
              }
            >
              <option value="">无分类</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <button className="btn-ghost" type="submit">新增错误原因</button>
          </form>

          <div className="workspace-list three-col">
            <div>
              <strong>学科</strong>
              {subjects.map((item) => (
                <div key={item.id} className="workspace-list-item">
                  <span>{item.code}</span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
            <div>
              <strong>错题分类</strong>
              {categories.map((item) => (
                <div key={item.id} className="workspace-list-item">
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
            <div>
              <strong>错误原因</strong>
              {reasons.map((item) => (
                <div key={item.id} className="workspace-list-item">
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="workspace-grid">
        <article className="workspace-card">
          <h2>4. 学生错题本维护</h2>
          <form className="workspace-form" onSubmit={onCreateWrongQuestion}>
            <label>
              学生
              <select
                required
                value={wrongForm.student_id}
                onChange={(e) => {
                  const studentId = e.target.value;
                  const student = studentUsers.find((item) => String(item.id) === studentId);
                  setWrongForm((prev) => ({
                    ...prev,
                    student_id: studentId,
                    grade: student?.student_profile?.grade || prev.grade,
                  }));
                  setSelectedStudentId(studentId);
                }}
              >
                <option value="">请选择</option>
                {studentUsers.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              标题
              <input
                value={wrongForm.title}
                onChange={(e) => setWrongForm((prev) => ({ ...prev, title: e.target.value }))}
              />
            </label>
            <label>
              题干
              <textarea
                required
                rows={4}
                value={wrongForm.content}
                onChange={(e) => setWrongForm((prev) => ({ ...prev, content: e.target.value }))}
              />
            </label>
            <label>
              学科
              <select
                value={wrongForm.subject_id}
                onChange={(e) =>
                  setWrongForm((prev) => ({ ...prev, subject_id: e.target.value }))
                }
              >
                <option value="">请选择</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              年级
              <input
                value={wrongForm.grade}
                onChange={(e) => setWrongForm((prev) => ({ ...prev, grade: e.target.value }))}
              />
            </label>
            <label>
              分类
              <select
                value={wrongForm.category_id}
                onChange={(e) =>
                  setWrongForm((prev) => ({ ...prev, category_id: e.target.value }))
                }
              >
                <option value="">请选择</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              难度
              <select
                value={wrongForm.difficulty}
                onChange={(e) =>
                  setWrongForm((prev) => ({ ...prev, difficulty: e.target.value }))
                }
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
            </label>
            <label>
              状态
              <select
                value={wrongForm.status}
                onChange={(e) => setWrongForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="new">new</option>
                <option value="reviewing">reviewing</option>
                <option value="mastered">mastered</option>
              </select>
            </label>
            <fieldset className="workspace-reason-group">
              <legend>错误原因（可多选）</legend>
              {reasons.map((item) => (
                <label key={item.id} className="workspace-checkline">
                  <input
                    type="checkbox"
                    checked={wrongForm.error_reason_ids.includes(String(item.id))}
                    onChange={(e) => {
                      setWrongForm((prev) => {
                        const set = new Set(prev.error_reason_ids);
                        if (e.target.checked) set.add(String(item.id));
                        else set.delete(String(item.id));
                        return { ...prev, error_reason_ids: Array.from(set) };
                      });
                    }}
                  />
                  {item.name}
                </label>
              ))}
            </fieldset>
            <button className="btn-primary" type="submit">新增错题</button>
          </form>
        </article>

        <article className="workspace-card">
          <h2>5. 错题练习记录与统计</h2>
          <label className="workspace-select-wrap">
            统计学生
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setWrongForm((prev) => ({ ...prev, student_id: e.target.value }));
              }}
            >
              <option value="">请选择学生</option>
              {studentUsers.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} {item.name}
                </option>
              ))}
            </select>
          </label>

          <div className="workspace-list">
            <strong>错题列表（{wrongQuestions.length}）</strong>
            {wrongQuestions.map((item) => (
              <div key={item.id} className="workspace-list-item">
                <span>#{item.id} {item.title || "未命名错题"}</span>
                <span>{item.subject?.name || "-"}</span>
                <span>{item.status}</span>
              </div>
            ))}
          </div>

          <form className="workspace-inline-form" onSubmit={onCreateStudyRecord}>
            <select
              required
              value={studyForm.wrong_question_id}
              onChange={(e) =>
                setStudyForm((prev) => ({ ...prev, wrong_question_id: e.target.value }))
              }
            >
              <option value="">选择错题</option>
              {wrongQuestions.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} {item.title || item.content.slice(0, 18)}
                </option>
              ))}
            </select>
            <select
              value={studyForm.result}
              onChange={(e) => setStudyForm((prev) => ({ ...prev, result: e.target.value }))}
            >
              <option value="correct">correct</option>
              <option value="incorrect">incorrect</option>
              <option value="skipped">skipped</option>
            </select>
            <input
              type="number"
              min="1"
              max="5"
              value={studyForm.mastery_level}
              onChange={(e) =>
                setStudyForm((prev) => ({ ...prev, mastery_level: Number(e.target.value) }))
              }
            />
            <input
              type="number"
              min="0"
              value={studyForm.time_spent_seconds}
              onChange={(e) =>
                setStudyForm((prev) => ({ ...prev, time_spent_seconds: Number(e.target.value) }))
              }
            />
            <button className="btn-ghost" type="submit">记录练习</button>
          </form>

          {stats && (
            <div className="workspace-stats">
              <div className="workspace-stat-grid">
                <div><span>错题总数</span><strong>{stats.total_wrong_questions}</strong></div>
                <div><span>新错题</span><strong>{stats.new_count}</strong></div>
                <div><span>复习中</span><strong>{stats.reviewing_count}</strong></div>
                <div><span>已掌握</span><strong>{stats.mastered_count}</strong></div>
                <div><span>总错误次数</span><strong>{stats.total_error_count}</strong></div>
                <div><span>练习记录数</span><strong>{stats.study_records_count}</strong></div>
              </div>
              <div className="workspace-list">
                <strong>按学科统计</strong>
                {stats.subject_breakdown.map((item) => (
                  <div key={`${item.subject_id}-${item.subject_code}`} className="workspace-list-item">
                    <span>{item.subject_name || "未分类学科"}</span>
                    <span>总数 {item.total}</span>
                    <span>掌握 {item.mastered}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="workspace-grid">
        <article className="workspace-card" style={{ gridColumn: "1 / -1" }}>
          <h2>6. Agent 配置管理</h2>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ color: "#666", margin: 0 }}>
              管理各 LLM 调用节点的模型、参数和提示词。每个 Agent 节点可独立配置 provider、模型和参数。
            </p>
            <button
              className="btn-primary"
              disabled={batchTesting || agents.length === 0}
              onClick={onBatchTestAgents}
              style={{ fontSize: 13, whiteSpace: "nowrap" }}
            >
              {batchTesting ? "批量测试中..." : "批量测试全部 Agent"}
            </button>
          </div>
          <div className="workspace-list">
            {agents.map((agent) => {
              const isEditing = editingAgent === agent.node_name;
              const testResult = agentTestResults[agent.node_name];
              const isTesting = agentTesting[agent.node_name];
              return (
                <div
                  key={agent.node_name}
                  style={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                    background: agent.is_enabled ? "#fff" : "#f9f9f9",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <strong>{agent.display_name}</strong>
                      <span style={{ color: "#888", marginLeft: 8, fontSize: 13 }}>({agent.node_name})</span>
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: agent.is_enabled ? "#e8f5e9" : "#fce4ec",
                          color: agent.is_enabled ? "#2e7d32" : "#c62828",
                        }}
                      >
                        {agent.is_enabled ? "启用" : "禁用"}
                      </span>
                      <span style={{ marginLeft: 8, fontSize: 12, color: "#999" }}>
                        来源: {agent.source === "database" ? "数据库" : "默认"}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn-ghost"
                        disabled={isTesting || !agent.is_enabled}
                        onClick={() => onTestAgent(agent.node_name)}
                        style={{ fontSize: 13 }}
                      >
                        {isTesting ? "测试中..." : "测试连通性"}
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => setEditingAgent(isEditing ? null : agent.node_name)}
                        style={{ fontSize: 13 }}
                      >
                        {isEditing ? "收起" : "编辑"}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "#666" }}>
                    <span>Provider: {agent.provider}</span>
                    <span style={{ marginLeft: 16 }}>Model: {agent.model}</span>
                    <span style={{ marginLeft: 16 }}>Temperature: {agent.temperature}</span>
                    <span style={{ marginLeft: 16 }}>Timeout: {agent.timeout_seconds}s</span>
                  </div>
                  {agent.description && (
                    <div style={{ fontSize: 12, color: "#999", marginTop: 4 }}>{agent.description}</div>
                  )}
                  {testResult && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 8,
                        borderRadius: 4,
                        background: testResult.success ? "#e8f5e9" : "#fce4ec",
                        fontSize: 13,
                      }}
                    >
                      {testResult.success
                        ? `测试成功 (${testResult.elapsed_seconds}s): ${(testResult.response_text || "").slice(0, 100)}`
                        : `测试失败 (${testResult.elapsed_seconds}s): ${testResult.error}`}
                    </div>
                  )}
                  {isEditing && (
                    <AgentEditForm
                      agent={agent}
                      onSave={(updates) => onSaveAgent(agent.node_name, updates)}
                      onCancel={() => setEditingAgent(null)}
                    />
                  )}
                </div>
              );
            })}
            {agents.length === 0 && <p style={{ color: "#999" }}>暂无 Agent 配置（后端未连接）</p>}
          </div>
        </article>
      </section>
    </div>
  );
}

function AgentEditForm({ agent, onSave, onCancel }) {
  const [form, setForm] = useState({
    model: agent.model || "",
    provider: agent.provider || "siliconflow",
    temperature: agent.temperature ?? 0.2,
    timeout_seconds: agent.timeout_seconds ?? 180,
    max_tokens: agent.max_tokens ?? "",
    is_enabled: agent.is_enabled ?? true,
    system_prompt: agent.system_prompt || "",
    user_prompt_template: agent.user_prompt_template || "",
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updates = { ...form };
    // 数值类型转换
    updates.temperature = parseFloat(updates.temperature) || 0.2;
    updates.timeout_seconds = parseInt(updates.timeout_seconds, 10) || 180;
    updates.max_tokens = updates.max_tokens ? parseInt(updates.max_tokens, 10) : null;
    // 空字符串转 null
    if (!updates.system_prompt) updates.system_prompt = null;
    if (!updates.user_prompt_template) updates.user_prompt_template = null;
    onSave(updates);
  };

  const fieldStyle = { width: "100%", padding: "6px 8px", borderRadius: 4, border: "1px solid #ddd", fontSize: 13 };
  const labelStyle = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 500 };
  const rowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12, padding: 12, background: "#fafafa", borderRadius: 6 }}>
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Provider</label>
          <select style={fieldStyle} value={form.provider} onChange={(e) => handleChange("provider", e.target.value)}>
            <option value="siliconflow">SiliconFlow</option>
            <option value="whatai">WhatAI</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>模型名称</label>
          <input style={fieldStyle} value={form.model} onChange={(e) => handleChange("model", e.target.value)} placeholder="e.g. deepseek-ai/DeepSeek-V3" />
        </div>
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Temperature</label>
          <input style={fieldStyle} type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={(e) => handleChange("temperature", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>超时时间 (秒)</label>
          <input style={fieldStyle} type="number" min="10" max="600" value={form.timeout_seconds} onChange={(e) => handleChange("timeout_seconds", e.target.value)} />
        </div>
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Max Tokens (可选)</label>
          <input style={fieldStyle} type="number" min="1" value={form.max_tokens} onChange={(e) => handleChange("max_tokens", e.target.value)} placeholder="留空使用默认" />
        </div>
        <div style={{ display: "flex", alignItems: "end", paddingBottom: 2 }}>
          <label style={{ fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={form.is_enabled} onChange={(e) => handleChange("is_enabled", e.target.checked)} style={{ marginRight: 6 }} />
            启用此 Agent
          </label>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>System Prompt (可选)</label>
        <textarea
          style={{ ...fieldStyle, minHeight: 60, resize: "vertical", fontFamily: "monospace" }}
          value={form.system_prompt}
          onChange={(e) => handleChange("system_prompt", e.target.value)}
          placeholder="留空使用内置默认提示词"
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>User Prompt 模板 (可选)</label>
        <textarea
          style={{ ...fieldStyle, minHeight: 60, resize: "vertical", fontFamily: "monospace" }}
          value={form.user_prompt_template}
          onChange={(e) => handleChange("user_prompt_template", e.target.value)}
          placeholder="留空使用内置默认模板，可用 {grade} {question_text} 等变量"
        />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button type="button" className="btn-ghost" onClick={onCancel} style={{ fontSize: 13 }}>
          取消
        </button>
        <button type="submit" className="btn-primary" style={{ fontSize: 13 }}>
          保存配置
        </button>
      </div>
    </form>
  );
}
