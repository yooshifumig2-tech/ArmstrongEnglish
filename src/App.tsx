import { type CSSProperties, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import catalogJson from "./data/recipes26_2.json";
import spriteJson from "./data/sprites26_2.json";
import { BATTLE_QUESTIONS, MONSTERS, type BattleQuestion, type MonsterConfig, type MonsterId } from "./data/battleQuestions";
import {
  ARMORS, STARTER_ARMOR, STARTER_WEAPON, WEAPONS, armorDamageReduction, ensureMissionGear,
  gearName, rollMonsterDrop, romanLevel, weaponQuestionDamage,
  type ArmorId, type GearItem, type WeaponId,
} from "./data/battleGear";
import MobModel3D from "./components/MobModel3D";

type Ingredient = {
  id: string;
  name?: string;
  zh?: string;
  tag?: string;
  alternatives: string[];
};

type Recipe = {
  id: string;
  type: string;
  category: string;
  group: string;
  result: { id: string; count: number; name: string; zh: string };
  slots: (Ingredient | null)[];
  dynamic: boolean;
  ingredientCount: number;
};

type Catalog = {
  version: string;
  dataPackVersion: string;
  totalRecipes: number;
  uniqueResults: number;
  categories: Record<string, number>;
  recipes: Recipe[];
};

type SpriteData = {
  width: number;
  height: number;
  cell: number;
  sprites: Record<string, [number, number]>;
};

type Category = "all" | "building" | "equipment" | "redstone" | "misc" | "special";
type Tier = 1 | 2 | 3 | 4 | 5;
type HotbarStack = { id: string; count: number };

const catalog = catalogJson as Catalog;
const spriteData = spriteJson as unknown as SpriteData;
const STORAGE_KEY = "armstrong-minecraft-english-v2";
type SavedProgress = {
  xp?: number;
  craftCount?: number;
  completed?: string[];
  unlockedTier?: Tier;
  assessmentPassed?: string[];
  gearInventory?: GearItem[];
  equippedWeapon?: string;
  equippedArmor?: string;
  battleWins?: Record<string, number>;
  craftingHotbar?: (HotbarStack | null)[];
  hotbarSelection?: number;
};
const CATEGORY_INFO: { id: Category; icon: string; label: string; en: string }[] = [
  { id: "all", icon: "▦", label: "全部", en: "All Recipes" },
  { id: "building", icon: "▧", label: "建筑", en: "Building" },
  { id: "equipment", icon: "⚔", label: "装备", en: "Equipment" },
  { id: "redstone", icon: "⌁", label: "红石", en: "Redstone" },
  { id: "misc", icon: "✦", label: "杂项", en: "Misc" },
  { id: "special", icon: "★", label: "特殊", en: "Special" },
];
const TIER_INFO: { id: Tier; name: string; zh: string; color: string; description: string }[] = [
  { id: 1, name: "Survival", zh: "生存入门", color: "#8fbd63", description: "木材、基础工具与第一夜用品" },
  { id: 2, name: "Explorer", zh: "探索者", color: "#78b9c9", description: "石材、铜、玻璃与探索装备" },
  { id: 3, name: "Engineer", zh: "工程师", color: "#d7aa57", description: "铁、金、红石与机械装置" },
  { id: 4, name: "Treasure", zh: "寻宝大师", color: "#5fd2dc", description: "钻石、附魔与稀有资源" },
  { id: 5, name: "Legend", zh: "传奇工匠", color: "#b47bdd", description: "下界合金、信标与终局物品" },
];
const TIER_TASKS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ["crafting_table", "wooden_pickaxe", "torch"],
  2: ["stone_pickaxe", "furnace", "shield"],
  3: ["iron_pickaxe", "compass", "piston"],
  4: ["diamond_pickaxe", "enchanting_table", "end_crystal"],
};
const FORCED_TIERS: Record<string, Tier> = {
  crafting_table: 1, wooden_pickaxe: 1, torch: 1,
  stone_pickaxe: 2, furnace: 2, shield: 2,
  iron_pickaxe: 3, compass: 3, piston: 3,
  diamond_pickaxe: 4, enchanting_table: 4, end_crystal: 4,
};

function readSavedProgress(): SavedProgress {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

function writeSavedProgress(patch: Partial<SavedProgress>) {
  const current = readSavedProgress();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...patch }));
}

function emptyHotbar() {
  return Array<HotbarStack | null>(9).fill(null);
}

function normalizeHotbar(value: SavedProgress["craftingHotbar"]) {
  const slots = emptyHotbar();
  if (!Array.isArray(value)) return slots;
  value.slice(0, 9).forEach((stack, index) => {
    if (!stack || typeof stack.id !== "string" || !stack.id) return;
    slots[index] = { id: stack.id, count: Math.max(1, Math.floor(Number(stack.count) || 1)) };
  });
  return slots;
}

function addCraftedStack(hotbar: (HotbarStack | null)[], id: string, count: number) {
  const slots = normalizeHotbar(hotbar);
  const existingIndex = slots.findIndex((stack) => stack?.id === id);
  if (existingIndex >= 0) {
    const current = slots[existingIndex] as HotbarStack;
    slots[existingIndex] = { ...current, count: current.count + Math.max(1, count) };
    return { slots, selectedIndex: existingIndex };
  }
  const emptyIndex = slots.findIndex((stack) => stack === null);
  if (emptyIndex >= 0) {
    slots[emptyIndex] = { id, count: Math.max(1, count) };
    return { slots, selectedIndex: emptyIndex };
  }
  slots.shift();
  slots.push({ id, count: Math.max(1, count) });
  return { slots, selectedIndex: 8 };
}

function allMissionRecipeIds() {
  return Object.values(TIER_TASKS).flat().map(recipeForResult).filter((recipe): recipe is Recipe => Boolean(recipe)).map((recipe) => recipe.id);
}

function completedMissionCount(progress: SavedProgress) {
  const taskIds = new Set(allMissionRecipeIds());
  return (progress.assessmentPassed ?? []).filter((id) => taskIds.has(id)).length;
}

function tierForRecipe(recipe: Recipe): Tier {
  const forced = FORCED_TIERS[recipe.result.id];
  if (forced) return forced;
  const materialText = [recipe.result.id, ...recipe.slots.filter((slot): slot is Ingredient => Boolean(slot)).flatMap((slot) => slot.alternatives.slice(0, 8))].join(" ");
  if (/netherite|nether_star|beacon|conduit|respawn_anchor|lodestone|echo_shard|end_crystal/.test(materialText)) return 5;
  if (/diamond|emerald|enchant|ender_eye|ender_chest|ghast_tear|blaze_rod|crying_obsidian|golden_apple/.test(materialText)) return 4;
  if (/iron|gold|redstone|piston|observer|comparator|repeater|compass|clock|rail|crossbow|anvil|dispenser|dropper/.test(materialText) || recipe.ingredientCount >= 8) return 3;
  if (/stone|copper|glass|wool|leather|bow|bucket|campfire|brick|quartz|amethyst|lapis/.test(materialText) || recipe.ingredientCount >= 5) return 2;
  return 1;
}

function recipeForResult(resultId: string) {
  return catalog.recipes.find((recipe) => recipe.result.id === resultId);
}

function pluralizeItem(name: string) {
  const words = name.split(" ");
  const last = words.pop() ?? name;
  const plural = /[^aeiou]y$/i.test(last) ? `${last.slice(0, -1)}ies` : /(s|x|z|ch|sh)$/i.test(last) ? `${last}es` : `${last}s`;
  return [...words, plural].join(" ");
}

function Sprite({ id, size = 32, label }: { id: string; size?: number; label?: string }) {
  const position = spriteData.sprites[id];
  if (!position) return <span className="sprite-fallback" style={{ width: size, height: size }}>?</span>;
  const scale = size / spriteData.cell;
  return (
    <span
      className="item-sprite"
      role={label ? "img" : undefined}
      aria-label={label}
      style={{
        width: size,
        height: size,
        backgroundSize: `${spriteData.width * scale}px ${spriteData.height * scale}px`,
        backgroundPosition: `${-position[0] * scale}px ${-position[1] * scale}px`,
      }}
    />
  );
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.78;
  utterance.pitch = 1.02;
  window.speechSynthesis.speak(utterance);
}

function playBlockTone(kind: "hit" | "open" | "craft") {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = kind === "craft" ? "square" : "triangle";
  oscillator.frequency.setValueAtTime(kind === "hit" ? 118 : kind === "open" ? 190 : 440, context.currentTime);
  if (kind === "craft") oscillator.frequency.setValueAtTime(660, context.currentTime + 0.11);
  gain.gain.setValueAtTime(0.035, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.22);
}

type BattleSound = "swing" | "mob_hurt" | "mob_death" | "player_hurt" | "fuse" | "explosion" | "arrow" | "sonic" | "teleport" | "crystal" | "loot";

