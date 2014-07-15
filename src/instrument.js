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
        if (null === obj || "object" != typeof obj) {
            return obj;
        }
        var copy = obj.constructor();
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) {
                copy[attr] = obj[attr];
            }
        }

        return copy;
    }

    
    var instrument = this,
        lastRepeatCount = 0,
        volumeLevel = 1,
        articulationGapPercentage = 0.05;

    instrument.totalDuration = 0;
    instrument.bufferPosition = 0;
    instrument.instrument = conductor.packs.instrument[pack](name, conductor.audioContext);
    instrument.notes = [];
    
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
            articulationGap = tie ? 0 : duration * articulationGapPercentage;

        if (pitch) {
            pitch = pitch.split(',');
            var index = -1;
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

        instrument.notes.push({
            rhythm: rhythm,
            pitch: pitch,
            duration: duration,
            articulationGap: articulationGap,
            tie: tie,
            startTime: instrument.totalDuration,
            stopTime: instrument.totalDuration + duration - articulationGap,
            // Volume needs to be a quarter of the master so it doesn't clip
            volumeLevel: volumeLevel / 4
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

        instrument.notes.push({
            rhythm: rhythm,
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
        lastRepeatCount = instrument.notes.length;

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
        var notesBufferCopy = instrument.notes.slice(lastRepeatCount);
        for (var r = 0; r < numOfRepeats; r ++) {
            var index = -1;
            while (++index < notesBufferCopy.length) {
                var noteCopy = clone(notesBufferCopy[index]);

                noteCopy.startTime = instrument.totalDuration;
                noteCopy.stopTime = instrument.totalDuration + noteCopy.duration - noteCopy.articulationGap;

                instrument.notes.push(noteCopy);
                instrument.totalDuration += noteCopy.duration;
            }
        }

        return instrument;
    };

    /**
     * Reset the duration, start, and stop time of each note.
     */
    instrument.resetDuration = function() {
        var index = -1,
            numOfNotes = instrument.notes.length;

        instrument.totalDuration = 0;

        while (++index < numOfNotes) {
            var note = instrument.notes[index],
                duration = getDuration(note.rhythm),
                articulationGap = note.tie ? 0 : duration * articulationGapPercentage;

            note.duration = getDuration(note.rhythm);
            note.startTime = instrument.totalDuration;
            note.stopTime = instrument.totalDuration + duration - articulationGap;

            if (note.pitch !== false) {
                note.articulationGap = articulationGap;
            }

            instrument.totalDuration += duration;
        }
    };
}
