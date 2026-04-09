// === game.js === ゲームループ・描画・セーブロード・初期化
// ============================================================
// 🎵 BGMシステム（Web Audio API）
// ============================================================
let bgmCtx = null;
let bgmGain = null;
let bgmNodes = [];
let bgmOn = false;
let bgmVolume = 0.35;

function initBGM() {
  if (bgmCtx) return;
  bgmCtx = new (window.AudioContext || window.webkitAudioContext)();
  bgmGain = bgmCtx.createGain();
  bgmGain.gain.value = 0;
  bgmGain.connect(bgmCtx.destination);
}

function stopBGM() {
  if (!bgmCtx) return;
  bgmGain.gain.linearRampToValueAtTime(0, bgmCtx.currentTime + 1.5);
  setTimeout(() => {
    for (const n of bgmNodes) { try { n.stop(); } catch(e){} }
    bgmNodes = [];
  }, 1600);
}

function playAreaBGM(areaId) {
  if (!bgmCtx || !bgmOn) return;
  stopBGM();
  setTimeout(() => {
    const patterns = {
      freshwater: { notes:[261.6,293.7,329.6,349.2,392.0,440.0], tempo:0.8, type:'sine', filterFreq:800, lfoRate:0.3, pad:true, padNotes:[261.6,329.6,392.0] },
      coral:      { notes:[329.6,392.0,440.0,493.9,523.3,587.3], tempo:0.6, type:'triangle', filterFreq:1200, lfoRate:0.5, pad:true, padNotes:[329.6,440.0,523.3] },
      deepsea:    { notes:[130.8,146.8,164.8,174.6,196.0,220.0], tempo:1.4, type:'sine', filterFreq:400, lfoRate:0.15, pad:true, padNotes:[130.8,164.8,196.0] },
      tropical:   { notes:[293.7,329.6,370.0,415.3,440.0,493.9], tempo:0.5, type:'triangle', filterFreq:1500, lfoRate:0.7, pad:true, padNotes:[293.7,370.0,440.0] },
      mystic:     { notes:[220.0,261.6,293.7,329.6,392.0,440.0], tempo:1.0, type:'sine', filterFreq:600, lfoRate:0.2, pad:true, padNotes:[220.0,293.7,392.0] }
    };
    const p = patterns[areaId] || patterns.freshwater;
    bgmNodes = [];

    // パッドサウンド（持続和音）
    if (p.pad) {
      for (const freq of p.padNotes) {
        const osc = bgmCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq * 0.5;
        const g = bgmCtx.createGain();
        g.gain.value = 0.06;
        const filter = bgmCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = p.filterFreq * 0.5;
        filter.Q.value = 1;
        // LFOで音量をゆらす
        const lfo = bgmCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = p.lfoRate * 0.5 + Math.random() * 0.1;
        const lfoGain = bgmCtx.createGain();
        lfoGain.gain.value = 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(g.gain);
        lfo.start();
        osc.connect(filter);
        filter.connect(g);
        g.connect(bgmGain);
        osc.start();
        bgmNodes.push(osc, lfo);
      }
    }

    // メロディシーケンサー
    function scheduleNote() {
      if (!bgmOn || bgmNodes.length === 0) return;
      const freq = p.notes[Math.floor(Math.random() * p.notes.length)];
      const octave = Math.random() < 0.3 ? 2 : 1;
      const osc = bgmCtx.createOscillator();
      osc.type = p.type;
      osc.frequency.value = freq * octave;
      const env = bgmCtx.createGain();
      const dur = p.tempo * (0.8 + Math.random() * 0.8);
      env.gain.setValueAtTime(0, bgmCtx.currentTime);
      env.gain.linearRampToValueAtTime(0.08, bgmCtx.currentTime + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, bgmCtx.currentTime + dur);
      const filter = bgmCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = p.filterFreq;
      filter.Q.value = 2;
      osc.connect(filter);
      filter.connect(env);
      env.connect(bgmGain);
      osc.start();
      osc.stop(bgmCtx.currentTime + dur + 0.1);
      const next = dur * 0.6 + Math.random() * p.tempo * 0.5;
      setTimeout(scheduleNote, next * 1000);
    }
    scheduleNote();

    // フェードイン
    bgmGain.gain.cancelScheduledValues(bgmCtx.currentTime);
    bgmGain.gain.setValueAtTime(0, bgmCtx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(bgmVolume, bgmCtx.currentTime + 2);
  }, 1700);
}

function toggleBGM() {
  initBGM();
  bgmOn = !bgmOn;
  const btn = document.getElementById('bgmBtn');
  if (btn) {
    btn.classList.toggle('active-toggle', bgmOn);
    btn.querySelector('.gp-btn-icon').textContent = bgmOn ? '🔊' : '🔇';
  }
  if (bgmOn) {
    if (bgmCtx.state === 'suspended') bgmCtx.resume();
    playAreaBGM(currentAreaId);
  } else {
    stopBGM();
  }
}

// ============================================================
// 初期化
// ============================================================
function initEnvironment() {
  const area = getCurrentArea();
  const sr = area.sandRGB;
  plants = [];
  const pCount = area.plantStyle==='coral'?10 : area.plantStyle==='crystal'?12 : 8;
  for (let i = 0; i < pCount; i++) plants.push(new Plant(30+(canvas.width-60)*(i/(pCount-1))+(Math.random()-0.5)*40, area.plantColors, area.plantStyle));
  sandParticles = [];
  for (let i = 0; i < 80; i++) sandParticles.push({
    x: Math.random()*canvas.width, y: canvas.height-25+Math.random()*25, size: 1+Math.random()*2,
    color: `rgba(${sr[0]+Math.random()*55},${sr[1]+Math.random()*50},${sr[2]+Math.random()*60},${0.3+Math.random()*0.4})`
  });
  // エリアステートに保存
  areaStates[currentAreaId].plants = plants;
  areaStates[currentAreaId].sandParticles = sandParticles;
}

function firstInit() {
  initCollection();
  const loaded = loadGame();
  initEnvironment();
  if (!loaded) {
    for (let i = 0; i < 5; i++) { const f = new Fish('common'); fishes.push(f); discoverFish('common', null, f.hueShift); }
    areaStates[currentAreaId].fishes = fishes;
  }
  buildFoodSelector();
  buildAreaTabs();
  updateCoinDisplay();
  updateIncomeDisplay();
  updateBubblerBtn();
  updateWaterQualityBar();
  updateVisitorDisplay();
}

// ============================================================
// 放置系システム
// ============================================================

// --- オートフィーダー ---
function updateAutoFeeder() {
  if (autoFeederLevel <= 0) return;

  autoFeederTimer++;
  const interval = getAutoFeederInterval();
  if (autoFeederTimer >= interval) {
    autoFeederTimer = 0;
    const x = 60 + Math.random() * (canvas.width - 120);
    const y = 20;
    const foodType = getAutoFeederFoodType();
    const count = getAutoFeederFoodCount();
    // オートフィーダーはベース値（Lv1相当）でドロップ
    const cr = foodType.baseCoinReward;
    const ga = foodType.baseGrowAmount;
    for (let i = 0; i < count; i++) foods.push(new Food(x+(Math.random()-0.5)*20, y+(Math.random()-0.5)*8, foodType, cr, ga));
  }
}

// --- お宝バブル ---
function updateTreasureBubbles() {
  const hasTreasureGen = UPGRADES.find(u => u.id === 'treasureGen')?.owned;
  treasureTimer++;
  const interval = 600; // 10秒
  const chance = hasTreasureGen ? 0.4 : 0.15;

  if (treasureTimer >= interval) {
    treasureTimer = 0;
    if (Math.random() < chance) {
      treasureBubbles.push(new TreasureBubble(100 + Math.random()*(canvas.width-200)));
    }
  }

  treasureBubbles = treasureBubbles.filter(tb => {
    if (!tb.update()) {
      // 水面に到達 → コイン獲得
      addCoins(tb.reward, tb.x, 10);
      return false;
    }
    return true;
  });
  for (const tb of treasureBubbles) tb.draw();
}

// --- 水槽容量 ---
function getTankCapacity() {
  return TANK_SIZES[tankLevel - 1]?.capacity || 5;
}

// --- 繁殖 ---
function updateBreeding() {
  breedTimer++;
  const hasBoost = UPGRADES.find(u => u.id === 'breedBoost')?.owned;
  const interval = 108000; // 30分
  if (breedTimer >= interval) {
    breedTimer = 0;
    if (fishes.length >= getTankCapacity()) return; // 上限

    // タイプごとにカウント
    const counts = {};
    for (const f of fishes) { counts[f.typeId] = (counts[f.typeId]||0) + 1; }

    for (const [typeId, count] of Object.entries(counts)) {
      if (count >= 2) {
        let chance = hasBoost ? 0.04 : 0.02;
          if (loveSeasonRemaining > 0) chance *= 5;
        if (Math.random() < chance) {
          const parent = fishes.find(f => f.typeId === typeId);
          // 5%の確率で変異種！
          const isVariant = Math.random() < 0.05;
          let variantType = null;
          if (isVariant) variantType = VARIANT_TYPES[Math.floor(Math.random()*VARIANT_TYPES.length)].id;
          const baby = new Fish(typeId, parent.x + (Math.random()-0.5)*30, parent.y + (Math.random()-0.5)*20, isVariant, variantType);
          baby.size = baby.baseSize * 0.6;
          fishes.push(baby);
          discoverFish(typeId, variantType, baby.hueShift);
          const typeName = FISH_TYPES.find(t => t.id === typeId)?.name || typeId;
          const vtSuffix = isVariant ? VARIANT_TYPES.find(v => v.id===variantType).suffix : '';
          const prefix = isVariant ? '✨ レア！ ' : '🎉 ';
          showNotification(prefix + typeName + vtSuffix + 'の赤ちゃんが生まれた！');
          updateIncomeDisplay(); buildAreaTabs();
          break;
        }
      }
    }
  }
}

// ============================================================
// 💧 水質管理
// ============================================================
function getWaterPollutionRate() {
  let rate = WATER_QUALITY.basePollutionPerFishPerFrame * fishes.length;
  if (bubblerOn) rate *= (1 - WATER_QUALITY.bubblerReduction);
  if (lightMode === 'night') rate *= (1 - WATER_QUALITY.nightReduction);
  if (UPGRADES.find(u => u.id === 'waterFilter')?.owned) rate *= 0.7;
  if (UPGRADES.find(u => u.id === 'premiumFilter')?.owned) rate *= 0.7;
  if (stormRemaining > 0) rate *= 3; // 嵐中は汚染3倍速
  return rate;
}

function getWaterQualityIncomeMultiplier() {
  const WQ = WATER_QUALITY;
  return WQ.incomeMultiplierMin + (WQ.incomeMultiplierMax - WQ.incomeMultiplierMin) * (waterQuality / 100);
}

function getWaterChangeCost() {
  return WATER_QUALITY.waterChangeCostBase + WATER_QUALITY.waterChangeCostPerFish * fishes.length;
}

function updateWaterQuality() {
  const rate = getWaterPollutionRate();
  waterQuality = Math.max(0, waterQuality - rate);
  updateWaterQualityBar();
}

function doWaterChange() {
  const cost = getWaterChangeCost();
  if (!spendCoins(cost)) { showNotification('コインが足りません！'); return; }
  waterQuality = 100;
  waterChangeCount++;
  showNotification('💧 水替え完了！水がキレイになった！');
  for (const v of visitors) {
    if (v.state === 'viewing') {
      v.reactEmoji = '✨🤩';
      v.reactTimer = 90;
      v.stayTimer += 300;
    }
  }
}

// ============================================================
// 👥 来客システム
// ============================================================
function getAttractionScore() {
  const uniqueTypes = new Set(fishes.map(f => f.typeId)).size;
  const varietyScore = Math.min(uniqueTypes * 5, 40);
  let rarityScore = 0;
  for (const f of fishes) {
    if (f.isVariant) rarityScore += 5;
    else if (f.type.shopPrice >= 10000000) rarityScore += 3;
    else if (f.type.shopPrice >= 1000000) rarityScore += 2;
    else if (f.type.shopPrice >= 100000) rarityScore += 1;
  }
  rarityScore = Math.min(rarityScore, 30);
  const qualityScore = waterQuality * 0.3;
  return Math.min(Math.round(varietyScore + rarityScore + qualityScore), 100);
}

function calculateVisitorTip(visitor) {
  const attraction = getAttractionScore();
  const qualityMult = waterQuality / 100;
  let tip = VISITOR_CONFIG.baseTipAmount;
  tip *= (1 + attraction / 100);
  tip *= (0.5 + qualityMult * 0.5);
  tip *= visitor.tipMult;
  tip *= getTotalPassiveIncome() * 0.01 + 1;
  if (UPGRADES.find(u => u.id === 'giftShop')?.owned) tip *= 2;
  if (UPGRADES.find(u => u.id === 'visitorSign')?.owned) tip *= 1.2;
  return Math.max(1, Math.floor(tip));
}

function getVisitorCap() {
  let cap = VISITOR_CONFIG.baseVisitorCap;
  cap += (AREAS.filter(a => a.unlocked).length - 1) * VISITOR_CONFIG.capPerUnlockedArea;
  if (UPGRADES.find(u => u.id === 'visitorSign')?.owned) cap += 3;
  return cap;
}

function getBustleBonus() {
  const cap = getVisitorCap();
  if (visitors.length >= cap * VISITOR_CONFIG.bustleBonusThreshold) return VISITOR_CONFIG.bustleBonusMultiplier;
  return 1.0;
}

function updateVisitors() {
  visitors = visitors.filter(v => v.update());
  visitorTimer++;
  if (visitorTimer >= VISITOR_CONFIG.spawnInterval) {
    visitorTimer = 0;
    trySpawnVisitor();
  }
  updateVisitorDisplay();
}

function trySpawnVisitor() {
  if (waterQuality < VISITOR_CONFIG.noSpawnThreshold) return;
  if (fishes.length === 0) return;
  const attraction = getAttractionScore();
  if (Math.random() > attraction / 100) return;
  if (visitors.length >= getVisitorCap()) return;
  const isPhotographer = attraction >= VISITOR_CONFIG.photographerAttractionMin &&
    waterQuality >= VISITOR_CONFIG.photographerQualityMin && Math.random() < 0.15;
  let type;
  if (!isPhotographer) {
    const totalW = VISITOR_TYPES.reduce((s, v) => s + v.weight, 0);
    let roll = Math.random() * totalW;
    type = VISITOR_TYPES[0];
    for (const vt of VISITOR_TYPES) { roll -= vt.weight; if (roll <= 0) { type = vt; break; } }
  } else {
    type = VISITOR_TYPES[0];
  }
  visitors.push(new Visitor(type, isPhotographer));
}

function visitorCharHTML(v) {
  const cls = v.css || '';
  return '<div class="v-char ' + cls + '">' +
    '<div class="v-hair"></div>' +
    '<div class="v-head"><div class="v-mouth"></div><div class="v-blush-l"></div><div class="v-blush-r"></div></div>' +
    '<div class="v-body"></div>' +
    '</div>';
}

function drawVisitors() {
  // 古いDOM要素のクリーンアップ
  document.querySelectorAll('.visitor-sprite').forEach(el => {
    if (!el._visitorRef || !visitors.includes(el._visitorRef)) el.remove();
  });
  const walkway = document.getElementById('visitorWalkway');
  if (!walkway) return;
  for (const v of visitors) {
    let el = v._domElement;
    if (!el) {
      el = document.createElement('div');
      el.className = 'visitor-sprite';
      el._visitorRef = v;
      v._domElement = el;
      el.innerHTML = visitorCharHTML(v);
      walkway.appendChild(el);
    }
    const bobY = Math.sin(v.bobPhase) * 2;
    el.style.left = v.x + 'px';
    el.style.transform = `scaleX(${v.direction}) translateY(${bobY}px)`;
    if (v.reactTimer > 0 && v.reactEmoji) {
      if (!el._reacting) {
        el.innerHTML = visitorCharHTML(v) + '<span class="visitor-react">' + v.reactEmoji + '</span>';
        el._reacting = true;
      }
    } else if (el._reacting) {
      el.innerHTML = visitorCharHTML(v);
      el._reacting = false;
    }
  }
}

// ============================================================
// 🎲 ランダムイベント
// ============================================================
function eventSleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function showEventNotification(text) {
  const el = document.getElementById('eventNotification');
  document.getElementById('eventNotificationText').textContent = text;
  el.style.display = 'block';
  addEventLog(text);
}
function hideEventNotification() { document.getElementById('eventNotification').style.display = 'none'; }

function showGoldenTimeIndicator() {
  if (document.getElementById('goldenTimeBar')) return;
  const bar = document.createElement('div');
  bar.className = 'golden-time-indicator'; bar.id = 'goldenTimeBar';
  tankWrapper.appendChild(bar);
  const text = document.createElement('div');
  text.className = 'golden-time-text'; text.id = 'goldenTimeText';
  text.textContent = '✨ x' + goldenTimeMultiplier;
  tankWrapper.appendChild(text);
}
function removeGoldenTimeIndicator() {
  document.getElementById('goldenTimeBar')?.remove();
  document.getElementById('goldenTimeText')?.remove();
}

function updateRandomEvents() {
  if (sharkCooldown > 0) sharkCooldown--;
  if (goldenTimeRemaining > 0) {
    goldenTimeRemaining--;
    if (goldenTimeRemaining <= 0) {
      goldenTimeMultiplier = 1;
      removeGoldenTimeIndicator();
      showNotification('✨ ゴールデンタイム終了！');
    }
  }
  // 恋の季節タイマー
  if (loveSeasonRemaining > 0) {
    loveSeasonRemaining--;
    if (loveSeasonRemaining <= 0) showNotification('💕 恋の季節が終わった…');
  }
  // 満月の夜タイマー
  if (fullMoonRemaining > 0) {
    fullMoonRemaining--;
    if (fullMoonRemaining <= 0) showNotification('🌕 満月の夜が明けた');
  }
  // 嵐タイマー
  if (stormRemaining > 0) {
    stormRemaining--;
    if (stormRemaining <= 0) showNotification('⛈️ 嵐が去った！');
  }
  if (eventAnimating || gachaAnimating) return;
  randomEventTimer++;
  if (randomEventTimer >= 432000) {
    randomEventTimer = 0;
    if (Math.random() < 0.15) triggerRandomEvent();
  }
}

function triggerRandomEvent() {
  let pool = RANDOM_EVENTS.slice();
  if (sharkCooldown > 0 || fishes.length < 3) pool = pool.filter(e => e.id !== 'sharkAttack');
  if (fishes.length >= getTankCapacity()) pool = pool.filter(e => e.id !== 'mysteryVisitor' && e.id !== 'lostFish');
  if (fishes.length < 2) pool = pool.filter(e => e.id !== 'loveSeason');
  if (pool.length === 0) return;
  const totalWeight = pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight, chosen = pool[0];
  for (const ev of pool) { roll -= ev.weight; if (roll <= 0) { chosen = ev; break; } }
  executeEvent(chosen);
}

function executeEvent(event) {
  switch (event.id) {
    case 'coinRain':      executeCoinRain(event); break;
    case 'goldenTime':    executeGoldenTime(event); break;
    case 'treasureChest': executeTreasureChest(event); break;
    case 'mysteryVisitor':executeMysteryVisitor(event); break;
    case 'sharkAttack':   executeSharkAttack(event); break;
    case 'lostFish':      executeLostFish(event); break;
    case 'loveSeason':    executeLoveSeason(event); break;
    case 'mermaidVisit':  executeMermaidVisit(event); break;
    case 'fullMoon':      executeFullMoon(event); break;
    case 'stormNight':    executeStormNight(event); break;
    case 'algaeBloom':    executeAlgaeBloom(event); break;
    case 'typhoon':       executeTyphoon(event); break;
  }
}

async function executeCoinRain(event) {
  eventAnimating = true;
  const income = getTotalPassiveIncome();
  const reward = Math.max(Math.floor(income * 30), 500);
  showEventNotification(event.message);
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const coin = document.createElement('div');
      coin.className = 'coin-rain-particle'; coin.textContent = '🪙';
      coin.style.left = (Math.random() * 100) + 'vw';
      coin.style.animationDuration = (1.5 + Math.random()) + 's';
      document.body.appendChild(coin);
      setTimeout(() => coin.remove(), 2500);
    }, i * 100);
  }
  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash gold active';
  setTimeout(() => flash.className = 'event-flash', 200);
  addCoins(reward, canvas.width / 2, canvas.height / 2);
  await eventSleep(2500);
  hideEventNotification();
  eventAnimating = false;
}

