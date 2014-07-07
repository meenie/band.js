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
module.exports = require('./conductor.js');

module.exports.loadPack('instrument', 'noises', require('./instrument-packs/noises.js'));
module.exports.loadPack('instrument', 'oscillators', require('./instrument-packs/oscillators.js'));
module.exports.loadPack('rhythm', 'northAmerican', require('./rhythm-packs/north-american.js'));
module.exports.loadPack('rhythm', 'european', require('./rhythm-packs/european.js'));
module.exports.loadPack('tuning', 'equalTemperament', require('./tuning-packs/equal-temperament.js'));
