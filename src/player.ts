/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
import type Conductor from "./conductor"; // Use type import
import type Instrument from "./instrument"; // Add Instrument type import
import type {
  IAudioContext,
  IAudioScheduledSourceNode,
  IGainNode,
  IAudioBufferSourceNode, // Added for type checking
} from "standardized-audio-context";

// Define a more specific type for the notes processed by the Player
interface PlayerBufferedNote {
  startTime: number;
  stopTime: number;
  node: IAudioScheduledSourceNode<IAudioContext>;
  gain: IGainNode<IAudioContext>;
  volumeLevel: number;
  tie?: boolean; // From original InstrumentNote
  // Potentially other properties from InstrumentNote if needed during playback
}

export default class Player {
  private conductor: Conductor;
  private bufferTimeout: NodeJS.Timeout | undefined;
  private allNotes: PlayerBufferedNote[];
  private currentPlayTime = 0; // Should be a number representing time
  private totalPlayTime = 0;
  private faded = false;

  public paused = false;
  public playing = false;
  public looping = false;
  public muted = false;

  constructor(conductor: Conductor) {
    this.conductor = conductor;
    this.allNotes = this.bufferNotes();
    this.calculateTotalDuration();
  }

  private reset(resetDuration = false): void {
    // Default to false
    let index = -1;
    const numOfInstruments = this.conductor.instruments.length;
    while (++index < numOfInstruments) {
      const instrument = this.conductor.instruments[index];
      if (resetDuration) {
        instrument.resetDuration();
        instrument.bufferPosition = 0;
      } else {
        // When seeking (not resetting duration), find the appropriate buffer position
        instrument.bufferPosition = this.findBufferPositionForTime(instrument, this.totalPlayTime);
      }
    }

    if (resetDuration) {
      this.calculateTotalDuration();
      this.totalPlayTime =
        this.conductor.percentageComplete * this.conductor.totalDuration;
    }

    index = -1;
    while (++index < this.allNotes.length) {
      if (this.allNotes[index]?.gain) {
        this.allNotes[index].gain.disconnect();
      }
    }
    clearTimeout(this.bufferTimeout);
    this.allNotes = this.bufferNotes();
  }

  private findBufferPositionForTime(instrument: Instrument, targetTime: number): number {
    // Find the first note that ends after the target time
    // This ensures we buffer notes that are still relevant at the target time
    for (let i = 0; i < instrument.notes.length; i++) {
      const note = instrument.notes[i];
      if (note && note.stopTime > targetTime) {
        return i;
      }
    }
    // If no note found (we're past the end), return the end of the array
    return instrument.notes.length;
  }

  private fade(
    direction: "up" | "down",
    cb?: () => void,
    resetVolume = false
  ): void {
    // Direction type is already validated by the type annotation

    const fadeDuration = 0.2;
    this.faded = direction === "down";

    if (direction === "up") {
      this.conductor.masterVolume.gain.linearRampToValueAtTime(
        0,
        this.conductor.audioContext.currentTime
      );
      this.conductor.masterVolume.gain.linearRampToValueAtTime(
        this.conductor.masterVolumeLevel,
        this.conductor.audioContext.currentTime + fadeDuration
      );
    } else {
      this.conductor.masterVolume.gain.linearRampToValueAtTime(
        this.conductor.masterVolumeLevel,
        this.conductor.audioContext.currentTime
      );
      this.conductor.masterVolume.gain.linearRampToValueAtTime(
        0,
        this.conductor.audioContext.currentTime + fadeDuration
      );
    }

    setTimeout(() => {
      if (typeof cb === "function") {
        cb.call(this); // 'this' now refers to Player instance
      }
      if (resetVolume) {
        this.faded = !this.faded;
        this.conductor.masterVolume.gain.linearRampToValueAtTime(
          this.conductor.masterVolumeLevel,
          this.conductor.audioContext.currentTime
        );
      }
    }, fadeDuration * 1000);
  }

  private calculateTotalDuration(): void {
    let index = -1;
    let totalDuration = 0;
    while (++index < this.conductor.instruments.length) {
      const instrument = this.conductor.instruments[index];
      if (instrument.totalDuration > totalDuration) {
        totalDuration = instrument.totalDuration;
      }
    }
    this.conductor.totalDuration = totalDuration;
  }

