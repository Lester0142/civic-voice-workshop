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
      totalPointsProxy: 1,
    });
  });
});
