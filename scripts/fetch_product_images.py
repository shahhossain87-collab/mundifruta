#!/usr/bin/env python3
"""Download commercially licensed produce photos and convert them to WebP."""
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

ALLOWED = {
    "public domain",
    "cc0",
    "cc0 1.0",
    "pdm",
    "pd",
    "no restrictions",
    "cc by 2.0",
    "cc by 2.5",
    "cc by 3.0",
    "cc by 3.0 us",
    "cc by 4.0",
    "cc by-sa 2.0",
    "cc by-sa 2.5",
    "cc by-sa 3.0",
    "cc by-sa 4.0",
}

# slug -> Wikimedia Commons file title (without File: prefix is OK)
CURATED = {
    # fruits — variety-accurate where required
    "melancia-com-sementes": "Watermelon cut.jpg",
    "melancia-quarto": "Watermelon.jpg",
    "uva-vale-de-rosa-sem-grainha": "Crimson Seedless Grapes.jpg",
    "uva-vale-de-rosa-preta-sem-grainha": "Black seedless grapes 4300175324717 pack 01.jpg",
    "uva-dona-maria": "Green grape cluster on a white background.jpg",
    "abacate-hass": "Avocado Hass - single and halved.jpg",
    "nectarina-media": "Nectarine on white.jpg",
    "nectarina-grande-premium": "Nectarine on white.jpg",
    "pera-rocha": "Rocha Pear 2017 AD.jpg",
    "pera-rocha-grande": "Image of a Rocha pear.jpg",
    "pera-rocha-nacional-pequena": "Rocha Pear 2017 AB.jpg",
    "pera-general-grande": "Four pears.jpg",
    "diospiros-kaki": "Fuyu Persimmon (Diospyros Kaki).jpg",
    "anona": "Annona squamosa (white background).jpg",
    "marmelo": "Cydonia oblonga 'Portugal' 5Dsr 2392.jpg",
    "morango-500g": "Strawberry on white background.jpg",
    "roma": "Pomegranate on white.jpg",
    "lima": "Two limes.jpg",
    "limao": "Lemon Grey 2252546.jpg",
    "maca-golden": "Golden Delicious apples.jpg",
    "maca-royal-gala-media": "Royal Gala apples (organic).jpg",
    "maca-royal-gala-nacional-pequena": "Royal Gala apples (organic).jpg",
    "maca-pink-lady": "Apple Pink Lady.jpg",
    "maca-granny-smith": "The Granny Smith.jpg",
    "maca-fuji": "Apfel-Fuji.jpg",
    "maca-fuji-premium": "Apfel-Fuji.jpg",
    "abacaxi-maturado": "Pineapple on white.jpg",
    "abacaxi-aviao-costa-rica": "Pineapple on white.jpg",
    "kiwi-green-new-zealand": "Kiwi (Actinidia chinensis) 1 Luc Viatour.jpg",
    "lichia": "Lychee fruits and seed.jpg",
    "alperce": "Apricot whole444.jpg",
    "paraguaio": "Prunus Persica var. Platycarpa.JPG",
    "pessego-amarelo-pequeno": "Peaches.png",
    "pessego-vermelho-medio": "Autumn Red peaches.jpg",
    "pessego-rosa": "Autumn Red peaches.jpg",
    "clementina": "Citrus clementine.JPG",
    "laranja-africa-do-sul": "Orange Sliced White Background.jpg",
    "laranja-algarve": "Orange Sliced White Background.jpg",
    "laranja-algarve-premium": "Orange Sliced White Background.jpg",
    "manga-aviao": "Kent mango fruit.jpg",
    "manguita": "Mango fruit Nam Dok Mai.jpg",
    "meloa": "Cantaloupe Melon cross section.png",
    "banana-pao": "Plantains on white background.png",
    "amoras": "Blackberry (Rubus fruticosus).jpg",
    "ameixa-branca": "Golden (yellow) Plums.jpg",
    # vegetables
    "couve-flor": "Cauliflower 2.jpg",
    "tomate-cereja": "Cherry-Tomatoes-in-Pack.jpg",
    "macaroca": "Corn on the cob (sweet corn).jpg",
    "pepino": "Cucumber from Denmark.jpg",
    "beringela": "Eggplant 3.jpg",
    "feijao-verde": "Green Beans 1.jpg",
    "alho-frances": "Leek on white background - 0947.jpg",
    "cebola-doce": "Onion on White.JPG",
    "salsa": "Parsley bunches - Wellington, New Zealand.jpg",
    "quiabo": "Quiabo.jpg",
    "abobora-cabocha": "Red Kabocha Squash.jpg",
    "alface-roxa": "Red leaf lettuce J1.JPG",
    "chuchu": "Sechium edule - Fruits.jpg",
    "cenoura": "Vegetable-Carrot-Bundle-wStalks.jpg",
}

