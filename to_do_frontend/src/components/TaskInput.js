import React, { useMemo, useState } from "react";
import RetroButton from "./RetroButton";
import "./TaskInput.css";

// PUBLIC_INTERFACE
export default function TaskInput({ disabled, onAdd }) {
  /** Controlled input to add a new task. */
  const [title, setTitle] = useState("");

  const trimmed = useMemo(() => title.trim(), [title]);
  const canSubmit = trimmed.length > 0 && !disabled;

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd(trimmed);
    setTitle("");
  };

  return (
    <form className="TaskInput" onSubmit={submit}>
      <label className="TaskInput__label" htmlFor="new-task">
        New mission
      </label>
      <div className="TaskInput__row">
        <input
          id="new-task"
          className="TaskInput__field"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Type a task…"
          disabled={disabled}
          maxLength={120}
          autoComplete="off"
        />
        <RetroButton
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSubmit}
          ariaLabel="Add task"
        >
          Add
        </RetroButton>
      </div>
      <div className="TaskInput__hint" aria-live="polite">
        {trimmed.length === 0 ? "Tip: keep it short and punchy." : `${trimmed.length}/120`}
      </div>
    </form>
  );
}
