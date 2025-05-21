import { expect, test, describe, mock } from "bun:test"; // Import mock and jest

import { AudioContext as AudioContextMock } from "standardized-audio-context-mock";
import Conductor from "@/conductor";

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

describe("Conductor Class", () => {
  test("should have loadPack defined as static method", () => {
    // This is a sample test to make sure test framework is up and running
    expect(Conductor.loadPack).toBeDefined();
  });
});
