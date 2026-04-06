// === fish.js === Fish + エンティティクラス
// ============================================================
// 状態
// ============================================================
let bubblerOn = true, lightMode = 'day', lightIndex = 0;
const lightModes = ['day','night','blue'];
let fishes = [], bubbles = [], foods = [], plants = [], sandParticles = [], treasureBubbles = [];
let autoFeederTimer = 0, breedTimer = 0, treasureTimer = 0;
let randomEventTimer = 0, sharkCooldown = 0, goldenTimeRemaining = 0, goldenTimeMultiplier = 1, eventAnimating = false;
let waterQuality = 100, waterChangeCount = 0;
let visitors = [], visitorTimer = 0, totalTipsEarned = 0;
let mouseX = -999, mouseY = -999, hoveredFish = null;

// ============================================================
// 🎨 色ヘルパー
// ============================================================
function darkenColor(color, amount) {
  // rgba(r,g,b,a) or #hex or named color → 暗い版
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) {
    const r = Math.max(0, parseInt(m[1]) - amount);
    const g = Math.max(0, parseInt(m[2]) - amount);
    const b = Math.max(0, parseInt(m[3]) - amount);
    return `rgba(${r},${g},${b},0.5)`;
  }
  if (color.startsWith('#')) {
    const hex = color.length === 4
      ? '#' + color[1]+color[1]+color[2]+color[2]+color[3]+color[3]
      : color;
    const r = Math.max(0, parseInt(hex.slice(1,3),16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3,5),16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5,7),16) - amount);
    return `rgba(${r},${g},${b},0.5)`;
  }
  if (color.startsWith('hsl')) {
    return color.replace(/\d+%\)/, m => (Math.max(0, parseInt(m)-20)) + '%)');
  }
  return 'rgba(80,60,40,0.4)';
}

