from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 4:
        raise SystemExit("usage: record_review_decision.py <metadata.json> <accept|reject> <reason>")
    path = Path(sys.argv[1])
    decision = sys.argv[2]
    reason = sys.argv[3]
    if decision not in {"accept", "reject"}:
        raise SystemExit("decision must be accept or reject")
    metadata = json.loads(path.read_text(encoding="utf-8-sig"))
    accepted = decision == "accept"
    metadata["accepted"] = accepted
    metadata["status"] = "accepted" if accepted else "rejected"
    metadata["acceptanceReason"] = reason if accepted else None
    metadata["rejectionReason"] = reason if not accepted else None
    path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"metadataPath": path.as_posix(), "accepted": accepted, "reason": reason}, ensure_ascii=False))


if __name__ == "__main__":
    main()