async function executeGoldenTime(event) {
  eventAnimating = true;
  goldenTimeRemaining = event.duration;
  goldenTimeMultiplier = event.multiplier;
  showEventNotification(event.message);
  showGoldenTimeIndicator();
  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash gold active';
  setTimeout(() => flash.className = 'event-flash', 200);
  await eventSleep(2000);
  hideEventNotification();
  eventAnimating = false;
}

async function executeTreasureChest(event) {
  eventAnimating = true;
  const income = getTotalPassiveIncome();
  const reward = Math.max(Math.floor(income * 60), 2000);
  showEventNotification(event.message);
  const box = document.createElement('div');
  box.className = 'treasure-reveal';
  box.textContent = '🎁';
  box.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:25';
  tankWrapper.appendChild(box);
  await eventSleep(1200);
  box.textContent = '💎';
  addCoins(reward, canvas.width / 2, canvas.height / 2);
  await eventSleep(1500);
  box.remove();
  hideEventNotification();
  eventAnimating = false;
}

async function executeMysteryVisitor(event) {
  eventAnimating = true;
  const pool = FISH_TYPES.filter(f => f.area === currentAreaId);
  const weights = pool.map(f => Math.sqrt(Math.max(f.shopPrice, 1)));
  const totalW = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalW, chosen = pool[0];
  for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { chosen = pool[i]; break; } }
  const isVariant = Math.random() < 0.1;
  let variantType = null;
  if (isVariant) variantType = VARIANT_TYPES[Math.floor(Math.random() * VARIANT_TYPES.length)].id;
  const fish = new Fish(chosen.id, canvas.width / 2, canvas.height / 2, isVariant, variantType);
  fishes.push(fish);
  chosen.unlocked = true;
  discoverFish(chosen.id, variantType, fish.hueShift);
  const vtSuffix = isVariant ? VARIANT_TYPES.find(v => v.id === variantType).suffix : '';
  showEventNotification('🌟 ' + chosen.name + vtSuffix + ' が水槽にやってきた！');
  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash gold active';
  setTimeout(() => flash.className = 'event-flash', 200);
  updateIncomeDisplay(); buildAreaTabs();
  await eventSleep(2500);
  hideEventNotification();
  eventAnimating = false;
}

