// === data.js === データ定義
// ============================================================
// 🍞 エサの種類
// ============================================================
const FOOD_TYPES = [
  { id:'normal',    name:'普通のエサ',       icon:'🍞', baseCoinReward:1, baseGrowAmount:0.15, color:{r:210,g:160,b:60},  size:3,   basePrice:0,    desc:'基本のエサ。無料で使える' },
  { id:'premium',   name:'高級フレーク',     icon:'✨', baseCoinReward:2, baseGrowAmount:0.3,  color:{r:255,g:200,b:50},  size:3.5, basePrice:100,  desc:'報酬2倍。成長もちょっと早い' },
  { id:'royal',     name:'ロイヤルペレット', icon:'👑', baseCoinReward:4, baseGrowAmount:0.5,  color:{r:220,g:100,b:255}, size:4,   basePrice:500,  desc:'報酬4倍。育ちやすいけど寿命注意' },
  { id:'legendary', name:'伝説の生き餌',     icon:'🦐', baseCoinReward:8, baseGrowAmount:0.8,  color:{r:255,g:80,b:80},   size:4.5, basePrice:2000, desc:'報酬8倍！成長も早い…寿命も早い' },
];
let selectedFoodId = 'normal';
let foodLevels = { normal:1, premium:0, royal:0, legendary:0 };
let autoFeederLevel = 0;

function getFoodLevel(id) { return foodLevels[id] || 0; }
function isFoodUnlocked(id) { return getFoodLevel(id) >= 1; }
function getFoodCoinReward(id) {
  const ft = FOOD_TYPES.find(f => f.id === id); const lv = getFoodLevel(id);
  if (lv <= 0) return 0;
  return Math.round(ft.baseCoinReward * Math.pow(1.3, lv-1) * 10) / 10;
}
function getFoodGrowAmount(id) {
  const ft = FOOD_TYPES.find(f => f.id === id); const lv = getFoodLevel(id);
  if (lv <= 0) return 0;
  return +(ft.baseGrowAmount * (1 + (lv-1)*0.15)).toFixed(3);
}
function getFoodUpgradeCost(id) {
  const ft = FOOD_TYPES.find(f => f.id === id); const lv = getFoodLevel(id);
  if (lv >= 10) return Infinity;
  if (lv === 0) return ft.basePrice;
  if (ft.basePrice === 0) return Math.floor(10 * Math.pow(2, lv));
  return Math.floor(ft.basePrice * Math.pow(2.5, lv));
}
function getAutoFeederUpgradeCost() {
  if (autoFeederLevel >= 10) return Infinity;
  return Math.floor(300 * Math.pow(2.5, autoFeederLevel));
}
function getAutoFeederInterval() {
  if (autoFeederLevel <= 0) return Infinity;
  return Math.floor(900 - (autoFeederLevel-1)*65);
}
function getAutoFeederFoodCount() {
  if (autoFeederLevel <= 0) return 0;
  return 1 + Math.floor(autoFeederLevel / 3);
}
function getAutoFeederFoodType() {
  if (autoFeederLevel >= 10) return FOOD_TYPES.find(f => f.id === 'legendary');
  if (autoFeederLevel >= 7) return FOOD_TYPES.find(f => f.id === 'royal');
  if (autoFeederLevel >= 4) return FOOD_TYPES.find(f => f.id === 'premium');
  return FOOD_TYPES[0];
}
function getSelectedFood() { return FOOD_TYPES.find(f => f.id === selectedFoodId); }

