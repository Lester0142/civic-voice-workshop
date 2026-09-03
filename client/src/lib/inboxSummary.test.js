import { describe, expect, it } from "vitest";
import { getInboxSummary } from "./inboxSummary";

describe("getInboxSummary", () => {
  it("counts the currently loaded inbox by status", () => {
    const feedback = [
      { status: "New" },
      { status: "new" },
      { status: "In review" },
      { status: "Closed" },
      { status: "Other" },
    ];

    expect(getInboxSummary(feedback)).toEqual({
      total: 5,
      new: 2,
      inReview: 1,
      closed: 1,
    });
  });
});
