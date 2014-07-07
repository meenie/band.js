/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
module.exports = Instrument;

/**
 * Instrument Class - Gets instantiated when `Conductor.createInstrument()` is called.
 *
 * @param name
 * @param pack
 * @param conductor
 * @constructor
 */
function Instrument(name, pack, conductor) {
    // Default to Sine Oscillator
    if (! name) {
        name = 'sine';
    }
    if (! pack) {
        pack = 'oscillators';
    }

    if (typeof conductor.packs.instrument[pack] === 'undefined') {
        throw new Error(pack + ' is not a currently loaded Instrument Pack.');
    }

    /**
     * Helper function to figure out how long a note is
     *
     * @param rhythm
     * @returns {number}
     */
    function getDuration(rhythm) {
        if (typeof conductor.notes[rhythm] === 'undefined') {
            throw new Error(rhythm + ' is not a correct rhythm.');
        }

        return conductor.notes[rhythm] * conductor.tempo / conductor.noteGetsBeat * 10;
    }

    /**
     * Helper function to clone an object
     *
     * @param obj
     * @returns {copy}
     */
    function clone(obj) {
        if (null == obj || "object" != typeof obj) return obj;
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
        }

        return copy;
    }

    
    var instrument = this,
        lastRepeatCount = 0,
        volumeLevel = 1;

    instrument.totalDuration = 0;
    instrument.bufferPosition = 0;
    instrument.instrument = conductor.packs.instrument[pack](name, conductor.audioContext);
    instrument.sounds = [];
    
    /**
     * Set volume level for an instrument
     *
     * @param newVolumeLevel
     */
    instrument.setVolume = function(newVolumeLevel) {
        if (newVolumeLevel > 1) {
            newVolumeLevel = newVolumeLevel / 100;
        }
        volumeLevel = newVolumeLevel;

        return instrument;
    };

    /**
     * Add a note to an instrument
     * @param rhythm
     * @param [pitch] - Comma separated string if more than one pitch
     * @param [tie]
     */
    instrument.note = function(rhythm, pitch, tie) {
        var duration = getDuration(rhythm),
            articulationGap = tie ? 0 : duration * 0.05;

        if (pitch) {
            pitch = pitch.split(',');
            var index = - 1;
            while (++ index < pitch.length) {
                var p = pitch[index];
                p = p.trim();
                if (typeof conductor.pitches[p] === 'undefined') {
                    p = parseFloat(p);
                    if (isNaN(p) || p < 0) {
                        throw new Error(p + ' is not a valid pitch.');
                    }
                }
            }
        }

        instrument.sounds.push({
            pitch: pitch,
            duration: duration,
            articulationGap: articulationGap,
            tie: tie,
            startTime: instrument.totalDuration,
            // Volume needs to be a quarter of the master so it doesn't clip
            volumeLevel: volumeLevel / 4,
            stopTime: instrument.totalDuration + duration - articulationGap
        });

        instrument.totalDuration += duration;

        return instrument;
    };

    /**
     * Add a rest to an instrument
     *
     * @param rhythm
     */
    instrument.rest = function(rhythm) {
        var duration = getDuration(rhythm);

        instrument.sounds.push({
            pitch: false,
            duration: duration,
            articulationGap: 0,
            startTime: instrument.totalDuration,
            stopTime: instrument.totalDuration + duration
        });

        instrument.totalDuration += duration;

        return instrument;
    };

    /**
     * Place where a repeat section should start
     */
    instrument.repeatStart = function() {
        lastRepeatCount = instrument.sounds.length;

        return instrument;
    };

    /**
     * Repeat from beginning
     */
    instrument.repeatFromBeginning = function(numOfRepeats) {
        lastRepeatCount = 0;
        instrument.repeat(numOfRepeats);

        return instrument;
    };

    /**
     * Number of times the section should repeat
     * @param [numOfRepeats] - defaults to 1
     */
    instrument.repeat = function(numOfRepeats) {
        numOfRepeats = typeof numOfRepeats === 'undefined' ? 1 : numOfRepeats;
        var soundsBufferCopy = instrument.sounds.slice(lastRepeatCount);
        for (var r = 0; r < numOfRepeats; r ++) {
            var index = - 1;
            while (++index < soundsBufferCopy.length) {
                var soundCopy = clone(soundsBufferCopy[index]);

                soundCopy.startTime = instrument.totalDuration;
                soundCopy.stopTime = instrument.totalDuration + soundCopy.duration - soundCopy.articulationGap;

                instrument.sounds.push(soundCopy);
                instrument.totalDuration += soundCopy.duration;
            }
        }

        return instrument;
    };
}
