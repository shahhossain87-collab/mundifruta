#!/usr/bin/env python3
"""Surgical catalog photo fix: wrong products, brand-logo cabazes, duplicates, tiny files."""
from __future__ import annotations

import csv
import json
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

UA = "MundifrutaCatalogBot/1.0 (https://github.com/shahhossain87-collab/mundifruta; catalog image refresh)"
COMMONS = "https://commons.wikimedia.org/w/api.php"
OUT_DIR = Path("fotos/catalogo")
CSV_PATH = Path("docs/product-image-sources.csv")
MAX_SIDE = 1400
WEBP_QUALITY = 84

# slug -> Commons file title (no File: prefix)
REPLACEMENTS = {
    # wrong product
    "curgete": "Courgette Cucurbita pepo 2.jpg",
    # cabazes — no third-party logos
    "cabaz-frutas": "Crate of fruit and vegetables.jpg",
    "cabaz-verao": "DFC 2197 A colorful assortment of fresh fruits and vegetables - apples mango dragon fruit kiwis limes bananas and more - arranged on a wooden crate.jpg",
    "cabaz-detox": "Vegetable box.jpg",
    # split duplicate pairs
    "nectarina-grande-premium": "Nectarines 1.jpg",
    "pessego-rosa": "Peach fruit 3.jpg",
    "maca-royal-gala-nacional-pequena": "Gala apples.jpg",
    "laranja-algarve": "Oranges and leaves in Rome, Italy.jpg",
    "laranja-algarve-premium": "A Navel Orange and a Pera Orange.JPG",
    "cereja-gardunha": "Bing Cherries (USDA ARS).jpg",
    "melancia-com-sementes": "Watermelon cut.jpg",
    "melancia-quarto": "Watermelon slice.jpg",
    "grelo-de-nabo": "Grelos al febrer.jpg",
    "grelo-de-couve": "Raapstelen Brassica campestris greens.jpg",
    "nabica": "Brassica juncea kz01.jpg",
    "abacaxi-aviao-costa-rica": "Pineapple.jpg",
    "maca-fuji-premium": "Fuji apple.jpg",
    # tiny / wrong-variety stock
    "tomate-salada": "Tomatoes.jpg",
    "tomate-rosa": "TomateFleischrosaPinkBrandywinePlatzer.jpg",
    "malagueta": "09-07-2017 Piri piri peppers.JPG",
    "nabo": "Turnip-ja202211-1.jpg",
    "rabanete": "Raphanus sativus.jpg",
    "mandioca": "PeeLawPeeNam Cassava root Yuca Manioc.jpg",
    "hortela": "Fresh mint.jpg",
    "agriao": "Watercress leaves.jpg",
    "couve-coracao": "Cavolo cappuccio Cuor di bue.JPG",
    "batata-vermelha": "Red potatoes.jpg",
    "batata-doce-cor-laranja": "An image of peeled orange fleshed sweet potatoe.jpg",
    "banana-madeira": "Madeira-Ponta do Sol-Lugar de Baixo-Centro da Banana (museum)-banana-01ASD.jpg",
}

# Existing catalog files that are the right fruit but a bad crop — pad/crop to square.
RECROP_LOCAL = [
    "pera-general-grande.webp",
    "diospiros-kaki.webp",
    "salsa.webp",
    "cebola-nova.webp",
    "abacaxi-maturado.webp",
    "alho-frances.webp",
    "pessego-amarelo-pequeno.webp",
]


def http_get(url: str, retries: int = 4) -> bytes:
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=90) as r:
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