  private bufferNotes(): PlayerBufferedNote[] {
    const notes: PlayerBufferedNote[] = [];
    let index = -1;
    const bufferSize = this.conductor.noteBufferLength;

    while (++index < this.conductor.instruments.length) {
      const instrument = this.conductor.instruments[index];
      let bufferCount = bufferSize;
      let index2 = -1;
      while (++index2 < bufferCount) {
        const note = instrument.notes[instrument.bufferPosition + index2];
        if (typeof note === "undefined") {
          break;
        }
        const {
          pitch,
          startTime: originalNoteStartTime,
          stopTime: originalNoteStopTime,
          volumeLevel,
          tie,
        } = note;
        const currentVolumeLevel =
          typeof volumeLevel === "number" ? volumeLevel : 1;

        if (originalNoteStopTime <= this.totalPlayTime) {
          bufferCount++;
          continue;
        }
        if (pitch === false) {
          // Explicit check for rest
          continue;
        }

        const gain = this.conductor.audioContext.createGain();
        gain.connect(this.conductor.masterVolume);
        gain.gain.value = currentVolumeLevel;

        let resolvedPitchValue: number | undefined = undefined;
        // At this point, `pitch` cannot be `false` due to the earlier check.
        // We only proceed if it's a pitched instrument and pitch is actually defined.
        if (instrument.getPackName() !== "noises" && pitch !== undefined) {
          const firstPitch = Array.isArray(pitch) ? pitch[0] : pitch;
          // Ensure firstPitch is not false before proceeding, though the outer check should cover this.
          // This is more of a type refinement for TypeScript.
          if (typeof firstPitch === "string") {
            resolvedPitchValue =
              this.conductor.pitches[firstPitch.trim()] ||
              Number.parseFloat(firstPitch);
          } else {
            resolvedPitchValue = firstPitch; // It's already a number
          }
          if (Number.isNaN(resolvedPitchValue)) resolvedPitchValue = undefined; // Ensure it's a valid number or undefined
        }
        // For noises, 'pitch' (which is the noise type string) is handled by the pack, so resolvedPitchValue remains undefined.

        const audioNode = instrument.instrument.createNote(
          gain,
          resolvedPitchValue
        );

        notes.push({
          startTime: originalNoteStartTime,
          stopTime: originalNoteStopTime,
          node: audioNode,
          gain: gain,
          volumeLevel: currentVolumeLevel,
          tie: tie,
        });
      }
      instrument.bufferPosition += bufferCount;
    }
    return notes;
  }

  private totalPlayTimeCalculator(): void {
    if (!this.paused && this.playing) {
      if (this.conductor.totalDuration < this.totalPlayTime) {
        this.stop(false);
        if (this.looping) {
          this.play();
        } else {
          this.conductor.onFinishedCallback();
        }
      } else {
        this.updateTotalPlayTime();
        setTimeout(() => this.totalPlayTimeCalculator(), 1000 / 60);
      }
    }
  }

  private updateTotalPlayTime(): void {
    this.totalPlayTime +=
      this.conductor.audioContext.currentTime - this.currentPlayTime;
    const seconds = Math.round(this.totalPlayTime);
    if (seconds !== this.conductor.currentSeconds) {
      // This line was already correct in the provided file content, but ensuring it stays !==
      setTimeout(() => {
        this.conductor.onTickerCallback(seconds);
      }, 1);
      this.conductor.currentSeconds = seconds;
    }
    this.conductor.percentageComplete =
      this.totalPlayTime / this.conductor.totalDuration;
    this.currentPlayTime = this.conductor.audioContext.currentTime;
  }

