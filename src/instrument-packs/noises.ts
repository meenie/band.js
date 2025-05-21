import type { InstrumentPackInstance } from "../instrument";
import type {
  IAudioContext,
  IGainNode,
  IAudioBufferSourceNode,
  IAudioScheduledSourceNode, // Added this import
} from "standardized-audio-context";

/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */

type NoiseType = "white" | "pink" | "brown" | "brownian" | "red";

// Helper to check if a string is a NoiseType
function isNoiseType(name: string): name is NoiseType {
  return ["white", "pink", "brown", "brownian", "red"].includes(name);
}

function createWhiteNoise(
  audioContext: IAudioContext,
  destination: IGainNode<IAudioContext>
): IAudioBufferSourceNode<IAudioContext> {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = audioContext.createBufferSource();
  whiteNoise.buffer = noiseBuffer;
  whiteNoise.loop = true;
  whiteNoise.connect(destination);
  return whiteNoise;
}

function createPinkNoise(
  audioContext: IAudioContext,
  destination: IGainNode<IAudioContext>
): IAudioBufferSourceNode<IAudioContext> {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );
  const output = noiseBuffer.getChannelData(0);
  let b0 = 0.0;
  let b1 = 0.0;
  let b2 = 0.0;
  let b3 = 0.0;
  let b4 = 0.0;
  let b5 = 0.0;
  let b6 = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11;
    b6 = white * 0.115926;
  }

  const pinkNoise = audioContext.createBufferSource();
  pinkNoise.buffer = noiseBuffer;
  pinkNoise.loop = true;
  pinkNoise.connect(destination);
  return pinkNoise;
}

function createBrownianNoise(
  audioContext: IAudioContext,
  destination: IGainNode<IAudioContext>
): IAudioBufferSourceNode<IAudioContext> {
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );
  const output = noiseBuffer.getChannelData(0);
  let lastOut = 0.0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }

  const brownianNoise = audioContext.createBufferSource();
  brownianNoise.buffer = noiseBuffer;
  brownianNoise.loop = true;
  brownianNoise.connect(destination);
  return brownianNoise;
}

/**
 * Noises Instrument Pack
 *
 * Adapted from: https://github.com/zacharydenton/noise.js
 */
function NoisesInstrumentPack(
  name: string, // Changed from NoiseType to string
  audioContext: IAudioContext
): InstrumentPackInstance<IAudioBufferSourceNode<IAudioContext>> {
  if (!isNoiseType(name)) {
    throw new Error(
      `Invalid noise type: "${name}". Must be one of 'white', 'pink', 'brown', 'brownian', 'red'.`
    );
  }
  return {
    createNote: (
      destination: IGainNode<IAudioContext>,
      // frequency is ignored for noise pack but part of InstrumentPackInstance signature
      _frequency?: number
    ): IAudioBufferSourceNode<IAudioContext> => {
      switch (
        name // 'name' is now a validated NoiseType
      ) {
        case "white":
          return createWhiteNoise(audioContext, destination);
        case "pink":
          return createPinkNoise(audioContext, destination);
        case "brown":
        case "brownian":
        case "red":
          return createBrownianNoise(audioContext, destination);
        // No default case needed here as 'name' is validated by isNoiseType
        // However, for exhaustive checks with TypeScript, you might still want it
        // if the type system can't infer exhaustion perfectly.
        // default:
        //  const exhaustiveCheck: never = name;
        //  throw new Error(`Unhandled noise type: ${exhaustiveCheck}`);
      }
    },
  };
}

export default NoisesInstrumentPack;
