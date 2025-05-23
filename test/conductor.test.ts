import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test"; // Import mock and jest

import { AudioContext as AudioContextMock } from "standardized-audio-context-mock";
import Conductor from "@/conductor";
import type { IAudioContext, IGainNode } from "standardized-audio-context";

// Mock the 'standardized-audio-context' module
mock.module("standardized-audio-context", () => {
  // standardized-audio-context exports AudioContext as a named export
  // and AudioContextMock is designed to be a drop-in replacement.
  // We need to provide a module factory that returns an object
  // with an AudioContext property.
  return {
    AudioContext: AudioContextMock,
    // If other exports from 'standardized-audio-context' are used directly
    // by the code under test (not just types), they might need to be mocked here too.
    // For now, assuming Conductor primarily instantiates `new AudioContext()`.
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

describe("Conductor Class", () => {
  beforeEach(() => {
    // Load test packs before each test
    Conductor.loadPack("tuning", "testTuning", testTuningPack);
    Conductor.loadPack("rhythm", "testRhythm", testRhythmPack);
    Conductor.loadPack("instrument", "testInstruments", testInstrumentPack);
  });

  describe("Static Methods", () => {
    test("should have loadPack defined as static method", () => {
      expect(Conductor.loadPack).toBeDefined();
    });

    test("should load tuning pack", () => {
      const packName = "customTuning";
      const packData = { "C5": 523.25 };

      expect(() => {
        Conductor.loadPack("tuning", packName, packData);
      }).not.toThrow();
    });

    test("should load rhythm pack", () => {
      const packName = "customRhythm";
      const packData = { "custom": 16 };

      expect(() => {
        Conductor.loadPack("rhythm", packName, packData);
      }).not.toThrow();
    });

    test("should load instrument pack", () => {
      const packName = "customInstrument";
      const packData = (name: string, audioContext: IAudioContext) => ({
        createNote: () => audioContext.createOscillator()
      });

      expect(() => {
        Conductor.loadPack("instrument", packName, packData);
      }).not.toThrow();
    });

    test("should get instrument pack", () => {
      const pack = Conductor.getInstrumentPack("testInstruments");
      expect(pack).toBeDefined();
      expect(typeof pack).toBe("function");
    });

    test("should return undefined for non-existent instrument pack", () => {
      const pack = Conductor.getInstrumentPack("nonExistent");
      expect(pack).toBeUndefined();
    });
  });

  describe("Constructor", () => {
    test("should create conductor with default packs", () => {
      const conductor = new Conductor("testTuning", "testRhythm");
      expect(conductor).toBeInstanceOf(Conductor);
      expect(conductor.audioContext).toBeDefined();
      expect(conductor.masterVolume).toBeDefined();
      expect(conductor.pitches).toEqual(testTuningPack);
      expect(conductor.notes).toEqual(testRhythmPack);
    });

    test("should throw error for invalid tuning pack", () => {
      expect(() => {
        new Conductor("invalidTuning", "testRhythm");
      }).toThrow("invalidTuning is not a valid tuning pack.");
    });

    test("should throw error for invalid rhythm pack", () => {
      expect(() => {
        new Conductor("testTuning", "invalidRhythm");
      }).toThrow("invalidRhythm is not a valid rhythm pack.");
    });
  });

  describe("Instrument Management", () => {
    let conductor: Conductor;

    beforeEach(() => {
      conductor = new Conductor("testTuning", "testRhythm");
    });

    afterEach(() => {
      conductor.destroy();
    });

    test("should create instrument", () => {
      const instrument = conductor.createInstrument("sine", "testInstruments");
      expect(instrument).toBeDefined();
      expect(conductor.instruments).toHaveLength(1);
    });

    test("should create multiple instruments", () => {
      conductor.createInstrument("sine", "testInstruments");
      conductor.createInstrument("square", "testInstruments");
      expect(conductor.instruments).toHaveLength(2);
    });

    test("should finish and return player", () => {
      conductor.createInstrument("sine", "testInstruments");
      const player = conductor.finish();
      expect(player).toBeDefined();
      expect(conductor.player).toBe(player);
    });
  });

  describe("Volume Management", () => {
    let conductor: Conductor;

    beforeEach(() => {
      conductor = new Conductor("testTuning", "testRhythm");
    });

    afterEach(() => {
      conductor.destroy();
    });

    test("should set master volume", () => {
      conductor.setMasterVolume(0.5);
      expect(conductor.masterVolumeLevel).toBe(0.5);
    });

    test("should clamp volume to valid range", () => {
      conductor.setMasterVolume(-0.5);
      expect(conductor.masterVolumeLevel).toBe(0);

      conductor.setMasterVolume(1.5);
      expect(conductor.masterVolumeLevel).toBe(1);
    });
  });

  describe("Time Signature and Tempo", () => {
    let conductor: Conductor;

    beforeEach(() => {
      conductor = new Conductor("testTuning", "testRhythm");
    });

    afterEach(() => {
      conductor.destroy();
    });

    test("should set time signature", () => {
      conductor.setTimeSignature(3, 4);
      expect(conductor.beatsPerBar).toBe(3);
      expect(conductor.noteGetsBeat).toBe(3); // From signatureToNoteLengthRatio
    });

    test("should throw error for unsupported time signature", () => {
      expect(() => {
        conductor.setTimeSignature(4, 16); // 16 not in signatureToNoteLengthRatio
      }).toThrow("The bottom time signature (16) is not supported.");
    });

    test("should set tempo", () => {
      conductor.setTempo(120);
      expect(conductor.tempo).toBe(0.5); // 60/120
    });

    test("should get total seconds", () => {
      conductor.totalDuration = 10.7;
      expect(conductor.getTotalSeconds()).toBe(11); // rounded
    });
  });

  describe("Callbacks", () => {
    let conductor: Conductor;

    beforeEach(() => {
      conductor = new Conductor("testTuning", "testRhythm");
    });

    afterEach(() => {
      conductor.destroy();
    });

    test("should set ticker callback", () => {
      const callback = (seconds: number) => console.log(seconds);
      conductor.setTickerCallback(callback);
      expect(conductor.onTickerCallback).toBe(callback);
    });

    test("should throw error for invalid ticker callback", () => {
      expect(() => {
        conductor.setTickerCallback("not a function" as unknown as (seconds: number) => void);
      }).toThrow("Ticker must be a function.");
    });

    test("should set onFinished callback", () => {
      const callback = () => console.log("finished");
      conductor.setOnFinishedCallback(callback);
      expect(conductor.onFinishedCallback).toBe(callback);
    });

    test("should throw error for invalid onFinished callback", () => {
      expect(() => {
        conductor.setOnFinishedCallback("not a function" as unknown as () => void);
      }).toThrow("onFinished callback must be a function.");
    });

    test("should set onDurationChange callback", () => {
      const callback = () => console.log("duration changed");
      conductor.setOnDurationChangeCallback(callback);
      expect(conductor.onDurationChangeCallback).toBe(callback);
    });

    test("should throw error for invalid onDurationChange callback", () => {
      expect(() => {
        conductor.setOnDurationChangeCallback("not a function" as unknown as () => void);
      }).toThrow("onDurationChanged callback must be a function.");
    });
  });

  describe("Note Buffer Length", () => {
    let conductor: Conductor;

    beforeEach(() => {
      conductor = new Conductor("testTuning", "testRhythm");
    });

    afterEach(() => {
      conductor.destroy();
    });

    test("should set note buffer length", () => {
      conductor.setNoteBufferLength(30);
      expect(conductor.noteBufferLength).toBe(30);
    });
  });

  describe("JSON Loading", () => {
    let conductor: Conductor;

    beforeEach(() => {
      conductor = new Conductor("testTuning", "testRhythm");
    });

    afterEach(() => {
      conductor.destroy();
    });

    test("should load valid JSON song", () => {
      const song = {
        instruments: {
          piano: { name: "sine", pack: "testInstruments" }
        },
        notes: {
          piano: ["quarter|C4", "quarter|D4", "quarter|rest"]
        }
      };

      const player = conductor.load(song);
      expect(player).toBeDefined();
      expect(conductor.instruments).toHaveLength(1);
    });

    test("should load JSON with time signature and tempo", () => {
      const song = {
        timeSignature: [3, 4] as [number, number],
        tempo: 90,
        instruments: {
          piano: { name: "sine", pack: "testInstruments" }
        },
        notes: {
          piano: ["quarter|C4"]
        }
      };

      conductor.load(song);
      expect(conductor.beatsPerBar).toBe(3);
      expect(conductor.tempo).toBe(60/90);
    });

    test("should throw error for empty JSON", () => {
      expect(() => {
        conductor.load(null as unknown as Parameters<typeof conductor.load>[0]);
      }).toThrow("JSON is required for this method to work.");
    });

    test("should throw error for JSON without instruments", () => {
      expect(() => {
        conductor.load({ notes: {} } as Parameters<typeof conductor.load>[0]);
      }).toThrow("You must define at least one instrument.");
    });

    test("should throw error for JSON without notes", () => {
      expect(() => {
        conductor.load({
          instruments: { piano: { name: "sine", pack: "testInstruments" } }
        } as unknown as Parameters<typeof conductor.load>[0]);
      }).toThrow("You must define notes for each instrument.");
    });

    test("should handle longhand note format", () => {
      const song = {
        instruments: {
          piano: { name: "sine", pack: "testInstruments" }
        },
        notes: {
          piano: [
            { type: "note" as const, rhythm: "quarter", pitch: "C4", tie: false },
            { type: "rest" as const, rhythm: "quarter" }
          ]
        }
      };

      const player = conductor.load(song);
      expect(player).toBeDefined();
    });
  });

  describe("Destroy", () => {
    test("should destroy conductor properly", () => {
      const conductor = new Conductor("testTuning", "testRhythm");
      conductor.createInstrument("sine", "testInstruments");

      expect(conductor.instruments).toHaveLength(1);

      conductor.destroy();

      expect(conductor.instruments).toHaveLength(0);
      expect(conductor.totalDuration).toBe(0);
      expect(conductor.currentSeconds).toBe(0);
      expect(conductor.percentageComplete).toBe(0);
      expect(conductor.player).toBeNull();
    });
  });
});