// ============================================================
// 🐟 魚の種類（20種）
// ============================================================
const FISH_TYPES = [
  { id:'common', area:'freshwater', name:'ノーマル', icon:'🐟', shopPrice:0, unlocked:true, passiveIncome:1,
    sizeRange:[12,16], speedRange:[0.5,1.2], shape:'standard', bodyW:0.65, bodyH:0.45,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'random',
    palettes:[
      {body:'#ff6b6b',fin:'#ee5a5a',belly:'#ffaaaa'},
      {body:'#ffd93d',fin:'#f0c030',belly:'#fff3b0'},
      {body:'#6bcb77',fin:'#4caf50',belly:'#a5d6a7'},
      {body:'#4dabf7',fin:'#339af0',belly:'#a5d8ff'},
    ],
    desc:'元気いっぱいの普通の魚',
    greeting:'ノーマルだよ！元気いっぱい泳いでるよ～' },

  { id:'medaka', area:'freshwater', name:'メダカ', icon:'💛', shopPrice:2000, unlocked:false, passiveIncome:2,
    sizeRange:[8,11], speedRange:[0.6,1.3], shape:'standard', bodyW:0.6, bodyH:0.38,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'none',
    palettes:[
      {body:'#ff9a3c',fin:'#ff8020',belly:'#ffd0a0'},
      {body:'#f5f5f5',fin:'#ddd',belly:'#fff'},
      {body:'#ffeb3b',fin:'#fdd835',belly:'#fff9c4'},
    ],
    desc:'小さくてかわいいメダカ',
    greeting:'メダカだよ～小さいけど頑張ってるよ！' },

  { id:'neon', area:'freshwater', name:'ネオンテトラ', icon:'✨', shopPrice:5000, unlocked:false, passiveIncome:3,
    sizeRange:[9,13], speedRange:[0.8,1.5], shape:'standard', bodyW:0.65, bodyH:0.35,
    tailStyle:'fork', dorsalStyle:'normal', patternType:'neon', glowColor:'#00d4ff',
    palettes:[{body:'#00d4ff',fin:'#0099cc',belly:'#80eaff',stripe:'#ff3366'}],
    desc:'光る体が美しい。収入3倍',
    greeting:'ネオンテトラだよ！キラキラでしょ✨' },

  { id:'guppy', area:'freshwater', name:'グッピー', icon:'🌈', shopPrice:10000, unlocked:false, passiveIncome:5,
    sizeRange:[10,14], speedRange:[0.6,1.2], shape:'standard', bodyW:0.58, bodyH:0.4,
    tailStyle:'fan', dorsalStyle:'normal', patternType:'none',
    palettes:[
      {body:'#4dabf7',fin:'#e040fb',belly:'#b3e5fc'},
      {body:'#66bb6a',fin:'#ff7043',belly:'#c8e6c9'},
      {body:'#ffa726',fin:'#ab47bc',belly:'#ffe0b2'},
    ],
    desc:'カラフルな尻尾が自慢！',
    greeting:'グッピーだよ！しっぽが自慢なの♪' },

  { id:'platy', area:'freshwater', name:'プラティ', icon:'🍑', shopPrice:18000, unlocked:false, passiveIncome:7,
    sizeRange:[10,14], speedRange:[0.5,1.1], shape:'standard', bodyW:0.6, bodyH:0.42,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'none',
    palettes:[
      {body:'#ff5722',fin:'#e64a19',belly:'#ffab91'},
      {body:'#ffeb3b',fin:'#f9a825',belly:'#fff9c4'},
      {body:'#29b6f6',fin:'#0288d1',belly:'#b3e5fc'},
    ],
    desc:'丈夫で人懐っこい！',
    greeting:'プラティだよ！人懐っこいんだ～' },

  { id:'corydoras', area:'freshwater', name:'コリドラス', icon:'🐱', shopPrice:28000, unlocked:false, passiveIncome:9,
    sizeRange:[10,14], speedRange:[0.3,0.8], shape:'standard', bodyW:0.55, bodyH:0.46,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'dots', hasWhiskers:true, bottomDweller:true,
    palettes:[
      {body:'#a1887f',fin:'#8d6e63',belly:'#d7ccc8'},
      {body:'#90a4ae',fin:'#78909c',belly:'#cfd8dc'},
    ],
    desc:'底でもぐもぐ♪ 癒し系',
    greeting:'コリドラスだよ！底でもぐもぐ♪' },

  { id:'angel', area:'freshwater', name:'エンゼルフィッシュ', icon:'👼', shopPrice:55000, unlocked:false, passiveIncome:15,
    sizeRange:[18,24], speedRange:[0.3,0.8], shape:'standard', bodyW:0.5, bodyH:0.5,
    tailStyle:'tri', dorsalStyle:'tall', patternType:'vbands', hasVentralFin:true,
    palettes:[
      {body:'#f0f0f0',fin:'#ddd',belly:'#fff',stripe:'#333'},
      {body:'#ffd700',fin:'#e6c200',belly:'#fff3b0',stripe:'#996600'},
    ],
    desc:'優雅な泳ぎ。収入14倍',
    greeting:'エンゼルフィッシュだよ！優雅でしょ？' },

  { id:'betta', area:'freshwater', name:'ベタ', icon:'🌸', shopPrice:75000, unlocked:false, passiveIncome:18,
    sizeRange:[16,22], speedRange:[0.3,0.7], shape:'standard', bodyW:0.55, bodyH:0.42,
    tailStyle:'flowing', dorsalStyle:'flowing', patternType:'none',
    palettes:[
      {body:'#cc5de8',fin:'#9b30d1',belly:'#e599f7'},
      {body:'#e53935',fin:'#c62828',belly:'#ff8a80'},
      {body:'#1e88e5',fin:'#1565c0',belly:'#90caf9'},
    ],
    desc:'ヒラヒラの大きなヒレ',
    greeting:'ベタだよ！ヒラヒラ～綺麗でしょ？' },

  { id:'clown', area:'coral', name:'クマノミ', icon:'🐠', shopPrice:1100000, unlocked:false, passiveIncome:60,
    sizeRange:[11,15], speedRange:[0.5,1.0], shape:'standard', bodyW:0.55, bodyH:0.44,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'bands',
    palettes:[{body:'#ff6d00',fin:'#e65100',belly:'#ffab40',stripe:'#fff'}],
    desc:'白い帯がチャームポイント',
    greeting:'クマノミだよ！イソギンチャク探し中…' },

  { id:'discus', area:'coral', name:'ディスカス', icon:'🔮', shopPrice:2000000, unlocked:false, passiveIncome:100,
    sizeRange:[18,24], speedRange:[0.3,0.7], shape:'standard', bodyW:0.48, bodyH:0.52,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'swirl',
    palettes:[
      {body:'#e53935',fin:'#c62828',belly:'#ff8a80',stripe:'#1e88e5'},
      {body:'#1e88e5',fin:'#1565c0',belly:'#90caf9',stripe:'#ff6f00'},
      {body:'#43a047',fin:'#2e7d32',belly:'#a5d6a7',stripe:'#fdd835'},
    ],
    desc:'熱帯魚の王様！円盤型',
    greeting:'ディスカスだよ！熱帯魚の王様✨' },

  { id:'arowana', area:'tropical', name:'アロワナ', icon:'🐉', shopPrice:25000000, unlocked:false, passiveIncome:880,
    sizeRange:[28,36], speedRange:[0.4,0.8], shape:'standard', bodyW:0.85, bodyH:0.33,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'scales', hasWhiskers:true,
    palettes:[{body:'#ffd700',fin:'#daa520',belly:'#fff8dc',stripe:'#b8860b'}],
    desc:'伝説の龍魚。威厳がすごい',
    greeting:'アロワナだよ！龍みたいでしょ？' },

  { id:'mandarin', area:'coral', name:'マンダリンフィッシュ', icon:'🎨', shopPrice:2500000, unlocked:false, passiveIncome:120,
    sizeRange:[10,14], speedRange:[0.3,0.7], shape:'standard', bodyW:0.55, bodyH:0.46,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'swirl', glowColor:'rgba(0,180,255,0.3)',
    palettes:[{body:'#0097a7',fin:'#00838f',belly:'#80deea',stripe:'#ff6f00'}],
    desc:'世界一おしゃれな魚！',
    greeting:'マンダリンだよ！世界一おしゃれ♪' },

  { id:'seahorse', area:'coral', name:'タツノオトシゴ', icon:'🪸', shopPrice:3200000, unlocked:false, passiveIncome:150,
    sizeRange:[16,22], speedRange:[0.2,0.5], shape:'seahorse', bodyW:0.3, bodyH:0.8,
    tailStyle:'curl', dorsalStyle:'small', patternType:'none',
    palettes:[
      {body:'#ffb300',fin:'#ff8f00',belly:'#ffe082'},
      {body:'#e91e63',fin:'#c2185b',belly:'#f48fb1'},
    ],
    desc:'ゆらゆら泳ぐ不思議な姿',
    greeting:'タツノオトシゴだよ！ゆらゆら～' },

  { id:'puffer', area:'coral', name:'フグ', icon:'🐡', shopPrice:4000000, unlocked:false, passiveIncome:180,
    sizeRange:[14,20], speedRange:[0.3,0.7], shape:'puffer', bodyW:0.5, bodyH:0.5,
    tailStyle:'tiny', dorsalStyle:'small', patternType:'dots',
    palettes:[
      {body:'#a1887f',fin:'#8d6e63',belly:'#efebe9',stripe:'#5d4037'},
      {body:'#78909c',fin:'#546e7a',belly:'#eceff1',stripe:'#37474f'},
    ],
    desc:'ぷくぷく膨らむよ？',
    greeting:'フグだよ！ぷくぷく膨らむよ？' },

  { id:'butterfly', area:'coral', name:'チョウチョウウオ', icon:'🦋', shopPrice:6500000, unlocked:false, passiveIncome:270,
    sizeRange:[14,18], speedRange:[0.4,0.9], shape:'standard', bodyW:0.45, bodyH:0.5,
    tailStyle:'tri', dorsalStyle:'tall', patternType:'eyespot',
    palettes:[
      {body:'#ffd600',fin:'#ffab00',belly:'#fff9c4',stripe:'#1a1a2e'},
      {body:'#e0e0e0',fin:'#bdbdbd',belly:'#fafafa',stripe:'#ff6f00'},
    ],
    desc:'蝶のように美しい！',
    greeting:'チョウチョウウオだよ！蝶みたいでしょ？' },

  { id:'oarfish', area:'deepsea', name:'リュウグウノツカイ', icon:'🎏', shopPrice:2000000, unlocked:false, passiveIncome:100,
    sizeRange:[20,28], speedRange:[0.3,0.6], shape:'serpent', bodyW:1.2, bodyH:0.15,
    tailStyle:'long', dorsalStyle:'crest', patternType:'none',
    palettes:[{body:'#b0bec5',fin:'#e53935',belly:'#eceff1',stripe:'#c62828'}],
    desc:'深海からやってきた！超レア',
    greeting:'リュウグウノツカイだよ！深海から来たよ～' },

  { id:'coelacanth', area:'deepsea', name:'シーラカンス', icon:'🦕', shopPrice:12000000, unlocked:false, passiveIncome:520,
    sizeRange:[24,32], speedRange:[0.3,0.6], shape:'standard', bodyW:0.75, bodyH:0.42,
    tailStyle:'lobe', dorsalStyle:'normal', patternType:'scales',
    palettes:[{body:'#37474f',fin:'#263238',belly:'#546e7a',stripe:'#455a64'}],
    desc:'生きた化石！太古の魚',
    greeting:'シーラカンスだよ！生きた化石なんだ！' },

  { id:'manta', area:'deepsea', name:'マンタ', icon:'🦇', shopPrice:24000000, unlocked:false, passiveIncome:980,
    sizeRange:[30,40], speedRange:[0.3,0.6], shape:'manta', bodyW:1.0, bodyH:0.3,
    tailStyle:'whip', dorsalStyle:'none', patternType:'none',
    palettes:[{body:'#37474f',fin:'#263238',belly:'#eceff1'}],
    desc:'大きな翼で優雅に泳ぐ',
    greeting:'マンタだよ！大きい翼でしょ～？' },

  { id:'whaleshark', area:'deepsea', name:'ジンベエザメ', icon:'🐳', shopPrice:45000000, unlocked:false, passiveIncome:1750,
    sizeRange:[34,44], speedRange:[0.25,0.5], shape:'standard', bodyW:0.85, bodyH:0.4,
    tailStyle:'fork', dorsalStyle:'normal', patternType:'spots',
    palettes:[{body:'#455a64',fin:'#37474f',belly:'#cfd8dc',stripe:'#eceff1'}],
    desc:'優しい巨人。水槽の主',
    greeting:'ジンベエザメだよ！優しい巨人だよ✨' },

  { id:'dragongod', area:'mystic', name:'龍神', icon:'🐲', shopPrice:50000000, unlocked:false, passiveIncome:1500,
    sizeRange:[32,42], speedRange:[0.3,0.7], shape:'mythic', bodyW:0.9, bodyH:0.3,
    tailStyle:'flowing', dorsalStyle:'flowing', patternType:'scales',
    glowColor:'rgba(255,215,0,0.5)',
    palettes:[{body:'#ffd700',fin:'#ff6f00',belly:'#fff8e1',stripe:'#e65100'}],
    desc:'伝説の守り神。最強の魚',
    greeting:'龍神だよ…水槽の守り神じゃ' },

  // ===== 新魚：淡水 =====
  { id:'killifish', area:'freshwater', name:'キリフィッシュ', icon:'🌿', shopPrice:800, unlocked:false, passiveIncome:1,
    sizeRange:[8,11], speedRange:[0.7,1.4], shape:'standard', bodyW:0.58, bodyH:0.35,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'vstripes',
    palettes:[{body:'#e65100',fin:'#bf360c',belly:'#ffcc80',stripe:'#fff3e0'},{body:'#1565c0',fin:'#0d47a1',belly:'#90caf9',stripe:'#bbdefb'}],
    desc:'小さくてカラフルな熱帯魚',
    greeting:'キリフィッシュだよ！ちっちゃいでしょ？' },
  { id:'loach', area:'freshwater', name:'ドジョウ', icon:'🐍', shopPrice:40000, unlocked:false, passiveIncome:12,
    sizeRange:[16,22], speedRange:[0.3,0.7], shape:'serpent', bodyW:0.9, bodyH:0.15,
    tailStyle:'long', dorsalStyle:'small', patternType:'dots', hasWhiskers:true, bottomDweller:true,
    palettes:[{body:'#8d6e63',fin:'#6d4c41',belly:'#d7ccc8',stripe:'#a1887f'}],
    desc:'底でもぞもぞ。ヒゲがチャームポイント',
    greeting:'ドジョウだよ～底が落ち着くんだ♪' },
  { id:'goldfish', area:'freshwater', name:'金魚', icon:'🏮', shopPrice:100000, unlocked:false, passiveIncome:22,
    sizeRange:[14,20], speedRange:[0.4,0.9], shape:'standard', bodyW:0.5, bodyH:0.48,
    tailStyle:'flowing', dorsalStyle:'flowing', patternType:'none',
    palettes:[{body:'#ff3d00',fin:'#dd2c00',belly:'#ffab91'},{body:'#fff176',fin:'#fff9c4',belly:'#ffffff'}],
    desc:'ひらひら優雅な和の魚',
    greeting:'金魚だよ～ひらひら～♪' },
  { id:'koi', area:'freshwater', name:'錦鯉', icon:'🎏', shopPrice:140000, unlocked:false, passiveIncome:28,
    sizeRange:[22,30], speedRange:[0.3,0.7], shape:'standard', bodyW:0.75, bodyH:0.38,
    tailStyle:'fan', dorsalStyle:'normal', patternType:'bands',
    palettes:[{body:'#ffffff',fin:'#ffccbc',belly:'#fff',stripe:'#ff3d00'},{body:'#ffd600',fin:'#ff6f00',belly:'#fff8e1',stripe:'#e65100'}],
    desc:'泳ぐ宝石。和の象徴',
    greeting:'錦鯉だよ！泳ぐ宝石って呼ばれてるの✨' },
  { id:'axolotl', area:'freshwater', name:'ウーパールーパー', icon:'🩷', shopPrice:200000, unlocked:false, passiveIncome:35,
    sizeRange:[16,22], speedRange:[0.2,0.5], shape:'puffer', bodyW:0.5, bodyH:0.45,
    tailStyle:'tiny', dorsalStyle:'small', patternType:'dots',
    palettes:[{body:'#ffcdd2',fin:'#ef9a9a',belly:'#fff',stripe:'#e57373'},{body:'#e0e0e0',fin:'#bdbdbd',belly:'#fafafa',stripe:'#9e9e9e'}],
    desc:'にっこり笑顔の癒し系',
    greeting:'ウーパールーパーだよ！にこっ☺' },
  { id:'arapaima', area:'freshwater', name:'ピラルクー', icon:'🐊', shopPrice:300000, unlocked:false, passiveIncome:45,
    sizeRange:[32,42], speedRange:[0.3,0.6], shape:'standard', bodyW:0.9, bodyH:0.35,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'scales',
    palettes:[{body:'#455a64',fin:'#37474f',belly:'#78909c',stripe:'#e53935'}],
    desc:'世界最大級の淡水魚！',
    greeting:'ピラルクーだよ！でっかいでしょ？' },

  // ===== 新魚：サンゴ礁 =====
  { id:'surgeonfish', area:'coral', name:'ナンヨウハギ', icon:'💙', shopPrice:500000, unlocked:false, passiveIncome:30,
    sizeRange:[12,16], speedRange:[0.5,1.1], shape:'standard', bodyW:0.52, bodyH:0.48,
    tailStyle:'fork', dorsalStyle:'normal', patternType:'bands',
    palettes:[{body:'#1565c0',fin:'#0d47a1',belly:'#42a5f5',stripe:'#ffd600'}],
    desc:'青と黄色のサンゴの人気者',
    greeting:'ナンヨウハギだよ！ドリーって呼んで♪' },
  { id:'lionfish', area:'coral', name:'ミノカサゴ', icon:'🦁', shopPrice:800000, unlocked:false, passiveIncome:45,
    sizeRange:[16,22], speedRange:[0.3,0.7], shape:'standard', bodyW:0.55, bodyH:0.45,
    tailStyle:'flowing', dorsalStyle:'tall', patternType:'vstripes',
    palettes:[{body:'#d32f2f',fin:'#b71c1c',belly:'#ffcdd2',stripe:'#fff'}],
    desc:'美しくも危険なヒレ持ち',
    greeting:'ミノカサゴだよ！ヒレに触らないでね！' },
  { id:'moorishidol', area:'coral', name:'ツノダシ', icon:'🏹', shopPrice:1500000, unlocked:false, passiveIncome:80,
    sizeRange:[14,20], speedRange:[0.4,0.9], shape:'standard', bodyW:0.4, bodyH:0.55,
    tailStyle:'tri', dorsalStyle:'tall', patternType:'vbands',
    palettes:[{body:'#fff176',fin:'#ffd600',belly:'#fff9c4',stripe:'#212121'}],
    desc:'長いツノがトレードマーク',
    greeting:'ツノダシだよ！このツノ、カッコいいでしょ？' },
  { id:'triggerfish', area:'coral', name:'モンガラカワハギ', icon:'🎯', shopPrice:5000000, unlocked:false, passiveIncome:220,
    sizeRange:[14,20], speedRange:[0.4,0.8], shape:'standard', bodyW:0.55, bodyH:0.5,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'dots',
    palettes:[{body:'#1a237e',fin:'#283593',belly:'#e8eaf6',stripe:'#ffd600'}],
    desc:'ド派手な水玉模様！',
    greeting:'モンガラカワハギだよ！派手でしょ～？' },
  { id:'napoleonfish', area:'coral', name:'ナポレオンフィッシュ', icon:'🫅', shopPrice:8000000, unlocked:false, passiveIncome:330,
    sizeRange:[26,34], speedRange:[0.3,0.6], shape:'standard', bodyW:0.7, bodyH:0.45,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'scales',
    palettes:[{body:'#1565c0',fin:'#0d47a1',belly:'#64b5f6',stripe:'#0d47a1'}],
    desc:'でっかいオデコの王者',
    greeting:'ナポレオンフィッシュだよ！このオデコが自慢！' },
  { id:'seaturtle', area:'coral', name:'ウミガメ', icon:'🐢', shopPrice:10000000, unlocked:false, passiveIncome:400,
    sizeRange:[28,36], speedRange:[0.25,0.5], shape:'manta', bodyW:0.8, bodyH:0.35,
    tailStyle:'whip', dorsalStyle:'none', patternType:'scales',
    palettes:[{body:'#2e7d32',fin:'#1b5e20',belly:'#a5d6a7',stripe:'#388e3c'}],
    desc:'悠々と泳ぐ海の旅人',
    greeting:'ウミガメだよ～のんびり旅してるの🌊' },

  // ===== 新魚：深海 =====
  { id:'anglerfish', area:'deepsea', name:'チョウチンアンコウ', icon:'🔦', shopPrice:3500000, unlocked:false, passiveIncome:160,
    sizeRange:[14,20], speedRange:[0.2,0.5], shape:'puffer', bodyW:0.55, bodyH:0.5,
    tailStyle:'tiny', dorsalStyle:'small', patternType:'none',
    glowColor:'rgba(100,255,100,0.4)',
    palettes:[{body:'#37474f',fin:'#263238',belly:'#455a64',stripe:'#69f0ae'}],
    desc:'暗闇で光る不思議な釣り竿',
    greeting:'チョウチンアンコウだよ…光についてきて…' },
  { id:'viperfish', area:'deepsea', name:'ホウライエソ', icon:'🗡️', shopPrice:5500000, unlocked:false, passiveIncome:250,
    sizeRange:[14,20], speedRange:[0.4,0.9], shape:'standard', bodyW:0.7, bodyH:0.3,
    tailStyle:'fork', dorsalStyle:'normal', patternType:'neon',
    glowColor:'rgba(0,255,136,0.4)',
    palettes:[{body:'#212121',fin:'#111',belly:'#424242',stripe:'#00ff88'}],
    desc:'鋭い牙と光る体',
    greeting:'ホウライエソだよ…この牙、怖い？' },
  { id:'giantisopod', area:'deepsea', name:'ダイオウグソクムシ', icon:'🪲', shopPrice:8000000, unlocked:false, passiveIncome:360,
    sizeRange:[16,22], speedRange:[0.15,0.4], shape:'puffer', bodyW:0.55, bodyH:0.5,
    tailStyle:'tiny', dorsalStyle:'small', patternType:'scales', bottomDweller:true,
    palettes:[{body:'#78909c',fin:'#546e7a',belly:'#b0bec5',stripe:'#607d8b'}],
    desc:'深海のダンゴムシ。大人気！',
    greeting:'グソクムシだよ…じっとしてるのが好き…' },
  { id:'gulpereel', area:'deepsea', name:'フクロウナギ', icon:'👄', shopPrice:17000000, unlocked:false, passiveIncome:720,
    sizeRange:[18,26], speedRange:[0.2,0.5], shape:'serpent', bodyW:1.0, bodyH:0.2,
    tailStyle:'long', dorsalStyle:'small', patternType:'none',
    glowColor:'rgba(255,50,100,0.3)',
    palettes:[{body:'#212121',fin:'#d32f2f',belly:'#424242',stripe:'#ff5252'}],
    desc:'巨大な口が特徴の深海魚',
    greeting:'フクロウナギだよ…お口おっきいでしょ？' },
  { id:'vampiresquid', area:'deepsea', name:'メンダコ', icon:'👻', shopPrice:33000000, unlocked:false, passiveIncome:1300,
    sizeRange:[16,22], speedRange:[0.2,0.5], shape:'manta', bodyW:0.7, bodyH:0.4,
    tailStyle:'whip', dorsalStyle:'none', patternType:'none',
    glowColor:'rgba(255,51,102,0.4)',
    palettes:[{body:'#c62828',fin:'#b71c1c',belly:'#ef9a9a',stripe:'#ff5252'}],
    desc:'深海の幽霊。ひらひら漂う',
    greeting:'メンダコだよ…ふわふわ～👻' },
  { id:'barreleye', area:'deepsea', name:'デメニギス', icon:'🔮', shopPrice:60000000, unlocked:false, passiveIncome:2300,
    sizeRange:[12,18], speedRange:[0.2,0.5], shape:'standard', bodyW:0.6, bodyH:0.45,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'none',
    glowColor:'rgba(0,255,204,0.5)',
    palettes:[{body:'rgba(100,130,160,0.6)',fin:'rgba(80,110,140,0.5)',belly:'rgba(200,220,240,0.4)',stripe:'#00ffcc'}],
    desc:'透明な頭の中に緑の目！',
    greeting:'デメニギスだよ…頭の中、見える？' },

  // ===== 新魚：熱帯河川 =====
  { id:'piranha', area:'tropical', name:'ピラニア', icon:'😈', shopPrice:15000000, unlocked:false, passiveIncome:550,
    sizeRange:[12,16], speedRange:[0.6,1.2], shape:'standard', bodyW:0.5, bodyH:0.48,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'none',
    palettes:[{body:'#546e7a',fin:'#37474f',belly:'#e53935',stripe:'#c62828'}],
    desc:'小さいけど凶暴！群れが怖い',
    greeting:'ピラニアだよ！ガブッ！…なんてね😈' },
  { id:'oscar', area:'tropical', name:'オスカー', icon:'🔥', shopPrice:40000000, unlocked:false, passiveIncome:1400,
    sizeRange:[18,24], speedRange:[0.3,0.7], shape:'standard', bodyW:0.6, bodyH:0.42,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'spots',
    palettes:[{body:'#37474f',fin:'#263238',belly:'#455a64',stripe:'#ff6d00'}],
    desc:'賢くて人懐っこい大型魚',
    greeting:'オスカーだよ！ご飯まだ？🔥' },
  { id:'stingray', area:'tropical', name:'淡水エイ', icon:'🌀', shopPrice:65000000, unlocked:false, passiveIncome:2200,
    sizeRange:[22,30], speedRange:[0.25,0.5], shape:'manta', bodyW:0.9, bodyH:0.3,
    tailStyle:'whip', dorsalStyle:'none', patternType:'dots',
    palettes:[{body:'#5d4037',fin:'#4e342e',belly:'#d7ccc8',stripe:'#fff176'}],
    desc:'水玉模様の美しいエイ',
    greeting:'淡水エイだよ～水玉がチャームポイント♪' },
  { id:'flowerhorn', area:'tropical', name:'フラワーホーン', icon:'🌺', shopPrice:100000000, unlocked:false, passiveIncome:3300,
    sizeRange:[20,28], speedRange:[0.3,0.7], shape:'standard', bodyW:0.55, bodyH:0.5,
    tailStyle:'tri', dorsalStyle:'tall', patternType:'swirl',
    palettes:[{body:'#e53935',fin:'#c62828',belly:'#ff8a80',stripe:'#ffd600'}],
    desc:'立派なコブが福を呼ぶ！',
    greeting:'フラワーホーンだよ！このコブ、縁起いいの✨' },
  { id:'redtailcatfish', area:'tropical', name:'レッドテールキャット', icon:'🐱', shopPrice:160000000, unlocked:false, passiveIncome:5100,
    sizeRange:[30,38], speedRange:[0.25,0.5], shape:'standard', bodyW:0.8, bodyH:0.38,
    tailStyle:'tri', dorsalStyle:'normal', patternType:'bands', hasWhiskers:true,
    palettes:[{body:'#37474f',fin:'#263238',belly:'#eceff1',stripe:'#e53935'}],
    desc:'赤い尻尾の巨大ナマズ',
    greeting:'レッドテールキャットだよ！大きくなるよ～' },
  { id:'electriceel', area:'tropical', name:'デンキウナギ', icon:'⚡', shopPrice:250000000, unlocked:false, passiveIncome:7800,
    sizeRange:[22,30], speedRange:[0.3,0.6], shape:'serpent', bodyW:1.1, bodyH:0.15,
    tailStyle:'long', dorsalStyle:'small', patternType:'neon',
    glowColor:'rgba(255,255,0,0.4)',
    palettes:[{body:'#37474f',fin:'#263238',belly:'#78909c',stripe:'#ffff00'}],
    desc:'ビリビリ電気の危険な奴',
    greeting:'デンキウナギだよ⚡ ビリッとしちゃうぞ！' },

  // ===== 新魚：神秘 =====
  { id:'phoenix', area:'mystic', name:'鳳凰魚', icon:'🔥', shopPrice:90000000, unlocked:false, passiveIncome:2600,
    sizeRange:[28,36], speedRange:[0.3,0.7], shape:'mythic', bodyW:0.85, bodyH:0.3,
    tailStyle:'flowing', dorsalStyle:'flowing', patternType:'scales',
    glowColor:'rgba(255,100,0,0.5)',
    palettes:[{body:'#ff6d00',fin:'#dd2c00',belly:'#ffe0b2',stripe:'#ff3d00'}],
    desc:'炎をまとう不死鳥の魚',
    greeting:'鳳凰魚だよ…炎の翼で舞うのじゃ🔥' },
  { id:'leviathan', area:'mystic', name:'リヴァイアサン', icon:'🌊', shopPrice:150000000, unlocked:false, passiveIncome:4200,
    sizeRange:[34,44], speedRange:[0.2,0.5], shape:'serpent', bodyW:1.3, bodyH:0.18,
    tailStyle:'long', dorsalStyle:'crest', patternType:'scales',
    glowColor:'rgba(0,100,255,0.4)',
    palettes:[{body:'#0d47a1',fin:'#1a237e',belly:'#42a5f5',stripe:'#82b1ff'}],
    desc:'海の底に潜む伝説の巨獣',
    greeting:'リヴァイアサンだ…深淵より来たり…' },
  { id:'moonjellyfish', area:'mystic', name:'月光クラゲ', icon:'🌙', shopPrice:250000000, unlocked:false, passiveIncome:6800,
    sizeRange:[18,26], speedRange:[0.15,0.4], shape:'seahorse', bodyW:0.4, bodyH:0.6,
    tailStyle:'curl', dorsalStyle:'small', patternType:'none',
    glowColor:'rgba(200,200,255,0.5)',
    palettes:[{body:'rgba(180,180,255,0.7)',fin:'rgba(150,150,230,0.5)',belly:'rgba(220,220,255,0.6)'}],
    desc:'月の光を宿す幻のクラゲ',
    greeting:'月光クラゲだよ…月の光をあげる🌙' },
  { id:'crystaldragon', area:'mystic', name:'水晶龍', icon:'💎', shopPrice:400000000, unlocked:false, passiveIncome:10500,
    sizeRange:[32,42], speedRange:[0.3,0.6], shape:'mythic', bodyW:0.9, bodyH:0.3,
    tailStyle:'flowing', dorsalStyle:'flowing', patternType:'scales',
    glowColor:'rgba(180,100,255,0.5)',
    palettes:[{body:'rgba(180,140,255,0.8)',fin:'#7c4dff',belly:'rgba(220,200,255,0.6)',stripe:'#b388ff'}],
    desc:'水晶の鱗を持つ神龍',
    greeting:'水晶龍だよ…この鱗、綺麗でしょ？💎' },
  { id:'cosmicwhale', area:'mystic', name:'宇宙クジラ', icon:'🌌', shopPrice:650000000, unlocked:false, passiveIncome:16500,
    sizeRange:[36,46], speedRange:[0.2,0.4], shape:'manta', bodyW:1.1, bodyH:0.35,
    tailStyle:'whip', dorsalStyle:'none', patternType:'spots',
    glowColor:'rgba(100,0,200,0.4)',
    palettes:[{body:'#1a0a3a',fin:'#0a0020',belly:'#311b92',stripe:'#e0e0e0'}],
    desc:'星空を泳ぐ超巨大クジラ',
    greeting:'宇宙クジラだよ…星の海を旅してきたの🌌' },
  { id:'worldserpent', area:'mystic', name:'世界蛇', icon:'🐍', shopPrice:1000000000, unlocked:false, passiveIncome:25000,
    sizeRange:[36,46], speedRange:[0.25,0.5], shape:'serpent', bodyW:1.4, bodyH:0.2,
    tailStyle:'long', dorsalStyle:'crest', patternType:'scales',
    glowColor:'rgba(0,255,100,0.5)',
    palettes:[{body:'#1b5e20',fin:'#2e7d32',belly:'#a5d6a7',stripe:'#69f0ae'}],
    desc:'世界を一周する伝説の大蛇',
    greeting:'世界蛇だ…万物の始まりと終わりを見てきた…' },
];

