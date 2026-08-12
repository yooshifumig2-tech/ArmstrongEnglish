export type BattleLevel = 1 | 2 | 3 | 4 | 5;
export type BattleCategory = "vocabulary" | "plural" | "tense" | "clause";

export type BattleQuestion = {
  id: string;
  level: BattleLevel;
  category: BattleCategory;
  prompt: string;
  meaning: string;
  options: [string, string, string, string];
  answer: string;
  explanation: string;
};

export type MonsterId = "zombie" | "creeper" | "skeleton" | "enderman" | "warden" | "ender_dragon";

export type MonsterConfig = {
  id: MonsterId;
  name: string;
  zh: string;
  tier: BattleLevel;
  kind: "mob" | "boss";
  hp: number;
  hitDamage: number;
  attackDamage: number;
  arena: string;
  mechanic: string;
  reward: number;
};

export const MONSTERS: MonsterConfig[] = [
  { id: "zombie", name: "Zombie", zh: "僵尸", tier: 1, kind: "mob", hp: 60, hitDamage: 20, attackDamage: 10, arena: "overworld", mechanic: "答错后僵尸会近身攻击。适合第一次战斗。", reward: 35 },
  { id: "creeper", name: "Creeper", zh: "苦力怕", tier: 1, kind: "mob", hp: 80, hitDamage: 20, attackDamage: 0, arena: "overworld", mechanic: "答错会点燃引信；累计 3 次错误后自爆，直接击败玩家。", reward: 55 },
  { id: "skeleton", name: "Skeleton", zh: "骷髅", tier: 2, kind: "mob", hp: 100, hitDamage: 20, attackDamage: 16, arena: "overworld", mechanic: "答错后会射箭；每第三回合还会进行一次快速连射。", reward: 80 },
  { id: "enderman", name: "Enderman", zh: "末影人", tier: 3, kind: "mob", hp: 125, hitDamage: 25, attackDamage: 20, arena: "end", mechanic: "答错后瞬移，并在下一回合重新打乱四个选项。", reward: 120 },
  { id: "warden", name: "Warden", zh: "监守者", tier: 4, kind: "boss", hp: 180, hitDamage: 25, attackDamage: 22, arena: "deep_dark", mechanic: "错误会增加振动警戒；每 2 次错误释放一次穿透式声波重击。", reward: 190 },
  { id: "ender_dragon", name: "Ender Dragon", zh: "末影龙", tier: 5, kind: "boss", hp: 225, hitDamage: 25, attackDamage: 26, arena: "end", mechanic: "前三次正确回答先摧毁末影水晶；水晶存在时，答错会让龙恢复生命。", reward: 300 },
];

