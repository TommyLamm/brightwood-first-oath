"""Focused, offline audit of the delivered asset manifests and exported images.

No browser, build, gameplay, or Playroom release acceptance is implied.
"""
from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
EXPECTED = {"actors": 22, "environment": 20, "interface": 47}
BUDGET = {"actors": 18, "environment": 16, "interface": 6}
RECOVERED_ACTORS = {
    "actor:hero-cloth", "actor:hero-leather", "actor:hero-iron",
    "actor:snail", "actor:mushroom", "actor:boar", "actor:golem",
    "actor:guardian", "actor:merchant",
}


def main():
    packs, global_keys = {}, set()
    for pack, expected in EXPECTED.items():
        manifest = json.loads((PUBLIC / "assets" / pack / "manifest.json").read_text(encoding="utf-8"))
        assert manifest["version"] == 1 and manifest["pack"] == pack
        assert len(manifest["images"]) == expected, (pack, "coverage", len(manifest["images"]), expected)
        images, entries, total = {}, [], 0
        for entry in [*manifest["images"], *manifest["animations"], *manifest["audio"]]:
            assert entry["key"] not in global_keys, ("duplicate key", entry["key"])
            global_keys.add(entry["key"])
        for entry in manifest["images"]:
            url = entry["url"]
            assert not any(c in url for c in "\\:%?#") and not url.startswith("/") and ".." not in url.split("/")
            path = PUBLIC / url
            with Image.open(path) as opened:
                width, height = opened.size
                assert width % entry["columns"] == height % entry["rows"] == 0, (url, "grid")
                assert 0 <= entry["pivotX"] <= 1 and 0 <= entry["pivotY"] <= 1
                assert entry["displayWidth"] > 0 and entry["displayHeight"] > 0
                # New recovery atlases, unlike historical accepted assets, promise
                # binary alpha and a >=16px transparent border on every frame.
                recovered_actor = pack == "actors" and entry["key"] in RECOVERED_ACTORS
                recovered_vfx = url.endswith("vfx-heavy-strike-v9.png")
                if recovered_actor or recovered_vfx:
                    array = np.asarray(opened.convert("RGBA"))
                    assert set(np.unique(array[:, :, 3])) <= {0, 255}, (url, "alpha")
                    frame_w, frame_h = width // entry["columns"], height // entry["rows"]
                    for row in range(entry["rows"]):
                        for col in range(entry["columns"]):
                            alpha = array[row * frame_h:(row + 1) * frame_h, col * frame_w:(col + 1) * frame_w, 3]
                            ys, xs = np.nonzero(alpha)
                            assert xs.size, (url, "blank frame", row, col)
                            margins = (xs.min(), ys.min(), frame_w - 1 - xs.max(), frame_h - 1 - ys.max())
                            assert min(margins) >= 16, (url, row, col, "margins", margins)
            total += path.stat().st_size
            images[entry["key"]] = entry
            entries.append({"key": entry["key"], "url": url, "size": [width, height], "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
        for animation in manifest["animations"]:
            image = images[animation["imageKey"]]
            assert animation["frames"] and len(animation["frames"]) == len(animation["frameMs"])
            assert all(0 <= frame < image["columns"] * image["rows"] for frame in animation["frames"])
            assert all(duration > 0 for duration in animation["frameMs"])
        assert total <= BUDGET[pack] * 1024 * 1024, (pack, "budget", total)
        packs[pack] = {"images": len(images), "animations": len(manifest["animations"]), "bytes": total, "entries": entries}
    anchors = json.loads((PUBLIC / "assets/actors/anchors.json").read_text(encoding="utf-8"))
    counts = dict(idle=4, walk=6, jump=2, climb=4, attack=6, hurt=2, dead=4, buff=4)
    for costume in ("cloth", "leather", "iron"):
        for state, count in counts.items():
            frames = anchors["heroes"][costume][state]
            assert len(frames) == count, (costume, state, "anchor count")
            for frame in frames:
                assert all(0 <= frame[part][axis] <= 96 for part in ("hand", "head") for axis in ("x", "y"))
    result = {"scope": "offline asset files, metadata, grid, references, budgets and new export invariants; not gameplay acceptance", "packs": packs}
    output = ROOT / "art-source" / "asset-delivery-audit-20261018.json"
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({pack: {k: v for k, v in data.items() if k != "entries"} for pack, data in packs.items()}, indent=2))


if __name__ == "__main__":
    main()
