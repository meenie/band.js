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

2.  Set up your project to use ES Modules. Then, import `Conductor`:

    ```typescript
    import Conductor from '@meenie/band.js';

    // Create a new Conductor instance.
    // Default packs (oscillators, noises, northAmerican & european rhythms, equalTemperament tuning)
    // are loaded automatically when Conductor is imported.
    const conductor = new Conductor();
    // You can also specify tuning and rhythm packs by name:
    // const conductor = new Conductor('equalTemperament', 'northAmerican');

    // Set time signature and tempo
    conductor.setTimeSignature(4, 4);
    conductor.setTempo(120);

    // Create an instrument using the default oscillators pack
    const piano = conductor.createInstrument('sine', 'oscillators');
    // Or use default pack (oscillators is the default):
    // const piano = conductor.createInstrument('sine');

    // Start adding notes using rhythms from the loaded rhythm pack
    piano.note('quarter', 'C4');
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
| `constructor(tuningName, rhythmPackName)` | `tuningName: 'equalTemperament'`  `rhythmPackName: 'northAmerican'` | When creating a new `Conductor` object, you can pass in the names of the tuning and rhythm notation packs you want to use. These packs must be loaded beforehand using `Conductor.loadPack()`. By default, if these packs are loaded with the names 'equalTemperament' and 'northAmerican', the constructor will use them. |
| `setTimeSignature(top, bottom)` | `top: 4`  `bottom: 4` | This will set the Time Signature for the music. Any number of top numbers (how many beats per bar) can be set, but the bottom number (which note gets the beat) can only be 2, 4, or 8. |
| `setTempo(bpm)` | `bpm: 120` | Set the tempo (BPM) of the music. If a player has been instantiated, then the `onDurationChangeCallback` will be called. |
| `setMasterVolume(volume)` | `volume: 1` | Set the master volume of the music. From 0 to 1 (0-100% volume). |
| `getTotalSeconds()` | `n/a` | Returns the total number of seconds a song is. |
| `setNoteBufferLength(bufferLength)` | `bufferLength: 20` | Set the number of notes that are buffered every (tempo / 60 * 5) seconds.  **WARNING** The higher this is, the more memory is used and can crash your browser. If notes are being dropped, you can increase this, but be wary of used memory. |
| `finish()` | `n/a` | Totals up the duration of the song and returns the Player Class. |
| `setOnFinishedCallback(callback)` | `callback: Func` | Pass in a function that will be called when the music has completed. |
| `setTickerCallback(callback)` | `callback: Func` | Pass in a function that will be called every second the music is playing. It will pass the current number of seconds that have passed. |
| `setOnDurationChangeCallback(callback)` | `callback: Func` | Pass in a function that will be called when the duration of a song has changed. Most likely it's because you have changed the tempo of a song. |
| `createInstrument(name, pack)` | `name: 'sine'`  `pack: 'oscillators'` | Creates an instrument that you can add notes/rests with. The first argument is the name of the instrument sound (e.g., 'sine', 'square' for oscillators; 'white', 'pink' for noises) and the second is the name of the instrument pack it should use (e.g., 'oscillators', 'noises'). The specified pack must be loaded first via `Conductor.loadPack()`. If `pack` is not specified, it defaults to 'oscillators'. |
| `load(json)` | `json: SongJSON` | Load a song into Band.js using JSON. Returns the Player Class. (**This will erase your current song and overwrite it with this new one**). See the "Loading Songs with JSON" section below for the required format. |

###### Loading Songs with JSON

The `load(json)` method expects a JSON object with the following structure:

```json
{
  "timeSignature": [4, 4],
  "tempo": 100,
  "instruments": {
    "rightHand": {
      "name": "square",
      "pack": "oscillators"
    },
    "leftHand": {
      "name": "sawtooth",
      "pack": "oscillators"
    }
  },
  "notes": {
    "rightHand": [
      "quarter|E5, F#4|tie",
      "quarter|rest",
      "quarter|E5, F#4",
      "quarter|rest"
    ],
    "leftHand": [
      {
        "type": "note",
        "pitch": "D3",
        "rhythm": "quarter"
      }
    ]
  }
}
```

##### Conductor Class Static Methods

| Method | Params | Description |
|---|---|---|
| `loadPack(type, name, data)` | `type` (string): 'instrument', 'rhythm', or 'tuning'`name` (string): Name you want to give the pack`data` (object/module): The imported pack module/data. | Use this method to load in different packs.**Example:**
```typescript
import Conductor from '@meenie/band.js';
import oscillatorsPack from '@meenie/band.js/instrument-packs/oscillators';
import customRhythms from './my-custom-rhythms'; // Assuming a local file

Conductor.loadPack('instrument', 'oscillators', oscillatorsPack);
Conductor.loadPack('rhythm', 'myCustomSet', customRhythms);
```
**Data Format:**
  - **Rhythm Pack (`type: 'rhythm'`):** `data` should be an object where keys are rhythm names (e.g., 'whole', 'half') and values are their duration multipliers (e.g., `1`, `0.5`). Example: `{ whole: 1, half: 0.5 }`.
  - **Tuning Pack (`type: 'tuning'`):** `data` should be an object where keys are pitch names (e.g., 'A4', 'C#5') and values are their frequencies in Hz (e.g., `440.00`, `554.37`). Example: `{'A4': 440.00, 'A#4': 466.16}`.
  - **Instrument Pack (`type: 'instrument'`):** `data` is typically an imported module which is a function. This function is called by Band.js with `(soundName, audioContext)` and should return an object with at least one method: `createNote(destination, frequency?)`. This method is responsible for creating and returning an `AudioNode` (like `OscillatorNode` or `AudioBufferSourceNode`) connected to the provided `destination`. The `frequency` is provided for pitched instruments. See `src/instrument-packs/` for examples like `oscillators.ts` or `noises.ts`.

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
| `note(rhythm, pitch, tie)` | `rhythm`: Must be set (string, e.g., 'quarter')<br/>`pitch`: Optional (string/number/array, e.g., 'C4', 440, ['C4', 'E4'])<br/>`tie: false` (boolean) | Adds a note to the stack of notes for the particular instrument. `rhythm` refers to a key in a loaded rhythm pack. Common rhythms include: whole, dottedHalf, half, dottedQuarter, tripletHalf, quarter, dottedEighth, tripletQuarter, eighth, dottedSixteenth, tripletEighth, sixteenth, tripletSixteenth, thirtySecond. `pitch` can be any note name defined in the loaded tuning pack (e.g., 'C0' to 'C8', 'Bb3', 'G#7'), a frequency number, or an array for chords. For noise instruments, pitch is the noise type (e.g., 'white', 'pink'). `tie` can tie two notes together without any gap. |
| `rest(rhythm)` | `rhythm`: Must be set (string) | Adds a rest to the list of notes. Use a rhythm name from a loaded rhythm pack. |
| `setVolume(volume)` | `volume: 1` | Sets the volume for this particular instrument. From 0 to 1 (0-100% volume). You can call this multiple times before notes to change their volume at that point of the music. |
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
