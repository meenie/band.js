import { describe, it, expect } from "bun:test";
import europeanRhythmPack from "../../src/rhythm-packs/european";

describe("EuropeanRhythmPack", () => {
  it("should be an object", () => {
    expect(typeof europeanRhythmPack).toBe("object");
    expect(europeanRhythmPack).not.toBeNull();
  });

  it("should contain expected rhythm names as keys with number values", () => {
    expect(typeof europeanRhythmPack.semibreve).toBe("number");
    expect(typeof europeanRhythmPack.minim).toBe("number");
    expect(typeof europeanRhythmPack.crotchet).toBe("number");
    expect(typeof europeanRhythmPack.quaver).toBe("number");
    expect(typeof europeanRhythmPack.semiquaver).toBe("number");
    expect(typeof europeanRhythmPack.demisemiquaver).toBe("number");
  });

  it("should have correct value for semibreve (whole note)", () => {
    expect(europeanRhythmPack.semibreve).toBe(1);
  });

  it("should have correct value for crotchet (quarter note)", () => {
    expect(europeanRhythmPack.crotchet).toBe(0.25);
  });
});
