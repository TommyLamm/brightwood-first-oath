"""Record the built-in imagegen source path and hashes beside each raw image."""

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SOURCE = ROOT / "art-source/ruins-c/scene-audio"
BATCH = "01a17200-f6ca-7ec1-bfd8-791328aaf7af"
BS = chr(92)
GENERATED_DIR = BS.join(["C:", "Users", "Tommy", ".codex", "generated_images", BATCH])
COMMON_HINT = (
    "If you need to use a generated image at another path, copy it and leave the original in place unless the user explicitly asks you to delete it.\n"
    "The generated image is already displayed to the user. There is no need to render it in the final response as a Markdown image or file link."
)

RECORDS = {
    "ruins-sanctum-sky": "exec-8c5ae51f-fcd6-4fdb-b6d8-9b88987b8f34.png",
    "ruins-sanctum-far": "exec-b3a2150f-fa68-4b15-8a7a-9cdf33bbad76.png",
    "ruins-sanctum-mid": "exec-3c790219-dda1-42df-8d52-d4fc726d192b.png",
    "oathfarer-circlet-icon": "exec-8f8d6a3f-244e-4d82-8479-abb254fc5b23.png",
    "oathfarer-circlet-overlay": "exec-b569c047-db5b-4654-8431-3cad8133526a.png",
}

for asset, filename in RECORDS.items():
    metadata_path = SOURCE / f"{asset}.metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8-sig"))
    raw_path = SOURCE / f"{asset}.raw.png"
    runtime_path = ROOT / metadata["runtimePath"]
    generated_path = BS.join([GENERATED_DIR, filename])
    metadata["generatedSource"] = generated_path
    metadata["savedPath"] = str(raw_path).replace("/", BS)
    metadata["toolOutputHint"] = (
        f"Generated images are saved to {GENERATED_DIR} as {generated_path} by default.\n{COMMON_HINT}"
    )
    metadata["callID"] = "not provided in returned result; generated file identifier preserved in generatedSource"
    metadata["revisedPrompt"] = "not provided in returned result"
    metadata["rawSha256"] = hashlib.sha256(raw_path.read_bytes()).hexdigest()
    metadata["runtimeSha256"] = hashlib.sha256(runtime_path.read_bytes()).hexdigest()
    metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{asset}: raw and runtime SHA-256 recorded")
