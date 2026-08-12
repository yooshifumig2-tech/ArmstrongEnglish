#!/usr/bin/env python3
"""Build the browser catalog from Mojang's official Java Edition data packs.

The large client/server jars are deliberately not committed. Run this script with
the verified 26.2 jars and zh_cn language JSON to refresh the compact catalog and
sprite atlas used by the educational fan site.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import re
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw


CRAFT_TYPES = {
    "minecraft:crafting_shaped",
    "minecraft:crafting_shapeless",
    "minecraft:crafting_transmute",
    "minecraft:crafting_dye",
    "minecraft:crafting_decorated_pot",
    "minecraft:crafting_special_bannerduplicate",
    "minecraft:crafting_special_bookcloning",
    "minecraft:crafting_special_firework_rocket",
    "minecraft:crafting_special_firework_star",
    "minecraft:crafting_special_firework_star_fade",
    "minecraft:crafting_special_mapextending",
    "minecraft:crafting_special_repairitem",
    "minecraft:crafting_special_shielddecoration",
    "minecraft:crafting_imbue",
}

SPECIAL_RESULTS = {
    "book_cloning": "written_book",
    "decorated_pot": "decorated_pot",
    "firework_rocket": "firework_rocket",
    "firework_star": "firework_star",
    "firework_star_fade": "firework_star",
    "map_extending": "filled_map",
    "repair_item": "iron_pickaxe",
    "shield_decoration": "shield",
}


def strip_namespace(value: str) -> str:
    return value.split(":", 1)[-1]


def title_from_id(value: str) -> str:
    return strip_namespace(value).replace("_", " ").title()


def read_json(zf: zipfile.ZipFile, name: str) -> dict:
    return json.loads(zf.read(name))


def hash_color(name: str) -> tuple[int, int, int, int]:
    digest = hashlib.sha1(name.encode()).digest()
    return (65 + digest[0] % 135, 65 + digest[1] % 135, 65 + digest[2] % 135, 255)


def placeholder(name: str) -> Image.Image:
    image = Image.new("RGBA", (16, 16), hash_color(name))
    draw = ImageDraw.Draw(image)
    bright = tuple(min(255, value + 45) for value in hash_color(name)[:3]) + (255,)
    dark = tuple(max(0, value - 45) for value in hash_color(name)[:3]) + (255,)
    draw.rectangle((1, 1, 14, 14), outline=bright)
    draw.line((0, 15, 15, 15), fill=dark, width=2)
    draw.line((15, 0, 15, 15), fill=dark, width=2)
    draw.rectangle((4, 4, 7, 7), fill=bright)
    return image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", required=True)
    parser.add_argument("--client", required=True)
    parser.add_argument("--zh", required=True)
    parser.add_argument("--project", required=True)
    args = parser.parse_args()

    project = Path(args.project).resolve()
    data_dir = project / "src" / "data"
    public_dir = project / "public" / "mc"
    data_dir.mkdir(parents=True, exist_ok=True)
    public_dir.mkdir(parents=True, exist_ok=True)

    server = zipfile.ZipFile(args.server)
    client = zipfile.ZipFile(args.client)
    server_names = set(server.namelist())
    client_names = set(client.namelist())
    en = read_json(server, "assets/minecraft/lang/en_us.json")
    zh = json.loads(Path(args.zh).read_text(encoding="utf-8"))

    tag_prefix = "data/minecraft/tags/item/"
    tags: dict[str, list] = {}
    for name in server_names:
        if name.startswith(tag_prefix) and name.endswith(".json"):
            tag_id = name[len(tag_prefix):-5]
            tags[tag_id] = read_json(server, name).get("values", [])

    def resolve_tag(tag: str, seen: set[str] | None = None) -> list[str]:
        clean = strip_namespace(tag.lstrip("#"))
        seen = set() if seen is None else seen
        if clean in seen:
            return []
        seen.add(clean)
        resolved: list[str] = []
        for raw in tags.get(clean, []):
            value = raw.get("id") if isinstance(raw, dict) else raw
            if not isinstance(value, str):
                continue
            if value.startswith("#"):
                resolved.extend(resolve_tag(value, seen))
            else:
                resolved.append(strip_namespace(value))
        return list(dict.fromkeys(resolved))

    def ingredient(raw) -> dict | None:
        if raw is None:
            return None
        if isinstance(raw, list):
            choices = [ingredient(value) for value in raw]
            choices = [value for value in choices if value]
            if not choices:
                return None
            alternatives = list(dict.fromkeys(
                option for choice in choices for option in choice.get("alternatives", [choice["id"]])
            ))
            return {"id": alternatives[0], "alternatives": alternatives[:40]}
        if isinstance(raw, dict):
            if "item" in raw:
                return ingredient(raw["item"])
            if "items" in raw:
                return ingredient(raw["items"])
            if "tag" in raw:
                return ingredient("#" + raw["tag"])
            if "id" in raw:
                return ingredient(raw["id"])
            return None
        if not isinstance(raw, str):
            return None
        if raw.startswith("#"):
            tag = strip_namespace(raw[1:])
            alternatives = resolve_tag(tag)
            if not alternatives:
                return {"id": tag, "tag": tag, "alternatives": [tag]}
            return {"id": alternatives[0], "tag": tag, "alternatives": alternatives[:40]}
        item_id = strip_namespace(raw)
        return {"id": item_id, "alternatives": [item_id]}

    def result_for(stem: str, recipe: dict) -> tuple[str, int]:
        result = recipe.get("result")
        if isinstance(result, str):
            return strip_namespace(result), 1
        if isinstance(result, dict) and result.get("id"):
            return strip_namespace(result["id"]), int(result.get("count", 1))
        if stem.endswith("_duplicate"):
            return stem.removesuffix("_duplicate"), 1
        return SPECIAL_RESULTS.get(stem, stem), 1

    def localize(item_id: str) -> tuple[str, str]:
        keys = [f"item.minecraft.{item_id}", f"block.minecraft.{item_id}"]
        english = next((en[key] for key in keys if key in en), title_from_id(item_id))
        chinese = next((zh[key] for key in keys if key in zh), "")
        return english, chinese

    recipes: list[dict] = []
    used_items: set[str] = {
        "crafting_table", "oak_planks", "stick", "wooden_pickaxe", "apple", "torch",
    }
    recipe_prefix = "data/minecraft/recipe/"
    for name in sorted(server_names):
        if not (name.startswith(recipe_prefix) and name.endswith(".json")):
            continue
        recipe = read_json(server, name)
        recipe_type = recipe.get("type", "")
        if recipe_type not in CRAFT_TYPES:
            continue
        stem = name[len(recipe_prefix):-5]
        result_id, result_count = result_for(stem, recipe)
        slots: list[dict | None] = [None] * 9
        is_dynamic = "special" in recipe_type or recipe_type in {
            "minecraft:crafting_decorated_pot", "minecraft:crafting_imbue"
        }

        if recipe_type == "minecraft:crafting_shaped":
            pattern = recipe.get("pattern", [])
            key = recipe.get("key", {})
            for row_index, row in enumerate(pattern[:3]):
                for col_index, symbol in enumerate(row[:3]):
                    if symbol != " ":
                        slots[row_index * 3 + col_index] = ingredient(key.get(symbol))
        elif recipe_type == "minecraft:crafting_shapeless":
            for index, raw in enumerate(recipe.get("ingredients", [])[:9]):
                slots[index] = ingredient(raw)
        elif recipe_type == "minecraft:crafting_transmute":
            materials = [recipe.get("input"), recipe.get("material")]
            cursor = 0
            for raw in materials:
                parsed = ingredient(raw)
                if not parsed:
                    continue
                count_value = recipe.get("material_count", 1)
                if isinstance(count_value, dict):
                    count_value = count_value.get("min", 1)
                repeat = int(count_value) if raw == recipe.get("material") else 1
                for _ in range(min(repeat, 9 - cursor)):
                    slots[cursor] = parsed
                    cursor += 1
        elif recipe_type == "minecraft:crafting_dye":
            slots[0] = ingredient(recipe.get("target"))
            slots[1] = ingredient(recipe.get("dye"))

        english, chinese = localize(result_id)
        nonempty = [slot for slot in slots if slot]
        for slot in nonempty:
            used_items.add(slot["id"])
        used_items.add(result_id)
        official_category = recipe.get("category", "misc")
        category = "special" if is_dynamic else official_category
        recipes.append({
            "id": stem,
            "type": strip_namespace(recipe_type),
            "category": category,
            "group": recipe.get("group", ""),
            "result": {"id": result_id, "count": result_count, "name": english, "zh": chinese},
            "slots": slots,
            "dynamic": is_dynamic,
            "ingredientCount": len(nonempty),
        })

    recipe_order = {"crafting_table": 0, "wooden_pickaxe": 1, "torch": 2, "chest": 3}
    recipes.sort(key=lambda entry: (
        recipe_order.get(entry["result"]["id"], 99),
        entry["category"], entry["result"]["name"], entry["id"]
    ))

    for item_id in list(used_items):
        english, chinese = localize(item_id)
        # Put localized names directly on each ingredient to keep the UI lookup cheap.
        for recipe in recipes:
            for slot in recipe["slots"]:
                if slot and slot["id"] == item_id:
                    slot.setdefault("name", english)
                    slot.setdefault("zh", chinese)

    def model_strings(value) -> list[str]:
        found: list[str] = []
        if isinstance(value, dict):
            for child in value.values():
                found.extend(model_strings(child))
        elif isinstance(value, list):
            for child in value:
                found.extend(model_strings(child))
        elif isinstance(value, str) and re.match(r"^(minecraft:)?(item|block)/", value):
            found.append(strip_namespace(value))
        return found

    model_cache: dict[str, dict] = {}

    def load_model(model: str) -> dict:
        clean = strip_namespace(model)
        if clean in model_cache:
            return model_cache[clean]
        model_path = f"assets/minecraft/models/{clean}.json"
        model_cache[clean] = read_json(client, model_path) if model_path in client_names else {}
        return model_cache[clean]

    def texture_from_model(model: str, seen: set[str] | None = None) -> str | None:
        clean = strip_namespace(model)
        seen = set() if seen is None else seen
        if clean in seen:
            return None
        seen.add(clean)
        payload = load_model(clean)
        textures = payload.get("textures", {})
        for key in ("layer0", "all", "texture", "side", "top", "end", "particle"):
            value = textures.get(key)
            hops = 0
            while isinstance(value, str) and value.startswith("#") and hops < 8:
                value = textures.get(value[1:])
                hops += 1
            if isinstance(value, str) and not value.startswith("#"):
                return strip_namespace(value)
        parent = payload.get("parent")
        return texture_from_model(parent, seen) if isinstance(parent, str) else None

    def texture_for(item_id: str) -> str | None:
        direct = f"assets/minecraft/textures/item/{item_id}.png"
        if direct in client_names:
            return direct
        definition_path = f"assets/minecraft/items/{item_id}.json"
        if definition_path in client_names:
            definition = read_json(client, definition_path)
            for model in model_strings(definition):
                texture = texture_from_model(model)
                if texture:
                    candidate = f"assets/minecraft/textures/{texture}.png"
                    if candidate in client_names:
                        return candidate
        candidates = [item_id]
        candidates += [
            re.sub(r"_(stairs|slab|wall|button|pressure_plate)$", "", item_id),
            re.sub(r"^(chiseled|polished|cut|waxed)_", "", item_id),
            item_id.replace("_bricks", "").replace("_brick", ""),
            item_id.replace("_carpet", "_wool"),
            item_id.replace("_brick_wall", "_bricks"),
            item_id.replace("brick_wall", "bricks"),
            item_id.replace("_tile_wall", "_tiles"),
            item_id.replace("moss_carpet", "moss_block"),
        ]
        for candidate in dict.fromkeys(candidates):
            for suffix in (candidate, candidate + "_side", candidate + "_top"):
                path = f"assets/minecraft/textures/block/{suffix}.png"
                if path in client_names:
                    return path
        return None

    sprite_ids = sorted(used_items)
    cell = 16
    columns = 40
    rows = math.ceil(len(sprite_ids) / columns)
    atlas = Image.new("RGBA", (columns * cell, rows * cell), (0, 0, 0, 0))
    sprite_map: dict[str, list[int]] = {}
    missing: list[str] = []
    for index, item_id in enumerate(sprite_ids):
        x, y = index % columns, index // columns
        texture_path = texture_for(item_id)
        if texture_path:
            raw = Image.open(io.BytesIO(client.read(texture_path))).convert("RGBA")
            frame_size = min(raw.width, raw.height)
            raw = raw.crop((0, 0, frame_size, frame_size)).resize((cell, cell), Image.Resampling.NEAREST)
        else:
            raw = placeholder(item_id)
            missing.append(item_id)
        atlas.alpha_composite(raw, (x * cell, y * cell))
        sprite_map[item_id] = [x * cell, y * cell]

    atlas.save(public_dir / "item-atlas-26.2.png", optimize=True)
    for source, target in {
        "assets/minecraft/textures/gui/container/crafting_table.png": "crafting-table-gui.png",
        "assets/minecraft/textures/block/crafting_table_top.png": "crafting-table-top.png",
        "assets/minecraft/textures/block/crafting_table_front.png": "crafting-table-front.png",
        "assets/minecraft/textures/block/crafting_table_side.png": "crafting-table-side.png",
        "assets/minecraft/textures/block/grass_block_top.png": "grass.png",
        "assets/minecraft/textures/block/dirt.png": "dirt.png",
        "assets/minecraft/textures/block/oak_log.png": "oak-log.png",
        "assets/minecraft/textures/block/oak_leaves.png": "oak-leaves.png",
    }.items():
        (public_dir / target).write_bytes(client.read(source))

    steve = Image.open(io.BytesIO(client.read(
        "assets/minecraft/textures/entity/player/wide/steve.png"
    ))).convert("RGBA")
    # Front face of Steve's right arm (shirt sleeve through hand), preserved pixel-for-pixel.
    steve.crop((44, 20, 48, 32)).resize((48, 144), Image.Resampling.NEAREST).save(
        public_dir / "steve-arm.png"
    )

    catalog = {
        "version": "Java Edition 26.2",
        "dataPackVersion": "107.1",
        "totalRecipes": len(recipes),
        "uniqueResults": len({entry["result"]["id"] for entry in recipes}),
        "categories": {
            category: sum(1 for entry in recipes if entry["category"] == category)
            for category in ("building", "equipment", "redstone", "misc", "special")
        },
        "recipes": recipes,
    }
    (data_dir / "recipes26_2.json").write_text(
        json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    (data_dir / "sprites26_2.json").write_text(
        json.dumps({"width": atlas.width, "height": atlas.height, "cell": cell, "sprites": sprite_map}, separators=(",", ":")),
        encoding="utf-8",
    )
    (data_dir / "missing-sprites26_2.json").write_text(
        json.dumps(missing, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps({
        "recipes": len(recipes), "uniqueResults": catalog["uniqueResults"],
        "sprites": len(sprite_ids), "missingSprites": len(missing),
        "atlas": [atlas.width, atlas.height],
    }))


if __name__ == "__main__":
    main()
