"""Normalize researcher proposals without modifying the frozen datasets.

Run after physical-complete.py when regenerating research. This does not grant
independent acceptance: proposed verdicts remain separate from actual holds.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AUDIT = ROOT / "physical-audit.json"


def load(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def unique(items):
    return list(dict.fromkeys(items))


paths = sorted((ROOT / "datasets").glob("physical-*.json"))
before = {p.name: digest(p) for p in paths}
datasets = {load(p)["datasetId"]: (load(p), p) for p in paths}
records = load(AUDIT)
assigned = {c["id"] for c in load(ROOT / "assignments/physical.json")}
assert len(records) == 30 and {r["conceptId"] for r in records} == assigned

for r in records:
    proposal = r.get("proposedVerdict", r.get("candidateVerdict", r["verdict"]))
    r["proposedVerdict"] = proposal
    r["candidateVerdict"] = proposal
    r["originalSourceUrl"] = r.get("originalSourceUrl", r["sourceUrl"])
    r["claim"] = r.get("claim", r["exactClaim"])
    r["reframeReason"] = r["rationale"] if proposal == "reframe-ready" else None
    partial = unique(r.get("partialEvidenceDatasetIds", []) + (r["datasetIds"] if proposal == "hold" else []))
    if proposal == "hold":
        r["partialEvidenceDatasetIds"] = partial
        r["datasetIds"] = []
    linked = [datasets[i][0] for i in unique(r["datasetIds"] + partial)]
    relationship = r["aiRelationship"]
    classification = relationship["class"] if isinstance(relationship, dict) else relationship
    justifications = unique(d["aiRelationshipJustification"] for d in linked)
    r["aiRelationship"] = {
        "class": classification,
        "justification": " ".join(justifications) if justifications else r["rationale"],
        "sourceIds": unique(s["sourceId"] for d in linked for s in d["sources"]),
    }
    pending = "Independent evidence gates, readiness score and linked design review remain pending."
    r["blockers"] = unique((r["missingEvidence"] if proposal == "hold" else []) + [pending])
    r["limitations"] = unique(r.get("limitations", []) + r["missingEvidence"] + [v for d in linked for v in d["limitations"]])
    r["scoring"] = {**r.get("scoring", {}), "type": "none"}
    r["forecast"] = {**r.get("forecast", {}), "type": "none"}
    r["verdict"] = "hold"
    r["reviewStatus"] = "Researcher proposal; independent gates, score and design review pending."
    evidence = [f"research/datasets/{i}.json" for i in r["datasetIds"]]
    if proposal == "hold":
        evidence = ["research/sources/physical-hold-investigations.json"]
    r["review"] = {
        "gates": {
            f"G{i}": {
                "status": "unchecked",
                "evidence": evidence,
                "reason": "Author-supplied evidence awaits independent review; no gate acceptance is claimed.",
            } for i in range(1, 11)
        },
        "score": None,
        "scoreBreakdown": [],
        "reviewer": None,
        "reviewedAt": None,
        "datasetDigests": {i: digest(datasets[i][1]) for i in r["datasetIds"]},
    }

AUDIT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
assert before == {p.name: digest(p) for p in paths}, "Dataset bytes unexpectedly changed"
print(json.dumps({"concepts": len(records), "datasetsUnchanged": len(paths), "proposedHolds": sum(r["proposedVerdict"] == "hold" for r in records), "auditSha256": digest(AUDIT)}))
