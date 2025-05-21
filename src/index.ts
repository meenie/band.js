/**
 * Band.js - Music Composer
 * An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex
 * time signatures.
 *
 * @author Cody Lundquist (http://github.com/meenie) - 2014
 */

import Conductor from "./conductor";
import noisesPackData from "./instrument-packs/noises";
import oscillatorsPackData from "./instrument-packs/oscillators";
import northAmericanRhythmPackData from "./rhythm-packs/north-american";
import europeanRhythmPackData from "./rhythm-packs/european";
import equalTemperamentTuningPackData from "./tuning-packs/equal-temperament";

// Load default packs into the Conductor
// This assumes Conductor.loadPack is a static method.
Conductor.loadPack("instrument", "noises", noisesPackData);
Conductor.loadPack("instrument", "oscillators", oscillatorsPackData);
Conductor.loadPack("rhythm", "northAmerican", northAmericanRhythmPackData);
Conductor.loadPack("rhythm", "european", europeanRhythmPackData);
Conductor.loadPack(
  "tuning",
  "equalTemperament",
  equalTemperamentTuningPackData
);

/**
 * @type {BandJS}
 */
export default Conductor;

export {
  noisesPackData as noisesPack,
  oscillatorsPackData as oscillatorsPack,
  northAmericanRhythmPackData as northAmericanRhythmPack,
  europeanRhythmPackData as europeanRhythmPack,
  equalTemperamentTuningPackData as equalTemperamentTuningPack,
};
