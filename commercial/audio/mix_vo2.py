"""Final mix: AriaNeural VO on timeline, music ducked beneath, accent pings
on VO onsets. Outputs public/audio/voice.wav + public/audio/bed_mix.wav."""
import os
import wave
import numpy as np

SR = 44100
DUR = 20.0
N = int(SR * DUR)
VO_DIR = r"C:\Users\leomo\AppData\Local\Temp\opencode\vo2"
HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(HERE, "..", "public", "audio")


def load_mono_wav(path):
    with wave.open(path, "rb") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
        if w.getnchannels() == 2:
            x = x.reshape(-1, 2).mean(axis=1)
        return x


def place(track, sig, at):
    s = int(at * SR)
    e = min(N, s + len(sig))
    if e > s:
        track[s:e] += sig[: e - s]


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
    peak = float(np.abs(sig).max()) or 1.0
    place(voice, sig / peak * 0.9, at)

win = int(SR * 0.05)
nwin = N // win
env = np.array([float((voice[i * win : (i + 1) * win] ** 2).mean()) for i in range(nwin)])
env = (env > 0.004).astype(float)
smooth = np.zeros(nwin)
level = 0.0
for i in range(nwin):
    target = env[i]
    level = target if target > level else level * 0.94
    smooth[i] = level
duck = np.repeat(1.0 - 0.72 * smooth, win)
duck = np.pad(duck, (0, N - len(duck)))[:N]

with wave.open(os.path.join(PUBLIC, "music.wav"), "rb") as w:
    raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768
    mus = raw.reshape(-1, 2).mean(axis=1)[:N]
    mus = np.pad(mus, (0, max(0, N - len(mus))))[:N]

mix = mus * duck

# accent pings synced to VO onsets (soft, musical, under the voice)
for at, f in [(0.10, 880.0), (2.70, 987.77), (5.80, 880.0), (9.20, 1046.5), (12.60, 987.77), (15.70, 880.0), (18.05, 1046.5)]:
    n = int(SR * 0.35)
    tt = np.arange(n) / SR
    ping = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.09) * 0.05
    s = int(at * SR)
    mix[s : s + n] += ping

peak = float(np.abs(mix).max()) or 1.0
mix = mix / peak * 0.89
stereo = np.stack([mix, mix], axis=1)
with wave.open(os.path.join(PUBLIC, "bed_mix.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(stereo, -1, 1) * 32767).astype(np.int16).tobytes())

vpcm = (np.clip(np.stack([voice, voice], axis=1), -1, 1) * 32767).astype(np.int16)
with wave.open(os.path.join(PUBLIC, "voice.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(vpcm.tobytes())
print("mix + voice written")
