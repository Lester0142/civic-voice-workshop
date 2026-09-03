import { afterEach, describe, expect, it } from "vitest";
import { clearSession, loadSession, saveSession, SESSION_STORAGE_KEY } from "./session";

const originalStorage = globalThis.localStorage;

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

afterEach(() => {
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: originalStorage });
});

describe("local session storage", () => {
  it("restores a successful session", () => {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: createStorage() });
    const session = {
      token: "demo-token",
      user: { nric: "S0000001A", name: "Aisha Rahman", role: "citizen" },
    };

    saveSession(session);

    expect(loadSession()).toEqual(session);
  });

  it("clears the saved session on sign out", () => {
    const storage = createStorage();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      token: "demo-token",
      user: { nric: "S0000002B", name: "Maya Chen", role: "admin" },
    }));

    clearSession();

    expect(storage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(loadSession()).toBeNull();
  });

  it("ignores malformed saved values", () => {
    const storage = createStorage();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
    storage.setItem(SESSION_STORAGE_KEY, "not json");

    expect(loadSession()).toBeNull();
  });
});
