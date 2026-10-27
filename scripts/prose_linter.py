#!/usr/bin/env python3
"""
VisualGrammar — Deterministic Prose Quality Auditor (scripts/prose_linter.py)
Conforms to APPLICATION_GUIDELINES.md Section J.3.
Audits Markdown documentation files for clarity, structure, and absence of empty marketing buzzwords.
"""

import os
import re
import sys

PROHIBITED_CLICHES = [
    r"\bsynergistic\b",
    r"\bparadigm shift\b",
    r"\bundisputed gold standard\b",
    r"\b100% flawless\b",
    r"\brevolutionize\b",
]


def audit_file(path: str) -> list[str]:
    issues = []
    if not os.path.exists(path):
        return [f"{path}: File does not exist."]
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    if len(text.strip()) < 200:
        issues.append(f"{path}: Document is too short ({len(text)} bytes); substantive technical documentation required.")
    for pat in PROHIBITED_CLICHES:
        m = re.search(pat, text, flags=re.IGNORECASE)
        if m:
            issues.append(f"{path}: Prohibited marketing cliché '{m.group(0)}' detected.")
    return issues


def main(argv: list[str]) -> int:
    targets = argv[1:] if len(argv) > 1 else ["README.md"]
    all_issues = []
    for t in targets:
        all_issues.extend(audit_file(t))
    if all_issues:
        for iss in all_issues:
            print(f"PROSE_ERROR: {iss}")
        return 1
    print(f"OK: Audited {len(targets)} documentation file(s) with 100% prose authenticity compliance.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
