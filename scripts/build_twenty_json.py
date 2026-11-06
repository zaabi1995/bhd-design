"""Generate src/twenty.json from src/twenty.css (never hand-edit the json).
Native apps (Expo/React Native, SwiftUI) and Tailwind configs read it.
Usage: python3 scripts/build_twenty_json.py [--check]"""
import json, re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
css = (root / 'src/twenty.css').read_text()
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
def block(selector_start):
    i = css.index(selector_start)
    body = css[css.index('{', i) + 1: css.index('}', i)]
    return {k: v.strip() for k, v in re.findall(r'--tw-([a-z0-9-]+)\s*:\s*([^;]+);', body)}
out = {
    'source': 'twenty-ui 2.55.0 (MIT, Twenty CRM), converted to sRGB; generated from https://design.bhd.om/twenty.css',
    'light': block(':root[data-ui="twenty"] {'),
    'dark': block(':root[data-ui="twenty-dark"],\n:root[data-ui="twenty"].dark'),
    'shape': block(':root[data-ui="twenty"],\n:root[data-ui="twenty-dark"] {'),
}
text = json.dumps(out, indent=2) + '\n'
target = root / 'src/twenty.json'
if '--check' in sys.argv:
    sys.exit(0 if target.exists() and target.read_text() == text else 'src/twenty.json is stale: run python3 scripts/build_twenty_json.py')
target.write_text(text)
print('wrote', target, len(out['light']), 'light', len(out['dark']), 'dark', len(out['shape']), 'shape')
