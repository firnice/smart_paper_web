import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addPracticeRecord,
  createStudentWrongQuestion,
  getDefaultSchoolTerm,
  getStudentDashboardData,
  resetStudentDemoData,
  setWrongQuestionStatus,
} from "../../services/studentDemo.js";
import { clearStudentSession, readStudentSession } from "../../utils/studentSession.js";

const INITIAL_FORM = {
  title: "",
  content: "",
  subject: "数学",
  term: getDefaultSchoolTerm(),
  category: "计算错误",
  error_reason: "粗心抄错",
  difficulty: "medium",
  image_data: "",
  image_name: "",
};

const STATUS_LABEL = {
  new: "新错题",
  reviewing: "复习中",
  mastered: "已掌握",
};

const DEFAULT_SUBJECT_OPTIONS = ["数学", "语文", "英语", "科学"];

const ENTRY_MODES = [
  { id: "camera", label: "拍照" },
  { id: "photo", label: "照片" },
  { id: "upload", label: "上传" },
  { id: "text", label: "输入" },
];

const TERM_OPTIONS = Array.from(
  new Set([
    `${new Date().getFullYear() - 1}秋学期`,
    getDefaultSchoolTerm(),
    `${new Date().getFullYear()}秋学期`,
    `${new Date().getFullYear() + 1}春学期`,
  ]),
);

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片解析失败"));
    image.src = dataUrl;
  });
}

