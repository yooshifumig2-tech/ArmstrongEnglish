import type { BattleLevel, MonsterConfig } from "./battleQuestions";

export type WeaponId = "fist" | "wooden_sword" | "stone_sword" | "iron_sword" | "diamond_sword" | "netherite_sword";
export type ArmorId = "none" | "leather" | "golden" | "chainmail" | "iron" | "diamond" | "netherite";
export type Enchantment = { id: "sharpness" | "protection"; name: string; zh: string; level: number };

export type GearItem = {
  uid: string;
  kind: "weapon" | "armor";
  baseId: WeaponId | ArmorId;
  sourceKey: string;
  source: "starter" | "mission" | "monster";
  enchantment?: Enchantment;
};

export const WEAPONS: Record<WeaponId, { name: string; zh: string; itemId: string | null; attack: number; tier: number }> = {
  fist: { name: "Fist", zh: "拳头", itemId: null, attack: 1, tier: 0 },
  wooden_sword: { name: "Wooden Sword", zh: "木剑", itemId: "wooden_sword", attack: 4, tier: 1 },
  stone_sword: { name: "Stone Sword", zh: "石剑", itemId: "stone_sword", attack: 5, tier: 2 },
  iron_sword: { name: "Iron Sword", zh: "铁剑", itemId: "iron_sword", attack: 6, tier: 3 },
  diamond_sword: { name: "Diamond Sword", zh: "钻石剑", itemId: "diamond_sword", attack: 7, tier: 4 },
  netherite_sword: { name: "Netherite Sword", zh: "下界合金剑", itemId: "netherite_sword", attack: 8, tier: 5 },
};

export const ARMORS: Record<ArmorId, { name: string; zh: string; itemId: string | null; armor: number; toughness: number; tier: number }> = {
  none: { name: "No Armor", zh: "无护甲", itemId: null, armor: 0, toughness: 0, tier: 0 },
  leather: { name: "Leather Armor", zh: "皮革盔甲套装", itemId: "leather_chestplate", armor: 7, toughness: 0, tier: 1 },
  golden: { name: "Golden Armor", zh: "金质盔甲套装", itemId: "golden_chestplate", armor: 11, toughness: 0, tier: 2 },
  chainmail: { name: "Chainmail Armor", zh: "锁链盔甲套装", itemId: "chainmail_chestplate", armor: 12, toughness: 0, tier: 2 },
  iron: { name: "Iron Armor", zh: "铁盔甲套装", itemId: "iron_chestplate", armor: 15, toughness: 0, tier: 3 },
  diamond: { name: "Diamond Armor", zh: "钻石盔甲套装", itemId: "diamond_chestplate", armor: 20, toughness: 8, tier: 4 },
  netherite: { name: "Netherite Armor", zh: "下界合金盔甲套装", itemId: "netherite_chestplate", armor: 20, toughness: 12, tier: 5 },
};

const MISSION_GEAR: Record<2 | 3 | 4 | 5, { weapon: WeaponId; armor: ArmorId }> = {
  2: { weapon: "wooden_sword", armor: "leather" },
  3: { weapon: "stone_sword", armor: "chainmail" },
  4: { weapon: "iron_sword", armor: "iron" },
  5: { weapon: "diamond_sword", armor: "diamond" },
};

export function romanLevel(level: number) {
  return ["", "I", "II", "III", "IV", "V"][Math.max(0, Math.min(5, level))];
}

function makeUid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function rollMissionEnchantment(kind: GearItem["kind"], tier: number): Enchantment | undefined {
  if (Math.random() > 0.08 + tier * 0.015) return undefined;
  const level = Math.random() < 0.91 ? 1 : 2;
  return kind === "weapon"
    ? { id: "sharpness", name: "Sharpness", zh: "锋利", level }
    : { id: "protection", name: "Protection", zh: "保护", level };
}

