# Sources and asset provenance

This educational fan project is built from Minecraft Java Edition 26.2 data and client resources. It does not redistribute the game, a playable client, or the original jar files.

## Version

- Release: Minecraft Java Edition 26.2, released 16 June 2026
- Data pack version: 107.1
- Resource pack version: 88.0
- Official release notes: https://www.minecraft.net/en-us/article/minecraft-java-edition-26-2
- Official version manifest: https://piston-meta.mojang.com/mc/game/version_manifest_v2.json

## Verified inputs

| Input | Official object hash / SHA-1 |
| --- | --- |
| 26.2 server distribution | `823e2250d24b3ddac457a60c92a6a941943fcd6a` |
| 26.2 client jar | `2dc72797acbc1b63fc16a11c4ac393605f453754` |
| 26.2 Simplified Chinese language asset | `76ff42a0d9f5c0b744b8a6134802e3c8fc5c31ce` |

The generated catalog contains the 1,120 recipe JSON files whose recipe types are handled by a 3×3 crafting table. They produce 949 unique result item IDs. Other stations such as furnaces, stonecutters, smithing tables and brewing stands are intentionally excluded because they are not crafting-table recipes.

`public/mc/item-atlas-26.2.png` is a compact, generated atlas containing only textures needed by this website. The workbench GUI, block textures and arm crop are also extracted from the verified 26.2 client resources. The source jars themselves are not committed.

The battle screen uses the six corresponding vanilla entity texture maps (Zombie, Skeleton, Creeper, Enderman, Warden and Ender Dragon). The textures and the five sword/bow item sprites were retrieved through the MIT-licensed `minecraft-assets` 1.17.0 package from its Minecraft 1.21.8 resource snapshot; Mojang retains ownership of the underlying Minecraft artwork.

The entity cube dimensions, bone hierarchy and UV coordinates come from Mojang's public [`bedrock-samples`](https://github.com/Mojang/bedrock-samples) vanilla resource pack (`resource_pack/models/entity`). They are normalized into `src/data/mobModels.ts` and rendered as textured CSS 3D cuboids, so the site uses the original model proportions without requiring WebGL. Battle sounds are generated locally with the Web Audio API and do not redistribute Mojang audio files.

## Reproduction

`scripts/generate_minecraft_catalog.py` parses the official recipe registry, item tags, English language table, Simplified Chinese language asset, item definitions and texture models. It generates:

- `src/data/recipes26_2.json`
- `src/data/sprites26_2.json`
- `public/mc/item-atlas-26.2.png`
- the small world and GUI textures in `public/mc/`

Dynamic special recipes such as banner duplication, item repair, map extension and firework recipes are listed and labelled, but are not presented as a false fixed grid because the game calculates their output from item data.

## Usage notice

Minecraft is a trademark of Microsoft. This project follows the Minecraft Usage Guidelines for a non-official fan website and displays the required non-affiliation disclaimer in the interface:

> NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.

Guidelines: https://www.minecraft.net/en-us/usage-guidelines
