"""Gera variantes responsivas (400/600/800 px) das fotos WebP e o manifesto src/data/img-variants.json."""
import json, os, re
from PIL import Image
ROOT = "public"
WIDTHS = (240, 320, 400, 600, 800)
manifest = {}
for dirpath, _, files in os.walk(os.path.join(ROOT, "fotos")):
    for f in sorted(files):
        if not f.endswith(".webp") or re.search(r"-w\d+\.webp$", f):
            continue
        p = os.path.join(dirpath, f)
        im = Image.open(p); im.load()
        w, h = im.size
        url = "/" + os.path.relpath(p, ROOT).replace(os.sep, "/")
        ws = []
        for tw in WIDTHS:
            if tw >= w * 0.9:
                continue
            out = p[:-5] + f"-w{tw}.webp"
            if not os.path.exists(out) or os.path.getmtime(out) < os.path.getmtime(p):
                im.resize((tw, round(h * tw / w)), Image.LANCZOS).save(out, "WEBP", quality=72, method=6)
            ws.append(tw)
        manifest[url] = {"w": w, "h": h, "v": ws}
json.dump(manifest, open("src/data/img-variants.json", "w"), separators=(",", ":"), sort_keys=True)
print(len(manifest), sum(len(v["v"]) for v in manifest.values()))