function playBattleSound(kind: BattleSound, monster: MonsterId = "zombie") {
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const now = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(0.16, now);
  output.connect(context.destination);

  const tone = (frequency: number, duration: number, type: OscillatorType = "square", delay = 0, endFrequency?: number, volume = 0.32) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now + delay);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + delay + duration);
    gain.gain.setValueAtTime(volume, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration);
  };
  const noise = (duration: number, volume = 0.34, delay = 0, cutoff = 1100) => {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, now + delay);
    gain.gain.setValueAtTime(volume, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.start(now + delay);
  };

  if (kind === "swing") { noise(.16, .22, 0, 2600); tone(240, .12, "triangle", 0, 90, .2); }
  if (kind === "player_hurt") { tone(155, .2, "square", 0, 78, .42); tone(110, .25, "sawtooth", .05, 55, .18); }
  if (kind === "arrow") { tone(610, .12, "triangle", 0, 145, .3); noise(.1, .12, .08, 2400); }
  if (kind === "fuse") { noise(.72, .28, 0, 3600); tone(96, .68, "sawtooth", 0, 180, .08); }
  if (kind === "explosion") { noise(.9, .72, 0, 850); tone(82, .7, "sawtooth", 0, 28, .42); }
  if (kind === "teleport") { noise(.3, .22, 0, 5000); tone(320, .34, "sine", 0, 1200, .25); }
  if (kind === "sonic") { tone(48, .85, "sine", 0, 32, .7); tone(860, .42, "sawtooth", .1, 92, .18); noise(.62, .3, .08, 700); }
  if (kind === "crystal") { tone(880, .16, "sine", 0, 1450, .22); tone(1320, .35, "triangle", .12, 210, .25); }
  if (kind === "loot") { tone(440, .18, "square", 0, 660, .18); tone(660, .2, "square", .15, 880, .18); tone(880, .28, "triangle", .31, 1180, .2); }
  if (kind === "mob_hurt" || kind === "mob_death") {
    const base = monster === "creeper" ? 210 : monster === "skeleton" ? 430 : monster === "enderman" ? 270 : monster === "warden" ? 62 : monster === "ender_dragon" ? 78 : 118;
    const duration = kind === "mob_death" ? 1.05 : .34;
    tone(base, duration, monster === "skeleton" ? "triangle" : "sawtooth", 0, kind === "mob_death" ? base * .22 : base * .55, kind === "mob_death" ? .56 : .3);
    if (monster === "warden" || monster === "ender_dragon") noise(duration * .8, .24, .08, 520);
  }
  window.setTimeout(() => context.close().catch(() => undefined), 1800);
}

function articleFor(name: string) {
  return /^[aeiou]/i.test(name) ? "an" : "a";
}

function accepts(ingredient: Ingredient | null, item: string | null) {
  return ingredient === null ? item === null : item !== null && ingredient.alternatives.includes(item);
}

function matchesShaped(recipe: Recipe, grid: (string | null)[]) {
  const occupied = recipe.slots.flatMap((slot, index) => slot ? [index] : []);
  if (!occupied.length || grid.filter(Boolean).length !== occupied.length) return false;
  const rows = occupied.map((index) => Math.floor(index / 3));
  const columns = occupied.map((index) => index % 3);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minColumn = Math.min(...columns);
  const maxColumn = Math.max(...columns);
  const height = maxRow - minRow + 1;
  const width = maxColumn - minColumn + 1;

  for (let rowOffset = 0; rowOffset <= 3 - height; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset <= 3 - width; columnOffset += 1) {
      for (const mirrored of [false, true]) {
        let valid = true;
        for (let row = 0; row < 3 && valid; row += 1) {
          for (let column = 0; column < 3; column += 1) {
            const patternRow = row - rowOffset;
            const patternColumn = column - columnOffset;
            let expected: Ingredient | null = null;
            if (patternRow >= 0 && patternRow < height && patternColumn >= 0 && patternColumn < width) {
              const sourceColumn = mirrored ? maxColumn - patternColumn : minColumn + patternColumn;
              expected = recipe.slots[(minRow + patternRow) * 3 + sourceColumn];
            }
            if (!accepts(expected, grid[row * 3 + column])) {
              valid = false;
              break;
            }
          }
        }
        if (valid) return true;
      }
    }
  }
  return false;
}

function matchesShapeless(recipe: Recipe, grid: (string | null)[]) {
  const ingredients = recipe.slots.filter((slot): slot is Ingredient => Boolean(slot));
  const items = grid.filter((item): item is string => Boolean(item));
  if (!ingredients.length || ingredients.length !== items.length) return false;
  const ordered = [...ingredients].sort((a, b) => a.alternatives.length - b.alternatives.length);
  const used = Array(items.length).fill(false);
  const search = (ingredientIndex: number): boolean => {
    if (ingredientIndex === ordered.length) return true;
    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      if (used[itemIndex] || !ordered[ingredientIndex].alternatives.includes(items[itemIndex])) continue;
      used[itemIndex] = true;
      if (search(ingredientIndex + 1)) return true;
      used[itemIndex] = false;
    }
    return false;
  };
  return search(0);
}

function matchesRecipe(recipe: Recipe, grid: (string | null)[]) {
  if (recipe.dynamic) return false;
  return recipe.type === "crafting_shaped" ? matchesShaped(recipe, grid) : matchesShapeless(recipe, grid);
}

function WorldScene({ dimmed = false }: { dimmed?: boolean }) {
  return (
    <div className={`world-scene ${dimmed ? "dimmed" : ""}`} aria-hidden={dimmed}>
      <div className="pixel-sky"><i className="sun" /><i className="world-cloud cloud-one" /><i className="world-cloud cloud-two" /></div>
      <div className="far-hills"><i /><i /><i /><i /></div>
      <div className="tree tree-left"><b /><span /><span /></div>
      <div className="tree tree-right"><b /><span /><span /></div>
      <div className="ground-plane" />
      <div className="grass-edge" />
      <div className="distant-plants plant-left"><i /><i /><i /><i /></div>
      <div className="distant-plants plant-center"><i /><i /><i /></div>
      <div className="distant-plants plant-right"><i /><i /><i /><i /><i /></div>
    </div>
  );
}

function WorldView({ onOpen, onBattle }: { onOpen: () => void; onBattle: () => void }) {
  const [swinging, setSwinging] = useState(false);
  const [hits, setHits] = useState(0);
  const savedHotbar = useMemo(() => {
    const saved = readSavedProgress();
    return {
      slots: normalizeHotbar(saved.craftingHotbar),
      selectedIndex: Math.min(8, Math.max(0, saved.hotbarSelection ?? 0)),
    };
  }, []);

  function hitTable() {
    if (swinging) return;
    setSwinging(true);
    setHits((value) => value + 1);
    playBlockTone("hit");
    window.setTimeout(() => {
      playBlockTone("open");
      onOpen();
    }, 560);
  }

  return (
    <main className="world-view">
      <WorldScene />
      <div className="world-title">
        <span>ARMSTRONG</span>
        <b>ENGLISH SURVIVAL</b>
        <small>JAVA 26.2 LEARNING WORLD</small>
      </div>
      <div className="quest-toast">
        <span>CHOOSE QUEST</span>
        <div><b>Craft or Fight</b><small>打开工作台学习 · 进入竞技场战斗</small></div>
      </div>

      <button className="battle-portal" onClick={onBattle} aria-label="进入怪物英语竞技场">
        <span className="portal-frame"><i /><i /><i /></span>
        <b>MOB ARENA</b><small>怪物英语对战</small>
      </button>

      <button className={`world-table ${hits ? "was-hit" : ""}`} onClick={hitTable} aria-label="点击合成台打开工作台">
        <span className="cube-body">
          <svg className="cube-model" viewBox="0 0 320 320" role="presentation" aria-hidden="true">
            <image className="cube-face cube-side" href="/mc/crafting-table-side.png" x="0" y="0" width="16" height="16" preserveAspectRatio="none" transform="matrix(9 3.375 0 10.875 16 80)" />
            <image className="cube-face cube-front" href="/mc/crafting-table-front.png" x="0" y="0" width="16" height="16" preserveAspectRatio="none" transform="matrix(9 -3.375 0 10.875 160 134)" />
            <image className="cube-face cube-top" href="/mc/crafting-table-top.png" x="0" y="0" width="16" height="16" preserveAspectRatio="none" transform="matrix(9 3.4375 -9 3.4375 160 25)" />
            <path className="cube-side-shade" d="M16 80 160 134 160 308 16 254Z" />
            <path className="cube-top-light" d="M160 25 304 80 160 134 16 80Z" />
            <path className="cube-edges" d="M160 25 304 80 304 254 160 308 16 254 16 80 160 25ZM16 80 160 134 304 80M160 134V308" />
          </svg>
        </span>
        <span className="cube-shadow" />
        <i className="target-label">CRAFTING TABLE<small>点击 / CLICK</small></i>
        {swinging && <span className="hit-particles"><i /><i /><i /><i /><i /></span>}
      </button>

      <div className="crosshair"><i /><i /></div>
      <div className={`player-arm ${swinging ? "swing" : ""}`} />

      <div className="survival-hud">
        <div className="bars"><span className="hearts">♥♥♥♥♥♥♥♥♥♥</span><span className="hunger">◆◆◆◆◆◆◆◆◆◆</span></div>
        <div className="hotbar">
          {savedHotbar.slots.map((stack, index) => (
            <span key={index} className={stack && index === savedHotbar.selectedIndex ? "selected" : ""}>
              {stack && <Sprite id={stack.id} size={38} />}
              {stack && stack.count > 1 && <b>{stack.count}</b>}
            </span>
          ))}
        </div>
        <div className="xp-bar"><i /><b>1</b></div>
      </div>

      <div className="control-help"><span>W A S D</span><b>移动</b><span>🖱</span><b>点击方块</b></div>
      <p className="fan-disclaimer">NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>
    </main>
  );
}

