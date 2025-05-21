import Conductor from "./conductor"; // Changed to regular import to access static methods
import type {
  IGainNode,
  IAudioScheduledSourceNode,
  IAudioContext, // Though conductor instance already has this typed
} from "standardized-audio-context";

/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
export interface Note {
  rhythm: string;
  pitch: string | number | (string | number)[] | false; // false for rests
  duration: number;
  articulationGap: number;
  tie?: boolean;
  startTime: number;
  stopTime: number;
  volumeLevel?: number;
}

// Interface for the object returned by an instrument pack function
export interface InstrumentPackInstance<
  NodeType extends IAudioScheduledSourceNode<IAudioContext> = IAudioScheduledSourceNode<IAudioContext>
> {
  createNote: (
    destination: IGainNode<IAudioContext>,
    frequency?: number
  ) => NodeType;
  // It might have other methods or properties depending on the pack type
}

export default class Instrument {
  private conductor: Conductor;
  private name: string;
  private pack: string;
  private lastRepeatCount = 0;
  private volumeLevel = 1; // 0-1 range
  private articulationGapPercentage = 0.05;

  public totalDuration = 0;
  public bufferPosition = 0;
  public instrument: InstrumentPackInstance;
  public notes: Note[] = [];

  public getPackName(): string {
    return this.pack;
  }

  constructor(name?: string, pack?: string, conductor?: Conductor) {
    if (!conductor) {
      throw new Error(
        "Conductor instance is required to create an Instrument."
      );
    }
    this.conductor = conductor;
    this.name = name || "sine";
    this.pack = pack || "oscillators";

    const instrumentPackFn = Conductor.getInstrumentPack(this.pack);

    if (!instrumentPackFn) {
      // This check should ideally be redundant if the pack existence is validated before/during Conductor.getInstrumentPack,
      // but it's good for robustness and satisfies TypeScript if getInstrumentPack can return undefined.
      // The original code had a check like `!Conductor.packs.instrument[this.pack]`
      // which is now effectively handled by Conductor.getInstrumentPack returning undefined.
      throw new Error(
        `${this.pack} is not a currently loaded Instrument Pack or failed to retrieve.`
      );
    }
    this.instrument = instrumentPackFn(this.name, this.conductor.audioContext);
  }

  private getDuration(rhythm: string): number {
    // Assuming conductor.notes is the selected rhythm pack (RhythmPack type)
    if (typeof this.conductor.notes[rhythm] === "undefined") {
      throw new Error(`${rhythm} is not a correct rhythm.`);
    }
    return (
      ((this.conductor.notes[rhythm] * this.conductor.tempo) /
        this.conductor.noteGetsBeat) *
      10
      // The * 10 seems arbitrary, might need review based on original library logic
      // For now, keeping it as is.
    );
  }

  private clone(obj: Note): Note {
    // Parameter and return type are Note
    if (null === obj || typeof obj !== "object") {
      // Stricter type check
      return obj;
    }
    // A more robust way to clone, or use a library if deep cloning complex objects.
    // For now, assuming simple structure for Note, or that constructor clone is sufficient.
    const copy = { ...obj }; // Shallow clone using spread, good for simple objects
    // If obj can have methods or be a class instance, this might not be enough.
    // The original `obj.constructor()` might be problematic if obj is a plain object.
    return copy;
  }

  public setVolume(newVolumeLevel: number): this {
    // volume is 0-1
    let normalizedVolume = newVolumeLevel;
    if (newVolumeLevel > 1 && newVolumeLevel <= 100) {
      // Allow 0-100 for convenience
      normalizedVolume = newVolumeLevel / 100;
    }
    this.volumeLevel = Math.max(0, Math.min(1, normalizedVolume)); // Clamp to 0-1
    return this;
  }

