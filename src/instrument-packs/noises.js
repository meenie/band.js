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