// ============================================================
// 🔧 設備アップグレード
// ============================================================
const UPGRADES = [
  { id:'treasureGen', name:'お宝バブル装置', icon:'💎', price:800, desc:'お宝バブルが出やすくなる', owned:false },
  { id:'breedBoost', name:'繁殖サポーター', icon:'💕', price:2000, desc:'魚の繁殖確率2倍！', owned:false },
];

const FISH_SVGS = {
  'common': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M 30 64 C 30 40 70 30 90 40 C 110 50 110 70 90 80 C 70 90 30 88 30 64 Z' fill='%238DA6AD'/> <path d='M 90 60 C 95 50 105 45 115 50 C 120 55 120 75 115 80 C 105 85 95 80 90 70 Z' fill='%238DA6AD'/> <path d='M 50 40 C 55 30 65 25 70 30 C 65 35 55 38 50 40 Z' fill='%238DA6AD'/> <path d='M 50 88 C 55 98 65 103 70 98 C 65 93 55 90 50 88 Z' fill='%238DA6AD'/> <circle cx='65' cy='55' r='12' fill='white'/> <circle cx='67' cy='57' r='8' fill='black'/> <circle cx='70' cy='52' r='3' fill='white'/> <path d='M 40 68 Q 45 72 50 68' stroke='black' stroke-width='2' fill='none'/> <path d='M 50 50 Q 55 58 50 65' stroke='black' stroke-width='1.5' fill='none'/> </svg>",
  'medaka': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'> <path d='M20 64C20 40 35 30 50 30H75C90 30 100 40 100 64C100 88 90 98 75 98H50C35 98 20 88 20 64Z' fill='%23FFD700'/> <path d='M100 64C100 88 90 98 75 98H50C35 98 20 88 20 64C20 40 35 30 50 30H75C90 30 100 40 100 64Z' stroke='%23CCAA00' stroke-width='2'/> <path d='M100 64C100 64 110 54 115 50L117 64L115 78C110 74 100 64 100 64Z' fill='%23FFD700'/> <path d='M100 64C100 64 110 54 115 50L117 64L115 78C110 74 100 64 100 64Z' stroke='%23CCAA00' stroke-width='2'/> <ellipse cx='60' cy='55' rx='10' ry='12' fill='white'/> <ellipse cx='62' cy='56' rx='5' ry='6' fill='black'/> <circle cx='64' cy='53' r='2' fill='white'/> <path d='M50 80C55 85 65 85 70 80' stroke='black' stroke-width='2' stroke-linecap='round'/> <path d='M60 40C60 35 55 30 50 30C45 30 40 35 40 40' stroke='%23CCAA00' stroke-width='2'/> <path d='M70 40C70 35 75 30 80 30C85 30 90 35 90 40' stroke='%23CCAA00' stroke-width='2'/> <path d='M50 88C50 93 55 98 60 98C65 98 70 93 70 88' stroke='%23CCAA00' stroke-width='2'/> <path d='M80 88C80 93 85 98 90 98C95 98 100 93 100 88' stroke='%23CCAA00' stroke-width='2'/> </svg>",
  'neon': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M25 64 C25 40 70 30 100 45 C110 50 115 60 110 70 C100 85 70 90 25 64Z' fill='%23ff69b4'/> <path d='M100 45 L115 35 L120 64 L115 90 L100 70 Z' fill='%23DA70D6'/> <path d='M70 45 L75 35 L80 45 Z' fill='%23DA70D6'/> <path d='M70 80 L75 90 L80 80 Z' fill='%23DA70D6'/> <path d='M28 58 C28 50 70 40 95 50 C100 52 100 58 95 60 C70 70 28 66 28 58Z' fill='%2300bfff'/> <path d='M28 68 C28 60 70 50 95 60 C100 62 100 68 95 70 C70 80 28 76 28 68Z' fill='%23ff0000'/> <circle cx='45' cy='55' r='10' fill='white'/> <circle cx='48' cy='58' r='5' fill='black'/> <circle cx='45' cy='55' r='3' fill='white' opacity='0.8'/> <circle cx='47' cy='57' r='1.5' fill='white' opacity='0.8'/> </svg>",
  'guppy': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M 30 55 C 20 65, 20 75, 30 85 L 50 85 C 60 85, 70 75, 70 65 C 70 55, 60 45, 50 45 L 30 55 Z' fill='%23FFC0CB'/> <path d='M 25 65 C 25 55, 35 45, 45 45 C 50 45, 55 55, 55 65 C 55 75, 50 85, 45 85 C 35 85, 25 75, 25 65 Z' fill='%23FFECB3'/> <circle cx='40' cy='58' r='8' fill='black'/> <circle cx='43' cy='55' r='3' fill='white'/> <path d='M 50 45 C 60 35, 70 35, 75 45 C 70 45, 60 50, 50 45 Z' fill='%2390EE90'/> <path d='M 45 75 C 50 80, 55 75, 50 70 C 45 65, 40 70, 45 75 Z' fill='%23ADD8E6'/> <path d='M 70 65 C 80 50, 90 40, 110 45 C 105 55, 100 65, 110 75 C 90 80, 80 70, 70 65 Z' fill='url(%23rainbowGradient)'/> <defs> <linearGradient id='rainbowGradient' x1='0%' y1='0%' x2='100%' y2='0%'> <stop offset='0%' style='stop-color:red;stop-opacity:1' /> <stop offset='16.6%' style='stop-color:orange;stop-opacity:1' /> <stop offset='33.3%' style='stop-color:yellow;stop-opacity:1' /> <stop offset='50%' style='stop-color:green;stop-opacity:1' /> <stop offset='66.6%' style='stop-color:blue;stop-opacity:1' /> <stop offset='83.3%' style='stop-color:indigo;stop-opacity:1' /> <stop offset='100%' style='stop-color:violet;stop-opacity:1' /> </linearGradient> </defs> </svg>",
  'platy': "data:image/svg+xml,<svg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M30 64 C30 35, 75 30, 95 64 C75 98, 30 93, 30 64' fill='%23FF5733'/> <path d='M95 64 C100 50, 115 55, 120 64 C115 73, 100 78, 95 64' fill='%23FF5733'/> <path d='M60 40 C65 30, 75 35, 70 45 L60 40' fill='%23FF5733'/> <path d='M55 88 C60 98, 70 93, 65 83 L55 88' fill='%23FF5733'/> <ellipse cx='45' cy='64' rx='4' ry='8' fill='%23FF7F50' transform='rotate(5 45 64)'/> <circle cx='58' cy='55' r='10' fill='white'/> <circle cx='62' cy='58' r='6' fill='black'/> <circle cx='64' cy='54' r='2' fill='white'/> <path d='M35 70 Q40 75, 45 70' stroke='black' stroke-width='2' fill='none'/> </svg>",
  'corydoras': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M 30 70 C 20 50, 40 30, 70 30 C 100 30, 110 50, 100 70 C 90 90, 60 90, 30 70 Z' fill='%23b0c4de'/> <path d='M 100 70 C 105 75, 110 70, 115 65 C 110 60, 105 55, 100 60 Z' fill='%23a8d8e0'/> <path d='M 60 30 C 65 20, 75 20, 80 30 C 75 35, 65 35, 60 30 Z' fill='%23a8d8e0'/> <path d='M 40 75 C 35 80, 40 85, 45 80 C 50 75, 45 70, 40 75 Z' fill='%23a8d8e0'/> <path d='M 70 85 C 75 90, 80 90, 85 85 C 80 80, 75 80, 70 85 Z' fill='%23a8d8e0'/> <circle cx='50' cy='45' r='3' fill='%238090a0'/> <circle cx='65' cy='40' r='2' fill='%238090a0'/> <circle cx='75' cy='50' r='4' fill='%238090a0'/> <circle cx='60' cy='60' r='3' fill='%238090a0'/> <circle cx='85' cy='60' r='2' fill='%238090a0'/> <circle cx='55' cy='48' r='8' fill='white'/> <circle cx='55' cy='48' r='5' fill='black'/> <circle cx='57' cy='46' r='2' fill='white'/> <path d='M 30 65 C 35 68, 35 62, 30 65 Z' fill='none' stroke='black' stroke-width='1.5'/> <path d='M 30 65 Q 25 60, 20 65' fill='none' stroke='black' stroke-width='1.5'/> <path d='M 30 65 Q 25 70, 20 75' fill='none' stroke='black' stroke-width='1.5'/> <path d='M 30 68 Q 28 72, 23 72' fill='none' stroke='black' stroke-width='1.5'/> </svg>",
  'angel': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'> <defs> <linearGradient id='stripes' x1='0%' y1='0%' x2='100%' y2='0%'> <stop offset='0%' stop-color='%23FFDD00'/> <stop offset='15%' stop-color='%23FFDD00'/> <stop offset='15%' stop-color='%23FFFFFF'/> <stop offset='30%' stop-color='%23FFFFFF'/> <stop offset='30%' stop-color='%23FFDD00'/> <stop offset='45%' stop-color='%23FFDD00'/> <stop offset='45%' stop-color='%23FFFFFF'/> <stop offset='60%' stop-color='%23FFFFFF'/> <stop offset='60%' stop-color='%23FFDD00'/> <stop offset='75%' stop-color='%23FFDD00'/> <stop offset='75%' stop-color='%23FFFFFF'/> <stop offset='90%' stop-color='%23FFFFFF'/> <stop offset='90%' stop-color='%23FFDD00'/> <stop offset='100%' stop-color='%23FFDD00'/> </linearGradient> </defs> <path d='M64 16L96 64L64 112L32 64L64 16Z' fill='url(%23stripes)' stroke='%23000000' stroke-width='2'/> <path d='M64 16C70 10 75 10 75 10C85 15 90 20 90 20L96 64C90 50 75 30 64 16Z' fill='%23FFAAAA' stroke='%23000000' stroke-width='2'/> <path d='M64 16C58 10 53 10 53 10C43 15 38 20 38 20L32 64C38 50 53 30 64 16Z' fill='%23FFAAAA' stroke='%23000000' stroke-width='2'/> <path d='M64 112C70 118 75 118 75 118C85 113 90 108 90 108L96 64C90 78 75 98 64 112Z' fill='%23FFAAAA' stroke='%23000000' stroke-width='2'/> <path d='M64 112C58 118 53 118 53 118C43 113 38 108 38 108L32 64C38 78 53 98 64 112Z' fill='%23FFAAAA' stroke='%23000000' stroke-width='2'/> <path d='M96 64C105 60 115 55 120 50C125 55 125 73 120 78C115 73 105 68 96 64Z' fill='%23FFAAAA' stroke='%23000000' stroke-width='2'/> <path d='M78 58C80 59 80 62 78 63' stroke='%23000000' stroke-width='2' stroke-linecap='round'/> <circle cx='70' cy='50' r='10' fill='%23FFFFFF' stroke='%23000000' stroke-width='2'/> <circle cx='73' cy='53' r='4' fill='%23000000'/> <circle cx='74' cy='52' r='1.5' fill='%23FFFFFF'/> </svg>",
  'betta': "data:image/svg+xml,<svg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <linearGradient id='bodyGradient' x1='0%' y1='0%' x2='100%' y2='0%'> <stop offset='0%' style='stop-color:%23FF69B4' /> <stop offset='100%' style='stop-color:%23DA70D6' /> </linearGradient> <linearGradient id='finGradient' x1='0%' y1='0%' x2='100%' y2='0%'> <stop offset='0%' style='stop-color:%23DA70D6' /> <stop offset='100%' style='stop-color:%23FF6347' /> </linearGradient> </defs> <ellipse cx='60' cy='64' rx='30' ry='20' fill='url(%23bodyGradient)' /> <path d='M78 64 Q85 50 90 60 Q85 78 78 64 Z' fill='url(%23bodyGradient)' /> <path d='M55 45 Q70 20 85 40 Q75 55 55 45 Z' fill='url(%23finGradient)' stroke='%238A2BE2' stroke-width='1' /> <path d='M85 64 Q105 40 120 55 Q100 70 120 80 Q105 95 85 64 Z' fill='url(%23finGradient)' stroke='%238A2BE2' stroke-width='1' /> <path d='M55 80 Q70 105 85 85 Q75 70 55 80 Z' fill='url(%23finGradient)' stroke='%238A2BE2' stroke-width='1' /> <path d='M45 70 Q55 80 65 70 Q55 60 45 70 Z' fill='url(%23finGradient)' opacity='0.8' /> <circle cx='50' cy='55' r='8' fill='white' /> <circle cx='50' cy='55' r='4' fill='black' /> <circle cx='52' cy='53' r='1.5' fill='white' /> </svg>",
  'clown': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='60' cy='64' rx='45' ry='30' fill='%23FF8C00'/> <path d='M95 64 C105 54, 105 74, 95 64 Z' fill='%23FF8C00'/> <path d='M100 64 C105 50, 120 50, 115 64 C120 78, 105 78, 100 64 Z' fill='%23FF8C00'/> <path d='M40 38 C45 30, 55 30, 50 38 C55 46, 45 46, 40 38 Z' fill='%23FF8C00'/> <path d='M35 75 C40 65, 50 65, 45 75 C50 85, 40 85, 35 75 Z' fill='%23FF8C00'/> <rect x='25' y='40' width='10' height='48' fill='white' rx='3' ry='3'/> <rect x='55' y='38' width='10' height='52' fill='white' rx='3' ry='3'/> <rect x='85' y='40' width='10' height='48' fill='white' rx='3' ry='3'/> <circle cx='38' cy='50' r='10' fill='white'/> <circle cx='38' cy='50' r='6' fill='black'/> <circle cx='41' cy='48' r='2' fill='white'/> </svg>",
  'discus': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='60' cy='64' rx='45' ry='40' fill='%23FFC0CB'/> <ellipse cx='60' cy='64' rx='43' ry='38' fill='%23ADD8E6'/> <path d='M60 24 C50 10, 40 20, 45 40 L60 24' fill='%23FFA07A'/> <path d='M60 104 C50 118, 40 108, 45 88 L60 104' fill='%23FFA07A'/> <path d='M95 64 C110 50, 110 78, 95 64' fill='%23FFA07A'/> <path d='M25 60 C30 50, 35 55, 30 65 L25 60' fill='%23C0C0C0'/> <circle cx='40' cy='50' r='8' fill='%23FFFFFF'/> <circle cx='42' cy='52' r='5' fill='%23000000'/> <circle cx='44' cy='49' r='2' fill='%23FFFFFF'/> </svg>",
  'arowana': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M20 55 C10 65 10 75 20 85 L100 85 C115 85 120 75 115 65 C120 55 115 45 100 45 L20 45 Z' fill='%23C0C0C0' stroke='%23808080' stroke-width='2'/> <ellipse cx='40' cy='65' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='55' cy='65' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='70' cy='65' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='85' cy='65' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='47' cy='55' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='62' cy='55' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='77' cy='55' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='47' cy='75' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='62' cy='75' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <ellipse cx='77' cy='75' rx='7' ry='5' fill='%23E0E0E0' stroke='%23A0A0A0' stroke-width='1'/> <path d='M70 45 L90 35 L85 45 Z' fill='%23D3D3D3' stroke='%23A0A0A0' stroke-width='1'/> <path d='M70 85 L90 95 L85 85 Z' fill='%23D3D3D3' stroke='%23A0A0A0' stroke-width='1'/> <path d='M100 45 C110 35 120 40 115 65 C120 90 110 95 100 85 Z' fill='%23D3D3D3' stroke='%23A0A0A0' stroke-width='2'/> <ellipse cx='35' cy='75' rx='8' ry='5' transform='rotate(-20 35 75)' fill='%23D3D3D3' stroke='%23A0A0A0' stroke-width='1'/> <path d='M20 55 C25 50 35 50 40 55 C40 80 25 80 20 85 Z' fill='%23C0C0C0' stroke='%23808080' stroke-width='2'/> <circle cx='35' cy='60' r='10' fill='white' stroke='black' stroke-width='2'/> <circle cx='38' cy='63' r='4' fill='black'/> <circle cx='32' cy='58' r='2' fill='white'/> <circle cx='36' cy='60' r='1' fill='white'/> <path d='M25 70 C30 70 30 73 25 73' stroke='black' stroke-width='1' fill='none'/> </svg>",
  'mandarin': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M20 64 C20 30, 80 30, 100 60 C110 90, 80 98, 20 64' fill='%2300BFFF'/> <path d='M40 50 C45 35, 60 35, 65 50 L60 55 C55 40, 40 40, 35 55 Z' fill='%23FFA500'/> <path d='M60 60 C65 45, 80 45, 85 60 L80 65 C75 50, 60 50, 55 65 Z' fill='%23FFA500'/> <path d='M80 70 C85 55, 100 55, 105 70 L100 75 C95 60, 80 60, 75 75 Z' fill='%23FFA500'/> <path d='M45 35 Q55 20, 70 30 L65 38 Q50 25, 45 35 Z' fill='%23FFA500'/> <path d='M45 93 Q55 108, 70 98 L65 90 Q50 103, 45 93 Z' fill='%23FFA500'/> <path d='M30 70 Q25 80, 40 78 L38 68 Q28 72, 30 70 Z' fill='%2300BFFF'/> <path d='M100 60 Q115 50, 120 60 Q115 70, 100 68 C100 68, 100 60, 100 60 Z' fill='%23FFA500'/> <path d='M100 64 L120 64 L100 64 Z' fill='%2300BFFF'/> <circle cx='55' cy='60' r='10' fill='white'/> <circle cx='58' cy='62' r='6' fill='black'/> <circle cx='60' cy='58' r='2' fill='white'/> </svg>",
  'seahorse': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='seahorseGradient' cx='50%' cy='50%' r='50%' fx='50%' fy='50%'> <stop offset='0%' style='stop-color:%23FFD700;stop-opacity:1' /> <stop offset='100%' style='stop-color:%23FFA500;stop-opacity:1' /> </radialGradient> </defs> <path d='M60 20 C40 5 30 30 30 50 C30 70 50 80 60 85 C70 90 90 90 90 70 C90 50 70 30 60 20 Z' fill='url(%23seahorseGradient)' stroke='%23FF8C00' stroke-width='2'/> <path d='M60 20 C75 10 90 10 95 20 C100 30 85 40 70 30 Z' fill='url(%23seahorseGradient)' stroke='%23FF8C00' stroke-width='2'/> <path d='M60 85 C40 100 30 110 40 120 C50 130 70 110 60 95 Z' fill='url(%23seahorseGradient)' stroke='%23FF8C00' stroke-width='2'/> <path d='M40 120 C30 115 20 110 30 100 C40 90 50 100 40 105 Z' fill='url(%23seahorseGradient)' stroke='%23FF8C00' stroke-width='2'/> <path d='M90 70 C100 60 105 50 95 45 C85 40 80 50 90 60 Z' fill='%23FF8C00' opacity='0.7'/> <circle cx='80' cy='30' r='8' fill='white'/> <circle cx='82' cy='32' r='3' fill='black'/> <circle cx='83' cy='29' r='1.5' fill='white'/> </svg>",
  'puffer': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'> <g id='pufferfish'> <ellipse cx='64' cy='64' rx='45' ry='35' fill='%23FFDDC1'/> <circle cx='35' cy='45' r='4' fill='%23FFA07A'/> <circle cx='50' cy='35' r='4' fill='%23FFA07A'/> <circle cx='70' cy='30' r='4' fill='%23FFA07A'/> <circle cx='85' cy='40' r='4' fill='%23FFA07A'/> <circle cx='95' cy='55' r='4' fill='%23FFA07A'/> <circle cx='90' cy='70' r='4' fill='%23FFA07A'/> <circle cx='75' cy='85' r='4' fill='%23FFA07A'/> <circle cx='55' cy='90' r='4' fill='%23FFA07A'/> <circle cx='40' cy='78' r='4' fill='%23FFA07A'/> <path d='M109 64 C115 58, 120 60, 115 70 C110 75, 109 64, 109 64 Z' fill='%23FFA07A'/> <path d='M70 30 C75 20, 80 25, 75 35 L70 30 Z' fill='%23FFA07A'/> <path d='M70 95 C75 105, 80 100, 75 90 L70 95 Z' fill='%23FFA07A'/> <circle cx='75' cy='55' r='10' fill='white'/> <circle cx='78' cy='57' r='7' fill='black'/> <circle cx='80' cy='53' r='3' fill='white'/> <circle cx='58' cy='55' r='8' fill='white'/> <circle cx='60' cy='57' r='5' fill='black'/> <circle cx='62' cy='53' r='2' fill='white'/> <path d='M68 75 C70 78, 75 78, 77 75 C75 73, 70 73, 68 75 Z' fill='%238B4513'/> </g> </svg>",
  'butterfly': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M15,64 C15,35 60,10 95,30 C120,40 120,80 95,98 C60,118 15,90 15,64 Z' fill='%23FFD700'/> <path d='M45,30 C50,15 70,10 80,25 L75,30 L45,30 Z' fill='%23FFD700'/> <path d='M45,30 C50,15 70,10 80,25' stroke='%23000000' stroke-width='2' fill='none'/> <path d='M45,98 C50,113 70,118 80,103 L75,98 L45,98 Z' fill='%23FFD700'/> <path d='M45,98 C50,113 70,118 80,103' stroke='%23000000' stroke-width='2' fill='none'/> <path d='M110,64 C115,50 125,55 120,64 C125,73 115,78 110,64 Z' fill='%23FFD700'/> <path d='M110,64 C115,50 M125,55 L120,64 M125,55 L120,64 C125,73 M115,78 L110,64' stroke='%23000000' stroke-width='2' fill='none'/> <path d='M40,50 C45,40 60,40 65,50 L60,75 C55,85 40,85 35,75 L40,50 Z' fill='%23000000'/> <circle cx='50' cy='62' r='10' fill='%23FFFFFF'/> <circle cx='55' cy='64' r='5' fill='%23000000'/> <circle cx='57' cy='60' r='1.5' fill='%23FFFFFF'/> <circle cx='52' cy='66' r='1' fill='%23FFFFFF'/> <path d='M25,70 C30,75 35,75 40,70' stroke='%23000000' stroke-width='2' fill='none'/> </svg>",
  'oarfish': "data:image/svg+xml,<svg viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M10 64 C20 50, 40 55, 60 60 S80 65, 100 68 S115 70, 120 72 M10 64 C20 78, 40 73, 60 68 S80 63, 100 60 S115 58, 120 56' fill='%23C0C0C0' stroke='%23A9A9A9' stroke-width='2' stroke-linejoin='round' stroke-linecap='round'/> <path d='M10 64 C20 50, 40 55, 60 60 S80 65, 100 68 S115 70, 120 72' fill='none' stroke='%23C0C0C0' stroke-width='6'/> <path d='M10 64 C20 78, 40 73, 60 68 S80 63, 100 60 S115 58, 120 56' fill='none' stroke='%23C0C0C0' stroke-width='6'/> <path d='M10 64 C20 50, 40 55, 60 60 S80 65, 100 68 S115 70, 120 72 M10 64 C20 78, 40 73, 60 68 S80 63, 100 60 S115 58, 120 56' fill='%23E0E0E0' stroke='none'/> <path d='M10 64 Q25 58, 40 64 Q25 70, 10 64 Z' fill='%23E0E0E0' stroke='%23A9A9A9' stroke-width='1'/> <path d='M18 68 Q22 69, 26 68 Q22 67, 18 68 Z' fill='%23F0F0F0' stroke='%23A9A9A9' stroke-width='0.5'/> <path d='M25 50 Q30 40, 35 50 Q30 45, 25 50 Z' fill='%23FF0000' stroke='%23CC0000' stroke-width='1'/> <path d='M30 52 Q35 42, 40 52 Q35 47, 30 52 Z' fill='%23FF0000' stroke='%23CC0000' stroke-width='1'/> <path d='M35 54 Q40 44, 45 54 Q40 49, 35 54 Z' fill='%23FF0000' stroke='%23CC0000' stroke-width='1'/> <circle cx='30' cy='62' r='6' fill='%23FFF'/> <circle cx='30' cy='62' r='4' fill='%23000'/> <circle cx='32' cy='60' r='1.5' fill='%23FFF'/> </svg>",
  'coelacanth': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M25 60 C10 60 15 85 30 85 H90 C110 85 115 65 105 55 C95 45 80 40 70 45 C60 50 40 50 25 60 Z' fill='%23778899'/> <path d='M100 55 L120 45 L115 60 L120 75 L100 65 Z' fill='%23778899'/> <path d='M60 40 C65 30 75 30 80 40 L70 45 L60 40 Z' fill='%23778899'/> <path d='M35 65 C40 75 40 85 30 80 L25 70 L35 65 Z' fill='%23778899'/> <path d='M55 75 C60 85 65 85 60 80 L50 75 L55 75 Z' fill='%23778899'/> <path d='M75 75 C80 85 85 85 80 80 L70 75 L75 75 Z' fill='%23778899'/> <circle cx='50' cy='55' r='10' fill='%23000'/> <circle cx='55' cy='52' r='3' fill='%23fff'/> <path d='M30 65 Q40 70 45 65' stroke='%23000' stroke-width='2' fill='none'/> </svg>",
  'manta': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='bellyGradient' cx='50%' cy='50%' r='50%' fx='50%' fy='50%'> <stop offset='0%' stop-color='%23FFFFFF'/> <stop offset='100%' stop-color='%23E0E0E0'/> </radialGradient> </defs> <path d='M 30 50 C 10 55, 10 75, 30 80 L 100 80 C 120 75, 120 55, 100 50 L 30 50 Z' fill='%23202028'/> <path d='M 35 60 C 20 62, 20 70, 35 72 L 95 72 C 110 70, 110 62, 95 60 L 35 60 Z' fill='url(%23bellyGradient)'/> <path d='M 25 60 C 20 60, 20 70, 25 70 L 35 70 L 35 60 Z' fill='%23202028'/> <circle cx='45' cy='58' r='7' fill='%23FFFFFF'/> <circle cx='45' cy='58' r='4' fill='%23000000'/> <circle cx='47' cy='56' r='1.5' fill='%23FFFFFF'/> <path d='M 95 66 C 100 66, 110 68, 115 70 C 110 72, 100 74, 95 74 Z' fill='%23202028'/> <path d='M 115 70 C 120 71, 125 71, 128 70 C 125 69, 120 69, 115 70 Z' fill='%23202028'/> </svg>",
  'whaleshark': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='58' cy='64' rx='52' ry='30' fill='%237A8B99'/> <ellipse cx='55' cy='72' rx='42' ry='16' fill='%23B0BEC5'/> <circle cx='35' cy='50' r='3' fill='white' opacity='0.7'/> <circle cx='50' cy='45' r='2.5' fill='white' opacity='0.7'/> <circle cx='65' cy='48' r='3' fill='white' opacity='0.7'/> <circle cx='80' cy='52' r='2.5' fill='white' opacity='0.7'/> <circle cx='42' cy='58' r='2' fill='white' opacity='0.7'/> <circle cx='58' cy='55' r='2.5' fill='white' opacity='0.7'/> <circle cx='72' cy='60' r='2' fill='white' opacity='0.7'/> <circle cx='30' cy='65' r='2' fill='white' opacity='0.7'/> <circle cx='88' cy='62' r='2' fill='white' opacity='0.7'/> <path d='M105 55 L120 38 L118 64 L120 90 L105 73 Z' fill='%236B7B8A'/> <path d='M55 35 L62 22 L70 35 Z' fill='%236B7B8A'/> <path d='M35 78 L28 92 L45 88 Z' fill='%236B7B8A'/> <path d='M6 54 C6 50 12 46 20 48 L20 80 C12 82 6 78 6 74 Z' fill='%237A8B99'/> <path d='M6 64 L18 64' stroke='%23546E7A' stroke-width='2' fill='none'/> <circle cx='22' cy='54' r='8' fill='white'/> <circle cx='25' cy='56' r='5' fill='%231A1A2E'/> <circle cx='23' cy='53' r='2' fill='white'/> <circle cx='26' cy='55' r='1' fill='white'/> </svg>",
  'dragongod': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='dgGlow' cx='50%' cy='50%' r='60%'> <stop offset='0%' stop-color='%23FFD700' stop-opacity='0.4'/> <stop offset='100%' stop-color='%23FFD700' stop-opacity='0'/> </radialGradient> <linearGradient id='dgBody' x1='0' y1='0' x2='1' y2='1'> <stop offset='0%' stop-color='%23FFD700'/> <stop offset='100%' stop-color='%23FF8C00'/> </linearGradient> </defs> <ellipse cx='60' cy='64' rx='58' ry='50' fill='url(%23dgGlow)'/> <path d='M15 64 C20 40 40 30 60 35 C80 40 90 50 100 55 C110 60 115 64 110 72 C105 80 90 82 70 78 C50 74 30 80 15 64Z' fill='url(%23dgBody)' stroke='%23DAA520' stroke-width='1.5'/> <ellipse cx='45' cy='50' rx='6' ry='4' fill='%23FFEC80' opacity='0.5'/> <ellipse cx='60' cy='48' rx='6' ry='4' fill='%23FFEC80' opacity='0.5'/> <ellipse cx='75' cy='52' rx='6' ry='4' fill='%23FFEC80' opacity='0.5'/> <ellipse cx='90' cy='58' rx='5' ry='3' fill='%23FFEC80' opacity='0.5'/> <path d='M25 42 L18 28 L28 36 Z' fill='%23DAA520'/> <path d='M32 38 L28 24 L36 32 Z' fill='%23DAA520'/> <path d='M40 35 C35 25 50 20 55 30' fill='%23FF6347' opacity='0.7'/> <path d='M50 33 C48 22 62 18 60 28' fill='%23FF4500' opacity='0.6'/> <path d='M105 60 L120 48 L118 64 L120 80 L105 72 Z' fill='%23FF8C00'/> <path d='M120 48 L125 42 L122 52 Z' fill='%23FF6347' opacity='0.7'/> <path d='M120 80 L125 86 L122 76 Z' fill='%23FF6347' opacity='0.7'/> <path d='M18 58 C8 52 2 48 0 44' stroke='%23DAA520' stroke-width='1.5' fill='none'/> <path d='M18 62 C10 60 4 62 0 58' stroke='%23DAA520' stroke-width='1.5' fill='none'/> <circle cx='26' cy='50' r='8' fill='white'/> <circle cx='29' cy='52' r='5' fill='%238B0000'/> <circle cx='27' cy='49' r='2' fill='white'/> <circle cx='30' cy='51' r='1' fill='%23FFD700'/> </svg>",
  'killifish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='58' cy='64' rx='35' ry='18' fill='%234CAF50'/> <ellipse cx='65' cy='60' rx='15' ry='10' fill='%23E53935' opacity='0.6'/> <ellipse cx='48' cy='68' rx='10' ry='7' fill='%23FF7043' opacity='0.5'/> <circle cx='40' cy='58' r='2.5' fill='%23FFD600' opacity='0.7'/> <circle cx='55' cy='55' r='2' fill='%23FFD600' opacity='0.7'/> <circle cx='70' cy='58' r='2.5' fill='%23FFD600' opacity='0.7'/> <circle cx='50' cy='70' r='2' fill='%23FFD600' opacity='0.7'/> <path d='M55 47 L60 38 L68 46 Z' fill='%2366BB6A' opacity='0.8'/> <path d='M90 58 L108 48 L105 64 L108 80 L90 70 Z' fill='%23E53935' opacity='0.8'/> <path d='M42 72 L38 82 L48 78 Z' fill='%2366BB6A' opacity='0.7'/> <path d='M62 80 L65 88 L70 80 Z' fill='%2366BB6A' opacity='0.7'/> <circle cx='35' cy='60' r='8' fill='white'/> <circle cx='38' cy='62' r='5' fill='black'/> <circle cx='36' cy='59' r='2' fill='white'/> <circle cx='39' cy='61' r='1' fill='white'/> <path d='M23 65 C26 67 26 67 24 69' stroke='%232E7D32' stroke-width='1' fill='none'/> </svg>",
  'loach': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M15 62 C15 52 30 45 55 45 C80 45 100 50 110 58 C115 62 115 70 110 74 C100 80 80 82 55 82 C30 82 15 75 15 62Z' fill='%238D6E63'/> <path d='M20 68 C20 65 35 62 55 62 C80 62 100 64 108 68 C108 74 95 78 55 78 C30 78 20 74 20 68Z' fill='%23D7CCC8'/> <ellipse cx='45' cy='60' rx='8' ry='6' fill='%235D4037' opacity='0.4'/> <ellipse cx='70' cy='58' rx='8' ry='6' fill='%235D4037' opacity='0.4'/> <ellipse cx='92' cy='62' rx='6' ry='5' fill='%235D4037' opacity='0.4'/> <path d='M55 46 L60 36 L68 46 Z' fill='%23A1887F'/> <path d='M108 60 L120 52 L118 66 L120 80 L108 72 Z' fill='%23A1887F'/> <path d='M35 74 L30 84 L42 80 Z' fill='%23A1887F' opacity='0.7'/> <path d='M15 60 C8 55 4 50 0 48' stroke='%236D4C41' stroke-width='1.5' fill='none'/> <path d='M15 64 C8 62 4 64 0 62' stroke='%236D4C41' stroke-width='1.5' fill='none'/> <path d='M15 68 C8 72 4 76 0 78' stroke='%236D4C41' stroke-width='1.5' fill='none'/> <circle cx='25' cy='58' r='7' fill='white'/> <circle cx='28' cy='59' r='4' fill='black'/> <circle cx='26' cy='56' r='2' fill='white'/> <path d='M16 66 C18 68 18 68 16 70' stroke='%235D4037' stroke-width='1' fill='none'/> </svg>",
  'goldfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='gfBody' cx='40%' cy='40%' r='60%'> <stop offset='0%' stop-color='%23FF6F00'/> <stop offset='100%' stop-color='%23E65100'/> </radialGradient> </defs> <ellipse cx='52' cy='62' rx='32' ry='28' fill='url(%23gfBody)'/> <ellipse cx='48' cy='70' rx='20' ry='12' fill='%23FF8F00' opacity='0.5'/> <path d='M82 52 C95 38 110 32 115 40 C118 48 105 55 90 58' fill='%23FF6F00' opacity='0.85'/> <path d='M82 72 C95 88 110 94 115 86 C118 78 105 72 90 68' fill='%23FF6F00' opacity='0.85'/> <path d='M85 58 C92 56 98 58 95 64 C98 70 92 72 85 68' fill='%23E65100' opacity='0.6'/> <path d='M42 36 C45 24 55 20 60 28 C65 22 68 26 65 36' fill='%23FF8F00' opacity='0.8'/> <path d='M38 78 L30 92 L46 86 Z' fill='%23FF8F00' opacity='0.7'/> <path d='M60 86 L58 96 L66 88 Z' fill='%23FF8F00' opacity='0.7'/> <circle cx='36' cy='55' r='9' fill='white'/> <circle cx='39' cy='57' r='5' fill='black'/> <circle cx='37' cy='53' r='2.5' fill='white'/> <circle cx='40' cy='56' r='1' fill='white'/> <path d='M22 64 C24 66 24 68 22 70' stroke='%23BF360C' stroke-width='1.5' fill='none'/> </svg>",
  'koi': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='55' cy='64' rx='40' ry='25' fill='%23FFF8E1'/> <ellipse cx='38' cy='55' rx='14' ry='12' fill='%23D32F2F' opacity='0.85'/> <ellipse cx='68' cy='60' rx='16' ry='11' fill='%23D32F2F' opacity='0.85'/> <ellipse cx='52' cy='72' rx='10' ry='8' fill='%23D32F2F' opacity='0.7'/> <path d='M92 55 C100 42 115 38 118 48 C120 55 112 60 100 62' fill='%23FFF8E1'/> <path d='M92 73 C100 86 115 90 118 80 C120 73 112 68 100 66' fill='%23FFF8E1'/> <path d='M100 55 C104 50 108 48 106 58' fill='%23D32F2F' opacity='0.6'/> <path d='M100 73 C104 78 108 80 106 70' fill='%23D32F2F' opacity='0.6'/> <path d='M50 40 L55 28 L64 40 Z' fill='%23FFCDD2'/> <path d='M35 78 L28 90 L42 86 Z' fill='%23FFCDD2' opacity='0.8'/> <path d='M16 60 C10 56 6 54 2 52' stroke='%23BCAAA4' stroke-width='1' fill='none'/> <path d='M16 68 C10 72 6 74 2 76' stroke='%23BCAAA4' stroke-width='1' fill='none'/> <circle cx='28' cy='56' r='8' fill='white'/> <circle cx='31' cy='58' r='5' fill='black'/> <circle cx='29' cy='55' r='2' fill='white'/> <circle cx='32' cy='57' r='1' fill='white'/> <path d='M16 64 C18 66 18 66 16 68' stroke='%23795548' stroke-width='1' fill='none'/> </svg>",
  'axolotl': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M25 60 C15 75, 20 95, 45 95 C70 95, 95 85, 95 65 C95 45, 80 30, 60 30 C40 30, 30 45, 25 60Z' fill='%23FFC0CB'/> <path d='M95 65 C105 75, 115 70, 110 55 C105 40, 95 50, 95 65Z' fill='%23FFC0CB'/> <ellipse cx='28' cy='40' rx='3' ry='8' transform='rotate(-20 28 40)' fill='%23FF69B4'/> <ellipse cx='32' cy='35' rx='3' ry='8' transform='rotate(0 32 35)' fill='%23FF69B4'/> <ellipse cx='36' cy='30' rx='3' ry='8' transform='rotate(20 36 30)' fill='%23FF69B4'/> <ellipse cx='28' cy='50' rx='3' ry='8' transform='rotate(-20 28 50)' fill='%23FF69B4'/> <ellipse cx='32' cy='45' rx='3' ry='8' transform='rotate(0 32 45)' fill='%23FF69B4'/> <ellipse cx='36' cy='40' rx='3' ry='8' transform='rotate(20 36 40)' fill='%23FF69B4'/> <circle cx='58' cy='45' r='8' fill='%23000'/> <circle cx='55' cy='42' r='3' fill='%23FFF'/> <path d='M60 60 Q65 65, 70 60' stroke='%23000' stroke-width='2' fill='none'/> </svg>",
  'arapaima': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M10 58 C10 42 30 34 60 34 C85 34 105 42 112 55 C115 62 115 70 112 77 C105 90 85 94 60 94 C30 94 10 82 10 58Z' fill='%232E7D32'/> <path d='M15 70 C15 65 35 60 60 60 C85 60 105 64 110 70 C108 82 88 88 60 88 C35 88 15 82 15 70Z' fill='%234CAF50'/> <ellipse cx='50' cy='55' rx='7' ry='4' fill='%23C62828' opacity='0.5'/> <ellipse cx='65' cy='52' rx='7' ry='4' fill='%23C62828' opacity='0.5'/> <ellipse cx='80' cy='56' rx='7' ry='4' fill='%23C62828' opacity='0.5'/> <ellipse cx='55' cy='70' rx='7' ry='4' fill='%23C62828' opacity='0.4'/> <ellipse cx='72' cy='68' rx='7' ry='4' fill='%23C62828' opacity='0.4'/> <ellipse cx='88' cy='64' rx='6' ry='3' fill='%23C62828' opacity='0.4'/> <path d='M75 35 L80 24 L88 34 Z' fill='%231B5E20'/> <path d='M110 58 L124 48 L122 66 L124 84 L110 74 Z' fill='%231B5E20'/> <path d='M30 80 L24 94 L38 88 Z' fill='%23388E3C' opacity='0.7'/> <circle cx='22' cy='52' r='9' fill='white'/> <circle cx='25' cy='54' r='5' fill='black'/> <circle cx='23' cy='51' r='2.5' fill='white'/> <circle cx='26' cy='53' r='1' fill='white'/> <path d='M10 60 C14 62 14 62 10 65' stroke='%231B5E20' stroke-width='1.5' fill='none'/> </svg>",
  'surgeonfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='55' cy='64' rx='38' ry='26' fill='%231565C0'/> <path d='M40 50 C50 42 65 42 80 50 C85 55 88 60 88 64 C88 68 85 74 80 78 C65 86 50 86 40 78 L55 64 Z' fill='%230D47A1' opacity='0.5'/> <path d='M90 54 L110 42 L108 64 L110 86 L90 74 Z' fill='%23FFD600'/> <path d='M40 40 C45 30 55 28 60 38' fill='%231976D2'/> <path d='M45 88 C50 96 58 98 62 90' fill='%231976D2'/> <path d='M38 72 L32 82 L44 78 Z' fill='%231976D2' opacity='0.7'/> <path d='M86 56 L92 56 L92 72 L86 72 Z' fill='%230D47A1'/> <circle cx='34' cy='58' r='9' fill='white'/> <circle cx='37' cy='60' r='5' fill='black'/> <circle cx='35' cy='57' r='2.5' fill='white'/> <circle cx='38' cy='59' r='1' fill='white'/> <path d='M18 66 C20 68 20 68 18 70' stroke='%230D47A1' stroke-width='1' fill='none'/> </svg>",
  'lionfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <line x1='35' y1='48' x2='25' y2='8' stroke='%23C62828' stroke-width='1.5'/> <line x1='45' y1='46' x2='38' y2='6' stroke='%23C62828' stroke-width='1.5'/> <line x1='55' y1='44' x2='52' y2='4' stroke='%23C62828' stroke-width='1.5'/> <line x1='65' y1='46' x2='65' y2='6' stroke='%23C62828' stroke-width='1.5'/> <line x1='75' y1='48' x2='78' y2='10' stroke='%23C62828' stroke-width='1.5'/> <path d='M25 8 L38 6 L35 48 L25 48 Z' fill='%23EF9A9A' opacity='0.3'/> <path d='M38 6 L52 4 L55 44 L35 48 Z' fill='%23EF9A9A' opacity='0.3'/> <path d='M52 4 L65 6 L65 46 L55 44 Z' fill='%23EF9A9A' opacity='0.3'/> <path d='M65 6 L78 10 L75 48 L65 46 Z' fill='%23EF9A9A' opacity='0.3'/> <ellipse cx='55' cy='65' rx='32' ry='22' fill='%23FFEBEE'/> <path d='M28 55 L30 78' stroke='%23C62828' stroke-width='3' stroke-linecap='round'/> <path d='M38 50 L40 82' stroke='%23C62828' stroke-width='3' stroke-linecap='round'/> <path d='M50 48 L52 84' stroke='%23C62828' stroke-width='3' stroke-linecap='round'/> <path d='M62 48 L64 84' stroke='%23C62828' stroke-width='3' stroke-linecap='round'/> <path d='M74 50 L76 82' stroke='%23C62828' stroke-width='3' stroke-linecap='round'/> <path d='M35 72 C28 80 20 95 15 105 C25 100 32 90 38 80' fill='%23EF9A9A' opacity='0.6'/> <line x1='35' y1='72' x2='15' y2='105' stroke='%23C62828' stroke-width='0.8'/> <line x1='35' y1='72' x2='20' y2='98' stroke='%23C62828' stroke-width='0.8'/> <line x1='35' y1='72' x2='26' y2='92' stroke='%23C62828' stroke-width='0.8'/> <path d='M84 58 L100 50 L98 65 L100 80 L84 72 Z' fill='%23FFCDD2'/> <line x1='84' y1='58' x2='100' y2='50' stroke='%23C62828' stroke-width='0.8'/> <line x1='84' y1='65' x2='98' y2='65' stroke='%23C62828' stroke-width='0.8'/> <line x1='84' y1='72' x2='100' y2='80' stroke='%23C62828' stroke-width='0.8'/> <circle cx='36' cy='60' r='8' fill='white'/> <circle cx='39' cy='62' r='5' fill='black'/> <circle cx='37' cy='59' r='2' fill='white'/> <circle cx='40' cy='61' r='1' fill='white'/> </svg>",
  'moorishidol': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M58 38 C55 20 60 8 68 4 C70 3 72 5 70 8 C65 18 62 30 60 38' fill='none' stroke='white' stroke-width='2'/> <path d='M55 30 C65 25 80 30 85 50 C90 70 80 95 65 100 C50 95 35 70 38 50 C40 35 48 30 55 30Z' fill='%23FFD600'/> <path d='M48 35 C50 30 55 30 57 35 L54 95 C52 100 48 100 46 95 Z' fill='%231A1A1A'/> <path d='M68 35 C72 30 78 32 80 40 L78 90 C76 96 70 98 68 92 Z' fill='%231A1A1A'/> <path d='M57 35 L54 95 C58 98 64 98 68 92 L68 35 C64 30 60 30 57 35Z' fill='white'/> <path d='M42 55 C35 52 28 54 25 58 C28 62 35 64 42 62 Z' fill='%23FFD600'/> <path d='M82 75 L95 70 L92 82 L95 92 L82 88 Z' fill='%231A1A1A'/> <path d='M58 98 L55 112 L65 108 L68 98 Z' fill='%231A1A1A'/> <circle cx='44' cy='55' r='7' fill='white'/> <circle cx='46' cy='56' r='4' fill='black'/> <circle cx='44' cy='54' r='2' fill='white'/> <path d='M25 58 C27 59 27 59 25 60' stroke='%23333' stroke-width='1' fill='none'/> </svg>",
  'triggerfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='55' cy='64' rx='38' ry='28' fill='%231A237E'/> <path d='M30 50 C40 42 50 44 50 55 C50 68 38 70 30 65 Z' fill='%2300BCD4'/> <path d='M50 55 C60 48 75 48 80 58 C80 72 68 78 55 74 C48 70 48 62 50 55Z' fill='%23FDD835'/> <path d='M60 50 C65 48 72 52 70 58' stroke='%231A237E' stroke-width='1.5' fill='none'/> <path d='M58 60 C63 58 72 60 70 68' stroke='%231A237E' stroke-width='1.5' fill='none'/> <path d='M45 38 L48 24 L52 38 Z' fill='%231A237E'/> <path d='M60 38 C65 30 72 30 75 38' fill='%231565C0'/> <path d='M60 90 C65 98 72 98 75 90' fill='%231565C0'/> <path d='M90 55 L108 48 L106 64 L108 80 L90 73 Z' fill='%23FDD835'/> <path d='M38 72 L34 82 L44 78 Z' fill='%2300BCD4' opacity='0.7'/> <circle cx='32' cy='56' r='8' fill='white'/> <circle cx='35' cy='58' r='5' fill='black'/> <circle cx='33' cy='55' r='2' fill='white'/> <circle cx='36' cy='57' r='1' fill='white'/> <path d='M18 64 C20 66 20 66 18 68' stroke='%230D47A1' stroke-width='1.5' fill='none'/> </svg>",
  'napoleonfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='58' cy='66' rx='42' ry='28' fill='%2300796B'/> <path d='M22 50 C18 38 22 28 32 26 C40 24 42 32 40 42 C38 48 30 52 22 50Z' fill='%2300897B'/> <ellipse cx='45' cy='58' rx='6' ry='4' fill='%2326A69A' opacity='0.4'/> <ellipse cx='58' cy='55' rx='6' ry='4' fill='%2326A69A' opacity='0.4'/> <ellipse cx='72' cy='58' rx='6' ry='4' fill='%2326A69A' opacity='0.4'/> <ellipse cx='52' cy='70' rx='6' ry='4' fill='%2326A69A' opacity='0.4'/> <ellipse cx='65' cy='68' rx='6' ry='4' fill='%2326A69A' opacity='0.4'/> <ellipse cx='80' cy='64' rx='5' ry='3' fill='%2326A69A' opacity='0.4'/> <ellipse cx='55' cy='78' rx='30' ry='12' fill='%234DB6AC' opacity='0.5'/> <path d='M40 40 C50 30 65 28 75 38' fill='%2300695C' opacity='0.8'/> <path d='M96 58 L114 48 L112 66 L114 84 L96 74 Z' fill='%2300695C'/> <path d='M38 80 L30 94 L46 88 Z' fill='%2300897B' opacity='0.7'/> <path d='M18 62 C16 60 14 62 14 66 C14 70 16 72 18 70 Z' fill='%23E8967A'/> <circle cx='30' cy='50' r='8' fill='white'/> <circle cx='33' cy='52' r='5' fill='black'/> <circle cx='31' cy='49' r='2' fill='white'/> <circle cx='34' cy='51' r='1' fill='white'/> <path d='M24 46 L22 42' stroke='%23004D40' stroke-width='1.5' fill='none'/> <path d='M24 56 L22 60' stroke='%23004D40' stroke-width='1.5' fill='none'/> </svg>",
  'seaturtle': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='75' cy='82' rx='18' ry='8' transform='rotate(30 75 82)' fill='%232E7D32'/> <ellipse cx='75' cy='46' rx='18' ry='8' transform='rotate(-30 75 46)' fill='%232E7D32'/> <ellipse cx='60' cy='64' rx='35' ry='26' fill='%2333691E'/> <ellipse cx='50' cy='55' rx='10' ry='8' fill='%23558B2F' stroke='%2333691E' stroke-width='1'/> <ellipse cx='70' cy='55' rx='10' ry='8' fill='%23558B2F' stroke='%2333691E' stroke-width='1'/> <ellipse cx='60' cy='68' rx='10' ry='8' fill='%23558B2F' stroke='%2333691E' stroke-width='1'/> <ellipse cx='42' cy='68' rx='8' ry='6' fill='%23558B2F' stroke='%2333691E' stroke-width='1'/> <ellipse cx='78' cy='68' rx='8' ry='6' fill='%23558B2F' stroke='%2333691E' stroke-width='1'/> <ellipse cx='32' cy='78' rx='16' ry='7' transform='rotate(20 32 78)' fill='%23388E3C'/> <ellipse cx='32' cy='50' rx='16' ry='7' transform='rotate(-20 32 50)' fill='%23388E3C'/> <ellipse cx='26' cy='64' rx='14' ry='12' fill='%234CAF50'/> <ellipse cx='22' cy='60' rx='8' ry='6' fill='%23388E3C'/> <circle cx='18' cy='60' r='6' fill='white'/> <circle cx='16' cy='61' r='4' fill='black'/> <circle cx='15' cy='59' r='1.5' fill='white'/> <path d='M14 68 C16 70 20 70 22 68' stroke='%231B5E20' stroke-width='1.5' fill='none'/> <path d='M94 64 L104 62 L100 66 Z' fill='%232E7D32'/> </svg>",
  'anglerfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='afLure' cx='50%' cy='50%' r='50%'> <stop offset='0%' stop-color='%2300E5FF' stop-opacity='1'/> <stop offset='100%' stop-color='%2300E5FF' stop-opacity='0'/> </radialGradient> </defs> <path d='M38 42 C35 30 30 22 28 18' stroke='%232D2D3D' stroke-width='2' fill='none'/> <circle cx='28' cy='16' r='10' fill='url(%23afLure)'/> <circle cx='28' cy='16' r='4' fill='%2300E5FF'/> <ellipse cx='55' cy='68' rx='38' ry='30' fill='%231A1A2E'/> <ellipse cx='52' cy='76' rx='28' ry='16' fill='%232D2D44'/> <path d='M18 62 L18 82 C22 86 30 86 35 82 L35 62 Z' fill='%230D0D1A'/> <path d='M18 62 L21 68 L24 62 L27 68 L30 62 L33 68 L35 62' fill='white'/> <path d='M18 82 L21 76 L24 82 L27 76 L30 82 L33 76 L35 82' fill='white'/> <path d='M90 60 L102 52 L100 68 L102 82 L90 76 Z' fill='%231A1A2E'/> <path d='M55 40 L60 32 L68 40 Z' fill='%232D2D44'/> <path d='M50 96 L55 104 L60 96 Z' fill='%232D2D44'/> <circle cx='40' cy='58' r='10' fill='white'/> <circle cx='43' cy='60' r='6' fill='%231A1A2E'/> <circle cx='44' cy='59' r='2' fill='%2300E5FF'/> <circle cx='41' cy='56' r='2.5' fill='white'/> </svg>",
  'viperfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M20 55 C20 42 40 35 65 38 C85 40 105 48 110 58 C112 64 112 72 110 78 C105 88 85 90 65 88 C40 86 20 75 20 55Z' fill='%231A1A2E'/> <circle cx='40' cy='55' r='2' fill='%2300E5FF' opacity='0.8'/> <circle cx='55' cy='50' r='1.5' fill='%2300E5FF' opacity='0.8'/> <circle cx='70' cy='52' r='2' fill='%2300E5FF' opacity='0.8'/> <circle cx='85' cy='56' r='1.5' fill='%2300E5FF' opacity='0.8'/> <circle cx='48' cy='75' r='1.5' fill='%2300E5FF' opacity='0.6'/> <circle cx='65' cy='78' r='2' fill='%2300E5FF' opacity='0.6'/> <circle cx='82' cy='74' r='1.5' fill='%2300E5FF' opacity='0.6'/> <circle cx='95' cy='64' r='1.5' fill='%2300E5FF' opacity='0.7'/> <path d='M20 52 L12 48 L12 78 L20 74 Z' fill='%230D0D1A'/> <path d='M15 52 C16 42 18 36 20 34' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/> <path d='M18 52 C20 44 22 40 24 38' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/> <path d='M15 74 C16 84 18 90 20 92' stroke='white' stroke-width='2' fill='none' stroke-linecap='round'/> <path d='M18 74 C20 82 22 86 24 88' stroke='white' stroke-width='1.5' fill='none' stroke-linecap='round'/> <path d='M50 38 L48 26 L55 36 Z' fill='%232D2D44'/> <circle cx='48' cy='26' r='3' fill='%2300E5FF' opacity='0.8'/> <path d='M108 58 L120 50 L118 66 L120 82 L108 74 Z' fill='%231A1A2E'/> <circle cx='30' cy='56' r='8' fill='white'/> <circle cx='33' cy='58' r='5' fill='%231A1A2E'/> <circle cx='34' cy='57' r='2' fill='%2300E5FF'/> <circle cx='31' cy='55' r='2' fill='white'/> </svg>",
  'giantisopod': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='64' cy='64' rx='45' ry='28' fill='%2378909C'/> <path d='M25 64 L103 64' stroke='%23546E7A' stroke-width='1' opacity='0.6'/> <ellipse cx='64' cy='64' rx='45' ry='28' fill='none' stroke='%23546E7A' stroke-width='1.5'/> <path d='M30 52 C50 48 80 48 98 52' stroke='%23546E7A' stroke-width='1.5' fill='none'/> <path d='M28 58 C48 54 82 54 100 58' stroke='%23546E7A' stroke-width='1.5' fill='none'/> <path d='M28 70 C48 74 82 74 100 70' stroke='%23546E7A' stroke-width='1.5' fill='none'/> <path d='M30 76 C50 80 80 80 98 76' stroke='%23546E7A' stroke-width='1.5' fill='none'/> <path d='M20 52 C14 54 12 60 12 64 C12 68 14 74 20 76 L28 76 L28 52 Z' fill='%23607D8B'/> <line x1='35' y1='88' x2='32' y2='98' stroke='%23546E7A' stroke-width='2'/> <line x1='48' y1='90' x2='46' y2='100' stroke='%23546E7A' stroke-width='2'/> <line x1='62' y1='91' x2='62' y2='102' stroke='%23546E7A' stroke-width='2'/> <line x1='76' y1='90' x2='78' y2='100' stroke='%23546E7A' stroke-width='2'/> <line x1='88' y1='88' x2='92' y2='98' stroke='%23546E7A' stroke-width='2'/> <path d='M16 56 C10 50 6 44 2 40' stroke='%23607D8B' stroke-width='1.5' fill='none'/> <path d='M16 60 C10 56 4 54 0 50' stroke='%23607D8B' stroke-width='1.5' fill='none'/> <path d='M104 56 L116 52 L118 64 L116 76 L104 72 Z' fill='%23607D8B'/> <circle cx='20' cy='58' r='7' fill='white'/> <circle cx='22' cy='59' r='4' fill='black'/> <circle cx='20' cy='57' r='2' fill='white'/> <circle cx='23' cy='58' r='1' fill='white'/> </svg>",
  'gulpereel': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M10 40 C10 35 18 30 30 30 L50 35 L50 55 L30 50 C18 48 10 45 10 40Z' fill='%231A1A2E'/> <path d='M10 80 C10 85 18 92 30 92 L50 85 L50 65 L30 70 C18 72 10 75 10 80Z' fill='%232D2D44'/> <path d='M12 45 L48 40 L48 80 L12 75 Z' fill='%230A0A15'/> <path d='M50 42 C60 38 80 40 95 48 C105 54 115 60 120 62 C115 66 105 70 95 72 C80 76 60 78 50 78 Z' fill='%231A1A2E'/> <path d='M50 55 C65 52 85 54 100 58 C105 60 110 62 120 62 C110 64 105 66 100 68 C85 72 65 74 50 65 Z' fill='%232D2D44' opacity='0.5'/> <circle cx='122' cy='62' r='4' fill='%23FF1744' opacity='0.8'/> <circle cx='122' cy='62' r='7' fill='%23FF1744' opacity='0.2'/> <circle cx='46' cy='42' r='6' fill='white'/> <circle cx='48' cy='43' r='4' fill='black'/> <circle cx='46' cy='41' r='1.5' fill='white'/> <circle cx='49' cy='42' r='0.8' fill='white'/> </svg>",
  'vampiresquid': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='vsBody' cx='40%' cy='40%' r='60%'> <stop offset='0%' stop-color='%23FF8A65'/> <stop offset='100%' stop-color='%23E64A19'/> </radialGradient> </defs> <ellipse cx='64' cy='50' rx='36' ry='28' fill='url(%23vsBody)'/> <ellipse cx='35' cy='35' rx='12' ry='8' transform='rotate(-30 35 35)' fill='%23FF7043'/> <ellipse cx='93' cy='35' rx='12' ry='8' transform='rotate(30 93 35)' fill='%23FF7043'/> <path d='M35 72 C30 85 28 98 32 105 C36 108 38 100 40 90 L44 75 Z' fill='%23E64A19'/> <path d='M44 75 C42 88 42 100 46 106 C50 108 50 98 50 88 L52 76 Z' fill='%23EF6C00'/> <path d='M52 76 C52 90 54 102 58 106 C62 108 62 98 62 88 L62 78 Z' fill='%23E64A19'/> <path d='M62 78 C64 92 66 102 70 106 C74 108 74 98 72 88 L70 76 Z' fill='%23EF6C00'/> <path d='M70 76 C72 88 74 100 78 106 C82 108 82 98 80 88 L78 75 Z' fill='%23E64A19'/> <path d='M78 75 C82 86 86 96 88 102 C92 104 90 96 88 86 L84 74 Z' fill='%23EF6C00'/> <path d='M84 74 C90 84 94 92 96 98 C98 100 98 92 96 84 L90 72 Z' fill='%23E64A19'/> <path d='M35 72 L44 75 L52 76 L62 78 L70 76 L78 75 L84 74 L90 72 C88 80 82 84 64 86 C46 84 38 80 35 72Z' fill='%23FF7043' opacity='0.5'/> <circle cx='50' cy='48' r='10' fill='white'/> <circle cx='53' cy='50' r='6' fill='black'/> <circle cx='50' cy='46' r='3' fill='white'/> <circle cx='54' cy='49' r='1.5' fill='white'/> <circle cx='78' cy='48' r='10' fill='white'/> <circle cx='81' cy='50' r='6' fill='black'/> <circle cx='78' cy='46' r='3' fill='white'/> <circle cx='82' cy='49' r='1.5' fill='white'/> <path d='M60 60 C62 62 66 62 68 60' stroke='%23BF360C' stroke-width='1.5' fill='none'/> </svg>",
  'barreleye': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='beDome' cx='50%' cy='40%' r='60%'> <stop offset='0%' stop-color='%23B3E5FC' stop-opacity='0.3'/> <stop offset='100%' stop-color='%2381D4FA' stop-opacity='0.15'/> </radialGradient> </defs> <ellipse cx='60' cy='72' rx='35' ry='20' fill='%23455A64'/> <path d='M28 60 C28 32 50 22 68 22 C82 22 92 32 92 52 C92 62 82 68 68 68 C50 68 28 68 28 60Z' fill='url(%23beDome)' stroke='%23B3E5FC' stroke-width='1' stroke-opacity='0.5'/> <ellipse cx='62' cy='48' rx='10' ry='6' fill='%23EF9A9A' opacity='0.3'/> <ellipse cx='48' cy='45' rx='6' ry='8' fill='%2300C853'/> <circle cx='48' cy='40' r='4' fill='%2369F0AE'/> <circle cx='48' cy='39' r='2' fill='white'/> <ellipse cx='68' cy='45' rx='6' ry='8' fill='%2300C853'/> <circle cx='68' cy='40' r='4' fill='%2369F0AE'/> <circle cx='68' cy='39' r='2' fill='white'/> <circle cx='32' cy='65' r='3' fill='black'/> <circle cx='32' cy='65' r='1.5' fill='%23263238'/> <path d='M28 68 C30 70 34 70 36 68' stroke='%2337474F' stroke-width='1' fill='none'/> <path d='M92 66 L108 58 L106 72 L108 86 L92 78 Z' fill='%2337474F'/> <path d='M50 88 L48 98 L56 92 Z' fill='%23546E7A' opacity='0.7'/> <path d='M55 54 L58 46 L62 54 Z' fill='%23546E7A' opacity='0.5'/> </svg>",
  'piranha': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='58' cy='64' rx='35' ry='28' fill='%2390A4AE'/> <path d='M30 68 C35 80 50 90 65 90 C78 90 88 82 90 72 C80 80 60 84 40 78 C34 76 30 72 30 68Z' fill='%23E53935'/> <ellipse cx='52' cy='55' rx='20' ry='12' fill='%23CFD8DC' opacity='0.5'/> <path d='M50 38 L55 26 L64 36 Z' fill='%2378909C'/> <path d='M55 90 L60 100 L68 90 Z' fill='%23C62828'/> <path d='M90 56 L108 46 L106 64 L108 82 L90 72 Z' fill='%2378909C'/> <path d='M40 74 L34 84 L46 80 Z' fill='%2390A4AE' opacity='0.7'/> <path d='M24 60 L24 72' stroke='%23455A64' stroke-width='1.5'/> <path d='M24 60 L26 63 L28 60 L30 63 L32 60' fill='white'/> <path d='M24 72 L26 69 L28 72 L30 69 L32 72' fill='white'/> <circle cx='36' cy='56' r='9' fill='white'/> <circle cx='39' cy='58' r='5' fill='%23D32F2F'/> <circle cx='39' cy='58' r='3' fill='black'/> <circle cx='37' cy='55' r='2' fill='white'/> <circle cx='40' cy='57' r='1' fill='white'/> <path d='M28 48 L42 52' stroke='%23455A64' stroke-width='2' stroke-linecap='round'/> </svg>",
  'oscar': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='58' cy='64' rx='38' ry='28' fill='%23263238'/> <ellipse cx='42' cy='55' rx='8' ry='6' fill='%23FF6D00' opacity='0.7'/> <ellipse cx='60' cy='50' rx='10' ry='7' fill='%23FF3D00' opacity='0.6'/> <ellipse cx='78' cy='56' rx='8' ry='6' fill='%23FF6D00' opacity='0.7'/> <ellipse cx='50' cy='70' rx='9' ry='6' fill='%23FF3D00' opacity='0.6'/> <ellipse cx='68' cy='72' rx='8' ry='5' fill='%23FF6D00' opacity='0.7'/> <ellipse cx='84' cy='65' rx='6' ry='5' fill='%23FF3D00' opacity='0.5'/> <circle cx='88' cy='62' r='6' fill='%231A1A1A'/> <circle cx='88' cy='62' r='4' fill='%23FF6D00'/> <circle cx='88' cy='62' r='2' fill='black'/> <path d='M35 38 C42 28 58 26 72 30 C78 32 82 36 82 38' fill='%2337474F'/> <path d='M45 90 C52 98 62 100 72 96 C76 94 78 90 78 88' fill='%2337474F'/> <path d='M92 56 L110 50 L108 64 L110 78 L92 72 Z' fill='%2337474F'/> <path d='M38 76 L32 86 L44 82 Z' fill='%2337474F' opacity='0.7'/> <circle cx='34' cy='56' r='9' fill='white'/> <circle cx='37' cy='58' r='5' fill='black'/> <circle cx='35' cy='55' r='2.5' fill='white'/> <circle cx='38' cy='57' r='1' fill='white'/> <path d='M22 66 C24 68 24 68 22 70' stroke='%231A1A1A' stroke-width='1.5' fill='none'/> </svg>",
  'stingray': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <ellipse cx='55' cy='64' rx='42' ry='32' fill='%23607D8B'/> <ellipse cx='55' cy='68' rx='35' ry='22' fill='%2390A4AE' opacity='0.4'/> <circle cx='38' cy='52' r='3' fill='%23455A64' opacity='0.5'/> <circle cx='55' cy='48' r='3.5' fill='%23455A64' opacity='0.5'/> <circle cx='72' cy='52' r='3' fill='%23455A64' opacity='0.5'/> <circle cx='45' cy='62' r='2.5' fill='%23455A64' opacity='0.5'/> <circle cx='65' cy='60' r='3' fill='%23455A64' opacity='0.5'/> <circle cx='40' cy='74' r='2.5' fill='%23455A64' opacity='0.5'/> <circle cx='58' cy='76' r='3' fill='%23455A64' opacity='0.5'/> <circle cx='74' cy='68' r='2.5' fill='%23455A64' opacity='0.5'/> <path d='M14 58 C10 55 8 60 10 66 C12 70 15 68 14 64' fill='%23546E7A'/> <path d='M96 58 C100 55 102 60 100 66 C98 70 95 68 96 64' fill='%23546E7A'/> <path d='M90 64 C100 64 110 66 120 72 C122 74 124 78 126 82' stroke='%23546E7A' stroke-width='3' fill='none' stroke-linecap='round'/> <path d='M120 72 L124 70 L126 74 Z' fill='%23455A64'/> <circle cx='42' cy='52' r='7' fill='white'/> <circle cx='44' cy='53' r='4' fill='black'/> <circle cx='42' cy='51' r='2' fill='white'/> <path d='M48 70 C52 72 58 72 62 70' stroke='%23455A64' stroke-width='1.5' fill='none'/> </svg>",
  'flowerhorn': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <linearGradient id='fhBody' x1='0' y1='0' x2='1' y2='1'> <stop offset='0%' stop-color='%23E53935'/> <stop offset='50%' stop-color='%23FF6F00'/> <stop offset='100%' stop-color='%231565C0'/> </linearGradient> </defs> <ellipse cx='60' cy='68' rx='38' ry='26' fill='url(%23fhBody)'/> <path d='M28 52 C24 38 28 24 38 20 C48 16 52 24 50 36 C48 44 42 50 34 52 Z' fill='%23FF5252'/> <circle cx='50' cy='60' r='3' fill='black' opacity='0.3'/> <circle cx='62' cy='58' r='3.5' fill='black' opacity='0.3'/> <circle cx='74' cy='62' r='3' fill='black' opacity='0.3'/> <circle cx='56' cy='72' r='3' fill='black' opacity='0.3'/> <circle cx='68' cy='74' r='2.5' fill='black' opacity='0.3'/> <circle cx='82' cy='68' r='2.5' fill='black' opacity='0.3'/> <path d='M30 68 C50 66 70 66 92 68' stroke='black' stroke-width='2' opacity='0.4'/> <path d='M42 44 C50 34 65 30 78 36 C82 38 85 42 85 44' fill='%231565C0' opacity='0.8'/> <path d='M50 92 C58 100 68 100 76 94' fill='%231565C0' opacity='0.8'/> <path d='M94 60 L112 52 L110 68 L112 84 L94 76 Z' fill='%231565C0'/> <path d='M38 80 L32 92 L46 86 Z' fill='%23E53935' opacity='0.7'/> <circle cx='34' cy='56' r='8' fill='white'/> <circle cx='37' cy='58' r='5' fill='%23D32F2F'/> <circle cx='37' cy='58' r='3' fill='black'/> <circle cx='35' cy='55' r='2' fill='white'/> <circle cx='38' cy='57' r='1' fill='white'/> <path d='M22 66 C20 64 18 66 18 70 C18 74 20 76 22 74 Z' fill='%23FFAB91'/> </svg>",
  'redtailcatfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <path d='M15 55 C15 40 35 32 60 32 C85 32 105 40 110 55 C112 62 112 72 110 78 C105 90 85 95 60 95 C35 95 15 82 15 55Z' fill='%2337474F'/> <path d='M18 68 C18 62 38 58 60 58 C85 58 108 62 108 68 C108 80 88 88 60 88 C38 88 18 80 18 68Z' fill='%23ECEFF1'/> <path d='M108 55 L124 42 L122 66 L124 90 L108 78 Z' fill='%23D32F2F'/> <path d='M55 34 L60 22 L68 32 Z' fill='%23263238'/> <path d='M85 38 C88 34 92 34 92 38' fill='%23263238'/> <path d='M30 82 L22 96 L38 90 Z' fill='%23455A64' opacity='0.7'/> <path d='M16 52 C6 44 0 36 -4 30' stroke='%23546E7A' stroke-width='2' fill='none'/> <path d='M16 58 C6 54 -2 52 -6 48' stroke='%23546E7A' stroke-width='2' fill='none'/> <path d='M16 64 C8 66 2 72 -2 78' stroke='%23546E7A' stroke-width='1.5' fill='none'/> <path d='M16 68 C8 72 2 80 -2 88' stroke='%23546E7A' stroke-width='1.5' fill='none'/> <path d='M15 50 C12 48 10 52 10 58 C10 64 12 68 15 66 Z' fill='%2337474F'/> <circle cx='24' cy='50' r='8' fill='white'/> <circle cx='27' cy='52' r='5' fill='black'/> <circle cx='25' cy='49' r='2' fill='white'/> <circle cx='28' cy='51' r='1' fill='white'/> <path d='M12 60 C14 62 14 62 12 64' stroke='%23263238' stroke-width='1.5' fill='none'/> </svg>",
  'electriceel': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='eeGlow' cx='50%' cy='50%' r='50%'> <stop offset='0%' stop-color='%23FFFF00' stop-opacity='0.3'/> <stop offset='100%' stop-color='%23FFFF00' stop-opacity='0'/> </radialGradient> </defs> <ellipse cx='64' cy='64' rx='60' ry='35' fill='url(%23eeGlow)'/> <path d='M8 58 C8 48 18 42 30 42 C50 42 55 48 70 50 C85 52 95 50 110 52 C118 54 122 58 122 64 C122 70 118 74 110 76 C95 78 85 76 70 74 C55 72 50 78 30 78 C18 78 8 72 8 58Z' fill='%23556B2F'/> <path d='M10 64 C10 60 22 56 35 56 C55 56 60 60 75 62 C90 64 100 62 115 64 C120 66 120 70 115 72 C100 74 90 72 75 70 C60 68 55 72 35 72 C22 72 10 68 10 64Z' fill='%238B9862' opacity='0.6'/> <path d='M40 38 L44 30 L38 34 L42 26' stroke='%23FFFF00' stroke-width='1.5' fill='none' opacity='0.7'/> <path d='M70 40 L74 32 L68 36 L72 28' stroke='%23FFFF00' stroke-width='1.5' fill='none' opacity='0.7'/> <path d='M95 42 L99 34 L93 38 L97 30' stroke='%23FFFF00' stroke-width='1.5' fill='none' opacity='0.7'/> <path d='M55 82 L59 90 L53 86 L57 94' stroke='%23FFFF00' stroke-width='1.5' fill='none' opacity='0.6'/> <path d='M85 80 L89 88 L83 84 L87 92' stroke='%23FFFF00' stroke-width='1.5' fill='none' opacity='0.6'/> <circle cx='18' cy='56' r='7' fill='white'/> <circle cx='20' cy='57' r='4' fill='black'/> <circle cx='18' cy='55' r='2' fill='white'/> <circle cx='21' cy='56' r='1' fill='%23FFFF00'/> <path d='M8 62 C10 64 10 64 8 66' stroke='%233E4A1E' stroke-width='1' fill='none'/> </svg>",
  'phoenix': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <linearGradient id='phBody' x1='0' y1='0' x2='1' y2='1'> <stop offset='0%' stop-color='%23FFD600'/> <stop offset='50%' stop-color='%23FF6D00'/> <stop offset='100%' stop-color='%23D50000'/> </linearGradient> <radialGradient id='phGlow' cx='50%' cy='50%' r='60%'> <stop offset='0%' stop-color='%23FFD600' stop-opacity='0.3'/> <stop offset='100%' stop-color='%23FF6D00' stop-opacity='0'/> </radialGradient> </defs> <ellipse cx='58' cy='64' rx='55' ry='45' fill='url(%23phGlow)'/> <ellipse cx='55' cy='64' rx='35' ry='22' fill='url(%23phBody)'/> <path d='M35 44 C32 30 38 18 42 14 C44 22 48 16 50 10 C52 20 56 14 58 8 C58 18 62 22 60 34' fill='%23FF6D00' opacity='0.8'/> <path d='M38 40 C36 28 42 22 44 18 C46 26 50 22 52 18 C52 28 55 24 56 36' fill='%23FFD600' opacity='0.6'/> <path d='M88 52 C95 42 105 30 110 24 C108 38 115 32 118 26 C115 40 120 36 122 32 C118 48 112 56 105 60' fill='%23D50000' opacity='0.8'/> <path d='M88 76 C95 86 105 98 110 104 C108 90 115 96 118 102 C115 88 120 92 122 96 C118 80 112 72 105 68' fill='%23D50000' opacity='0.8'/> <path d='M92 56 C100 48 108 38 112 32 C110 44 106 52 100 58' fill='%23FF6D00' opacity='0.6'/> <path d='M92 72 C100 80 108 90 112 96 C110 84 106 76 100 70' fill='%23FF6D00' opacity='0.6'/> <path d='M38 78 C32 86 28 96 26 102 C30 94 34 90 38 84' fill='%23FF6D00' opacity='0.7'/> <circle cx='36' cy='58' r='8' fill='white'/> <circle cx='39' cy='60' r='5' fill='%23D50000'/> <circle cx='39' cy='60' r='3' fill='black'/> <circle cx='37' cy='57' r='2' fill='white'/> <circle cx='40' cy='59' r='1' fill='%23FFD600'/> </svg>",
  'leviathan': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='lvEye' cx='50%' cy='50%' r='50%'> <stop offset='0%' stop-color='%23FF1744'/> <stop offset='100%' stop-color='%23FF1744' stop-opacity='0'/> </radialGradient> </defs> <path d='M10 55 C10 38 25 28 45 28 C65 28 70 38 75 48 C80 55 90 52 100 48 C110 44 118 48 122 56 C126 64 122 76 110 80 C100 84 90 78 80 72 C70 66 60 72 45 78 C30 84 10 78 10 55Z' fill='%231A237E'/> <path d='M14 62 C14 55 30 48 48 48 C60 48 68 52 74 58 C68 62 56 68 44 72 C30 76 14 72 14 62Z' fill='%23283593' opacity='0.6'/> <path d='M28 30 L32 20 L36 30' fill='%230D47A1'/> <path d='M42 28 L46 16 L50 28' fill='%230D47A1'/> <path d='M56 32 L60 22 L64 34' fill='%230D47A1'/> <path d='M98 46 L102 36 L106 48' fill='%230D47A1'/> <path d='M112 50 L116 40 L118 52' fill='%230D47A1'/> <path d='M118 56 C124 50 128 42 126 38 C122 42 120 50 118 56' fill='%231A237E'/> <path d='M118 72 C124 78 128 86 126 90 C122 86 120 78 118 72' fill='%231A237E'/> <ellipse cx='35' cy='48' rx='6' ry='4' fill='%23283593' opacity='0.4'/> <ellipse cx='50' cy='44' rx='6' ry='4' fill='%23283593' opacity='0.4'/> <circle cx='22' cy='50' r='12' fill='url(%23lvEye)'/> <circle cx='22' cy='50' r='8' fill='white'/> <circle cx='24' cy='52' r='5' fill='%23FF1744'/> <circle cx='24' cy='52' r='3' fill='black'/> <circle cx='22' cy='49' r='2' fill='white'/> <circle cx='25' cy='51' r='1' fill='%23FF8A80'/> <path d='M10 58 L6 56 L10 62 L4 60 L10 66' stroke='%230D47A1' stroke-width='1.5' fill='none'/> <path d='M8 56 L10 60 L12 56' fill='white'/> <path d='M6 60 L8 64 L10 60' fill='white'/> </svg>",
  'moonjellyfish': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <radialGradient id='mjGlow' cx='50%' cy='30%' r='60%'> <stop offset='0%' stop-color='%23E1F5FE' stop-opacity='0.9'/> <stop offset='100%' stop-color='%23B3E5FC' stop-opacity='0.3'/> </radialGradient> </defs> <path d='M24 58 C24 28 44 14 64 14 C84 14 104 28 104 58 L24 58Z' fill='url(%23mjGlow)' stroke='%23B3E5FC' stroke-width='1'/> <path d='M24 58 C30 62 36 56 42 60 C48 64 54 56 60 60 C66 64 72 56 78 60 C84 64 90 56 96 60 C100 62 104 58 104 58' fill='none' stroke='%2381D4FA' stroke-width='2'/> <circle cx='52' cy='38' r='8' fill='%23CE93D8' opacity='0.4'/> <circle cx='76' cy='38' r='8' fill='%23CE93D8' opacity='0.4'/> <circle cx='52' cy='50' r='8' fill='%23CE93D8' opacity='0.4'/> <circle cx='76' cy='50' r='8' fill='%23CE93D8' opacity='0.4'/> <path d='M32 60 C30 72 28 84 30 96 C32 102 34 108 32 114' stroke='%23B3E5FC' stroke-width='1.5' fill='none' opacity='0.6'/> <path d='M44 62 C42 76 44 88 42 100 C40 108 42 114 40 120' stroke='%23B3E5FC' stroke-width='1.5' fill='none' opacity='0.6'/> <path d='M56 62 C58 78 56 90 58 104 C60 110 58 116 60 122' stroke='%23B3E5FC' stroke-width='1.5' fill='none' opacity='0.5'/> <path d='M68 62 C66 78 68 90 66 104 C64 110 66 116 64 122' stroke='%23B3E5FC' stroke-width='1.5' fill='none' opacity='0.5'/> <path d='M80 62 C82 76 80 88 82 100 C84 108 82 114 84 120' stroke='%23B3E5FC' stroke-width='1.5' fill='none' opacity='0.6'/> <path d='M92 60 C94 72 96 84 94 96 C92 102 90 108 92 114' stroke='%23B3E5FC' stroke-width='1.5' fill='none' opacity='0.6'/> <circle cx='52' cy='34' r='6' fill='white' opacity='0.9'/> <circle cx='54' cy='35' r='3.5' fill='black'/> <circle cx='52' cy='33' r='1.5' fill='white'/> <circle cx='76' cy='34' r='6' fill='white' opacity='0.9'/> <circle cx='78' cy='35' r='3.5' fill='black'/> <circle cx='76' cy='33' r='1.5' fill='white'/> <path d='M58 42 C60 44 68 44 70 42' stroke='%2390CAF9' stroke-width='1.5' fill='none'/> </svg>",
  'crystaldragon': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <linearGradient id='cdPrism' x1='0' y1='0' x2='1' y2='1'> <stop offset='0%' stop-color='%23E1BEE7'/> <stop offset='25%' stop-color='%23B3E5FC'/> <stop offset='50%' stop-color='%23C8E6C9'/> <stop offset='75%' stop-color='%23FFF9C4'/> <stop offset='100%' stop-color='%23FFCDD2'/> </linearGradient> <radialGradient id='cdGlow' cx='50%' cy='50%' r='60%'> <stop offset='0%' stop-color='white' stop-opacity='0.4'/> <stop offset='100%' stop-color='white' stop-opacity='0'/> </radialGradient> </defs> <ellipse cx='60' cy='64' rx='55' ry='45' fill='url(%23cdGlow)'/> <polygon points='20,58 35,40 55,35 75,38 90,48 95,64 90,80 75,88 55,90 35,85 20,72' fill='url(%23cdPrism)' stroke='white' stroke-width='1' opacity='0.85'/> <line x1='55' y1='35' x2='55' y2='90' stroke='white' stroke-width='0.5' opacity='0.5'/> <line x1='35' y1='40' x2='75' y2='88' stroke='white' stroke-width='0.5' opacity='0.5'/> <line x1='75' y1='38' x2='35' y2='85' stroke='white' stroke-width='0.5' opacity='0.5'/> <line x1='20' y1='58' x2='95' y2='64' stroke='white' stroke-width='0.5' opacity='0.5'/> <line x1='20' y1='72' x2='90' y2='48' stroke='white' stroke-width='0.5' opacity='0.4'/> <polygon points='40,40 38,22 44,24 42,38' fill='%23B3E5FC' opacity='0.7'/> <polygon points='52,36 50,16 56,18 54,34' fill='%23E1BEE7' opacity='0.7'/> <polygon points='64,38 62,20 68,22 66,36' fill='%23C8E6C9' opacity='0.7'/> <polygon points='76,42 75,26 80,28 78,40' fill='%23FFF9C4' opacity='0.7'/> <polygon points='25,52 18,38 22,36 28,48' fill='%23CE93D8' opacity='0.8'/> <polygon points='30,46 24,30 28,28 34,42' fill='%23B3E5FC' opacity='0.8'/> <polygon points='90,48 108,36 112,42 96,56' fill='%23FFCDD2' opacity='0.7'/> <polygon points='95,64 115,64 112,70 96,68' fill='%23B3E5FC' opacity='0.7'/> <polygon points='90,80 108,92 112,86 96,74' fill='%23C8E6C9' opacity='0.7'/> <line x1='20' y1='60' x2='6' y2='52' stroke='%23CE93D8' stroke-width='1.5' opacity='0.6'/> <line x1='20' y1='66' x2='6' y2='70' stroke='%23B3E5FC' stroke-width='1.5' opacity='0.6'/> <circle cx='32' cy='56' r='8' fill='white'/> <circle cx='34' cy='58' r='5' fill='%237C4DFF'/> <circle cx='34' cy='58' r='3' fill='black'/> <circle cx='32' cy='55' r='2' fill='white'/> <circle cx='35' cy='57' r='1' fill='%23E1BEE7'/> </svg>",
  'cosmicwhale': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <linearGradient id='cwBody' x1='0' y1='0' x2='1' y2='1'> <stop offset='0%' stop-color='%231A237E'/> <stop offset='40%' stop-color='%234A148C'/> <stop offset='100%' stop-color='%23311B92'/> </linearGradient> <radialGradient id='cwNebula' cx='50%' cy='50%' r='50%'> <stop offset='0%' stop-color='%23E040FB' stop-opacity='0.3'/> <stop offset='100%' stop-color='%23E040FB' stop-opacity='0'/> </radialGradient> </defs> <path d='M8 58 C8 36 28 24 55 24 C80 24 100 34 108 50 C112 58 112 72 108 80 C100 96 80 102 55 102 C28 102 8 88 8 58Z' fill='url(%23cwBody)'/> <ellipse cx='60' cy='60' rx='35' ry='25' fill='url(%23cwNebula)'/> <circle cx='35' cy='45' r='1' fill='white' opacity='0.9'/> <circle cx='50' cy='38' r='1.5' fill='white' opacity='0.8'/> <circle cx='68' cy='42' r='1' fill='white' opacity='0.9'/> <circle cx='82' cy='50' r='1.5' fill='white' opacity='0.7'/> <circle cx='45' cy='60' r='1' fill='white' opacity='0.8'/> <circle cx='72' cy='55' r='1' fill='white' opacity='0.9'/> <circle cx='58' cy='48' r='1.5' fill='%23B388FF' opacity='0.8'/> <circle cx='90' cy='62' r='1' fill='white' opacity='0.7'/> <circle cx='38' cy='72' r='1' fill='white' opacity='0.8'/> <circle cx='55' cy='78' r='1' fill='white' opacity='0.7'/> <circle cx='75' cy='74' r='1.5' fill='%23B388FF' opacity='0.6'/> <circle cx='65' cy='65' r='1' fill='%23FF80AB' opacity='0.5'/> <path d='M50 50 C55 45 65 45 70 50 C75 55 75 65 70 70 C65 75 55 72 52 68' stroke='%237C4DFF' stroke-width='1' fill='none' opacity='0.4'/> <path d='M12 68 C12 62 32 56 55 56 C80 56 105 62 105 68 C102 84 82 92 55 92 C32 92 12 82 12 68Z' fill='%233949AB' opacity='0.4'/> <path d='M105 55 C112 42 122 32 126 28 C124 40 120 50 115 58' fill='%231A237E'/> <path d='M105 78 C112 90 122 100 126 104 C124 92 120 82 115 74' fill='%231A237E'/> <path d='M32 82 C24 92 20 100 22 104 C28 100 34 92 38 84' fill='%23311B92'/> <circle cx='22' cy='54' r='9' fill='white'/> <circle cx='25' cy='56' r='5' fill='%237C4DFF'/> <circle cx='25' cy='56' r='3' fill='black'/> <circle cx='23' cy='53' r='2.5' fill='white'/> <circle cx='26' cy='55' r='1' fill='%23E1BEE7'/> <path d='M10 64 C12 66 12 66 10 68' stroke='%230D47A1' stroke-width='1.5' fill='none'/> </svg>",
  'worldserpent': "data:image/svg+xml,<svg width='128' height='128' viewBox='0 0 128 128' xmlns='http://www.w3.org/2000/svg'> <defs> <linearGradient id='wsBody' x1='0' y1='0' x2='1' y2='0'> <stop offset='0%' stop-color='%231B5E20'/> <stop offset='100%' stop-color='%232E7D32'/> </linearGradient> </defs> <path d='M10 52 C10 38 22 30 38 30 C55 30 60 42 65 52 C70 60 80 58 90 52 C100 46 110 48 118 56 C124 62 122 72 115 78 C108 84 98 82 88 76 C78 70 68 72 58 80 C48 88 35 90 22 84 C12 78 10 68 10 52Z' fill='url(%23wsBody)'/> <path d='M14 58 C14 50 26 42 42 42 C54 42 58 50 64 58 C56 62 48 58 40 54 C30 50 20 52 14 58Z' fill='%23388E3C' opacity='0.5'/> <circle cx='30' cy='48' r='2.5' fill='%2369F0AE' opacity='0.8'/> <path d='M28 48 L32 48 M30 46 L30 50' stroke='%2369F0AE' stroke-width='1' opacity='0.8'/> <circle cx='50' cy='42' r='2.5' fill='%2369F0AE' opacity='0.7'/> <path d='M48 40 L52 44 M52 40 L48 44' stroke='%2369F0AE' stroke-width='1' opacity='0.7'/> <circle cx='75' cy='56' r='2.5' fill='%2369F0AE' opacity='0.8'/> <path d='M73 54 L77 58 M73 58 L77 54' stroke='%2369F0AE' stroke-width='1' opacity='0.8'/> <circle cx='100' cy='52' r='2.5' fill='%2369F0AE' opacity='0.7'/> <path d='M98 52 L102 52 M100 50 L100 54' stroke='%2369F0AE' stroke-width='1' opacity='0.7'/> <circle cx='55' cy='80' r='2.5' fill='%2369F0AE' opacity='0.6'/> <path d='M53 78 L57 82 M57 78 L53 82' stroke='%2369F0AE' stroke-width='1' opacity='0.6'/> <path d='M14 44 L8 30 L16 36 Z' fill='%231B5E20'/> <path d='M22 38 L18 22 L26 30 Z' fill='%231B5E20'/> <path d='M38 30 L40 22 L43 30' fill='%232E7D32'/> <path d='M48 32 L50 24 L53 32' fill='%232E7D32'/> <path d='M90 50 L92 42 L95 50' fill='%232E7D32'/> <path d='M108 52 L110 44 L113 54' fill='%232E7D32'/> <path d='M118 56 L126 50 L128 58' fill='%231B5E20'/> <path d='M118 74 L126 80 L128 72' fill='%231B5E20'/> <circle cx='16' cy='50' r='7' fill='white'/> <circle cx='18' cy='51' r='4' fill='%2369F0AE'/> <circle cx='18' cy='51' r='2.5' fill='black'/> <circle cx='16' cy='49' r='2' fill='white'/> <circle cx='19' cy='50' r='1' fill='%2369F0AE'/> <path d='M10 56 L6 54 L6 60 L10 58' fill='%230D3311'/> <path d='M7 54 L8 58' stroke='white' stroke-width='1.5' stroke-linecap='round'/> <path d='M9 54 L9.5 57' stroke='white' stroke-width='1' stroke-linecap='round'/> </svg>",
};

