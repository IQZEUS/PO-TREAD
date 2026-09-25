/* ============================================================
   STORM ANALYSIS — Enhanced Analysis Page v1
   مستقل کار می‌کنه، از localStorage می‌خونه، با app.js تداخل نداره
   ============================================================ */
(function(){
  'use strict';

  const $ = id => document.getElementById(id);
  let lang = 'fa';
  try { lang = localStorage.getItem('po.lang') || 'fa'; } catch(e){}
  const isFa = lang === 'fa';

  const DAY_NAMES = isFa
    ? ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه']
    : ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];

  const EMO_LABELS = {
    calm:    isFa?'آرام':'Calm',  focused: isFa?'متمرکز':'Focused',
    fear:    isFa?'ترس':'Fear',   greed:   isFa?'طمع':'Greed',
    fomo:'FOMO', revenge: isFa?'انتقام':'Revenge'
  };

  /* ---------- Helpers ---------- */
  function loadTrades(){
    try {
      const arr = JSON.parse(localStorage.getItem('po.v4.trades') || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch(e){ return []; }
  }
  function pnl(t){
    const a = Math.abs(Number(t.amount) || 0);
    if (t.result === 'win')  return a;
    if (t.result === 'loss') return -a;
    return 0;
  }
  function fmtMoney(v){
    const n = Number(v) || 0, abs = Math.abs(n);
    const s = abs.toLocaleString('en-US', {
      minimumFractionDigits: Math.round(abs*100)%100 !== 0 ? 2 : 0,
      maximumFractionDigits: 2
    });
    if (n > 0) return '+$' + s;
    if (n < 0) return '-$' + s;
    return '$' + s;
  }
  function fmtCompact(v){
    const n = Number(v)||0, a = Math.abs(n);
    const sign = n<0?'-':(n>0?'+':'');
    if (a >= 1e6) return sign + (a/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
    if (a >= 1e3) return sign + (a/1e3).toFixed(1).replace(/\.0$/,'') + 'K';
    return sign + Math.round(a);
  }
  function faNum(n){
    if (!isFa) return String(n);
    return Number(n).toLocaleString('fa-IR');
  }
  function getDow(iso){
    const [y,m,d] = iso.split('-').map(Number);
    const day = new Date(y, m-1, d).getDay(); // 0=Sun ... 6=Sat
    return (day + 1) % 7; // 0=Sat ... 6=Fri
  }
  function isoDate(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }
  function sortAsc(list){
    return list.slice().sort((a,b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.createdAt||0) - (b.createdAt||0);
    });
  }
  function sortDesc(list){ return sortAsc(list).reverse(); }

  /* ---------- Gauge ---------- */
  function renderGauge(trades){
    const fill = $('stormGaugeFill'), val = $('stormGaugeValue');
    const wEl = $('stormWins'), lEl = $('stormLosses');
    if (!fill || !val) return;

    const wins = trades.filter(t => t.result === 'win').length;
    const losses = trades.filter(t => t.result === 'loss').length;
    const closed = wins + losses;
    const wr = closed ? (wins / closed) * 100 : 0;

    const r = 80, c = 2 * Math.PI * r;
    const arcLen = c * 0.75; // 270 درجه
    fill.style.strokeDasharray = arcLen + ' ' + c;
    // برای انیمیشن، اول offset رو ست کن بعد تغییر بده
    fill.style.strokeDashoffset = arcLen;
    requestAnimationFrame(() => {
      fill.style.strokeDashoffset = (arcLen * (1 - wr/100)).toString();
    });

    animateNumber(val, wr, '%');
    if (wEl) wEl.textContent = faNum(wins);
    if (lEl) lEl.textContent = faNum(losses);
  }
  function animateNumber(el, target, suffix){
    const dur = 1100, start = performance.now();
    function step(now){
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = target * eased;
      el.textContent = v.toFixed(0) + (suffix || '');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- Streak ---------- */
  function renderStreaks(trades){
    const main = $('stormStreakMain'), vEl = $('stormStreakVal'), lEl = $('stormStreakLbl');
    if (!main || !vEl || !lEl) return;

    const sorted = sortAsc(trades);
    let current = 0, currentType = null;
    for (let i = sorted.length - 1; i >= 0; i--){
      const t = sorted[i];
      if (t.result === 'be') continue;
      if (currentType === null) { currentType = t.result; current = 1; }
      else if (t.result === currentType) current++;
      else break;
    }

    let bestWin = 0, bestLoss = 0, w = 0, l = 0;
    for (const t of sorted){
      if (t.result === 'win'){ w++; l = 0; if (w > bestWin) bestWin = w; }
      else if (t.result === 'loss'){ l++; w = 0; if (l > bestLoss) bestLoss = l; }
      else { w = 0; l = 0; }
    }

    if (!current || !currentType){
      vEl.textContent = '—';
      lEl.textContent = isFa ? 'در انتظار معامله' : 'Waiting for trade';
      main.className = 'storm-streak-main';
      main.querySelector('.icon').textContent = '⚡';
      return;
    }

    const isWin = currentType === 'win';
    main.className = 'storm-streak-main' + (isWin ? '' : ' loss');
    main.querySelector('.icon').textContent = isWin ? '🔥' : '❄️';
    vEl.textContent = faNum(current) + (isFa ? ' معامله' : ' trades');
    lEl.textContent = isWin
      ? (isFa ? `برد پشت‌سرهم · بهترین رکورد: ${faNum(bestWin)}` : `Win streak · Best: ${bestWin}`)
      : (isFa ? `باخت پشت‌سرهم · بدترین رکورد: ${faNum(bestLoss)}` : `Loss streak · Worst: ${bestLoss}`);
  }

  /* ---------- Ribbon ---------- */
  function renderRibbon(trades){
    const el = $('stormRibbon');
    if (!el) return;
    const sorted = sortDesc(trades).slice(0, 20);
    if (!sorted.length){
      el.innerHTML = '<span style="color:var(--muted);font-size:12px">' +
        (isFa ? 'داده‌ای موجود نیست' : 'No data') + '</span>';
      return;
    }
    el.innerHTML = sorted.map((t,i) => {
      const cls = t.result === 'win' ? 'win' : t.result === 'loss' ? 'loss' : 'be';
      const letter = t.result === 'win' ? 'W' : t.result === 'loss' ? 'L' : 'B';
      const tip = `${t.symbol || ''} · ${fmtMoney(pnl(t))} · ${t.date}`;
      return `<span class="storm-dot ${cls}" style="animation-delay:${i*25}ms" title="${tip}">${letter}</span>`;
    }).join('');
  }

  /* ---------- Day of Week ---------- */
  function renderDow(trades){
    const el = $('stormDow');
    if (!el) return;

    const buckets = Array.from({length:7}, () => ({ net:0, count:0 }));
    for (const t of trades){
      const d = getDow(t.date);
      buckets[d].net += pnl(t);
      buckets[d].count++;
    }
    let maxAbs = 0;
    for (const b of buckets){ const a = Math.abs(b.net); if (a > maxAbs) maxAbs = a; }
    function intensity(v){
      if (maxAbs === 0) return 0;
      const r = Math.abs(v) / maxAbs;
      if (r < 0.34) return 1;
      if (r < 0.67) return 2;
      return 3;
    }

    el.innerHTML = buckets.map((b,i) => {
      const inten = intensity(b.net);
      const cls = b.net > 0 ? ('pos-'+inten) : b.net < 0 ? ('neg-'+inten) : '';
      const pnlTxt = b.count === 0 ? '—' : fmtCompact(b.net);
      return `<div class="storm-dow-cell ${cls}">
        <span class="storm-dow-day">${DAY_NAMES[i]}</span>
        <span class="storm-dow-val">${pnlTxt}</span>
        <span class="storm-dow-count">${faNum(b.count)} ${isFa?'معامله':''}</span>
      </div>`;
    }).join('');
  }

  /* ---------- Rolling Winrate ---------- */
  function renderRolling(trades){
    const canvas = $('stormRolling');
    if (!canvas) return;

    const sorted = sortAsc(trades);
    const WINDOW = 20;
    const points = [];
    for (let i = 0; i < sorted.length; i++){
      const start = Math.max(0, i - WINDOW + 1);
      const slice = sorted.slice(start, i+1).filter(t => t.result === 'win' || t.result === 'loss');
      if (slice.length < 5) continue;
      const wins = slice.filter(t => t.result === 'win').length;
      points.push((wins / slice.length) * 100);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 10), h = Math.max(rect.height, 10);
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (points.length < 2){
      ctx.fillStyle = 'rgba(134,151,184,.6)';
      ctx.font = '12px Vazirmatn, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isFa ? 'داده کافی نیست' : 'Not enough data', w/2, h/2);
      return;
    }

    const pad = { t:8, r:8, b:8, l:8 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;

    // خط ۵۰٪
    const y50 = pad.t + ph * 0.5;
    ctx.strokeStyle = 'rgba(120,150,200,.2)';
    ctx.setLineDash([3,3]);
    ctx.beginPath();
    ctx.moveTo(pad.l, y50); ctx.lineTo(pad.l + pw, y50);
    ctx.stroke();
    ctx.setLineDash([]);

    const xOf = i => pad.l + (i / (points.length - 1)) * pw;
    const yOf = v => pad.t + (1 - v/100) * ph;

    // ناحیه
    const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph);
    g.addColorStop(0, 'rgba(46,230,166,.35)');
    g.addColorStop(1, 'rgba(46,230,166,0)');
    ctx.beginPath();
    ctx.moveTo(xOf(0), pad.t + ph);
    for (let i = 0; i < points.length; i++) ctx.lineTo(xOf(i), yOf(points[i]));
    ctx.lineTo(xOf(points.length-1), pad.t + ph);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();

    // خط
    const lg = ctx.createLinearGradient(pad.l, 0, pad.l + pw, 0);
    lg.addColorStop(0, '#5b8cff');
    lg.addColorStop(1, '#2ee6a6');
    ctx.beginPath();
    for (let i = 0; i < points.length; i++){
      if (i === 0) ctx.moveTo(xOf(i), yOf(points[i]));
      else ctx.lineTo(xOf(i), yOf(points[i]));
    }
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // نقطه‌ی آخر
    const lastI = points.length - 1;
    ctx.beginPath();
    ctx.arc(xOf(lastI), yOf(points[lastI]), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2ee6a6'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 2; ctx.stroke();
  }

  /* ---------- Comparison ---------- */
  function renderComparison(trades){
    const el = $('stormCompare');
    if (!el) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    function statsForRange(fromISO, toISO){
      const f = trades.filter(t => t.date >= fromISO && t.date <= toISO);
      let net = 0, wins = 0, losses = 0;
      for (const t of f){
        net += pnl(t);
        if (t.result === 'win') wins++;
        else if (t.result === 'loss') losses++;
      }
      const closed = wins + losses;
      return { net, count: f.length, winRate: closed ? (wins/closed)*100 : 0 };
    }

    // 7 روز اخیر
    const c7f = new Date(today); c7f.setDate(c7f.getDate() - 6);
    const cur7 = statsForRange(isoDate(c7f), isoDate(today));
    // 7 روز قبلش
    const p7t = new Date(c7f); p7t.setDate(p7t.getDate() - 1);
    const p7f = new Date(p7t); p7f.setDate(p7f.getDate() - 6);
    const prev7 = statsForRange(isoDate(p7f), isoDate(p7t));

    // 30 روز اخیر
    const c30f = new Date(today); c30f.setDate(c30f.getDate() - 29);
    const cur30 = statsForRange(isoDate(c30f), isoDate(today));
    // 30 روز قبلش
    const p30t = new Date(c30f); p30t.setDate(p30t.getDate() - 1);
    const p30f = new Date(p30t); p30f.setDate(p30f.getDate() - 29);
    const prev30 = statsForRange(isoDate(p30f), isoDate(p30t));

    function delta(cur, prev){
      if (prev === 0 && cur === 0) return { cls:'same', txt:'—' };
      if (prev === 0) return { cls: cur>0?'up':'down', txt:(cur>0?'↑':'↓')+' '+(isFa?'جدید':'new') };
      const pct = ((cur - prev) / Math.abs(prev)) * 100;
      if (Math.abs(pct) < 1) return { cls:'same', txt:'≈ 0%' };
      return { cls: pct>0?'up':'down', txt:(pct>0?'↑ ':'↓ ')+Math.abs(pct).toFixed(0)+'%' };
    }

    const items = [
      { lbl: isFa?'سود ۷ روزه':'7-day P/L',   cur: cur7.net,     prev: prev7.net },
      { lbl: isFa?'وین ریت ۷ روزه':'7-day WR', cur: cur7.winRate, prev: prev7.winRate, isPct: true },
      { lbl: isFa?'سود ۳۰ روزه':'30-day P/L',   cur: cur30.net,     prev: prev30.net },
      { lbl: isFa?'وین ریت ۳۰ روزه':'30-day WR', cur: cur30.winRate, prev: prev30.winRate, isPct: true }
    ];

    el.innerHTML = items.map(it => {
      const d = delta(it.cur, it.prev);
      const val = it.isPct
        ? (it.cur.toFixed(1) + '%')
        : fmtMoney(it.cur);
      return `<div class="storm-compare-item">
        <div class="storm-compare-lbl">${it.lbl}</div>
        <div class="storm-compare-val">${val}</div>
        <span class="storm-compare-delta ${d.cls}">${d.txt}</span>
      </div>`;
    }).join('');
  }

  /* ---------- Insight ---------- */
  function renderInsight(trades){
    const el = $('stormInsightText');
    if (!el) return;

    if (!trades.length){
      el.textContent = isFa ? 'هنوز معامله‌ای ثبت نکردی — وقتشه شروع کنی! 🚀' : 'No trades yet — get started! 🚀';
      return;
    }
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    if (closed.length < 3){
      el.textContent = isFa ? 'برای تحلیل دقیق‌تر، حداقل ۳ معامله‌ی بسته‌شده لازمه.' : 'Log at least 3 closed trades for insights.';
      return;
    }

    // بهترین روز
    const buckets = Array.from({length:7}, () => ({ net:0, count:0 }));
    for (const t of trades){
      const d = getDow(t.date);
      buckets[d].net += pnl(t);
      buckets[d].count++;
    }
    let bestDow = -1;
    for (let i = 0; i < 7; i++){
      if (buckets[i].count === 0) continue;
      if (bestDow === -1 || buckets[i].net > buckets[bestDow].net) bestDow = i;
    }

    // بهترین استراتژی
    const strats = new Map();
    for (const t of trades){
      const k = t.strategy || '—';
      const s = strats.get(k) || { net:0, count:0 };
      s.net += pnl(t); s.count++;
      strats.set(k, s);
    }
    let bestStrat = null, bestNet = -Infinity;
    for (const [name, s] of strats){
      if (s.count >= 2 && s.net > bestNet){ bestNet = s.net; bestStrat = { name, ...s }; }
    }

    // بدترین حالت روحی
    const emo = new Map();
    for (const t of trades){
      const k = t.emotion || 'calm';
      const e = emo.get(k) || { net:0, count:0 };
      e.net += pnl(t); e.count++;
      emo.set(k, e);
    }
    let worstEmo = null, worstNet = Infinity;
    for (const [k, e] of emo){
      if (e.count >= 2 && e.net < worstNet){ worstNet = e.net; worstEmo = { key:k, ...e }; }
    }

    const parts = [];
    if (bestDow !== -1 && buckets[bestDow].net > 0){
      parts.push(isFa
        ? `بهترین روزت <strong>${DAY_NAMES[bestDow]}</strong> با سود ${fmtMoney(buckets[bestDow].net)} بوده`
        : `Best day: <strong>${DAY_NAMES[bestDow]}</strong> with ${fmtMoney(buckets[bestDow].net)}`);
    }
    if (bestStrat){
      parts.push(isFa
        ? `استراتژی طلاییت: <strong>${bestStrat.name}</strong> (${fmtMoney(bestStrat.net)})`
        : `Top strategy: <strong>${bestStrat.name}</strong> (${fmtMoney(bestStrat.net)})`);
    }
    if (worstEmo && worstNet < 0){
      parts.push(isFa
        ? `حالت <strong>${EMO_LABELS[worstEmo.key] || worstEmo.key}</strong> برات گرون تموم شده (${fmtMoney(worstEmo.net)})`
        : `<strong>${EMO_LABELS[worstEmo.key] || worstEmo.key}</strong> costs you (${fmtMoney(worstEmo.net)})`);
    }

    el.innerHTML = parts.length
      ? parts.join(' &nbsp;<span style="color:var(--muted)">·</span>&nbsp; ')
      : (isFa ? 'داده‌ی کافی برای تحلیل نیست' : 'Not enough data');
  }

  /* ---------- Render All ---------- */
  let scheduled = false;
  function renderAll(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      try {
        const trades = loadTrades();
        renderGauge(trades);
        renderStreaks(trades);
        renderRibbon(trades);
        renderDow(trades);
        renderRolling(trades);
        renderComparison(trades);
        renderInsight(trades);
      } catch(e){ console.error('[Storm]', e); }
    });
  }

  /* ---------- Watch for changes ---------- */
  window.addEventListener('storage', e => {
    if (e.key === 'po.v4.trades') renderAll();
  });

  // وقتی کاربر تب آنالیز رو باز می‌کنه
  document.addEventListener('click', e => {
    const tab = e.target.closest && e.target.closest('.tab[data-view="analysis"]');
    if (tab) setTimeout(renderAll, 80);
  });

  // پولینگ سبک به‌عنوان fallback (چون sync.js setItem رو override می‌کنه)
  setInterval(() => {
    const p = document.getElementById('page-analysis');
    if (p && p.classList.contains('active')) renderAll();
  }, 4000);

  // ریسایز
  let rTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(rTimer);
    rTimer = setTimeout(renderAll, 220);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(renderAll, 300);
  });

  // Init
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(renderAll, 700));
  } else {
    setTimeout(renderAll, 700);
  }

  // اکسپوز برای دیباگ
  window.PT_Storm = { render: renderAll };
})();
