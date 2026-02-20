// === gacha.js === ガチャシステム
// ガチャ抽選ロジック（共通）
function rollGacha(gacha) {
  const pool = FISH_TYPES.filter(f => f.area === currentAreaId);
  const weights = pool.map(f => 1/Math.sqrt(Math.max(f.shopPrice,1)));
  const totalW = weights.reduce((a,b) => a+b, 0);
  let r = Math.random() * totalW, chosen = pool[0];
  for (let i=0; i<pool.length; i++) { r -= weights[i]; if (r<=0) { chosen=pool[i]; break; } }
  const isVariant = Math.random() < gacha.variantChance;
  let variantType = null;
  if (isVariant) variantType = VARIANT_TYPES[Math.floor(Math.random()*VARIANT_TYPES.length)].id;
  const fish = new Fish(chosen.id, undefined, undefined, isVariant, variantType);
  fishes.push(fish); chosen.unlocked = true;
  discoverFish(chosen.id, variantType, fish.hueShift);
  return { fishType: chosen, isVariant, variantType, fish };
}

// ガチャ演出の状態管理
let gachaAnimating = false;
let gachaSkipRequested = false;
let gachaQueue = []; // 複数連の残りキュー
let gachaAllResults = []; // 複数連のまとめ用
let gachaCurrentGacha = null;

function gachaSleep(ms) {
  return new Promise(resolve => {
    const t = setTimeout(resolve, ms);
    const check = setInterval(() => {
      if (gachaSkipRequested) { clearTimeout(t); clearInterval(check); resolve(); }
    }, 50);
  });
}

function performGacha(gacha) {
  const result = rollGacha(gacha);
  updateIncomeDisplay(); buildAreaTabs(); renderShop();
  gachaQueue = [result];
  gachaAllResults = [result];
  gachaCurrentGacha = gacha;
  runGachaSequence(false);
}

function performMultiGacha(gacha, count) {
  if (count === 1) { performGacha(gacha); return; }
  const results = [];
  for (let i = 0; i < count; i++) results.push(rollGacha(gacha));
  updateIncomeDisplay(); buildAreaTabs(); renderShop();
  gachaQueue = results.slice();
  gachaAllResults = results.slice();
  gachaCurrentGacha = gacha;
  runGachaSequence(true);
}

async function runGachaSequence(isMulti) {
  gachaAnimating = true;
  gachaSkipRequested = false;

  const doors = document.getElementById('gachaDoors');
  const pillar = document.getElementById('gachaPillar');
  const crack = document.getElementById('gachaCrack');
  const flash = document.getElementById('gachaFlash');
  const overlay = document.getElementById('gachaOverlay');
  const counter = document.getElementById('gachaCounter');
  const skipHint = document.getElementById('gachaSkipHint');

  // タップでスキップ
  function onTap() { gachaSkipRequested = true; }
  document.addEventListener('click', onTap, { once: false });

  for (let idx = 0; idx < gachaQueue.length; idx++) {
    const result = gachaQueue[idx];
    gachaSkipRequested = false;

    // カウンター表示（複数連）
    if (isMulti) {
      counter.style.display = 'block';
      counter.textContent = (idx+1) + ' / ' + gachaQueue.length;
    }

    // スキップヒント
    skipHint.classList.add('show');

    // === Phase 1: 扉閉じ ===
    doors.style.display = 'flex';
    doors.classList.remove('open');
    await gachaSleep(100);

    // === Phase 2: 扉の隙間から光 ===
    await gachaSleep(gachaSkipRequested ? 0 : 600);

    // === Phase 3: レア判定で演出分岐 ===
    if (result.isVariant && !gachaSkipRequested) {
      // 画面割れ演出
      crack.classList.add('active');
      await gachaSleep(400);
      // 虹色の柱
      pillar.className = 'gacha-pillar active rare';
      await gachaSleep(500);
      crack.classList.remove('active');
    } else if (!gachaSkipRequested) {
      // 通常の光の柱
      pillar.className = 'gacha-pillar active';
      await gachaSleep(400);
    }

    // === Phase 4: 扉オープン ===
    doors.classList.add('open');
    await gachaSleep(gachaSkipRequested ? 0 : 500);

    // === Phase 5: フラッシュ ===
    flash.classList.add('active');
    await gachaSleep(gachaSkipRequested ? 50 : 120);
    flash.classList.remove('active');

    // === Phase 6: カード降臨 ===
    showGachaCard(result);
    await gachaSleep(gachaSkipRequested ? 50 : 100);
    overlay.classList.add('reveal');

    // 紙吹雪
    spawnConfetti(overlay, result.isVariant);

    // === 待機（タップで次へ） ===
    pillar.className = 'gacha-pillar';
    skipHint.classList.remove('show');

    // タップ待ち
    gachaSkipRequested = false;
    await new Promise(resolve => {
      function handler() {
        document.removeEventListener('click', handler);
        resolve();
      }
      // 少し遅延してからクリック受付（誤タップ防止）
      setTimeout(() => document.addEventListener('click', handler, { once: true }), 300);
    });

    // カードを閉じる
    overlay.classList.remove('open', 'reveal');
    overlay.querySelectorAll('.gacha-confetti').forEach(e => e.remove());
    doors.style.display = 'none';

    await gachaSleep(150);
  }

  // クリーンアップ
  document.removeEventListener('click', onTap);
  counter.style.display = 'none';
  skipHint.classList.remove('show');
  doors.style.display = 'none';
  doors.classList.remove('open');
  pillar.className = 'gacha-pillar';
  gachaAnimating = false;

  // 複数連ならまとめ表示
  if (isMulti && gachaAllResults.length > 1) {
    await gachaSleep(200);
    showMultiSummary();
  }
}

