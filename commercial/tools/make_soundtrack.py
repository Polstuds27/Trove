"""Synthesize an original 30 s score for the Trove commercial (no samples, no
third-party audio, so it is free to use). Writes public/audio/soundtrack.wav.

Cue sheet (seconds) mirrors src/theme.ts scene timing:
 0.0  hushed, slightly unresolved pad (Am add9) + sparse ticking plucks
 5.0  "Meet Trove": soft swell, warm resolve to F maj7 → C, bell hit
10.0  "Track. Plan. Grow.": gentle 96 bpm pluck groove; bell on each beat change
18.0  wins: three rising chimes at 19.6, 20.9, 22.1 s, sparkle on the third
25.0  logo: final C maj9 bloom, decays to silence by 30 s
"""

import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 30.0
N = int(SR * DUR)
t = np.arange(N) / SR
out = np.zeros((N, 2))
rng = np.random.default_rng(7)


def hz(note: str) -> float:
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    n, o = note[:-1], int(note[-1])
    return 440.0 * 2 ** ((names[n] + 12 * (o + 1) - 69) / 12)


def env_adsr(n, a, d, s, r, sustain_len):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    sl = max(0, int(sustain_len * SR))
    e = np.concatenate([np.linspace(0, 1, a, False), np.linspace(1, s, d, False), np.full(sl, s), np.linspace(s, 0, r)])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    j = min(N, i + len(sig))
    if j <= i:
        return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    out[i:j, 0] += sig[: j - i] * l * gain
    out[i:j, 1] += sig[: j - i] * r * gain


def pad(notes, start, length, gain=0.07):
    n = int((length + 2.5) * SR)
    tt = np.arange(n) / SR
    sig = np.zeros(n)
    for k, note in enumerate(notes):
        f = hz(note)
        for det in (-0.12, 0.0, 0.12):  # slow chorus
            ff = f * 2 ** (det / 12 / 4)
            sig += np.sin(2 * np.pi * ff * tt + k) + 0.25 * np.sin(4 * np.pi * ff * tt) + 0.08 * np.sin(6 * np.pi * ff * tt)
    sig /= len(notes) * 3
    sig *= env_adsr(n, 1.4, 0.5, 0.85, 2.5, length - 1.9)
    sig *= 1 + 0.08 * np.sin(2 * np.pi * 0.25 * tt)
    add(sig, start, -0.25, gain)
    add(np.roll(sig, int(0.013 * SR)), start, 0.25, gain)


def pluck(note, start, gain=0.12, pan=0.0, decay=3.5):
    f = hz(note)
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    e = np.exp(-tt * decay) * np.minimum(1, tt / 0.004)
    sig = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) * np.exp(-tt * 6) + 0.12 * np.sin(6 * np.pi * f * tt) * np.exp(-tt * 9)) * e
    add(sig, start, pan, gain)


def bell(note, start, gain=0.1, pan=0.0):
    f = hz(note)
    n = int(3.5 * SR)
    tt = np.arange(n) / SR
    sig = np.zeros(n)
    for ratio, amp, dec in ((1, 1, 1.4), (2.76, 0.35, 2.6), (5.4, 0.18, 4.0), (8.9, 0.07, 6.0)):
        sig += amp * np.sin(2 * np.pi * f * ratio * tt) * np.exp(-tt * dec)
    sig *= np.minimum(1, tt / 0.002)
    add(sig / 1.6, start, pan, gain)


def swell(start, length, gain=0.05):
    n = int(length * SR)
    noise = rng.standard_normal(n)
    # one-pole low-pass sweeping open
    y = np.zeros(n)
    acc = 0.0
    cut = np.linspace(0.01, 0.12, n)
    for i in range(n):
        acc += cut[i] * (noise[i] - acc)
        y[i] = acc
    y *= np.linspace(0, 1, n) ** 2
    y[-int(0.06 * SR):] *= np.linspace(1, 0, int(0.06 * SR))
    add(y, start, 0, gain * 4)


