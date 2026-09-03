import { describe, expect, it } from "vitest";
import { isBlankFeedback } from "./feedback.js";

describe("isBlankFeedback", () => {
  it("treats empty, whitespace-only, and newline-only feedback as blank", () => {
    expect(isBlankFeedback("")).toBe(true);
    expect(isBlankFeedback("   \t  ")).toBe(true);
    expect(isBlankFeedback("\n\r\n")).toBe(true);
  });

  it("allows useful feedback", () => {
    expect(isBlankFeedback("Please add more benches.")).toBe(false);
  });
});
