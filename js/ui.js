// === ui.js === UI・ショップ・図鑑・エリア
// ============================================================
// 💰 経済システム
// ============================================================
let coins = 0;
let passiveTimer = 0;

function addCoins(amount, x, y) {
  coins += amount;
  updateCoinDisplay();
  if (x !== undefined) showCoinPopup(amount, x, y);
}

function spendCoins(amount) {
  if (coins >= amount) { coins -= amount; updateCoinDisplay(); return true; }
  return false;
}

function updateCoinDisplay() {
  document.getElementById('coinText').textContent = Math.floor(coins).toLocaleString();
  const el = document.getElementById('coinDisplay');
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 300);
}

function showCoinPopup(amount, cx, cy) {
  const popup = document.createElement('div');
  popup.className = 'coin-popup';
  popup.textContent = '+' + amount + ' 🪙';
  popup.style.left = (cx + 6) + 'px';
  popup.style.top = (cy - 10) + 'px';
  tankWrapper.appendChild(popup);
  setTimeout(() => popup.remove(), 1000);
}

function showNotification(text) {
  const div = document.createElement('div');
  div.className = 'notification';
  div.textContent = text;
  tankWrapper.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

function getTotalPassiveIncome() {
  let income = 0;
  // 現在のエリア
  for (const f of fishes) income += f.getPassiveIncome();
  // 他のエリアも合算
  for (const a of AREAS) {
    if (a.id === currentAreaId || !a.unlocked) continue;
    for (const f of areaStates[a.id].fishes) income += f.getPassiveIncome();
  }
  return income;
}

function updateIncomeDisplay() {
  const income = getTotalPassiveIncome();
  const el = document.getElementById('incomeDisplay');
  el.textContent = income > 0 ? ('💰 ' + Math.floor(income) + '🪙/10秒') : '';
  updateProgressDisplay();
}

function updateProgressDisplay() {
  const col = getCollectionCompletion();
  const unlockedAreas = AREAS.filter(a => a.unlocked).length;
  const totalAreas = AREAS.length;
  // 図鑑80% + エリア20%の加重平均
  const pct = Math.round(col.percent * 0.8 + (unlockedAreas / totalAreas * 100) * 0.2);
  const el = document.getElementById('progressDisplay');
  el.innerHTML = '📊 ' + pct + '%<div class="prog-bar"><div class="prog-fill" style="width:'+pct+'%"></div></div>';
}

// エリアごとの状態
const areaStates = {};
for (const a of AREAS) areaStates[a.id] = { fishes:[], plants:[], sandParticles:[] };
let currentAreaId = 'freshwater';
function getCurrentArea() { return AREAS.find(a => a.id === currentAreaId); }

function switchArea(areaId) {
  const area = AREAS.find(a => a.id === areaId);
  if (!area || !area.unlocked) return;
  // 今のエリアを保存
  areaStates[currentAreaId].fishes = fishes;
  areaStates[currentAreaId].plants = plants;
  areaStates[currentAreaId].sandParticles = sandParticles;
  // 切り替え
  currentAreaId = areaId;
  fishes = areaStates[areaId].fishes;
  plants = areaStates[areaId].plants;
  sandParticles = areaStates[areaId].sandParticles;
  // 初訪問ならenvironment生成
  if (plants.length === 0) initEnvironment();
  // 一時的なものをリセット
  bubbles = []; foods = []; treasureBubbles = [];
  updateIncomeDisplay();
  buildAreaTabs();
}

function buildAreaTabs() {
  const c = document.getElementById('areaTabs');
  c.innerHTML = '';
  for (const a of AREAS) {
    const btn = document.createElement('button');
    const fishCount = areaStates[a.id].fishes.length;
    btn.className = 'area-tab' + (a.id === currentAreaId ? ' active' : '') + (!a.unlocked ? ' locked' : '');
    btn.innerHTML = a.icon + ' ' + a.name + (a.unlocked ? '<span class="tab-count">(' + fishCount + ')</span>' : ' 🔒');
    btn.onclick = () => { if (a.unlocked) switchArea(a.id); };
    c.appendChild(btn);
  }
}

// ============================================================
// ツールチップ（ホバー）
// ============================================================
const tooltip = document.getElementById('fishTooltip');
const ttName = document.getElementById('ttName');
const ttGreeting = document.getElementById('ttGreeting');
const ttStats = document.getElementById('ttStats');

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});
canvas.addEventListener('mouseleave', () => { mouseX = -999; mouseY = -999; });

