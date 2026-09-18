/* =========================================================
   ژورنال معاملات v3 — کامل و اصلاح‌شده
   ========================================================= */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* =========================================================
     UTILS
     ========================================================= */
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  const toISO = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  };
  const todayISO = () => toISO(new Date());
  const fullDate = iso => {
    const p = String(iso).split('-');
    return p.length === 3 ? p[0] + '/' + p[1] + '/' + p[2] : iso;
  };
  const shortDate = iso => {
    const p = String(iso).split('-');
    return p.length === 3 ? p[1] + '/' + p[2] : iso;
  };
  const money = (n, withSign = true) => {
    const v = Number(n) || 0;
    const abs = Math.abs(v);
    const hasFrac = Math.round(abs * 100) % 100 !== 0;
    const s = abs.toLocaleString('en-US', {
      minimumFractionDigits: hasFrac ? 2 : 0,
      maximumFractionDigits: 2
    });
    if (!withSign) return '$' + s;
    if (v > 0) return '+$' + s;
    if (v < 0) return '-$' + s;
    return '$' + s;
  };
  const num = (n, d = 0) => (Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: d, maximumFractionDigits: d
  });
  const pct = n => (Number(n) || 0).toFixed(1) + '%';
  const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
  const compact = n => {
    const v = Number(n) || 0;
    const a = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (a >= 1e6) return sign + (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return sign + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return sign + Math.round(a);
  };
  const debounce = (fn, ms) => {
    let t;
    return function () {
      const a = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(self, a), ms);
    };
  };

  /* =========================================================
     CONSTANTS
     ========================================================= */
  const EMOTIONS = {
    calm:    { ico: '😌', label: 'آرام' },
    focused: { ico: '🎯', label: 'متمرکز' },
    fear:    { ico: '😨', label: 'ترس' },
    greed:   { ico: '🤑', label: 'طمع' },
    fomo:    { ico: '😤', label: 'FOMO' },
    revenge: { ico: '😡', label: 'انتقام' }
  };

  const DEFAULT_RULES = [
    { id: 'setup', text: 'ستاپ تأیید شد' },
    { id: 'stop',  text: 'حد ضرر مشخص شد' },
    { id: 'size',  text: 'حجم مناسب بود' },
    { id: 'plan',  text: 'طبق پلن پیش رفتم' }
  ];

  /* =========================================================
     STORAGE
     ========================================================= */
  const KEYS = {
    trades: 'tj.v3.trades',
    theme:  'tj.v3.theme',
    goal:   'tj.v3.goal',
    rules:  'tj.v3.rules'
  };

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed != null ? parsed : fallback;
    } catch (e) { return fallback; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { console.warn('Storage error:', e); }
  }

  /* =========================================================
     STATE
     ========================================================= */
  let trades = loadJSON(KEYS.trades, []);
  if (!Array.isArray(trades)) trades = [];
  let editingId = null;
  let range = '30';
  let calDate = new Date();
  let selectedEmotion = 'calm';
  let currentScreenshot = null;
  let theme = loadJSON(KEYS.theme, 'dark');
  let goal = loadJSON(KEYS.goal, null);
  let rules = loadJSON(KEYS.rules, {
    enabled: false, dailyLoss: 0, maxDD: 0, target: 0, balance: 10000
  });
  let filters = {
    search: '', strategy: 'all', tag: 'all', result: 'all',
    emotion: 'all', side: 'all', from: '', to: ''
  };

  function saveTrades() { saveJSON(KEYS.trades, trades); }

  /* =========================================================
     CALCULATIONS
     ========================================================= */
  const pnl = t => {
    const a = Math.abs(Number(t.amount) || 0);
    if (t.result === 'win') return a;
    if (t.result === 'loss') return -a;
    return 0;
  };

  const rMultiple = t => {
    const risk = Math.abs(Number(t.risk) || 0);
    if (!risk) return null;
    return r2(pnl(t) / risk);
  };

  const disciplineScore = (t, rulesArr) => {
    if (!rulesArr || !rulesArr.length) return null;
    const cl = t.checklist || {};
    let checked = 0;
    for (const r of rulesArr) if (cl[r.id]) checked++;
    return Math.round((checked / rulesArr.length) * 100);
  };

  const sortAsc = list => list.slice().sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (a.createdAt || 0) - (b.createdAt || 0);
  });

  function computeStats(list) {
    let wins = 0, losses = 0, be = 0, gp = 0, gl = 0, net = 0;
    let rSum = 0, rCount = 0;

    for (const t of list) {
      const p = pnl(t);
      net += p;
      if (t.result === 'win')       { wins++;  gp += p; }
      else if (t.result === 'loss') { losses++; gl += Math.abs(p); }
      else be++;

      const rm = rMultiple(t);
      if (rm != null) { rSum += rm; rCount++; }
    }

    const closed = wins + losses;
    const winRate = closed ? (wins / closed) * 100 : 0;
    const pf = gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0);
    const avgWin = wins ? gp / wins : 0;
    const avgLoss = losses ? gl / losses : 0;
    const expectancy = list.length ? net / list.length : 0;
    const avgR = rCount ? rSum / rCount : 0;

    const sorted = sortAsc(list);
    let equity = 0, peak = 0, maxDD = 0;
    for (const t of sorted) {
      equity += pnl(t);
      if (equity > peak) peak = equity;
      const dd = peak - equity;
      if (dd > maxDD) maxDD = dd;
    }

    return {
      total: list.length, wins, losses, be, closed,
      net, grossProfit: gp, grossLoss: gl,
      winRate, profitFactor: pf, avgWin, avgLoss,
      expectancy, maxDrawdown: maxDD, avgR, rCount
    };
  }

  function byDay(list) {
    const map = new Map();
    for (const t of sortAsc(list)) {
      let d = map.get(t.date);
      if (!d) {
        d = { date: t.date, net: 0, count: 0, wins: 0, losses: 0, profit: 0, loss: 0 };
        map.set(t.date, d);
      }
      const p = pnl(t);
      d.net += p;
      d.count++;
      if (t.result === 'win')       { d.wins++;   d.profit += p; }
      else if (t.result === 'loss') { d.losses++; d.loss += Math.abs(p); }
    }
    const arr = Array.from(map.values()).sort((a, b) => a.date < b.date ? -1 : 1);
    let cum = 0;
    for (const d of arr) {
      cum += d.net;
      d.cum = r2(cum); d.net = r2(d.net);
      d.profit = r2(d.profit); d.loss = r2(d.loss);
    }
    return arr;
  }

  function byStrategy(list) {
    const map = new Map();
    for (const t of list) {
      const key = t.strategy || 'بدون استراتژی';
      let s = map.get(key);
      if (!s) { s = { name: key, count: 0, wins: 0, losses: 0, net: 0 }; map.set(key, s); }
      s.count++;
      s.net += pnl(t);
      if (t.result === 'win') s.wins++;
      else if (t.result === 'loss') s.losses++;
    }
    const arr = Array.from(map.values());
    arr.forEach(s => {
      const c = s.wins + s.losses;
      s.winRate = c ? (s.wins / c) * 100 : 0;
      s.net = r2(s.net);
    });
    arr.sort((a, b) => b.net - a.net);
    return arr;
  }

  function byEmotion(list) {
    const map = new Map();
    for (const t of list) {
      const key = t.emotion || 'calm';
      let e = map.get(key);
      if (!e) { e = { key, count: 0, wins: 0, losses: 0, net: 0 }; map.set(key, e); }
      e.count++;
      e.net += pnl(t);
      if (t.result === 'win') e.wins++;
      else if (t.result === 'loss') e.losses++;
    }
    const arr = Array.from(map.values());
    arr.forEach(e => {
      const c = e.wins + e.losses;
      e.winRate = c ? (e.wins / c) * 100 : 0;
      e.net = r2(e.net);
    });
    arr.sort((a, b) => b.net - a.net);
    return arr;
  }

  function inRange(list, days) {
    if (days === 'all') return list.slice();
    const n = Number(days);
    if (!n) return list.slice();
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (n - 1));
    const iso = toISO(cutoff);
    return list.filter(t => t.date >= iso);
  }

  /* =========================================================
     GOALS
     ========================================================= */
  function getGoalProgress() {
    if (!goal || !goal.target) return null;

    const now = new Date();
    let startISO, endISO;

    if (goal.period === 'week') {
      const dayOfWeek = now.getDay();
      const daysSinceSat = (dayOfWeek + 1) % 7;
      const start = new Date(now);
      start.setDate(now.getDate() - daysSinceSat);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      startISO = toISO(start);
      endISO = toISO(end);
    } else {
      startISO = toISO(new Date(now.getFullYear(), now.getMonth(), 1));
      endISO = toISO(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }

    const periodTrades = trades.filter(t => t.date >= startISO && t.date <= endISO);
    const stats = computeStats(periodTrades);

    let current = 0;
    if (goal.metric === 'pnl') current = stats.net;
    else if (goal.metric === 'trades') current = stats.total;
    else if (goal.metric === 'winrate') current = stats.winRate;

    const progress = goal.target > 0 ? Math.max(0, Math.min(100, (current / goal.target) * 100)) : 0;
    return {
      current: r2(current), target: goal.target, progress,
      metric: goal.metric, period: goal.period,
      startISO, endISO, stats
    };
  }

  /* =========================================================
     PROP FIRM RULES
     ========================================================= */
  function checkRules() {
    if (!rules || !rules.enabled) return null;

    const today = todayISO();
    const todayTrades = trades.filter(t => t.date === today);
    let todayPnL = 0;
    for (const t of todayTrades) todayPnL += pnl(t);

    const allStats = computeStats(trades);
    const currentDD = allStats.maxDrawdown;
    const totalNet = allStats.net;

    const checks = { dailyLoss: null, maxDD: null, target: null };

    if (rules.dailyLoss > 0) {
      const loss = -todayPnL;
      const usage = Math.max(0, (loss / rules.dailyLoss) * 100);
      checks.dailyLoss = {
        loss, limit: rules.dailyLoss, usage,
        status: usage >= 100 ? 'bad' : usage >= 80 ? 'warn' : 'ok'
      };
    }
    if (rules.maxDD > 0) {
      const usage = (currentDD / rules.maxDD) * 100;
      checks.maxDD = {
        dd: currentDD, limit: rules.maxDD, usage,
        status: usage >= 100 ? 'bad' : usage >= 80 ? 'warn' : 'ok'
      };
    }
    if (rules.target > 0) {
      const progress = (totalNet / rules.target) * 100;
      checks.target = {
        net: totalNet, target: rules.target, progress,
        status: progress >= 100 ? 'ok' : progress >= 60 ? 'warn' : 'ok'
      };
    }
    return checks;
  }

  /* =========================================================
     SCREENSHOT
     ========================================================= */
  function compressImage(file, maxDim = 900, quality = 0.75) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let width = img.width, height = img.height;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          try { resolve(canvas.toDataURL('image/jpeg', quality)); }
          catch (err) { reject(err); }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* =========================================================
     CHART ENGINE
     ========================================================= */
  const FONT = "Vazirmatn, system-ui, Tahoma, sans-serif";

  function getChartColors() {
    const dark = document.documentElement.dataset.theme !== 'light';
    return {
      grid: dark ? 'rgba(120,150,200,.09)' : 'rgba(80,110,170,.12)',
      gridZero: dark ? 'rgba(120,150,200,.24)' : 'rgba(80,110,170,.3)',
      axis: dark ? '#7d8fae' : '#6b7a99',
      line: '#2ee6a6',
      areaTop: 'rgba(46,230,166,.35)',
      areaMid: 'rgba(46,230,166,.10)',
      areaBot: 'rgba(46,230,166,0)',
      posTop: 'rgba(120,255,210,1)',
      pos: 'rgba(46,230,166,.85)',
      negTop: 'rgba(255,140,160,1)',
      neg: 'rgba(255,86,116,.85)',
      cross: dark ? 'rgba(150,175,215,.4)' : 'rgba(80,110,170,.5)',
      tagBg: dark ? 'rgba(11,18,33,.97)' : 'rgba(255,255,255,.98)',
      tagBd: dark ? 'rgba(120,150,200,.35)' : 'rgba(80,110,170,.25)',
      text: dark ? '#eef3ff' : '#0f1830',
      muted: dark ? '#8697b8' : '#6b7a99'
    };
  }

  const charts = new WeakMap();

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 10);
    const h = Math.max(rect.height, 10);
    const pw = Math.round(w * dpr);
    const ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw; canvas.height = ph;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function niceScale(min, max, ticks) {
    ticks = ticks || 5;
    if (min === max) { min -= 1; max += 1; }
    const range = max - min;
    const raw = range / ticks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
    step *= mag;
    return {
      min: Math.floor(min / step) * step,
      max: Math.ceil(max / step) * step,
      step: step
    };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }

  function drawTag(ctx, cx, cy, lines, w, h) {
    const COL = getChartColors();
    ctx.font = '600 12px ' + FONT;
    let maxW = 0;
    for (const l of lines) maxW = Math.max(maxW, ctx.measureText(l).width);
    const boxW = maxW + 22;
    const lh = 16;
    const boxH = lines.length * lh + 14;

    let bx = cx - boxW / 2;
    let by = cy - boxH - 16;
    bx = Math.max(4, Math.min(bx, w - boxW - 4));
    if (by < 4) by = cy + 16;
    if (by + boxH > h - 4) by = h - boxH - 4;

    roundRect(ctx, bx, by, boxW, boxH, 10);
    ctx.fillStyle = COL.tagBg;
    ctx.fill();
    ctx.strokeStyle = COL.tagBd;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === 0 ? COL.text : COL.muted;
      ctx.font = (i === 0 ? '700 12.5px ' : '') + FONT;
      ctx.fillText(lines[i], bx + boxW / 2, by + 7 + i * lh);
    }
  }

  function attachHover(canvas) {
    if (canvas.__hoverBound) return;
    canvas.__hoverBound = true;

    let rafId = null;
    const handleMove = e => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const st = charts.get(canvas);
        if (!st || !st.geom) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const idx = st.geom.indexAt(x);
        if (idx !== st.hover) {
          st.hover = idx;
          st.draw(canvas, st);
        }
      });
    };
    canvas.addEventListener('mousemove', handleMove, { passive: true });
    canvas.addEventListener('touchstart', handleMove, { passive: true });
    canvas.addEventListener('touchmove', handleMove, { passive: true });
    canvas.addEventListener('mouseleave', () => {
      const st = charts.get(canvas);
      if (st && st.hover !== -1) { st.hover = -1; st.draw(canvas, st); }
    });
    canvas.addEventListener('touchend', () => {
      const st = charts.get(canvas);
      if (st && st.hover !== -1) {
        setTimeout(() => {
          const s2 = charts.get(canvas);
          if (s2) { s2.hover = -1; s2.draw(canvas, s2); }
        }, 1500);
      }
    });
  }

  function drawEmpty(ctx, w, h) {
    const COL = getChartColors();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = COL.muted;
    ctx.font = '13px ' + FONT;
    ctx.fillText('هنوز داده‌ای نیست', w / 2, h / 2);
  }

  function renderLine(canvas, st) {
    const COL = getChartColors();
    const s = setupCanvas(canvas);
    const ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);

    const data = st.data;
    if (!data || !data.length) { st.geom = null; drawEmpty(ctx, w, h); return; }

    const compactMode = w < 400;
    const pad = { t: 18, r: 12, b: 28, l: compactMode ? 46 : 58 };
    const plotW = Math.max(10, w - pad.l - pad.r);
    const plotH = Math.max(10, h - pad.t - pad.b);

    let lo = 0, hi = 0;
    for (const d of data) { if (d.value < lo) lo = d.value; if (d.value > hi) hi = d.value; }
    const scale = niceScale(lo, hi, 5);
    const yOf = v => pad.t + (scale.max - v) / (scale.max - scale.min) * plotH;
    const n = data.length;
    const xOf = i => n === 1 ? pad.l + plotW / 2 : pad.l + (i / (n - 1)) * plotW;

    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let v = scale.min; v <= scale.max + 1e-9; v += scale.step) {
      const y = Math.round(yOf(v)) + 0.5;
      const isZero = Math.abs(v) < 1e-9;
      ctx.strokeStyle = isZero ? COL.gridZero : COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
      ctx.fillStyle = COL.axis;
      ctx.fillText(compact(v), pad.l - 8, y);
    }

    const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.value), value: d.value, label: d.label }));

    const baseY = yOf(0);
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
    grad.addColorStop(0, COL.areaTop);
    grad.addColorStop(0.5, COL.areaMid);
    grad.addColorStop(1, COL.areaBot);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, baseY);
    for (const p of pts) ctx.lineTo(p.x, p.y);
    ctx.lineTo(pts[n - 1].x, baseY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    const lineGrad = ctx.createLinearGradient(pad.l, 0, pad.l + plotW, 0);
    lineGrad.addColorStop(0, '#2ee6a6');
    lineGrad.addColorStop(1, '#5b8cff');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    if (n <= (compactMode ? 25 : 45)) {
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = COL.line;
        ctx.fill();
        ctx.strokeStyle = COL.tagBg;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    const maxLabels = Math.max(2, Math.floor(plotW / (compactMode ? 60 : 88)));
    const stepI = Math.max(1, Math.ceil(n / maxLabels));
    ctx.fillStyle = COL.axis;
    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < n; i += stepI) {
      ctx.fillText(shortDate(data[i].label), xOf(i), pad.t + plotH + 8);
    }
    if ((n - 1) % stepI !== 0) {
      ctx.fillText(shortDate(data[n - 1].label), xOf(n - 1), pad.t + plotH + 8);
    }

    if (st.hover > -1 && st.hover < n) {
      const p = pts[st.hover];
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = COL.cross;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, pad.t);
      ctx.lineTo(p.x, pad.t + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = COL.tagBg;
      ctx.fill();
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      drawTag(ctx, p.x, p.y, [money(p.value), fullDate(p.label)], w, h);
    }

    st.geom = {
      indexAt: function (x) {
        if (x < pad.l - 14 || x > pad.l + plotW + 14) return -1;
        let best = 0, bd = Infinity;
        for (let i = 0; i < n; i++) {
          const d = Math.abs(pts[i].x - x);
          if (d < bd) { bd = d; best = i; }
        }
        return best;
      }
    };
  }

  function renderBars(canvas, st) {
    const COL = getChartColors();
    const s = setupCanvas(canvas);
    const ctx = s.ctx, w = s.w, h = s.h;
    ctx.clearRect(0, 0, w, h);

    const data = st.data;
    if (!data || !data.length) { st.geom = null; drawEmpty(ctx, w, h); return; }

    const compactMode = w < 400;
    const pad = { t: 18, r: 12, b: 28, l: compactMode ? 46 : 58 };
    const plotW = Math.max(10, w - pad.l - pad.r);
    const plotH = Math.max(10, h - pad.t - pad.b);

    let lo = 0, hi = 0;
    for (const d of data) { if (d.value < lo) lo = d.value; if (d.value > hi) hi = d.value; }
    if (lo === 0 && hi === 0) { lo = -1; hi = 1; }
    const scale = niceScale(lo, hi, 5);
    const yOf = v => pad.t + (scale.max - v) / (scale.max - scale.min) * plotH;
    const yZero = yOf(0);
    const n = data.length;
    const slot = plotW / n;
    const barW = Math.max(3, Math.min(slot * 0.62, compactMode ? 26 : 44));
    const xOf = i => pad.l + slot * i + slot / 2;

    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    for (let v = scale.min; v <= scale.max + 1e-9; v += scale.step) {
      const y = Math.round(yOf(v)) + 0.5;
      const isZero = Math.abs(v) < 1e-9;
      ctx.strokeStyle = isZero ? COL.gridZero : COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + plotW, y);
      ctx.stroke();
      ctx.fillStyle = COL.axis;
      ctx.fillText(compact(v), pad.l - 8, y);
    }

    const bars = [];
    for (let i = 0; i < n; i++) {
      const v = data[i].value;
      const x = xOf(i) - barW / 2;
      const y = yOf(v);
      const top = Math.min(y, yZero);
      const bh = Math.max(Math.abs(y - yZero), v === 0 ? 1 : 2);
      const positive = v >= 0;

      bars.push({ x: xOf(i), y: y, top: top, h: bh, value: v, label: data[i].label });

      if (st.hover === i) {
        roundRect(ctx, x - 3, top - 3, barW + 6, bh + 6, 8);
        ctx.fillStyle = positive ? 'rgba(46,230,166,.18)' : 'rgba(255,86,116,.18)';
        ctx.fill();
      }

      const bg = ctx.createLinearGradient(0, top, 0, top + bh);
      if (positive) { bg.addColorStop(0, COL.posTop); bg.addColorStop(1, COL.pos); }
      else { bg.addColorStop(0, COL.negTop); bg.addColorStop(1, COL.neg); }

      roundRect(ctx, x, top, barW, bh, Math.min(5, barW / 2));
      ctx.fillStyle = bg;
      ctx.fill();
    }

    ctx.strokeStyle = COL.gridZero;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, Math.round(yZero) + 0.5);
    ctx.lineTo(pad.l + plotW, Math.round(yZero) + 0.5);
    ctx.stroke();

    const maxLabels = Math.max(2, Math.floor(plotW / (compactMode ? 60 : 88)));
    const stepI = Math.max(1, Math.ceil(n / maxLabels));
    ctx.fillStyle = COL.axis;
    ctx.font = (compactMode ? '10px ' : '11px ') + FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let i = 0; i < n; i += stepI) {
      ctx.fillText(shortDate(data[i].label), xOf(i), pad.t + plotH + 8);
    }
    if ((n - 1) % stepI !== 0) {
      ctx.fillText(shortDate(data[n - 1].label), xOf(n - 1), pad.t + plotH + 8);
    }

    if (st.hover > -1 && st.hover < n) {
      const b = bars[st.hover];
      drawTag(ctx, b.x, b.value >= 0 ? b.top : b.top + b.h,
              [money(b.value), fullDate(b.label)], w, h);
    }

    st.geom = {
      indexAt: function (x) {
        if (x < pad.l - 14 || x > pad.l + plotW + 14) return -1;
        let best = 0, bd = Infinity;
        for (let i = 0; i < n; i++) {
          const d = Math.abs(bars[i].x - x);
          if (d < bd) { bd = d; best = i; }
        }
        return best;
      }
    };
  }

  function chartLine(canvas, data) {
    if (!canvas) return;
    let st = charts.get(canvas);
    if (!st || st.type !== 'line') {
      st = { type: 'line', data: [], hover: -1, geom: null, draw: renderLine };
      charts.set(canvas, st);
      attachHover(canvas);
    }
    st.data = data;
    st.hover = -1;
    renderLine(canvas, st);
  }

  function chartBars(canvas, data) {
    if (!canvas) return;
    let st = charts.get(canvas);
    if (!st || st.type !== 'bars') {
      st = { type: 'bars', data: [], hover: -1, geom: null, draw: renderBars };
      charts.set(canvas, st);
      attachHover(canvas);
    }
    st.data = data;
    st.hover = -1;
    renderBars(canvas, st);
  }

  /* =========================================================
     DOM REFS
     ========================================================= */
  const el = {
    html: document.documentElement,
    tabs: $('#tabs'),
    themeBtn: $('#theme-btn'),

    pageAdd: $('#page-add'),
    pageAnalysis: $('#page-analysis'),
    pageCalendar: $('#page-calendar'),
    pageTrades: $('#page-trades'),
    pageSettings: $('#page-settings'),

    form: $('#trade-form'),
    fDate: $('#f-date'),
    fSymbol: $('#f-symbol'),
    fStrategy: $('#f-strategy'),
    fAmount: $('#f-amount'),
    fRisk: $('#f-risk'),
    fTags: $('#f-tags'),
    fNote: $('#f-note'),
    sideSeg: $('#f-side'),
    resultSeg: $('#f-result'),
    emotionWrap: $('#f-emotion'),
    checklistWrap: $('#f-checklist'),
    tagsPreview: $('#tags-preview'),
    uploadZone: $('#upload-zone'),
    uploadInner: $('#upload-inner'),
    uploadPreview: $('#upload-preview'),
    uploadImg: $('#upload-img'),
    uploadRemove: $('#upload-remove'),
    fScreenshot: $('#f-screenshot'),
    submitBtn: $('#submit-btn'),
    cancelEdit: $('#cancel-edit'),
    formMsg: $('#form-msg'),

    recentList: $('#recent-list'),
    recentCount: $('#recent-count'),

    rulesBanner: $('#rules-banner'),
    rangeFilter: $('#range-filter'),
    kpis: $('#kpis'),
    equityChart: $('#equity-chart'),
    dailyChart: $('#daily-chart'),
    emotionsStats: $('#emotions-stats'),
    strategyTable: $('#strategy-table'),
    dailyTable: $('#daily-table'),
    goalsMiniCard: $('#goals-mini-card'),
    goalsMini: $('#goals-mini'),
    goalsMiniPeriod: $('#goals-mini-period'),

    calTitle: $('#cal-title'),
    calGrid: $('#cal-grid'),
    calPrev: $('#cal-prev'),
    calNext: $('#cal-next'),
    calDetailCard: $('#cal-detail-card'),
    calDetailTitle: $('#cal-detail-title'),
    calDetailList: $('#cal-detail-list'),
    calDetailClose: $('#cal-detail-close'),

    allCount: $('#all-count'),
    allTradesList: $('#all-trades-list'),
    fltSearch: $('#flt-search'),
    fltStrategy: $('#flt-strategy'),
    fltTag: $('#flt-tag'),
    fltResult: $('#flt-result'),
    fltEmotion: $('#flt-emotion'),
    fltSide: $('#flt-side'),
    fltFrom: $('#flt-from'),
    fltTo: $('#flt-to'),
    fltClear: $('#flt-clear'),

    goalPeriod: $('#goal-period'),
    goalMetric: $('#goal-metric'),
    goalTarget: $('#goal-target'),
    saveGoal: $('#save-goal'),
    clearGoal: $('#clear-goal'),
    goalMsg: $('#goal-msg'),
    goalsPreview: $('#goals-preview'),

    rulesEnabled: $('#rules-enabled'),
    ruleDaily: $('#rule-daily'),
    ruleMaxDD: $('#rule-maxdd'),
    ruleTarget: $('#rule-target'),
    ruleBalance: $('#rule-balance'),
    saveRules: $('#save-rules'),
    rulesMsg: $('#rules-msg'),
    rulesStatus: $('#rules-status'),

    demoBtn: $('#demo-btn'),
    exportBtn: $('#export-btn'),
    importInput: $('#import-input'),
    clearBtn: $('#clear-btn')
  };

  /* =========================================================
     TOAST
     ========================================================= */
  const msgTimers = new WeakMap();
  function toast(target, text, isError) {
    if (!target) return;
    target.textContent = text;
    target.classList.toggle('err', !!isError);
    target.classList.add('show');
    clearTimeout(msgTimers.get(target));
    msgTimers.set(target, setTimeout(() => target.classList.remove('show'), 2600));
  }

  /* =========================================================
     THEME
     ========================================================= */
  function applyTheme(t) {
    theme = t;
    el.html.dataset.theme = t;
    if (el.themeBtn) {
      const icon = el.themeBtn.querySelector('.theme-icon');
      if (icon) icon.textContent = t === 'light' ? '☀️' : '🌙';
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t === 'light' ? '#f3f6fc' : '#05070f';
    saveJSON(KEYS.theme, t);
    if (el.pageAnalysis && el.pageAnalysis.classList.contains('active')) renderCharts();
  }
  function toggleTheme() { applyTheme(theme === 'dark' ? 'light' : 'dark'); }

  /* =========================================================
     FORM HELPERS
     ========================================================= */
  function renderChecklistForm(checked) {
    checked = checked || {};
    el.checklistWrap.innerHTML = DEFAULT_RULES.map(r =>
      '<label>' +
        '<input type="checkbox" data-rule="' + r.id + '" ' + (checked[r.id] ? 'checked' : '') + ' />' +
        '<span class="box">✓</span>' +
        '<span>' + esc(r.text) + '</span>' +
      '</label>'
    ).join('');
  }

  function getChecklistValues() {
    const out = {};
    $$('input[data-rule]', el.checklistWrap).forEach(inp => {
      out[inp.dataset.rule] = inp.checked;
    });
    return out;
  }

  function parseTags(str) {
    return String(str || '')
      .split(/[,،]/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  function renderTagsPreview() {
    if (!el.fTags) return;
    const tags = parseTags(el.fTags.value);
    if (!tags.length) { el.tagsPreview.innerHTML = ''; return; }
    el.tagsPreview.innerHTML = tags.map(t => '<span class="tag">' + esc(t) + '</span>').join('');
  }

  function initEmotions() {
    el.emotionWrap.addEventListener('click', e => {
      const btn = e.target.closest('button[data-e]');
      if (!btn) return;
      $$('button', el.emotionWrap).forEach(b => b.classList.toggle('active', b === btn));
      selectedEmotion = btn.dataset.e;
    });
  }

  function initSeg(seg, def) {
    if (!seg) return;
    seg.dataset.value = def;
    seg.addEventListener('click', e => {
      const btn = e.target.closest('button[data-v]');
      if (!btn) return;
      $$('button[data-v]', seg).forEach(b => b.classList.toggle('active', b === btn));
      seg.dataset.value = btn.dataset.v;
    });
  }

  function setSeg(seg, val) {
    if (!seg) return;
    $$('button[data-v]', seg).forEach(b => b.classList.toggle('active', b.dataset.v === val));
    seg.dataset.value = val;
  }

  function setEmotion(val) {
    selectedEmotion = val;
    $$('button', el.emotionWrap).forEach(b => b.classList.toggle('active', b.dataset.e === val));
  }

  /* =========================================================
     SCREENSHOT UI
     ========================================================= */
  function setScreenshot(base64) {
    currentScreenshot = base64 || null;
    if (currentScreenshot) {
      el.uploadImg.src = currentScreenshot;
      el.uploadInner.hidden = true;
      el.uploadPreview.hidden = false;
    } else {
      el.uploadImg.src = '';
      el.uploadInner.hidden = false;
      el.uploadPreview.hidden = true;
      if (el.fScreenshot) el.fScreenshot.value = '';
    }
  }

  function initScreenshot() {
    el.uploadZone.addEventListener('click', e => {
      if (e.target === el.uploadRemove || e.target.closest('.upload-remove')) return;
      if (currentScreenshot && e.target.closest('.upload-preview')) {
        openLightbox(currentScreenshot);
        return;
      }
      el.fScreenshot.click();
    });

    el.fScreenshot.addEventListener('change', async e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const b64 = await compressImage(file);
        setScreenshot(b64);
      } catch (err) {
        console.warn('Image error:', err);
        toast(el.formMsg, '❌ خطا در پردازش تصویر', true);
      }
    });

    el.uploadRemove.addEventListener('click', e => {
      e.stopPropagation();
      setScreenshot(null);
    });
  }

  function openLightbox(src) {
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lightbox-close">✕</button><img alt="" />';
    lb.querySelector('img').src = src;
    lb.addEventListener('click', e => {
      if (e.target === lb || e.target.classList.contains('lightbox-close')) {
        lb.remove();
      }
    });
    document.body.appendChild(lb);
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */
  function switchView(name) {
    $$('.tab', el.tabs).forEach(t => t.classList.toggle('active', t.dataset.view === name));
    el.pageAdd.classList.toggle('active', name === 'add');
    el.pageAnalysis.classList.toggle('active', name === 'analysis');
    el.pageCalendar.classList.toggle('active', name === 'calendar');
    el.pageTrades.classList.toggle('active', name === 'trades');
    el.pageSettings.classList.toggle('active', name === 'settings');

    if (name === 'analysis') requestAnimationFrame(renderCharts);
    if (name === 'calendar') renderCalendar();
    if (name === 'trades') renderAllTrades();
    if (name === 'settings') renderSettingsPage();
  }

  /* =========================================================
     FORM SUBMIT
     ========================================================= */
  function resetForm() {
    editingId = null;
    el.form.reset();
    el.fDate.value = todayISO();
    el.submitBtn.textContent = '💾 ثبت معامله';
    el.cancelEdit.hidden = true;
    setSeg(el.sideSeg, 'buy');
    setSeg(el.resultSeg, 'win');
    setEmotion('calm');
    renderChecklistForm({});
    renderTagsPreview();
    setScreenshot(null);
  }

  function startEdit(id) {
    const t = trades.find(x => x.id === id);
    if (!t) return;

    editingId = id;
    el.fDate.value = t.date;
    el.fSymbol.value = t.symbol;
    el.fStrategy.value = t.strategy;
    el.fAmount.value = t.amount;
    el.fRisk.value = t.risk || '';
    el.fTags.value = (t.tags || []).join(', ');
    el.fNote.value = t.note || '';
    setSeg(el.sideSeg, t.side);
    setSeg(el.resultSeg, t.result);
    setEmotion(t.emotion || 'calm');
    renderChecklistForm(t.checklist || {});
    renderTagsPreview();
    setScreenshot(t.screenshot || null);

    el.submitBtn.textContent = '💾 ذخیره تغییرات';
    el.cancelEdit.hidden = false;
    switchView('add');
    el.fSymbol.focus();
  }

  function onSubmit(e) {
    e.preventDefault();

    const date = el.fDate.value || todayISO();
    const symbol = el.fSymbol.value.trim();
    const strategy = el.fStrategy.value.trim();
    const amountRaw = el.fAmount.value;
    const amount = Math.abs(parseFloat(amountRaw));
    const riskRaw = el.fRisk.value;
    const risk = riskRaw ? Math.abs(parseFloat(riskRaw)) : null;

    if (!symbol)   { toast(el.formMsg, '❌ نام نماد را وارد کن', true);   el.fSymbol.focus();   return; }
    if (!strategy) { toast(el.formMsg, '❌ نام استراتژی را وارد کن', true); el.fStrategy.focus(); return; }
    if (!amountRaw || isNaN(amount)) { toast(el.formMsg, '❌ مبلغ را وارد کن', true); el.fAmount.focus(); return; }

    const trade = {
      id: editingId || uid(),
      date: date, symbol: symbol, strategy: strategy,
      side: el.sideSeg.dataset.value,
      result: el.resultSeg.dataset.value,
      amount: amount,
      risk: (risk && !isNaN(risk)) ? risk : null,
      tags: parseTags(el.fTags.value),
      emotion: selectedEmotion,
      checklist: getChecklistValues(),
      screenshot: currentScreenshot || null,
      note: el.fNote.value.trim(),
      createdAt: Date.now()
    };

    if (editingId) {
      const i = trades.findIndex(t => t.id === editingId);
      if (i > -1) {
        trade.createdAt = trades[i].createdAt || Date.now();
        trades[i] = trade;
      } else trades.push(trade);
      toast(el.formMsg, '✅ تغییرات ذخیره شد');
    } else {
      trades.push(trade);
      toast(el.formMsg, '✅ معامله ثبت شد');
    }

    try { saveTrades(); }
    catch (err) {
      toast(el.formMsg, '❌ حافظه پر است', true);
      return;
    }

    resetForm();
    renderAll();
  }

  /* =========================================================
     RENDER: TRADE ITEM (shared)
     ========================================================= */
  function renderTradeItem(t, showActions) {
    if (showActions === undefined) showActions = true;
    const p = pnl(t);
    const cls = t.result === 'win' ? 'win' : t.result === 'loss' ? 'loss' : 'be';
    const amt = t.result === 'be' ? 'سربه‌سر' : money(p);
    const emo = EMOTIONS[t.emotion] || EMOTIONS.calm;
    const rm = rMultiple(t);
    const rmTxt = rm != null ? ((rm > 0 ? '+' : '') + rm + 'R') : '';
    const SIDE = { buy: 'خرید', sell: 'فروش' };
    const tags = (t.tags || []).slice(0, 4);
    const thumb = t.screenshot
      ? '<div class="ti-thumb" data-thumb="' + esc(t.id) + '"><img src="' + t.screenshot + '" alt="" loading="lazy" /></div>'
      : '';

    return '' +
      '<div class="trade-item ' + (t.side === 'sell' ? 'sell' : '') + '" data-id="' + esc(t.id) + '">' +
        thumb +
        '<div class="ti-main">' +
          '<span class="ti-symbol">' +
            '<span class="dot ' + (t.side === 'sell' ? 'sell' : '') + '"></span>' +
            esc(t.symbol) +
          '</span>' +
          '<span class="ti-meta">' +
            '<span class="emo" title="' + emo.label + '">' + emo.ico + '</span>' +
            '<span>🎯 ' + esc(t.strategy) + '</span>' +
            '<span>' + SIDE[t.side] + ' · ' + fullDate(t.date) + '</span>' +
            (rmTxt ? '<span>' + rmTxt + '</span>' : '') +
          '</span>' +
          (tags.length ? '<div class="ti-tags">' + tags.map(g => '<span class="tag">' + esc(g) + '</span>').join('') + '</div>' : '') +
        '</div>' +
        '<div class="ti-right">' +
          '<span class="pill ' + cls + '">' + amt + '</span>' +
          (showActions
            ? '<div class="ti-actions">' +
                '<button data-act="edit" type="button">✏️</button>' +
                '<button data-act="del" type="button">🗑️</button>' +
              '</div>'
            : '') +
        '</div>' +
      '</div>';
  }

  /* =========================================================
     RENDER: RECENT
     ========================================================= */
  function renderRecent() {
    const sorted = trades.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    el.recentCount.textContent = sorted.length ? sorted.length + ' معامله' : '';
    const list = sorted.slice(0, 12);
    if (!list.length) {
      el.recentList.innerHTML = '<div class="empty">هنوز معامله‌ای ثبت نشده است</div>';
      return;
    }
    el.recentList.innerHTML = list.map(t => renderTradeItem(t)).join('');
  }

  /* =========================================================
     RENDER: KPI
     ========================================================= */
  function renderKPIs() {
    const filtered = inRange(trades, range);
    const s = computeStats(filtered);
    const days = byDay(filtered);

    let bestDay = null, worstDay = null;
    for (const d of days) {
      if (!bestDay || d.net > bestDay.net) bestDay = d;
      if (!worstDay || d.net < worstDay.net) worstDay = d;
    }

    let dcSum = 0, dcCount = 0;
    for (const t of filtered) {
      const dc = disciplineScore(t, DEFAULT_RULES);
      if (dc != null) { dcSum += dc; dcCount++; }
    }
    const avgDiscipline = dcCount ? Math.round(dcSum / dcCount) : 0;

    const cards = [
      { ico: '💎', l: 'سود خالص',           v: money(s.net),                    c: s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : '' },
      { ico: '🎯', l: 'وین ریت',            v: pct(s.winRate),                  c: s.winRate >= 50 ? 'pos' : 'neg' },
      { ico: '📊', l: 'تعداد معاملات',      v: num(s.total),                    c: '' },
      { ico: '⚖️', l: 'ضریب سود (PF)',      v: isFinite(s.profitFactor) ? s.profitFactor.toFixed(2) : '∞', c: s.profitFactor >= 1 ? 'pos' : 'neg' },
      { ico: '📐', l: 'میانگین R',          v: s.rCount ? ((s.avgR > 0 ? '+' : '') + s.avgR.toFixed(2) + 'R') : '—', c: s.avgR > 0 ? 'pos' : s.avgR < 0 ? 'neg' : '' },
      { ico: '🧮', l: 'انتظار ریاضی',       v: money(s.expectancy),             c: s.expectancy > 0 ? 'pos' : 'neg' },
      { ico: '✅', l: 'انضباط',             v: dcCount ? pct(avgDiscipline) : '—', c: avgDiscipline >= 75 ? 'pos' : avgDiscipline >= 50 ? '' : 'neg' },
      { ico: '📈', l: 'مجموع سودها',        v: money(s.grossProfit, false),     c: 'pos' },
      { ico: '📉', l: 'مجموع ضررها',        v: money(-s.grossLoss),             c: 'neg' },
      { ico: '🟢', l: 'میانگین سود',        v: money(s.avgWin, false),          c: 'pos' },
      { ico: '🔴', l: 'میانگین ضرر',        v: money(-s.avgLoss),               c: 'neg' },
      { ico: '⚠️', l: 'حداکثر افت سرمایه',  v: money(-s.maxDrawdown),           c: 'neg' },
      { ico: '🏆', l: 'بهترین روز',         v: bestDay ? money(bestDay.net) : '—',  c: 'pos' },
      { ico: '💔', l: 'بدترین روز',         v: worstDay ? money(worstDay.net) : '—', c: 'neg' }
    ];

    el.kpis.innerHTML = cards.map((c, i) =>
      '<div class="kpi ' + c.c + '" style="animation-delay:' + Math.min(i * 30, 400) + 'ms">' +
        '<span class="ico">' + c.ico + '</span>' +
        '<span class="lbl">' + c.l + '</span>' +
        '<span class="val">' + c.v + '</span>' +
      '</div>'
    ).join('');
  }

  /* =========================================================
     RENDER: CHARTS
     ========================================================= */
  function renderCharts() {
    const filtered = inRange(trades, range);
    const days = byDay(filtered);
    chartLine(el.equityChart, days.map(d => ({ label: d.date, value: d.cum })));
    chartBars(el.dailyChart,  days.map(d => ({ label: d.date, value: d.net })));
  }

  /* =========================================================
     RENDER: EMOTIONS
     ========================================================= */
  function renderEmotions() {
    const filtered = inRange(trades, range);
    const rows = byEmotion(filtered);
    if (!rows.length) {
      el.emotionsStats.innerHTML = '<div class="empty">داده‌ای موجود نیست</div>';
      return;
    }
    el.emotionsStats.innerHTML = rows.map(r => {
      const emo = EMOTIONS[r.key] || EMOTIONS.calm;
      const cls = r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : '';
      return '' +
        '<div class="emo-stat ' + cls + '">' +
          '<div class="emo-ico">' + emo.ico + '</div>' +
          '<div class="emo-info">' +
            '<div class="emo-name">' + emo.label + '</div>' +
            '<div class="emo-meta">' + num(r.count) + ' معامله · ' + pct(r.winRate) + '</div>' +
          '</div>' +
          '<div class="emo-net">' + money(r.net) + '</div>' +
        '</div>';
    }).join('');
  }

  /* =========================================================
     RENDER: TABLES
     ========================================================= */
  function renderStrategyTable() {
    const rows = byStrategy(inRange(trades, range));
    if (!rows.length) {
      el.strategyTable.innerHTML = '<div class="empty">داده‌ای موجود نیست</div>';
      return;
    }
    el.strategyTable.innerHTML =
      '<table><thead><tr>' +
        '<th>استراتژی</th><th>تعداد</th><th>برد</th><th>باخت</th><th>وین‌ریت</th><th>خالص</th>' +
      '</tr></thead><tbody>' +
        rows.map(r =>
          '<tr>' +
            '<td>' + esc(r.name) + '</td>' +
            '<td class="num dim">' + num(r.count) + '</td>' +
            '<td class="num pos">' + num(r.wins) + '</td>' +
            '<td class="num neg">' + num(r.losses) + '</td>' +
            '<td class="num">' + pct(r.winRate) + '</td>' +
            '<td class="num ' + (r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : 'dim') + '">' + money(r.net) + '</td>' +
          '</tr>'
        ).join('') +
      '</tbody></table>';
  }

  function renderDailyTable() {
    const rows = byDay(inRange(trades, range)).reverse();
    if (!rows.length) {
      el.dailyTable.innerHTML = '<div class="empty">داده‌ای موجود نیست</div>';
      return;
    }
    el.dailyTable.innerHTML =
      '<table><thead><tr>' +
        '<th>تاریخ</th><th>معاملات</th><th>سود</th><th>ضرر</th><th>خالص</th><th>تجمعی</th>' +
      '</tr></thead><tbody>' +
        rows.map(r =>
          '<tr>' +
            '<td class="num dim">' + fullDate(r.date) + '</td>' +
            '<td class="num dim">' + num(r.count) + '</td>' +
            '<td class="num pos">' + (r.profit ? money(r.profit, false) : '—') + '</td>' +
            '<td class="num neg">' + (r.loss ? money(-r.loss) : '—') + '</td>' +
            '<td class="num ' + (r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : 'dim') + '">' + money(r.net) + '</td>' +
            '<td class="num ' + (r.cum > 0 ? 'pos' : r.cum < 0 ? 'neg' : 'dim') + '">' + money(r.cum) + '</td>' +
          '</tr>'
        ).join('') +
      '</tbody></table>';
  }

  /* =========================================================
     RENDER: GOALS MINI
     ========================================================= */
  function renderGoalsMini() {
    if (!el.goalsMiniCard) return;
    const g = getGoalProgress();
    if (!g) { el.goalsMiniCard.style.display = 'none'; return; }
    el.goalsMiniCard.style.display = '';

    const periodLabel = g.period === 'week' ? 'این هفته' : 'این ماه';
    el.goalsMiniPeriod.textContent = periodLabel;

    let metricLabel, currentTxt, targetTxt;
    if (g.metric === 'pnl') {
      metricLabel = '💎 هدف سود';
      currentTxt = money(g.current);
      targetTxt = money(g.target, false);
    } else if (g.metric === 'trades') {
      metricLabel = '📊 هدف تعداد';
      currentTxt = num(g.current);
      targetTxt = num(g.target);
    } else {
      metricLabel = '🎯 هدف وین‌ریت';
      currentTxt = pct(g.current);
      targetTxt = pct(g.target);
    }

    const p = Math.min(100, Math.max(0, g.progress));
    let progCls = '';
    if (g.progress >= 100) progCls = '';
    else if (g.progress >= 60) progCls = 'warn';
    else if (g.progress < 30) progCls = 'danger';

    el.goalsMini.innerHTML =
      '<div class="goal-box">' +
        '<div class="goal-ico">🎯</div>' +
        '<div class="goal-info">' +
          '<div class="goal-label">' + metricLabel + '</div>' +
          '<div class="goal-vals">' +
            '<span class="cur">' + currentTxt + '</span>' +
            '<span class="sep">/</span>' +
            '<span class="tgt">' + targetTxt + '</span>' +
          '</div>' +
          '<div class="goal-progress">' +
            '<div class="goal-progress-fill ' + progCls + '" style="width:' + p + '%"></div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size:12px;font-weight:800;color:var(--muted);min-width:42px;text-align:center">' + Math.round(p) + '%</div>' +
      '</div>';
  }

  /* =========================================================
     RENDER: RULES BANNER
     ========================================================= */
  function renderRulesBanner() {
    if (!el.rulesBanner) return;
    const checks = checkRules();
    if (!checks) { el.rulesBanner.innerHTML = ''; return; }

    let banner = '';
    if (checks.dailyLoss && checks.dailyLoss.status === 'bad') {
      banner = '<div class="rules-banner danger">' +
        '<span class="rb-ico">🚨</span>' +
        '<span class="rb-msg">حد ضرر روزانه نقض شد! (' + money(-checks.dailyLoss.loss) + ')</span>' +
      '</div>';
    } else if (checks.maxDD && checks.maxDD.status === 'bad') {
      banner = '<div class="rules-banner danger">' +
        '<span class="rb-ico">🚨</span>' +
        '<span class="rb-msg">حداکثر افت سرمایه نقض شد (' + money(-checks.maxDD.dd) + ')</span>' +
      '</div>';
    } else if (checks.target && checks.target.progress >= 100) {
      banner = '<div class="rules-banner success">' +
        '<span class="rb-ico">🏆</span>' +
        '<span class="rb-msg">به هدف سود رسیدی! (' + money(checks.target.net) + ')</span>' +
      '</div>';
    } else if (checks.dailyLoss && checks.dailyLoss.status === 'warn') {
      banner = '<div class="rules-banner warn">' +
        '<span class="rb-ico">⚠️</span>' +
        '<span class="rb-msg">' + Math.round(checks.dailyLoss.usage) + '٪ از حد ضرر روزانه مصرف شد</span>' +
      '</div>';
    } else if (checks.maxDD && checks.maxDD.status === 'warn') {
      banner = '<div class="rules-banner warn">' +
        '<span class="rb-ico">⚠️</span>' +
        '<span class="rb-msg">' + Math.round(checks.maxDD.usage) + '٪ از افت سرمایه مجاز مصرف شد</span>' +
      '</div>';
    }
    el.rulesBanner.innerHTML = banner;
  }

  /* =========================================================
     RENDER: CALENDAR
     ========================================================= */
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  function renderCalendar() {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    el.calTitle.textContent = MONTHS[month] + ' ' + year;

    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const offset = (startWeekday + 1) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayMap = new Map();
    for (const t of trades) {
      const p = t.date.split('-');
      if (Number(p[0]) === year && Number(p[1]) - 1 === month) {
        const d = Number(p[2]);
        if (!dayMap.has(d)) dayMap.set(d, { net: 0, count: 0 });
        const rec = dayMap.get(d);
        rec.net += pnl(t);
        rec.count++;
      }
    }

    let maxAbs = 0;
    for (const v of dayMap.values()) {
      const a = Math.abs(v.net);
      if (a > maxAbs) maxAbs = a;
    }
    const intensity = val => {
      if (maxAbs === 0) return 1;
      const ratio = Math.abs(val) / maxAbs;
      if (ratio < 0.34) return 1;
      if (ratio < 0.67) return 2;
      return 3;
    };

    let html = '';
    for (let i = 0; i < offset; i++) html += '<div class="cal-cell empty-day"></div>';

    for (let d = 1; d <= daysInMonth; d++) {
      const rec = dayMap.get(d);
      const iso = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      if (!rec) {
        html += '<div class="cal-cell no-trade" data-date="' + iso + '">' +
          '<span class="day-num">' + d + '</span></div>';
        continue;
      }
      const inten = intensity(rec.net);
      const cls = rec.net > 0 ? ('pos-' + inten) : rec.net < 0 ? ('neg-' + inten) : '';
      const sign = rec.net > 0 ? '+' : '';
      const pnlTxt = rec.net === 0 ? '۰' : (sign + Math.round(rec.net));
      html += '<div class="cal-cell has-trade ' + cls + '" data-date="' + iso + '">' +
        '<span class="trade-count">' + rec.count + '</span>' +
        '<span class="day-num">' + d + '</span>' +
        '<span class="day-pnl">' + pnlTxt + '</span>' +
      '</div>';
    }

    el.calGrid.innerHTML = html;
    el.calDetailCard.hidden = true;
  }

  function showCalDetail(dateISO) {
    const dayTrades = trades.filter(t => t.date === dateISO);
    if (!dayTrades.length) return;

    let net = 0;
    for (const t of dayTrades) net += pnl(t);

    el.calDetailTitle.textContent = fullDate(dateISO) + ' — ' + money(net) + ' (' + dayTrades.length + ' معامله)';
    el.calDetailList.innerHTML = dayTrades.map(t => renderTradeItem(t, false)).join('');
    el.calDetailCard.hidden = false;
    el.calDetailCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* =========================================================
     RENDER: TRADES PAGE (with filters)
     ========================================================= */
  function applyFilters(list) {
    const f = filters;
    const search = f.search.trim().toLowerCase();

    return list.filter(t => {
      if (f.strategy !== 'all' && (t.strategy || '') !== f.strategy) return false;
      if (f.tag !== 'all' && !(t.tags || []).includes(f.tag)) return false;
      if (f.result !== 'all' && t.result !== f.result) return false;
      if (f.emotion !== 'all' && (t.emotion || 'calm') !== f.emotion) return false;
      if (f.side !== 'all' && t.side !== f.side) return false;
      if (f.from && t.date < f.from) return false;
      if (f.to && t.date > f.to) return false;
      if (search) {
        const hay = (t.symbol + ' ' + t.strategy + ' ' + (t.note || '') + ' ' +
                    (t.tags || []).join(' ')).toLowerCase();
        if (hay.indexOf(search) === -1) return false;
      }
      return true;
    });
  }

  function populateFilterOptions() {
    const strategies = new Set();
    const tags = new Set();
    for (const t of trades) {
      if (t.strategy) strategies.add(t.strategy);
      for (const g of (t.tags || [])) tags.add(g);
    }

    const sSorted = Array.from(strategies).sort();
    const tSorted = Array.from(tags).sort();

    el.fltStrategy.innerHTML = '<option value="all">همه</option>' +
      sSorted.map(s => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join('');

    el.fltTag.innerHTML = '<option value="all">همه</option>' +
      tSorted.map(s => '<option value="' + esc(s) + '">' + esc(s) + '</option>').join('');

    el.fltEmotion.innerHTML = '<option value="all">همه</option>' +
      Object.keys(EMOTIONS).map(k =>
        '<option value="' + k + '">' + EMOTIONS[k].ico + ' ' + EMOTIONS[k].label + '</option>'
      ).join('');
  }

  function renderAllTrades() {
    populateFilterOptions();

    el.fltStrategy.value = filters.strategy;
    el.fltTag.value = filters.tag;
    el.fltResult.value = filters.result;
    el.fltEmotion.value = filters.emotion;
    el.fltSide.value = filters.side;
    el.fltFrom.value = filters.from;
    el.fltTo.value = filters.to;
    el.fltSearch.value = filters.search;

    const filtered = applyFilters(trades);
    const sorted = filtered.slice().sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    el.allCount.textContent = sorted.length + ' از ' + trades.length + ' معامله';

    if (!sorted.length) {
      el.allTradesList.innerHTML = '<div class="empty">معامله‌ای با این فیلترها پیدا نشد</div>';
      return;
    }

    el.allTradesList.innerHTML = sorted.map(t => renderTradeItem(t)).join('');
  }

  /* =========================================================
     RENDER: SETTINGS PAGE
     ========================================================= */
  function renderSettingsPage() {
    if (goal) {
      setSeg(el.goalPeriod, goal.period || 'week');
      setSeg(el.goalMetric, goal.metric || 'pnl');
      el.goalTarget.value = goal.target || '';
    } else {
      setSeg(el.goalPeriod, 'week');
      setSeg(el.goalMetric, 'pnl');
      el.goalTarget.value = '';
    }

    el.rulesEnabled.checked = !!rules.enabled;
    el.ruleDaily.value = rules.dailyLoss || '';
    el.ruleMaxDD.value = rules.maxDD || '';
    el.ruleTarget.value = rules.target || '';
    el.ruleBalance.value = rules.balance || '';

    renderGoalsPreview();
    renderRulesStatus();
  }

  function renderGoalsPreview() {
    const g = getGoalProgress();
    if (!g) {
      el.goalsPreview.innerHTML = '<div class="empty" style="padding:14px;font-size:12px">هنوز هدفی تعیین نشده</div>';
      return;
    }
    let currentTxt, targetTxt;
    if (g.metric === 'pnl') {
      currentTxt = money(g.current); targetTxt = money(g.target, false);
    } else if (g.metric === 'trades') {
      currentTxt = num(g.current); targetTxt = num(g.target);
    } else {
      currentTxt = pct(g.current); targetTxt = pct(g.target);
    }
    const p = Math.min(100, Math.max(0, g.progress));
    el.goalsPreview.innerHTML =
      '<div class="goal-box">' +
        '<div class="goal-ico">🎯</div>' +
        '<div class="goal-info">' +
          '<div class="goal-label">' + (g.period === 'week' ? 'این هفته' : 'این ماه') + '</div>' +
          '<div class="goal-vals">' +
            '<span class="cur">' + currentTxt + '</span>' +
            '<span class="sep">/</span>' +
            '<span class="tgt">' + targetTxt + '</span>' +
          '</div>' +
          '<div class="goal-progress"><div class="goal-progress-fill" style="width:' + p + '%"></div></div>' +
        '</div>' +
        '<div style="font-size:12px;font-weight:800;color:var(--muted);min-width:42px;text-align:center">' + Math.round(p) + '%</div>' +
      '</div>';
  }

  function renderRulesStatus() {
    if (!rules.enabled) {
      el.rulesStatus.innerHTML = '<div class="empty" style="padding:14px;font-size:12px">قوانین غیرفعال است</div>';
      return;
    }
    const checks = checkRules();
    if (!checks) {
      el.rulesStatus.innerHTML = '';
      return;
    }

    let html = '';

    if (checks.dailyLoss) {
      const statusClass = checks.dailyLoss.status === 'ok' ? 'ok' : checks.dailyLoss.status === 'warn' ? 'warn' : 'bad';
      const statusTxt = statusClass === 'ok' ? 'ایمن' : statusClass === 'warn' ? 'هشدار' : 'نقض';
      html +=
        '<div class="rule-status-row">' +
          '<div class="rs-ico">💥</div>' +
          '<div class="rs-info">' +
            '<div class="rs-label">حد ضرر روزانه</div>' +
            '<div class="rs-detail">' + money(-checks.dailyLoss.loss) + ' از ' + money(checks.dailyLoss.limit, false) + ' — ' + Math.round(checks.dailyLoss.usage) + '٪</div>' +
          '</div>' +
          '<div class="rs-status ' + statusClass + '">' + statusTxt + '</div>' +
        '</div>';
    }

    if (checks.maxDD) {
      const statusClass = checks.maxDD.status === 'ok' ? 'ok' : checks.maxDD.status === 'warn' ? 'warn' : 'bad';
      const statusTxt = statusClass === 'ok' ? 'ایمن' : statusClass === 'warn' ? 'هشدار' : 'نقض';
      html +=
        '<div class="rule-status-row">' +
          '<div class="rs-ico">⚠️</div>' +
          '<div class="rs-info">' +
            '<div class="rs-label">حداکثر افت سرمایه</div>' +
            '<div class="rs-detail">' + money(-checks.maxDD.dd) + ' از ' + money(checks.maxDD.limit, false) + ' — ' + Math.round(checks.maxDD.usage) + '٪</div>' +
          '</div>' +
          '<div class="rs-status ' + statusClass + '">' + statusTxt + '</div>' +
        '</div>';
    }

    if (checks.target) {
      const statusClass = checks.target.progress >= 100 ? 'ok' : 'warn';
      const statusTxt = checks.target.progress >= 100 ? 'رسیدم' : Math.round(checks.target.progress) + '٪';
      html +=
        '<div class="rule-status-row">' +
          '<div class="rs-ico">🏆</div>' +
          '<div class="rs-info">' +
            '<div class="rs-label">هدف سود</div>' +
            '<div class="rs-detail">' + money(checks.target.net) + ' از ' + money(checks.target.target, false) + '</div>' +
          '</div>' +
          '<div class="rs-status ' + statusClass + '">' + statusTxt + '</div>' +
        '</div>';
    }

    el.rulesStatus.innerHTML = html || '<div class="empty" style="padding:14px;font-size:12px">قانونی تنظیم نشده</div>';
  }

  /* =========================================================
     RENDER ALL
     ========================================================= */
  function renderAll() {
    renderRecent();
    renderKPIs();
    renderCharts();
    renderEmotions();
    renderStrategyTable();
    renderDailyTable();
    renderGoalsMini();
    renderRulesBanner();

    if (el.pageCalendar.classList.contains('active')) renderCalendar();
    if (el.pageTrades.classList.contains('active')) renderAllTrades();
    if (el.pageSettings.classList.contains('active')) renderSettingsPage();
  }

  /* =========================================================
     DEMO DATA
     ========================================================= */
  function demoData() {
    const symbols = ['XAUUSD', 'EURUSD', 'BTCUSD', 'GBPJPY', 'NAS100'];
    const strategies = ['بریک‌اوت لندن', 'بازگشت به میانگین', 'شکست ساختار', 'پرایس اکشن', 'اسکالپ نیویورک'];
    const tagPool = ['بریک‌اوت', 'پولبک', 'لندن', 'نیویورک', 'M5', 'M15', 'روند', 'رنج'];
    const emoKeys = Object.keys(EMOTIONS);
    const out = [];
    const now = Date.now();

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISO(d);
      const count = Math.random() < 0.2 ? 0 : 1 + Math.floor(Math.random() * 3);

      for (let j = 0; j < count; j++) {
        const r = Math.random();
        const result = r < 0.55 ? 'win' : r < 0.94 ? 'loss' : 'be';
        const amount = result === 'be' ? 0 : Math.round((40 + Math.random() * 260) * 100) / 100;
        const risk = result === 'be' ? 50 : Math.round((30 + Math.random() * 70) * 100) / 100;
        const emotion = emoKeys[Math.floor(Math.random() * emoKeys.length)];
        const checklist = {
          setup: Math.random() < 0.8,
          stop: Math.random() < 0.9,
          size: Math.random() < 0.75,
          plan: Math.random() < 0.7
        };
        const tags = [];
        while (tags.length < 2) {
          const t = tagPool[Math.floor(Math.random() * tagPool.length)];
          if (tags.indexOf(t) === -1) tags.push(t);
        }

        out.push({
          id: uid(),
          date: iso,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
          strategy: strategies[Math.floor(Math.random() * strategies.length)],
          side: Math.random() < 0.5 ? 'buy' : 'sell',
          result: result,
          amount: amount,
          risk: risk,
          tags: tags,
          emotion: emotion,
          checklist: checklist,
          screenshot: null,
          note: '',
          createdAt: now - i * 86400000 + j * 60000
        });
      }
    }
    return out;
  }

  /* =========================================================
     EXPORT / IMPORT / CLEAR
     ========================================================= */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(trades, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade-journal-' + todayISO() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(el.formMsg, '✅ فایل خروجی ساخته شد');
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error('ساختار فایل نامعتبر است');

        const existing = new Set(trades.map(t => t.id));
        let added = 0;
        for (const raw of parsed) {
          if (!raw || typeof raw !== 'object') continue;
          const id = raw.id || uid();
          if (existing.has(id)) continue;
          trades.push({
            id: id,
            date: /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : todayISO(),
            symbol: String(raw.symbol || '—').slice(0, 24),
            strategy: String(raw.strategy || 'بدون استراتژی').slice(0, 48),
            side: raw.side === 'sell' ? 'sell' : 'buy',
            result: ['win','loss','be'].indexOf(raw.result) > -1 ? raw.result : 'be',
            amount: Math.abs(Number(raw.amount) || 0),
            risk: raw.risk != null ? Math.abs(Number(raw.risk)) : null,
            tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 8) : [],
            emotion: EMOTIONS[raw.emotion] ? raw.emotion : 'calm',
            checklist: raw.checklist && typeof raw.checklist === 'object' ? raw.checklist : {},
            screenshot: typeof raw.screenshot === 'string' ? raw.screenshot : null,
            note: String(raw.note || '').slice(0, 500),
            createdAt: Number(raw.createdAt) || Date.now()
          });
          existing.add(id);
          added++;
        }
        saveTrades();
        renderAll();
        toast(el.formMsg, '✅ ' + added + ' معامله وارد شد');
      } catch (err) {
        toast(el.formMsg, '❌ خطا: ' + err.message, true);
      }
    };
    reader.readAsText(file);
  }

  /* =========================================================
     EVENT BINDING
     ========================================================= */
  function bindEvents() {

    /* Theme */
    el.themeBtn.addEventListener('click', toggleTheme);

    /* Tabs */
    el.tabs.addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (tab) switchView(tab.dataset.view);
    });

    /* Form */
    el.form.addEventListener('submit', onSubmit);
    el.cancelEdit.addEventListener('click', () => {
      resetForm();
      toast(el.formMsg, 'ویرایش لغو شد');
    });
    el.fTags.addEventListener('input', renderTagsPreview);

    /* Recent list — event delegation */
    el.recentList.addEventListener('click', e => {
      const thumb = e.target.closest('.ti-thumb');
      if (thumb) {
        const item = thumb.closest('.trade-item');
        const t = trades.find(x => x.id === item.dataset.id);
        if (t && t.screenshot) openLightbox(t.screenshot);
        return;
      }
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const item = btn.closest('.trade-item');
      if (!item) return;
      const id = item.dataset.id;

      if (btn.dataset.act === 'edit') {
        startEdit(id);
      } else if (btn.dataset.act === 'del') {
        if (!confirm('این معامله حذف شود؟')) return;
        trades = trades.filter(t => t.id !== id);
        saveTrades();
        renderAll();
        toast(el.formMsg, '🗑️ معامله حذف شد');
      }
    });

    /* All trades list */
    el.allTradesList.addEventListener('click', e => {
      const thumb = e.target.closest('.ti-thumb');
      if (thumb) {
        const item = thumb.closest('.trade-item');
        const t = trades.find(x => x.id === item.dataset.id);
        if (t && t.screenshot) openLightbox(t.screenshot);
        return;
      }
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const item = btn.closest('.trade-item');
      if (!item) return;
      const id = item.dataset.id;

      if (btn.dataset.act === 'edit') {
        startEdit(id);
      } else if (btn.dataset.act === 'del') {
        if (!confirm('این معامله حذف شود؟')) return;
        trades = trades.filter(t => t.id !== id);
        saveTrades();
        renderAll();
        toast(el.formMsg, '🗑️ معامله حذف شد');
      }
    });

    /* Calendar detail */
    el.calDetailList.addEventListener('click', e => {
      const thumb = e.target.closest('.ti-thumb');
      if (thumb) {
        const item = thumb.closest('.trade-item');
        const t = trades.find(x => x.id === item.dataset.id);
        if (t && t.screenshot) openLightbox(t.screenshot);
      }
    });

    /* Range filter */
    el.rangeFilter.addEventListener('click', e => {
      const btn = e.target.closest('button[data-r]');
      if (!btn) return;
      $$('button', el.rangeFilter).forEach(b => b.classList.toggle('active', b === btn));
      range = btn.dataset.r;
      renderKPIs();
      renderCharts();
      renderEmotions();
      renderStrategyTable();
      renderDailyTable();
      renderGoalsMini();
    });

    /* Demo */
    el.demoBtn.addEventListener('click', () => {
      if (trades.length && !confirm('داده‌های نمونه به لیست فعلی اضافه می‌شوند. ادامه؟')) return;
      trades = trades.concat(demoData());
      saveTrades();
      renderAll();
      switchView('analysis');
      toast(el.formMsg, '✨ داده نمونه اضافه شد');
    });

    /* Export */
    el.exportBtn.addEventListener('click', exportJSON);

    /* Import */
    el.importInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      if (file) importJSON(file);
      e.target.value = '';
    });

    /* Clear */
    el.clearBtn.addEventListener('click', () => {
      if (!trades.length) { toast(el.formMsg, 'لیست خالی است'); return; }
      if (!confirm('همه معاملات پاک شوند؟ قابل بازگشت نیست.')) return;
      trades = [];
      try { localStorage.removeItem(KEYS.trades); } catch (e) {}
      renderAll();
      toast(el.formMsg, '🗑️ همه داده‌ها پاک شد');
    });

    /* Calendar nav */
    el.calPrev.addEventListener('click', () => {
      calDate.setMonth(calDate.getMonth() - 1);
      renderCalendar();
    });
    el.calNext.addEventListener('click', () => {
      calDate.setMonth(calDate.getMonth() + 1);
      renderCalendar();
    });
    el.calGrid.addEventListener('click', e => {
      const cell = e.target.closest('.cal-cell.has-trade');
      if (!cell) return;
      showCalDetail(cell.dataset.date);
    });
    el.calDetailClose.addEventListener('click', () => {
      el.calDetailCard.hidden = true;
    });

    /* Filters */
    el.fltSearch.addEventListener('input', debounce(e => {
      filters.search = e.target.value;
      renderAllTrades();
    }, 200));
    el.fltStrategy.addEventListener('change', e => { filters.strategy = e.target.value; renderAllTrades(); });
    el.fltTag.addEventListener('change', e => { filters.tag = e.target.value; renderAllTrades(); });
    el.fltResult.addEventListener('change', e => { filters.result = e.target.value; renderAllTrades(); });
    el.fltEmotion.addEventListener('change', e => { filters.emotion = e.target.value; renderAllTrades(); });
    el.fltSide.addEventListener('change', e => { filters.side = e.target.value; renderAllTrades(); });
    el.fltFrom.addEventListener('change', e => { filters.from = e.target.value; renderAllTrades(); });
    el.fltTo.addEventListener('change', e => { filters.to = e.target.value; renderAllTrades(); });

    el.fltClear.addEventListener('click', () => {
      filters = { search: '', strategy: 'all', tag: 'all', result: 'all',
                  emotion: 'all', side: 'all', from: '', to: '' };
      renderAllTrades();
    });

    /* Goal */
    el.saveGoal.addEventListener('click', () => {
      const target = Math.abs(parseFloat(el.goalTarget.value));
      if (!target || isNaN(target)) {
        toast(el.goalMsg, '❌ مقدار هدف را وارد کن', true);
        return;
      }
      goal = {
        period: el.goalPeriod.dataset.value || 'week',
        metric: el.goalMetric.dataset.value || 'pnl',
        target: target
      };
      saveJSON(KEYS.goal, goal);
      renderGoalsPreview();
      renderGoalsMini();
      toast(el.goalMsg, '✅ هدف ذخیره شد');
    });

    el.clearGoal.addEventListener('click', () => {
      if (!goal) { toast(el.goalMsg, 'هدفی وجود ندارد'); return; }
      if (!confirm('هدف حذف شود؟')) return;
      goal = null;
      try { localStorage.removeItem(KEYS.goal); } catch (e) {}
      el.goalTarget.value = '';
      renderGoalsPreview();
      renderGoalsMini();
      toast(el.goalMsg, '🗑️ هدف حذف شد');
    });

    /* Rules */
    el.saveRules.addEventListener('click', () => {
      rules = {
        enabled: !!el.rulesEnabled.checked,
        dailyLoss: Math.abs(parseFloat(el.ruleDaily.value)) || 0,
        maxDD: Math.abs(parseFloat(el.ruleMaxDD.value)) || 0,
        target: Math.abs(parseFloat(el.ruleTarget.value)) || 0,
        balance: Math.abs(parseFloat(el.ruleBalance.value)) || 10000
      };
      saveJSON(KEYS.rules, rules);
      renderRulesStatus();
      renderRulesBanner();
      toast(el.rulesMsg, '✅ قوانین ذخیره شد');
    });

    /* Resize */
    window.addEventListener('resize', debounce(() => {
      if (el.pageAnalysis.classList.contains('active')) renderCharts();
    }, 160));

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (el.pageAnalysis.classList.contains('active')) renderCharts();
      }, 250);
    });

    /* Keyboard shortcut */
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 't' || e.key === 'T') toggleTheme();
    });
  }

  /* =========================================================
     INIT
     ========================================================= */
  function init() {
    applyTheme(theme);

    initSeg(el.sideSeg, 'buy');
    initSeg(el.resultSeg, 'win');
    initEmotions();
    initScreenshot();
    renderChecklistForm({});

    el.fDate.value = todayISO();
    renderTagsPreview();

    bindEvents();
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();