# extra candidates tried if a curated file fails visual QA later
SEARCH_QUERIES = {
    "melao": "honeydew melon fruit",
    "figos": "common fig Ficus carica fruit",
    "castanha": "Castanea sativa chestnuts fruits",
    "ameixa": "plums fruit",
    "ameixa-vermelha": "red plums fruit",
    "ameixa-roxa-nacional": "purple plums",
    "ameixa-abrunho-nacional": "damson plums",
    "tangerina": "mandarin oranges fruit",
    "banana-del-monte": "cavendish bananas fruit",
    "banana-madeira": "small bananas bunch",
    "mamao": "papaya fruit whole",
    "papaia": "papaya fruit",
    "framboesa": "raspberries fruit bowl",
    "mirtilos": "blueberries fruit",
    "maca-reineta": "reinette apple fruit",
    "maca-golden-rosa": "pink golden apple",
    "cereja-fundao": "sweet cherries fruit",
    "cereja-gardunha": "sweet cherries fruit",
    "bravo-esmolfe-premium": "bravo de esmolfe apple",
    "abobora-butternut": "butternut squash whole",
    "abobora-fatiada": "sliced pumpkin",
    "abobora-inteira": "pumpkin whole orange",
    "agriao": "watercress bunch",
    "alface": "green lettuce head",
    "alho-seco": "garlic bulb white",
    "batata-agria": "yellow potatoes",
    "batata-branca": "white potatoes",
    "batata-doce": "sweet potato tuber",
    "batata-doce-cor-laranja": "orange sweet potato",
    "batata-olho-de-perdiz": "potatoes russet",
    "batata-vermelha": "red potatoes",
    "beterraba": "beetroot whole",
    "brocolos-sem-folha": "broccoli head",
    "cebola-nova": "spring onions bunch",
    "coentros": "cilantro coriander bunch",
    "cogumelos": "white button mushrooms",
    "couve-coracao": "pointed cabbage",
    "couve-lombarda": "savoy cabbage",
    "couve-portuguesa": "collard greens",
    "curgete": "zucchini courgette",
    "espinafres": "spinach leaves bunch",
    "feijao-dourado": "soybeans edamame pods",
    "feijao-maduro": "dried beans",
    "gengibre": "ginger root",
    "grelo-de-couve": "turnip greens bunch",
    "grelo-de-nabo": "turnip greens",
    "hortela": "fresh mint bunch",
    "inhame": "yam tuber",
    "malagueta": "red chili peppers",
    "mandioca": "cassava root",
    "nabica": "turnip greens",
    "nabo": "turnip root",
    "pimento-verde": "green bell pepper",
    "pimento-vermelho": "red bell pepper",
    "rabanete": "red radish bunch",
    "tomate-cacho": "tomatoes on the vine",
    "tomate-chucha": "roma plum tomatoes",
    "tomate-coracao-de-boi": "beefsteak tomato",
    "tomate-rosa": "pink heirloom tomato",
    "tomate-salada": "salad tomatoes",
}


def http_get(url: str, retries: int = 4) -> bytes:
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read()
        except Exception as e:
            last = e
            time.sleep(1.5 * (i + 1))
    raise last


def commons_info(titles: list[str]) -> dict:
    out = {}
    for i in range(0, len(titles), 20):
        chunk = titles[i : i + 20]
        params = {
            "action": "query",
            "titles": "|".join(f"File:{t}" if not t.startswith("File:") else t for t in chunk),
            "prop": "imageinfo",
            "iiprop": "url|size|mime|extmetadata",
            "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Credit|Attribution|UsageTerms",
            "format": "json",
        }
        data = json.loads(http_get(COMMONS + "?" + urllib.parse.urlencode(params)))
        for page in data.get("query", {}).get("pages", {}).values():
            title = page.get("title", "")
            key = title.replace("File:", "")
            if "missing" in page or "imageinfo" not in page:
                continue
            out[key] = page["imageinfo"][0]
            out[key]["_title"] = title
        time.sleep(0.15)
    return out