def open_rgb(raw: bytes) -> Image.Image:
    im = Image.open(BytesIO(raw))
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGB")
    elif im.mode == "RGBA":
        bg = Image.new("RGB", im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    return im


def to_square(im: Image.Image) -> Image.Image:
    w, h = im.size
    ratio = w / h if h else 1
    if 0.78 <= ratio <= 1.28:
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        im = im.crop((left, top, left + side, top + side))
    else:
        side = max(w, h)
        bg = Image.new("RGB", (side, side), (255, 255, 255))
        bg.paste(im, ((side - w) // 2, (side - h) // 2))
        im = bg
    if im.size[0] > MAX_SIDE:
        im = im.resize((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
    return im


def save_webp(im: Image.Image, dest: Path) -> tuple[int, int]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
    return im.size


def make_placeholder(dest: Path, title: str, subtitle: str) -> tuple[int, int]:
    side = 1400
    im = Image.new("RGB", (side, side), (247, 241, 230))
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((80, 80, side - 80, side - 80), radius=48, outline=(46, 92, 58), width=6)
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 72)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
    except OSError:
        font_title = ImageFont.load_default()
        font_sub = font_title
    def center(text, y, font, fill):
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((side - tw) / 2, y), text, font=font, fill=fill)
    center("🍎", 480, font_title, (46, 92, 58))
    center(title, 640, font_title, (46, 92, 58))
    center(subtitle, 760, font_sub, (90, 90, 80))
    return save_webp(im, dest)


def load_csv() -> dict[str, dict]:
    rows = {}
    if CSV_PATH.exists():
        with CSV_PATH.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                rows[row["product_slug"]] = row
    return rows


def write_csv(rows: dict[str, dict]) -> None:
    fields = [
        "product_slug", "filename", "source_url", "page_url", "license", "license_url",
        "author", "source_width", "source_height", "output_width", "output_height", "notes",
    ]
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for slug in sorted(rows):
            row = {k: rows[slug].get(k, "") for k in fields}
            w.writerow(row)


def main() -> None:
    rows = load_csv()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for slug, title in REPLACEMENTS.items():
        dest = OUT_DIR / f"{slug}.webp"
        print(f"GET {slug} <- {title}")
        ii = commons_info(title)
        if not ii:
            print("  MISSING COMMONS", title)
            continue
        raw = http_get(ii["url"])
        im = to_square(open_rgb(raw))
        w, h = save_webp(im, dest)
        print(f"  OK {ii.get('width')}x{ii.get('height')} -> {w}x{h} {meta_val(ii, 'LicenseShortName')}")
        rows[slug] = {
            "product_slug": slug,
            "filename": str(dest),
            "source_url": ii["url"],
            "page_url": "https://commons.wikimedia.org/wiki/"
            + urllib.parse.quote(ii["_title"].replace(" ", "_")),
            "license": meta_val(ii, "LicenseShortName"),
            "license_url": meta_val(ii, "LicenseUrl"),
            "author": meta_val(ii, "Artist"),
            "source_width": ii.get("width"),
            "source_height": ii.get("height"),
            "output_width": w,
            "output_height": h,
            "notes": "Wikimedia Commons; surgical photo fix 2026-09",
        }
        time.sleep(0.2)

    for name in RECROP_LOCAL:
        path = OUT_DIR / name
        if not path.exists():
            print("SKIP recrop missing", name)
            continue
        im = to_square(open_rgb(path.read_bytes()))
        w, h = save_webp(im, path)
        slug = path.stem
        print(f"RECROP {name} -> {w}x{h}")
        if slug in rows:
            rows[slug]["output_width"] = w
            rows[slug]["output_height"] = h
            note = rows[slug].get("notes") or ""
            if "square recrop" not in note:
                rows[slug]["notes"] = (note + "; square recrop 2026-09").strip("; ")

    dest = OUT_DIR / "bravo-esmolfe-premium.webp"
    w, h = make_placeholder(dest, "Bravo de Esmolfe", "Foto da loja em breve")
    rows["bravo-esmolfe-premium"] = {
        "product_slug": "bravo-esmolfe-premium",
        "filename": str(dest),
        "source_url": "",
        "page_url": "",
        "license": "Mundifruta placeholder",
        "license_url": "",
        "author": "Mundifruta",
        "source_width": w,
        "source_height": h,
        "output_width": w,
        "output_height": h,
        "notes": "Honest placeholder — no licensed Bravo de Esmolfe photo found. Replace with a shop photo.",
    }
    print(f"PLACEHOLDER bravo-esmolfe-premium {w}x{h}")

    write_csv(rows)
    print("CSV rows", len(rows))


if __name__ == "__main__":
    main()
