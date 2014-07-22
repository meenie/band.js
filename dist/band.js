!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.BandJS=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/*
 * Web Audio API AudioContext shim
 */
(function (definition) {
    if (typeof exports === "object") {
        module.exports = definition();
    }
})(function () {
  return window.AudioContext || window.webkitAudioContext;
});

},{}],2:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
module.exports = Conductor;

var packs = {
    instrument: {},
    rhythm: {},
    tuning: {}
};

/**
 * Conductor Class - This gets instantiated when `new BandJS()` is called
 *
 * @param tuning
 * @param rhythm
 * @constructor
 */
function Conductor(tuning, rhythm) {
    if (! tuning) {
        tuning = 'equalTemperament';
    }

    if (! rhythm) {
        rhythm = 'northAmerican';
    }

    if (typeof packs.tuning[tuning] === 'undefined') {
        throw new Error(tuning + ' is not a valid tuning pack.');
    }

    if (typeof packs.rhythm[rhythm] === 'undefined') {
        throw new Error(rhythm + ' is not a valid rhythm pack.');
    }

    var conductor = this,
        player,
        noop = function() {},
        AudioContext = _dereq_('audiocontext'),
        signatureToNoteLengthRatio = {
            2: 6,
            4: 3,
            8: 4.50
        };

    conductor.packs = packs;
    conductor.pitches = packs.tuning[tuning];
    conductor.notes = packs.rhythm[rhythm];
    conductor.audioContext = new AudioContext();
    conductor.masterVolumeLevel = null;
    conductor.masterVolume = conductor.audioContext.createGain();
    conductor.masterVolume.connect(conductor.audioContext.destination);
    conductor.beatsPerBar = null;
    conductor.noteGetsBeat = null;
    conductor.tempo = null;
    conductor.instruments = [];
    conductor.totalDuration = 0;
    conductor.currentSeconds = 0;
    conductor.percentageComplete = 0;
    conductor.noteBufferLength = 20;
    conductor.onTickerCallback = noop;
    conductor.onFinishedCallback = noop;
    conductor.onDurationChangeCallback = noop;

    /**
     * Use JSON to load in a song to be played
     *
     * @param json
     */
    conductor.load = function(json) {
        // Clear out any previous song
        if (conductor.instruments.length > 0) {
            conductor.destroy();
        }

        if (! json) {
            throw new Error('JSON is required for this method to work.');
        }
        // Need to have at least instruments and notes
        if (typeof json.instruments === 'undefined') {
            throw new Error('You must define at least one instrument');
        }
        if (typeof json.notes === 'undefined') {
            throw new Error('You must define notes for each instrument');
        }

        // Shall we set a time signature?
        if (typeof json.timeSignature !== 'undefined') {
            conductor.setTimeSignature(json.timeSignature[0], json.timeSignature[1]);
        }

        // Maybe some tempo?
        if (typeof json.tempo !== 'undefined') {
            conductor.setTempo(json.tempo);
        }

        // Lets create some instruments
        var instrumentList = {};
        for (var instrument in json.instruments) {
            if (! json.instruments.hasOwnProperty(instrument)) {
                continue;
            }

            instrumentList[instrument] = conductor.createInstrument(
                json.instruments[instrument].name,
                json.instruments[instrument].pack
            );
        }

        // Now lets add in each of the notes
        for (var inst in json.notes) {
            if (! json.notes.hasOwnProperty(inst)) {
                continue;
            }
            var index = -1;
            while (++ index < json.notes[inst].length) {
                var note = json.notes[inst][index];
                // Use shorthand if it's a string
                if (typeof note === 'string') {
                    var noteParts = note.split('|');
                    if ('rest' === noteParts[1]) {
                        instrumentList[inst].rest(noteParts[0]);
                    } else {
                        instrumentList[inst].note(noteParts[0], noteParts[1], noteParts[2]);
                    }
                    // Otherwise use longhand
                } else {
                    if ('rest' === note.type) {
                        instrumentList[inst].rest(note.rhythm);
                    } else if ('note' === note.type) {
                        instrumentList[inst].note(note.rhythm, note.pitch, note.tie);
                    }
                }
            }
        }

        // Looks like we are done, lets press it.
        return conductor.finish();
    };

    /**
     * Create a new instrument
     *
     * @param [name] - defaults to sine
     * @param [pack] - defaults to oscillators
     */
    conductor.createInstrument = function(name, pack) {
        var Instrument = _dereq_('./instrument.js'),
            instrument = new Instrument(name, pack, conductor);
        conductor.instruments.push(instrument);

        return instrument;
    };

    /**
     * Needs to be called after all the instruments have been filled with notes.
     * It will figure out the total duration of the song based on the longest
     * duration out of all the instruments.  It will then pass back the Player Object
     * which is used to control the music (play, stop, pause, loop, volume, tempo)
     *
     * It returns the Player object.
     */
    conductor.finish = function() {
        var Player = _dereq_('./player.js');
        player = new Player(conductor);

        return player;
    };

    /**
     * Remove all instruments and recreate AudioContext
     */
    conductor.destroy = function() {
        conductor.audioContext = new AudioContext();
        conductor.instruments.length = 0;
        conductor.masterVolume = conductor.audioContext.createGain();
        conductor.masterVolume.connect(conductor.audioContext.destination);
    };

    /**
     * Set Master Volume
     */
    conductor.setMasterVolume = function(volume) {
        if (volume > 1) {
            volume = volume / 100;
        }
        conductor.masterVolumeLevel = volume;
        conductor.masterVolume.gain.setValueAtTime(volume, conductor.audioContext.currentTime);
    };

    /**
     * Grab the total duration of a song
     *
     * @returns {number}
     */
    conductor.getTotalSeconds = function() {
        return Math.round(conductor.totalDuration);
    };

    /**
     * Sets the ticker callback function. This function will be called
     * every time the current seconds has changed.
     *
     * @param cb function
     */
    conductor.setTickerCallback = function(cb) {
        if (typeof cb !== 'function') {
            throw new Error('Ticker must be a function.');
        }

        conductor.onTickerCallback = cb;
    };

    /**
     * Sets the time signature for the music. Just like in notation 4/4 time would be setTimeSignature(4, 4);
     * @param top - Number of beats per bar
     * @param bottom - What note type has the beat
     */
    conductor.setTimeSignature = function(top, bottom) {
        if (typeof signatureToNoteLengthRatio[bottom] === 'undefined') {
            throw new Error('The bottom time signature is not supported.');
        }

        // Not used at the moment, but will be handy in the future.
        conductor.beatsPerBar = top;
        conductor.noteGetsBeat = signatureToNoteLengthRatio[bottom];
    };

    /**
     * Sets the tempo
     *
     * @param t
     */
    conductor.setTempo = function(t) {
        conductor.tempo = 60 / t;

        // If we have a player instance, we need to recalculate duration after resetting the tempo.
        if (player) {
            player.resetTempo();
            conductor.onDurationChangeCallback();
        }
    };

    /**
     * Set a callback to fire when the song is finished
     *
     * @param cb
     */
    conductor.setOnFinishedCallback = function(cb) {
        if (typeof cb !== 'function') {
            throw new Error('onFinished callback must be a function.');
        }

        conductor.onFinishedCallback = cb;
    };

    /**
     * Set a callback to fire when duration of a song changes
     *
     * @param cb
     */
    conductor.setOnDurationChangeCallback = function(cb) {
        if (typeof cb !== 'function') {
            throw new Error('onDurationChanged callback must be a function.');
        }

        conductor.onDurationChangeCallback = cb;
    };

    /**
     * Set the number of notes that are buffered every (tempo / 60 * 5) seconds.
     * It's set to 20 notes by default.
     *
     * **WARNING** The higher this is, the more memory is used and can crash your browser.
     *             If notes are being dropped, you can increase this, but be weary of
     *             used memory.
     *
     * @param {Integer} len
     */
    conductor.setNoteBufferLength = function(len) {
        conductor.noteBufferLength = len;
    };

    conductor.setMasterVolume(100);
    conductor.setTempo(120);
    conductor.setTimeSignature(4, 4);
}

