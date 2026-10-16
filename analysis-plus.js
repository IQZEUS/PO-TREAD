/* PO Analysis+ — extra analytics panel (reads the same local trades; no libs, no network) */
(function () {
  'use strict';
  var K = 'po.v4.trades', WD_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'], WD_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  var fa = function () { return String(document.documentElement.lang || 'fa').slice(0, 2) !== 'en'; };
  var N = function (v) { return Number(v) || 0; };
  var fmt = function (v) { v = Math.round(N(v) * 100) / 100; return (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('en-US'); };
  function load() { try { var a = JSON.parse(localStorage.getItem(K)); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function pnl(t) { var a = Math.abs(N(t.amount)); return t.result === 'win' ? a : t.result === 'loss' ? -a : 0; }
  function range() { var b = document.querySelector('#range-filter .active'); var r = b ? b.getAttribute('data-r') : '30'; return r === 'all' ? 0 : N(r) || 0; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function calc() {
    var all = load().filter(function (t) { return t && typeof t.date === 'string'; }), r = range();
    if (r) { var c = new Date(); c.setHours(0, 0, 0, 0); c.setDate(c.getDate() - (r - 1)); var s = iso(c); all = all.filter(function (t) { return t.date >= s; }); }
    all.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var w = 0, l = 0, gp = 0, gl = 0, net = 0, eq = 0, pk = 0, dd = 0, cur = 0, bw = 0, bl = 0, days = {}, wd = [0, 0, 0, 0, 0, 0, 0];
    all.forEach(function (t) {
      var p = pnl(t); net += p; eq += p; if (eq > pk) pk = eq; if (pk - eq > dd) dd = pk - eq;
      if (t.result === 'win') { w++; gp += p; cur = cur > 0 ? cur + 1 : 1; if (cur > bw) bw = cur; }
      else if (t.result === 'loss') { l++; gl += -p; cur = cur < 0 ? cur - 1 : -1; if (-cur > bl) bl = -cur; }
      days[t.date] = (days[t.date] || 0) + p;
      var q = t.date.split('-'); var g = new Date(+q[0], +q[1] - 1, +q[2]).getDay(); if (g >= 0) wd[g] += p;
    });
    var ks = Object.keys(days), best = null, worst = null;
    ks.forEach(function (k) { if (best === null || days[k] > days[best]) best = k; if (worst === null || days[k] < days[worst]) worst = k; });
    var closed = w + l, wr = closed ? w / closed * 100 : 0, pf = gl > 0 ? gp / gl : (gp > 0 ? 99 : 0);
    var exp = all.length ? net / all.length : 0, avgW = w ? gp / w : 0, avgL = l ? gl / l : 0;
    var score = Math.round(Math.max(0, Math.min(100, wr * 0.35 + Math.min(pf, 3) / 3 * 100 * 0.35 + (net > 0 ? 20 : 0) + (net > 0 && dd < net ? 10 : 0))));
    return { n: all.length, wr: wr, pf: pf, exp: exp, avgW: avgW, avgL: avgL, net: net, dd: dd, cur: cur, bw: bw, bl: bl,
      best: best ? days[best] : 0, worst: worst ? days[worst] : 0, wd: wd, score: score };
  }
  function tile(lbl, val, cls) { return '<div class="pl-tile ' + (cls || '') + '"><span class="pl-l">' + lbl + '</span><span class="pl-v">' + val + '</span></div>'; }
  function render() {
    var host = document.getElementById('plus-host'); if (!host) return;
    var s = calc(), F = fa();
    if (!s.n) { host.innerHTML = ''; return; }
    var L = F ? { t: '⚡ تحلیل پیشرفته', wr: 'وین‌ریت', pf: 'پروفیت فکتور', ex: 'میانگین هر معامله', aw: 'میانگین سود', al: 'میانگین ضرر', bd: 'بهترین روز', wd: 'بدترین روز', st: 'استریک فعلی', bs: 'بهترین سری برد', dd: 'بیشترین افت', sc: 'امتیاز عملکرد', wk: 'عملکرد روزهای هفته', w: 'برد', ls: 'باخت' }
      : { t: '⚡ Advanced analysis', wr: 'Win rate', pf: 'Profit factor', ex: 'Expectancy', aw: 'Avg win', al: 'Avg loss', bd: 'Best day', wd: 'Worst day', st: 'Current streak', bs: 'Best win streak', dd: 'Max drawdown', sc: 'Performance score', wk: 'Weekday performance', w: 'W', ls: 'L' };
    var R = 52, C = 2 * Math.PI * R, off = C * (1 - Math.min(100, s.wr) / 100);
    var ring = '<svg viewBox="0 0 130 130" class="pl-ring" aria-hidden="true"><defs><linearGradient id="plg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2ee6a6"/><stop offset="1" stop-color="#5b8cff"/></linearGradient></defs>' +
      '<circle cx="65" cy="65" r="' + R + '" fill="none" stroke="rgba(120,150,200,.18)" stroke-width="12"/>' +
      '<circle cx="65" cy="65" r="' + R + '" fill="none" stroke="url(#plg)" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 65 65)"/>' +
      '<text x="65" y="62" text-anchor="middle" class="pl-ring-v">' + Math.round(s.wr) + '%</text><text x="65" y="82" text-anchor="middle" class="pl-ring-l">' + L.wr + '</text></svg>';
    var mx = Math.max.apply(null, s.wd.map(Math.abs).concat([1])), order = [6, 0, 1, 2, 3, 4, 5], names = F ? WD_FA : WD_EN;
    var bars = order.map(function (g) { var v = s.wd[g], h = Math.max(4, Math.abs(v) / mx * 70); return '<div class="pl-col"><div class="pl-bar ' + (v >= 0 ? 'up' : 'dn') + '" style="height:' + h.toFixed(0) + 'px" title="' + fmt(v) + '"></div><span>' + names[g] + '</span></div>'; }).join('');
    var stk = s.cur > 0 ? s.cur + ' ' + L.w : s.cur < 0 ? (-s.cur) + ' ' + L.ls : '—';
    host.innerHTML = '<div class="card pl-card"><div class="card-head"><h2>' + L.t + '</h2><span class="pl-score" title="' + L.sc + '">' + s.score + '<small>/100</small></span></div>' +
      '<div class="pl-top">' + ring + '<div class="pl-tiles">' +
      tile(L.pf, s.pf >= 99 ? '∞' : s.pf.toFixed(2), s.pf >= 1.5 ? 'pos' : s.pf < 1 ? 'neg' : '') + tile(L.ex, fmt(s.exp), s.exp >= 0 ? 'pos' : 'neg') +
      tile(L.aw, fmt(s.avgW), 'pos') + tile(L.al, fmt(-s.avgL), 'neg') + tile(L.bd, fmt(s.best), 'pos') + tile(L.wd, fmt(s.worst), 'neg') +
      tile(L.st, stk, s.cur >= 0 ? 'pos' : 'neg') + tile(L.dd, fmt(-s.dd), 'neg') + '</div></div>' +
      '<div class="pl-wk"><div class="pl-wk-t">' + L.wk + '</div><div class="pl-cols">' + bars + '</div></div></div>';
  }
  window.POPlus = { render: function () { try { render(); } catch (e) {} } };
})();