function RecipeBook({
  recipes, selected, category, query, visibleLimit, unlockedTier, onSelect, onCategory, onQuery, onMore, onClose,
}: {
  recipes: Recipe[];
  selected: Recipe;
  category: Category;
  query: string;
  visibleLimit: number;
  unlockedTier: Tier;
  onSelect: (recipe: Recipe) => void;
  onCategory: (category: Category) => void;
  onQuery: (query: string) => void;
  onMore: () => void;
  onClose: () => void;
}) {
  return (
    <aside className="recipe-book" aria-label="完整配方书">
      <div className="book-tabs">
        {CATEGORY_INFO.map((item) => (
          <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => onCategory(item.id)} title={`${item.label} · ${item.en}`}>
            <span>{item.icon}</span><small>{item.label}</small>
          </button>
        ))}
      </div>
      <div className="book-head">
        <div><b>Recipe Book</b><small>配方书 · Java 26.2</small></div>
        <button onClick={onClose} aria-label="关闭配方书">×</button>
      </div>
      <label className="recipe-search"><span>⌕</span><input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search item / 搜索物品" /></label>
      <div className="book-counter"><span>{recipes.length} recipes found</span><b>{Math.min(visibleLimit, recipes.length)} / {recipes.length}</b></div>
      <div className="recipe-grid">
        {recipes.slice(0, visibleLimit).map((recipe) => {
          const tier = tierForRecipe(recipe);
          const locked = tier > unlockedTier;
          return <button key={recipe.id} className={`${selected.id === recipe.id ? "selected" : ""} ${locked ? "locked" : ""}`} onClick={() => onSelect(recipe)} disabled={locked} title={`${recipe.result.name}${recipe.result.zh ? ` · ${recipe.result.zh}` : ""} · Tier ${tier}`} aria-label={`${locked ? "未解锁 · " : ""}${recipe.result.name}${recipe.result.zh ? ` · ${recipe.result.zh}` : ""} · Tier ${tier}`}>
            <Sprite id={recipe.result.id} size={36} />
            {recipe.result.count > 1 && <b>{recipe.result.count}</b>}
            {recipe.dynamic && <i>★</i>}
            <em style={{ background: TIER_INFO[tier - 1].color }}>{locked ? "🔒" : tier}</em>
          </button>;
        })}
      </div>
      {visibleLimit < recipes.length && <button className="load-recipes" onClick={onMore}>Load more · 加载更多</button>}
      <div className="book-page">1 / {Math.max(1, Math.ceil(recipes.length / visibleLimit))}</div>
    </aside>
  );
}

function CraftingGui({
  recipe, matchedRecipe, grid, hotbar, hotbarSelection, onDropMaterial, onRemove, onClear, onCraft, onSelectHotbar, onOpenBook, bookOpen, craftedPulse,
}: {
  recipe: Recipe;
  matchedRecipe: Recipe | null;
  grid: (string | null)[];
  hotbar: (HotbarStack | null)[];
  hotbarSelection: number;
  onDropMaterial: (targetIndex: number, id: string, sourceIndex: number | null) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onCraft: (recipe: Recipe) => void;
  onSelectHotbar: (index: number) => void;
  onOpenBook: () => void;
  bookOpen: boolean;
  craftedPulse: boolean;
}) {
  type PointerDrag = { id: string; sourceIndex: number | null; x: number; y: number };
  const dragRef = useRef<PointerDrag | null>(null);
  const [dragVisual, setDragVisual] = useState<PointerDrag | null>(null);
  const inventory = useMemo(() => {
    const items = recipe.slots.filter((slot): slot is Ingredient => Boolean(slot)).map((slot) => slot.id);
    const filler = ["oak_planks", "stick", "torch", "apple", "wooden_pickaxe"];
    return [...items, ...filler, ...Array(27).fill(null)].slice(0, 27) as (string | null)[];
  }, [recipe]);

  function startPointerDrag(event: ReactPointerEvent<HTMLButtonElement>, id: string, sourceIndex: number | null) {
    if (event.button !== 0) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer capture is an enhancement */ }
    const next = { id, sourceIndex, x: event.clientX, y: event.clientY };
    dragRef.current = next;
    setDragVisual(next);
  }

  function movePointerDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    const next = { ...dragRef.current, x: event.clientX, y: event.clientY };
    dragRef.current = next;
    setDragVisual(next);
  }

  function finishPointerDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = dragRef.current;
    if (!active) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const slot = target?.closest<HTMLElement>("[data-slot-index]");
    if (slot) {
      onDropMaterial(Number(slot.dataset.slotIndex), active.id, active.sourceIndex);
    } else if (active.sourceIndex !== null && target?.closest(".inventory-return-zone")) {
      onRemove(active.sourceIndex);
    }
    dragRef.current = null;
    setDragVisual(null);
  }

  function cancelPointerDrag() {
    dragRef.current = null;
    setDragVisual(null);
  }

  const spokenMaterials = Array.from(new Set(recipe.slots.filter((slot): slot is Ingredient => Boolean(slot)).map((slot) => slot.name ?? slot.id))).join(", ");

  return (
    <section className="gui-column">
      <button className={`recipe-toggle ${bookOpen ? "open" : ""}`} onClick={onOpenBook} aria-label="打开配方书"><span>📗</span><small>Recipe Book</small></button>
      <div className="gui-frame" aria-label="原版三乘三合成界面">
        <span className="gui-label crafting-label">Crafting</span>
        <span className="gui-label inventory-label">Inventory</span>
        <div className="input-grid">
          {grid.map((id, index) => (
            <button
              key={index}
              className="gui-slot input-slot"
              data-slot-index={index}
              onPointerDown={(event) => id && startPointerDrag(event, id, index)}
              onPointerMove={movePointerDrag}
              onPointerUp={finishPointerDrag}
              onPointerCancel={cancelPointerDrag}
              onContextMenu={(event) => { event.preventDefault(); if (id) onRemove(index); }}
              aria-label={id ? `拖动 ${id}，当前在合成槽 ${index + 1}` : `可放置材料的合成槽 ${index + 1}`}
            >
              {id && <Sprite id={id} size={45} />}
            </button>
          ))}
        </div>
        <span className="recipe-arrow">➜</span>
        <button className={`gui-slot output-slot ${matchedRecipe ? "ready" : ""} ${craftedPulse ? "crafted" : ""}`} onClick={() => matchedRecipe && onCraft(matchedRecipe)} disabled={!matchedRecipe} aria-label={matchedRecipe ? `取出 ${matchedRecipe.result.name}` : "配方尚未完成"}>
          {matchedRecipe && <><Sprite id={matchedRecipe.result.id} size={45} />{matchedRecipe.result.count > 1 && <b>{matchedRecipe.result.count}</b>}</>}
        </button>
        <div className="player-inventory inventory-return-zone">
          {inventory.map((id, index) => (
            <button
              className={`gui-slot ${id ? "draggable-item" : ""}`}
              key={index}
              onPointerDown={(event) => id && startPointerDrag(event, id, null)}
              onPointerMove={movePointerDrag}
              onPointerUp={finishPointerDrag}
              onPointerCancel={cancelPointerDrag}
              disabled={!id}
              aria-label={id ? `拖动材料 ${id}` : `空背包格 ${index + 1}`}
            >
              {id && <Sprite id={id} size={45} />}
              {id && recipe.slots.filter((slot) => slot?.id === id).length > 1 && <b>{recipe.slots.filter((slot) => slot?.id === id).length}</b>}
            </button>
          ))}
        </div>
        <div className="player-hotbar">
          {hotbar.map((stack, index) => (
            <button
              type="button"
              className={`gui-slot hotbar-slot ${stack && index === hotbarSelection ? "selected" : ""} ${stack && craftedPulse && index === hotbarSelection ? "newest" : ""}`}
              key={index}
              onClick={() => stack && onSelectHotbar(index)}
              disabled={!stack}
              aria-label={stack ? `${index === hotbarSelection ? "当前选中，" : ""}快捷栏 ${index + 1}：${stack.id}，数量 ${stack.count}` : `空快捷栏格 ${index + 1}`}
            >
              {stack && <Sprite id={stack.id} size={45} />}
              {stack && stack.count > 1 && <b>{stack.count}</b>}
            </button>
          ))}
        </div>
      </div>
      <div className="gui-help">
        {matchedRecipe ? (
          <p><b>✓ {matchedRecipe.result.name} matched!</b>排列正确：支持九宫格内任意平移；有方向的配方也支持水平镜像。点击右侧产物取出。</p>
        ) : recipe.dynamic ? (
          <p><b>★ Dynamic recipe · 动态特殊配方</b>这种配方的结果取决于物品数据（例如染色、复制或修复），原游戏不会显示固定九宫格。</p>
        ) : (
          <p><b>Drag materials into any slot.</b>从背包拖动材料到任意格。系统会按原版规则识别形状、平移、镜像和无序配方。</p>
        )}
        <div><button onClick={() => spokenMaterials && speak(spokenMaterials)}>🔊 Materials</button><button onClick={onClear} disabled={!grid.some(Boolean)}>Clear</button></div>
      </div>
      {dragVisual && <div className="drag-ghost" style={{ left: dragVisual.x, top: dragVisual.y }}><Sprite id={dragVisual.id} size={48} /></div>}
    </section>
  );
}