Conductor.loadPack = function(type, name, data) {
    if (['tuning', 'rhythm', 'instrument'].indexOf(type) === -1) {
        throw new Error(type + ' is not a valid Pack Type.');
    }

    if (typeof packs[type][name] !== 'undefined') {
        throw new Error('A(n) ' + type + ' pack with the name "' + name + '" has already been loaded.');
    }

    packs[type][name] = data;
};

},{"./instrument.js":5,"./player.js":7,"audiocontext":1}],3:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
module.exports = NoisesInstrumentPack;

/**
 * Noises Instrument Pack
 *
 * Adapted from: https://github.com/zacharydenton/noise.js
 *
 * @param name
 * @param audioContext
 * @returns {{createNote: createNote}}
 * @constructor
 */
function NoisesInstrumentPack(name, audioContext) {
    var types = [
        'white',
        'pink',
        'brown',
        'brownian',
        'red'
    ];

    if (types.indexOf(name) === -1) {
        throw new Error(name + ' is not a valid noise sound');
    }

    return {
        createNote: function(destination) {
            switch (name) {
                case 'white':
                    return createWhiteNoise(destination);
                case 'pink':
                    return createPinkNoise(destination);
                case 'brown':
                case 'brownian':
                case 'red':
                    return createBrownianNoise(destination);
            }
        }
    };

    function createWhiteNoise(destination) {
        var bufferSize = 2 * audioContext.sampleRate,
            noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
            output = noiseBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        var whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        whiteNoise.connect(destination);

        return whiteNoise;
    }

    function createPinkNoise(destination) {
        var bufferSize = 2 * audioContext.sampleRate,
            noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
            output = noiseBuffer.getChannelData(0),
            b0, b1, b2, b3, b4, b5, b6;

        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        for (var i = 0; i < bufferSize; i++) {
            var white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
            output[i] *= 0.11;
            b6 = white * 0.115926;
        }

        var pinkNoise = audioContext.createBufferSource();
        pinkNoise.buffer = noiseBuffer;
        pinkNoise.loop = true;

        pinkNoise.connect(destination);

        return pinkNoise;
    }

    function createBrownianNoise(destination) {
        var bufferSize = 2 * audioContext.sampleRate,
            noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate),
            output = noiseBuffer.getChannelData(0),
            lastOut = 0.0;
        for (var i = 0; i < bufferSize; i++) {
            var white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5;
        }

        var brownianNoise = audioContext.createBufferSource();
        brownianNoise.buffer = noiseBuffer;
        brownianNoise.loop = true;

        brownianNoise.connect(destination);

        return brownianNoise;
    }
}

},{}],4:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
module.exports = OscillatorInstrumentPack;

