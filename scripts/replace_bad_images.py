#!/usr/bin/env python3
"""Replace rejected catalogue images with verified Commons files or shop-owned photos."""
from __future__ import annotations

import csv
import json
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

UA = "MundifrutaCatalogBot/1.0 (https://github.com/shahhossain87-collab/mundifruta; catalog image refresh)"
COMMONS = "https://commons.wikimedia.org/w/api.php"
OUT_DIR = Path("fotos/catalogo")
CSV_PATH = Path("docs/product-image-sources.csv")
MAX_SIDE = 1400
WEBP_QUALITY = 82

# slug -> (commons title OR local path, kind)
REPLACEMENTS = {
    # swap: seeded watermelon must show black seeds
    "melancia-com-sementes": ("Watermelon.jpg", "commons"),
    "melancia-quarto": ("Watermelon.jpg", "commons"),
    "uva-vale-de-rosa-preta-sem-grainha": ("Uva nera.jpg", "commons"),
    "melao": ("Cucumis melo var. inodorus Collective Farm Woman 1zz.jpg", "commons"),
    "figos": ("Fig (Ficus carica) fruit halved.jpg", "commons"),
    "castanha": ("Frucht der Edelkastanie.jpg", "commons"),
    "banana-del-monte": ("Two ripe Cavendish bananas.jpg", "commons"),
    "banana-madeira": ("fotos/banana_madeira.jpeg", "own"),
    "limao": ("Lemon - whole and split.jpg", "commons"),
    "framboesa": ("Raspberry - whole (Rubus idaeus).jpg", "commons"),
    "cereja-fundao": ("Cherries.jpg", "commons"),
    "cereja-gardunha": ("Cherries.jpg", "commons"),
    "pera-rocha-grande": ("Rocha Pear 2017 A5.jpg", "commons"),
    "mamao": ("Papaya - longitudinal section.jpg", "commons"),
    "papaia": ("Papaya half.jpg", "commons"),
    "coentros": ("Koriander (Coriandrum sativum) Blätter-- Josef Schlaghecken.jpg", "commons"),
    "couve-portuguesa": ("Couve-galega.JPG", "commons"),
    "tomate-chucha": ("Roma Tomatoes (53512765752).jpg", "commons"),
    "maca-reineta": ("Golden russet apple.jpg", "commons"),
}

# shop-owned / existing repo assets for remaining vegetable gaps or rejected search junk
OWN = {
    "abobora-inteira": "fotos/mundifruta-photos-web/abobora_inteira_v2.jpg",
    "abobora-fatiada": "fotos/mundifruta-photos-web/abobora_fatiada_v2.jpg",
    "abobora-butternut": "fotos/abobora_butternut.jpeg",
    "agriao": "fotos/agriao.jpeg",
    "batata-agria": "fotos/batata_agria.jpeg",
    "batata-branca": "fotos/batata_branca.jpeg",
    "batata-vermelha": "fotos/batata_vermelha.jpeg",
    "batata-olho-de-perdiz": "fotos/batata_olho_perdiz.jpeg",
    "batata-doce-cor-laranja": "fotos/mundifruta-photos-web/20260706_195815.jpg",
    "beterraba": "fotos/beterraba.jpeg",
    "curgete": "fotos/curgete.jpeg",
    "espinafres": "fotos/espinafres.jpeg",
    "couve-coracao": "fotos/couvecoracao.jpeg",
    "grelo-de-couve": "fotos/grelos.jpeg",
    "grelo-de-nabo": "fotos/grelos.jpeg",
    "nabica": "fotos/grelos.jpeg",
    "nabo": "fotos/nabo.jpeg",
    "rabanete": "fotos/rabanete.jpeg",
    "malagueta": "fotos/malagueta.jpeg",
    "mandioca": "fotos/mandioca.jpeg",
    "tomate-salada": "fotos/tomate_salada.jpeg",
    "tomate-rosa": "fotos/tomate_rosa.jpeg",
    "maca-golden-rosa": "fotos/maca_golden.jpeg",
    "hortela": "fotos/hortela.jpeg",
}


def http_get(url: str, retries: int = 4) -> bytes:
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:
            last = e
            time.sleep(1.5 * (i + 1))
    raise last


