import Conductor from "@/index.ts";
import oscillators from "@/instrument-packs/oscillators.ts";
import noises from "@/instrument-packs/noises.ts";

// Load instrument packs
Conductor.loadPack("instrument", "oscillators", oscillators);
Conductor.loadPack("instrument", "noises", noises);

document.addEventListener("DOMContentLoaded", () => {
  let tempo = 180;
  let volume = 50;
  let muted = false;
  let loop = false;
  let playing = false;
  let paused = false;
  let currentSeconds = 0;
  let totalSeconds = 0;
  let pauseTicker = false;

  const conductor = new Conductor();
  conductor.setTimeSignature(2, 2);
  conductor.setTempo(tempo);

  const rightHand = conductor.createInstrument("square", "oscillators");
  const leftHand = conductor.createInstrument("triangle", "oscillators");
  const drum = conductor.createInstrument("white", "noises");

  drum.setVolume(50); // Initial volume for drum, master volume is separate

  /**
   * Music Composition (same as original)
   */
  // Bar 1
  rightHand
    .note("quarter", "E5, F#4")
    .note("quarter", "E5, F#4")
    .rest("quarter")
    .note("quarter", "E5, F#4");
  leftHand
    .note("quarter", "D3")
    .note("quarter", "D3")
    .rest("quarter")
    .note("quarter", "D3");
  drum.rest("whole");
  // Bar2
  rightHand
    .rest("quarter")
    .note("quarter", "C5, F#4")
    .note("quarter", "E5, F#4")
    .rest("quarter");
  leftHand
    .rest("quarter")
    .note("quarter", "D3")
    .note("quarter", "D3")
    .rest("quarter");
  drum.rest("whole");
  // Bar 3
  rightHand.note("quarter", "G5, B4, G4").rest("quarter").rest("half");
  leftHand.rest("whole");
  drum.rest("whole");
  // Bar 4
  rightHand.note("quarter", "G4").rest("quarter").rest("half");
  leftHand.note("quarter", "G3").rest("quarter").rest("half");
  drum.rest("whole");
  // Bar 5/13
  rightHand
    .repeatStart()
    .note("quarter", "C5, E4")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "G4, C4");
  leftHand
    .repeatStart()
    .note("quarter", "G3")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "E3");
  drum
    .repeatStart()
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // bar 6/14
  rightHand.rest("half").note("quarter", "E4, G3").rest("quarter");
  leftHand.rest("half").note("quarter", "C3").rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 7/15
  rightHand
    .rest("quarter")
    .note("quarter", "A4, C4")
    .rest("quarter")
    .note("quarter", "B4, D4");
  leftHand
    .rest("quarter")
    .note("quarter", "F3")
    .rest("quarter")
    .note("quarter", "G3");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 8/16
  rightHand
    .rest("quarter")
    .note("quarter", "Bb4, Db4")
    .note("quarter", "A4, C4")
    .rest("quarter");
  leftHand
    .rest("quarter")
    .note("quarter", "Gb3")
    .note("quarter", "F3")
    .rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 9/17
  rightHand
    .note("tripletHalf", "G4, C4")
    .note("tripletHalf", "E5, G4")
    .note("tripletHalf", "G5, B4");
  leftHand
    .note("tripletHalf", "E3")
    .note("tripletHalf", "C4")
    .note("tripletHalf", "E4");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 10/18
  rightHand
    .note("quarter", "A5, C5")
    .rest("quarter")
    .note("quarter", "F5, A4")
    .note("quarter", "G5, B4");
  leftHand
    .note("quarter", "F4")
    .rest("quarter")
    .note("quarter", "D4")
    .note("quarter", "E4");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 11/19
  rightHand
    .rest("quarter")
    .note("quarter", "E5, G4")
    .rest("quarter")
    .note("quarter", "C5, E4");
  leftHand
    .rest("quarter")
    .note("quarter", "C4")
    .rest("quarter")
    .note("quarter", "A3");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 12/20
  rightHand.note("quarter", "D5, F4").note("quarter", "B4, D4").rest("half");
  rightHand.repeat(1); // Repeat back to Bar 5
  leftHand.note("quarter", "B3").note("quarter", "G3").rest("half");
  leftHand.repeat(1); // Repeat back to Bar 5
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  drum.repeat(1);
  // Bar 21
  rightHand.rest("half").note("quarter", "G5, E5").note("quarter", "Gb5, Eb5");
  leftHand
    .note("quarter", "C3")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "G3");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 22
  rightHand
    .note("quarter", "F5, D5")
    .note("quarter", "D#5, B4")
    .rest("quarter")
    .note("quarter", "E5, C5");
  leftHand.rest("half").note("quarter", "C4").rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 23
  rightHand
    .rest("quarter")
    .note("quarter", "G#4, E4")
    .note("quarter", "A4, F4")
    .note("quarter", "C5, A4");
  leftHand
    .note("quarter", "F3")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "C4");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 24
  rightHand
    .rest("quarter")
    .note("quarter", "A4, C4")
    .note("quarter", "C5, E4")
    .note("quarter", "D5, F4");
  leftHand
    .note("quarter", "C4")
    .rest("quarter")
    .note("quarter", "F3")
    .rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 25
  rightHand.rest("half").note("quarter", "G5, E5").note("quarter", "Gb5, Eb5");
  leftHand
    .note("quarter", "C3")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "E3");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 26
  rightHand
    .note("quarter", "F5, D5")
    .note("quarter", "D#5, B4")
    .rest("quarter")
    .note("quarter", "E5, C5");
  leftHand.rest("half").note("quarter", "G3").note("quarter", "C4");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 27
  rightHand
    .rest("quarter")
    .note("quarter", "C6, G6, F6")
    .rest("quarter")
    .note("quarter", "C6, G6, F6");
  leftHand.rest("whole");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 28
  rightHand.note("quarter", "C6, G6, F6").rest("quarter").rest("half");
  leftHand.rest("half").note("quarter", "G3").rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 29
  rightHand.rest("half").note("quarter", "G5, E5").note("quarter", "Gb5, Eb5");
  leftHand
    .note("quarter", "C3")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "G3");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 30
  rightHand
    .note("quarter", "F5, D5")
    .note("quarter", "D#5, B4")
    .rest("quarter")
    .note("quarter", "E5, C5");
  leftHand.rest("half").note("quarter", "C4").rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 31
  rightHand
    .rest("quarter")
    .note("quarter", "G#4, E4")
    .note("quarter", "A4, F4")
    .note("quarter", "C5, A4");
  leftHand
    .note("quarter", "F3")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "C4");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 32
  rightHand
    .rest("quarter")
    .note("quarter", "A4, C4")
    .note("quarter", "C5, E4")
    .note("quarter", "D5, F4");
  leftHand
    .note("quarter", "C4")
    .rest("quarter")
    .note("quarter", "F3")
    .rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 33
  rightHand.rest("half").note("quarter", "Eb5, Ab4").rest("quarter");
  leftHand
    .note("quarter", "C3")
    .rest("quarter")
    .note("quarter", "Ab3")
    .rest("quarter");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 34
  rightHand.rest("quarter").note("quarter", "D5, F4").rest("half");
  leftHand.rest("quarter").note("quarter", "Bb3").rest("half");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 35
  rightHand.note("quarter", "C5, E4").rest("quarter").rest("half");
  leftHand
    .note("quarter", "C4")
    .rest("quarter")
    .rest("quarter")
    .note("quarter", "G3");
  drum
    .note("eighth", "white")
    .rest("eighth")
    .rest("quarter")
    .note("tripletQuarter", "white")
    .rest("tripletQuarter")
    .note("tripletQuarter", "white");
  // Bar 36
  rightHand.rest("whole");
  leftHand
    .note("quarter", "G3")
    .rest("quarter")
    .note("quarter", "C3")
    .rest("quarter");
  drum.rest("whole");

  rightHand.repeatFromBeginning(5);
  leftHand.repeatFromBeginning(5);
  drum.repeatFromBeginning(5);

  const player = conductor.finish();
  conductor.setMasterVolume(volume / 100);
  totalSeconds = conductor.getTotalSeconds();

  // DOM Elements
  const currentTimeEl = document.getElementById(
    "currentTime"
  ) as HTMLSpanElement;
  const totalTimeEl = document.getElementById("totalTime") as HTMLSpanElement;
  const timeSliderEl = document.getElementById(
    "timeSlider"
  ) as HTMLInputElement;
  const playBtnEl = document.getElementById("playBtn") as HTMLButtonElement;
  const pauseBtnEl = document.getElementById("pauseBtn") as HTMLButtonElement;
  const stopBtnEl = document.getElementById("stopBtn") as HTMLButtonElement;
  const muteBtnEl = document.getElementById("muteBtn") as HTMLButtonElement;
  const loopBtnEl = document.getElementById("loopBtn") as HTMLButtonElement;
  const volumeValueEl = document.getElementById(
    "volumeValue"
  ) as HTMLSpanElement;
  const volumeSliderEl = document.getElementById(
    "volumeSlider"
  ) as HTMLInputElement;
  const tempoValueEl = document.getElementById("tempoValue") as HTMLSpanElement;
  const tempoSliderEl = document.getElementById(
    "tempoSlider"
  ) as HTMLInputElement;

  // Helper to format time (replaces musicTime filter)
  function formatMusicTime(totalSeconds: number): string {
    const flooredSeconds = Math.floor(totalSeconds);
    const mins = Math.floor(flooredSeconds / 60);
    const secs = flooredSeconds % 60;
    const pad = (num: number, size: number) =>
      (10 ** size + ~~num).toString().substring(1);
    return `${mins}:${pad(secs, 2)}`;
  }

  function updateUI() {
    if (!pauseTicker) {
      currentTimeEl.textContent = formatMusicTime(currentSeconds);
      timeSliderEl.value = currentSeconds.toString();
    }
    totalTimeEl.textContent = formatMusicTime(totalSeconds);
    timeSliderEl.max = totalSeconds.toString();

    playBtnEl.style.display = !playing || paused ? "inline-block" : "none";
    pauseBtnEl.style.display = playing && !paused ? "inline-block" : "none";

    volumeValueEl.textContent = muted ? "Muted" : volume.toString();
    volumeSliderEl.value = muted ? "0" : volume.toString();
    volumeSliderEl.disabled = muted;

    tempoValueEl.textContent = tempo.toString();
    tempoSliderEl.value = tempo.toString();

    muteBtnEl.classList.toggle("active", muted);
    loopBtnEl.classList.toggle("active", loop);
  }

  // Conductor Callbacks
  conductor.setTickerCallback((secondsValue: number) => {
    if (!pauseTicker) {
      currentSeconds = secondsValue;
      updateUI();
    }
  });

  conductor.setOnFinishedCallback(() => {
    playing = false;
    paused = false;
    // If not looping, reset currentSeconds to 0 or totalSeconds depending on desired behavior
    if (!loop) {
      currentSeconds = 0; // Reset to beginning
    }
    updateUI();
  });

  conductor.setOnDurationChangeCallback(() => {
    totalSeconds = conductor.getTotalSeconds();
    updateUI();
  });

  // Event Listeners
  playBtnEl.addEventListener("click", () => {
    playing = true;
    paused = false;
    player.play();
    updateUI();
  });

  pauseBtnEl.addEventListener("click", () => {
    paused = true;
    player.pause();
    updateUI();
  });

  stopBtnEl.addEventListener("click", () => {
    playing = false;
    paused = false;
    player.stop();
    currentSeconds = 0; // Reset time on stop
    updateUI();
  });

  timeSliderEl.addEventListener("mousedown", () => {
    pauseTicker = true;
  });

  timeSliderEl.addEventListener("mouseup", () => {
    pauseTicker = false;
    currentSeconds = Number.parseFloat(timeSliderEl.value);
    player.setTime(currentSeconds);
    updateUI();
  });
  timeSliderEl.addEventListener("input", () => {
    // For live update while dragging if desired
    if (pauseTicker) {
      // Only update text if actively dragging
      currentTimeEl.textContent = formatMusicTime(
        Number.parseFloat(timeSliderEl.value)
      );
    }
  });

  tempoSliderEl.addEventListener("mouseup", () => {
    // mouseup to avoid too many updates
    tempo = Number.parseInt(tempoSliderEl.value, 10);
    conductor.setTempo(tempo);
    // totalSeconds will be updated by onDurationChange callback
    updateUI(); // Update tempo display immediately
  });
  tempoSliderEl.addEventListener("input", () => {
    // For live update while dragging
    tempoValueEl.textContent = tempoSliderEl.value;
  });

  muteBtnEl.addEventListener("click", () => {
    muted = !muted;
    if (muted) {
      player.mute();
    } else {
      player.unmute();
    }
    updateUI();
  });

  loopBtnEl.addEventListener("click", () => {
    loop = !loop;
    player.loop(loop);
    updateUI();
  });

  volumeSliderEl.addEventListener("input", () => {
    if (!muted) {
      volume = Number.parseInt(volumeSliderEl.value, 10);
      conductor.setMasterVolume(volume / 100);
      volumeValueEl.textContent = volume.toString();
    }
  });

  // Initial UI setup
  conductor.setMasterVolume(volume / 100); // Set initial master volume
  totalSeconds = conductor.getTotalSeconds(); // Get initial total seconds
  updateUI();
});