/**
 * Oscillator Instrument Pack
 *
 * @param name
 * @param audioContext
 * @returns {{createNote: createNote}}
 * @constructor
 */
function OscillatorInstrumentPack(name, audioContext) {
    var types = ['sine', 'square', 'sawtooth', 'triangle'];

    if (types.indexOf(name) === -1) {
        throw new Error(name + ' is not a valid Oscillator type');
    }

    return {
        createNote: function(destination, frequency) {
            var o = audioContext.createOscillator();

            // Connect note to volume
            o.connect(destination);
            // Set pitch type
            o.type = name;
            // Set frequency
            o.frequency.value = frequency;

            return o;
        }
    };
}

},{}],5:[function(_dereq_,module,exports){
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

},{}],6:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */

/**
 * @type {BandJS}
 */
module.exports = _dereq_('./conductor.js');

module.exports.loadPack('instrument', 'noises', _dereq_('./instrument-packs/noises.js'));
module.exports.loadPack('instrument', 'oscillators', _dereq_('./instrument-packs/oscillators.js'));
module.exports.loadPack('rhythm', 'northAmerican', _dereq_('./rhythm-packs/north-american.js'));
module.exports.loadPack('rhythm', 'european', _dereq_('./rhythm-packs/european.js'));
module.exports.loadPack('tuning', 'equalTemperament', _dereq_('./tuning-packs/equal-temperament.js'));

},{"./conductor.js":2,"./instrument-packs/noises.js":3,"./instrument-packs/oscillators.js":4,"./rhythm-packs/european.js":8,"./rhythm-packs/north-american.js":9,"./tuning-packs/equal-temperament.js":10}],7:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */
module.exports = Player;

