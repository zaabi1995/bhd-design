#!/usr/bin/env python3
"""Generate src/tokens.json from src/tokens.css.

Why this exists: Vessa (vessa.design) sells interactive brand guidelines whose
best idea is an MCP server, so an agent reads the brand instead of guessing it.
We do not need to buy that. tokens.css already holds every value, so this script
publishes the same values as machine-readable JSON at design.bhd.om/tokens.json.

The CSS is the single source of truth. Never hand-edit tokens.json: edit
tokens.css and run `npm run build:tokens`. The generated file carries a
"generatedFrom" field so a stale copy is obvious.

Usage:
    python3 scripts/build_tokens_json.py [--check]

--check exits 1 if the committed tokens.json is out of date, for CI or a
pre-deploy gate.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSS = ROOT / "src" / "tokens.css"
OUT = ROOT / "src" / "tokens.json"

# Blocks we read, in file order. A later block wins for a repeated name, which
# matches how the browser resolves them.
DECL = re.compile(r"(--[a-z0-9-]+)\s*:\s*([^;]+);")


def strip_comments(text: str) -> str:
    return re.sub(r"/\*.*?\*/", "", text, flags=re.S)


def strip_at_rules(text: str) -> str:
    """Drop @media / @supports bodies.

    The reduced-motion block redefines every duration as 1ms. Parsing it as if
    it were top level published a token file that told every consumer our base
    duration was 1ms. Caught 18 Aug 2026 on the first generated file.
    """
    out = []
    i = 0
    while i < len(text):
        at = text.find("@", i)
        if at == -1:
            out.append(text[i:])
            break
        out.append(text[i:at])
        brace = text.find("{", at)
        if brace == -1:
            break
        depth = 0
        j = brace
        while j < len(text):
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
                if depth == 0:
                    break
            j += 1
        i = j + 1
    return "".join(out)


def resolve(value: str, lookup: dict[str, str], seen: int = 0) -> str:
    """Flatten var(--x) to the literal it points at, so consumers get real values."""
    if seen > 8:
        return value
    match = re.fullmatch(r"var\((--[a-z0-9-]+)\)", value.strip())
    if match and match.group(1) in lookup:
        return resolve(lookup[match.group(1)], lookup, seen + 1)
    return value


def block(text: str, selector: str) -> str:
    """Return the body of the first rule whose selector list contains `selector`."""
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
        selectors = [s.strip() for s in match.group(1).split(",")]
        if selector in selectors:
            return match.group(2)
    return ""


def declarations(body: str) -> dict[str, str]:
    return {name: value.strip() for name, value in DECL.findall(body)}


def pick(source: dict[str, str], prefix: str) -> dict[str, str]:
    return {k[len(prefix):]: v for k, v in source.items() if k.startswith(prefix)}


def build() -> dict:
    text = strip_at_rules(strip_comments(CSS.read_text(encoding="utf-8")))

    # Both the palette and the motion block use a bare :root selector, so merge
    # every :root rule rather than taking the first one.
    root: dict[str, str] = {}
    for match in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
        if ":root" in [s.strip() for s in match.group(1).split(",")]:
            root.update(declarations(match.group(2)))

    light = declarations(block(text, ".light")) or root
    dark = declarations(block(text, ".dark"))

    semantic_names = [
        "background", "foreground", "card", "card-foreground", "popover",
        "popover-foreground", "primary", "primary-foreground", "secondary",
        "secondary-foreground", "muted", "muted-foreground", "accent",
        "accent-foreground", "destructive", "destructive-foreground",
        "success", "warning", "mono", "mono-foreground", "border", "input", "ring",
    ]

    def semantic(source: dict[str, str]) -> dict[str, str]:
        merged = dict(root)
        merged.update(source)
        return {
            name: resolve(source[f"--{name}"], merged)
            for name in semantic_names
            if f"--{name}" in source
        }

    data = {
        "$schema": "https://design.bhd.om/tokens.schema.json",
        "name": "BHD Group design tokens",
        "url": "https://design.bhd.om/tokens.json",
        "generatedFrom": "src/tokens.css",
        "generator": "scripts/build_tokens_json.py",
        "note": "Generated file. Edit tokens.css, then run npm run build:tokens.",
        "brand": {
            "primary": root.get("--color-bhd-500", "#009bc1"),
            "primaryName": "BHD cyan",
            "primaryDark": root.get("--color-bhd-400", "#26b4d3"),
            "font": "IBM Plex Sans Arabic",
            "fontSource": "https://fonts.bhd.om",
            "iconSource": "https://design.bhd.om/fa (FontAwesome 7.2 Pro, self-hosted)",
            "currency": "OMR, 3 decimals, official Central Bank of Oman rial sign via BHDCurrency",
        },
        "palette": {
            "bhd": pick(root, "--color-bhd-"),
            "zinc": pick(root, "--color-zinc-"),
        },
        "semantic": {"light": semantic(light), "dark": semantic(dark)},
        "radius": {
            (k[len("--radius-"):] if k.startswith("--radius-") else "base"): v
            for k, v in root.items() if k.startswith("--radius")
        },
        "shadow": {k[len("--shadow-"):]: v for k, v in root.items() if k.startswith("--shadow-")},
        "layout": {
            k.lstrip("-"): v for k, v in root.items()
            if k in ("--header-height", "--sidebar-width", "--sidebar-width-collapsed")
        },
        "motion": {
            "duration": pick(root, "--duration-"),
            "easing": pick(root, "--ease-"),
            "rule": "Animate opacity and transform only. Always honour prefers-reduced-motion.",
        },
        "rules": [
            "Cyan marks action, focus, selection or live status. It is not decoration.",
            "Never letter-space Arabic. It breaks the cursive join. Use kashida (U+0640) for emphasis.",
            "Icons come from FontAwesome 7.2 Pro at design.bhd.om/fa. Never emojis.",
            "Fonts load from fonts.bhd.om. Never fonts.googleapis.com or fonts.gstatic.com.",
            "Prefer borders and surface contrast to shadows. Elevation is for overlays only.",
            "Every OMR amount uses the official rial sign through BHDCurrency, on the left, 3 decimals.",
            "A model-driven wait uses a named BHD Orb state, not a generic spinner.",
        ],
    }
    return data


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if tokens.json is stale")
    args = parser.parse_args()

    rendered = json.dumps(build(), indent=2, ensure_ascii=False) + "\n"

    if args.check:
        current = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
        if current != rendered:
            print("tokens.json is stale. Run: npm run build:tokens", file=sys.stderr)
            return 1
        print("tokens.json is current.")
        return 0

    OUT.write_text(rendered, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(rendered)} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
