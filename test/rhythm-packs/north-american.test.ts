import { describe, it, expect } from "bun:test";
import northAmericanRhythmPack from "../../src/rhythm-packs/north-american";

describe("NorthAmericanRhythmPack", () => {
  it("should be an object", () => {
    expect(typeof northAmericanRhythmPack).toBe("object");
    expect(northAmericanRhythmPack).not.toBeNull();
  });

  it("should contain expected rhythm names as keys with number values", () => {
    expect(typeof northAmericanRhythmPack.whole).toBe("number");
    expect(typeof northAmericanRhythmPack.half).toBe("number");
    expect(typeof northAmericanRhythmPack.quarter).toBe("number");
    expect(typeof northAmericanRhythmPack.eighth).toBe("number");
    expect(typeof northAmericanRhythmPack.sixteenth).toBe("number");
    expect(typeof northAmericanRhythmPack.thirtySecond).toBe("number");
  });

  it("should have correct value for whole note", () => {
    expect(northAmericanRhythmPack.whole).toBe(1);
  });

  it("should have correct value for quarter note", () => {
    expect(northAmericanRhythmPack.quarter).toBe(0.25);
  });
});
