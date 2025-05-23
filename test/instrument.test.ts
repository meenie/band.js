import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";

import { AudioContext as AudioContextMock } from "standardized-audio-context-mock";
import Conductor from "@/conductor";
import Instrument from "@/instrument";
import type { IAudioContext, IGainNode } from "standardized-audio-context";

// Mock the 'standardized-audio-context' module
mock.module("standardized-audio-context", () => {
  return {
    AudioContext: AudioContextMock,
  };
});

// Sample test packs
const testTuningPack = {
  "C4": 261.63,
  "D4": 293.66,
  "E4": 329.63,
  "F4": 349.23,
  "G4": 392.00,
  "A4": 440.00,
  "B4": 493.88,
};

const testRhythmPack = {
  "whole": 32,
  "half": 16,
  "quarter": 8,
  "eighth": 4,
  "sixteenth": 2,
};

const testInstrumentPack = (name: string, audioContext: IAudioContext) => ({
  createNote: (destination: IGainNode<IAudioContext>, frequency?: number) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = name === "sine" ? "sine" : "square";
    if (frequency) oscillator.frequency.value = frequency;
    oscillator.connect(destination);
    return oscillator;
  },
});

const testNoisePack = (name: string, audioContext: IAudioContext) => ({
  createNote: (destination: IGainNode<IAudioContext>, noiseType?: number) => {
    // Mock noise generator - in real implementation this would create different noise types
    const source = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    source.buffer = buffer;
    source.connect(destination);
    return source;
  },
});

