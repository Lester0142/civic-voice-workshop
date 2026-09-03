import { describe, expect, it } from "vitest";
import { sortNewestFeedback } from "./feedback.js";

describe("sortNewestFeedback", () => {
  it("sorts out-of-order feedback records newest first without mutating them", () => {
    const feedback = [
      { id: "oldest", createdAt: "2026-08-20T09:00:00.000Z" },
      { id: "newest", createdAt: "2026-08-22T09:00:00.000Z" },
      { id: "middle", createdAt: "2026-08-21T09:00:00.000Z" },
    ];

    expect(sortNewestFeedback(feedback).map((item) => item.id)).toEqual([
      "newest", "middle", "oldest",
    ]);
    expect(feedback.map((item) => item.id)).toEqual(["oldest", "newest", "middle"]);
  });
});