/**
 * Player Class - This gets instantiated by the Conductor class when `Conductor.finish()` is called
 *
 * @param conductor
 * @constructor
 */
function Player(conductor) {
    var player = this,
        bufferTimeout,
        allNotes = bufferNotes(),
        currentPlayTime,
        totalPlayTime = 0,
        faded = false;

    calculateTotalDuration();

    /**
     * Helper function to stop all notes and
     * then re-buffers them
     *
     * @param {Boolean} [resetDuration]
     */
    function reset(resetDuration) {
        // Reset the buffer position of all instruments
        var index = -1,
            numOfInstruments = conductor.instruments.length;
        while (++index < numOfInstruments) {
            var instrument = conductor.instruments[index];

            if (resetDuration) {
                instrument.resetDuration();
            }
            instrument.bufferPosition = 0;
        }

        // If we are reseting the duration, we need to figure out the new total duration.
        // Also set the totalPlayTime to the current percentage done of the new total duration.
        if (resetDuration) {
            calculateTotalDuration();
            totalPlayTime = conductor.percentageComplete * conductor.totalDuration;
        }

        index = -1;
        while (++index < allNotes.length) {
            allNotes[index].gain.disconnect();
        }

        clearTimeout(bufferTimeout);

        allNotes = bufferNotes();
    }

    /**
     * Helper function to fade up/down master volume
     *
     * @param direction - up or down
     * @param [cb] - Callback function fired after the transition is completed
     * @param [resetVolume] - Reset the volume back to it's original level
     */
    function fade(direction, cb, resetVolume) {
        if (typeof resetVolume === 'undefined') {
            resetVolume = false;
        }
        if ('up' !== direction && 'down' !== direction) {
            throw new Error('Direction must be either up or down.');
        }

        var fadeDuration = 0.2;

        faded = direction === 'down';

        if (direction === 'up') {
            conductor.masterVolume.gain.linearRampToValueAtTime(0, conductor.audioContext.currentTime);
            conductor.masterVolume.gain.linearRampToValueAtTime(conductor.masterVolumeLevel, conductor.audioContext.currentTime + fadeDuration);
        } else {
            conductor.masterVolume.gain.linearRampToValueAtTime(conductor.masterVolumeLevel, conductor.audioContext.currentTime);
            conductor.masterVolume.gain.linearRampToValueAtTime(0, conductor.audioContext.currentTime + fadeDuration);
        }

        setTimeout(function() {
            if (typeof cb === 'function') {
                cb.call(player);
            }

            if (resetVolume) {
                faded = ! faded;
                conductor.masterVolume.gain.linearRampToValueAtTime(conductor.masterVolumeLevel, conductor.audioContext.currentTime);
            }
        }, fadeDuration * 1000);
    }

    /**
     * Calculates the total duration of a song based on the longest duration of all instruments.
     */
    function calculateTotalDuration() {
        var index = -1;
        var totalDuration = 0;
        while (++index < conductor.instruments.length) {
            var instrument = conductor.instruments[index];
            if (instrument.totalDuration > totalDuration) {
                totalDuration = instrument.totalDuration;
            }
        }

        conductor.totalDuration = totalDuration;
    }

    /**
     * Grabs a set of notes based on the current time and what the Buffer Size is.
     * It will also skip any notes that have a start time less than the
     * total play time.
     *
     * @returns {Array}
     */
    function bufferNotes() {
        var notes = [],
            index = -1,
            bufferSize = conductor.noteBufferLength;

        while (++index < conductor.instruments.length) {
            var instrument = conductor.instruments[index];
            // Create volume for this instrument
            var bufferCount = bufferSize;
            var index2 = -1;
            while (++index2 < bufferCount) {
                var note = instrument.notes[instrument.bufferPosition + index2];

                if (typeof note === 'undefined') {
                    break;
                }

                var pitch = note.pitch,
                    startTime = note.startTime,
                    stopTime = note.stopTime,
                    volumeLevel = note.volumeLevel;

                if (stopTime < totalPlayTime) {
                    bufferCount ++;
                    continue;
                }

                // If pitch is false, then it's a rest and we don't need a note
                if (false === pitch) {
                    continue;
                }

                var gain = conductor.audioContext.createGain();
                // Connect volume gain to the Master Volume;
                gain.connect(conductor.masterVolume);
                gain.gain.value = volumeLevel;

                // If the startTime is less than total play time, we need to start the note
                // in the middle
                if (startTime < totalPlayTime) {
                    startTime = stopTime - totalPlayTime;
                }

                // No pitches defined
                if (typeof pitch === 'undefined') {
                    notes.push({
                        startTime: startTime < totalPlayTime ? stopTime - totalPlayTime : startTime,
                        stopTime: stopTime,
                        node: instrument.instrument.createNote(gain),
                        gain: gain,
                        volumeLevel: volumeLevel
                    });
                } else {
                    var index3 = -1;
                    while (++index3 < pitch.length) {
                        var p = pitch[index3];
                        notes.push({
                            startTime: startTime,
                            stopTime: stopTime,
                            node: instrument.instrument.createNote(gain, conductor.pitches[p.trim()] || parseFloat(p)),
                            gain: gain,
                            volumeLevel: volumeLevel
                        });
                    }
                }
            }
            instrument.bufferPosition += bufferCount;
        }

        // Return array of notes
        return notes;
    }

    function totalPlayTimeCalculator() {
        if (! player.paused && player.playing) {
            if (conductor.totalDuration < totalPlayTime) {
                player.stop(false);
                if (player.looping) {
                    player.play();
                } else  {
                    conductor.onFinishedCallback();
                }
            } else {
                updateTotalPlayTime();
                setTimeout(totalPlayTimeCalculator, 1000 / 60);
            }
        }
    }

    /**
     * Call to update the total play time so far
     */
    function updateTotalPlayTime() {
        totalPlayTime += conductor.audioContext.currentTime - currentPlayTime;
        var seconds = Math.round(totalPlayTime);
        if (seconds != conductor.currentSeconds) {
            // Make callback asynchronous
            setTimeout(function() {
                conductor.onTickerCallback(seconds);
            }, 1);
            conductor.currentSeconds = seconds;
        }
        conductor.percentageComplete = totalPlayTime / conductor.totalDuration;
        currentPlayTime = conductor.audioContext.currentTime;
    }

    player.paused = false;
    player.playing = false;
    player.looping = false;
    player.muted = false;
    
    /**
     * Grabs currently buffered notes and calls their start/stop methods.
     *
     * It then sets up a timer to buffer up the next set of notes based on the
     * a set buffer size.  This will keep going until the song is stopped or paused.
     *
     * It will use the total time played so far as an offset so you pause/play the music
     */
    player.play = function() {
        player.playing = true;
        player.paused = false;
        currentPlayTime = conductor.audioContext.currentTime;
        // Starts calculator which keeps track of total play time
        totalPlayTimeCalculator();
        var timeOffset = conductor.audioContext.currentTime - totalPlayTime,
            playNotes = function(notes) {
                var index = -1;
                while (++index < notes.length) {
                    var note = notes[index];
                    var startTime = note.startTime + timeOffset,
                        stopTime = note.stopTime + timeOffset;

                    /**
                     * If no tie, then we need to introduce a volume ramp up to remove any clipping
                     * as Oscillators have an issue with this when playing a note at full volume.
                     * We also put in a slight ramp down as well.  This only takes up 1/1000 of a second.
                     */
                    if (! note.tie) {
                        if (startTime > 0) {
                            startTime -= 0.001;
                        }
                        stopTime += 0.001;
                        note.gain.gain.setValueAtTime(0.0, startTime);
                        note.gain.gain.linearRampToValueAtTime(note.volumeLevel, startTime + 0.001);
                        note.gain.gain.setValueAtTime(note.volumeLevel, stopTime - 0.001);
                        note.gain.gain.linearRampToValueAtTime(0.0, stopTime);
                    }

                    note.node.start(startTime);
                    note.node.stop(stopTime);
                }
            },
            bufferUp = function() {
                bufferTimeout = setTimeout(function bufferInNewNotes() {
                    if (player.playing && ! player.paused) {
                        var newNotes = bufferNotes();
                        if (newNotes.length > 0) {
                            playNotes(newNotes);
                            allNotes = allNotes.concat(newNotes);
                            bufferUp();
                        }
                    }
                }, conductor.tempo * 5000);
            };

        playNotes(allNotes);
        bufferUp();

        if (faded && ! player.muted) {
            fade('up');
        }
    };
    /**
     * Stop playing all music and rewind the song
     *
     * @param fadeOut boolean - should the song fade out?
     */
    player.stop = function(fadeOut) {
        player.playing = false;
        conductor.currentSeconds = 0;
        conductor.percentageComplete = 0;

        if (typeof fadeOut === 'undefined') {
            fadeOut = true;
        }
        if (fadeOut && ! player.muted) {
            fade('down', function() {
                totalPlayTime = 0;
                reset();
                // Make callback asynchronous
                setTimeout(function() {
                    conductor.onTickerCallback(conductor.currentSeconds);
                }, 1);
            }, true);
        } else {
            totalPlayTime = 0;
            reset();
            // Make callback asynchronous
            setTimeout(function() {
                conductor.onTickerCallback(conductor.currentSeconds);
            }, 1);
        }
    };

    /**
     * Pauses the music, resets the notes,
     * and gets the total time played so far
     */
    player.pause = function() {
        player.paused = true;
        updateTotalPlayTime();
        if (player.muted) {
            reset();
        } else {
            fade('down', function() {
                reset();
            });
        }
    };

    /**
     * Set true if you want the song to loop
     *
     * @param val
     */
    player.loop = function(val) {
        player.looping = !! val;
    };

    /**
     * Set a specific time that the song should start it.
     * If it's already playing, reset and start the song
     * again so it has a seamless jump.
     *
     * @param newTime
     */
    player.setTime = function(newTime) {
        totalPlayTime = parseInt(newTime);
        reset();
        if (player.playing && ! player.paused) {
            player.play();
        }
    };

    /**
     * Reset the tempo for a song. This will trigger a
     * duration reset for each instrument as well.
     */
    player.resetTempo = function() {
        reset(true);
        if (player.playing && ! player.paused) {
            player.play();
        }
    };

    /**
     * Mute all of the music
     *
     * @param cb - Callback function called when music has been muted
     */
    player.mute = function(cb) {
        player.muted = true;
        fade('down', cb);
    };

    /**
     * Unmute all of the music
     *
     * @param cb - Callback function called when music has been unmuted
     */
    player.unmute = function(cb) {
        player.muted = false;
        fade('up', cb);
    };
}

},{}],8:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */

