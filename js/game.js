// === game.js === ゲームループ・描画・セーブロード・初期化
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

// --- 繁殖 ---
function updateBreeding() {
  breedTimer++;
  const hasBoost = UPGRADES.find(u => u.id === 'breedBoost')?.owned;
  const interval = 1800; // 30秒
  if (breedTimer >= interval) {
    breedTimer = 0;
    if (fishes.length >= 40) return; // 上限

    // タイプごとにカウント
    const counts = {};
    for (const f of fishes) { counts[f.typeId] = (counts[f.typeId]||0) + 1; }

    for (const [typeId, count] of Object.entries(counts)) {
      if (count >= 2) {
        const chance = hasBoost ? 0.12 : 0.06;
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
// 背景＆水面
// ============================================================
function drawBackground(time) {
  const area = getCurrentArea();
  const bgc = area.bg[lightMode] || area.bg.day;
  const sr = area.sandRGB;

  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0, bgc[0]); grad.addColorStop(0.5, bgc[1]); grad.addColorStop(1, bgc[2]);
  ctx.fillStyle = grad; ctx.fillRect(0,0,canvas.width,canvas.height);

  const la = lightMode==='night'?0.02:0.06;
  for (let i=0;i<5;i++) {
    const lx = canvas.width*0.15*i+Math.sin(time*0.0005+i)*40;
    ctx.fillStyle = `rgba(150,220,255,${la})`;
    ctx.beginPath(); ctx.moveTo(lx,0); ctx.lineTo(lx+60,0);
    ctx.lineTo(lx+40+Math.sin(time*0.001+i)*20,canvas.height);
    ctx.lineTo(lx-20+Math.sin(time*0.001+i)*20,canvas.height);
    ctx.closePath(); ctx.fill();
  }

  const sg = ctx.createLinearGradient(0,canvas.height-35,0,canvas.height);
  sg.addColorStop(0,`rgba(${sr[0]},${sr[1]},${sr[2]},0.6)`);
  sg.addColorStop(1,`rgba(${Math.max(0,sr[0]-24)},${Math.max(0,sr[1]-25)},${Math.max(0,sr[2]-20)},0.8)`);
  ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(0,canvas.height-20);
  for (let x=0;x<=canvas.width;x+=20) ctx.lineTo(x, canvas.height-22+Math.sin(x*0.02+time*0.0005)*4);
  ctx.lineTo(canvas.width,canvas.height); ctx.lineTo(0,canvas.height); ctx.closePath(); ctx.fill();

  for (const p of sandParticles) { ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); }
}

function drawSurface(time) {
  ctx.fillStyle = 'rgba(100,200,255,0.08)';
  ctx.beginPath(); ctx.moveTo(0,0);
  for (let x=0;x<=canvas.width;x+=10) ctx.lineTo(x, 6+Math.sin(x*0.02+time*0.002)*3+Math.sin(x*0.01+time*0.001)*2);
  ctx.lineTo(canvas.width,0); ctx.closePath(); ctx.fill();
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
    if (income > 0) addCoins(income, canvas.width-60, 30);
  }

  // クールダウン
  if (feedCooldown > 0) feedCooldown--;

  // 放置系
  updateAutoFeeder();
  updateBreeding();

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

    const areaData = {};
    for (const a of AREAS) {
      areaData[a.id] = {
        fishes: areaStates[a.id].fishes.map(f => ({typeId: f.typeId, size: f.size, isVariant: f.isVariant||false, variantType: f.variantType||null, hueShift: f.hueShift||0}))
      };
    }
    const data = {
      version: 2,
      coins,
      currentAreaId,
      areaData,
      unlockedAreas: AREAS.filter(a => a.unlocked).map(a => a.id),
      foodLevels,
      autoFeederLevel,
      upgrades: UPGRADES.filter(u => u.owned).map(u => u.id),
      collection,
      selectedFoodId,
      bubblerOn,
      lightIndex,
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
      for (const id of (data.upgrades || [])) {
        const up = UPGRADES.find(u => u.id === id);
        if (up) up.owned = true;
      }
    }

    // コレクション復元
    collection = data.collection || {};
    initCollection();

    // エリアごとの魚復元（変異種対応）
    if (data.areaData) {
      for (const [areaId, ad] of Object.entries(data.areaData)) {
        if (!areaStates[areaId]) continue;
        areaStates[areaId].fishes = [];
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
