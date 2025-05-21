/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
import Instrument, { type InstrumentPackInstance } from "./instrument";
import Player from "./player";
import {
  AudioContext, // This is actually IAudioContext from the lib, but often aliased
  type IAudioContext,
  type IGainNode,
} from "standardized-audio-context";

// Define specific types for pack data
interface RhythmPack {
  [rhythmName: string]: number;
}

interface TuningPack {
  [pitchName: string]: number;
}

// Update InstrumentPackFn to use IAudioContext and expect InstrumentPackInstance
type InstrumentPackFn = (
  name: string,
  audioContext: IAudioContext
) => InstrumentPackInstance;

interface InstrumentPackCollection {
  [packName: string]: InstrumentPackFn;
}

// Collection of all loaded packs
interface PackCollection {
  instrument: InstrumentPackCollection;
  rhythm: { [packName: string]: RhythmPack };
  tuning: { [packName: string]: TuningPack };
}

// Types for JSON song structure
interface InstrumentDefinition {
  name: string; // e.g. 'sine', 'square', or a custom noise name
  pack: string; // e.g. 'oscillators', 'noises'
}

interface NoteLongHand {
  type: "note" | "rest";
  rhythm: string;
  pitch?: string | string[]; // Can be single pitch or array for chords
  tie?: boolean;
}

type SongNote = string | NoteLongHand; // string for shorthand like "quarter|C4"

interface SongJSON {
  instruments: { [instrumentAlias: string]: InstrumentDefinition };
  notes: { [instrumentAlias: string]: SongNote[] };
  timeSignature?: [number, number]; // [beatsPerBar, noteGetsBeat (e.g., 4 for quarter)]
  tempo?: number; // Beats per minute
}

export default class Conductor {
  private static packs: PackCollection = {
    instrument: {},
    rhythm: {},
    tuning: {},
  };

  private static readonly signatureToNoteLengthRatio: {
    [key: number]: number;
  } = {
    2: 6, // half note
    4: 3, // quarter note
    8: 4.5, // eighth note (this seems unusual, usually 2.25 or similar if quarter is 3?)
    // Let's assume it's based on a specific interpretation for this library.
  };

  public audioContext: IAudioContext;
  public masterVolume: IGainNode<IAudioContext>;
  public instruments: Instrument[] = [];
  public player: Player | null = null;

  public pitches: TuningPack;
  public notes: RhythmPack; // Represents the currently selected rhythm pack values

  public masterVolumeLevel = 1; // 0-1 range
  public beatsPerBar = 4;
  public noteGetsBeat = 3; // Default based on 4/4 time and ratio for quarter note
  public tempo: number = 60 / 120; // Corrected: seconds per beat for 120bpm

  public totalDuration = 0;
  public currentSeconds = 0;
  public percentageComplete = 0;
  public noteBufferLength = 20;

  public onTickerCallback: (seconds: number) => void = () => {};
  public onFinishedCallback: () => void = () => {};
  public onDurationChangeCallback: () => void = () => {};

  constructor(
    tuningName = "equalTemperament",
    rhythmPackName = "northAmerican"
  ) {
    if (typeof Conductor.packs.tuning[tuningName] === "undefined") {
      throw new Error(`${tuningName} is not a valid tuning pack.`);
    }
    if (typeof Conductor.packs.rhythm[rhythmPackName] === "undefined") {
      throw new Error(`${rhythmPackName} is not a valid rhythm pack.`);
    }

    this.audioContext = new AudioContext();
    this.masterVolume = this.audioContext.createGain();
    this.masterVolume.connect(this.audioContext.destination);

    this.pitches = Conductor.packs.tuning[tuningName];
    this.notes = Conductor.packs.rhythm[rhythmPackName];

    this.setMasterVolume(1); // Default volume to 1 (100%)
    this.setTempo(120); // Default tempo
    this.setTimeSignature(4, 4); // Default time signature
  }

  public load(json: SongJSON): Player {
    if (this.instruments.length > 0) {
      this.destroy();
    }

    if (!json) {
      throw new Error("JSON is required for this method to work.");
    }
    if (!json.instruments || Object.keys(json.instruments).length === 0) {
      throw new Error("You must define at least one instrument.");
    }
    if (!json.notes || Object.keys(json.notes).length === 0) {
      throw new Error("You must define notes for each instrument.");
    }

    if (json.timeSignature) {
      this.setTimeSignature(json.timeSignature[0], json.timeSignature[1]);
    }
    if (json.tempo) {
      this.setTempo(json.tempo);
    }

    const instrumentList: { [alias: string]: Instrument } = {};
    for (const alias in json.instruments) {
      if (Object.prototype.hasOwnProperty.call(json.instruments, alias)) {
        const instDef = json.instruments[alias];
        instrumentList[alias] = this.createInstrument(
          instDef.name,
          instDef.pack
        );
      }
    }

    for (const alias in json.notes) {
      if (Object.prototype.hasOwnProperty.call(json.notes, alias)) {
        const instrument = instrumentList[alias];
        if (!instrument) {
          console.warn(`Notes defined for unknown instrument alias: ${alias}`);
          continue;
        }
        const notesForInstrument = json.notes[alias];
        for (const noteData of notesForInstrument) {
          if (typeof noteData === "string") {
            const parts = noteData.split("|");
            const rhythm = parts[0];
            const typeOrPitch = parts[1];
            const tieOrUndefined = parts[2];

            if (typeOrPitch === "rest") {
              instrument.rest(rhythm);
            } else {
              instrument.note(
                rhythm,
                typeOrPitch,
                tieOrUndefined === "true" || tieOrUndefined === "tie"
              );
            }
          } else {
            // NoteLongHand
            if (noteData.type === "rest") {
              instrument.rest(noteData.rhythm);
            } else if (noteData.type === "note") {
              instrument.note(
                noteData.rhythm,
                noteData.pitch || [],
                noteData.tie
              );
            }
          }
        }
      }
    }
    return this.finish();
  }

