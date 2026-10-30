"""Upbeat 128 BPM fintech soundtrack, synthesized from scratch (numpy).

No samples, no loops, nothing copyrighted: four-on-the-floor drums, pumping
bass, bright pluck arp with echo, soft pads, risers, impacts, UI clicks and a
final logo stinger. 20.0s stereo 44.1kHz. Ducking under voiceover happens in
mix_vo2.py, not here.
"""
import os
import wave
import numpy as np

SR = 44100
DUR = 20.0
N = int(SR * DUR)
BPM = 128.0
BEAT = 60.0 / BPM  # 0.46875

rng = np.random.default_rng(20261007)

L = np.zeros(N)
R = np.zeros(N)


def add(sig, at, l=0.8, r=0.8):
    s = int(at * SR)
    e = min(N, s + len(sig))
    if e > s:
        L[s:e] += sig[: e - s] * l
        R[s:e] += sig[: e - s] * r


def env_ad(n, a, d):
    t = np.arange(n)
    attack = np.minimum(1.0, t / max(1, int(SR * a)))
    return attack * np.exp(-t / (SR * d))


def kick(at, gain=0.85):
    n = int(SR * 0.32)
    tt = np.arange(n) / SR
    f = 150.0 * np.exp(-tt / 0.045) + 44.0
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.002, 0.11) * gain
    add(sig, at)


def clap(at, gain=0.4):
    n = int(SR * 0.22)
    nz = rng.standard_normal(n)
    # crude bandpass around 1.8kHz via moving-average subtraction
    k = int(SR / 1800)
    bp = nz - np.convolve(nz, np.ones(k) / k, mode="same")
    sig = bp * env_ad(n, 0.001, 0.06) * gain
    add(sig, at, 0.75, 0.75)


def hat(at, gain=0.10, open_=False):
    n = int(SR * (0.09 if open_ else 0.03))
    nz = rng.standard_normal(n)
    hp = np.diff(nz, prepend=0)  # crude highpass
    sig = hp * env_ad(n, 0.001, 0.012 if not open_ else 0.05) * gain
    add(sig, at, 0.55, 0.75)


def snare_roll(at, dur, gain=0.30):
    n = int(SR * dur)
    nz = rng.standard_normal(n)
    k = int(SR / 2000)
    bp = nz - np.convolve(nz, np.ones(k) / k, mode="same")
    ramp = np.linspace(0.15, 1.0, n)
    sig = bp * env_ad(n, 0.005, dur) * ramp * gain
    add(sig, at, 0.7, 0.7)


def bass_note(at, dur, freq, gain=0.34):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    raw = np.sin(2 * np.pi * freq * tt) + 0.4 * np.sin(2 * np.pi * 2 * freq * tt) + 0.15 * np.sin(
        2 * np.pi * 3 * freq * tt
    )
    # one-pole lowpass for roundness
    a = 0.25
    y = np.zeros(n)
    acc = 0.0
    for i in range(n):
        acc += a * (raw[i] - acc)
        y[i] = acc
    sig = y * env_ad(n, 0.005, dur * 0.9) * gain
    add(sig, at)


def pluck(at, freq, gain=0.16, dur=0.30, l=0.6, r=0.6):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    sig = (
        np.sin(2 * np.pi * freq * tt)
        + 0.35 * np.sin(2 * np.pi * 2 * freq * tt)
        + 0.12 * np.sin(2 * np.pi * 3.01 * freq * tt)
    ) * env_ad(n, 0.002, 0.09) * gain
    add(sig, at, l, r)


def echo_feedback(delay_beats=1.5, fb=0.35, gain=0.5):
    global L, R
    d = int(SR * BEAT * delay_beats)
    for ch in (L, R):
        wet = np.zeros_like(ch)
        wet[d:] = ch[:-d] * fb
        ch += wet * gain


def impact(at, gain=0.7):
    n = int(SR * 1.4)
    tt = np.arange(n) / SR
    f = 75.0 + (32.0 - 75.0) * (tt / 1.4)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.002, 0.45) * gain
    nz = int(SR * 0.2)
    sig[:nz] += rng.standard_normal(nz) * env_ad(nz, 0.001, 0.04) * gain * 0.3
    add(sig, at)


def stab(at, freqs, gain=0.30, dur=1.2):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    sig = np.zeros(n)
    for f in freqs:
        sig += np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
    sig = sig / len(freqs) * env_ad(n, 0.003, 0.5) * gain
    add(sig, at)


def whoosh(at, dur=0.45, gain=0.15, up=True):
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    w = np.linspace(0.1, 1.0, n) if up else np.linspace(1.0, 0.1, n)
    sig = noise * w * (np.sin(np.pi * np.arange(n) / n) ** 0.5) * gain
    add(sig, at)


