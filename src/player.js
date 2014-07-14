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