def meta_val(ii: dict, key: str) -> str:
    block = (ii.get("extmetadata") or {}).get(key) or {}
    return (block.get("value") or "").strip()


def license_ok(ii: dict) -> bool:
    lic = meta_val(ii, "LicenseShortName").lower().replace("  ", " ")
    return any(lic == a or lic.startswith(a) for a in ALLOWED)


def size_ok(ii: dict) -> bool:
    w, h = ii.get("width") or 0, ii.get("height") or 0
    return max(w, h) >= 1200


def search_commons(query: str, limit: int = 8) -> list[str]:
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": 6,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|Credit|Attribution",
        "format": "json",
    }
    data = json.loads(http_get(COMMONS + "?" + urllib.parse.urlencode(params)))
    titles = []
    for page in data.get("query", {}).get("pages", {}).values():
        if "imageinfo" not in page:
            continue
        titles.append(page["title"].replace("File:", ""))
    return titles


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
            nh = int(h * MAX_SIDE / w)
            im = im.resize((MAX_SIDE, max(nh, 1)), Image.Resampling.LANCZOS)
        else:
            nw = int(w * MAX_SIDE / h)
            im = im.resize((max(nw, 1), MAX_SIDE), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=WEBP_QUALITY, method=6)
    return im.size


def pick_file(slug: str) -> tuple[str | None, dict | None, str]:
    candidates = []
    if slug in CURATED:
        candidates.append(CURATED[slug])
    if slug in SEARCH_QUERIES:
        candidates.extend(search_commons(SEARCH_QUERIES[slug]))
        time.sleep(0.2)
    info = commons_info(candidates) if candidates else {}
    for title in candidates:
        ii = info.get(title)
        if not ii:
            continue
        if not license_ok(ii):
            continue
        if not size_ok(ii):
            continue
        mime = (ii.get("mime") or "")
        if not mime.startswith("image/"):
            continue
        if "pdf" in mime:
            continue
        return title, ii, "curated" if title == CURATED.get(slug) else "search"
    return None, None, "missing"


def main() -> None:
    slugs = sorted(set(CURATED) | set(SEARCH_QUERIES))
    rows = []
    missing = []
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for slug in slugs:
        dest = OUT_DIR / f"{slug}.webp"
        title, ii, how = pick_file(slug)
        if not title:
            missing.append(slug)
            print(f"MISSING {slug}")
            rows.append(
                {
                    "product_slug": slug,
                    "filename": "",
                    "source_url": "",
                    "page_url": "",
                    "license": "",
                    "author": "",
                    "source_width": "",
                    "source_height": "",
                    "notes": "No suitable commercially licensed image found",
                }
            )
            continue
        url = ii["url"]
        print(f"GET {slug} <- {title} ({how}) {ii.get('width')}x{ii.get('height')}")
        raw = http_get(url)
        w, h = to_webp(raw, dest)
        artist = meta_val(ii, "Artist")
        # strip simple html
        artist = artist.replace("<b>", "").replace("</b>", "")
        rows.append(
            {
                "product_slug": slug,
                "filename": str(dest),
                "source_url": url,
                "page_url": "https://commons.wikimedia.org/wiki/"
                + urllib.parse.quote(ii["_title"].replace(" ", "_")),
                "license": meta_val(ii, "LicenseShortName"),
                "license_url": meta_val(ii, "LicenseUrl"),
                "author": artist,
                "source_width": ii.get("width"),
                "source_height": ii.get("height"),
                "output_width": w,
                "output_height": h,
                "notes": f"Wikimedia Commons; selection={how}",
            }
        )
        time.sleep(0.15)

    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "product_slug",
        "filename",
        "source_url",
        "page_url",
        "license",
        "license_url",
        "author",
        "source_width",
        "source_height",
        "output_width",
        "output_height",
        "notes",
    ]
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)
    print(f"\nWrote {len(rows)-len(missing)} images, {len(missing)} missing")
    print("Missing:", ", ".join(missing) or "none")


if __name__ == "__main__":
    main()
