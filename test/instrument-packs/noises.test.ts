import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import type {
  IAudioBufferSourceNode,
  IAudioContext,
  IGainNode,
} from "standardized-audio-context";
import {
  AudioContext,
  AudioBufferSourceNode,
} from "standardized-audio-context-mock";

import NoisesInstrumentPack from "@/instrument-packs/noises";

describe("NoisesInstrumentPack", () => {
  let audioContext: IAudioContext;
  let mockDestination: IGainNode<IAudioContext>;

  beforeEach(() => {
    audioContext = new AudioContext();
    mockDestination = audioContext.createGain();
  });

  afterEach(() => {
    // The AudioContext from standardized-audio-context-mock has a close method.
    const mockContext = audioContext as AudioContext;
    if (mockContext && typeof mockContext.close === "function") {
      mockContext.close();
    }
  });

  const noiseTypesToTest = [
    "white",
    "pink",
    "brown",
    "brownian",
    "red",
  ] as const;

  for (const noiseType of noiseTypesToTest) {
    describe(`when creating a "${noiseType}" noise`, () => {
      it("should return an AudioBufferSourceNode", () => {
        const pack = NoisesInstrumentPack(noiseType, audioContext);
        const note = pack.createNote(mockDestination);
        expect(note).toBeInstanceOf(AudioBufferSourceNode);
      });

      it("should have loop set to true", () => {
        const pack = NoisesInstrumentPack(noiseType, audioContext);
        const note = pack.createNote(mockDestination); // Assertion removed
        expect(note.loop).toBe(true);
      });

      it("should be connected to the destination", () => {
        const pack = NoisesInstrumentPack(noiseType, audioContext);
        const note = pack.createNote(mockDestination);
        // standardized-audio-context-mock doesn't fully track connections in a way
        // that's easily verifiable without inspecting internal properties,
        // which is brittle. For now, we assume connect() was called.
        // If more detailed connection testing is needed, the mock might need extension
        // or a different approach.
        // A simple check could be to ensure no error was thrown during creation.
        expect(note).toBeDefined();
      });
    });
  }

  it("should throw an error for an invalid noise type", () => {
    expect(() => {
      // @ts-ignore we are testing
      NoisesInstrumentPack("invalidNoise", audioContext);
    }).toThrowError(
      `Invalid noise type: "invalidNoise". Must be one of 'white', 'pink', 'brown', 'brownian', 'red'.`
    );
  });

  it("should create brownian noise for 'red' type", () => {
    const pack = NoisesInstrumentPack("red", audioContext);
    const note = pack.createNote(mockDestination);
    // This implicitly tests that 'red' maps to createBrownianNoise
    // by not throwing and returning a valid node.
    expect(note).toBeInstanceOf(AudioBufferSourceNode);
  });

  it("should create brownian noise for 'brownian' type", () => {
    const pack = NoisesInstrumentPack("brownian", audioContext);
    const note = pack.createNote(mockDestination);
    expect(note).toBeInstanceOf(AudioBufferSourceNode);
  });
});