function createGear(kind: GearItem["kind"], baseId: WeaponId | ArmorId, source: GearItem["source"], sourceKey: string, enchantment?: Enchantment): GearItem {
  return { uid: makeUid(sourceKey), kind, baseId, source, sourceKey, enchantment };
}

export function missionRewards(tier: 2 | 3 | 4 | 5): GearItem[] {
  const reward = MISSION_GEAR[tier];
  return [
    createGear("weapon", reward.weapon, "mission", `mission-${tier}-weapon`, rollMissionEnchantment("weapon", tier)),
    createGear("armor", reward.armor, "mission", `mission-${tier}-armor`, rollMissionEnchantment("armor", tier)),
  ];
}

export function ensureMissionGear(unlockedTier: BattleLevel, current: GearItem[]) {
  const next = [...current];
  for (let tier = 2; tier <= unlockedTier; tier += 1) {
    const rewardTier = tier as 2 | 3 | 4 | 5;
    for (const item of missionRewards(rewardTier)) {
      if (!next.some((existing) => existing.sourceKey === item.sourceKey)) next.push(item);
    }
  }
  return next;
}

function rollMonsterEnchantment(kind: GearItem["kind"], monster: MonsterConfig): Enchantment | undefined {
  const guaranteed = monster.kind === "boss";
  if (!guaranteed && Math.random() > 0.24 + monster.tier * 0.11) return undefined;
  const maxLevel = Math.min(kind === "weapon" ? 5 : 4, monster.tier + (monster.kind === "boss" ? 1 : 0));
  const floor = monster.kind === "boss" ? Math.max(2, monster.tier - 1) : 1;
  const level = Math.max(floor, Math.ceil(Math.random() * maxLevel));
  return kind === "weapon"
    ? { id: "sharpness", name: "Sharpness", zh: "锋利", level }
    : { id: "protection", name: "Protection", zh: "保护", level };
}

export function rollMonsterDrop(monster: MonsterConfig): GearItem {
  const weaponIds: WeaponId[] = ["wooden_sword", "wooden_sword", "stone_sword", "iron_sword", "diamond_sword", "netherite_sword"];
  const armorIds: ArmorId[] = ["leather", "leather", "chainmail", "iron", "diamond", "netherite"];
  const kind: GearItem["kind"] = Math.random() < 0.55 ? "weapon" : "armor";
  const bonus = monster.kind === "boss" && Math.random() < 0.55 ? 1 : Math.random() < 0.18 ? 1 : 0;
  const index = Math.min(5, monster.tier + bonus);
  const baseId = kind === "weapon" ? weaponIds[index] : armorIds[index];
  return createGear(kind, baseId, "monster", `drop-${monster.id}`, rollMonsterEnchantment(kind, monster));
}

export function gearName(item: GearItem) {
  const base = item.kind === "weapon" ? WEAPONS[item.baseId as WeaponId] : ARMORS[item.baseId as ArmorId];
  return `${base.name}${item.enchantment ? ` · ${item.enchantment.name} ${romanLevel(item.enchantment.level)}` : ""}`;
}

export function weaponQuestionDamage(item: GearItem) {
  const base = WEAPONS[item.baseId as WeaponId] ?? WEAPONS.fist;
  const sharpness = item.enchantment?.id === "sharpness" ? item.enchantment.level * 3 : 0;
  return 10 + base.attack * 5 + sharpness;
}

export function armorDamageReduction(item: GearItem) {
  const base = ARMORS[item.baseId as ArmorId] ?? ARMORS.none;
  const protection = item.enchantment?.id === "protection" ? item.enchantment.level * 0.025 : 0;
  return Math.min(0.68, base.armor * 0.025 + base.toughness * 0.006 + protection);
}

export const STARTER_WEAPON: GearItem = { uid: "starter-fist", kind: "weapon", baseId: "fist", source: "starter", sourceKey: "starter-fist" };
export const STARTER_ARMOR: GearItem = { uid: "starter-none", kind: "armor", baseId: "none", source: "starter", sourceKey: "starter-none" };
