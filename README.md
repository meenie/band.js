Band.js - Music Composer
====
#### An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex time signatures.

#### Get Started

1.  Install Band.js:
    ```bash
    npm install @meenie/band.js
    # or
    bun install @meenie/band.js
    ```

2.  Set up your project to use ES Modules. Then, import `Conductor` and the sound packs:

    ```typescript
    import { Conductor } from '@meenie/band.js';
    // Import the default packs (or any other packs you need)
    // Paths are based on package.json "exports" (e.g., "@meenie/band.js/instrument-packs/oscillators")
    import oscillatorsPack from '@meenie/band.js/instrument-packs/oscillators';
    import northAmericanRhythms from '@meenie/band.js/rhythm-packs/north-american';
    import equalTemperamentTuning from '@meenie/band.js/tuning-packs/equal-temperament';

    // Load the packs into the Conductor
    // It's recommended to load them with their standard names if you want to rely on existing defaults
    Conductor.loadPack('instrument', 'oscillators', oscillatorsPack);
    Conductor.loadPack('rhythm', 'northAmerican', northAmericanRhythms);
    Conductor.loadPack('tuning', 'equalTemperament', equalTemperamentTuning);

    // Create a new Conductor instance.
    // If 'equalTemperament' and 'northAmerican' packs are loaded as above,
    // the constructor can use them by default or by name.
    const conductor = new Conductor(); // Or: new Conductor('equalTemperament', 'northAmerican');

    // Set time signature and tempo
    conductor.setTimeSignature(4, 4);
    conductor.setTempo(120);

    // Create an instrument.
    // If the 'oscillators' pack was loaded with the name 'oscillators',
    // createInstrument() can use it. The first argument is the sound name within the pack.
    const piano = conductor.createInstrument('sine', 'oscillators');
    // Or, if 'oscillators' is the default pack and 'sine' a default sound, this might also work:
    // const piano = conductor.createInstrument();


    // Start adding notes
    piano.note('quarter', 'C4'); // Assumes 'northAmerican' rhythm pack is loaded and 'quarter' is a defined rhythm
    piano.note('quarter', 'D4');
    piano.note('quarter', 'E4');
    piano.note('quarter', 'F4');

    // Tell the conductor everything is done
    const player = conductor.finish();

    // Start playing the music
    player.play();
    ```

#### Examples

