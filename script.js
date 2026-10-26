(() => {
  // ====== RÉGLAGES (faciles à modifier) ======
  const W = 800, H = 500, GROUND = 450, R = 2;   // R = résolution interne des sprites
const PX = 3;   // taille d'un pixel pour le monde (moins pixélisé, UI reste nette)
  const FONT = '"Palatino Linotype","Book Antiqua",Palatino,Georgia,serif';
  const LV = { 1: { goal: 75, time: 70 }, 2: { goal: 60, time: 90 }, 3: { goal: 60, time: 90 }, 4: { goal: 1, time: 180 }, 5: { goal: 1, time: 999 } };   // objectifs et durées équilibrés
  const SPEED = 360, VEG_PENALTY = 2, GOLD_VALUE = 5, COMBO_TIME = 1.8;
  const HIT_PENALTY = 2;     // niveau 2 : projectile reçu
  const BOMB_PENALTY = 3;    // niveau 2 : explosion près de nous

  const cv = document.getElementById('game');
  cv.width = W; cv.height = H;
  const mainCtx = cv.getContext('2d');
  const cv4 = document.getElementById('game4');
  const overlay4 = document.getElementById('overlay4');
  cv4.width = W; cv4.height = H; overlay4.width = W; overlay4.height = H;
  const overlay4Ctx = overlay4.getContext('2d');
  mainCtx.imageSmoothingEnabled = true;
  const PXW = Math.round(W / PX), PXH = Math.round(H / PX);
  const rcv = document.createElement('canvas');
  rcv.width = PXW; rcv.height = PXH;
  const rctx = rcv.getContext('2d');
  rctx.imageSmoothingEnabled = false;
  let ctx = rctx;
  const $ = id => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ====== OUTILS DE DESSIN VECTORIEL ======
  const ell = (c, x, y, rx, ry, f, rot) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, 7); c.fillStyle = f; c.fill(); };
  const rr = (c, x, y, w, h, r, f) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = f; c.fill(); };
  const lin = (c, x0, y0, x1, y1, a, b) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const rad = (c, x, y, r0, r1, a, b) => { const g = c.createRadialGradient(x, y, r0, x, y, r1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  function art(w, h, fn) {   // dessine un sprite une seule fois dans un canvas haute résolution
    const c = document.createElement('canvas'); c.width = w * R; c.height = h * R;
    const x = c.getContext('2d'); x.scale(R, R); x.lineJoin = 'round'; fn(x); return c;
  }

  // ====== SPRITES ======
  const potatoArt = (l, d, ln, ex) => art(44, 32, c => {
    c.beginPath(); c.moveTo(5, 19); c.bezierCurveTo(1, 6, 15, 1, 27, 3); c.bezierCurveTo(41, 5, 44, 19, 35, 27); c.bezierCurveTo(27, 34, 10, 33, 5, 19);
    c.fillStyle = rad(c, 16, 10, 2, 28, l, d); c.fill(); c.lineWidth = 1.6; c.strokeStyle = ln; c.stroke();
    c.fillStyle = ln; for (const [x, y] of [[14, 13], [28, 10], [32, 21], [19, 23]]) { c.beginPath(); c.ellipse(x, y, 1.8, 1.1, .4, 0, 7); c.fill(); }
    ell(c, 14, 7, 6, 2.2, 'rgba(255,255,255,.4)', -.3);
    if (ex) ex(c);
  });
  const star = c => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(37, 2); c.lineTo(38.6, 6.4); c.lineTo(43, 8); c.lineTo(38.6, 9.6); c.lineTo(37, 14); c.lineTo(35.4, 9.6); c.lineTo(31, 8); c.lineTo(35.4, 6.4); c.fill(); };
  const sproutArt = (col, dk) => art(28, 16, c => {
    for (const [r, s] of [[0, 1], [-.8, .8], [.8, .8]]) {
      c.save(); c.translate(14, 16); c.rotate(r); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-5 * s, -8 * s, 0, -15 * s); c.quadraticCurveTo(5 * s, -8 * s, 0, 0);
      c.fillStyle = col; c.fill(); c.strokeStyle = dk; c.lineWidth = .8; c.stroke(); c.restore();
    }
  });
  const IMG = {
    potato: potatoArt('#f2cf8a', '#b98a45', '#6b4a1e'),
    gold: potatoArt('#fff1a0', '#e0a000', '#8a5a00', star),
    bomb: potatoArt('#ff8a5a', '#b02a1a', '#4a0e0e', c => ell(c, 28, 3, 3, 3, '#ffd23f')),
    carrot: art(28, 36, c => {
      for (const [x, r] of [[8, -.5], [14, 0], [20, .5]]) { c.save(); c.translate(x, 9); c.rotate(r); ell(c, 0, -3, 2.4, 6, '#3fa34d'); c.restore(); }
      c.beginPath(); c.moveTo(4, 9); c.quadraticCurveTo(14, 5, 24, 9); c.lineTo(15, 35); c.quadraticCurveTo(14, 36, 13, 35); c.closePath();
      c.fillStyle = lin(c, 4, 9, 24, 30, '#ff9a3c', '#d9570f'); c.fill();
      c.strokeStyle = 'rgba(120,40,0,.35)'; c.lineWidth = 1;
      for (const y of [15, 21, 27]) { c.beginPath(); c.moveTo(10 + (y - 15) * .3, y); c.lineTo(16, y); c.stroke(); }
    }),
    chou: art(36, 28, c => {
      ell(c, 18, 15, 17, 13, rad(c, 14, 10, 2, 20, '#b6f08a', '#2f8a3c'));
      c.strokeStyle = 'rgba(20,90,30,.55)'; c.lineWidth = 1.4;
      c.beginPath(); c.arc(18, 15, 9, .4, 2.8); c.stroke(); c.beginPath(); c.arc(18, 15, 13, 3.4, 5.6); c.stroke();
      c.beginPath(); c.moveTo(18, 3); c.lineTo(18, 26); c.stroke();
      ell(c, 12, 8, 5, 2, 'rgba(255,255,255,.35)', -.4);
    }),
    sprout: sproutArt('#4caf50', '#2e7d32'),
    sproutBomb: sproutArt('#e0452a', '#8a1c0e')
  };
  const SIZE = { potato: [44, 32], gold: [44, 32], carrot: [28, 36], chou: [36, 28] };
  const isVeg = t => t === 'carrot' || t === 'chou';
  const birdImg = art(48, 28, c => {
    c.beginPath(); c.moveTo(9, 14); c.lineTo(0, 8); c.lineTo(2, 19); c.fillStyle = '#2e2945'; c.fill();
    ell(c, 22, 16, 16, 9, lin(c, 0, 8, 0, 26, '#4a4268', '#2e2945'));
    ell(c, 36, 11, 7.5, 7, '#3f3860');
    c.beginPath(); c.moveTo(42, 9); c.lineTo(47.5, 12); c.lineTo(42, 14); c.closePath(); c.fillStyle = '#f2b01e'; c.fill();
    ell(c, 38, 9, 2.2, 2.2, '#fff'); ell(c, 38.6, 9, 1.1, 1.1, '#111'); ell(c, 21, 13, 10, 4.5, '#6a6192', -.4);
  });
  const farmerArt = f => art(64, 64, c => {
    c.lineCap = 'round';
    c.lineWidth = 8; c.strokeStyle = '#2f5aa8';
    const L = f ? [[28, 52, 37, 60], [36, 52, 26, 60]] : [[28, 52, 25, 61], [36, 52, 39, 61]];
    for (const [a, b, x, y] of L) { c.beginPath(); c.moveTo(a, b); c.lineTo(x, y); c.stroke(); ell(c, x, y + 1.5, 5, 2.6, '#3a2410'); }
    c.lineWidth = 6; c.strokeStyle = '#c0392b'; c.beginPath(); c.moveTo(21, 36); c.lineTo(12, 17); c.moveTo(43, 36); c.lineTo(52, 17); c.stroke();
    ell(c, 11, 15, 3.4, 3.4, '#f0c08a'); ell(c, 53, 15, 3.4, 3.4, '#f0c08a');
    rr(c, 20, 33, 24, 20, 5, lin(c, 0, 33, 0, 53, '#d8493a', '#a8281c'));
    rr(c, 23, 40, 18, 13, 3, '#2f5aa8'); c.fillStyle = '#2f5aa8'; c.fillRect(24, 34, 3, 8); c.fillRect(37, 34, 3, 8);
    ell(c, 32, 26, 7, 7.4, '#f0c08a'); ell(c, 29.5, 26, 1, 1.2, '#222'); ell(c, 34.5, 26, 1, 1.2, '#222');
    c.beginPath(); c.arc(32, 28.5, 3, .2, 2.9); c.strokeStyle = '#a0522d'; c.lineWidth = 1; c.stroke();
    ell(c, 32, 21, 13.5, 3.2, '#d9b04a'); ell(c, 32, 18.5, 8, 5, '#e8c65a'); rr(c, 24.5, 19.4, 15, 2.2, 1, '#a8281c');
    rr(c, 4, 0, 56, 17, 8, lin(c, 0, 0, 0, 17, '#ecd29a', '#b99556'));   // le sac de patates
    c.strokeStyle = 'rgba(90,60,20,.45)'; c.lineWidth = 1.2; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(10, 12); c.lineTo(54, 12); c.stroke(); c.setLineDash([]);
    rr(c, 22, 14, 20, 4, 2, '#8a5a2a');
  });
  const FARMER = [farmerArt(0), farmerArt(1)];
  function drawFarmer(x, feet, dir, frame, sq) {
    ell(ctx, x + 32, GROUND, 26, 5, 'rgba(0,0,0,.25)');
    ctx.save(); ctx.translate(x + 32, feet); ctx.scale(dir, sq); ctx.drawImage(FARMER[frame], -32, -64, 64, 64); ctx.restore();
  }

  // ====== DÉCORS (dessinés une seule fois, en haute résolution) ======
  function makeBg(o) {
    const b = document.createElement('canvas'); b.width = W * R; b.height = H * R;
    const c = b.getContext('2d'); c.scale(R, R);
    const sk = c.createLinearGradient(0, 0, 0, GROUND); o.sky.forEach((s, i) => sk.addColorStop(i / (o.sky.length - 1), s));
    c.fillStyle = sk; c.fillRect(0, 0, W, H);
    c.fillStyle = rad(c, 644, 94, 5, 280, 'rgba(255,244,200,.95)', 'rgba(255,244,200,0)'); c.fillRect(0, 0, W, GROUND);
    ell(c, 644, 94, 26, 26, '#fff6d6');
    o.hills.forEach(([col, base, amp, f, ph]) => {
      c.beginPath(); c.moveTo(0, GROUND);
      for (let x = 0; x <= W; x += 4) c.lineTo(x, base - Math.sin(x * f + ph) * amp - Math.sin(x * f * 2.3 + ph) * amp * .3);
      c.lineTo(W, GROUND); c.closePath(); c.fillStyle = col; c.fill();
    });
    if (o.barn) {
      rr(c, 90, GROUND - 100, 130, 100, 3, lin(c, 0, GROUND - 100, 0, GROUND, '#5a2a22', '#2e1418'));
      c.beginPath(); c.moveTo(78, GROUND - 98); c.lineTo(155, GROUND - 162); c.lineTo(232, GROUND - 98); c.closePath(); c.fillStyle = '#2a1014'; c.fill();
      rr(c, 133, GROUND - 62, 44, 62, 2, '#7a3a2a'); c.strokeStyle = '#2a1014'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(133, GROUND - 62); c.lineTo(177, GROUND); c.moveTo(177, GROUND - 62); c.lineTo(133, GROUND); c.stroke();
    }
    o.trees.forEach(([a, d], i) => {
      const x = [70, 250, 500, 745][i];
      rr(c, x - 5, GROUND - 64, 10, 64, 3, lin(c, x - 5, 0, x + 5, 0, '#6a4220', '#3a2210'));
      for (const [dx, dy, r] of [[-16, -72, 19], [16, -72, 19], [0, -88, 25]]) ell(c, x + dx, GROUND + dy, r, r, rad(c, x + dx - 6, GROUND + dy - 7, 2, r, a, d));
    });
    if (o.fence) {
      for (let x = 6; x < W; x += 42) rr(c, x, GROUND - 32, 7, 32, 2, '#5a3416');
      rr(c, 0, GROUND - 25, W, 5, 2, '#6b4423'); rr(c, 0, GROUND - 12, W, 5, 2, '#6b4423');
    }
    c.fillStyle = lin(c, 0, GROUND - 8, 0, GROUND + 2, '#9bb23a', '#5a7020'); c.fillRect(0, GROUND - 8, W, 10);
    c.fillStyle = '#7a9228'; for (let x = 0; x < W; x += 7) { c.beginPath(); c.moveTo(x, GROUND - 7); c.lineTo(x + 3, GROUND - 14 - (x * 7 % 5)); c.lineTo(x + 6, GROUND - 7); c.fill(); }
    c.fillStyle = lin(c, 0, GROUND, 0, H, '#80562f', '#3e220e'); c.fillRect(0, GROUND, W, H - GROUND);
    for (let k = 0, y = GROUND + 10; y < H; k++, y += 12 + k * 2) {
      c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, y, W, 4 + k); c.fillStyle = 'rgba(255,220,160,.13)'; c.fillRect(0, y - 2, W, 2);
    }
    c.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 70; i++) ell(c, (i * 137) % W, GROUND + 6 + (i * 53) % 48, 2.5, 1.5, 'rgba(0,0,0,.2)');
    return b;
  }
  const BG = {
    1: makeBg({ sky: ['#d9743a', '#f4b96c', '#fbe3a8'], hills: [['#b56a30', 330, 34, .011, 0], ['#8a4a20', 385, 24, .017, 2]], trees: [['#f08a3a', '#c4491a'], ['#f5c04a', '#d98a1a'], ['#d9482a', '#a02a14'], ['#f5c04a', '#d98a1a']], fence: true }),
    2: makeBg({ sky: ['#3b2a5a', '#c4546a', '#f3a36a'], hills: [['#6a3345', 320, 40, .009, 1], ['#442230', 380, 26, .015, 3]], trees: [['#d9602a', '#8f2a14'], ['#e8a040', '#a8581a']], barn: true }),
    3: makeBg({ sky: ['#2a5a8a', '#f3a36a', '#fde7b0'], hills: [['#7a8a30', 310, 30, .010, 2], ['#5a6a20', 390, 22, .016, 4]], trees: [['#f08a3a', '#c4491a'], ['#f5c04a', '#d98a1a']], barn: true, fence: true })
  };
  function cloud(x, y, s) { for (const [dx, dy, rx, ry] of [[0, 0, 34, 10], [-18, -8, 22, 10], [14, -12, 26, 13], [34, -2, 20, 8]]) ell(ctx, x + dx * s, y + dy * s, rx * s, ry * s, 'rgba(255,255,255,.55)'); }
  const clouds = [{ x: 80, y: 90, s: 8 }, { x: 330, y: 150, s: 5 }, { x: 560, y: 60, s: 11 }];

  // ====== ÉTAT ======
  let state = 'menu', last = performance.now(), g = null, paused = false;
  let B5 = null; // Niveau 5 autonome : combat 2D bullet-hell au tour par tour
  const keys = { left: false, right: false, jump: false, down: false }, mouse = { x: W / 2, y: 0 };
  // Dernière position souris en mode libre : sert de secours si Pointer Lock est refusé.
  let lastFreeMouse = null;
  const BANNER = { clair: 'Ciel dégagé', pluie: 'Pluie : sol glissant, chute plus rapide', vent: 'Vent : les objets dérivent', brouillard: 'Brouillard : visibilité réduite' };
  const POWER = { shield: 'BOUCLIER', jump: 'SUPER SAUT', dig: 'PELLE RAPIDE', speed: 'VITESSE' };
  const POWER_COL = { shield: '#4aa8ff', jump: '#5cd65c', dig: '#ffcc33', speed: '#ff7ae0' };

  function reset(level) {
    const L = LV[level];
    g = {
      level, goal: L.goal, time: L.time, dur: L.time, elapsed: 0, count: 0, combo: 0, comboT: 0, bestCombo: 0,
      f: { x: W / 2 - 32, y: GROUND - 64, w: 64, h: 64, dir: 1, moving: false, feet: GROUND, vy: 0, crouch: false, inv: 0 },
      items: [], birds: [], bullets: [], fx: [], pops: [], spawn: .5, birdT: 2.5, reload: 0, hurt: 0, banner: 3,
      msg: level === 1 ? 'Niveau 1 : attrape les patates, abats les oiseaux !' : 'Niveau 2 : accroupis-toi pour déterrer les patates !',
      weather: { type: 'clair', t: 6, wind: 70 },
      drops: Array.from({ length: 70 }, () => ({ x: rand(0, W), y: rand(0, H) })),
      leaves: Array.from({ length: 20 }, () => ({ x: rand(0, W), y: rand(0, H), s: rand(25, 55), r: rand(0, 6), c: pick(['#d9531e', '#e8a21a', '#b8381a']) })),
      plants: [], plantT: .6, shots: [], shotT: 2, warn: null, crates: [], crateT: 6, power: { shield: 0, jump: 0, dig: 0, speed: 0 }, booms: [], inventory: 0, maxInv: 8, delivered: 0, lives: level >= 3 ? 3 : 0, portals: level === 3 ? [{ x: 120, y: GROUND - 30 }, { x: 690, y: GROUND - 30 }] : [], depot: level === 3 ? { x: W/2 - 50, y: GROUND - 45, w: 100, h: 45 } : null, boss: level === 3 ? { x: W - 120, y: GROUND - 90, w: 80, h: 90, hp: 12, maxHp: 12, dir: -1, mode: 'walk', stun: 0, shotT: 2.5 } : null, gravity: level === 3 ? { t: 6, low: false } : null, roll: []
    };
  }
  function setWeather(type) { g.weather = { type, t: rand(9, 13), wind: (Math.random() < .5 ? -1 : 1) * 70 }; g.msg = BANNER[type]; g.banner = 2.5; }
  const mult = () => Math.min(4, 1 + Math.floor(g.combo / 5));
  const pop = (x, y, txt, col) => g.pops.push({ x, y, txt, col, t: .9 });
  const burst = (x, y, n, col) => { for (let i = 0; i < n; i++) g.fx.push({ x, y, vx: rand(-160, 160), vy: rand(-200, 30), life: .6, col }); };

  // ====== ENTRÉES ======
  const keyMap = { ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyZ: 'jump', ArrowDown: 'down', KeyS: 'down' };
  addEventListener('keydown', e => {
    if (e.code === 'KeyF') { document.fullscreenElement ? document.exitFullscreen() : $('wrap').requestFullscreen(); return; }
    if (keyMap[e.code]) { keys[keyMap[e.code]] = true; e.preventDefault(); }
  });
  addEventListener('keyup', e => { if (keyMap[e.code]) keys[keyMap[e.code]] = false; });
  cv.addEventListener('mousemove', e => {
    const r = cv.getBoundingClientRect();
    const nx = (e.clientX - r.left) * W / r.width;
    const ny = (e.clientY - r.top) * H / r.height;
    mouse.x = clamp(nx, 0, W); mouse.y = clamp(ny, 0, H);

    // Niveau 4 : la souris reste libre et vise directement dans l'arène.
    // Niveau 3 : Pointer Lock donne une caméra FPS classique ; si le navigateur
    // le refuse ou si le joueur appuie sur Échap, la souris libre reste utilisable.
    if (g && g.level === 3 && state === 'play' &&
        document.pointerLockElement !== cv && document.pointerLockElement !== cv4 && L3) {
      if (lastFreeMouse) {
        L3.camYaw = normAngle3((L3.camYaw == null ? L3.ang : L3.camYaw) + (nx - lastFreeMouse.x) * 0.0065);
        L3.pitch = clamp(L3.pitch - (ny - lastFreeMouse.y) * 0.0055, -1.0, 1.0);
      }
      lastFreeMouse = { x: nx, y: ny };
    } else {
      lastFreeMouse = null;
    }
  });
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch' || !g || g.level !== 5 || state !== 'play' || !B5 || B5.mode !== 'enemy') return;
    const b = B5, point = level5Point(e), box = b.box;
    if (point.x >= 656 && point.x <= 782 && point.y >= 378 && point.y <= 425) {
      b.dashPressed = true; e.preventDefault(); return;
    }
    if (point.x < box.x || point.x > box.x + box.w || point.y < box.y || point.y > box.y + box.h) return;
    b.touchPointerId = e.pointerId;
    b.touchTarget = { x: clamp(point.x, box.x + 12, box.x + box.w - 12), y: clamp(point.y, box.y + 12, box.y + box.h - 12) };
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  cv.addEventListener('pointermove', e => {
    if (e.pointerType !== 'touch' || !B5 || B5.touchPointerId !== e.pointerId || !B5.box) return;
    const point = level5Point(e), box = B5.box;
    B5.touchTarget = { x: clamp(point.x, box.x + 12, box.x + box.w - 12), y: clamp(point.y, box.y + 12, box.y + box.h - 12) };
    e.preventDefault();
  });
  const releaseLevel5Touch = e => {
    if (!B5 || B5.touchPointerId !== e.pointerId) return;
    B5.touchPointerId = null; B5.touchTarget = null;
    try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  cv.addEventListener('pointerup', releaseLevel5Touch);
  cv.addEventListener('pointercancel', releaseLevel5Touch);

  cv.addEventListener('mousedown', e => {
    if (g && g.level === 5) { handleLevel5Click(e); e.preventDefault(); return; }
    if(g && g.level===4){B4.mouseDown=true;fireArena4();e.preventDefault();}
    else shoot();
  });
  addEventListener('mouseup', e => { if(g && g.level===4 && B4 && e.button===0) B4.mouseDown=false; });
  addEventListener('blur', () => {
    if (g && state === 'play' && !paused) pauseGame();
    else clearGameInputs();
  });

  function pauseGame() {
    if (!g || state !== 'play' || paused) return;
    paused = true;
    releaseMouseCapture();
    $('pause').classList.remove('hidden');
  }
  function resumeGame() {
    if (!g || state !== 'play' || !paused) return;
    paused = false;
    $('pause').classList.add('hidden');
    clearGameInputs();
  }
  addEventListener('keydown', e => {
    if (e.code !== 'KeyP' || e.repeat || !g || state !== 'play') return;
    e.preventDefault();
    if (paused) resumeGame(); else pauseGame();
  });

  const pivot = () => ({ x: g.f.x + g.f.w / 2, y: g.f.y + 36 });
  function gunAngle() {
    const p = pivot(); let a = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    if (Math.sin(a) > 0) a = Math.cos(a) >= 0 ? 0 : Math.PI;   // vise uniquement vers le haut
    return a;
  }
  // ====== MÉCANIQUE PERSONNELLE (niveau 1) : pistolet contre les oiseaux voleurs ======
  function shoot() {
    if (state !== 'play' || g.level !== 1 || g.reload > 0) return;
    const p = pivot(), a = gunAngle();
    g.bullets.push({ x: p.x + Math.cos(a) * 32, y: p.y + Math.sin(a) * 32, vx: Math.cos(a) * 720, vy: Math.sin(a) * 720 });
    g.reload = .25;
  }

  // récolte d'un objet + COMBO
  function collect(it) {
    if (isVeg(it.type)) {
      g.count = Math.max(0, g.count - VEG_PENALTY); g.combo = 0; g.comboT = 0; g.hurt = .3;
      return pop(it.x, it.y, '-' + VEG_PENALTY, '#ff6b4a');
    }
    g.combo = g.comboT > 0 ? g.combo + 1 : 1; g.comboT = COMBO_TIME;
    g.bestCombo = Math.max(g.bestCombo, g.combo);
    const gain = (it.type === 'gold' ? GOLD_VALUE : 1) * mult();
    g.count += gain; pop(it.x, it.y, '+' + gain, it.type === 'gold' ? '#ffd23f' : '#fff');
  }
  function hurt(n, x, y) {
    g.count = Math.max(0, g.count - n); g.combo = 0; g.comboT = 0; g.hurt = .35; g.f.inv = 1;
    pop(x, y, '-' + n, '#ff6b4a');
  }

  // ====== MISE À JOUR ======
  function update(dt) {
    g.elapsed += dt; g.time -= dt;
    g.reload = Math.max(0, g.reload - dt); g.hurt = Math.max(0, g.hurt - dt); g.banner = Math.max(0, g.banner - dt);
    if (g.comboT > 0 && (g.comboT -= dt) <= 0) g.combo = 0;
    if (g.level === 4) {
      updateArena4(dt);
      if (state !== 'play') return;
      if (g.time <= 0) { g.time = 0; endGame(false); }
      return;
    }
    if (g.level === 5) {
      updateLevel5(dt);
      return;
    }
    g.level === 1 ? upd1(dt) : g.level === 2 ? upd2(dt) : upd3(dt);
    for (const l of g.leaves) {
      l.y += l.s * dt; l.r += dt; l.x += Math.sin(g.elapsed + l.s) * 30 * dt + (g.level === 1 && g.weather.type === 'vent' ? g.weather.wind * dt : 0);
      if (l.y > H) l.y = -10; if (l.x < -10) l.x = W; if (l.x > W + 10) l.x = -10;
    }
    g.fx = g.fx.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; return (p.life -= dt) > 0; });
    g.pops = g.pops.filter(p => { p.y -= 40 * dt; return (p.t -= dt) > 0; });
    if(state!=='play') return;
    if(g.level<=2 && g.count>=g.goal) return endGame(true);
    if(g.time<=0) { g.time=0; endGame(false); }
  }

  // ---------- NIVEAU 1 ----------
  function upd1(dt) {
    const w = g.weather, f = g.f;
    if ((w.t -= dt) <= 0) setWeather(pick(['clair', 'pluie', 'vent', 'brouillard'].filter(x => x !== w.type)));   // MÉTÉO CHANGEANTE
    for (const d of g.drops) {
      if (w.type === 'pluie') { d.y += 520 * dt; d.x -= 40 * dt; } else if (w.type === 'vent') d.x += w.wind * 5 * dt;
      if (d.y > H) d.y = -10; if (d.x < -30) d.x = W; if (d.x > W + 30) d.x = -30;
    }
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    f.moving = !!dir; if (dir) f.dir = dir;
    f.x = clamp(f.x + dir * SPEED * (w.type === 'pluie' ? .8 : 1) * dt, 0, W - f.w);

    if ((g.spawn -= dt) <= 0) {
      g.spawn = .5 - Math.min(g.elapsed, 60) / 60 * .14;
      const r = Math.random(), type = r < .09 ? 'gold' : r < .34 ? pick(['carrot', 'chou']) : 'potato';
      g.items.push({ type, w: SIZE[type][0], h: SIZE[type][1], x: rand(10, W - 60), y: -40, vy: rand(90, 150) + g.elapsed * .8 });
    }
    if ((g.birdT -= dt) <= 0) {
      g.birdT = Math.max(1.6, rand(2.5, 4) - g.elapsed / 60);
      if (g.birds.length < 3) {
        const left = Math.random() < .5;
        g.birds.push({ x: left ? -50 : W + 50, y: rand(60, 150), w: 48, h: 28, mode: 'attack', carry: false, vx: 0, vy: 0, face: left ? 1 : -1 });
      }
    }
    const zone = { x: f.x + 2, y: f.y, w: f.w - 4, h: 20 };
    g.items = g.items.filter(it => {
      it.y += it.vy * (w.type === 'pluie' ? 1.25 : 1) * dt;
      if (w.type === 'vent') it.x = clamp(it.x + w.wind * dt, 0, W - it.w);
      if (hit(it, zone)) { collect(it); return false; }
      return it.y < GROUND;
    });
    const body = { x: f.x, y: f.y, w: f.w, h: 24 };
    g.birds = g.birds.filter(bd => {
      if (bd.mode === 'attack') {
        const dx = f.x + f.w / 2 - bd.w / 2 - bd.x, dy = f.y - 14 - bd.y, d = Math.hypot(dx, dy) || 1, sp = 140 + g.elapsed;
        bd.vx = dx / d * sp; bd.vy = dy / d * sp; bd.face = bd.vx >= 0 ? 1 : -1;
        if (hit(bd, body)) {
          if (g.count > 0) { g.count--; bd.carry = true; pop(bd.x, bd.y, '-1', '#ff6b4a'); }
          bd.mode = 'flee'; bd.vx = (bd.x < W / 2 ? -1 : 1) * 230; bd.vy = -150; bd.face = bd.vx >= 0 ? 1 : -1;
        }
      }
      bd.x += bd.vx * dt; bd.y += bd.vy * dt;
      return bd.x > -120 && bd.x < W + 120 && bd.y > -120;
    });
    g.bullets = g.bullets.filter(bu => {
      bu.x += bu.vx * dt; bu.y += bu.vy * dt;
      const box = { x: bu.x - 3, y: bu.y - 3, w: 6, h: 6 };
      for (const bd of g.birds) if (!bd.dead && hit(box, bd)) {
        bd.dead = true;
        if (bd.carry) g.items.push({ type: 'potato', w: 44, h: 32, x: bd.x, y: bd.y, vy: 110 });   // la patate retombe
        burst(bd.x + 24, bd.y + 14, 10, '#3b3550');
        return false;
      }
      const out = bu.x < -10 || bu.x > W + 10 || bu.y < -10;
      if (out) g.reload = Math.max(g.reload, .5);   // tir raté = rechargement plus long
      return !out;
    });
    g.birds = g.birds.filter(bd => !bd.dead);
  }

  // ---------- NIVEAU 2 ----------
  function explode(p) {   // PATATE EXPLOSIVE : effet de zone
    const cx = p.x + 14, f = g.f, P = g.power;
    g.booms.push({ x: cx, t: .4 }); burst(cx, GROUND - 20, 18, '#ffb347');
    if (Math.abs(f.x + f.w / 2 - cx) < 110 && f.inv <= 0) {
      if (P.shield > 0) pop(f.x, f.feet - 80, 'BLOQUÉ', '#9fe');
      else hurt(BOMB_PENALTY, f.x, f.feet - 80);
    }
    for (const q of g.plants) if (q !== p && Math.abs(q.x - p.x) < 110) q.dead = true;   // détruit les pousses voisines
  }
  function upd2(dt) {
    const f = g.f, P = g.power, ground = f.feet >= GROUND;
    for (const k in P) P[k] = Math.max(0, P[k] - dt);
    f.inv = Math.max(0, f.inv - dt);
    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    f.crouch = keys.down && ground;
    f.moving = !!dir; if (dir) f.dir = dir;
    f.x = clamp(f.x + dir * SPEED * (f.crouch ? .25 : 1) * dt, 0, W - f.w);
    if (keys.jump && ground && !f.crouch) f.vy = P.jump > 0 ? -820 : -640;
    f.vy += 1800 * dt; f.feet += f.vy * dt;
    if (f.feet >= GROUND) { if (f.vy > 300) burst(f.x + 32, GROUND, 6, '#8a6a44'); f.feet = GROUND; f.vy = 0; }
    const top = f.feet - (f.crouch ? 40 : 64), box = { x: f.x + 12, y: top, w: f.w - 24, h: f.feet - top };

    // pousses de patates qui apparaissent au hasard
    if ((g.plantT -= dt) <= 0) {
      g.plantT = Math.max(.7, 1.4 - g.elapsed / 150);
      if (g.plants.length < 7) g.plants.push({ x: rand(30, W - 60), t: 0, bomb: Math.random() < .14, dig: 0 });
    }
    const need = P.dig > 0 ? .15 : .45;
    g.plants = g.plants.filter(p => {
      if (p.dead) return false;
      p.t += dt;
      const near = p.t >= 1 && Math.abs(p.x + 14 - (f.x + f.w / 2)) < 34;
      if (near && f.crouch) {
        p.dig += dt;
        if (p.dig >= need) {
          if (p.bomb) { collect({ type: 'gold', x: p.x, y: GROUND - 50 }); pop(p.x, GROUND - 80, 'DÉSAMORCÉE', '#ffb347'); }
          else collect({ type: 'potato', x: p.x, y: GROUND - 50 });
          return false;
        }
      } else p.dig = Math.max(0, p.dig - dt * 2);
      if (p.bomb && p.t >= 3.6) { explode(p); return false; }
      return p.bomb || p.t < 6;   // les pousses normales fanent
    });

    // projectiles tirés vers nous (haut : s'accroupir, bas : sauter)
    if (!g.warn && (g.shotT -= dt) <= 0) {
      g.shotT = Math.max(.9, rand(1.3, 2.1) - g.elapsed / 80);
      g.warn = { high: Math.random() < .5, left: g.elapsed > 12 && Math.random() < .5, t: .8 };
    }
    if (g.warn && (g.warn.t -= dt) <= 0) {
      const { high, left } = g.warn, v = 380 + g.elapsed * 2.5;
      const mk = (hi, off) => g.shots.push({ x: left ? -40 - off : W + 10 + off, y: hi ? GROUND - 62 : GROUND - 22, w: 32, h: hi ? 20 : 22, vx: left ? v : -v, r: 0 });
      mk(high, 0);
      if (g.elapsed > 35 && Math.random() < .25) mk(!high, 170);   // double tir
      g.warn = null;
    }
    g.shots = g.shots.filter(s => {
      s.x += s.vx * dt; s.r += dt * 8;
      if (f.inv <= 0 && hit(s, box)) {
        if (P.shield > 0) { burst(s.x + 16, s.y + 10, 8, '#9fe'); pop(f.x, top - 10, 'BLOQUÉ', '#9fe'); }
        else hurt(HIT_PENALTY, f.x, top - 10);
        return false;
      }
      return s.x > -260 && s.x < W + 260;
    });

    // objets à ramasser : donnent une capacité, pas des patates
    if ((g.crateT -= dt) <= 0) { g.crateT = rand(9, 12); g.crates.push({ x: rand(40, W - 70), kind: pick(['shield', 'jump', 'dig']), t: 10 }); }
    g.crates = g.crates.filter(c => {
      c.t -= dt;
      if (hit({ x: c.x, y: GROUND - 34, w: 30, h: 34 }, box)) { P[c.kind] = 7; pop(c.x, GROUND - 60, POWER[c.kind], POWER_COL[c.kind]); return false; }
      return c.t > 0;
    });
    g.booms = g.booms.filter(b => (b.t -= dt) > 0);
    if (f.moving && ground && Math.random() < .3) burst(f.x + 32, GROUND, 1, '#8a6a44');
  }

  // ---------- NIVEAU 3 : LA FERME AUX PATATES (FPS 3D sans bibliothèque) ----------
  // Monde plat et rectangulaire : clôture périphérique, champs, grange, silo et bottes de foin.
  // La grille reste en 64 x 48 cases afin de conserver le moteur FPS et ses collisions.
  // Tout est dessiné et simulé en JavaScript natif, sans moteur externe.
  const MAPW = 64, MAPH = 48;
  const FOV3 = 1.12;
  const mapBuild3 = Array.from({ length: MAPH }, () => Array.from({ length: MAPW }, () => '.'));
  const mapRect3 = (x, y, w, h, tile = '#') => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx > 1 && yy > 1 && xx < MAPW - 2 && yy < MAPH - 2) mapBuild3[yy][xx] = tile;
    }
  };
  // Des formations de rochers, haies et petits kiosques, en laissant des chemins larges.
  mapRect3(6, 5, 2, 2, '#'); mapRect3(11, 10, 3, 1, '#');
  mapRect3(28, 5, 2, 3, '#'); mapRect3(33, 13, 1, 4, '#');
  mapRect3(6, 21, 3, 1, '#'); mapRect3(16, 23, 2, 2, '#');
  mapRect3(25, 20, 3, 2, '#'); mapRect3(35, 24, 2, 2, '#');
  mapBuild3[4][18] = 'T'; mapBuild3[5][18] = 'T';
  mapBuild3[10][27] = 'T'; mapBuild3[11][27] = 'T';
  mapBuild3[20][11] = 'T'; mapBuild3[21][11] = 'T';
  mapBuild3[25][31] = 'T'; mapBuild3[26][31] = 'T';
  mapBuild3[8][22] = 'P'; mapBuild3[9][22] = 'P';
  mapBuild3[19][30] = 'P'; mapBuild3[20][30] = 'P';
  // Aire centrale dégagée pour que le joueur ne démarre pas coincé.
  for (let y = 12; y <= 18; y++) for (let x = 17; x <= 23; x++) mapBuild3[y][x] = '.';
  // Nouvelle zone au sud-est : le terrain se poursuit bien au-delà du point de départ.
  mapRect3(43, 8, 2, 2, '#'); mapRect3(50, 14, 3, 2, '#');
  mapRect3(42, 30, 2, 3, '#'); mapRect3(52, 34, 2, 2, '#');
  mapRect3(32, 38, 3, 1, '#'); mapRect3(18, 37, 2, 2, '#');
  mapRect3(8, 35, 2, 3, '#'); mapRect3(55, 23, 1, 4, '#');
  mapBuild3[7][48] = 'T'; mapBuild3[8][48] = 'T';
  mapBuild3[28][55] = 'T'; mapBuild3[29][55] = 'T';
  mapBuild3[38][43] = 'P'; mapBuild3[39][43] = 'P';
  mapBuild3[33][12] = 'P'; mapBuild3[34][12] = 'P';
  const MAP3 = mapBuild3.map(row => row.join(''));
  let L3 = null;

  let B4 = null; // niveau 4 autonome, sans moteur FPS partagé
  // Contour ovale irrégulier : le bord du monde devient une plage qui tombe dans l'océan.
  function fortressTile4(x, y) {
    if (x < 2 || y < 2 || x >= MAPW - 2 || y >= MAPH - 2) return 'W';
    // Epais remparts extérieurs.
    if (x <= 3 || x >= 60 || y <= 3 || y >= 44) return 'F';
    // Deux ailes latérales, avec des passages défendables.
    if ((x === 15 || x === 16) && y >= 8 && y <= 39 && !(y >= 22 && y <= 25)) return 'F';
    if ((x === 47 || x === 48) && y >= 8 && y <= 39 && !(y >= 29 && y <= 32)) return 'F';
    // Cour de la salle du boss, séparée par une porte de fer ouverte au centre.
    if (y === 17 && x >= 22 && x <= 41 && !(x >= 30 && x <= 33)) return 'F';
    if ((x === 21 || x === 42) && y >= 5 && y <= 16) return 'F';
    // Murets/couvertures qui forcent le joueur à se déplacer.
    if (y >= 27 && y <= 28 && ((x >= 7 && x <= 12) || (x >= 51 && x <= 56))) return 'B';
    if (x >= 25 && x <= 27 && y >= 31 && y <= 34) return 'B';
    if (x >= 37 && x <= 39 && y >= 31 && y <= 34) return 'B';
    if (x >= 29 && x <= 34 && y >= 21 && y <= 22) return 'B';
    return '.';
  }
  function tileAt3(x, y) {
    if (L3 && L3.level === 4) return fortressTile4(x, y);
    if (x < 0 || y < 0 || x >= MAPW || y >= MAPH) return 'W';
    if (L3 && L3.level === 3) {
      // Une clôture ferme les quatre côtés ; aucune côte ou falaise n'existe dans la ferme.
      if (x < 2 || y < 2 || x >= MAPW - 2 || y >= MAPH - 2) return 'W';
      if (y === 2 || y === MAPH - 3 || x === 2 || x === MAPW - 3) return 'G';
      // Empreintes des bâtiments : la collision ne dépend pas de la décoration dessinée.
      if ((x >= 6 && x <= 10 && y >= 6 && y <= 10) ||
          (x >= 51 && x <= 53 && y >= 6 && y <= 10)) return 'X';
      return '.';
    }
    const nx = (x + .5 - (MAPW - 1) / 2) / ((MAPW - 4) / 2);
    const ny = (y + .5 - (MAPH - 1) / 2) / ((MAPH - 4) / 2);
    const radius = nx * nx + ny * ny;
    if (radius > 1.04) return 'W';
    if (radius > .86 && MAP3[y][x] === '.') return 'C';
    return MAP3[y][x];
  }
  function isWall3(x, y) { const t = tileAt3(Math.floor(x), Math.floor(y)); return t === 'W' || t === 'F' || t === 'G' || t === '#' || t === 'T' || t === 'P' || t === 'B' || t === 'X'; }
  function free3(x, y) {
    const r = .22;
    return !isWall3(x-r,y-r) && !isWall3(x+r,y-r) && !isWall3(x-r,y+r) && !isWall3(x+r,y+r);
  }
  const WORLD_PROPS3 = [
    { x: 3.2, y: 3.5, type: 'palm', scale: 1.15 },
    { x: 13.5, y: 3.2, type: 'palm', scale: 1.25 },
    { x: 24.7, y: 3.6, type: 'palm', scale: 1.2 },
    { x: 36.3, y: 4.5, type: 'palm', scale: 1.34 },
    { x: 4.2, y: 11.5, type: 'umbrella', scale: .9 },
    { x: 20.5, y: 6.5, type: 'stall', scale: 1.1 },
    { x: 31.7, y: 10.4, type: 'balloon', scale: .7 },
    { x: 3.2, y: 17.5, type: 'palm', scale: 1.1 },
    { x: 11.7, y: 16.2, type: 'flag', scale: .82 },
    { x: 25.7, y: 15.0, type: 'umbrella', scale: .94 },
    { x: 37.1, y: 18.0, type: 'palm', scale: 1.25 },
    { x: 3.7, y: 27.0, type: 'stall', scale: 1.0 },
    { x: 13.2, y: 28.0, type: 'palm', scale: 1.16 },
    { x: 23.5, y: 26.4, type: 'balloon', scale: .68 },
    { x: 31.6, y: 28.0, type: 'flag', scale: .85 },
    { x: 38.0, y: 27.1, type: 'palm', scale: 1.1 },
    { x: 9.8, y: 7.8, type: 'crate', scale: .6 },
    { x: 29.5, y: 23.5, type: 'crate', scale: .65 },
    // Nouveau secteur est et sud : villages balnéaires, palmiers et points de repère.
    { x: 44.5, y: 6.5, type: 'palm', scale: 1.32 },
    { x: 53.0, y: 8.5, type: 'umbrella', scale: 1.02 },
    { x: 48.0, y: 19.0, type: 'stall', scale: 1.12 },
    { x: 58.0, y: 17.5, type: 'palm', scale: 1.28 },
    { x: 43.5, y: 24.8, type: 'balloon', scale: .72 },
    { x: 49.5, y: 29.0, type: 'palm', scale: 1.25 },
    { x: 57.0, y: 34.0, type: 'umbrella', scale: .96 },
    { x: 47.0, y: 40.0, type: 'flag', scale: .9 },
    { x: 37.5, y: 41.0, type: 'palm', scale: 1.1 },
    { x: 28.5, y: 40.2, type: 'stall', scale: .95 },
    { x: 13.0, y: 41.0, type: 'palm', scale: 1.25 },
    { x: 5.5, y: 34.0, type: 'umbrella', scale: .95 },
    { x: 7.5, y: 25.0, type: 'flag', scale: .9 },
    { x: 17.5, y: 29.0, type: 'palm', scale: 1.16 },
    { x: 23.5, y: 35.0, type: 'balloon', scale: .7 },
    { x: 35.5, y: 29.0, type: 'crate', scale: .7 },
    { x: 55.5, y: 27.5, type: 'crate', scale: .7 },
    // Petites touches de monde plateforme : fleurs et champignons en 3D.
    { x: 10.5, y: 22.5, type: 'flower', scale: .9 },
    { x: 17.3, y: 10.2, type: 'mushroom', scale: .95 },
    { x: 27.0, y: 32.2, type: 'flower', scale: 1.0 },
    { x: 42.0, y: 12.5, type: 'mushroom', scale: 1.1 },
    { x: 45.5, y: 32.5, type: 'flower', scale: .95 },
    { x: 55.0, y: 22.4, type: 'mushroom', scale: .86 },
    { x: 35.5, y: 38.2, type: 'flower', scale: 1.05 },
    { x: 23.5, y: 39.0, type: 'mushroom', scale: .9 },
    { x: 8.8, y: 31.5, type: 'flower', scale: .9 },
    { x: 50.5, y: 11.5, type: 'flower', scale: .9 }
  ];
  const WORLD_PROPS4 = [
    {x:8.5,y:8.5,type:'torch',scale:1.1},{x:55.5,y:8.5,type:'torch',scale:1.1},
    {x:8.5,y:39.5,type:'torch',scale:1.1},{x:55.5,y:39.5,type:'torch',scale:1.1},
    {x:23.5,y:20.5,type:'torch',scale:1.0},{x:40.5,y:20.5,type:'torch',scale:1.0},
    {x:27.5,y:10.5,type:'brazier',scale:1.2},{x:37.5,y:10.5,type:'brazier',scale:1.2},
    {x:25.5,y:15.5,type:'banner',scale:1.1},{x:38.5,y:15.5,type:'banner',scale:1.1},
    {x:10.5,y:15.5,type:'crate',scale:1.0},{x:53.5,y:18.5,type:'crate',scale:1.0},
    {x:10.5,y:31.5,type:'brazier',scale:.9},{x:53.5,y:31.5,type:'brazier',scale:.9},
    {x:26.5,y:37.5,type:'sandbag',scale:1.0},{x:38.5,y:37.5,type:'sandbag',scale:1.0},
    {x:23.5,y:7.5,type:'pillar',scale:1.25},{x:40.5,y:7.5,type:'pillar',scale:1.25},
    {x:23.5,y:13.5,type:'pillar',scale:1.15},{x:40.5,y:13.5,type:'pillar',scale:1.15}
  ];
  const WORLD_FARM3 = [
    {x:8.5,y:8.5,type:'barn',scale:1.0},
    {x:52.5,y:8.5,type:'silo',scale:1.0},
    {x:14.5,y:12.5,type:'hay',scale:1.05},
    {x:17.2,y:13.7,type:'hay',scale:.88},
    {x:46.5,y:35.5,type:'hay',scale:1.0},
    {x:35.5,y:24.5,type:'scarecrow',scale:1.0},
    {x:16.5,y:25.5,type:'corn',scale:1.0},
    {x:21.5,y:31.5,type:'corn',scale:1.0},
    {x:42.5,y:15.5,type:'corn',scale:1.0},
    {x:45.5,y:29.5,type:'corn',scale:1.0}
  ];

  function openCell(minDistance = 0) {
    const options = [];
    for (let y = 1; y < MAPH - 1; y++) for (let x = 1; x < MAPW - 1; x++) {
      if (tileAt3(x, y) !== '.') continue;
      const pos = { x: x + .5, y: y + .5 };
      if (L3 && Math.hypot(pos.x - L3.x, pos.y - L3.y) < minDistance) continue;
      if (L3 && L3.enemies.some(e => e.hp > 0 && Math.hypot(pos.x-e.x, pos.y-e.y) < 1.25)) continue;
      options.push(pos);
    }
    return options.length ? pick(options) : { x: 9.5, y: 9.5 };
  }
  function nearbyOpenCell3() {
    const options = [];
    for (let y = 1; y < MAPH - 1; y++) for (let x = 1; x < MAPW - 1; x++) {
      if (tileAt3(x, y) !== '.') continue;
      const pos = { x: x + .5, y: y + .5 };
      const d = Math.hypot(pos.x - L3.x, pos.y - L3.y);
      if (d < .9 || d > 2.0) continue;
      if (L3.enemies.some(e => e.hp > 0 && Math.hypot(pos.x-e.x, pos.y-e.y) < .9)) continue;
      options.push(pos);
    }
    return options.length ? pick(options) : openCell(1.2);
  }
  function makeEnemy3(x, y, emerge = .82) {
    // Chaque patate reçoit un profil propre : rôle, vitesse, résistance, taille et précision.
    const roll = Math.random();
    let role = roll < .13 ? 'bomb' : roll < .31 ? 'runner' : roll < .55 ? 'gunner' : roll < .69 ? 'tank' : roll < .84 ? 'scout' : 'grunter';
    const profiles = {
      bomb:   { speed: [.88, 1.35], hp: [1, 1], size: [.92, 1.13], armedChance: 0 },
      runner: { speed: [1.85, 2.65], hp: [1, 1], size: [.82, 1.02], armedChance: .02 },
      gunner: { speed: [.72, 1.16], hp: [2, 3], size: [.94, 1.12], armedChance: 1 },
      tank:   { speed: [.58, .96], hp: [3, 4], size: [1.15, 1.38], armedChance: .12 },
      scout:  { speed: [1.28, 1.94], hp: [1, 2], size: [.78, .98], armedChance: .09 },
      grunter:{ speed: [1.02, 1.72], hp: [1, 2], size: [.9, 1.16], armedChance: .24 }
    };
    const cfg = profiles[role];
    const hp = Math.floor(rand(cfg.hp[0], cfg.hp[1] + .99));
    const skin = pick(['#e4b56b','#c99553','#efc782','#c9854c','#e0a05b','#dbb07a','#a97647']);
    const outfit = pick(['#ed7655','#3d9f91','#5278c8','#d8a63a','#9b68bd','#d95d67']);
    const armed = Math.random() < cfg.armedChance;
    return {
      x, y, type: role === 'bomb' ? 'bomb' : 'normal', role, armed,
      hp, maxHp: hp,
      speed: rand(cfg.speed[0], cfg.speed[1]), scale: rand(cfg.size[0], cfg.size[1]),
      skin, outfit, active: false, emerge, fireT: rand(.65, 2.4),
      fireDelay: rand(role === 'gunner' ? .85 : 1.35, role === 'gunner' ? 1.45 : 2.65),
      bulletSpeed: rand(4.2, 7.2), fireRange: rand(8, 14), aimJitter: rand(-.14, .14),
      strafeDir: Math.random() < .5 ? -1 : 1, strafeT: rand(.7, 2.2), phase: rand(0, Math.PI * 2)
    };
  }

  function initL3() {
    const level = g && g.level === 4 ? 4 : 3;
    const sx = level === 4 ? 32.5 : 20.5, sy = level === 4 ? 40.5 : 15.5;
    L3 = {
      level, x: sx, y: sy, ang: -Math.PI / 2, camYaw: -Math.PI / 2, pitch: .12, jumpZ: 0, jumpVz: 0, jumpHeld: false,
      lives: level === 3 ? 4 : 3, health: 100, inv: 0,
      cooldown: 0, bullets: [], enemyShots: [], enemies: [], pickups: [], fx: [],
      spawnEnemyT: level === 4 ? 1.4 : 1.15, spawnPickupT: 3.5, spawnCount: 0, enemyFireT: 1.0,
      t: 0, kills: 0, goal: level === 4 ? 1 : 18, bossDefeated: false,
      speedT: 0, shieldT: 0, dashT: 0, dashCd: 0,
      bob: 0, recoil: 0, muzzleT: 0, hitMarkerT: 0,
      standT: 0, lastX: sx, lastY: sy,
      heat: 0, overheated: false, overheatLockT: 0, bossWarning: null
    };
    if (level === 4) {
      const boss = { x:32.5, y:9.5, type:'normal', role:'boss', boss:true, armed:true,
        hp:120, maxHp:120, speed:.58, scale:2.15, skin:'#a96b4d', outfit:'#4f2632',
        active:true, emerge:0, fireT:1.3, fireDelay:1.05, bulletSpeed:5.4, fireRange:24,
        aimJitter:0, strafeDir:1, strafeT:1.2, phase:1, attackClock:2.2, chargeT:0, phaseFlash:0 };
      L3.enemies.push(boss);
      for (const [x,y,role] of [[25.5,36.5,'grunter'],[39.5,36.5,'gunner'],[25.5,25.5,'runner']]) {
        const e = makeEnemy3(x,y,.35);
        e.role = role; e.armed = role === 'gunner' || (role === 'grunter' && Math.random()<.25);
        e.active = false; e.speed *= 1.12; e.hp = e.maxHp = role === 'gunner' ? 2 : 1;
        e.fireDelay *= .9; L3.enemies.push(e);
      }
    }
  }
  function hurtL3(amount) {
    const p = L3;
    if (p.inv > 0 || p.shieldT > 0) return;
    p.inv = .85;
    p.health -= amount;
    p.fx.push({ x: p.x, y: p.y, t: .34, hit: true });
    if (p.health <= 0) {
      p.lives--;
      if (p.lives > 0) {
        p.health = 100;
        p.x = p.level===4 ? 32.5 : 20.5; p.y = p.level===4 ? 40.5 : 15.5; p.ang = -Math.PI / 2; p.camYaw = -Math.PI / 2; p.pitch = p.level===4 ? .12 : .20; p.jumpZ = 0; p.jumpVz = 0; p.jumpHeld = false;
        p.bullets.length = 0;
        p.inv = 1.7;
      } else {
        p.health = 0;
      }
    }
  }
  function explodeL3(e) {
    const p = L3;
    if (e.exploded) return;
    e.exploded = true;
    p.fx.push({ x: e.x, y: e.y, t: .52, big: true });
    if (Math.hypot(e.x-p.x, e.y-p.y) < 1.5) hurtL3(22);
    for (const other of p.enemies) {
      if (other !== e && other.hp > 0 && Math.hypot(other.x-e.x, other.y-e.y) < 1.65) {
        other.hp = 0; p.kills++; if(other.boss) p.bossDefeated=true;
        p.fx.push({ x: other.x, y: other.y, t: .36, big: true });
        if (other.type === 'bomb') explodeL3(other);
      }
    }
  }

  function fireShot64(p) {
    const yaw = p.camYaw == null ? p.ang : p.camYaw;
    const pitch = clamp(p.pitch || 0, -1.0, 1.0);
    const cp = Math.cos(pitch);
    const dir = { x: Math.cos(yaw) * cp, y: Math.sin(yaw) * cp, z: Math.sin(pitch) };
    const origin = { x: p.x, y: p.y, z: terrainHeight64(p.x, p.y) + 1.56 + (p.jumpZ || 0) };
    if (p.level===4) {
      if (p.overheatLockT>0) return;
      if (p.heat>=99.5) { p.heat=100; p.overheated=true; p.overheatLockT=2.05; p.fx.push({x:p.x,y:p.y,z:origin.z,t:.36,hit:true,big:true}); return; }
      p.heat=Math.min(100,p.heat+9.0);
      if(p.heat>=100) { p.overheated=true; p.overheatLockT=2.05; }
    }
    p.cooldown = p.level===4 ? .17 : .19;
    p.muzzleT = .09;
    p.recoil = .12;
    p.hitMarkerT = 0;

    // Intersection rayon/sphère : les ennemis ont une hitbox proche de leur volume 3D.
    let target = null, targetDist = 30;
    for (const e of p.enemies) {
      if (e.hp <= 0 || !e.active) continue;
      const ex = e.x - origin.x, ey = e.y - origin.y;
      const ez = terrainHeight64(e.x, e.y) + .70 - origin.z;
      const along = ex * dir.x + ey * dir.y + ez * dir.z;
      if (along <= 0 || along >= targetDist) continue;
      const perp2 = ex * ex + ey * ey + ez * ez - along * along;
      const radius = .52 * (e.scale || 1);
      if (perp2 > radius * radius) continue;
      const hitDist = along - Math.sqrt(Math.max(0, radius * radius - perp2));
      if (hitDist > 0 && hitDist < targetDist) { target = e; targetDist = hitDist; }
    }

    // Bloque le tir contre le relief, la mer et les obstacles avant la cible.
    let impact = null;
    const maxDistance = target ? targetDist : 18;
    for (let d = .16; d <= maxDistance; d += .18) {
      const x = origin.x + dir.x * d;
      const y = origin.y + dir.y * d;
      const z = origin.z + dir.z * d;
      if (isWall3(x, y) || z < terrainHeight64(x, y) + .035) {
        impact = { x, y, z };
        target = null;
        break;
      }
    }

    if (target) {
      target.hp -= target.boss && p.level===4 ? 3 : 1;
      p.hitMarkerT = .19;
      p.fx.push({ x: target.x, y: target.y, z: terrainHeight64(target.x, target.y) + .78, t: .24, hit: false });
      if (target.hp <= 0) {
        p.kills++;
        p.fx.push({ x: target.x, y: target.y, z: terrainHeight64(target.x, target.y) + .72, t: .48, big: true });
        if (target.type === 'bomb') explodeL3(target);
        if (target.boss && target.hp<=0) { p.bossDefeated=true; p.bossWarning=null; }
      }
    } else if (impact) {
      p.fx.push({ x: impact.x, y: impact.y, z: impact.z, t: .12, hit: false });
    }
  }

  function makeEnemy4(x,y,emerge=.4) {
    const r=Math.random();
    const role=r<.22?'runner':r<.52?'gunner':r<.72?'tank':r<.86?'bomb':'scout';
    const e=makeEnemy3(x,y,emerge);
    e.role=role; e.type=role==='bomb'?'bomb':'normal'; e.armed=role==='gunner' || (role==='scout' && Math.random()<.35) || (role==='tank' && Math.random()<.15);
    e.hp=e.maxHp=role==='tank'?3:role==='gunner'?2:1;
    e.speed *= role==='runner'?1.35:role==='tank'?.82:1.18;
    e.scale *= role==='tank'?1.16:role==='runner'?.88:1;
    e.fireDelay *= .78; e.bulletSpeed *= 1.14; e.fireRange=16; e.active=false;
    return e;
  }
  function bossVolley4(p,boss,targetX,targetY,phase) {
    const dx=targetX-boss.x, dy=targetY-boss.y, base=Math.atan2(dy,dx);
    const count=phase===1?3:phase===2?5:7, spread=phase===1?.18:phase===2?.29:.42;
    const speed=phase===1?4.7:phase===2?5.5:6.2;
    for(let i=0;i<count;i++) {
      const offset=(i-(count-1)/2)*spread/(Math.max(1,(count-1)/2));
      const angle=base+offset, z0=terrainHeight64(boss.x,boss.y)+1.25*(boss.scale||2);
      p.enemyShots.push({x:boss.x,y:boss.y,z:z0,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
        vz:((terrainHeight64(targetX,targetY)+.95)-z0)/Math.max(1.1,Math.hypot(dx,dy)/speed)*.75,
        life:Math.min(3.4,Math.hypot(dx,dy)/speed+1.0),trail:0,color:phase===3?'#ff3e39':phase===2?'#ff7b3b':'#ffb04a',damage:phase===3?11:phase===2?9:7,bossShot:true});
    }
    p.fx.push({x:boss.x,y:boss.y,z:z0ForBoss4(boss),t:.24,muzzle:true,big:phase===3});
  }
  function z0ForBoss4(boss) { return terrainHeight64(boss.x,boss.y)+1.25*(boss.scale||2); }
  function updateBoss4(p,boss,dt) {
    if(!boss || boss.hp<=0) return;
    const hp= boss.hp / boss.maxHp;
    const phase=hp>.66?1:hp>.31?2:3;
    if(phase!==boss.phase) { boss.phase=phase; boss.phaseFlash=.9; boss.attackClock=.65; p.fx.push({x:boss.x,y:boss.y,z:terrainHeight64(boss.x,boss.y)+2.2,t:.6,big:true,crack:true}); }
    boss.phaseFlash=Math.max(0,(boss.phaseFlash||0)-dt);
    boss.speed=phase===1?.52:phase===2?.78:1.05;
    boss.chargeT=Math.max(0,(boss.chargeT||0)-dt);
    const dx=p.x-boss.x,dy=p.y-boss.y,d=Math.hypot(dx,dy)||1;
    if(phase===3 && boss.chargeT<=0 && d<12 && d>4 && Math.random()<dt*.22) boss.chargeT=.65;
    const moveSpeed=boss.speed*(boss.chargeT>0?2.8:1);
    const nx=boss.x+dx/d*moveSpeed*dt,ny=boss.y+dy/d*moveSpeed*dt;
    if(d>2.05) { if(free3(nx,boss.y)) boss.x=nx; if(free3(boss.x,ny)) boss.y=ny; }
    boss.attackClock-=dt;
    if(!p.bossWarning && boss.attackClock<=0) {
      p.bossWarning={x:p.x,y:p.y,r:phase===3?2.65:phase===2?2.05:1.65,t:.72,phase};
      boss.attackClock=phase===1?2.35:phase===2?1.8:1.35;
    }
    if(p.bossWarning) {
      p.bossWarning.t-=dt;
      if(p.bossWarning.t<=0) {
        const w=p.bossWarning;
        if(Math.hypot(p.x-w.x,p.y-w.y)<w.r && p.jumpZ<.8) hurtL3(w.phase===3?26:w.phase===2?19:15);
        bossVolley4(p,boss,w.x,w.y,w.phase);
        p.bossWarning=null;
      }
    }
  }

  function upd3(dt) {
    if (!L3) initL3();
    const p = L3, input = window.L3keys || {};
    p.t += dt;
    p.cooldown = Math.max(0, p.cooldown - dt);
    p.inv = Math.max(0, p.inv - dt);
    p.speedT = Math.max(0, p.speedT - dt);
    p.shieldT = Math.max(0, p.shieldT - dt);
    p.dashT = Math.max(0, p.dashT - dt);
    p.dashCd = Math.max(0, p.dashCd - dt);
    p.recoil = Math.max(0, p.recoil - dt);
    p.muzzleT = Math.max(0, p.muzzleT - dt);
    p.hitMarkerT = Math.max(0, p.hitMarkerT - dt);
    if(p.level===4) { p.overheatLockT=Math.max(0,p.overheatLockT-dt); p.heat=Math.max(0,p.heat-dt*(input.shoot && p.overheatLockT<=0 ? 5.8 : 23)); if(p.overheatLockT<=0 && p.heat<72) p.overheated=false; }

    // Caméra orbitale indépendante : regarder autour ne tourne pas le personnage sur place.
    // Les déplacements sont relatifs à la caméra, comme dans un jeu de plateforme 3D.
    const viewYaw = p.camYaw == null ? p.ang : p.camYaw;
    let mvx = 0, mvy = 0;
    if (input.w) { mvx += Math.cos(viewYaw); mvy += Math.sin(viewYaw); }
    if (input.s) { mvx -= Math.cos(viewYaw); mvy -= Math.sin(viewYaw); }
    if (input.a) { mvx += Math.cos(viewYaw - Math.PI/2); mvy += Math.sin(viewYaw - Math.PI/2); }
    if (input.d) { mvx += Math.cos(viewYaw + Math.PI/2); mvy += Math.sin(viewYaw + Math.PI/2); }
    const moveLen = Math.hypot(mvx, mvy);
    if (moveLen > 0) { mvx /= moveLen; mvy /= moveLen; }
    if (input.dash && p.dashCd <= 0 && p.dashT <= 0) { p.dashT = .22; p.dashCd = 2.25; }
    const speed = (p.speedT > 0 ? 5.0 : 3.65) * (p.dashT > 0 ? 2.6 : 1);
    const oldX = p.x, oldY = p.y;
    const nx = p.x + mvx * speed * dt, ny = p.y + mvy * speed * dt;
    if (free3(nx, p.y)) p.x = nx;
    if (free3(p.x, ny)) p.y = ny;
    const moved = Math.hypot(p.x-oldX, p.y-oldY);
    p.bob += dt * (moved > .001 ? 11 : 2.4);
    if (moved > .001) {
      const faceAngle = Math.atan2(p.y-oldY, p.x-oldX);
      p.ang = normAngle3(p.ang + normAngle3(faceAngle-p.ang) * Math.min(1, dt*10));
    }

    // Saut façon jeu de plateforme 3D : Espace déclenche un bond, avec gravité.
    if (input.jump && !p.jumpHeld && p.jumpZ <= 0.001) p.jumpVz = 7.4;
    p.jumpHeld = !!input.jump;
    if (p.jumpZ > 0 || p.jumpVz > 0) {
      p.jumpZ += p.jumpVz * dt;
      p.jumpVz -= 17.5 * dt;
      if (p.jumpZ <= 0) { p.jumpZ = 0; p.jumpVz = 0; }
    }

    // MÉCANIQUE PERSONNELLE : si l'on campe, le sol fissure et fait surgir un ennemi.
    if (p.level===3 && moved < .006) p.standT += dt;
    else p.standT = 0;
    if (p.level===3 && p.standT >= 1.65) {
      p.standT = 0;
      const pos = nearbyOpenCell3();
      p.enemies.push(makeEnemy3(pos.x, pos.y, .82));
      p.fx.push({ x: p.x, y: p.y, t: .48, big: true, crack: true });
    }

    // Tir FPS : chaque balle part exactement au centre du viseur (hitscan).
    if (input.shoot && p.cooldown <= 0) fireShot64(p);

    // Apparition progressive des poursuivants.
    p.spawnEnemyT -= dt;
    if (p.spawnEnemyT <= 0) {
      p.spawnEnemyT = p.level===4 ? Math.max(1.15, 3.8-p.t*.018) : Math.max(1.0, 2.65-p.t*.009);
      p.spawnCount++;
      const activeCount=p.enemies.filter(e=>e.hp>0 && !e.boss).length;
      const cap=p.level===4 ? (p.t<35?5:8) : 9;
      if(activeCount<cap) { const pos=openCell(p.level===4?5.2:2.6); p.enemies.push(p.level===4?makeEnemy4(pos.x,pos.y,.52):makeEnemy3(pos.x,pos.y,.88)); }
    }
    if(p.level===4) updateBoss4(p,p.enemies.find(e=>e.boss),dt);
    for (const e of p.enemies) {
      if (e.hp <= 0 || (p.level===4 && e.boss)) continue;
      if (e.emerge > 0) { e.emerge = Math.max(0, e.emerge-dt); if (e.emerge === 0) e.active = true; continue; }
      const dx = p.x-e.x, dy = p.y-e.y, d = Math.hypot(dx,dy) || 1;
      e.strafeT -= dt;
      if (e.strafeT <= 0) { e.strafeT = rand(.65, 2.1); if (Math.random() < .72) e.strafeDir *= -1; }
      if (d > .43) {
        let toward = 1, lateral = 0;
        if (e.armed) {
          // Les tireuses tentent de garder leur distance et de se décaler, les autres foncent.
          if (d < 3.6) toward = -.72;
          else if (d < 6.2) toward = e.role === 'gunner' ? .05 : .38;
          lateral = e.role === 'gunner' ? .5 : .27;
        }
        const speed = (e.speed || 1.2) + Math.min(.36, p.t*.0025);
        const vx = (dx/d)*toward + (-dy/d)*lateral*e.strafeDir;
        const vy = (dy/d)*toward + ( dx/d)*lateral*e.strafeDir;
        const vl = Math.hypot(vx,vy) || 1;
        const ex = e.x + vx/vl*speed*dt, ey = e.y + vy/vl*speed*dt;
        if (free3(ex,e.y)) e.x = ex;
        if (free3(e.x,ey)) e.y = ey;
      }
      if (d < .52) {
        hurtL3(e.type === 'bomb' ? 10 : e.role === 'tank' ? 18 : 12);
        e.hp = 0;
        if (e.type === 'bomb') explodeL3(e);
      }
    }
    // Seules les patates équipées d'un pistolet tirent. Cadence, vitesse et précision varient.
    for (const e of p.enemies) {
      if (e.hp <= 0 || !e.active || !e.armed || (p.level===4 && e.boss)) continue;
      e.fireT = (e.fireT == null ? rand(.8, 1.8) : e.fireT) - dt;
      const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy);
      if (e.fireT <= 0 && d > 2.7 && d < (e.fireRange || 12)) {
        e.fireT = (e.fireDelay || 1.6) * rand(.78, 1.24);
        const jitter = e.aimJitter || 0;
        const ca = Math.cos(jitter), sa = Math.sin(jitter);
        const ax = dx*ca - dy*sa, ay = dx*sa + dy*ca;
        const len = Math.hypot(ax, ay) || 1, shotSpeed=e.bulletSpeed || 5.2;
        p.enemyShots.push({ x:e.x, y:e.y, z:terrainHeight64(e.x,e.y)+.76*(e.scale||1), vx:ax/len*shotSpeed, vy:ay/len*shotSpeed, vz:((terrainHeight64(p.x,p.y)+.9+(p.jumpZ||0))-(terrainHeight64(e.x,e.y)+.76*(e.scale||1)))/Math.max(.5,d)*shotSpeed, life:Math.min(3.0,d/shotSpeed), trail:0, color:e.role==='tank'?'#ffba4b':'#ff684d' });
        p.fx.push({x:e.x+ax/len*.48,y:e.y+ay/len*.48,z:terrainHeight64(e.x,e.y)+.8,t:.095,hit:false,muzzle:true});
      }
    }
    p.enemyShots = p.enemyShots.filter(b => {
      b.x += b.vx*dt; b.y += b.vy*dt; b.z += b.vz*dt; b.life -= dt;
      if (b.life <= 0 || isWall3(b.x,b.y) || b.z < terrainHeight64(b.x,b.y)+.08) return false;
      if (Math.hypot(b.x-p.x,b.y-p.y)<(b.bossShot?.46:.34) && Math.abs(b.z-(terrainHeight64(p.x,p.y)+.9+(p.jumpZ||0)))<(b.bossShot?.82:.65)) { hurtL3(b.damage||9); p.fx.push({x:b.x,y:b.y,z:b.z,t:.16,hit:true}); return false; }
      return true;
    });
    p.enemies = p.enemies.filter(e => e.hp > 0);

    // Bonus ramassables : vitesse, bouclier ou vie supplémentaire.
    p.spawnPickupT -= dt;
    if (p.spawnPickupT <= 0) {
      p.spawnPickupT = rand(5.5, 7.5);
      const pos = openCell(1.8);
      p.pickups.push({ x: pos.x, y: pos.y, type: pick(['speed','shield','life']), t: 12 });
    }
    p.pickups = p.pickups.filter(pk => {
      pk.t -= dt;
      if (Math.hypot(pk.x-p.x, pk.y-p.y) < .58) {
        if (pk.type === 'speed') { p.speedT = 5.5; pop(400,100,'BOOST VITESSE','#ff7ae0'); }
        else if (pk.type === 'shield') { p.shieldT = 5.5; pop(400,100,'BOUCLIER','#76d7ff'); }
        else if (p.lives < 5) { p.lives++; pop(400,100,'+1 VIE','#ff8c9b'); }
        else { p.health = Math.min(100, p.health+24); pop(400,100,'SOIN +24','#a8f08e'); }
        return false;
      }
      return pk.t > 0;
    });
    for (const fx of p.fx) fx.t -= dt;
    p.fx = p.fx.filter(fx => fx.t > 0);
    if (p.level===4 ? p.bossDefeated : p.kills >= p.goal) { endGame(true); return; }
    if (p.lives <= 0) { endGame(false); return; }
  }

  // ====== DESSIN ======
  function plank(x, y, w, h) {
    rr(ctx, x, y, w, h, 8, '#2a1608'); rr(ctx, x + 2, y + 2, w - 4, h - 4, 6, lin(ctx, 0, y, 0, y + h, '#8f5d2d', '#5a3416'));
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x + 8, y + 3, w - 16, 2);
  }
  function label(txt, x, y, align, col, size) {
    ctx.font = `800 ${size || 18}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 4; ctx.strokeStyle = '#2a1406'; ctx.strokeText(txt, x, y); ctx.fillStyle = col || '#f7e3b0'; ctx.fillText(txt, x, y);
  }
  // ====== NOUVEAU NIVEAU 4 : L'ARÈNE DU ROI PATATE ======
  // Mode autonome en arène isométrique : aucun contrôle FPS, pas de réutilisation du monde du niveau 3.
  // Flèches ou ZQSD/WASD pour bouger, souris pour viser, clic maintenu pour tirer, Espace/Maj pour esquiver.
  window.L4keys = { up:false, down:false, left:false, right:false, dodge:false };
  const A4_SIZE = 60;
  const A4_PILLARS = [
    {x:14,y:15,style:0},{x:46,y:15,style:1},
    {x:13,y:36,style:1},{x:47,y:36,style:0},
    {x:23,y:27,style:2},{x:37,y:27,style:2}
  ];
  const A4_MINION_STYLES = {
    grunt: { speed:4.1,hp:42,damage:9,color:'#b98955',outfit:'#6c9278',armed:false },
    gunner:{ speed:2.7,hp:34,damage:7,color:'#d6a05c',outfit:'#bd5543',armed:true },
    brute: { speed:2.25,hp:88,damage:15,color:'#9e704d',outfit:'#5b596c',armed:false }
  };
  const isoArena4 = (x,y,z=0) => ({ x:W/2+(x-y)*5.8, y:260+(x+y-60)*2.75-z });
  const worldArena4 = (sx,sy) => {
    const a=(sx-W/2)/5.8, b=(sy-260)/2.75+60;
    return {x:(a+b)/2,y:(b-a)/2};
  };
  function pickAimArena4(){
    // Les ennemis ont du volume en hauteur : ramener le curseur sur leur base isométrique
    // évite que viser le visage du boss soit interprété comme viser derrière lui.
    const b=B4.boss,bq=isoArena4(b.x,b.y);
    if(b.hp>0 && Math.abs(mouse.x-bq.x)<52 && mouse.y>bq.y-108 && mouse.y<bq.y+9) return {x:b.x,y:b.y};
    for(const e of B4.minions){if(e.hp<=0)continue;const q=isoArena4(e.x,e.y),s=e.role==='brute'?1.25:1;
      if(Math.abs(mouse.x-q.x)<19*s&&mouse.y>q.y-34*s&&mouse.y<q.y+7*s)return {x:e.x,y:e.y};}
    return worldArena4(mouse.x,mouse.y);
  }
  const distArena4 = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const randomArena4 = a => a[Math.floor(Math.random()*a.length)];
  function initArena4(){
    B4={ t:0, score:0, kills:0, phase:1, banner:'LE ROI PATATE T’ATTEND', bannerT:3,
      player:{x:30,y:51,hp:120,maxHp:120,lives:5,r:1.45,inv:1.7,face:0,speed:10.5,dashT:0,dashCD:0,dodgeWasDown:false,lastX:0,lastY:-1},
      boss:{x:30,y:9.5,hp:390,maxHp:390,r:3.2,attackT:2.1,phase:1,anim:0,flash:0,chargeT:0,pattern:0},
      shots:[], enemyShots:[], minions:[], warnings:[], waves:[], particles:[],
      heat:0, overheated:false, overheatT:0, fireCD:0, mouseDown:false, hitT:0, damageFlash:0,
      shake:0, spawnT:8, defeated:false, lastAim:{x:30,y:15}, helpT:8 };
    window.L4keys={up:false,down:false,left:false,right:false,dodge:false};
  }
  function polyArena4(c,pts,fill,stroke=null,width=1){
    if(!pts.length)return; c.beginPath(); c.moveTo(pts[0].x,pts[0].y);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y); c.closePath();
    if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function ellipseArena4(c,x,y,rx,ry,fill,stroke=null,line=1){
    c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,Math.PI*2);
    if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}
  }
  function lineArena4(c,pts,color,width=1){
    c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke();
  }
  function drawArenaBackdrop4(c,t){
    const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#101d32');sky.addColorStop(.48,'#4c333b');sky.addColorStop(1,'#9e5534');c.fillStyle=sky;c.fillRect(0,0,W,H);
    // Lune, nuages de poussière et silhouette de la forteresse au loin.
    const moon=c.createRadialGradient(590,70,3,590,70,95);moon.addColorStop(0,'rgba(255,216,151,.48)');moon.addColorStop(1,'rgba(255,170,110,0)');c.fillStyle=moon;c.fillRect(480,0,230,180);
    ellipseArena4(c,590,70,24,24,'#f8d5a1');ellipseArena4(c,600,63,23,25,'#5e3a3a');
    c.fillStyle='#292331';
    for(let i=0;i<10;i++){
      const x=i*88-22,h=65+(i%4)*18,w=44+(i%3)*14;
      c.fillRect(x,210-h,w,h);c.beginPath();c.moveTo(x-7,210-h);c.lineTo(x+w/2,190-h);c.lineTo(x+w+7,210-h);c.fill();
      c.fillRect(x+w*.28,210-h+17,5,22);c.fillRect(x+w*.65,210-h+17,5,22);
    }
    // Brazier glow cast on the lower atmosphere.
    for(const [x,y,col] of [[112,210,'#f67c3e'],[688,210,'#f67c3e'],[400,178,'#ffb45c']]){
      const gl=c.createRadialGradient(x,y,2,x,y,92);gl.addColorStop(0,col+'77');gl.addColorStop(1,col+'00');c.fillStyle=gl;c.fillRect(x-100,y-100,200,200);
    }
    c.fillStyle='rgba(12,13,23,.4)';c.fillRect(0,215,W,H-215);
    // Éclats de braise en suspension.
    for(let i=0;i<25;i++){
      const x=(i*173+Math.sin(t*.7+i)*18)%W,y=(260+i*61-t*(5+i%4)*7)%H;
      ellipseArena4(c,x,y,1.4+(i%3)*.5,1.4+(i%3)*.5,`rgba(255,${130+(i%5)*18},75,${.25+.2*Math.sin(t*2+i)})`);
    }
  }
  function drawArenaFloor4(c,t){
    const corners=[[0,0],[60,0],[60,60],[0,60]].map(([x,y])=>isoArena4(x,y));
    // Épaisseur visible du socle de l'arène.
    const lower=corners.map(p=>({x:p.x,y:p.y+25}));polyArena4(c,[...corners.slice(1,3),...lower.slice(1,3)].reverse(),'#251e27');
    polyArena4(c,corners,'#56494b','#ddb078',4);
    const tile=5;
    for(let y=0;y<60;y+=tile)for(let x=0;x<60;x+=tile){
      const pts=[[x,y],[x+tile,y],[x+tile,y+tile],[x,y+tile]].map(([xx,yy])=>isoArena4(xx,yy));
      const h=((x/tile*7+y/tile*11)%9);const palette=['#625252','#5b4b4d','#695756','#51464b','#6b5954','#5a4c50'];
      polyArena4(c,pts,palette[h%palette.length],'rgba(30,23,29,.36)',.8);
      lineArena4(c,[pts[0],pts[1]],'rgba(255,226,186,.15)',1);
      lineArena4(c,[pts[2],pts[3]],'rgba(18,15,20,.23)',1);
      if((x*3+y*7)%31===0){lineArena4(c,[pts[0],{x:pts[0].x+7,y:pts[0].y+4},{x:pts[0].x+4,y:pts[0].y+10}],'rgba(27,21,25,.44)',1.2);}
    }
    // Bordures métalliques et rune de l'arène.
    // Lueur de braises au centre, masquée par les limites du dallage.
    c.save();c.beginPath();c.moveTo(corners[0].x,corners[0].y);for(let i=1;i<corners.length;i++)c.lineTo(corners[i].x,corners[i].y);c.closePath();c.clip();
    const floorGlow=c.createRadialGradient(W/2,270,18,W/2,270,390);floorGlow.addColorStop(0,'rgba(236,99,61,.15)');floorGlow.addColorStop(.48,'rgba(160,64,58,.08)');floorGlow.addColorStop(1,'rgba(8,10,17,.16)');c.fillStyle=floorGlow;c.fillRect(0,80,W,390);c.restore();
    const borderPts=[];for(let i=0;i<=60;i+=2)borderPts.push(isoArena4(i,0,0));
    lineArena4(c,borderPts,'#d7a66a',3);lineArena4(c,Array.from({length:31},(_,i)=>isoArena4(60,i*2)),'#a47d5e',3);
    lineArena4(c,Array.from({length:31},(_,i)=>isoArena4(60-i*2,60)),'#d6a66d',3);lineArena4(c,Array.from({length:31},(_,i)=>isoArena4(0,60-i*2)),'#a47d5e',3);
    // Rune centrale, peinte au sol.
    const rune=[];for(let i=0;i<=80;i++){const a=i*Math.PI*2/80; rune.push(isoArena4(30+7*Math.cos(a),30+7*Math.sin(a),1));}
    lineArena4(c,rune,`rgba(243,153,71,${.18+.12*Math.sin(t*2)})`,2);
    const star=[];for(let i=0;i<12;i++){const a=-Math.PI/2+i*Math.PI/6,r=i%2?3.5:6;star.push(isoArena4(30+r*Math.cos(a),30+r*Math.sin(a),1.5));}star.push(star[0]);lineArena4(c,star,'rgba(247,184,95,.22)',1.5);
  }
  function drawPillarArena4(c,o,t){
    const p=isoArena4(o.x,o.y),r=17,h=o.style===2?32:48;
    ellipseArena4(c,p.x,p.y+7,22,9,'rgba(0,0,0,.34)');
    polyArena4(c,[{x:p.x-r,y:p.y-h+8},{x:p.x+r,y:p.y-h+8},{x:p.x+r,y:p.y+3},{x:p.x-r,y:p.y+3}], '#584e51','#302b32',1);
    c.fillStyle='#71615b';c.fillRect(p.x-r+2,p.y-h+13,5,h-15);c.fillStyle='#42383e';c.fillRect(p.x+r-6,p.y-h+10,5,h-7);
    for(let yy=p.y-h+18;yy<p.y;yy+=13){lineArena4(c,[{x:p.x-r+1,y:yy},{x:p.x+r-1,y:yy}],'rgba(28,23,28,.5)',2);}
    ellipseArena4(c,p.x,p.y-h+7,r+4,8,'#302b31','#a9917b',2);ellipseArena4(c,p.x,p.y-h+6,r-1,5,'#837064','#4e4143',1);
    ellipseArena4(c,p.x-4,p.y-h+4,5,2,'rgba(255,228,180,.25)');
    if(o.style!==2){
      const flameY=p.y-h-7+Math.sin(t*8+o.x)*2;
      const glow=c.createRadialGradient(p.x,flameY,2,p.x,flameY,34);glow.addColorStop(0,'rgba(255,167,64,.65)');glow.addColorStop(1,'rgba(255,94,33,0)');c.fillStyle=glow;c.fillRect(p.x-36,flameY-36,72,72);
      polyArena4(c,[{x:p.x,y:flameY+7},{x:p.x-7,y:flameY-3},{x:p.x-3,y:flameY-12},{x:p.x+3,y:flameY-4},{x:p.x+7,y:flameY-14},{x:p.x+8,y:flameY+5}], '#f47737');
      polyArena4(c,[{x:p.x,y:flameY+4},{x:p.x-3,y:flameY-3},{x:p.x+2,y:flameY-8},{x:p.x+4,y:flameY+3}], '#ffe6a0');
    }
  }
  function drawHeroArena4(c,p,t){
    const q=isoArena4(p.x,p.y),bob=Math.sin(t*10)*1.5*(p.dashT>0?2:1),scale=1;
    if(p.dashT>0){const trail=isoArena4(p.x-p.lastX*2.4,p.y-p.lastY*2.4);c.save();c.globalAlpha=Math.min(.65,p.dashT*3);lineArena4(c,[{x:trail.x,y:trail.y-10},{x:q.x,y:q.y-12}],'#83e9e7',8);c.restore();}
    ellipseArena4(c,q.x,q.y+4,15,7,'rgba(0,0,0,.42)');
    // Bottes et petites jambes.
    const stride=Math.sin(t*13)*(Math.abs(p.lastX)+Math.abs(p.lastY)>.1?3:0);
    lineArena4(c,[{x:q.x-5,y:q.y-3},{x:q.x-7+stride,y:q.y+4}],'#302a32',6);
    lineArena4(c,[{x:q.x+5,y:q.y-3},{x:q.x+7-stride,y:q.y+4}],'#302a32',6);
    ellipseArena4(c,q.x-7+stride,q.y+5,5,3,'#26232b');ellipseArena4(c,q.x+7-stride,q.y+5,5,3,'#26232b');
    // Sac/armure et veste à plusieurs couches.
    ellipseArena4(c,q.x-9,q.y-17+bob,6,10,'#8d5934','#432e2d',1.5);
    polyArena4(c,[{x:q.x-10,y:q.y-26+bob},{x:q.x+9,y:q.y-26+bob},{x:q.x+11,y:q.y-8+bob},{x:q.x+5,y:q.y-4+bob},{x:q.x-8,y:q.y-4+bob},{x:q.x-12,y:q.y-10+bob}], '#2d8581','#143f4b',2);
    lineArena4(c,[{x:q.x-8,y:q.y-21+bob},{x:q.x-14,y:q.y-13+bob}],'#d4a26b',5);lineArena4(c,[{x:q.x+8,y:q.y-21+bob},{x:q.x+14,y:q.y-15+bob}],'#d4a26b',5);
    // Tête de pomme de terre.
    const skin=c.createRadialGradient(q.x-4,q.y-34+bob,2,q.x,q.y-29+bob,17);skin.addColorStop(0,'#f7d58f');skin.addColorStop(.65,'#c88e50');skin.addColorStop(1,'#855237');
    ellipseArena4(c,q.x,q.y-29+bob,11,13,skin,'#633e30',1.5);
    for(const [dx,dy] of [[-6,-32],[6,-35],[-2,-25],[5,-26]])ellipseArena4(c,q.x+dx,q.y+dy+bob,1.1,.7,'#80512f');
    ellipseArena4(c,q.x-3,q.y-33+bob,1.7,2.1,'#fff6da');ellipseArena4(c,q.x+4,q.y-33+bob,1.7,2.1,'#fff6da');
    ellipseArena4(c,q.x-2.5,q.y-32+bob, .7,1.1,'#242530');ellipseArena4(c,q.x+4.5,q.y-32+bob,.7,1.1,'#242530');
    lineArena4(c,[{x:q.x-2,y:q.y-26+bob},{x:q.x+2,y:q.y-25+bob},{x:q.x+4,y:q.y-27+bob}],'#693b30',1.4);
    // Chapeau avec couture.
    ellipseArena4(c,q.x,q.y-40+bob,12,4,'#e0b35d','#714726',1);ellipseArena4(c,q.x,q.y-43+bob,7,5,'#4d7774','#243b48',1.3);
    lineArena4(c,[{x:q.x-5,y:q.y-42+bob},{x:q.x+4,y:q.y-42+bob}],'rgba(255,244,185,.8)',1);
    // Bras et blaster orienté vers la souris.
    const screenAim=isoArena4(p.aimx,p.aimy),angle=Math.atan2(screenAim.y-(q.y-17),screenAim.x-q.x);
    const ax=q.x+Math.cos(angle)*8,ay=q.y-17+bob+Math.sin(angle)*5;
    lineArena4(c,[{x:q.x+7,y:q.y-22+bob},{x:ax,y:ay}],'#d0a064',5);
    c.save();c.translate(ax,ay);c.rotate(angle);
    const metal=c.createLinearGradient(0,-5,0,5);metal.addColorStop(0,'#e0dfd2');metal.addColorStop(.4,'#60727a');metal.addColorStop(1,'#202d39');
    c.fillStyle=metal;c.beginPath();c.roundRect(0,-4,18,8,2);c.fill();c.fillStyle='#d89d46';c.fillRect(7,-2,5,4);c.fillStyle='#121b25';c.fillRect(14,-2.2,7,4.4);c.fillStyle='#ffb45b';c.fillRect(19,-1,2,2);c.restore();
    if(p.inv>0 && Math.floor(t*16)%2===0){ellipseArena4(c,q.x,q.y-22,25,33,'rgba(128,238,255,.18)','#a0f0f1',2);}
  }
  function drawBossArena4(c,b,t){
    const q=isoArena4(b.x,b.y),bob=Math.sin(t*3.5)*2,flash=b.flash>0;
    ellipseArena4(c,q.x,q.y+8,39,14,'rgba(0,0,0,.48)');
    const aura=c.createRadialGradient(q.x,q.y-38,4,q.x,q.y-38,66);aura.addColorStop(0,b.phase===3?'rgba(255,66,48,.28)':'rgba(255,154,77,.20)');aura.addColorStop(1,'rgba(255,86,47,0)');c.fillStyle=aura;c.fillRect(q.x-68,q.y-106,136,136);
    // Cape large, silhouette en trois pans.
    polyArena4(c,[{x:q.x-24,y:q.y-60+bob},{x:q.x+25,y:q.y-58+bob},{x:q.x+38,y:q.y-7},{x:q.x+17,y:q.y+1},{x:q.x-12,y:q.y-4},{x:q.x-38,y:q.y-8}],flash?'#f4cf94':'#652b36','#2e1c29',2);
    polyArena4(c,[{x:q.x-20,y:q.y-52+bob},{x:q.x-4,y:q.y-48+bob},{x:q.x-16,y:q.y-8},{x:q.x-31,y:q.y-9}], '#963d42');
    polyArena4(c,[{x:q.x+5,y:q.y-49+bob},{x:q.x+24,y:q.y-52+bob},{x:q.x+31,y:q.y-10},{x:q.x+16,y:q.y-8}], '#4a2534');
    // Body with layered armor.
    const body=c.createRadialGradient(q.x-13,q.y-53,4,q.x,q.y-34,41);body.addColorStop(0,flash?'#fff0c7':'#f1c27c');body.addColorStop(.42,flash?'#ffe4a4':'#bd8348');body.addColorStop(1,'#593a35');
    ellipseArena4(c,q.x,q.y-43+bob,31,39,body,'#2b222a',2.5);
    // Les rivets/yeux de peau donnent une silhouette propre au boss.
    for(const [dx,dy,r] of [[-18,-50,2.4],[19,-39,2.2],[-14,-27,2],[8,-62,1.8],[14,-20,2.4]])ellipseArena4(c,q.x+dx,q.y+dy+bob,r,r*.63,'#785039');
    ellipseArena4(c,q.x-10,q.y-47+bob,4.1,4.8,'#fff2cf');ellipseArena4(c,q.x+10,q.y-47+bob,4.1,4.8,'#fff2cf');
    ellipseArena4(c,q.x-9,q.y-46+bob,2,2.7,'#a52320');ellipseArena4(c,q.x+11,q.y-46+bob,2,2.7,'#a52320');
    lineArena4(c,[{x:q.x-9,y:q.y-35+bob},{x:q.x,y:q.y-31+bob},{x:q.x+9,y:q.y-35+bob}],'#48242c',3);
    // Armure et ceinture à pièces d'or.
    polyArena4(c,[{x:q.x-28,y:q.y-58+bob},{x:q.x-17,y:q.y-67+bob},{x:q.x-7,y:q.y-54+bob},{x:q.x-12,y:q.y-35+bob},{x:q.x-25,y:q.y-39+bob}], '#5a6673','#202a35',2);
    polyArena4(c,[{x:q.x+28,y:q.y-58+bob},{x:q.x+17,y:q.y-67+bob},{x:q.x+7,y:q.y-54+bob},{x:q.x+12,y:q.y-35+bob},{x:q.x+25,y:q.y-39+bob}], '#555b6b','#20232e',2);
    lineArena4(c,[{x:q.x-22,y:q.y-28+bob},{x:q.x,y:q.y-23+bob},{x:q.x+22,y:q.y-28+bob}],'#dfaa50',6);
    ellipseArena4(c,q.x,q.y-25+bob,5,5,'#ffda83','#7c4d28',1.5);
    // Couronne du Roi Patate, 3 pointes.
    polyArena4(c,[{x:q.x-21,y:q.y-72+bob},{x:q.x-20,y:q.y-88+bob},{x:q.x-8,y:q.y-79+bob},{x:q.x,y:q.y-94+bob},{x:q.x+8,y:q.y-79+bob},{x:q.x+20,y:q.y-88+bob},{x:q.x+21,y:q.y-72+bob}], '#e2ac42','#6e4128',2);
    ellipseArena4(c,q.x,q.y-73+bob,21,5,'#f6cb61','#764425',1.5);
    for(const dx of [-12,0,12])ellipseArena4(c,q.x+dx,q.y-79+bob,2.2,2.2,'#a72e38');
    // Mace and glowing reactor held in the right hand.
    const pulse=1+Math.sin(t*8)*.08;lineArena4(c,[{x:q.x+29,y:q.y-26+bob},{x:q.x+42,y:q.y-13+bob}],'#4c3430',8);
    ellipseArena4(c,q.x+46,q.y-10+bob,10*pulse,10*pulse,'#f06a3f','#ffd27b',2);
    const glow=c.createRadialGradient(q.x+46,q.y-10+bob,1,q.x+46,q.y-10+bob,32);glow.addColorStop(0,'rgba(255,183,80,.55)');glow.addColorStop(1,'rgba(250,70,34,0)');c.fillStyle=glow;c.fillRect(q.x+14,q.y-42+bob,64,64);
    // Plaques en or sur le plastron.
    polyArena4(c,[{x:q.x-8,y:q.y-56+bob},{x:q.x+8,y:q.y-56+bob},{x:q.x+12,y:q.y-39+bob},{x:q.x,y:q.y-32+bob},{x:q.x-12,y:q.y-39+bob}], '#c99545','#704729',1.5);
    lineArena4(c,[{x:q.x-5,y:q.y-48+bob},{x:q.x,y:q.y-43+bob},{x:q.x+5,y:q.y-48+bob}], '#ffe6a2',2);
  }
  function drawMinionArena4(c,e,t){
    const q=isoArena4(e.x,e.y),s=e.role==='brute'?1.25:1;
    ellipseArena4(c,q.x,q.y+4,12*s,5*s,'rgba(0,0,0,.35)');
    lineArena4(c,[{x:q.x-4*s,y:q.y-2},{x:q.x-5*s,y:q.y+4}],'#302830',4*s);lineArena4(c,[{x:q.x+4*s,y:q.y-2},{x:q.x+5*s,y:q.y+4}],'#302830',4*s);
    const body=c.createRadialGradient(q.x-5*s,q.y-17*s,1,q.x,q.y-10*s,18*s);body.addColorStop(0,e.color);body.addColorStop(1,'#513b35');
    ellipseArena4(c,q.x,q.y-12*s,10*s,13*s,body,'#35252a',1.5);
    polyArena4(c,[{x:q.x-9*s,y:q.y-18*s},{x:q.x+9*s,y:q.y-18*s},{x:q.x+8*s,y:q.y-5*s},{x:q.x-7*s,y:q.y-4*s}],e.outfit,'#35252a',1);
    ellipseArena4(c,q.x-3.5*s,q.y-14*s,1.8*s,2*s,'#fff3dc');ellipseArena4(c,q.x+3.5*s,q.y-14*s,1.8*s,2*s,'#fff3dc');
    ellipseArena4(c,q.x-3*s,q.y-14*s,1*s,1.2*s,'#1e1a22');ellipseArena4(c,q.x+4*s,q.y-14*s,1*s,1.2*s,'#1e1a22');
    for(const [dx,dy] of [[-5,-21],[6,-7],[1,-24]])ellipseArena4(c,q.x+dx*s,q.y+dy*s,1,.7,'#825636');
    if(e.armed){lineArena4(c,[{x:q.x+6*s,y:q.y-10*s},{x:q.x+12*s,y:q.y-13*s}],'#d2a267',3);c.fillStyle='#303a43';c.fillRect(q.x+10*s,q.y-16*s,10*s,4*s);c.fillStyle='#f4a754';c.fillRect(q.x+18*s,q.y-15*s,2*s,2*s);}
    if(e.hp<e.maxHp){c.fillStyle='rgba(20,14,20,.72)';c.fillRect(q.x-13*s,q.y-31*s,26*s,3);c.fillStyle='#ef6653';c.fillRect(q.x-13*s,q.y-31*s,26*s*e.hp/e.maxHp,3);}
  }
  function spawnMinionArena4(role){
    const side=Math.floor(Math.random()*4), edge=side===0?{x:5,y:rand(8,52)}:side===1?{x:55,y:rand(8,52)}:side===2?{x:rand(8,52),y:5}:{x:rand(8,52),y:55};
    const cfg=A4_MINION_STYLES[role];B4.minions.push({x:edge.x,y:edge.y,r:1.2,role,hp:cfg.hp,maxHp:cfg.hp,speed:cfg.speed,damage:cfg.damage,color:cfg.color,outfit:cfg.outfit,armed:cfg.armed,fireT:rand(.9,1.8),hitFlash:0});
  }
  function fireArena4(){
    if(state!=='play'||!B4||g.level!==4)return;const p=B4.player;
    if(B4.overheated||B4.overheatT>0||B4.fireCD>0)return;
    const aim=pickAimArena4();p.aimx=aim.x;p.aimy=aim.y;B4.lastAim=aim;
    let dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;
    B4.shots.push({x:p.x+dx*1.5,y:p.y+dy*1.5,vx:dx*31,vy:dy*31,life:1.7,damage:18,r:.32});
    B4.fireCD=.16;B4.heat=Math.min(100,B4.heat+8.5);B4.shake=Math.max(B4.shake,.8);
    if(B4.heat>=100){B4.overheated=true;B4.overheatT=2.1;B4.banner='BLASTER EN SURCHAUFFE — ESQUIVE !';B4.bannerT=1.2;}
    for(let i=0;i<4;i++)B4.particles.push({x:p.x+dx*1.7,y:p.y+dy*1.7,z:13,vx:rand(-2,2)+dx*4,vy:rand(-2,2)+dy*4,vz:rand(-1,3),life:.18+Math.random()*.12,color:i%2?'#ffd18b':'#fff4cd',size:rand(1,2)});
  }
  function addBurstArena4(x,y,color,n=10,power=5){
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=rand(.8,power);B4.particles.push({x,y,z:rand(5,22),vx:Math.cos(a)*s,vy:Math.sin(a)*s,vz:rand(-4,5),life:rand(.25,.85),color,size:rand(1.2,3)});}
  }
  function damageHeroArena4(amount,sourceX,sourceY){
    if(!B4 || !B4.player || state!=='play') return;
    const p=B4.player;if(p.inv>0)return;p.hp=Math.max(0,p.hp-amount*.88);p.inv=1.05;B4.damageFlash=.3;B4.shake=5;B4.banner='TOUCHÉ ! BOUGE !';B4.bannerT=.6;
    const dx=p.x-sourceX,dy=p.y-sourceY,d=Math.hypot(dx,dy)||1;p.x=clamp(p.x+dx/d*1.4,3,57);p.y=clamp(p.y+dy/d*1.4,3,57);
    addBurstArena4(p.x,p.y,'#ff7964',13,4);
    if(p.hp<=0){p.lives--;if(p.lives<=0){p.hp=0;endGame(false);return;}p.hp=Math.round(p.maxHp*.7);p.x=30;p.y=51;p.inv=2.2;B4.banner='SECONDE CHANCE !';B4.bannerT=1.8;}
  }
  function bossVolleyArena4(b,phase,fan=5){
    const p=B4.player,base=Math.atan2(p.y-b.y,p.x-b.x),speed=phase===3?10:8;
    for(let i=0;i<fan;i++){const off=(i-(fan-1)/2)*(phase===3?.20:.27),a=base+off;B4.enemyShots.push({x:b.x,y:b.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4,damage:phase===3?12:8,r:.65,color:phase===3?'#ff4b36':'#f7a34f',kind:'boss'});}
    addBurstArena4(b.x,b.y,'#ff9a48',8,3.5);
  }
  function updateBossArena4(dt){
    const b=B4.boss,p=B4.player;if(b.hp<=0)return;b.anim+=dt;b.flash=Math.max(0,b.flash-dt);b.chargeT=Math.max(0,b.chargeT-dt);
    const ratio=b.hp/b.maxHp,phase=ratio<=.30?3:ratio<=.66?2:1;
    if(phase!==b.phase){b.phase=phase;B4.phase=phase;B4.banner=phase===2?'PHASE 2 — LA GARDE ROYALE !':'PHASE 3 — FUREUR ROYALE !';B4.bannerT=2.3;B4.shake=8;addBurstArena4(b.x,b.y,phase===3?'#ff4937':'#f1bd59',35,9);b.attackT=.75;}
    const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
    const speed=phase===1?1.1:phase===2?1.55:2.0;
    if(d>10){const nx=b.x+dx/d*speed*dt,ny=b.y+dy/d*speed*dt;if(nx>5&&nx<55)b.x=nx;if(ny>5&&ny<30)b.y=ny;}
    if(phase===3&&b.chargeT<=0&&d>7&&d<20&&Math.random()<dt*.18){b.chargeT=.65;B4.banner='LE ROI CHARGE !';B4.bannerT=.8;}
    if(b.chargeT>0){const chargeSpeed=phase===3?10:0;const nx=b.x+dx/d*chargeSpeed*dt,ny=b.y+dy/d*chargeSpeed*dt;if(nx>4&&nx<56)b.x=nx;if(ny>4&&ny<36)b.y=ny;if(d<4.5)damageHeroArena4(15,b.x,b.y);}
    else if(d<4.2&&p.inv<=0)damageHeroArena4(9,b.x,b.y);
    b.attackT-=dt;
    if(b.attackT<=0){
      b.pattern++;
      if(phase===1){
        B4.warnings.push({type:'slam',x:p.x,y:p.y,r:4.8,t:1.2,phase,damage:10});b.attackT=2.8;
      }else if(phase===2){
        if(b.pattern%2){B4.warnings.push({type:'slam',x:p.x,y:p.y,r:5.5,t:1.2,phase,damage:11});b.attackT=2.4;}
        else{bossVolleyArena4(b,phase,5);b.attackT=2.1;}
      }else{
        if(b.pattern%3===0){B4.warnings.push({type:'slam',x:p.x,y:p.y,r:6.0,t:.95,phase,damage:14});b.attackT=1.9;}
        else if(b.pattern%2){B4.warnings.push({type:'slam',x:p.x,y:p.y,r:7.2,t:.95,phase,damage:16});bossVolleyArena4(b,phase,5);b.attackT=1.3;}
        else{bossVolleyArena4(b,phase,5);b.attackT=1.8;}
      }
    }
  }
  function updateArena4(dt){
    if(!B4)return;const a=B4,p=a.player,b=a.boss;
    a.t+=dt;a.bannerT=Math.max(0,a.bannerT-dt);a.heat=Math.max(0,a.heat-(a.mouseDown&&!a.overheated?2.5:18)*dt);a.fireCD=Math.max(0,a.fireCD-dt);a.overheatT=Math.max(0,a.overheatT-dt);a.hitT=Math.max(0,a.hitT-dt);a.damageFlash=Math.max(0,a.damageFlash-dt);a.shake=Math.max(0,a.shake-dt*18);
    if(a.overheated&&a.overheatT<=0&&a.heat<45)a.overheated=false;
    p.inv=Math.max(0,p.inv-dt);p.dashCD=Math.max(0,p.dashCD-dt);p.dashT=Math.max(0,p.dashT-dt);
    const k=window.L4keys||{};let mx=(k.right?1:0)-(k.left?1:0),my=(k.down?1:0)-(k.up?1:0),len=Math.hypot(mx,my);
    if(len>0){mx/=len;my/=len;const wx=(mx+my)*Math.SQRT1_2,wy=(my-mx)*Math.SQRT1_2;p.lastX=wx;p.lastY=wy;}
    if(k.dodge&&!p.dodgeWasDown&&p.dashCD<=0){
      if(len<=0){const dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;p.lastX=dx/d;p.lastY=dy/d;}
      p.dashT=.34;p.dashCD=.75;p.inv=Math.max(p.inv,.55);addBurstArena4(p.x,p.y,'#83e9e7',12,3.5);
    }
    p.dodgeWasDown=!!k.dodge;
    const speed=p.dashT>0?26:p.speed;
    if(len>0){const wx=(mx+my)*Math.SQRT1_2,wy=(my-mx)*Math.SQRT1_2;let nx=clamp(p.x+wx*speed*dt,3,57),ny=clamp(p.y+wy*speed*dt,3,57);
      const collides=(x,y)=>A4_PILLARS.some(o=>Math.hypot(x-o.x,y-o.y)<(o.style===2?2.5:2.8));
      if(!collides(nx,p.y))p.x=nx;if(!collides(p.x,ny))p.y=ny;
    }
    const aim=pickAimArena4();p.aimx=clamp(aim.x,0,60);p.aimy=clamp(aim.y,0,60);
    if(a.mouseDown){if(a.overheated){a.heat=Math.min(100,a.heat+dt*2);}else if(a.fireCD<=0)fireArena4();}
    updateBossArena4(dt);
    // Vagues d'énergie traversant l'arène : il faut sauter/esquiver au bon moment.
    a.warnings=a.warnings.filter(w=>{
      w.t-=dt;if(w.t>0)return true;
      if(w.type==='slam'){const d=Math.hypot(p.x-w.x,p.y-w.y);if(d<w.r)damageHeroArena4(w.damage,w.x,w.y);addBurstArena4(w.x,w.y,'#ff8246',26,7);a.shake=5;}
      else if(w.type==='wave'){a.waves.push({x:w.x,y:w.y,r:2.5,maxR:17,speed:15,life:1.05,damage:w.damage,hit:false});addBurstArena4(w.x,w.y,'#ff653f',25,6);}
      return false;
    });
    a.waves=a.waves.filter(w=>{
      const old=w.r;w.r+=w.speed*dt;w.life-=dt;const d=Math.hypot(p.x-w.x,p.y-w.y);
      if(!w.hit&&d>=old-.7&&d<=w.r+.7&&p.inv<=0){damageHeroArena4(w.damage,w.x,w.y);w.hit=true;}
      return w.life>0&&w.r<w.maxR;
    });
    if(state!=='play') return;
    // Projectiles du blaster.
    a.shots=a.shots.filter(s=>{
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
      if(Math.hypot(s.x-b.x,s.y-b.y)<b.r+.45&&b.hp>0){b.hp=Math.max(0,b.hp-s.damage);b.flash=.12;a.hitT=.17;a.score+=10;addBurstArena4(s.x,s.y,'#ffe4a0',5,2.3);return false;}
      for(const e of a.minions){if(e.hp>0&&Math.hypot(s.x-e.x,s.y-e.y)<1.25){e.hp-=s.damage;e.hitFlash=.13;addBurstArena4(s.x,s.y,'#f5d18b',4,1.8);if(e.hp<=0){a.kills++;a.score+=30;addBurstArena4(e.x,e.y,'#dcb274',14,4);}return false;}}
      return s.life>0&&s.x>-5&&s.x<65&&s.y>-5&&s.y<65;
    });
    // Petites patates de garde, plus rapides mais moins résistantes que le Roi.
    a.minions=a.minions.filter(e=>{
      if(e.hp<=0)return false; e.hitFlash=Math.max(0,e.hitFlash-dt);e.fireT-=dt;
      const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
      if(e.armed&&d<20){if(e.fireT<=0){const an=Math.atan2(dy,dx);a.enemyShots.push({x:e.x,y:e.y,vx:Math.cos(an)*9,vy:Math.sin(an)*9,life:3,damage:e.damage,r:.43,color:'#a8df7c',kind:'minion'});e.fireT=rand(1.6,2.3);}}
      else if(d>1.8){const nx=e.x+dx/d*e.speed*dt,ny=e.y+dy/d*e.speed*dt;if(!A4_PILLARS.some(o=>Math.hypot(nx-o.x,ny-o.y)<2.8))e.x=nx;if(!A4_PILLARS.some(o=>Math.hypot(e.x-o.x,e.y-o.y)<2.8))e.y=ny;}
      if(d<1.8&&p.inv<=0)damageHeroArena4(e.damage,e.x,e.y);
      return true;
    });
    a.enemyShots=a.enemyShots.filter(s=>{
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
      if(Math.hypot(s.x-p.x,s.y-p.y)<p.r+(s.r||.4)&&p.inv<=0){damageHeroArena4(s.damage,s.x,s.y);addBurstArena4(s.x,s.y,s.color,8,3);return false;}
      return s.life>0&&s.x>0&&s.x<60&&s.y>0&&s.y<60;
    });
    a.particles=a.particles.filter(pt=>{pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.z+=pt.vz*dt;pt.vz-=12*dt;pt.life-=dt;return pt.life>0;});
    // L'affichage de la jauge correspond à la vraie surchauffe du blaster.
    if(b.hp<=0&&!a.defeated){a.defeated=true;B4.banner='LE ROI EST VAINCU !';B4.bannerT=3;addBurstArena4(b.x,b.y,'#ffd879',90,12);setTimeout(()=>{if(state==='play'&&g&&g.level===4)endGame(true);},850);}
    if(a.player.lives<=0&&state==='play')endGame(false);
  }
  function drawWarningsArena4(c,t){
    for(const w of B4.warnings){const q=isoArena4(w.x,w.y),f=1-w.t/(w.type==='slam'?1.05:.65),r=w.r*(.7+.3*f),pts=[];
      for(let i=0;i<=64;i++){const ang=i*Math.PI*2/64;pts.push(isoArena4(w.x+Math.cos(ang)*r,w.y+Math.sin(ang)*r,2));}
      c.save();c.globalAlpha=.22+.20*Math.sin(t*18);polyArena4(c,pts,'rgba(255,54,39,.16)');lineArena4(c,pts,w.phase===3?'#ff493b':'#ff9a53',3);c.restore();
      lineArena4(c,[{x:q.x-8,y:q.y-28},{x:q.x+8,y:q.y-28}],'rgba(255,225,198,.88)',2);lineArena4(c,[{x:q.x,y:q.y-36},{x:q.x,y:q.y-20}],'rgba(255,225,198,.88)',2);
    }
    for(const w of B4.waves){const pts=[];for(let i=0;i<=64;i++){const an=i*Math.PI*2/64;pts.push(isoArena4(w.x+Math.cos(an)*w.r,w.y+Math.sin(an)*w.r,6));}lineArena4(c,pts,'rgba(255,89,50,.85)',4);}
  }
  function drawArena4(){
    const c=mainCtx,a=B4;if(!a){c.clearRect(0,0,W,H);return;}
    c.save();const shakeX=a.shake>0?rand(-a.shake,a.shake)*.35:0,shakeY=a.shake>0?rand(-a.shake,a.shake)*.2:0;c.translate(shakeX,shakeY);
    drawArenaBackdrop4(c,a.t);drawArenaFloor4(c,a.t);
    // Débris et plaques sur le sol.
    for(let i=0;i<34;i++){const x=(i*17+5)%58+1,y=(i*29+8)%58+1,q=isoArena4(x,y);if((i%4)!==0)ellipseArena4(c,q.x,q.y,2+(i%3),1.3,'rgba(20,17,23,.33)');else polyArena4(c,[{x:q.x-3,y:q.y},{x:q.x,y:q.y-2},{x:q.x+5,y:q.y+1},{x:q.x+1,y:q.y+3}],'#76605a');}
    const actors=[...A4_PILLARS.map(o=>({type:'pillar',...o,sort:o.x+o.y})),...a.minions.filter(e=>e.hp>0).map(e=>({type:'minion',e,sort:e.x+e.y})),{type:'hero',sort:a.player.x+a.player.y},{type:'boss',sort:a.boss.x+a.boss.y}].sort((x,y)=>x.sort-y.sort);
    drawWarningsArena4(c,a.t);
    for(const ob of actors){if(ob.type==='pillar')drawPillarArena4(c,ob,a.t);else if(ob.type==='hero')drawHeroArena4(c,a.player,a.t);else if(ob.type==='boss'&&a.boss.hp>0)drawBossArena4(c,a.boss,a.t);else if(ob.type==='minion')drawMinionArena4(c,ob.e,a.t);}
    // Projectiles et traînées lumineuses.
    for(const s of a.shots){const q=isoArena4(s.x,s.y,12),tail=isoArena4(s.x-s.vx*.035,s.y-s.vy*.035,12);lineArena4(c,[tail,q],'rgba(255,206,119,.8)',4);const gl=c.createRadialGradient(q.x,q.y,1,q.x,q.y,13);gl.addColorStop(0,'rgba(255,248,204,.95)');gl.addColorStop(1,'rgba(255,143,55,0)');c.fillStyle=gl;c.fillRect(q.x-14,q.y-14,28,28);ellipseArena4(c,q.x,q.y,3,3,'#fff7c6','#ff9f50',1);}
    for(const s of a.enemyShots){const q=isoArena4(s.x,s.y,11),gl=c.createRadialGradient(q.x,q.y,1,q.x,q.y,12);gl.addColorStop(0,s.color);gl.addColorStop(1,'rgba(255,80,48,0)');c.fillStyle=gl;c.fillRect(q.x-12,q.y-12,24,24);ellipseArena4(c,q.x,q.y,4,4,s.color,'#ffe5a2',1);}
    for(const pt of a.particles){const q=isoArena4(pt.x,pt.y,pt.z);c.globalAlpha=clamp(pt.life,0,1);ellipseArena4(c,q.x,q.y,pt.size,pt.size,pt.color);}c.globalAlpha=1;
    c.restore();drawHudArena4(c,a);
  }
  function drawHudArena4(c,a){
    const p=a.player,b=a.boss;c.save();
    const panel=(x,y,w,h)=>{c.fillStyle='rgba(13,16,24,.83)';c.beginPath();c.roundRect(x,y,w,h,12);c.fill();c.strokeStyle='rgba(255,218,165,.36)';c.lineWidth=1;c.stroke();c.fillStyle='rgba(255,255,255,.035)';c.fillRect(x+7,y+7,w-14,1);};
    panel(15,13,200,100);c.textAlign='left';c.fillStyle='#f3dfbc';c.font='900 12px system-ui';c.fillText('FORTERESSE · ARÈNE DU ROI',28,32);
    c.fillStyle='#e7c7a2';c.font='800 10px system-ui';c.fillText('SANTÉ',28,51);c.fillStyle='rgba(255,255,255,.13)';c.fillRect(28,58,172,10);const hg=c.createLinearGradient(28,0,200,0);hg.addColorStop(0,'#3dc2a0');hg.addColorStop(.6,'#a6d66e');hg.addColorStop(1,'#f1b451');c.fillStyle=hg;c.fillRect(28,58,172*Math.max(0,p.hp/p.maxHp),10);
    c.fillStyle='#ffcf84';c.font='900 15px system-ui';c.fillText('♥ '.repeat(Math.max(0,p.lives)),28,91);c.fillStyle='#ddcab3';c.font='700 10px system-ui';c.fillText(`SCORE  ${a.score.toString().padStart(5,'0')}   ·   GARDE  ${a.kills}`,83,90);
    panel(W/2-215,13,430,69);c.textAlign='center';c.fillStyle='#f8e5c6';c.font='900 12px system-ui';c.fillText(b.hp>0?`ROI PATATE  ·  PHASE ${b.phase}`:'ROI PATATE VAINCU',W/2,32);
    c.fillStyle='rgba(0,0,0,.48)';c.fillRect(W/2-196,43,392,18);const ratio=Math.max(0,b.hp/b.maxHp),grad=c.createLinearGradient(W/2-196,0,W/2+196,0);grad.addColorStop(0,'#a62e3d');grad.addColorStop(.55,'#f06b42');grad.addColorStop(1,'#ffc06b');c.fillStyle='#42252c';c.fillRect(W/2-193,46,386,12);c.fillStyle=grad;c.fillRect(W/2-193,46,386*ratio,12);c.strokeStyle='rgba(255,240,208,.7)';c.strokeRect(W/2-196,43,392,18);
    c.textAlign='right';c.fillStyle='#f4e0c3';c.font='900 19px system-ui';c.fillText(`${Math.ceil(g.time)}s`,W-20,36);c.font='700 10px system-ui';c.fillStyle='#dfc8ad';c.fillText('RESTANT',W-20,51);
    // Surchauffe du blaster avec refroidissement réellement géré en jeu.
    panel(15,H-79,245,64);c.textAlign='left';c.fillStyle=a.overheated?'#ff7968':'#bce5d5';c.font='900 11px system-ui';c.fillText(a.overheated?`SURCHAUFFE · ${a.overheatT.toFixed(1)} s`:'TEMPÉRATURE DU BLASTER',28,H-59);
    c.fillStyle='rgba(255,255,255,.12)';c.fillRect(28,H-48,216,12);const hf=a.heat/100,heat=c.createLinearGradient(28,0,244,0);heat.addColorStop(0,'#62d3b1');heat.addColorStop(.58,'#f4bd59');heat.addColorStop(1,'#fa514b');c.fillStyle=heat;c.fillRect(28,H-48,216*hf,12);c.strokeStyle='rgba(255,255,255,.3)';c.strokeRect(28,H-48,216,12);c.fillStyle='#fff4da';c.font='800 9px system-ui';c.fillText(`${Math.round(a.heat)}%`,215,H-39);
    panel(W-232,H-71,217,56);c.textAlign='center';c.fillStyle='#f1dfc7';c.font='800 10px system-ui';c.fillText('ZQSD / FLÈCHES : BOUGER',W-123,H-51);c.fillStyle='#b5ded8';c.fillText('ESPACE / MAJ : ESQUIVE',W-123,H-36);c.fillText('CLIC MAINTENU : TIRER',W-123,H-22);
    const aim=isoArena4(p.aimx,p.aimy,2);c.strokeStyle=a.hitT>0?'#ffdf7d':'rgba(255,239,209,.68)';c.lineWidth=1.5;c.beginPath();c.arc(aim.x,aim.y,8,0,Math.PI*2);c.moveTo(aim.x-13,aim.y);c.lineTo(aim.x-5,aim.y);c.moveTo(aim.x+5,aim.y);c.lineTo(aim.x+13,aim.y);c.moveTo(aim.x,aim.y-13);c.lineTo(aim.x,aim.y-5);c.moveTo(aim.x,aim.y+5);c.lineTo(aim.x,aim.y+13);c.stroke();
    if(a.bannerT>0){c.globalAlpha=Math.min(1,a.bannerT*2);panel(W/2-185,98,370,36);c.textAlign='center';c.fillStyle=a.phase===3?'#ffae84':'#ffdf9c';c.font='950 17px system-ui';c.fillText(a.banner,W/2,121);c.globalAlpha=1;}
    if(a.damageFlash>0){c.fillStyle=`rgba(255,54,46,${a.damageFlash*.25})`;c.fillRect(0,0,W,H);}
    if(a.helpT>0){c.fillStyle='rgba(8,12,18,.64)';c.beginPath();c.roundRect(W/2-188,H-42,376,24,8);c.fill();c.textAlign='center';c.fillStyle='#eee0c8';c.font='700 10px system-ui';c.fillText('VISE LES PROJECTILES EN TE DÉPLAÇANT — LES RONDS ROUGES ANNONCENT UN IMPACT',W/2,H-27);}
    c.restore();
  }

  // ====== NIVEAU 4 : RENDU WEBGL NATIF (aucune bibliothèque externe) ======
  // Ce renderer utilise de vrais buffers de triangles, un depth buffer, une caméra perspective,
  // des normales et un éclairage par pixel. Les matériaux sont procéduraux pour fonctionner hors ligne.
  let GL4 = null;
  const COLOR4 = new Map();
  function color4(hex) {
    if (COLOR4.has(hex)) return COLOR4.get(hex);
    let v = String(hex || '#ffffff').replace('#','');
    if (v.length===3) v=v.split('').map(c=>c+c).join('');
    const a=[parseInt(v.slice(0,2),16)/255,parseInt(v.slice(2,4),16)/255,parseInt(v.slice(4,6),16)/255,1];
    COLOR4.set(hex,a); return a;
  }
  function cross4(a,b) { return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]; }
  function dot4(a,b) { return a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; }
  function norm4(v) { const l=Math.hypot(v[0],v[1],v[2])||1; return [v[0]/l,v[1]/l,v[2]/l]; }
  function tri4(out,a,b,c,col,mat,center) {
    let ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]], n=norm4(cross4(ab,ac));
    if(center) { const mid=[(a[0]+b[0]+c[0])/3-center[0],(a[1]+b[1]+c[1])/3-center[1],(a[2]+b[2]+c[2])/3-center[2]]; if(dot4(n,mid)<0) { const t=b;b=c;c=t;n=norm4(cross4([b[0]-a[0],b[1]-a[1],b[2]-a[2]],[c[0]-a[0],c[1]-a[1],c[2]-a[2]])); } }
    const cc=color4(col); for(const v of [a,b,c]) out.push(v[0],v[1],v[2],n[0],n[1],n[2],cc[0],cc[1],cc[2],cc[3],mat);
  }
  function quad4(out,a,b,c,d,col,mat) { tri4(out,a,b,c,col,mat); tri4(out,a,c,d,col,mat); }
  function box4(out,cx,cy,cz,w,h,d,col,mat=1,yaw=0) {
    const X=w/2,Y=h/2,Z=d/2,cs=Math.cos(yaw),sn=Math.sin(yaw);
    const tr=(x,y,z)=>[cx+x*cs+z*sn,cy+y,cz-x*sn+z*cs];
    const v=[tr(-X,-Y,-Z),tr(X,-Y,-Z),tr(X,Y,-Z),tr(-X,Y,-Z),tr(-X,-Y,Z),tr(X,-Y,Z),tr(X,Y,Z),tr(-X,Y,Z)];
    quad4(out,v[4],v[5],v[6],v[7],col,mat); quad4(out,v[1],v[0],v[3],v[2],col,mat);
    quad4(out,v[5],v[1],v[2],v[6],col,mat); quad4(out,v[0],v[4],v[7],v[3],col,mat);
    quad4(out,v[7],v[6],v[2],v[3],col,mat); quad4(out,v[0],v[1],v[5],v[4],col,mat);
  }
  function ellipsoid4(out,cx,cy,cz,rx,ry,rz,col,mat=3,seg=12,rings=8) {
    const rows=[];
    for(let j=0;j<=rings;j++) { const a=Math.PI*j/rings, row=[]; for(let i=0;i<=seg;i++) { const b=2*Math.PI*i/seg; row.push([cx+rx*Math.sin(a)*Math.cos(b),cy+ry*Math.cos(a),cz+rz*Math.sin(a)*Math.sin(b)]); } rows.push(row); }
    const center=[cx,cy,cz];
    for(let j=0;j<rings;j++) for(let i=0;i<seg;i++) { const a=rows[j][i],b=rows[j+1][i],c=rows[j+1][i+1],d=rows[j][i+1]; tri4(out,a,b,c,col,mat,center); tri4(out,a,c,d,col,mat,center); }
  }
  function cylinder4(out,cx,cy,cz,r,h,col,mat=2,seg=10,topR=r) {
    const y0=cy-h/2,y1=cy+h/2,center=[cx,cy,cz];
    for(let i=0;i<seg;i++) {
      const a=i*Math.PI*2/seg,b=(i+1)*Math.PI*2/seg;
      const p0=[cx+r*Math.cos(a),y0,cz+r*Math.sin(a)],p1=[cx+r*Math.cos(b),y0,cz+r*Math.sin(b)];
      const q0=[cx+topR*Math.cos(a),y1,cz+topR*Math.sin(a)],q1=[cx+topR*Math.cos(b),y1,cz+topR*Math.sin(b)];
      tri4(out,p0,p1,q1,col,mat,center); tri4(out,p0,q1,q0,col,mat,center);
      tri4(out,[cx,y1,cz],q0,q1,col,mat); tri4(out,[cx,y0,cz],p1,p0,col,mat);
    }
  }
  function cone4(out,cx,cy,cz,r,h,col,mat=5,seg=7) {
    const tip=[cx,cy+h/2,cz], baseY=cy-h/2, center=[cx,cy,cz];
    for(let i=0;i<seg;i++) { const a=i*Math.PI*2/seg,b=(i+1)*Math.PI*2/seg; const p=[cx+r*Math.cos(a),baseY,cz+r*Math.sin(a)],q=[cx+r*Math.cos(b),baseY,cz+r*Math.sin(b)]; tri4(out,p,q,tip,col,mat,center); tri4(out,[cx,baseY,cz],q,p,col,mat); }
  }
  function addFortressTorch4(out,x,z,s=1) {
    box4(out,x,.42*s,z,.30*s,.84*s,.30*s,'#34363a',2);
    box4(out,x,.89*s,z,.43*s,.13*s,.43*s,'#68635c',1);
    cylinder4(out,x,1.15*s,z,.09*s,.46*s,'#3a3330',2,8);
    ellipsoid4(out,x,1.48*s,z,.14*s,.25*s,.14*s,'#ff6a27',4,8,6);
    ellipsoid4(out,x,1.49*s,z,.068*s,.17*s,.068*s,'#ffe2a0',4,7,5);
    ellipsoid4(out,x,1.24*s,z,.21*s,.10*s,.21*s,'#e74a1d',4,8,5);
  }
  function buildFortressWorld4() {
    const a=[];
    // La dalle principale possède un carrelage et des variations de pierre procédurales dans le shader.
    box4(a,32, -.20,24,64,.40,48,'#65615b',0);
    // Remparts et murets identiques à ceux utilisés par le système de collisions du jeu.
    for(let y=2;y<46;y++) for(let x=2;x<62;x++) {
      const tile=fortressTile4(x,y);
      if(tile==='F') {
        const h=3.45+0.12*Math.sin(x*1.71+y*.89), tone=((x*7+y*13)%5);
        const shade=['#716b64','#68635e','#7b7369','#625e59','#81796f'][tone];
        box4(a,x+.5,h/2,y+.5,1.03,h,1.03,shade,1);
        if((x+y)%3===0) box4(a,x+.5,h-.11,y+.5,1.04,.19,1.035,'#83796c',1);
      } else if(tile==='B') {
        // Sacs empilés plutôt que de simples cubes.
        for(let row=0;row<2;row++) for(let col=0;col<2;col++)
          ellipsoid4(a,x+.25+col*.5,.23+row*.39,y+.5,.29,.24,.47,((x+y+row+col)%3===0)?'#a18c6d':'#7f715c',1,8,5);
      }
    }
    // Tours, contreforts et créneaux le long du périmètre.
    const towers=[[4.4,4.4],[59.5,4.4],[4.4,43.4],[59.5,43.4],[18.5,9.5],[45.5,9.5],[18.5,38.5],[45.5,38.5]];
    for(const [x,z] of towers) {
      box4(a,x,1.85,z,2.25,3.7,2.25,'#4e4b49',1);
      box4(a,x,3.82,z,2.62,.32,2.62,'#777066',1);
      box4(a,x,4.15,z,2.38,.28,2.38,'#3e3e41',2);
      for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++) if((i+j)%2===0) box4(a,x+i*.72,4.48,z+j*.72,.46,.38,.46,'#777068',1);
      box4(a,x,1.1,z,2.05,.14,2.05,'#a18a70',1);
    }
    // Porte monumentale entrouverte : colonnes de pierre, linteau métallique et herses levées.
    for(const x of [29.1,34.9]) {
      box4(a,x,1.9,17.5,1.05,3.8,1.12,'#777067',1);
      box4(a,x,3.86,17.5,1.35,.32,1.38,'#9a8b78',1);
      box4(a,x,4.15,17.5,.92,.24,.92,'#4c4c4e',2);
    }
    box4(a,32,4.12,17.5,5.5,.36,.8,'#4d4a47',2);
    for(let x=30.2;x<=33.8;x+=.72) box4(a,x,3.35,17.5,.12,1.25,.16,'#777f81',2);
    // Bande d'acier au sol et marches usées à l'entrée du sanctuaire.
    box4(a,32,.025,18.2,4.2,.05,.34,'#a86c36',2);
    for(let i=0;i<3;i++) box4(a,32,.13+i*.12,19.2+i*.33,7.5,.22,.65,'#625b54',1);
    // Plate-forme surélevée du Roi Patate.
    box4(a,32,.24,8.4,12,.48,5.3,'#4c4845',1);
    box4(a,32,.51,8.4,10.9,.12,4.45,'#837467',1);
    box4(a,32,.60,8.4,9.6,.10,3.55,'#312e30',0);
    for(const x of [27.1,36.9]) { cylinder4(a,x,1.0,6.7,.24,1.0,'#897d6b',1,8); cylinder4(a,x,1.55,6.7,.36,.18,'#ac8a53',5,8); }
    // Bannières de guerre, fers et emblèmes patate sur le mur de fond.
    for(const [x,z,c] of [[25,4.1,'#a83338'],[39,4.1,'#a83338'],[32,4.1,'#b88b36']]) {
      box4(a,x,2.45,z,.10,3.25,.10,'#3c3b3b',2);
      box4(a,x,2.18,z+.08,1.28,1.95,.09,c,5);
      ellipsoid4(a,x,2.25,z+.145,.31,.40,.06,'#d7b06c',5,8,6);
      ellipsoid4(a,x-.11,2.30,z+.205,.035,.045,.014,'#24272b',2,6,4);
      ellipsoid4(a,x+.11,2.30,z+.205,.035,.045,.014,'#24272b',2,6,4);
    }
    // Brazéros et appliques ; leurs quatre lumières les plus proches éclairent dynamiquement la scène.
    for(const [x,z,s] of [[8.5,8.5,1],[55.5,8.5,1],[8.5,39.5,1],[55.5,39.5,1],[23.5,20.5,.9],[40.5,20.5,.9],[27.5,10.5,1.15],[37.5,10.5,1.15],[10.5,31.5,.85],[53.5,31.5,.85],[27.5,38.2,.8],[37.5,38.2,.8],[24.5,29.4,.8],[39.5,29.4,.8],[25.5,18.7,.82],[38.5,18.7,.82]]) addFortressTorch4(a,x,z,s);
    // Caisse de munition, caisses éclatées et protections en acier.
    for(const [x,z,s] of [[10.5,15.5,1],[53.5,18.5,1],[25.8,36.3,.9],[38.2,36.3,.9]]) {
      box4(a,x,.42,z,.9,.84,.86,'#63432e',2);
      box4(a,x,.44,z,.98,.14,.92,'#9a7852',2);
      box4(a,x,.42,z,.11,.86,.96,'#b18a5d',2);
      box4(a,x,.82,z,.98,.08,.96,'#303b43',2);
    }
    // Grilles de drainage et rails de métal qui traversent les couloirs.
    for(const [x,z,w] of [[32,25,6.8],[24,34,3.2],[40,34,3.2],[32,19.4,3.6]]) {
      box4(a,x,.022,z,w,.045,.5,'#252b30',2);
      for(let i=-w/2+.12;i<w/2;i+=.24) box4(a,x+i,.055,z,.045,.04,.48,'#8f8e89',2);
    }
    // Colonnes, braseros bas et éléments renforçant l'échelle de la salle.
    for(const [x,z] of [[23.5,6.0],[40.5,6.0],[23.5,12.8],[40.5,12.8],[25.0,21],[39.0,21],[25.0,39],[39.0,39]]) {
      box4(a,x,1.35,z,.78,2.7,.78,'#5c5650',1); box4(a,x,2.75,z,.99,.24,.99,'#898074',1); box4(a,x,.15,z,.98,.30,.98,'#4a4846',1);
    }
    // Détails de forteresse : voussoirs de l'arche, plaques rivetées, chaînes et pierres brisées.
    // Les pièces sont de vrais maillages WebGL, pas des sprites collés à l'écran.
    for (const side of [-1,1]) {
      const x=32+side*3.05;
      for(let i=0;i<5;i++) {
        const ang=(i/4)*Math.PI*.5;
        const bx=32+side*(.72+Math.cos(ang)*2.35), by=3.55+Math.sin(ang)*1.15;
        box4(a,bx,by,17.45,.62,.42,.82,(i%2?'#8a8074':'#746b62'),1,side*ang*.10);
      }
      // Anneaux métalliques et chaînes suspendues près des tours.
      for(let k=0;k<7;k++) {
        const cy=3.2-k*.34;
        cylinder4(a,x,cy,17.08,.065,.12,'#555b60',2,8,.065);
        box4(a,x,cy-.15,17.08,.055,.25,.055,'#343a40',2);
      }
    }
    // Nervures de pierre, moulures et bandeaux qui cassent les grandes surfaces plates.
    for (const z of [5.15,16.1,30.0,42.2]) {
      for (const x of [6.0,14.0,20.0,44.0,50.0,58.0]) {
        box4(a,x,2.55,z,.16,4.9,.18,'#474642',1);
        box4(a,x,4.9,z,.32,.20,.34,'#928679',1);
        box4(a,x,.22,z,.42,.30,.42,'#4b4947',1);
      }
    }
    // Plancher métallique de l'arène, plaques d'acier et boulons visibles.
    for(const [cx,cz,w,d] of [[32,25,7.0,.12],[24,34,3.4,.12],[40,34,3.4,.12],[32,19.4,3.7,.12]]) {
      for(const xx of [-w/2+.18,w/2-.18]) for(const zz of [-d/2-.02,d/2+.02]) {
        cylinder4(a,cx+xx,.075,cz+zz,.045,.035,'#b6a27f',2,8,.045);
      }
    }
    // Gravats et pierres cassées le long des remparts pour un sol moins propre et répétitif.
    for(let i=0;i<90;i++) {
      const side=i%4, t=((i*37)%97)/97;
      let x,z;
      if(side===0){x=4.5+t*12;z=4.7+((i%3)*.18);}
      else if(side===1){x=47.5+t*12;z=43.0-((i%3)*.18);}
      else if(side===2){x=4.5+((i%3)*.18);z=8+t*31;}
      else{x=59.0-((i%3)*.18);z=8+t*31;}
      const r=.07+((i*13)%8)*.018, col=['#5b5752','#777067','#45464a','#938675'][i%4];
      ellipsoid4(a,x,.07+r*.3,z,r*1.4,r*.48,r,col,1,6,4);
    }
    // Boulons et renforts des caisses, pour des silhouettes plus crédibles.
    for(const [x,z] of [[10.5,15.5],[53.5,18.5],[25.8,36.3],[38.2,36.3]]) {
      for(const dx of [-.39,.39]) for(const dz of [-.36,.36]) cylinder4(a,x+dx,.76,z+dz,.035,.035,'#c2a36c',2,8,.035);
    }
    return a;
  }
  const VERT4 = `
    attribute vec3 aPosition; attribute vec3 aNormal; attribute vec4 aColor; attribute float aMaterial;
    uniform mat4 uProjection; uniform mat4 uView;
    varying vec3 vPosition; varying vec3 vNormal; varying vec4 vColor; varying float vMaterial;
    void main(){ vPosition=aPosition; vNormal=aNormal; vColor=aColor; vMaterial=aMaterial; gl_Position=uProjection*uView*vec4(aPosition,1.0); }
  `;
  const FRAG4 = `
    precision mediump float;
    uniform vec3 uCamera; uniform vec3 uTorch0; uniform vec3 uTorch1; uniform vec3 uTorch2; uniform vec3 uTorch3; uniform float uTime;
    varying vec3 vPosition; varying vec3 vNormal; varying vec4 vColor; varying float vMaterial;
    float hash21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123); }
    float hash31(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123); }
    float noise2(vec2 p){
      vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash21(i),hash21(i+vec2(1.0,0.0)),f.x),mix(hash21(i+vec2(0.0,1.0)),hash21(i+vec2(1.0,1.0)),f.x),f.y);
    }
    float pointLight(vec3 pos, vec3 N, vec3 V, float power, float radius){
      vec3 delta=pos-vPosition; float d=length(delta); vec3 L=delta/max(d,.001);
      float att=pow(max(0.0,1.0-d/radius),2.0)*power;
      float diff=max(dot(N,L),0.0); vec3 H=normalize(L+V);
      float roughSpec=pow(max(dot(N,H),0.0),28.0);
      return (diff*.72+roughSpec*.55)*att;
    }
    void main(){
      vec3 N=normalize(vNormal); vec3 V=normalize(uCamera-vPosition); vec3 base=vColor.rgb;
      float broad=noise2(vPosition.xz*.72), fine=noise2(vPosition.xz*7.0+vPosition.yy*2.1);
      float grain=noise2(vPosition.xy*24.0+vPosition.zy*13.0);
      float seam=0.0, cavity=1.0, roughness=.78;
      if(vMaterial<.5){
        // Dalles en pierre : joints irréguliers, grain, taches d'humidité et fissures fines.
        vec2 q=vPosition.xz*.82; vec2 f=fract(q); seam=max(1.0-smoothstep(.018,.045,f.x),1.0-smoothstep(.018,.045,f.y));
        float grout=1.0-seam*.48; float stains=noise2(vPosition.xz*1.7)*.20+noise2(vPosition.xz*4.8)*.08;
        float cracks=step(.986,noise2(floor(vPosition.xz*3.4)+.17))*step(.25,grain);
        base*=(.69+broad*.20+fine*.13+stains); base*=grout; base=mix(base,base*.43,cracks*.42); roughness=.91;
      } else if(vMaterial<1.5){
        // Blocs de forteresse, joints décalés et arêtes usées.
        vec2 plane=abs(N.y)>.5?vPosition.xz:(abs(N.x)>.5?vPosition.zy:vPosition.xy);
        vec2 q=vec2(plane.x*.92+floor(plane.y*.78)*.48,plane.y*.78); vec2 f=fract(q);
        seam=max(1.0-smoothstep(.018,.07,f.x),1.0-smoothstep(.025,.085,f.y));
        float pores=noise2(plane*10.0)*.27+noise2(plane*31.0)*.10;
        float edgeWear=1.0-smoothstep(.0,.07,min(min(f.x,1.0-f.x),min(f.y,1.0-f.y)));
        float chips=step(.972,noise2(floor(plane*15.0)+floor(vPosition.y*4.0)));
        base*=.66+pores; base*=1.0-seam*.38; base=mix(base,base*.56,edgeWear*.12+chips*.28); roughness=.94;
      } else if(vMaterial<2.5){
        // Acier rayé, reflets étroits et zones oxydées.
        float scratch=step(.78,noise2(vec2(vPosition.x*47.0+vPosition.y*3.0,vPosition.z*6.0)));
        float brushed=.82+.18*sin(vPosition.y*110.0+noise2(vPosition.xz*9.0)*4.0);
        float rust=step(.78,noise2(vPosition.xz*3.0+vPosition.yy));
        base*=brushed*(.68+fine*.16); base=mix(base,vec3(.67,.30,.15),rust*.17); base=mix(base,vec3(.82,.86,.85),scratch*.24); roughness=.28;
      } else if(vMaterial<3.5){
        // Peau de patate : pores, petites taches, nuances chaudes et relief simulé.
        float freckles=step(.78,noise2(vPosition.xz*31.0+vPosition.yy*17.0));
        float pores=step(.67,hash31(floor(vPosition*52.0)));
        float mottling=noise2(vPosition.xz*8.0+vPosition.yy*3.0);
        base*=.80+mottling*.25+fine*.10; base=mix(base,base*vec3(.48,.35,.25),freckles*.26+pores*.14);
        roughness=.88;
      } else if(vMaterial<4.5){
        // Flamme emissive avec turbulence chaude.
        float flame=.78+.22*sin(uTime*17.0+vPosition.y*8.0+noise2(vPosition.xz*9.0)*4.0);
        base*=flame*1.45; roughness=.4;
      } else if(vMaterial<5.5){
        // Cuir, tissus et armures peintes.
        float weave=.93+.07*sin(vPosition.x*55.0)*sin(vPosition.y*49.0);
        float dirt=noise2(vPosition.xz*11.0)*.18;
        base*=weave*(.78+fine*.16+dirt); roughness=.66;
      } else {
        // Marques d'alerte et magie royale.
        base*=1.0+.14*sin(uTime*5.0+vPosition.y*2.0); roughness=.3;
      }
      // Lumière ambiante hémisphérique, lumière principale chaude et occlusion procédurale.
      vec3 sunDir=normalize(vec3(-.48,.83,.29));
      float ndl=max(dot(N,sunDir),0.0);
      float hemi=mix(.17,.39,clamp(N.y*.5+.5,0.0,1.0));
      float microAO=1.0-(seam*.24+max(0.0,.5-broad)*.13+cavity*.0);
      vec3 lit=base*(hemi+ndl*.83)*microAO;
      vec3 H=normalize(sunDir+V); float specPow=mix(64.0,9.0,roughness);
      float spec=pow(max(dot(N,H),0.0),specPow)*(1.0-roughness)*.40;
      lit+=vec3(.95,.82,.66)*spec;
      float warm=pointLight(uTorch0,N,V,1.0,11.5)+pointLight(uTorch1,N,V,1.0,11.5)+pointLight(uTorch2,N,V,1.0,11.5)+pointLight(uTorch3,N,V,1.0,11.5);
      lit+=base*vec3(1.0,.39,.16)*warm;
      if(vMaterial>3.5 && vMaterial<4.5) lit=base*(1.05+.42*sin(uTime*17.0+vPosition.y*6.0));
      if(vMaterial>5.5) lit=base*(1.15+.24*sin(uTime*8.0+vPosition.x*2.0));
      // Lueur douce près des torches, brume et courbe de contraste cinématique.
      float dist=length(uCamera-vPosition); float fog=smoothstep(30.0,62.0,dist);
      vec3 fogColor=vec3(.105,.115,.145); lit=mix(lit,fogColor,fog);
      lit=max(lit,vec3(0.0)); lit=lit/(lit+vec3(.48)); lit=pow(lit,vec3(.88));
      gl_FragColor=vec4(lit,vColor.a);
    }
  `;
  function shader4(gl,type,source){ const sh=gl.createShader(type); gl.shaderSource(sh,source); gl.compileShader(sh); if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)||'Shader compile failed'); return sh; }
  function perspective4(fovy,aspect,near,far){ const f=1/Math.tan(fovy/2), nf=1/(near-far), out=new Float32Array(16); out[0]=f/aspect; out[5]=f; out[10]=(far+near)*nf; out[11]=-1; out[14]=(2*far*near)*nf; return out; }
  function lookAt4(eye,center,up){
    let z=norm4([eye[0]-center[0],eye[1]-center[1],eye[2]-center[2]]), x=norm4(cross4(up,z)), y=cross4(z,x); const out=new Float32Array(16);
    out[0]=x[0];out[1]=y[0];out[2]=z[0];out[3]=0; out[4]=x[1];out[5]=y[1];out[6]=z[1];out[7]=0; out[8]=x[2];out[9]=y[2];out[10]=z[2];out[11]=0;
    out[12]=-dot4(x,eye);out[13]=-dot4(y,eye);out[14]=-dot4(z,eye);out[15]=1; return out;
  }
  function initWebGL4(){
    if(GL4 && GL4.ready) return true;
    let gl;
    try { gl=cv4.getContext('webgl',{alpha:false,antialias:true,depth:true,stencil:false,powerPreference:'high-performance'}); } catch(_){ gl=null; }
    if(!gl){ GL4={ready:false}; cv4.style.display='none'; overlay4.style.display='none'; cv.style.display='block'; return false; }
    try {
      const program=gl.createProgram(); gl.attachShader(program,shader4(gl,gl.VERTEX_SHADER,VERT4)); gl.attachShader(program,shader4(gl,gl.FRAGMENT_SHADER,FRAG4)); gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)||'WebGL link failed');
      const locations={aPosition:gl.getAttribLocation(program,'aPosition'),aNormal:gl.getAttribLocation(program,'aNormal'),aColor:gl.getAttribLocation(program,'aColor'),aMaterial:gl.getAttribLocation(program,'aMaterial'),uProjection:gl.getUniformLocation(program,'uProjection'),uView:gl.getUniformLocation(program,'uView'),uCamera:gl.getUniformLocation(program,'uCamera'),uTorch0:gl.getUniformLocation(program,'uTorch0'),uTorch1:gl.getUniformLocation(program,'uTorch1'),uTorch2:gl.getUniformLocation(program,'uTorch2'),uTorch3:gl.getUniformLocation(program,'uTorch3'),uTime:gl.getUniformLocation(program,'uTime')};
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      const world=buildFortressWorld4(),staticBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,staticBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(world),gl.STATIC_DRAW);
      const dynamicBuffer=gl.createBuffer();
      GL4={gl,program,locations,staticBuffer,staticCount:world.length/11,dynamicBuffer,ready:true,buildTime:performance.now()};
      return true;
    } catch(err){ console.error('Niveau 4 WebGL indisponible :',err); GL4={ready:false}; cv4.style.display='none'; overlay4.style.display='none'; cv.style.display='block'; return false; }
  }
  function bindBuffer4(buffer){
    const gl=GL4.gl,L=GL4.locations; gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const stride=11*4; for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aColor',4,6],['aMaterial',1,10]]) { const loc=L[name]; gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset*4); }
  }
  function pushRound4(out,cx,cz,r,y,color,mat=6,segments=36){
    const inner=r*.78;
    for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
      const p0=[cx+Math.cos(a)*inner,y,cz+Math.sin(a)*inner],p1=[cx+Math.cos(a)*r,y,cz+Math.sin(a)*r],p2=[cx+Math.cos(b)*r,y,cz+Math.sin(b)*r],p3=[cx+Math.cos(b)*inner,y,cz+Math.sin(b)*inner];
      quad4(out,p0,p1,p2,p3,color,mat);
    }
  }
  function potatoMesh4(out,e,p,t){
    const x=e.x,z=e.y,base=terrainHeight64(x,z)+(e.boss?.62:0),s=e.scale||1,ang=Math.atan2(p.y-z,p.x-x),fx=Math.cos(ang),fz=Math.sin(ang),rx=-fz,rz=fx;
    // Ombre de contact, chaussures et corps principal texturé comme une peau de pomme de terre.
    ellipsoid4(out,x,base+.035,z,.42*s,.045*s,.32*s,'#181a1e',2,10,5);
    ellipsoid4(out,x-fx*.11*s,base+.14*s,z-fz*.11*s,.15*s,.13*s,.16*s,'#2c2727',2,8,5);
    ellipsoid4(out,x+fx*.14*s,base+.14*s,z+fz*.14*s,.15*s,.13*s,.16*s,'#302a29',2,8,5);
    ellipsoid4(out,x,base+.73*s,z,.47*s,.64*s,.43*s,e.skin||'#b98051',3,18,12);
    // Petites lenticelles, cicatrices et variations de peau visibles à courte distance.
    for(let k=0;k<9;k++) {
      const a=k*2.39996+(e.seed||e.x*3.1), px=x+Math.cos(a)*(.30+((k%3)*.035))*s, pz=z+Math.sin(a)*(.27+((k%4)*.025))*s;
      const py=base+(.48+((k*17)%11)/20)*s;
      ellipsoid4(out,px,py,pz,.025*s,.018*s,.018*s,k%3===0?'#704532':'#d49a69',3,5,3);
    }
    ellipsoid4(out,x-fx*.02*s,base+.49*s,z-fz*.02*s,.36*s,.32*s,.35*s,e.outfit||'#7e3540',5,14,9);
    // Ceinture, boucles, plaques de protection et coutures sur les uniformes.
    box4(out,x,base+.36*s,z,.66*s,.075*s,.52*s,e.boss?'#34383d':'#4a3830',2,Math.PI/2-ang);
    box4(out,x+fx*.02*s,base+.37*s,z+fz*.02*s,.15*s,.10*s,.08*s,e.boss?'#e0b75e':'#b18a4d',2,Math.PI/2-ang);
    for(const side of [-1,1]) {
      ellipsoid4(out,x+rx*.34*s+fx*.02*s,base+.72*s,z+rz*.34*s+fz*.02*s,.17*s,.16*s,.15*s,e.boss?'#666a70':'#6c5544',2,9,6);
      ellipsoid4(out,x+rx*.34*s+fx*.02*s,base+.72*s,z+rz*.34*s+fz*.02*s,.115*s,.105*s,.11*s,e.boss?'#99958a':'#92765c',2,8,5);
    }
    // Bras articulés, gants et manchettes.
    ellipsoid4(out,x+rx*.39*s-fx*.04*s,base+.57*s,z+rz*.39*s-fz*.04*s,.14*s,.22*s,.14*s,e.outfit||'#7e3540',5,9,6);
    ellipsoid4(out,x-rx*.39*s-fx*.04*s,base+.57*s,z-rz*.39*s-fz*.04*s,.14*s,.22*s,.14*s,e.outfit||'#7e3540',5,9,6);
    ellipsoid4(out,x+rx*.43*s+fx*.01*s,base+.45*s,z+rz*.43*s+fz*.01*s,.105*s,.10*s,.10*s,'#d5a16c',3,8,5);
    ellipsoid4(out,x-rx*.43*s+fx*.01*s,base+.45*s,z-rz*.43*s+fz*.01*s,.105*s,.10*s,.10*s,'#d5a16c',3,8,5);
    // Face visible depuis la direction du joueur : deux yeux, pupilles, sourcils et bouche.
    for(const side of [-1,1]){
      const ex=x+fx*.345*s+rx*.145*s*side, ez=z+fz*.345*s+rz*.145*s*side;
      ellipsoid4(out,ex,base+.91*s,ez,.091*s,.103*s,.071*s,'#eee8d8',3,9,6);
      ellipsoid4(out,ex+fx*.044*s,base+.913*s,ez+fz*.044*s,.044*s,.052*s,.034*s,'#202328',2,8,5);
      box4(out,ex,base+1.045*s,ez,.16*s,.045*s,.06*s,(side===-1?'#463029':'#4e3029'),2,Math.PI/2-ang+(side*.12));
    }
    ellipsoid4(out,x+fx*.405*s,base+.70*s,z+fz*.405*s,.075*s,.043*s,.055*s,'#4c2824',2,8,5);
    // Détails de classe : casque, bandana, armure et accessoires.
    if(e.role==='tank'){
      ellipsoid4(out,x,base+1.22*s,z,.45*s,.19*s,.42*s,'#4a5055',2,10,6);
      box4(out,x,base+1.30*s,z,.65*s,.11*s,.50*s,'#82888a',2);
    } else if(e.role==='runner'){
      box4(out,x,base+1.11*s,z,.70*s,.10*s,.50*s,'#b53b32',5,Math.PI/2-ang);
      box4(out,x-fx*.30*s,base+1.04*s,z-fz*.30*s,.30*s,.075*s,.12*s,'#dc5344',5,Math.PI/2-ang);
    } else if(e.role==='scout'){
      ellipsoid4(out,x,base+1.18*s,z,.34*s,.10*s,.30*s,'#4c7958',5,9,6);
    } else if(e.boss){
      // Armure royale à rivets, manteau en pans et emblème gravé.
      ellipsoid4(out,x-fx*.12*s,base+.68*s,z-fz*.12*s,.51*s,.58*s,.48*s,'#4b202d',5,16,10);
      // Cape lourde en trois panneaux triangulaires qui suivent la silhouette du boss.
      const capeTop=[x-fx*.22*s,base+1.03*s,z-fz*.22*s], capeLeft=[x+rx*.42*s-fx*.12*s,base+.15*s,z+rz*.42*s-fz*.12*s], capeRight=[x-rx*.42*s-fx*.12*s,base+.15*s,z-rz*.42*s-fz*.12*s], capeBottom=[x-fx*.20*s,base+.06*s,z-fz*.20*s];
      tri4(out,capeTop,capeLeft,capeBottom,'#521b2b',5); tri4(out,capeTop,capeBottom,capeRight,'#6d2634',5);
      box4(out,x,base+.89*s,z,.93*s,.13*s,.76*s,'#777b7e',2,Math.PI/2-ang);
      ellipsoid4(out,x+fx*.47*s,base+.83*s,z+fz*.47*s,.09*s,.09*s,.055*s,'#e0b45b',5,8,5);
      box4(out,x,base+1.16*s,z,.86*s,.18*s,.70*s,'#4c5159',2,Math.PI/2-ang);
      for(let j=-1;j<=1;j++) ellipsoid4(out,x+rx*j*.22*s,base+1.20*s,z+rz*j*.22*s,.08*s,.08*s,.08*s,'#d3a84f',5,7,5);
      box4(out,x,base+1.39*s,z,.82*s,.13*s,.64*s,'#d1a747',5,Math.PI/2-ang);
      for(let j=-2;j<=2;j++) cone4(out,x+rx*j*.15*s,base+1.58*s,z+rz*j*.15*s,.10*s,.36*s,(j===0?'#ffe293':'#c99736'),5,6);
      ellipsoid4(out,x,base+1.39*s,z,.12*s,.12*s,.09*s,'#b32b36',5,8,6);
    } else {
      ellipsoid4(out,x,base+1.16*s,z,.28*s,.10*s,.25*s,e.outfit||'#7e3540',5,9,6);
    }
    // Pistolet individuellement modélisé : carcasse, culasse, poignée, canon et viseur.
    if(e.armed){
      const gx=x+fx*.47*s+rx*.27*s, gz=z+fz*.47*s+rz*.27*s, gy=base+.57*s, yaw=Math.PI/2-ang;
      box4(out,gx,gy,gz,.21*s,.16*s,.34*s,'#363d43',2,yaw);
      box4(out,gx,gy+.065*s,gz-.015*s,.18*s,.085*s,.27*s,'#858d91',2,yaw);
      box4(out,gx,gy-.12*s,gz-.015*s,.13*s,.20*s,.14*s,'#4f3830',2,yaw);
      box4(out,gx,gy+.025*s,gz+.20*s,.105*s,.095*s,.22*s,'#202931',2,yaw);
      ellipsoid4(out,gx,gy+.04*s,gz+.29*s,.045*s,.043*s,.03*s,'#e2b06c',4,6,4);
    }
    if(e.hp<e.maxHp && !e.boss) {
      const pct=Math.max(.05,e.hp/e.maxHp); box4(out,x,base+1.42*s,z,.64*s,.055*s,.075*s,'#1e2127',2); box4(out,x-(1-pct)*.30*s,base+1.43*s,z,.60*s*pct,.06*s,.08*s,'#d94b3f',4);
    }
  }
  function appendWeaponWorld4(out,p,eye,dir){
    // Blaster FPS modélisé en volume et attaché à la caméra, avec pièces métalliques distinctes.
    const forward=norm4(dir), worldUp=[0,1,0], right=norm4(cross4(forward,worldUp)), up=norm4(cross4(right,forward));
    const origin=[eye[0]+forward[0]*.72+right[0]*.31-up[0]*.25,
                  eye[1]+forward[1]*.72+right[1]*.31-up[1]*.25,
                  eye[2]+forward[2]*.72+right[2]*.31-up[2]*.25];
    const local=[];
    // Carcasse en polymère, culasse acier, canon, poignée et rail supérieur.
    box4(local,0,0,.19,.34,.19,.62,'#263b43',2);
    box4(local,0,.075,.16,.29,.075,.50,'#6d858b',2);
    box4(local,0,.005,.48,.22,.12,.25,'#17262d',2);
    cylinder4(local,0,.01,.62,.073,.26,'#4b5b61',2,12,.066);
    cylinder4(local,0,.01,.755,.052,.025,'#111a20',2,12,.052);
    cylinder4(local,0,.01,.772,.031,.018,'#a9c3c8',2,12,.031);
    box4(local,0,-.16,.02,.19,.29,.22,'#33434a',2,-.10);
    box4(local,0,-.285,.015,.21,.055,.23,'#17272d',2,-.10);
    box4(local,0,.15,.08,.12,.065,.25,'#263238',2);
    box4(local,0,.19,.08,.08,.025,.14,'#b0c5c5',2);
    box4(local,-.105,.065,.17,.025,.045,.34,'#d19b43',5);
    box4(local,.105,.065,.17,.025,.045,.34,'#d19b43',5);
    box4(local,0,-.065,.11,.105,.028,.10,'#101b20',2);
    // Vis et petits éléments lumineux intégrés au boîtier.
    for(const x of [-.125,.125]) for(const z of [-.06,.12,.30]) ellipsoid4(local,x,.105,z,.014,.014,.014,'#d9e2df',2,6,4);
    box4(local,.055,.015,.30,.035,.018,.09,'#55d7ca',5);
    box4(local,-.055,.015,.30,.035,.018,.09,'#55d7ca',5);
    if(p.muzzleT>0){
      const pulse=.9+Math.sin(p.t*95)*.12;
      ellipsoid4(local,0,.01,.87,.09*pulse,.075*pulse,.13*pulse,'#ff9a38',4,10,7);
      ellipsoid4(local,0,.01,.91,.045*pulse,.045*pulse,.075*pulse,'#fff0ba',4,8,6);
    }
    // Conversion du repère local de l'arme en repère monde caméra.
    for(let i=0;i<local.length;i+=11){
      const x=local[i],y=local[i+1],z=local[i+2];
      local[i]=origin[0]+right[0]*x+up[0]*y+forward[0]*z;
      local[i+1]=origin[1]+right[1]*x+up[1]*y+forward[1]*z;
      local[i+2]=origin[2]+right[2]*x+up[2]*y+forward[2]*z;
      const nx=local[i+3],ny=local[i+4],nz=local[i+5];
      local[i+3]=right[0]*nx+up[0]*ny+forward[0]*nz;
      local[i+4]=right[1]*nx+up[1]*ny+forward[1]*nz;
      local[i+5]=right[2]*nx+up[2]*ny+forward[2]*nz;
    }
    out.push(...local);
  }
  function dynamicWorld4(p,eye,dir){
    const a=[];
    // Patates armées/poursuivantes et boss avec silhouette 3D, pas des sprites plats.
    for(const e of p.enemies) if(e.hp>0 && e.active) potatoMesh4(a,e,p,p.t);
    // Projectiles en volume avec des noyaux lumineux.
    for(const b of p.enemyShots){ ellipsoid4(a,b.x,b.z,b.y,.095,.095,.095,b.color||'#ff6b37',4,8,5); ellipsoid4(a,b.x,b.z,b.y,.035,.035,.035,'#f3f3f3',4,6,4); }
    for(const fx of p.fx){ if(fx.z!=null) ellipsoid4(a,fx.x,fx.z,fx.y,fx.big?.17:.075,fx.big?.17:.075,fx.big?.17:.075,fx.hit?'#ff5147':fx.crack?'#f4b64e':'#fff0a3',4,7,4); }
    for(const pk of p.pickups){ const bob=.15*Math.sin(p.t*3+pk.x); ellipsoid4(a,pk.x,terrainHeight64(pk.x,pk.y)+.55+bob,pk.y,.20,.22,.20,pk.type==='shield'?'#58b9ff':pk.type==='speed'?'#fa67dc':'#87e77f',4,8,6); }
    // Zone rouge annoncée avant l'impact : le joueur peut la quitter ou sauter.
    if(p.bossWarning){ const w=p.bossWarning, col=w.phase===3?'#ff2c24':w.phase===2?'#f06e32':'#e2a344'; pushRound4(a,w.x,w.y,w.r,terrainHeight64(w.x,w.y)+.045,col,6,36); }
    appendWeaponWorld4(a,p,eye,dir);
    return a;
  }
  function setAttr4(gl,loc,size,offset){ gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,44,offset*4); }
  function renderWebGL4(){
    if(!L3) initL3(); if(!GL4 || !GL4.ready){ ctx=mainCtx; mainCtx.clearRect(0,0,W,H); draw3(); return; }
    const p=L3, gl=GL4.gl,L=GL4.locations;
    const dpr=Math.min(2.0,window.devicePixelRatio||1), cw=Math.max(W,Math.floor(cv4.clientWidth*dpr)), ch=Math.max(H,Math.floor(cv4.clientHeight*dpr));
    if(cv4.width!==cw||cv4.height!==ch){cv4.width=cw;cv4.height=ch;overlay4.width=W;overlay4.height=H;}
    gl.viewport(0,0,cv4.width,cv4.height); gl.clearColor(.055,.06,.078,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const yaw=p.camYaw==null?p.ang:p.camYaw, pitch=clamp(p.pitch||0,-1.0,1.0), eye=[p.x,terrainHeight64(p.x,p.y)+1.63+(p.jumpZ||0),p.y];
    const dir=[Math.cos(yaw)*Math.cos(pitch),Math.sin(pitch),Math.sin(yaw)*Math.cos(pitch)];
    const center=[eye[0]+dir[0],eye[1]+dir[1],eye[2]+dir[2]];
    const projection=perspective4(69*Math.PI/180,cv4.width/cv4.height,.045,100),view=lookAt4(eye,center,[0,1,0]);
    gl.useProgram(GL4.program); gl.uniformMatrix4fv(L.uProjection,false,projection); gl.uniformMatrix4fv(L.uView,false,view); gl.uniform3f(L.uCamera,eye[0],eye[1],eye[2]); gl.uniform1f(L.uTime,p.t);
    const lights=[[8.5,1.5,8.5],[55.5,1.5,8.5],[8.5,1.5,39.5],[55.5,1.5,39.5],[23.5,1.4,20.5],[40.5,1.4,20.5],[27.5,1.7,10.5],[37.5,1.7,10.5],[27.5,1.2,38.2],[37.5,1.2,38.2],[24.5,1.2,29.4],[39.5,1.2,29.4],[25.5,1.25,18.7],[38.5,1.25,18.7]];
    lights.sort((a,b)=>Math.hypot(a[0]-p.x,a[2]-p.y)-Math.hypot(b[0]-p.x,b[2]-p.y));
    for(let i=0;i<4;i++) gl.uniform3f(L['uTorch'+i],lights[i][0],lights[i][1],lights[i][2]);
    bindBuffer4(GL4.staticBuffer); gl.drawArrays(gl.TRIANGLES,0,GL4.staticCount);
    const dyn=dynamicWorld4(p,eye,dir); gl.bindBuffer(gl.ARRAY_BUFFER,GL4.dynamicBuffer); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(dyn),gl.DYNAMIC_DRAW); bindBuffer4(GL4.dynamicBuffer); gl.drawArrays(gl.TRIANGLES,0,dyn.length/11);
    drawHudWebGL4(p);
  }
  function drawHudWebGL4(p){
    const c=overlay4Ctx; c.clearRect(0,0,W,H); c.save();
    // Vignette cinématique, lampe chaude et damage flash léger.
    const vg=c.createRadialGradient(W/2,H/2,90,W/2,H/2,490); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(5,7,12,.48)'); c.fillStyle=vg; c.fillRect(0,0,W,H);
    if(p.inv>0 && Math.floor(p.t*18)%2===0){ c.fillStyle='rgba(255,38,31,.14)'; c.fillRect(0,0,W,H); }
    // Panneau gauche : santé, vies, chronomètre et score de combat.
    const panel=(x,y,w,h)=>{c.fillStyle='rgba(14,17,22,.78)';c.beginPath();c.roundRect(x,y,w,h,11);c.fill();c.strokeStyle='rgba(212,193,159,.27)';c.lineWidth=1;c.stroke();};
    panel(14,13,197,95); c.textAlign='left'; c.fillStyle='#e8d8bc'; c.font='800 12px system-ui'; c.fillText('FORTERESSE DES PATATES',27,32);
    c.fillStyle='#f4bb65'; c.font='900 18px system-ui'; c.fillText('VIES  '+p.lives,27,56);
    c.fillStyle='#ddd'; c.font='700 11px system-ui'; c.fillText('INTÉGRITÉ',27,75);
    c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(27,82,166,8); c.fillStyle=p.health>55?'#7fcb9a':p.health>28?'#e7b85e':'#e65d4d'; c.fillRect(27,82,166*Math.max(0,p.health)/100,8);
    // Chrono centré.
    panel(W/2-52,13,104,48); c.textAlign='center'; c.fillStyle='#f4ecd9'; c.font='900 22px system-ui'; c.fillText(`${Math.ceil(g.time)}s`,W/2,44);
    // Barre de vie du boss, toujours très visible.
    const boss=p.enemies.find(e=>e.boss), bx=214, by=17, bw=372;
    c.fillStyle='#f0d6b1'; c.font='900 12px system-ui'; c.fillText(boss && boss.hp>0 ? `ROI PATATE  ·  PHASE ${boss.phase||1}` : 'ROI PATATE',W/2,81);
    c.fillStyle='rgba(8,9,12,.86)'; c.fillRect(bx,89,bw,14); c.fillStyle='#57262a'; c.fillRect(bx+2,91,bw-4,10);
    if(boss && boss.hp>0){ const f=Math.max(0,boss.hp/boss.maxHp); const grad=c.createLinearGradient(bx,0,bx+bw,0); grad.addColorStop(0,'#a42b31');grad.addColorStop(.55,'#e3573c');grad.addColorStop(1,'#efb456'); c.fillStyle=grad;c.fillRect(bx+2,91,(bw-4)*f,10); }
    // Surchauffe : ce n'est pas décoratif, la jauge est liée à la mécanique de tir.
    panel(14,H-86,238,70); c.textAlign='left'; c.fillStyle=p.overheated?'#ff755e':'#d9d6ce'; c.font='900 12px system-ui'; c.fillText(p.overheated?'BLASTER EN SURCHAUFFE':'TEMPÉRATURE DU BLASTER',27,H-64);
    c.fillStyle='rgba(255,255,255,.15)'; c.fillRect(27,H-53,207,13); const hf=Math.max(0,Math.min(1,p.heat/100));
    const hc=hf>.78?'#ff493f':hf>.5?'#f3a145':'#65c6bc'; c.fillStyle=hc;c.fillRect(27,H-53,207*hf,13); c.fillStyle='#fff'; c.font='700 10px system-ui';c.fillText(`${Math.round(p.heat)}%`,217,H-42);
    if(p.overheatLockT>0){c.fillStyle='rgba(32,10,12,.82)';c.fillRect(W/2-100,H/2+42,200,30);c.textAlign='center';c.fillStyle='#ff9a85';c.font='900 13px system-ui';c.fillText(`REFROIDISSEMENT  ${p.overheatLockT.toFixed(1)}s`,W/2,H/2+61);}
    // Viseur précis et marqueur de touche.
    c.strokeStyle=p.hitMarkerT>0?'#ffd76b':'rgba(255,255,255,.94)';c.lineWidth=2;c.beginPath();c.moveTo(W/2-11,H/2);c.lineTo(W/2-4,H/2);c.moveTo(W/2+4,H/2);c.lineTo(W/2+11,H/2);c.moveTo(W/2,H/2-11);c.lineTo(W/2,H/2-4);c.moveTo(W/2,H/2+4);c.lineTo(W/2,H/2+11);c.stroke();
    if(p.hitMarkerT>0){c.lineWidth=2.5;c.beginPath();c.moveTo(W/2-7,H/2-7);c.lineTo(W/2-2,H/2-2);c.moveTo(W/2+7,H/2-7);c.lineTo(W/2+2,H/2-2);c.moveTo(W/2-7,H/2+7);c.lineTo(W/2-2,H/2+2);c.moveTo(W/2+7,H/2+7);c.lineTo(W/2+2,H/2+2);c.stroke();}
    // Le blaster est rendu comme un véritable maillage 3D dans la passe WebGL.
    c.fillStyle='rgba(12,14,18,.72)';c.beginPath();c.roundRect(W-240,H-42,226,28,8);c.fill();c.textAlign='center';c.fillStyle='#d6d2c7';c.font='700 11px system-ui';c.fillText('ZQSD  MOUVEMENT  ·  ESPACE SAUT',W-127,H-24);
    c.textAlign='center';c.fillStyle='rgba(255,238,207,.78)';c.font='700 10px system-ui';c.fillText('Souris : viser  ·  Clic maintenu : tirer  ·  Maj : dash',W/2,H-9);
    if(p.bossWarning){c.fillStyle=`rgba(255,52,33,${.12+.10*Math.sin(p.t*22)})`;c.fillRect(0,0,W,H);c.fillStyle='#ffd5ad';c.font='900 14px system-ui';c.fillText('ATTAQUE DU ROI — ESQUIVE !',W/2,H/2-44);}
    c.restore();
  }

  // =====================================================================
  // NIVEAU 5 — LE COMBAT DE L'ÂME : bullet-hell 2D, entièrement original.
  // Visuel Canvas natif, choix FIGHT / ACT / ITEM / MERCY, esquive et phases.
  // =====================================================================
  const LV5_W = 800, LV5_H = 500;
  // Niveau 5 : rendu à la résolution native pour des contours nets et un texte propre.
  // Les formes rétro sont dessinées en vrais petits blocs plutôt que d'agrandir toute la scène.
  const LV5_PIXEL_SCALE = 1;
  const LV5_PIXEL_W = LV5_W / LV5_PIXEL_SCALE;
  const LV5_PIXEL_H = LV5_H / LV5_PIXEL_SCALE;
  const lv5PixelCanvas = document.createElement('canvas');
  lv5PixelCanvas.width = LV5_PIXEL_W;
  lv5PixelCanvas.height = LV5_PIXEL_H;
  const lv5PixelCtx = lv5PixelCanvas.getContext('2d', { alpha: false });
  lv5PixelCtx.imageSmoothingEnabled = false;
  const LV5_ACTIONS = ['COMBATTRE', 'PARLER', 'OBJET', 'ÉPARGNER'];

  function initLevel5() {
    B5 = {
      t: 0, mode: 'intro', introT: 0, turn: 0, phase: 1,
      bossHp: 170, bossMaxHp: 170, playerHp: 70, maxHp: 70,
      heart: { x: 400, y: 354, r: 7, speed: 220, moving: false, lastX: 0, lastY: -1 },
      box: { x: 180, y: 278, w: 440, h: 150 },
      bullets: [], particles: [], texts: [], stars: Array.from({length: 85}, (_, i) => ({
        x: (i * 137.5 + 19) % LV5_W, y: (i * 73.7 + 11) % LV5_H,
        r: .5 + ((i * 7) % 4) * .35, speed: 3 + (i % 8) * 2,
        phase: i * .73
      })),
      keys: { up:false, down:false, left:false, right:false, dash:false },
      dashWasDown: false, dashCooldown: 0, dashPressed: false,
      touchPointerId: null, touchTarget: null,
      actionIndex: 0, dialogue: 'UNE PATATE SQUELETTE BLOQUE LE PASSAGE. ELLE SOUPIRE.',
      dialogueT: 0, dialogueFullT: 0, respect: 0, snacks: 3,
      invuln: 0, shake: 0, flash: 0, bossFlash: 0, bossAnim: 0,
      modeT: 0, attackT: 0, attackDuration: 4.25, spawnT: .25,
      pattern: 0, attackCount: 0, aimT: 0, aimDuration: 1.4, aimX: 0,
      score: 0, dodges: 0, hitsTaken: 0, over: false, winDelay: 0,
      defeated: false, phaseBanner: 0, selectedAction: 0,
      particlesSeed: 0, combo: 0, lastHit: 0
    };
    setDialogue5('oh. salut.\nje suis patate sans. oui, c’est vraiment mon nom.', 0);
  }

  function setDialogue5(text, speed = 36) {
    if (!B5) return;
    B5.dialogue = text;
    B5.dialogueT = 0;
    B5.dialogueFullT = speed <= 0 ? 0 : text.length / speed;
  }

  function spawnParticles5(x, y, color, amount = 12, power = 90) {
    if (!B5) return;
    for (let i = 0; i < amount; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = power * (.25 + Math.random() * .8);
      B5.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: .3 + Math.random() * .65, max: .95, r: 1 + Math.random() * 2.5, color });
    }
  }

  function floatText5(x, y, text, color = '#ffe29a') {
    B5.texts.push({ x, y, text, color, life: 1.0 });
  }

  function startEnemyPhase5(messageOverride = '') {
    const b = B5;
    if (!b || state !== 'play') return;
    b.mode = 'enemy';
    b.modeT = 0;
    b.attackT = 0;
    b.attackDuration = b.phase === 1 ? 4.25 : b.phase === 2 ? 4.8 : 5.1;
    b.spawnT = .42;
    b.pattern = (b.turn + b.phase) % 3;
    b.attackCount = 0;
    b.hitsAtAttackStart = b.hitsTaken;
    b.bullets = [];
    const lines = b.phase === 1
      ? ['à toi de bouger, la purée.', 'attention aux os… ils sont bio.', 'j’espère que tu as de bons réflexes.']
      : b.phase === 2
        ? ['ok. je vais arrêter de faire semblant.', 'tu esquives mieux que prévu.', 'ça devient un peu croustillant.']
        : ['bon. dernière tournée.', 'plus de blague. enfin… presque.', 'essaie de suivre le rythme maintenant.'];
    setDialogue5(messageOverride || lines[(b.turn + b.attackCount) % lines.length]);
  }

  // Tous les projectiles sont des patates pixelisées. La couleur indique le comportement :
  // orange = danger quand on bouge, bleu = danger quand on reste immobile, doré = toujours dangereux.
  function spawnBone5(side, y, speed, rule = 'any') {
    const b = B5, box = b.box;
    const fromLeft = side < 0;
    const color = rule === 'move' ? '#f49a3d' : rule === 'still' ? '#64d5f2' : '#d7a45f';
    b.bullets.push({
      kind: 'potato', x: fromLeft ? box.x - 18 : box.x + box.w + 18, y,
      vx: (fromLeft ? 1 : -1) * speed, vy: Math.sin(b.attackCount * 1.7) * 8,
      w: 20, h: 16, r: 8.5, rot: 0, spin: (fromLeft ? 1 : -1) * (1.2 + b.phase * .35),
      rule, color, variant: b.attackCount % 3, life: 4.4
    });
  }

  function spawnSeed5(x, y, speed, aimed = true) {
    const b = B5, h = b.heart;
    let vx = (Math.random() - .5) * 85, vy = speed;
    if (aimed) {
      const dx = h.x - x, dy = h.y - y, d = Math.hypot(dx, dy) || 1;
      vx = dx / d * speed; vy = dy / d * speed;
    }
    const skins = ['#d6a05a', '#e5bd79', '#c98c49'];
    b.bullets.push({
      kind: 'potato', x, y, vx, vy, r: 8, w: 18, h: 15,
      rot: 0, spin: rand(-2.7, 2.7), rule: 'any', color: pick(skins),
      variant: Math.floor(Math.random() * 3), life: 4.2
    });
  }

  function spawnAttack5() {
    const b = B5, box = b.box, phase = b.phase;
    const side = Math.random() < .5 ? -1 : 1;
    if (phase === 1) {
      if (b.attackCount % 5 === 4) {
        // Pluie de patates en diagonale : une ouverture reste toujours disponible.
        const lane = box.x + 30 + Math.random() * (box.w - 60);
        for (let i = 0; i < 3; i++) spawnSeed5(lane + (i-1)*48, box.y - 10 - i*12, 145 + i*18, false);
      } else if (b.pattern === 0 || Math.random() < .58) {
        const rules = ['any', 'move', 'still'];
        const rule = b.attackCount % 3 === 0 ? 'any' : rules[(b.attackCount % 2) + 1];
        spawnBone5(side, box.y + 17 + Math.random() * (box.h - 34), 195 + phase * 23, rule);
      } else {
        spawnSeed5(box.x + 25 + Math.random() * (box.w - 50), box.y - 8, 165 + phase * 16, false);
      }
    } else if (phase === 2) {
      if (b.attackCount % 7 === 6) {
        // Anneau coloré : les patates partent dans huit directions.
        const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
        const palette = ['#ff4d6d','#ff9f1c','#ffe66d','#70e000','#00bbf9','#9b5de5','#f15bb5','#ffffff'];
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + b.attackCount * .12;
          b.bullets.push({kind:'potato',x:cx,y:cy,vx:Math.cos(a)*155,vy:Math.sin(a)*115,w:19,h:16,r:8,rot:a,spin:2.4,rule:'any',color:palette[i],variant:i%3,life:3.2});
        }
      } else if (b.attackCount % 5 === 4) {
        // Double spirale de patates colorées, qui converge vers le cœur.
        const cx = box.x + box.w/2, cy = box.y + box.h/2;
        for (let i = 0; i < 6; i++) {
          const a = b.attackCount * .72 + i * Math.PI/3;
          const colors = ['#ff6b6b','#ffc857','#7bdff2','#b2f7a5','#c7a0ff','#ff9fda'];
          b.bullets.push({kind:'potato',x:cx+Math.cos(a)*125,y:cy+Math.sin(a)*70,vx:-Math.cos(a)*105,vy:-Math.sin(a)*105,w:18,h:15,r:8,rot:a,spin:2,rule:'any',color:colors[i],variant:i%3,life:3.4});
        }
      } else if (b.attackCount % 3 === 0) {
        // Deux os laissent une ouverture au milieu : le joueur doit se décaler.
        const gapY = box.y + 38 + Math.random() * (box.h - 76);
        const y1 = Math.max(box.y + 12, gapY - 29);
        const y2 = Math.min(box.y + box.h - 12, gapY + 29);
        spawnBone5(side, y1, 232, b.attackCount % 2 ? 'move' : 'any');
        spawnBone5(-side, y2, 232, b.attackCount % 2 ? 'still' : 'any');
        if (b.phase >= 2) spawnSeed5(box.x + 20 + Math.random() * (box.w - 40), box.y - 8, 178, false);
      } else if (Math.random() < .5) {
        spawnSeed5(box.x + 15 + Math.random() * (box.w - 30), box.y - 7, 184, false);
      } else {
        spawnSeed5(box.x + (side < 0 ? 8 : box.w - 8), box.y + 10 + Math.random() * (box.h - 20), 198, true);
      }
    } else {
      // Phase finale : cadence plus rapide, os et graines visent des trajectoires différentes.
      if (b.attackCount % 6 === 5) {
        // Croix de patates : deux vagues croisées avec des couleurs distinctes.
        const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
        const palette = ['#ff3864','#ff9f1c','#ffe66d','#06d6a0','#00bbf9','#a78bfa'];
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3 + b.attackCount * .25;
          b.bullets.push({kind:'potato',x:cx,y:cy,vx:Math.cos(a)*205,vy:Math.sin(a)*150,w:20,h:17,r:9,rot:a,spin:3,rule:'any',color:palette[i],variant:i%3,life:2.8});
        }
      } else if (b.attackCount % 5 === 4) {
        // Rafale en éventail de cinq patates lumineuses.
        const fromX = side < 0 ? box.x + 8 : box.x + box.w - 8;
        const fromY = box.y + box.h/2;
        const palette = ['#ff5d73','#ffb84d','#ffe66d','#6ee7d8','#a78bfa'];
        for(let i=0;i<5;i++){ const a=(-.8+i*.4)*(side<0?1:-1); b.bullets.push({kind:'potato',x:fromX,y:fromY,vx:Math.cos(a)*260*(side<0?1:-1),vy:Math.sin(a)*260,w:19,h:16,r:8,rot:a,spin:2.5,rule:'any',color:palette[i],variant:i%3,life:3.1}); }
      } else if (b.attackCount % 4 === 0) {
        const gapY = box.y + 27 + Math.random() * (box.h - 54);
        spawnBone5(side, gapY - 32, 274, 'move');
        spawnBone5(-side, gapY + 32, 274, 'still');
        spawnSeed5(box.x + 20 + Math.random() * (box.w - 40), box.y - 8, 218, false);
      } else if (b.attackCount % 2 === 0) {
        spawnSeed5(box.x + (side < 0 ? 10 : box.w - 10), box.y + 18 + Math.random() * (box.h - 36), 232, true);
        spawnSeed5(box.x + (side < 0 ? box.w - 12 : 12), box.y + 20 + Math.random() * (box.h - 40), 205, true);
      } else {
        spawnSeed5(box.x + 30 + Math.random() * (box.w - 60), box.y - 5, 218, false);
        spawnSeed5(box.x + 25 + Math.random() * (box.w - 50), box.y - 12, 192, false);
      }
    }
    b.attackCount++;
  }

  function chooseAction5(index) {
    const b = B5;
    if (!b || state !== 'play') return;
    if (b.mode === 'intro') {
      b.mode = 'choice'; b.actionIndex = 0;
      setDialogue5('c’est ton tour. choisis bien. je regarde.');
      return;
    }
    if (b.mode !== 'choice') return;
    b.actionIndex = (index + LV5_ACTIONS.length) % LV5_ACTIONS.length;
    if (b.actionIndex === 0) {
      b.mode = 'aim'; b.modeT = 0; b.aimT = 0; b.aimX = 0;
      setDialogue5('tu lèves ton blaster.\nappuie au bon moment pour viser le cœur de la patate.');
    } else if (b.actionIndex === 1) {
      b.respect++;
      b.score += 15;
      spawnParticles5(400, 145, '#b5f4f0', 10, 45);
      const talk = b.respect === 1
        ? 'tu lui demandes sa recette.\n« sel, poivre, et une mauvaise décision. »'
        : b.respect === 2
          ? 'tu lui racontes une blague de patate.\nil sourit malgré lui. c’est gênant.'
          : 'tu lui rappelles qu’il reste une patate\nà l’intérieur de cette armure. il hésite.';
      setDialogue5(talk);
      startEnemyPhase5(talk);
    } else if (b.actionIndex === 2) {
      if (b.snacks > 0 && b.playerHp < b.maxHp) {
        const old = b.playerHp;
        b.playerHp = Math.min(b.maxHp, b.playerHp + 20);
        b.snacks--;
        b.score += 5;
        floatText5(500, 310, '+' + (b.playerHp - old) + ' PV', '#9af7b2');
        setDialogue5('tu manges des frites de secours.\nça n’a aucun sens. mais ça marche.');
      } else if (b.snacks <= 0) {
        setDialogue5('le sac est vide.\nla dernière frite a été une erreur.');
      } else {
        setDialogue5('tes PV sont déjà au maximum.\nrange ces frites pour plus tard.');
      }
      const itemDialogue = b.dialogue;
      startEnemyPhase5(itemDialogue);
    } else {
      if (b.bossHp <= b.bossMaxHp * .22 || (b.respect >= 3 && b.bossHp <= b.bossMaxHp * .43)) {
        b.bossHp = 0; b.mode = 'victory'; b.winDelay = 1.25;
        setDialogue5('… bon. tu as gagné.\nje retourne au champ. sans rancune.');
        spawnParticles5(400, 135, '#ffe7a5', 55, 140);
      } else {
        setDialogue5('épargner ? maintenant ?\ntermine d’abord la conversation.');
        const mercyDialogue = b.dialogue;
        startEnemyPhase5(mercyDialogue);
      }
    }
  }

  function resolveFight5() {
    const b = B5;
    if (!b || b.mode !== 'aim') return;
    const accuracy = clamp(1 - Math.abs(b.aimX - .5) * 2, 0, 1);
    const damage = Math.max(3, Math.round(4 + accuracy * 23));
    b.bossHp = Math.max(0, b.bossHp - damage);
    b.score += damage * 3;
    b.bossFlash = .24;
    b.shake = accuracy > .82 ? 8 : 3;
    floatText5(400, 140, '-' + damage + ' PV', accuracy > .82 ? '#ffe46f' : '#fff1d9');
    spawnParticles5(400, 145, accuracy > .82 ? '#ffe46f' : '#e9d9b3', accuracy > .82 ? 26 : 14, accuracy > .82 ? 135 : 80);
    if (accuracy > .82) setDialogue5('coup critique.\n… tu as répété devant le miroir, hein ?');
    else if (accuracy > .48) setDialogue5('pas mal. ma carapace va s’en souvenir.');
    else setDialogue5('aïe. c’était surtout un coup de chance.');
    b.lastHit = accuracy;
    b.mode = 'hitPause'; b.modeT = .58;
    const newPhase = b.bossHp <= b.bossMaxHp * .30 ? 3 : b.bossHp <= b.bossMaxHp * .65 ? 2 : 1;
    if (newPhase > b.phase && b.bossHp > 0) {
      b.phase = newPhase; b.phaseBanner = 2.0; b.shake = 12;
      setDialogue5(newPhase === 2 ? 'ok. ma sieste est officiellement terminée.' : '… d’accord. phase finale.\nje vais devoir utiliser mes deux neurones.');
      spawnParticles5(400, 145, newPhase === 3 ? '#ff7272' : '#72dfff', 32, 130);
    }
    if (b.bossHp <= 0) {
      b.mode = 'victory'; b.winDelay = 1.25;
      setDialogue5('… bon. tu as gagné.\nje retourne au champ. sans rancune.');
      spawnParticles5(400, 145, '#ffe7a5', 60, 150);
    }
  }

  function level5Point(e) {
    const rect = cv.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * LV5_W / rect.width, y: (e.clientY - rect.top) * LV5_H / rect.height };
  }

  function handleLevel5Click(e) {
    const b = B5;
    if (!b || state !== 'play') return;
    const { x, y } = level5Point(e);
    if (b.mode === 'intro') { chooseAction5(0); return; }
    if (b.mode === 'aim') { resolveFight5(); return; }
    if (b.mode === 'enemy') { if (x >= 656 && x <= 782 && y >= 378 && y <= 425) b.dashPressed = true; return; }
    if (b.mode !== 'choice') return;
    // Les zones cliquables correspondent exactement aux quatre boutons dessinés.
    // Cela évite qu'un clic dans l'espace entre deux boutons active une action.
    const xs = [28, 215, 402, 589], widths = [168, 168, 168, 183];
    if (y >= 451 && y <= 485) {
      for (let slot = 0; slot < xs.length; slot++) {
        if (x >= xs[slot] && x <= xs[slot] + widths[slot]) {
          chooseAction5(slot);
          return;
        }
      }
    }
  }

  function updateLevel5(dt) {
    const b = B5;
    if (!b || state !== 'play') return;
    b.t += dt; b.bossAnim += dt;
    b.dialogueT += dt; b.invuln = Math.max(0, b.invuln - dt);
    b.shake = Math.max(0, b.shake - dt * 25);
    b.flash = Math.max(0, b.flash - dt * 2.8);
    b.bossFlash = Math.max(0, b.bossFlash - dt * 4.5);
    b.phaseBanner = Math.max(0, b.phaseBanner - dt);
    b.particles = b.particles.filter(p => {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.12, dt); p.vy *= Math.pow(.12, dt);
      return (p.life -= dt) > 0;
    });
    b.texts = b.texts.filter(p => { p.y -= 24 * dt; return (p.life -= dt) > 0; });
    if (b.mode === 'intro') {
      b.introT += dt;
      if (b.introT > 3.2) { b.mode = 'choice'; setDialogue5('c’est ton tour. choisis bien. je regarde.'); }
    } else if (b.mode === 'aim') {
      b.aimT += dt;
      const p = (b.aimT * 1.05) % 2;
      b.aimX = p <= 1 ? p : 2 - p;
      if (b.aimT >= b.aimDuration) {
        // Ne pas laisser le joueur bloqué : la barre expire en un tir faible.
        b.aimX = Math.abs(b.aimX - .5) < .2 ? b.aimX : (b.aimX < .5 ? .16 : .84);
        resolveFight5();
      }
    } else if (b.mode === 'hitPause') {
      b.modeT -= dt;
      if (b.modeT <= 0) startEnemyPhase5();
    } else if (b.mode === 'enemy') {
      const k = b.keys, h = b.heart, box = b.box;
      let dx = (k.right ? 1 : 0) - (k.left ? 1 : 0);
      let dy = (k.down ? 1 : 0) - (k.up ? 1 : 0);
      if (b.touchTarget) {
        dx = b.touchTarget.x - h.x; dy = b.touchTarget.y - h.y;
        if (Math.hypot(dx, dy) < 7) { b.touchTarget = null; dx = 0; dy = 0; }
      }
      b.dashCooldown = Math.max(0, b.dashCooldown - dt);
      const dashPressed = (k.dash && !b.dashWasDown) || b.dashPressed;
      b.dashPressed = false;
      if (dashPressed && b.dashCooldown <= 0) {
        h.dashT = .16; b.dashCooldown = .95;
        if (!dx && !dy) { dx = h.lastX || 0; dy = h.lastY || -1; }
        spawnParticles5(h.x, h.y, "#91f5f2", 10, 80);
      }
      b.dashWasDown = !!k.dash;
      h.dashT = Math.max(0, (h.dashT || 0) - dt);
      const len = Math.hypot(dx, dy);
      h.moving = len > 0;
      if (len) { dx /= len; dy /= len; h.lastX = dx; h.lastY = dy; }
      const heartSpeed = h.speed * (h.dashT > 0 ? 3.1 : 1);
      if (h.dashT > 0) b.invuln = Math.max(b.invuln, .08);
      h.x = clamp(h.x + dx * heartSpeed * dt, box.x + 11, box.x + box.w - 11);
      h.y = clamp(h.y + dy * heartSpeed * dt, box.y + 11, box.y + box.h - 11);
      b.attackT += dt;
      b.spawnT -= dt;
      const rate = b.phase === 1 ? .52 : b.phase === 2 ? .39 : .30;
      const bulletLimit = b.phase === 3 ? 34 : 30;
      if (b.spawnT <= 0 && b.bullets.length < bulletLimit) { spawnAttack5(); b.spawnT = rate * (.78 + Math.random() * .44); }
      b.bullets = b.bullets.filter(p => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot = (p.rot || 0) + (p.spin || 0) * dt; p.life -= dt;
        let colliding = false;
        // Tous les tirs ont maintenant une silhouette et une hitbox de patate.
        colliding = Math.hypot(h.x - p.x, h.y - p.y) < h.r + (p.r || 8);
        const correctRule = p.rule === 'any' || (p.rule === 'move' && h.moving) || (p.rule === 'still' && !h.moving);
        if (colliding && correctRule && h.dashT > 0) {
          b.score += 20; b.dashCooldown = Math.max(0, b.dashCooldown - .18);
          spawnParticles5(p.x, p.y, "#9df6ec", 6, 58);
          floatText5(h.x, h.y - 15, "ESQUIVE !", "#9df6ec");
          return false;
        }
        if (colliding && correctRule && b.invuln <= 0) {
          const damage = 2;
          b.playerHp = Math.max(0, b.playerHp - damage);
          b.invuln = .62; b.flash = 1; b.shake = 7; b.hitsTaken++;
          spawnParticles5(h.x, h.y, '#ff6a7e', 11, 95);
          floatText5(h.x + 11, h.y - 10, '-' + damage, '#ff8793');
          return false;
        }
        return p.life > 0 && p.x > box.x - 55 && p.x < box.x + box.w + 55 && p.y > box.y - 35 && p.y < box.y + box.h + 35;
      });
      if (b.playerHp <= 0) { endGame(false); return; }
      if (b.attackT >= b.attackDuration) {
        b.bullets.length = 0; b.mode = 'choice'; b.turn++;
        if (b.hitsTaken === b.hitsAtAttackStart) {
          b.dodges++; b.score += 25;
          floatText5(400, 282, 'TOUR PARFAIT +25', '#9df6ec');
          setDialogue5(b.phase === 3 ? 'tu as esquivé chaque attaque. impressionnant.\nà toi.' : 'aucun coup reçu. beau travail.\nà toi de jouer.');
        } else {
          setDialogue5(b.phase === 3 ? 'tu as survécu. improbable.\nbon, à toi.' : 'bien. tu as survécu à ce tour.\nà toi de jouer.');
        }
      }
    } else if (b.mode === 'victory') {
      b.winDelay -= dt;
      if (b.winDelay <= 0 && state === 'play') endGame(true);
    }

    for (const star of b.stars) {
      star.y += star.speed * dt * .22;
      if (star.y > LV5_H) { star.y = -2; star.x = (star.x + 83) % LV5_W; }
    }
    if (b.phase > 1 && Math.random() < dt * (b.phase === 3 ? 18 : 9)) {
      spawnParticles5(rand(260,540), rand(85,188), b.phase === 3 ? '#ff6d79' : '#75dfea', 1, 25);
    }
  }

  function drawPotatoBoss5(c, x, y, t, phase, flash) {
    c.save();
    const bob = Math.sin(t * 2.2) * 1.8;
    c.translate(x, y + bob);
    c.scale(1 + Math.sin(t * 3.1) * .008, 1 - Math.sin(t * 3.1) * .008);
    const phaseColor = phase === 3 ? '#ff3030' : phase === 2 ? '#ff9d2e' : '#35c9ff';

    // Halo coloré selon la phase, puis une silhouette qui ressemble vraiment à une patate.
    c.shadowColor = phaseColor;
    c.shadowBlur = flash > 0 ? 22 : 10;
    c.fillStyle = phase === 3 ? 'rgba(255,48,48,.20)' : phase === 2 ? 'rgba(255,157,46,.19)' : 'rgba(53,201,255,.18)';
    c.beginPath(); c.ellipse(0, 3, 56, 60, Math.sin(t * 1.3) * .04, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0;

    // Petites chaussures et bras de patate combattante.
    c.lineCap = 'round';
    c.strokeStyle = '#59341d'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(-31, 35); c.lineTo(-37, 48); c.moveTo(30, 35); c.lineTo(37, 48); c.stroke();
    c.fillStyle = '#30251f';
    c.beginPath(); c.ellipse(-39, 50, 14, 6, -.15, 0, Math.PI*2); c.ellipse(39, 50, 14, 6, .15, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#9a6838'; c.lineWidth = 8;
    c.beginPath(); c.moveTo(-38, 5); c.quadraticCurveTo(-54, 13, -49, 25); c.moveTo(38, 5); c.quadraticCurveTo(54, 13, 49, 25); c.stroke();
    c.fillStyle = '#d6a05a';
    c.beginPath(); c.ellipse(-49, 26, 7, 9, -.25, 0, Math.PI*2); c.ellipse(49, 26, 7, 9, .25, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#59341d'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(-49, 26, 7, 9, -.25, 0, Math.PI*2); c.ellipse(49, 26, 7, 9, .25, 0, Math.PI*2); c.stroke();

    // Contour irrégulier et bosselé du tubercule.
    const potato = () => {
      c.beginPath();
      c.moveTo(-3, -42);
      c.bezierCurveTo(11, -48, 22, -38, 28, -32);
      c.bezierCurveTo(42, -27, 45, -13, 43, -3);
      c.bezierCurveTo(49, 10, 38, 25, 27, 31);
      c.bezierCurveTo(16, 43, 1, 41, -11, 38);
      c.bezierCurveTo(-25, 38, -40, 28, -41, 14);
      c.bezierCurveTo(-49, 2, -42, -15, -34, -24);
      c.bezierCurveTo(-28, -37, -16, -43, -3, -42);
      c.closePath();
    };
    c.fillStyle = '#5b351d'; potato(); c.fill();
    c.save(); c.translate(0, -2); c.scale(.94, .94);
    const skin = c.createLinearGradient(-37, -35, 36, 31);
    skin.addColorStop(0, '#f0c27a'); skin.addColorStop(.35, '#d69a4d'); skin.addColorStop(.72, '#b97736'); skin.addColorStop(1, '#855024');
    c.fillStyle = skin; potato(); c.fill();
    c.strokeStyle = '#70411f'; c.lineWidth = 2.5; potato(); c.stroke();
    c.restore();

    // Fossettes de peau et éclat.
    c.fillStyle = 'rgba(88,47,21,.78)';
    [[-28,-18,2.5],[-34,2,2],[-20,25,2.5],[28,-20,2],[33,7,2.5],[17,29,2],[-4,34,1.8]].forEach(([sx,sy,r])=>{
      c.beginPath(); c.ellipse(sx,sy,r,r*.68,.3,0,Math.PI*2); c.fill();
    });
    c.fillStyle = 'rgba(255,224,158,.58)';
    c.beginPath(); c.ellipse(-24,-25,8,4,-.55,0,Math.PI*2); c.fill();

    // Yeux enfoncés, dents et sourire : la patate garde son expression de boss RPG.
    c.fillStyle = '#392016';
    c.beginPath(); c.ellipse(-16,-7,9,12,-.12,0,Math.PI*2); c.ellipse(16,-7,9,12,.12,0,Math.PI*2); c.fill();
    c.fillStyle = '#f8edd6';
    c.beginPath(); c.ellipse(-14,-8,3.2,4.2,0,0,Math.PI*2); c.ellipse(18,-8,3.2,4.2,0,0,Math.PI*2); c.fill();
    c.fillStyle = phaseColor;
    if (phase >= 2) {
      c.shadowColor = phaseColor; c.shadowBlur = 12;
      c.beginPath(); c.arc(18,-8,4.2,0,Math.PI*2); c.fill();
      c.shadowBlur = 0; c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(18,-8,1.7,0,Math.PI*2); c.fill();
    }
    c.strokeStyle = '#583019'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-25,-22); c.lineTo(-8,-20); c.moveTo(8,-20); c.lineTo(26,-22); c.stroke();
    c.fillStyle = '#452315';
    c.beginPath(); c.moveTo(-20,8); c.quadraticCurveTo(0,27,21,7); c.quadraticCurveTo(1,13,-20,8); c.fill();
    c.fillStyle = '#fff3d8';
    c.fillRect(-15,10,6,5); c.fillRect(-6,13,6,5); c.fillRect(3,13,6,5); c.fillRect(12,10,5,5);

    // Petite pousse verte au sommet : détail caractéristique d'une patate.
    c.strokeStyle = '#55762c'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-1,-39); c.quadraticCurveTo(-3,-50,2,-54); c.stroke();
    c.fillStyle = '#6e9f35';
    c.beginPath(); c.ellipse(-7,-49,8,4,-.55,0,Math.PI*2); c.ellipse(7,-53,8,4,.55,0,Math.PI*2); c.fill();
    c.strokeStyle = '#c9ee74'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-11,-51); c.lineTo(-5,-48); c.moveTo(3,-54); c.lineTo(10,-52); c.stroke();

    // Petit insigne qui change de couleur selon la phase.
    c.fillStyle = phaseColor; c.shadowColor = phaseColor; c.shadowBlur = flash > 0 ? 15 : 5;
    c.fillRect(-7, 28, 14, 4); c.fillRect(-3, 24, 6, 12);
    c.restore();
  }

  function drawPotatoProjectile5(c, p) {
    c.save();
    c.translate(Math.round(p.x), Math.round(p.y));
    c.rotate(p.rot || 0);

    const color = p.color || '#d69a4d';
    // Halo coloré pour différencier les attaques, tout en gardant une vraie silhouette de pomme de terre.
    c.shadowColor = color; c.shadowBlur = 8;
    c.fillStyle = '#563219';
    c.beginPath();
    c.moveTo(-12,-1); c.bezierCurveTo(-13,-7,-7,-10,-2,-9);
    c.bezierCurveTo(4,-12,10,-7,11,-2); c.bezierCurveTo(14,3,8,8,3,9);
    c.bezierCurveTo(-3,11,-10,7,-12,3); c.closePath(); c.fill();

    const skin = c.createLinearGradient(-9,-8,8,8);
    skin.addColorStop(0, '#ffe0a0'); skin.addColorStop(.25, color);
    skin.addColorStop(.72, color); skin.addColorStop(1, '#985b2d');
    c.fillStyle = skin;
    c.beginPath();
    c.moveTo(-10,-1); c.bezierCurveTo(-11,-6,-6,-9,-1,-8);
    c.bezierCurveTo(4,-10,9,-6,10,-2); c.bezierCurveTo(12,2,7,7,2,8);
    c.bezierCurveTo(-3,10,-8,6,-10,3); c.closePath(); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = '#75431f'; c.lineWidth = 1.5; c.stroke();

    // Petites marques naturelles (les « yeux » d'une patate) et reflet doré.
    c.fillStyle = 'rgba(78,42,20,.95)';
    c.beginPath(); c.ellipse(-5,-2,1.4,1, -.3, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(2,3,1.5,1, .25, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(6,-3,1.2,.8, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,239,184,.9)';
    c.beginPath(); c.ellipse(-3,-5,3.3,1.3,-.45,0,Math.PI*2); c.fill();

    // Une mini-pousse verte rend la forme reconnaissable même en plein mouvement.
    c.strokeStyle = '#52762b'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(0,-7); c.lineTo(1,-10); c.stroke();
    c.fillStyle = '#78a83b'; c.beginPath(); c.ellipse(-2,-10,3,1.4,-.4,0,Math.PI*2); c.ellipse(3,-10,2.5,1.3,.5,0,Math.PI*2); c.fill();

    // Les règles d'esquive restent identifiables sans transformer le projectile en symbole abstrait.
    if (p.rule === 'move') {
      c.strokeStyle = '#fff4cf'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(-2,-3); c.lineTo(-1,3); c.moveTo(4,-2); c.lineTo(5,2); c.stroke();
    } else if (p.rule === 'still') {
      c.fillStyle = '#222'; c.fillRect(-1,-1,2,2); c.fillRect(4,2,2,2);
    }
    c.restore();
  }

  // Projection simple de l'arène de combat sur une plateforme en perspective.
  // La simulation garde ses coordonnées 2D : seuls les objets dessinés sont projetés.
  function projectLevel5(x, y) {
    const depth = Math.max(0, Math.min(1, (y - 278) / 150));
    const halfWidth = 220 + depth * 55;
    return { x: 400 + (x - 400) * (halfWidth / 220), y: 282 + depth * 143, scale: .68 + depth * .32, depth };
  }

  function shadeLevel5(hex, amount) {
    const value=parseInt(hex.slice(1),16), r=Math.max(0,Math.min(255,(value>>16)+amount));
    const g=Math.max(0,Math.min(255,((value>>8)&255)+amount)), bl=Math.max(0,Math.min(255,(value&255)+amount));
    return 'rgb('+r+','+g+','+bl+')';
  }

  function drawLevel5Column3D(c, x, y, height, width, color, t, phase) {
    const q=projectLevel5(x,y), w=width*q.scale, h=height*q.scale;
    const lean=Math.sin(t*1.4+x)*2*q.scale, footY=q.y;
    c.save(); c.globalAlpha=.28; c.fillStyle='#030407';
    c.beginPath(); c.ellipse(q.x+5,footY+3,w*.95,w*.28,0,0,Math.PI*2); c.fill(); c.globalAlpha=1;
    c.beginPath(); c.moveTo(q.x-w*.5,footY); c.lineTo(q.x-w*.5+lean,footY-h);
    c.lineTo(q.x+w*.5+lean,footY-h); c.lineTo(q.x+w*.5,footY); c.closePath();
    const face=c.createLinearGradient(q.x-w*.5,0,q.x+w*.5,0);
    face.addColorStop(0,shadeLevel5(color,-38)); face.addColorStop(.5,color); face.addColorStop(1,shadeLevel5(color,-66));
    c.fillStyle=face; c.fill(); c.strokeStyle='rgba(235,210,173,.32)'; c.lineWidth=Math.max(.7,q.scale); c.stroke();
    c.fillStyle=shadeLevel5(color,22);
    c.beginPath(); c.moveTo(q.x-w*.5+lean,footY-h); c.lineTo(q.x-w*.29+lean,footY-h-5*q.scale);
    c.lineTo(q.x+w*.62+lean,footY-h-5*q.scale); c.lineTo(q.x+w*.5+lean,footY-h); c.closePath(); c.fill();
    c.fillStyle=phase===3?'rgba(255,65,83,.72)':phase===2?'rgba(255,172,81,.72)':'rgba(106,218,239,.6)';
    c.fillRect(q.x-w*.19+lean,footY-h*.72,Math.max(2,w*.12),Math.max(5,h*.28)); c.restore();
  }

  function drawLevel5Arch3D(c, x, y, radius, phase, t) {
    const q=projectLevel5(x,y), r=radius*q.scale;
    const hue=phase===3?'#ff655c':phase===2?'#f8be71':'#82d8e8';
    c.save(); c.translate(q.x,q.y-9*q.scale); c.globalAlpha=.46+.12*Math.sin(t*2.1);
    c.strokeStyle='rgba(8,9,14,.85)'; c.lineWidth=10*q.scale;
    c.beginPath(); c.ellipse(0,0,r,r*.42,0,Math.PI,Math.PI*2); c.stroke();
    c.strokeStyle=hue; c.lineWidth=3*q.scale; c.shadowColor=hue; c.shadowBlur=16*q.scale;
    c.beginPath(); c.ellipse(0,0,r,r*.42,0,Math.PI,Math.PI*2); c.stroke(); c.shadowBlur=0;
    for(let i=0;i<7;i++){const a=Math.PI+Math.PI*i/6,sx=Math.cos(a)*r,sy=Math.sin(a)*r*.42;
      c.fillStyle=i%2?'#fff0ce':hue;c.beginPath();c.arc(sx,sy,1.5*q.scale,0,Math.PI*2);c.fill();}
    c.restore();
  }

  function drawLevel5Rubble3D(c, x, y, size, seed) {
    const q=projectLevel5(x,y), s=size*q.scale; c.save(); c.translate(q.x,q.y);
    c.globalAlpha=.38;c.fillStyle='#0b0c12';c.beginPath();c.ellipse(1,2,s*1.2,s*.42,0,0,Math.PI*2);c.fill();
    c.globalAlpha=.8;const points=[];
    for(let i=0;i<6;i++){const a=i*Math.PI/3,v=.68+((i*13+seed*7)%5)*.08;points.push({x:Math.cos(a)*s*v,y:Math.sin(a)*s*.45*v});}
    c.beginPath();c.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)c.lineTo(points[i].x,points[i].y);
    c.closePath();c.fillStyle=seed%2?'#756451':'#5c5660';c.fill();c.strokeStyle='rgba(215,193,163,.24)';c.lineWidth=.7;c.stroke();c.restore();
  }

  function drawLevel5ArenaTrim3D(c, b) {
    const phase=b?b.phase:1,t=b?b.t:0,a=projectLevel5(180,428),d=projectLevel5(620,428);
    // La tranche visible révèle l'épaisseur de la plateforme.
    c.fillStyle='#17171e';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(d.x,d.y);c.lineTo(d.x-4,d.y+14);c.lineTo(a.x+4,a.y+14);c.closePath();c.fill();
    c.strokeStyle='rgba(224,180,117,.52)';c.lineWidth=2;c.beginPath();c.moveTo(a.x+4,a.y+5);c.lineTo(d.x-4,d.y+5);c.stroke();
    const trim=phase===3?'#ff655c':phase===2?'#e8ad63':'#69bdce';
    c.strokeStyle=trim;c.globalAlpha=.32+.13*Math.sin(t*3);c.lineWidth=2;c.beginPath();c.moveTo(a.x+12,a.y+10);c.lineTo(d.x-12,d.y+10);c.stroke();c.globalAlpha=1;
    const columns=[[136,294,54,24,'#4c4652'],[664,294,54,24,'#4c4652'],[151,338,76,31,'#5a4e4c'],[649,338,76,31,'#5a4e4c'],[117,395,98,38,'#47434c'],[683,395,98,38,'#47434c']];
    for(const item of columns)drawLevel5Column3D(c,item[0],item[1],item[2],item[3],item[4],t,phase);
    drawLevel5Arch3D(c,400,278,64,phase,t);
    // Rochers et runes bougent subtilement dans la profondeur de la salle.
    for(let i=0;i<16;i++){const y=286+((i*47)%132),side=i%2?1:-1,x=side<0?188+((i*19)%23):588-((i*17)%23);drawLevel5Rubble3D(c,x,y,3+(i%4),i);}
    for(let i=0;i<10;i++){const y=292+((i*29+t*8)%126),q=projectLevel5(i%2?188:612,y);
      c.save();c.globalAlpha=.22+.24*Math.sin(t*3+i);c.strokeStyle=trim;c.lineWidth=1.2;c.beginPath();
      c.moveTo(q.x-4*q.scale,q.y);c.lineTo(q.x+4*q.scale,q.y-2*q.scale);c.lineTo(q.x+2*q.scale,q.y-6*q.scale);c.stroke();c.restore();}
  }
  function drawLevel5PotatoModel3D(c, b) {
    const time=b?b.bossAnim:0, phase=b?b.phase:1, flash=b?b.bossFlash:0;
    const cx=400, cy=157+Math.sin(time*2.2)*1.7, rings=9, slices=18;
    const turn=Math.sin(time*.38)*.16, ct=Math.cos(turn), st=Math.sin(turn), vertices=[];
    const phaseLight=phase===3?'#ff5969':phase===2?'#ffc16b':'#86e4ed';
    // Un ellipsoïde irrégulier, calculé en anneaux et tourné légèrement à chaque image.
    for(let j=0;j<=rings;j++){
      const lat=-Math.PI/2+Math.PI*j/rings, row=[];
      for(let i=0;i<slices;i++){
        const lon=Math.PI*2*i/slices;
        const wobble=1+.035*Math.sin(lon*3+time*.4)*Math.cos(lat*4)+.018*Math.sin(lon*7+lat*5);
        const x=49*Math.cos(lat)*Math.cos(lon)*wobble;
        const y=47*Math.sin(lat)*(1+.035*Math.sin(lon*4+1));
        const z=29*Math.cos(lat)*Math.sin(lon)*wobble;
        const rx=x*ct-z*st, rz=x*st+z*ct;
        row.push({x:cx+rx+rz*.24,y:cy+y-rz*.13,z:rz,wx:rx,wy:y,wz:rz});
      }
      vertices.push(row);
    }
    const triangles=[];
    const pushTriangle=(a,d,e,seed)=>{
      const ux=d.wx-a.wx,uy=d.wy-a.wy,uz=d.wz-a.wz;
      const vx=e.wx-a.wx,vy=e.wy-a.wy,vz=e.wz-a.wz;
      const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
      const n=Math.hypot(nx,ny,nz)||1;
      const light=Math.max(.12,(nx*-.35+ny*-.42+nz*.83)/n);
      const base=flash>0?'#fff0cb':(seed%13===0?'#cf9851':'#bd8243');
      const amount=Math.round((light-.48)*112);
      triangles.push({a,d,e,z:(a.z+d.z+e.z)/3,color:shadeLevel5(base,amount)});
    };
    for(let j=0;j<rings;j++)for(let i=0;i<slices;i++){
      const next=(i+1)%slices,a=vertices[j][i],d=vertices[j+1][i],e=vertices[j+1][next],f=vertices[j][next];
      pushTriangle(a,d,e,j*slices+i);pushTriangle(a,e,f,j*slices+i+5);
    }
    triangles.sort((a,d)=>a.z-d.z);
    c.save(); c.shadowColor=phaseLight;c.shadowBlur=flash>0?30:14;
    for(const face of triangles){
      c.beginPath();c.moveTo(face.a.x,face.a.y);c.lineTo(face.d.x,face.d.y);c.lineTo(face.e.x,face.e.y);c.closePath();
      c.fillStyle=face.color;c.fill();c.strokeStyle='rgba(65,37,20,.22)';c.lineWidth=.55;c.stroke();
    }
    c.shadowBlur=0;
    // Reflet humide et petites fossettes gravées directement sur la peau.
    c.globalAlpha=.48;c.fillStyle='#ffe0a2';c.beginPath();c.ellipse(cx-22,cy-26,11,5,-.58,0,Math.PI*2);c.fill();c.globalAlpha=1;
    for(const [dx,dy,r] of [[-32,-9,2],[-26,18,2.3],[29,-18,2.2],[34,5,2.4],[13,31,1.8],[-5,37,1.8]]){
      c.fillStyle='#75451f';c.beginPath();c.ellipse(cx+dx,cy+dy,r,r*.65,.28,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(255,207,128,.58)';c.beginPath();c.arc(cx+dx-r*.35,cy+dy-r*.2,.65,0,Math.PI*2);c.fill();
    }
    // Regard, sourcils, sourire et petites dents pour garder l'expression du boss.
    c.fillStyle='#3c2117';c.beginPath();c.ellipse(cx-16,cy-7,8,11,-.12,0,Math.PI*2);c.ellipse(cx+16,cy-7,8,11,.12,0,Math.PI*2);c.fill();
    c.fillStyle='#fff0d5';c.beginPath();c.ellipse(cx-14,cy-9,2.8,3.8,0,0,Math.PI*2);c.ellipse(cx+18,cy-9,2.8,3.8,0,0,Math.PI*2);c.fill();
    if(phase>=2){c.fillStyle=phaseLight;c.shadowColor=phaseLight;c.shadowBlur=12;c.beginPath();c.arc(cx+18,cy-8,3.7,0,Math.PI*2);c.fill();c.shadowBlur=0;}
    c.strokeStyle='#59321d';c.lineWidth=3;c.beginPath();c.moveTo(cx-26,cy-22);c.lineTo(cx-8,cy-20);c.moveTo(cx+8,cy-20);c.lineTo(cx+27,cy-23);c.stroke();
    c.fillStyle='#462318';c.beginPath();c.moveTo(cx-20,cy+8);c.quadraticCurveTo(cx,cy+27,cx+21,cy+7);c.quadraticCurveTo(cx,cy+13,cx-20,cy+8);c.fill();
    c.fillStyle='#fff0d2';c.fillRect(cx-14,cy+10,6,5);c.fillRect(cx-5,cy+13,6,5);c.fillRect(cx+4,cy+13,6,5);c.fillRect(cx+13,cy+10,5,5);
    // Pousse et feuilles en volume au sommet du tubercule.
    c.strokeStyle='#55762c';c.lineWidth=3;c.beginPath();c.moveTo(cx,cy-43);c.quadraticCurveTo(cx-3,cy-55,cx+3,cy-59);c.stroke();
    c.fillStyle='#75a83d';c.beginPath();c.ellipse(cx-8,cy-53,9,4,-.5,0,Math.PI*2);c.ellipse(cx+8,cy-57,9,4,.5,0,Math.PI*2);c.fill();
    c.strokeStyle='#d1ef85';c.lineWidth=1.4;c.beginPath();c.moveTo(cx-12,cy-55);c.lineTo(cx-5,cy-52);c.moveTo(cx+2,cy-58);c.lineTo(cx+11,cy-56);c.stroke();
    // Plastron métallique et rivets colorés selon la phase.
    c.fillStyle='#42333a';c.beginPath();c.moveTo(cx-22,cy+29);c.quadraticCurveTo(cx,cy+21,cx+22,cy+29);c.lineTo(cx+18,cy+39);c.quadraticCurveTo(cx,cy+45,cx-18,cy+39);c.closePath();c.fill();
    c.strokeStyle=phaseLight;c.lineWidth=2;c.stroke();
    c.fillStyle=phaseLight;c.shadowColor=phaseLight;c.shadowBlur=flash>0?18:7;c.beginPath();c.arc(cx,cy+33,4,0,Math.PI*2);c.fill();c.shadowBlur=0;
    c.restore();
  }
  function drawLevel5BossAura3D(c, b) {
    const phase=b?b.phase:1,t=b?b.bossAnim:0;
    const color=phase===3?'#ff6671':phase===2?'#ffbd68':'#74dce9',bob=Math.sin(t*2.2)*1.8;
    c.save();c.translate(400,158+bob);c.globalAlpha=.42+.12*Math.sin(t*3);
    c.strokeStyle=color;c.lineWidth=2;c.shadowColor=color;c.shadowBlur=18;
    c.beginPath();c.ellipse(0,7,72,27,Math.sin(t*.7)*.08,Math.PI,Math.PI*2);c.stroke();
    c.globalAlpha=.24;c.lineWidth=5;c.beginPath();c.ellipse(0,7,72,27,Math.sin(t*.7)*.08,0,Math.PI);c.stroke();
    c.shadowBlur=0;c.globalAlpha=1;
    for(let i=0;i<5;i++){
      const angle=t*.9+i*Math.PI*2/5,radius=78+Math.sin(t*2+i)*5,x=Math.cos(angle)*radius,y=-8+Math.sin(angle)*radius*.35,size=4+(i%2)*1.5;
      c.save();c.translate(x,y);c.rotate(angle+t);c.beginPath();c.moveTo(0,-size*1.8);c.lineTo(size*.7,-size*.15);
      c.lineTo(0,size*1.7);c.lineTo(-size*.7,-size*.15);c.closePath();
      const crystal=c.createLinearGradient(-size,0,size,0);crystal.addColorStop(0,'#554652');crystal.addColorStop(.5,color);crystal.addColorStop(1,'#fff1cf');
      c.fillStyle=crystal;c.shadowColor=color;c.shadowBlur=10;c.fill();c.strokeStyle='rgba(255,245,221,.65)';c.lineWidth=.8;c.stroke();c.restore();
    }
    c.restore();
  }
  function drawLevel5Arena3D(c, b) {
    const leftTop = projectLevel5(180, 278), rightTop = projectLevel5(620, 278);
    const leftBottom = projectLevel5(180, 428), rightBottom = projectLevel5(620, 428);
    const path = (pts) => { c.beginPath(); c.moveTo(pts[0].x, pts[0].y); for (let i=1;i<pts.length;i++) c.lineTo(pts[i].x,pts[i].y); c.closePath(); };
    const haze=c.createLinearGradient(0,258,0,440);
    haze.addColorStop(0,'#25232c'); haze.addColorStop(.55,'#25232c'); haze.addColorStop(1,'#08090d');
    c.fillStyle=haze; c.fillRect(0,258,LV5_W,182);
    c.fillStyle='#171920';
    c.beginPath(); c.moveTo(0,258); c.lineTo(180,270); c.lineTo(leftTop.x,leftTop.y); c.lineTo(leftBottom.x,leftBottom.y); c.lineTo(0,430); c.fill();
    c.beginPath(); c.moveTo(800,258); c.lineTo(620,270); c.lineTo(rightTop.x,rightTop.y); c.lineTo(rightBottom.x,rightBottom.y); c.lineTo(800,430); c.fill();
    const glow=c.createRadialGradient(400,150,8,400,170,230);
    glow.addColorStop(0,'rgba(224,177,103,.2)'); glow.addColorStop(1,'rgba(224,177,103,0)');
    c.fillStyle=glow; c.fillRect(160,92,480,106);
    c.save(); c.shadowColor='rgba(0,0,0,.8)'; c.shadowBlur=18; c.shadowOffsetY=8;
    c.fillStyle='#343039'; c.beginPath(); c.ellipse(400,177,92,19,0,0,Math.PI*2); c.fill(); c.restore();
    c.fillStyle='#6e5741'; c.beginPath(); c.ellipse(400,174,86,14,0,0,Math.PI*2); c.fill();
    c.strokeStyle='rgba(241,204,141,.48)'; c.lineWidth=2; c.beginPath(); c.ellipse(400,174,72,9,0,0,Math.PI*2); c.stroke();
    path([leftTop,rightTop,rightBottom,leftBottom]);
    const floor=c.createLinearGradient(0,278,0,428);
    floor.addColorStop(0,'#514c4d'); floor.addColorStop(.48,'#35343a'); floor.addColorStop(1,'#202127');
    c.fillStyle=floor; c.fill();
    c.save(); path([leftTop,rightTop,rightBottom,leftBottom]); c.clip();
    const pool=c.createRadialGradient(400,316,12,400,340,330);
    pool.addColorStop(0,'rgba(202,155,97,.13)'); pool.addColorStop(1,'rgba(16,17,23,0)');
    c.fillStyle=pool; c.fillRect(100,270,600,180);
    c.strokeStyle='rgba(222,204,178,.13)'; c.lineWidth=1;
    for(let y=298;y<430;y+=24){ const a=projectLevel5(180,y), z=projectLevel5(620,y); c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(z.x,z.y); c.stroke(); }
    for(let x=220;x<=580;x+=45){ const a=projectLevel5(x,278), z=projectLevel5(x,428); c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(z.x,z.y); c.stroke(); }
    c.restore();
    path([leftTop,rightTop,rightBottom,leftBottom]); c.strokeStyle='#c2a478'; c.lineWidth=3; c.stroke();
    drawLevel5ArenaTrim3D(c,b);
    for(const p of [leftTop,rightTop,leftBottom,rightBottom]) { c.fillStyle='#e2bd7f'; c.beginPath(); c.arc(p.x,p.y,3,0,Math.PI*2); c.fill(); }
    for(let i=0;i<5;i++){ c.fillStyle='rgba(240,203,145,'+(.10+i*.025)+')'; c.fillRect(250+i*75,264,2,15); }
  }
  function drawLevel5() {
    const c = lv5PixelCtx, b = B5;
    // La scène est pixellisée, mais le texte est volontairement dessiné ensuite
    // sur le canvas final à sa résolution native pour rester net et lisible.
    const nativeFillText5 = c.fillText;
    c.fillText = function() {}; // évite les lettres illisibles dans la basse résolution.
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.clearRect(0, 0, LV5_PIXEL_W, LV5_PIXEL_H);
    c.imageSmoothingEnabled = false;
    c.setTransform(LV5_PIXEL_W / LV5_W, 0, 0, LV5_PIXEL_H / LV5_H, 0, 0);
    const shakeX = b ? Math.round(((Math.random()-.5)*b.shake) / LV5_PIXEL_SCALE) * LV5_PIXEL_SCALE : 0;
    const shakeY = b ? Math.round(((Math.random()-.5)*b.shake) / LV5_PIXEL_SCALE) * LV5_PIXEL_SCALE : 0;
    c.translate(shakeX, shakeY);
    const bg = c.createLinearGradient(0,0,0,LV5_H);
    bg.addColorStop(0,'#11101b'); bg.addColorStop(.56,'#0a0b12'); bg.addColorStop(1,'#17101d');
    c.fillStyle = bg; c.fillRect(-12,-12,LV5_W+24,LV5_H+24);
    // Petites étoiles et quadrillage subtil.
    if (b) for (const s of b.stars) {
      c.globalAlpha = .25 + .5 * (.5 + .5*Math.sin(b.t*2+s.phase));
      c.fillStyle = '#dcd9ec'; c.fillRect(s.x,s.y,s.r,s.r);
    }
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(154,139,190,.07)'; c.lineWidth = 1;
    for(let x=0;x<LV5_W;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,LV5_H);c.stroke();}
    for(let y=0;y<LV5_H;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(LV5_W,y);c.stroke();}
    // Nom du combat et PV du boss.
    c.textAlign='left'; c.font='bold 12px monospace'; c.fillStyle='#a7a3bd'; c.fillText('POTATO UNDERGROUND  /  COMBAT 04',30,22);
    c.textAlign='right'; c.fillStyle='#eee6d6'; c.fillText('SANS-PATATE',770,22);
    c.fillStyle='rgba(255,255,255,.12)'; c.fillRect(230,32,340,9);
    c.fillStyle=b && b.phase===3?'#ff496e':b && b.phase===2?'#edb64a':'#e8ddc3';
    c.fillRect(230,32,340*Math.max(0,(b?b.bossHp:0)/(b?b.bossMaxHp:156)),9);
    c.fillStyle='#777387'; c.font='10px monospace'; c.fillText('PV DU BOSS',224,40);

    // Halo boss et petites particules.
    if (b && b.phaseBanner > 0) {
      c.fillStyle = `rgba(255,236,190,${Math.min(.16,b.phaseBanner*.08)})`; c.fillRect(0,0,LV5_W,LV5_H);
      c.textAlign='center'; c.font='bold 20px monospace'; c.fillStyle='#f3f3f3'; c.fillText(b.phase===2?'PHASE 2 : PLUS SÉRIEUX':'PHASE 3 : CROUSTILLANT',400,196);
    }
    // Dialogue en boite sobre et bordure claire.
    c.fillStyle='#090910'; c.fillRect(40,202,720,55);
    c.strokeStyle='#dedce6'; c.lineWidth=2; c.strokeRect(40,202,720,55);
    c.textAlign='left'; c.fillStyle='#f1eee8'; c.font='14px monospace';
    const text = b ? b.dialogue.slice(0, Math.floor(b.dialogueT*36)) : '';
    const lines = text.split('\n');
    lines.slice(0,2).forEach((line,i)=>c.fillText('* '+line,57,224+i*20));
    if (b && (b.mode==='intro' || b.mode==='choice')) {
      c.textAlign='right'; c.font='10px monospace'; c.fillStyle='#8c899d'; c.fillText(b.mode==='intro'?'ENTRÉE / CLIC POUR CONTINUER':'TON TOUR',748,248);
    }
    const box=b?b.box:{x:180,y:278,w:440,h:150};
    c.fillStyle='#05060b'; c.fillRect(box.x,box.y,box.w,box.h);
    c.strokeStyle='#f0edf2'; c.lineWidth=2; c.strokeRect(box.x,box.y,box.w,box.h);
    // Attaques : tous les projectiles ont une forme de patate lisible en pixel-art.
    if (b) for (const p of b.bullets) drawPotatoProjectile5(c, p);
    // Âme du joueur.
    if (b && b.mode==='enemy') {
      const h=b.heart, blinking=b.invuln>0 && Math.floor(b.t*22)%2===0;
      if(!blinking){
        c.save(); c.translate(h.x,h.y); c.shadowColor='#ff405b'; c.shadowBlur=14+Math.sin(b.t*12)*4;
        c.fillStyle='#ff314f'; c.beginPath();
        c.moveTo(0,7); c.bezierCurveTo(-4,3,-12,-2,-8,-8); c.bezierCurveTo(-5,-12,-1,-10,0,-6); c.bezierCurveTo(3,-11,9,-11,10,-5); c.bezierCurveTo(11,0,4,5,0,7); c.fill();
        c.restore();
      }
    }
    // Jauge et consignes sous l'arène.
    c.textAlign='left'; c.font='bold 13px monospace'; c.fillStyle='#f4eee7';
    c.fillText('ÂME',34,296); c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(34,307,90,10); c.fillStyle='#ff5b68'; c.fillRect(34,307,90*Math.max(0,(b?b.playerHp:45)/(b?b.maxHp:45)),10); c.fillStyle='#f4eee7';
    c.font='12px monospace'; c.fillText(`${b ? b.playerHp : 60} / ${b ? b.maxHp : 60} PV`,34,333);
    c.fillStyle='#aaa5b9'; c.fillText(`FRITES : ${b ? b.snacks : 3}`,34,354);
    c.fillText(`TOUR : ${b?b.turn+1:1}`,650,300);
    c.textAlign='right'; c.fillStyle='#858195'; c.font='10px monospace';
    c.fillText('ZQSD / FLÈCHES : BOUGER',770,322); c.fillText('ENTRÉE / CLIC : CHOISIR',770,338);
    if (b && b.mode==='aim') {
      const ax=230, aw=340, ay=454;
      c.fillStyle='#24212e'; c.fillRect(ax,ay,aw,17);
      c.fillStyle='#a84453'; c.fillRect(ax+aw*.42,ay,aw*.16,17);
      c.strokeStyle='#e6dbe8'; c.strokeRect(ax,ay,aw,17);
      c.fillStyle='#fff5dc'; c.fillRect(ax+b.aimX*aw-2,ay-5,4,27);
      c.textAlign='center'; c.font='bold 11px monospace'; c.fillStyle='#f4e9d6'; c.fillText('ENTRÉE / CLIC POUR FRAPPER',400,447);
    } else {
      const acts=LV5_ACTIONS, xs=[28,215,402,589], widths=[168,168,168,183];
      for(let i=0;i<acts.length;i++){
        const x=xs[i],w=widths[i],y=451,h=34,sel=b && b.mode==='choice' && b.actionIndex===i;
        c.fillStyle=sel?'#f4d27d':'#11121b'; c.fillRect(x,y,w,h);
        c.strokeStyle=sel?'#f4d27d':'#7d788d'; c.lineWidth=sel?2:1; c.strokeRect(x,y,w,h);
        c.textAlign='center';c.textBaseline='middle';c.font='bold 12px monospace';c.fillStyle=sel?'#17131a':'#e1dce7';
        c.fillText((sel?'▶ ':'')+acts[i],x+w/2,y+h/2);
      }
      c.textBaseline='alphabetic';
    }
    // particules, chiffres flottants et surbrillance lorsqu'on subit un coup.
    if (b) {
      for(const p of b.particles){c.globalAlpha=Math.min(1,p.life*1.8);c.fillStyle=p.color;c.fillRect(p.x,p.y,p.r,p.r);}
      c.globalAlpha=1;
      for(const p of b.texts){c.globalAlpha=Math.min(1,p.life*1.6);c.textAlign='center';c.fillStyle=p.color;c.font='bold 16px monospace';c.fillText(p.text,p.x,p.y);}
      c.globalAlpha=1;
      if(b.flash>0){c.fillStyle=`rgba(255,45,84,${b.flash*.16})`;c.fillRect(0,0,LV5_W,LV5_H);}
      if(b.mode==='intro') { c.fillStyle='rgba(0,0,0,.50)'; c.fillRect(0,0,LV5_W,LV5_H); c.textAlign='center';c.font='bold 16px monospace';c.fillStyle='#f1f1f1';c.fillText('LE COMBAT DU POTAGER',400,260);c.font='12px monospace';c.fillStyle='#bbb5c9';c.fillText('appuie sur entrée ou clique pour commencer',400,282); }
    }
    c.restore();
    c.fillText = nativeFillText5;

    // Blit nearest-neighbour : chaque texel devient un bloc dur, sans lissage.
    const out = mainCtx;
    out.save();
    out.setTransform(1, 0, 0, 1, 0, 0);
    out.imageSmoothingEnabled = true;
    out.clearRect(0, 0, LV5_W, LV5_H);
    // Toute la scène est en niveaux de gris. Le cœur et les commandes colorées sont redessinés ensuite.
    out.filter = 'none';
    out.drawImage(lv5PixelCanvas, 0, 0, LV5_PIXEL_W, LV5_PIXEL_H, 0, 0, LV5_W, LV5_H);
    out.filter = 'none';
    out.restore();
    // Le décor reste monochrome, mais le boss et toutes les patates gardent leurs couleurs.
    if (b) {
      out.save();
      out.translate(shakeX, shakeY);
      drawLevel5Arena3D(out, b);
      drawLevel5BossAura3D(out,b);
      drawLevel5PotatoModel3D(out,b);
      const orderedBullets = [...b.bullets].sort((a,z)=>a.y-z.y);
      for (const p of orderedBullets) {
        const q=projectLevel5(p.x,p.y), back=projectLevel5(p.x-p.vx*.055,p.y-p.vy*.055);
        out.save(); out.globalAlpha=.22*q.scale; out.strokeStyle=p.color||"#f5ce89"; out.lineWidth=Math.max(1.2,4*q.scale); out.lineCap="round"; out.beginPath(); out.moveTo(back.x,back.y); out.lineTo(q.x,q.y); out.stroke(); out.restore();
        out.save(); out.globalAlpha=.32*q.scale; out.fillStyle='#050507';
        out.beginPath(); out.ellipse(q.x+2,q.y+4,Math.max(3,(p.r||5)*q.scale*1.4),Math.max(2,(p.r||4)*q.scale*.55),0,0,Math.PI*2); out.fill(); out.restore();
        out.save(); out.translate(q.x,q.y); out.scale(q.scale,q.scale); drawPotatoProjectile5(out,{...p,x:0,y:0}); out.restore();
      }
      out.restore();
    }
    drawLevel5HeartOverlay();
    drawLevel5ReadableText();
  }

  function drawLevel5HeartOverlay() {
    const c = mainCtx, b = B5;
    if (!b || b.mode !== 'enemy') return;
    const h=b.heart, blinking=b.invuln>0 && Math.floor(b.t*22)%2===0;
    if (blinking) return;
    const q=projectLevel5(h.x,h.y);
    c.save(); c.globalAlpha=.38; c.fillStyle='#0a080e'; c.beginPath(); c.ellipse(q.x+2,q.y+7,9*q.scale,3*q.scale,0,0,Math.PI*2); c.fill(); c.globalAlpha=1;
    if (h.dashT>0) { c.globalAlpha=.55; c.strokeStyle='#8ef5ed'; c.lineWidth=3; c.beginPath(); c.moveTo(q.x-h.lastX*22,q.y-h.lastY*14); c.lineTo(q.x,q.y); c.stroke(); c.globalAlpha=1; }
    c.translate(q.x,q.y); c.scale(q.scale,q.scale);
    c.shadowColor='#ff304f'; c.shadowBlur=10+Math.sin(b.t*12)*2;
    c.fillStyle='#ff304f'; c.beginPath();
    c.moveTo(0,7); c.bezierCurveTo(-4,3,-12,-2,-8,-8); c.bezierCurveTo(-5,-12,-1,-10,0,-6);
    c.bezierCurveTo(3,-11,9,-11,10,-5); c.bezierCurveTo(11,0,4,5,0,7); c.fill();
    c.restore();
  }

  function drawLevel5ReadableText() {
    const c = mainCtx, b = B5;
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.imageSmoothingEnabled = true;
    c.textBaseline = 'alphabetic';
    // Contour sombre sur le texte : lisible même lorsque les effets lumineux clignotent.
    const txt = (value, x, y, align = 'left', color = '#f4f4f4', font = 'bold 14px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace') => {
      c.textAlign = align; c.font = font; c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,.96)';
      c.strokeText(value, x, y); c.fillStyle = color; c.fillText(value, x, y);
    };
    txt('POTATO UNDERGROUND / COMBAT 04', 30, 22, 'left', '#c9c9c9', 'bold 12px ui-monospace, monospace');
    txt('SANS-PATATE', 770, 22, 'right', '#f2f2f2', 'bold 13px ui-monospace, monospace');
    txt(`PV DU BOSS : ${Math.max(0, Math.ceil(b ? b.bossHp : 170))} / ${b ? b.bossMaxHp : 170}`, 400, 55, 'center', '#eeeeee', 'bold 13px ui-monospace, monospace');
    const phaseLabel = !b || b.phase === 1 ? 'ÉCHAUFFEMENT' : b.phase === 2 ? 'ÇA SE CORSE' : 'DERNIÈRE VAGUE';
    txt('PHASE ' + (b ? b.phase : 1) + ' / 3 · ' + phaseLabel, 400, 75, 'center', '#e4d1ae', 'bold 11px ui-monospace, monospace');
    if (b && b.phaseBanner > 0) {
      txt(b.phase === 2 ? 'PHASE 2 : PLUS SÉRIEUX' : 'PHASE 3 : CROUSTILLANT', 400, 196, 'center', '#f3f3f3', 'bold 20px ui-monospace, monospace');
    }
    const visibleDialogue = b ? b.dialogue.slice(0, Math.floor(b.dialogueT * 36)) : '';
    const dialogueLines = visibleDialogue.split('\n').slice(0, 2);
    dialogueLines.forEach((line, i) => txt('* ' + line, 57, 224 + i * 20, 'left', '#f5f5f5', '15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'));
    if (b && (b.mode === 'intro' || b.mode === 'choice')) {
      txt(b.mode === 'intro' ? 'ENTRÉE / CLIC POUR CONTINUER' : 'TON TOUR', 748, 248, 'right', '#c6c6c6', 'bold 11px ui-monospace, monospace');
    }
    txt('ÂME', 34, 296, 'left', '#f2f2f2', 'bold 14px ui-monospace, monospace');
    txt(`${b ? b.playerHp : 70} / ${b ? b.maxHp : 70} PV`, 34, 333, 'left', '#f2f2f2', '13px ui-monospace, monospace');
    txt(`FRITES : ${b ? b.snacks : 3}`, 34, 354, 'left', '#c7c7c7', '13px ui-monospace, monospace');
    txt(`SCORE : ${b ? b.score : 0} · ESQUIVES : ${b ? b.dodges : 0}`, 34, 382, 'left', '#d8c6a8', '11px ui-monospace, monospace');
    if (b && b.mode === 'enemy') {
      const remaining = Math.max(0, b.attackDuration - b.attackT);
      txt(`ESQUIVE : ${remaining.toFixed(1)} s`, 770, 354, 'right', '#e6e0ef', '12px ui-monospace, monospace');
      c.fillStyle = 'rgba(4,7,12,.92)'; c.fillRect(654,378,128,45);
      c.strokeStyle = b.dashCooldown <= 0 ? '#8ee8e6' : '#6d6876'; c.lineWidth = 2; c.strokeRect(654,378,128,45);
      txt('ESQUIVE · MAJ', 718, 395, 'center', b.dashCooldown <= 0 ? '#a8fff5' : '#b1aebb', 'bold 11px ui-monospace, monospace');
      const dashReady = 1 - clamp(b.dashCooldown / .95, 0, 1);
      c.fillStyle = '#292733'; c.fillRect(665,404,106,7); c.fillStyle = '#6ad8d5'; c.fillRect(665,404,106*dashReady,7);
    }
    if (b && b.playerHp <= 15 && b.mode !== 'victory') {
      c.save();
      c.globalAlpha = 0.45 + 0.35 * Math.sin(b.t * 7);
      c.strokeStyle = '#ff5968'; c.lineWidth = 3;
      c.strokeRect(8, 8, LV5_W - 16, LV5_H - 16);
      c.restore();
    }
    txt(`TOUR : ${b ? b.turn + 1 : 1}`, 650, 300, 'left', '#e5e5e5', '13px ui-monospace, monospace');
    txt('ZQSD / FLÈCHES : BOUGER', 770, 322, 'right', '#dddddd', 'bold 11px ui-monospace, monospace');
    txt('MAJ : ESQUIVE ' + ((b && b.dashCooldown > 0) ? b.dashCooldown.toFixed(1)+' s' : 'PRÊTE'), 770, 366, 'right', '#8ee8e6', 'bold 11px ui-monospace, monospace');
    txt('ENTRÉE / CLIC : CHOISIR', 770, 338, 'right', '#dddddd', 'bold 11px ui-monospace, monospace');
    txt('RAYURES : RESTE IMMOBILE  ·  POINTS : BOUGE  ·  DOUBLE MARQUE : ESQUIVE', 400, 441, 'center', '#d5d5d5', 'bold 10px ui-monospace, monospace');
    if (b && b.mode === 'choice') {
      const mercyHint = b.respect >= 3 ? 'Clémence possible sous 43 % de PV boss.' : 'Clémence possible sous 22 % de PV boss.';
      const hints = ['Vise le centre pour un coup critique.', 'Parle trois fois pour renforcer la clémence.', 'Soin de 20 PV · ' + b.snacks + ' portion(s) restante(s).', mercyHint];
      txt(hints[b.actionIndex], 400, 425, 'center', '#e7d6b4', '11px ui-monospace, monospace');
    } else if (b && b.mode === 'enemy' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
      txt('GLISSE SUR LE SOL POUR DÉPLACER TON CŒUR', 400, 425, 'center', '#cceee7', '11px ui-monospace, monospace');
    }
    if (b && b.mode === 'aim') {
      txt('ENTRÉE / CLIC POUR FRAPPER', 400, 447, 'center', '#f0f0f0', 'bold 12px ui-monospace, monospace');
    } else {
      const acts = LV5_ACTIONS, xs = [28, 215, 402, 589], widths = [168, 168, 168, 183];
      for (let i = 0; i < acts.length; i++) {
        const x = xs[i], w = widths[i], y = 451, h = 34;
        const selected = b && b.mode === 'choice' && b.actionIndex === i;
        // Cadres orange comme dans la référence ; seule l'option active est remplie.
        c.fillStyle = '#050505'; c.fillRect(x, y, w, h);
        if (selected) { c.fillStyle = '#df8050'; c.fillRect(x + 1, y + 1, w - 2, h - 2); }
        c.strokeStyle = '#df8050'; c.lineWidth = selected ? 2.5 : 2; c.strokeRect(x, y, w, h);
        txt((selected ? '▶ ' : '') + acts[i], x + w / 2, 472, 'center', selected ? '#050505' : '#df8050', 'bold 17px ui-monospace, monospace');
      }
    }
    if (b) {
      for (const p of b.texts) {
        c.globalAlpha = Math.min(1, p.life * 1.6);
        txt(p.text, p.x, p.y, 'center', '#eeeeee', 'bold 16px ui-monospace, monospace');
      }
      c.globalAlpha = 1;
      if (b.mode === 'intro') {
        txt('LE COMBAT DU POTAGER', 400, 260, 'center', '#f1f1f1', 'bold 18px ui-monospace, monospace');
        txt('appuie sur entrée ou clique pour commencer', 400, 282, 'center', '#d8d8d8', '13px ui-monospace, monospace');
      }
    }
    c.restore();
  }

  function handleLevel5KeyDown(e) {
    if (!g || g.level !== 5 || state !== 'play' || !B5) return;
    const b=B5, code=e.code;
    const left=['ArrowLeft','KeyA','KeyQ'].includes(code), right=['ArrowRight','KeyD'].includes(code);
    const up=['ArrowUp','KeyW','KeyZ'].includes(code), down=['ArrowDown','KeyS'].includes(code);
    if (b.mode==='enemy') {
      if(left)b.keys.left=true; if(right)b.keys.right=true; if(up)b.keys.up=true; if(down)b.keys.down=true;
      if(code==='ShiftLeft'||code==='ShiftRight')b.keys.dash=true;
      if(left||right||up||down||code==='ShiftLeft'||code==='ShiftRight')e.preventDefault();
      return;
    }
    if (e.repeat) return;
    if (b.mode==='intro' && ['Enter','Space','KeyZ'].includes(code)) { chooseAction5(0); e.preventDefault(); return; }
    if (b.mode==='aim' && ['Enter','Space','KeyZ'].includes(code)) { resolveFight5(); e.preventDefault(); return; }
    if (b.mode==='choice') {
      if (left || up) { b.actionIndex=(b.actionIndex+LV5_ACTIONS.length-1)%LV5_ACTIONS.length; e.preventDefault(); }
      else if (right || down) { b.actionIndex=(b.actionIndex+1)%LV5_ACTIONS.length; e.preventDefault(); }
      else if (['Enter','Space','KeyZ'].includes(code)) { chooseAction5(b.actionIndex); e.preventDefault(); }
    }
  }
  function handleLevel5KeyUp(e) {
    if (!B5) return;
    const b=B5, code=e.code;
    if (['ArrowLeft','KeyA','KeyQ'].includes(code)) b.keys.left=false;
    if (['ArrowRight','KeyD'].includes(code)) b.keys.right=false;
    if (['ArrowUp','KeyW','KeyZ'].includes(code)) b.keys.up=false;
    if (['ArrowDown','KeyS'].includes(code)) b.keys.down=false;
    if (['ShiftLeft','ShiftRight'].includes(code)) b.keys.dash=false;
  }

  function draw() {
    const t = performance.now() / 1000;
    // La classe sert uniquement au style spécifique du niveau 5 ; le canvas reste lissé à sa résolution native.
    const wrap = $('wrap');
    if (wrap) wrap.classList.toggle('pixel-art', !!(g && g.level === 5));
    if (wrap) wrap.classList.toggle('arena-mode', !!(g && g.level === 4));
    if (g && g.level === 5) {
      ctx = mainCtx;
      drawLevel5();
      return;
    }
    if (g && g.level === 4) {
      ctx = mainCtx;
      mainCtx.setTransform(1,0,0,1,0,0);
      mainCtx.clearRect(0,0,W,H);
      drawArena4();
      return;
    }
    if (g && g.level === 3) {
      ctx = mainCtx;
      mainCtx.setTransform(1, 0, 0, 1, 0, 0);
      mainCtx.clearRect(0, 0, W, H);
      draw3();
      return;
    }
    // --- monde pixelisé -> canvas hors-écran ---
    ctx = rctx;
    rctx.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0);
    rctx.globalAlpha = 1;
    rctx.clearRect(0, 0, W, H);
    rctx.drawImage(BG[g && state !== 'menu' ? g.level : 1], 0, 0, W, H);
    for (const c of clouds) cloud(((c.x + t * c.s) % (W + 240)) - 120, c.y, 1);
    if (g && state !== 'menu') {
      g.level === 1 ? draw1() : g.level === 2 ? draw2() : draw3();
      for (const l of g.leaves) ell(ctx, l.x, l.y, 4, 2.2, l.c, l.r);
      for (const q of g.fx) { ctx.globalAlpha = Math.min(1, q.life * 2); ell(ctx, q.x, q.y, 3, 3, q.col); } ctx.globalAlpha = 1;
      if (g.hurt > 0) { ctx.fillStyle = `rgba(200,40,20,${g.hurt})`; ctx.fillRect(0, 0, W, H); }
      for (const q of g.pops) label(q.txt, q.x + 20, q.y, 'center', q.col, 22);
    }
    // --- présentation sur le canvas principal (pixels nets -> monde pixélisé, UI nette) ---
    ctx = mainCtx;
    mainCtx.imageSmoothingEnabled = false;
    mainCtx.clearRect(0, 0, W, H);
    mainCtx.drawImage(rcv, 0, 0, PXW, PXH, 0, 0, W, H);
    mainCtx.imageSmoothingEnabled = true;
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    if (g && state !== 'menu') hud();
  }
  function draw1() {
    const w = g.weather, f = g.f;
    for (const it of g.items) ctx.drawImage(IMG[it.type], it.x, it.y, it.w, it.h);
    for (const bd of g.birds) {
      ctx.save(); ctx.translate(bd.x + bd.w / 2, bd.y + Math.sin(g.elapsed * 14 + bd.x) * 2); ctx.scale(bd.face, 1);
      ctx.drawImage(birdImg, -bd.w / 2, 0, 48, 28);
      if (bd.carry) ctx.drawImage(IMG.potato, -22, 22, 24, 17);
      ctx.restore();
    }
    if (w.type === 'brouillard') { ctx.fillStyle = lin(ctx, 0, 40, 0, GROUND, 'rgba(235,228,215,.72)', 'rgba(235,228,215,.3)'); ctx.fillRect(0, 40, W, GROUND - 40); }
    const run = f.moving ? Math.floor(g.elapsed * 10) % 2 : 0, bob = f.moving ? Math.abs(Math.sin(g.elapsed * 20)) * 3 : 0;
    drawFarmer(f.x, f.y + 64 - bob, f.dir, run, 1);
    const p = pivot(); ctx.save(); ctx.translate(p.x, p.y - bob); ctx.rotate(gunAngle());
    rr(ctx, 0, -3.5, 32, 7, 3, lin(ctx, 0, -3.5, 0, 3.5, '#7a7a88', '#2e2e38')); rr(ctx, -7, -4, 12, 12, 3, '#7a5230'); ctx.restore();
    if (g.reload > 0) { rr(ctx, f.x, f.y - 8, f.w, 5, 2, '#2a1406'); rr(ctx, f.x, f.y - 8, Math.max(2, f.w * Math.min(1, g.reload / .5)), 5, 2, '#ff7a4d'); }
    for (const bu of g.bullets) { ctx.fillStyle = rad(ctx, bu.x, bu.y, 0, 9, 'rgba(255,230,120,.9)', 'rgba(255,230,120,0)'); ctx.fillRect(bu.x - 9, bu.y - 9, 18, 18); ell(ctx, bu.x, bu.y, 3.5, 3.5, '#fff6b0'); }
    if (w.type === 'pluie') {
      ctx.fillStyle = 'rgba(40,60,95,.28)'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(200,220,255,.65)'; ctx.lineWidth = 1.4; ctx.beginPath();
      for (const d of g.drops) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 3, d.y + 12); } ctx.stroke();
    }
    if (w.type === 'vent') {
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (const d of g.drops) { const y = d.y % 380 + 50; ctx.moveTo(d.x, y); ctx.quadraticCurveTo(d.x + 14, y - 4, d.x + 28, y); } ctx.stroke();
    }
  }
  function draw2() {
    const f = g.f, P = g.power, t = g.elapsed;
    for (const b of g.booms) { const k = 1 - b.t / .4, r = 110 * k + 10; ctx.fillStyle = rad(ctx, b.x, GROUND - 20, 0, r, `rgba(255,220,120,${(1 - k) * .8})`, 'rgba(255,90,30,0)'); ctx.beginPath(); ctx.arc(b.x, GROUND - 20, r, 0, 7); ctx.fill(); }
    for (const p of g.plants) {
      const grow = Math.min(1, p.t), ripe = p.t >= 1, wh = 28 * grow, hh = 16 * grow;
      if (ripe) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, GROUND + 1); ctx.clip();
        ctx.drawImage(IMG[p.bomb ? 'bomb' : 'potato'], p.x - 2, GROUND - 15, 32, 23); ctx.restore();
      }
      ctx.drawImage(IMG[p.bomb ? 'sproutBomb' : 'sprout'], p.x + 14 - wh / 2, GROUND - hh - (ripe ? 6 : 0), wh, hh);
      if (ripe) {
        const pulse = 4 + Math.sin(t * 8 + p.x) * 1.5;
        ctx.fillStyle = rad(ctx, p.x + 14, GROUND - 36, 0, pulse + 5, p.bomb ? 'rgba(255,90,58,.9)' : 'rgba(255,227,107,.9)', 'rgba(255,255,255,0)');
        ctx.beginPath(); ctx.arc(p.x + 14, GROUND - 36, pulse + 5, 0, 7); ctx.fill();
        if (p.bomb && Math.floor(p.t * (3 + p.t)) % 2) label('!', p.x + 14, GROUND - 52, 'center', '#fff', 22);
        if (p.dig > 0) { rr(ctx, p.x - 2, GROUND - 30, 34, 7, 3, '#2a1406'); rr(ctx, p.x - 1, GROUND - 29, Math.max(2, 32 * Math.min(1, p.dig / (P.dig > 0 ? .15 : .55))), 5, 2, '#9be04a'); }
      }
    }
    for (const c of g.crates) {
      if (c.t < 3 && Math.floor(t * 8) % 2) continue;
      const y = GROUND - 36 - Math.abs(Math.sin(t * 3 + c.x)) * 6;
      ell(ctx, c.x + 15, GROUND, 16, 3, 'rgba(0,0,0,.25)');
      rr(ctx, c.x - 2, y - 2, 34, 38, 7, '#2a1406'); rr(ctx, c.x, y, 30, 34, 6, lin(ctx, 0, y, 0, y + 34, '#fff', POWER_COL[c.kind]));
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(c.x + 4, y + 3, 22, 3);
      label(POWER[c.kind][0], c.x + 15, y + 19, 'center', '#fff', 20);
    }
    if (g.warn && Math.floor(t * 12) % 2) label('!', g.warn.left ? 26 : W - 26, g.warn.high ? GROUND - 52 : GROUND - 12, 'center', '#ffe34a', 34);
    for (const s of g.shots) { ctx.save(); ctx.translate(s.x + s.w / 2, s.y + s.h / 2); ctx.rotate(s.r); ctx.drawImage(IMG.chou, -s.w / 2, -s.h / 2, s.w, s.h); ctx.restore(); }
    if (!(f.inv > 0 && Math.floor(t * 16) % 2)) drawFarmer(f.x, f.feet, f.dir, f.moving && f.feet >= GROUND ? Math.floor(t * 10) % 2 : 0, f.crouch ? .62 : 1);
    if (P.shield > 0) {
      const cx = f.x + 32, cy = f.feet - 32;
      ctx.fillStyle = rad(ctx, cx, cy, 20, 50, 'rgba(120,200,255,.05)', 'rgba(120,200,255,.35)'); ctx.beginPath(); ctx.arc(cx, cy, 50, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(160,220,255,.9)'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
  function rayHit3(px, py, rayX, rayY) {
    let mapX = Math.floor(px), mapY = Math.floor(py);
    const deltaX = Math.abs(1 / (Math.abs(rayX) < 1e-8 ? 1e-8 : rayX));
    const deltaY = Math.abs(1 / (Math.abs(rayY) < 1e-8 ? 1e-8 : rayY));
    const stepX = rayX < 0 ? -1 : 1, stepY = rayY < 0 ? -1 : 1;
    let sideX = rayX < 0 ? (px-mapX)*deltaX : (mapX+1-px)*deltaX;
    let sideY = rayY < 0 ? (py-mapY)*deltaY : (mapY+1-py)*deltaY;
    let side = 0, tile = '#';
    for (let i=0; i<80; i++) {
      if (sideX < sideY) { sideX += deltaX; mapX += stepX; side = 0; }
      else { sideY += deltaY; mapY += stepY; side = 1; }
      tile = tileAt3(mapX,mapY);
      if (tile !== '.') break;
    }
    const dist = Math.max(.03, side === 0 ? sideX-deltaX : sideY-deltaY);
    return { dist, side, tile, mapX, mapY };
  }
  function normAngle3(a) {
    while (a > Math.PI) a -= Math.PI*2;
    while (a < -Math.PI) a += Math.PI*2;
    return a;
  }
  function roundRect3(c,x,y,w,h,r) {
    c.beginPath(); c.roundRect(x,y,w,h,r); c.fill();
  }
  function drawSky3(c, horizon, t) {
    const sky = c.createLinearGradient(0,0,0,horizon+24);
    sky.addColorStop(0,'#21b7e7'); sky.addColorStop(.52,'#78e0ed'); sky.addColorStop(1,'#ffe6a3');
    c.fillStyle = sky; c.fillRect(0,0,W,horizon+28);
    const glow = c.createRadialGradient(662,80,8,662,80,190);
    glow.addColorStop(0,'rgba(255,248,189,.72)'); glow.addColorStop(1,'rgba(255,248,189,0)');
    c.fillStyle = glow; c.fillRect(460,0,340,250);
    c.fillStyle = '#fff2b0'; c.beginPath(); c.arc(662,80,27,0,Math.PI*2); c.fill();
    // Nuages en coton, dessinés en vectoriel et animés doucement.
    const cloud = (x,y,s) => {
      c.fillStyle='rgba(255,255,255,.64)';
      c.beginPath(); c.ellipse(x,y,31*s,10*s,0,0,Math.PI*2); c.ellipse(x-17*s,y-6*s,18*s,10*s,0,0,Math.PI*2); c.ellipse(x+3*s,y-11*s,20*s,13*s,0,0,Math.PI*2); c.ellipse(x+24*s,y-4*s,17*s,8*s,0,0,Math.PI*2); c.fill();
    };
    cloud(((70+t*7)%980)-90,83,.8); cloud(((350+t*4)%990)-90,138,.58); cloud(((520+t*5)%1000)-100,58,.66);
    // Îlots lointains en couches : une ligne d'horizon très colorée.
    c.fillStyle='#66bd78'; c.beginPath(); c.moveTo(0,horizon+9);
    for(let x=0;x<=W;x+=8) c.lineTo(x,horizon-15-Math.sin(x*.012+1.1)*17-Math.sin(x*.027)*7);
    c.lineTo(W,horizon+25); c.lineTo(0,horizon+25); c.closePath(); c.fill();
    c.fillStyle='#398e69'; c.beginPath(); c.moveTo(0,horizon+22);
    for(let x=0;x<=W;x+=8) c.lineTo(x,horizon+1-Math.sin(x*.009+2.5)*10-Math.sin(x*.021+1)*4);
    c.lineTo(W,horizon+36); c.lineTo(0,horizon+36); c.closePath(); c.fill();
  }
  function drawFloor3(c,horizon) {
    const floor = c.createLinearGradient(0,horizon,0,H);
    floor.addColorStop(0,'#b9d76b'); floor.addColorStop(.18,'#7ab65a'); floor.addColorStop(.48,'#d4c16f'); floor.addColorStop(1,'#dfb779');
    c.fillStyle=floor; c.fillRect(0,horizon,W,H-horizon);
    c.save(); c.beginPath(); c.rect(0,horizon,W,H-horizon); c.clip();
    // Perspective au sol : lignes qui convergent vers le point de fuite.
    c.lineWidth=1;
    for(let n=1;n<=25;n++) {
      const y=horizon+(H-horizon)/(1+n*.18);
      c.strokeStyle=`rgba(255,248,193,${Math.max(.025,.15-n*.004)})`;
      c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke();
    }
    c.strokeStyle='rgba(53,113,67,.19)'; c.lineWidth=1;
    for(let k=-11;k<=11;k++) {
      c.beginPath(); c.moveTo(W/2,horizon+1); c.lineTo(W/2+k*57,H+15); c.stroke();
    }
    // petites touffes / coquillages au premier plan
    for(let i=0;i<48;i++) {
      const x=(i*167+31)%W, y=horizon+25+((i*83)%240);
      if(y>H) continue;
      c.fillStyle=i%3===0?'rgba(255,250,210,.26)':'rgba(64,126,62,.22)';
      c.beginPath(); c.ellipse(x,y,1.2+(i%3),.7+(i%2),i*.3,0,Math.PI*2); c.fill();
    }
    c.restore();
  }
  function shade3(rgb, k) { return `rgb(${Math.max(0,Math.min(255,Math.round(rgb[0]*k)))},${Math.max(0,Math.min(255,Math.round(rgb[1]*k)))},${Math.max(0,Math.min(255,Math.round(rgb[2]*k)))})`; }
  function drawWalls3(c,p,horizon,zBuf) {
    const focal=(W/2)/Math.tan(FOV3/2);
    for(let x=0;x<W;x++) {
      const rayAngle=p.ang+Math.atan((x-W/2)/focal);
      const hit=rayHit3(p.x,p.y,Math.cos(rayAngle),Math.sin(rayAngle));
      const depth=Math.max(.035,hit.dist*Math.cos(rayAngle-p.ang));
      zBuf[x]=depth;
      const wallH=Math.min(H*1.8,H/(depth*.88));
      const top=horizon-wallH*.53, bottom=horizon+wallH*.47;
      const palette=hit.tile==='T'?[48,139,67]:hit.tile==='P'?[232,111,73]:[205,158,94];
      const shade=Math.max(.25,1-depth*.045)*(hit.side? .77:1);
      c.fillStyle=shade3(palette,shade); c.fillRect(x,top,1,bottom-top);
      // Relief du matériau : palissade, feuillage et pierres.
      if(hit.tile==='#') {
        if((Math.floor((x+hit.mapX*11)/20)%2)===0) { c.fillStyle=`rgba(255,226,168,${.08*shade})`; c.fillRect(x,top+wallH*.2,1,wallH*.035); }
        c.fillStyle=`rgba(85,57,34,${.22*shade})`; c.fillRect(x,top+wallH*.73,1,Math.max(1,wallH*.025));
      } else if(hit.tile==='P') {
        const stripe=(Math.floor(x/14)%2)===0;
        c.fillStyle=stripe?`rgba(255,235,179,${.18*shade})`:`rgba(104,55,44,${.16*shade})`;
        c.fillRect(x,top+wallH*.18,1,wallH*.55);
      } else {
        if(x%19<2) { c.fillStyle=`rgba(15,65,42,${.22*shade})`; c.fillRect(x,top,1,wallH); }
        c.fillStyle=`rgba(200,244,128,${.11*shade})`; c.fillRect(x,top+wallH*.17,1,Math.max(1,wallH*.03));
      }
      if(hit.side) { c.fillStyle='rgba(22,36,37,.12)'; c.fillRect(x,top,1,bottom-top); }
    }
  }
  function project3(x,y,p,horizon,zBuf) {
    const dx=x-p.x, dy=y-p.y, dist=Math.hypot(dx,dy);
    if(dist<.12) return null;
    const angle=normAngle3(Math.atan2(dy,dx)-p.ang);
    if(Math.abs(angle)>FOV3*.68) return null;
    const depth=dist*Math.cos(angle);
    if(depth<=.1) return null;
    const focal=(W/2)/Math.tan(FOV3/2);
    const sx=W/2+Math.tan(angle)*focal;
    if(sx < -160 || sx > W+160) return null;
    const col=Math.max(0,Math.min(W-1,Math.round(sx)));
    if(zBuf[col] < depth-.10) return null;
    return { sx, depth, dist, ground: horizon + H*.88/depth, angle };
  }
  function drawPalm3(c,x,y,u,t) {
    c.save(); c.translate(x,y); c.scale(u,u);
    c.fillStyle='rgba(26,70,47,.24)'; c.beginPath(); c.ellipse(0,-2,42,9,0,0,Math.PI*2); c.fill();
    c.fillStyle='#8a572f'; c.beginPath(); c.moveTo(-8,0); c.lineTo(-3,-104); c.quadraticCurveTo(0,-112,5,-103); c.lineTo(12,0); c.closePath(); c.fill();
    c.strokeStyle='rgba(247,202,121,.43)'; c.lineWidth=2; for(let yy=-18;yy>-96;yy-=16){c.beginPath();c.moveTo(-5,yy);c.lineTo(7,yy-3);c.stroke();}
    for(let i=0;i<7;i++) {
      const a=-Math.PI*.96+i*(Math.PI*1.72/6)+Math.sin(t+i)*.035;
      c.save(); c.translate(0,-105); c.rotate(a);
      c.fillStyle=i%2?'#2da56c':'#42c77e';
      c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(12,-38,4,-69); c.quadraticCurveTo(-4,-36,0,0); c.fill();
      c.strokeStyle='rgba(223,255,174,.4)'; c.lineWidth=1.2; c.beginPath(); c.moveTo(0,-2); c.lineTo(2,-57); c.stroke(); c.restore();
    }
    c.fillStyle='#76502b'; c.beginPath(); c.arc(-4,-105,5,0,Math.PI*2); c.arc(3,-102,5,0,Math.PI*2); c.fill();
    c.restore();
  }
  function drawUmbrella3(c,x,y,u) {
    c.save(); c.translate(x,y); c.scale(u,u);
    c.fillStyle='rgba(48,68,42,.24)'; c.beginPath(); c.ellipse(0,-1,48,8,0,0,Math.PI*2); c.fill();
    c.strokeStyle='#f8e3b5'; c.lineWidth=4; c.beginPath(); c.moveTo(0,-3); c.lineTo(0,-92); c.stroke();
    c.fillStyle='#f45e5a'; c.beginPath(); c.moveTo(-47,-89); c.quadraticCurveTo(0,-122,47,-89); c.lineTo(0,-70); c.closePath(); c.fill();
    c.fillStyle='#ffd45c'; c.beginPath(); c.moveTo(-47,-89); c.lineTo(-24,-82); c.lineTo(0,-70); c.lineTo(0,-100); c.closePath(); c.fill();
    c.fillStyle='#ff9b59'; c.beginPath(); c.moveTo(0,-100); c.lineTo(24,-82); c.lineTo(47,-89); c.quadraticCurveTo(0,-122,0,-100); c.fill();
    c.fillStyle='#fff1ba'; c.beginPath(); c.arc(0,-101,3,0,Math.PI*2); c.fill();
    c.fillStyle='#f0e1bb'; c.fillRect(-32,-8,64,7); c.restore();
  }
  function drawStall3(c,x,y,u) {
    c.save(); c.translate(x,y); c.scale(u,u);
    c.fillStyle='rgba(39,53,36,.24)'; c.beginPath(); c.ellipse(0,-1,53,10,0,0,Math.PI*2); c.fill();
    c.fillStyle='#8b5837'; c.fillRect(-38,-77,76,76);
    c.fillStyle='#ffe0a1'; c.fillRect(-32,-69,64,62);
    c.fillStyle='#17a99d'; c.fillRect(-43,-87,86,17);
    for(let i=0;i<6;i++){c.fillStyle=i%2?'#fff0bb':'#fb7960';c.fillRect(-43+i*14.3,-88,7.2,18);}
    c.fillStyle='#ffcf58'; c.beginPath(); c.roundRect(-25,-61,50,18,5); c.fill();
    c.fillStyle='#325b52'; c.font='bold 10px system-ui'; c.textAlign='center'; c.fillText('POTATO!',0,-49);
    c.fillStyle='#9a6237'; c.fillRect(-29,-8,9,8); c.fillRect(20,-8,9,8); c.restore();
  }
  function drawBeachball3(c,x,y,u,t) {
    c.save(); c.translate(x,y-32*u); c.scale(u,u);
    c.fillStyle='rgba(54,67,49,.17)'; c.beginPath(); c.ellipse(0,33,23,6,0,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(0,0,27,0,Math.PI*2); c.clip();
    c.fillStyle='#f65e5b'; c.fillRect(-30,-30,60,60);
    c.fillStyle='#ffdf64'; c.beginPath(); c.moveTo(-30,-26); c.quadraticCurveTo(0,-8,30,-26); c.lineTo(30,-6); c.quadraticCurveTo(0,14,-30,-6); c.closePath(); c.fill();
    c.fillStyle='#55c3e8'; c.beginPath(); c.moveTo(-30,7); c.quadraticCurveTo(0,26,30,7); c.lineTo(30,30); c.lineTo(-30,30); c.closePath(); c.fill();
    c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-9,-12,6,11,-.5,0,Math.PI*2); c.fill(); c.restore();
  }
  function drawFlag3(c,x,y,u,t) {
    c.save(); c.translate(x,y); c.scale(u,u);
    c.fillStyle='#92603a'; c.fillRect(-2,-126,4,126);
    c.fillStyle='#ffcf4d'; c.beginPath(); c.moveTo(1,-125); c.lineTo(43,-115+Math.sin(t*3)*3); c.lineTo(1,-99); c.closePath(); c.fill();
    c.fillStyle='#f26759'; c.beginPath(); c.moveTo(1,-125); c.lineTo(24,-120+Math.sin(t*3)*3); c.lineTo(1,-111); c.closePath(); c.fill(); c.restore();
  }
  function drawCrate3(c,x,y,u) {
    c.save(); c.translate(x,y); c.scale(u,u);
    c.fillStyle='rgba(45,54,35,.2)'; c.beginPath(); c.ellipse(0,-1,29,7,0,0,Math.PI*2); c.fill();
    c.fillStyle='#9f6638'; c.fillRect(-24,-42,48,40); c.strokeStyle='#f0bd70'; c.lineWidth=3; c.strokeRect(-21,-39,42,34);
    c.beginPath(); c.moveTo(-20,-37); c.lineTo(20,-7); c.moveTo(20,-37); c.lineTo(-20,-7); c.stroke(); c.restore();
  }
  function drawEnemy3(c,x,y,h,enemy,t) {
    const u=h/142;
    c.save(); c.translate(x,y); c.scale(u,u);
    c.fillStyle='rgba(41,59,39,.28)'; c.beginPath(); c.ellipse(0,-1,43,8,0,0,Math.PI*2); c.fill();
    // petites jambes et bras, puis corps de patate arrondi avec lumière peinte
    c.strokeStyle='#5c6440'; c.lineWidth=10; c.lineCap='round';
    c.beginPath(); c.moveTo(-18,-35); c.lineTo(-25,-9); c.moveTo(18,-35); c.lineTo(24,-9); c.stroke();
    c.strokeStyle=enemy.type==='bomb'?'#a9483e':'#e7a45d'; c.lineWidth=10;
    c.beginPath(); c.moveTo(-26,-84); c.lineTo(-42,-62); c.moveTo(26,-84); c.lineTo(42,-62); c.stroke();
    const skin=c.createRadialGradient(-17,-103,3,0,-80,60);
    skin.addColorStop(0,enemy.type==='bomb'?'#ffb26d':'#ffe0a0'); skin.addColorStop(.56,enemy.type==='bomb'?'#ed7a48':'#d99b4d'); skin.addColorStop(1,enemy.type==='bomb'?'#963c31':'#8b5a31');
    c.fillStyle=skin; c.beginPath(); c.ellipse(0,-79,36,43,Math.sin(t*4+x)*.025,0,Math.PI*2); c.fill();
    c.strokeStyle='rgba(94,60,32,.35)'; c.lineWidth=2; c.stroke();
    // petites taches de peau
    c.fillStyle='rgba(115,71,35,.34)'; [[-19,-89],[-7,-111],[20,-73],[10,-57]].forEach(([px,py])=>{c.beginPath();c.ellipse(px,py,2.8,1.7,.3,0,Math.PI*2);c.fill();});
    if(enemy.type==='bomb') {
      c.fillStyle='#393638'; c.beginPath(); c.arc(0,-116,8,Math.PI,Math.PI*2); c.lineTo(8,-111); c.lineTo(-8,-111); c.fill();
      c.strokeStyle='#353438'; c.lineWidth=4; c.beginPath(); c.moveTo(0,-122); c.quadraticCurveTo(8,-136,17,-129); c.stroke();
      c.fillStyle='#ffdd57'; c.beginPath(); c.arc(18,-130,5+Math.sin(t*18)*1.4,0,Math.PI*2); c.fill();
      c.fillStyle='#a83229'; c.beginPath(); c.roundRect(-26,-67,52,23,7); c.fill();
    } else {
      c.fillStyle='#27a7a1'; c.beginPath(); c.roundRect(-27,-68,54,29,8); c.fill();
      c.fillStyle='#ffcf4e'; c.fillRect(-9,-68,18,28);
      c.fillStyle='#f4e7c3'; c.beginPath(); c.arc(-12,-79,7,0,Math.PI*2); c.arc(12,-79,7,0,Math.PI*2); c.fill();
      c.fillStyle='#263b43'; c.beginPath(); c.arc(-11,-78,3,0,Math.PI*2); c.arc(13,-78,3,0,Math.PI*2); c.fill();
      c.strokeStyle='#583a24'; c.lineWidth=2.5; c.beginPath(); c.moveTo(-9,-63); c.quadraticCurveTo(0,-56,9,-63); c.stroke();
    }
    if(enemy.type==='bomb') {
      c.fillStyle='#fff'; c.beginPath(); c.arc(-12,-83,5,0,Math.PI*2); c.arc(12,-83,5,0,Math.PI*2); c.fill();
      c.fillStyle='#3a2b30'; c.beginPath(); c.arc(-11,-82,2.5,0,Math.PI*2); c.arc(13,-82,2.5,0,Math.PI*2); c.fill();
    }
    if(enemy.hp<2) { c.fillStyle='#2c3c3e'; c.fillRect(-25,-133,50,5); c.fillStyle='#ff6b58'; c.fillRect(-25,-133,25,5); }
    c.restore();
  }
  function drawPickup3(c,x,y,h,pk,t) {
    const u=h/86;
    c.save(); c.translate(x,y-4-Math.sin(t*4+pk.x)*4); c.scale(u,u);
    const col=pk.type==='life'?'255,105,119':pk.type==='speed'?'255,100,224':'83,206,255';
    const glow=c.createRadialGradient(0,-41,2,0,-41,47); glow.addColorStop(0,`rgba(${col},.45)`); glow.addColorStop(1,`rgba(${col},0)`);
    c.fillStyle=glow; c.beginPath(); c.arc(0,-41,47,0,Math.PI*2); c.fill();
    if(pk.type==='speed') {
      c.fillStyle='#ff75dd'; c.beginPath(); for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?18:34;c.lineTo(Math.cos(a)*r, -41+Math.sin(a)*r);} c.closePath();c.fill();
      c.fillStyle='#fff2b2'; c.beginPath(); c.moveTo(-2,-61); c.lineTo(11,-45); c.lineTo(2,-45); c.lineTo(7,-27); c.lineTo(-10,-47); c.lineTo(-2,-47); c.closePath(); c.fill();
    } else if(pk.type==='shield') {
      c.fillStyle='#52c8ff'; c.strokeStyle='#e5faff'; c.lineWidth=4; c.beginPath(); c.moveTo(0,-73); c.lineTo(28,-63); c.lineTo(23,-37); c.quadraticCurveTo(15,-21,0,-14); c.quadraticCurveTo(-15,-21,-23,-37); c.lineTo(-28,-63); c.closePath(); c.fill(); c.stroke();
      c.fillStyle='rgba(255,255,255,.48)'; c.fillRect(-10,-62,5,23);
    } else {
      const skin=c.createRadialGradient(-10,-59,2,0,-41,35); skin.addColorStop(0,'#fff2b4'); skin.addColorStop(.55,'#ff9c88'); skin.addColorStop(1,'#ce435c');
      c.fillStyle=skin; c.beginPath(); c.ellipse(0,-42,28,31,-.1,0,Math.PI*2); c.fill();
      c.fillStyle='#fff'; c.font='bold 35px system-ui'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('+',0,-42);
    }
    c.restore();
  }
  function drawWorldSprite3(c,sp,p,horizon,zBuf) {
    const kind = sp.spriteType || sp.type;
    const pr=project3(sp.x,sp.y,p,horizon,zBuf); if(!pr) return;
    const sizeMap={palm:1.18,umbrella:.88,stall:1.03,balloon:.48,flag:.80,crate:.57,enemy:.92,speed:.47,shield:.47,life:.47};
    let h=Math.min(H*1.45,H/(pr.depth*.88)*(sp.scale||sizeMap[kind]||1));
    if(kind==='enemy' && sp.emerge>0) h *= .35 + .65*(1-Math.min(1,sp.emerge/.88));
    const bottom=pr.ground;
    if(kind==='enemy') drawEnemy3(c,pr.sx,bottom,h,sp,p.t);
    else if(kind==='speed'||kind==='shield'||kind==='life') drawPickup3(c,pr.sx,bottom,h,sp,p.t);
    else {
      const u=h/(kind==='palm'?180:kind==='umbrella'?130:kind==='stall'?100:kind==='flag'?130:kind==='crate'?60:80);
      if(kind==='palm') drawPalm3(c,pr.sx,bottom,u,p.t);
      else if(kind==='umbrella') drawUmbrella3(c,pr.sx,bottom,u);
      else if(kind==='stall') drawStall3(c,pr.sx,bottom,u);
      else if(kind==='balloon') drawBeachball3(c,pr.sx,bottom,u,p.t);
      else if(kind==='flag') drawFlag3(c,pr.sx,bottom,u,p.t);
      else if(kind==='crate') drawCrate3(c,pr.sx,bottom,u);
    }
  }
  function drawWeapon3(c,p) {
    const bobX=Math.sin(p.bob)*2.7, bobY=Math.abs(Math.cos(p.bob))*(p.bob>0?2.4:1.4)-p.recoil*95;
    c.save(); c.translate(W*.71+bobX,H*.84+bobY); c.rotate(-.055-p.recoil*.08);
    // avant-bras en manche turquoise et main gantée
    c.fillStyle='#207e7c'; c.beginPath(); c.moveTo(-6,24); c.lineTo(76,4); c.lineTo(109,72); c.lineTo(29,98); c.closePath(); c.fill();
    c.fillStyle='#f4bd78'; c.beginPath(); c.ellipse(51,14,28,17,-.28,0,Math.PI*2); c.fill();
    // poignée marron, puis corps du blaster turquoise à facettes
    c.fillStyle='#5e3927'; c.beginPath(); c.moveTo(25,7); c.lineTo(52,0); c.lineTo(76,61); c.lineTo(45,77); c.closePath(); c.fill();
    c.fillStyle='#146f75'; c.beginPath(); c.moveTo(-16,-39); c.lineTo(40,-57); c.lineTo(81,-37); c.lineTo(98,-5); c.lineTo(55,18); c.lineTo(10,3); c.closePath(); c.fill();
    c.fillStyle='#2cc0b3'; c.beginPath(); c.moveTo(-16,-39); c.lineTo(40,-57); c.lineTo(67,-43); c.lineTo(19,-25); c.closePath(); c.fill();
    c.fillStyle='#f3c65e'; c.beginPath(); c.moveTo(40,-57); c.lineTo(81,-37); c.lineTo(98,-5); c.lineTo(67,-22); c.lineTo(67,-43); c.closePath(); c.fill();
    c.fillStyle='#26474b'; c.beginPath(); c.moveTo(13,-34); c.lineTo(68,-53); c.lineTo(67,-80); c.lineTo(36,-91); c.lineTo(6,-72); c.closePath(); c.fill();
    c.fillStyle='#afc5c5'; c.beginPath(); c.moveTo(22,-48); c.lineTo(61,-62); c.lineTo(61,-84); c.lineTo(37,-91); c.lineTo(22,-82); c.closePath(); c.fill();
    c.fillStyle='#4a6669'; c.fillRect(34,-87,25,11);
    c.fillStyle='#293a41'; c.beginPath(); c.moveTo(29,-89); c.lineTo(64,-101); c.lineTo(69,-83); c.lineTo(34,-72); c.closePath(); c.fill();
    // Culasse, stries de préhension, vis métalliques et ombres de contact.
    c.fillStyle='#17262d'; c.beginPath(); c.moveTo(22,-77); c.lineTo(42,-83); c.lineTo(45,-68); c.lineTo(25,-62); c.closePath(); c.fill();
    c.fillStyle='#7d969b'; for(let i=0;i<5;i++) c.fillRect(25+i*3,-78+i*.2,1.3,9);
    c.fillStyle='#e2ece5'; for(const [sx,sy] of [[18,-48],[41,-56],[30,-75]]) { c.beginPath(); c.arc(sx,sy,1.6,0,Math.PI*2); c.fill(); }
    c.strokeStyle='rgba(7,19,24,.65)'; c.lineWidth=2; c.beginPath(); c.moveTo(8,-38); c.lineTo(17,-26); c.lineTo(29,-25); c.stroke();
    c.fillStyle='#e6ad46'; c.beginPath(); c.ellipse(7,-30,12,8,-.35,0,Math.PI*2); c.fill();
    c.fillStyle='#ffe99b'; c.beginPath(); c.ellipse(7,-30,5,3,-.35,0,Math.PI*2); c.fill();
    c.fillStyle='#fff1bd'; c.fillRect(36,-54,3,11);
    if(p.muzzleT>0) {
      const m=p.muzzleT/.085;
      c.save(); c.translate(51,-102); c.scale(.65+m*.5,.65+m*.5);
      c.fillStyle='rgba(255,236,119,.9)'; c.beginPath(); c.moveTo(0,-24); c.lineTo(7,-7); c.lineTo(24,0); c.lineTo(7,7); c.lineTo(0,23); c.lineTo(-7,7); c.lineTo(-23,0); c.lineTo(-7,-7); c.closePath(); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.arc(0,0,6,0,Math.PI*2); c.fill(); c.restore();
    }
    c.restore();
  }
  function drawHud3(c,p,horizon) {
    if(p.level===4) {
      c.fillStyle='rgba(12,15,20,.82)'; roundRect3(c,14,14,210,92,13); c.fillStyle='#e6d5b8'; c.font='800 12px system-ui'; c.textAlign='left'; c.fillText('FORTERESSE DES PATATES',27,34); c.fillStyle='#f4bb65'; c.font='900 19px system-ui'; c.fillText('VIES  '+p.lives,27,59); c.fillStyle='#ddd'; c.font='700 11px system-ui'; c.fillText('INTÉGRITÉ',27,77); c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(27,83,180,8); c.fillStyle=p.health>55?'#7fcb9a':p.health>28?'#e7b85e':'#e65d4d'; c.fillRect(27,83,180*Math.max(0,p.health)/100,8);
      const boss=p.enemies.find(e=>e.boss); c.textAlign='center'; c.fillStyle='#f2dbb9'; c.font='900 13px system-ui'; c.fillText(boss&&boss.hp>0?`ROI PATATE · PHASE ${boss.phase||1}`:'ROI PATATE',W/2,30); c.fillStyle='rgba(0,0,0,.76)'; roundRect3(c,W/2-190,40,380,16,5); c.fillStyle='#71272a'; roundRect3(c,W/2-187,43,374,10,4); if(boss&&boss.hp>0){c.fillStyle='#e65e3e';roundRect3(c,W/2-187,43,374*Math.max(0,boss.hp/boss.maxHp),10,4);}
      c.fillStyle='rgba(12,15,20,.82)'; roundRect3(c,14,H-62,230,46,10); c.fillStyle=p.overheated?'#ff755e':'#ddd'; c.font='900 11px system-ui'; c.textAlign='left'; c.fillText(p.overheated?'BLASTER EN SURCHAUFFE':'TEMPÉRATURE DU BLASTER',25,H-45); c.fillStyle='rgba(255,255,255,.16)'; c.fillRect(25,H-36,204,7); c.fillStyle=p.heat>78?'#ff493f':p.heat>48?'#f3a145':'#65c6bc'; c.fillRect(25,H-36,204*Math.min(1,p.heat/100),7); c.textAlign='center'; c.fillStyle='#fff'; c.font='900 20px system-ui'; c.fillText(`${Math.ceil(g.time)}s`,W/2,H-28);
      c.strokeStyle=p.hitMarkerT>0?'#ffd76b':'#fff'; c.lineWidth=2; c.beginPath(); c.moveTo(W/2-10,H/2);c.lineTo(W/2-4,H/2);c.moveTo(W/2+4,H/2);c.lineTo(W/2+10,H/2);c.moveTo(W/2,H/2-10);c.lineTo(W/2,H/2-4);c.moveTo(W/2,H/2+4);c.lineTo(W/2,H/2+10);c.stroke(); drawWeapon64(c,p); return;
    }
    // cartouche objectif
    c.fillStyle='rgba(15,43,51,.78)'; roundRect3(c,14,14,278,106,15);
    c.fillStyle='#9cf2dc'; c.font='800 15px system-ui'; c.textAlign='left'; c.textBaseline='alphabetic'; c.fillText('FERME AUX PATATES  /  3D',29,36);
    c.fillStyle='#fff2c6'; c.font='900 23px system-ui'; c.fillText('Protège la ferme !',29,61);
    c.fillStyle='rgba(255,255,255,.18)'; roundRect3(c,29,73,244,10,5);
    c.fillStyle='#ffc857'; roundRect3(c,29,73,244*Math.min(1,p.kills/p.goal),10,5);
    c.fillStyle='#fff'; c.font='700 13px system-ui'; c.fillText(`PATATES DÉFENDUES  ${p.kills} / ${p.goal}`,29,99);
    // chrono
    c.fillStyle='rgba(15,43,51,.78)'; roundRect3(c,W/2-53,14,106,48,13);
    c.textAlign='center'; c.fillStyle='#fff'; c.font='900 23px system-ui'; c.fillText(`${Math.ceil(g.time)}s`,W/2,44);
    // vie et bouclier
    c.fillStyle='rgba(15,43,51,.78)'; roundRect3(c,W-198,14,184,106,15);
    c.textAlign='left'; c.fillStyle='#ffc8bd'; c.font='800 15px system-ui'; c.fillText('VIES  '+p.lives, W-181,36);
    c.fillStyle='#c3f0ea'; c.fillText('ÉNERGIE',W-181,58);
    c.fillStyle='rgba(255,255,255,.18)'; roundRect3(c,W-181,66,154,10,5);
    const hpColor=p.health>50?'#61dda9':p.health>25?'#ffd16b':'#ff6b6b'; c.fillStyle=hpColor; roundRect3(c,W-181,66,154*Math.max(0,p.health)/100,10,5);
    c.fillStyle='#fff'; c.font='700 12px system-ui'; c.fillText(`${Math.max(0,Math.ceil(p.health))}%`,W-181,91);
    if(p.shieldT>0 || p.speedT>0) {
      c.fillStyle='rgba(15,43,51,.72)'; roundRect3(c,W-198,127,184,39,11);
      c.font='700 12px system-ui'; c.fillStyle='#9feaff';
      c.fillText(p.shieldT>0?`BOUCLIER  ${p.shieldT.toFixed(1)}s`:`VITESSE  ${p.speedT.toFixed(1)}s`,W-181,151);
    }
    // commandes compactes
    c.fillStyle='rgba(15,43,51,.62)'; roundRect3(c,14,H-49,474,35,10);
    c.fillStyle='rgba(255,255,255,.95)'; c.font='700 12px system-ui'; c.textAlign='left'; c.fillText('ZQSD bouger  •  ESPACE sauter  •  SOURIS viser  •  CLIC tirer  •  MAJ dash',25,H-27);
    // jauge de dash
    c.fillStyle='rgba(15,43,51,.70)'; roundRect3(c,W-198,H-47,184,35,10);
    c.fillStyle='#a6f4eb'; c.font='700 12px system-ui'; c.fillText(p.dashCd<=0?'DASH PRÊT':`DASH  ${p.dashCd.toFixed(1)}s`,W-181,H-25);
    c.fillStyle='rgba(255,255,255,.18)'; roundRect3(c,W-82,H-36,55,8,4);
    c.fillStyle='#ffcf58'; roundRect3(c,W-82,H-36,55*(1-Math.min(1,p.dashCd/2.25)),8,4);
    const best = getRecord3();
    c.fillStyle='rgba(20,44,47,.52)'; roundRect3(c,W/2-80,H-47,160,29,9);
    c.textAlign='center'; c.fillStyle='#ffecad'; c.font='700 11px system-ui'; c.fillText(`RECORD  ${best} éliminations`,W/2,H-29);
    if(p.standT>1.0) {
      const alpha=.78+Math.sin(p.t*16)*.14;
      c.fillStyle=`rgba(119,39,23,${alpha})`; roundRect3(c,W/2-165,H-98,330,36,10);
      c.textAlign='center'; c.fillStyle='#fff2c5'; c.font='900 15px system-ui'; c.fillText('LE SOL CRAQUE… BOUGE !',W/2,H-75);
    }
  }
  function getRecord3() {
    try { return Number(localStorage.getItem('patateVacationBest3') || 0); } catch (_) { return 0; }
  }
  // ====== MOTEUR 3D NATIF : style plateforme cartoon fin des années 90 ======
  // Tous les objets sont des triangles/polygones 3D projetés sur Canvas.
  // Pas de librairie externe : terrain, ombres, ennemis et personnage sont en volume.
  const M64_FOCAL = 500;
  const M64_VIEW = 18.0;
  function viewRange64(p) { return p.level === 3 ? 64 : M64_VIEW; }
  function focalLength64(p) { return p.level === 3 ? 330 : M64_FOCAL; }
  let TERRAIN_GRID64 = null;

  function terrainHeight64(x, y) {
    if (L3 && L3.level === 4) return 0.025 * Math.sin(x * 1.7) * Math.cos(y * 1.35);
    // Niveau 3 : le sol est strictement plat, même aux coordonnées décimales des ennemis/tirs.
    if (L3 && L3.level === 3) return 0;
    if (TERRAIN_GRID64 && Number.isInteger(x) && Number.isInteger(y) && TERRAIN_GRID64[y] && TERRAIN_GRID64[y][x] !== undefined) return TERRAIN_GRID64[y][x];
    // Relief en grandes bosses douces : l'île est composée de collines low-poly.
    const rolling = 0.16 * Math.sin(x * 0.31) * Math.cos(y * 0.27) +
                    0.085 * Math.sin((x + y) * 0.61);
    const hill = (cx, cy, rx, ry, height) => {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      return height * Math.exp(-0.5 * (dx * dx + dy * dy));
    };
    return rolling + hill(10, 8, 4.2, 3.8, 2.15) +
      hill(29, 7, 5.0, 3.8, 3.15) + hill(47, 10, 4.4, 4.0, 2.35) +
      hill(53, 29, 5.5, 4.8, 2.75) + hill(34, 36, 5.0, 4.2, 2.35) +
      hill(13, 34, 4.0, 3.7, 2.0) - hill(22, 23, 5.5, 4.0, .32);
  }
  // Les sommets du terrain sont fixes : calculons leurs hauteurs une seule fois.
  TERRAIN_GRID64 = Array.from({ length: MAPH + 1 }, (_, y) =>
    Array.from({ length: MAPW + 1 }, (_, x) => terrainHeight64(x, y))
  );

  function rgb64(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function shade64(hex, factor) {
    const c = rgb64(hex).map(v => Math.max(0, Math.min(255, Math.round(v * factor))));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  function camera64(p) {
    // Caméra FPS : placée au niveau des yeux, directement à la position du joueur.
    const yaw = p.camYaw == null ? p.ang : p.camYaw;
    const pitch = p.pitch == null ? 0 : p.pitch;
    return {
      x: p.x,
      y: p.y,
      level: p.level,
      z: terrainHeight64(p.x, p.y) + 1.56 + (p.jumpZ || 0),
      yaw, pitch,
      cs: Math.cos(yaw), sn: Math.sin(yaw),
      cp: Math.cos(pitch), sp: Math.sin(pitch)
    };
  }

  function inView64(x, y, p, margin = 1.2) {
    const dx = x - p.x, dy = y - p.y;
    const cs = p.viewCos == null ? Math.cos(p.camYaw) : p.viewCos;
    const sn = p.viewSin == null ? Math.sin(p.camYaw) : p.viewSin;
    const forward = dx * cs + dy * sn;
    const side = -dx * sn + dy * cs;
    if (Math.hypot(dx, dy) > viewRange64(p) + margin || forward < -margin) return false;
    // Frustum approximatif : évite de générer les polygones situés hors de l'écran.
    return Math.abs(side) <= Math.max(1.8, forward * .94 + margin);
  }

  function projectPoint64(x, y, z, cam) {
    const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
    const forward = dx * cam.cs + dy * cam.sn;
    const side = -dx * cam.sn + dy * cam.cs;
    // Convention FPS : un pitch positif regarde vers le ciel.
    const depth = forward * cam.cp + dz * cam.sp;
    if (depth < 0.08) return null;
    const up = dz * cam.cp - forward * cam.sp;
    return {
      x: W / 2 + focalLength64(cam) * side / depth,
      y: H / 2 - focalLength64(cam) * up / depth,
      depth
    };
  }

  function poly64(queue, pts, color, stroke = null, alpha = 1) {
    let vertices = pts;
    let projected = vertices.map(v => projectPoint64(v[0], v[1], v[2], queue.cam));
    // Dans la vue FPS, des triangles peuvent traverser la caméra. Coupe-les au plan proche
    // plutôt que de supprimer toute la face (sinon le sol proche crée des trous).
    if (projected.some(v => !v)) {
      const cam = queue.cam, near = .10;
      const depthOf = v => {
        const dx=v[0]-cam.x, dy=v[1]-cam.y, dz=v[2]-cam.z;
        const forward=dx*cam.cs+dy*cam.sn;
        return forward*cam.cp+dz*cam.sp;
      };
      const clipped=[];
      for (let i=0;i<vertices.length;i++) {
        const cur=vertices[i], prev=vertices[(i+vertices.length-1)%vertices.length];
        const dc=depthOf(cur), dp=depthOf(prev), inC=dc>=near, inP=dp>=near;
        if (inC !== inP) {
          const t=(near-dp)/(dc-dp);
          clipped.push([prev[0]+(cur[0]-prev[0])*t,prev[1]+(cur[1]-prev[1])*t,prev[2]+(cur[2]-prev[2])*t]);
        }
        if (inC) clipped.push(cur);
      }
      if (clipped.length<3) return;
      vertices=clipped;
      projected=vertices.map(v=>projectPoint64(v[0],v[1],v[2],cam));
      if (projected.some(v=>!v)) return;
    }
    let depth=0;
    for (const pr of projected) depth+=pr.depth;
    // Ignore tiny surfaces far outside the viewport.
    if (projected.every(v => v.x < -160 || v.x > W + 160) ||
        projected.every(v => v.y < -160 || v.y > H + 160)) return;
    queue.faces.push({ projected, color, stroke, alpha, depth: depth / projected.length });
  }

  function quad64(queue, a, b, c, d, color, stroke = null, alpha = 1) {
    poly64(queue, [a, b, c, d], color, stroke, alpha);
  }

  function shadow64(queue,x,y,z,rx,ry,alpha=.20,offsetX=.20,offsetY=.12) {
    const pts=[];
    for(let i=0;i<10;i++) {
      const a=i*Math.PI*2/10;
      pts.push([x+offsetX+Math.cos(a)*rx,y+offsetY+Math.sin(a)*ry,z+.028]);
    }
    poly64(queue,pts,`rgba(20,45,35,${alpha})`);
  }

  function box64(queue, x, y, z, w, d, h, colors) {
    const x0=x-w/2, x1=x+w/2, y0=y-d/2, y1=y+d/2, z1=z+h;
    const a=[x0,y0,z], b=[x1,y0,z], c=[x1,y1,z], e=[x0,y1,z];
    const A=[x0,y0,z1], B=[x1,y0,z1], C=[x1,y1,z1], E=[x0,y1,z1];
    quad64(queue, A, B, C, E, colors.top || '#e6c27f', colors.edge);
    quad64(queue, a, b, B, A, colors.front || '#bf8750', colors.edge);
    quad64(queue, b, c, C, B, colors.side || '#98643c', colors.edge);
    quad64(queue, c, e, E, C, colors.back || '#a87145', colors.edge);
    quad64(queue, e, a, A, E, colors.side || '#98643c', colors.edge);
  }

  function ellipsoid64(queue, x, y, z, rx, ry, rz, color, rings = 7, segs = 12, outline = null) {
    const verts = [];
    for (let j = 0; j <= rings; j++) {
      const phi = -Math.PI / 2 + Math.PI * j / rings;
      const ring = [];
      for (let i = 0; i <= segs; i++) {
        const a = Math.PI * 2 * i / segs;
        ring.push([
          x + Math.cos(phi) * Math.cos(a) * rx,
          y + Math.cos(phi) * Math.sin(a) * ry,
          z + Math.sin(phi) * rz
        ]);
      }
      verts.push(ring);
    }
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < segs; i++) {
        const a=verts[j][i], b=verts[j][i+1], c=verts[j+1][i+1], d=verts[j+1][i];
        const k = 0.78 + 0.24 * (1 - j / Math.max(1, rings)) + ((i + j) % 3) * 0.025;
        quad64(queue, a, b, c, d, shade64(color, k), outline);
      }
    }
  }

  function cylinder64(queue, x, y, z, r0, r1, h, color, segments = 7) {
    const bottom = [], top = [];
    for (let i=0;i<segments;i++) {
      const a=i*Math.PI*2/segments;
      bottom.push([x+Math.cos(a)*r0,y+Math.sin(a)*r0,z]);
      top.push([x+Math.cos(a)*r1,y+Math.sin(a)*r1,z+h]);
    }
    for (let i=0;i<segments;i++) {
      const n=(i+1)%segments;
      quad64(queue,bottom[i],bottom[n],top[n],top[i],shade64(color,.75+(i%3)*.09),'rgba(63,62,37,.20)');
    }
    poly64(queue, top, shade64(color, 1.16));
  }

  function local64(x, y, forward, side, ang) {
    return [x + Math.cos(ang)*forward - Math.sin(ang)*side,
            y + Math.sin(ang)*forward + Math.cos(ang)*side];
  }

  function palm64(queue, x, y, z, scale = 1) {
    cylinder64(queue, x, y, z, .20*scale, .105*scale, 2.45*scale, '#9d673d', 7);
    const topZ=z+2.35*scale;
    ellipsoid64(queue,x,y,topZ+.06*scale,.27*scale,.24*scale,.25*scale,'#4caa55',3,7);
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      const length=(1.0+(i%3)*.14)*scale;
      const bx=x+Math.cos(a)*.12*scale, by=y+Math.sin(a)*.12*scale;
      const mx=x+Math.cos(a)*length*.6, my=y+Math.sin(a)*length*.6;
      const tx=x+Math.cos(a)*length, ty=y+Math.sin(a)*length;
      const sideX=-Math.sin(a)*.23*scale, sideY=Math.cos(a)*.23*scale;
      const base=[bx,by,topZ], left=[mx+sideX,my+sideY,topZ+.18*scale];
      const right=[mx-sideX,my-sideY,topZ+.18*scale], tip=[tx,ty,topZ-.18*scale];
      poly64(queue,[base,left,tip],i%2?'#36bd70':'#42ce77');
      poly64(queue,[base,tip,right],i%2?'#218f58':'#299b5d');
      // nervure claire de la feuille
      poly64(queue,[base,[mx,my,topZ+.20*scale],tip],'rgba(203,255,159,.64)');
    }
    for(let i=0;i<3;i++) ellipsoid64(queue,x+(i-1)*.13*scale,y+.04*scale,topZ-.03*scale,.13*scale,.13*scale,.14*scale,'#e0a14a',3,6);
  }

  function umbrella64(queue,x,y,z,scale=1,t=0) {
    cylinder64(queue,x,y,z,.045*scale,.035*scale,1.62*scale,'#f5ead1',6);
    const r=.98*scale, top=z+1.69*scale, low=z+1.22*scale, n=10;
    for(let i=0;i<n;i++) {
      const a=i*Math.PI*2/n, b=(i+1)*Math.PI*2/n;
      const p1=[x+Math.cos(a)*r,y+Math.sin(a)*r,low];
      const p2=[x+Math.cos(b)*r,y+Math.sin(b)*r,low];
      const mid=[x+Math.cos((a+b)/2)*r*.74,y+Math.sin((a+b)/2)*r*.74,low+.09*scale];
      const tip=[x,y,top+Math.sin(t*2)*.025];
      poly64(queue,[tip,p1,mid],i%2?'#f96261':'#ffd65e');
      poly64(queue,[tip,mid,p2],i%2?'#f96261':'#ffe7a0');
    }
    ellipsoid64(queue,x,y,top,.09*scale,.09*scale,.08*scale,'#fff2b6',3,6);
  }

  function stall64(queue,x,y,z,scale=1) {
    box64(queue,x,y,z,1.55*scale,1.02*scale,1.45*scale,{top:'#ffdb9d',front:'#ffe8bc',side:'#edbb82',back:'#dca46c',edge:'rgba(95,63,43,.35)'});
    const roofZ=z+1.53*scale;
    box64(queue,x,y,roofZ,1.82*scale,1.16*scale,.14*scale,{top:'#f6d178',front:'#17a99d',side:'#e85d60',back:'#ffc85b',edge:'rgba(91,71,52,.3)'});
    for(let i=0;i<6;i++) {
      const stripeX=x-.82*scale+i*.328*scale;
      box64(queue,stripeX,y-.005*scale,roofZ+.02*scale,.16*scale,1.17*scale,.045*scale,
        {top:i%2?'#fff0bb':'#f45e60',front:i%2?'#fff0bb':'#f45e60',side:i%2?'#ead6a9':'#ce4b53',back:'#edb95b'});
    }
    box64(queue,x,y-.525*scale,z+.25*scale,.78*scale,.035*scale,.42*scale,{top:'#e9b65e',front:'#27a7a1',side:'#168078',back:'#168078'});
  }

  function flag64(queue,x,y,z,scale=1,t=0) {
    cylinder64(queue,x,y,z,.035*scale,.025*scale,1.9*scale,'#9d673d',6);
    const wave=Math.sin(t*2.3+x)*.10*scale;
    poly64(queue,[[x,y,z+1.83*scale],[x+1.0*scale,y+wave,z+1.68*scale],[x+.83*scale,y+wave+.05,z+1.30*scale],[x,y,z+1.43*scale]],'#ffc84f');
    poly64(queue,[[x,y,z+1.83*scale],[x+.48*scale,y+wave,z+1.76*scale],[x+.39*scale,y+wave+.05,z+1.56*scale],[x,y,z+1.43*scale]],'#f1685d');
  }

  function crate64(queue,x,y,z,scale=1) {
    box64(queue,x,y,z,.62*scale,.62*scale,.58*scale,{top:'#c28a4c',front:'#a97039',side:'#86572f',back:'#986437',edge:'#e0b16f'});
    // lattes diagonales sur les faces visibles
    const h=.58*scale;
    poly64(queue,[[x-.29*scale,y-.314*scale,z+.04*scale],[x-.19*scale,y-.314*scale,z+.04*scale],[x+.29*scale,y-.314*scale,z+h-.04*scale],[x+.19*scale,y-.314*scale,z+h-.04*scale]],'#e0b16f');
    poly64(queue,[[x+.29*scale,y-.314*scale,z+.04*scale],[x+.19*scale,y-.314*scale,z+.04*scale],[x-.29*scale,y-.314*scale,z+h-.04*scale],[x-.19*scale,y-.314*scale,z+h-.04*scale]],'#e0b16f');
  }

  function balloon64(queue,x,y,z,scale=1,t=0) {
    const zz=z+1.0*scale+Math.sin(t*2+x)*.08;
    ellipsoid64(queue,x,y,zz,.30*scale,.28*scale,.38*scale,'#f35f6b',5,8);
    poly64(queue,[[x,y,zz-.35*scale],[x+.04*scale,y,zz-.43*scale],[x-.03*scale,y,zz-.47*scale]],'#f2e6c9');
    poly64(queue,[[x,y,z+.58*scale],[x+.02*scale,y,z+.35*scale],[x-.04*scale,y,z+.13*scale]],'#e9e0bd');
  }

  function addRock64(queue,x,y,z,scale=1) {
    ellipsoid64(queue,x,y,z+.42*scale,.58*scale,.52*scale,.48*scale,'#c69c6c',4,7,'rgba(94,69,44,.28)');
    ellipsoid64(queue,x-.16*scale,y-.12*scale,z+.66*scale,.20*scale,.22*scale,.18*scale,'#dec196',3,6);
  }

  function flower64(queue,x,y,z,scale=1,t=0) {
    const sway=Math.sin(t*2.4+x)*.035*scale;
    cylinder64(queue,x,y,z,.035*scale,.022*scale,.42*scale,'#399956',5);
    const fx=x+sway, fz=z+.47*scale;
    for(let i=0;i<6;i++) {
      const a=i*Math.PI/3;
      ellipsoid64(queue,fx+Math.cos(a)*.115*scale,y+Math.sin(a)*.115*scale,fz,.105*scale,.095*scale,.08*scale,
        i%2?'#ff8a75':'#ffcf61',3,6);
    }
    ellipsoid64(queue,fx,y,fz+.015*scale,.08*scale,.08*scale,.07*scale,'#fff0a1',3,6);
  }

  function mushroom64(queue,x,y,z,scale=1,t=0) {
    const bob=Math.sin(t*2+x)*.025*scale;
    cylinder64(queue,x,y,z,.13*scale,.12*scale,.28*scale,'#f1dfae',7);
    ellipsoid64(queue,x,y,z+.31*scale+bob,.28*scale,.27*scale,.20*scale,
      Math.sin(x+y)>0?'#f45b5b':'#ee9b48',4,8,'rgba(111,64,43,.18)');
    ellipsoid64(queue,x-.09*scale,y-.10*scale,z+.43*scale+bob,.055*scale,.055*scale,.04*scale,'#fff6d6',3,6);
    ellipsoid64(queue,x+.11*scale,y+.04*scale,z+.40*scale+bob,.045*scale,.045*scale,.035*scale,'#fff6d6',3,6);
  }

  function drawMapCell64(queue,x,y,tile,t) {
    const z=terrainHeight64(x+.5,y+.5);
    if(tile==='W') return;
    if(tile==='C') {
      // Bande de sable du littoral et falaises plongeant dans l'océan.
      const x0=x,y0=y,x1=x+1,y1=y+1,deep=-4.1;
      const cL=tileAt3(x-1,y)==='W', cR=tileAt3(x+1,y)==='W';
      const cU=tileAt3(x,y-1)==='W', cD=tileAt3(x,y+1)==='W';
      if(cL) quad64(queue,[x0,y1,deep],[x0,y0,deep],[x0,y0,z],[x0,y1,z],'#8b6848');
      if(cR) quad64(queue,[x1,y0,deep],[x1,y1,deep],[x1,y1,z],[x1,y0,z],'#956d4b');
      if(cU) quad64(queue,[x0,y0,deep],[x1,y0,deep],[x1,y0,z],[x0,y0,z],'#a77a50');
      if(cD) quad64(queue,[x1,y1,deep],[x0,y1,deep],[x0,y1,z],[x1,y1,z],'#7d6047');
      quad64(queue,[x,y,z],[x+1,y,z],[x+1,y+1,z],[x,y+1,z],'#e2c27e','rgba(135,100,56,.24)');
      return;
    }
    if(tile==='G') {
      // Clôture basse en bois, avec poteaux et deux traverses : visuellement lisible et solide.
      const alongX = y === 2 || y === MAPH - 3;
      const wood = {top:'#bc9258',front:'#8b6339',side:'#694725',back:'#79532e',edge:'#d5b17b'};
      if (alongX) {
        box64(queue,x+.5,y+.5,z+.50,1.04,.09,.10,wood);
        box64(queue,x+.5,y+.5,z+1.02,1.04,.09,.10,wood);
        if ((x%2)===0) box64(queue,x+.5,y+.5,z,.13,.15,1.30,wood);
      }
      if (x === 2 || x === MAPW - 3) {
        box64(queue,x+.5,y+.5,z+.50,.09,1.04,.10,wood);
        box64(queue,x+.5,y+.5,z+1.02,.09,1.04,.10,wood);
        if ((y%2)===0) box64(queue,x+.5,y+.5,z,.15,.13,1.30,wood);
      }
    } else if(tile==='F') {
      const h = 3.35 + .12 * Math.sin(x * 2.1 + y * 1.3);
      box64(queue,x+.5,y+.5,z+h/2,1.03,1.03,h,{top:'#77716b',front:'#514d4a',side:'#3a3839',back:'#494542',edge:'#969087'});
      if ((x+y)%3===0) box64(queue,x+.5,y+.5,z+h-.13,.98,1.0,.17,{top:'#8c857b',front:'#65605a',side:'#45413f',back:'#59534e',edge:'#a49a8b'});
    } else if(tile==='B') {
      box64(queue,x+.5,y+.5,z+.48,.95,.95,.96,{top:'#8e7761',front:'#5a4a3d',side:'#44382f',back:'#554537',edge:'#a48b70'});
    } else if(tile==='#') {
      addRock64(queue,x+.5,y+.5,z,.72);
    } else if(tile==='T') {
      palm64(queue,x+.5,y+.5,z,.7);
    } else if(tile==='P') {
      stall64(queue,x+.5,y+.5,z,.65);
    }
  }

  function barnFarm64(queue,x,y,z,scale=1) {
    // Petite grange rouge à toit à deux pans, dessinée en polygones natifs.
    box64(queue,x,y,z,3.45*scale,2.65*scale,2.20*scale,
      {top:'#ba5a4c',front:'#a9433d',side:'#813631',back:'#923c36',edge:'#e5b39b'});
    const ridge=z+3.08*scale, eave=z+2.12*scale;
    poly64(queue,[[x-1.92*scale,y-1.43*scale,eave],[x,y-1.43*scale,ridge],[x,y+1.43*scale,ridge],[x-1.92*scale,y+1.43*scale,eave]],'#593a35');
    poly64(queue,[[x,y-1.43*scale,ridge],[x+1.92*scale,y-1.43*scale,eave],[x+1.92*scale,y+1.43*scale,eave],[x,y+1.43*scale,ridge]],'#714740');
    // Grande porte et croisillons blancs de grange.
    box64(queue,x,y-1.34*scale,z,.94*scale,.06*scale,1.66*scale,
      {top:'#472b28',front:'#542f2b',side:'#332221',back:'#472b28',edge:'#e4d7c5'});
    poly64(queue,[[x-.39*scale,y-1.39*scale,z+.10*scale],[x-.29*scale,y-1.40*scale,z+.10*scale],[x+.39*scale,y-1.40*scale,z+1.52*scale],[x+.29*scale,y-1.40*scale,z+1.52*scale]],'#e4d7c5');
    poly64(queue,[[x+.39*scale,y-1.40*scale,z+.10*scale],[x+.29*scale,y-1.40*scale,z+.10*scale],[x-.39*scale,y-1.40*scale,z+1.52*scale],[x-.29*scale,y-1.40*scale,z+1.52*scale]],'#e4d7c5');
    for(let i=-1;i<=1;i++) box64(queue,x+i*1.0*scale,y-1.34*scale,z+.75*scale,.07*scale,.065*scale,2.02*scale,
      {top:'#f1e6d6',front:'#f1e6d6',side:'#cfc0ad',back:'#f1e6d6'});
  }
  function hayFarm64(queue,x,y,z,scale=1) {
    box64(queue,x,y,z,.95*scale,.72*scale,.74*scale,
      {top:'#e8cf7a',front:'#c9a94e',side:'#a98937',back:'#b89b40',edge:'#f7e5a1'});
    for(let i=-1;i<=1;i++) {
      poly64(queue,[[x-.43*scale,y-.37*scale,z+.12*scale+i*.18*scale],[x-.33*scale,y-.38*scale,z+.10*scale+i*.18*scale],[x+.42*scale,y-.38*scale,z+.55*scale+i*.05*scale],[x+.34*scale,y-.38*scale,z+.60*scale+i*.05*scale]],'#f3df91');
    }
  }
  function siloFarm64(queue,x,y,z,scale=1) {
    cylinder64(queue,x,y,z,.78*scale,.72*scale,3.05*scale,'#bfc7c7',12);
    ellipsoid64(queue,x,y,z+3.02*scale,.74*scale,.74*scale,.40*scale,'#d9dddd',4,10);
    cylinder64(queue,x,y,z+3.22*scale,.20*scale,.15*scale,.34*scale,'#8b999b',8);
    for(let i=-1;i<=1;i++) box64(queue,x+i*.23*scale,y-.76*scale,z+.55*scale,.07*scale,.04*scale,2.1*scale,
      {top:'#8c9b9b',front:'#7f8d8e',side:'#667677',back:'#7f8d8e'});
  }
  function scarecrowFarm64(queue,x,y,z,scale=1) {
    cylinder64(queue,x,y,z,.085*scale,.065*scale,1.95*scale,'#89603a',7);
    box64(queue,x,y,z+.95*scale,1.02*scale,.18*scale,.14*scale,
      {top:'#b38a53',front:'#89633e',side:'#68492c',back:'#89633e'});
    box64(queue,x,y-.02*scale,z+.92*scale,.56*scale,.37*scale,.62*scale,
      {top:'#7f9ca6',front:'#527b88',side:'#3f626d',back:'#527b88',edge:'#d7e0d8'});
    ellipsoid64(queue,x,y-.03*scale,z+1.72*scale,.29*scale,.28*scale,.28*scale,'#c8a77c',4,7);
    box64(queue,x,y-.02*scale,z+2.01*scale,.68*scale,.48*scale,.12*scale,
      {top:'#50443b',front:'#352d28',side:'#28221f',back:'#352d28'});
    ellipsoid64(queue,x-.10*scale,y-.285*scale,z+1.75*scale,.025*scale,.02*scale,.03*scale,'#302b26',2,5);
    ellipsoid64(queue,x+.10*scale,y-.285*scale,z+1.75*scale,.025*scale,.02*scale,.03*scale,'#302b26',2,5);
  }
  function cornPatchFarm64(queue,x,y,z,scale=1) {
    // Petit groupe de tiges de maïs : il indique les rangs cultivés sans remplir tout l'écran.
    for(let i=0;i<5;i++) {
      const xx=x+(i-2)*.48*scale, yy=y+((i%2)-.5)*.28*scale;
      cylinder64(queue,xx,yy,z,.055*scale,.035*scale,1.05*scale,'#4c8d42',5);
      for(let j=0;j<3;j++) {
        const side=j%2?1:-1, zz=z+(.30+j*.25)*scale;
        poly64(queue,[[xx,yy,zz],[xx+side*.35*scale,yy-.05*scale,zz+.18*scale],[xx+side*.53*scale,yy-.04*scale,zz+.02*scale]],j%2?'#6aa94c':'#397a36');
      }
      ellipsoid64(queue,xx,yy,z+1.00*scale,.07*scale,.07*scale,.20*scale,'#e4d184',3,5);
    }
  }

  function addEnemyModel64(queue,e,p,t) {
    const baseZ=terrainHeight64(e.x,e.y), size=e.scale||1, z=baseZ;
    const ang=Math.atan2(p.y-e.y,p.x-e.x);
    const sk=e.skin||'#e4b56b', outfit=e.outfit||'#ed7655';
    const [lx,ly]=local64(e.x,e.y,0,-.32*size,ang), [rx,ry]=local64(e.x,e.y,0,.32*size,ang);
    // Ombre de contact douce : elle ancre la patate sur le relief au lieu de la faire flotter.
    const shadow=[];
    for(let i=0;i<12;i++){const a=i*Math.PI*2/12;shadow.push([e.x+Math.cos(a)*.47*size,e.y+Math.sin(a)*.33*size,z+.025]);}
    poly64(queue,shadow,'rgba(24,49,35,.28)');
    // Les profils changent vraiment de silhouette : coureur fin, tank lourd, artilleur équipé.
    const bulky=e.role==='tank'?1.22:e.role==='runner'?.80:1;
    ellipsoid64(queue,lx,ly,z+.14*size,.14*size,.16*size,.15*size,'#58412f',3,7);
    ellipsoid64(queue,rx,ry,z+.14*size,.14*size,.16*size,.15*size,'#58412f',3,7);
    // chaussures avec semelles sombres et petites brides
    for(const [fx,fy] of [[lx,ly],[rx,ry]]) {
      ellipsoid64(queue,fx+.035,fy,z+.075*size,.145*size,.17*size,.055*size,'#332f2b',3,7);
    }
    ellipsoid64(queue,...local64(e.x,e.y,.05*size,-.42*size,ang),z+.48*size,.14*size,.14*size,.20*size,sk,3,7);
    ellipsoid64(queue,...local64(e.x,e.y,.05*size,.42*size,ang),z+.48*size,.14*size,.14*size,.20*size,sk,3,7);
    // Torse en volume, avec tenue colorée et plastron selon le rôle.
    ellipsoid64(queue,e.x,e.y,z+.69*size,.43*size*bulky,.39*size,.51*size*bulky,e.type==='bomb'?'#e8754b':sk,8,12,'rgba(66,45,28,.30)');
    // Petites taches sur une peau de patate stylisée.
    for(let i=0;i<5;i++) {
      const a=i*2.399+e.phase;
      const sx=e.x+Math.cos(a)*.28*size, sy=e.y+Math.sin(a)*.25*size;
      ellipsoid64(queue,sx,sy,z+(.60+((i%2)*.16))*size,.028*size,.026*size,.023*size,'#755331',2,5);
    }
    // Yeux expressifs et petite bouche.
    const eyeZ=z+.78*size;
    for(const side of [-.14,.14]) {
      const [ex,ey]=local64(e.x,e.y,.32*size,side*size,ang);
      ellipsoid64(queue,ex,ey,eyeZ,.080*size,.066*size,.086*size,'#fff7de',3,7);
      const [px,py]=local64(ex,ey,.047*size,0,ang);
      ellipsoid64(queue,px,py,eyeZ,.034*size,.029*size,.045*size,'#242d35',3,6);
    }
    const [mx,my]=local64(e.x,e.y,.375*size,0,ang);
    poly64(queue,[[mx-.095*size,my,z+.50*size],[mx+.095*size,my,z+.50*size],[mx+.07*size,my,z+.47*size],[mx-.07*size,my,z+.47*size]],'#6d3928');
    // Accessoires distinctifs selon la classe.
    // Bandana/casque distinctif selon la classe.
    if(e.role==='tank') {
      ellipsoid64(queue,e.x,e.y,z+1.05*size,.39*size,.35*size,.17*size,'#56616a',4,8);
      box64(queue,e.x,e.y-.28*size,z+.99*size,.58*size,.08*size,.11*size,{top:'#84939a',front:'#53616a',side:'#34424b',back:'#53616a'});
    } else if(e.role==='scout') {
      ellipsoid64(queue,e.x,e.y,z+.99*size,.31*size,.29*size,.11*size,'#4f9569',3,8);
      poly64(queue,[[e.x-.18*size,e.y-.28*size,z+.98*size],[e.x+.18*size,e.y-.28*size,z+.98*size],[e.x+.10*size,e.y-.30*size,z+.82*size],[e.x-.10*size,e.y-.30*size,z+.82*size]],'#d1e8a5');
    } else if(e.type==='bomb') {
      ellipsoid64(queue,e.x,e.y,z+1.13*size,.16*size,.15*size,.10*size,'#40383a',3,7);
      cylinder64(queue,e.x+.1*size,e.y,z+1.18*size,.035*size,.028*size,.15*size,'#4a403d',5);
      const pulse=.045+(.5+.5*Math.sin(t*11+e.phase))*.045;
      ellipsoid64(queue,e.x+.16*size,e.y,z+1.35*size,pulse,pulse,pulse,'#ffd953',3,6);
    } else {
      ellipsoid64(queue,e.x,e.y,z+.99*size,.31*size,.29*size,.12*size,outfit,3,8);
    }
    if(e.armed) {
      // Pistolet uniquement si cette patate est armée : carcasse, poignée, culasse et canon métallique.
      const [handX,handY]=local64(e.x,e.y,.20*size,.39*size,ang);
      const [barrelX,barrelY]=local64(handX,handY,.22*size,0,ang);
      box64(queue,handX,handY,z+.53*size,.15*size,.13*size,.13*size,{top:'#47515b',front:'#303941',side:'#171e25',back:'#343d46',edge:'#9caeb4'});
      box64(queue,barrelX,barrelY,z+.585*size,.29*size,.09*size,.082*size,{top:'#82939b',front:'#3e4e58',side:'#222e37',back:'#303c45',edge:'#bec8c7'});
      box64(queue,...local64(handX,handY,-.055*size,0,ang),z+.42*size,.09*size,.10*size,.16*size,{top:'#ad7a4a',front:'#795232',side:'#503823',back:'#69472f'});
      ellipsoid64(queue,...local64(barrelX,barrelY,.11*size,0,ang),z+.63*size,.055*size,.055*size,.05*size,'#d1e8e8',3,6);
    }
    if(e.hp<e.maxHp) {
      const [hx,hy]=local64(e.x,e.y,0,0,ang), bw=.58*size;
      box64(queue,hx,hy,z+1.36*size,.62*size,.045*size,.065*size,{top:'#273b3d',front:'#273b3d',side:'#273b3d',back:'#273b3d'});
      box64(queue,hx-bw*.2,hy-.002,z+1.365*size,bw*Math.max(.08,e.hp/e.maxHp),.05*size,.055*size,{top:'#f46b5e',front:'#f46b5e',side:'#c53f41',back:'#c53f41'});
    }
  }

  function drawPlayerModel64(queue,p,t) {
    const x=p.x,y=p.y,z=terrainHeight64(x,y)+(p.jumpZ||0),a=p.ang;
    const [lX,lY]=local64(x,y,-.12,-.17,a), [rX,rY]=local64(x,y,-.12,.17,a);
    const [armLx,armLy]=local64(x,y,.02,-.37,a), [armRx,armRy]=local64(x,y,.04,.37,a);
    const step=Math.sin(p.bob)*.075*(p.jumpZ>0.05?0.25:1);
    // Ombre au sol : le personnage semble réellement décoller du terrain.
    ellipsoid64(queue,x,y,terrainHeight64(x,y)+.025,.43,.54,.025,'#456447',3,8);
    // bottes brunes et jambes bleues
    ellipsoid64(queue,lX,lY,z+.13+step,.13,.18,.13,'#633c29',3,7);
    ellipsoid64(queue,rX,rY,z+.13-step,.13,.18,.13,'#633c29',3,7);
    ellipsoid64(queue,lX,lY,z+.34+step,.14,.16,.22,'#2466b1',3,7);
    ellipsoid64(queue,rX,rY,z+.34-step,.14,.16,.22,'#2466b1',3,7);
    // salopette, torse rouge et bras
    ellipsoid64(queue,x,y,z+.73,.34,.30,.43,'#2875c5',5,8);
    ellipsoid64(queue,x,y,z+1.03,.36,.30,.34,'#e84d42',5,8);
    ellipsoid64(queue,armLx,armLy,z+.83,.13,.15,.31,'#e84d42',4,7);
    ellipsoid64(queue,armRx,armRy,z+.86,.13,.15,.30,'#e84d42',4,7);
    ellipsoid64(queue,...local64(x,y,.05,-.38,a),z+.64,.13,.14,.12,'#f0bd80',3,7);
    ellipsoid64(queue,...local64(x,y,.08,.40,a),z+.68,.13,.14,.12,'#f0bd80',3,7);
    // tête, cheveux et casquette rouge
    ellipsoid64(queue,x,y,z+1.53,.245,.235,.27,'#f1c48b',5,8);
    const [hairX,hairY]=local64(x,y,-.08,0,a);
    ellipsoid64(queue,hairX,hairY,z+1.61,.25,.24,.18,'#7b4b2f',4,7);
    ellipsoid64(queue,x,y,z+1.76,.27,.25,.105,'#d94238',4,8);
    ellipsoid64(queue,...local64(x,y,.105,0,a),z+1.72,.25,.19,.06,'#ef6251',3,8);
    // Grands yeux cartoon visibles lorsque la caméra orbite devant le personnage.
    for(const side of [-.085,.085]) {
      const [ex,ey]=local64(x,y,.215,side,a);
      ellipsoid64(queue,ex,ey,z+1.54,.052,.04,.075,'#fff8df',3,6);
      const [ix,iy]=local64(ex,ey,.025,0,a);
      ellipsoid64(queue,ix,iy,z+1.54,.022,.022,.040,'#263743',3,6);
    }
    // sac de plage rempli de patates : visible depuis la caméra derrière le personnage
    ellipsoid64(queue,...local64(x,y,-.31,0,a),z+.90,.25,.22,.30,'#d5a35b',3,6,'rgba(103,67,33,.25)');
    ellipsoid64(queue,...local64(x,y,-.34,0,a),z+1.13,.17,.16,.09,'#f1d08b',3,7);
    // petit blaster turquoise et orange dans la main droite
    const [gunX,gunY]=local64(x,y,.32,.36,a);
    const [gunBX,gunBY]=local64(gunX,gunY,.20,0,a);
    box64(queue,gunX,gunY,z+.79,.14,.13,.17,{top:'#ffce58',front:'#ed9e3d',side:'#bc713c',back:'#c68141'});
    box64(queue,gunBX,gunBY,z+.83,.22,.15,.11,{top:'#4ed0c4',front:'#25a7a8',side:'#13777f',back:'#13777f'});
  }

  function drawPickupModel64(queue,pk,t) {
    const z=terrainHeight64(pk.x,pk.y)+.75+Math.sin(t*4+pk.x)*.10;
    if(pk.type==='speed') {
      ellipsoid64(queue,pk.x,pk.y,z,.28,.28,.28,'#ed62db',4,7);
      poly64(queue,[[pk.x-.10,pk.y-.02,z+.15],[pk.x+.08,pk.y-.03,z+.02],[pk.x+.01,pk.y-.03,z+.02],[pk.x+.12,pk.y-.02,z-.16],[pk.x-.11,pk.y-.02,z-.01],[pk.x-.03,pk.y-.02,z-.01]],'#fff3a5');
    } else if(pk.type==='shield') {
      ellipsoid64(queue,pk.x,pk.y,z,.25,.17,.34,'#42c9f0',4,7);
      poly64(queue,[[pk.x,pk.y-.19,z+.38],[pk.x+.26,pk.y-.16,z+.21],[pk.x+.20,pk.y-.16,z-.10],[pk.x,pk.y-.18,z-.30],[pk.x-.20,pk.y-.16,z-.10],[pk.x-.26,pk.y-.16,z+.21]],'#aaf3ff');
    } else {
      ellipsoid64(queue,pk.x,pk.y,z,.28,.25,.34,'#ee737d',4,7);
      poly64(queue,[[pk.x-.055,pk.y-.26,z+.19],[pk.x+.055,pk.y-.26,z+.19],[pk.x+.055,pk.y-.26,z-.17],[pk.x-.055,pk.y-.26,z-.17]],'#fff4d1');
      poly64(queue,[[pk.x-.18,pk.y-.26,z+.02],[pk.x+.18,pk.y-.26,z+.02],[pk.x+.18,pk.y-.26,z-.08],[pk.x-.18,pk.y-.26,z-.08]],'#fff4d1');
    }
  }

  function makeGroundPolys64(queue,p) {
    const minX=Math.max(1,Math.floor(p.x-viewRange64(p))), maxX=Math.min(MAPW-2,Math.ceil(p.x+viewRange64(p)));
    const minY=Math.max(1,Math.floor(p.y-viewRange64(p))), maxY=Math.min(MAPH-2,Math.ceil(p.y+viewRange64(p)));
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const d=Math.hypot(x+.5-p.x,y+.5-p.y);
      const tile=tileAt3(x,y);
      if(d>viewRange64(p) || tile==='W' || !inView64(x+.5,y+.5,p,1.5)) continue;
      const z00=terrainHeight64(x,y), z10=terrainHeight64(x+1,y), z11=terrainHeight64(x+1,y+1), z01=terrainHeight64(x,y+1);
      const v00=[x,y,z00],v10=[x+1,y,z10],v11=[x+1,y+1,z11],v01=[x,y+1,z01];
      const coast=tile==='C';
      const hash=Math.abs(Math.sin(x*127.1+y*311.7)*43758.5453)%1;
      let base;
      const inCropPlot=p.level===3 && (((x>=11&&x<=24)&&(y>=11&&y<=38))||((x>=37&&x<=49)&&(y>=11&&y<=38)));
      if(p.level===4) base=hash>.78?'#5d5853':hash<.14?'#34353a':hash<.42?'#454448':'#504d4a';
      else if(p.level===3 && inCropPlot) {
        const furrow=(Math.floor((y-11)/3)%2)===0;
        base=furrow?(hash>.5?'#a48750':'#927442'):(hash>.5?'#6fa847':'#679d41');
      }
      else if(p.level===3) base=hash>.88?'#80bf50':hash<.12?'#639c3d':hash<.35?'#73ab45':'#7bb64b';
      else if(coast) base=hash>.5?'#d9b879':'#e8d09b';
      else if(hash>.90) base='#80c963';
      else if(hash<.07) base='#5eaa54';
      else if(hash<.24) base='#6fb75a';
      else base='#73bd5c';
      // Éclairage directionnel approximé à partir de la pente de chaque triangle.
      const slopeA=clamp(1+(z10-z00)*.11+(z11-z10)*.06,.83,1.16);
      const slopeB=clamp(1+(z01-z00)*.10+(z11-z01)*.06,.83,1.16);
      const k1=(hash>.5?1.035:.965)*slopeA, k2=(hash<.5?1.025:.955)*slopeB;
      poly64(queue,[v00,v10,v11],shade64(base,k1),'rgba(36,86,47,.12)');
      poly64(queue,[v00,v11,v01],shade64(base,k2),'rgba(36,86,47,.12)');
      // Textures discrètes. Les sillons des deux parcelles sont réguliers et plats.
      if(p.level===3 && inCropPlot && (y%3===0)) {
        const zz=terrainHeight64(x+.5,y+.5)+.028;
        poly64(queue,[[x+.08,y+.18,zz],[x+.92,y+.18,zz],[x+.92,y+.25,zz],[x+.08,y+.25,zz]],'rgba(70,48,23,.35)');
      }
      if(p.level!==4 && !coast && hash>.74 && hash<.82 && p.level!==3) {
        const z=terrainHeight64(x+.5,y+.5)+.025;
        const gx=x+.25+hash*.35, gy=y+.24+(1-hash)*.28;
        poly64(queue,[[gx,gy,z],[gx-.10,gy+.07,z+.10],[gx-.03,gy+.02,z+.17]],'#4d9848');
        poly64(queue,[[gx,gy,z],[gx+.11,gy+.08,z+.12],[gx+.045,gy+.025,z+.19]],'#76c762');
        if(hash>.795) ellipsoid64(queue,gx+.19,gy+.15,z+.035,.045,.038,.028,'#c5b78b',2,5);
      } else if(p.level===4 && hash>.82) {
        const z=terrainHeight64(x+.5,y+.5)+.032, gx=x+.18+hash*.28, gy=y+.22+(1-hash)*.3;
        poly64(queue,[[gx,gy,z],[gx+.17,gy+.11,z],[gx+.23,gy+.30,z],[gx+.15,gy+.34,z]],'#302f32');
      }
      // Taches sableuses au bord de mer et chemins légèrement usés dans les clairières.
      if(p.level!==4 && (coast || ((x+y)%9===0 && hash>.61)) && (x+y)%3===0) {
        const z=terrainHeight64(x+.5,y+.5)+.022;
        poly64(queue,[[x+.15,y+.24,z],[x+.74,y+.16,z],[x+.84,y+.66,z],[x+.31,y+.79,z]],coast?'rgba(244,220,165,.56)':'rgba(201,174,106,.24)');
      }
    }
  }

  function background64(c,p) {
    const horizon=H/2+focalLength64(p)*Math.tan(p.pitch);
    // Ligne d'horizon calculée localement : évite le ReferenceError qui bloquait
    // tout le rendu du niveau 3 au premier appel de background64().
    const waterTop=clamp(horizon, 0, H);
    const sky=c.createLinearGradient(0,0,0,H);
    if(p.level===4) { sky.addColorStop(0,'#141a25'); sky.addColorStop(.48,'#4b3332'); sky.addColorStop(1,'#9a5937'); }
    else if(p.level===3) { sky.addColorStop(0,'#72c9f2'); sky.addColorStop(.58,'#c5edfa'); sky.addColorStop(1,'#f7f0cf'); }
    else { sky.addColorStop(0,'#36b7e9'); sky.addColorStop(.48,'#8ce7ed'); sky.addColorStop(1,'#f9e7a8'); }
    c.fillStyle=sky; c.fillRect(0,0,W,H);
    const g0=clamp(horizon,0,H);
    if(horizon<H) {
      const floor=c.createLinearGradient(0,g0,0,H);
      if(p.level===4) { floor.addColorStop(0,'#484441'); floor.addColorStop(.45,'#302e31'); floor.addColorStop(1,'#1b2028'); }
      else if(p.level===3) { floor.addColorStop(0,'#78b64a'); floor.addColorStop(.45,'#6fa23d'); floor.addColorStop(1,'#547a32'); }
      else { floor.addColorStop(0,'#75c66b'); floor.addColorStop(.42,'#5cae63'); floor.addColorStop(1,'#27a8bd'); }
      c.fillStyle=floor; c.fillRect(0,g0,W,H-g0);
    }
    // soleil, visible quand on regarde vers le ciel
    const yaw=p.camYaw == null ? p.ang : p.camYaw;
    const sx=640-Math.sin(yaw)*55, sy=75+p.pitch*110;
    const sun=c.createRadialGradient(sx,sy,2,sx,sy,110);
    sun.addColorStop(0,'rgba(255,255,204,.9)'); sun.addColorStop(1,'rgba(255,255,204,0)');
    c.fillStyle=sun; c.fillRect(sx-110,sy-110,220,220);
    c.fillStyle='#fff4ba'; c.beginPath(); c.arc(sx,sy,22,0,Math.PI*2); c.fill();
    if(p.level===3) {
      // Horizon de ferme au rendu moderne : collines atmosphériques, variations de lumière,
      // nuages volumétriques et couches de brume pour donner une profondeur plus cinématique.
      const h=waterTop;
      const hill=(base,amp,period,phase,color)=>{
        c.beginPath(); c.moveTo(0,h+base);
        for(let x=0;x<=W+8;x+=8){
          const yy=h+base+Math.sin(x/period+phase)*amp+Math.sin(x/(period*.47)+phase*1.7)*amp*.23;
          c.lineTo(x,yy);
        }
        c.lineTo(W,H); c.lineTo(0,H); c.closePath(); c.fillStyle=color; c.fill();
      };
      c.fillStyle='#8dc9a1'; c.fillRect(0,h,W,H-h);
      hill(3,10,130,yaw*.08,'#b1d5a0');
      hill(12,15,175,yaw*.06+1.5,'#7eb878');
      hill(24,19,225,yaw*.045+3,'#619b59');
      hill(39,14,290,yaw*.03+2,'#4f8248');
      // Bande de lumière atmosphérique au niveau de l'horizon.
      const haze=c.createLinearGradient(0,h-18,0,h+70);
      haze.addColorStop(0,'rgba(244,255,225,.62)'); haze.addColorStop(1,'rgba(244,255,225,0)');
      c.fillStyle=haze; c.fillRect(0,h-18,W,88);
      // Nuages doux en plusieurs couches, avec une légère dérive au fil du temps.
      for(let i=0;i<6;i++){
        const cx=((i*241+p.t*7*(i%2?1:-1)+W*2)%(W+240))-100;
        const cy=48+(i%3)*34+Math.sin(p.t*.18+i)*4;
        const scale=.65+(i%3)*.18;
        c.save(); c.globalAlpha=.22+(i%3)*.055;
        const cloud=c.createRadialGradient(cx,cy,5,cx,cy,58*scale);
        cloud.addColorStop(0,'rgba(255,255,255,.92)'); cloud.addColorStop(1,'rgba(255,255,255,0)');
        c.fillStyle=cloud; c.fillRect(cx-70*scale,cy-28*scale,140*scale,56*scale);
        c.restore();
      }
      // Herbes et petites fleurs au premier plan : mouvement subtil, sans masquer le jeu.
      c.save(); c.globalAlpha=.38;
      for(let i=0;i<44;i++){
        const xx=((i*53+p.t*(8+(i%4)*2)+W*2)%(W+20))-10;
        const yy=h+42+(i*37)%(Math.max(45,H-h-35));
        const sway=Math.sin(p.t*2.1+i)*3;
        c.strokeStyle=i%4===0?'#d9d76b':(i%3===0?'#b9d77b':'#2d693d');
        c.lineWidth=i%5===0?2:1; c.beginPath(); c.moveTo(xx,yy+5); c.quadraticCurveTo(xx+sway,yy,xx+sway*1.6,yy-5-(i%4)); c.stroke();
      }
      c.restore();
    } else {
      // Reflets d'océan pour les niveaux qui utilisent encore l'île tropicale.
      c.save(); c.beginPath(); c.rect(0,waterTop,W,H-waterTop); c.clip();
      for(let i=0;i<20;i++) {
        const xx=(i*173 + Math.sin(yaw*2+i)*29 + 800)%W;
        const yy=waterTop+18+((i*67)%Math.max(32,H-waterTop-14));
        const ww=8+(i%5)*4;
        c.strokeStyle=i%3===0?'rgba(224,255,234,.27)':'rgba(12,131,168,.25)';
        c.lineWidth=1+(i%2)*.5; c.beginPath(); c.moveTo(xx,yy); c.quadraticCurveTo(xx+ww/2,yy-2,xx+ww,yy); c.stroke();
      }
      const shift=(yaw*95)%W; c.fillStyle='rgba(30,130,105,.72)';
      for(let i=0;i<5;i++) {
        const xx=((i*213-shift)%(W+180)+W+180)%(W+180)-90;
        const yy=waterTop+8+(i%3)*7;
        c.beginPath(); c.ellipse(xx,yy,35+(i%2)*21,8+(i%3)*3,0,Math.PI,Math.PI*2); c.fill();
      }
      c.restore();
    }
  }

  function drawWeapon64(c,p) {
    // Blaster de premier plan fixe à l'écran, avec un recul court et lisible.
    const kick = p.recoil > 0 ? p.recoil / .12 : 0;
    c.save();
    c.translate(W * .79 + kick * 8, H * .90 + kick * 11);
    c.rotate(-.13 + kick * .035);
    // avant-bras et gant
    c.fillStyle='#c98956'; c.beginPath(); c.moveTo(-4,-4); c.lineTo(37,8); c.lineTo(58,75); c.lineTo(14,92); c.lineTo(-24,29); c.closePath(); c.fill();
    c.fillStyle='#e0a36c'; c.beginPath(); c.moveTo(-4,0); c.lineTo(25,8); c.lineTo(34,48); c.lineTo(8,54); c.lineTo(-12,22); c.closePath(); c.fill();
    c.fillStyle='#2373ba'; c.beginPath(); c.moveTo(23,33); c.lineTo(67,48); c.lineTo(75,90); c.lineTo(22,90); c.closePath(); c.fill();
    // crosse turquoise
    c.fillStyle='#176b77'; c.beginPath(); c.moveTo(-4,-28); c.lineTo(21,-23); c.lineTo(32,12); c.lineTo(4,18); c.lineTo(-10,-7); c.closePath(); c.fill();
    c.fillStyle='#31bcb5'; c.beginPath(); c.moveTo(-10,-70); c.lineTo(66,-62); c.lineTo(77,-36); c.lineTo(7,-28); c.lineTo(-18,-45); c.closePath(); c.fill();
    c.fillStyle='#47e1d2'; c.beginPath(); c.moveTo(-10,-70); c.lineTo(66,-62); c.lineTo(55,-51); c.lineTo(-8,-57); c.closePath(); c.fill();
    // bouche du canon et anneau métallique
    c.fillStyle='#f0a344'; c.beginPath(); c.moveTo(-33,-72); c.lineTo(-9,-70); c.lineTo(-18,-44); c.lineTo(-39,-47); c.closePath(); c.fill();
    c.fillStyle='#283d49'; c.beginPath(); c.moveTo(-51,-75); c.lineTo(-32,-73); c.lineTo(-38,-46); c.lineTo(-57,-49); c.closePath(); c.fill();
    c.fillStyle='#8bded9'; c.beginPath(); c.ellipse(-45,-61,5,9,-.2,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(15,39,50,.55)'; c.fillRect(10,-51,34,4);
    // Détails matériels : rail, vis, viseur, poignée texturée et anneaux de canon.
    c.fillStyle='#1c333b'; c.fillRect(6,-60,39,5);
    c.fillStyle='#75e5da'; c.fillRect(14,-64,22,3);
    c.fillStyle='#e8b56a'; c.fillRect(-34,-69,14,3); c.fillRect(-36,-55,13,3);
    c.fillStyle='#a8c3c8'; c.fillRect(-48,-73,13,3); c.fillRect(-53,-53,12,3);
    c.fillStyle='#26343a'; c.beginPath(); c.moveTo(20,-69); c.lineTo(28,-82); c.lineTo(37,-81); c.lineTo(40,-65); c.closePath(); c.fill();
    c.fillStyle='#ffcf64'; c.fillRect(24,-77,9,3);
    c.strokeStyle='rgba(220,255,248,.6)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(4,-39); c.lineTo(22,-34); c.lineTo(28,-17); c.stroke();
    c.fillStyle='#101b22'; c.fillRect(11,-48,26,2);
    c.fillStyle='#e88b32'; c.fillRect(39,-56,7,4);
    if(p.muzzleT>0) {
      const m=p.muzzleT/.09;
      c.save(); c.translate(-60,-62); c.scale(.65+m*.38,.65+m*.38);
      c.fillStyle='rgba(255,222,84,.92)'; c.beginPath(); c.moveTo(0,-22); c.lineTo(7,-7); c.lineTo(21,0); c.lineTo(7,7); c.lineTo(0,22); c.lineTo(-7,7); c.lineTo(-21,0); c.lineTo(-7,-7); c.closePath(); c.fill();
      c.fillStyle='#fff'; c.beginPath(); c.arc(0,0,5,0,Math.PI*2); c.fill(); c.restore();
    }
    c.restore();
  }

  function draw3() {
    if(!L3) initL3();
    const p=L3, c=mainCtx;
    p.viewCos=Math.cos(p.camYaw == null ? p.ang : p.camYaw);
    p.viewSin=Math.sin(p.camYaw == null ? p.ang : p.camYaw);
    c.setTransform(1,0,0,1,0,0);
    c.imageSmoothingEnabled=true;
    c.clearRect(0,0,W,H);
    background64(c,p);
    const cam=camera64(p), queue={cam,faces:[]};
    makeGroundPolys64(queue,p);

    // Construire les obstacles en volume ; les arbres deviennent de vrais modèles 3D.
    const x0=Math.max(0,Math.floor(p.x-viewRange64(p))), x1=Math.min(MAPW-1,Math.ceil(p.x+viewRange64(p)));
    const y0=Math.max(0,Math.floor(p.y-viewRange64(p))), y1=Math.min(MAPH-1,Math.ceil(p.y+viewRange64(p)));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) {
      const tile=tileAt3(x,y);
      if(tile==='.') continue;
      if(Math.hypot(x+.5-p.x,y+.5-p.y)>viewRange64(p) || !inView64(x+.5,y+.5,p,1.5)) continue;
      const z=terrainHeight64(x+.5,y+.5);
      if(tile==='C' || tile==='#' || tile==='T' || tile==='P' || tile==='F' || tile==='B' || tile==='G') drawMapCell64(queue,x,y,tile,p.t);
    }

    for(const prop of (p.level===4 ? WORLD_PROPS4 : WORLD_FARM3)) {
      if(tileAt3(Math.floor(prop.x),Math.floor(prop.y))==='W') continue;
      if(!inView64(prop.x,prop.y,p,2.0)) continue;
      const z=terrainHeight64(prop.x,prop.y), sc=prop.scale||1;
      const shadowSize=prop.type==='barn'?1.9*sc:prop.type==='silo'?.75*sc:prop.type==='hay'?.62*sc:prop.type==='corn'?.9*sc:prop.type==='scarecrow'?.42*sc:prop.type==='palm'?.48*sc:prop.type==='stall'?.82*sc:prop.type==='umbrella'?.58*sc:prop.type==='crate'?.34*sc:.24*sc;
      shadow64(queue,prop.x,prop.y,z,shadowSize,shadowSize*.72,prop.type==='palm'?.24:.17,.35*sc,.18*sc);
      if(prop.type==='torch' || prop.type==='brazier') { box64(queue,prop.x,prop.y,z+.38*sc,.22*sc,.22*sc,.75*sc,{top:'#676365',front:'#35353a',side:'#24262d',back:'#3e3d40',edge:'#918b84'}); cylinder64(queue,prop.x,prop.y,z+.90*sc,.10*sc,.10*sc,.30*sc,'#40383a',7); ellipsoid64(queue,prop.x,prop.y,z+1.18*sc+Math.sin(p.t*11+prop.x)*.045,.16*sc,.16*sc,.24*sc,'#ff7a27',5,8); ellipsoid64(queue,prop.x,prop.y,z+1.27*sc,.075*sc,.075*sc,.14*sc,'#ffe5a2',4,7); }
      else if(prop.type==='banner') { cylinder64(queue,prop.x,prop.y,z+1.15*sc,.045*sc,.045*sc,2.3*sc,'#4b4140',6); poly64(queue,[[prop.x,prop.y-.03,z+2.1*sc],[prop.x+(.75*sc),prop.y-.03,z+1.85*sc],[prop.x,prop.y-.03,z+1.55*sc]],'#7b2030'); }
      else if(prop.type==='pillar') { cylinder64(queue,prop.x,prop.y,z+.9*sc,.25*sc,.25*sc,1.8*sc,'#6a625a',8); cylinder64(queue,prop.x,prop.y,z+1.86*sc,.38*sc,.38*sc,.18*sc,'#857a6d',8); }
      else if(prop.type==='sandbag') { for(let j=0;j<3;j++) ellipsoid64(queue,prop.x+(j-1)*.3*sc,prop.y,z+.26*sc,.24*sc,.38*sc,.22*sc,'#a28a69',4,8); }
      else if(prop.type==='palm') palm64(queue,prop.x,prop.y,z,sc);
      else if(prop.type==='umbrella') umbrella64(queue,prop.x,prop.y,z,sc,p.t);
      else if(prop.type==='stall') stall64(queue,prop.x,prop.y,z,sc);
      else if(prop.type==='balloon') balloon64(queue,prop.x,prop.y,z,sc,p.t);
      else if(prop.type==='flag') flag64(queue,prop.x,prop.y,z,sc,p.t);
      else if(prop.type==='crate') crate64(queue,prop.x,prop.y,z,sc);
      else if(prop.type==='flower') flower64(queue,prop.x,prop.y,z,sc,p.t);
      else if(prop.type==='mushroom') mushroom64(queue,prop.x,prop.y,z,sc,p.t);
      else if(prop.type==='barn') barnFarm64(queue,prop.x,prop.y,z,sc);
      else if(prop.type==='silo') siloFarm64(queue,prop.x,prop.y,z,sc);
      else if(prop.type==='hay') hayFarm64(queue,prop.x,prop.y,z,sc);
      else if(prop.type==='scarecrow') scarecrowFarm64(queue,prop.x,prop.y,z,sc);
      else if(prop.type==='corn') cornPatchFarm64(queue,prop.x,prop.y,z,sc);
    }

    // Nuages volumétriques en polygones légers.
    const cloudRows=[[5,4,6],[25,5,7],[10,25,7],[35,22,6]];
    for(let i=0;i<cloudRows.length;i++) {
      const [xx,yy,zz]=cloudRows[i];
      if(!inView64(xx,yy,p,7)) continue;
      const drift=Math.sin(p.t*.22+i)*.3;
      for(let k=0;k<3;k++) ellipsoid64(queue,xx+(k-1)*.48+drift,yy,zz+(k%2)*.11,.62,.42,.40,k%2?'#ffffff':'#eafaff',3,5);
    }

    // Bonus, ennemis et personnage sont eux aussi des formes volumétriques.
    for(const pk of p.pickups) if(pk.t>0 && inView64(pk.x,pk.y,p)) drawPickupModel64(queue,pk,p.t);
    for(const e of p.enemies) if(e.hp>0 && inView64(e.x,e.y,p)) addEnemyModel64(queue,e,p,p.t);
    // Pas de modèle joueur à dessiner : la caméra est à la première personne.

    // Le peintre 3D dessine les faces lointaines d'abord, puis celles proches.
    queue.faces.sort((a,b)=>b.depth-a.depth);
    c.lineJoin = 'round';
    for(const face of queue.faces) {
      const pts=face.projected;
      c.globalAlpha=face.alpha;
      c.beginPath(); c.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++) c.lineTo(pts[i].x,pts[i].y);
      c.closePath(); c.fillStyle=face.color; c.fill();
      if(face.stroke) { c.strokeStyle=face.stroke; c.lineWidth=.55; c.stroke(); }
    }
    c.globalAlpha=1;

    // Projectiles ennemis dessinés dans la scène 3D, avec un petit halo lumineux.
    for(const b of p.enemyShots) {
      const pr=projectPoint64(b.x,b.y,b.z,cam);
      if(!pr) continue;
      const r=clamp(8/Math.max(.6,pr.depth/3),2,7);
      c.save(); c.fillStyle='rgba(255,92,52,.22)'; c.beginPath(); c.arc(pr.x,pr.y,r*2.4,0,Math.PI*2); c.fill();
      c.fillStyle=b.color||'#ff673d'; c.beginPath(); c.arc(pr.x,pr.y,r,0,Math.PI*2); c.fill();
      c.fillStyle='#fff0b5'; c.beginPath(); c.arc(pr.x-r*.2,pr.y-r*.2,r*.38,0,Math.PI*2); c.fill(); c.restore();
    }

    // Impacts et étincelles positionnés dans le monde 3D.
    for(const fx of p.fx) {
      const pr=projectPoint64(fx.x,fx.y,fx.z == null ? terrainHeight64(fx.x,fx.y)+.8 : fx.z,cam);
      if(!pr) continue;
      const r=(fx.big?21:9)/Math.max(.6,pr.depth/4);
      c.save(); c.globalAlpha=Math.min(1,fx.t*2.3);
      c.fillStyle=fx.hit?'rgba(255,82,77,.78)':fx.crack?'rgba(255,190,75,.82)':fx.muzzle?'rgba(255,105,55,.9)':'rgba(255,239,152,.85)';
      c.beginPath(); c.arc(pr.x,pr.y,r,0,Math.PI*2); c.fill(); c.restore();
    }

    // Viseur simple et marqueur d'impact.
    const cx=W/2, cy=H/2;
    c.strokeStyle=p.hitMarkerT>0?'#ffe36e':'rgba(255,255,255,.95)'; c.lineWidth=2;
    c.beginPath(); c.moveTo(cx-10,cy); c.lineTo(cx-4,cy); c.moveTo(cx+4,cy); c.lineTo(cx+10,cy);
    c.moveTo(cx,cy-10); c.lineTo(cx,cy-4); c.moveTo(cx,cy+4); c.lineTo(cx,cy+10); c.stroke();
    if(p.hitMarkerT>0) { c.lineWidth=2.6; c.beginPath(); c.moveTo(cx-6,cy-6); c.lineTo(cx-2,cy-2); c.moveTo(cx+6,cy-6); c.lineTo(cx+2,cy-2); c.moveTo(cx-6,cy+6); c.lineTo(cx-2,cy+2); c.moveTo(cx+6,cy+6); c.lineTo(cx+2,cy+2); c.stroke(); }

    // Lumière cinématique de ferme : bloom solaire, brume à l'horizon et profondeur.
    const horizon=H/2+focalLength64(p)*Math.tan(p.pitch);
    const sunX=clamp(W*.70-Math.sin(p.camYaw||p.ang)*68,60,W-60);
    const sunY=clamp(75+p.pitch*105,25,H*.42);
    const bloom=c.createRadialGradient(sunX,sunY,4,sunX,sunY,190);
    bloom.addColorStop(0,'rgba(255,244,190,.17)');
    bloom.addColorStop(.35,'rgba(255,230,165,.07)');
    bloom.addColorStop(1,'rgba(255,230,165,0)');
    c.fillStyle=bloom; c.fillRect(sunX-190,sunY-190,380,380);
    if(horizon<H){
      const haze=c.createLinearGradient(0,Math.max(0,horizon-65),0,Math.min(H,horizon+95));
      haze.addColorStop(0,'rgba(224,247,255,0)');
      haze.addColorStop(.52,'rgba(235,248,221,.18)');
      haze.addColorStop(1,'rgba(235,248,221,0)');
      c.fillStyle=haze; c.fillRect(0,Math.max(0,horizon-65),W,160);
    }
    // Brins d'herbe en avant-plan : ils donnent une échelle et renforcent la sensation 3D.
    c.save(); c.globalAlpha=.28;
    for(let i=0;i<58;i++){
      const x=((i*137 + Math.sin(p.t*.7+i)*13)% (W+24))-12;
      const y=H-2-(i%5)*3;
      const h=5+(i%6)*2;
      c.strokeStyle=i%3===0?'#d7e99a':i%3===1?'#315e2c':'#4f8737';
      c.lineWidth=i%4===0?2:1;
      c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x-2+Math.sin(p.t+i)*2,y-h*.6,x+Math.sin(p.t*.8+i)*4,y-h); c.stroke();
    }
    c.restore();
    // Rayons de soleil animés et lueurs colorées pour donner plus de vie à la ferme.
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = .10 + .035 * Math.sin(p.t * 1.25);
    const ray = c.createLinearGradient(sunX - 80, sunY, sunX + 170, H);
    ray.addColorStop(0, 'rgba(255,244,183,.42)');
    ray.addColorStop(.48, 'rgba(255,214,135,.12)');
    ray.addColorStop(1, 'rgba(255,214,135,0)');
    c.fillStyle = ray;
    c.beginPath(); c.moveTo(sunX - 25, sunY); c.lineTo(sunX + 28, sunY);
    c.lineTo(W * .83, H); c.lineTo(W * .35, H); c.closePath(); c.fill();
    c.globalAlpha = .16;
    for (let i = 0; i < 10; i++) {
      const x = ((i * 97 + p.t * (8 + i % 3) * (i % 2 ? 1 : -1)) % (W + 40) + W + 40) % (W + 40) - 20;
      const y = 95 + (i * 37) % 250 + Math.sin(p.t * 1.4 + i) * 7;
      const r = 2 + (i % 3);
      c.fillStyle = ['#fff0a8', '#a7f3d0', '#9fe7ff', '#ffd0ec'][i % 4];
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    c.restore();
    // Vignettage doux, antialiasé, avec contraste local plus marqué.
    const vignette=c.createRadialGradient(W/2,H/2,170,W/2,H/2,520);
    vignette.addColorStop(0,'rgba(16,59,48,0)'); vignette.addColorStop(.72,'rgba(16,59,48,.05)'); vignette.addColorStop(1,'rgba(16,39,28,.31)');
    c.fillStyle=vignette; c.fillRect(0,0,W,H);
    drawWeapon64(c,p);
    drawHud3(c,p,H/2+focalLength64(p)*Math.tan(p.pitch));
    if(p.inv>0 && Math.floor(p.t*18)%2===0) { c.fillStyle='rgba(255,88,74,.12)'; c.fillRect(0,0,W,H); }
  }

  function hud() {
    plank(8, 6, 150, 32); label('TEMPS ' + Math.ceil(g.time), 83, 22, 'center');
    plank(190, 6, 420, 32); rr(ctx, 198, 13, 404, 18, 8, '#2a1406');
    const fill = 404 * Math.min(1, g.count / g.goal);
    if (fill > 4) rr(ctx, 198, 13, fill, 18, 8, lin(ctx, 0, 13, 0, 31, '#ffe07a', '#d9901a'));
    label('RÉCOLTE ' + g.count + ' / ' + g.goal, 400, 22, 'center', '#fff', 16);
    const w = g.weather;
    plank(642, 6, 150, 32);
    label(g.level === 1 ? w.type.toUpperCase() + (w.type === 'vent' ? (w.wind > 0 ? ' ->' : ' <-') : '') : g.level === 2 ? 'NIVEAU 2' : 'NIVEAU 3', 717, 22, 'center', '#bfe3ff', 16);
    if (g.combo > 1) {
      plank(8, 44, 190, 32); label('COMBO ' + g.combo + '   x' + mult(), 103, 58, 'center', '#ffd23f');
      rr(ctx, 14, 67, Math.max(2, 178 * g.comboT / COMBO_TIME), 4, 2, '#ffd23f');
    }
    let y = 56; for (const k in g.power) if (g.power[k] > 0) { label(POWER[k] + ' ' + Math.ceil(g.power[k]) + 's', 790, y, 'right', POWER_COL[k], 16); y += 22; }
    if (g.level === 3) {
      const yy = g.combo > 1 ? 80 : 44;
      plank(8, yy, 190, 32); label('PANIER ' + g.inventory + '/' + g.maxInv, 103, yy + 14, 'center', '#fff', 16);
      label('VIES ' + g.lives, 790, y, 'right', '#ff6b4a', 16);
    }
    if (g.banner > 0) label(g.msg, W / 2, 100, 'center', '#fff', 22);
  }

  // ====== DÉMARRER / FINIR / RECOMMENCER ======
  function clearGameInputs() {
    // Évite les tirs continus, déplacements bloqués et touches collées après
    // un changement de niveau, la pause du navigateur ou un écran de fin.
    for (const k of Object.keys(keys)) keys[k] = false;
    if (window.L3keys) {
      window.L3keys.w = window.L3keys.a = window.L3keys.s = window.L3keys.d = false;
      window.L3keys.shoot = window.L3keys.dash = window.L3keys.jump = false;
    }
    if (window.L4keys) {
      window.L4keys.up = window.L4keys.down = window.L4keys.left = window.L4keys.right = false;
      window.L4keys.dodge = false;
    }
    if (B4) B4.mouseDown = false;
    if (B5) {
      B5.keys.up = B5.keys.down = B5.keys.left = B5.keys.right = false;
      B5.touchPointerId = null; B5.touchTarget = null; B5.dashPressed = false;
    }
    lastFreeMouse = null;
  }
  function releaseMouseCapture() {
    clearGameInputs();
    try {
      if (document.pointerLockElement && typeof document.exitPointerLock === 'function') {
        document.exitPointerLock();
      }
    } catch (_) { /* Certains navigateurs peuvent refuser la libération au changement d'onglet. */ }
  }
  function start(level) {
    releaseMouseCapture();
    paused = false;
    $('pause').classList.add('hidden');
    level = clamp(Number(level) || 1, 1, 5);
    if (level === 4) level = 5;
    reset(level);
    // Réinitialisation explicite des moteurs autonomes : évite de réutiliser
    // l'état d'un ancien niveau et garantit que le premier rendu a ses données.
    L3 = null; B4 = null; B5 = null;
    state = 'play';
    $('menu').classList.add('hidden');
    $('end').classList.add('hidden');
    $('pause').classList.add('hidden');
    // Tous les niveaux 1–5 sont dessinés sur le canvas 2D principal.
    // Les canvases WebGL historiques restent cachés pour ne jamais masquer le jeu.
    cv.style.display = 'block';
    cv.style.visibility = 'visible';
    cv4.style.display = 'none';
    overlay4.style.display = 'none';
    cv.style.cursor = level === 3 ? 'crosshair' : 'default';
    mainCtx.setTransform(1, 0, 0, 1, 0, 0);
    mainCtx.clearRect(0, 0, W, H);
    if (level === 3) initL3();
    if (level === 4) initArena4();
    if (level === 5) initLevel5();
    // Dessine immédiatement une première image pour éviter un canvas vide
    // jusqu'au prochain tick d'animation.
    draw();
  }
  function readBest(level) {
    try { return Number(localStorage.getItem('patateVacationBest' + level) || 0); } catch (_) { return 0; }
  }
  function saveBest(level, value) {
    try {
      const key='patateVacationBest'+level, best=Number(localStorage.getItem(key)||0);
      if(value>best) localStorage.setItem(key,String(value));
    } catch (_) { /* Le jeu fonctionne aussi si le stockage local est désactivé. */ }
  }
  function endGame(win) {
    // Certaines conditions (objectif atteint + dernières vies perdues dans la
    // même frame) peuvent appeler endGame deux fois : la première issue gagne.
    if (!g || state !== 'play') return;
    paused = false;
    $('pause').classList.add('hidden');
    state = 'over';
    releaseMouseCapture();
    $('endTitle').textContent = win ? 'Victoire !' : 'Game over';
    $('endTitle').className = win ? 'win' : 'lose';
    const metric = (g.level===4 || g.level===5) ? (win ? 1 : 0) : g.level===3 ? (L3 ? L3.kills : 0) : g.count;
    saveBest(g.level, metric);
    if (g.level===5 && B5) {
      const best=readBest(5);
      $('endTitle').textContent = win ? 'PATATE VAINCUE !' : 'TON ÂME A CÉDÉ';
      $('endTitle').className = win ? 'win' : 'lose';
      $('endText').textContent = (win
        ? `Tu as vaincu Sans-Patate en phase ${B5.phase}. Le Potager souterrain est libre.`
        : `Sans-Patate t’a battu après ${B5.turn} tours. Il lui restait ${Math.max(0,Math.ceil(B5.bossHp))} PV.`)
        + ` Score : ${B5.score}. Esquives : ${B5.dodges}. Coups reçus : ${B5.hitsTaken}. Record : ${best} victoire(s).`;
    } else if (g.level===4 && B4) {
      const best=readBest(4);
      $('endText').textContent = (win
        ? `Tu as vaincu le Roi Patate en phase ${B4.phase} ! Les vacances sont sauvées.`
        : `Le Roi Patate a gagné cette fois. Il lui reste ${Math.max(0,Math.ceil(B4.boss.hp))} PV.`)
        + ` Score : ${B4.score}. Gardes vaincus : ${B4.kills}. Temps : ${Math.round(g.dur-g.time)} s. Record : ${best} victoire(s).`;
    } else if (g.level===3 && L3) {
      const best=readBest(g.level);
      $('endText').textContent=(win ? `Festival sauvé ! Tu as neutralisé ${L3.kills}/${L3.goal} patates mutantes.` : `L'île est envahie : ${L3.kills}/${L3.goal} patates mutantes neutralisées.`)+` Record personnel : ${best} éliminations. Temps écoulé : ${Math.round(g.dur-g.time)} s.`;
    } else {
      $('endText').textContent = (win ? `Objectif atteint en ${Math.round(g.dur - g.time)} secondes !` : `Tu as récolté ${g.count} patates sur ${g.goal}.`) +
        ` Meilleur combo : ${g.bestCombo}. Record : ${readBest(g.level)}.` + (win && g.level === 2 ? ' · Niveau 3 débloqué !' : '');
    }
    $('btnNext').textContent = 'Niveau ' + (g.level===3 ? 4 : g.level+1);
    $('btnNext').classList.toggle('hidden', !(win && g.level>=1 && g.level<=3));
    $('end').classList.remove('hidden');
  }
  $('btnLv1').onclick = () => start(1);
  $('btnLv2').onclick = () => start(2);
  $('btnLv3').onclick = () => start(3);
  $('btnLv4').onclick = () => start(4);
  addEventListener('keydown', handleLevel5KeyDown);
  addEventListener('keyup', handleLevel5KeyUp);

  // ----- contrôles FPS pour le niveau 3 -----
  window.L3keys = { w:false,a:false,s:false,d:false,shoot:false,dash:false,jump:false };
  addEventListener('keydown', e => {
    if (!g || state !== 'play' || (g.level !== 3 && g.level !== 4)) return;
    const c = e.code;
    if (c === 'KeyW' || c === 'KeyZ' || c === 'ArrowUp') window.L3keys.w = true;
    if (c === 'KeyS' || c === 'ArrowDown') window.L3keys.s = true;
    if (c === 'KeyA' || c === 'KeyQ' || c === 'ArrowLeft') window.L3keys.a = true;
    if (c === 'KeyD' || c === 'ArrowRight') window.L3keys.d = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(c)) e.preventDefault();
    if (c === 'ShiftLeft' || c === 'ShiftRight') window.L3keys.dash = true;
    if (c === 'Space') { window.L3keys.jump = true; e.preventDefault(); }
    if (g.level === 4) {
      const k=window.L4keys;
      if(c==='KeyW'||c==='KeyZ'||c==='ArrowUp')k.up=true;
      if(c==='KeyS'||c==='ArrowDown')k.down=true;
      if(c==='KeyA'||c==='KeyQ'||c==='ArrowLeft')k.left=true;
      if(c==='KeyD'||c==='ArrowRight')k.right=true;
      if(c==='Space'||c==='ShiftLeft'||c==='ShiftRight')k.dodge=true;
    }
  });
  addEventListener('keyup', e => {
    if (!g || (g.level !== 3 && g.level !== 4)) return;
    const c = e.code;
    if (c === 'KeyW' || c === 'KeyZ' || c === 'ArrowUp') window.L3keys.w = false;
    if (c === 'KeyS' || c === 'ArrowDown') window.L3keys.s = false;
    if (c === 'KeyA' || c === 'KeyQ' || c === 'ArrowLeft') window.L3keys.a = false;
    if (c === 'KeyD' || c === 'ArrowRight') window.L3keys.d = false;
    if (c === 'ShiftLeft' || c === 'ShiftRight') window.L3keys.dash = false;
    if (c === 'Space') window.L3keys.jump = false;
    if (g.level === 4) {
      const k=window.L4keys;
      if(c==='KeyW'||c==='KeyZ'||c==='ArrowUp')k.up=false;
      if(c==='KeyS'||c==='ArrowDown')k.down=false;
      if(c==='KeyA'||c==='KeyQ'||c==='ArrowLeft')k.left=false;
      if(c==='KeyD'||c==='ArrowRight')k.right=false;
      if(c==='Space'||c==='ShiftLeft'||c==='ShiftRight')k.dodge=false;
    }
  });
  cv.addEventListener('click', () => {
    // Le niveau 3 fonctionne en FPS avec verrouillage de souris, mais reste jouable
    // en mouvement libre si cette API n'est pas disponible/acceptée.
    if (g && g.level===3 && state==='play' && !document.pointerLockElement && cv.requestPointerLock) {
      try {
        const request = cv.requestPointerLock();
        if (request && typeof request.catch === 'function') request.catch(() => { lastFreeMouse = null; });
      } catch (_) { lastFreeMouse = null; }
    }
  });
  // Le niveau 4 est une arène isométrique : il ne capture jamais la souris.
  cv4.addEventListener('click', () => {});
  document.addEventListener('pointerlockchange', () => {
    if (!document.pointerLockElement) {
      if (window.L3keys) { window.L3keys.shoot = false; window.L3keys.jump = false; window.L3keys.dash = false; }
      if (B4) B4.mouseDown = false;
      lastFreeMouse = null;
    }
  });
  document.addEventListener('mousemove', e => {
    if (!g || state !== 'play' || g.level !== 3 || !L3) return;
    if (document.pointerLockElement===cv || document.pointerLockElement===cv4) {
      // Contrôles FPS classiques : mouvement horizontal = tourner, souris vers le haut = regarder en haut.
      L3.camYaw = normAngle3((L3.camYaw == null ? L3.ang : L3.camYaw) + (e.movementX || 0) * 0.0028);
      L3.pitch = clamp(L3.pitch - (e.movementY || 0) * 0.0026, -1.0, 1.0);
    }
  });
  document.addEventListener('mousedown', e => {
    if (g && state==='play' && (g.level===3 || g.level===4) && e.button===0) window.L3keys.shoot=true;
  });
  document.addEventListener('mouseup', e => {
    if (g && (g.level===3 || g.level===4) && e.button===0) window.L3keys.shoot=false;
  });
  $('btnNext').onclick = () => start(g && g.level===3 ? 4 : (g && g.level ? g.level : 1) + 1);
  $('btnRetry').onclick = () => start(g.level);
  $('btnMenu').onclick = () => { releaseMouseCapture(); paused=false; $('pause').classList.add('hidden'); state='menu'; $('end').classList.add('hidden'); $('menu').classList.remove('hidden'); cv.style.display='block'; cv4.style.display='none'; overlay4.style.display='none'; cv.style.cursor='default'; };
  $('btnResume').onclick = resumeGame;
  $('btnPauseRetry').onclick = () => { if (g) start(g.level); };
  $('btnPauseMenu').onclick = () => { releaseMouseCapture(); paused=false; $('pause').classList.add('hidden'); state='menu'; $('end').classList.add('hidden'); $('menu').classList.remove('hidden'); cv.style.display='block'; cv4.style.display='none'; overlay4.style.display='none'; cv.style.cursor='default'; };
  $('menu').addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('button')) lastFreeMouse = null; });

  function drawMenuScene(ts) {
    const canvas = $('menuScene');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const pw = Math.round(rect.width * dpr), ph = Math.round(rect.height * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width, h = rect.height, t = ts * .001;
    const horizon = h * .43, focal = Math.min(w, h) * .78;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sway = reduced ? 0 : Math.sin(t * .16) * 3;
    c.clearRect(0, 0, w, h);
    const sky = c.createLinearGradient(0, 0, 0, horizon * 1.4);
    sky.addColorStop(0, '#111a25'); sky.addColorStop(.55, '#405052'); sky.addColorStop(1, '#c18b60');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    const sun = c.createRadialGradient(w * .72, horizon * .73, 2, w * .72, horizon * .73, h * .24);
    sun.addColorStop(0, 'rgba(255,207,139,.46)'); sun.addColorStop(1, 'rgba(255,179,108,0)');
    c.fillStyle = sun; c.fillRect(0, 0, w, horizon * 1.5);
    function ridge(y, color, peaks) {
      c.beginPath(); c.moveTo(0, horizon + y);
      for (let i = 0; i < peaks.length; i++) c.lineTo(peaks[i][0] * w, horizon + y + peaks[i][1] * h);
      c.lineTo(w, horizon + y); c.closePath(); c.fillStyle = color; c.fill();
    }
    ridge(-h*.10, '#26363a', [[.08,-.10],[.19,-.19],[.29,-.05],[.42,-.22],[.54,-.08],[.67,-.17],[.79,-.06],[.91,-.16]]);
    ridge(-h*.035, '#34443c', [[.05,-.025],[.18,-.09],[.31,-.02],[.46,-.10],[.60,-.025],[.74,-.085],[.88,-.02]]);
    const ground = c.createLinearGradient(0, horizon, 0, h);
    ground.addColorStop(0, '#55533b'); ground.addColorStop(.3, '#454331'); ground.addColorStop(1, '#171d1b');
    c.fillStyle = ground; c.fillRect(0, horizon, w, h - horizon);
    function project(x, z) {
      const scale = focal / (z + 5);
      return { x: w * .5 + sway + x * scale, y: horizon + 2.0 * scale, scale };
    }
    c.lineCap = 'round';
    for (let i = -9; i <= 9; i++) {
      const a = project(i * 1.15, .35), b = project(i * 1.15, 54);
      c.beginPath(); c.moveTo(a.x, a.y + 28); c.lineTo(b.x, b.y);
      c.strokeStyle = i % 2 ? 'rgba(196,153,91,.20)' : 'rgba(12,20,17,.58)';
      c.lineWidth = Math.max(1, focal / 170); c.stroke();
    }
    const house = project(9.6, 34), hs = house.scale;
    c.fillStyle = '#252c29'; c.fillRect(house.x - 3.2*hs, house.y - 3.8*hs, 6.4*hs, 3.8*hs);
    c.beginPath(); c.moveTo(house.x - 3.8*hs, house.y - 3.7*hs); c.lineTo(house.x, house.y - 6.3*hs); c.lineTo(house.x + 3.8*hs, house.y - 3.7*hs); c.closePath(); c.fillStyle = '#382b28'; c.fill();
    c.fillStyle = 'rgba(239,174,98,.68)'; c.fillRect(house.x - 1.9*hs, house.y - 2.8*hs, .75*hs, .9*hs); c.fillRect(house.x + .9*hs, house.y - 2.8*hs, .75*hs, .9*hs);
    c.fillStyle = '#39413a'; c.fillRect(house.x + 4.7*hs, house.y - 3.2*hs, 1.5*hs, 3.2*hs);
    c.fillStyle = '#252d29'; c.beginPath(); c.ellipse(house.x + 5.45*hs, house.y - 3.2*hs, .9*hs, .45*hs, 0, Math.PI, 0); c.fill();
    function pine(x, z, tall) {
      const p = project(x, z), sc = p.scale, top = p.y - tall * sc;
      c.fillStyle = '#171f1d'; c.fillRect(p.x - .12*sc, top + tall*.48*sc, .24*sc, tall*.52*sc);
      for (let i=0;i<4;i++) {
        const yy = top + i * tall * .19 * sc, half = (1 - i*.14) * tall * .20 * sc;
        c.beginPath(); c.moveTo(p.x, yy); c.lineTo(p.x-half, yy + tall*.34*sc); c.lineTo(p.x+half, yy + tall*.34*sc); c.closePath();
        c.fillStyle = i%2 ? '#202b27' : '#1a2521'; c.fill();
      }
    }
    [[-17,5,7],[-13,10,6],[-19,19,7],[-11,27,5],[15,7,7],[18,14,8],[13,24,6],[20,33,7]].forEach(a=>pine(a[0],a[1],a[2]));
    const plants = [];
    for (const row of [-8,-5.4,-2.8,-.2,2.4,5,7.6]) for (let z=1.15; z<31; z+=1.9) plants.push([row + Math.sin(z*1.7+row)*.12, z]);
    plants.sort((a,b)=>b[1]-a[1]);
    for (const [x,z] of plants) {
      const p = project(x,z), sc=p.scale, size=Math.min(34,Math.max(2.2,sc*.42));
      if (p.x < -size*2 || p.x > w+size*2 || p.y > h+size*2) continue;
      const alpha=Math.min(.95,.32+sc/48);
      c.fillStyle=`rgba(34,48,30,${alpha})`;
      c.beginPath(); c.ellipse(p.x,p.y-size*.12,size*.72,size*.23,0,0,Math.PI*2); c.fill();
      c.strokeStyle=`rgba(89,116,61,${alpha})`; c.lineWidth=Math.max(1,size*.09);
      c.beginPath(); c.moveTo(p.x,p.y); c.lineTo(p.x-size*.26,p.y-size*.72); c.moveTo(p.x,p.y-size*.1); c.lineTo(p.x+size*.34,p.y-size*.64); c.moveTo(p.x,p.y-size*.16); c.lineTo(p.x+size*.02,p.y-size*.9); c.stroke();
      for (const [dx,dy,rx] of [[-.27,-.72,.29],[.34,-.64,.31],[.02,-.9,.3],[-.04,-.51,.25]]) {
        c.fillStyle=dx<0?'#62764a':'#74834a'; c.beginPath(); c.ellipse(p.x+dx*size,p.y+dy*size,rx*size,size*.13,dx,0,Math.PI*2); c.fill();
      }
      if (z<8) { c.fillStyle='rgba(142,93,55,.9)'; c.beginPath(); c.ellipse(p.x+size*.3,p.y+size*.09,size*.16,size*.10,-.25,0,Math.PI*2); c.fill(); }
    }
    const vignette=c.createRadialGradient(w*.5,h*.48,h*.18,w*.5,h*.48,Math.max(w,h)*.76);
    vignette.addColorStop(0,'rgba(4,8,11,0)'); vignette.addColorStop(1,'rgba(4,8,11,.72)');
    c.fillStyle=vignette; c.fillRect(0,0,w,h);
    const shade=c.createLinearGradient(0,0,0,h);
    shade.addColorStop(0,'rgba(10,17,25,.10)'); shade.addColorStop(.48,'rgba(10,14,15,.08)'); shade.addColorStop(1,'rgba(6,10,9,.32)');
    c.fillStyle=shade; c.fillRect(0,0,w,h);
  }
  function loop(ts) {
    const dt = Math.min(.05, (ts - last) / 1000); last = ts;
    if (state === 'play' && !paused) update(dt);
    draw();
    if (state === 'menu') drawMenuScene(ts);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