// ============================================================
// ✨ 変異種（レア魚）
// ============================================================
const VARIANT_TYPES = [
  { id:'gold',   name:'ゴールド', suffix:'【金】', incomeMultiplier:2.5,
    paletteOverride:{body:'#ffd700',fin:'#daa520',belly:'#fff8dc',stripe:'#b8860b'},
    glowColor:'rgba(255,215,0,0.4)', particleColor:'#ffd700' },
  { id:'albino', name:'アルビノ', suffix:'【白】', incomeMultiplier:2.5,
    paletteOverride:{body:'#fff5f5',fin:'#ffe0e0',belly:'#ffffff',stripe:'#ffcccc'},
    glowColor:'rgba(255,200,200,0.3)', particleColor:'#ffdddd' },
  { id:'neon',   name:'ネオン',   suffix:'【光】', incomeMultiplier:2.5,
    paletteOverride:null,
    glowColor:'rgba(0,255,200,0.6)', particleColor:'#00ffc8' },
  { id:'holo',   name:'ホロ',     suffix:'【虹】', incomeMultiplier:2.5,
    paletteOverride:null,
    glowColor:'rgba(255,255,255,0.4)', particleColor:'#ffffff' },
];

// ============================================================
// 📖 コレクション図鑑
// ============================================================
let collection = {};
function initCollection() {
  for (const ft of FISH_TYPES) {
    if (!collection[ft.id]) {
      collection[ft.id] = { discovered:false, variantDiscovered:{gold:false,albino:false,neon:false,holo:false}, hueShifts:[] };
    } else if (!collection[ft.id].hueShifts) {
      collection[ft.id].hueShifts = [];
    }
  }
}
function discoverFish(typeId, variantType, hueShift) {
  if (!collection[typeId]) collection[typeId] = { discovered:false, variantDiscovered:{gold:false,albino:false,neon:false,holo:false}, hueShifts:[] };
  if (!collection[typeId].hueShifts) collection[typeId].hueShifts = [];
  let isNew = false;
  if (!collection[typeId].discovered) {
    collection[typeId].discovered = true; isNew = true;
    const ft = FISH_TYPES.find(t => t.id === typeId);
    if (ft) showNotification('📖 図鑑登録！ ' + ft.name + ' を発見！');
  }
  if (variantType && !collection[typeId].variantDiscovered[variantType]) {
    collection[typeId].variantDiscovered[variantType] = true; isNew = true;
    const ft = FISH_TYPES.find(t => t.id === typeId);
    const vt = VARIANT_TYPES.find(v => v.id === variantType);
    if (ft && vt) showNotification('✨ レア図鑑！ ' + ft.name + vt.suffix + ' を発見！');
  }
  // カラーバリエーションを保存（変異種でない場合のみ、最大12色まで）
  if (hueShift !== undefined && !variantType) {
    const hs = collection[typeId].hueShifts;
    if (!hs.includes(hueShift) && hs.length < 12) hs.push(hueShift);
  }
  return isNew;
}
function getCollectionCompletion() {
  let total = 0, discovered = 0;
  for (const ft of FISH_TYPES) {
    total += 5;
    if (collection[ft.id]?.discovered) discovered++;
    for (const vt of VARIANT_TYPES) { if (collection[ft.id]?.variantDiscovered?.[vt.id]) discovered++; }
  }
  return { total, discovered, percent: Math.round(discovered/total*100) };
}

