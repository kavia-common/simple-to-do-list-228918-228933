import React from "react";
import TaskItem from "./TaskItem";
import "./TaskList.css";

// PUBLIC_INTERFACE
export default function TaskList({
  tasks,
  loading,
  error,
  busyIds,
  onToggle,
  onDelete,
  onRename,
  onRetry,
}) {
  /** Task list with loading/error/empty states. */
  if (loading) {
    return (
      <div className="TaskList__state" role="status" aria-live="polite">
        <div className="TaskList__loader" aria-hidden="true" />
        <div className="TaskList__stateTitle">Loading tasks…</div>
        <div className="TaskList__stateDesc">Tuning the CRT.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="TaskList__state TaskList__state--error" role="alert">
        <div className="TaskList__stateTitle">Signal lost</div>
        <div className="TaskList__stateDesc">{error}</div>
        <button className="TaskList__retry" type="button" onClick={onRetry}>
          Retry
        </button>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="TaskList__state" role="status" aria-live="polite">
        <div className="TaskList__stateTitle">No tasks here.</div>
        <div className="TaskList__stateDesc">Add one above to start your quest.</div>
      </div>
    );
  }

  return (
    <ul className="TaskList" aria-label="Tasks">
      {tasks.map((t) => (
        <TaskItem
          key={t.id}
          task={t}
          busy={busyIds.has(t.id)}
          onToggle={onToggle}
          onDelete={onDelete}
          onRename={onRename}
        />
      ))}
    </ul>
  );
}
