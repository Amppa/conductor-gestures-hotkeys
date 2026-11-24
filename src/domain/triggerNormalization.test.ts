import { describe, expect, it } from "vitest";
import { normalizeTrigger } from "./triggerNormalization";

describe("normalizeTrigger", () => {
  it("maps legacy mouse button aliases to canonical triggers", () => {
    expect(normalizeTrigger("RB")).toBe("R");
    expect(normalizeTrigger("MB")).toBe("M");
    expect(normalizeTrigger("LB")).toBe("L");
    expect(normalizeTrigger("X1B")).toBe("X1");
    expect(normalizeTrigger("X2B")).toBe("X2");
  });

  it("collapses split top-edge aliases", () => {
    expect(normalizeTrigger("EdgeTopL")).toBe("EdgeTop");
    expect(normalizeTrigger("EdgeTopR")).toBe("EdgeTop");
  });

  it("keeps canonical and keyboard triggers unchanged", () => {
    expect(normalizeTrigger("EdgeBottom")).toBe("EdgeBottom");
    expect(normalizeTrigger("CornerTL")).toBe("CornerTL");
    expect(normalizeTrigger("^c")).toBe("^c");
  });
});
