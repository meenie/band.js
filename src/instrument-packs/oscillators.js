/**
 * Oscillator Instrument Pack,
 */
BandJS.loadPack('instrument', 'oscillators', function(name, audioContext) {
    var types = {
        sine: 0,
        square: 1,
        sawtooth: 2,
        triangle: 3
    };

    if (typeof types[name] === 'undefined') {
        throw new Error(name + ' is not a valid Oscillator type');
    }

    return {
        createSound: function(destination, frequency) {
            var o = audioContext.createOscillator();

            // Connect note to volume
            o.connect(destination);
            // Set pitch type
            o.type = types[name];
            // Set frequency
            o.frequency.value = frequency;

            return o;
        }
    };
});