from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
METADATA = ROOT / "metadata"
CONTACT = "review/puppet-actions-contact-q70.jpg"
REVIEW_DATE = "2026-10-25"
DECISIONS = {
    "attack-0": "Early right-facing windup with the long arm folded back low; feet stay planted and the pose reads separately from idle-0 and attack-2.",
    "attack-1": "Late right-facing windup with the long arm cocked high behind the shoulder; planted feet and raised arm create a distinct pre-strike pose.",
    "attack-3": "Post-slap recovery with the long arm lowered forward/right and the torso settling; the puppet remains in place.",
    "hurt-0": "First recoil is readable through the backward upper-body jolt and long arm guarding the chest; the puppet remains complete and intact.",
    "hurt-1": "Follow-up settling recoil has a dipped head/shoulder and slack long arm, distinct from hurt-0; all parts remain attached.",
    "dead-0": "Initial loss of strength reads through the softening knees, lowered head/torso and slack strings while the puppet remains supported.",
    "dead-1": "Deeper crouched collapse is visibly lower than dead-0 with a forward-slumped torso and limp limbs; the body remains complete and opaque.",
    "dead-2": "Near-ground collapse rests on bent knees and one hand with the torso low; the body remains complete and opaque.",
    "dead-3": "Final motionless pose is fully fallen, complete, intact and opaque, with the head and long arm resting toward the right.",
}

for pose, reason in DECISIONS.items():
    path = METADATA / f"ruins-string-puppet-{pose}.metadata.json"
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if not data.get("submittedPrompt") or not data.get("callId") or not data.get("savedPath"):
        raise ValueError(f"Missing ImageGen provenance in {path.name}")
    if not data.get("rawSha256") or not data.get("outputSha256"):
        raise ValueError(f"Missing source/output SHA-256 in {path.name}")
    data["frameID"] = data["frameId"]
    data["rawSHA"] = data["rawSha256"]
    data["accepted"] = True
    data["status"] = "accepted"
    data["acceptanceReason"] = reason
    data["rejectionReason"] = None
    data["reviewContactSheetPath"] = CONTACT
    data["reviewMethod"] = "Single visual review of normalized contact sheet, including the accepted idle-0 and attack-2 anchors; neutral matte, JPEG quality 70."
    data["reviewDate"] = REVIEW_DATE
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

print(json.dumps({"accepted": len(DECISIONS), "frames": list(DECISIONS)}, ensure_ascii=False))