export const BATTLE_QUESTIONS: BattleQuestion[] = [
  { id: "l1-01", level: 1, category: "vocabulary", prompt: "I use a ___ to break stone.", meaning: "我用一把___挖石头。", options: ["pickaxe", "apple", "bed", "boat"], answer: "pickaxe", explanation: "Pickaxe 表示“镐”，是挖掘石头的工具。" },
  { id: "l1-02", level: 1, category: "plural", prompt: "There are three ___ in my chest.", meaning: "我的箱子里有三支火把。", options: ["torch", "torchs", "torches", "torchies"], answer: "torches", explanation: "three 后用复数；torch 以 ch 结尾，复数加 -es：torches。" },
  { id: "l1-03", level: 1, category: "tense", prompt: "Steve ___ a wooden sword every morning.", meaning: "史蒂夫每天早上制作一把木剑。", options: ["craft", "crafts", "crafted", "crafting"], answer: "crafts", explanation: "every morning 表示一般现在时；Steve 是第三人称单数，动词用 crafts。" },
  { id: "l1-04", level: 1, category: "vocabulary", prompt: "Which item gives light in a cave?",
    meaning: "哪种物品能在洞穴里照明？", options: ["Torch", "Bucket", "Chest", "Stick"], answer: "Torch", explanation: "Torch 是“火把”，可以照亮黑暗的洞穴。" },
  { id: "l1-05", level: 1, category: "plural", prompt: "I have two ___ in my hotbar.", meaning: "我的快捷栏里有两把剑。", options: ["sword", "swords", "swordes", "sword's"], answer: "swords", explanation: "two 后接可数名词复数；sword 的复数是 swords。" },
  { id: "l1-06", level: 1, category: "tense", prompt: "The zombie ___ near the village now.", meaning: "僵尸现在正在村庄附近行走。", options: ["walk", "walks", "is walking", "walked"], answer: "is walking", explanation: "now 表示动作正在发生，用现在进行时 is walking。" },
  { id: "l1-07", level: 1, category: "vocabulary", prompt: "A player sleeps in a ___.", meaning: "玩家睡在___里。", options: ["bed", "furnace", "shield", "ladder"], answer: "bed", explanation: "Bed 表示“床”，玩家可以用它睡觉并设置重生点。" },
  { id: "l1-08", level: 1, category: "plural", prompt: "There ___ one creeper behind you.", meaning: "你身后有一只苦力怕。", options: ["is", "are", "am", "be"], answer: "is", explanation: "one creeper 是单数，因此使用 There is。" },

  { id: "l2-01", level: 2, category: "tense", prompt: "Yesterday, Alex ___ an iron pickaxe.", meaning: "昨天，Alex 制作了一把铁镐。", options: ["craft", "crafts", "crafted", "will craft"], answer: "crafted", explanation: "Yesterday 是过去时间标志，使用过去式 crafted。" },
  { id: "l2-02", level: 2, category: "tense", prompt: "Tomorrow, we ___ the stronghold.", meaning: "明天，我们将寻找要塞。", options: ["find", "found", "will find", "are found"], answer: "will find", explanation: "Tomorrow 表示将来，用 will + 动词原形。" },
  { id: "l2-03", level: 2, category: "plural", prompt: "How many ___ do we need for this recipe?", meaning: "这个配方需要多少块木板？", options: ["plank", "planks", "plankes", "planking"], answer: "planks", explanation: "How many 后接可数名词复数：planks。" },
  { id: "l2-04", level: 2, category: "tense", prompt: "Did you ___ the furnace?", meaning: "你制作熔炉了吗？", options: ["craft", "crafted", "crafts", "crafting"], answer: "craft", explanation: "助动词 did 后必须使用动词原形 craft。" },
  { id: "l2-05", level: 2, category: "clause", prompt: "I carry a shield ___ skeletons shoot arrows.", meaning: "我带着盾牌，因为骷髅会射箭。", options: ["because", "but", "before", "or"], answer: "because", explanation: "后半句解释携带盾牌的原因，因此用 because。" },
  { id: "l2-06", level: 2, category: "plural", prompt: "There ___ five arrows in the chest.", meaning: "箱子里有五支箭。", options: ["is", "are", "was", "be"], answer: "are", explanation: "five arrows 是复数，使用 There are。" },
  { id: "l2-07", level: 2, category: "vocabulary", prompt: "Which item protects the player from arrows?", meaning: "哪种物品可以保护玩家免受箭的攻击？", options: ["Shield", "Compass", "Fishing rod", "Shears"], answer: "Shield", explanation: "Shield 是“盾牌”，可以格挡攻击。" },
  { id: "l2-08", level: 2, category: "tense", prompt: "Look! A skeleton ___ at us.", meaning: "看！一只骷髅正在向我们射击。", options: ["shoots", "shot", "is shooting", "will shoot"], answer: "is shooting", explanation: "Look! 提示动作正在发生，用 is shooting。" },

  { id: "l3-01", level: 3, category: "clause", prompt: "I will eat an apple ___ my health is low.", meaning: "如果生命值很低，我会吃苹果。", options: ["if", "because of", "than", "aftered"], answer: "if", explanation: "if 引导条件从句，表示“如果生命值很低”。" },
  { id: "l3-02", level: 3, category: "tense", prompt: "While I was mining, an Enderman ___.", meaning: "当我正在挖矿时，一只末影人出现了。", options: ["appears", "appeared", "is appearing", "will appear"], answer: "appeared", explanation: "was mining 是过去进行时；突然发生的动作使用一般过去时 appeared。" },
  { id: "l3-03", level: 3, category: "plural", prompt: "This chest has fewer ___ than that one.", meaning: "这个箱子的钻石比那个箱子少。", options: ["diamond", "diamonds", "diamond's", "diamondies"], answer: "diamonds", explanation: "fewer 修饰可数名词复数，所以用 diamonds。" },
  { id: "l3-04", level: 3, category: "clause", prompt: "The Enderman teleports ___ I look at it.", meaning: "当我看着末影人时，它会瞬移。", options: ["when", "so", "until", "than"], answer: "when", explanation: "when 表示“当……的时候”，引导时间从句。" },
  { id: "l3-05", level: 3, category: "tense", prompt: "Alex has already ___ the portal.", meaning: "Alex 已经建好了传送门。", options: ["build", "built", "builds", "building"], answer: "built", explanation: "has already 后使用过去分词；build 的过去分词是 built。" },
  { id: "l3-06", level: 3, category: "vocabulary", prompt: "What does “teleport” mean?", meaning: "teleport 是什么意思？", options: ["瞬移", "合成", "治疗", "挖掘"], answer: "瞬移", explanation: "Teleport 表示从一个地点立即移动到另一个地点，即“瞬移”。" },
  { id: "l3-07", level: 3, category: "clause", prompt: "I placed water ___ I would not take fall damage.", meaning: "我放了水，因此不会受到摔落伤害。", options: ["so that", "although", "unless", "before"], answer: "so that", explanation: "so that 表示目的或结果：“为了/因此能够……”。" },
  { id: "l3-08", level: 3, category: "tense", prompt: "If the Enderman comes back, I ___ under this roof.", meaning: "如果末影人回来，我会躲在这个屋顶下面。", options: ["hide", "hid", "will hide", "hiding"], answer: "will hide", explanation: "真实条件句中，if 从句用一般现在时，主句可用 will + 动词原形。" },

  { id: "l4-01", level: 4, category: "clause", prompt: "The Warden attacked me ___ I made too much noise.", meaning: "监守者攻击我，因为我制造了太多声音。", options: ["because", "although", "unless", "before"], answer: "because", explanation: "后半句给出攻击发生的原因，使用 because。" },
  { id: "l4-02", level: 4, category: "tense", prompt: "By the time the Warden arrived, we had ___ the chest.", meaning: "监守者到达时，我们已经藏好了箱子。", options: ["hide", "hid", "hidden", "hiding"], answer: "hidden", explanation: "had 后使用过去分词；hide–hid–hidden。" },
  { id: "l4-03", level: 4, category: "plural", prompt: "Neither of the two ___ is broken.", meaning: "两把镐都没有坏。", options: ["pickaxe", "pickaxes", "pickaxies", "pickaxe's"], answer: "pickaxes", explanation: "two 后名词用复数；pickaxe 的复数加 -s：pickaxes。" },
  { id: "l4-04", level: 4, category: "clause", prompt: "Move quietly ___ the Warden cannot hear you.", meaning: "安静地移动，这样监守者就听不到你。", options: ["so that", "because", "but", "after"], answer: "so that", explanation: "so that 引导目的从句，表示“以便……”。" },
  { id: "l4-05", level: 4, category: "tense", prompt: "The player ___ sneaking since the shrieker activated.", meaning: "幽匿尖啸体激活后，玩家一直在潜行。", options: ["has been", "have been", "was", "will be"], answer: "has been", explanation: "The player 是单数；since 表示动作持续到现在，用 has been sneaking。" },
  { id: "l4-06", level: 4, category: "vocabulary", prompt: "Which word means “发出强烈的吼声”?", meaning: "选择表示“发出强烈的吼声”的英文。", options: ["roar", "whisper", "craft", "float"], answer: "roar", explanation: "Roar 表示大型动物或怪物“吼叫”。" },
  { id: "l4-07", level: 4, category: "clause", prompt: "Although the cave was dark, we ___ exploring.", meaning: "虽然洞穴很黑，我们还是继续探索。", options: ["continued", "continues", "continuing", "will continued"], answer: "continued", explanation: "Although 引导让步从句；叙述过去发生的事情用 continued。" },
  { id: "l4-08", level: 4, category: "tense", prompt: "If I had heard the shriek, I would have ___.", meaning: "如果我听到了尖啸，我就会逃跑。", options: ["run", "ran", "running", "runs"], answer: "run", explanation: "would have 后使用过去分词；run 的过去分词仍是 run。" },

  { id: "l5-01", level: 5, category: "clause", prompt: "Destroy the crystals before the dragon ___ again.", meaning: "在末影龙再次恢复生命之前摧毁水晶。", options: ["heals", "will heal", "healed", "healing"], answer: "heals", explanation: "before 引导的将来时间从句通常用一般现在时，主语 dragon 为单数，使用 heals。" },
  { id: "l5-02", level: 5, category: "tense", prompt: "The dragon had healed before I ___ the crystal.", meaning: "我摧毁水晶前，末影龙已经恢复了生命。", options: ["destroy", "destroyed", "will destroy", "am destroying"], answer: "destroyed", explanation: "主句是过去完成时，before 从句描述过去动作，使用 destroyed。" },
  { id: "l5-03", level: 5, category: "plural", prompt: "Each of the End crystals ___ a beam.", meaning: "每个末影水晶都会发出一道光束。", options: ["make", "makes", "making", "have made"], answer: "makes", explanation: "Each of... 作主语时按单数处理，所以动词用 makes。" },
  { id: "l5-04", level: 5, category: "clause", prompt: "I used a bow while the dragon ___ above the island.", meaning: "末影龙在岛屿上空飞行时，我使用了弓。", options: ["was flying", "flies", "will fly", "has fly"], answer: "was flying", explanation: "while 常连接持续进行的动作；过去情境用 was flying。" },
  { id: "l5-05", level: 5, category: "tense", prompt: "By tomorrow, we will have ___ the Ender Dragon.", meaning: "到明天，我们将已经击败末影龙。", options: ["defeat", "defeated", "defeating", "defeats"], answer: "defeated", explanation: "will have 后使用过去分词，构成将来完成时：will have defeated。" },
  { id: "l5-06", level: 5, category: "vocabulary", prompt: "What does “regenerate” mean in a boss fight?", meaning: "Boss 战中 regenerate 是什么意思？", options: ["恢复生命", "立即死亡", "丢弃物品", "停止飞行"], answer: "恢复生命", explanation: "Regenerate 表示“再生、恢复”，战斗中通常指恢复生命值。" },
  { id: "l5-07", level: 5, category: "clause", prompt: "Unless we break the crystals, the dragon ___ healing.", meaning: "除非我们摧毁水晶，否则末影龙会继续恢复生命。", options: ["will keep", "kept", "keep", "is kept"], answer: "will keep", explanation: "unless 表示“除非”；主句描述将来的结果，使用 will keep。" },
  { id: "l5-08", level: 5, category: "tense", prompt: "The dragon ___ when the final arrow hit it.", meaning: "最后一支箭击中时，末影龙正在飞行。", options: ["flew", "was flying", "has flown", "will fly"], answer: "was flying", explanation: "一个较长的过去动作被短动作打断，用过去进行时 was flying。" },
];
