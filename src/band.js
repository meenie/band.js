/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2013
 */
;(function() {
    var
        packs = {
            instrument: {},
            rhythm: {},
            tuning: {}
        },
        // Used when parsing the time signature
        signatureToNoteLengthRatio = {
            2: 6,
            4: 3,
            8: 4.50
        }
    ;

    /**
     * Constructor
     */
    function cls(tuning, rhythm) {
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

        var self = this,
            ac = new (window.AudioContext || window.webkitAudioContext),
            muteGain = ac.createGain(),
            masterVolume = ac.createGain(),
            masterVolumeLevel = 1,
            beatsPerBar,
            noteGetsBeat,
            pitches = packs.tuning[tuning],
            notes = packs.rhythm[rhythm],
            tempo,
            instruments = [],
            allSounds = [],
            currentPlayTime,
            totalPlayTime = 0,
            totalDuration = 0,
            currentSeconds = 0,
            defaultBufferSize = 50,
            bufferTimeout,
            tickerCallback,
            paused = false,
            playing = false,
            loop = false,
            muted = false,
            faded = false,
            onFinishedCallback,
            onFinished = function(cb) {
                self.stop(false);
                if (loop) {
                    self.play();
                } else if(typeof cb === 'function') {
                    cb();
                }
            },
            totalPlayTimeCalculator = function() {
                if (! paused && playing) {
                    if (totalDuration < totalPlayTime) {
                        onFinished(onFinishedCallback);
                    } else {
                        updateTotalPlayTime();
                        requestAnimationFrame(totalPlayTimeCalculator);
                    }
                }
            },
            /**
             * Instrument Class
             */
            Instrument = (function() {
                /**
                 * Constructor
                 * @param name
                 * @param pack
                 */
                function cls(name, pack) {
                    // Default to Sine Oscillator
                    if (! name) {
                        name = 'sine';
                    }
                    if (! pack) {
                        pack = 'oscillators';
                    }

                    if (typeof packs.instrument[pack] === 'undefined') {
                        throw new Error (pack + ' is not a currently loaded Instrument Pack.');
                    }

                    var self = this,
                        currentTime = 0,
                        lastRepeatCount = 0,
                        volumeLevel = 1,
                        soundsBuffer = [],
                        instrument = packs.instrument[pack](name, ac)
                    ;

                    /**
                     * Set volume level for an instrument
                     *
                     * @param newVolumeLevel
                     */
                    this.setVolume = function(newVolumeLevel) {
                        if (newVolumeLevel > 1) {
                            newVolumeLevel = newVolumeLevel / 100;
                        }
                        volumeLevel = newVolumeLevel;

                        return self;
                    };

                    /**
                     * Add a note to an instrument
                     * @param rhythm
                     * @param [pitch] - Comma separated string if more than one pitch
                     * @param [tie]
                     */
                    this.note = function(rhythm, pitch, tie) {
                        if (typeof notes[rhythm] === 'undefined') {
                            throw new Error(rhythm + ' is not a correct rhythm.');
                        }

                        var duration = getDuration(rhythm),
                            articulationGap = tie ? 0 : duration * 0.05;

                        if (pitch) {
                            pitch = pitch.split(',');
                            pitch.forEach(function(p) {
                                p = p.trim();
                                if (typeof pitches[p] === 'undefined') {
                                    throw new Error(p + ' is not a valid pitch.');
                                }
                            });
                        }

                        soundsBuffer.push({
                            pitch: pitch,
                            duration: duration,
                            articulationGap: articulationGap,
                            tie: tie,
                            startTime: currentTime,
                            // Volume needs to be a quarter of the master so it doesn't clip
                            volumeLevel: volumeLevel / 4,
                            stopTime: currentTime + duration - articulationGap
                        });

                        currentTime += duration;

                        return self;
                    };

                    /**
                     * Add a rest to an instrument
                     *
                     * @param rhythm
                     */
                    this.rest = function(rhythm) {
                        if (typeof notes[rhythm] === 'undefined') {
                            throw new Error(rhythm + ' is not a correct rhythm.');
                        }

                        var duration = getDuration(rhythm);

                        soundsBuffer.push({
                            pitch: false,
                            duration: duration,
                            articulationGap: 0,
                            startTime: currentTime,
                            stopTime: currentTime + duration
                        });

                        currentTime += duration;

                        return self;
                    };

                    /**
                     * Place where a repeat section should start
                     */
                    this.repeatStart = function() {
                        lastRepeatCount = soundsBuffer.length;

                        return self;
                    };

                    /**
                     * Repeat from beginning
                     */
                    this.repeatFromBeginning = function(numOfRepeats) {
                        lastRepeatCount = 0;
                        self.repeat(numOfRepeats);

                        return self;
                    };

                    /**
                     * Number of times the section should repeat
                     * @param [numOfRepeats] - defaults to 1
                     */
                    this.repeat = function(numOfRepeats) {
                        numOfRepeats = typeof numOfRepeats === 'undefined' ? 1 : numOfRepeats;
                        var soundsBufferCopy = soundsBuffer.slice(lastRepeatCount);
                        for (var r = 0; r < numOfRepeats; r++) {
                            soundsBufferCopy.forEach(function(sound) {
                                var soundCopy = clone(sound);

                                soundCopy.startTime = currentTime;
                                soundCopy.stopTime = currentTime + soundCopy.duration - soundCopy.articulationGap;

                                soundsBuffer.push(soundCopy);
                                currentTime += soundCopy.duration;
                            });
                        }

                        return self;
                    };

                    /**
                     * Copies all notes to the master list of notes. It also calculates the total duration
                     * of each instrument.
                     */
                    this.finish = function() {
                        var duration = 0;
                        soundsBuffer.forEach(function(sound) {
                            duration += sound.duration;
                        });
                        // Figure out longest duration out of all the instruments
                        if (duration > totalDuration) {
                            totalDuration = duration;
                        }
                        instruments.push({
                            instrument: instrument,
                            sounds: soundsBuffer,
                            bufferPosition: 0,
                            totalDuration: totalDuration
                        });
                    };
                }

                return cls;
            })()
        ;

        // Setup mute gain and connect to the context
        muteGain.gain.value = 0;
        muteGain.connect(ac.destination);

        // Setup master volume and connect to the context
        masterVolume.gain.value = 1;
        masterVolume.connect(ac.destination);

        /**
         * Use JSON to load in a song to be played
         *
         * @param json
         */
        this.load = function(json) {
            if (! json) {
                throw new Error('JSON is required for this method to work.');
            }
            // Need to have at least instruments and notes
            if (typeof json['instruments'] === 'undefined') {
                throw new Error('You must define at least one instrument');
            }
            if (typeof json['notes'] === 'undefined') {
                throw new Error('You must define notes for each instrument');
            }

            // Shall we set a time signature?
            if (typeof json['timeSignature'] !== 'undefined') {
                self.setTimeSignature(json['timeSignature'][0], json['timeSignature'][1]);
            }

            // Maybe some tempo?
            if (typeof json['tempo'] !== 'undefined') {
                self.setTempo(json['tempo']);
            }

            // Lets create some instruments
            var instrumentList = {};
            for (var instrument in json['instruments']) {
                if (! json['instruments'].hasOwnProperty(instrument)) {
                    continue;
                }

                instrumentList[instrument] = self.createInstrument(
                    json['instruments'][instrument].name,
                    json['instruments'][instrument].pack
                );
            }

            // Now lets add in each of the notes
            for (var inst in json['notes']) {
                if (! json['notes'].hasOwnProperty(inst)) {
                    continue;
                }
                json['notes'][inst].forEach(function(note) {
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
                });
                instrumentList[inst].finish();
            }

            // Looks like we are done, lets press it.
            self.end();
        };

        /**
         * Create a new instrument
         *
         * @param [name] - defaults to sine
         * @param [pack] - defaults to oscillators
         * @returns {Instrument}
         */
        this.createInstrument = function(name, pack) {
            return new Instrument(name, pack);
        };

        /**
         * Stop playing all music and reset the song
         *
         * @param fadeOut boolean - should the song fade out?
         */
        this.stop = function(fadeOut) {
            playing = false;
            currentSeconds = 0;

            if (typeof fadeOut === 'undefined') {
                fadeOut = true;
            }
            if (fadeOut && ! muted) {
                fade('down', function() {
                    totalPlayTime = 0;
                    reset();
                    // Make callback asynchronous
                    setTimeout(function() {
                        tickerCallback(currentSeconds);
                    }, 1);
                }, true);
            } else {
                totalPlayTime = 0;
                reset();
                // Make callback asynchronous
                setTimeout(function() {
                    tickerCallback(currentSeconds);
                }, 1);
            }
        };

        /**
         * Set Master Volume
         */
        this.setMasterVolume = function(newVolume) {
            if (newVolume > 1) {
                newVolume = newVolume / 100;
            }
            masterVolumeLevel = newVolume;
            masterVolume.gain.value = masterVolumeLevel;
        };

        /**
         * Mute all of the music
         */
        this.mute = function(cb) {
            muted = true;
            fade('down', cb);
        };

        /**
         * Unmute all of the music
         */
        this.unmute = function(cb) {
            muted = false;
            fade('up', cb);
        };

        /**
         * Grab the total duration of a song
         *
         * @returns {number}
         */
        this.getTotalSeconds = function() {
            return Math.round(totalDuration);
        };

        /**
         * Sets the ticker callback function. This function will be called
         * every time the current seconds has changed.
         *
         * @param cb function
         */
        this.setTicker = function (cb) {
            if (typeof cb !== 'function') {
                throw new Error('Ticker must be a function.');
            }

            tickerCallback = cb;
        };

        /**
         * Needs to be called after all the instruments have been marked off as
         * finished.
         *
         * Buffers up the initial sounds so they can be instantly played.
         */
        this.end = function() {
            // Reset the buffer position of all instruments
            instruments.forEach(function(instrument) {
                instrument.bufferPosition = 0;
            });
            // Setup initials sounds
            allSounds = this.bufferSounds();
        };

        /**
         * Grabs a set of sounds based on the current time and what the Buffer Size is.
         * It will also skip any sounds that have a start time less than the
         * total play time.
         */
        this.bufferSounds = function(bufferSize) {
            // Default buffer amount to 50 notes
            if (! bufferSize) {
                bufferSize = defaultBufferSize;
            }

            var sounds = [];
            instruments.forEach(function(instrument) {
                // Create volume for this instrument
                var bufferCount = bufferSize;

                for (var i = 0; i < bufferCount; i++) {
                    var sound = instrument.sounds[instrument.bufferPosition + i];

                    if (typeof sound === 'undefined') {
                        break;
                    }

                    var pitch = sound.pitch,
                        startTime = sound.startTime,
                        stopTime = sound.stopTime,
                        volumeLevel = sound.volumeLevel;

                    if (startTime < totalPlayTime) {
                        bufferCount++;
                        continue;
                    }

                    // If pitch is false, then it's a rest and we don't need a sound
                    if (false !== pitch) {
                        var gain = ac.createGain();
                        // Connect volume gain to the Master Volume;
                        gain.connect(masterVolume);
                        gain.gain.value = volumeLevel;

                        if (typeof pitch === 'undefined') {
                            sounds.push({
                                startTime: startTime,
                                stopTime: stopTime,
                                node: instrument.instrument.createSound(gain),
                                gain: gain,
                                volumeLevel: volumeLevel
                            });
                        } else {
                            pitch.forEach(function(p) {
                                sounds.push({
                                    startTime: startTime,
                                    stopTime: stopTime,
                                    node: instrument.instrument.createSound(gain, pitches[p.trim()]),
                                    gain: gain,
                                    volumeLevel: volumeLevel
                                });
                            });
                        }
                    }
                }
                instrument.bufferPosition += bufferCount;
            });

            // Return array of sounds
            return sounds;
        };

        /**
         * Sets the time signature for the music. Just like in notation 4/4 time would be setTimeSignature(4, 4);
         * @param top - Number of beats per bar
         * @param bottom - What note type has the beat
         */
        this.setTimeSignature = function(top, bottom) {
            if (typeof signatureToNoteLengthRatio[bottom] === 'undefined') {
                throw new Error('The bottom time signature is not supported.');
            }

            // Not used at the moment, but will be handy in the future.
            beatsPerBar = top;
            noteGetsBeat = signatureToNoteLengthRatio[bottom];
        };

        /**
         * Sets the tempo
         *
         * @param t
         */
        this.setTempo = function(t) {
            tempo = 60 / t;
        };

        /**
         * Grabs currently buffered sound nodes and calls their start/stop methods.
         *
         * It then sets up a timer to buffer up the next set of notes based on the
         * a set buffer size.  This will keep going until the song is stopped or paused.
         *
         * It will use the total time played so far as an offset so you pause/play the music
         */
        this.play = function() {
            playing = true;
            paused = false;
            // Starts calculator which keeps track of total play time
            currentPlayTime = ac.currentTime;
            totalPlayTimeCalculator();
            var timeOffset = ac.currentTime - totalPlayTime,
                playSounds = function(sounds) {
                    sounds.forEach(function(sound) {
                        var startTime = sound.startTime + timeOffset,
                            stopTime = sound.stopTime + timeOffset
                        ;

                        /**
                         * If no tie, then we need to introduce a volume ramp up to remove any clipping
                         * as Oscillators have an issue with this when playing a note at full volume.
                         * We also put in a slight ramp down as well.  This only takes up 1/1000 of a second.
                         */
                        if (! sound.tie) {
                            startTime -= 0.001;
                            stopTime += 0.001;
                            sound.gain.gain.setValueAtTime(0.0, startTime);
                            sound.gain.gain.linearRampToValueAtTime(sound.volumeLevel, startTime + 0.001);
                            sound.gain.gain.setValueAtTime(sound.volumeLevel, stopTime - 0.001);
                            sound.gain.gain.linearRampToValueAtTime(0.0, stopTime);
                        }

                        sound.node.start(startTime);
                        sound.node.stop(stopTime);
                    });
                },
                bufferUp = function() {
                    bufferTimeout = setTimeout(function() {
                        if (playing & ! paused) {
                            var newSounds = self.bufferSounds();
                            if (newSounds.length > 0) {
                                playSounds(newSounds);
                                allSounds = allSounds.concat(newSounds);
                                bufferUp();
                            }
                        }
                    }, 5000);
                };

            playSounds(allSounds);
            bufferUp();

            if (faded && ! muted) {
                fade('up');
            }
        };

        /**
         * Set a callback to fire when the song is finished
         *
         * @param cb
         */
        this.onFinished = function(cb) {
            if (typeof cb !== 'function') {
                throw new Error('onFinished callback must be a function.');
            }

            onFinishedCallback = cb;
        };

        /**
         * Pauses the music, resets the sound nodes,
         * and gets the total time played so far
         */
        this.pause = function() {
            paused = true;
            updateTotalPlayTime();
            if (muted) {
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
         * @param l
         */
        this.loop = function(l) {
            loop = l;
        };

        /**
         * Set a specific time that the song should start it.
         * If it's already playing, reset and start the song
         * again so it has a seamless jump.
         *
         * @param newTime
         */
        this.setTime = function(newTime) {
            totalPlayTime = parseInt(newTime);
            reset();
            if (playing && ! paused) {
                self.play();
            }
        };

        // Default to 120 tempo
        this.setTempo(120);

        // Default to 4/4 time signature
        this.setTimeSignature(4, 4);

        /**
         * Call to update the total play time so far
         */
        function updateTotalPlayTime() {
            totalPlayTime += ac.currentTime - currentPlayTime;
            var seconds = Math.round(totalPlayTime);
            if (seconds != currentSeconds) {
                // Make callback asynchronous
                setTimeout(function() {
                    tickerCallback(seconds);
                }, 1);
                currentSeconds = seconds;
            }
            currentPlayTime = ac.currentTime;
        }

        /**
         * Helper function to figure out how long a note is
         *
         * @param note
         * @returns {number}
         */
        function getDuration(note) {
            return notes[note] * tempo / noteGetsBeat * 10;
        }

        /**
         * Helper function to stop all sound nodes
         * then call self.end() to re-buffer them
         */
        function reset() {
            clearTimeout(bufferTimeout);
            allSounds.forEach(function(sound) {
                if (sound.node) {
                    sound.node.stop(0);
                }
            });
            self.end();
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
            faded = direction === 'down';
            var i = 100 * masterVolumeLevel,
                fadeTimer = function() {
                    if (i > 0) {
                        i = i - 4;
                        i = i < 0 ? 0 : i;
                        var gain = 'up' === direction ? masterVolumeLevel * 100 - i : i;
                        masterVolume.gain.value = gain / 100;
                        requestAnimationFrame(fadeTimer);
                    } else {
                        if (typeof cb === 'function') {
                            cb();
                        }

                        if (resetVolume) {
                            faded = ! faded;
                            masterVolume.gain.value = masterVolumeLevel;
                        }
                    }
                };

            fadeTimer();
        }
    }

    /**
     * Loads either a Tuning, Rhythm, or Instrument pack
     * 
     * @param type
     * @param name
     * @param data
     */
    cls.loadPack = function(type, name, data) {
        if (['tuning', 'rhythm', 'instrument'].indexOf(type) === -1) {
            throw new Error(type = ' is not a valid Pack Type.');
        }

        if (typeof packs[type][name] !== 'undefined') {
            throw new Error('A(n) ' + type + ' pack with the name "' + name + '" has already been loaded.');
        }

        packs[type][name] = data;
    };

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

    var requestAnimationFrame = this.requestAnimationFrame || this.mozRequestAnimationFrame ||
        this.webkitRequestAnimationFrame || this.msRequestAnimationFrame;

    this.requestAnimationFrame = requestAnimationFrame;

    // Export for CommonJS
    if (typeof module === 'object' && module && typeof module.exports === 'object' ) {
        module.exports = cls;
    // Define AMD module
    } else if (typeof define === 'function' && define.amd) {
        // Return the library as an AMD module:
        define([], function() {
            return cls;
        });
    // Or make it global
    } else {
        this.BandJS = cls;
    }

}).call(function() {
    return this || (typeof window !== 'undefined' ? window : global);
}());
