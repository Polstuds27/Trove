"""Procedural, royalty-free audio bed for the FinTrack commercial.

Synthesized from scratch with numpy (no samples, no copyrighted material):
sub-bass pulse groove, soft pad chords, impact hits on every scene cut,
noise-sweep whooshes into transitions, UI clicks under the transaction cards,
final logo impact. 20.0s stereo 44.1kHz.
"""
import numpy as np
import imageio.v3 as iio  # noqa: F401  (ensures imageio import path warms; unused)
import wave, struct, os

SR = 44100
DUR = 20.0
N = int(SR * DUR)
t = np.arange(N) / SR

L = np.zeros(N)
R = np.zeros(N)


def add(sig, at, left=0.8, right=0.8):
    s = int(at * SR)
    e = min(N, s + len(sig))
    if e <= s:
        return
    L[s:e] += sig[: e - s] * left
    R[s:e] += sig[: e - s] * right


def env(n, decay):
    return np.exp(-np.arange(n) / (SR * decay))


def kick(at, freq=55.0, decay=0.35, gain=0.5):
    n = int(SR * 1.2)
    tt = np.arange(n) / SR
    sig = np.sin(2 * np.pi * freq * tt) * env(n, decay) * gain
    add(sig, at)


def impact(at, gain=0.7, sweep=(70.0, 34.0)):
    n = int(SR * 1.6)
    tt = np.arange(n) / SR
    f = sweep[0] + (sweep[1] - sweep[0]) * (tt / 1.6)
    phase = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(phase) * env(n, 0.5) * gain
    # noise thump layered in
    nz = int(SR * 0.25)
    noise = np.random.default_rng(7).standard_normal(nz)
    nenv = np.exp(-np.arange(nz) / (SR * 0.05))
    sig[:nz] += noise * nenv * gain * 0.35
    add(sig, at)


def whoosh(at, dur=0.45, gain=0.16, up=True):
    n = int(SR * dur)
    rng = np.random.default_rng(21)
    noise = rng.standard_normal(n)
    # crude band sweep via cumulative weighting
    w = np.linspace(0.1, 1.0, n) if up else np.linspace(1.0, 0.1, n)
    fade = np.sin(np.pi * np.arange(n) / n) ** 0.5
    sig = noise * w * fade * gain
    add(sig, at)


def click(at, freq=2100.0, gain=0.10):
    n = int(SR * 0.07)
    tt = np.arange(n) / SR
    sig = np.sin(2 * np.pi * freq * tt) * env(n, 0.012) * gain
    add(sig, at)


def hat(at, gain=0.05):
    n = int(SR * 0.03)
    rng = np.random.default_rng(int(at * 100) + 3)
    sig = rng.standard_normal(n) * env(n, 0.006) * gain
    # crude highpass: differentiate
    sig = np.diff(sig, prepend=0)
    add(sig, at)


def pad(chords, gain=0.05):
    # chords: list of (start, dur, [freqs])
    for start, dur, freqs in chords:
        n = int(SR * dur)
        tt = np.arange(n) / SR
        sig = np.zeros(n)
        for f in freqs:
            sig += np.sin(2 * np.pi * f * tt) * 0.5 + np.sin(2 * np.pi * f * 1.003 * tt) * 0.3
        fade = np.sin(np.pi * np.arange(n) / n)
        sig = sig / max(1, len(freqs)) * fade * gain
        add(sig, start, 0.9, 0.7)


# --- groove: soft pulse at ~96bpm, hats offbeat, very low in the mix
for b in range(40):
    at = b * 0.625
    if at >= DUR:
        break
    kick(at, freq=52.0, decay=0.22, gain=0.30 if b % 4 == 0 else 0.16)
    if b % 2 == 1:
        hat(at + 0.3125, gain=0.035)

# --- pad: Am F C G, 5s each
A2, C3, D3, E3, F2, G2 = 110.0, 130.81, 146.83, 164.81, 87.31, 98.0
A3, C4, E4, F3, G3 = 220.0, 261.63, 329.63, 174.61, 196.0
pad([
    (0.0, 5.2, [A2, E3, A3, C4]),
    (5.0, 5.2, [F2, C3, F3, A3]),
    (10.0, 5.2, [87.31 * 1.0, 130.81, 174.61, 261.63]),
    (15.0, 5.2, [G2, D3, G3, 246.94]),
], gain=0.045)

# --- impacts on every scene cut
for at, g in [(0.0, 0.8), (2.5, 0.55), (5.5, 0.55), (9.0, 0.55), (12.5, 0.6), (15.5, 0.65), (18.0, 0.9)]:
    impact(at, gain=g)

# --- whooshes into the big transitions
for at in [2.1, 5.1, 8.6, 12.1, 15.1, 17.6]:
    whoosh(at)

# --- UI clicks under the transaction cards + final sparkle
for at in [6.1, 6.6, 7.1, 7.6]:
    click(at)
click(19.0, freq=2600.0, gain=0.12)
click(19.25, freq=3200.0, gain=0.10)

# --- master: normalize + short fade out
peak = max(float(np.max(np.abs(L))), float(np.max(np.abs(R))), 1e-6)
g = 0.89 / peak
L *= g
R *= g
fade_n = int(SR * 0.5)
fade = np.linspace(1.0, 0.0, fade_n)
L[-fade_n:] *= fade
R[-fade_n:] *= fade

stereo = np.stack([L, R], axis=1)
pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "audio", "bed.wav")
os.makedirs(os.path.dirname(out), exist_ok=True)
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out, f"{os.path.getsize(out)/1e6:.1f} MB")
