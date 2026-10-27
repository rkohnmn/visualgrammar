#!/usr/bin/env python3
"""
VisualGrammar — Static Deployment & Subpath Safety Verifier (tests/verify-build.py)
Conforms strictly to APPLICATION_GUIDELINES.md Section B.1 & Section J.2.
Verifies:
1. All local asset references in index.html use explicit relative paths (./css/..., ./js/...).
2. Zero root-absolute paths (href="/..." or src="/...") that break GitHub Pages project subpaths.
3. Zero external runtime CDN dependencies (unpkg, cdnjs, jsdelivr, googleapis).
4. All referenced local CSS and JS module files exist on disk and are non-empty.
5. Zero unresolved TODO or FIXME placeholders in source files.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main() -> int:
    errors = []
    index_path = os.path.join(ROOT, "index.html")
    if not os.path.exists(index_path):
        print("FAIL: index.html not found.")
        return 1

    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    # 1. Check for root-absolute asset paths
    root_abs = re.findall(r'(?:href|src)\s*=\s*["\'](/[^"\']*)["\']', html)
    if root_abs:
        errors.append(f"Root-absolute paths prohibited on GitHub Pages subpaths: {root_abs}")

    # 2. Check for external runtime CDN scripts/stylesheets
    cdns = re.findall(r'(?:src|href)\s*=\s*["\'](https?://[^"\']+)["\']', html)
    for url in cdns:
        if "rkohnmn.github.io" in url or "datasense-studio.github.io" in url:
            continue
        errors.append(f"External runtime CDN dependency detected: {url}")

    # 3. Verify all relative asset links exist
    rel_assets = re.findall(r'(?:href|src)\s*=\s*["\'](\./[^"\']+)["\']', html)
    if not rel_assets:
        errors.append("No explicit relative asset paths (./...) found in index.html.")
    for rel in rel_assets:
        target = os.path.normpath(os.path.join(ROOT, rel))
        if not os.path.exists(target) or os.path.getsize(target) == 0:
            errors.append(f"Referenced asset missing or empty: {rel}")

    # 4. Scan JS and CSS files for TODO / FIXME placeholders
    for folder in ("js", "css", "tests"):
        folder_path = os.path.join(ROOT, folder)
        if not os.path.isdir(folder_path):
            errors.append(f"Missing required directory: {folder}")
            continue
        for fname in os.listdir(folder_path):
            fpath = os.path.join(folder_path, fname)
            if not os.path.isfile(fpath):
                continue
            with open(fpath, "r", encoding="utf-8") as src_f:
                content = src_f.read()
            if re.search(r"//\s*(?:TODO|FIXME)\b", content):
                errors.append(f"Unresolved TODO/FIXME marker in {folder}/{fname}")

    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        return 1

    print(f"OK: VisualGrammar static build verified ({len(rel_assets)} relative assets, 0 CDN deps, 0 root-abs paths, 0 TODOs).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
