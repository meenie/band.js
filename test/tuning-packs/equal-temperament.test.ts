import { describe, it, expect } from "bun:test";
import equalTemperamentTuningPack from "../../src/tuning-packs/equal-temperament";

describe("EqualTemperamentTuningPack", () => {
  it("should be an object", () => {
    expect(typeof equalTemperamentTuningPack).toBe("object");
    expect(equalTemperamentTuningPack).not.toBeNull();
  });

  it("should contain note names as keys with number values (frequencies)", () => {
    expect(typeof equalTemperamentTuningPack.C4).toBe("number");
    expect(typeof equalTemperamentTuningPack.A4).toBe("number");
    expect(typeof equalTemperamentTuningPack.Db5).toBe("number"); // Example sharp/flat
  });

  it("should have the correct frequency for A4 (standard tuning pitch)", () => {
    expect(equalTemperamentTuningPack.A4).toBe(440.0);
  });

  it("should have a variety of notes across octaves", () => {
    expect(typeof equalTemperamentTuningPack.C0).toBe("number");
    expect(typeof equalTemperamentTuningPack.G3).toBe("number");
    expect(typeof equalTemperamentTuningPack.E5).toBe("number");
    expect(typeof equalTemperamentTuningPack.B7).toBe("number");
  });

  it("should have a significant number of keys (notes)", () => {
    // Check if there are a reasonable number of notes defined.
    // The actual file has 12 notes per octave for C0 to C8 (8 octaves * 12 notes + C8 = 97 keys)
    // but some are duplicated (e.g. C#0 and Db0).
    // A simple check for more than 88 keys (standard piano) should suffice.
    expect(Object.keys(equalTemperamentTuningPack).length).toBeGreaterThan(88);
  });
});