async function executeSharkAttack(event) {
  eventAnimating = true;
  sharkCooldown = 36000;
  const lostCount = fishes.length;
  const lostIncome = fishes.reduce((s, f) => s + f.getPassiveIncome(), 0);
  const insurance = Math.floor(lostIncome * 3);

  // 警告
  showEventNotification('...?! 水面に不穏な影が...');
  await eventSleep(1500);

  // 赤オーバーレイ
  const overlay = document.getElementById('sharkOverlay');
  overlay.classList.add('open');
  await eventSleep(300);
  overlay.classList.add('danger');

  // サメ横切り
  hideEventNotification();
  showEventNotification('🦈 サメ襲来！！！');
  const shark = document.createElement('div');
  shark.className = 'shark-icon'; shark.textContent = '🦈';
  document.body.appendChild(shark);
  await eventSleep(1500);
  shark.remove();

  // フラッシュ
  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash red active';
  await eventSleep(150);
  flash.className = 'event-flash';

  // 魚全滅（レア魚は50%生存）
  const survivors = fishes.filter(f => f.isVariant && Math.random() < 0.5);
  fishes.length = 0;
  for (const s of survivors) fishes.push(s);
  areaStates[currentAreaId].fishes = fishes;

  // 結果表示
  hideEventNotification();
  const eaten = lostCount - survivors.length;
  const survivorMsg = survivors.length > 0 ? '\n✨ レアの魚が' + survivors.length + '匹生き残った！' : '';
  showEventNotification('🦈 サメが去った...' + eaten + '匹の魚が食べられた' + survivorMsg);

  // 保険金
  if (insurance > 0) {
    addCoins(insurance, canvas.width / 2, 30);
    showNotification('🛡️ 保険金 +' + insurance.toLocaleString() + '🪙');
  }

  updateIncomeDisplay(); buildAreaTabs();
  await eventSleep(3000);

  overlay.classList.remove('danger');
  await eventSleep(500);
  overlay.classList.remove('open');
  hideEventNotification();
  eventAnimating = false;
}

// --- 迷子の魚 ---
async function executeLostFish(event) {
  eventAnimating = true;
  showEventNotification(event.message);
  await eventSleep(1500);
  // 現在エリアからランダムに1匹
  const pool = FISH_TYPES.filter(f => f.area === currentAreaId);
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const fish = new Fish(chosen.id, -20, canvas.height * 0.5);
  fish.size = fish.baseSize * 0.7; // ちょっと小さめ
  fishes.push(fish);
  chosen.unlocked = true;
  discoverFish(chosen.id, null, fish.hueShift);
  hideEventNotification();
  showEventNotification('🐠 ' + chosen.name + 'が仲間になった！助けてくれてありがとう！');
  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash gold active';
  setTimeout(() => flash.className = 'event-flash', 200);
  updateIncomeDisplay(); buildAreaTabs(); updateFishCountDisplay();
  await eventSleep(2500);
  hideEventNotification();
  eventAnimating = false;
}