  public note(
    rhythm: string,
    pitch: string | number | (string | number)[], // More specific pitch type
    tie?: boolean
  ): this {
    const duration = this.getDuration(rhythm);
    const articulationGap = tie ? 0 : duration * this.articulationGapPercentage;

    let processedPitch: string | number | (string | number)[] | false = pitch;

    if (pitch) {
      const pitchArrayInput =
        typeof pitch === "string"
          ? pitch.split(",").map((p) => p.trim())
          : Array.isArray(pitch)
          ? pitch.map((p) => (typeof p === "string" ? p.trim() : p))
          : [pitch];

      if (this.pack === "noises") {
        // For noises, the pitch string is the noise type.
        // We assume it's a valid noise type string (e.g., "white")
        // and store it as is. The noise pack itself handles this string.
        processedPitch =
          pitchArrayInput.length === 1 ? pitchArrayInput[0] : pitchArrayInput;
      } else {
        // Original pitch processing for pitched instruments
        const finalPitchArray = [...pitchArrayInput]; // Create a mutable copy
        for (let i = 0; i < finalPitchArray.length; i++) {
          const p = finalPitchArray[i];
          if (typeof p === "string") {
            if (typeof this.conductor.pitches[p] === "undefined") {
              const parsedP = Number.parseFloat(p);
              if (Number.isNaN(parsedP) || parsedP < 0) {
                throw new Error(
                  `Pitch "${p}" is not a valid named pitch or frequency.`
                );
              }
              finalPitchArray[i] = parsedP; // Modify the copy
            }
          }
        }
        processedPitch =
          finalPitchArray.length === 1 ? finalPitchArray[0] : finalPitchArray;
      }
    }

    this.notes.push({
      rhythm: rhythm,
      pitch: processedPitch,
      duration: duration,
      articulationGap: articulationGap,
      tie: tie,
      startTime: this.totalDuration,
      stopTime: this.totalDuration + duration - articulationGap,
      volumeLevel: this.volumeLevel / 4, // Still assuming this division is intentional
    });

    this.totalDuration += duration;
    return this;
  }

  public rest(rhythm: string): this {
    const duration = this.getDuration(rhythm);
    this.notes.push({
      rhythm: rhythm,
      pitch: false, // Explicitly false for rests
      duration: duration,
      articulationGap: 0,
      startTime: this.totalDuration,
      stopTime: this.totalDuration + duration,
    });
    this.totalDuration += duration;
    return this;
  }

  public repeatStart(): this {
    this.lastRepeatCount = this.notes.length;
    return this;
  }

  public repeatFromBeginning(numOfRepeats = 1): this {
    this.lastRepeatCount = 0;
    this.repeat(numOfRepeats);
    return this;
  }

  public repeat(numOfRepeats = 1): this {
    // numOfRepeats = typeof numOfRepeats === "undefined" ? 1 : numOfRepeats; // Default handled by parameter
    const notesBufferCopy = this.notes.slice(this.lastRepeatCount);
    for (let r = 0; r < numOfRepeats; r++) {
      for (let i = 0; i < notesBufferCopy.length; i++) {
        const noteToClone = notesBufferCopy[i];
        // Ensure all necessary properties are part of the Note interface for proper cloning
        const noteCopy: Note = this.clone(noteToClone);
        noteCopy.startTime = this.totalDuration;
        noteCopy.stopTime =
          this.totalDuration + noteCopy.duration - noteCopy.articulationGap;
        this.notes.push(noteCopy);
        this.totalDuration += noteCopy.duration;
      }
    }
    return this;
  }

  public resetDuration(): void {
    this.totalDuration = 0;
    for (let i = 0; i < this.notes.length; i++) {
      const note = this.notes[i];
      const duration = this.getDuration(note.rhythm);
      const articulationGap = note.tie
        ? 0
        : duration * this.articulationGapPercentage;

      note.duration = duration;
      note.startTime = this.totalDuration;
      note.stopTime = this.totalDuration + duration - articulationGap;

      if (note.pitch !== false) {
        note.articulationGap = articulationGap;
      }
      this.totalDuration += duration;
    }
  }
}