* [Super Mario Bros Theme](http://plnkr.co/edit/LG20SL?p=preview) - Created by me
* [Tetris Theme](http://plnkr.co/edit/ZmsCCS?p=preview) - Created by [rooktakesqueen](http://www.reddit.com/user/rooktakesqueen)
* [Zelda Main Theme](http://plnkr.co/edit/jFnos1?p=preview) - Created by [legosjedi](http://www.reddit.com/user/legosjedi)
* [Frog's Theme - Chrono Trigger](http://plnkr.co/edit/vVrFxg?p=preview) - Created by Me & Jarred Mack
* Modernized examples can also be found in the `examples/` directory of the project repository.

#### In The News

* [Retro Game Music using Web Audio API and Band.js](https://modernweb.com/creating-sound-web-audio-api-oscillators/)

#### API

##### Conductor Class

| Method | Params | Description |
|---|---|---|
| `constructor(tuning, rhythm)` | `tuning: 'equalTemperament'` <br> `rhythm: 'northAmerican'` | When creating a new `Conductor` object, you can pass in the names of the tuning and rhythm notation packs you want to use. These packs must be loaded beforehand using `Conductor.loadPack()`. By default, if these packs are loaded with the names 'equalTemperament' and 'northAmerican', the constructor will use them. |
| `setTimeSignature(top, bottom)` | `top: 4` <br> `bottom: 4` | This will set the Time Signature for the music. Any number of top numbers (how many beats per bar) can be set, but the bottom number (which note gets the beat) can only be 2, 4, or 8. |
| `setTempo(tempo)` | `tempo: 120` | Set the tempo (BPM) of the music. If a player has been instantiated, then the `onDurationChangeCallback` will be called. |
| `setMasterVolume(volume)` | `volume: 100` | Set the master volume of the music. From 0 to 100. |
| `getTotalSeconds()` | `n/a` | Returns the total number of seconds a song is. |
| `setNoteBufferLength(bufferLength)` | `bufferLength: 20` | Set the number of notes that are buffered every (tempo / 60 * 5) seconds. <br> **WARNING** The higher this is, the more memory is used and can crash your browser. If notes are being dropped, you can increase this, but be wary of used memory. |
| `finish()` | `n/a` | Totals up the duration of the song and returns the Player Class. |
| `setOnFinishedCallback(callback)` | `callback: Func` | Pass in a function that will be called when the music has completed. |
| `setTickerCallback(callback)` | `callback: Func` | Pass in a function that will be called every second the music is playing. It will pass the current number of seconds that have passed. |
| `setOnDurationChangeCallback(callback)` | `callback: Func` | Pass in a function that will be called when the duration of a song has changed. Most likely it's because you have changed the tempo of a song. |
| `createInstrument(name, pack)` | `name: 'sine'` <br> `pack: 'oscillators'` | Creates an instrument that you can add notes/rests with. The first argument is the name of the instrument sound (e.g., 'sine', 'square' for oscillators; 'white', 'pink' for noises) and the second is the name of the instrument pack it should use (e.g., 'oscillators'). The specified pack must be loaded first via `Conductor.loadPack()`. If `pack` is not specified, it defaults to a pack named 'oscillators'. If `name` is not specified, it may default to a common sound like 'sine' if available in the pack. |
| `load(json)` | `json: JSON` | Load a song into Band.js using JSON. Returns the Player Class. Format is: (**This will erase your current song and overwrite it with this new one**)<br><pre>{\n    timeSignature: [4, 4],\n    tempo: 100,\n    instruments: {\n        rightHand: {\n            name: 'square', // Sound name within the pack\n            pack: 'oscillators' // Name of the loaded pack\n        },\n        leftHand: {\n            name: 'sawtooth',\n            pack: 'oscillators'\n        }\n    },\n    notes: {\n        // Shorthand notation\n        rightHand: [\n            'quarter|E5, F#4|tie',\n            'quarter|rest',\n            'quarter|E5, F#4',\n            'quarter|rest'\n        ],\n        // More verbose notation\n        leftHand: [\n            {\n                type: 'note',\n                pitch: 'D3',\n                rhythm: 'quarter'\n            }\n        ]\n    }\n}</pre> |

##### Conductor Class Static Methods

| Method | Params | Description |
|---|---|---|
| `loadPack(type, name, data)` | `type`: 'instrument', 'rhythm', or 'tuning'<br>`name`: Name you want to give the pack (string)<br>`data`: The imported pack module/data. | Use this method to load in different packs. <br> **Example:** <br> ```typescript <br> import { Conductor } from '@meenie/band.js'; <br> import oscillatorsPack from '@meenie/band.js/instrument-packs/oscillators'; <br> import customRhythms from './my-custom-rhythms'; // Assuming a local file <br><br> Conductor.loadPack('instrument', 'oscillators', oscillatorsPack); <br> Conductor.loadPack('rhythm', 'myCustomSet', customRhythms); <br> ``` <br> **Data Format:** <br> - **Rhythm Pack (`type: 'rhythm'`):** `data` should be an object where keys are rhythm names (e.g., 'whole', 'half') and values are their duration multipliers (e.g., `1`, `0.5`). Example: `{ whole: 1, half: 0.5 }`. <br> - **Tuning Pack (`type: 'tuning'`):** `data` should be an object where keys are pitch names (e.g., 'A4', 'C#5') and values are their frequencies in Hz (e.g., `440.00`, `554.37`). Example: `{'A4': 440.00, 'A#4': 466.16}`. <br> - **Instrument Pack (`type: 'instrument'`):** `data` is typically an imported module which is a function. This function is called by Band.js with `(soundName, audioContext)` and should return an object with at least one method: `createNote(destination, frequency?)`. This method is responsible for creating and returning an `AudioNode` (like `OscillatorNode` or `AudioBufferSourceNode`) connected to the provided `destination`. The `frequency` is provided for pitched instruments. See `src/instrument-packs/` for examples like `oscillators.ts` or `noises.ts`. |

##### Player Class - Returned from the Conductor Class when calling `Conductor.finish()`

| Method | Params | Description |
|---|---|---|
| `play()` | `n/a` | Play the music. |
| `pause()` | `n/a` | Pause the music. |
| `stop(fadeOut)` | `fadeOut: true` | Stop the music with a slight fade out. If you don't want the fade, pass in `false`. |
| `mute(callback)` | `n/a` | Mutes the music. You can pass in a function as a callback when the music completely faded. |
| `unmute(callback)` | `n/a` | Unmute the music. You can pass in a function as a callback when the music is completely faded up. |
| `loop(loop)` | `loop: false` | Pass in `true` if you want the music to keep looping forever. |
| `setTime(seconds)` | `seconds: 0` | You can set the specific time a song should start playing at. This is handy for seeking time. |

##### Instrument Class - Created by using the `Conductor.createInstrument()` method.

| Method | Params | Description |
|---|---|---|
| `note(rhythm, pitch, tie)` | `rhythm`: Must be set (string, e.g., 'quarter')<br>`pitch`: Optional (string, e.g., 'C4')<br>`tie: false` (boolean) | Adds a note to the stack of notes for the particular instrument.<br> `rhythm` refers to a key in a loaded rhythm pack (e.g., 'northAmerican'). Common rhythms include: <br> * whole <br> * dottedHalf <br> * half <br> * dottedQuarter <br> * tripletHalf <br> * quarter <br> * dottedEighth <br> * tripletQuarter <br> * eighth <br> * dottedSixteenth <br> * tripletEighth <br> * sixteenth <br> * tripletSixteenth <br> * thirtySecond <br> `pitch` is optional and can be any note name defined in the loaded tuning pack (e.g., 'C0' to 'C8', 'Bb3', 'G#7'). <br> `tie` can tie two notes together without any gap. By default, the library puts in an articulation gap of about a tenth of the length of the note. |
| `rest(rhythm)` | `rhythm`: Must be set (string) | Adds a rest to the list of notes. Use a rhythm name from a loaded rhythm pack. |
| `setVolume(volume)` | `volume: 25` | Sets the volume for this particular instrument. From 0 to 100. You can call this multiple times before notes to change their volume at that point of the music. |
| `repeatStart()` | `n/a` | Puts in a marker where a section of music should be repeated from. |
| `repeat(times)` | `times: 1` | Used in conjunction with `repeatStart()`. Pass in how many times the section should be repeated. If no `repeatStart()` is set, it goes from the beginning. |

### Development

If you want to contribute or build Band.js from source:

1.  Clone the repository:
    ```bash
    git clone https://github.com/meenie/band.js.git
    cd band.js
    ```
2.  Install dependencies:
    ```bash
    bun install
    ```
3.  Build the library:
    ```bash
    bun run build
    ```
    This will output the bundled files to the `dist/` directory.
4.  Run tests:
    ```bash
    bun test
    ```

### License

Copyright 2013-2025 Cody Lundquist and various contributors. Released under the [MIT License (MIT)](LICENSE).
