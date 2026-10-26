"""Assemble the final audio: VO lines on timeline, bed ducked beneath them,
riser into the hook payoff, warm resolve under the brand.

Outputs (44.1kHz stereo 20.0s):
  public/audio/voice.wav  — narration only (for inspection/remix)
  public/audio/bed_mix.wav — music bed, ducked under narration + riser/resolve
"""
import os
import wave
import numpy as np

SR = 44100
DUR = 20.0
N = int(SR * DUR)
VO_DIR = r"C:\Users\leomo\AppData\Local\Temp\opencode\vo"
HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "public", "audio")


def load_mono_wav(path):
    with wave.open(path, "rb") as w:
        assert w.getframerate() == SR, path
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        return x


def place(track, sig, at):
    s = int(at * SR)
    e = min(N, s + len(sig))
    if e > s:
        track[s:e] += sig[: e - s]


# Placement (measured line durations, breathing room each side).
SPOTS = [
    ("l1_hook.wav", 0.10),
    ("l2_reveal.wav", 2.70),
    ("l3_tx.wav", 5.80),
    ("l4_insights.wav", 9.20),
    ("l5_montage.wav", 12.60),
    ("l6_offline.wav", 15.70),
    ("l7_brand.wav", 18.05),
]

voice = np.zeros(N)
for name, at in SPOTS:
    sig = load_mono_wav(os.path.join(VO_DIR, name))
    # normalize each line to a consistent, present level
    peak = float(np.abs(sig).max()) or 1.0
    place(voice, sig / peak * 0.85, at)

np.save(os.path.join(VO_DIR, "_voice_track.npy"), voice)

# --- ducking envelope from VO energy (50ms windows, smooth attack/release)
win = int(SR * 0.05)
nwin = N // win
env = np.array([float((voice[i * win : (i + 1) * win] ** 2).mean()) for i in range(nwin)])
env = (env > 0.004).astype(float)
# smooth: attack fast, release slow (iterate a leaky follower)
smooth = np.zeros(nwin)
level = 0.0
for i in range(nwin):
    target = env[i]
    level = target if target > level else level * 0.94
    smooth[i] = level
duck = np.repeat(1.0 - 0.68 * smooth, win)
duck = np.pad(duck, (0, N - len(duck)))[:N]

# --- bed + riser + resolve
with wave.open(os.path.join(PUBLIC, "bed.wav"), "rb") as w:
    raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    bed = raw.reshape(-1, 2).mean(axis=1)[:N]
    bed = np.pad(bed, (0, max(0, N - len(bed))))[:N]

mix = bed * duck

# riser 0.3 -> 2.4s: rising air + pitch sweep into the hook payoff
n = int(SR * 2.1)
rng = np.random.default_rng(99)
tt = np.arange(n) / SR
rise = np.linspace(0, 1, n) ** 2
noise = rng.standard_normal(n) * rise * 0.10
tone = np.sin(2 * np.pi * (180 + 320 * tt / 2.1) * tt) * rise * 0.06
s = int(0.3 * SR)
mix[s : s + n] += (noise + tone) * np.sin(np.pi * np.arange(n) / n) ** 0.3

# resolve 17.6 -> 20s: warm major swell under the logo
n2 = int(SR * 2.4)
tt2 = np.arange(n2) / SR
chord = sum(np.sin(2 * np.pi * f * tt2) for f in (130.81, 164.81, 196.0, 261.63)) / 4
swell = np.sin(np.pi * np.arange(n2) / n2) ** 0.7 * 0.10
s2 = int(17.6 * SR)
mix[s2 : s2 + n2] += chord * swell

peak = float(np.abs(mix).max()) or 1.0
mix = mix / peak * 0.89
stereo = np.stack([mix, mix], axis=1)
pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
with wave.open(os.path.join(PUBLIC, "bed_mix.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

vpcm = (np.clip(np.stack([voice, voice], axis=1), -1, 1) * 32767).astype(np.int16)
with wave.open(os.path.join(PUBLIC, "voice.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(vpcm.tobytes())
print("mix + voice written")
