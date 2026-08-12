"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = "workshop" | "map" | "words" | "report";

type Mission = {
  id: string;
  zone: number;
  title: string;
  titleZh: string;
  icon: string;
  clue: string;
  clueZh: string;
  answer: string[];
  inventory: string[];
  translation: string;
  rule: string;
  ruleZh: string;
  hint: string;
  coach: [string, string, string];
};

type Zone = {
  name: string;
  nameZh: string;
  icon: string;
  color: string;
  description: string;
  vocabulary: { word: string; zh: string; icon: string }[];
};

const ZONES: Zone[] = [
  {
    name: "Forest Materials",
    nameZh: "森林材料站",
    icon: "🌲",
    color: "green",
    description: "用颜色和自然词块，合成完整的观察句。",
    vocabulary: [
      { word: "tree", zh: "树", icon: "🌳" },
      { word: "apple", zh: "苹果", icon: "🍎" },
      { word: "pig", zh: "小猪", icon: "🐷" },
      { word: "bee", zh: "蜜蜂", icon: "🐝" },
      { word: "green", zh: "绿色", icon: "🟩" },
      { word: "small", zh: "小的", icon: "🔹" },
    ],
  },
  {
    name: "Home Builder",
    nameZh: "家园建造区",
    icon: "🏠",
    color: "blue",
    description: "学习房间物品、位置词和礼貌指令。",
    vocabulary: [
      { word: "bed", zh: "床", icon: "🛏️" },
      { word: "lamp", zh: "台灯", icon: "💡" },
      { word: "desk", zh: "书桌", icon: "🪵" },
      { word: "door", zh: "门", icon: "🚪" },
      { word: "window", zh: "窗户", icon: "🪟" },
      { word: "on", zh: "在……上面", icon: "⬆️" },
    ],
  },
  {
    name: "Food Camp",
    nameZh: "食物营地",
    icon: "🥕",
    color: "orange",
    description: "用食物词块表达喜好，并练习点餐。",
    vocabulary: [
      { word: "bread", zh: "面包", icon: "🍞" },
      { word: "milk", zh: "牛奶", icon: "🥛" },
      { word: "carrot", zh: "胡萝卜", icon: "🥕" },
      { word: "soup", zh: "汤", icon: "🥣" },
      { word: "cake", zh: "蛋糕", icon: "🍰" },
      { word: "sweet", zh: "甜的", icon: "✨" },
    ],
  },
  {
    name: "Village Talk",
    nameZh: "村庄对话场",
    icon: "💬",
    color: "purple",
    description: "把问候、回答和购物用语合成真实对话。",
    vocabulary: [
      { word: "morning", zh: "早晨", icon: "🌤️" },
      { word: "fine", zh: "很好", icon: "😊" },
      { word: "thank you", zh: "谢谢你", icon: "🙏" },
      { word: "would like", zh: "想要", icon: "🙋" },
      { word: "please", zh: "请", icon: "🌟" },
      { word: "how", zh: "怎样", icon: "❓" },
    ],
  },
];

