#!/usr/bin/env python3
"""Second pass: replace rejected downloads and restore correct local photos."""
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

COMMONS_FIXES = {
    "tomate-rosa": "Brandywine-Tomato.jpg",
    "laranja-algarve-premium": "Oranges.jpg",
    "malagueta": "Capsicum frutescens.jpg",
    "agriao": "Nasturtium officinale 154629037.jpg",
    "melancia-com-sementes": "Watermelon.jpg",
    "melancia-quarto": "Watermelon.jpg",
    "nabica": "Grelos al febrer.jpg",
}

LOCAL_FIXES = {
    "banana-madeira": "fotos/banana_madeira.jpeg",
    "couve-coracao": "fotos/couvecoracao.jpeg",
    "mandioca": "fotos/mandioca.jpeg",
    "grelo-de-nabo": "fotos/grelos.jpeg",
    "cabaz-detox": "fotos/cabaz_mix.jpeg",
}


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


def to_square(im: Image.Image, crop_box: tuple[int, int, int, int] | None = None) -> Image.Image:
    if crop_box:
        im = im.crop(crop_box)
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


def load_csv() -> dict[str, dict]:
    rows = {}
    with CSV_PATH.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows[row["product_slug"]] = row
    return rows


def write_csv(rows: dict[str, dict]) -> None:
    fields = [
        "product_slug", "filename", "source_url", "page_url", "license", "license_url",
        "author", "source_width", "source_height", "output_width", "output_height", "notes",
    ]
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for slug in sorted(rows):
            w.writerow({k: rows[slug].get(k, "") for k in fields})


def row_commons(slug: str, dest: Path, ii: dict, w: int, h: int, note: str) -> dict:
    return {
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
        "notes": note,
    }


def row_own(slug: str, dest: Path, src: str, sw: int, sh: int, w: int, h: int) -> dict:
    return {
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
        "notes": "Restored correct local product photo after visual QA; square crop 2026-09",
    }


def make_placeholder(dest: Path) -> tuple[int, int]:
    side = 1400
    cream = (247, 241, 230)
    green = (46, 92, 58)
    im = Image.new("RGB", (side, side), cream)
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((90, 90, side - 90, side - 90), radius=40, outline=green, width=5)
    # simple apple mark
    draw.ellipse((600, 380, 800, 580), outline=green, width=8)
    draw.arc((680, 340, 760, 420), start=200, end=350, fill=green, width=8)
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf", 64)
        font_sub = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 36)
    except OSError:
        font_title = ImageFont.load_default()
        font_sub = font_title

    def center(text: str, y: int, font) -> None:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((side - tw) / 2, y), text, font=font, fill=green)

    center("Bravo de Esmolfe", 640, font_title)
    center("Foto da loja em breve", 740, font_sub)
    return save_webp(im, dest)


def main() -> None:
    rows = load_csv()

    # Commons replacements (watermelon handled with two crops)
    watermelon_raw = None
    watermelon_ii = None
    for slug, title in COMMONS_FIXES.items():
        print("GET", slug, title)
        ii = commons_info(title)
        if not ii:
            print("  MISSING", title)
            continue
        raw = http_get(ii["url"])
        if title == "Watermelon.jpg":
            watermelon_raw = raw
            watermelon_ii = ii
            continue
        im = to_square(open_rgb(raw))
        dest = OUT_DIR / f"{slug}.webp"
        w, h = save_webp(im, dest)
        rows[slug] = row_commons(slug, dest, ii, w, h, "Wikimedia Commons; visual QA pass 2")
        print("  OK", w, h)
        time.sleep(0.2)

    if watermelon_raw and watermelon_ii:
        full = open_rgb(watermelon_raw)
        fw, fh = full.size
        # full pattern — seeds visible
        dest = OUT_DIR / "melancia-com-sementes.webp"
        im = to_square(full)
        w, h = save_webp(im, dest)
        rows["melancia-com-sementes"] = row_commons(
            "melancia-com-sementes", dest, watermelon_ii, w, h,
            "Wikimedia Commons; seeded wedges; visual QA pass 2",
        )
        print("  OK melancia-com-sementes", w, h)
        # largest single wedge (lower-left quadrant of the USDA plate)
        dest = OUT_DIR / "melancia-quarto.webp"
        box = (0, int(fh * 0.38), int(fw * 0.62), fh)
        im = to_square(full, crop_box=box)
        w, h = save_webp(im, dest)
        rows["melancia-quarto"] = row_commons(
            "melancia-quarto", dest, watermelon_ii, w, h,
            "Wikimedia Commons; single quarter crop from seeded wedges; visual QA pass 2",
        )
        print("  OK melancia-quarto", w, h)

    for slug, src in LOCAL_FIXES.items():
        path = Path(src)
        print("OWN", slug, src)
        raw = path.read_bytes()
        src_im = Image.open(path)
        sw, sh = src_im.size
        im = to_square(open_rgb(raw))
        dest = OUT_DIR / f"{slug}.webp"
        w, h = save_webp(im, dest)
        rows[slug] = row_own(slug, dest, src, sw, sh, w, h)
        print("  OK", w, h)

    # nabica: keep flowering grelos (already downloaded) — already distinct
    # crop watermark off orange sweet potato
    spicy = OUT_DIR / "batata-doce-cor-laranja.webp"
    if spicy.exists():
        im = open_rgb(spicy.read_bytes())
        w, h = im.size
        im = im.crop((0, 0, w, int(h * 0.86)))  # drop phone watermark bar
        im = to_square(im)
        w, h = save_webp(im, spicy)
        if "batata-doce-cor-laranja" in rows:
            rows["batata-doce-cor-laranja"]["output_width"] = w
            rows["batata-doce-cor-laranja"]["output_height"] = h
            rows["batata-doce-cor-laranja"]["notes"] = (
                (rows["batata-doce-cor-laranja"].get("notes") or "")
                + "; watermark cropped in visual QA"
            ).strip("; ")
        print("CROP watermark batata-doce-cor-laranja", w, h)

    dest = OUT_DIR / "bravo-esmolfe-premium.webp"
    w, h = make_placeholder(dest)
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
    print("PLACEHOLDER bravo-esmolfe-premium")

    # extra square recrops for leftover wide keepers
    for name in [
        "nectarina-media.webp",
        "maca-royal-gala-media.webp",
        "laranja-africa-do-sul.webp",
        "pessego-vermelho-medio.webp",
    ]:
        path = OUT_DIR / name
        if not path.exists():
            continue
        im = to_square(open_rgb(path.read_bytes()))
        w, h = save_webp(im, path)
        slug = path.stem
        print("RECROP", name, w, h)
        if slug in rows:
            rows[slug]["output_width"] = w
            rows[slug]["output_height"] = h

    write_csv(rows)
    print("CSV", len(rows))


if __name__ == "__main__":
    main()
