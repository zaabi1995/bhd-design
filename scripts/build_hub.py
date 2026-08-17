#!/usr/bin/env python3
"""
Regenerate the BHD multi-brand Tailwind hub artifacts: tw.js + themes/<brand>.css.

ONE source of truth = the BRANDS dict below. Edit a brand's primary hex / font here,
run this, then deploy (see SKILL.md). Scales are auto-generated from the 500 hex by
mixing toward white (50..400) and black (600..950); a brand may override with an
explicit "scale" (bhd + cupsbyaa do, hand-tuned).

Brand colors/fonts were extracted from each live site (theme-color meta, dominant CSS
hex, and the site's own <link> font tags) — NOT invented. Re-extract for a new brand:
  curl -s https://SITE | grep -i 'theme-color'                          # declared color
  curl -s https://SITE | grep -ioE '#[0-9a-f]{6}' | sort | uniq -c|sort -rn   # dominant hex
  curl -s https://SITE | grep -ioE 'family=[^"&:]+'                      # font

Usage:  python3 scripts/build_hub.py [outdir]   (defaults to src/, which deploy.sh ships)
"""
import sys, os, json

def fu(fam):   return "https://fonts.bhd.om/css2?family=%s:wght@400;500;600;700&display=swap" % fam.replace(' ', '+')
def stack(p):  return '%s,ui-sans-serif,system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif' % p