const MISSIONS: Mission[] = [
  {
    id: "forest-1", zone: 0, title: "Green Tree", titleZh: "绿色大树", icon: "🌳",
    clue: "Tell Alex what you can see.", clueZh: "告诉 Alex 你看见了什么。",
    answer: ["I", "see", "a", "green", "tree."],
    inventory: ["tree.", "am", "green", "I", "an", "see", "blue", "a"],
    translation: "我看见一棵绿色的树。", rule: "I see + a/an + colour + thing.",
    ruleZh: "I see 后面接 a/an，再接颜色和物品。", hint: "句子通常从人物 I 开始。",
    coach: ["谁在看？先找表示“我”的词块。", "动作是 see；一个辅音音素开头的物品前用 a。", "顺序是：I → see → a → green → tree."],
  },
  {
    id: "forest-2", zone: 0, title: "Red Apple", titleZh: "红苹果", icon: "🍎",
    clue: "Introduce the apple on the block.", clueZh: "介绍方块上的苹果。",
    answer: ["This", "is", "a", "red", "apple."],
    inventory: ["apple.", "are", "red", "This", "the", "a", "is", "green"],
    translation: "这是一个红苹果。", rule: "This is + a/an + adjective + noun.",
    ruleZh: "介绍近处单个物品，用 This is...。", hint: "“这是”由两个词块组成：This is。",
    coach: ["介绍近处的一个物品，用 This 开头。", "This 后面要用单数动词 is。", "顺序是：This → is → a → red → apple."],
  },
  {
    id: "forest-3", zone: 0, title: "Pink Pig", titleZh: "粉色小猪", icon: "🐷",
    clue: "Describe the pig with one colour.", clueZh: "用一种颜色描述小猪。",
    answer: ["The", "pig", "is", "pink."],
    inventory: ["pink.", "pig", "are", "The", "is", "a", "small"],
    translation: "这只小猪是粉色的。", rule: "The + noun + is + adjective.",
    ruleZh: "描述某个物品：The + 名词 + is + 形容词。", hint: "先说是哪一个：The pig。",
    coach: ["先把 The 和 pig 放在一起，指出是哪只动物。", "单数 pig 后用 is。", "顺序是：The → pig → is → pink."],
  },
  {
    id: "forest-4", zone: 0, title: "Small Bee", titleZh: "小蜜蜂", icon: "🐝",
    clue: "Tell us the size of the bee.", clueZh: "告诉大家蜜蜂的大小。",
    answer: ["The", "bee", "is", "small."],
    inventory: ["bee", "big.", "The", "small.", "are", "is", "Bees"],
    translation: "这只蜜蜂很小。", rule: "Size words can come after is.",
    ruleZh: "small、big 等大小形容词可以放在 is 后面。", hint: "这是一只蜜蜂，所以用 bee 和 is。",
    coach: ["题目问哪只动物的大小？先找 The bee。", "单数主语后选择 is，而不是 are。", "顺序是：The → bee → is → small."],
  },
  {
    id: "home-1", zone: 1, title: "Blue Bed", titleZh: "蓝色小床", icon: "🛏️",
    clue: "Tell your friend what you own.", clueZh: "告诉朋友你有什么。",
    answer: ["I", "have", "a", "blue", "bed."],
    inventory: ["has", "bed.", "a", "I", "red", "have", "blue", "an"],
    translation: "我有一张蓝色的床。", rule: "I have + a/an + adjective + noun.",
    ruleZh: "表达“我有……”：I have + a/an + 形容词 + 名词。", hint: "I 后面用 have，不用 has。",
    coach: ["谁拥有这张床？先放 I。", "I 与 have 搭配；bed 前用 a。", "顺序是：I → have → a → blue → bed."],
  },
  {
    id: "home-2", zone: 1, title: "Lamp & Desk", titleZh: "台灯和书桌", icon: "💡",
    clue: "Where is the lamp? It is above the desk.", clueZh: "台灯在哪里？它在书桌上面。",
    answer: ["The", "lamp", "is", "on", "the", "desk."],
    inventory: ["under", "desk.", "lamp", "on", "The", "a", "is", "the"],
    translation: "台灯在书桌上。", rule: "on = touching the top of something.",
    ruleZh: "on 表示在某物上方并与表面接触。", hint: "先说 The lamp，再说它的位置。",
    coach: ["先找要描述的物品：The lamp。", "位置句的中间是 is on。", "顺序是：The → lamp → is → on → the → desk."],
  },
  {
    id: "home-3", zone: 1, title: "Wooden Door", titleZh: "木门指令", icon: "🚪",
    clue: "Ask politely for the door to be opened.", clueZh: "礼貌地请别人开门。",
    answer: ["Open", "the", "wooden", "door,", "please."],
    inventory: ["please.", "Close", "wooden", "door,", "a", "Open", "the", "window"],
    translation: "请打开木门。", rule: "Action + object + please.",
    ruleZh: "礼貌指令：动作 + 物品 + please。", hint: "指令句从动作 Open 开始。",
    coach: ["要别人做什么动作？先选择 Open。", "接着说具体物品 the wooden door。", "顺序是：Open → the → wooden → door, → please."],
  },
  {
    id: "home-4", zone: 1, title: "Two Windows", titleZh: "两扇窗户", icon: "🪟",
    clue: "Count and describe your house.", clueZh: "数一数并介绍你的房子。",
    answer: ["My", "house", "has", "two", "windows."],
    inventory: ["have", "windows.", "two", "My", "one", "has", "house", "window."],
    translation: "我的房子有两扇窗户。", rule: "He/She/It/My house + has.",
    ruleZh: "第三人称单数主语后用 has；two 后名词用复数。", hint: "My house 相当于 it，要搭配 has。",
    coach: ["先组成主语 My house。", "My house 是单数，所以用 has。", "顺序是：My → house → has → two → windows."],
  },
  {
    id: "food-1", zone: 2, title: "Bread & Milk", titleZh: "面包和牛奶", icon: "🍞",
    clue: "Say the two foods you enjoy.", clueZh: "说出你喜欢的两种食物。",
    answer: ["I", "like", "bread", "and", "milk."],
    inventory: ["or", "milk.", "I", "bread", "likes", "and", "like", "cake"],
    translation: "我喜欢面包和牛奶。", rule: "and joins two things together.",
    ruleZh: "and 可以连接两个并列的事物。", hint: "I 后面用 like；两个都喜欢用 and。",
    coach: ["句子从 I 开始，表达喜好用 like。", "bread 和 milk 都喜欢，用 and 连接。", "顺序是：I → like → bread → and → milk."],
  },
  {
    id: "food-2", zone: 2, title: "Apple Please", titleZh: "礼貌要苹果", icon: "🍎",
    clue: "Ask for an apple politely.", clueZh: "礼貌地要一个苹果。",
    answer: ["Can", "I", "have", "an", "apple,", "please?"],
    inventory: ["please?", "a", "Can", "apple,", "has", "I", "have", "an"],
    translation: "请问我可以要一个苹果吗？", rule: "Can I have ... , please?",
    ruleZh: "礼貌索取物品可以用 Can I have..., please?", hint: "问句先用 Can，再说 I have。",
    coach: ["这是请求许可的问句，Can 放在最前面。", "apple 以元音音素开头，所以用 an。", "顺序是：Can → I → have → an → apple, → please?"],
  },
  {
    id: "food-3", zone: 2, title: "Carrot Soup", titleZh: "胡萝卜汤", icon: "🥣",
    clue: "Give the soup to your friend.", clueZh: "把汤递给朋友。",
    answer: ["Here", "is", "your", "carrot", "soup."],
    inventory: ["are", "soup.", "Here", "my", "is", "carrot", "your", "cake"],
    translation: "这是你的胡萝卜汤。", rule: "Here is your + thing.",
    ruleZh: "递给别人一个物品时，可以说 Here is your...。", hint: "“给你”常从 Here is your 开始。",
    coach: ["递出一个物品时，先说 Here。", "单数 soup 搭配 is，再接 your。", "顺序是：Here → is → your → carrot → soup."],
  },
  {
    id: "food-4", zone: 2, title: "Sweet Cake", titleZh: "甜蛋糕", icon: "🍰",
    clue: "Describe the taste of the cake.", clueZh: "描述蛋糕的味道。",
    answer: ["The", "cake", "is", "sweet."],
    inventory: ["salty.", "The", "cakes", "sweet.", "are", "cake", "is"],
    translation: "这个蛋糕是甜的。", rule: "Taste words can come after is.",
    ruleZh: "sweet、salty 等味道形容词可以放在 is 后面。", hint: "The cake 是单数，所以选择 is。",
    coach: ["先指出物品：The cake。", "一个 cake 后用 is。", "顺序是：The → cake → is → sweet."],
  },
  {
    id: "talk-1", zone: 3, title: "Morning Hello", titleZh: "早晨问候", icon: "🌤️",
    clue: "Greet a villager and ask about them.", clueZh: "向村民问好并询问近况。",
    answer: ["Good", "morning!", "How", "are", "you?"],
    inventory: ["is", "you?", "Good", "night!", "are", "morning!", "How", "What"],
    translation: "早上好！你好吗？", rule: "Good morning! How are you?",
    ruleZh: "早晨问候后，可以用 How are you? 询问近况。", hint: "先完成 Good morning!，再开始问句。",
    coach: ["先用时间问候：Good morning!", "询问“你好吗”从 How 开始。", "顺序是：Good → morning! → How → are → you?"],
  },
  {
    id: "talk-2", zone: 3, title: "I Am Fine", titleZh: "我很好", icon: "😊",
    clue: "Answer: How are you?", clueZh: "回答：How are you?",
    answer: ["I", "am", "fine,", "thank", "you."],
    inventory: ["is", "you.", "I", "am", "fine,", "please", "thank", "good"],
    translation: "我很好，谢谢你。", rule: "I am fine, thank you.",
    ruleZh: "I 要和 am 搭配；thank you 表示感谢。", hint: "I 的专属搭档是 am。",
    coach: ["回答自己的状态，先放 I。", "I 后面只能搭配 am，再说 fine。", "顺序是：I → am → fine, → thank → you."],
  },
  {
    id: "talk-3", zone: 3, title: "Choose an Item", titleZh: "询问选择", icon: "🧺",
    clue: "Ask a customer what they want.", clueZh: "询问顾客想要什么。",
    answer: ["What", "would", "you", "like?"],
    inventory: ["do", "What", "you", "would", "likes?", "like?", "How"],
    translation: "你想要什么？", rule: "What would you like?",
    ruleZh: "礼貌询问对方想要什么：What would you like?", hint: "特殊疑问词 What 放在最前面。",
    coach: ["问“什么”，第一块是 What。", "礼貌表达用 would，主语是 you。", "顺序是：What → would → you → like?"],
  },
  {
    id: "talk-4", zone: 3, title: "Three Apples", titleZh: "三个苹果", icon: "🍎",
    clue: "Order three apples politely.", clueZh: "礼貌地点三个苹果。",
    answer: ["I", "would", "like", "three", "apples,", "please."],
    inventory: ["apple,", "I", "three", "want", "please.", "would", "apples,", "like"],
    translation: "我想要三个苹果，谢谢。", rule: "I would like + number + plural noun, please.",
    ruleZh: "礼貌点单：I would like + 数量 + 复数名词, please。", hint: "礼貌表达“我想要”是 I would like。",
    coach: ["先合成礼貌开头 I would like。", "three 后要用复数 apples。", "顺序是：I → would → like → three → apples, → please."],
  },
];

