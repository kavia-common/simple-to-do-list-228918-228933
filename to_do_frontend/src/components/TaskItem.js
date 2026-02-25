import React, { useEffect, useMemo, useState } from "react";
import RetroButton from "./RetroButton";
import "./TaskItem.css";

// PUBLIC_INTERFACE
export default function TaskItem({ task, busy, onToggle, onDelete, onRename }) {
  /** Single task row with actions: toggle complete, edit title, delete. */
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.title || "");

  useEffect(() => {
    setDraft(task.title || "");
  }, [task.title]);

  const trimmed = useMemo(() => draft.trim(), [draft]);
  const canSave = trimmed.length > 0 && !busy;

  const startEdit = () => {
    if (busy) return;
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(task.title || "");
    setIsEditing(false);
  };

  const save = () => {
    if (!canSave) return;
    onRename(task.id, trimmed);
    setIsEditing(false);
  };

  return (
    <li className={`TaskItem ${task.completed ? "is-completed" : ""}`}>
      <div className="TaskItem__left">
        <label className="TaskItem__check">
          <input
            type="checkbox"
            checked={!!task.completed}
            onChange={() => onToggle(task.id, !task.completed)}
            disabled={busy}
            aria-label={task.completed ? "Mark as active" : "Mark as completed"}
          />
          <span className="TaskItem__checkUi" aria-hidden="true" />
        </label>

        <div className="TaskItem__content">
          {isEditing ? (
            <div className="TaskItem__edit">
              <input
                className="TaskItem__editField"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
                maxLength={120}
                aria-label="Edit task title"
              />
              <div className="TaskItem__editActions">
                <RetroButton
                  variant="primary"
                  size="sm"
                  disabled={!canSave}
                  onClick={save}
                  ariaLabel="Save task title"
                >
                  Save
                </RetroButton>
                <RetroButton
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={cancelEdit}
                  ariaLabel="Cancel edit"
                >
                  Cancel
                </RetroButton>
              </div>
            </div>
          ) : (
            <>
              <div className="TaskItem__title" title={task.title}>
                {task.title}
              </div>
              <div className="TaskItem__meta">
                <span className="TaskItem__badge">
                  {task.completed ? "COMPLETED" : "ACTIVE"}
                </span>
                {busy ? <span className="TaskItem__spinner" aria-label="Working" /> : null}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="TaskItem__right">
        {!isEditing ? (
          <RetroButton
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={startEdit}
            ariaLabel="Edit task"
          >
            Edit
          </RetroButton>
        ) : null}
        <RetroButton
          variant="danger"
          size="sm"
          disabled={busy}
          onClick={() => onDelete(task.id)}
          ariaLabel="Delete task"
        >
          Delete
        </RetroButton>
      </div>
    </li>
  );
}