# primary 500 + font (+ fontUrl only if the family is on fonts.bhd.om). No fontUrl => named only, inherits if absent.
BRANDS = {
  "bhd":         {"p":"#009bc1","font":stack('"IBM Plex Sans Arabic"'),"fontUrl":fu("IBM Plex Sans Arabic"),
                  "scale":{50:"#e6f7fb",100:"#c2ecf4",200:"#99dfec",300:"#5fcbe0",400:"#26b4d3",500:"#009bc1",600:"#0086a8",700:"#006f8c",800:"#005a72",900:"#094a5d",950:"#04303d"}},
  "cupsbyaa":    {"p":"#E55E99","font":stack("Inter"),"fontUrl":fu("Inter"),
                  "scale":{50:"#fdeef5",100:"#fbd9e9",200:"#f7b3d3",300:"#f08bbb",400:"#ec74ab",500:"#E55E99",600:"#d83f82",700:"#b82d68",800:"#932454",900:"#771e45",950:"#470f29"}},
  "hosn":        {"p":"#0F3355","font":stack('"Arsenica Arabic"')},          # self-hosted COMMERCIAL font on hosn.om; name only, no fontUrl
  "mithaq":      {"p":"#155340","font":stack('"IBM Plex Sans Arabic"'),"fontUrl":fu("IBM Plex Sans Arabic")},
  "fencing":     {"p":"#1e8439","font":stack("Cairo"),"fontUrl":fu("Cairo")},
  "paperandpen": {"p":"#172e50","font":stack('"DM Sans"'),"fontUrl":fu("DM Sans")},
  "arabian":     {"p":"#ff5c00","font":stack('"DM Sans"'),"fontUrl":fu("DM Sans")},
  "dardasha":    {"p":"#00d4ff","font":stack("Inter"),"fontUrl":fu("Inter")},
  "cardify":     {"p":"#2563eb","font":stack('"Plus Jakarta Sans"'),"fontUrl":fu("Plus Jakarta Sans")},
  "reachscreens":{"p":"#1e3a5f","font":stack('"DM Sans"'),"fontUrl":fu("DM Sans")},
  # splitty.om: theme-color #0B72D8, Plus Jakarta Sans (headings pair with Fraunces).
  "splitty":     {"p":"#0B72D8","font":stack('"Plus Jakarta Sans"'),"fontUrl":fu("Plus Jakarta Sans")},
  "almaha":      {"p":"#A6843A","font":stack('"The Year of The Camel"'),"fontUrl":fu("The Year of The Camel"),
                  # Hand-tuned: the ramp runs through the brand's own earth tones
                  # (sand, cream) rather than a flat mix toward white, and 700+
                  # lands on the readable gold used for type on marble.
                  "scale":{50:"#faf7f0",100:"#f2ebda",200:"#e9dfcf",300:"#d9c9a3",400:"#c2a56a",
                           500:"#A6843A",600:"#957633",700:"#79602a",800:"#5f4c22",900:"#4a3b1b",950:"#2a2110"}},
}
MIX = {50:0.95,100:0.90,200:0.75,300:0.55,400:0.30,500:0.0,600:-0.12,700:-0.28,800:-0.44,900:-0.58,950:-0.74}
def hx(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def to(rgb): return '#%02x%02x%02x'%rgb
def mix(base,f):
    r,g,b=hx(base); t=(255,255,255) if f>=0 else (0,0,0); k=abs(f)
    return to(tuple(round(c+(tc-c)*k) for c,tc in zip((r,g,b),t)))
def scale_for(b):
    if "scale" in b: return {k:b["scale"][k] for k in sorted(b["scale"])}
    return {k:(b["p"] if k==500 else mix(b["p"],MIX[k])) for k in MIX}

def main(outdir):
    os.makedirs(os.path.join(outdir,"themes"), exist_ok=True)
    js={}
    for name,b in BRANDS.items():
        sc=scale_for(b); js[name]={"primary":b["p"],"scale":sc}
        if "font" in b: js[name]["font"]=b["font"]
        if "fontUrl" in b: js[name]["fontUrl"]=b["fontUrl"]
        L=["/* %s brand theme — https://design.bhd.om/themes/%s.css"%(name,name),
           ' * @import "tailwindcss"; @import "https://design.bhd.om/themes/%s.css";'%name,
           " * primary %s */"%b["p"],"@theme {"]
        for k in sorted(sc):
            L.append("  --color-brand-%d:%s;"%(k,sc[k]))
            if name=="bhd": L.append("  --color-bhd-%d:%s;"%(k,sc[k]))   # bhd back-compat alias
        L.append("  --color-primary:%s; --color-primary-foreground:#ffffff;"%b["p"])
        if "font" in b: L.append("  --font-sans:%s;"%b["font"])
        L.append("}")
        open(os.path.join(outdir,"themes","%s.css"%name),"w").write("\n".join(L)+"\n")
    # tw.js
    def js_scale(s): return "{"+",".join("%s:'%s'"%(k,v) for k,v in s.items())+"}"
    ents=[]
    for name,d in js.items():
        parts=["primary:'%s'"%d['primary']]
        if 'font' in d: parts.append("font:%s"%json.dumps(d['font']))
        if 'fontUrl' in d: parts.append("fontUrl:'%s'"%d['fontUrl'])
        parts.append("scale:%s"%js_scale(d['scale']))
        ents.append("    %s:{ %s }"%(name,", ".join(parts)))
    tw=TWJS.replace("__BRANDS__","{\n"+",\n".join(ents)+"\n  }")
    open(os.path.join(outdir,"tw.js"),"w").write(tw)
    print("wrote tw.js + %d themes to %s"%(len(BRANDS),outdir))

TWJS=r'''/*!
 * BHD-Group Tailwind drop-in  -  https://design.bhd.om/tw.js
 * One tag = Tailwind v4 + a brand theme. Pick the brand with data-brand:
 *   <script src="https://design.bhd.om/tw.js" data-brand="cupsbyaa"></script>   (default bhd)
 * Exposes per brand: bg-primary/text-primary/ring-primary, bg-brand-50..950, font-sans (bhd also bg-bhd-*).
 * PROTOTYPES/internal only (runtime compile). Production: build with themes/<brand>.css.
 */
(function () {
  var BRANDS = __BRANDS__;
  var me = document.currentScript;
  var name = (me && me.dataset.brand) ? me.dataset.brand.toLowerCase() : 'bhd';
  var b = BRANDS[name] || BRANDS.bhd;
  var head = document.head || document.getElementsByTagName('head')[0];
  if (b.fontUrl && !document.querySelector('link[data-bhd-fonts="'+name+'"]')) {
    var f = document.createElement('link');
    f.rel='stylesheet'; f.setAttribute('data-bhd-fonts',name); f.href=b.fontUrl; head.appendChild(f);
  }
  if (!document.querySelector('style[data-bhd-theme]')) {
    var L=['@theme {'], k;
    for (k in b.scale){ L.push('  --color-brand-'+k+':'+b.scale[k]+';'); if(name==='bhd') L.push('  --color-bhd-'+k+':'+b.scale[k]+';'); }
    L.push('  --color-primary:'+b.primary+';'); L.push('  --color-primary-foreground:#ffffff;');
    if (b.font) L.push('  --font-sans:'+b.font+';');
    L.push('}');
    var t=document.createElement('style');
    t.type='text/tailwindcss'; t.setAttribute('data-bhd-theme',name); t.textContent=L.join('\n'); head.appendChild(t);
  }
  if (!document.querySelector('script[data-bhd-tw-engine]')) {
    var s=document.createElement('script');
    s.src='https://design.bhd.om/tailwind-browser.js'; s.setAttribute('data-bhd-tw-engine',''); head.appendChild(s);
  }
})();
'''

if __name__=="__main__":
    # Default to src/, the directory deploy.sh treats as the single source
    # of truth for the webroot. Writing anywhere else is what got the hub
    # deleted: rsync --delete correctly removes what src/ does not contain.
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    main(sys.argv[1] if len(sys.argv)>1 else os.path.join(here, "src"))