// --- 恋の季節 ---
let loveSeasonRemaining = 0;
async function executeLoveSeason(event) {
  eventAnimating = true;
  loveSeasonRemaining = 3600; // 60秒間
  showEventNotification(event.message);
  // ハートを飛ばす演出
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const h = document.createElement('div');
      h.className = 'coin-rain-particle'; h.textContent = '💕';
      h.style.left = (10 + Math.random() * 80) + 'vw';
      h.style.animationDuration = (2 + Math.random()) + 's';
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 3000);
    }, i * 150);
  }
  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash gold active';
  setTimeout(() => flash.className = 'event-flash', 200);
  await eventSleep(2500);
  showEventNotification('💕 60秒間、繁殖確率が5倍に！');
  await eventSleep(2000);
  hideEventNotification();
  eventAnimating = false;
}

// --- 人魚の訪問 ---
async function executeMermaidVisit(event) {
  eventAnimating = true;
  showEventNotification('🧜 水面がキラキラと光り出した…');
  await eventSleep(2000);

  // 特別演出
  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash gold active';
  await eventSleep(200);
  flash.className = 'event-flash';

  showEventNotification('🧜 人魚が現れた！特別な贈り物を置いていった…');
  await eventSleep(1500);

  // 変異種確定で1匹プレゼント
  const pool = FISH_TYPES.filter(f => f.area === currentAreaId);
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const variantType = VARIANT_TYPES[Math.floor(Math.random() * VARIANT_TYPES.length)].id;
  const fish = new Fish(chosen.id, canvas.width / 2, canvas.height / 2, true, variantType);
  fishes.push(fish);
  chosen.unlocked = true;
  discoverFish(chosen.id, variantType, fish.hueShift);
  const vtName = VARIANT_TYPES.find(v => v.id === variantType).suffix;

  hideEventNotification();
  showEventNotification('🧜✨ ' + chosen.name + vtName + ' が贈られた！');

  // 追加ボーナス: コインも
  const bonus = Math.max(Math.floor(getTotalPassiveIncome() * 50), 5000);
  addCoins(bonus, canvas.width / 2, 40);

  updateIncomeDisplay(); buildAreaTabs(); updateFishCountDisplay();
  await eventSleep(3000);
  hideEventNotification();
  eventAnimating = false;
}

// --- 満月の夜 ---
let fullMoonRemaining = 0;
async function executeFullMoon(event) {
  eventAnimating = true;
  fullMoonRemaining = 5400; // 90秒間
  showEventNotification(event.message);

  // ナイトモードに切り替え
  const prevLight = lightMode;
  lightMode = 'night';

  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash gold active';
  setTimeout(() => flash.className = 'event-flash', 300);

  await eventSleep(2000);
  showEventNotification('🌕 90秒間、収入1.5倍＆レア出現率UP！');
  await eventSleep(2500);
  hideEventNotification();
  eventAnimating = false;
}

// --- 嵐の夜 ---
let stormRemaining = 0;
async function executeStormNight(event) {
  eventAnimating = true;
  stormRemaining = 3600; // 60秒
  showEventNotification(event.message);

  // 暗くする
  lightMode = 'night';

  const overlay = document.getElementById('sharkOverlay');
  overlay.classList.add('open');
  await eventSleep(300);

  showEventNotification('⛈️ 60秒間、水質が急速に悪化する！耐えろ！');
  await eventSleep(2500);
  overlay.classList.remove('open');
  hideEventNotification();
  eventAnimating = false;
}

// --- 藻の大繁殖 ---
async function executeAlgaeBloom(event) {
  eventAnimating = true;
  showEventNotification(event.message);
  await eventSleep(1500);

  // 水質を大幅ダウン
  const drop = 25 + Math.random() * 20;
  waterQuality = Math.max(0, waterQuality - drop);
  updateWaterQualityBar();

  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash red active';
  setTimeout(() => flash.className = 'event-flash', 200);

  hideEventNotification();
  showEventNotification('🦠 水質が' + Math.round(drop) + 'ポイント低下！水替えして！');
  await eventSleep(3000);
  hideEventNotification();
  eventAnimating = false;
}

// --- 台風接近 ---
async function executeTyphoon(event) {
  eventAnimating = true;
  showEventNotification(event.message);
  await eventSleep(1500);

  const overlay = document.getElementById('sharkOverlay');
  overlay.classList.add('open');
  showEventNotification('🌀 台風直撃！水槽が揺れている！');
  await eventSleep(2000);

  // 水質ダウン + 一部の魚がはぐれる（最大3匹消失）
  waterQuality = Math.max(0, waterQuality - 15);
  updateWaterQualityBar();
  const lostCount = Math.min(fishes.length, Math.floor(Math.random() * 3) + 1);
  const lost = [];
  for (let i = 0; i < lostCount; i++) {
    const idx = Math.floor(Math.random() * fishes.length);
    lost.push(fishes[idx]);
    fishes.splice(idx, 1);
  }
  areaStates[currentAreaId].fishes = fishes;

  const flash = document.getElementById('eventFlash');
  flash.className = 'event-flash red active';
  await eventSleep(200);
  flash.className = 'event-flash';

  hideEventNotification();
  showEventNotification('🌀 台風が去った…' + lostCount + '匹がはぐれてしまった');
  await eventSleep(2000);

  // 報酬：耐えたボーナス
  const reward = Math.max(Math.floor(getTotalPassiveIncome() * 20), 1000);
  addCoins(reward, canvas.width / 2, canvas.height / 2);
  showNotification('💪 台風を乗り越えた！ボーナス +' + reward.toLocaleString() + '🪙');
  updateIncomeDisplay(); buildAreaTabs(); updateFishCountDisplay();

  await eventSleep(2000);
  overlay.classList.remove('open');
  hideEventNotification();
  eventAnimating = false;
}

// ============================================================
// 背景＆水面
// ============================================================
// 手描き風の揺らぎ線ヘルパー
function wobblyLine(x1,y1,x2,y2,wobble) {
  const steps = Math.ceil(Math.hypot(x2-x1,y2-y1)/8);
  ctx.moveTo(x1,y1);
  for (let i=1;i<=steps;i++) {
    const t = i/steps;
    ctx.lineTo(
      x1+(x2-x1)*t + (Math.sin(i*3.7)*wobble),
      y1+(y2-y1)*t + (Math.cos(i*2.3)*wobble)
    );
  }
}

// 丸っこい石ヘルパー（絵本風）
function drawRoundStone(cx,cy,w,h,color,outlineColor) {
  ctx.fillStyle = color;
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(cx,cy,w,h,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
  // ハイライト
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath(); ctx.ellipse(cx-w*0.2,cy-h*0.3,w*0.4,h*0.3,0,0,Math.PI*2); ctx.fill();
}

// 絵本風の星マーク
function drawStar(cx,cy,r,color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i=0;i<5;i++) {
    const a = Math.PI*2/5*i - Math.PI/2;
    const a2 = a + Math.PI/5;
    ctx.lineTo(cx+Math.cos(a)*r, cy+Math.sin(a)*r);
    ctx.lineTo(cx+Math.cos(a2)*r*0.4, cy+Math.sin(a2)*r*0.4);
  }
  ctx.closePath(); ctx.fill();
}

