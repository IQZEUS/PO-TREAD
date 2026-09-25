/* ============================================================
   STORM ANALYTICS v3 — Professional Grade
   ============================================================ */
(function(){
  'use strict';

  var $ = function(id){ return document.getElementById(id); };

  var lang = 'fa';
  try { lang = localStorage.getItem('po.lang') || 'fa'; } catch(e){}
  var isFa = lang === 'fa';

  var DAYS = isFa
    ? ['ش','ی','د','س','چ','پ','ج']
    : ['S','M','T','W','T','F','S'];
  var DAYS_FULL = isFa
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

  /* ================= Helpers ================= */
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
  function moneyShort(v){
    var n = Number(v) || 0, a = Math.abs(n);
    var sign = n < 0 ? '-' : (n > 0 ? '+' : '');
    if (a >= 1e6) return sign + '$' + (a/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
    if (a >= 1e3) return sign + '$' + (a/1e3).toFixed(1).replace(/\.0$/,'') + 'K';
    return sign + '$' + Math.round(a);
  }
  function faNum(n){
    if (!isFa) return String(n);
    try { return Number(n).toLocaleString('fa-IR'); }
    catch(e){ return String(n); }
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c];
    });
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
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

  /* ================= Donut ================= */
  function renderDonut(trades){
    var fill = $('saDonutFill');
    var valEl = $('saDonutVal');
    var wEl = $('saDonutWins');
    var lEl = $('saDonutLosses');
    var bEl = $('saDonutBE');
    if (!fill || !valEl) return;

    var wins = 0, losses = 0, be = 0;
    for (var i = 0; i < trades.length; i++){
      var r = trades[i].result;
      if (r === 'win') wins++;
      else if (r === 'loss') losses++;
      else be++;
    }
    var closed = wins + losses;
    var wr = closed ? (wins / closed) * 100 : 0;

    var r = 80;
    var circ = 2 * Math.PI * r;
    var arc = circ * 0.75;
    var off = arc * (1 - wr / 100);

    fill.style.strokeDasharray = arc + ' ' + circ;
    fill.style.strokeDashoffset = arc;

    // color based on WR
    var color = wr >= 60 ? '#2ee6a6' : wr >= 45 ? '#5b8cff' : wr >= 30 ? '#ffb020' : '#ff5674';
    fill.setAttribute('stroke', color);

    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        fill.style.strokeDashoffset = off;
      });
    });

    animateNumber(valEl, wr, '%', 0);
    if (wEl) wEl.textContent = faNum(wins);
    if (lEl) lEl.textContent = faNum(losses);
    if (bEl) bEl.textContent = faNum(be);
  }
  function animateNumber(el, target, suffix, decimals){
    if (el.__raf) cancelAnimationFrame(el.__raf);
    var start = performance.now();
    var dur = 900;
    decimals = decimals || 0;
    function step(now){
      var p = clamp((now - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + (suffix || '');
      if (p < 1) el.__raf = requestAnimationFrame(step);
      else el.__raf = null;
    }
    el.__raf = requestAnimationFrame(step);
  }

  /* ================= KPI Strip ================= */
  function renderKpiRow(trades){
    var el = $('saKpiRow');
    if (!el) return;

    // current 30d vs prev 30d
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    function rangeStats(fromISO, toISO){
      var net = 0, wins = 0, losses = 0, gp = 0, gl = 0, rSum = 0, rCnt = 0;
      for (var i = 0; i < trades.length; i++){
        var t = trades[i];
        if (t.date < fromISO || t.date > toISO) continue;
        var p = pnl(t);
        net += p;
        if (t.result === 'win'){ wins++; gp += p; }
        else if (t.result === 'loss'){ losses++; gl += Math.abs(p); }
        var risk = Math.abs(Number(t.risk) || 0);
        if (risk > 0){ rSum += p / risk; rCnt++; }
      }
      var closed = wins + losses;
      return {
        net: net,
        wins: wins,
        losses: losses,
        count: wins + losses,
        winRate: closed ? (wins/closed) * 100 : 0,
        pf: gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0),
        avgR: rCnt ? rSum / rCnt : 0
      };
    }

    var c30f = new Date(today); c30f.setDate(c30f.getDate() - 29);
    var p30t = new Date(c30f); p30t.setDate(p30t.getDate() - 1);
    var p30f = new Date(p30t); p30f.setDate(p30t.getDate() - 29);

    var cur = rangeStats(isoDate(c30f), isoDate(today));
    var prev = rangeStats(isoDate(p30f), isoDate(p30t));

    function deltaPct(c, p){
      if (p === 0 && c === 0) return { cls:'', txt:'0%' };
      if (p === 0) return { cls: c > 0 ? 'up' : 'down', txt: c > 0 ? '↑ NEW' : '↓ NEW' };
      var pct = ((c - p) / Math.abs(p)) * 100;
      if (Math.abs(pct) < 1) return { cls:'', txt:'≈ 0%' };
      return {
        cls: pct > 0 ? 'up' : 'down',
        txt: (pct > 0 ? '↑ ' : '↓ ') + Math.abs(pct).toFixed(0) + '%'
      };
    }

    var items = [
      { label: 'Net P/L · 30D', value: moneyShort(cur.net), cls: cur.net > 0 ? 'pos' : cur.net < 0 ? 'neg' : '', delta: deltaPct(cur.net, prev.net) },
      { label: 'Win Rate · 30D', value: cur.winRate.toFixed(1) + '%', cls: cur.winRate >= 50 ? 'pos' : 'neg', delta: deltaPct(cur.winRate, prev.winRate) },
      { label: 'Profit Factor', value: isFinite(cur.pf) ? cur.pf.toFixed(2) : '∞', cls: cur.pf >= 1 ? 'pos' : 'neg', delta: deltaPct(cur.pf, prev.pf) },
      { label: 'Avg R · 30D', value: cur.avgR ? ((cur.avgR > 0 ? '+' : '') + cur.avgR.toFixed(2)) : '—', cls: cur.avgR > 0 ? 'pos' : cur.avgR < 0 ? 'neg' : '', delta: deltaPct(cur.avgR, prev.avgR) }
    ];

    var html = '';
    for (var i = 0; i < items.length; i++){
      var it = items[i];
      html += '<div class="sa-kpi">' +
        '<div class="sa-kpi-label">' + esc(it.label) + '</div>' +
        '<div class="sa-kpi-value ' + it.cls + '">' + esc(it.value) + '</div>' +
        '<div class="sa-kpi-delta ' + it.delta.cls + '">' + esc(it.delta.txt) + '</div>' +
      '</div>';
    }
    el.innerHTML = html;
  }

  /* ================= Sparkline Canvas ================= */
  function drawSpark(canvas, values, color){
    if (!canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(rect.width, 10);
    var h = Math.max(rect.height, 10);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!values || values.length < 2){
      ctx.strokeStyle = 'rgba(120,150,200,.15)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, h/2);
      ctx.lineTo(w, h/2);
      ctx.stroke();
      return;
    }

    var pad = 3;
    var pw = w - pad * 2;
    var ph = h - pad * 2;

    var lo = values[0], hi = values[0];
    for (var i = 1; i < values.length; i++){
      if (values[i] < lo) lo = values[i];
      if (values[i] > hi) hi = values[i];
    }
    if (hi === lo){ hi += 1; lo -= 1; }
    var span = hi - lo;

    function xOf(i){ return pad + (i / (values.length - 1)) * pw; }
    function yOf(v){ return pad + (1 - (v - lo) / span) * ph; }

    // Area
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(xOf(0), h - pad);
    for (var a = 0; a < values.length; a++) ctx.lineTo(xOf(a), yOf(values[a]));
    ctx.lineTo(xOf(values.length - 1), h - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    for (var b = 0; b < values.length; b++){
      if (b === 0) ctx.moveTo(xOf(b), yOf(values[b]));
      else ctx.lineTo(xOf(b), yOf(values[b]));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // End dot
    var lastI = values.length - 1;
    ctx.beginPath();
    ctx.arc(xOf(lastI), yOf(values[lastI]), 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /* ================= Spark Cards ================= */
  function renderSparkPL(trades){
    var valEl = $('saSparkVal');
    var trendEl = $('saSparkTrend');
    var canvas = $('saSparkCanvas');
    if (!valEl || !canvas) return;

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var byDay = {};
    for (var i = 29; i >= 0; i--){
      var d = new Date(today); d.setDate(d.getDate() - i);
      byDay[isoDate(d)] = 0;
    }
    for (var j = 0; j < trades.length; j++){
      if (byDay[trades[j].date] !== undefined) byDay[trades[j].date] += pnl(trades[j]);
    }
    var days = Object.keys(byDay).sort();
    var cum = [], run = 0;
    for (var k = 0; k < days.length; k++){
      run += byDay[days[k]];
      cum.push(run);
    }

    var total = cum.length ? cum[cum.length - 1] : 0;
    var firstHalf = cum.slice(0, 15).reduce(function(a,b){return a+b;},0);
    var secondHalf = cum.slice(15).reduce(function(a,b){return a+b;},0);
    var trendCls = 'flat';
    var trendTxt = '—';
    if (Math.abs(secondHalf) > 0.01 || Math.abs(firstHalf) > 0.01){
      if (secondHalf > firstHalf + 1) { trendCls = 'up'; trendTxt = '↑ UP'; }
      else if (secondHalf < firstHalf - 1) { trendCls = 'down'; trendTxt = '↓ DOWN'; }
      else { trendTxt = '≈ FLAT'; }
    }

    valEl.textContent = money(total);
    valEl.className = 'sa-spark-value ' + (total > 0 ? 'pos' : total < 0 ? 'neg' : '');
    if (trendEl){
      trendEl.className = 'sa-spark-trend ' + trendCls;
      trendEl.textContent = trendTxt;
    }
    drawSpark(canvas, cum, total >= 0 ? '#2ee6a6' : '#ff5674');
  }

  function renderSparkRolling(trades){
    var valEl = $('saRollVal');
    var trendEl = $('saRollTrend');
    var canvas = $('saRollCanvas');
    if (!valEl || !canvas) return;

    var sorted = sortAsc(trades);
    var WIN = 20;
    var series = [];
    for (var i = 0; i < sorted.length; i++){
      var start = Math.max(0, i - WIN + 1);
      var wins = 0, closed = 0;
      for (var k = start; k <= i; k++){
        if (sorted[k].result === 'win'){ wins++; closed++; }
        else if (sorted[k].result === 'loss'){ closed++; }
      }
      if (closed >= 5) series.push((wins / closed) * 100);
    }

    var current = series.length ? series[series.length - 1] : 0;
    var prev = series.length > 5 ? series[series.length - 6] : current;
    var diff = current - prev;

    valEl.textContent = current.toFixed(1) + '%';
    valEl.className = 'sa-spark-value ' + (current >= 50 ? 'pos' : current > 0 ? 'neg' : '');

    if (trendEl){
      if (Math.abs(diff) < 0.5){ trendEl.className = 'sa-spark-trend flat'; trendEl.textContent = '≈ FLAT'; }
      else if (diff > 0){ trendEl.className = 'sa-spark-trend up'; trendEl.textContent = '↑ ' + diff.toFixed(0) + '%'; }
      else { trendEl.className = 'sa-spark-trend down'; trendEl.textContent = '↓ ' + Math.abs(diff).toFixed(0) + '%'; }
    }
    drawSpark(canvas, series, current >= 50 ? '#2ee6a6' : '#ffb020');
  }

  /* ================= Streak ================= */
  function renderStreak(trades){
    var wrap = $('saStreak');
    var iconEl = $('saStreakIcon');
    var valEl = $('saStreakVal');
    var subEl = $('saStreakSub');
    if (!wrap || !valEl) return;

    var sorted = sortAsc(trades);
    var current = 0, type = null;
    for (var i = sorted.length - 1; i >= 0; i--){
      var t = sorted[i];
      if (t.result === 'be') continue;
      if (type === null){ type = t.result; current = 1; }
      else if (t.result === type) current++;
      else break;
    }

    var bestW = 0, bestL = 0, w = 0, l = 0;
    for (var j = 0; j < sorted.length; j++){
      var x = sorted[j];
      if (x.result === 'win'){ w++; l = 0; if (w > bestW) bestW = w; }
      else if (x.result === 'loss'){ l++; w = 0; if (l > bestL) bestL = l; }
      else { w = 0; l = 0; }
    }

    if (!type){
      wrap.className = 'sa-streak';
      if (iconEl) iconEl.textContent = '—';
      valEl.textContent = isFa ? 'بدون استریک' : 'No streak';
      if (subEl) subEl.textContent = isFa ? 'اولین معامله رو ثبت کن' : 'Log your first trade';
      return;
    }

    var isWin = type === 'win';
    wrap.className = 'sa-streak ' + (isWin ? 'win' : 'loss');
    if (iconEl) iconEl.textContent = isWin ? '🔥' : '❄️';
    valEl.innerHTML = faNum(current) + ' <span>' + (isFa ? (isWin ? 'برد پشت‌سرهم' : 'باخت پشت‌سرهم') : (isWin ? 'wins in a row' : 'losses in a row')) + '</span>';
    if (subEl){
      subEl.textContent = isWin
        ? (isFa ? ('بهترین رکورد: ' + faNum(bestW) + ' برد') : ('Best: ' + bestW + ' wins'))
        : (isFa ? ('بدترین رکورد: ' + faNum(bestL) + ' باخت') : ('Worst: ' + bestL + ' losses'));
    }
  }

  /* ================= Heatmap ================= */
  function renderHeat(trades){
    var el = $('saHeat');
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
      var val = b.count === 0 ? '—' : moneyShort(b.net);
      html += '<div class="sa-heat-cell ' + cls + '" title="' + DAYS_FULL[m] + '">' +
        '<span class="sa-heat-day">' + DAYS[m] + '</span>' +
        '<span class="sa-heat-val">' + val + '</span>' +
        '<span class="sa-heat-count">' + faNum(b.count) + '</span>' +
      '</div>';
    }
    el.innerHTML = html;
  }

  /* ================= Ribbon ================= */
  function renderRibbon(trades){
    var el = $('saRibbon');
    if (!el) return;

    var sorted = sortAsc(trades).reverse().slice(0, 20);
    if (!sorted.length){
      el.innerHTML = '<div class="sa-ribbon-empty">' + (isFa ? 'داده‌ای موجود نیست' : 'No data') + '</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < sorted.length; i++){
      var t = sorted[i];
      var cls = t.result === 'win' ? 'win' : t.result === 'loss' ? 'loss' : 'be';
      var letter = t.result === 'win' ? 'W' : t.result === 'loss' ? 'L' : 'B';
      var tip = (t.symbol || '') + ' · ' + money(pnl(t)) + ' · ' + t.date;
      html += '<span class="sa-ribbon-dot ' + cls + '" title="' + esc(tip) + '">' + letter + '</span>';
    }
    el.innerHTML = html;
  }

  /* ================= Compare ================= */
  function renderCompare(trades){
    var el = $('saCompare');
    if (!el) return;

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    function statsFor(fromISO, toISO){
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
      return { net: net, count: count, wr: closed ? (wins/closed)*100 : 0 };
    }

    function delta(c, p){
      if (p === 0 && c === 0) return { cls:'flat', txt:'—' };
      if (p === 0) return { cls: c > 0 ? 'up' : 'down', txt: c > 0 ? '↑ NEW' : '↓ NEW' };
      var pct = ((c - p) / Math.abs(p)) * 100;
      if (Math.abs(pct) < 1) return { cls:'flat', txt:'≈ 0%' };
      return {
        cls: pct > 0 ? 'up' : 'down',
        txt: (pct > 0 ? '↑ ' : '↓ ') + Math.abs(pct).toFixed(0) + '%'
      };
    }

    // 7d
    var c7f = new Date(today); c7f.setDate(c7f.getDate() - 6);
    var p7t = new Date(c7f); p7t.setDate(p7t.getDate() - 1);
    var p7f = new Date(p7t); p7f.setDate(p7t.getDate() - 6);
    var cur7 = statsFor(isoDate(c7f), isoDate(today));
    var prev7 = statsFor(isoDate(p7f), isoDate(p7t));

    // 30d
    var c30f = new Date(today); c30f.setDate(c30f.getDate() - 29);
    var p30t = new Date(c30f); p30t.setDate(p30t.getDate() - 1);
    var p30f = new Date(p30t); p30f.setDate(p30t.getDate() - 29);
    var cur30 = statsFor(isoDate(c30f), isoDate(today));
    var prev30 = statsFor(isoDate(p30f), isoDate(p30t));

    var items = [
      { label: 'Net · 7D',  value: moneyShort(cur7.net), cls: cur7.net > 0 ? 'pos' : cur7.net < 0 ? 'neg' : '', delta: delta(cur7.net, prev7.net) },
      { label: 'WR · 7D',   value: cur7.wr.toFixed(1) + '%', cls: cur7.wr >= 50 ? 'pos' : 'neg', delta: delta(cur7.wr, prev7.wr) },
      { label: 'Net · 30D', value: moneyShort(cur30.net), cls: cur30.net > 0 ? 'pos' : cur30.net < 0 ? 'neg' : '', delta: delta(cur30.net, prev30.net) },
      { label: 'WR · 30D',  value: cur30.wr.toFixed(1) + '%', cls: cur30.wr >= 50 ? 'pos' : 'neg', delta: delta(cur30.wr, prev30.wr) }
    ];

    var html = '';
    for (var i = 0; i < items.length; i++){
      var it = items[i];
      html += '<div class="sa-cmp">' +
        '<div class="sa-cmp-label">' + it.label + '</div>' +
        '<div class="sa-cmp-value ' + it.cls + '">' + it.value + '</div>' +
        '<span class="sa-cmp-delta ' + it.delta.cls + '">' + it.delta.txt + '</span>' +
      '</div>';
    }
    el.innerHTML = html;
  }

  /* ================= Insights ================= */
  function renderInsights(trades){
    var el = $('saInsights');
    if (!el) return;

    if (trades.length < 3){
      el.innerHTML = '<div class="sa-insight"><div class="sa-insight-icon">💡</div>' +
        '<div class="sa-insight-body">' +
          '<div class="sa-insight-label">Insight</div>' +
          '<div class="sa-insight-text">' +
            (isFa ? 'حداقل <strong>۳ معامله</strong> ثبت کن تا تحلیل شخصی‌سازی‌شده ببینی.' : 'Log at least <strong>3 trades</strong> for personalized insights.') +
          '</div>' +
        '</div></div>';
      return;
    }

    var insights = [];

    // Best day
    var dayNet = [0,0,0,0,0,0,0], dayCount = [0,0,0,0,0,0,0];
    for (var i = 0; i < trades.length; i++){
      var d = getDow(trades[i].date);
      dayNet[d] += pnl(trades[i]);
      dayCount[d]++;
    }
    var bestDay = -1, bestDayNet = -Infinity;
    for (var a = 0; a < 7; a++){
      if (dayCount[a] >= 2 && dayNet[a] > bestDayNet){ bestDayNet = dayNet[a]; bestDay = a; }
    }
    if (bestDay !== -1 && bestDayNet > 0){
      insights.push({
        ico: '🏆', cls: 'good', label: 'Best Day',
        text: isFa
          ? 'روز <strong>' + DAYS_FULL[bestDay] + '</strong> سودآورترین روزته با <strong>' + money(bestDayNet) + '</strong>'
          : '<strong>' + DAYS_FULL[bestDay] + '</strong> is your best day at <strong>' + money(bestDayNet) + '</strong>'
      });
    }

    // Best strategy
    var st = {};
    for (var j = 0; j < trades.length; j++){
      var key = trades[j].strategy || '—';
      if (!st[key]) st[key] = { net: 0, count: 0 };
      st[key].net += pnl(trades[j]);
      st[key].count++;
    }
    var bestS = null, bestSNet = -Infinity;
    for (var k in st){
      if (st[k].count >= 2 && st[k].net > bestSNet){ bestSNet = st[k].net; bestS = k; }
    }
    if (bestS && bestSNet > 0){
      insights.push({
        ico: '🎯', cls: 'good', label: 'Top Strategy',
        text: isFa
          ? 'استراتژی <strong>' + esc(bestS) + '</strong> بهترین عملکردت رو داره (<strong>' + money(bestSNet) + '</strong>)'
          : '<strong>' + esc(bestS) + '</strong> is your best setup (<strong>' + money(bestSNet) + '</strong>)'
      });
    }

    // Worst emotion
    var emo = {};
    for (var m = 0; m < trades.length; m++){
      var ek = trades[m].emotion || 'calm';
      if (!emo[ek]) emo[ek] = { net: 0, count: 0 };
      emo[ek].net += pnl(trades[m]);
      emo[ek].count++;
    }
    var worstE = null, worstENet = Infinity;
    for (var e in emo){
      if (emo[e].count >= 2 && emo[e].net < worstENet){ worstENet = emo[e].net; worstE = e; }
    }
    if (worstE && worstENet < 0){
      insights.push({
        ico: '⚠️', cls: 'bad', label: 'Emotional Leak',
        text: isFa
          ? 'حالت <strong>' + (EMO[worstE] || worstE) + '</strong> برات ضرر زده (<strong>' + money(worstENet) + '</strong>)'
          : '<strong>' + (EMO[worstE] || worstE) + '</strong> is costing you (<strong>' + money(worstENet) + '</strong>)'
      });
    }

    // Discipline (checklist)
    var discSum = 0, discCnt = 0;
    for (var p = 0; p < trades.length; p++){
      var chk = trades[p].checklist || {};
      var keys = Object.keys(chk);
      if (keys.length === 0) continue;
      var on = 0;
      for (var q = 0; q < keys.length; q++) if (chk[keys[q]]) on++;
      discSum += (on / keys.length) * 100;
      discCnt++;
    }
    if (discCnt >= 2){
      var avg = discSum / discCnt;
      var cls = avg >= 75 ? 'good' : avg >= 50 ? 'warn' : 'bad';
      insights.push({
        ico: '✅', cls: cls, label: 'Discipline',
        text: isFa
          ? 'میانگین پایبندی به چک‌لیست: <strong>' + avg.toFixed(0) + '%</strong>'
          : 'Checklist adherence: <strong>' + avg.toFixed(0) + '%</strong>'
      });
    }

    if (!insights.length){
      insights.push({
        ico: '📊', cls: '', label: 'Insight',
        text: isFa ? 'برای دیدن بینش‌های دقیق‌تر، معاملات بیشتری ثبت کن.' : 'Log more trades to unlock insights.'
      });
    }

    var html = '';
    for (var s = 0; s < insights.length; s++){
      var ins = insights[s];
      html += '<div class="sa-insight ' + ins.cls + '">' +
        '<div class="sa-insight-icon">' + ins.ico + '</div>' +
        '<div class="sa-insight-body">' +
          '<div class="sa-insight-label">' + esc(ins.label) + '</div>' +
          '<div class="sa-insight-text">' + ins.text + '</div>' +
        '</div>' +
      '</div>';
    }
    el.innerHTML = html;
  }

  /* ================= Update timestamp ================= */
  function updateTime(){
    var el = $('saUpdated');
    if (!el) return;
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, '0');
    var mm = String(d.getMinutes()).padStart(2, '0');
    el.textContent = hh + ':' + mm;
  }

  /* ================= Render All ================= */
  var scheduled = false;
  function renderAll(){
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function(){
      scheduled = false;
      try {
        var trades = loadTrades();
        renderDonut(trades);
        renderKpiRow(trades);
        renderSparkPL(trades);
        renderSparkRolling(trades);
        renderStreak(trades);
        renderHeat(trades);
        renderRibbon(trades);
        renderCompare(trades);
        renderInsights(trades);
        updateTime();
      } catch(err){
        console.error('[Storm]', err);
      }
    });
  }

  /* ================= Triggers ================= */
  window.addEventListener('storage', function(e){
    if (e.key === 'po.v4.trades') renderAll();
  });

  document.addEventListener('click', function(e){
    if (e.target && e.target.closest && e.target.closest('.tab[data-view="analysis"]')){
      setTimeout(renderAll, 80);
    }
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
