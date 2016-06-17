Band.js - Music Composer
====
#### An interface for the Web Audio API that supports rhythms, multiple instruments, repeating sections, and complex time signatures.

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/meenie/band.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

#### Get Started

1. Include `band.min.js` in the head of your document.
2. Create an new instance: `var conductor = new BandJS();`
3. Give it a Time Signature: `conductor.setTimeSignature(4,4);`
4. Set the tempo: `conductor.setTempo(120);`
5. Create an instrument: `var piano = conductor.createInstrument();`
6. Start adding notes:

    ```javascript
    piano.note('quarter', 'C4');
    piano.note('quarter', 'D4');
    piano.note('quarter', 'E4');
    piano.note('quarter', 'F4');
    ```
    
7. Tell the `conductor` everything is done: `var player = conductor.finish();`. It will return you the player instance to use for playing, pausing, muting, stopping, and seeking.
8. Start playing the music: `player.play()`

#### Examples

* [Super Mario Bros Theme](http://plnkr.co/edit/LG20SL?p=preview) - Created by me
* [Tetris Theme](http://plnkr.co/edit/ZmsCCS?p=preview) - Created by [rooktakesqueen](http://www.reddit.com/user/rooktakesqueen)
* [Zelda Main Theme](http://plnkr.co/edit/jFnos1?p=preview) - Created by [legosjedi](http://www.reddit.com/user/legosjedi)
* [Frog's Theme - Chrono Trigger](http://plnkr.co/edit/vVrFxg?p=preview) - Created by Me & Jarred Mack

#### In The News

* [Retro Game Music using Web Audio API and Band.js](http://modernweb.com/2013/09/09/retro-game-music-using-web-audio-and-band-js/)

#### API

##### Conductor Class
<table>
<tr>
<th width="25%">Method</th>
<th width="25%">Params</th>
<th width="50%">Description</th>
</tr>
<tr>
<td><code>constructor(tuning, rhythm)</code></td>
<td><code>tuning: 'equalTemperament'</code><br><code>rhythm: 'northAmerican'</code></td>
<td>When creating a new BandJS() object, you can pass in the type of tuning and rhythm notation you want to use. By
default Band.js uses <a href="http://en.wikipedia.org/wiki/Equal_temperament" target="_blank">Equal Temperament</a> as
it's default tuning and North American (whole, half, quarter, etc)
as it's default rhythm notation.</td>
</tr>
<tr>
<td><code>setTimeSignature(top, bottom)</code></td>
<td><code>top: 4</code><br><code>bottom: 4</code></td>
<td>This will set the Time Signature for the music.  Any number of top numbers (how many beats per bar) can be set, but the bottom number (which note gets the beat) can only be 2, 4, or 8.</td>
</tr>
<tr>
<td><code>setTempo(tempo)</code></td>
<td><code>tempo: 120</code></td>
<td>Set the tempo (BPM) of the music.  If a player has been instantiated, then the onDurationChangeCallback will be called.</td>
</tr>
<tr>
<td><code>setMasterVolume(volume)</code></td>
<td><code>volume: 100</code></td>
<td>Set the master volume of the music. From 0 to 100</td>
</tr>
<tr>
<td><code>getTotalSeconds()</code></td>
<td><code>n/a</code></td>
<td>Returns the total number of seconds a song is.</td>
</tr>
<tr>
<td><code>setNoteBufferLength(bufferLength)</code></td>
<td><code>bufferLength: 20</code></td>
<td>Set the number of notes that are buffered every (tempo / 60 * 5) seconds.
**WARNING** The higher this is, the more memory is used and can crash your browser.
If notes are being dropped, you can increase this, but be weary of used memory.</td>
</tr>
<tr>
<td><code>finish()</code></td>
<td><code>n/a</code></td>
<td>Totals up the duration of the song and returns the Player Class.</td>
</tr>
<tr>
<td><code>setOnFinishedCallback(callback)</code></td>
<td><code>callback: Func</code></td>
<td>Pass in a function that will be called when the music has completed</td>
</tr>
<tr>
<td><code>setTickerCallback(callback)</code></td>
<td><code>callback: Func</code></td>
<td>Pass in a function that will be called every second the music is playing. 
It will pass the current number of seconds that have passed.</td>
</tr>
<tr>
<td><code>setOnDurationChangeCallback(callback)</code></td>
<td><code>callback: Func</code></td>
<td>Pass in a function that will be called when the duration of a song has changed.  Most likely
it's because you have changed the tempo of a song.</td>
</tr>
<tr>
<td><code>createInstrument(name, pack)</code></td>
<td>
    <code>name: 'sine'</code><br>
    <code>pack: 'oscillators'</code>
</td>
<td>Creates an instrument that you can add notes/rests with. The first argument is the name of the instrument and
the second is which pack it should use for that instrument name.  By default BandJS uses the 'oscillators'
instrument pack if one is not specified.</td>
</tr>
<tr>
<td valign="top"><code>load(json)</code></td>
<td valign="top"><code>json: JSON</code></td>
<td>Load a song into Band.js using JSON. Returns the Player Class. Format is: (**This will erase your current song and overwrite it with this new one**)<br>
<pre>{
    timeSignature: [4, 4],
    tempo: 100,
    instruments: {
        rightHand: {
            name: 'square',
            pack: 'oscillators'
        },
        leftHand: {
            name: 'sawtooth',
            pack: 'oscillators'
        }
    },
    notes: {
        // Shorthand notation
        rightHand: [
            'quarter|E5, F#4|tie',
            'quarter|rest',
            'quarter|E5, F#4',
            'quarter|rest'
        ],
        // More verbose notation
        leftHand: [
            {
                type: 'note',
                pitch: 'D3',
                rhythm: 'quarter'
            }
        ]
    }
}</pre>
</td>
</tr>
</table>

##### Conductor Class Static Methods
<table>
<tr>
<th width="25%">Method</th>
<th width="25%">Params</th>
<th width="50%">Description</th>
</tr>
<tr>
<td valign="top"><code>loadPack(type, name, data)</code></td>
<td valign="top">
    <code>type</code> - instrument, rhythm, or tuning<br>
    <code>name</code> - name you want to give the pack<br>
    <code>data</code> - data is used differently depending on the type of pack being loaded,
    see description for more info on each type.
</td>
<td>Use this method to load in different packs which can be utilised while composing music. For rhythms,
 it needs to be an object of rhythm name as the key and duration as the value (i.e.
 <code>{whole: 1, half: 0.5}</code>).<br>For tuning, it needs to be an object of pitch name as the key and
 frequency as the value (i.e. {'A4': 440.00, 'A#4': 466.16})<br>And lastly, the instrument pack type. This needs
 to be a function which takes 2 arguments, <code>name</code> and <code>audioContext</code>,
 that returns an object with at least one method called <code>createNote(destination, frequency)</code>.
 When an instrument is created using <code>BandJS.createInstrument(name, pack)</code> the library will use those two
  parameters to search the instrument packs and get a specific instrument. Once found,
  it will call it's function and pass in the name of the sound and the Audio Context.  When the library
  wants the instrument to create a note, it will call the <code>createNote(destination,
  frequency)</code> method and pass in the destination where the AudioNode you create should connect to. It will
  also pass in the frequency if you need it to create the note.  Once the node is created,
  it needs to be returned and the library will run it's methods <code>start()</code> and <code>stop()</code> to
  play the sound at the correct time.  To see a simple example, check out <code>/src/instrument-packs/oscillators
  .js</code>. For a more complex example, check out <code>/src/instrument-packs/noises.js</code></td>
</tr>
</table>

##### Player Class - Returned from the Conductor Class when calling `Conductor.finish()`
<table>
<tr>
<th width="25%">Method</th>
<th width="25%">Params</th>
<th width="50%">Description</th>
</tr>
<tr>
<td><code>play()</code></td>
<td><code>n/a</code></td>
<td>Play the music.</td>
</tr>
<tr>
<td><code>pause()</code></td>
<td><code>n/a</code></td>
<td>Pause the music.</td>
</tr>
<tr>
<td><code>stop(fadeOut)</code></td>
<td><code>fadeOut: true</code></td>
<td>Stop the music with a slight fade out.  If you don't want the fade, pass in false.</td>
</tr>
<tr>
<td><code>mute(callback)</code></td>
<td><code>n/a</code></td>
<td>Mutes the music.  You can pass in a function as a callback when the music completely faded.</td>
</tr>
<tr>
<td><code>unmute(callback)</code></td>
<td><code>n/a</code></td>
<td>Unmute the music. You can pass in a function as a callback when the music is completely faded up.</td>
</tr>
<tr>
<td><code>loop(loop)</code></td>
<td><code>loop: false</code></td>
<td>Pass in true if you want the music to keep looping forever.</td>
</tr>
<tr>
<td><code>setTime(seconds)</code></td>
<td><code>seconds: 0</code></td>
<td>You can set the specific time a song should start playing at. This is handy for seeking time.</td>
</tr>
</table>

##### Instrument Class - Created by using the `Conductor.createInstrument()` method.
<table>
<tr>
<th width="25%">Method</th>
<th width="25%">Params</th>
<th width="50%">Description</th>
</tr>
<tr>
<td valign="top"><code>note(rhythm, pitch, tie)</code></td>
<td valign="top"><code>rhythm</code> Must be set<br><code>pitch</code> optional<br><code>tie: false</code></td>
<td>Adds a note to the stack of notes for the particular instrument.<br>
    If using North American notation, <code>rhythm</code> can be any from the list below
    <ul>
        <li>whole</li>
        <li>dottedHalf</li>
        <li>half</li>
        <li>dottedQuarter</li>
        <li>tripletHalf</li>
        <li>quarter</li>
        <li>dottedEighth</li>
        <li>tripletQuarter</li>
        <li>eighth</li>
        <li>dottedSixteenth</li>
        <li>tripletEighth</li>
        <li>sixteenth</li>
        <li>tripletSixteenth</li>
        <li>thirtySecond</li>
    </ul>
    <code>pitch</code> is optional and can be any note between <code>C0</code> and <code>C8</code> (e.x. Bb3 or G#7)
    <br>
    <code>tie</code> can tie two notes together without any gap.  By default the library puts in an articulation gap of about a tenth of the length of the note.
</td>
</tr>
<tr>
<td><code>rest(rhythm)</code></td>
<td><code>rhythm</code> Must be set</td>
<td>Adds a rest to the list of notes.  Use the rhythm list above for the type of rest you can use.</td>
</tr>
<tr>
<td><code>setVolume(volume)</code></td>
<td><code>volume: 25</code></td>
<td>Sets the volume for this particular instrument. From 0 to 100. You can call this multiple times before notes to change their volume at that point of the music.</td>
</tr>
<tr>
<td><code>repeatStart()</code></td>
<td><code>n/a</code></td>
<td>Puts in a marker where a section of music should be repeated from.</td>
</tr>
<tr>
<td><code>repeat(times)</code></td>
<td><code>times: 1</code></td>
<td>Used in conjunction with <code>repeatStart()</code>. Pass in how many times the section should be repeated.  If no <code>repeatStart()</code> is set, it goes from the beginning.</td>
</tr>
</table>

### License

Copyright 2013 Cody Lundquist and various contributors. Released under the [MIT License (MIT)](LICENSE).
