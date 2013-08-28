(function (AudioContext) {
    AudioContext.prototype.createWhiteNoise = function (bufferSize) {
        bufferSize = bufferSize || 4096;
        var node = this.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = function (e) {
            var output = e.outputBuffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
        }
        return node;
    };
    AudioContext.prototype.createPinkNoise = function (bufferSize) {
        bufferSize = bufferSize || 4096;
        var b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        var node = this.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = function (e) {
            var output = e.outputBuffer.getChannelData(0);
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
        }
        return node;
    };
    AudioContext.prototype.createBrownNoise = function (bufferSize) {
        bufferSize = bufferSize || 4096;
        var lastOut = 0.0;
        var node = this.createScriptProcessor(bufferSize, 1, 1);
        node.onaudioprocess = function (e) {
            var output = e.outputBuffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                var white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5;
            }
        }
        return node;
    };
})(window.AudioContext || window.webkitAudioContext);