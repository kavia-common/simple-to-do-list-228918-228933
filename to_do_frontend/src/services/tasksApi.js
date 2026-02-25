const DEFAULT_TIMEOUT_MS = 15000;

/**
 * NOTE: Backend base URL:
 * - CRA requires env vars prefixed with REACT_APP_*
 * - Ask orchestrator/user to set REACT_APP_API_BASE_URL in this container's .env
 *   e.g. REACT_APP_API_BASE_URL=https://<backend-host>
 */
function getApiBaseUrl() {
  return (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");
}

/**
 * The backend container's OpenAPI docs currently only expose a health endpoint.
 * This frontend implements the conventional task endpoints expected by the work item:
 * - GET    /tasks?filter=all|active|completed
 * - POST   /tasks
 * - PUT    /tasks/:id
 * - PATCH  /tasks/:id
 * - DELETE /tasks/:id
 *
 * If the backend uses different routes, adjust these paths centrally here.
 */
function getTasksBasePath() {
  return "/tasks";
}

function withTimeout(signal, ms) {
  if (!signal) return { signal: undefined, cancel: () => {} };
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal.addEventListener("abort", onAbort, { once: true });

  const timeoutId = setTimeout(() => controller.abort(), ms);

  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
    },
  };
}

async function parseJsonSafe(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function toErrorMessage(data, fallback) {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (typeof data.message === "string") return data.message;
  return fallback;
}

async function request(path, { method = "GET", body, signal } = {}) {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "Missing REACT_APP_API_BASE_URL. Set it to the backend base URL (e.g. https://...:3001)."
    );
  }

  const timeout = withTimeout(signal || new AbortController().signal, DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: timeout.signal,
    });

    const data = await parseJsonSafe(res);

    if (!res.ok) {
      const msg = toErrorMessage(data, `Request failed (${res.status})`);
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    timeout.cancel();
  }
}

// PUBLIC_INTERFACE
export async function listTasks({ filter = "all", signal } = {}) {
  /** List tasks, optionally filtered by all|active|completed. */
  const qs = new URLSearchParams();

  // Backend expects `status=all|active|completed` (see OpenAPI /tasks?status=...).
  // We keep the frontend API as `filter` for UI semantics and translate here.
  if (filter) qs.set("status", filter);

  const q = qs.toString() ? `?${qs.toString()}` : "";
  return request(`${getTasksBasePath()}${q}`, { method: "GET", signal });
}

// PUBLIC_INTERFACE
export async function createTask({ title, signal } = {}) {
  /** Create a new task with a title. */
  return request(getTasksBasePath(), {
    method: "POST",
    body: { title },
    signal,
  });
}

// PUBLIC_INTERFACE
export async function updateTask({ id, title, completed, signal } = {}) {
  /** Full update (title/completed). */
  return request(`${getTasksBasePath()}/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: { title, completed },
    signal,
  });
}

// PUBLIC_INTERFACE
export async function patchTask({ id, patch, signal } = {}) {
  /** Partial update (e.g. {completed: true}). */
  return request(`${getTasksBasePath()}/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: patch,
    signal,
  });
}

// PUBLIC_INTERFACE
export async function deleteTask({ id, signal } = {}) {
  /** Delete a task by id. */
  return request(`${getTasksBasePath()}/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
    signal,
  });
}