/**
 * European Rhythm Pack
 */
module.exports = {
    semibreve: 1,
    dottedMinim: 0.75,
    minim: 0.5,
    dottedCrotchet: 0.375,
    tripletMinim: 0.33333334,
    crotchet: 0.25,
    dottedQuaver: 0.1875,
    tripletCrotchet: 0.166666667,
    quaver: 0.125,
    dottedSemiquaver: 0.09375,
    tripletQuaver: 0.083333333,
    semiquaver: 0.0625,
    tripletSemiquaver: 0.041666667,
    demisemiquaver: 0.03125
};

},{}],9:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */

/**
 * North American (Canada and USA) Rhythm Pack
 */
module.exports = {
    whole: 1,
    dottedHalf: 0.75,
    half: 0.5,
    dottedQuarter: 0.375,
    tripletHalf: 0.33333334,
    quarter: 0.25,
    dottedEighth: 0.1875,
    tripletQuarter: 0.166666667,
    eighth: 0.125,
    dottedSixteenth: 0.09375,
    tripletEighth: 0.083333333,
    sixteenth: 0.0625,
    tripletSixteenth: 0.041666667,
    thirtySecond: 0.03125
};

},{}],10:[function(_dereq_,module,exports){
/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */

/**
 * Equal Temperament Tuning
 * Source: http://www.phy.mtu.edu/~suits/notefreqs.html
 */
module.exports = {
    'C0': 16.35,
    'C#0': 17.32,
    'Db0': 17.32,
    'D0': 18.35,
    'D#0': 19.45,
    'Eb0': 19.45,
    'E0': 20.60,
    'F0': 21.83,
    'F#0': 23.12,
    'Gb0': 23.12,
    'G0': 24.50,
    'G#0': 25.96,
    'Ab0': 25.96,
    'A0': 27.50,
    'A#0': 29.14,
    'Bb0': 29.14,
    'B0': 30.87,
    'C1': 32.70,
    'C#1': 34.65,
    'Db1': 34.65,
    'D1': 36.71,
    'D#1': 38.89,
    'Eb1': 38.89,
    'E1': 41.20,
    'F1': 43.65,
    'F#1': 46.25,
    'Gb1': 46.25,
    'G1': 49.00,
    'G#1': 51.91,
    'Ab1': 51.91,
    'A1': 55.00,
    'A#1': 58.27,
    'Bb1': 58.27,
    'B1': 61.74,
    'C2': 65.41,
    'C#2': 69.30,
    'Db2': 69.30,
    'D2': 73.42,
    'D#2': 77.78,
    'Eb2': 77.78,
    'E2': 82.41,
    'F2': 87.31,
    'F#2': 92.50,
    'Gb2': 92.50,
    'G2': 98.00,
    'G#2': 103.83,
    'Ab2': 103.83,
    'A2': 110.00,
    'A#2': 116.54,
    'Bb2': 116.54,
    'B2': 123.47,
    'C3': 130.81,
    'C#3': 138.59,
    'Db3': 138.59,
    'D3': 146.83,
    'D#3': 155.56,
    'Eb3': 155.56,
    'E3': 164.81,
    'F3': 174.61,
    'F#3': 185.00,
    'Gb3': 185.00,
    'G3': 196.00,
    'G#3': 207.65,
    'Ab3': 207.65,
    'A3': 220.00,
    'A#3': 233.08,
    'Bb3': 233.08,
    'B3': 246.94,
    'C4': 261.63,
    'C#4': 277.18,
    'Db4': 277.18,
    'D4': 293.66,
    'D#4': 311.13,
    'Eb4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'F#4': 369.99,
    'Gb4': 369.99,
    'G4': 392.00,
    'G#4': 415.30,
    'Ab4': 415.30,
    'A4': 440.00,
    'A#4': 466.16,
    'Bb4': 466.16,
    'B4': 493.88,
    'C5': 523.25,
    'C#5': 554.37,
    'Db5': 554.37,
    'D5': 587.33,
    'D#5': 622.25,
    'Eb5': 622.25,
    'E5': 659.26,
    'F5': 698.46,
    'F#5': 739.99,
    'Gb5': 739.99,
    'G5': 783.99,
    'G#5': 830.61,
    'Ab5': 830.61,
    'A5': 880.00,
    'A#5': 932.33,
    'Bb5': 932.33,
    'B5': 987.77,
    'C6': 1046.50,
    'C#6': 1108.73,
    'Db6': 1108.73,
    'D6': 1174.66,
    'D#6': 1244.51,
    'Eb6': 1244.51,
    'E6': 1318.51,
    'F6': 1396.91,
    'F#6': 1479.98,
    'Gb6': 1479.98,
    'G6': 1567.98,
    'G#6': 1661.22,
    'Ab6': 1661.22,
    'A6': 1760.00,
    'A#6': 1864.66,
    'Bb6': 1864.66,
    'B6': 1975.53,
    'C7': 2093.00,
    'C#7': 2217.46,
    'Db7': 2217.46,
    'D7': 2349.32,
    'D#7': 2489.02,
    'Eb7': 2489.02,
    'E7': 2637.02,
    'F7': 2793.83,
    'F#7': 2959.96,
    'Gb7': 2959.96,
    'G7': 3135.96,
    'G#7': 3322.44,
    'Ab7': 3322.44,
    'A7': 3520.00,
    'A#7': 3729.31,
    'Bb7': 3729.31,
    'B7': 3951.07,
    'C8': 4186.01
};

},{}]},{},[6])
(6)
});