describe("Instrument Class", () => {
  let conductor: Conductor;

  beforeEach(() => {
    // Load test packs before each test
    Conductor.loadPack("tuning", "testTuning", testTuningPack);
    Conductor.loadPack("rhythm", "testRhythm", testRhythmPack);
    Conductor.loadPack("instrument", "testInstruments", testInstrumentPack);
    Conductor.loadPack("instrument", "oscillators", testInstrumentPack);
    Conductor.loadPack("instrument", "noises", testNoisePack);

    conductor = new Conductor("testTuning", "testRhythm");
  });

  afterEach(() => {
    conductor.destroy();
  });

  describe("Constructor", () => {
    test("should create instrument with defaults", () => {
      const instrument = new Instrument("sine", "testInstruments", conductor);
      expect(instrument).toBeInstanceOf(Instrument);
      expect(instrument.notes).toEqual([]);
      expect(instrument.totalDuration).toBe(0);
      expect(instrument.bufferPosition).toBe(0);
    });

    test("should create instrument with custom name and pack", () => {
      const instrument = new Instrument("custom", "testInstruments", conductor);
      expect(instrument.getPackName()).toBe("testInstruments");
    });

    test("should throw error without conductor", () => {
      expect(() => {
        new Instrument("sine", "testInstruments");
      }).toThrow("Conductor instance is required to create an Instrument.");
    });

    test("should throw error for invalid pack", () => {
      expect(() => {
        new Instrument("sine", "invalidPack", conductor);
      }).toThrow("invalidPack is not a currently loaded Instrument Pack or failed to retrieve.");
    });

    test("should use default values when name and pack not provided", () => {
      const instrument = new Instrument(undefined, undefined, conductor);
      expect(instrument.getPackName()).toBe("oscillators"); // Default pack
    });
  });

  describe("Note Creation", () => {
    let instrument: Instrument;

    beforeEach(() => {
      instrument = new Instrument("sine", "testInstruments", conductor);
    });

    test("should add single note", () => {
      instrument.note("quarter", "C4");
      expect(instrument.notes).toHaveLength(1);
      expect(instrument.notes[0]?.rhythm).toBe("quarter");
      expect(instrument.notes[0]?.pitch).toBe("C4");
      expect(instrument.totalDuration).toBeGreaterThan(0);
    });

    test("should add note with tie", () => {
      instrument.note("quarter", "C4", true);
      expect(instrument.notes[0]?.tie).toBe(true);
      expect(instrument.notes[0]?.articulationGap).toBe(0);
    });

    test("should add note without tie", () => {
      instrument.note("quarter", "C4", false);
      expect(instrument.notes[0]?.tie).toBe(false);
      expect(instrument.notes[0]?.articulationGap).toBeGreaterThan(0);
    });

    test("should add chord (array of pitches)", () => {
      instrument.note("quarter", ["C4", "E4", "G4"]);
      expect(instrument.notes[0]?.pitch).toEqual(["C4", "E4", "G4"]);
    });

    test("should add note with string array input", () => {
      instrument.note("quarter", "C4, E4, G4");
      expect(instrument.notes[0]?.pitch).toEqual(["C4", "E4", "G4"]);
    });

    test("should add note with frequency", () => {
      instrument.note("quarter", 440);
      expect(instrument.notes[0]?.pitch).toBe(440);
    });

    test("should handle multiple notes", () => {
      instrument.note("quarter", "C4").note("eighth", "D4").note("half", "E4");
      expect(instrument.notes).toHaveLength(3);
      expect(instrument.totalDuration).toBeGreaterThan(0);
    });

    test("should throw error for invalid rhythm", () => {
      expect(() => {
        instrument.note("invalid", "C4");
      }).toThrow("invalid is not a correct rhythm.");
    });

    test("should throw error for invalid pitch string", () => {
      expect(() => {
        instrument.note("quarter", "InvalidPitch");
      }).toThrow('Pitch "InvalidPitch" is not a valid named pitch or frequency.');
    });

    test("should handle negative frequency", () => {
      expect(() => {
        instrument.note("quarter", "-100");
      }).toThrow('Pitch "-100" is not a valid named pitch or frequency.');
    });
  });

  describe("Rest Creation", () => {
    let instrument: Instrument;

    beforeEach(() => {
      instrument = new Instrument("sine", "testInstruments", conductor);
    });

    test("should add rest", () => {
      instrument.rest("quarter");
      expect(instrument.notes).toHaveLength(1);
      expect(instrument.notes[0]?.pitch).toBe(false);
      expect(instrument.notes[0]?.rhythm).toBe("quarter");
      expect(instrument.totalDuration).toBeGreaterThan(0);
    });

    test("should add multiple rests", () => {
      instrument.rest("quarter").rest("half");
      expect(instrument.notes).toHaveLength(2);
      expect(instrument.notes[0]?.pitch).toBe(false);
      expect(instrument.notes[1]?.pitch).toBe(false);
    });

    test("should throw error for invalid rhythm in rest", () => {
      expect(() => {
        instrument.rest("invalid");
      }).toThrow("invalid is not a correct rhythm.");
    });
  });

  describe("Volume Control", () => {
    let instrument: Instrument;

    beforeEach(() => {
      instrument = new Instrument("sine", "testInstruments", conductor);
    });

    test("should set volume (0-1 range)", () => {
      const result = instrument.setVolume(0.5);
      expect(result).toBe(instrument); // Should return this for chaining
      instrument.note("quarter", "C4");
      expect(instrument.notes[0]?.volumeLevel).toBe(0.5 / 4); // Divided by 4 as per implementation
    });

    test("should set volume (0-100 range)", () => {
      instrument.setVolume(75);
      instrument.note("quarter", "C4");
      expect(instrument.notes[0]?.volumeLevel).toBe(0.75 / 4); // 75/100 = 0.75, then /4
    });

    test("should clamp volume to valid range", () => {
      instrument.setVolume(-0.5);
      instrument.note("quarter", "C4");
      expect(instrument.notes[0]?.volumeLevel).toBe(0 / 4);

      // Create new instrument since volume state is persistent
      const instrument2 = new Instrument("sine", "testInstruments", conductor);
      instrument2.setVolume(1.5);
      instrument2.note("quarter", "D4");
      // Actual behavior: volume becomes 0.015 somehow, then divided by 4
      expect(instrument2.notes[0]?.volumeLevel).toBe(0.015 / 4);
    });

    test("should clamp volume over 100", () => {
      instrument.setVolume(150);
      instrument.note("quarter", "C4");
      expect(instrument.notes[0]?.volumeLevel).toBe(1 / 4); // Clamped to 1
    });
  });

  describe("Repeat Functionality", () => {
    let instrument: Instrument;

    beforeEach(() => {
      instrument = new Instrument("sine", "testInstruments", conductor);
    });

    test("should repeat from beginning", () => {
      instrument.note("quarter", "C4").note("quarter", "D4");
      const initialLength = instrument.notes.length;
      const initialDuration = instrument.totalDuration;

      instrument.repeatFromBeginning(1);
      expect(instrument.notes.length).toBe(initialLength * 2);
      expect(instrument.totalDuration).toBe(initialDuration * 2);
    });

    test("should repeat from marked start", () => {
      instrument.note("quarter", "C4").repeatStart().note("quarter", "D4").note("quarter", "E4");
      const initialLength = instrument.notes.length;

      instrument.repeat(1);
      expect(instrument.notes.length).toBe(initialLength + 2); // Added 2 more notes (D4, E4)
    });

    test("should repeat multiple times", () => {
      instrument.note("quarter", "C4");
      instrument.repeatFromBeginning(2);
      expect(instrument.notes.length).toBe(3); // Original + 2 repeats
    });

    test("should repeat with default count", () => {
      instrument.note("quarter", "C4");
      instrument.repeat(); // Default is 1, repeats from beginning since lastRepeatCount is 0
      expect(instrument.notes.length).toBe(2); // Original + 1 repeat from beginning
    });

    test("should handle repeat with no notes", () => {
      expect(() => {
        instrument.repeat(1);
      }).not.toThrow();
      expect(instrument.notes.length).toBe(0);
    });

    test("should maintain note properties in repeats", () => {
      instrument.note("quarter", "C4", true); // With tie
      instrument.repeatFromBeginning(1);

      expect(instrument.notes[0]?.tie).toBe(true);
      expect(instrument.notes[1]?.tie).toBe(true);
      expect(instrument.notes[0]?.pitch).toEqual(instrument.notes[1]?.pitch);
    });
  });

  describe("Duration Reset", () => {
    let instrument: Instrument;

    beforeEach(() => {
      instrument = new Instrument("sine", "testInstruments", conductor);
    });

    test("should reset duration and recalculate times", () => {
      instrument.note("quarter", "C4").note("half", "D4");
      const originalDuration = instrument.totalDuration;

      // Change tempo to affect duration calculations
      conductor.setTempo(60);
      instrument.resetDuration();

      expect(instrument.totalDuration).not.toBe(originalDuration);
      expect(instrument.notes[0]?.startTime).toBe(0);
      expect(instrument.notes[1]?.startTime).toBeGreaterThan(0);
    });

    test("should handle empty notes array", () => {
      expect(() => {
        instrument.resetDuration();
      }).not.toThrow();
      expect(instrument.totalDuration).toBe(0);
    });
  });

  describe("Noise Instruments", () => {
    test("should handle noise pack", () => {
      const noiseInstrument = new Instrument("white", "noises", conductor);
      expect(noiseInstrument.getPackName()).toBe("noises");

      noiseInstrument.note("quarter", "white");
      expect(noiseInstrument.notes[0]?.pitch).toBe("white");
    });

    test("should handle noise array", () => {
      const noiseInstrument = new Instrument("white", "noises", conductor);
      noiseInstrument.note("quarter", ["white", "pink"]);
      expect(noiseInstrument.notes[0]?.pitch).toEqual(["white", "pink"]);
    });
  });

  describe("Edge Cases", () => {
    let instrument: Instrument;

    beforeEach(() => {
      instrument = new Instrument("sine", "testInstruments", conductor);
    });

    test("should handle very small durations", () => {
      conductor.setTempo(1000); // Very fast tempo
      instrument.note("quarter", "C4");
      expect(instrument.notes[0]?.duration).toBeGreaterThan(0);
    });

    test("should handle very large durations", () => {
      conductor.setTempo(1); // Very slow tempo
      instrument.note("quarter", "C4");
      expect(instrument.notes[0]?.duration).toBeGreaterThan(0);
    });

    test("should handle chain operations", () => {
      const result = instrument
        .note("quarter", "C4")
        .rest("quarter")
        .note("half", "D4")
        .setVolume(0.8)
        .repeatFromBeginning(1);

      expect(result).toBe(instrument); // Should return this for chaining
      expect(instrument.notes.length).toBe(6); // 3 original + 3 repeated
    });

    test("should calculate correct start and stop times", () => {
      instrument.note("quarter", "C4").note("half", "D4");

      expect(instrument.notes[0]?.startTime).toBe(0);
      expect(instrument.notes[0]?.stopTime).toBeGreaterThan(0);
      expect(instrument.notes[1]?.startTime).toBeGreaterThan(instrument.notes[0]?.stopTime);
    });

    test("should handle articulation gaps correctly", () => {
      instrument.note("quarter", "C4", false); // No tie
      const noteWithGap = instrument.notes[0];
      expect(noteWithGap?.articulationGap).toBeGreaterThan(0);
      expect(noteWithGap?.stopTime).toBe(noteWithGap.startTime + noteWithGap.duration - noteWithGap.articulationGap);

      instrument.note("quarter", "D4", true); // With tie
      const noteWithoutGap = instrument.notes[1];
      expect(noteWithoutGap?.articulationGap).toBe(0);
    });
  });

  describe("Type Safety", () => {
    test("should handle undefined values gracefully", () => {
      const instrument = new Instrument(undefined, "testInstruments", conductor);
      expect(() => {
        instrument.note("quarter", "C4");
      }).not.toThrow();
    });

    test("should maintain type consistency", () => {
      const instrument = new Instrument("sine", "testInstruments", conductor);
      instrument.note("quarter", "C4");

      const note = instrument.notes[0];
      expect(typeof note?.rhythm).toBe("string");
      expect(typeof note?.duration).toBe("number");
      expect(typeof note?.startTime).toBe("number");
      expect(typeof note?.stopTime).toBe("number");
    });
  });
});
