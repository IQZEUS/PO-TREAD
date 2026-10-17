/* PO Analysis+ v2 — advanced analytics panels (static SVG/HTML, no libs, no network, no animation loops) */
(function () {
  'use strict';
  var K = 'po.v4.trades', WD_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'], WD_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  var fa = function () { return String(document.documentElement.lang || 'fa').slice(0, 2) !== 'en'; };
  var N = function (v) { return Number(v) || 0; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fmt = function (v) { v = Math.round(N(v) * 100) / 100; return (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('en-US'); };
  var kfmt = function (v) { var a = Math.abs(v), s = a >= 1000 ? (a / 1000).toFixed(a >= 10000 ? 0 : 1) + 'k' : String(Math.round(a)); return (v < 0 ? '-' : '') + s; };
  function load() { try { var a = JSON.parse(localStorage.getItem(K)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function pnl(t) { var a = Math.abs(N(t.amount)); return t.result === 'win' ? a : t.result === 'loss' ? -a : 0; }
  function range() { var b = document.querySelector('#range-filter .active'); var r = b ? b.getAttribute('data-r') : '30'; return r === 'all' ? 0 : N(r) || 0; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function sorted() {
    var all = load().filter(function (t) { return t && typeof t.date === 'string'; }), r = range();
    if (r) { var c = new Date(); c.setHours(0, 0, 0, 0); c.setDate(c.getDate() - (r - 1)); var s = iso(c); all = all.filter(function (t) { return t.date >= s; }); }
    return all.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (N(a.createdAt) - N(b.createdAt)); });
  }
  function calc(all) {
    var w = 0, l = 0, gp = 0, gl = 0, net = 0, eq = 0, pk = 0, dd = 0, cur = 0, bw = 0, days = {}, wd = [0, 0, 0, 0, 0, 0, 0];
    all.forEach(function (t) {
      var p = pnl(t); net += p; eq += p; if (eq > pk) pk = eq; if (pk - eq > dd) dd = pk - eq;
      if (t.result === 'win') { w++; gp += p; cur = cur > 0 ? cur + 1 : 1; if (cur > bw) bw = cur; }
      else if (t.result === 'loss') { l++; gl += -p; cur = cur < 0 ? cur - 1 : -1; }
      days[t.date] = (days[t.date] || 0) + p;
      var q = t.date.split('-'); var g = new Date(+q[0], +q[1] - 1, +q[2]).getDay(); if (g >= 0) wd[g] += p;
    });
    var ks = Object.keys(days), best = 0, worst = 0;
    ks.forEach(function (k) { if (days[k] > best) best = days[k]; if (days[k] < worst) worst = days[k]; });
    var closed = w + l, wr = closed ? w / closed * 100 : 0, pf = gl > 0 ? gp / gl : (gp > 0 ? 99 : 0);
    var score = Math.round(Math.max(0, Math.min(100, wr * 0.35 + Math.min(pf, 3) / 3 * 100 * 0.35 + (net > 0 ? 20 : 0) + (net > 0 && dd < net ? 10 : 0))));
    return { n: all.length, wr: wr, pf: pf, exp: all.length ? net / all.length : 0, avgW: w ? gp / w : 0, avgL: l ? gl / l : 0, net: net, dd: dd, cur: cur, bw: bw, best: best, worst: worst, wd: wd, score: score };
  }
  function tile(lbl, val, cls) { return '<div class="pl-tile ' + (cls || '') + '"><span class="pl-l">' + lbl + '</span><span class="pl-v">' + val + '</span></div>'; }
  function card(title, sub, body, cls) { return '<div class="card pl-card2 ' + (cls || '') + '"><div class="card-head"><h2>' + title + '</h2><span class="pl-sub">' + (sub || '') + '</span></div>' + body + '</div>'; }

  /* ---- 1. equity + drawdown (underwater) ---- */
  function equitySVG(all, L) {
    var eq = 0, pk = 0, E = [], D = [];
    all.forEach(function (t) { eq += pnl(t); if (eq > pk) pk = eq; E.push(eq); D.push(eq - pk); });
    var n = E.length; if (n < 2) return '';
    var step = Math.max(1, Math.ceil(n / 100)), pe = [], pd = [];
    for (var i = 0; i < n; i += step) { pe.push(E[i]); pd.push(D[i]); }
    if ((n - 1) % step) { pe.push(E[n - 1]); pd.push(D[n - 1]); }
    var m = pe.length, W = 340, pad = 10, eTop = 10, eH = 112, dTop = 150, dH = 54, H = 220;
    var mn = Math.min(0, Math.min.apply(null, pe)), mx = Math.max(0, Math.max.apply(null, pe)); if (mx === mn) mx = mn + 1;
    var minD = Math.min(-1, Math.min.apply(null, pd));
    var X = function (i) { return (pad + i * (W - 2 * pad) / (m - 1)).toFixed(1); };
    var YE = function (v) { return (eTop + (mx - v) / (mx - mn) * eH).toFixed(1); };
    var YD = function (v) { return (dTop + v / minD * dH).toFixed(1); };
    var line = '', dd = 'M' + X(0) + ',' + dTop;
    pe.forEach(function (v, i) { line += (i ? 'L' : 'M') + X(i) + ',' + YE(v); });
    pd.forEach(function (v, i) { dd += 'L' + X(i) + ',' + YD(v); });
    dd += 'L' + X(m - 1) + ',' + dTop + 'Z';
    var area = line + 'L' + X(m - 1) + ',' + YE(0) + 'L' + X(0) + ',' + YE(0) + 'Z';
    var z = YE(0), last = pe[m - 1], up = last >= 0;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pl-svg" role="img" aria-label="equity and drawdown"><defs>' +
      '<linearGradient id="pgE" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ee6a6" stop-opacity=".45"/><stop offset="1" stop-color="#2ee6a6" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="pgL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5b8cff"/><stop offset="1" stop-color="#2ee6a6"/></linearGradient>' +
      '<linearGradient id="pgD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5674" stop-opacity=".05"/><stop offset="1" stop-color="#ff5674" stop-opacity=".6"/></linearGradient></defs>' +
      '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + z + '" y2="' + z + '" stroke="rgba(150,170,220,.28)" stroke-dasharray="4 4"/>' +
      '<path d="' + area + '" fill="url(#pgE)"/><path d="' + line + '" fill="none" stroke="url(#pgL)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>' +
      '<circle cx="' + X(m - 1) + '" cy="' + YE(last) + '" r="4.5" fill="' + (up ? '#2ee6a6' : '#ff5674') + '" stroke="#05070f" stroke-width="2"/>' +
      '<text x="' + pad + '" y="' + (eTop + 2) + '" class="pl-t">' + kfmt(mx) + '</text><text x="' + pad + '" y="' + (eTop + eH + 11) + '" class="pl-t">' + kfmt(mn) + '</text>' +
      '<text x="' + (W - pad) + '" y="' + (dTop - 7) + '" text-anchor="end" class="pl-t">' + L.dd + '</text>' +
      '<path d="' + dd + '" fill="url(#pgD)" stroke="#ff5674" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<text x="' + (W - pad) + '" y="' + (dTop + dH + 14) + '" text-anchor="end" class="pl-t neg">' + kfmt(minD) + '</text></svg>';
    return card(L.eq, fmt(last), svg);
  }
  /* ---- 2. form strip: last 30 trades ---- */
  function formStrip(all, L) {
    var last = all.slice(-30); if (last.length < 2) return '';
    var w = 0, l = 0, cells = last.map(function (t) {
      var p = pnl(t); if (t.result === 'win') w++; else if (t.result === 'loss') l++;
      return '<i class="pl-cell ' + (t.result === 'win' ? 'win' : t.result === 'loss' ? 'loss' : 'be') + '" title="' + esc(fmt(p)) + '"></i>';
    }).join('');
    return card(L.form, w + L.w + ' \u00B7 ' + l + L.ls, '<div class="pl-strip">' + cells + '</div>');
  }
  /* ---- 3. monthly bars ---- */
  function monthly(all, L) {
    var mm = {}; all.forEach(function (t) { var k = t.date.slice(0, 7); mm[k] = (mm[k] || 0) + pnl(t); });
    var ks = Object.keys(mm).sort().slice(-8); if (ks.length < 2) return '';
    var vals = ks.map(function (k) { return mm[k]; }), pos = Math.max(0, Math.max.apply(null, vals)), neg = Math.max(0, -Math.min.apply(null, vals)), tot = (pos + neg) || 1;
    var W = 340, H = 150, top = 22, ph = 100, zero = top + pos / tot * ph, bw = Math.min(30, (W - 20) / ks.length - 8), gap = (W - 20 - bw * ks.length) / (ks.length - 1 || 1);
    var bars = ks.map(function (k, i) {
      var v = mm[k], h = Math.max(3, Math.abs(v) / tot * ph), x = 10 + i * (bw + gap), y = v >= 0 ? zero - h : zero;
      return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="6" fill="' + (v >= 0 ? 'url(#pmU)' : 'url(#pmD)') + '"/>' +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (v >= 0 ? y - 5 : y + h + 12).toFixed(1) + '" text-anchor="middle" class="pl-t ' + (v >= 0 ? 'pos' : 'neg') + '">' + kfmt(v) + '</text>' +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 4) + '" text-anchor="middle" class="pl-t">' + esc(k.slice(5)) + '</text>';
    }).join('');
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pl-svg" role="img" aria-label="monthly"><defs>' +
      '<linearGradient id="pmU" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ee6a6"/><stop offset="1" stop-color="#0fa876"/></linearGradient>' +
      '<linearGradient id="pmD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5674"/><stop offset="1" stop-color="#c23352"/></linearGradient></defs>' +
      '<line x1="6" x2="' + (W - 6) + '" y1="' + zero.toFixed(1) + '" y2="' + zero.toFixed(1) + '" stroke="rgba(150,170,220,.3)"/>' + bars + '</svg>';
    return card(L.mo, '', svg);
  }
  /* ---- 4. P/L distribution ---- */
  function histogram(all, L) {
    var v = all.map(pnl).filter(function (x) { return x !== 0; }); if (v.length < 5) return '';
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), B = 10, bs = (mx - mn) / B || 1, c = []; for (var i = 0; i < B; i++) c.push(0);
    v.forEach(function (x) { var k = Math.min(B - 1, Math.floor((x - mn) / bs)); c[k]++; });
    var top = Math.max.apply(null, c), W = 340, H = 140, bw = (W - 20) / B - 4;
    var bars = c.map(function (n, i) {
      var h = n / top * 96, x = 10 + i * (bw + 4), mid = mn + (i + 0.5) * bs;
      return '<rect x="' + x.toFixed(1) + '" y="' + (112 - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(n ? 3 : 1, h).toFixed(1) + '" rx="5" fill="' + (mid >= 0 ? '#2ee6a6' : '#ff5674') + '" opacity="' + (n ? 0.9 : 0.25) + '"/>' +
        (n ? '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (108 - h).toFixed(1) + '" text-anchor="middle" class="pl-t">' + n + '</text>' : '');
    }).join('');
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="pl-svg" role="img" aria-label="distribution">' + bars +
      '<text x="10" y="132" class="pl-t neg">' + kfmt(mn) + '</text><text x="' + (W - 10) + '" y="132" text-anchor="end" class="pl-t pos">' + kfmt(mx) + '</text></svg>';
    return card(L.dist, v.length + ' ' + L.tr, svg);
  }
  /* ---- 5. strategy bars ---- */
  function strategies(all, L) {
    var m = {}; all.forEach(function (t) { var k = String(t.strategy || '').trim().slice(0, 40); if (!k) return; var o = m[k] || (m[k] = { n: 0, w: 0, c: 0, net: 0 }); o.n++; o.net += pnl(t); if (t.result === 'win') o.w++; if (t.result === 'win' || t.result === 'loss') o.c++; });
    var ks = Object.keys(m).sort(function (a, b) { return Math.abs(m[b].net) - Math.abs(m[a].net); }).slice(0, 6); if (!ks.length) return '';
    var mx = Math.max.apply(null, ks.map(function (k) { return Math.abs(m[k].net); })) || 1;
    var rows = ks.map(function (k) {
      var o = m[k], pct = Math.max(4, Math.abs(o.net) / mx * 100), wr = o.c ? Math.round(o.w / o.c * 100) : 0;
      return '<div class="pl-srow"><div class="pl-sh"><b>' + esc(k) + '</b><span class="' + (o.net >= 0 ? 'pos' : 'neg') + '">' + esc(fmt(o.net)) + '</span></div>' +
        '<div class="pl-sbar"><i class="' + (o.net >= 0 ? 'up' : 'dn') + '" style="width:' + pct.toFixed(0) + '%"></i></div><small>' + o.n + ' ' + L.tr + ' \u00B7 ' + L.wr + ' ' + wr + '%</small></div>';
    }).join('');
    return card(L.st, '', '<div class="pl-srows">' + rows + '</div>');
  }

  function render() {
    var host = document.getElementById('plus-host'); if (!host) return;
    var all = sorted(), s = calc(all), F = fa();
    if (!s.n) { host.innerHTML = ''; return; }
    var L = F ? { t: '⚡ تحلیل پیشرفته', wr: 'وین‌ریت', pf: 'پروفیت فکتور', ex: 'میانگین هر معامله', aw: 'میانگین سود', al: 'میانگین ضرر', bd: 'بهترین روز', wd: 'بدترین روز', st: 'استریک فعلی', dd: 'بیشترین افت', sc: 'امتیاز عملکرد', wk: 'عملکرد روزهای هفته', w: ' برد', ls: ' باخت',
      eq: '📈 سرمایه و افت (Underwater)', form: '🔥 فرم ۳۰ معامله آخر', mo: '🗓️ عملکرد ماهانه', dist: '📊 توزیع سود و ضرر', tr: 'معامله', strat: '🧠 عملکرد استراتژی‌ها' }
      : { t: '⚡ Advanced analysis', wr: 'Win rate', pf: 'Profit factor', ex: 'Expectancy', aw: 'Avg win', al: 'Avg loss', bd: 'Best day', wd: 'Worst day', st: 'Current streak', dd: 'Max drawdown', sc: 'Performance score', wk: 'Weekday performance', w: 'W', ls: 'L',
      eq: '📈 Equity & drawdown', form: '🔥 Last 30 trades form', mo: '🗓️ Monthly performance', dist: '📊 P/L distribution', tr: 'trades', strat: '🧠 Strategy performance' };
    L.st2 = L.strat;
    var R = 52, C = 2 * Math.PI * R, off = C * (1 - Math.min(100, s.wr) / 100);
    var ring = '<svg viewBox="0 0 130 130" class="pl-ring" aria-hidden="true"><defs><linearGradient id="plg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2ee6a6"/><stop offset="1" stop-color="#5b8cff"/></linearGradient></defs>' +
      '<circle cx="65" cy="65" r="' + R + '" fill="none" stroke="rgba(120,150,200,.18)" stroke-width="12"/>' +
      '<circle cx="65" cy="65" r="' + R + '" fill="none" stroke="url(#plg)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 65 65)"/>' +
      '<text x="65" y="62" text-anchor="middle" class="pl-ring-v">' + Math.round(s.wr) + '%</text><text x="65" y="82" text-anchor="middle" class="pl-ring-l">' + L.wr + '</text></svg>';
    var mx = Math.max.apply(null, s.wd.map(Math.abs).concat([1])), order = [6, 0, 1, 2, 3, 4, 5], names = F ? WD_FA : WD_EN;
    var bars = order.map(function (g) { var v = s.wd[g], h = Math.max(4, Math.abs(v) / mx * 70); return '<div class="pl-col"><div class="pl-bar ' + (v >= 0 ? 'up' : 'dn') + '" style="height:' + h.toFixed(0) + 'px" title="' + esc(fmt(v)) + '"></div><span>' + names[g] + '</span></div>'; }).join('');
    var stk = s.cur > 0 ? s.cur + L.w : s.cur < 0 ? (-s.cur) + L.ls : '\u2014';
    var main = '<div class="card pl-card"><div class="card-head"><h2>' + L.t + '</h2><span class="pl-score" title="' + L.sc + '">' + s.score + '<small>/100</small></span></div>' +
      '<div class="pl-top">' + ring + '<div class="pl-tiles">' +
      tile(L.pf, s.pf >= 99 ? '\u221E' : s.pf.toFixed(2), s.pf >= 1.5 ? 'pos' : s.pf < 1 ? 'neg' : '') + tile(L.ex, fmt(s.exp), s.exp >= 0 ? 'pos' : 'neg') +
      tile(L.aw, fmt(s.avgW), 'pos') + tile(L.al, fmt(-s.avgL), 'neg') + tile(L.bd, fmt(s.best), 'pos') + tile(L.wd, fmt(s.worst), 'neg') +
      tile(L.st, stk, s.cur >= 0 ? 'pos' : 'neg') + tile(L.dd, fmt(-s.dd), 'neg') + '</div></div>' +
      '<div class="pl-wk"><div class="pl-wk-t">' + L.wk + '</div><div class="pl-cols">' + bars + '</div></div></div>';
    var extra = equitySVG(all, L) + formStrip(all, L) + monthly(all, L) + histogram(all, L) + strategies(all, L);
    host.innerHTML = main + (extra ? '<div class="pl-grid2">' + extra + '</div>' : '');
  }
  window.POPlus = { render: function () { try { render(); } catch (e) {} } };
})();
