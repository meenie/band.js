import type { InstrumentPackInstance } from "../instrument";
import type {
  IAudioContext,
  IGainNode,
  IOscillatorNode,
  TOscillatorType,
} from "standardized-audio-context";

/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */

export type OscillatorName = "sine" | "square" | "sawtooth" | "triangle";

// Helper to check if a string is an OscillatorName
function isOscillatorName(name: string): name is OscillatorName {
  return ["sine", "square", "sawtooth", "triangle"].includes(name);
}

/**
 * Oscillator Instrument Pack
 *
 * @param name The name of the oscillator type (e.g., "sine", "square"). Must be a valid OscillatorName.
 * @param audioContext The audio context.
 * @returns An instrument pack instance for oscillators.
 * @constructor
 */
function OscillatorInstrumentPack(
  name: string, // Changed from OscillatorName to string
  audioContext: IAudioContext
): InstrumentPackInstance<IOscillatorNode<IAudioContext>> {
  if (!isOscillatorName(name)) {
    throw new Error(
      `Invalid oscillator name: "${name}". Must be one of 'sine', 'square', 'sawtooth', 'triangle'.`
    );
  }
  return {
    createNote: (
      destination: IGainNode<IAudioContext>,
      frequency?: number
    ): IOscillatorNode<IAudioContext> => {
      const o = audioContext.createOscillator();

      // Connect note to volume
      o.connect(destination);
      // Set pitch type
      o.type = name; // 'name' is now a validated OscillatorName
      // Set frequency
      if (typeof frequency === "number") {
        o.frequency.value = frequency;
      }
      // No 'else' needed here, Web Audio API defaults oscillator frequency to 440Hz if not set.

      return o;
    },
  };
}
export default OscillatorInstrumentPack;
