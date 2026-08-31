import { describe, expect, it } from "vitest";
import { normalizeMr, parseTicketTitle, summarizeMrs } from "./lib.js";

describe("facilitator MR parsing", () => {
  it("accepts the fixed ticket-title format", () => {
    expect(parseTicketTitle("CV-003: Add feedback character count")).toEqual({
      key: "CV-003",
      number: 3,
      title: "Add feedback character count",
    });
  });

  it("ignores titles without the fixed prefix", () => {
    expect(parseTicketTitle("Fix the character count")).toBeNull();
  });

  it("summarizes merged and in-progress tickets", () => {
    const mrs = [
      normalizeMr({ number: 1, title: "CV-001: Persist session", state: "closed", merged_at: "2026-08-31" }),
      normalizeMr({ number: 2, title: "CV-002: Validate ID", state: "open", draft: true }),
      normalizeMr({ number: 3, title: "A title that should not score", state: "open" }),
    ];
    expect(summarizeMrs(mrs)).toMatchObject({
      completed: ["CV-001"],
      inProgress: ["CV-002"],
      points: 1,
    });
  });

  it("uses ticket weights for leaderboard points", () => {
    const mrs = [
      normalizeMr({ title: "CV-001: Small task", state: "closed", merged_at: "now" }),
      normalizeMr({ title: "CV-017: Large task", state: "closed", merged_at: "now" }),
    ];
    expect(summarizeMrs(mrs, { "CV-001": 1, "CV-017": 3 }).points).toBe(4);
  });

  it("groups completed tickets into S, M, and L leaderboard columns", () => {
    const small = { ...normalizeMr({ title: "CV-001: Small task", state: "closed", merged_at: "now" }), size: "S", points: 1 };
    const large = { ...normalizeMr({ title: "CV-017: Large task", state: "closed", merged_at: "now" }), size: "L", points: 3 };
    expect(summarizeMrs([small, large]).completedBySize).toEqual({
      S: [{ key: "CV-001", points: 1 }],
      M: [],
      L: [{ key: "CV-017", points: 3 }],
    });
  });
});