function EnglishPanel({ recipe, completed, onFumi }: { recipe: Recipe; completed: boolean; onFumi: () => void }) {
  const ingredients = Array.from(new Map(recipe.slots.filter((slot): slot is Ingredient => Boolean(slot)).map((slot) => [slot.id, slot])).values());
  const sentence = `I crafted ${articleFor(recipe.result.name)} ${recipe.result.name}.`;
  return (
    <aside className="english-panel">
      <div className="pixel-title"><span>ENGLISH QUEST</span><b>{completed ? "COMPLETED" : "IN PROGRESS"}</b></div>
      <div className="quest-result">
        <Sprite id={recipe.result.id} size={64} />
        <div><small>CRAFT / 合成</small><h2>{recipe.result.name}</h2><p>{recipe.result.zh || titleFromId(recipe.result.id)}</p></div>
        <button onClick={() => speak(recipe.result.name)}>🔊</button>
      </div>
      <div className="phrase-block">
        <small>SURVIVAL SENTENCE · 生存英语</small>
        <b>{sentence}</b>
        <p>我合成了一个{recipe.result.zh || "物品"}。</p>
        <button onClick={() => speak(sentence)}>🔊 Play voice · 跟读</button>
      </div>
      <div className="materials-vocab">
        <small>MATERIAL WORDS · 材料词汇</small>
        {ingredients.length ? ingredients.map((item) => (
          <button key={item.id} onClick={() => speak(item.name ?? item.id)}>
            <Sprite id={item.id} size={32} /><span><b>{item.name ?? titleFromId(item.id)}</b><small>{item.zh || (item.tag ? `任意 #${item.tag}` : "游戏材料")}</small></span><i>🔊</i>
          </button>
        )) : <p className="dynamic-note">This is a dynamic recipe.<br />这是由原游戏规则动态计算的特殊配方。</p>}
      </div>
      <div className="grammar-tip"><span>💡</span><p><b>Craft = 合成 / 制作</b>游戏中看到 “Craft a pickaxe”，意思是“合成一把镐”。过去式是 <strong>crafted</strong>。</p></div>
      <button className="fumi-button" onClick={onFumi}><span>✦</span><b>Ask FUMI AI</b><small>让 AI 针对当前真实配方逐步提示</small></button>
    </aside>
  );
}

function titleFromId(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter: string) => letter.toUpperCase());
}

function ProgressionPanel({
  unlockedTier, completed, assessmentPassed, onSelect, onAssessment,
}: {
  unlockedTier: Tier;
  completed: string[];
  assessmentPassed: string[];
  onSelect: (recipe: Recipe) => void;
  onAssessment: (recipe: Recipe) => void;
}) {
  const taskIds = unlockedTier < 5 ? TIER_TASKS[unlockedTier as 1 | 2 | 3 | 4] : [];
  const tasks = taskIds.map(recipeForResult).filter((recipe): recipe is Recipe => Boolean(recipe));
  const passedCount = tasks.filter((recipe) => assessmentPassed.includes(recipe.id)).length;
  return (
    <section className="progression-panel">
      <div className="tier-track">
        {TIER_INFO.map((tier) => <div key={tier.id} className={`${tier.id <= unlockedTier ? "unlocked" : "locked"} ${tier.id === unlockedTier ? "current" : ""}`} style={{ "--tier-color": tier.color } as CSSProperties}>
          <span>{tier.id <= unlockedTier ? tier.id : "🔒"}</span><b>{tier.name}</b><small>{tier.zh}</small>
        </div>)}
      </div>
      {unlockedTier < 5 ? <>
        <header className="progression-head">
          <div><small>UNLOCK MISSION · 阶级解锁任务</small><h2>Tier {unlockedTier + 1}: {TIER_INFO[unlockedTier].name}</h2><p>先合成每件任务物品，再通过它的英语考核。全部完成后自动解锁下一阶配方。</p></div>
          <strong>{passedCount}/{tasks.length}<small>ASSESSMENTS</small></strong>
        </header>
        <div className="unlock-tasks">
          {tasks.map((recipe, index) => {
            const crafted = completed.includes(recipe.id);
            const passed = assessmentPassed.includes(recipe.id);
            return <article key={recipe.id} className={passed ? "passed" : crafted ? "ready" : ""}>
              <i>{index + 1}</i><Sprite id={recipe.result.id} size={48} />
              <div><small>{crafted ? passed ? "ASSESSMENT PASSED" : "READY FOR ASSESSMENT" : "CRAFTING REQUIRED"}</small><b>{recipe.result.name}</b><p>{recipe.result.zh}</p></div>
              {passed ? <button disabled>✓ 已通过</button> : crafted ? <button onClick={() => onAssessment(recipe)}>进入考核 →</button> : <button onClick={() => onSelect(recipe)}>查看配方</button>}
            </article>;
          })}
        </div>
      </> : <div className="max-tier"><span>✦</span><div><small>ALL TIERS UNLOCKED</small><h2>Legendary Crafter · 传奇工匠</h2><p>你已经解锁全部制作物品。现在可以继续挑战所有配方与英语复习。</p></div></div>}
    </section>
  );
}

function AssessmentView({ recipe, onBack, onComplete }: { recipe: Recipe; onBack: () => void; onComplete: () => void }) {
  type BankWord = { id: number; text: string };
  type DragWord = BankWord & { x: number; y: number; moved: boolean };
  const [question, setQuestion] = useState(0);
  const [assembled, setAssembled] = useState<BankWord[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [spelling, setSpelling] = useState("");
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [dragWord, setDragWord] = useState<DragWord | null>(null);
  const dragRef = useRef<DragWord | null>(null);
  const item = recipe.result.name.toLowerCase();
  const itemZh = recipe.result.zh || "这个物品";
  const itemWords = item.split(" ");
  const mode = recipe.result.id.length % 3;
  const sentence = useMemo(() => {
    if (mode === 0) return { words: ["Yesterday,", "I", "crafted", articleFor(item), ...itemWords, "because", "I", "needed", "it."], meaning: `昨天，我合成了一个${itemZh}，因为我需要它。`, rule: "Yesterday 表示过去，动词要用过去式 crafted；because 引导原因从句。" };
    if (mode === 1) return { words: ["I", "use", "two", ...pluralizeItem(item).split(" "), "when", "I", "explore", "a", "cave."], meaning: `当我探索洞穴时，我会使用两个${itemZh}。`, rule: "two 后面的可数名词要用复数；when 引导时间从句，描述经常发生的事用一般现在时。" };
    return { words: ["Tomorrow,", "I", "will", "craft", articleFor(item), ...itemWords, "before", "I", "explore", "the", "cave."], meaning: `明天，我会在探索洞穴之前合成一个${itemZh}。`, rule: "Tomorrow 表示将来，使用 will + 动词原形；before 引导时间从句。" };
  }, [item, itemZh, mode]);
  const bank = useMemo(() => {
    const distractors = mode === 0 ? ["craft", "crafts"] : mode === 1 ? [item, "uses"] : ["crafted", "crafts"];
    return [...sentence.words, ...distractors].map((text, id) => ({ id, text })).sort((a, b) => {
      const score = (word: BankWord) => [...`${recipe.id}-${word.text}-${word.id}`].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 17;
      return score(a) - score(b) || b.id - a.id;
    });
  }, [mode, recipe.id, sentence.words, item]);
  const judgmentCorrect = recipe.result.id.length % 2 === 0;
  const judgmentSentence = judgmentCorrect ? `I keep two ${pluralizeItem(item)} in my chest.` : `Yesterday, I craft ${articleFor(item)} ${item}.`;
  const usedIds = new Set(assembled.map((word) => word.id));

  function startWordDrag(event: ReactPointerEvent<HTMLButtonElement>, word: BankWord) {
    if (feedback?.ok) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* optional */ }
    const next = { ...word, x: event.clientX, y: event.clientY, moved: false };
    dragRef.current = next;
    setDragWord(next);
  }
  function moveWordDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragRef.current) return;
    const next = { ...dragRef.current, x: event.clientX, y: event.clientY, moved: true };
    dragRef.current = next;
    setDragWord(next);
  }
  function finishWordDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const active = dragRef.current;
    if (!active) return;
    if (document.elementFromPoint(event.clientX, event.clientY)?.closest(".sentence-answer")) setAssembled((words) => [...words, { id: active.id, text: active.text }]);
    dragRef.current = null;
    setDragWord(null);
  }
  function answer(ok: boolean, explanation: string) {
    setFeedback({ ok, text: ok ? "回答正确！" : explanation });
    if (!ok) setWrongAttempts((value) => value + 1);
  }
  function checkSentence() {
    const ok = assembled.length === sentence.words.length && assembled.every((word, index) => word.text === sentence.words[index]);
    answer(ok, `解析：${sentence.rule}`);
  }
  function checkSpelling() {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
    answer(normalize(spelling) === normalize(recipe.result.name), `解析：正确拼写是 “${recipe.result.name}”。请注意每个字母和单词之间的空格。`);
  }
  function nextQuestion() {
    setFeedback(null);
    setQuestion((value) => value + 1);
  }

  return <main className="assessment-view">
    <header className="assessment-topbar"><button onClick={onBack}>← 暂停考核</button><div><small>CRAFTING ENGLISH ASSESSMENT</small><b>{recipe.result.name} · {recipe.result.zh}</b></div><span>QUESTION {Math.min(question + 1, 3)} / 3</span></header>
    <div className="assessment-shell">
      <aside className="assessment-item"><div className="assessment-cube"><Sprite id={recipe.result.id} size={112} /></div><small>TARGET ITEM</small><h1>{recipe.result.name}</h1><p>{recipe.result.zh}</p><button onClick={() => speak(recipe.result.name)}>🔊 物品发音</button><div className="assessment-map">{[0,1,2].map((step) => <i key={step} className={step < question ? "done" : step === question ? "current" : ""}>{step < question ? "✓" : step + 1}</i>)}</div></aside>
      <section className="assessment-paper">
        {question === 0 && <>
          <div className="question-label"><span>01</span><div><small>SENTENCE CRAFTING · 拖动造句</small><h2>在游戏情境中组成正确的句子</h2></div></div>
          <p className="question-context">任务：用 <b>{recipe.result.name}</b> 造句，注意时态、单复数和简单从句。把词块拖进下方工作台。</p>
          <div className="target-meaning"><small>TARGET MEANING · 目标中文句子</small><b>{sentence.meaning}</b></div>
          <div className="sentence-answer">{assembled.length ? assembled.map((word, index) => <button key={`${word.id}-${index}`} onClick={() => !feedback?.ok && setAssembled((words) => words.filter((_, wordIndex) => wordIndex !== index))}>{word.text}</button>) : <span>DROP WORDS HERE · 把词块拖到这里</span>}</div>
          <div className="word-bank">{bank.map((word) => <button key={word.id} disabled={usedIds.has(word.id) || feedback?.ok} onPointerDown={(event) => startWordDrag(event, word)} onPointerMove={moveWordDrag} onPointerUp={finishWordDrag} onPointerCancel={() => { dragRef.current = null; setDragWord(null); }}>{word.text}</button>)}</div>
          {!feedback?.ok && <button className="check-answer" onClick={checkSentence} disabled={!assembled.length}>Check sentence · 检查句子</button>}
        </>}
        {question === 1 && <>
          <div className="question-label"><span>02</span><div><small>GRAMMAR CHECK · 语法判断</small><h2>这个句子的时态或单复数正确吗？</h2></div></div>
          <div className="judgment-card"><small>IN-GAME MESSAGE</small><b>{judgmentSentence}</b><button onClick={() => speak(judgmentSentence)}>🔊 播放句子</button></div>
          {!feedback?.ok && <div className="judgment-actions"><button onClick={() => answer(judgmentCorrect, judgmentCorrect ? "解析：这句话没有错误。two 后使用了正确的复数形式。" : "解析：Yesterday 表示过去，craft 应改为 crafted。")}>✓ 正确</button><button onClick={() => answer(!judgmentCorrect, judgmentCorrect ? "解析：这句话没有错误。two 后使用了正确的复数形式。" : "解析：Yesterday 表示过去，craft 应改为 crafted。")}>✕ 有错误</button></div>}
        </>}
        {question === 2 && <>
          <div className="question-label"><span>03</span><div><small>ITEM SPELLING · 单词拼写</small><h2>拼写这个制作物品的完整英文名</h2></div></div>
          <div className="spelling-clue"><Sprite id={recipe.result.id} size={72} /><div><small>中文提示</small><b>{recipe.result.zh}</b><p>{recipe.result.name.split(" ").map((word) => `${word[0]}${"_".repeat(Math.max(1, word.length - 1))}`).join("  ")}</p></div></div>
          <input className="spelling-input" value={spelling} onChange={(event) => { setSpelling(event.target.value); setFeedback(null); }} placeholder="Type the English item name..." disabled={feedback?.ok} autoComplete="off" />
          {!feedback?.ok && <button className="check-answer" onClick={checkSpelling} disabled={!spelling.trim()}>Check spelling · 检查拼写</button>}
        </>}
        {question === 3 && <div className="assessment-finish"><span>✦</span><small>ASSESSMENT COMPLETE</small><h2>{recipe.result.name} 英语考核完成！</h2><p>你已完成造句、语法判断和拼写。错误尝试：<b>{wrongAttempts}</b> 次；所有错误都已订正。</p><button onClick={onComplete}>完成考核并返回工作台 →</button></div>}
        {feedback && question < 3 && <div className={`answer-feedback ${feedback.ok ? "correct" : "wrong"}`}><span>{feedback.ok ? "✓" : "!"}</span><p><b>{feedback.ok ? "Correct · 回答正确" : "Not yet · 再想一想"}</b>{feedback.text}</p>{feedback.ok ? <button onClick={nextQuestion}>{question === 2 ? "查看结果" : "下一题 →"}</button> : <button onClick={() => setFeedback(null)}>订正答案</button>}</div>}
      </section>
    </div>
    {dragWord && <div className="word-ghost" style={{ left: dragWord.x, top: dragWord.y }}>{dragWord.text}</div>}
  </main>;
}