// 絵本風アウトライン設定
function setBookOutline(s, color) {
  ctx.strokeStyle = darkenColor(color, 60);
  ctx.lineWidth = Math.max(1, s * 0.06);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

// ============================================================
// 🐟 魚クラス
// ============================================================
class Fish {
  constructor(typeId, x, y, isVariant, variantType) {
    const type = FISH_TYPES.find(t => t.id === typeId) || FISH_TYPES[0];
    this.type = type; this.typeId = typeId;
    this.x = x || Math.random() * canvas.width;
    this.y = y || 60 + Math.random() * (canvas.height - 160);
    this.size = type.sizeRange[0] + Math.random() * (type.sizeRange[1] - type.sizeRange[0]);
    this.baseSize = this.size;
    this.speed = type.speedRange[0] + Math.random() * (type.speedRange[1] - type.speedRange[0]);
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.targetX = this.x; this.targetY = this.y;
    this.changeTimer = 0;
    this.tailPhase = Math.random() * Math.PI * 2;
    const pal = type.palettes[Math.floor(Math.random() * type.palettes.length)];
    this.colors = { ...pal };
    if (type.patternType === 'random') {
      this.patternType = ['none','vstripes','dots'][Math.floor(Math.random()*3)];
    } else {
      this.patternType = type.patternType;
    }
    // ランダムカラー（アイコン用hue-rotate）
    this.hueShift = Math.floor(Math.random() * 360);
    // 変異種サポート
    this.isVariant = isVariant || false;
    this.variantType = variantType || null;
    this.variantParticles = [];
    if (this.isVariant && this.variantType) {
      const vt = VARIANT_TYPES.find(v => v.id === this.variantType);
      if (vt && vt.paletteOverride) this.colors = { ...vt.paletteOverride };
    }
  }

  getPassiveIncome() {
    let base = this.type.passiveIncome;
    if (this.isVariant) {
      const vt = VARIANT_TYPES.find(v => v.id === this.variantType);
      if (vt) base *= vt.incomeMultiplier;
    }
    return base;
  }

  update() {
    this.changeTimer--;
    if (this.changeTimer <= 0) {
      this.targetX = 40 + Math.random() * (canvas.width - 80);
      if (this.type.bottomDweller) {
        this.targetY = canvas.height - 70 - Math.random() * 50;
      } else {
        this.targetY = 40 + Math.random() * (canvas.height - 140);
      }
      this.changeTimer = 120 + Math.random() * 200;
    }
    if (foods.length > 0) {
      let nearest = null, minDist = Infinity;
      for (const f of foods) { const d = Math.hypot(f.x - this.x, f.y - this.y); if (d < minDist) { minDist = d; nearest = f; } }
      if (nearest && minDist < 280) {
        this.targetX = nearest.x; this.targetY = nearest.y;
        if (minDist < this.size) {
          addCoins(nearest.coinReward, nearest.x, nearest.y);
          this.size = Math.min(this.size + nearest.growAmount, this.baseSize * 3.5);
          foods.splice(foods.indexOf(nearest), 1);
        }
      }
    }
    const dx = this.targetX - this.x, dy = this.targetY - this.y;
    // 水質低下時のスロー
    let spdMod = 1;
    if (waterQuality < WATER_QUALITY.sluggishThreshold) {
      spdMod = WATER_QUALITY.sluggishSpeedMult + (1 - WATER_QUALITY.sluggishSpeedMult) * (waterQuality / WATER_QUALITY.sluggishThreshold);
    }
    this.x += dx * 0.01 * this.speed * spdMod;
    this.y += dy * 0.005 * this.speed * spdMod;
    if (Math.abs(dx) > 2) this.direction = dx > 0 ? 1 : -1;
    this.tailPhase += 0.08 * this.speed * spdMod;
    // Keep in bounds
    this.x = Math.max(20, Math.min(canvas.width - 20, this.x));
    this.y = Math.max(20, Math.min(canvas.height - 40, this.y));
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.direction, 1);
    const s = this.size;

    switch(this.type.shape) {
      case 'seahorse': this.drawSeahorse(s); break;
      case 'puffer': this.drawPuffer(s); break;
      case 'serpent': this.drawSerpent(s); break;
      case 'manta': this.drawManta(s); break;
      case 'mythic': this.drawMythic(s); break;
      default: this.drawGeneric(s); break;
    }
    this.drawVariantEffects(s);

    ctx.restore();
  }

  // ---------- 変異種エフェクト ----------
  drawVariantEffects(s) {
    if (!this.isVariant) return;
    const vt = VARIANT_TYPES.find(v => v.id === this.variantType);
    if (!vt) return;
    // ホロ虹色サイクル
    if (vt.id === 'holo') {
      const hue = (Date.now()*0.1)%360;
      this.colors.body = `hsl(${hue},70%,60%)`;
      this.colors.fin = `hsl(${(hue+30)%360},70%,50%)`;
      this.colors.belly = `hsl(${(hue+60)%360},50%,80%)`;
    }
    // グローオーラ
    if (vt.glowColor) {
      ctx.shadowColor = vt.glowColor;
      ctx.shadowBlur = 12 + Math.sin(Date.now()*0.003)*5;
      ctx.fillStyle = vt.glowColor.replace(/[\d.]+\)$/,'0.08)');
      ctx.beginPath(); ctx.ellipse(0,0,s*1.2,s*0.7,0,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // キラキラパーティクル
    if (Math.random() < 0.12) {
      this.variantParticles.push({ ox:(Math.random()-0.5)*s*2, oy:(Math.random()-0.5)*s*1.5, life:40, maxLife:40 });
    }
    if (this.variantParticles.length > 5) this.variantParticles.shift();
    for (let i = this.variantParticles.length-1; i >= 0; i--) {
      const p = this.variantParticles[i];
      p.life--; p.oy -= 0.3;
      if (p.life <= 0) { this.variantParticles.splice(i,1); continue; }
      const a = p.life/p.maxLife;
      ctx.globalAlpha = a*0.7;
      ctx.fillStyle = vt.particleColor;
      ctx.beginPath();
      // 星形キラキラ
      const sz = 2 + a*2;
      ctx.moveTo(p.ox, p.oy-sz); ctx.lineTo(p.ox+sz*0.3, p.oy-sz*0.3);
      ctx.lineTo(p.ox+sz, p.oy); ctx.lineTo(p.ox+sz*0.3, p.oy+sz*0.3);
      ctx.lineTo(p.ox, p.oy+sz); ctx.lineTo(p.ox-sz*0.3, p.oy+sz*0.3);
      ctx.lineTo(p.ox-sz, p.oy); ctx.lineTo(p.ox-sz*0.3, p.oy-sz*0.3);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // ---------- 汎用描画（絵本風） ----------
  drawGeneric(s) {
    const bw = this.type.bodyW || 0.7;
    const bh = this.type.bodyH || 0.4;
    const tw = Math.sin(this.tailPhase) * 5;
    const ts = this.type.tailStyle;
    // 尾ビレ
    ctx.fillStyle = this.colors.fin;
    setBookOutline(s, this.colors.fin);
    if (ts === 'flowing') {
      const tw1 = Math.sin(this.tailPhase)*8, tw2 = Math.sin(this.tailPhase+1)*6;
      ctx.beginPath();
      ctx.moveTo(-s*bw*0.5, 0);
      ctx.bezierCurveTo(-s*bw*1.3, -s*0.7+tw1, -s*bw*2+tw2, -s*0.5, -s*bw*1.8+tw1, 0);
      ctx.bezierCurveTo(-s*bw*2+tw2, s*0.5, -s*bw*1.3, s*0.7+tw1, -s*bw*0.5, 0);
      ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    } else if (ts === 'fan') {
      ctx.beginPath();
      ctx.moveTo(-s*bw*0.5, 0);
      ctx.bezierCurveTo(-s*bw*1.2, -s*0.6+tw, -s*bw*1.6, -s*0.3, -s*bw*1.4+tw*0.3, 0);
      ctx.bezierCurveTo(-s*bw*1.6, s*0.3, -s*bw*1.2, s*0.6+tw, -s*bw*0.5, 0);
      ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();
    } else if (ts === 'fork') {
      ctx.beginPath();
      ctx.moveTo(-s*bw*0.5, 0);
      ctx.quadraticCurveTo(-s*bw*1.0, -s*bh*0.3, -s*bw*1.5+tw, -s*bh*1.2);
      ctx.quadraticCurveTo(-s*bw*1.1, -s*bh*0.1, -s*bw*0.9, 0);
      ctx.quadraticCurveTo(-s*bw*1.1, s*bh*0.1, -s*bw*1.5+tw, s*bh*1.2);
      ctx.quadraticCurveTo(-s*bw*1.0, s*bh*0.3, -s*bw*0.5, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (ts === 'lobe') {
      ctx.beginPath();
      ctx.ellipse(-s*bw*0.85, -s*bh*0.3+tw*0.3, s*0.2, s*bh*0.6, -0.2, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-s*bw*0.85, s*bh*0.3+tw*0.3, s*0.2, s*bh*0.6, 0.2, 0, Math.PI*2);
      ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-s*bw*0.5, 0);
      ctx.quadraticCurveTo(-s*bw*1.0, -s*bh*0.4, -s*bw*1.4+tw, -s*bh*1.1);
      ctx.quadraticCurveTo(-s*bw*1.5+tw, 0, -s*bw*1.4+tw, s*bh*1.1);
      ctx.quadraticCurveTo(-s*bw*1.0, s*bh*0.4, -s*bw*0.5, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // グロー
    if (this.type.glowColor) { ctx.shadowColor = this.type.glowColor; ctx.shadowBlur = 12; }

    // 体（アウトライン付き）
    ctx.fillStyle = this.colors.body;
    setBookOutline(s, this.colors.body);
    ctx.beginPath(); ctx.ellipse(0, 0, s*bw, s*bh, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    // お腹
    ctx.fillStyle = this.colors.belly;
    ctx.beginPath(); ctx.ellipse(0, s*bh*0.2, s*(bw*0.75), s*(bh*0.55), 0, 0, Math.PI); ctx.fill();

    // 模様
    this.drawPattern(s, bw, bh);

    // 背ビレ（アウトライン付き）
    ctx.fillStyle = this.colors.fin;
    setBookOutline(s, this.colors.fin);
    const ds = this.type.dorsalStyle;
    if (ds === 'tall') {
      ctx.beginPath(); ctx.moveTo(-s*bw*0.3, -s*bh);
      ctx.quadraticCurveTo(0, -s*bh*2.8, s*bw*0.3, -s*bh); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (ds === 'flowing') {
      const sw = Math.sin(this.tailPhase*0.7)*3;
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.moveTo(-s*bw*0.5, -s*bh);
      ctx.quadraticCurveTo(0, -s*bh*2.2+sw, s*bw*0.5, -s*bh); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.stroke();
    } else {
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.moveTo(-s*bw*0.25, -s*bh*0.85);
      ctx.bezierCurveTo(-s*bw*0.1, -s*bh*1.8, s*bw*0.3, -s*bh*1.8, s*bw*0.45, -s*bh*0.85);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1; ctx.stroke();
    }

    // 腹ビレ（エンゼル）
    if (this.type.hasVentralFin) {
      ctx.fillStyle = this.colors.fin;
      setBookOutline(s, this.colors.fin);
      ctx.beginPath(); ctx.moveTo(-s*bw*0.1, s*bh);
      ctx.quadraticCurveTo(0, s*bh*2.5, s*bw*0.15, s*bh); ctx.closePath(); ctx.fill(); ctx.stroke();
    }

    // ヒゲ
    if (this.type.hasWhiskers) {
      ctx.strokeStyle = darkenColor(this.colors.fin, 40); ctx.lineWidth = Math.max(1.5, s*0.04); ctx.lineCap = 'round';
      const hx = s*bw*0.7;
      ctx.beginPath(); ctx.moveTo(hx, -s*0.02);
      ctx.quadraticCurveTo(hx+s*0.15, -s*0.12, hx+s*0.25, -s*0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(hx, s*0.04);
      ctx.quadraticCurveTo(hx+s*0.15, s*0.12, hx+s*0.25, s*0.18); ctx.stroke();
    }

    // 目
    this.drawEye(s, s*(bw-0.2), -s*bh*0.2);
    // ほっぺ
    this.drawBlush(s, s*(bw-0.35), s*bh*0.15);
  }

  // ---------- タツノオトシゴ（絵本風） ----------
  drawSeahorse(s) {
    const wave = Math.sin(this.tailPhase)*3;

    // 巻きしっぽ
    ctx.strokeStyle = this.colors.body; ctx.lineWidth = s*0.18; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, s*0.6, s*0.25, -Math.PI*0.3, Math.PI*0.9);
    ctx.stroke();
    // しっぽアウトライン
    ctx.strokeStyle = darkenColor(this.colors.body, 60); ctx.lineWidth = s*0.22;
    ctx.beginPath(); ctx.arc(0, s*0.6, s*0.25, -Math.PI*0.3, Math.PI*0.9); ctx.stroke();
    ctx.strokeStyle = this.colors.body; ctx.lineWidth = s*0.15;
    ctx.beginPath(); ctx.arc(0, s*0.6, s*0.25, -Math.PI*0.3, Math.PI*0.9); ctx.stroke();

    // 体（ぷっくり）
    ctx.fillStyle = this.colors.body;
    setBookOutline(s, this.colors.body);
    ctx.beginPath();
    ctx.moveTo(s*0.1, -s*0.7);
    ctx.bezierCurveTo(s*0.38, -s*0.4, s*0.35+wave*0.01, s*0.0, s*0.1, s*0.35);
    ctx.bezierCurveTo(-s*0.15, s*0.0, -s*0.2, -s*0.4, s*0.0, -s*0.7);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // お腹
    ctx.fillStyle = this.colors.belly;
    ctx.beginPath(); ctx.ellipse(s*0.16, -s*0.1, s*0.1, s*0.25, 0.1, 0, Math.PI*2); ctx.fill();

    // くちばし
    ctx.fillStyle = this.colors.body;
    setBookOutline(s, this.colors.body);
    ctx.beginPath(); ctx.ellipse(s*0.3, -s*0.65, s*0.18, s*0.05, 0.15, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // 背ビレ
    ctx.fillStyle = this.colors.fin; ctx.globalAlpha = 0.5;
    setBookOutline(s, this.colors.fin);
    ctx.beginPath(); ctx.ellipse(-s*0.08, -s*0.2+wave*0.01, s*0.08, s*0.13, -0.3, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.stroke();

    // 目（かわいい版）
    this.drawEye(s, s*0.13, -s*0.58);
    // ほっぺ
    this.drawBlush(s, s*0.22, -s*0.35);
  }

  // ---------- フグ（絵本風） ----------
  drawPuffer(s) {
    const tw = Math.sin(this.tailPhase)*2;

    // 小さい尻尾
    ctx.fillStyle = this.colors.fin;
    setBookOutline(s, this.colors.fin);
    ctx.beginPath(); ctx.moveTo(-s*0.4, 0);
    ctx.lineTo(-s*0.65+tw, -s*0.12); ctx.lineTo(-s*0.65+tw, s*0.12); ctx.closePath(); ctx.fill(); ctx.stroke();

    // まんまるボディ
    ctx.fillStyle = this.colors.body;
    setBookOutline(s, this.colors.body);
    ctx.beginPath(); ctx.arc(0, 0, s*0.5, 0, Math.PI*2); ctx.fill(); ctx.stroke();

    // お腹
    ctx.fillStyle = this.colors.belly;
    ctx.beginPath(); ctx.ellipse(0, s*0.1, s*0.38, s*0.3, 0, 0, Math.PI); ctx.fill();

    // 模様（点々）
    const sc = this.colors.stripe || 'rgba(100,80,50,0.3)';
    ctx.fillStyle = sc;
    const spots = [[-0.2,-0.2],[0.15,-0.15],[-0.1,0.1],[0.2,0.05],[0,-0.25],[0.1,0.2]];
    for (const [sx,sy] of spots) {
      ctx.beginPath(); ctx.arc(sx*s, sy*s, s*0.035, 0, Math.PI*2); ctx.fill();
    }

    // 胸ビレ
    ctx.fillStyle = this.colors.fin; ctx.globalAlpha = 0.5;
    setBookOutline(s, this.colors.fin);
    ctx.beginPath(); ctx.ellipse(s*0.2, s*0.15, s*0.12, s*0.05, 0.3+tw*0.03, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.stroke();

    // でかい目
    this.drawEye(s, s*0.2, -s*0.12);
    // ほっぺ
    this.drawBlush(s, s*0.1, s*0.08);
  }

  // ---------- リュウグウノツカイ（絵本風） ----------
  drawSerpent(s) {
    const segments = 8, segLen = s*0.35;
    const pts = [];
    let px = s*0.3, py = 0;
    for (let i = 0; i <= segments; i++) {
      const wave = Math.sin(this.tailPhase + i*0.7) * (2 + i*1.5);
      pts.push({x: px, y: py + wave});
      px -= segLen;
    }

    // 体アウトライン（太い線の外側）
    ctx.strokeStyle = darkenColor(this.colors.body, 60); ctx.lineWidth = s*0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    // 体（太い線）
    ctx.strokeStyle = this.colors.body; ctx.lineWidth = s*0.22;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();

    // お腹ライン
    ctx.strokeStyle = this.colors.belly; ctx.lineWidth = s*0.12;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y+s*0.03);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y+s*0.03);
    ctx.stroke();

    // 赤い背ビレ（クレスト）
    ctx.strokeStyle = this.colors.fin; ctx.lineWidth = s*0.1;
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y-s*0.12);
    for (let i = 1; i <= 3; i++) ctx.lineTo(pts[i].x, pts[i].y - s*0.15 - Math.sin(this.tailPhase+i)*2);
    ctx.stroke();

    // 頭の飾りヒレ
    ctx.fillStyle = this.colors.fin; ctx.globalAlpha = 0.7;
    setBookOutline(s, this.colors.fin);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y - s*0.12);
    ctx.lineTo(pts[0].x + s*0.15, pts[0].y - s*0.45);
    ctx.lineTo(pts[0].x - s*0.1, pts[0].y - s*0.35);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.stroke();

    // 目（かわいい版）
    this.drawEye(s, pts[0].x+s*0.02, pts[0].y-s*0.02);
    // ほっぺ
    this.drawBlush(s, pts[0].x-s*0.05, pts[0].y+s*0.1);
  }

  // ---------- マンタ（絵本風） ----------
  drawManta(s) {
    const flap = Math.sin(this.tailPhase*0.6)*0.15;

    // しっぽ
    ctx.strokeStyle = darkenColor(this.colors.fin, 40); ctx.lineWidth = s*0.07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s*0.5, 0);
    ctx.lineTo(-s*1.4, Math.sin(this.tailPhase)*s*0.1); ctx.stroke();
    ctx.strokeStyle = this.colors.fin; ctx.lineWidth = s*0.04;
    ctx.beginPath(); ctx.moveTo(-s*0.5, 0);
    ctx.lineTo(-s*1.4, Math.sin(this.tailPhase)*s*0.1); ctx.stroke();

    // 翼（体）
    ctx.fillStyle = this.colors.body;
    setBookOutline(s, this.colors.body);
    ctx.beginPath();
    ctx.moveTo(s*0.5, 0);
    ctx.quadraticCurveTo(s*0.2, -s*(0.7+flap*s*0.02), -s*0.4, -s*0.08);
    ctx.quadraticCurveTo(-s*0.5, 0, -s*0.4, s*0.08);
    ctx.quadraticCurveTo(s*0.2, s*(0.7+flap*s*0.02), s*0.5, 0);
    ctx.fill(); ctx.stroke();

    // お腹
    ctx.fillStyle = this.colors.belly;
    ctx.beginPath(); ctx.ellipse(0, 0, s*0.3, s*0.08, 0, 0, Math.PI*2); ctx.fill();

    // 目（かわいい版）
    this.drawEye(s, s*0.3, -s*0.06);
    // ほっぺ
    this.drawBlush(s, s*0.2, s*0.06);
  }

  // ---------- 龍神（絵本風） ----------
  drawMythic(s) {
    const tw = Math.sin(this.tailPhase)*5;

    // オーラ
    ctx.shadowColor = 'rgba(255,215,0,0.6)'; ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255,215,0,0.08)';
    ctx.beginPath(); ctx.ellipse(0, 0, s*1.2, s*0.6, 0, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // 流れるヒレ（尾）
    ctx.fillStyle = this.colors.fin;
    setBookOutline(s, this.colors.fin);
    const tw1 = Math.sin(this.tailPhase)*10, tw2 = Math.sin(this.tailPhase+1)*8;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-s*0.5, 0);
    ctx.bezierCurveTo(-s*1.2, -s*0.6+tw1, -s*1.8+tw2, -s*0.4, -s*1.6+tw1, 0);
    ctx.bezierCurveTo(-s*1.8+tw2, s*0.4, -s*1.2, s*0.6+tw1, -s*0.5, 0);
    ctx.fill(); ctx.globalAlpha = 1; ctx.stroke();

    // グロー付き体（アウトライン付き）
    ctx.shadowColor = 'rgba(255,215,0,0.4)'; ctx.shadowBlur = 15;
    ctx.fillStyle = this.colors.body;
    setBookOutline(s, this.colors.body);
    ctx.beginPath(); ctx.ellipse(0, 0, s*0.9, s*0.3, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;

    // お腹
    ctx.fillStyle = this.colors.belly;
    ctx.beginPath(); ctx.ellipse(0, s*0.06, s*0.7, s*0.18, 0, 0, Math.PI); ctx.fill();

    // 鱗
    ctx.strokeStyle = 'rgba(255,180,0,0.25)'; ctx.lineWidth = 0.5;
    for (let row = -1; row <= 1; row++) {
      for (let col = -3; col <= 3; col++) {
        ctx.beginPath(); ctx.arc(col*s*0.18, row*s*0.1, s*0.07, 0, Math.PI*2); ctx.stroke();
      }
    }

    // 背ビレ（龍の鬣）
    ctx.fillStyle = this.colors.fin; ctx.globalAlpha = 0.6;
    setBookOutline(s, this.colors.fin);
    const sw = Math.sin(this.tailPhase*0.7)*4;
    ctx.beginPath(); ctx.moveTo(-s*0.5, -s*0.28);
    ctx.quadraticCurveTo(-s*0.1, -s*0.8+sw, s*0.5, -s*0.28); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1; ctx.stroke();

    // ヒゲ（龍）
    ctx.strokeStyle = darkenColor(this.colors.fin, 40); ctx.lineWidth = Math.max(1.5, s*0.04); ctx.lineCap = 'round';
    const hx = s*0.7;
    ctx.beginPath(); ctx.moveTo(hx, -s*0.05);
    ctx.quadraticCurveTo(hx+s*0.3, -s*0.25+tw*0.02, hx+s*0.45, -s*0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx, s*0.05);
    ctx.quadraticCurveTo(hx+s*0.3, s*0.2+tw*0.02, hx+s*0.4, s*0.25); ctx.stroke();

    // 目
    ctx.shadowColor = 'rgba(255,215,0,0.8)'; ctx.shadowBlur = 6;
    this.drawEye(s, s*0.5, -s*0.05);
    ctx.shadowBlur = 0;
    // ほっぺ
    this.drawBlush(s, s*0.35, s*0.1);
  }

  // ---------- 模様描画 ----------
  drawPattern(s, bw, bh) {
    const pt = this.patternType;
    if (!pt || pt === 'none') return;

    if (pt === 'vstripes') {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i*s*0.18, -s*bh*0.8); ctx.lineTo(i*s*0.18, s*bh*0.8); ctx.stroke(); }
    } else if (pt === 'dots') {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-s*bw*0.4+i*s*bw*0.28, 0, s*0.05, 0, Math.PI*2); ctx.fill(); }
    } else if (pt === 'neon') {
      ctx.strokeStyle = this.colors.stripe||'#ff3366'; ctx.lineWidth = s*0.1;
      ctx.shadowColor = this.colors.stripe||'#ff3366'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(-s*bw*0.7, 0); ctx.lineTo(s*bw*0.5, 0); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = this.colors.body; ctx.lineWidth = s*0.06;
      ctx.shadowColor = this.colors.body; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(-s*bw*0.6, -s*bh*0.4); ctx.lineTo(s*bw*0.4, -s*bh*0.4); ctx.stroke(); ctx.shadowBlur = 0;
    } else if (pt === 'bands') {
      ctx.fillStyle = this.colors.stripe||'rgba(255,255,255,0.85)';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.ellipse(i*s*bw*0.5, 0, s*0.03, s*bh*0.9, 0, 0, Math.PI*2); ctx.fill();
      }
    } else if (pt === 'vbands') {
      ctx.fillStyle = this.colors.stripe||'rgba(0,0,0,0.3)'; ctx.globalAlpha = 0.3;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.ellipse(i*s*bw*0.4, 0, s*0.05, s*bh*0.85, 0, 0, Math.PI*2); ctx.fill(); }
      ctx.globalAlpha = 1;
    } else if (pt === 'scales') {
      ctx.strokeStyle = this.colors.stripe||'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.3;
      for (let row = -1; row <= 1; row++) for (let col = -3; col <= 3; col++) { ctx.beginPath(); ctx.arc(col*s*bw*0.22, row*s*bh*0.35, s*0.07, 0, Math.PI*2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else if (pt === 'swirl') {
      ctx.strokeStyle = this.colors.stripe||'rgba(255,100,0,0.4)'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.35;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc((i-1)*s*bw*0.35, 0, s*bh*0.3, 0, Math.PI*1.5); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else if (pt === 'spots') {
      ctx.fillStyle = this.colors.stripe||'rgba(255,255,255,0.3)';
      const sp = [[-0.35,-0.15],[0.1,-0.2],[0.35,0.05],[-0.15,0.15],[0.0,-0.05],[-0.3,0.05],[0.25,-0.12],[0.15,0.12]];
      for (const [sx,sy] of sp) { ctx.beginPath(); ctx.arc(sx*s*bw*1.3, sy*s*bh*1.3, s*0.035, 0, Math.PI*2); ctx.fill(); }
    } else if (pt === 'eyespot') {
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath(); ctx.arc(-s*bw*0.3, -s*bh*0.15, s*0.1, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = this.colors.stripe||'#ffd700';
      ctx.beginPath(); ctx.arc(-s*bw*0.3, -s*bh*0.15, s*0.05, 0, Math.PI*2); ctx.fill();
    }
  }

  // ---------- 目の描画（絵本風・キラキラ） ----------
  drawEye(s, ex, ey) {
    // 白目（大きめ）
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex, ey, s*0.22, 0, Math.PI*2); ctx.fill();
    // 白目アウトライン
    ctx.strokeStyle = 'rgba(60,40,30,0.35)';
    ctx.lineWidth = Math.max(0.8, s*0.03);
    ctx.stroke();
    // 黒目
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath(); ctx.arc(ex+s*0.03, ey+s*0.01, s*0.13, 0, Math.PI*2); ctx.fill();
    // ハイライト大
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex+s*0.07, ey-s*0.06, s*0.06, 0, Math.PI*2); ctx.fill();
    // ハイライト中
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex-s*0.02, ey+s*0.04, s*0.035, 0, Math.PI*2); ctx.fill();
    // ハイライト小（キラッ）
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(ex+s*0.1, ey-s*0.02, s*0.02, 0, Math.PI*2); ctx.fill();
  }

  // ---------- ほっぺ描画（絵本風・ふんわり） ----------
  drawBlush(s, bx, by) {
    ctx.fillStyle = 'rgba(255,130,150,0.4)';
    ctx.beginPath(); ctx.ellipse(bx, by, s*0.13, s*0.08, 0, 0, Math.PI*2); ctx.fill();
  }
}

// ============================================================
// 魚アイコンレンダラー（SVGベース + hue-rotate）
// ============================================================
function fishIconHTML(typeId, size, variantType, hueShift) {
  const src = FISH_SVGS[typeId] || '';
  if (!src) return '<span style="font-size:'+size+'px">🐟</span>';
  let filter = '';
  // 変異種カラー
  if (variantType === 'gold') filter = 'sepia(1) saturate(3) hue-rotate(10deg) brightness(1.1)';
  else if (variantType === 'albino') filter = 'saturate(0.15) brightness(1.5)';
  else if (variantType === 'neon') filter = 'saturate(2) brightness(1.3) contrast(1.1)';
  else if (variantType === 'holo') filter = 'saturate(1.5) hue-rotate('+(Date.now()%360)+'deg)';
  // ランダムカラー（hueShiftが指定されたら適用）
  else if (hueShift) filter = 'hue-rotate('+hueShift+'deg)';
  const style = 'width:'+size+'px;height:'+size+'px;vertical-align:middle'+(filter?' ;filter:'+filter:'');
  return '<img src="'+src+'" style="'+style+'" />';
}

// ============================================================
// 泡・エサ・水草・お宝バブル
// ============================================================
class Bubble {
  constructor(x, y) { this.x = x; this.y = y||canvas.height-30; this.radius = 1+Math.random()*4; this.speed = 0.3+Math.random()*0.8; this.wobble = Math.random()*Math.PI*2; }
  update() { this.y -= this.speed; this.wobble += 0.03; this.x += Math.sin(this.wobble)*0.3; return this.y+this.radius > 0; }
  draw() {
    ctx.strokeStyle = 'rgba(180,220,255,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(220,240,255,0.3)';
    ctx.beginPath(); ctx.arc(this.x-this.radius*0.3, this.y-this.radius*0.3, this.radius*0.3, 0, Math.PI*2); ctx.fill();
  }
}

class TreasureBubble {
  constructor(x) {
    this.x = x; this.y = canvas.height-30;
    this.radius = 4+Math.random()*5;
    this.speed = 0.4+Math.random()*0.4;
    this.wobble = Math.random()*Math.PI*2;
    this.reward = Math.floor(3 + this.radius * 2);
  }
  update() { this.y -= this.speed; this.wobble += 0.02; this.x += Math.sin(this.wobble)*0.5; return this.y - this.radius > -5; }
  draw() {
    ctx.strokeStyle = 'rgba(255,215,0,0.6)'; ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(255,215,0,0.4)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,215,0,0.15)';
    ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(this.x-this.radius*0.3, this.y-this.radius*0.3, this.radius*0.25, 0, Math.PI*2); ctx.fill();
  }
}

class Food {
  constructor(x, y, foodType, coinRewardOverride, growAmountOverride) {
    this.x = x; this.y = y; this.foodType = foodType; this.size = foodType.size;
    this.sinkSpeed = 0.3+Math.random()*0.3; this.wobble = Math.random()*Math.PI*2; this.life = 600;
    // レベルベース報酬（オートフィーダーは固定値を渡す）
    this.coinReward = coinRewardOverride !== undefined ? coinRewardOverride : getFoodCoinReward(foodType.id);
    this.growAmount = growAmountOverride !== undefined ? growAmountOverride : getFoodGrowAmount(foodType.id);
  }
  update() { if (this.y < canvas.height-50) { this.y += this.sinkSpeed; this.wobble += 0.04; this.x += Math.sin(this.wobble)*0.3; } this.life--; return this.life > 0; }
  draw() {
    const a = Math.min(1, this.life/60), c = this.foodType.color;
    ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${a})`;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
    if (this.foodType.id !== 'normal') {
      ctx.fillStyle = `rgba(255,255,255,${a*0.4})`;
      ctx.beginPath(); ctx.arc(this.x-1, this.y-1, this.size*0.4, 0, Math.PI*2); ctx.fill();
    }
    if (this.foodType.id === 'legendary') {
      ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},0.6)`; ctx.shadowBlur = 8;
      ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${a*0.3})`;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size*1.5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

class Plant {
  constructor(x, colors, style) {
    this.x = x; this.baseY = canvas.height-20; this.phase = Math.random()*Math.PI*2;
    this.color = colors[Math.floor(Math.random()*colors.length)];
    this.style = style || 'seaweed';
    this.segments = 4+Math.floor(Math.random()*4);
    this.segmentLength = 15+Math.random()*20;
    this.width = 6+Math.random()*6;
    // サンゴ用
    this.branches = 2+Math.floor(Math.random()*3);
    this.coralH = 30+Math.random()*50;
    // 熱帯用
    this.leafCount = 2+Math.floor(Math.random()*3);
    this.stemH = 40+Math.random()*40;
    // クリスタル用
    this.crystalH = 25+Math.random()*45;
    this.crystalW = 6+Math.random()*8;
    this.crystalAngle = (Math.random()-0.5)*0.4;
  }
  draw(time) {
    switch(this.style) {
      case 'coral': this.drawCoral(time); break;
      case 'deepsea': this.drawDeepsea(time); break;
      case 'tropical': this.drawTropical(time); break;
      case 'crystal': this.drawCrystal(time); break;
      default: this.drawSeaweed(time); break;
    }
  }

  // --- 淡水：ゆらゆら水草 ---
  drawSeaweed(time) {
    ctx.save(); ctx.lineCap = 'round';
    let px = this.x, py = this.baseY;
    for (let i = 0; i < this.segments; i++) {
      const sway = Math.sin(time*0.001+this.phase+i*0.5)*(3+i*2);
      const nx = px+sway, ny = py-this.segmentLength, ratio = 1-i/this.segments;
      ctx.strokeStyle = `rgba(${this.color.r},${this.color.g},${this.color.b},${0.6+ratio*0.4})`;
      ctx.lineWidth = this.width*ratio;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px+sway*0.5, (py+ny)/2, nx, ny); ctx.stroke();
      if (i%2===0 && i<this.segments-1) {
        const ld = i%4===0?1:-1;
        ctx.fillStyle = `rgba(${this.color.r+20},${this.color.g+30},${this.color.b},0.5)`;
        ctx.beginPath(); ctx.ellipse(nx+ld*10, ny+5, 12, 4, ld*0.3, 0, Math.PI*2); ctx.fill();
      }
      px = nx; py = ny;
    }
    ctx.restore();
  }

  // --- サンゴ礁：枝分かれサンゴ ---
  drawCoral(time) {
    ctx.save();
    const {r,g,b} = this.color;
    const sway = Math.sin(time*0.0008+this.phase)*2;
    const bx = this.x, by = this.baseY;
    // 幹
    ctx.strokeStyle = `rgba(${r},${g},${b},0.9)`; ctx.lineCap = 'round'; ctx.lineWidth = this.width*1.2;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx+sway, by-this.coralH); ctx.stroke();
    // 枝
    for (let i = 0; i < this.branches; i++) {
      const t = (i+1)/(this.branches+1);
      const sy = by - this.coralH*t;
      const dir = i%2===0?1:-1;
      const branchLen = this.coralH*0.4*(1-t*0.3);
      const sw2 = Math.sin(time*0.001+this.phase+i*1.2)*1.5;
      ctx.lineWidth = this.width*(1-t*0.5);
      ctx.beginPath();
      ctx.moveTo(bx+sway*t, sy);
      ctx.quadraticCurveTo(bx+sway*t+dir*branchLen*0.5, sy-branchLen*0.3+sw2, bx+sway*t+dir*branchLen, sy-branchLen*0.6+sw2);
      ctx.stroke();
      // 枝先の丸
      ctx.fillStyle = `rgba(${Math.min(r+40,255)},${Math.min(g+40,255)},${Math.min(b+40,255)},0.7)`;
      ctx.beginPath(); ctx.arc(bx+sway*t+dir*branchLen, sy-branchLen*0.6+sw2, this.width*0.6, 0, Math.PI*2); ctx.fill();
    }
    // 頂上の丸
    ctx.fillStyle = `rgba(${Math.min(r+30,255)},${Math.min(g+30,255)},${Math.min(b+30,255)},0.8)`;
    ctx.beginPath(); ctx.arc(bx+sway, by-this.coralH, this.width*0.8, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // --- 深海：発光チューブ ---
  drawDeepsea(time) {
    ctx.save();
    const {r,g,b} = this.color;
    const bx = this.x, by = this.baseY;
    const pulse = 0.4+Math.sin(time*0.002+this.phase)*0.3;
    // 茎（暗め）
    ctx.strokeStyle = `rgba(${r},${g},${b},0.4)`; ctx.lineCap = 'round'; ctx.lineWidth = this.width*0.6;
    const h = this.segmentLength * this.segments * 0.6;
    const sway = Math.sin(time*0.0006+this.phase)*4;
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx+sway, by-h*0.5, bx+sway*1.5, by-h); ctx.stroke();
    // 発光球（先端）
    ctx.shadowColor = `rgba(${r+60},${g+60},${b+60},${pulse})`;
    ctx.shadowBlur = 15;
    ctx.fillStyle = `rgba(${Math.min(r+80,255)},${Math.min(g+80,255)},${Math.min(b+80,255)},${pulse+0.2})`;
    ctx.beginPath(); ctx.arc(bx+sway*1.5, by-h, 5+this.width*0.5, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    // 小さな光の粒（途中）
    for (let i = 1; i <= 2; i++) {
      const t = i*0.3;
      const px = bx+sway*t, py = by-h*t;
      const p2 = 0.3+Math.sin(time*0.003+this.phase+i*2)*0.2;
      ctx.fillStyle = `rgba(${Math.min(r+60,255)},${Math.min(g+60,255)},${Math.min(b+60,255)},${p2})`;
      ctx.beginPath(); ctx.arc(px, py, 2+this.width*0.2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // --- 熱帯河川：大きな葉っぱ ---
  drawTropical(time) {
    ctx.save();
    const {r,g,b} = this.color;
    const bx = this.x, by = this.baseY;
    const sway = Math.sin(time*0.0007+this.phase)*3;
    // 茎
    ctx.strokeStyle = `rgba(${Math.max(r-20,0)},${Math.max(g-20,0)},${Math.max(b-20,0)},0.8)`;
    ctx.lineCap = 'round'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx+sway*0.5, by-this.stemH); ctx.stroke();
    // 葉っぱ
    for (let i = 0; i < this.leafCount; i++) {
      const t = (i+1)/(this.leafCount+1);
      const ly = by - this.stemH*t;
      const dir = i%2===0?1:-1;
      const sw = Math.sin(time*0.001+this.phase+i)*2;
      const leafW = 18+this.width*1.5;
      const leafH = 8+this.width*0.5;
      ctx.save();
      ctx.translate(bx+sway*t*0.5, ly);
      ctx.rotate(dir*0.4+sw*0.05);
      // 葉本体
      ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(dir*leafW*0.3, -leafH, dir*leafW*0.7, -leafH*0.8, dir*leafW, 0);
      ctx.bezierCurveTo(dir*leafW*0.7, leafH*0.5, dir*leafW*0.3, leafH*0.3, 0, 0);
      ctx.fill();
      // 葉脈
      ctx.strokeStyle = `rgba(${Math.min(r+30,255)},${Math.min(g+30,255)},${Math.min(b+30,255)},0.4)`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dir*leafW*0.85, 0); ctx.stroke();
      ctx.restore();
    }
    // 先端の小さな葉
    ctx.fillStyle = `rgba(${r+10},${Math.min(g+20,255)},${b},0.6)`;
    ctx.beginPath();
    ctx.ellipse(bx+sway*0.5, by-this.stemH, 6, 10, sway*0.02, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // --- 神秘の泉：光るクリスタル ---
  drawCrystal(time) {
    ctx.save();
    const {r,g,b} = this.color;
    const bx = this.x, by = this.baseY;
    const pulse = 0.5+Math.sin(time*0.0015+this.phase)*0.3;
    // グロー
    ctx.shadowColor = `rgba(${r},${g},${b},${pulse*0.5})`;
    ctx.shadowBlur = 12;
    // クリスタル本体
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(this.crystalAngle);
    const w = this.crystalW, h = this.crystalH;
    ctx.fillStyle = `rgba(${r},${g},${b},${0.4+pulse*0.3})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-w, -h*0.3);
    ctx.lineTo(-w*0.5, -h);
    ctx.lineTo(w*0.5, -h);
    ctx.lineTo(w, -h*0.3);
    ctx.closePath();
    ctx.fill();
    // ハイライト
    ctx.fillStyle = `rgba(255,255,255,${0.15+pulse*0.15})`;
    ctx.beginPath();
    ctx.moveTo(-w*0.2, -h*0.2);
    ctx.lineTo(-w*0.5, -h*0.8);
    ctx.lineTo(0, -h*0.9);
    ctx.lineTo(w*0.1, -h*0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
    // 小さな光パーティクル
    const sp = Math.sin(time*0.003+this.phase);
    ctx.fillStyle = `rgba(${Math.min(r+80,255)},${Math.min(g+80,255)},${Math.min(b+80,255)},${0.2+sp*0.2})`;
    ctx.beginPath(); ctx.arc(bx+sp*3, by-h*0.7+Math.cos(time*0.002+this.phase)*3, 2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// 👥 来客クラス
// ============================================================
class Visitor {
  constructor(visitorType, isPhotographer) {
    this.type = visitorType;
    this.isPhotographer = isPhotographer || false;
    this.emoji = isPhotographer ? PHOTOGRAPHER_TYPE.emoji : visitorType.emoji;
    this.css = isPhotographer ? PHOTOGRAPHER_TYPE.css : (visitorType.css || '');
    this.tipMult = isPhotographer ? PHOTOGRAPHER_TYPE.tipMult : visitorType.tipMult;
    this.name = isPhotographer ? PHOTOGRAPHER_TYPE.name : visitorType.name;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -30 : canvas.width + 30;
    this.targetX = 30 + Math.random() * (canvas.width - 60);
    this.speed = 0.3 + Math.random() * 0.3;
    this.state = 'entering';
    this.stayTimer = VISITOR_CONFIG.stayMinFrames + Math.random() * (VISITOR_CONFIG.stayMaxFrames - VISITOR_CONFIG.stayMinFrames);
    this.reactTimer = 0;
    this.reactEmoji = '';
    this.bobPhase = Math.random() * Math.PI * 2;
    this.tipped = false;
    this.flashTimer = 0;
    this.flashInterval = 300 + Math.random() * 300;
    this._domElement = null;
  }

  update() {
    this.bobPhase += 0.04;
    switch (this.state) {
      case 'entering': {
        const dx = this.targetX - this.x;
        if (Math.abs(dx) > 2) {
          this.x += Math.sign(dx) * this.speed;
          this.direction = dx > 0 ? 1 : -1;
        } else {
          this.state = 'viewing';
        }
        break;
      }
      case 'viewing':
        this.stayTimer--;
        if (waterQuality < VISITOR_CONFIG.lowQualityThreshold) {
          this.stayTimer -= (VISITOR_CONFIG.lowQualityLeaveSpeedMult - 1);
        }
        if (this.isPhotographer) {
          this.flashTimer++;
          if (this.flashTimer >= this.flashInterval) {
            this.flashTimer = 0;
            this.reactEmoji = '📸✨';
            this.reactTimer = 60;
          }
        }
        if (this.reactTimer > 0) this.reactTimer--;
        if (this.stayTimer <= 0) {
          this.state = 'leaving';
          if (!this.tipped) {
            this.tipped = true;
            const tip = calculateVisitorTip(this);
            addCoins(tip, this.x, canvas.height - 10);
            totalTipsEarned += tip;
            this.reactEmoji = '+' + tip + '🪙';
            this.reactTimer = 90;
          }
        }
        break;
      case 'leaving': {
        const exitX = this.direction === 1 ? canvas.width + 40 : -40;
        this.x += Math.sign(exitX - this.x) * this.speed * 1.5;
        if (this.reactTimer > 0) this.reactTimer--;
        if (this.x < -50 || this.x > canvas.width + 50) {
          if (this._domElement) this._domElement.remove();
          return false;
        }
        break;
      }
    }
    return true;
  }
}
