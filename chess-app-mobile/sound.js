// sound.js — Procedural SFX (Chrome‑safe, mobile‑safe)

window.registerPlugin((ctx) => {

  let audio = null;

  // ------------------------------------------------------------
  //  SAFE AUDIO CONTEXT (Chrome autoplay compliant)
  // ------------------------------------------------------------
  function getAudio() {
    if (!audio) {
      audio = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audio.state === "suspended") {
      audio.resume();
    }
    return audio;
  }

  // ------------------------------------------------------------
  //  GENERIC HELPERS
  // ------------------------------------------------------------
  function playTone(freq, duration, {
    type = "sine",
    volume = 0.4,
    attack = 0.005,
    decay = 0.08
  } = {}) {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);

    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ac.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + decay);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(ac.currentTime + duration);
  }

  function playNoise(duration, {
    volume = 0.25,
    lowpass = 800
  } = {}) {
    const ac = getAudio();
    const bufferSize = ac.sampleRate * duration;
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }

    const noise = ac.createBufferSource();
    noise.buffer = buffer;

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;

    const gain = ac.createGain();
    gain.gain.value = volume;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    noise.start();
    noise.stop(ac.currentTime + duration);
  }

  // ------------------------------------------------------------
  //  CORE CHESS SOUNDS
  // ------------------------------------------------------------
  function move() {
    const ac = getAudio();
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.09);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(t + 0.12);

    playNoise(0.08, { volume: 0.18, lowpass: 900 });
  }

  function capture() {
    const ac = getAudio();
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.07);

    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(t + 0.14);

    playNoise(0.09, { volume: 0.26, lowpass: 1100 });
  }

  function invalid() {
    const ac = getAudio();
    const t = ac.currentTime;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.05);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start();
    osc.stop(t + 0.1);
  }

  function click() {
    playTone(320, 0.07, {
      type: "square",
      volume: 0.25,
      attack: 0.003,
      decay: 0.06
    });
  }

  function check() {
    playTone(880, 0.12, {
      type: "sine",
      volume: 0.22,
      attack: 0.005,
      decay: 0.1
    });

    setTimeout(() => {
      playTone(1175, 0.11, {
        type: "sine",
        volume: 0.18,
        attack: 0.005,
        decay: 0.09
      });
    }, 70);
  }

  function checkmate() {
    playTone(440, 0.22, {
      type: "triangle",
      volume: 0.28,
      attack: 0.01,
      decay: 0.2
    });

    setTimeout(() => {
      playTone(554.37, 0.22, {
        type: "sine",
        volume: 0.24,
        attack: 0.01,
        decay: 0.2
      });
    }, 40);

    setTimeout(() => {
      playTone(659.25, 0.24, {
        type: "sine",
        volume: 0.22,
        attack: 0.01,
        decay: 0.22
      });
    }, 80);
  }

  function start() {
    playTone(523.25, 0.12, {
      type: "sine",
      volume: 0.2,
      attack: 0.005,
      decay: 0.1
    });

    setTimeout(() => {
      playTone(659.25, 0.12, {
        type: "sine",
        volume: 0.18,
        attack: 0.005,
        decay: 0.1
      });
    }, 80);
  }

  // ------------------------------------------------------------
  //  PUBLIC API
  // ------------------------------------------------------------
  ctx.sound = {
    move,
    capture,
    invalid,
    click,
    check,
    checkmate,
    start
  };

});