function showGachaCard(result) {
  const overlay = document.getElementById('gachaOverlay');
  const glow = document.getElementById('gachaGlow');
  const rays = document.getElementById('gachaRays');
  const icon = document.getElementById('gachaIcon');
  const label = document.getElementById('gachaLabel');
  const nameEl = document.getElementById('gachaName');
  const badgeEl = document.getElementById('gachaBadge');
  const incomeEl = document.getElementById('gachaIncome');

  // リセット
  overlay.classList.remove('reveal');
  glow.className = 'gacha-glow';
  rays.className = 'gacha-rays';
  icon.className = 'gacha-icon';
  nameEl.className = 'gacha-name';
  label.className = 'gacha-label';
  badgeEl.innerHTML = '';
  overlay.querySelectorAll('.gacha-confetti').forEach(e => e.remove());

  // 放射光線を生成
  rays.innerHTML = '';
  const rayCount = result.isVariant ? 16 : 10;
  for (let i = 0; i < rayCount; i++) {
    const ray = document.createElement('div');
    ray.className = 'gacha-ray';
    ray.style.setProperty('--r', (i * (360/rayCount)) + 'deg');
    rays.appendChild(ray);
  }
  if (result.isVariant) rays.classList.add('rare');

  // アイコン
  icon.innerHTML = fishIconHTML(result.fishType.id, 110, result.variantType, result.fish.hueShift);

  // ラベル
  const vt = result.isVariant ? VARIANT_TYPES.find(v => v.id === result.variantType) : null;
  if (result.isVariant) {
    label.textContent = '✨ RARE ✨';
    label.classList.add('rare');
  } else {
    label.textContent = 'GET!';
  }

  // 名前
  const fullName = result.fishType.name + (vt ? ' ' + vt.suffix : '');
  nameEl.textContent = fullName;

  if (result.isVariant) {
    glow.classList.add('rare');
    icon.classList.add('rare');
    nameEl.classList.add('rare');
    const badge = document.createElement('div');
    badge.className = 'gacha-variant-badge ' + result.variantType;
    badge.textContent = vt.name + ' 変異種！ 収入2.5倍';
    badgeEl.appendChild(badge);
  }

  const income = result.fish.getPassiveIncome();
  incomeEl.textContent = '💰 自動収入 +' + income + '🪙/10秒';

  overlay.classList.add('open');
}

function spawnConfetti(container, isRare) {
  const count = isRare ? 50 : 18;
  const colors = isRare
    ? ['#ffd700','#ff6f00','#ffeb3b','#ff5722','#e040fb','#00e5ff','#76ff03','#fff']
    : ['#7ec8e3','#ffd700','#6bcb77','#ff8a80','#b388ff'];
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const conf = document.createElement('div');
      conf.className = 'gacha-confetti';
      conf.style.left = (10 + Math.random()*80) + '%';
      conf.style.top = (5 + Math.random()*15) + '%';
      conf.style.background = colors[Math.floor(Math.random()*colors.length)];
      conf.style.width = (4+Math.random()*10) + 'px';
      conf.style.height = (4+Math.random()*10) + 'px';
      conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      conf.style.animationDuration = (1.5+Math.random()*2.5) + 's';
      container.appendChild(conf);
      setTimeout(() => conf.remove(), 4500);
    }, Math.random() * 800);
  }
}

function showMultiSummary() {
  const overlay = document.getElementById('gachaMultiOverlay');
  const title = document.getElementById('gachaMultiTitle');
  const grid = document.getElementById('gachaMultiGrid');
  const gacha = gachaCurrentGacha;
  const results = gachaAllResults;
  const rareCount = results.filter(r => r.isVariant).length;
  title.textContent = gacha.icon + ' ' + gacha.name + ' ' + results.length + '連結果' + (rareCount > 0 ? '  ✨レア'+rareCount+'体！' : '');
  grid.innerHTML = '';
  results.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'gacha-multi-card';
    card.style.animationDelay = (i * 0.08) + 's';
    const isRare = r.isVariant;
    card.style.cssText += ';background:' + (isRare ? 'linear-gradient(135deg,rgba(255,215,0,0.15),rgba(255,100,0,0.15))' : 'rgba(126,200,227,0.08)') + ';border-radius:10px;padding:10px;text-align:center;border:1px solid ' + (isRare ? 'rgba(255,215,0,0.4)' : 'rgba(126,200,227,0.15)') + ';';
    const vt = r.isVariant ? VARIANT_TYPES.find(v => v.id === r.variantType) : null;
    const name = r.fishType.name + (vt ? ' ' + vt.suffix : '');
    const income = r.fish.getPassiveIncome();
    card.innerHTML = '<div style="margin-bottom:6px;">' + fishIconHTML(r.fishType.id, 56, r.variantType, r.fish.hueShift) + '</div>'
      + (isRare ? '<div style="font-size:0.65rem;color:#ffd700;font-weight:bold;margin-bottom:2px;">✨ ' + vt.name + '</div>' : '')
      + '<div style="font-size:0.8rem;color:#fff;font-weight:bold;">' + name + '</div>'
      + '<div style="font-size:0.7rem;color:rgba(255,255,255,0.5);margin-top:2px;">+' + income + '🪙/10秒</div>';
    grid.appendChild(card);
  });
  overlay.classList.add('open');
}

function closeMultiGacha(e) {
  if (e.target.id === 'gachaMultiOverlay') {
    document.getElementById('gachaMultiOverlay').classList.remove('open');
  }
}

function closeGachaResult() {
  // 旧関数（互換用）- 新しい演出では使わない
}
