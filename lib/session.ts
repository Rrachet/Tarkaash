"use client";

/** Anonymous per-browser session id used only for counting unique viewers. */
export function getSessionId(): string {
  try {
    let id = localStorage.getItem("tk-sid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("tk-sid", id);
    }
    return id;
  } catch {
    return "nostorage";
  }
}
