import { type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import catalogJson from "./data/recipes26_2.json";
import spriteJson from "./data/sprites26_2.json";

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

const catalog = catalogJson as Catalog;
const spriteData = spriteJson as unknown as SpriteData;
const STORAGE_KEY = "armstrong-minecraft-english-v2";
const CATEGORY_INFO: { id: Category; icon: string; label: string; en: string }[] = [
  { id: "all", icon: "▦", label: "全部", en: "All Recipes" },
  { id: "building", icon: "▧", label: "建筑", en: "Building" },
  { id: "equipment", icon: "⚔", label: "装备", en: "Equipment" },
  { id: "redstone", icon: "⌁", label: "红石", en: "Redstone" },
  { id: "misc", icon: "✦", label: "杂项", en: "Misc" },
  { id: "special", icon: "★", label: "特殊", en: "Special" },
];

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

function WorldView({ onOpen }: { onOpen: () => void }) {
  const [swinging, setSwinging] = useState(false);
  const [hits, setHits] = useState(0);

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
        <span>NEW QUEST</span>
        <div><b>Open the Crafting Table</b><small>打开合成台 · 学会第一句游戏英语</small></div>
      </div>

      <button className={`world-table ${hits ? "was-hit" : ""}`} onClick={hitTable} aria-label="点击合成台打开工作台">
        <span className="cube-body">
          <i className="cube-face cube-top" />
          <i className="cube-face cube-front" />
          <i className="cube-face cube-side" />
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
          {["wooden_pickaxe", "oak_planks", "stick", "apple", "torch", null, null, null, "crafting_table"].map((id, index) => (
            <span key={index} className={index === 8 ? "selected" : ""}>{id && <Sprite id={id} size={38} />}{id === "oak_planks" && <b>16</b>}{id === "stick" && <b>8</b>}</span>
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
  recipes, selected, category, query, visibleLimit, onSelect, onCategory, onQuery, onMore, onClose,
}: {
  recipes: Recipe[];
  selected: Recipe;
  category: Category;
  query: string;
  visibleLimit: number;
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
        {recipes.slice(0, visibleLimit).map((recipe) => (
          <button key={recipe.id} className={selected.id === recipe.id ? "selected" : ""} onClick={() => onSelect(recipe)} title={`${recipe.result.name}${recipe.result.zh ? ` · ${recipe.result.zh}` : ""}`} aria-label={`${recipe.result.name}${recipe.result.zh ? ` · ${recipe.result.zh}` : ""}`}>
            <Sprite id={recipe.result.id} size={36} />
            {recipe.result.count > 1 && <b>{recipe.result.count}</b>}
            {recipe.dynamic && <i>★</i>}
          </button>
        ))}
      </div>
      {visibleLimit < recipes.length && <button className="load-recipes" onClick={onMore}>Load more · 加载更多</button>}
      <div className="book-page">1 / {Math.max(1, Math.ceil(recipes.length / visibleLimit))}</div>
    </aside>
  );
}

function CraftingGui({
  recipe, matchedRecipe, grid, onDropMaterial, onRemove, onClear, onCraft, onOpenBook, bookOpen, craftedPulse,
}: {
  recipe: Recipe;
  matchedRecipe: Recipe | null;
  grid: (string | null)[];
  onDropMaterial: (targetIndex: number, id: string, sourceIndex: number | null) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onCraft: (recipe: Recipe) => void;
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
  const hotbar = ["wooden_pickaxe", "oak_planks", "stick", "apple", "torch", null, null, null, "crafting_table"] as (string | null)[];

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
          {hotbar.map((id, index) => <span className="gui-slot" key={index}>{id && <Sprite id={id} size={45} />}</span>)}
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

function CraftingView({ onBack }: { onBack: () => void }) {
  const [selectedId, setSelectedId] = useState("crafting_table");
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [bookOpen, setBookOpen] = useState(true);
  const [visibleLimit, setVisibleLimit] = useState(96);
  const [grid, setGrid] = useState<(string | null)[]>(Array(9).fill(null));
  const [xp, setXp] = useState(0);
  const [craftCount, setCraftCount] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [fumiOpen, setFumiOpen] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [craftedPulse, setCraftedPulse] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const selected = catalog.recipes.find((recipe) => recipe.id === selectedId || recipe.result.id === selectedId) ?? catalog.recipes[0];
  const matchedRecipe = useMemo(() => grid.some(Boolean) ? catalog.recipes.find((recipe) => matchesRecipe(recipe, grid)) ?? null : null, [grid]);
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
    } catch { /* progress should never block the game */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ xp, craftCount, completed }));
  }, [xp, craftCount, completed]);

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

  return (
    <main className="crafting-view">
      <WorldScene dimmed />
      <header className="craft-topbar">
        <button onClick={onBack}>← <span>Back to World</span></button>
        <div><b>Crafting Table</b><small>工作台 · {catalog.version}</small></div>
        <div className="craft-stats"><button onClick={() => setShowStats((value) => !value)}>📗 {completed.length}/{catalog.totalRecipes}</button><span>✦ {xp} XP</span><b>LV.{currentLevel}</b></div>
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

      <div className={`craft-workspace ${bookOpen ? "book-visible" : ""}`}>
        {bookOpen && <RecipeBook
          recipes={filtered} selected={selected} category={category} query={query} visibleLimit={visibleLimit}
          onSelect={selectRecipe} onCategory={(next) => { setCategory(next); setVisibleLimit(96); }}
          onQuery={(next) => { setQuery(next); setVisibleLimit(96); }} onMore={() => setVisibleLimit((value) => value + 96)}
          onClose={() => setBookOpen(false)}
        />}
        <CraftingGui
          recipe={selected} matchedRecipe={matchedRecipe} grid={grid} onDropMaterial={dropMaterial}
          onRemove={(index) => setGrid((current) => current.map((item, itemIndex) => itemIndex === index ? null : item))}
          onClear={() => setGrid(Array(9).fill(null))}
          onCraft={craftItem} onOpenBook={() => setBookOpen((value) => !value)} bookOpen={bookOpen} craftedPulse={craftedPulse}
        />
        <EnglishPanel recipe={displayRecipe} completed={completed.includes(displayRecipe.id)} onFumi={() => setFumiOpen(true)} />
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

      <p className="craft-disclaimer">NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.</p>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<"world" | "crafting">("world");
  return screen === "world" ? <WorldView onOpen={() => setScreen("crafting")} /> : <CraftingView onBack={() => setScreen("world")} />;
}