  public createInstrument(name?: string, packName?: string): Instrument {
    const instrument = new Instrument(name, packName, this);
    this.instruments.push(instrument);
    return instrument;
  }

  public finish(): Player {
    this.player = new Player(this);
    return this.player;
  }

  public destroy(): void {
    if (this.audioContext?.close) {
      this.audioContext
        .close()
        .catch((e: unknown) => console.error("Error closing AudioContext:", e));
    }
    this.audioContext = new AudioContext(); // Recreate
    this.masterVolume = this.audioContext.createGain();
    this.masterVolume.connect(this.audioContext.destination);
    this.instruments = [];
    // Reset other relevant state if necessary
    this.totalDuration = 0;
    this.currentSeconds = 0;
    this.percentageComplete = 0;
    if (this.player) {
      // May need a way to clean up player resources too
    }
    this.player = null;
  }

  public setMasterVolume(volume: number): void {
    // Assuming volume is 0-1 range now. If 0-100, uncomment next line.
    // if (volume > 1) volume /= 100;
    this.masterVolumeLevel = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
    if (this.masterVolume?.gain) {
      this.masterVolume.gain.setValueAtTime(
        this.masterVolumeLevel,
        this.audioContext.currentTime
      );
    }
  }

  public getTotalSeconds(): number {
    return Math.round(this.totalDuration);
  }

  public setTickerCallback(cb: (seconds: number) => void): void {
    if (typeof cb !== "function") {
      throw new Error("Ticker must be a function.");
    }
    this.onTickerCallback = cb;
  }

  public setTimeSignature(top: number, bottom: number): void {
    if (typeof Conductor.signatureToNoteLengthRatio[bottom] === "undefined") {
      throw new Error(
        `The bottom time signature (${bottom}) is not supported.`
      );
    }
    this.beatsPerBar = top;
    this.noteGetsBeat = Conductor.signatureToNoteLengthRatio[bottom];
  }

  public setTempo(bpm: number): void {
    this.tempo = 60 / bpm; // tempo is now seconds per beat
    if (this.player) {
      this.player.resetTempo(); // Player needs this method
      this.onDurationChangeCallback();
    }
  }

  public setOnFinishedCallback(cb: () => void): void {
    if (typeof cb !== "function") {
      throw new Error("onFinished callback must be a function.");
    }
    this.onFinishedCallback = cb;
  }

  public setOnDurationChangeCallback(cb: () => void): void {
    if (typeof cb !== "function") {
      throw new Error("onDurationChanged callback must be a function.");
    }
    this.onDurationChangeCallback = cb;
  }

  public setNoteBufferLength(len: number): void {
    this.noteBufferLength = len;
  }

  public static getInstrumentPack(
    packName: string
  ): InstrumentPackFn | undefined {
    if (
      Object.prototype.hasOwnProperty.call(Conductor.packs.instrument, packName)
    ) {
      return Conductor.packs.instrument[packName];
    }
    return undefined;
  }

  // Overload signatures
  public static loadPack(type: "tuning", name: string, data: TuningPack): void;
  public static loadPack(type: "rhythm", name: string, data: RhythmPack): void;
  public static loadPack(
    type: "instrument",
    name: string,
    data: InstrumentPackFn
  ): void;
  // Implementation signature
  public static loadPack(
    type: "tuning" | "rhythm" | "instrument",
    name: string,
    data: TuningPack | RhythmPack | InstrumentPackFn
  ): void {
    if (["tuning", "rhythm", "instrument"].indexOf(type) === -1) {
      // This check is somewhat redundant due to the overload types but good for safety
      // if the method were ever called internally in a way that bypasses overloads.
      throw new Error(`${type} is not a valid Pack Type.`);
    }

    // Check if pack of this type and name already exists
    if (Object.prototype.hasOwnProperty.call(Conductor.packs[type], name)) {
      // console.warn(`A(n) ${type} pack with the name "${name}" has already been loaded. Skipping.`);
      return; // Silently return if pack is already loaded
    }

    switch (type) {
      case "tuning":
        Conductor.packs.tuning[name] = data as TuningPack;
        break;
      case "rhythm":
        Conductor.packs.rhythm[name] = data as RhythmPack;
        break;
      case "instrument":
        if (typeof data === "function") {
          Conductor.packs.instrument[name] = data;
        } else {
          // This case should ideally not be reached if called via correct overloads
          throw new Error(
            `Invalid data provided for instrument pack "${name}". Expected a function.`
          );
        }
        break;
    }
  }
}
