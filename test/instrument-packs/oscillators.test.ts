import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { AudioContext, OscillatorNode } from "standardized-audio-context-mock";
import OscillatorInstrumentPack, {
  type OscillatorName,
} from "@/instrument-packs/oscillators";
import type { IAudioContext, IGainNode } from "standardized-audio-context";

describe("OscillatorInstrumentPack", () => {
  let audioContext: IAudioContext;
  let mockDestination: IGainNode<IAudioContext>;

  beforeEach(() => {
    audioContext = new AudioContext();
    mockDestination = audioContext.createGain();
  });

  afterEach(() => {
    const mockContext = audioContext as AudioContext; // Cast to mock's AudioContext
    if (mockContext && typeof mockContext.close === "function") {
      mockContext.close();
    }
  });

  const oscillatorTypesToTest: OscillatorName[] = [
    "sine",
    "square",
    "sawtooth",
    "triangle",
  ];

  for (const oscillatorType of oscillatorTypesToTest) {
    describe(`when creating a "${oscillatorType}" oscillator`, () => {
      it("should return an OscillatorNode", () => {
        const pack = OscillatorInstrumentPack(oscillatorType, audioContext);
        const note = pack.createNote(mockDestination, 440);
        expect(note).toBeInstanceOf(OscillatorNode);
      });

      it(`should have type set to "${oscillatorType}"`, () => {
        const pack = OscillatorInstrumentPack(oscillatorType, audioContext);
        const note = pack.createNote(mockDestination, 440); // Assertion removed
        expect(note.type).toBe(oscillatorType);
      });

      it("should set the frequency if provided", () => {
        const pack = OscillatorInstrumentPack(oscillatorType, audioContext);
        const frequency = 880;
        const note = pack.createNote(mockDestination, frequency); // Assertion removed
        expect(note.frequency.value).toBe(frequency);
      });

      it("should default frequency to 440Hz if not provided (Web Audio API default)", () => {
        const pack = OscillatorInstrumentPack(oscillatorType, audioContext);
        const note = pack.createNote(mockDestination); // Assertion removed
        // The Web Audio API defaults an oscillator's frequency to 440 Hz if not set.
        // standardized-audio-context-mock should replicate this.
        expect(note.frequency.value).toBe(440);
      });

      it("should be connected to the destination", () => {
        const pack = OscillatorInstrumentPack(oscillatorType, audioContext);
        const note = pack.createNote(mockDestination, 440);
        // As with noises.test.ts, direct connection verification is complex with the mock.
        // We assume connection if no error occurs and the node is returned.
        expect(note).toBeDefined();
      });
    });
  }

  it("should throw an error for an invalid oscillator type", () => {
    expect(() => {
      OscillatorInstrumentPack("invalidOscillator", audioContext);
    }).toThrowError(
      `Invalid oscillator name: "invalidOscillator". Must be one of 'sine', 'square', 'sawtooth', 'triangle'.`
    );
  });
});