function updateTooltip() {
  let closest = null, closestDist = Infinity;
  for (const f of fishes) {
    const d = Math.hypot(f.x - mouseX, f.y - mouseY);
    if (d < f.size * 1.8 && d < closestDist) { closest = f; closestDist = d; }
  }

  if (closest) {
    hoveredFish = closest;
    let nameText = closest.type.name;
    if (closest.isVariant && closest.variantType) {
      const vt = VARIANT_TYPES.find(v => v.id === closest.variantType);
      if (vt) nameText += ' ' + vt.suffix;
    }
    const ttKey = closest.typeId + '_' + closest.hueShift + (closest.isVariant ? '_' + closest.variantType : '');
    if (ttName._lastKey !== ttKey) {
      ttName.innerHTML = fishIconHTML(closest.typeId, 22, closest.isVariant ? closest.variantType : null, closest.hueShift) + ' ' + nameText;
      ttName._lastKey = ttKey;
    }
    ttGreeting.textContent = closest.type.greeting;
    const sizePercent = Math.round((closest.size / closest.baseSize) * 100);
    let sizeLabel = 'サイズ: ' + sizePercent + '%';
    if (sizePercent >= 250) sizeLabel += ' ⚠️ もうすぐお別れ…';
    else if (sizePercent >= 200) sizeLabel += ' 💦 だいぶ大きい！';
    const incomeVal = closest.getPassiveIncome();
    ttStats.textContent = '収入: ' + incomeVal + '🪙/10秒' + (closest.isVariant ? ' (レア2.5倍!)' : '') + ' ・ ' + sizeLabel;

    const rect = canvas.getBoundingClientRect();
    const wrapRect = tankWrapper.getBoundingClientRect();
    let tx = closest.x + 20;
    let ty = closest.y - 50;
    // Keep tooltip in bounds
    if (tx + 200 > canvas.width) tx = closest.x - 180;
    if (ty < 10) ty = closest.y + 20;
    tooltip.style.left = (tx + (rect.left - wrapRect.left)) + 'px';
    tooltip.style.top = (ty + (rect.top - wrapRect.top)) + 'px';
    tooltip.classList.add('visible');
  } else {
    hoveredFish = null;
    tooltip.classList.remove('visible');
  }
}

