"""Capture the exact ImageGen source, prompt, and per-frame metadata for this batch.

The script only reads the explicitly identified rollout session and its image
result item; it never searches generated_images for a latest file.

Usage: python record-generation.py <frame-id> <image-result-item-id> <accepted|pending|rejected> <decision>
"""
from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SESSION_ID = "01a1720e-f000-73e2-9553-7cd17539d3b4"
SESSION = Path(
    r"C:\Users\Tommy\.codex\sessions\2026\10\25\rollout-2026-10-25T15-55-44-01a1720e-f000-73e2-9553-7cd17539d3b4.jsonl"
)
CODEX_GENERATED = Path(r"C:\Users\Tommy\.codex\generated_images")


def sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    if len(sys.argv) != 5:
        raise SystemExit("usage: record-generation.py <frame-id> <image-result-item-id> <accepted|pending|rejected> <decision>")
    frame_id, item_id, accepted, decision = sys.argv[1:]
    if accepted not in {"accepted", "pending", "rejected"}:
        raise SystemExit("acceptance must be accepted, pending, or rejected")
    if not SESSION.is_file():
        raise SystemExit(f"exact owner session not found: {SESSION}")

    lines = SESSION.read_text(encoding="utf-8").splitlines()
    meta_line = json.loads(lines[0])
    if meta_line.get("payload", {}).get("id") != SESSION_ID:
        raise SystemExit("session_meta id does not match this batch's known session")

    item = None
    item_line = None
    for i, line in enumerate(lines):
        record = json.loads(line)
        candidate = record.get("payload", {}).get("item", {})
        if candidate.get("id") == item_id:
            item = candidate
            item_line = i
            break
    if item is None or item_line is None:
        raise SystemExit(f"image result item is not present in exact owner session: {item_id}")

    frame_token = frame_id.replace(":", "-")
    prompt_path = ROOT / "prompts" / f"ruins-bell-keeper-{frame_token}.txt"
    raw_path = ROOT / "raw" / f"ruins-bell-keeper-{frame_token}-v1.png"
    actual_prompt_path = ROOT / "prompts" / f"ruins-bell-keeper-{frame_token}-actual.txt"
    normalized_path = ROOT / "normalized" / f"ruins-bell-keeper-{frame_token}.png"
    review_path = ROOT / "review" / f"ruins-bell-keeper-{frame_token}-raw-q70.jpg"
    output_hint_path = ROOT / "metadata" / f"ruins-bell-keeper-{frame_token}-output-hint.txt"
    metadata_path = ROOT / "metadata" / f"ruins-bell-keeper-{frame_token}.json"

    prompt = item.get("revisedPrompt")
    saved = Path(item.get("savedPath", ""))
    if not isinstance(prompt, str) or not saved.is_file():
        raise SystemExit("exact image result is missing revisedPrompt or its savedPath")
    if not prompt_path.is_file() or not normalized_path.is_file():
        raise SystemExit("prompt or normalized frame is missing")
    if not raw_path.is_file():
        shutil.copy2(saved, raw_path)
    if sha(saved) != sha(raw_path):
        raise SystemExit("workspace raw source does not match the exact savedPath")
    actual_prompt_path.write_text(prompt, encoding="utf-8")
    if not output_hint_path.is_file():
        raise SystemExit("save the exact wrapper output_hint in metadata/*-output-hint.txt before recording")
    output_hint = output_hint_path.read_text(encoding="utf-8")

    outer_call_id = None
    for line in reversed(lines[:item_line]):
        record = json.loads(line)
        payload = record.get("payload", {})
        call_input = payload.get("input", "")
        if (
            record.get("type") == "response_item"
            and payload.get("type") == "custom_tool_call"
            and payload.get("name") == "exec"
            and "tools.image_gen__imagegen" in call_input
        ):
            outer_call_id = payload.get("call_id")
            break
    if not outer_call_id:
        raise SystemExit("matching outer functions.exec call ID was not found in the exact session")

    with Image.open(raw_path) as raw_image:
        raw_mode = raw_image.mode
        raw_size = raw_image.size
    with Image.open(normalized_path) as normalized:
        bounds = normalized.getchannel("A").getbbox()
        if bounds is None:
            raise SystemExit("normalized source has no visible alpha")
        left, top, right, bottom = bounds
        margins = [left, top, normalized.width - right, normalized.height - bottom]
        if normalized.size != (192, 192) or min(margins) < 3 or bottom != 189:
            raise SystemExit(f"normalized frame contract failed: {normalized.size}, {bounds}, {margins}")

    tool_prompt = prompt.replace("\r\n", "\n").replace("\r", "\n").rstrip("\n")
    submitted_prompt = prompt_path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n").rstrip("\n")
    metadata = {
        "frameId": f"ruins-bell-keeper:{frame_id}",
        "accepted": accepted == "accepted",
        "reviewStatus": accepted,
        "decision": decision,
        "sessionId": SESSION_ID,
        "sessionPath": str(SESSION),
        "outerFunctionsExecCallId": outer_call_id,
        "imageResultItemId": item_id,
        "imageTool": "built-in image_gen",
        "resultKeys": ["image_url", "output_hint"],
        "outputHintPath": str(output_hint_path.relative_to(ROOT.parents[2])).replace("\\", "/"),
        "savedPath": str(saved),
        "referencedImages": [x.get("path") for x in item.get("inputImages", [])],
        "transparentBackgroundRequested": True,
        "submittedPromptPath": str(prompt_path.relative_to(ROOT.parents[2])).replace("\\", "/"),
        "submittedPromptSha256": sha(prompt_path),
        "actualPromptPath": str(actual_prompt_path.relative_to(ROOT.parents[2])).replace("\\", "/"),
        "actualPromptSha256": sha(actual_prompt_path),
        "revisedPromptReturnedByTool": True,
        "revisedPromptMatchesSubmittedAfterNewlineNormalization": tool_prompt == submitted_prompt,
        "rawPath": str(raw_path.relative_to(ROOT.parents[2])).replace("\\", "/"),
        "rawSha256": sha(raw_path),
        "rawSizeBytes": raw_path.stat().st_size,
        "rawDimensions": list(raw_size),
        "rawMode": raw_mode,
        "normalizedPath": str(normalized_path.relative_to(ROOT.parents[2])).replace("\\", "/"),
        "normalizedSha256": sha(normalized_path),
        "normalizedDimensions": [192, 192],
        "normalizedMode": "RGBA",
        "normalization": {
            "method": "full source canvas scaled uniformly with premultiplied-alpha Lanczos; no crop",
            "alphaValuesBelow": 8,
            "alphaVisibleBounds": list(bounds),
            "transparentMarginsLTRB": margins,
            "halfOpenBoundsCenterX": (left + right) / 2,
            "pixelCenterX": (left + right - 1) / 2,
            "lastAlphaRow": bottom - 1,
        },
        "reviewPath": str(review_path.relative_to(ROOT.parents[2])).replace("\\", "/"),
        "outputHint": output_hint,
        "review": {"neutralMatteRgb": [223, 227, 219], "jpegQuality": 70, "maxEdge": 1280},
    }
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "metadataPath": str(metadata_path),
        "frameId": metadata["frameId"],
        "outerFunctionsExecCallId": outer_call_id,
        "imageResultItemId": item_id,
        "rawSha256": metadata["rawSha256"],
        "normalizedSha256": metadata["normalizedSha256"],
        "promptMatch": metadata["revisedPromptMatchesSubmittedAfterNewlineNormalization"],
        "alphaBounds": bounds,
        "marginsLTRB": margins,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