type CombatAnimation = "idle" | "player-attack" | "monster-hurt" | "monster-attack" | "charging" | "teleporting" | "exploding" | "dying";

function shuffled<T>(items: T[]) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

function MonsterModel({ id, animation = "idle", compact = false }: { id: MonsterId; animation?: CombatAnimation; compact?: boolean }) {
  return <MobModel3D id={id} animation={animation} compact={compact} />;
}

function SwordTexture({ item, held = false }: { item: GearItem; held?: boolean }) {
  if (item.baseId === "fist") return null;
  const texture = `/mc/items/${item.baseId}.png?v=2`;
  return <span className={`${held ? "held-weapon" : "vanilla-sword-sprite"} ${item.enchantment ? "enchanted" : ""}`} style={{ "--weapon-texture": `url(${texture})` } as CSSProperties}>
    <img src={texture} alt={gearName(item)} />
    {item.enchantment && <i className="weapon-glint" />}
  </span>;
}

function FirstPersonWeapon({ item, preview = false, swinging = false }: { item: GearItem; preview?: boolean; swinging?: boolean }) {
  return <div className={`${preview ? "loadout-held-preview" : "battle-arm"} ${swinging ? "swing" : ""}`}>
    <span className={`first-person-rig ${item.baseId === "fist" ? "unarmed" : "armed"}`}>
      <span className="first-person-arm"><i className="arm-face arm-front" /><i className="arm-face arm-back" /><i className="arm-face arm-left" /><i className="arm-face arm-right" /><i className="arm-face arm-top" /><i className="arm-face arm-bottom" /></span>
      <SwordTexture item={item} held />
    </span>
    {preview && <small>FIRST-PERSON VIEW · 第一人称持握预览</small>}
  </div>;
}

function GearSprite({ item, size = 64 }: { item: GearItem; size?: number }) {
  const base = item.kind === "weapon" ? WEAPONS[item.baseId as WeaponId] : ARMORS[item.baseId as ArmorId];
  return <span className={`gear-sprite ${item.enchantment ? "enchanted" : ""}`} style={{ width: size, height: size }}>
    {item.kind === "weapon" && item.baseId !== "fist" ? <SwordTexture item={item} /> : base.itemId ? <Sprite id={base.itemId} size={size} /> : <span className={item.kind === "weapon" ? "fist-icon" : "no-armor-icon"}>{item.kind === "weapon" ? "✊" : "◇"}</span>}
    {item.enchantment && <i className="enchant-glint" />}
  </span>;
}

function gearDescription(item: GearItem) {
  const source = item.source === "starter" ? "初始装备" : item.source === "mission" ? "任务清单奖励" : "怪物战利品";
  if (!item.enchantment) return source;
  return `${source} · ${item.enchantment.zh} ${romanLevel(item.enchantment.level)}`;
}