const NAV: { id: Tab; icon: string; label: string; en: string }[] = [
  { id: "workshop", icon: "▦", label: "合成工坊", en: "Craft" },
  { id: "map", icon: "⌖", label: "任务地图", en: "Map" },
  { id: "words", icon: "▤", label: "词块仓库", en: "Words" },
  { id: "report", icon: "◆", label: "学习报告", en: "Report" },
];

const STORAGE_KEY = "armstrong-craft-progress-v1";

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/[,.!?]/g, ""));
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

function playTone(success: boolean, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(success ? 523 : 185, context.currentTime);
  if (success) oscillator.frequency.setValueAtTime(659, context.currentTime + 0.1);
  gain.gain.setValueAtTime(0.04, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.24);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.24);
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("workshop");
  const [missionId, setMissionId] = useState(MISSIONS[0].id);
  const [slots, setSlots] = useState<(number | null)[]>(Array(9).fill(null));
  const [completed, setCompleted] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [xp, setXp] = useState(0);
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<"idle" | "success" | "error">("idle");
  const [feedbackText, setFeedbackText] = useState("");
  const [bilingual, setBilingual] = useState(true);
  const [sound, setSound] = useState(true);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachLevel, setCoachLevel] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [reflection, setReflection] = useState({
    observe: "", reflect: "", interpret: "", decide: "",
  });

  const mission = MISSIONS.find((item) => item.id === missionId) ?? MISSIONS[0];
  const zone = ZONES[mission.zone];
  const used = useMemo(() => new Set(slots.filter((slot): slot is number => slot !== null)), [slots]);
  const completionRate = Math.round((completed.length / MISSIONS.length) * 100);
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setCompleted(saved.completed ?? []);
        setMistakes(saved.mistakes ?? {});
        setXp(saved.xp ?? 0);
        setStars(saved.stars ?? 0);
        setStreak(saved.streak ?? 0);
        setBilingual(saved.bilingual ?? true);
        setSound(saved.sound ?? true);
        setReflection(saved.reflection ?? { observe: "", reflect: "", interpret: "", decide: "" });
        if (saved.missionId && MISSIONS.some((item) => item.id === saved.missionId)) setMissionId(saved.missionId);
      }
    } catch {
      // A damaged local record should never block a lesson.
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      completed, mistakes, xp, stars, streak, bilingual, sound, reflection, missionId,
    }));
  }, [completed, mistakes, xp, stars, streak, bilingual, sound, reflection, missionId, mounted]);

  function selectMission(id: string) {
    setMissionId(id);
    setSlots(Array(9).fill(null));
    setFeedback("idle");
    setFeedbackText("");
    setCoachLevel(0);
    setTab("workshop");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToken(tokenIndex: number, targetIndex?: number) {
    setFeedback("idle");
    setFeedbackText("");
    setSlots((current) => {
      const next = [...current];
      const oldIndex = next.indexOf(tokenIndex);
      if (oldIndex >= 0) next[oldIndex] = null;
      const target = targetIndex ?? next.findIndex((slot) => slot === null);
      if (target < 0) return current;
      next[target] = tokenIndex;
      return next;
    });
  }

  function removeToken(slotIndex: number) {
    setSlots((current) => current.map((slot, index) => index === slotIndex ? null : slot));
    setFeedback("idle");
  }

  function checkRecipe() {
    const built = slots
      .filter((slot): slot is number => slot !== null)
      .map((index) => mission.inventory[index]);
    const correct = built.length === mission.answer.length && built.every((token, index) => token === mission.answer[index]);
    if (correct) {
      const isFirst = !completed.includes(mission.id);
      setFeedback("success");
      setFeedbackText(`Perfect craft! ${mission.answer.join(" ")}`);
      setStreak((value) => value + 1);
      if (isFirst) {
        setCompleted((items) => [...items, mission.id]);
        setXp((value) => value + 25);
        setStars((value) => value + 3);
      }
      playTone(true, sound);
      speak(mission.answer.join(" "));
      return;
    }

    let prefix = 0;
    while (prefix < built.length && built[prefix] === mission.answer[prefix]) prefix += 1;
    const nextWord = mission.answer[prefix] ?? mission.answer[0];
    setFeedback("error");
    setFeedbackText(prefix > 0
      ? `前 ${prefix} 块正确。想一想：下一块应该是 “${nextWord}” 吗？`
      : mission.hint);
    setStreak(0);
    setMistakes((items) => ({ ...items, [mission.id]: (items[mission.id] ?? 0) + 1 }));
    playTone(false, sound);
  }

  function goNext() {
    const index = MISSIONS.findIndex((item) => item.id === mission.id);
    selectMission(MISSIONS[(index + 1) % MISSIONS.length].id);
  }

  function resetSlots() {
    setSlots(Array(9).fill(null));
    setFeedback("idle");
    setFeedbackText("");
  }

  const zoneCompleted = (zoneIndex: number) => MISSIONS.filter((item) => item.zone === zoneIndex && completed.includes(item.id)).length;

  return (
    <div className="site-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setTab("workshop")} aria-label="返回合成工坊">
          <span className="brand-cube"><i /><i /><i /></span>
          <span><b>ARMSTRONG</b><small>ENGLISH CRAFT LAB</small></span>
        </button>

        <nav className="side-nav" aria-label="主要导航">
          {NAV.map((item) => (
            <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}<small>{item.en}</small></span>
            </button>
          ))}
        </nav>

        <div className="route-card">
          <div className="route-title"><span>今日路线</span><b>{completed.length}/{MISSIONS.length}</b></div>
          {ZONES.map((item, index) => (
            <button key={item.name} onClick={() => selectMission(MISSIONS.find((task) => task.zone === index && !completed.includes(task.id))?.id ?? MISSIONS.find((task) => task.zone === index)!.id)}>
              <span className={`route-node ${item.color} ${zoneCompleted(index) === 4 ? "done" : ""}`}>{zoneCompleted(index) === 4 ? "✓" : item.icon}</span>
              <span><b>{item.nameZh}</b><small>{zoneCompleted(index)}/4 配方</small></span>
            </button>
          ))}
        </div>

        <div className="profile-card">
          <span className="avatar">🧑‍🚀</span>
          <span><b>Little Builder</b><small>Lv.{level} 方块学徒</small></span>
          <span className="mini-star">★ {stars}</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">TODAY&apos;S ADVENTURE</p>
            <h1>{tab === "workshop" ? "英语合成工坊" : NAV.find((item) => item.id === tab)?.label}</h1>
          </div>
          <div className="header-tools">
            <div className="stat-pill fire"><span>🔥</span><b>{streak}</b><small>连胜</small></div>
            <div className="stat-pill"><span>⭐</span><b>{stars}</b><small>星星</small></div>
            <button className={`icon-button ${sound ? "on" : ""}`} onClick={() => setSound((value) => !value)} aria-label={sound ? "关闭音效" : "开启音效"}>{sound ? "♪" : "×"}</button>
            <button className="language-button" onClick={() => setBilingual((value) => !value)} aria-pressed={bilingual}>{bilingual ? "中 / EN" : "EN"}</button>
          </div>
        </header>

        {tab === "workshop" && (
          <div className="workshop-view">
            <section className={`mission-banner ${zone.color}`}>
              <div className="block-scenery" aria-hidden="true">
                <span className="cloud c1" /><span className="cloud c2" />
                <span className="pixel-tree">🌳</span><span className="pixel-home">🏡</span>
              </div>
              <div className="mission-copy">
                <div className="mission-kicker"><span>MISSION {MISSIONS.indexOf(mission) + 1}</span><b>{zone.icon} {zone.name}</b></div>
                <h2>{mission.icon} {mission.title}</h2>
                <p>{mission.clue}</p>
                {bilingual && <p className="translation">{mission.clueZh}</p>}
                <div className="mission-actions">
                  <button onClick={() => speak(mission.answer.join(" "))}><span>▶</span> 听任务 <small>LISTEN</small></button>
                  <button className="ghost" onClick={() => { setCoachOpen(true); setCoachLevel(0); }}><span>✦</span> 问 FUMI AI</button>
                </div>
              </div>
              <div className="mission-reward">
                <span>完成奖励</span><b>+25 XP</b><div>★ ★ ★</div>
              </div>
            </section>

            <div className="workshop-grid">
              <section className="learn-panel panel">
                <div className="panel-heading">
                  <div><span className="step-number">1</span><span><b>读取配方</b><small>READ THE RECIPE</small></span></div>
                  <button className="speaker" onClick={() => speak(mission.answer.join(" "))} aria-label="朗读目标句">🔊</button>
                </div>
                <div className="recipe-card">
                  <div className="recipe-icon">{mission.icon}</div>
                  <div>
                    <p>需要合成的英语</p>
                    <h3>{mission.title}</h3>
                    {bilingual && <span>{mission.translation}</span>}
                  </div>
                </div>
                <div className="rule-box">
                  <span className="book-block">▤</span>
                  <div><small>BUILDING RULE · 造句规则</small><b>{mission.rule}</b>{bilingual && <p>{mission.ruleZh}</p>}</div>
                </div>
                <div className="word-order-tip">
                  <span>💡</span><p><b>建造提示</b>{mission.hint}</p>
                </div>
                <button className="ai-inline" onClick={() => setCoachOpen(true)}><span>✦</span><span><b>卡住了？让 FUMI AI 只给你一步提示</b><small>不会直接抢走你的思考机会</small></span><i>›</i></button>
              </section>

              <section className={`craft-panel panel ${feedback}`}>
                <div className="panel-heading">
                  <div><span className="step-number orange">2</span><span><b>放入工作台</b><small>PLACE THE WORD BLOCKS</small></span></div>
                  <span className="click-tip">点击或拖动词块</span>
                </div>

                <div className="craft-stage">
                  <div className="crafting-table">
                    <div className="table-top">
                      <span>CRAFTING</span>
                      <div className="slot-grid" aria-label="3乘3英语合成工作台">
                        {slots.map((tokenIndex, slotIndex) => (
                          <button
                            className={`craft-slot ${tokenIndex !== null ? "filled" : ""}`}
                            key={slotIndex}
                            onClick={() => tokenIndex !== null && removeToken(slotIndex)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              const token = Number(event.dataTransfer.getData("text/plain"));
                              if (!Number.isNaN(token)) addToken(token, slotIndex);
                            }}
                            aria-label={tokenIndex === null ? `空槽位 ${slotIndex + 1}` : `${mission.inventory[tokenIndex]}，点击移除`}
                          >
                            {tokenIndex !== null && <span>{mission.inventory[tokenIndex]}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="table-front"><i /><b>ENGLISH</b><i /></div>
                  </div>
                  <div className="craft-arrow">➜</div>
                  <div className={`result-block ${feedback}`}>
                    <span>{feedback === "success" ? "🏆" : feedback === "error" ? "🧭" : "?"}</span>
                    <small>{feedback === "success" ? "CRAFTED!" : feedback === "error" ? "TRY AGAIN" : "RESULT"}</small>
                  </div>
                </div>

                <div className="inventory-title"><span>背包里的词块</span><small>{used.size}/{mission.answer.length} 已放入</small></div>
                <div className="inventory" aria-label="可用词块">
                  {mission.inventory.map((token, index) => (
                    <button
                      key={`${token}-${index}`}
                      className={used.has(index) ? "used" : ""}
                      onClick={() => !used.has(index) && addToken(index)}
                      draggable={!used.has(index)}
                      onDragStart={(event) => event.dataTransfer.setData("text/plain", String(index))}
                      disabled={used.has(index)}
                    ><span>{token}</span><i /></button>
                  ))}
                </div>

                {feedback !== "idle" && (
                  <div className={`feedback-box ${feedback}`} role="status">
                    <span>{feedback === "success" ? "✓" : "!"}</span>
                    <p><b>{feedback === "success" ? "合成成功！" : "配方还差一点"}</b>{feedbackText}</p>
                    {feedback === "error" && <button onClick={() => setCoachOpen(true)}>获取一步提示</button>}
                  </div>
                )}

                <div className="craft-actions">
                  <button className="reset-button" onClick={resetSlots}>↻ 清空工作台</button>
                  {feedback === "success"
                    ? <button className="craft-button next" onClick={goNext}>下一张配方 <span>➜</span></button>
                    : <button className="craft-button" onClick={checkRecipe} disabled={used.size === 0}><span className="tiny-cube">◆</span> 开始合成 <small>CRAFT!</small></button>}
                </div>
              </section>
            </div>

            <section className="mission-strip">
              <div><p>当前区域</p><b>{zone.icon} {zone.nameZh}</b></div>
              <div className="mini-missions">
                {MISSIONS.filter((item) => item.zone === mission.zone).map((item, index) => (
                  <button key={item.id} className={`${mission.id === item.id ? "current" : ""} ${completed.includes(item.id) ? "done" : ""}`} onClick={() => selectMission(item.id)}>
                    <span>{completed.includes(item.id) ? "✓" : item.icon}</span><small>{index + 1}</small>
                  </button>
                ))}
              </div>
              <button className="map-link" onClick={() => setTab("map")}>查看完整地图 →</button>
            </section>
          </div>
        )}

        {tab === "map" && (
          <section className="map-view">
            <div className="section-intro"><div><p className="eyebrow">YOUR LEARNING JOURNEY</p><h2>四个区域，十六张英语配方</h2><span>每完成一个配方可获得 25 XP 和 3 颗星。</span></div><div className="big-progress"><b>{completionRate}%</b><span>总进度</span></div></div>
            <div className="zone-list">
              {ZONES.map((item, zoneIndex) => (
                <article className={`zone-card ${item.color}`} key={item.name}>
                  <div className="zone-head"><span className="zone-icon">{item.icon}</span><div><small>ZONE {zoneIndex + 1}</small><h3>{item.nameZh}</h3><p>{item.name}</p></div><b>{zoneCompleted(zoneIndex)}/4</b></div>
                  <p className="zone-description">{item.description}</p>
                  <div className="zone-progress"><i style={{ width: `${zoneCompleted(zoneIndex) * 25}%` }} /></div>
                  <div className="mission-list">
                    {MISSIONS.filter((task) => task.zone === zoneIndex).map((task, taskIndex) => (
                      <button key={task.id} onClick={() => selectMission(task.id)}>
                        <span className={completed.includes(task.id) ? "done" : ""}>{completed.includes(task.id) ? "✓" : task.icon}</span>
                        <div><small>配方 {taskIndex + 1}</small><b>{task.titleZh}</b><p>{task.answer.join(" ")}</p></div>
                        <i>{mistakes[task.id] ? `错 ${mistakes[task.id]}` : completed.includes(task.id) ? "★★★" : "›"}</i>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "words" && (
          <section className="words-view">
            <div className="section-intro"><div><p className="eyebrow">WORD BLOCK STORAGE</p><h2>点击词块，听标准发音</h2><span>先认识材料，合成句子会更轻松。</span></div><div className="storage-count"><b>24</b><span>已收集词块</span></div></div>
            <div className="word-zones">
              {ZONES.map((item) => (
                <article className={`word-zone ${item.color}`} key={item.name}>
                  <div className="word-zone-head"><span>{item.icon}</span><div><h3>{item.nameZh}</h3><p>{item.name}</p></div></div>
                  <div className="vocab-grid">
                    {item.vocabulary.map((vocab) => (
                      <button key={vocab.word} onClick={() => speak(vocab.word)}>
                        <span className="vocab-icon">{vocab.icon}</span>
                        <span><b>{vocab.word}</b>{bilingual && <small>{vocab.zh}</small>}</span>
                        <i>🔊</i>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "report" && (
          <section className="report-view">
            <div className="section-intro"><div><p className="eyebrow">LEARNING REPORT</p><h2>你的英语建造记录</h2><span>进步不只看分数，也看你怎样思考和修正。</span></div><div className="report-level"><span>LV.{level}</span><div><i style={{ width: `${currentLevelXp}%` }} /></div><small>{currentLevelXp}/100 XP</small></div></div>
            <div className="report-stats">
              <article><span>🏆</span><div><small>完成配方</small><b>{completed.length}<i> / {MISSIONS.length}</i></b></div></article>
              <article><span>⭐</span><div><small>获得星星</small><b>{stars}</b></div></article>
              <article><span>🔥</span><div><small>当前连胜</small><b>{streak}</b></div></article>
              <article><span>📈</span><div><small>整体掌握</small><b>{completionRate}%</b></div></article>
            </div>
            <div className="report-columns">
              <article className="mastery-card panel">
                <div className="report-card-head"><div><p className="eyebrow">ZONE MASTERY</p><h3>区域掌握度</h3></div><span>实时保存</span></div>
                <div className="mastery-list">
                  {ZONES.map((item, index) => {
                    const count = zoneCompleted(index);
                    return <div key={item.name}><span className={`mastery-icon ${item.color}`}>{item.icon}</span><div><b>{item.nameZh}</b><small>{count === 4 ? "已掌握" : `还差 ${4 - count} 张配方`}</small><p><i style={{ width: `${count * 25}%` }} className={item.color} /></p></div><strong>{count * 25}%</strong></div>;
                  })}
                </div>
              </article>
              <article className="badge-card panel">
                <div className="report-card-head"><div><p className="eyebrow">BADGES</p><h3>成就展柜</h3></div><span>{[completed.length >= 1, completed.length >= 4, completed.length >= 8, completed.length === 16].filter(Boolean).length}/4</span></div>
                <div className="badges">
                  {[
                    ["🧱", "第一块砖", "完成首张配方", completed.length >= 1],
                    ["🌲", "森林建造师", "完成森林区域", zoneCompleted(0) === 4],
                    ["🔥", "坚持合成", "完成八张配方", completed.length >= 8],
                    ["👑", "英语大师", "完成全部任务", completed.length === 16],
                  ].map(([icon, name, desc, unlocked]) => <div className={unlocked ? "unlocked" : "locked"} key={String(name)}><span>{icon}</span><b>{name}</b><small>{desc}</small></div>)}
                </div>
              </article>
            </div>

            <article className="review-card panel">
              <div className="report-card-head"><div><p className="eyebrow">SMART REVIEW</p><h3>错题与再合成</h3></div></div>
              {Object.keys(mistakes).length === 0 ? <div className="empty-review"><span>🌟</span><p><b>暂时没有需要重练的配方</b>出错后，这里会自动收集对应任务。</p></div> : <div className="review-list">
                {Object.entries(mistakes).sort((a, b) => b[1] - a[1]).map(([id, count]) => {
                  const task = MISSIONS.find((item) => item.id === id)!;
                  return <button key={id} onClick={() => selectMission(id)}><span>{task.icon}</span><div><b>{task.titleZh}</b><small>{task.answer.join(" ")}</small></div><i>尝试 {count} 次 →</i></button>;
                })}
              </div>}
            </article>

            <article className="reflection-card panel">
              <div className="report-card-head"><div><p className="eyebrow">ORID REFLECTION</p><h3>四步学习反思</h3></div><span>自动保存</span></div>
              <div className="reflection-grid">
                {([
                  ["observe", "O · 观察", "今天我学到的三个英语词是……"],
                  ["reflect", "R · 感受", "哪一次合成让我最开心或最困难？"],
                  ["interpret", "I · 理解", "我发现英语句子的顺序是……"],
                  ["decide", "D · 行动", "下次我准备先检查……"],
                ] as const).map(([key, label, placeholder]) => <label key={key}><span>{label}</span><textarea value={reflection[key]} onChange={(event) => setReflection((value) => ({ ...value, [key]: event.target.value }))} placeholder={placeholder} /></label>)}
              </div>
            </article>
          </section>
        )}
      </main>

      <nav className="mobile-nav" aria-label="移动端导航">
        {NAV.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
      </nav>

      <button className="floating-ai" onClick={() => setCoachOpen(true)} aria-label="打开 FUMI AI 英语助教"><span>✦</span><b>FUMI AI</b><small>问问我</small></button>

      {coachOpen && (
        <div className="coach-layer" role="dialog" aria-modal="true" aria-label="FUMI AI 英语助教">
          <button className="coach-backdrop" onClick={() => setCoachOpen(false)} aria-label="关闭助教" />
          <aside className="coach-drawer">
            <div className="coach-head"><div className="coach-avatar">✦</div><div><b>FUMI AI</b><small>英语合成助教 · 正在看当前配方</small></div><button onClick={() => setCoachOpen(false)} aria-label="关闭">×</button></div>
            <div className="coach-context"><span>{mission.icon}</span><div><small>当前任务</small><b>{mission.title}</b><p>{mission.clueZh}</p></div></div>
            <div className="chat-bubble ai"><span>F</span><p>我不会直接把答案塞给你。我们一次只解决一个小问题：<b>{mission.coach[Math.min(coachLevel, 2)]}</b></p></div>
            <div className="coach-choice">
              <p>先观察词块，你想怎么继续？</p>
              <button onClick={() => setCoachLevel((levelValue) => Math.min(levelValue + 1, 2))}>再给我一步提示</button>
              <button onClick={() => { speak(mission.answer.join(" ")); }}>只听完整句子的声音</button>
              <button onClick={() => { setCoachOpen(false); resetSlots(); }}>我想自己重新合成</button>
            </div>
            <div className="coach-rule"><span>🧠</span><p><small>本题知识点</small><b>{mission.rule}</b>{bilingual && mission.ruleZh}</p></div>
            <div className="coach-footer"><span>提示层级 {coachLevel + 1}/3</span><div><i style={{ width: `${((coachLevel + 1) / 3) * 100}%` }} /></div></div>
          </aside>
        </div>
      )}
    </div>
  );
}
