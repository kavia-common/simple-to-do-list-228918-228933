import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import FilterBar from "./components/FilterBar";
import TaskInput from "./components/TaskInput";
import TaskList from "./components/TaskList";
import {
  createTask,
  deleteTask,
  listTasks,
  patchTask,
  updateTask,
} from "./services/tasksApi";

function normalizeTask(raw) {
  // Accept common backend shapes. Prefer id/title/completed.
  return {
    id: raw.id ?? raw.taskId ?? raw._id,
    title: raw.title ?? raw.text ?? "",
    completed: !!(raw.completed ?? raw.isCompleted ?? raw.done),
  };
}

function normalizeTaskArray(payload) {
  if (Array.isArray(payload)) return payload.map(normalizeTask);
  if (payload && Array.isArray(payload.tasks)) return payload.tasks.map(normalizeTask);
  if (payload && Array.isArray(payload.items)) return payload.items.map(normalizeTask);
  return [];
}

// PUBLIC_INTERFACE
export default function App() {
  /** Retro To‑Do App UI integrated with backend REST API. */
  const [filter, setFilter] = useState("all");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [banner, setBanner] = useState("");

  // Track per-item in-flight operations to prevent double actions.
  const [busyIds, setBusyIds] = useState(() => new Set());

  const abortRef = useRef(null);

  const visibleTasks = useMemo(() => {
    if (filter === "active") return tasks.filter((t) => !t.completed);
    if (filter === "completed") return tasks.filter((t) => t.completed);
    return tasks;
  }, [tasks, filter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, completed, active };
  }, [tasks]);

  const setBusy = (id, busy) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const showBanner = (msg) => {
    setBanner(msg);
    window.clearTimeout(showBanner._t);
    showBanner._t = window.setTimeout(() => setBanner(""), 2500);
  };

  const load = async ({ keepLoading = false } = {}) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!keepLoading) setLoading(true);
    setPageError("");

    try {
      const data = await listTasks({ filter, signal: controller.signal });
      setTasks(normalizeTaskArray(data));
    } catch (e) {
      setPageError(e?.message || "Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleAdd = async (title) => {
    setPageError("");
    // Optimistic placeholder
    const tempId = `tmp-${Date.now()}`;
    const optimistic = { id: tempId, title, completed: false };
    setTasks((prev) => [optimistic, ...prev]);
    setBusy(tempId, true);

    try {
      const data = await createTask({ title });
      const created = normalizeTask(data?.task ?? data);
      // Replace optimistic row
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      showBanner("Task added.");
    } catch (e) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      setPageError(e?.message || "Failed to add task.");
    } finally {
      setBusy(tempId, false);
    }
  };

  const handleToggle = async (id, completed) => {
    setPageError("");
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return;

    setBusy(id, true);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));

    try {
      // Prefer PATCH for partial update; fall back to PUT if backend rejects PATCH.
      try {
        await patchTask({ id, patch: { completed } });
      } catch (e) {
        // if 404/405 etc, try PUT with full body
        await updateTask({ id, title: existing.title, completed });
      }
      showBanner(completed ? "Marked complete." : "Back to active.");
    } catch (e) {
      // revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: existing.completed } : t))
      );
      setPageError(e?.message || "Failed to update task.");
    } finally {
      setBusy(id, false);
    }
  };

  const handleRename = async (id, title) => {
    setPageError("");
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return;

    setBusy(id, true);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)));

    try {
      await updateTask({ id, title, completed: existing.completed });
      showBanner("Task updated.");
    } catch (e) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: existing.title } : t))
      );
      setPageError(e?.message || "Failed to rename task.");
    } finally {
      setBusy(id, false);
    }
  };

  const handleDelete = async (id) => {
    setPageError("");
    const existing = tasks.find((t) => t.id === id);
    if (!existing) return;

    setBusy(id, true);
    // optimistic remove
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTask({ id });
      showBanner("Task deleted.");
    } catch (e) {
      // reinsert on error
      setTasks((prev) => [existing, ...prev]);
      setPageError(e?.message || "Failed to delete task.");
      setBusy(id, false);
      return;
    }

    setBusy(id, false);
  };

  return (
    <div className="App">
      <div className="RetroShell">
        <header className="RetroHeader">
          <div className="RetroHeader__brand">
            <div className="RetroHeader__logo" aria-hidden="true">
              TD
            </div>
            <div>
              <h1 className="RetroHeader__title">Retro To‑Do</h1>
              <p className="RetroHeader__subtitle">
                Manage missions. Beat the backlog.
              </p>
            </div>
          </div>

          <div className="RetroHeader__stats" aria-label="Task stats">
            <div className="StatPill">
              <div className="StatPill__k">TOTAL</div>
              <div className="StatPill__v">{stats.total}</div>
            </div>
            <div className="StatPill">
              <div className="StatPill__k">ACTIVE</div>
              <div className="StatPill__v">{stats.active}</div>
            </div>
            <div className="StatPill">
              <div className="StatPill__k">DONE</div>
              <div className="StatPill__v">{stats.completed}</div>
            </div>
          </div>
        </header>

        {banner ? (
          <div className="Banner" role="status" aria-live="polite">
            <span className="Banner__dot" aria-hidden="true" />
            {banner}
          </div>
        ) : null}

        {pageError ? (
          <div className="ErrorBar" role="alert">
            <div className="ErrorBar__title">Error</div>
            <div className="ErrorBar__msg">{pageError}</div>
          </div>
        ) : null}

        <main className="RetroMain">
          <section className="Card">
            <TaskInput disabled={loading} onAdd={handleAdd} />
          </section>

          <section className="Card Card--tight">
            <div className="Card__row">
              <div className="Card__label">Filter</div>
              <FilterBar value={filter} disabled={loading} onChange={setFilter} />
            </div>
          </section>

          <section className="Card Card--list">
            <TaskList
              tasks={visibleTasks}
              loading={loading}
              error={pageError ? "" : ""} /* pageError displayed above; list keeps simple */
              busyIds={busyIds}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onRename={handleRename}
              onRetry={() => load({ keepLoading: false })}
            />
          </section>

          <footer className="RetroFooter">
            <div className="RetroFooter__hint">
              Env required: <code>REACT_APP_API_BASE_URL</code>
            </div>
            <div className="RetroFooter__hint">
              Current filter: <strong>{filter}</strong>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