async function compressImage(file) {
  const rawDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(rawDataUrl);

  const maxWidth = 1280;
  const ratio = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return rawDataUrl;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const uploadInputRef = useRef(null);

  const [session, setSession] = useState(() => readStudentSession());
  const [stats, setStats] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);

  const [filters, setFilters] = useState({
    keyword: "",
    subject: "",
    term: "",
    status: "",
  });

  const [form, setForm] = useState(INITIAL_FORM);
  const [composerMode, setComposerMode] = useState("camera");
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const studentId = session?.student?.id;

  const refresh = useCallback(() => {
    if (!studentId) return;
    const data = getStudentDashboardData(studentId, filters);
    setStats(data.stats);
    setWrongQuestions(data.items);
    setSubjectOptions(data.subject_options || []);
    setTermOptions(data.term_options || []);
  }, [studentId, filters]);

  useEffect(() => {
    if (!studentId) {
      navigate("/student/login");
      return;
    }
    refresh();
  }, [studentId, navigate, refresh]);

  const setSuccess = (message) => {
    setError("");
    setNotice(message);
  };

  const setFailure = (message) => {
    setNotice("");
    setError(message);
  };

  const logout = () => {
    clearStudentSession();
    setSession(null);
    navigate("/student/login");
  };

  const onResetDemo = () => {
    if (!window.confirm("确认重置本地数据吗？")) return;
    resetStudentDemoData();
    refresh();
    setSuccess("已重置本地数据");
  };

  const onOpenComposer = () => {
    setComposerMode("camera");
    setIsComposerOpen(true);
  };

  const onCloseComposer = () => {
    setIsComposerOpen(false);
  };

  const onTriggerPick = (mode) => {
    if (mode === "camera") cameraInputRef.current?.click();
    if (mode === "photo") photoInputRef.current?.click();
    if (mode === "upload") uploadInputRef.current?.click();
  };

  const onRemovePhoto = () => {
    setForm((prev) => ({ ...prev, image_data: "", image_name: "" }));
  };

  const onUseFile = async (file, sourceLabel) => {
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      setFailure("文件过大，请选择 12MB 以内文件");
      return;
    }

    setLoading(true);
    try {
      if (file.type.startsWith("image/")) {
        const compressed = await compressImage(file);
        setForm((prev) => ({
          ...prev,
          image_data: compressed,
          image_name: file.name,
          content: prev.content || `已通过${sourceLabel}录入图片，待补充题干文字`,
        }));
        setSuccess("图片已加载，可直接保存错题");
      } else {
        setForm((prev) => ({
          ...prev,
          image_data: "",
          image_name: file.name,
          content: prev.content || `已上传附件：${file.name}`,
        }));
        setSuccess("附件已加载，请补充题干后保存");
      }
    } catch (err) {
      setFailure(err?.message || "文件处理失败");
    } finally {
      setLoading(false);
    }
  };

  const onPickCamera = async (event) => {
    const file = event.target.files?.[0];
    await onUseFile(file, "拍照");
    event.target.value = "";
  };

  const onPickPhoto = async (event) => {
    const file = event.target.files?.[0];
    await onUseFile(file, "相册");
    event.target.value = "";
  };

  const onPickUpload = async (event) => {
    const file = event.target.files?.[0];
    await onUseFile(file, "上传");
    event.target.value = "";
  };

  const onAddWrongQuestion = (event) => {
    event.preventDefault();
    if (!studentId) return;

    setLoading(true);
    try {
      createStudentWrongQuestion(studentId, form);
      setForm((prev) => ({ ...INITIAL_FORM, subject: prev.subject, term: prev.term }));
      setIsComposerOpen(false);
      refresh();
      setSuccess("错题已加入错题本");
    } catch (err) {
      setFailure(err?.message || "新增错题失败");
    } finally {
      setLoading(false);
    }
  };

  const onChangeStatus = (wrongQuestionId, status) => {
    if (!studentId) return;

    setLoading(true);
    try {
      setWrongQuestionStatus(studentId, wrongQuestionId, status);
      refresh();
      setSuccess(`已更新为${STATUS_LABEL[status]}`);
    } catch (err) {
      setFailure(err?.message || "状态更新失败");
    } finally {
      setLoading(false);
    }
  };

  const onPractice = (wrongQuestionId, result) => {
    if (!studentId) return;

    setLoading(true);
    try {
      addPracticeRecord(studentId, wrongQuestionId, result);
      refresh();
      setSuccess(result === "correct" ? "已记录：本次做对" : "已记录：本次仍做错");
    } catch (err) {
      setFailure(err?.message || "练习记录失败");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.student) return null;

  const student = session.student;
  const profile = student.student_profile || {};
  const formTermOptions = Array.from(new Set([...TERM_OPTIONS, ...termOptions, getDefaultSchoolTerm()]));
  const filterSubjectOptions = Array.from(
    new Set([...DEFAULT_SUBJECT_OPTIONS, ...subjectOptions, form.subject].filter(Boolean)),
  );
  const filterTermOptions = Array.from(
    new Set([...TERM_OPTIONS, ...termOptions, getDefaultSchoolTerm(), form.term].filter(Boolean)),
  );

  return (
    <div className="page student-dashboard-page">
      <header className="hero student-hero">
        <div className="hero-tag">学生错题本</div>
        <h1>{student.name} 的错题本</h1>
        <p>年级：{profile.grade || "-"} · 学号：{profile.student_no || "-"}</p>
        <div className="hero-actions">
          <button className="btn-primary" type="button" onClick={logout}>
            退出登录
          </button>
          <Link className="btn-ghost" to="/">
            切换角色
          </Link>
          <button className="btn-ghost" type="button" onClick={onResetDemo}>
            重置数据
          </button>
        </div>
      </header>

      {notice && <div className="workspace-alert ok">{notice}</div>}
      {error && <div className="workspace-alert error">{error}</div>}
      {loading && <div className="workspace-alert">处理中...</div>}

      {stats && (
        <section className="workspace-card">
          <div className="student-stats-head">
            <div>
              <h2>学习统计</h2>
              <p>先看整体掌握情况，再进入下方错题列表维护。</p>
            </div>
            <button className="btn-primary" type="button" onClick={onOpenComposer}>
              添加错题
            </button>
          </div>
          <div className="workspace-stat-grid student-stats-grid">
            <div>
              <span>错题总数</span>
              <strong>{stats.total}</strong>
            </div>
            <div>
              <span>新错题</span>
              <strong>{stats.new_count}</strong>
            </div>
            <div>
              <span>复习中</span>
              <strong>{stats.reviewing_count}</strong>
            </div>
            <div>
              <span>已掌握</span>
              <strong>{stats.mastered_count}</strong>
            </div>
            <div>
              <span>掌握率</span>
              <strong>{stats.mastery_rate}%</strong>
            </div>
            <div>
              <span>累计练习</span>
              <strong>{stats.total_reviews}</strong>
            </div>
          </div>
        </section>
      )}

      <section className="workspace-card">
        <h2>我的错题列表</h2>

        <div className="student-filter-block">
          <span className="student-filter-label">按学科筛选</span>
          <div className="student-filter-tabs">
            <button
              type="button"
              className={`student-filter-tab subject ${filters.subject === "" ? "active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, subject: "" }))}
            >
              全部学科
            </button>
            {filterSubjectOptions.map((subject) => (
              <button
                key={subject}
                type="button"
                className={`student-filter-tab subject ${filters.subject === subject ? "active" : ""}`}
                onClick={() => setFilters((prev) => ({ ...prev, subject }))}
              >
                {subject}
              </button>
            ))}
          </div>
        </div>

        <div className="student-filter-block">
          <span className="student-filter-label">按学期分期筛选</span>
          <div className="student-filter-tabs">
            <button
              type="button"
              className={`student-filter-tab term ${filters.term === "" ? "active" : ""}`}
              onClick={() => setFilters((prev) => ({ ...prev, term: "" }))}
            >
              全部学期
            </button>
            {filterTermOptions.map((term) => (
              <button
                key={term}
                type="button"
                className={`student-filter-tab term ${filters.term === term ? "active" : ""}`}
                onClick={() => setFilters((prev) => ({ ...prev, term }))}
              >
                {term}
              </button>
            ))}
          </div>
        </div>

        <div className="workspace-form student-filter-grid">
          <label>
            关键词
            <input
              placeholder="标题 / 内容 / 错误原因"
              value={filters.keyword}
              onChange={(event) => setFilters((prev) => ({ ...prev, keyword: event.target.value }))}
            />
          </label>
          <label>
            状态
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="">全部</option>
              <option value="new">新错题</option>
              <option value="reviewing">复习中</option>
              <option value="mastered">已掌握</option>
            </select>
          </label>
        </div>

        <div className="student-card-grid">
          {wrongQuestions.length === 0 ? (
            <p>当前筛选条件下没有错题。</p>
          ) : (
            wrongQuestions.map((item) => (
              <article key={item.id} className="student-question-item">
                <div className="student-question-head">
                  <div className="student-chip-row">
                    <span className="student-subject-badge">{item.subject}</span>
                    <span className="student-term-badge">{item.term}</span>
                  </div>
                  <span className={`student-status status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
                </div>
                <strong className="student-question-title">{item.title}</strong>
                {item.image_data && (
                  <div className="student-question-image-wrap">
                    <img className="student-question-image" src={item.image_data} alt={item.image_name || item.title} />
                  </div>
                )}
                <p>{item.content}</p>
                <div className="student-meta">
                  <span>学科：{item.subject}</span>
                  <span>学期：{item.term}</span>
                  <span>分类：{item.category}</span>
                  <span>错因：{item.error_reason}</span>
                  <span>练习：{item.review_count || 0} 次</span>
                </div>
                <div className="student-actions">
                  <button type="button" className="btn-secondary btn-small" onClick={() => onPractice(item.id, "correct")}>
                    本次做对
                  </button>
                  <button type="button" className="btn-secondary btn-small" onClick={() => onPractice(item.id, "incorrect")}>
                    本次做错
                  </button>
                  <button type="button" className="btn-small btn-ghost" onClick={() => onChangeStatus(item.id, "reviewing")}>
                    标记复习中
                  </button>
                  <button type="button" className="btn-small btn-ghost" onClick={() => onChangeStatus(item.id, "mastered")}>
                    标记已掌握
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {isComposerOpen && (
        <div className="student-modal-backdrop" onClick={onCloseComposer}>
          <section className="student-modal" onClick={(event) => event.stopPropagation()}>
            <div className="student-modal-head">
              <h3>添加错题</h3>
              <button type="button" className="btn-ghost btn-small" onClick={onCloseComposer}>
                关闭
              </button>
            </div>

            <div className="student-entry-mode-tabs">
              {ENTRY_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  className={`student-entry-mode-tab ${composerMode === mode.id ? "active" : ""}`}
                  onClick={() => setComposerMode(mode.id)}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="student-entry-panel">
              {composerMode === "camera" && (
                <button type="button" className="btn-secondary" onClick={() => onTriggerPick("camera")}>
                  打开摄像头拍照
                </button>
              )}
              {composerMode === "photo" && (
                <button type="button" className="btn-secondary" onClick={() => onTriggerPick("photo")}>
                  从相册选择照片
                </button>
              )}
              {composerMode === "upload" && (
                <button type="button" className="btn-secondary" onClick={() => onTriggerPick("upload")}>
                  上传文件
                </button>
              )}
              {composerMode === "text" && (
                <p className="hint">请在下方填写题目内容，可不上传图片。</p>
              )}

              <input
                ref={cameraInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickCamera}
              />
              <input
                ref={photoInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*"
                onChange={onPickPhoto}
              />
              <input
                ref={uploadInputRef}
                className="student-hidden-input"
                type="file"
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={onPickUpload}
              />
            </div>

            {(form.image_data || form.image_name) && (
              <div className="student-photo-preview student-full-col">
                {form.image_data ? (
                  <img src={form.image_data} alt={form.image_name || "错题图片"} />
                ) : (
                  <div className="workspace-alert">当前附件：{form.image_name}</div>
                )}
                <div className="student-photo-meta">
                  <span>{form.image_name || "已选择文件"}</span>
                  <button type="button" className="btn-small btn-ghost" onClick={onRemovePhoto}>
                    清除文件
                  </button>
                </div>
              </div>
            )}

            <form className="workspace-form" onSubmit={onAddWrongQuestion}>
              <label>
                标题（可选）
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </label>
              <label>
                学科
                <select
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                >
                  <option value="数学">数学</option>
                  <option value="语文">语文</option>
                  <option value="英语">英语</option>
                  <option value="科学">科学</option>
                </select>
              </label>
              <label>
                学期分期
                <select
                  value={form.term}
                  onChange={(event) => setForm((prev) => ({ ...prev, term: event.target.value }))}
                >
                  {formTermOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                错题分类
                <input
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                />
              </label>
              <label>
                错误原因
                <input
                  value={form.error_reason}
                  onChange={(event) => setForm((prev) => ({ ...prev, error_reason: event.target.value }))}
                />
              </label>
              <label className="student-full-col">
                题目内容（支持手动输入）
                <textarea
                  rows={3}
                  value={form.content}
                  onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
                />
              </label>
              <button className="btn-primary" type="submit" disabled={loading}>
                保存到错题本
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