def sub_thump(start, gain=0.25):
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    f = 70 * np.exp(-tt * 6) + 42
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 7)
    add(sig, start, 0, gain)




# 0–5 s: uncertain
pad(["A2", "E3", "B3", "C4"], 0.0, 5.2, 0.06)
for k, s in enumerate([0.9, 1.6, 2.15, 2.9, 3.4, 3.9, 4.3]):
    pluck(["E5", "B4", "C5", "E5", "B4", "D5", "C5"][k], s, 0.05, pan=(-0.5 + k * 0.17), decay=5)
swell(3.9, 1.1, 0.04)

# 5–10 s: meet
sub_thump(5.0)
bell("C6", 5.05, 0.06, -0.2)
pad(["F2", "C3", "A3", "E4"], 5.0, 2.6, 0.065)
pad(["C3", "G3", "E4", "B4"], 7.5, 2.7, 0.06)
sub_thump(6.07, 0.16)  # Atlas lands
bell("G5", 8.27, 0.05, 0.3)  # wave
swell(9.3, 0.75, 0.035)

# 10–18 s: groove (96 bpm eighths)
beat = 60 / 96
prog = [["A2", "E3", "C4", "G4"], ["F2", "C3", "A3", "E4"], ["C3", "G3", "E4", "D5"], ["G2", "D3", "B3", "D4"]]
arp = [["A4", "C5", "E5", "G5"], ["A4", "C5", "F5", "E5"], ["G4", "C5", "E5", "D5"], ["G4", "B4", "D5", "G5"]]
start = 10.0
for bar in range(4):
    bt = start + bar * 4 * beat * 0.8333
    pad(prog[bar], bt, 4 * beat * 0.8333, 0.05)
    for e in range(8):
        pluck(arp[bar][e % 4], bt + e * beat / 2 * 0.8333, 0.045, pan=(-0.4 if e % 2 else 0.4), decay=4.5)
    sub_thump(bt, 0.12)
for s, n in ((10.0, "E6"), (12.5, "G6"), (15.0, "C7")):
    bell(n, s, 0.04, 0.1)
swell(17.4, 0.6, 0.03)

# 18–25 s: wins
pad(["F2", "C3", "A3", "C4"], 18.0, 3.4, 0.055)
pad(["G2", "D3", "B3", "D4"], 21.2, 3.9, 0.055)
for s, n in ((19.6, "E5"), (20.87, "G5"), (22.13, "C6")):
    bell(n, s, 0.075, 0.0)
    pluck(n.replace("5", "4").replace("6", "5"), s, 0.05)
sub_thump(22.25, 0.2)
for k in range(18):  # confetti sparkle
    bell(["C7", "E7", "G7", "D7"][k % 4], 22.25 + k * 0.045 + rng.random() * 0.03, 0.012, pan=rng.uniform(-0.8, 0.8))
swell(24.4, 0.6, 0.03)

# 25–30 s: logo bloom
sub_thump(25.0, 0.22)
pad(["C3", "G3", "E4", "B4", "D5"], 25.0, 3.6, 0.07)
bell("G5", 25.37, 0.06, -0.25)
bell("C6", 26.73, 0.05, 0.25)

# soft room: a few feedback taps
wet = np.zeros_like(out)
for d, g in ((0.083, 0.28), (0.131, 0.22), (0.197, 0.16), (0.271, 0.11), (0.389, 0.07)):
    k = int(d * SR)
    wet[k:, 0] += out[:-k, 1] * g
    wet[k:, 1] += out[:-k, 0] * g
mix = out + wet
mix *= np.concatenate([np.ones(N - SR), np.linspace(1, 0, SR)])[:, None]
mix /= np.max(np.abs(mix)) / 0.79  # about -2 dBFS peak
mix = np.tanh(mix * 1.1) / np.tanh(1.1)

dest = Path(__file__).resolve().parents[1] / "public" / "audio" / "soundtrack.wav"
dest.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(dest), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype("<i2").tobytes())
print("wrote", dest)
