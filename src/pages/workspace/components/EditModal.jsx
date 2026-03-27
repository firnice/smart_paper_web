export default function EditModal({ editingItem, editForm, setEditForm, errorReasonOptions, onSubmitEdit, onClose }) {
  if (!editingItem) return null;

  return (
    <div className="student-modal-backdrop" onClick={onClose}>
      <section className="student-modal" onClick={(event) => event.stopPropagation()}>
        <div className="student-modal-head">
          <h3>编辑错题</h3>
          <button type="button" className="btn-ghost btn-small" onClick={onClose}>
            关闭
          </button>
        </div>
        <form className="workspace-form" onSubmit={onSubmitEdit}>
          <label>
            标题
            <input
              value={editForm.title}
              onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="错题标题"
            />
          </label>
          <label>
            状态
            <select
              value={editForm.status}
              onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="new">新错题</option>
              <option value="reviewing">复习中</option>
              <option value="mastered">已掌握</option>
            </select>
          </label>
          <label>
            备注
            <textarea
              rows={4}
              value={editForm.notes}
              onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="补充备注"
            />
          </label>
          <label className="workspace-checkline">
            <input
              type="checkbox"
              checked={editForm.is_bookmarked}
              onChange={(event) => setEditForm((prev) => ({ ...prev, is_bookmarked: event.target.checked }))}
            />
            收藏此错题
          </label>
          <fieldset className="workspace-reason-group">
            <legend>错因</legend>
            {errorReasonOptions.map((item) => (
              <label key={item.id} className="workspace-checkline">
                <input
                  type="checkbox"
                  checked={editForm.error_reason_ids.includes(item.id)}
                  onChange={(event) => {
                    setEditForm((prev) => ({
                      ...prev,
                      error_reason_ids: event.target.checked
                        ? [...prev.error_reason_ids, item.id]
                        : prev.error_reason_ids.filter((id) => id !== item.id),
                    }));
                  }}
                />
                {item.name}
              </label>
            ))}
          </fieldset>
          <div className="student-actions">
            <button type="submit" className="btn-primary btn-small">保存修改</button>
            <button type="button" className="btn-ghost btn-small" onClick={onClose}>
              取消
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
