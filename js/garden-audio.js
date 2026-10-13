const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SCALES = {
  spring: { root: 64, bpm: 84, scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 11, 14]], density: 0.34, lead: 'pluck', pad: 'soft', arp: true, flute: true },
  summer: { root: 65, bpm: 66, scale: [0, 2, 4, 7, 9, 11], chords: [[0, 4, 7, 11], [2, 5, 9, 12], [-1, 2, 7], [5, 9, 12, 14]], density: 0.36, lead: 'marimba', pad: 'warm', bass: true },
  autumn: { root: 57, bpm: 60, scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7, 10], [-4, 0, 3, 7], [5, 8, 12], [-2, 2, 5, 9]], density: 0.26, lead: 'harp', pad: 'bowed', bass: true },
  winter: { root: 62, bpm: 50, scale: [0, 2, 3, 7, 9], chords: [[0, 3, 7, 14], [-2, 2, 5, 9], [5, 9, 12], [3, 7, 10, 14]], density: 0.15, lead: 'musicbox', pad: 'air' },
};

export function createAudio() {
  const AC = new (window.AudioContext || window.webkitAudioContext)();
  const master = AC.createGain(); master.gain.value = 0.9;
  const comp = AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
  function impulse(dur, decay) { const len = Math.floor(AC.sampleRate * dur), b = AC.createBuffer(2, len, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }
  const verb = AC.createConvolver(); verb.buffer = impulse(3.2, 2.5); const verbOut = AC.createGain(); verbOut.gain.value = 0.5; verb.connect(verbOut); verbOut.connect(master);
  const bus = (v, send) => { const g = AC.createGain(); g.gain.value = v; g.connect(master); if (send) { const s = AC.createGain(); s.gain.value = send; g.connect(s); s.connect(verb); } return g; };
  const musicBus = bus(0.55, 0.6), sfxBus = bus(0.7, 0.35), ambBus = bus(0.6, 0.15);
  const noiseBuf = (() => { const b = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b; })();
  const noiseSrc = () => { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; };
  const filt = (type, f, q = 1) => { const b = AC.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const pan = p => { if (!AC.createStereoPanner) return AC.createGain(); const n = AC.createStereoPanner(); n.pan.value = Math.max(-1, Math.min(1, p || 0)); return n; };

  const windG = AC.createGain(); windG.gain.value = 0; const windF = filt('bandpass', 500, 0.5); const ws = noiseSrc(); ws.connect(windF); windF.connect(windG); windG.connect(ambBus); ws.start();
  const rainG = AC.createGain(); rainG.gain.value = 0; const rs = noiseSrc(), rh = filt('highpass', 900), rl = filt('lowpass', 7000); rs.connect(rh); rh.connect(rl); rl.connect(rainG); rainG.connect(ambBus); rs.start(0, 0.7);

  let env = { wind: 1, rain: 0, night: 0, season: 'summer', gust: false }, musicOn = true, ambOn = true, sfxOn = true;
  let lastBloom = 0, purrG = null, purrTO = 0;

  function tone(type, f, t, dur, vol, out, attack = 0.005) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); return o; }
  function bell(f, t, dur, vol, out, p = 0) { const pn = pan(p); pn.connect(out); tone('sine', f, t, dur, vol, pn); tone('sine', f * 2.01, t, dur * 0.5, vol * 0.25, pn); tone('triangle', f * 3, t, dur * 0.2, vol * 0.06, pn); }
  function padChord(fs, t, dur) {
    const g = AC.createGain(), lp = filt('lowpass', env.season === 'winter' ? 700 : 1000, 0.7);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 2); g.gain.setValueAtTime(0.035, t + dur - 2); g.gain.linearRampToValueAtTime(0, t + dur);
    lp.connect(g); g.connect(musicBus);
    fs.forEach(f => [-5, 5].forEach(dt => { const o = AC.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); }));
  }
  function env2(g, t, a, d, v) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function voice(kind, f, t, v, p) {
    const pn = pan(p); pn.connect(musicBus);
    if (kind === 'pluck') { tone('triangle', f, t, 0.45, v * 1.1, pn, 0.003); tone('sine', f * 2, t, 0.12, v * 0.3, pn, 0.003); }
    else if (kind === 'marimba') { tone('sine', f, t, 0.8, v * 1.2, pn, 0.002); tone('sine', f * 4, t, 0.07, v * 0.45, pn, 0.001); tone('sine', f * 10, t, 0.03, v * 0.12, pn, 0.001); }
    else if (kind === 'harp') { tone('triangle', f, t, 1.8, v, pn, 0.004); tone('sine', f * 2, t, 0.7, v * 0.35, pn, 0.004); }
    else if (kind === 'musicbox') { tone('sine', f * 2, t, 1.9, v * 0.9, pn, 0.002); tone('sine', f * 2 * 3.01, t, 0.45, v * 0.22, pn, 0.001); tone('sine', f * 4.02, t, 0.8, v * 0.12, pn, 0.001); }
    else bell(f, t, 1.8, v, musicBus, p);
  }
  function flute(f, t, dur, v) {
    const o = AC.createOscillator(), g = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain(), lp = filt('lowpass', 2400, 0.7);
    o.type = 'sine'; o.frequency.value = f; l.frequency.value = 5.2; lg.gain.value = f * 0.006; l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.18); g.gain.setValueAtTime(v, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(lp); lp.connect(g); g.connect(musicBus); o.start(t); l.start(t); o.stop(t + dur + 0.05); l.stop(t + dur + 0.05);
  }
  function pad2(kind, fs, t, dur) {
    if (kind === 'soft') return padChord(fs, t, dur);
    const g = AC.createGain(), lp = filt('lowpass', kind === 'warm' ? 900 : kind === 'bowed' ? 650 : 1800, 0.8), att = kind === 'bowed' ? 3 : 2, vol = kind === 'air' ? 0.03 : kind === 'bowed' ? 0.03 : 0.028;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.setValueAtTime(vol, t + dur - 2); g.gain.linearRampToValueAtTime(0, t + dur);
    lp.connect(g); g.connect(musicBus);
    if (kind === 'air') { const s = noiseSrc(), bp = filt('bandpass', fs[0] * 4, 6), ng = AC.createGain(); ng.gain.value = 0.5; s.connect(bp); bp.connect(ng); ng.connect(lp); s.start(t, Math.random()); s.stop(t + dur + 0.1); fs.forEach(f => { const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f * 2; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); }); return; }
    fs.forEach(f => [-7, 7].forEach(dt => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = kind === 'bowed' ? f / 2 : f; o.detune.value = dt; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); }));
  }
  function noiseHit(t, f, dur, vol, q = 1) { const s = noiseSrc(), bp = filt('bandpass', f, q), g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + dur + 0.05); }
  function bird(t) {
    const pn = pan((Math.random() - 0.5) * 1.6); pn.connect(ambBus);
    const n = 2 + ((Math.random() * 4) | 0), base = 2300 + Math.random() * 1600, kind = Math.random();
    for (let i = 0; i < n; i++) {
      const o = AC.createOscillator(), g = AC.createGain(), tt = t + i * (0.11 + Math.random() * 0.06), f = base * (0.9 + Math.random() * 0.3);
      o.type = 'sine'; o.frequency.setValueAtTime(f, tt);
      if (kind < 0.5) { o.frequency.exponentialRampToValueAtTime(f * 1.35, tt + 0.04); o.frequency.exponentialRampToValueAtTime(f * 0.85, tt + 0.09); } else o.frequency.exponentialRampToValueAtTime(f * 0.7, tt + 0.08);
      g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.04, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.1);
      o.connect(g); g.connect(pn); o.start(tt); o.stop(tt + 0.12);
    }
  }
  function cricket(t) { const pn = pan((Math.random() - 0.5) * 1.8); pn.connect(ambBus); const f = 4200 + Math.random() * 500, v = 0.012 * env.night; for (let i = 0; i < 3; i++) tone('sine', f, t + i * 0.045, 0.03, v, pn, 0.004); }

  let nextT = 0, step = 0, mi = 5, chord = [0, 4, 7], birdNext = 0, cricketNext = 0;
  function sched() {
    if (AC.state !== 'running') return;
    const now = AC.currentTime;
    if (nextT < now) nextT = now + 0.05;
    while (nextT < now + 0.3) {
      const S = SCALES[env.season] || SCALES.summer, night = env.night > 0.6, beat = 60 / (S.bpm * (night ? 0.85 : 1)) / 2, low = night ? -12 : 0, dens = S.density * (env.rain > 0.5 ? 0.6 : 1) * (night ? 0.6 : 1);
      if (musicOn) {
        if (step % 32 === 0) { chord = S.chords[(step / 32) % S.chords.length]; pad2(night && S.pad === 'soft' ? 'warm' : S.pad, chord.map(m => mtof(S.root - 12 + m)), nextT, beat * 32); }
        if (S.bass && step % 8 === 0) bell(mtof(S.root - 24 + chord[0]), nextT, 2.4, 0.07, musicBus);
        if (!S.bass && step % 16 === 0) bell(mtof(S.root - 24 + chord[0]), nextT, 3, 0.05, musicBus);
        if (S.arp && !night && step % 2 === 0 && Math.random() < 0.55) voice('pluck', mtof(S.root + chord[(step / 2) % chord.length]), nextT, 0.022, Math.sin(step * 0.4) * 0.5);
        if (Math.random() < dens) {
          mi = Math.max(0, Math.min(12, mi + Math.round((Math.random() - 0.5) * 4)));
          const L = S.scale.length, note = S.scale[mi % L] + 12 * Math.floor(mi / L);
          voice(S.arp ? 'harp' : S.lead, mtof(S.root + low + note), nextT, 0.04, (Math.random() - 0.5) * 0.8);
        }
        if (S.flute && !night && step % 16 === 8 && Math.random() < 0.4) flute(mtof(S.root + 12 + S.scale[(Math.random() * S.scale.length) | 0]), nextT, beat * 6, 0.03);
      }
      nextT += beat; step++;
    }
    if (ambOn) {
      if (now > birdNext) { birdNext = now + 2.5 + Math.random() * 6; if (env.night < 0.3 && env.rain < 0.4 && (env.season !== 'winter' || Math.random() < 0.25)) bird(now + 0.05); }
      if (now > cricketNext) { cricketNext = now + 0.35 + Math.random() * 0.5; if (env.night > 0.4 && env.season !== 'winter' && env.rain < 0.5) cricket(now + 0.02); }
    }
  }
  const iv = setInterval(sched, 60);

  function sfx(name, d = {}) {
    if (name === 'env') {
      env = { ...env, ...d }; const t = AC.currentTime, w = env.wind || 0;
      windG.gain.setTargetAtTime(ambOn ? 0.03 + w * 0.035 + (env.gust ? 0.08 : 0) + (env.storm || 0) * 0.06 : 0, t, 0.6);
      windF.frequency.setTargetAtTime(350 + w * 200 + (env.gust ? 400 : 0), t, 0.8);
      rainG.gain.setTargetAtTime(ambOn ? (env.rain || 0) * 0.16 : 0, t, 0.8);
      return;
    }
    if (!sfxOn || AC.state !== 'running') return;
    const t = AC.currentTime + 0.01, S = SCALES[env.season] || SCALES.summer, xx = d.x ?? 0.5, p = xx * 2 - 1;
    if (name === 'plant') { const idx = Math.floor(xx * 10) % S.scale.length; bell(mtof(S.root + S.scale[idx] + (xx > 0.5 ? 12 : 0)), t, 0.9, 0.09, sfxBus, p); tone('sine', mtof(S.root + S.scale[idx]) * 4, t, 0.08, 0.02, sfxBus); }
    else if (name === 'bloom') { if (t - lastBloom < 0.12) return; lastBloom = t; bell(mtof(S.root + 24 + S.scale[(Math.random() * S.scale.length) | 0]), t, 0.6, 0.022, sfxBus, p); }
    else if (name === 'thunk') { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.25); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.4); noiseHit(t, 400, 0.12, 0.15); bell(mtof(S.root + S.scale[0] - 12), t + 0.05, 1.6, 0.06, sfxBus, p); }
    else if (name === 'tap') { noiseHit(t, 1800, 0.05, 0.12, 3); tone('triangle', 520 + Math.random() * 80, t, 0.06, 0.05, sfxBus); }
    else if (name === 'splash' || name === 'water') {
      for (let i = 0; i < (name === 'splash' ? 5 : 3); i++) { const tt = t + i * 0.06 + Math.random() * 0.04, o = AC.createOscillator(), g = AC.createGain(), f = 500 + Math.random() * 500, pn = pan(p); o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * 2.4, tt + 0.07); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.08, tt + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.1); o.connect(g); g.connect(pn); pn.connect(sfxBus); o.start(tt); o.stop(tt + 0.12); }
      if (name === 'splash') noiseHit(t, 1200, 0.3, 0.1, 0.7);
    }
    else if (name === 'dig') { noiseHit(t, 300, 0.09, 0.3, 1.5); noiseHit(t + 0.11, 260, 0.08, 0.25, 1.5); }
    else if (name === 'quack') {
      const v = d.soft ? 0.05 : 0.14;
      for (let i = 0; i < (d.soft ? 1 : 2); i++) { const tt = t + i * 0.2, o = AC.createOscillator(), g = AC.createGain(), bp = filt('bandpass', 1100, 3), pn = pan(p); o.type = 'sawtooth'; o.frequency.setValueAtTime(340, tt); o.frequency.exponentialRampToValueAtTime(230, tt + 0.16); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(v, tt + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.18); o.connect(bp); bp.connect(g); g.connect(pn); pn.connect(sfxBus); o.start(tt); o.stop(tt + 0.2); }
    }
    else if (name === 'critter') { const f = mtof(S.root + 12 + S.scale[2]); bell(f, t, 0.4, 0.07, sfxBus, p); bell(f * 1.5, t + 0.09, 0.5, 0.06, sfxBus, p); }
    else if (name === 'purr') {
      if (!purrG) { purrG = AC.createGain(); purrG.gain.value = 0; const s = noiseSrc(), lp = filt('lowpass', 180, 1), am = AC.createGain(), lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 24; lg.gain.value = 0.5; am.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain); s.connect(lp); lp.connect(am); am.connect(purrG); purrG.connect(sfxBus); s.start(); lfo.start(); }
      purrG.gain.setTargetAtTime(0.55, t, 0.08); clearTimeout(purrTO); purrTO = setTimeout(() => purrG && purrG.gain.setTargetAtTime(0, AC.currentTime, 0.2), 450);
    }
    else if (name === 'gust') { const s = noiseSrc(), bp = filt('bandpass', 300, 0.8), g = AC.createGain(); bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(1400, t + 0.8); bp.frequency.exponentialRampToValueAtTime(300, t + 2.2); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.6); g.gain.linearRampToValueAtTime(0, t + 2.4); s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t, Math.random()); s.stop(t + 2.5); }
    else if (name === 'season') S.scale.slice(0, 4).forEach((n, i) => bell(mtof(S.root + 12 + n), t + i * 0.12, 1.4, 0.06, sfxBus, -0.4 + i * 0.25));
    else if (name === 'ui') tone('sine', 1400, t, 0.05, 0.03, sfxBus);
    else if (name === 'chirp') { const pn = pan(p); pn.connect(ambBus); const f = 3000 + Math.random() * 1500, n = 2 + ((Math.random() * 3) | 0); for (let i = 0; i < n; i++) { const tt = t + i * 0.09, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * (i % 2 ? 0.8 : 1.3), tt + 0.05); env2(g, tt, 0.005, 0.07, 0.035); o.connect(g); g.connect(pn); o.start(tt); o.stop(tt + 0.1); } }
    else if (name === 'flutter') { for (let i = 0; i < 4; i++) noiseHit(t + i * 0.05, 1800 + Math.random() * 600, 0.04, 0.05, 2); }
    else if (name === 'nibble') { for (let i = 0; i < 4; i++) { const pn = pan(p); pn.connect(sfxBus); const s2 = noiseSrc(), bp = filt('bandpass', 2600 + Math.random() * 800, 4), g = AC.createGain(), tt = t + i * 0.11; env2(g, tt, 0.002, 0.04, 0.12); s2.connect(bp); bp.connect(g); g.connect(pn); s2.start(tt, Math.random()); s2.stop(tt + 0.06); } }
    else if (name === 'thump') { const pn = pan(p); pn.connect(sfxBus); const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.1); env2(g, t, 0.003, 0.12, 0.18); o.connect(g); g.connect(pn); o.start(t); o.stop(t + 0.15); }
    else if (name === 'snuffle') { for (let i = 0; i < 3; i++) { const pn = pan(p); pn.connect(ambBus); const s2 = noiseSrc(), bp = filt('bandpass', 900 + Math.random() * 400, 2), g = AC.createGain(), tt = t + i * 0.13; env2(g, tt, 0.02, 0.07, 0.07); s2.connect(bp); bp.connect(g); g.connect(pn); s2.start(tt, Math.random()); s2.stop(tt + 0.1); } }
    else if (name === 'yip') { const pn = pan(p); pn.connect(ambBus); for (let i = 0; i < (d.soft ? 1 : 2); i++) { const tt = t + i * 0.16, o = AC.createOscillator(), g = AC.createGain(), bp = filt('bandpass', 1400, 2); o.type = 'sawtooth'; o.frequency.setValueAtTime(700, tt); o.frequency.exponentialRampToValueAtTime(1300, tt + 0.05); o.frequency.exponentialRampToValueAtTime(600, tt + 0.12); env2(g, tt, 0.01, 0.12, d.soft ? 0.05 : 0.09); o.connect(bp); bp.connect(g); g.connect(pn); o.start(tt); o.stop(tt + 0.15); } }
    else if (name === 'snort') { const pn = pan(p); pn.connect(sfxBus); const s2 = noiseSrc(), lp = filt('lowpass', 700, 1), g = AC.createGain(); env2(g, t, 0.01, 0.25, 0.22); s2.connect(lp); lp.connect(g); g.connect(pn); s2.start(t, Math.random()); s2.stop(t + 0.3); for (let i = 0; i < 4; i++) noiseHit(t + 0.15 + i * 0.09, 300, 0.05, 0.08, 1.5); }
    else if (name === 'owl') { const pn = pan(p); pn.connect(ambBus); [[0, 0.32, 380], [0.45, 0.2, 360], [0.7, 0.5, 350]].forEach(([dt2, dur, f]) => { const o = AC.createOscillator(), g = AC.createGain(), tt = t + dt2; o.type = 'sine'; o.frequency.setValueAtTime(f, tt); o.frequency.linearRampToValueAtTime(f * 0.94, tt + dur); g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(0.05, tt + 0.06); g.gain.linearRampToValueAtTime(0, tt + dur); o.connect(g); g.connect(pn); o.start(tt); o.stop(tt + dur + 0.05); }); }
    else if (name === 'frog') { const pn = pan(p); pn.connect(ambBus); const f = 160 + Math.random() * 60; for (let i = 0; i < 2; i++) { const tt = t + i * 0.12 + Math.random() * 0.3, o = AC.createOscillator(), g = AC.createGain(), bp = filt('bandpass', 700, 3); o.type = 'square'; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * 0.7, tt + 0.1); env2(g, tt, 0.005, 0.1, 0.06); o.connect(bp); bp.connect(g); g.connect(pn); o.start(tt); o.stop(tt + 0.13); } }
    else if (name === 'thunder') { const pn = pan(p); pn.connect(sfxBus); const s2 = noiseSrc(), lp = filt('lowpass', 260, 0.7), g = AC.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.55, t + 0.08); g.gain.exponentialRampToValueAtTime(0.18, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.6); lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(140, t + 2.5); s2.connect(lp); lp.connect(g); g.connect(pn); s2.start(t, Math.random()); s2.stop(t + 3.8); noiseHit(t, 2200, 0.12, 0.2, 0.8); }
    else if (name === 'harvest') { tone('sine', 220, t, 0.08, 0.15, sfxBus); [0, 4, 7].forEach((n, i) => bell(mtof(S.root + 12 + n), t + 0.05 + i * 0.06, 0.6, 0.05, sfxBus, p)); }
    else if (name === 'discover') { [0, 2, 4, 7, 12].forEach((n, i) => bell(mtof(S.root + 12 + (S.scale[i % S.scale.length] ?? n)), t + i * 0.09, 1.2, 0.05, sfxBus, -0.4 + i * 0.2)); }
    else if (name === 'rainbow') { S.scale.forEach((n, i) => bell(mtof(S.root + 24 + n), t + i * 0.1, 1.6, 0.035, sfxBus, -0.6 + i * 0.25)); }
    else if (name === 'shutter') { noiseHit(t, 3000, 0.03, 0.25, 2); noiseHit(t + 0.07, 1800, 0.05, 0.2, 2); }
    else if (name === 'scrape') { const s2 = noiseSrc(), bp = filt('bandpass', d.bed ? 380 : 1200, 1.2), g = AC.createGain(), pn = pan(p); env2(g, t, 0.01, 0.12, 0.08); s2.connect(bp); bp.connect(g); g.connect(pn); pn.connect(sfxBus); s2.start(t, Math.random()); s2.stop(t + 0.15); }
  }

  return {
    resume: () => AC.resume(), sfx,
    setMusic(v) { musicOn = v; musicBus.gain.setTargetAtTime(v ? 0.55 : 0, AC.currentTime, 0.3); },
    setAmbient(v) { ambOn = v; sfx('env', {}); },
    destroy() { clearInterval(iv); clearTimeout(purrTO); AC.close(); },
  };
}