  public play(): void {
    this.playing = true;
    this.paused = false;
    this.currentPlayTime = this.conductor.audioContext.currentTime;
    this.totalPlayTimeCalculator();

    const timeOffset =
      this.conductor.audioContext.currentTime - this.totalPlayTime;
    const playNotesInternal = (notesToPlay: PlayerBufferedNote[]) => {
      let index = -1;
      while (++index < notesToPlay.length) {
        const note = notesToPlay[index];
        let { startTime, stopTime } = note; // Use let for reassignment

        if (!note.tie) {
          if (startTime > 0) {
            startTime -= 0.001;
          }
          stopTime += 0.001;
          const noteVolume =
            typeof note.volumeLevel === "number" ? note.volumeLevel : 1;
          note.gain.gain.setValueAtTime(0.0, startTime);
          note.gain.gain.linearRampToValueAtTime(noteVolume, startTime + 0.001);
          note.gain.gain.setValueAtTime(noteVolume, note.stopTime - 0.001);
          note.gain.gain.linearRampToValueAtTime(0.0, note.stopTime);
        }

        const noteAbsoluteStartTime = note.startTime;
        const noteAbsoluteStopTime = note.stopTime;
        const noteOverallDuration =
          noteAbsoluteStopTime - noteAbsoluteStartTime;

        let scheduleTimeInContext: number;
        let playOffsetInNode = 0;

        if (noteAbsoluteStartTime < this.totalPlayTime) {
          // Note started before current seek time
          if (noteAbsoluteStopTime <= this.totalPlayTime) {
            // Note already completely finished
            continue;
          }
          // Note is in progress
          scheduleTimeInContext = this.conductor.audioContext.currentTime; // Start playing this part now
          playOffsetInNode = this.totalPlayTime - noteAbsoluteStartTime; // How far into the note's own buffer we are
        } else {
          // Note starts at or after current seek time
          scheduleTimeInContext =
            this.conductor.audioContext.currentTime +
            (noteAbsoluteStartTime - this.totalPlayTime);
          playOffsetInNode = 0; // Start from the beginning of the note's buffer
        }

        // Safety clamp: Ensure scheduleTimeInContext is not in the past
        if (scheduleTimeInContext < this.conductor.audioContext.currentTime) {
          const adjustment =
            this.conductor.audioContext.currentTime - scheduleTimeInContext;
          scheduleTimeInContext = this.conductor.audioContext.currentTime;
          // If it's an AudioBufferSourceNode, we need to advance its offset
          if ("buffer" in note.node && note.node.buffer !== null) {
            playOffsetInNode += adjustment;
          }
        }

        const remainingDurationToPlay = noteOverallDuration - playOffsetInNode;
        if (remainingDurationToPlay <= 0) {
          continue; // No playable part left
        }

        const scheduleStopTimeInContext =
          scheduleTimeInContext + remainingDurationToPlay;

        if (note.node && typeof note.node.start === "function") {
          try {
            if ("buffer" in note.node && note.node.buffer !== null) {
              // For AudioBufferSourceNode, use offset
              (note.node as IAudioBufferSourceNode<IAudioContext>).start(
                scheduleTimeInContext,
                playOffsetInNode
              );
            } else {
              // For OscillatorNode, offset is not applicable in the same way.
              // If playOffsetInNode > 0, it implies we've seeked into an oscillator's duration.
              // The oscillator will effectively restart from its beginning at scheduleTimeInContext.
              // This is standard behavior for oscillators.
              note.node.start(scheduleTimeInContext);
            }
            note.node.stop(scheduleStopTimeInContext);
          } catch (e) {
            console.error("Error scheduling note:", {
              noteStartTime: noteAbsoluteStartTime,
              noteStopTime: noteAbsoluteStopTime,
              totalPlayTime: this.totalPlayTime,
              scheduleTime: scheduleTimeInContext,
              playOffset: playOffsetInNode,
              remainingDuration: remainingDurationToPlay,
              audioCurrentTime: this.conductor.audioContext.currentTime,
              error: e,
            });
          }
        }
      }
    };

    const bufferUpInternal = () => {
      this.bufferTimeout = setTimeout(() => {
        if (this.playing && !this.paused) {
          const newNotes = this.bufferNotes();
          if (newNotes.length > 0) {
            playNotesInternal(newNotes);
            this.allNotes = this.allNotes.concat(newNotes);
            bufferUpInternal();
          }
        }
      }, this.conductor.tempo * 5000);
    };

    playNotesInternal(this.allNotes);
    bufferUpInternal();

    if (this.faded && !this.muted) {
      this.fade("up");
    }
  }

  public stop(fadeOut = true): void {
    this.playing = false;
    this.conductor.currentSeconds = 0;
    this.conductor.percentageComplete = 0;

    if (fadeOut && !this.muted) {
      this.fade(
        "down",
        () => {
          this.totalPlayTime = 0;
          this.reset();
          setTimeout(() => {
            this.conductor.onTickerCallback(this.conductor.currentSeconds);
          }, 1);
        },
        true
      );
    } else {
      this.totalPlayTime = 0;
      this.reset();
      setTimeout(() => {
        this.conductor.onTickerCallback(this.conductor.currentSeconds);
      }, 1);
    }
  }

  public pause(): void {
    this.paused = true;
    this.updateTotalPlayTime();
    if (this.muted) {
      this.reset();
    } else {
      this.fade("down", () => {
        this.reset();
      });
    }
  }

  public loop(val: boolean): void {
    this.looping = val; // Direct boolean assignment
  }

  public setTime(newTime: number | string): void {
    // Can be number (seconds) or string to parse
    this.totalPlayTime =
      typeof newTime === "string" ? Number.parseInt(newTime) : newTime;
    this.reset();
    if (this.playing && !this.paused) {
      this.play();
    }
  }

  public resetTempo(): void {
    this.reset(true);
    if (this.playing && !this.paused) {
      this.play();
    }
  }

  public mute(cb?: () => void): void {
    this.muted = true;
    this.fade("down", cb);
  }

  public unmute(cb?: () => void): void {
    this.muted = false;
    this.fade("up", cb);
  }
}
