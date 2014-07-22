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
