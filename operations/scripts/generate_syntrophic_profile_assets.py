#!/usr/bin/env python3
import json
import math
from pathlib import Path
from typing import Dict, List, Tuple

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PROFILES_FILE = ROOT / "profiles" / "syntrophic_agents_223_227.json"
IMAGES_DIR = ROOT / "profiles" / "images"
METADATA_DIR = ROOT / "profiles" / "metadata"
IMAGE_SIZE = 1024


def hex_to_rgb(value: str) -> Tuple[int, int, int]:
    value = value.strip().lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def blend(a: Tuple[int, int, int], b: Tuple[int, int, int], t: float) -> Tuple[int, int, int]:
    return (
        int(a[0] + (b[0] - a[0]) * t),
        int(a[1] + (b[1] - a[1]) * t),
        int(a[2] + (b[2] - a[2]) * t),
    )


def gradient_background(size: int, c_top: Tuple[int, int, int], c_bot: Tuple[int, int, int]) -> Image.Image:
    bg = Image.new("RGB", (size, size), c_top)
    px = bg.load()
    for y in range(size):
        t = y / float(size - 1)
        row = blend(c_top, c_bot, t)
        for x in range(size):
            px[x, y] = row
    return bg


def add_grain(img: Image.Image, amount: int = 18) -> Image.Image:
    noise = Image.effect_noise(img.size, amount).convert("L")
    noise = Image.merge("RGB", (noise, noise, noise))
    return ImageChops.overlay(img, noise)


def glow_circle(overlay: Image.Image, center: Tuple[float, float], radius: float, color: Tuple[int, int, int], alpha: int) -> None:
    layer = Image.new("RGBA", overlay.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    x, y = center
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=(color[0], color[1], color[2], alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.35))
    overlay.alpha_composite(layer)


def draw_ring(draw: ImageDraw.ImageDraw, center: Tuple[float, float], rx: float, ry: float, color: Tuple[int, int, int], width: int) -> None:
    cx, cy = center
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=color + (235,), width=width)


def draw_atlas(canvas: Image.Image, palette: Dict[str, Tuple[int, int, int]]) -> None:
    s = canvas.size[0]
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    center = (s * 0.5, s * 0.52)
    draw_ring(draw, center, s * 0.20, s * 0.11, palette["cyan"], 8)
    draw_ring(draw, center, s * 0.16, s * 0.24, palette["mint"], 8)
    draw_ring(draw, center, s * 0.09, s * 0.09, palette["gold"], 6)

    points = [
        (s * 0.33, s * 0.52),
        (s * 0.67, s * 0.52),
        (s * 0.50, s * 0.28),
        (s * 0.50, s * 0.76),
        (s * 0.60, s * 0.39),
        (s * 0.40, s * 0.65),
    ]
    for p in points:
        draw.ellipse((p[0] - 10, p[1] - 10, p[0] + 10, p[1] + 10), fill=palette["mint"] + (255,))
        glow_circle(overlay, p, 38, palette["cyan"], 110)

    glow_circle(overlay, center, 180, palette["cyan"], 90)
    canvas.alpha_composite(overlay)


def draw_sentinel(canvas: Image.Image, palette: Dict[str, Tuple[int, int, int]]) -> None:
    s = canvas.size[0]
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    cx, cy = s * 0.5, s * 0.52

    shield = [
        (cx, s * 0.21),
        (s * 0.74, s * 0.34),
        (s * 0.67, s * 0.67),
        (cx, s * 0.83),
        (s * 0.33, s * 0.67),
        (s * 0.26, s * 0.34),
    ]
    draw.polygon(shield, outline=palette["cyan"] + (245,), fill=(20, 34, 58, 120), width=10)

    for t in [0.2, 0.4, 0.6, 0.8]:
        x1 = s * 0.33 + (s * 0.34 * t)
        y1 = s * 0.34 + (s * 0.30 * t)
        x2 = s * 0.67 - (s * 0.34 * t)
        y2 = s * 0.34 + (s * 0.30 * t)
        draw.line((x1, y1, x2, y2), fill=palette["mint"] + (220,), width=4)

    draw.line((s * 0.40, s * 0.53, s * 0.49, s * 0.62, s * 0.63, s * 0.43), fill=palette["gold"] + (240,), width=8)
    glow_circle(overlay, (cx, cy), 220, palette["cyan"], 90)
    canvas.alpha_composite(overlay)


def draw_relay(canvas: Image.Image, palette: Dict[str, Tuple[int, int, int]]) -> None:
    s = canvas.size[0]
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    cx, cy = s * 0.5, s * 0.5

    radius = s * 0.28
    for offset_deg, color in [(0, palette["cyan"]), (120, palette["mint"]), (240, palette["gold"])]:
        start = offset_deg + 18
        end = offset_deg + 122
        draw.arc((cx - radius, cy - radius, cx + radius, cy + radius), start=start, end=end, fill=color + (240,), width=12)
        tx = cx + math.cos(math.radians(offset_deg + 70)) * radius
        ty = cy + math.sin(math.radians(offset_deg + 70)) * radius
        draw.ellipse((tx - 10, ty - 10, tx + 10, ty + 10), fill=color + (255,))
        glow_circle(overlay, (tx, ty), 34, color, 120)

    draw.ellipse((cx - 20, cy - 20, cx + 20, cy + 20), fill=palette["mint"] + (255,))
    glow_circle(overlay, (cx, cy), 170, palette["cyan"], 90)
    canvas.alpha_composite(overlay)