def click(at, freq=2200.0, gain=0.09):
    n = int(SR * 0.06)
    tt = np.arange(n) / SR
    add(np.sin(2 * np.pi * freq * tt) * env_ad(n, 0.001, 0.01) * gain, at)


def sparkle(at, freq=3400.0, gain=0.10):
    n = int(SR * 0.5)
    tt = np.arange(n) / SR
    add(np.sin(2 * np.pi * freq * tt) * env_ad(n, 0.002, 0.18) * gain, at)


# --- harmony: Am F C G, then lift to C for the finale
A2, C3, D3, E3, F2, G2, A3, B3 = 110.0, 130.81, 146.83, 164.81, 87.31, 98.0, 220.0, 246.94
C4, D4, E4, F3, G3, A4, C5 = 261.63, 293.66, 329.63, 174.61, 196.0, 440.0, 523.25
SECTIONS = [
    (0.0, 5.0, [A2, C3, E3], [A3, C4, E4, A4]),
    (5.0, 10.0, [F2, 110.0, C3], [F3, A3, C4, F3 * 2]),
    (10.0, 15.0, [65.41, 130.81, 164.81], [261.63, 329.63, 392.0, 523.25]),
    (15.0, 17.6, [G2, B3 / 2, D3], [G3, B3, D4, G3 * 2]),
    (17.6, 20.0, [65.41, 130.81, 196.0], [261.63, 329.63, 392.0, 523.25]),
]

# --- drums: four-floor kicks, claps on 2 & 4, offbeat hats, extra 16ths late
nb = int(DUR / BEAT)
for b in range(nb + 1):
    at = b * BEAT
    if at >= DUR:
        break
    bar = (b // 4) % 2 == 1
    kick(at, gain=0.8 if b % 4 == 0 else 0.62)
    if b % 4 == 1 or b % 4 == 3:
        clap(at, gain=0.38)
    hat(at + BEAT / 2, gain=0.085)
    if at >= 15.5:  # final lift: 16th hats
        hat(at + BEAT / 4, gain=0.05)
        hat(at + 3 * BEAT / 4, gain=0.05)
    if b % 8 == 6:
        hat(at + BEAT / 2, gain=0.06, open_=True)

# --- bass: driving 8ths on section roots
for start, end, roots, _ in SECTIONS:
    b = 0
    while True:
        at = start + b * BEAT / 2
        if at >= min(end, DUR - 0.2):
            break
        root = roots[(b // 2) % len(roots)] if b % 4 < 3 else roots[0]
        bass_note(at, BEAT * 0.48, root, gain=0.30)
        b += 1

# --- arp: 16th chord-tone plucks with stereo spread
for start, end, _, tones in SECTIONS:
    i = 0
    while True:
        at = start + i * BEAT / 4
        if at >= min(end, DUR - 0.1):
            break
        f = tones[i % len(tones)] * (2 if i % 8 == 7 else 1)
        pluck(at, f, gain=0.11, l=0.62 if i % 2 == 0 else 0.4, r=0.4 if i % 2 == 0 else 0.62)
        i += 1
echo_feedback(delay_beats=1.5, fb=0.32, gain=0.5)

# --- soft pad glue (very low)
for start, end, roots, _ in SECTIONS:
    n = int(SR * (end - start))
    tt = np.arange(n) / SR
    sig = np.zeros(n)
    for f in roots:
        sig += np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * 1.004 * tt) * 0.3
    fade = np.sin(np.pi * np.arange(n) / n) ** 0.5
    add(sig / len(roots) * fade * 0.05, start, 0.9, 0.7)

# --- accents, transitions, stinger
for at, g in [(0.0, 0.85), (2.5, 0.5), (5.5, 0.5), (9.0, 0.5), (12.5, 0.55), (15.5, 0.6)]:
    impact(at, gain=g)
for at in [2.05, 5.05, 8.55, 12.05, 15.05, 17.55]:
    whoosh(at)
snare_roll(16.5, 1.5, gain=0.30)
impact(18.0, gain=0.95)
stab(18.0, [261.63, 329.63, 392.0, 523.25], gain=0.32, dur=1.9)
sparkle(18.6, 3400.0, 0.10)
sparkle(19.0, 4200.0, 0.08)
for at in [6.1, 6.6, 7.1, 7.6]:
    click(at)

# --- master glue + level + click-free end
mix = np.tanh(np.stack([L, R], axis=1) * 1.1)
peak = float(np.abs(mix).max()) or 1.0
mix = mix / peak * 0.89
fn = int(SR * 0.15)
mix[-fn:] *= np.linspace(1.0, 0.0, fn)[:, None]

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "audio", "music.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave

with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out, f"{os.path.getsize(out)/1e6:.1f} MB")
