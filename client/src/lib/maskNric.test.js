import { describe, expect, it } from "vitest";
import { maskNric } from "./maskNric";

describe("maskNric", () => {
  it("keeps only the first and final two characters of a workshop ID", () => {
    expect(maskNric("S0000001A")).toBe("S••••••1A");
  });

  it("does not render a missing or too-short identifier", () => {
    expect(maskNric()).toBe("");
    expect(maskNric("S1A")).toBe("");
  });
});