// ============================================================
// エサ選択 UI
// ============================================================
function buildFoodSelector() {
  const c = document.getElementById('foodSelector');
  c.innerHTML = '<span>エサ選択:</span>';
  for (const ft of FOOD_TYPES) {
    const lv = getFoodLevel(ft.id);
    const locked = lv <= 0;
    const btn = document.createElement('button');
    btn.className = 'food-btn'+(ft.id===selectedFoodId?' active':'')+(locked?' locked':'');
    btn.textContent = ft.icon+' '+ft.name+(lv>0?' Lv'+lv:' 🔒');
    btn.onclick = () => { if (locked) return; selectedFoodId = ft.id; document.querySelectorAll('.food-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); };
    c.appendChild(btn);
  }
}

// ============================================================
// ショップ
// ============================================================
function openShop() { document.getElementById('shopOverlay').classList.add('open'); renderShop(); }
function closeShop() { document.getElementById('shopOverlay').classList.remove('open'); }

function renderShop() {
  document.getElementById('shopCoins').textContent = '🪙 '+coins.toLocaleString();
  const c = document.getElementById('shopContents');
  c.innerHTML = '';
  function sec(title) { const t = document.createElement('div'); t.className = 'shop-section-title'; t.textContent = title; c.appendChild(t); }
  function row(icon, name, desc) { const item = document.createElement('div'); item.className = 'shop-item'; item.innerHTML = '<div class="shop-item-icon">'+icon+'</div><div class="shop-item-info"><div class="shop-item-name">'+name+'</div><div class="shop-item-desc">'+desc+'</div></div>'; return item; }

  // 1. エリア解放
  sec('🗺️ エリア解放');
  for (const a of AREAS) {
    if (a.price === 0) continue;
    const item = row(a.icon, a.name, a.desc);
    const btn = document.createElement('button'); btn.className = 'shop-buy-btn';
    if (a.unlocked) { btn.textContent = '✓ 解放済み'; btn.className += ' owned'; btn.disabled = true; }
    else { btn.textContent = '🪙 '+a.price.toLocaleString(); btn.disabled = coins<a.price; btn.onclick = () => { if (spendCoins(a.price)) { a.unlocked = true; renderShop(); buildAreaTabs(); showNotification(a.name+'エリアが解放された！'); } }; }
    item.appendChild(btn); c.appendChild(item);
  }

  // 2. 設備
  sec('🔧 設備');
  for (const up of UPGRADES) {
    const item = row(up.icon, up.name, up.desc);
    const btn = document.createElement('button'); btn.className = 'shop-buy-btn';
    if (up.owned) { btn.textContent = '✓ 購入済み'; btn.className += ' owned'; btn.disabled = true; }
    else { btn.textContent = '🪙 '+up.price.toLocaleString(); btn.disabled = coins<up.price; btn.onclick = () => { if (spendCoins(up.price)) { up.owned = true; renderShop(); showNotification(up.name+'を購入した！'); } }; }
    item.appendChild(btn); c.appendChild(item);
  }

  // 3. エサレベルアップ
  sec('🍞 エサレベルアップ');
  for (const ft of FOOD_TYPES) {
    const lv = getFoodLevel(ft.id);
    const lvText = lv === 0 ? '未解放' : 'Lv.'+lv+(lv>=10?' MAX':'');
    const reward = lv > 0 ? getFoodCoinReward(ft.id).toFixed(1) : ft.baseCoinReward;
    const grow = lv > 0 ? getFoodGrowAmount(ft.id).toFixed(2) : ft.baseGrowAmount.toFixed(2);
    const item = row(ft.icon, ft.name+' ('+lvText+')', '報酬:'+reward+'🪙 成長:'+grow+' ・ '+ft.desc);
    const btn = document.createElement('button'); btn.className = 'shop-buy-btn';
    if (lv >= 10) { btn.textContent = 'MAX'; btn.className += ' owned'; btn.disabled = true; }
    else {
      const cost = getFoodUpgradeCost(ft.id);
      btn.textContent = (lv===0?'🔓解放 ':'⬆Lv'+(lv+1)+' ')+'🪙 '+cost.toLocaleString();
      btn.disabled = coins<cost;
      btn.onclick = () => { if (spendCoins(cost)) { foodLevels[ft.id]=(lv||0)+1; if(lv===0) selectedFoodId=ft.id; renderShop(); buildFoodSelector(); showNotification(ft.name+' Lv.'+(lv+1)+'に！'); } };
    }
    item.appendChild(btn); c.appendChild(item);
  }

  // 4. オートフィーダー
  sec('🤖 オートフィーダー');
  const afLv = autoFeederLevel;
  const afText = afLv===0?'未購入':'Lv.'+afLv+(afLv>=10?' MAX':'');
  const afFood = afLv>0?getAutoFeederFoodType().name:'-';
  const afInt = afLv>0?(getAutoFeederInterval()/60).toFixed(1)+'秒':'-';
  const afCnt = afLv>0?getAutoFeederFoodCount()+'個':'-';
  const afItem = row('🤖', 'オートフィーダー ('+afText+')', 'エサ:'+afFood+' 間隔:'+afInt+' 数:'+afCnt);
  const afBtn = document.createElement('button'); afBtn.className = 'shop-buy-btn';
  if (afLv >= 10) { afBtn.textContent = 'MAX'; afBtn.className += ' owned'; afBtn.disabled = true; }
  else {
    const cost = getAutoFeederUpgradeCost();
    afBtn.textContent = (afLv===0?'🔓購入 ':'⬆Lv'+(afLv+1)+' ')+'🪙 '+cost.toLocaleString();
    afBtn.disabled = coins<cost;
    afBtn.onclick = () => { if (spendCoins(cost)) { autoFeederLevel++; renderShop(); showNotification('オートフィーダー Lv.'+autoFeederLevel+'に！'); } };
  }
  afItem.appendChild(afBtn); c.appendChild(afItem);

  // 5. 魚を購入（現在のエリア限定）
  const curArea = AREAS.find(a => a.id === currentAreaId);
  sec('🐟 魚を購入（'+curArea.icon+' '+curArea.name+'）');
  const sortedFish = [...FISH_TYPES].filter(f => f.area === currentAreaId).sort((a,b) => a.shopPrice - b.shopPrice);
  for (const ft of sortedFish) {
    const item = row(fishIconHTML(ft.id, 32), ft.name, ft.desc+' ・ 収入'+ft.passiveIncome+'🪙/10秒');
    const btn = document.createElement('button'); btn.className = 'shop-buy-btn';
    if (ft.shopPrice === 0) {
      btn.textContent = '🪙 無料';
      btn.onclick = () => { const f=new Fish(ft.id); fishes.push(f); discoverFish(ft.id, null, f.hueShift); renderShop(); updateIncomeDisplay(); buildAreaTabs(); showNotification(ft.name+'が仲間に！'); };
    } else {
      btn.textContent = '🪙 '+ft.shopPrice.toLocaleString(); btn.disabled = coins<ft.shopPrice;
      btn.onclick = () => { if (spendCoins(ft.shopPrice)) { ft.unlocked=true; const f=new Fish(ft.id); fishes.push(f); discoverFish(ft.id, null, f.hueShift); renderShop(); updateIncomeDisplay(); buildAreaTabs(); showNotification(ft.name+'が仲間に！'); } };
    }
    item.appendChild(btn); c.appendChild(item);
  }

  // 6. ガチャ
  const curAreaName = curArea.icon + ' ' + curArea.name;
  sec('🎰 ガチャ（'+curAreaName+'のレア魚チャンス！）');
  for (const g of GACHA_TIERS) {
    const item = row(g.icon, g.name, g.desc + '・' + curArea.name + 'の魚が出る');
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;';
    for (const n of [1, 5, 10]) {
      const total = g.cost * n;
      const btn = document.createElement('button'); btn.className = 'shop-buy-btn';
      btn.style.cssText = 'font-size:0.75rem;padding:4px 8px;';
      btn.textContent = (n===1?'':'') + n + '連 🪙' + total.toLocaleString();
      btn.disabled = coins < total;
      btn.onclick = () => { if (spendCoins(total)) performMultiGacha(g, n); };
      btnWrap.appendChild(btn);
    }
    item.appendChild(btnWrap); c.appendChild(item);
  }
}

// ============================================================
// 📖 図鑑UI
// ============================================================
function openCollection() { document.getElementById('collectionOverlay').classList.add('open'); renderCollection(); }
function closeCollection() { document.getElementById('collectionOverlay').classList.remove('open'); }

function renderCollection() {
  const comp = getCollectionCompletion();
  const progEl = document.getElementById('collectionProgress');
  progEl.innerHTML = comp.discovered+' / '+comp.total+' 発見 ('+comp.percent+'%)<div style="width:200px;height:8px;background:rgba(126,200,227,0.1);border-radius:4px;margin:6px auto;overflow:hidden"><div style="height:100%;width:'+comp.percent+'%;background:linear-gradient(90deg,#7ec8e3,#ffd700);border-radius:4px;transition:width 0.5s"></div></div>';

  const grid = document.getElementById('collectionGrid');
  grid.innerHTML = '';
  for (const ft of FISH_TYPES) {
    const disc = collection[ft.id]?.discovered;
    const entry = document.createElement('div');
    entry.style.cssText = 'background:rgba(126,200,227,0.04);border:1px solid rgba(126,200,227,'+(disc?'0.2':'0.06')+');border-radius:10px;padding:8px 4px;text-align:center;cursor:pointer;transition:all 0.2s;'+(disc?'':'opacity:0.3;filter:grayscale(1);');
    entry.onmouseover = () => { entry.style.background='rgba(126,200,227,0.12)'; };
    entry.onmouseout = () => { entry.style.background='rgba(126,200,227,0.04)'; };
    if (disc) entry.onclick = () => openFishDetail(ft.id);
    // アイコン
    const iconDiv = document.createElement('div');
    iconDiv.style.fontSize = '1.5rem';
    if (disc) iconDiv.innerHTML = fishIconHTML(ft.id, 36);
    else iconDiv.textContent = '❓';
    entry.appendChild(iconDiv);
    // 名前
    const nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'font-size:0.6rem;color:#cde4f0;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    nameDiv.textContent = disc ? ft.name : '？？？';
    entry.appendChild(nameDiv);
    // 変異種ドット
    const dotsDiv = document.createElement('div');
    dotsDiv.style.cssText = 'display:flex;justify-content:center;gap:3px;margin-top:4px';
    const dotColors = { gold:'#ffd700', albino:'#fff5f5', neon:'#00ffc8', holo:'linear-gradient(135deg,#f00,#0f0,#00f)' };
    for (const vt of VARIANT_TYPES) {
      const dot = document.createElement('div');
      const vDisc = collection[ft.id]?.variantDiscovered?.[vt.id];
      dot.style.cssText = 'width:8px;height:8px;border-radius:50%;border:1px solid rgba(255,255,255,0.15);';
      if (vDisc) dot.style.background = dotColors[vt.id];
      else dot.style.background = 'rgba(100,100,100,0.25)';
      dot.title = vt.name + (vDisc ? ' (発見済み)' : ' (未発見)');
      dotsDiv.appendChild(dot);
    }
    entry.appendChild(dotsDiv);
    // 収入表示
    if (disc) {
      const incDiv = document.createElement('div');
      incDiv.style.cssText = 'font-size:0.55rem;color:rgba(126,200,227,0.5);margin-top:2px';
      incDiv.textContent = ft.passiveIncome+'🪙/10秒';
      entry.appendChild(incDiv);
    }
    grid.appendChild(entry);
  }
}

// --- 図鑑 魚詳細 ---
function openFishDetail(fishId) {
  const ft = FISH_TYPES.find(t => t.id === fishId);
  if (!ft) return;
  const col = collection[fishId] || {};
  const area = AREAS.find(a => a.id === ft.area);
  const hueShifts = col.hueShifts || [];
  const panel = document.getElementById('fishDetailPanel');

  let html = '<div style="text-align:center;padding:8px 0">';
  // メインアイコン大きく
  html += '<div style="margin-bottom:8px">'+fishIconHTML(ft.id, 72)+'</div>';
  // 名前
  html += '<div style="font-size:1.3rem;font-weight:bold;color:#7ec8e3">'+ft.name+'</div>';
  // エリア
  html += '<div style="font-size:0.75rem;color:rgba(126,200,227,0.6);margin:4px 0">'+(area?area.icon+' '+area.name:'')+'</div>';
  // 説明
  html += '<div style="font-size:0.85rem;color:#cde4f0;margin:8px 16px;line-height:1.5">'+ft.desc+'</div>';
  // 収入
  html += '<div style="font-size:0.8rem;color:rgba(255,215,0,0.8);margin:6px 0">収入: '+ft.passiveIncome+' 🪙/10秒</div>';
  html += '<div style="font-size:0.75rem;color:rgba(126,200,227,0.4);margin-bottom:4px">購入価格: '+(ft.shopPrice===0?'無料':'🪙 '+ft.shopPrice.toLocaleString())+'</div>';
  html += '</div>';

  // 変異種セクション
  html += '<div style="border-top:1px solid rgba(126,200,227,0.15);margin:8px 0;padding-top:10px">';
  html += '<div style="font-size:0.8rem;color:rgba(126,200,227,0.6);margin-bottom:8px">✨ 変異種</div>';
  html += '<div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">';
  for (const vt of VARIANT_TYPES) {
    const vDisc = col.variantDiscovered?.[vt.id];
    html += '<div style="text-align:center;opacity:'+(vDisc?'1':'0.3')+';filter:'+(vDisc?'none':'grayscale(1)')+'">';
    html += '<div>'+fishIconHTML(ft.id, 40, vt.id)+'</div>';
    html += '<div style="font-size:0.6rem;color:'+(vDisc?'#cde4f0':'#666')+';margin-top:2px">'+vt.name+'</div>';
    html += '</div>';
  }
  html += '</div></div>';

  // カラーバリエーションセクション
  html += '<div style="border-top:1px solid rgba(126,200,227,0.15);margin:8px 0;padding-top:10px">';
  html += '<div style="font-size:0.8rem;color:rgba(126,200,227,0.6);margin-bottom:8px">🎨 カラーバリエーション <span style="font-size:0.65rem;color:rgba(126,200,227,0.35)">'+hueShifts.length+'/12</span></div>';
  if (hueShifts.length > 0) {
    html += '<div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">';
    for (const hs of hueShifts) {
      html += '<div style="text-align:center">';
      html += fishIconHTML(ft.id, 36, null, hs);
      html += '</div>';
    }
    html += '</div>';
  } else {
    html += '<div style="font-size:0.75rem;color:rgba(126,200,227,0.3)">まだ色が集まっていません</div>';
  }
  html += '</div>';

  // 閉じるボタン
  html += '<button class="shop-close" onclick="closeFishDetail()" style="margin-top:12px">もどる</button>';
  panel.innerHTML = html;
  document.getElementById('fishDetailOverlay').classList.add('open');
}

function closeFishDetail() {
  document.getElementById('fishDetailOverlay').classList.remove('open');
}

// オーバーレイ閉じリスナー
document.getElementById('shopOverlay').addEventListener('click', e => { if (e.target.id === 'shopOverlay') closeShop(); });
document.getElementById('collectionOverlay').addEventListener('click', e => { if (e.target.id === 'collectionOverlay') closeCollection(); });
document.getElementById('fishDetailOverlay').addEventListener('click', e => { if (e.target.id === 'fishDetailOverlay') closeFishDetail(); });
