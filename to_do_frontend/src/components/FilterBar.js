import React from "react";
import "./FilterBar.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

// PUBLIC_INTERFACE
export default function FilterBar({ value, disabled, onChange }) {
  /** Filter selector for tasks list. */
  return (
    <div className="FilterBar" role="tablist" aria-label="Task filters">
      {FILTERS.map((f) => {
        const active = value === f.key;
        return (
          <button
            key={f.key}
            type="button"
            className={`FilterBar__tab ${active ? "is-active" : ""}`}
            onClick={() => onChange(f.key)}
            disabled={disabled}
            role="tab"
            aria-selected={active}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