def draw_ledger(canvas: Image.Image, palette: Dict[str, Tuple[int, int, int]]) -> None:
    s = canvas.size[0]
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")

    blocks = [
        (s * 0.28, s * 0.31, s * 0.72, s * 0.41),
        (s * 0.24, s * 0.46, s * 0.76, s * 0.56),
        (s * 0.20, s * 0.61, s * 0.80, s * 0.71),
    ]
    colors = [palette["cyan"], palette["mint"], palette["gold"]]
    for i, rect in enumerate(blocks):
        c = colors[i]
        draw.rounded_rectangle(rect, radius=18, outline=c + (245,), fill=(25, 37, 62, 120), width=7)
        y = rect[1] + (rect[3] - rect[1]) / 2
        for j in range(4):
            x1 = rect[0] + 24 + j * 52
            x2 = x1 + 30
            draw.line((x1, y, x2, y), fill=c + (235,), width=4)
        glow_circle(overlay, ((rect[0] + rect[2]) / 2, y), 120, c, 80)

    canvas.alpha_composite(overlay)


def draw_scout(canvas: Image.Image, palette: Dict[str, Tuple[int, int, int]]) -> None:
    s = canvas.size[0]
    overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay, "RGBA")
    cx, cy = s * 0.5, s * 0.5

    star = []
    outer_r = s * 0.24
    inner_r = s * 0.09
    for i in range(12):
        a = math.radians(-90 + i * 30)
        r = outer_r if i % 2 == 0 else inner_r
        star.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    draw.polygon(star, outline=palette["cyan"] + (245,), fill=(18, 34, 57, 125), width=7)

    branches = [15, 65, 130, 210, 285]
    for deg in branches:
        a = math.radians(deg)
        x2 = cx + math.cos(a) * s * 0.38
        y2 = cy + math.sin(a) * s * 0.38
        draw.line((cx, cy, x2, y2), fill=palette["mint"] + (215,), width=5)
        draw.ellipse((x2 - 9, y2 - 9, x2 + 9, y2 + 9), fill=palette["gold"] + (245,))
        glow_circle(overlay, (x2, y2), 30, palette["cyan"], 120)

    glow_circle(overlay, (cx, cy), 190, palette["cyan"], 90)
    canvas.alpha_composite(overlay)


def make_image(agent: Dict[str, object], index: int) -> Path:
    palette = {
        "navy": hex_to_rgb("#0B1020"),
        "cyan": hex_to_rgb("#21D4FD"),
        "mint": hex_to_rgb("#7CF29C"),
        "gold": hex_to_rgb("#F9C74F"),
    }
    alt_colors = [hex_to_rgb("#142035"), hex_to_rgb("#0F172A"), hex_to_rgb("#10243A"), hex_to_rgb("#122036"), hex_to_rgb("#0E1E31")]
    bg = gradient_background(IMAGE_SIZE, palette["navy"], alt_colors[index % len(alt_colors)])
    bg = add_grain(bg)
    canvas = bg.convert("RGBA")

    slug = str(agent["slug"])
    if "atlas" in slug:
        draw_atlas(canvas, palette)
    elif "sentinel" in slug:
        draw_sentinel(canvas, palette)
    elif "relay" in slug:
        draw_relay(canvas, palette)
    elif "ledger" in slug:
        draw_ledger(canvas, palette)
    else:
        draw_scout(canvas, palette)

    out_path = IMAGES_DIR / f"{slug}.png"
    canvas.convert("RGB").save(out_path, "PNG")
    return out_path


def build_metadata(agent: Dict[str, object], image_rel: str) -> Dict[str, object]:
    return {
        "name": agent["name"],
        "description": agent["description"],
        "image": image_rel,
        "external_url": "https://www.syntrophic.md",
        "attributes": [
            {"trait_type": "Brand", "value": "Syntrophic"},
            {"trait_type": "Agent Number", "value": agent["number"]},
            {"trait_type": "Role", "value": agent["title"]},
            {"trait_type": "Theme", "value": agent["style"]["theme"]},
            {"trait_type": "Tags", "value": ", ".join(agent["tags"])},
        ],
    }


def main() -> None:
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    agents: List[Dict[str, object]] = json.loads(PROFILES_FILE.read_text())
    for idx, agent in enumerate(agents):
        image_path = make_image(agent, idx)
        image_rel = str(image_path.relative_to(ROOT)).replace("\\", "/")
        agent["image_uri"] = image_rel

        metadata = build_metadata(agent, image_rel)
        metadata_path = METADATA_DIR / f"{agent['slug']}.json"
        metadata_path.write_text(json.dumps(metadata, indent=2) + "\n")
        agent["metadata_local_uri"] = str(metadata_path.relative_to(ROOT)).replace("\\", "/")

    PROFILES_FILE.write_text(json.dumps(agents, indent=2) + "\n")
    print(f"Generated {len(agents)} images in {IMAGES_DIR}")
    print(f"Generated metadata JSON files in {METADATA_DIR}")
    print(f"Updated {PROFILES_FILE}")


if __name__ == "__main__":
    main()
