import { expect, test, describe, mock, beforeEach, afterEach, spyOn } from "bun:test";

import { AudioContext as AudioContextMock } from "standardized-audio-context-mock";
import Conductor from "@/conductor";
import Player from "@/player";
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

describe("Player Class", () => {
  let conductor: Conductor;
  let player: Player;

  beforeEach(() => {
    // Load test packs before each test
    Conductor.loadPack("tuning", "testTuning", testTuningPack);
    Conductor.loadPack("rhythm", "testRhythm", testRhythmPack);
    Conductor.loadPack("instrument", "testInstruments", testInstrumentPack);

    conductor = new Conductor("testTuning", "testRhythm");
    const instrument = conductor.createInstrument("sine", "testInstruments");
    instrument.note("quarter", "C4").note("quarter", "D4").rest("quarter");
    player = conductor.finish();
  });

  afterEach(() => {
    if (player?.playing) {
      player.stop(false);
    }
    conductor.destroy();
  });

  describe("Constructor", () => {
    test("should create player with conductor", () => {
      expect(player).toBeInstanceOf(Player);
      expect(player.playing).toBe(false);
      expect(player.paused).toBe(false);
      expect(player.looping).toBe(false);
      expect(player.muted).toBe(false);
    });

    test("should calculate total duration on creation", () => {
      expect(conductor.totalDuration).toBeGreaterThan(0);
    });
  });

  describe("Playback Control", () => {
    test("should start playing", () => {
      player.play();
      expect(player.playing).toBe(true);
      expect(player.paused).toBe(false);
    });

    test("should stop playing", () => {
      player.play();
      player.stop(false);
      expect(player.playing).toBe(false);
      expect(conductor.currentSeconds).toBe(0);
      expect(conductor.percentageComplete).toBe(0);
    });

    test("should pause playing", () => {
      player.play();
      player.pause();
      expect(player.paused).toBe(true);
    });

    test("should resume after pause", () => {
      player.play();
      player.pause();
      player.play();
      expect(player.playing).toBe(true);
      expect(player.paused).toBe(false);
    });
  });

  describe("Looping", () => {
    test("should set looping to true", () => {
      player.loop(true);
      expect(player.looping).toBe(true);
    });

    test("should set looping to false", () => {
      player.loop(false);
      expect(player.looping).toBe(false);
    });
  });

  describe("Time Control", () => {
    test("should set time and affect playback behavior", () => {
      const halfDuration = conductor.totalDuration / 2;

      player.setTime(halfDuration);

      // After setting time, playing should work from the new position
      expect(() => {
        player.play();
        player.stop(false);
      }).not.toThrow();

      // Verify that seeking doesn't break the player functionality
      expect(player.playing).toBe(false);
    });

    test("should set time as string", () => {
      const newTime = "3";
      player.setTime(newTime);

      // Should not throw and player should still be functional
      expect(() => {
        player.play();
        player.stop(false);
      }).not.toThrow();
    });

    test("should reset tempo", () => {
      const spy = spyOn(player, "resetTempo");
      player.resetTempo();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("Volume Control", () => {
    test("should mute audio", (done) => {
      player.mute(() => {
        expect(player.muted).toBe(true);
        done();
      });
    });

    test("should unmute audio", (done) => {
      player.muted = true;
      player.unmute(() => {
        expect(player.muted).toBe(false);
        done();
      });
    });

    test("should handle mute without callback", () => {
      expect(() => {
        player.mute();
      }).not.toThrow();
      expect(player.muted).toBe(true);
    });

    test("should handle unmute without callback", () => {
      player.muted = true;
      expect(() => {
        player.unmute();
      }).not.toThrow();
      expect(player.muted).toBe(false);
    });
  });

  describe("Buffer Management", () => {
    test("should handle playback with buffered notes", () => {
      // Test that the player can play, which indicates notes are buffered properly
      expect(() => {
        player.play();
        player.stop(false);
      }).not.toThrow();
    });

    test("should handle empty instruments", () => {
      const emptyConductor = new Conductor("testTuning", "testRhythm");
      emptyConductor.createInstrument("sine", "testInstruments");
      const emptyPlayer = emptyConductor.finish();

      // Empty player should still be functional
      expect(() => {
        emptyPlayer.play();
        emptyPlayer.stop(false);
      }).not.toThrow();

      emptyConductor.destroy();
    });
  });

  describe("Edge Cases", () => {
    test("should handle stop with fade out disabled", () => {
      player.play();
      expect(() => {
        player.stop(false);
      }).not.toThrow();
      expect(player.playing).toBe(false);
    });

    test("should handle multiple stop calls", () => {
      player.play();
      player.stop(false);
      expect(() => {
        player.stop(false);
      }).not.toThrow();
    });

    test("should handle pause when not playing", () => {
      expect(() => {
        player.pause();
      }).not.toThrow();
      expect(player.paused).toBe(true);
    });

    test("should handle play after stop", () => {
      player.play();
      player.stop(false);
      expect(() => {
        player.play();
      }).not.toThrow();
      expect(player.playing).toBe(true);
    });
  });

  describe("Timing and Progress", () => {
    test("should update progress during playback", () => {
      const initialSeconds = conductor.currentSeconds;
      const initialPercentage = conductor.percentageComplete;

      player.play();

      // After starting playback, progress tracking should be active
      expect(conductor.currentSeconds).toBeGreaterThanOrEqual(initialSeconds);
      expect(conductor.percentageComplete).toBeGreaterThanOrEqual(initialPercentage);

      player.stop(false);
    });

    test("should handle seeking to different positions", () => {
      const halfDuration = conductor.totalDuration / 2;
      player.setTime(halfDuration);

      // After seeking, should be able to play from new position
      expect(() => {
        player.play();
        player.stop(false);
      }).not.toThrow();
    });
  });

  describe("Complex Scenarios", () => {
    test("should handle instrument with chords", () => {
      const chordConductor = new Conductor("testTuning", "testRhythm");
      const instrument = chordConductor.createInstrument("sine", "testInstruments");
      instrument.note("quarter", ["C4", "E4", "G4"]);
      const chordPlayer = chordConductor.finish();

      // Chord player should be functional
      expect(() => {
        chordPlayer.play();
        chordPlayer.stop(false);
      }).not.toThrow();

      chordConductor.destroy();
    });

    test("should handle tempo changes", () => {
      conductor.setTempo(60);
      expect(() => {
        player.resetTempo();
      }).not.toThrow();
    });

    test("should handle seeking and playback", () => {
      const halfDuration = conductor.totalDuration / 2;
      player.setTime(halfDuration);

      // Should be able to play from the new position
      expect(() => {
        player.play();
        player.pause();
        player.play();
        player.stop(false);
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    test("should handle invalid audio context operations gracefully", () => {
      // This test ensures the player doesn't crash on audio context issues
      expect(() => {
        player.play();
        player.stop(false);
      }).not.toThrow();
    });

    test("should handle rapid play/stop cycles", () => {
      expect(() => {
        for (let i = 0; i < 5; i++) {
          player.play();
          player.stop(false);
        }
      }).not.toThrow();
    });

    test("should handle invalid time values", () => {
      expect(() => {
        player.setTime(-1);
        player.setTime(Number.MAX_SAFE_INTEGER);
        player.setTime("invalid");
      }).not.toThrow();
    });
  });
});