function drawBackground(time) {
  const area = getCurrentArea();
  const areaId = area.id;
  const bgc = area.bg[lightMode] || area.bg.day;
  const sr = area.sandRGB;
  const W = canvas.width, H = canvas.height;
  const nA = lightMode==='night' ? 0.35 : 1;

  // 基本グラデーション（少し明るめ、パステル寄り）
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, bgc[0]); grad.addColorStop(0.5, bgc[1]); grad.addColorStop(1, bgc[2]);
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);

  // 紙のテクスチャ感（薄いノイズオーバーレイ）
  ctx.fillStyle = `rgba(255,250,240,${0.03*nA})`;
  for (let i=0;i<20;i++) {
    const tx = (i*41)%W, ty = (i*67)%H;
    ctx.fillRect(tx, ty, 60+i*3%40, 40+i*5%30);
  }

  // 水質ティント
  if (waterQuality < WATER_QUALITY.greenTintStart) {
    if (waterQuality > WATER_QUALITY.brownTintStart) {
      const severity = 1 - waterQuality / WATER_QUALITY.greenTintStart;
      ctx.fillStyle = `rgba(60,120,30,${severity * 0.25})`;
      ctx.fillRect(0,0,W,H);
    } else {
      const severity = 1 - waterQuality / WATER_QUALITY.brownTintStart;
      ctx.fillStyle = `rgba(80,60,20,${0.15 + severity * 0.25})`;
      ctx.fillRect(0,0,W,H);
    }
  }

  // 水質低下ゴミ描画
  if (waterQuality < 75) {
    const dirtLevel = 1 - waterQuality / 75; // 0〜1

    // --- ガラス面の苔・ぬめり ---
    if (dirtLevel > 0.3) {
      const ma = (dirtLevel - 0.3) * 0.7;
      // 左壁の苔
      const gL = ctx.createLinearGradient(0,0,35,0);
      gL.addColorStop(0, `rgba(45,80,25,${ma*0.55})`);
      gL.addColorStop(1, 'rgba(45,80,25,0)');
      ctx.fillStyle = gL; ctx.fillRect(0, H*0.25, 35, H*0.75);
      // 右壁の苔
      const gR = ctx.createLinearGradient(W,0,W-35,0);
      gR.addColorStop(0, `rgba(45,80,25,${ma*0.55})`);
      gR.addColorStop(1, 'rgba(45,80,25,0)');
      ctx.fillStyle = gR; ctx.fillRect(W-35, H*0.25, 35, H*0.75);
      // 底ぬめり
      const gB = ctx.createLinearGradient(0,H,0,H-30);
      gB.addColorStop(0, `rgba(65,70,25,${ma*0.65})`);
      gB.addColorStop(1, 'rgba(65,70,25,0)');
      ctx.fillStyle = gB; ctx.fillRect(0, H-30, W, 30);
      // 壁の苔スポット
      ctx.globalAlpha = ma * 0.6;
      for (let i = 0; i < 8; i++) {
        const mx = (i < 4) ? 3 + (i%4)*3 : W - 4 - (i%4)*3;
        const my = H*0.35 + i*H*0.08;
        ctx.fillStyle = `rgb(${40+i*5},${70+i*3},${20+i*2})`;
        ctx.beginPath();
        ctx.ellipse(mx, my, 6+i%4, 8+i%5, 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // --- 底のヘドロ・沈殿物 ---
    const sludgeCount = Math.floor(dirtLevel * 10);
    for (let i = 0; i < sludgeCount; i++) {
      const sx = ((i * 7919 + 503) % (W - 60)) + 30;
      const sy = H - 6 - (i % 3) * 4;
      const sw = 14 + (i * 37) % 24;
      const sh = 4 + (i % 3) * 2;
      ctx.globalAlpha = 0.6 + dirtLevel * 0.35;
      ctx.fillStyle = `rgb(${70+i%15},${60+i%12},${25+i%10})`;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sw/2, sh/2, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = `rgba(85,75,35,0.5)`;
      ctx.beginPath();
      ctx.ellipse(sx-sw*0.12, sy-sh*0.3, sw*0.2, sh*0.3, 0, 0, Math.PI*2);
      ctx.fill();
    }

    // --- 浮遊ゴミ ---
    const debrisCount = Math.floor(dirtLevel * 18);
    for (let i = 0; i < debrisCount; i++) {
      const seed = i * 7919 + 1013;
      const dx = ((seed * 31) % W);
      const dy = 20 + ((seed * 53) % (H - 60));
      const drift = Math.sin(time * 0.0004 + i * 2.1) * 14;
      const bob = Math.cos(time * 0.0006 + i * 1.7) * 8;
      const px = (dx + drift + W) % W;
      const py = dy + bob;
      const kind = i % 6;
      ctx.globalAlpha = 0.6 + dirtLevel * 0.35;

      if (kind === 0) {
        // 藻のかたまり（大きめ、不定形）
        ctx.fillStyle = '#4a7a28';
        const r1 = 6 + i%4, r2 = 4 + i%3;
        ctx.beginPath();
        ctx.ellipse(px, py, r1, r2, (i*0.8+time*0.0002)%Math.PI, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#3a6018';
        ctx.beginPath();
        ctx.ellipse(px+3, py-2, r1*0.55, r2*0.65, (i*1.2+time*0.0003)%Math.PI, 0, Math.PI*2);
        ctx.fill();
        // 藻のひげ
        ctx.strokeStyle = '#4a7a28'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(px+r1, py);
        ctx.quadraticCurveTo(px+r1+8, py+Math.sin(time*0.002+i)*5, px+r1+14, py+4);
        ctx.stroke();
      } else if (kind === 1) {
        // エサの食べ残し
        ctx.save(); ctx.translate(px, py);
        ctx.rotate(time * 0.0003 + i * 1.5);
        ctx.fillStyle = '#8B6914';
        ctx.beginPath(); ctx.ellipse(0, 0, 4, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#6B4F10';
        ctx.beginPath(); ctx.ellipse(1, -0.5, 2, 1.2, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      } else if (kind === 2) {
        // モコモコした汚れ塊
        ctx.fillStyle = `rgb(${95+i%20},${85+i%15},${45+i%10})`;
        for (let j = 0; j < 5; j++) {
          ctx.beginPath();
          ctx.arc(px + Math.cos(j*1.3+i)*4, py + Math.sin(j*1.3+i)*3.5, 3 + j%2, 0, Math.PI*2);
          ctx.fill();
        }
      } else if (kind === 3) {
        // 糸状の藻（長めにゆらゆら）
        ctx.strokeStyle = '#5a8a30'; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let j = 1; j <= 5; j++) {
          ctx.lineTo(
            px + j*6 + Math.sin(time*0.001 + i + j*0.8) * 5,
            py + j*3 + Math.cos(time*0.0012 + i + j) * 4
          );
        }
        ctx.stroke();
      } else if (kind === 4) {
        // 枯れ葉
        ctx.save(); ctx.translate(px, py);
        ctx.rotate(time * 0.00015 + i * 2);
        ctx.fillStyle = '#6a5028';
        ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#503a18'; ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-6, 0); ctx.lineTo(6, 0);
        ctx.moveTo(-1, 0); ctx.lineTo(2, -2.5);
        ctx.moveTo(1, 0); ctx.lineTo(3, 2);
        ctx.moveTo(-3, 0); ctx.lineTo(-4.5, -2);
        ctx.stroke();
        ctx.restore();
      } else {
        // 白カビ
        ctx.fillStyle = 'rgba(195,190,165,0.8)';
        for (let j = 0; j < 4; j++) {
          ctx.beginPath();
          ctx.arc(px + (j-1.5)*4, py + ((j+i)%2)*3, 2.5 + j%2, 0, Math.PI*2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(175,170,145,0.5)';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // === エリア別・絵本風装飾 ===
  if (areaId === 'freshwater') {
    // やわらかい光の筋
    const la = lightMode==='night'?0.03:0.07;
    for (let i=0;i<4;i++) {
      const lx = W*0.18*i + 30 + Math.sin(time*0.0004+i)*30;
      ctx.fillStyle = `rgba(200,240,255,${la})`;
      ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx+50,0);
      ctx.lineTo(lx+30+Math.sin(time*0.0008+i)*15,H*0.7);
      ctx.lineTo(lx-10+Math.sin(time*0.0008+i)*15,H*0.7);
      ctx.closePath(); ctx.fill();
    }
    // 丸い小石（絵本風・アウトライン付き）
    const stoneColors = ['rgba(180,170,140,0.6)','rgba(160,155,130,0.5)','rgba(190,180,150,0.55)','rgba(170,160,120,0.5)'];
    for (let i=0;i<10;i++) {
      const px = (i*83+37) % W;
      const py = H - 10 + Math.sin(i*1.7)*3;
      drawRoundStone(px,py, 5+i%4*2, 3+i%3, stoneColors[i%4], `rgba(120,110,80,${0.3*nA})`);
    }
    // 水草（背景奥・シンプル絵本風）
    for (let i=0;i<5;i++) {
      const gx = W*0.1 + i*W*0.2;
      ctx.strokeStyle = `rgba(80,180,90,${0.2*nA})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(gx, H-18);
      ctx.quadraticCurveTo(gx+Math.sin(time*0.001+i)*8, H-50-i*5, gx+Math.sin(time*0.0015+i)*12, H-70-i*8);
      ctx.stroke();
      // 葉っぱの丸
      ctx.fillStyle = `rgba(100,200,100,${0.15*nA})`;
      ctx.beginPath(); ctx.arc(gx+Math.sin(time*0.0015+i)*12, H-72-i*8, 5, 0, Math.PI*2); ctx.fill();
    }

  } else if (areaId === 'coral') {
    // やわらかい光
    for (let i=0;i<3;i++) {
      const lx = W*0.25*i+40+Math.sin(time*0.0003+i)*25;
      ctx.fillStyle = `rgba(150,230,255,${lightMode==='night'?0.02:0.05})`;
      ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx+60,0);
      ctx.lineTo(lx+35,H*0.6); ctx.lineTo(lx-5,H*0.6); ctx.closePath(); ctx.fill();
    }
    // 絵本風サンゴ（丸を積み重ね+アウトライン）
    const coralSets = [
      {x:W*0.08, color:'rgba(255,130,140,', outline:'rgba(200,70,80,0.4)'},
      {x:W*0.25, color:'rgba(255,180,80,',  outline:'rgba(200,120,30,0.4)'},
      {x:W*0.42, color:'rgba(220,120,200,', outline:'rgba(160,60,140,0.4)'},
      {x:W*0.58, color:'rgba(255,150,100,', outline:'rgba(200,90,50,0.4)'},
      {x:W*0.75, color:'rgba(150,200,255,', outline:'rgba(80,130,200,0.4)'},
      {x:W*0.9,  color:'rgba(255,200,150,', outline:'rgba(200,140,80,0.4)'},
    ];
    for (const c of coralSets) {
      const a = 0.35*nA;
      // 太い幹
      ctx.strokeStyle = c.color+a+')'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(c.x, H-15);
      ctx.lineTo(c.x, H-35+Math.sin(c.x*0.1)*5); ctx.stroke();
      // モコモコの丸（絵本風）
      for (let j=0;j<4;j++) {
        const bx = c.x + (j-1.5)*8 + Math.sin(j*2+c.x)*3;
        const by = H-38-j*4 + Math.sin(c.x*0.1)*5;
        const br = 7+j%2*3;
        ctx.fillStyle = c.color+(a*0.9)+')';
        ctx.strokeStyle = c.outline; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill(); ctx.stroke();
      }
    }
    // 小さいヒトデ
    drawStar(W*0.15, H-8, 5, `rgba(255,200,80,${0.3*nA})`);
    drawStar(W*0.7, H-6, 4, `rgba(255,150,150,${0.25*nA})`);
    // 貝殻
    ctx.fillStyle = `rgba(255,220,200,${0.3*nA})`;
    ctx.strokeStyle = `rgba(200,150,120,${0.3*nA})`; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(W*0.5, H-8, 5, Math.PI, 0); ctx.fill(); ctx.stroke();

  } else if (areaId === 'deepsea') {
    // マリンスノー（ゆっくり浮遊する光の粒）
    for (let i=0;i<20;i++) {
      const px = (time*0.008*(0.2+i*0.04) + i*53) % W;
      const py = (time*0.006*(0.15+i*0.025) + i*37) % H;
      const sz = 1.2 + (i%3)*0.7;
      const a = 0.12+Math.sin(time*0.0015+i)*0.06;
      ctx.fillStyle = `rgba(200,230,255,${a})`;
      ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2); ctx.fill();
      // ぼんやりグロウ
      const gg = ctx.createRadialGradient(px,py,0,px,py,sz*4);
      gg.addColorStop(0,`rgba(180,220,255,${a*0.3})`); gg.addColorStop(1,'rgba(180,220,255,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px,py,sz*4,0,Math.PI*2); ctx.fill();
    }
    // 発光キノコ風（絵本的な深海生物）
    const mushColors = ['rgba(60,200,180,','rgba(100,150,255,','rgba(200,100,255,'];
    for (let i=0;i<4;i++) {
      const mx = W*0.15 + i*W*0.25;
      const mh = 18+i*5;
      const my = H-15;
      const mc = mushColors[i%3];
      const pulse = 0.2 + Math.sin(time*0.002+i*1.5)*0.08;
      // 茎
      ctx.strokeStyle = mc+(pulse*nA)+')'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx+Math.sin(i)*3, my-mh); ctx.stroke();
      // 傘（丸い）
      ctx.fillStyle = mc+(pulse*nA*1.2)+')';
      ctx.strokeStyle = mc+(pulse*nA*0.5)+')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(mx+Math.sin(i)*3, my-mh, 8+i%3*2, Math.PI, Math.PI*2); ctx.fill(); ctx.stroke();
      // グロウ
      const mg = ctx.createRadialGradient(mx, my-mh, 0, mx, my-mh, 25);
      mg.addColorStop(0, mc+(pulse*nA*0.3)+')'); mg.addColorStop(1, mc+'0)');
      ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(mx, my-mh, 25, 0, Math.PI*2); ctx.fill();
    }
    // ゴツゴツした岩（アウトライン付き）
    ctx.fillStyle = `rgba(20,25,40,${0.5*nA})`;
    ctx.strokeStyle = `rgba(40,50,70,${0.3*nA})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x=0;x<=W;x+=25) {
      const rh = 6+((x*7+13)%18) + Math.sin(x*0.04)*4;
      ctx.lineTo(x, H-rh);
    }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); ctx.stroke();

  } else if (areaId === 'tropical') {
    // 緑の木漏れ日
    const la = lightMode==='night'?0.025:0.06;
    for (let i=0;i<3;i++) {
      const lx = W*0.25*i+50+Math.sin(time*0.0003+i*2)*40;
      ctx.fillStyle = `rgba(140,220,100,${la})`;
      ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx+70,0);
      ctx.lineTo(lx+45,H*0.65); ctx.lineTo(lx-15,H*0.65); ctx.closePath(); ctx.fill();
    }
    // 流木（絵本風・太くてアウトライン付き）
    ctx.fillStyle = `rgba(100,65,30,${0.35*nA})`;
    ctx.strokeStyle = `rgba(70,40,15,${0.4*nA})`; ctx.lineWidth = 2;
    // 流木1
    ctx.beginPath();
    ctx.moveTo(W*0.05, H-12); ctx.quadraticCurveTo(W*0.12, H-30, W*0.22, H-22);
    ctx.quadraticCurveTo(W*0.28, H-18, W*0.35, H-20);
    ctx.lineTo(W*0.35, H-16);
    ctx.quadraticCurveTo(W*0.27, H-14, W*0.2, H-18);
    ctx.quadraticCurveTo(W*0.1, H-25, W*0.05, H-8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 流木2
    ctx.beginPath();
    ctx.moveTo(W*0.6, H-10); ctx.quadraticCurveTo(W*0.7, H-32, W*0.82, H-24);
    ctx.lineTo(W*0.82, H-20);
    ctx.quadraticCurveTo(W*0.7, H-27, W*0.6, H-6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 苔（流木の上に丸い緑の点）
    for (let i=0;i<6;i++) {
      const mx = W*0.08 + i*W*0.05;
      const my = H-22-Math.sin(i*1.2)*6;
      ctx.fillStyle = `rgba(60,160,50,${0.3*nA})`;
      ctx.beginPath(); ctx.arc(mx,my,2+i%2,0,Math.PI*2); ctx.fill();
    }
    // 漂う落ち葉（絵本風・色とりどり）
    const leafColors = ['rgba(180,120,30,','rgba(200,80,40,','rgba(140,160,30,','rgba(220,160,40,'];
    for (let i=0;i<6;i++) {
      const lx = (time*0.012 + i*140) % (W+40) - 20;
      const ly = 12 + i*10 + Math.sin(time*0.0008+i*3)*5;
      const rot = Math.sin(time*0.0004+i)*0.4;
      ctx.fillStyle = leafColors[i%4]+(0.3*nA)+')';
      ctx.strokeStyle = leafColors[i%4]+(0.15*nA)+')'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.ellipse(lx,ly,6,3,rot,0,Math.PI*2); ctx.fill(); ctx.stroke();
      // 葉脈
      ctx.strokeStyle = leafColors[i%4]+(0.2*nA)+')'; ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(lx-5*Math.cos(rot), ly-5*Math.sin(rot));
      ctx.lineTo(lx+5*Math.cos(rot), ly+5*Math.sin(rot));
      ctx.stroke();
    }

  } else if (areaId === 'mystic') {
    // オーロラ（よりなめらか・絵本的）
    for (let i=0;i<3;i++) {
      const ay = H*0.12 + i*H*0.22;
      ctx.beginPath(); ctx.moveTo(0, ay);
      for (let x=0;x<=W;x+=8) {
        const y = ay + Math.sin(x*0.008+time*0.00025+i*2)*30 + Math.cos(x*0.015+time*0.0004)*18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, ay+60); ctx.lineTo(0, ay+60); ctx.closePath();
      const colors = ['rgba(150,90,240,','rgba(80,200,230,','rgba(230,100,200,'];
      ctx.fillStyle = colors[i] + (0.05*nA) + ')';
      ctx.fill();
    }
    // 浮遊光球（大きめ、ゆっくり、絵本的グロウ）
    for (let i=0;i<6;i++) {
      const ox = W*0.08 + i*W*0.16;
      const oy = H*0.15 + Math.sin(time*0.0006+i*1.8)*H*0.25;
      const or = 5 + Math.sin(time*0.0015+i)*3;
      const hue = (time*0.015 + i*60) % 360;
      // 外側グロウ
      const og = ctx.createRadialGradient(ox,oy,0,ox,oy,or*5);
      og.addColorStop(0, `hsla(${hue},70%,75%,${0.25*nA})`);
      og.addColorStop(0.4, `hsla(${hue},60%,60%,${0.08*nA})`);
      og.addColorStop(1, `hsla(${hue},60%,50%,0)`);
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ox,oy,or*5,0,Math.PI*2); ctx.fill();
      // 内側コア
      ctx.fillStyle = `hsla(${hue},80%,85%,${0.4*nA})`;
      ctx.beginPath(); ctx.arc(ox,oy,or,0,Math.PI*2); ctx.fill();
    }
    // きらめく星（絵本風の小さい星型）
    for (let i=0;i<12;i++) {
      const sx = (i*71 + time*0.015) % W;
      const sy = (i*59 + time*0.008) % H;
      const sa = 0.25 + Math.sin(time*0.004+i*2.5)*0.25;
      if (sa > 0.15) {
        const hue = (i*30+time*0.01)%360;
        drawStar(sx, sy, 2+i%2, `hsla(${hue},60%,80%,${sa*nA*0.6})`);
      }
    }
    // 水晶風の岩（紫系・透明感）
    ctx.fillStyle = `rgba(80,50,130,${0.25*nA})`;
    ctx.strokeStyle = `rgba(140,100,220,${0.3*nA})`; ctx.lineWidth = 1.5;
    for (let i=0;i<5;i++) {
      const cx = W*0.1 + i*W*0.2;
      const ch = 12+i*4%10;
      ctx.beginPath();
      ctx.moveTo(cx-8,H-15); ctx.lineTo(cx-3,H-15-ch); ctx.lineTo(cx+4,H-15-ch+3);
      ctx.lineTo(cx+9,H-15); ctx.closePath(); ctx.fill(); ctx.stroke();
      // ハイライト
      ctx.fillStyle = `rgba(200,170,255,${0.15*nA})`;
      ctx.beginPath(); ctx.moveTo(cx-2,H-15-ch+2); ctx.lineTo(cx,H-15-ch+1);
      ctx.lineTo(cx+2,H-15-ch+5); ctx.lineTo(cx-1,H-15-ch+6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = `rgba(80,50,130,${0.25*nA})`;
    }
  }

  // === 砂底（絵本風・やわらかい曲線+アウトライン） ===
  const sg = ctx.createLinearGradient(0,H-40,0,H);
  sg.addColorStop(0,`rgba(${sr[0]},${sr[1]},${sr[2]},0.55)`);
  sg.addColorStop(0.5,`rgba(${sr[0]},${sr[1]},${sr[2]},0.7)`);
  sg.addColorStop(1,`rgba(${Math.max(0,sr[0]-20)},${Math.max(0,sr[1]-20)},${Math.max(0,sr[2]-15)},0.8)`);
  // なだらかな丘陵
  ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(0,H);
  for (let x=0;x<=W;x+=8) {
    const yy = H-20 + Math.sin(x*0.015+1)*5 + Math.sin(x*0.04+2.5)*3 + Math.cos(x*0.008)*4;
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  // アウトライン（手描き風）
  ctx.strokeStyle = `rgba(${Math.max(0,sr[0]-40)},${Math.max(0,sr[1]-40)},${Math.max(0,sr[2]-30)},${0.25*nA})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x=0;x<=W;x+=8) {
    const yy = H-20 + Math.sin(x*0.015+1)*5 + Math.sin(x*0.04+2.5)*3 + Math.cos(x*0.008)*4;
    if (x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
  }
  ctx.stroke();

  for (const p of sandParticles) { ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); }
  ctx.lineWidth = 1;
}

function drawSurface(time) {
  // 水面（絵本風・ぽわぽわ）
  const W = canvas.width;
  ctx.fillStyle = 'rgba(150,220,255,0.1)';
  ctx.beginPath(); ctx.moveTo(0,0);
  for (let x=0;x<=W;x+=8) ctx.lineTo(x, 7+Math.sin(x*0.018+time*0.0015)*4+Math.sin(x*0.008+time*0.0008)*3);
  ctx.lineTo(W,0); ctx.closePath(); ctx.fill();
  // 水面のキラキラ
  for (let i=0;i<6;i++) {
    const sx = (time*0.02+i*130)%W;
    const sa = 0.15+Math.sin(time*0.003+i*2)*0.1;
    ctx.fillStyle = `rgba(255,255,255,${sa})`;
    ctx.beginPath(); ctx.arc(sx, 4+Math.sin(sx*0.02+time*0.002)*2, 1.5, 0, Math.PI*2); ctx.fill();
  }
}

// ============================================================
// メインループ
// ============================================================
function gameLoop(time) {
  drawBackground(time);
  for (const p of plants) p.draw(time);

  if (bubblerOn && Math.random()<0.08) bubbles.push(new Bubble(canvas.width*0.3+Math.random()*canvas.width*0.4));
  bubbles = bubbles.filter(b=>b.update());
  for (const b of bubbles) b.draw();

  foods = foods.filter(f=>f.update());
  for (const f of foods) f.draw();

  updateTreasureBubbles();

  for (const fish of fishes) { fish.update(); fish.draw(); }

  // 寿命チェック（サイズ300%で天国へ）
  const deadFish = fishes.filter(f => f.size >= f.baseSize * 3);
  if (deadFish.length > 0) {
    for (const f of deadFish) {
      // 天国エフェクト（泡と光）
      for (let i = 0; i < 8; i++) bubbles.push(new Bubble(f.x + (Math.random()-0.5)*20, f.y));
      showCoinPopup(0, f.x, f.y); // ポジション用
      // 天国ポップアップ
      const popup = document.createElement('div');
      popup.className = 'coin-popup';
      popup.textContent = '😇 ' + f.type.name + 'が天国へ…';
      popup.style.left = (f.x + 6) + 'px';
      popup.style.top = (f.y - 10) + 'px';
      popup.style.color = '#a0d8ef';
      tankWrapper.appendChild(popup);
      setTimeout(() => popup.remove(), 1500);
      // ボーナスコイン（お別れボーナス）
      const bonus = Math.floor(f.getPassiveIncome() * 10);
      addCoins(bonus, f.x, f.y - 30);
      showNotification('😇 ' + f.type.name + 'が天国へ旅立った… お別れボーナス +' + bonus + '🪙');
    }
    fishes = fishes.filter(f => f.size < f.baseSize * 3);
    areaStates[currentAreaId].fishes = fishes;
    updateIncomeDisplay(); buildAreaTabs();
  }

  drawSurface(time);

  updateTooltip();

  // パッシブ収入
  passiveTimer++;
  if (passiveTimer >= 600) {
    passiveTimer = 0;
    let income = getTotalPassiveIncome();
    const wqMult = getWaterQualityIncomeMultiplier();
    const bustleMult = getBustleBonus();
    const moonMult = fullMoonRemaining > 0 ? 1.5 : 1;
    income = Math.floor(income * goldenTimeMultiplier * wqMult * bustleMult * moonMult);
    if (income > 0) addCoins(income, canvas.width-60, 30);
  }

  // クールダウン
  if (feedCooldown > 0) feedCooldown--;

  // 放置系
  updateAutoFeeder();
  updateBreeding();
  updateRandomEvents();
  updateWaterQuality();
  updateVisitors();
  drawVisitors();

  requestAnimationFrame(gameLoop);
}

// ============================================================
// ユーザー操作
// ============================================================
let feedCooldown = 0;
function dropFood(x, y) {
  if (feedCooldown > 0) return;
  feedCooldown = 30;
  const ft = getSelectedFood();
  const count = 2+Math.floor(Math.random()*2);
  for (let i=0;i<count;i++) foods.push(new Food(x+(Math.random()-0.5)*20, y+(Math.random()-0.5)*10, ft));
}
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  dropFood(e.clientX-rect.left, e.clientY-rect.top);
});

document.addEventListener('keydown', e => {
  if (e.key === 'd' || e.key === 'f') {
    const x = canvas.width * (0.3 + Math.random() * 0.4);
    const y = 10 + Math.random() * 20;
    dropFood(x, y);
  }
});

function toggleBubbler() { bubblerOn = !bubblerOn; updateBubblerBtn(); }
function updateBubblerBtn() {
  const btn = document.getElementById('bubbleBtn');
  if (bubblerOn) btn.classList.add('active-toggle');
  else btn.classList.remove('active-toggle');
}
function toggleLight() { lightIndex=(lightIndex+1)%lightModes.length; lightMode=lightModes[lightIndex]; }
function killAll() {
  if (fishes.length === 0) return;
  if (!confirm('本当に今のエリアの魚を全滅させますか？（元に戻せません）')) return;
  fishes.length = 0;
  areaStates[currentAreaId].fishes = fishes;
  updateIncomeDisplay(); buildAreaTabs();
  showNotification('全ての魚がいなくなった…');
}

// ============================================================
// セーブ・ロード（localStorage）
// ============================================================
function saveGame() {
  try {
    // 現在のエリアの状態を保存
    areaStates[currentAreaId].fishes = fishes;
    areaStates[currentAreaId].plants = plants;
    areaStates[currentAreaId].sandParticles = sandParticles;
    areaStates[currentAreaId].waterQuality = waterQuality;

    const areaData = {};
    for (const a of AREAS) {
      areaData[a.id] = {
        fishes: areaStates[a.id].fishes.map(f => ({typeId: f.typeId, size: f.size, isVariant: f.isVariant||false, variantType: f.variantType||null, hueShift: f.hueShift||0})),
        waterQuality: areaStates[a.id].waterQuality !== undefined ? areaStates[a.id].waterQuality : 100
      };
    }
    // 現在のエリアの水質も同期
    areaData[currentAreaId].waterQuality = waterQuality;

    const data = {
      version: 3,
      coins,
      currentAreaId,
      areaData,
      unlockedAreas: AREAS.filter(a => a.unlocked).map(a => a.id),
      foodLevels,
      autoFeederLevel,
      tankLevel,
      upgrades: UPGRADES.filter(u => u.owned).map(u => u.id),
      collection,
      selectedFoodId,
      bubblerOn,
      lightIndex,
      goldenTimeRemaining,
      sharkCooldown,
      waterChangeCount,
      totalTipsEarned,
      lastSave: Date.now()
    };
    localStorage.setItem('aquarium_save', JSON.stringify(data));
  } catch(e) { /* localStorage可能でない環境 */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('aquarium_save');
    if (!raw) return false;
    const data = JSON.parse(raw);

    coins = data.coins || 0;

    // エリア解放
    for (const id of (data.unlockedAreas || [])) {
      const a = AREAS.find(x => x.id === id);
      if (a) a.unlocked = true;
    }

    // === バージョン移行 ===
    if (!data.version || data.version < 2) {
      // 旧セーブ: 餌unlockをレベル1に変換
      foodLevels = { normal:1, premium:0, royal:0, legendary:0 };
      for (const id of (data.unlockedFoods || [])) { foodLevels[id] = 1; }
      // 旧設備: autoFeeder/premiumFeeder をレベルに変換
      autoFeederLevel = 0;
      for (const id of (data.upgrades || [])) {
        if (id === 'autoFeeder') autoFeederLevel = Math.max(autoFeederLevel, 1);
        if (id === 'premiumFeeder') autoFeederLevel = Math.max(autoFeederLevel, 4);
        const up = UPGRADES.find(u => u.id === id);
        if (up) up.owned = true;
      }
    } else {
      // v2+セーブ
      foodLevels = data.foodLevels || { normal:1, premium:0, royal:0, legendary:0 };
      autoFeederLevel = data.autoFeederLevel || 0;
      tankLevel = data.tankLevel || 2; // 既存セーブは40匹上限を維持
      for (const id of (data.upgrades || [])) {
        const up = UPGRADES.find(u => u.id === id);
        if (up) up.owned = true;
      }
    }

    // コレクション復元
    collection = data.collection || {};
    initCollection();

    // エリアごとの魚復元（変異種対応）+ 水質復元
    if (data.areaData) {
      for (const [areaId, ad] of Object.entries(data.areaData)) {
        if (!areaStates[areaId]) continue;
        areaStates[areaId].fishes = [];
        // v3: 水質復元
        areaStates[areaId].waterQuality = ad.waterQuality !== undefined ? ad.waterQuality : 100;
        for (const fd of (ad.fishes || [])) {
          const fish = new Fish(fd.typeId, undefined, undefined, fd.isVariant||false, fd.variantType||null);
          fish.size = fd.size || fish.size;
          if (fd.hueShift !== undefined) fish.hueShift = fd.hueShift;
          areaStates[areaId].fishes.push(fish);
          discoverFish(fd.typeId, fd.variantType||null, fish.hueShift);
        }
      }
    } else if (data.fishes) {
      areaStates.freshwater.fishes = [];
      for (const fd of data.fishes) {
        const fish = new Fish(fd.typeId);
        fish.size = fd.size || fish.size;
        areaStates.freshwater.fishes.push(fish);
        discoverFish(fd.typeId, null, fish.hueShift);
      }
    }

    currentAreaId = data.currentAreaId || 'freshwater';
    fishes = areaStates[currentAreaId].fishes;
    waterQuality = areaStates[currentAreaId].waterQuality !== undefined ? areaStates[currentAreaId].waterQuality : 100;
    waterChangeCount = data.waterChangeCount || 0;
    totalTipsEarned = data.totalTipsEarned || 0;

    // オフライン水質低下
    if (data.lastSave && data.version >= 3) {
      const elapsedSec = Math.min((Date.now() - data.lastSave) / 1000, 86400);
      for (const a of AREAS) {
        if (!a.unlocked) continue;
        const fishCount = areaStates[a.id].fishes.length;
        const offlineRate = WATER_QUALITY.basePollutionPerFishPerFrame * fishCount * 60; // per second
        const degradation = offlineRate * elapsedSec;
        areaStates[a.id].waterQuality = Math.max(0, (areaStates[a.id].waterQuality || 100) - degradation);
      }
      waterQuality = areaStates[currentAreaId].waterQuality;
    }

    selectedFoodId = data.selectedFoodId || 'normal';
    if (!isFoodUnlocked(selectedFoodId)) selectedFoodId = 'normal';
    bubblerOn = data.bubblerOn !== undefined ? data.bubblerOn : true;
    lightIndex = data.lightIndex || 0;
    lightMode = lightModes[lightIndex];

    // オフライン収益
    if (data.lastSave) {
      const elapsed = (Date.now() - data.lastSave) / 1000;
      const seconds = Math.min(elapsed, 86400);
      let incomePerTick = 0;
      for (const a of AREAS) {
        if (!a.unlocked) continue;
        for (const f of areaStates[a.id].fishes) incomePerTick += f.getPassiveIncome();
      }
      const offlineEarnings = Math.floor(incomePerTick * seconds / 10 * 0.3);
      if (offlineEarnings > 0 && seconds > 30) {
        coins += offlineEarnings;
        setTimeout(() => {
          showNotification('おかえり！留守の間に ' + offlineEarnings.toLocaleString() + ' コイン稼いだよ！');
        }, 800);
      }
    }

    // ランダムイベント状態復元
    goldenTimeRemaining = data.goldenTimeRemaining || 0;
    sharkCooldown = data.sharkCooldown || 0;
    if (data.lastSave) {
      const elapsedFrames = Math.floor((Date.now() - data.lastSave) / 1000 * 60);
      goldenTimeRemaining = Math.max(0, goldenTimeRemaining - elapsedFrames);
      sharkCooldown = Math.max(0, sharkCooldown - elapsedFrames);
    }
    if (goldenTimeRemaining > 0) {
      goldenTimeMultiplier = 3;
      setTimeout(showGoldenTimeIndicator, 100);
    } else {
      goldenTimeMultiplier = 1;
    }

    // 魚の種類を解放済みにマーク
    for (const a of AREAS) {
      for (const f of areaStates[a.id].fishes) {
        const ft = FISH_TYPES.find(t => t.id === f.typeId);
        if (ft) ft.unlocked = true;
      }
    }

    return true;
  } catch(e) { return false; }
}

// 30秒ごとに自動セーブ
setInterval(saveGame, 30000);
window.addEventListener('beforeunload', saveGame);

// ============================================================
// スタート
// ============================================================
firstInit();
requestAnimationFrame(gameLoop);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
