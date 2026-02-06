import { useEffect, useMemo, useState } from "react";
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
  listErrorReasons,
  listParentStudents,
  listSubjects,
  listUsers,
  listWrongQuestionCategories,
  listWrongQuestions,
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
    setWrongQuestions(data.items ?? []);
    const firstWrongQuestionId = data.items?.[0]?.id;
    setStudyForm((prev) => ({
      ...prev,
      wrong_question_id: firstWrongQuestionId ? String(firstWrongQuestionId) : "",
    }));
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
    refreshUsersAndMeta()
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
    </div>
  );
}