def commons_info(title: str) -> dict | None:
    params = {
        "action": "query",
        "titles": f"File:{title}",
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Credit|Attribution",
        "format": "json",
    }
    data = json.loads(http_get(COMMONS + "?" + urllib.parse.urlencode(params)))
    for page in data.get("query", {}).get("pages", {}).values():
        if "imageinfo" in page:
            ii = page["imageinfo"][0]
            ii["_title"] = page["title"]
            return ii
    return None


def meta_val(ii: dict, key: str) -> str:
    return ((ii.get("extmetadata") or {}).get(key) or {}).get("value") or ""


def to_webp(raw: bytes, dest: Path) -> tuple[int, int]:
    im = Image.open(BytesIO(raw))
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGB")
    elif im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    w, h = im.size
    if max(w, h) > MAX_SIDE:
        if w >= h:
            im = im.resize((MAX_SIDE, max(int(h * MAX_SIDE / w), 1)), Image.Resampling.LANCZOS)
        else:
            im = im.resize((max(int(w * MAX_SIDE / h), 1), MAX_SIDE), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
    return im.size


def main() -> None:
    rows_by_slug = {}
    if CSV_PATH.exists():
        with CSV_PATH.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rows_by_slug[row["product_slug"]] = row

    jobs = {**{k: (v[0], v[1]) for k, v in REPLACEMENTS.items()}, **{k: (v, "own") for k, v in OWN.items()}}
    for slug, (src, kind) in jobs.items():
        dest = OUT_DIR / f"{slug}.webp"
        if kind == "own":
            path = Path(src)
            if not path.exists():
                print("MISSING OWN", slug, src)
                continue
            raw = path.read_bytes()
            w, h = to_webp(raw, dest)
            im0 = Image.open(path)
            sw, sh = im0.size
            print(f"OWN {slug} <- {src} {sw}x{sh}")
            rows_by_slug[slug] = {
                "product_slug": slug,
                "filename": str(dest),
                "source_url": src,
                "page_url": src,
                "license": "Mundifruta own work / existing repository asset",
                "license_url": "",
                "author": "Mundifruta",
                "source_width": sw,
                "source_height": sh,
                "output_width": w,
                "output_height": h,
                "notes": "Converted from existing shop or previously committed catalogue photo. Commercial use by Mundifruta.",
            }
            continue

        ii = commons_info(src)
        if not ii:
            print("MISSING COMMONS", slug, src)
            continue
        print(f"GET {slug} <- {src} {ii.get('width')}x{ii.get('height')}")
        raw = http_get(ii["url"])
        w, h = to_webp(raw, dest)
        rows_by_slug[slug] = {
            "product_slug": slug,
            "filename": str(dest),
            "source_url": ii["url"],
            "page_url": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(ii["_title"].replace(" ", "_")),
            "license": meta_val(ii, "LicenseShortName"),
            "license_url": meta_val(ii, "LicenseUrl"),
            "author": meta_val(ii, "Artist"),
            "source_width": ii.get("width"),
            "source_height": ii.get("height"),
            "output_width": w,
            "output_height": h,
            "notes": "Wikimedia Commons; replacement after visual QA",
        }
        time.sleep(0.15)

    # Bravo de Esmolfe: no suitable licensed fruit photo
    rows_by_slug["bravo-esmolfe-premium"] = {
        "product_slug": "bravo-esmolfe-premium",
        "filename": "",
        "source_url": "",
        "page_url": "",
        "license": "",
        "license_url": "",
        "author": "",
        "source_width": "",
        "source_height": "",
        "output_width": "",
        "output_height": "",
        "notes": "No suitable commercially licensed Bravo de Esmolfe apple photo found. Image not substituted.",
    }
    dest = OUT_DIR / "bravo-esmolfe-premium.webp"
    if dest.exists():
        dest.unlink()

    fields = [
        "product_slug", "filename", "source_url", "page_url", "license", "license_url",
        "author", "source_width", "source_height", "output_width", "output_height", "notes",
    ]
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for slug in sorted(rows_by_slug):
            w.writerow(rows_by_slug[slug])
    print("CSV updated", len(rows_by_slug))


if __name__ == "__main__":
    main()
