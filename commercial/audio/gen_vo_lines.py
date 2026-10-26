"""Synthesize the 7 VO lines (neural, Filipino English) and report durations."""
import asyncio
import edge_tts

LINES = [
    ("l1_hook", "Where does your money really go?"),
    ("l2_reveal", "Meet FinTrack."),
    ("l3_tx", "Track every peso."),
    ("l4_insights", "See where your money goes."),
    ("l5_montage", "Organize your accounts, transactions, and spending."),
    ("l6_offline", "Even when you're offline."),
    ("l7_brand", "FinTrack. Take control."),
]

OUT = r"C:\Users\leomo\AppData\Local\Temp\opencode\vo"


async def main():
    import os

    os.makedirs(OUT, exist_ok=True)
    for name, text in LINES:
        c = edge_tts.Communicate(text, "en-PH-RosaNeural", rate="+8%")
        await c.save(f"{OUT}/{name}.mp3")
        print("saved", name)


asyncio.run(main())