// ガチャ設定
const GACHA_TIERS = [
  { name:'ノーマルガチャ',   icon:'🎲', cost:50000,   variantChance:0.03, desc:'レア率3%' },
  { name:'プレミアムガチャ', icon:'🎰', cost:500000,  variantChance:0.08, desc:'レア率8%' },
  { name:'レジェンドガチャ', icon:'👑', cost:5000000, variantChance:0.15, desc:'レア率15%' },
];

// ============================================================
// 🗺️ エリア
// ============================================================
const AREAS = [
  { id:'freshwater', name:'淡水', icon:'🏞️', price:0, unlocked:true,
    desc:'最初のエリア。淡水の魚たち',
    bg: {
      day:   ['#0a3d5c','#0c5c7a','#0d3b4f'],
      night: ['#050d15','#081a28','#060f18'],
      blue:  ['#0a1a3a','#0c2a5a','#081540']
    },
    sandRGB:[194,170,110],
    plantStyle:'seaweed',
    plantColors:[{r:40,g:160,b:60},{r:30,g:130,b:80}]
  },
  { id:'coral', name:'サンゴ礁', icon:'🪸', price:2000000, unlocked:false,
    desc:'カラフルなサンゴの海',
    bg: {
      day:   ['#064a6e','#0878a0','#065a7a'],
      night: ['#031520','#052030','#041825'],
      blue:  ['#082050','#0a3878','#061848']
    },
    sandRGB:[230,210,170],
    plantStyle:'coral',
    plantColors:[{r:220,g:80,b:100},{r:255,g:140,b:60},{r:180,g:60,b:160}]
  },
  { id:'deepsea', name:'深海', icon:'🌑', price:20000000, unlocked:false,
    desc:'暗い深海。神秘的な生き物たち',
    bg: {
      day:   ['#020a14','#041828','#030e1c'],
      night: ['#010408','#020a14','#01060c'],
      blue:  ['#020818','#041430','#020c20']
    },
    sandRGB:[80,75,90],
    plantStyle:'deepsea',
    plantColors:[{r:20,g:60,b:80},{r:10,g:80,b:60}]
  },
  { id:'tropical', name:'熱帯河川', icon:'🌴', price:80000000, unlocked:false,
    desc:'アマゾンの大河。巨大魚の楽園',
    bg: {
      day:   ['#1a3a20','#1c5c30','#143a1c'],
      night: ['#080f08','#0c1a0e','#0a120a'],
      blue:  ['#0a2a1a','#0c3c2c','#081c14']
    },
    sandRGB:[160,130,80],
    plantStyle:'tropical',
    plantColors:[{r:30,g:180,b:40},{r:20,g:140,b:30},{r:60,g:160,b:50}]
  },
  { id:'mystic', name:'神秘の泉', icon:'✨', price:300000000, unlocked:false,
    desc:'不思議な光が漂う伝説のエリア',
    bg: {
      day:   ['#1a0a3a','#2c1a5a','#180840'],
      night: ['#0a0418','#14082a','#0c0520'],
      blue:  ['#100830','#1c1050','#0c0628']
    },
    sandRGB:[140,120,180],
    plantStyle:'crystal',
    plantColors:[{r:120,g:60,b:200},{r:80,g:40,b:160},{r:160,g:80,b:220}]
  },
];