function BattleView({ onExit }: { onExit: () => void }) {
  type ActiveQuestion = Omit<BattleQuestion, "options"> & { options: string[] };
  type Feedback = { ok: boolean; title: string; text: string };
  const initialProgress = useMemo(() => readSavedProgress(), []);
  const unlockedTier = Math.min(5, Math.max(1, initialProgress.unlockedTier ?? 1)) as Tier;
  const missionCount = completedMissionCount(initialProgress);
  const maxPlayerHp = 60 + missionCount * 10;
  const [inventory, setInventory] = useState<GearItem[]>(() => ensureMissionGear(unlockedTier, initialProgress.gearInventory ?? []));
  const [weaponUid, setWeaponUid] = useState(initialProgress.equippedWeapon ?? STARTER_WEAPON.uid);
  const [armorUid, setArmorUid] = useState(initialProgress.equippedArmor ?? STARTER_ARMOR.uid);
  const [phase, setPhase] = useState<"select" | "loadout" | "battle" | "won" | "lost">("select");
  const [monster, setMonster] = useState<MonsterConfig | null>(null);
  const [questions, setQuestions] = useState<ActiveQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [monsterHp, setMonsterHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(maxPlayerHp);
  const [animation, setAnimation] = useState<CombatAnimation>("idle");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [crystals, setCrystals] = useState(0);
  const [loot, setLoot] = useState<GearItem | null>(null);
  const [screenHit, setScreenHit] = useState(false);

  const weaponItems = useMemo(() => [STARTER_WEAPON, ...inventory.filter((item) => item.kind === "weapon")], [inventory]);
  const armorItems = useMemo(() => [STARTER_ARMOR, ...inventory.filter((item) => item.kind === "armor")], [inventory]);
  const weapon = weaponItems.find((item) => item.uid === weaponUid) ?? STARTER_WEAPON;
  const armor = armorItems.find((item) => item.uid === armorUid) ?? STARTER_ARMOR;
  const playerDamage = weaponQuestionDamage(weapon);
  const damageReduction = armorDamageReduction(armor);
  const question = questions[questionIndex];

  useEffect(() => {
    writeSavedProgress({ gearInventory: inventory, equippedWeapon: weapon.uid, equippedArmor: armor.uid });
  }, [inventory, weapon.uid, armor.uid]);

  function chooseMonster(next: MonsterConfig) {
    if (next.tier > unlockedTier) return;
    setMonster(next);
    setLoot(null);
    setPhase("loadout");
  }

  function questionTotalFor(target: MonsterConfig) {
    const crystalHits = target.id === "ender_dragon" ? 3 : 0;
    const hits = Math.ceil(target.hp / playerDamage) + crystalHits;
    const missAllowance = target.id === "creeper" ? 2 : Math.min(5, Math.max(2, Math.floor(maxPlayerHp / Math.max(1, target.attackDamage))));
    return hits + missAllowance + Math.floor(Math.random() * 3);
  }

  function buildQuestions(target: MonsterConfig, count: number) {
    const lowest = Math.max(1, target.tier - 1);
    const pool = BATTLE_QUESTIONS.filter((item) => item.level >= lowest && item.level <= target.tier);
    const result: ActiveQuestion[] = [];
    while (result.length < count) {
      for (const item of shuffled(pool)) {
        if (result.length >= count) break;
        result.push({ ...item, id: `${item.id}-${result.length}`, options: shuffled([...item.options]) });
      }
    }
    return result;
  }

  function beginBattle() {
    if (!monster) return;
    const total = questionTotalFor(monster);
    setQuestions(buildQuestions(monster, total));
    setQuestionIndex(0);
    setMonsterHp(monster.hp);
    setPlayerHp(maxPlayerHp);
    setWrongCount(0);
    setCrystals(monster.id === "ender_dragon" ? 3 : 0);
    setFeedback(null);
    setSelectedAnswer(null);
    setAnimation("idle");
    setPhase("battle");
  }

  function completeVictory(target: MonsterConfig) {
    const drop = rollMonsterDrop(target);
    setLoot(drop);
    setInventory((items) => [...items, drop]);
    const latest = readSavedProgress();
    const wins = { ...(latest.battleWins ?? {}), [target.id]: (latest.battleWins?.[target.id] ?? 0) + 1 };
    writeSavedProgress({ xp: (latest.xp ?? 0) + target.reward, battleWins: wins, gearInventory: [...inventory, drop] });
    playBattleSound("loot", target.id);
    setPhase("won");
  }

  function clearProgressAfterDeath() {
    const latest = readSavedProgress();
    const missionIds = new Set(allMissionRecipeIds());
    writeSavedProgress({
      completed: (latest.completed ?? []).filter((id) => !missionIds.has(id)),
      assessmentPassed: [], unlockedTier: 1, gearInventory: [],
      equippedWeapon: STARTER_WEAPON.uid, equippedArmor: STARTER_ARMOR.uid,
      craftingHotbar: emptyHotbar(), hotbarSelection: 0,
    });
  }

  function loseBattle() {
    clearProgressAfterDeath();
    setPlayerHp(0);
    setPhase("lost");
  }

  function strikeMonster(currentQuestion: ActiveQuestion) {
    if (!monster) return;
    setAnimation("player-attack");
    playBattleSound("swing", monster.id);
    window.setTimeout(() => {
      if (monster.id === "ender_dragon" && crystals > 0) {
        setCrystals((value) => Math.max(0, value - 1));
        setAnimation("monster-hurt");
        playBattleSound("crystal", monster.id);
        setFeedback({ ok: true, title: "End Crystal destroyed! · 摧毁末影水晶", text: `${currentQuestion.explanation} 这次攻击切断了末影龙的一条治疗光束。` });
      } else {
        const nextHp = Math.max(0, monsterHp - playerDamage);
        setMonsterHp(nextHp);
        setAnimation(nextHp === 0 ? "dying" : "monster-hurt");
        playBattleSound(nextHp === 0 ? "mob_death" : "mob_hurt", monster.id);
        setFeedback({ ok: true, title: `Critical learning hit! · 造成 ${playerDamage} 伤害`, text: currentQuestion.explanation });
        if (nextHp === 0) window.setTimeout(() => completeVictory(monster), 950);
      }
    }, 260);
  }

  function monsterAttack(currentQuestion: ActiveQuestion) {
    if (!monster) return;
    const nextWrong = wrongCount + 1;
    setWrongCount(nextWrong);

    if (monster.id === "creeper") {
      setAnimation(nextWrong >= 3 ? "exploding" : "charging");
      playBattleSound("fuse", monster.id);
      setFeedback({ ok: false, title: `Fuse ${nextWrong}/3 · 引信正在燃烧`, text: `${currentQuestion.explanation} 苦力怕不会立刻攻击；第三次答错会发生致命爆炸。` });
      if (nextWrong >= 3) window.setTimeout(() => {
        playBattleSound("explosion", monster.id);
        setScreenHit(true);
        window.setTimeout(() => setScreenHit(false), 520);
        window.setTimeout(loseBattle, 700);
      }, 720);
      return;
    }

    let rawDamage = monster.attackDamage;
    let attackTitle = `${monster.name} attacks!`;
    let sound: BattleSound = "player_hurt";
    if (monster.id === "skeleton") {
      sound = "arrow";
      if ((questionIndex + 1) % 3 === 0) { rawDamage += 9; attackTitle = "Skeleton rapid shot! · 骷髅快速连射"; }
    }
    if (monster.id === "enderman") { sound = "teleport"; attackTitle = "Enderman teleports! · 末影人瞬移攻击"; }
    if (monster.id === "warden" && nextWrong % 2 === 0) { rawDamage += 28; sound = "sonic"; attackTitle = "SONIC BOOM · 监守者声波重击"; }
    const received = Math.max(1, Math.round(rawDamage * (1 - damageReduction)));
    const nextHp = Math.max(0, playerHp - received);
    setPlayerHp(nextHp);
    setAnimation(monster.id === "enderman" ? "teleporting" : "monster-attack");
    setScreenHit(true);
    playBattleSound(sound, monster.id);
    if (sound !== "player_hurt") window.setTimeout(() => playBattleSound("player_hurt", monster.id), 150);
    window.setTimeout(() => setScreenHit(false), 380);
    if (monster.id === "ender_dragon" && crystals > 0) setMonsterHp((value) => Math.min(monster.hp, value + 15));
    setFeedback({ ok: false, title: `${attackTitle} · -${received} HP`, text: `${currentQuestion.explanation}${monster.id === "ender_dragon" && crystals > 0 ? " 末影水晶仍在，末影龙恢复了 15 HP。" : ""}` });
    if (nextHp === 0) window.setTimeout(loseBattle, 780);
  }

  function answerQuestion(option: string) {
    if (!question || !monster || feedback) return;
    setSelectedAnswer(option);
    if (option === question.answer) strikeMonster(question);
    else monsterAttack(question);
  }

  function nextTurn() {
    if (!monster || monsterHp <= 0 || phase !== "battle") return;
    if (questionIndex + 1 >= questions.length) {
      setFeedback({ ok: false, title: "No turns left · 回合已用尽", text: "怪物仍有生命值，它发动了终结攻击。下一次可以装备更强的武器，减少所需正确题数。" });
      setAnimation("monster-attack");
      playBattleSound(monster.id === "warden" ? "sonic" : "player_hurt", monster.id);
      window.setTimeout(loseBattle, 850);
      return;
    }
    setQuestionIndex((value) => value + 1);
    if (monster.id === "enderman" && !feedback?.ok) {
      setQuestions((items) => items.map((item, index) => index === questionIndex + 1 ? { ...item, options: shuffled(item.options) } : item));
    }
    setFeedback(null);
    setSelectedAnswer(null);
    setAnimation("idle");
  }

  if (phase === "select") return <main className="battle-hub">
    <header className="battle-topbar"><button onClick={onExit}>← 返回首页</button><div><small>TURN-BASED ENGLISH COMBAT</small><b>Mob Arena · 怪物英语竞技场</b></div><span>Tier {unlockedTier}</span></header>
    <section className="battle-profile">
      <div><small>PLAYER LIFE · 玩家生命</small><b>{maxPlayerHp} HP</b><p>基础 60 HP + 已通过任务考核 {missionCount} × 10 HP</p></div>
      <div><small>GEAR VAULT · 装备仓库</small><b>{inventory.length} 件</b><p>任务奖励低概率弱附魔；Boss 更容易掉落高级附魔。</p></div>
    </section>
    <section className="monster-select-head"><small>SELECT A CHALLENGE</small><h1>选择怪物或 Boss</h1><p>怪物生命越高，需要的题目越多。先选择对手，再配置武器和整套盔甲。</p></section>
    <section className="monster-grid">
      {MONSTERS.map((item) => {
        const locked = item.tier > unlockedTier;
        return <article key={item.id} className={`monster-card arena-${item.arena} ${locked ? "locked" : ""}`}>
          <div className="monster-preview"><MonsterModel id={item.id} compact /></div>
          <div className="monster-card-title"><span>{item.kind === "boss" ? "BOSS" : `TIER ${item.tier}`}</span><h2>{item.name}</h2><b>{item.zh}</b></div>
          <div className="monster-card-stats"><span>♥ {item.hp} HP</span><span>✦ {item.reward} XP</span></div>
          <p>{item.mechanic}</p>
          <button disabled={locked} onClick={() => chooseMonster(item)}>{locked ? `🔒 需要 Tier ${item.tier}` : "选择挑战 →"}</button>
        </article>;
      })}
    </section>
    <p className="battle-disclaimer">NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>
  </main>;

  if (phase === "loadout" && monster) {
    const estimated = Math.ceil(monster.hp / playerDamage) + (monster.id === "ender_dragon" ? 3 : 0);
    return <main className={`loadout-view arena-${monster.arena}`}>
      <header className="battle-topbar"><button onClick={() => setPhase("select")}>← 重选怪物</button><div><small>EQUIPMENT LOADOUT</small><b>准备对战 · {monster.name}</b></div><span>{maxPlayerHp} HP</span></header>
      <div className="loadout-shell">
        <aside className="loadout-enemy"><small>YOUR OPPONENT</small><div className="loadout-monster"><MonsterModel id={monster.id} compact /></div><h1>{monster.name}</h1><p>{monster.zh} · {monster.hp} HP</p><div className="mechanic-note"><b>SPECIAL MECHANIC</b>{monster.mechanic}</div></aside>
        <section className="loadout-inventory">
          <div className="loadout-section-title"><span>01</span><div><small>SELECT WEAPON</small><h2>装备武器</h2></div></div>
          <div className="gear-list">{weaponItems.map((item) => {
            const base = WEAPONS[item.baseId as WeaponId];
            return <button key={item.uid} className={`${weapon.uid === item.uid ? "selected" : ""} ${item.enchantment ? "enchanted" : ""}`} onClick={() => setWeaponUid(item.uid)}>
              <GearSprite item={item} size={54} /><span><b>{gearName(item)}</b><small>{gearDescription(item)}</small></span><strong>⚔ {base.attack}</strong>
            </button>;
          })}</div>
          <div className="loadout-section-title"><span>02</span><div><small>SELECT FULL ARMOR SET</small><h2>装备整套盔甲</h2></div></div>
          <div className="gear-list armor-list">{armorItems.map((item) => {
            const base = ARMORS[item.baseId as ArmorId];
            return <button key={item.uid} className={`${armor.uid === item.uid ? "selected" : ""} ${item.enchantment ? "enchanted" : ""}`} onClick={() => setArmorUid(item.uid)}>
              <GearSprite item={item} size={54} /><span><b>{gearName(item)}</b><small>{gearDescription(item)}</small></span><strong>◆ {base.armor}</strong>
            </button>;
          })}</div>
        </section>
        <aside className="loadout-summary">
          <small>FINAL STATS</small><h2>战斗属性</h2>
          <FirstPersonWeapon item={weapon} preview />
          <div><span>玩家生命</span><b>{maxPlayerHp} HP</b></div><div><span>每次答对伤害</span><b>{playerDamage}</b></div><div><span>护甲减伤</span><b>{Math.round(damageReduction * 100)}%</b></div><div><span>击败所需正确题</span><b>约 {estimated} 题</b></div>
          <p>实际总题数还会加入可容错回合，并在进入战斗时随机抽取。</p>
          <button onClick={beginBattle}>⚔ 装备完成 · 开始战斗</button>
        </aside>
      </div>
    </main>;
  }

  if ((phase === "won" || phase === "lost") && monster) return <main className={`battle-result-view ${phase} arena-${monster.arena}`}>
    <div className="battle-result-card">
      <span className="result-icon">{phase === "won" ? "✦" : "☠"}</span><small>{phase === "won" ? "VICTORY" : "YOU DIED"}</small><h1>{phase === "won" ? `${monster.name} defeated!` : "任务清单已清零"}</h1>
      {phase === "won" && loot ? <><p>获得 {monster.reward} XP，并从怪物战利品箱中发现：</p><div className={`loot-drop ${loot.enchantment ? "enchanted" : ""}`}><GearSprite item={loot} size={82} /><div><small>NEW DROP</small><b>{gearName(loot)}</b><p>{gearDescription(loot)}</p></div></div></> : <p>你失去了本轮装备；所有阶级任务考核与任务物品进度已重置。回到首页后将重新从拳头开始。</p>}
      <div className="result-actions"><button onClick={phase === "won" ? () => setPhase("select") : onExit}>{phase === "won" ? "继续挑战 →" : "Respawn · 返回首页"}</button><button onClick={onExit}>返回首页</button></div>
    </div>
  </main>;

  if (!monster || !question) return null;
  const monsterHpPercent = Math.max(0, monsterHp / monster.hp * 100);
  const playerHpPercent = Math.max(0, playerHp / maxPlayerHp * 100);
  return <main className={`battle-view arena-${monster.arena} ${screenHit ? "screen-hit" : ""}`}>
    <header className="battle-topbar combat"><button onClick={() => setPhase("select")}>← 逃离战斗</button><div><small>TURN {questionIndex + 1} / {questions.length}</small><b>{monster.name} · {monster.zh}</b></div><span>难度 Tier {monster.tier}</span></header>
    <div className="battlefield">
      <div className="boss-bar"><div><small>{monster.kind === "boss" ? "BOSS" : "HOSTILE MOB"}</small><b>{monster.name}</b></div><span><i style={{ width: `${monsterHpPercent}%` }} /></span><strong>{monsterHp}/{monster.hp}</strong></div>
      <div className="battle-arena-scene"><div className="arena-sky" /><div className="arena-ground" />{monster.id === "ender_dragon" && <div className="end-crystals">{[0,1,2].map((index) => <i key={index} className={index < crystals ? "active" : "broken"}>◆</i>)}</div>}<div className="monster-stage"><MonsterModel id={monster.id} animation={animation} /></div><FirstPersonWeapon item={weapon} swinging={animation === "player-attack"} /></div>
      <section className="combat-panel">
        <div className="player-status"><div><small>PLAYER · 任务生命 +{missionCount * 10}</small><b>{Array.from({ length: Math.ceil(maxPlayerHp / 10) }, (_, index) => <i key={index} className={index < Math.ceil(playerHp / 10) ? "full" : "empty"}>♥</i>)}</b></div><span><i style={{ width: `${playerHpPercent}%` }} /></span><strong>{playerHp}/{maxPlayerHp} HP</strong></div>
        <div className="combat-question-head"><div><small>{question.category.toUpperCase()} · LEVEL {question.level}</small><h2>{question.prompt}</h2><p>{question.meaning}</p></div><button onClick={() => speak(question.prompt)}>🔊 朗读</button></div>
        <div className="combat-options">{question.options.map((option, index) => <button key={`${question.id}-${option}`} disabled={Boolean(feedback)} className={`${selectedAnswer === option ? "chosen" : ""} ${feedback && option === question.answer ? "correct" : ""} ${feedback && selectedAnswer === option && option !== question.answer ? "wrong" : ""}`} onClick={() => answerQuestion(option)}><span>{String.fromCharCode(65 + index)}</span><b>{option}</b></button>)}</div>
        {monster.id === "creeper" && <div className="fuse-meter"><span>TNT FUSE · 引信</span><b>{[0,1,2].map((index) => <i key={index} className={index < wrongCount ? "lit" : ""}>▣</i>)}</b><strong>{wrongCount}/3</strong></div>}
        {monster.id === "warden" && <div className="vibration-meter"><span>SCULK VIBRATION · 振动警戒</span><b>{wrongCount % 2 ? "▮▯" : "▯▯"}</b><strong>每 2 次错误触发声波</strong></div>}
        {feedback && <div className={`combat-feedback ${feedback.ok ? "correct" : "wrong"}`}><span>{feedback.ok ? "✓" : "!"}</span><div><b>{feedback.title}</b><p>{feedback.text}</p></div>{phase === "battle" && monsterHp > 0 && playerHp > 0 && animation !== "exploding" && <button onClick={nextTurn}>下一回合 →</button>}</div>}
      </section>
    </div>
    <div className="damage-overlay" /><p className="battle-disclaimer">NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>
  </main>;
}

function CraftingView({ onBack, onBattle }: { onBack: () => void; onBattle: () => void }) {
  const [selectedId, setSelectedId] = useState("crafting_table");
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [bookOpen, setBookOpen] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(96);
  const [grid, setGrid] = useState<(string | null)[]>(Array(9).fill(null));
  const [xp, setXp] = useState(0);
  const [craftCount, setCraftCount] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [fumiOpen, setFumiOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [craftedPulse, setCraftedPulse] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [unlockedTier, setUnlockedTier] = useState<Tier>(1);
  const [assessmentPassed, setAssessmentPassed] = useState<string[]>([]);
  const [assessmentRecipe, setAssessmentRecipe] = useState<Recipe | null>(null);
  const [unlockNotice, setUnlockNotice] = useState<Tier | null>(null);
  const [craftingHotbar, setCraftingHotbar] = useState<(HotbarStack | null)[]>(emptyHotbar);
  const [hotbarSelection, setHotbarSelection] = useState(0);

  const selected = catalog.recipes.find((recipe) => recipe.id === selectedId || recipe.result.id === selectedId) ?? catalog.recipes[0];
  const matchedRecipe = useMemo(() => grid.some(Boolean) ? catalog.recipes.find((recipe) => tierForRecipe(recipe) <= unlockedTier && matchesRecipe(recipe, grid)) ?? null : null, [grid, unlockedTier]);
  const displayRecipe = matchedRecipe ?? selected;
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return catalog.recipes.filter((recipe) => {
      const categoryMatch = category === "all" || recipe.category === category;
      const queryMatch = !term || `${recipe.result.name} ${recipe.result.zh} ${recipe.result.id} ${recipe.id}`.toLowerCase().includes(term);
      return categoryMatch && queryMatch;
    });
  }, [category, query]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      setXp(saved.xp ?? 0);
      setCraftCount(saved.craftCount ?? 0);
      setCompleted(saved.completed ?? []);
      setUnlockedTier(Math.min(5, Math.max(1, saved.unlockedTier ?? 1)) as Tier);
      setAssessmentPassed(saved.assessmentPassed ?? []);
      setCraftingHotbar(normalizeHotbar(saved.craftingHotbar));
      setHotbarSelection(Math.min(8, Math.max(0, saved.hotbarSelection ?? 0)));
    } catch { /* progress should never block the game */ }
  }, []);

  useEffect(() => {
    writeSavedProgress({ xp, craftCount, completed, unlockedTier, assessmentPassed, craftingHotbar, hotbarSelection });
  }, [xp, craftCount, completed, unlockedTier, assessmentPassed, craftingHotbar, hotbarSelection]);

  useEffect(() => {
    if (assessmentRecipe) return;
    document.documentElement.classList.add("crafting-page-locked");
    document.body.classList.add("crafting-page-locked");
    return () => {
      document.documentElement.classList.remove("crafting-page-locked");
      document.body.classList.remove("crafting-page-locked");
    };
  }, [assessmentRecipe]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (fumiOpen) setFumiOpen(false);
      else onBack();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [fumiOpen, onBack]);

  function selectRecipe(recipe: Recipe) {
    if (tierForRecipe(recipe) > unlockedTier) return;
    setSelectedId(recipe.id);
    setGrid(Array(9).fill(null));
    setHintLevel(0);
    setVisibleLimit(96);
  }

  function dropMaterial(targetIndex: number, id: string, sourceIndex: number | null) {
    setGrid((current) => {
      const next = [...current];
      if (sourceIndex === targetIndex) return current;
      if (sourceIndex !== null) next[sourceIndex] = next[targetIndex];
      next[targetIndex] = id;
      return next;
    });
    playBlockTone("hit");
  }

  function craftItem(recipe: Recipe) {
    playBlockTone("craft");
    const nextHotbar = addCraftedStack(craftingHotbar, recipe.result.id, recipe.result.count);
    setCraftingHotbar(nextHotbar.slots);
    setHotbarSelection(nextHotbar.selectedIndex);
    setCraftedPulse(true);
    setCraftCount((value) => value + 1);
    setSelectedId(recipe.id);
    if (!completed.includes(recipe.id)) {
      setCompleted((items) => [...items, recipe.id]);
      setXp((value) => value + 20 + Math.max(1, recipe.ingredientCount) * 2);
    }
    window.setTimeout(() => setCraftedPulse(false), 450);
    window.setTimeout(() => setGrid(Array(9).fill(null)), 310);
  }

  const currentLevel = Math.floor(xp / 250) + 1;
  const levelXp = xp % 250;

  function completeAssessment(recipe: Recipe) {
    const nextPassed = assessmentPassed.includes(recipe.id) ? assessmentPassed : [...assessmentPassed, recipe.id];
    setAssessmentPassed(nextPassed);
    if (unlockedTier < 5) {
      const currentTasks = TIER_TASKS[unlockedTier as 1 | 2 | 3 | 4].map(recipeForResult).filter((item): item is Recipe => Boolean(item));
      if (currentTasks.every((item) => nextPassed.includes(item.id))) {
        const nextTier = (unlockedTier + 1) as Tier;
        const saved = readSavedProgress();
        const gearInventory = ensureMissionGear(nextTier, saved.gearInventory ?? []);
        writeSavedProgress({ gearInventory });
        setUnlockedTier(nextTier);
        setUnlockNotice(nextTier);
      }
    }
    setAssessmentRecipe(null);
  }

  if (assessmentRecipe) return <AssessmentView recipe={assessmentRecipe} onBack={() => setAssessmentRecipe(null)} onComplete={() => completeAssessment(assessmentRecipe)} />;

  return (
    <main className="crafting-view">
      <WorldScene dimmed />
      <header className="craft-topbar">
        <button onClick={onBack}>← <span>Back to World</span></button>
        <div><b>Crafting Table</b><small>工作台 · {catalog.version}</small></div>
        <div className="craft-stats"><button onClick={onBattle}>⚔ Battle</button><button onClick={() => setShowStats((value) => !value)}>📗 {completed.length}/{catalog.totalRecipes}</button><span>✦ {xp} XP</span><b>LV.{currentLevel}</b></div>
      </header>

      {showStats && <section className="stats-window">
        <button onClick={() => setShowStats(false)}>×</button>
        <h2>Advancements · 学习进度</h2>
        <div><span>已完成配方</span><b>{completed.length} / {catalog.totalRecipes}</b></div>
        <div><span>累计合成次数</span><b>{craftCount}</b></div>
        <div><span>已获得经验</span><b>{xp} XP</b></div>
        <p><i style={{ width: `${(levelXp / 250) * 100}%` }} /></p>
        <small>所有进度只保存在当前设备。</small>
      </section>}

      <div className="craft-screen-layout">
        <div className={`craft-workspace ${bookOpen ? "book-visible" : ""}`}>
          {bookOpen && <RecipeBook
            recipes={filtered} selected={selected} category={category} query={query} visibleLimit={visibleLimit} unlockedTier={unlockedTier}
            onSelect={selectRecipe} onCategory={(next) => { setCategory(next); setVisibleLimit(96); }}
            onQuery={(next) => { setQuery(next); setVisibleLimit(96); }} onMore={() => setVisibleLimit((value) => value + 96)}
            onClose={() => setBookOpen(false)}
          />}
          <CraftingGui
            recipe={selected} matchedRecipe={matchedRecipe} grid={grid} hotbar={craftingHotbar} hotbarSelection={hotbarSelection} onDropMaterial={dropMaterial}
            onRemove={(index) => setGrid((current) => current.map((item, itemIndex) => itemIndex === index ? null : item))}
            onClear={() => setGrid(Array(9).fill(null))}
            onCraft={craftItem} onSelectHotbar={setHotbarSelection} onOpenBook={() => setBookOpen((value) => !value)} bookOpen={bookOpen} craftedPulse={craftedPulse}
          />
          <EnglishPanel recipe={displayRecipe} completed={completed.includes(displayRecipe.id)} onFumi={() => setFumiOpen(true)} />
        </div>

        <ProgressionPanel unlockedTier={unlockedTier} completed={completed} assessmentPassed={assessmentPassed} onSelect={selectRecipe} onAssessment={setAssessmentRecipe} />
      </div>

      <div className="catalog-proof">
        <span>OFFICIAL DATA PACK 107.1</span>
        <b>{catalog.totalRecipes.toLocaleString()} recipes</b>
        <i>·</i><b>{catalog.uniqueResults.toLocaleString()} craftable results</b>
        <small>Source: Mojang Java Edition 26.2 server data</small>
      </div>

      {fumiOpen && <div className="fumi-layer" role="dialog" aria-modal="true" aria-label="FUMI AI 配方助教">
        <button className="fumi-backdrop" onClick={() => setFumiOpen(false)} aria-label="关闭 FUMI AI" />
        <aside className="fumi-console">
          <div className="fumi-head"><span>✦</span><div><b>FUMI AI</b><small>CRAFTING ASSISTANT</small></div><button onClick={() => setFumiOpen(false)}>×</button></div>
          <div className="fumi-target"><Sprite id={displayRecipe.result.id} size={52} /><div><small>CURRENT RECIPE</small><b>{displayRecipe.result.name}</b><p>{displayRecipe.result.zh}</p></div></div>
          <div className="fumi-message"><span>F</span><p>{hintLevel === 0 ? `先读出产物：${displayRecipe.result.name}。你能在背包里找到第一种材料吗？` : hintLevel === 1 ? `观察九宫格形状。这个配方需要 ${displayRecipe.ingredientCount} 个材料格；相同材料也要逐个拖入。` : displayRecipe.dynamic ? "这是动态特殊配方，原游戏会根据物品数据计算结果，不存在固定排列。" : "最后检查形状与空格。整个图形可以在九宫格内平移；有方向的图形也可以水平镜像。"}</p></div>
          <div className="fumi-actions"><button onClick={() => setHintLevel((value) => Math.min(2, value + 1))}>Give me one more hint</button><button onClick={() => speak(displayRecipe.result.name)}>🔊 Read the item name</button><button onClick={() => speak(`I crafted ${articleFor(displayRecipe.result.name)} ${displayRecipe.result.name}.`)}>🔊 Read the full sentence</button></div>
          <div className="hint-meter"><span>Hint level {hintLevel + 1}/3</span><p><i style={{ width: `${((hintLevel + 1) / 3) * 100}%` }} /></p></div>
        </aside>
      </div>}

      {unlockNotice && <div className="unlock-layer" role="dialog" aria-modal="true" aria-label="新制作阶级已解锁"><div className="unlock-modal" style={{ "--tier-color": TIER_INFO[unlockNotice - 1].color } as CSSProperties}><span>✦</span><small>NEW CRAFTING TIER UNLOCKED</small><h2>Tier {unlockNotice}: {TIER_INFO[unlockNotice - 1].name}</h2><p>{TIER_INFO[unlockNotice - 1].zh} · {TIER_INFO[unlockNotice - 1].description}</p><div className="unlock-gear-note">⚔ 已获得新的剑与整套盔甲<br />有小概率附带 I–II 级弱附魔，可在怪物竞技场中装备。</div><button onClick={() => setUnlockNotice(null)}>领取装备并进入新阶级 →</button></div></div>}

      <p className="craft-disclaimer">NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<"world" | "crafting" | "battle">("world");
  if (screen === "world") return <WorldView onOpen={() => setScreen("crafting")} onBattle={() => setScreen("battle")} />;
  if (screen === "battle") return <BattleView onExit={() => setScreen("world")} />;
  return <CraftingView onBack={() => setScreen("world")} onBattle={() => setScreen("battle")} />;
}
