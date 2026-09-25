/* ============================================================
   STORM ANALYSIS v2 — Bulletproof
   ============================================================ */
(function(){
  'use strict';

  var $ = function(id){ return document.getElementById(id); };
  var lang = 'fa';
  try { lang = localStorage.getItem('po.lang') || 'fa'; } catch(e){}
  var isFa = lang === 'fa';

  var DAYS = isFa
    ? ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه']
    : ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];

  var EMO = {
    calm:    isFa?'آرام':'Calm',
    focused: isFa?'متمرکز':'Focused',
    fear:    isFa?'ترس':'Fear',
    greed:   isFa?'طمع':'Greed',
    fomo:    'FOMO',
    revenge: isFa?'انتقام':'Revenge'
  };

  function loadTrades(){
    try {
      var a = JSON.parse(localStorage.getItem('po.v4.trades') || '[]');
      return Array.isArray(a) ? a : [];
    } catch(e){ return []; }
  }
  function pnl(t){
    var a = Math.abs(Number(t.amount) || 0);
    if (t.result === 'win')  return a;
    if (t.result === 'loss') return -a;
    return 0;
  }
  function money(v){
    var n = Number(v) || 0, abs = Math.abs(n);
    var hasFrac = Math.round(abs * 100) % 100 !== 0;
    var s = abs.toLocaleString('en-US', {
      minimumFractionDigits: hasFrac ? 2 : 0,
      maximumFractionDigits: 2
    });
    if (n > 0) return '+$' + s;
    if (n < 0) return '-$' + s;
    return '$' + s;
  }
  function compact(v){
    var n = Number(v) || 0, a = Math.abs(n);
    var sign = n < 0 ? '-' : (n > 0 ? '+' : '');
    if (a >= 1e6) return sign + (a / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (a >= 1e3) return sign + (a / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return sign + Math.round(a);
  }
  function faNum(n){
    if (!isFa) return String(n);
    try { return Number(n).toLocaleString('fa-IR'); }
    catch(e){ return String(n); }
  }
  function getDow(iso){
    var p = String(iso).split('-');
    if (p.length !== 3) return 0;
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay();
    return (d + 1) % 7;
  }
  function isoDate(d){
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var dd = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + dd;
  }
  function sortAsc(list){
    return list.slice().sort(function(a, b){
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }
  function escapeHTML(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* ---------- Gauge ---------- */
  var gaugeAnimRAF = null;
  function renderGauge(trades){
    var fill = $('stormGaugeFill');
    var val  = $('stormGaugeValue');
    var wEl  = $('stormWins');
    var lEl  = $('stormLosses');
    if (!fill || !val) return;

    var wins = 0, losses = 0;
    for (var i = 0; i < trades.length; i++){
      if (trades[i].result === 'win') wins++;
      else if (trades[i].result === 'loss') losses++;
    }
    var closed = wins + losses;
    var wr = closed ? (wins / closed) * 100 : 0;

    var r = 80;
    var circ = 2 * Math.PI * r;
    var arcLen = circ * 0.75;
    var offset = arcLen * (1 - wr / 100);

    fill.style.strokeDasharray = arcLen + ' ' + circ;
    fill.style.strokeDashoffset = arcLen;

    if (gaugeAnimRAF) cancelAnimationFrame(gaugeAnimRAF);
    gaugeAnimRAF = requestAnimationFrame(function(){
      gaugeAnimRAF = requestAnimationFrame(function(){
        fill.style.strokeDashoffset = offset;
      });
    });

    animateNumber(val, wr, '%');
    if (wEl) wEl.textContent = faNum(wins);
    if (lEl) lEl.textContent = faNum(losses);
  }
  function animateNumber(el, target, suffix){
    if (el.__animRAF) cancelAnimationFrame(el.__animRAF);
    var start = performance.now();
    var dur = 1000;
    function step(now){
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(0) + (suffix || '');
      if (p < 1) el.__animRAF = requestAnimationFrame(step);
      else el.__animRAF = null;
    }
    el.__animRAF = requestAnimationFrame(step);
  }

  /* ---------- Streak ---------- */
  function renderStreak(trades){
    var main = $('stormStreakMain');
    var vEl  = $('stormStreakVal');
    var lEl  = $('stormStreakLbl');
    if (!main || !vEl || !lEl) return;

    var sorted = sortAsc(trades);
    var current = 0, currentType = null;
    for (var i = sorted.length - 1; i >= 0; i--){
      var t = sorted[i];
      if (t.result === 'be') continue;
      if (currentType === null){ currentType = t.result; current = 1; }
      else if (t.result === currentType) current++;
      else break;
    }
    var bestW = 0, bestL = 0, w = 0, l = 0;
    for (var j = 0; j < sorted.length; j++){
      var x = sorted[j];
      if (x.result === 'win'){ w++; l = 0; if (w > bestW) bestW = w; }
      else if (x.result === 'loss'){ l++; w = 0; if (l > bestL) bestL = l; }
      else { w = 0; l = 0; }
    }

    var icon = main.querySelector('.icon');
    if (!current || !currentType){
      vEl.textContent = '—';
      lEl.textContent = isFa ? 'در انتظار معامله' : 'Waiting for trade';
      main.className = 'storm-streak-main neutral';
      if (icon) icon.textContent = '⚡';
      return;
    }
    var isWin = currentType === 'win';
    main.className = 'storm-streak-main' + (isWin ? '' : ' loss');
    if (icon) icon.textContent = isWin ? '🔥' : '❄️';
    vEl.textContent = faNum(current) + (isFa ? ' معامله' : ' trades');
    lEl.textContent = isWin
      ? (isFa ? ('برد پشت‌سرهم · بهترین: ' + faNum(bestW)) : ('Win streak · Best: ' + bestW))
      : (isFa ? ('باخت پشت‌سرهم · بدترین: ' + faNum(bestL)) : ('Loss streak · Worst: ' + bestL));
  }

  /* ---------- Ribbon ---------- */
  function renderRibbon(trades){
    var el = $('stormRibbon');
    if (!el) return;
    var sorted = sortAsc(trades).reverse().slice(0, 20);
    if (!sorted.length){
      el.innerHTML = '<span style="color:var(--muted);font-size:12px">' +
        (isFa ? 'داده‌ای موجود نیست' : 'No data') + '</span>';
      return;
    }
    var html = '';
    for (var i = 0; i < sorted.length; i++){
      var t = sorted[i];
      var cls = t.result === 'win' ? 'win' : t.result === 'loss' ? 'loss' : 'be';
      var letter = t.result === 'win' ? 'W' : t.result === 'loss' ? 'L' : 'B';
      var tip = escapeHTML((t.symbol || '') + ' · ' + money(pnl(t)) + ' · ' + t.date);
      html += '<span class="storm-dot ' + cls + '" title="' + tip + '">' + letter + '</span>';
    }
    el.innerHTML = html;
  }

  /* ---------- Day of Week ---------- */
  function renderDow(trades){
    var el = $('stormDow');
    if (!el) return;
    var buckets = [];
    for (var i = 0; i < 7; i++) buckets.push({ net: 0, count: 0 });
    for (var j = 0; j < trades.length; j++){
      var d = getDow(trades[j].date);
      buckets[d].net += pnl(trades[j]);
      buckets[d].count++;
    }
    var maxAbs = 0;
    for (var k = 0; k < 7; k++){
      var a = Math.abs(buckets[k].net);
      if (a > maxAbs) maxAbs = a;
    }
    function intensity(v){
      if (maxAbs === 0) return 0;
      var r = Math.abs(v) / maxAbs;
      if (r < 0.34) return 1;
      if (r < 0.67) return 2;
      return 3;
    }
    var html = '';
    for (var m = 0; m < 7; m++){
      var b = buckets[m];
      var inten = intensity(b.net);
      var cls = b.net > 0 ? ('pos-' + inten) : b.net < 0 ? ('neg-' + inten) : '';
      var pnlTxt = b.count === 0 ? '—' : compact(b.net);
      html += '<div class="storm-dow-cell ' + cls + '">' +
        '<span class="storm-dow-day">' + DAYS[m] + '</span>' +
        '<span class="storm-dow-val">' + pnlTxt + '</span>' +
        '<span class="storm-dow-count">' + faNum(b.count) + (isFa ? ' معامله' : '') + '</span>' +
      '</div>';
    }
    el.innerHTML = html;
  }

  /* ---------- Rolling Winrate ---------- */
  function renderRolling(trades){
    var canvas = $('stormRolling');
    if (!canvas) return;

    var sorted = sortAsc(trades);
    var WINDOW = 20;
    var points = [];
    for (var i = 0; i < sorted.length; i++){
      var start = Math.max(0, i - WINDOW + 1);
      var slice = sorted.slice(start, i + 1);
      var wins = 0, closed = 0;
      for (var k = 0; k < slice.length; k++){
        if (slice[k].result === 'win'){ wins++; closed++; }
        else if (slice[k].result === 'loss'){ closed++; }
      }
      if (closed >= 5) points.push((wins / closed) * 100);
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(rect.width, 10);
    var h = Math.max(rect.height, 10);
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (points.length < 2){
      ctx.fillStyle = 'rgba(134,151,184,.65)';
      ctx.font = '12px Vazirmatn, Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isFa ? 'داده کافی نیست' : 'Not enough data', w / 2, h / 2);
      return;
    }

    var pad = { t: 10, r: 10, b: 10, l: 10 };
    var pw = w - pad.l - pad.r;
    var ph = h - pad.t - pad.b;

    // 50% line
    var y50 = pad.t + ph * 0.5;
    ctx.strokeStyle = 'rgba(120,150,200,.22)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(pad.l, y50);
    ctx.lineTo(pad.l + pw, y50);
    ctx.stroke();
    ctx.setLineDash([]);

    function xOf(i){ return pad.l + (i / (points.length - 1)) * pw; }
    function yOf(v){ return pad.t + (1 - v / 100) * ph; }

    // Area fill
    var g = ctx.createLinearGradient(0, pad.t, 0, pad.t + ph);
    g.addColorStop(0, 'rgba(46,230,166,.3)');
    g.addColorStop(1, 'rgba(46,230,166,0)');
    ctx.beginPath();
    ctx.moveTo(xOf(0), pad.t + ph);
    for (var a = 0; a < points.length; a++) ctx.lineTo(xOf(a), yOf(points[a]));
    ctx.lineTo(xOf(points.length - 1), pad.t + ph);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Line
    ctx.beginPath();
    for (var b = 0; b < points.length; b++){
      if (b === 0) ctx.moveTo(xOf(b), yOf(points[b]));
      else ctx.lineTo(xOf(b), yOf(points[b]));
    }
    ctx.strokeStyle = '#2ee6a6';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Last dot
    var lastI = points.length - 1;
    ctx.beginPath();
    ctx.arc(xOf(lastI), yOf(points[lastI]), 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2ee6a6';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ---------- Comparison ---------- */
  function renderCompare(trades){
    var el = $('stormCompare');
    if (!el) return;

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    function statsRange(fromISO, toISO){
      var net = 0, wins = 0, losses = 0, count = 0;
      for (var i = 0; i < trades.length; i++){
        var t = trades[i];
        if (t.date >= fromISO && t.date <= toISO){
          net += pnl(t);
          if (t.result === 'win') wins++;
          else if (t.result === 'loss') losses++;
          count++;
        }
      }
      var closed = wins + losses;
      return { net: net, count: count, winRate: closed ? (wins / closed) * 100 : 0 };
    }

    var c7f = new Date(today); c7f.setDate(c7f.getDate() - 6);
    var cur7 = statsRange(isoDate(c7f), isoDate(today));

    var p7t = new Date(c7f); p7t.setDate(p7t.getDate() - 1);
    var p7f = new Date(p7t); p7f.setDate(p7f.getDate() - 6);
    var prev7 = statsRange(isoDate(p7f), isoDate(p7t));

    var c30f = new Date(today); c30f.setDate(c30f.getDate() - 29);
    var cur30 = statsRange(isoDate(c30f), isoDate(today));

    var p30t = new Date(c30f); p30t.setDate(p30t.getDate() - 1);
    var p30f = new Date(p30t); p30f.setDate(p30f.getDate() - 29);
    var prev30 = statsRange(isoDate(p30f), isoDate(p30t));

    function delta(cur, prev){
      if (prev === 0 && cur === 0) return { cls: 'same', txt: '—' };
      if (prev === 0) return { cls: cur > 0 ? 'up' : 'down', txt: (cur > 0 ? '↑ ' : '↓ ') + (isFa ? 'جدید' : 'new') };
      var pct = ((cur - prev) / Math.abs(prev)) * 100;
      if (Math.abs(pct) < 1) return { cls: 'same', txt: '≈ 0%' };
      return { cls: pct > 0 ? 'up' : 'down', txt: (pct > 0 ? '↑ ' : '↓ ') + Math.abs(pct).toFixed(0) + '%' };
    }

    var items = [
      { lbl: isFa ? 'سود ۷ روزه' : '7-day P/L',     cur: cur7.net,      prev: prev7.net },
      { lbl: isFa ? 'وین ریت ۷ روزه' : '7-day WR',  cur: cur7.winRate,  prev: prev7.winRate,  isPct: true },
      { lbl: isFa ? 'سود ۳۰ روزه' : '30-day P/L',   cur: cur30.net,     prev: prev30.net },
      { lbl: isFa ? 'وین ریت ۳۰ روزه' : '30-day WR', cur: cur30.winRate, prev: prev30.winRate, isPct: true }
    ];

    var html = '';
    for (var i = 0; i < items.length; i++){
      var it = items[i];
      var d = delta(it.cur, it.prev);
      var v = it.isPct ? (it.cur.toFixed(1) + '%') : money(it.cur);
      html += '<div class="storm-compare-item">' +
        '<div class="storm-compare-lbl">' + it.lbl + '</div>' +
        '<div class="storm-compare-val">' + v + '</div>' +
        '<span class="storm-compare-delta ' + d.cls + '">' + d.txt + '</span>' +
      '</div>';
    }
    el.innerHTML = html;
  }

  /* ---------- Insight ---------- */
  function renderInsight(trades){
    var el = $('stormInsightText');
    if (!el) return;

    if (!trades.length){
      el.textContent = isFa
        ? 'هنوز معامله‌ای ثبت نکردی — وقتشه شروع کنی! 🚀'
        : 'No trades yet — get started! 🚀';
      return;
    }
    var closedCount = 0;
    for (var c = 0; c < trades.length; c++){
      if (trades[c].result === 'win' || trades[c].result === 'loss') closedCount++;
    }
    if (closedCount < 3){
      el.textContent = isFa
        ? 'برای تحلیل دقیق‌تر، حداقل ۳ معامله‌ی بسته‌شده لازمه.'
        : 'Log at least 3 closed trades for insights.';
      return;
    }

    var buckets = [];
    for (var i = 0; i < 7; i++) buckets.push({ net: 0, count: 0 });
    for (var j = 0; j < trades.length; j++){
      var d = getDow(trades[j].date);
      buckets[d].net += pnl(trades[j]);
      buckets[d].count++;
    }
    var bestDow = -1;
    for (var k = 0; k < 7; k++){
      if (buckets[k].count === 0) continue;
      if (bestDow === -1 || buckets[k].net > buckets[bestDow].net) bestDow = k;
    }

    var strats = {};
    for (var s = 0; s < trades.length; s++){
      var key = trades[s].strategy || '—';
      if (!strats[key]) strats[key] = { net: 0, count: 0 };
      strats[key].net += pnl(trades[s]);
      strats[key].count++;
    }
    var bestStratName = null, bestNet = -Infinity;
    for (var sn in strats){
      if (strats[sn].count >= 2 && strats[sn].net > bestNet){
        bestNet = strats[sn].net;
        bestStratName = sn;
      }
    }

    var emo = {};
    for (var e = 0; e < trades.length; e++){
      var ek = trades[e].emotion || 'calm';
      if (!emo[ek]) emo[ek] = { net: 0, count: 0 };
      emo[ek].net += pnl(trades[e]);
      emo[ek].count++;
    }
    var worstEmoKey = null, worstNet = Infinity;
    for (var e2 in emo){
      if (emo[e2].count >= 2 && emo[e2].net < worstNet){
        worstNet = emo[e2].net;
        worstEmoKey = e2;
      }
    }

    var parts = [];
    if (bestDow !== -1 && buckets[bestDow].net > 0){
      parts.push(isFa
        ? 'بهترین روزت <strong>' + DAYS[bestDow] + '</strong> با سود ' + money(buckets[bestDow].net) + ' بوده'
        : 'Best day: <strong>' + DAYS[bestDow] + '</strong> with ' + money(buckets[bestDow].net));
    }
    if (bestStratName){
      parts.push(isFa
        ? 'استراتژی طلاییت: <strong>' + escapeHTML(bestStratName) + '</strong> (' + money(bestNet) + ')'
        : 'Top strategy: <strong>' + escapeHTML(bestStratName) + '</strong> (' + money(bestNet) + ')');
    }
    if (worstEmoKey && worstNet < 0){
      parts.push(isFa
        ? 'حالت <strong>' + (EMO[worstEmoKey] || worstEmoKey) + '</strong> برات گرون تموم شده (' + money(worstNet) + ')'
        : '<strong>' + (EMO[worstEmoKey] || worstEmoKey) + '</strong> costs you (' + money(worstNet) + ')');
    }

    el.innerHTML = parts.length
      ? parts.join(' &nbsp;<span style="color:var(--muted)">·</span>&nbsp; ')
      : (isFa ? 'داده‌ی کافی برای تحلیل نیست' : 'Not enough data');
  }

  /* ---------- Render All ---------- */
  var scheduled = false;
  function renderAll(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function(){
      scheduled = false;
      try {
        var trades = loadTrades();
        renderGauge(trades);
        renderStreak(trades);
        renderRibbon(trades);
        renderDow(trades);
        renderRolling(trades);
        renderCompare(trades);
        renderInsight(trades);
      } catch(err){
        console.error('[Storm]', err);
      }
    });
  }

  /* ---------- Triggers ---------- */
  window.addEventListener('storage', function(e){
    if (e.key === 'po.v4.trades') renderAll();
  });

  document.addEventListener('click', function(e){
    var tab = e.target && e.target.closest && e.target.closest('.tab[data-view="analysis"]');
    if (tab) setTimeout(renderAll, 80);
  }, true);

  setInterval(function(){
    var p = document.getElementById('page-analysis');
    if (p && p.classList.contains('active')) renderAll();
  }, 4000);

  var rt = null;
  window.addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(renderAll, 220);
  });
  window.addEventListener('orientationchange', function(){
    setTimeout(renderAll, 300);
  });

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(renderAll, 700); });
  } else {
    setTimeout(renderAll, 700);
  }

  window.PT_Storm = { render: renderAll };
})();
