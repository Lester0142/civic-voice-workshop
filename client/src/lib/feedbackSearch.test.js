import { describe, expect, it } from "vitest";
import { filterFeedbackByKeyword } from "./feedbackSearch";

const feedback = [
  { id: "feedback-1", name: "Aisha Rahman", message: "Please add more benches." },
  { id: "feedback-2", name: "Marcus Tan", message: "The bus stop needs shade." },
];

describe("filterFeedbackByKeyword", () => {
  it("matches feedback messages and citizen names without case sensitivity", () => {
    expect(filterFeedbackByKeyword(feedback, "BUS")).toEqual([feedback[1]]);
    expect(filterFeedbackByKeyword(feedback, "aIsHa")).toEqual([feedback[0]]);
  });

  it("returns all feedback for an empty search and none when there is no match", () => {
    expect(filterFeedbackByKeyword(feedback, "   ")).toEqual(feedback);
    expect(filterFeedbackByKeyword(feedback, "playground")).toEqual([]);
  });
});
